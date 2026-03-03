$ErrorActionPreference = "Stop"

$pythonPath = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\alex-companion\venv\Scripts\python.exe"
$scriptPath = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\alex-companion-v2\synapse_bridge.py"
$workDir = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\alex-companion-v2"
$taskName = "AlexInsightBridge"
$time = "20:00"

Write-Host "Scheduling '$taskName' to run Daily at $time..."

# Note: We pass the working directory by wrapping correctly or ensuring the script handles absolute paths. 
# Setup: PythonExe ScriptPath
# We use -WindowStyle Hidden via PowerShell wrapper? Or just run python directly (console window might flash).
# For simplicity, we run python directly.

$action = "`"$pythonPath`" `"$scriptPath`""

# SCHTASKS requires quotes explicitly escaped if inside string
# /TR command
schtasks /create /sc daily /tn $taskName /tr $action /st $time /f

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! Task scheduled."
    Write-Host "To test manually, run: schtasks /run /tn $taskName"
} else {
    Write-Host "Failed to schedule task."
}
