@echo off
chcp 65001 >nul
title portforward-kun 停止

echo ========================================
echo   portforward-kun 停止中...
echo ========================================
echo.

call "%~dp0_cleanup_ports.cmd"

echo.
echo 停止しました。
timeout /t 2 /nobreak >nul
