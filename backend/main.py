"""
SSM Port Forwarder - FastAPI Application
メインエントリポイント。ルーター登録、依存性注入、API配信を行う。

起動方法:
  cd portforward-kun
  uvicorn backend.main:app --reload --port 18080
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config.config_manager import ConfigManager
from .core.connection_manager import ConnectionManager
from .core.process_manager import ProcessManager
from .core.port_validator import PortValidator
from .log_store import LogStore

from .routers import config_router, tunnel_router, test_router

# ============================================================
# パス解決
# ============================================================

# backend/ の親 = プロジェクトルート (portforward-kun/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "db_env_config.json"
CONNECTION_STATE_PATH = PROJECT_ROOT / "ssm_connection_state.json"


# ============================================================
# 共有インスタンス生成
# ============================================================

log_store = LogStore(max_entries=500)

config_manager = ConfigManager(
    config_path=str(CONFIG_PATH),
    logger=log_store.as_logger(),
)

connection_manager = ConnectionManager(
    connection_state_path=str(CONNECTION_STATE_PATH),
    logger=log_store.as_logger(),
)

process_manager = ProcessManager(logger=log_store.as_logger())
port_validator = PortValidator(logger=log_store.as_logger())


# ============================================================
# ルーターへの依存性注入
# ============================================================

def _inject(router, **kwargs):
    for k, v in kwargs.items():
        setattr(router, k, v)


_inject(
    config_router.router,
    config_manager=config_manager,
)

_inject(
    tunnel_router.router,
    config_manager=config_manager,
    connection_manager=connection_manager,
    process_manager=process_manager,
    port_validator=port_validator,
    log_store=log_store,
)

_inject(
    test_router.router,
    config_manager=config_manager,
    log_store=log_store,
)


# ============================================================
# FastAPI アプリ
# ============================================================

app = FastAPI(
    title="ポートフォワード管理くん",
    description="AWS SSM Port Forwarding Manager - Web Edition",
    version="2.0.0",
)


# CORS (Next.js dev server からのアクセスを許可)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:18081"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(config_router.router)
app.include_router(tunnel_router.router)
app.include_router(test_router.router)


# ============================================================
# ログAPI
# ============================================================

@app.get("/api/logs")
def get_logs(since: str = ""):
    """ログを取得。since パラメータで差分取得可能。"""
    if since:
        logs = log_store.get_since(since)
    else:
        logs = log_store.get_all()
    return {"logs": logs}




# ============================================================
# 起動ログ
# ============================================================

log_store.info("ポートフォワード管理くん Web Edition を起動しました")
log_store.info(f"設定ファイル: {CONFIG_PATH}")
