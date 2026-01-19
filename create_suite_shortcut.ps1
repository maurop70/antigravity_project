$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Antigravity Launch.lnk"
$Target = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\launch_suite.bat"
$IconPath = "C:\Windows\System32\shell32.dll,220" 

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Target
$Shortcut.WorkingDirectory = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon"
$Shortcut.IconLocation = $IconPath
$Shortcut.Save()

Write-Host "Shortcut created at $ShortcutPath"
