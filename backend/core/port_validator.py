"""
Port validator for SSM Port Forwarder.
ポートのリスニング状態確認を担当する。
"""

import os
import re
import socket
import subprocess
from typing import Set, Optional, Callable


class PortValidator:
    """
    ポート検証クラス。
    ポートのリスニング状態確認とnetstat処理を担当する。
    """

    def __init__(self, logger: Optional[Callable[[str], None]] = None):
        """
        Constructor.

        Args:
            logger: ログ出力関数（オプション）
        """
        self.logger = logger

    def get_all_listening_ports(self) -> Set[int]:
        """
        リッスン中の全ローカルポートを取得（netstatを使用）。

        Returns:
            Set[int]: リッスン中のポート番号のセット
        """
        try:
            result = subprocess.run(
                ["netstat", "-an"],
                capture_output=True,
                text=True,
                timeout=2
            )
            ports = set()
            for line in result.stdout.splitlines():
                if "LISTENING" in line or "LISTEN" in line:
                    # 127.0.0.1:13380 や 0.0.0.0:13380 のような部分を抽出
                    match = re.search(r"(?:127\.0\.0\.1|0\.0\.0\.0|\[::\]):(\d+)", line)
                    if match:
                        ports.add(int(match.group(1)))
            return ports
        except Exception as e:
            if self.logger:
                self.logger(f"⚠️ netstatの実行に失敗: {e}")
            return set()

    def test_port_listening(self, port: int) -> bool:
        """
        指定ポートがリッスン状態かテストする（netstatを使用）。

        Args:
            port: テスト対象のローカルポート番号

        Returns:
            bool: ポートがリッスン状態ならTrue、そうでなければFalse
        """
        try:
            if os.name == "nt":  # Windows
                result = subprocess.run(
                    ["netstat", "-an"],
                    capture_output=True,
                    text=True,
                    timeout=1
                )
                # 127.0.0.1:PORT または 0.0.0.0:PORT がLISTENINGか確認
                for line in result.stdout.splitlines():
                    if "LISTENING" in line:
                        match = re.search(r"(?:127\.0\.0\.1|0\.0\.0\.0):(\d+)", line)
                        if match and int(match.group(1)) == port:
                            return True
                return False
            else:  # Linux/Mac
                result = subprocess.run(
                    ["netstat", "-an"],
                    capture_output=True,
                    text=True,
                    timeout=1
                )
                for line in result.stdout.splitlines():
                    if "LISTEN" in line:
                        match = re.search(r"127\.0\.0\.1:(\d+)", line)
                        if match and int(match.group(1)) == port:
                            return True
                return False
        except Exception:
            # fallback: socket接続
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.1)
                sock.connect(("127.0.0.1", port))
                sock.close()
                return True
            except Exception:
                return False
