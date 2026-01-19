$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Alpha Advisor.lnk"
$Target = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\launch_advisor.bat"
$IconPath = "C:\Windows\System32\cmd.exe"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Target
$Shortcut.WorkingDirectory = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon"
$Shortcut.IconLocation = $IconPath
$Shortcut.Save()

Write-Host "Shortcut created at $ShortcutPath"
