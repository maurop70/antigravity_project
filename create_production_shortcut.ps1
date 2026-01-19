$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Alpha Advisor.lnk"
$Target = "C:\Users\mpetr\AlphaAdvisor\launch_advisor.bat"
$IconPath = "C:\Windows\System32\cmd.exe"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Target
$Shortcut.WorkingDirectory = "C:\Users\mpetr\AlphaAdvisor"
$Shortcut.IconLocation = $IconPath
$Shortcut.Save()

Write-Host "Production Shortcut created at $ShortcutPath"
