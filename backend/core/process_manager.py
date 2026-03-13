"""
Process manager for SSM Port Forwarder.
プロセスの生存確認とkill処理を担当する。
"""

import subprocess
from typing import Optional, Callable


class ProcessManager:
    """
    プロセス管理クラス。
    プロセスの生存確認とkill処理を担当する。
    """

    def __init__(self, logger: Optional[Callable[[str], None]] = None):
        """
        Constructor.

        Args:
            logger: ログ出力関数（オプション）
        """
        self.logger = logger

    def is_process_alive(self, pid: int) -> bool:
        """
        指定されたPIDのプロセスが存在するかチェック。

        Args:
            pid: プロセスID

        Returns:
            bool: プロセスが存在する場合True
        """
        try:
            result = subprocess.run(
                ["tasklist", "/FI", f"PID eq {pid}", "/NH"],
                capture_output=True,
                text=True,
                timeout=2
            )
            # プロセスが存在する場合、出力にPIDが含まれる
            return str(pid) in result.stdout
        except Exception as e:
            if self.logger:
                self.logger(f"⚠️ プロセス存在チェックに失敗 (PID {pid}): {e}")
            return False

    def kill_process(self, pid: int) -> bool:
        """
        指定されたPIDのプロセスを強制終了。

        Args:
            pid: プロセスID

        Returns:
            bool: 成功した場合True
        """
        try:
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(pid)],
                capture_output=True,
                timeout=5
            )
            if self.logger:
                self.logger(f"✅ プロセス (PID {pid}) を終了しました")
            return True
        except Exception as e:
            if self.logger:
                self.logger(f"⚠️ プロセス終了に失敗 (PID {pid}): {e}")
            return False
