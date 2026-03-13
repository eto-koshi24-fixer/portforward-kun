"""
In-memory log buffer for SSM Port Forwarder.
バックエンドのログをメモリに保持し、ポーリングで取得できるようにする。
"""

import threading
from collections import deque
from datetime import datetime, timezone, timedelta
from typing import List, Optional

JST = timezone(timedelta(hours=9))


class LogEntry:
    __slots__ = ("timestamp", "level", "message")

    def __init__(self, message: str, level: str = "info"):
        self.timestamp = datetime.now(JST).isoformat()
        self.level = level
        self.message = message

    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "level": self.level,
            "message": self.message,
        }


class LogStore:
    """
    スレッドセーフなリングバッファ式ログストア。
    最大 max_entries 件を保持する。
    """

    def __init__(self, max_entries: int = 500):
        self._buffer: deque[LogEntry] = deque(maxlen=max_entries)
        self._lock = threading.Lock()

    def add(self, message: str, level: str = "info"):
        entry = LogEntry(message, level)
        with self._lock:
            self._buffer.append(entry)

    def info(self, message: str):
        self.add(message, "info")

    def warn(self, message: str):
        self.add(message, "warn")

    def error(self, message: str):
        self.add(message, "error")

    def get_all(self) -> List[dict]:
        with self._lock:
            return [e.to_dict() for e in self._buffer]

    def get_since(self, since_iso: str) -> List[dict]:
        """指定タイムスタンプ以降のログを返す。"""
        with self._lock:
            return [
                e.to_dict() for e in self._buffer
                if e.timestamp > since_iso
            ]

    def clear(self):
        with self._lock:
            self._buffer.clear()

    def as_logger(self):
        """
        既存コアモジュールの logger 引数に渡せるコールバックを返す。
        logger=log_store.as_logger() のように使う。
        """
        return lambda msg: self.info(msg)
