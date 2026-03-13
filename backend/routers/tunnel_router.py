"""
トンネル管理API (/api/tunnels)
SSMポートフォワードの接続・切断・状態確認を行う。
"""

from fastapi import APIRouter, HTTPException

from ..models import (
    ConnectRequest,
    ConnectResponse,
    DisconnectResponse,
    DisconnectAllResponse,
    TunnelStatus,
    TunnelListResponse,
)
from ..config.config_manager import ConfigManager
from ..core.aws_db_tunnel import AwsDbTunnelManager, AwsDbTunnelConfig
from ..core.connection_manager import ConnectionManager
from ..core.process_manager import ProcessManager
from ..core.port_validator import PortValidator
from ..log_store import LogStore

router = APIRouter(prefix="/api/tunnels", tags=["tunnels"])


def _cm() -> ConfigManager:
    return router.config_manager  # type: ignore[attr-defined]

def _conn_mgr() -> ConnectionManager:
    return router.connection_manager  # type: ignore[attr-defined]

def _proc_mgr() -> ProcessManager:
    return router.process_manager  # type: ignore[attr-defined]

def _port_val() -> PortValidator:
    return router.port_validator  # type: ignore[attr-defined]

def _log() -> LogStore:
    return router.log_store  # type: ignore[attr-defined]


# ============================================================
# 状態一覧
# ============================================================

@router.get("", response_model=TunnelListResponse)
def list_tunnels():
    """
    全接続の状態を返す。
    - 設定ファイルから全環境×全DBインスタンスを列挙
    - connection_state.json とプロセス生存チェックで connected を判定
    """
    cm = _cm()
    conn_mgr = _conn_mgr()
    proc_mgr = _proc_mgr()
    port_val = _port_val()

    config = cm.get_raw_config()
    state = conn_mgr.read_connection_state()
    state_conns = state.get("connections", {})

    tunnels = []

    for env_name, instances in config.get("DbInstances", {}).items():
        env_conns = config.get("Connections", {}).get(env_name, {})

        for inst in instances:
            db_id = inst["id"]
            conn_cfg = env_conns.get(db_id, {})
            state_key = f"{env_name}/{db_id}"
            state_entry = state_conns.get(state_key, {})

            pid = state_entry.get("pid")
            local_port = state_entry.get("port") or conn_cfg.get("local_port")

            # 接続判定: PIDが生きている OR ポートがリッスン中
            connected = False
            if pid and proc_mgr.is_process_alive(pid):
                connected = True
            elif local_port and port_val.test_port_listening(local_port):
                connected = True

            tunnels.append(TunnelStatus(
                env=env_name,
                db_id=db_id,
                display_name=inst.get("display_name", db_id),
                category=inst.get("category", "tenant"),
                host=conn_cfg.get("host", ""),
                local_port=local_port,
                connected=connected,
                pid=pid if connected else None,
            ))

    return TunnelListResponse(tunnels=tunnels)


# ============================================================
# 接続
# ============================================================

@router.post("/{env_name}/{db_id}/connect", response_model=ConnectResponse)
def connect_tunnel(env_name: str, db_id: str, body: ConnectRequest = ConnectRequest()):
    """
    SSMポートフォワードを開始する。
    1. aws cli チェック
    2. SSOプロファイル作成 & ログイン
    3. Bastion解決
    4. start-session 非同期起動
    """
    cm = _cm()
    conn_mgr = _conn_mgr()
    log = _log()

    config = cm.get_raw_config()

    # 設定存在チェック
    if env_name not in config.get("Envs", {}):
        raise HTTPException(status_code=404, detail=f"環境 '{env_name}' が見つかりません")

    conn_cfg = config.get("Connections", {}).get(env_name, {}).get(db_id)
    if not conn_cfg:
        raise HTTPException(status_code=404, detail=f"接続情報 '{env_name}/{db_id}' が見つかりません")

    # 既に接続中かチェック
    if conn_mgr.is_connected(env_name, db_id):
        raise HTTPException(status_code=409, detail="既に接続中です")

    # AwsDbTunnelManager を使ってトンネル準備
    tunnel_mgr = AwsDbTunnelManager(
        config_path=cm.config_path,
        logger=log.as_logger(),
    )

    try:
        log.info(f"[{env_name}/{db_id}] トンネル接続を開始します…")

        profile, bastion_id, host_name, remote_port = tunnel_mgr.prepare_tunnel(env_name, db_id)

        # ローカルポート決定
        local_port = body.local_port or conn_cfg.get("local_port")
        if not local_port:
            local_port = tunnel_mgr.find_free_local_port()
            log.info(f"[{env_name}/{db_id}] 自動割当ポート: {local_port}")

        # 非同期でSSMセッション開始
        proc = tunnel_mgr.start_session_async(
            profile=profile,
            bastion_id=bastion_id,
            host_name=host_name,
            local_port=local_port,
            remote_port=remote_port,
        )

        # 接続状態を記録
        password = conn_cfg.get("password", "")
        conn_mgr.add_connection(
            env=env_name,
            db_id=db_id,
            proc=proc,
            local_port=local_port,
            host=host_name,
            password=password,
        )

        log.info(f"[{env_name}/{db_id}] 接続開始 (PID={proc.pid}, port={local_port})")

        return ConnectResponse(
            env=env_name,
            db_id=db_id,
            local_port=local_port,
            pid=proc.pid,
            message=f"トンネルを開始しました (port={local_port})",
        )

    except Exception as e:
        log.error(f"[{env_name}/{db_id}] 接続エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 切断
# ============================================================

@router.post("/{env_name}/{db_id}/disconnect", response_model=DisconnectResponse)
def disconnect_tunnel(env_name: str, db_id: str):
    """トンネルを切断する。"""
    conn_mgr = _conn_mgr()
    proc_mgr = _proc_mgr()
    log = _log()

    conn = conn_mgr.get_connection(env_name, db_id)
    if not conn:
        raise HTTPException(status_code=404, detail="接続が見つかりません")

    proc, local_port, host, password = conn

    # プロセスを終了
    if proc and proc.pid:
        proc_mgr.kill_process(proc.pid)

    conn_mgr.remove_connection(env_name, db_id)
    log.info(f"[{env_name}/{db_id}] 切断しました")

    return DisconnectResponse(
        env=env_name,
        db_id=db_id,
        message="切断しました",
    )


@router.post("/disconnect-all", response_model=DisconnectAllResponse)
def disconnect_all():
    """全トンネルを切断する。"""
    conn_mgr = _conn_mgr()
    proc_mgr = _proc_mgr()
    log = _log()

    all_conns = dict(conn_mgr.get_all_connections())
    count = 0

    for (env, db_id), (proc, local_port, host, password) in all_conns.items():
        if proc and proc.pid:
            proc_mgr.kill_process(proc.pid)
        conn_mgr.remove_connection(env, db_id)
        count += 1

    log.info(f"全切断完了: {count}件")
    return DisconnectAllResponse(
        disconnected=count,
        message=f"{count}件の接続を切断しました",
    )
