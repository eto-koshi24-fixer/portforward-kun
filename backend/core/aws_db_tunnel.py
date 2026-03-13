# aws_db_tunnel.py
import json
import os
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

class AwsDbTunnelConfig:
    def __init__(self, path: str):
        with open(path, encoding="utf-8") as f:
            self.config = json.load(f)

    @property
    def global_cfg(self):
        return self.config["Global"]

    @property
    def envs(self):
        return self.config["Envs"]

    @property
    def db_kinds(self):
        return self.config["DbInstances"]

    @property
    def connections(self):
        return self.config["Connections"]

class AwsDbTunnelManager:
    def __init__(self, config_path: str, dry_run: bool = False, no_login: bool = False, logger=None):
        self.cfg = AwsDbTunnelConfig(config_path)
        self.dry_run = dry_run
        self.no_login = no_login
        self.logger = logger or (lambda msg: print(msg))

    # ---------------- AWS CLI / SSO 周り ----------------
    def assert_aws_cli(self):
        try:
            subprocess.run(["aws", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        except Exception:
            raise RuntimeError("AWS CLI v2 が見つかりません。インストールしてください。")

    def ensure_sso_profile(self, profile: str, env_name: str):
        g = self.cfg.global_cfg
        env_cfg = self.cfg.envs[env_name]

        aws_config = Path.home() / ".aws" / "config"
        aws_config.parent.mkdir(parents=True, exist_ok=True)

        exists = aws_config.exists() and f"[profile {profile}]" in aws_config.read_text(encoding="utf-8")

        if exists:
            return

        cmds = [
            ["aws", "configure", "set", "sso_start_url",   g["SsoStartUrl"],   "--profile", profile],
            ["aws", "configure", "set", "sso_region",      g["SsoRegion"],     "--profile", profile],
            ["aws", "configure", "set", "sso_account_id",  env_cfg["AccountId"], "--profile", profile],
            ["aws", "configure", "set", "sso_role_name",   env_cfg["RoleName"],  "--profile", profile],
            ["aws", "configure", "set", "region",          g["DefaultRegion"], "--profile", profile],
            ["aws", "configure", "set", "output",          g["Output"],        "--profile", profile],
        ]

        for cmd in cmds:
            if self.dry_run:
                self.logger("[DRYRUN] " + " ".join(cmd))
            else:
                subprocess.run(cmd, check=True)

    def _test_sso_cache_valid(self) -> bool:
        g = self.cfg.global_cfg
        cache_dir = Path.home() / ".aws" / "sso" / "cache"
        if not cache_dir.exists():
            return False

        lookback_hours = int(g.get("CacheLookbackHours", 24))
        since = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)

        for f in sorted(cache_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
            if datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc) < since:
                continue
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                if data.get("startUrl") != g["SsoStartUrl"]:
                    continue
                if data.get("region") != g["SsoRegion"]:
                    continue

                expires_at = data.get("expiresAt")
                if not expires_at:
                    continue
                # 2024-01-01T00:00:00UTC 形式の想定
                exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if exp > datetime.now(timezone.utc):
                    return True
            except Exception:
                continue

        return False

    def ensure_logged_in(self, profile: str) -> bool:
        if self._test_sso_cache_valid():
            return True

        if self.no_login:
            self.logger("SSOトークンが無効/未取得。--no-login のため login は行いません。")
            return False

        self.logger("SSOトークンが無効/未取得。aws sso login を実行します…")
        result = subprocess.run(["aws", "sso", "login", "--profile", profile])
        if result.returncode != 0:
            raise RuntimeError("aws sso login が失敗しました。")

        if not self._test_sso_cache_valid():
            raise RuntimeError("SSO ログイン後も有効トークンが見つかりません。")

        return True

    # ---------------- SSM / ポートフォワード ----------------
    def _test_port_available(self, port: int) -> bool:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False
        finally:
            s.close()

    def resolve_bastion_instance_id(self, profile: str) -> str:
        g = self.cfg.global_cfg
        args = [
            "aws", "ssm", "describe-instance-information",
            "--profile", profile,
            "--region", g["DefaultRegion"],
        ]
        result = subprocess.run(args, capture_output=True, text=True)
        if result.returncode != 0 or not result.stdout:
            raise RuntimeError(f"describe-instance-information に失敗しました（profile={profile}）。")

        try:
            data = json.loads(result.stdout)
            items = [
                item for item in data.get("InstanceInformationList", [])
                if item.get("PingStatus") == "Online"
            ]
            items.sort(key=lambda x: x.get("LastPingDateTime", ""), reverse=True)
        except Exception as e:
            raise RuntimeError("SSM応答のパースに失敗しました。") from e

        if not items:
            raise RuntimeError(f"Online の SSM 管理インスタンスが見つかりません（profile={profile}）。")

        if len(items) > 1:
            self.logger("Warning: Online のインスタンスが複数見つかりました。最新の1件を使用します。")

        return items[0]["InstanceId"]

    def start_port_forward_to_remote_host(self, profile: str, bastion_instance_id: str,
                                          host_name: str, local_port: int, remote_port: int):
        g = self.cfg.global_cfg
        args = [
            "aws", "ssm", "start-session",
            "--profile", profile,
            "--region", g["DefaultRegion"],
            "--target", bastion_instance_id,
            "--document-name", "AWS-StartPortForwardingSessionToRemoteHost",
            "--parameters", f"host={host_name},portNumber={remote_port},localPortNumber={local_port}",
        ]
        if self.dry_run:
            self.logger("[DRYRUN] " + " ".join(args))
            return

        # 1回試してダメなら login して再試行
        result = subprocess.run(args)
        if result.returncode != 0:
            if not self.ensure_logged_in(profile):
                raise RuntimeError("SSO ログインに失敗しました。")
            result = subprocess.run(args)
            if result.returncode != 0:
                raise RuntimeError(f"start-session が再試行でも失敗しました (exit {result.returncode})。")

    # ---------------- パブリックなエントリポイント ----------------
    def prepare_tunnel(self, env: str, resource: str):
        """
        トンネル開始のために必要な情報を前処理して返す（同期）。
        - aws cli チェック
        - プロファイル作成
        - SSO ログイン（必要なら）
        - bastion 解決
        - host 名解決
        - LocalPort はこのあと決める前提（固定でも動的でもOK）

        戻り値: (profile, bastion_id, host_name, remote_port)
        """
        self.assert_aws_cli()

        if env not in self.cfg.envs:
            raise ValueError(f"未知の環境です: {env}")

        conn_info = self.cfg.connections[env][resource]
        host_name = conn_info["host"]
        if not host_name:
            raise RuntimeError(f"環境 '{env}' × リソース '{resource}' のホスト名が未設定です。")

        env_cfg = self.cfg.envs[env]
        profile = env_cfg["Profile"]

        # プロファイル & ログインはここで済ませる（同期的）
        self.ensure_sso_profile(profile=profile, env_name=env)
        if not self.ensure_logged_in(profile):
            raise RuntimeError("SSO ログインに失敗しました。")

        # bastion 解決
        bastion_id = self.resolve_bastion_instance_id(profile)

        g = self.cfg.global_cfg
        remote_port = g["DbPort"]

        return profile, bastion_id, host_name, remote_port
    
    def start_session_async(self, profile: str, bastion_id: str,
                            host_name: str, local_port: int, remote_port: int):
        """
        aws ssm start-session を非同期で起動する。
        戻り値: subprocess.Popen オブジェクト
        """
        g = self.cfg.global_cfg
        args = [
            "aws", "ssm", "start-session",
            "--profile", profile,
            "--region", g["DefaultRegion"],
            "--target", bastion_id,
            "--document-name", "AWS-StartPortForwardingSessionToRemoteHost",
            "--parameters", f"host={host_name},portNumber={remote_port},localPortNumber={local_port}",
        ]

        self.logger("[ASYNC] " + " ".join(args))

        # Windows の場合は別コンソールを開くと操作しやすい
        creationflags = 0
        if os.name == "nt":
            creationflags = subprocess.CREATE_NEW_CONSOLE

        # 非同期で起動
        proc = subprocess.Popen(
            args,
            creationflags=creationflags,
        )
        return proc
    
    def find_free_local_port(self, start_port: int = 13380, max_port: int = 14000) -> int:
        for p in range(start_port, max_port):
            if self._test_port_available(p):
                return p
        raise RuntimeError(f"{start_port}〜{max_port} の範囲で空きポートが見つかりませんでした。")
