"""
PyInstaller entry point for the backend.
portforward-kun のバックエンドを単体 .exe として起動するためのエントリポイント。
"""

import uvicorn
from backend.main import app

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=18080)
