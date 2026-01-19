@echo off
title ALPHA WATCHDOG - ACTIVE MONITORING
color 0c

echo ==================================================
echo      ALPHA WATCHDOG - SECURITY SUBSYSTEM
echo ==================================================
echo.
echo [*] Monitoring Loop: 5 Minutes
echo [*] Audio Alerts: ENABLED
echo [*] Visual Popups: ENABLED
echo.

python alpha_watchdog.py

echo.
echo Watchdog stopped.
pause
