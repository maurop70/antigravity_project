$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Alpha Intelligence.lnk"
$Target = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\launch_dashboard.bat"
$IconPath = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\app.js" 
# note: Windows might fallback to generic icon since js file has no icon resource, but that's fine. 
# Better: Use cmd.exe icon
$IconPath = "C:\Windows\System32\cmd.exe"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Target
$Shortcut.WorkingDirectory = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon"
$Shortcut.IconLocation = $IconPath
$Shortcut.Save()

Write-Host "Shortcut created at $ShortcutPath"
