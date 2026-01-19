$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Alpha Watchdog.lnk"
$Target = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\launch_watchdog.bat"
$IconPath = "C:\Windows\System32\shell32.dll,240" 

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Target
$Shortcut.WorkingDirectory = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon"
$Shortcut.IconLocation = $IconPath
$Shortcut.Save()

Write-Host "Shortcut created at $ShortcutPath"
