@echo off
cd /d "%~dp0"
echo Starting Alexa Companion...
call venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
