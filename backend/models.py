"""
Pydantic models for SSM Port Forwarder Web API.
リクエスト/レスポンスのスキーマ定義。
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime


# ============================================================
# Global設定
# ============================================================

class GlobalConfig(BaseModel):
    SsoStartUrl: str = Field(..., description="AWS SSO Start URL")
    SsoRegion: str = Field(default="ap-northeast-1")
    DefaultRegion: str = Field(default="ap-northeast-1")
    Output: str = Field(default="json")
    DbPort: int = Field(default=5432)
    DbUser: str = Field(default="postgres")
    CacheLookbackHours: int = Field(default=24)
    BastionTagKeys: Optional[Dict[str, str]] = None


# ============================================================
# 環境 (Envs)
# ============================================================

class EnvConfig(BaseModel):
    AccessType: str = Field(..., description="public or private")
    Profile: Optional[str] = None
    AccountId: Optional[str] = None
    RoleName: Optional[str] = None
    EnvTagValue: Optional[str] = None


# ============================================================
# DBインスタンス (DbInstances)
# ============================================================

class DbInstance(BaseModel):
    id: str
    display_name: str
    category: str = Field(default="tenant", description="common or tenant")


class DbInstanceList(BaseModel):
    instances: List[DbInstance]


# ============================================================
# 接続情報 (Connections)
# ============================================================

class ConnectionConfig(BaseModel):
    host: str
    password: str
    local_port: Optional[int] = None


# ============================================================
# トンネル状態
# ============================================================

class TunnelStatus(BaseModel):
    env: str
    db_id: str
    display_name: str
    category: str
    host: str
    local_port: Optional[int] = None
    connected: bool = False
    pid: Optional[int] = None


class TunnelListResponse(BaseModel):
    tunnels: List[TunnelStatus]


# ============================================================
# 接続テスト
# ============================================================

class TestConnectionRequest(BaseModel):
    env: str
    db_id: str


class TestStep(BaseModel):
    step: int
    name: str
    status: str = Field(description="success / error / skipped")
    message: str = ""


class TestConnectionResponse(BaseModel):
    success: bool
    steps: List[TestStep]


# ============================================================
# トンネル操作
# ============================================================

class ConnectRequest(BaseModel):
    local_port: Optional[int] = Field(
        default=None,
        description="指定なしの場合は自動割当"
    )


class ConnectResponse(BaseModel):
    env: str
    db_id: str
    local_port: int
    pid: Optional[int] = None
    message: str = ""


class DisconnectResponse(BaseModel):
    env: str
    db_id: str
    message: str = ""


class DisconnectAllResponse(BaseModel):
    disconnected: int
    message: str = ""


# ============================================================
# ログ
# ============================================================

class LogEntry(BaseModel):
    timestamp: str
    level: str = "info"
    message: str


class LogResponse(BaseModel):
    logs: List[LogEntry]


# ============================================================
# 設定全体取得用
# ============================================================

class FullConfigResponse(BaseModel):
    Global: GlobalConfig
    Envs: Dict[str, EnvConfig]
    DbInstances: Dict[str, List[DbInstance]]
    Connections: Dict[str, Dict[str, ConnectionConfig]]


# ============================================================
# 汎用エラー
# ============================================================

class ErrorResponse(BaseModel):
    detail: str
