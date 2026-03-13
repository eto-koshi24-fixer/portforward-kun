"""
設定CRUD API (/api/config)
db_env_config.json の読み書きを行う。AWSへの通信は一切なし。
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from ..models import (
    GlobalConfig,
    EnvConfig,
    DbInstance,
    ConnectionConfig,
    FullConfigResponse,
)
from ..config.config_manager import ConfigManager

router = APIRouter(prefix="/api/config", tags=["config"])

# ConfigManager はmain.pyで生成して app.state 経由で渡す。
# ここではヘルパーで取得する。


def _cm() -> ConfigManager:
    """ルーターに注入された ConfigManager を返す。main.py 側で設定する。"""
    return router.config_manager  # type: ignore[attr-defined]


# ============================================================
# 設定全体
# ============================================================

@router.get("", response_model=FullConfigResponse)
def get_config():
    """設定全体を返す。"""
    raw = _cm().get_raw_config()
    return raw


# ============================================================
# Global
# ============================================================

@router.put("/global")
def update_global(body: GlobalConfig):
    """Global設定を更新して保存。"""
    cm = _cm()
    cm.config["Global"] = body.model_dump(exclude_none=True)
    # BastionTagKeys が None なら既存値を維持
    if body.BastionTagKeys is None and "BastionTagKeys" in cm.config.get("Global", {}):
        pass  # model_dump(exclude_none=True) で除外済み
    cm.save_config()
    return {"message": "Global設定を更新しました"}


# ============================================================
# Envs
# ============================================================

@router.get("/envs")
def get_envs():
    """全環境設定を返す。"""
    return _cm().get_envs()


@router.post("/envs/{env_name}")
def upsert_env(env_name: str, body: EnvConfig):
    """環境を追加または更新。"""
    cm = _cm()
    if "Envs" not in cm.config:
        cm.config["Envs"] = {}
    cm.config["Envs"][env_name] = body.model_dump(exclude_none=True)
    cm.save_config()
    return {"message": f"環境 '{env_name}' を保存しました"}


@router.delete("/envs/{env_name}")
def delete_env(env_name: str):
    """環境を削除。関連する DbInstances / Connections も削除する。"""
    cm = _cm()

    if env_name not in cm.config.get("Envs", {}):
        raise HTTPException(status_code=404, detail=f"環境 '{env_name}' が見つかりません")

    del cm.config["Envs"][env_name]

    # 関連データも削除
    if env_name in cm.config.get("DbInstances", {}):
        del cm.config["DbInstances"][env_name]
    if env_name in cm.config.get("Connections", {}):
        del cm.config["Connections"][env_name]

    cm.save_config()
    return {"message": f"環境 '{env_name}' と関連データを削除しました"}


# ============================================================
# DbInstances
# ============================================================

@router.get("/db-instances/{env_name}")
def get_db_instances(env_name: str):
    """指定環境のDBインスタンス一覧を返す。"""
    instances = _cm().config.get("DbInstances", {}).get(env_name, [])
    return instances


@router.post("/db-instances/{env_name}")
def upsert_db_instance(env_name: str, body: DbInstance):
    """DBインスタンスを追加または更新。idが一致するものがあれば上書き。"""
    cm = _cm()
    if "DbInstances" not in cm.config:
        cm.config["DbInstances"] = {}
    if env_name not in cm.config["DbInstances"]:
        cm.config["DbInstances"][env_name] = []

    instances = cm.config["DbInstances"][env_name]
    # 既存を更新
    for i, inst in enumerate(instances):
        if inst["id"] == body.id:
            instances[i] = body.model_dump()
            cm.save_config()
            return {"message": f"DBインスタンス '{body.id}' を更新しました"}

    # 新規追加
    instances.append(body.model_dump())
    cm.save_config()
    return {"message": f"DBインスタンス '{body.id}' を追加しました"}


@router.delete("/db-instances/{env_name}/{db_id}")
def delete_db_instance(env_name: str, db_id: str):
    """DBインスタンスを削除。関連する接続情報も削除する。"""
    cm = _cm()
    instances = cm.config.get("DbInstances", {}).get(env_name, [])
    original_len = len(instances)
    cm.config["DbInstances"][env_name] = [
        inst for inst in instances if inst["id"] != db_id
    ]

    if len(cm.config["DbInstances"][env_name]) == original_len:
        raise HTTPException(status_code=404, detail=f"DBインスタンス '{db_id}' が見つかりません")

    # 関連する接続情報も削除
    if db_id in cm.config.get("Connections", {}).get(env_name, {}):
        del cm.config["Connections"][env_name][db_id]

    cm.save_config()
    return {"message": f"DBインスタンス '{db_id}' と関連する接続情報を削除しました"}


# ============================================================
# Connections
# ============================================================

@router.get("/connections/{env_name}")
def get_connections(env_name: str):
    """指定環境の接続情報一覧を返す。"""
    return _cm().config.get("Connections", {}).get(env_name, {})


@router.post("/connections/{env_name}/{db_id}")
def upsert_connection(env_name: str, db_id: str, body: ConnectionConfig):
    """接続情報を追加または更新。"""
    cm = _cm()
    if "Connections" not in cm.config:
        cm.config["Connections"] = {}
    if env_name not in cm.config["Connections"]:
        cm.config["Connections"][env_name] = {}

    cm.config["Connections"][env_name][db_id] = body.model_dump(exclude_none=True)
    cm.save_config()
    return {"message": f"接続情報 '{env_name}/{db_id}' を保存しました"}


@router.delete("/connections/{env_name}/{db_id}")
def delete_connection(env_name: str, db_id: str):
    """接続情報を削除。"""
    cm = _cm()
    conns = cm.config.get("Connections", {}).get(env_name, {})

    if db_id not in conns:
        raise HTTPException(status_code=404, detail=f"接続情報 '{env_name}/{db_id}' が見つかりません")

    del cm.config["Connections"][env_name][db_id]
    cm.save_config()
    return {"message": f"接続情報 '{env_name}/{db_id}' を削除しました"}
