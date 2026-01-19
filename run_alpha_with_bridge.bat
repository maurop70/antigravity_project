@echo off
title ALPHA INTELLIGENCE - STARTUP

echo ==================================================
echo      INITIALIZING ALPHA TRADING SYSTEM
echo ==================================================
echo.

echo [1/3] Checking for Python Bridge...
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
echo [2/3] Launching Dashboard...
start index.html

echo.
echo [3/3] System Online.
echo ==================================================
echo       Leave the 'ALPHA BRIDGE' window open 
echo       to receive live data updates.
echo ==================================================
pause
