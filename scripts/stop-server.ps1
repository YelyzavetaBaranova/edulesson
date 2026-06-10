$PidFile = Join-Path $env:TEMP "edulesson-server.pid"
if (Test-Path $PidFile) {
    $pid = Get-Content $PidFile
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host "Сервер EduLesson зупинено."
} else {
    Write-Host "Сервер не запущений."
}
