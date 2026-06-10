# Додає EduLesson до автозапуску Windows (при вході в систему)
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$StartBat = Join-Path $ProjectRoot "start.bat"
$Startup = [Environment]::GetFolderPath("Startup")
$ShortcutPath = Join-Path $Startup "EduLesson.lnk"

$Wsh = New-Object -ComObject WScript.Shell
$Sc = $Wsh.CreateShortcut($ShortcutPath)
$Sc.TargetPath = $StartBat
$Sc.WorkingDirectory = $ProjectRoot
$Sc.WindowStyle = 7
$Sc.Description = "EduLesson — конструктор уроків"
$Sc.Save()

Write-Host ""
Write-Host "Готово! EduLesson додано до автозапуску." -ForegroundColor Green
Write-Host "Шлях: $ShortcutPath"
Write-Host ""
Write-Host "Сайт буде відкриватися при кожному вході в Windows:"
Write-Host "  http://localhost:8765"
Write-Host ""
Write-Host "Щоб вимкнути — видали ярлик EduLesson з папки Автозавантаження."
Write-Host "(Win+R -> shell:startup)"
Write-Host ""
Read-Host "Натисни Enter"
