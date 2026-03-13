"""
接続テストAPI (/api/test-connection)
4ステップの接続検証を同期的に実行し、各ステップの結果をまとめて返す。

ステップ:
  1. AWS CLI チェック
  2. SSO ログイン
  3. Bastion (SSM管理インスタンス) 解決
  4. RDS 到達確認 (ポートフォワード → ソケット接続テスト)
"""

import socket
import time
from fastapi import APIRouter, HTTPException

from ..models import (
    TestConnectionRequest,
    TestConnectionResponse,
    TestStep,
)
from ..config.config_manager import ConfigManager
from ..core.aws_db_tunnel import AwsDbTunnelManager
from ..log_store import LogStore

router = APIRouter(prefix="/api/test-connection", tags=["test"])


def _cm() -> ConfigManager:
    return router.config_manager  # type: ignore[attr-defined]

def _log() -> LogStore:
    return router.log_store  # type: ignore[attr-defined]


@router.post("", response_model=TestConnectionResponse)
def test_connection(body: TestConnectionRequest):
    """
    接続テストを実行。
    全ステップを順次実行し、エラーが出たらそこで止めて結果を返す。
    """
    try:
        return _run_test(body)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _run_test(body: TestConnectionRequest):
    cm = _cm()
    log = _log()
    config = cm.get_raw_config()

    env_name = body.env
    db_id = body.db_id

    steps: list[TestStep] = []

    # 設定の存在チェック
    env_cfg = config.get("Envs", {}).get(env_name)
    if not env_cfg:
        raise HTTPException(status_code=404, detail=f"環境 '{env_name}' が見つかりません")

    conn_cfg = config.get("Connections", {}).get(env_name, {}).get(db_id)
    if not conn_cfg:
        raise HTTPException(status_code=404, detail=f"接続情報 '{env_name}/{db_id}' が見つかりません")

    # public環境はSSM不要
    is_public = env_cfg.get("AccessType") == "public"

    tunnel_mgr = AwsDbTunnelManager(
        config_path=cm.config_path,
        logger=log.as_logger(),
    )

    # ----------------------------------------------------------------
    # Step 1: AWS CLI チェック
    # ----------------------------------------------------------------
    log.info(f"[テスト {env_name}/{db_id}] Step 1: AWS CLIチェック")
    try:
        tunnel_mgr.assert_aws_cli()
        steps.append(TestStep(step=1, name="AWS CLI", status="success", message="AWS CLI v2 が利用可能です"))
    except Exception as e:
        steps.append(TestStep(step=1, name="AWS CLI", status="error", message=str(e)))
        log.error(f"[テスト {env_name}/{db_id}] Step 1 失敗: {e}")
        return TestConnectionResponse(success=False, steps=steps)

    # public 環境は Step 2, 3 をスキップ
    if is_public:
        steps.append(TestStep(step=2, name="SSO ログイン", status="skipped", message="public環境のためスキップ"))
        steps.append(TestStep(step=3, name="Bastion 解決", status="skipped", message="public環境のためスキップ"))
    else:
        # ----------------------------------------------------------------
        # Step 2: SSO ログイン
        # ----------------------------------------------------------------
        log.info(f"[テスト {env_name}/{db_id}] Step 2: SSOログイン")
        try:
            profile = env_cfg["Profile"]
            tunnel_mgr.ensure_sso_profile(profile=profile, env_name=env_name)

            if not tunnel_mgr.ensure_logged_in(profile):
                steps.append(TestStep(step=2, name="SSO ログイン", status="error", message="SSOログインに失敗しました"))
                return TestConnectionResponse(success=False, steps=steps)

            steps.append(TestStep(step=2, name="SSO ログイン", status="success", message="SSOセッションが有効です"))
        except Exception as e:
            steps.append(TestStep(step=2, name="SSO ログイン", status="error", message=str(e)))
            log.error(f"[テスト {env_name}/{db_id}] Step 2 失敗: {e}")
            return TestConnectionResponse(success=False, steps=steps)

        # ----------------------------------------------------------------
        # Step 3: Bastion 解決
        # ----------------------------------------------------------------
        log.info(f"[テスト {env_name}/{db_id}] Step 3: Bastion解決")
        try:
            profile = env_cfg["Profile"]
            bastion_id = tunnel_mgr.resolve_bastion_instance_id(profile)
            steps.append(TestStep(
                step=3, name="Bastion 解決", status="success",
                message=f"Bastionインスタンス: {bastion_id}",
            ))
        except Exception as e:
            steps.append(TestStep(step=3, name="Bastion 解決", status="error", message=str(e)))
            log.error(f"[テスト {env_name}/{db_id}] Step 3 失敗: {e}")
            return TestConnectionResponse(success=False, steps=steps)

    # ----------------------------------------------------------------
    # Step 4: RDS 到達確認
    # ----------------------------------------------------------------
    log.info(f"[テスト {env_name}/{db_id}] Step 4: RDS到達確認")

    host = conn_cfg.get("host", "")
    if not host:
        steps.append(TestStep(step=4, name="RDS 到達確認", status="error", message="ホスト名が未設定です"))
        return TestConnectionResponse(success=False, steps=steps)

    if is_public:
        # public環境: 直接ソケット接続テスト
        remote_port = config.get("Global", {}).get("DbPort", 5432)
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((host, remote_port))
            sock.close()
            steps.append(TestStep(
                step=4, name="RDS 到達確認", status="success",
                message=f"{host}:{remote_port} に接続できました",
            ))
        except Exception as e:
            steps.append(TestStep(
                step=4, name="RDS 到達確認", status="error",
                message=f"{host}:{remote_port} への接続に失敗: {e}",
            ))
            log.error(f"[テスト {env_name}/{db_id}] Step 4 失敗: {e}")
            return TestConnectionResponse(success=False, steps=steps)
    else:
        # private環境: 一時的にポートフォワードして接続テスト
        try:
            profile = env_cfg["Profile"]
            remote_port = config.get("Global", {}).get("DbPort", 5432)

            # テスト用の一時ポートを確保
            test_port = tunnel_mgr.find_free_local_port(start_port=19000, max_port=19100)

            # 一時セッションを開始
            proc = tunnel_mgr.start_session_async(
                profile=profile,
                bastion_id=bastion_id,  # Step 3 で取得済み
                host_name=host,
                local_port=test_port,
                remote_port=remote_port,
            )

            # ポートが LISTEN 状態になるまで待機 (最大10秒)
            connected = False
            for _ in range(20):
                time.sleep(0.5)
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    sock.connect(("127.0.0.1", test_port))
                    sock.close()
                    connected = True
                    break
                except Exception:
                    continue

            # テスト用セッションを終了
            try:
                proc.terminate()
                proc.wait(timeout=3)
            except Exception:
                pass

            if connected:
                steps.append(TestStep(
                    step=4, name="RDS 到達確認", status="success",
                    message=f"SSM経由で {host}:{remote_port} に到達できました (テストポート: {test_port})",
                ))
            else:
                steps.append(TestStep(
                    step=4, name="RDS 到達確認", status="error",
                    message=f"SSM経由で {host}:{remote_port} に到達できませんでした (10秒タイムアウト)",
                ))
                log.error(f"[テスト {env_name}/{db_id}] Step 4 タイムアウト")
                return TestConnectionResponse(success=False, steps=steps)

        except Exception as e:
            steps.append(TestStep(step=4, name="RDS 到達確認", status="error", message=str(e)))
            log.error(f"[テスト {env_name}/{db_id}] Step 4 失敗: {e}")
            return TestConnectionResponse(success=False, steps=steps)

    log.info(f"[テスト {env_name}/{db_id}] 全ステップ成功")
    return TestConnectionResponse(success=True, steps=steps)
