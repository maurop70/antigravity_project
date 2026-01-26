@echo off
cd /d "%~dp0"
echo Starting Alexa Companion...

REM Start the browser to the local server address
start http://localhost:8000

REM Activate environment and start server
call venv\Scripts\activate
venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
