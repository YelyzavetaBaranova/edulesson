# Запуск EduLesson: .NET сервер у фоні + відкриття браузера
$ErrorActionPreference = "SilentlyContinue"
$Port = 8765
$Url = "http://localhost:$Port"
$ScriptDir = $PSScriptRoot
$PidFile = Join-Path $env:TEMP "edulesson-server.pid"
$Dotnet = "C:\Program Files\dotnet\dotnet.exe"
$Project = Join-Path (Split-Path $ScriptDir -Parent) "server\EduLesson.Api"

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

# Запускаємо .NET сервер у прихованому вікні
if (Test-Path $Dotnet) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Dotnet
    $psi.Arguments = "run --project `"$Project`" --urls `"$Url`""
    $psi.WorkingDirectory = Split-Path $ScriptDir -Parent
    $psi.UseShellExecute = $true
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $psi.CreateNoWindow = $true
    $p = [System.Diagnostics.Process]::Start($psi)
    $p.Id | Set-Content $PidFile
} else {
    Write-Host "Помилка: .NET не знайдено за шляхом $Dotnet"
    exit 1
}

# Чекаємо, поки сервер підніметься (до 15 сек)
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-ServerUp) { break }
}

if (Test-ServerUp) {
    Start-Process $Url
} else {
    Write-Host "Помилка: сервер не запустився за 15 секунд"
}
