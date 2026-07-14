# EduLesson — локальний веб-сервер (без Node/Python)
$Port = 8765
$Root = Split-Path $PSScriptRoot -Parent

$Mime = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml; charset=utf-8"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

$pidFile = Join-Path $env:TEMP "edulesson-server.pid"
$PID | Set-Content $pidFile

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    try {
        $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
        if ($path -eq "/") { $path = "/index.html" }

        $file = Join-Path $Root ($path.TrimStart("/") -replace "/", [IO.Path]::DirectorySeparatorChar)
        $file = [IO.Path]::GetFullPath($file)

        if (-not $file.StartsWith([IO.Path]::GetFullPath($Root), [StringComparison]::OrdinalIgnoreCase)) {
            $res.StatusCode = 403
            $buf = [Text.Encoding]::UTF8.GetBytes("403 Forbidden")
        }
        elseif (Test-Path $file -PathType Leaf) {
            $ext = [IO.Path]::GetExtension($file).ToLower()
            $res.ContentType = $Mime[$ext]
            if (-not $res.ContentType) { $res.ContentType = "application/octet-stream" }
            $buf = [IO.File]::ReadAllBytes($file)
            $res.StatusCode = 200
        }
        else {
            $res.StatusCode = 404
            $buf = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
        }

        $res.ContentLength64 = $buf.Length
        $res.OutputStream.Write($buf, 0, $buf.Length)
    }
    catch {
        $res.StatusCode = 500
    }
    finally {
        $res.Close()
    }
}
