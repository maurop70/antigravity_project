$WshShell = New-Object -comObject WScript.Shell

# 1. Shortcut for Main App
$ShortcutPath = "$Home\OneDrive\Desktop\Launch Alexa v2.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\alex-companion-v2\run_v2.bat"
$Shortcut.WorkingDirectory = "c:\Users\mpetr\.gemini\antigravity\playground\aphelion-photon\alex-companion-v2"
$Shortcut.Description = "Launch Alexa Companion v2 (Local)"
$Shortcut.Save()

# 2. Shortcut for Parent Dashboard (URL)
# Note: This assumes the server is running. 
# Better approach: A batch file that starts server AND opens parent URL. But simple URL shortcut is standard.
$ShortcutPath = "$Home\OneDrive\Desktop\Alexa v2 Parent.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "http://localhost:8002/parents.html"
$Shortcut.Description = "Open Alexa v2 Parent Dashboard"
# Assign an icon if possible, but default browser icon is fine
$Shortcut.Save()

Write-Host "Shortcuts created on Desktop."
