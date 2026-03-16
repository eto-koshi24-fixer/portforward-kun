@echo off
chcp 65001 >nul
title portforward-kun デスクトップビルド

echo ========================================
echo   portforward-kun デスクトップ版ビルド
echo ========================================
echo.

cd /d "%~dp0"

REM --- Step 1: Electron 依存パッケージ ---
echo [1/4] Electron 依存パッケージをインストール中...
call npm install
if errorlevel 1 (
  echo [エラー] npm install に失敗しました。
  pause
  exit /b 1
)
echo.

REM --- Step 2: フロントエンドビルド (静的エクスポート) ---
echo [2/4] フロントエンドをビルド中...
cd /d "%~dp0\frontend"
call pnpm install
set ELECTRON_BUILD=1
set NEXT_PUBLIC_API_BASE=http://localhost:18080
call npx next build
if errorlevel 1 (
  echo [エラー] フロントエンドのビルドに失敗しました。
  pause
  exit /b 1
)
cd /d "%~dp0"
echo.

REM --- Step 3: バックエンドビルド (PyInstaller) ---
echo [3/4] バックエンドを .exe にビルド中...
call pyinstaller --noconfirm --clean --distpath dist/backend backend_entry.py
if errorlevel 1 (
  echo [エラー] PyInstaller ビルドに失敗しました。
  echo   pip install pyinstaller を実行してください。
  pause
  exit /b 1
)
echo.

REM --- Step 4: Electron パッケージング ---
echo [4/4] Electron でパッケージング中...
call npx electron-builder
if errorlevel 1 (
  echo [エラー] electron-builder に失敗しました。
  pause
  exit /b 1
)

echo.
echo ========================================
echo   ビルド完了！
echo   release/ フォルダに出力されました。
echo ========================================
pause
