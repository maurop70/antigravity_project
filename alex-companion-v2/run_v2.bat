@echo off
cd /d "%~dp0"
echo Starting Alexa Companion v2 (Port 8002)...
call my_env\Scripts\activate
start http://localhost:8002
python -m uvicorn main:app --host 0.0.0.0 --port 8002
pause
