"""
Connection state manager for SSM Port Forwarder.
接続状態の管理とJSON永続化を担当する。
"""

import os
import json
import subprocess
from typing import Dict, Tuple, Optional, Callable
from datetime import datetime


class ConnectionManager:
    """
    接続状態管理クラス。
    ssm_connection_state.json の読み書きと active_tunnels の管理を担当する。
    """

    def __init__(
        self,
        connection_state_path: str,
        logger: Optional[Callable[[str], None]] = None
    ):
        """
        Constructor.

        Args:
            connection_state_path: 接続状態ファイルのパス
            logger: ログ出力関数（オプション）
        """
        self.connection_state_path = connection_state_path
        self.logger = logger

        # アクティブなトンネル管理: {(env, db_id): (proc, local_port, host, password)}
        self.active_tunnels: Dict[
            Tuple[str, str],
            Tuple[Optional[subprocess.Popen], int, str, str]
        ] = {}

    def read_connection_state(self) -> Dict:
        """
        接続状態ファイルを読み込む。

        Returns:
            Dict: 接続状態
        """
        if not os.path.exists(self.connection_state_path):
            return {"last_updated": "", "connections": {}}

        try:
            with open(self.connection_state_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            if self.logger:
                self.logger(f"⚠️ 接続状態ファイルの読み込みに失敗: {e}")
            return {"last_updated": "", "connections": {}}

    def write_connection_state(self, state: Dict):
        """
        接続状態ファイルに書き込む。

        Args:
            state: 接続状態
        """
        try:
            state["last_updated"] = datetime.now().isoformat()
            with open(self.connection_state_path, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2, ensure_ascii=False)
        except Exception as e:
            if self.logger:
                self.logger(f"⚠️ 接続状態ファイルの書き込みに失敗: {e}")

    def add_connection(
        self,
        env: str,
        db_id: str,
        proc: Optional[subprocess.Popen],
        local_port: int,
        host: str,
        password: str,
        started_by: str = "SsmPortForwarder"
    ):
        """
        接続を追加し、状態ファイルに保存。

        Args:
            env: 環境名
            db_id: DB ID
            proc: プロセス（Noneの場合は他ツールが起動）
            local_port: ローカルポート
            host: ホスト名
            password: パスワード
            started_by: 起動元ツール名
        """
        key = (env, db_id)
        self.active_tunnels[key] = (proc, local_port, host, password)

        # JSON に保存
        state = self.read_connection_state()
        if "connections" not in state:
            state["connections"] = {}

        state_key = f"{env}/{db_id}"
        state["connections"][state_key] = {
            "port": local_port,
            "started_by": started_by,
            "pid": proc.pid if proc else None,
            "active_in_migration_manager": False  # SsmPortForwarderで接続開始時はFalse
        }
        self.write_connection_state(state)

    def remove_connection(self, env: str, db_id: str):
        """
        接続を削除し、状態ファイルから削除。

        Args:
            env: 環境名
            db_id: DB ID
        """
        key = (env, db_id)
        if key in self.active_tunnels:
            del self.active_tunnels[key]

        # JSON から削除
        state = self.read_connection_state()
        state_key = f"{env}/{db_id}"
        if state_key in state.get("connections", {}):
            del state["connections"][state_key]

        # connectionsが空になった場合はファイル削除
        if not state.get("connections"):
            if os.path.exists(self.connection_state_path):
                os.remove(self.connection_state_path)
                if self.logger:
                    self.logger("接続状態ファイルを削除しました")
        else:
            self.write_connection_state(state)

    def get_connection(self, env: str, db_id: str) -> Optional[Tuple[Optional[subprocess.Popen], int, str, str]]:
        """
        接続情報を取得。

        Args:
            env: 環境名
            db_id: DB ID

        Returns:
            Optional[Tuple]: (proc, local_port, host, password) または None
        """
        key = (env, db_id)
        return self.active_tunnels.get(key)

    def is_connected(self, env: str, db_id: str) -> bool:
        """
        接続済みかチェック。

        Args:
            env: 環境名
            db_id: DB ID

        Returns:
            bool: 接続済みの場合True
        """
        return (env, db_id) in self.active_tunnels

    def get_all_connections(self) -> Dict[Tuple[str, str], Tuple[Optional[subprocess.Popen], int, str, str]]:
        """
        全接続情報を取得。

        Returns:
            Dict: active_tunnels の全体
        """
        return self.active_tunnels
