@echo off
REM ポート18080/18081を使用中のプロセスを停止する内部スクリプト
REM ウィンドウタイトルで停止 + ポート占有プロセスをtaskkillで停止
taskkill /F /FI "WINDOWTITLE eq portforward-kun: Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq portforward-kun: Frontend*" >nul 2>&1
REM uvicorn の子プロセス(python.exe)がポートを掴んでいる場合
for /f "tokens=5" %%p in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":18080 :18081"') do (
  if not "%%p"=="0" taskkill /F /PID %%p >nul 2>&1
)
timeout /t 2 /nobreak >nul
