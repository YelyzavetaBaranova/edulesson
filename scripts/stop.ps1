# Зупинка EduLesson сервера
$ErrorActionPreference = "SilentlyContinue"
$PidFile = Join-Path $env:TEMP "edulesson-server.pid"

if (Test-Path $PidFile) {
    $pid = Get-Content $PidFile
    if ($pid) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "Сервер (PID $pid) зупинено"
    }
    Remove-Item $PidFile -Force
} else {
    # Шукаємо dotnet процеси, які запущені з нашого проекту
    $procs = Get-Process -Name dotnet -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        try {
            $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($p.Id)").CommandLine
            if ($cmd -like "*EduLesson*") {
                Stop-Process -Id $p.Id -Force
                Write-Host "Сервер (PID $($p.Id)) зупинено"
            }
        } catch {}
    }
}
