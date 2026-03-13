@echo off
chcp 65001 >nul
title portforward-kun

echo ========================================
echo   portforward-kun 起動中...
echo ========================================
echo.

cd /d "%~dp0"

REM --- 既存プロセスのクリーンアップ ---
echo 既存プロセスを確認中...
call "%~dp0_cleanup_ports.cmd"

REM --- 初回セットアップ ---
if not exist "frontend\node_modules" (
  echo [0] 初回セットアップ: npm パッケージインストール中...
  cd /d "%~dp0\frontend"
  call pnpm install
  if errorlevel 1 (
    echo.
    echo [エラー] pnpm install に失敗しました。pnpm がインストールされているか確認してください。
    pause
    exit /b 1
  )
  cd /d "%~dp0"
  echo.
)

if not exist "db_env_config.json" (
  echo [0] 設定ファイルが見つかりません。サンプルからコピーします...
  copy "db_env_config.example.json" "db_env_config.json" >nul
  echo    db_env_config.json を作成しました。必要に応じて編集してください。
  echo.
)

REM --- バックエンド起動 ---
echo [1/3] バックエンド起動 (port 18080)
start "portforward-kun: Backend" cmd /k "cd /d "%~dp0" && python -m uvicorn backend.main:app --reload --port 18080"

REM --- フロントエンド起動 ---
echo [2/3] フロントエンド起動 (port 18081)
start "portforward-kun: Frontend" cmd /k "cd /d "%~dp0\frontend" && pnpm dev"

REM --- フロントエンド準備完了を待ってブラウザ起動 ---
echo [3/3] フロントエンドの起動を待っています...
:wait_loop
timeout /t 2 /nobreak >nul
curl -s -o nul -w "" http://localhost:18081 >nul 2>&1
if errorlevel 1 goto wait_loop
echo       準備完了！ブラウザを開きます。
start http://localhost:18081

echo.
echo ========================================
echo   起動完了！このウィンドウは閉じてOKです
echo ========================================
pause
