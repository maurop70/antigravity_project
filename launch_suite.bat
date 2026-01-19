@echo off
title ANTIGRAVITY SUITE - LAUNCHER

echo ==================================================
echo      INITIALIZING ANTIGRAVITY & ALPHA ADVISOR
echo ==================================================
echo.

echo [1/4] Checking for Python Bridge...
python --version >nul 2>&1
if %errorlevel% EQU 0 goto FOUND
goto NOTFOUND

:FOUND
echo       Python found. Installing dependencies...
python -m pip install flask flask-cors yfinance >nul 2>&1

echo       Starting Data Bridge (Yahoo Finance)...
start "ALPHA BRIDGE" cmd /k "python alpha_bridge.py"
goto LAUNCH

:NOTFOUND
echo       WARNING: Python not found. Bridge will be skipped.
echo       (Manual Mode will still work)

:LAUNCH
echo.
echo [2/4] Launching Alpha Dashboard...
start index.html

echo [3/4] Launching Antigravity Chat (Direct Uplink)...
start local_chat.html

echo.
echo [4/4] System Online.
echo ==================================================
echo       Leave the 'ALPHA BRIDGE' window open 
echo       to receive live data updates.
echo ==================================================
timeout /t 5 >nul
exit
