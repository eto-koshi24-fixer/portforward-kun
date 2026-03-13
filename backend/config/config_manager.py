"""
Configuration manager for SSM Port Forwarder.
設定ファイルの読み書きと設定値の取得を管理する。
"""

import json
from typing import Dict, Any, Callable, Optional


class ConfigManager:
    """
    設定管理クラス。
    db_env_config.json の読み書きと設定値の取得を担当する。
    """

    def __init__(self, config_path: str, logger: Optional[Callable[[str], None]] = None):
        """
        Constructor.

        Args:
            config_path: 設定ファイルのパス
            logger: ログ出力関数（オプション）
        """
        self.config_path = config_path
        self.logger = logger
        self.config: Dict[str, Any] = {}
        self._load_config()

    def _load_config(self):
        """設定ファイルを読み込む。"""
        with open(self.config_path, encoding="utf-8") as f:
            self.config = json.load(f)

    def save_config(self):
        """設定をファイルに保存。"""
        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)
        if self.logger:
            self.logger("設定を保存しました")

    def get_local_port(self, env: str, db_id: str) -> int:
        """
        ローカルポート番号を取得。

        Args:
            env: 環境名
            db_id: DB ID

        Returns:
            int: ローカルポート番号。設定がない場合は0
        """
        conn_config = self.config.get("Connections", {}).get(env, {}).get(db_id, {})
        return conn_config.get("local_port", 0)

    def set_local_port(self, env: str, db_id: str, port: int):
        """
        ローカルポート番号を設定。

        Args:
            env: 環境名
            db_id: DB ID
            port: ポート番号
        """
        if "Connections" not in self.config:
            self.config["Connections"] = {}
        if env not in self.config["Connections"]:
            self.config["Connections"][env] = {}
        if db_id not in self.config["Connections"][env]:
            self.config["Connections"][env][db_id] = {}
        self.config["Connections"][env][db_id]["local_port"] = port

    def get_envs(self) -> Dict[str, Any]:
        """
        環境設定を取得。

        Returns:
            Dict[str, Any]: 環境設定の辞書
        """
        return self.config.get("Envs", {})

    def get_db_instances(self) -> Dict[str, Any]:
        """
        DBインスタンス設定を取得。

        Returns:
            Dict[str, Any]: DBインスタンス設定の辞書
        """
        return self.config.get("DbInstances", {})

    def get_global_db_port(self) -> int:
        """
        グローバルDBポート番号を取得。

        Returns:
            int: DBポート番号（デフォルト: 5432）
        """
        return self.config.get("Global", {}).get("DbPort", 5432)

    def get_raw_config(self) -> Dict[str, Any]:
        """
        生の設定データを取得。

        Returns:
            Dict[str, Any]: 設定データ全体
        """
        return self.config
