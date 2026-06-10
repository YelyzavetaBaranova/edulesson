# Запуск EduLesson: сервер у фоні + відкриття браузера
$ErrorActionPreference = "SilentlyContinue"
$Port = 8765
$Url = "http://localhost:$Port"
$ScriptDir = $PSScriptRoot
$PidFile = Join-Path $env:TEMP "edulesson-server.pid"

function Test-ServerUp {
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        return $r.StatusCode -eq 200
    } catch { return $false }
}

# Якщо сервер уже працює — просто відкриваємо браузер
if (Test-ServerUp) {
    Start-Process $Url
    exit 0
}

# Зупиняємо старий процес, якщо PID-файл є
if (Test-Path $PidFile) {
    $oldPid = Get-Content $PidFile -ErrorAction SilentlyContinue
    if ($oldPid) { Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue }
}

# Запускаємо сервер у прихованому вікні
Start-Process powershell.exe -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-WindowStyle", "Hidden",
    "-File", (Join-Path $ScriptDir "server.ps1")
) -WindowStyle Hidden

# Чекаємо, поки сервер підніметься (до 10 сек)
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-ServerUp) { break }
}

Start-Process $Url
