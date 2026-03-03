@echo off
cd /d "%~dp0"
echo Starting Alexa Companion...

REM Start the browser to the local server address
start http://localhost:8001

REM Run the application using the verified working command
python main.py
pause
