$ErrorActionPreference = "Continue" # Robocopy returns non-zero exit codes for success
$source = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\alex-companion-v2"
$dest = "C:\Users\mpetr\My Drive\Antigravity-AI Agents\Alexa Companion v2"

Write-Host "Backing up Alexa Companion v2 to Google Drive..."
Write-Host "Source: $source"
Write-Host "Dest: $dest"

# Robocopy /MIR (Mirror) /XD (Exclude Dirs)
# Exclude: venv, __pycache__, .git, .idea, .vscode
robocopy $source $dest /MIR /XD venv __pycache__ .git .idea .vscode node_modules /R:1 /W:1

# Robocopy exit codes: 0-7 are success/partial success
if ($LASTEXITCODE -le 7) {
    Write-Host "Backup Complete Successfully!"
    exit 0
} else {
    Write-Host "Backup Failed with code $LASTEXITCODE"
    exit 1
}
