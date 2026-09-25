# Lightweight PowerShell HTTP Server for Communication Club E-Certificate Portal
$port = 5000
$prefix = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  THE COMMUNICATION CLUB - E-CERTIFICATE SERVER RUNNING" -ForegroundColor Yellow
    Write-Host "  Port: $port" -ForegroundColor Cyan
    Write-Host "  Main Portal: http://localhost:$port/index.html" -ForegroundColor White
    Write-Host "  Admin Studio: http://localhost:$port/admin.html" -ForegroundColor White
    Write-Host "  Verification: http://localhost:$port/verify.html" -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server.`n"

    $mimeMap = @{
        ".html" = "text/html; charset=utf-8"
        ".css"  = "text/css; charset=utf-8"
        ".js"   = "application/javascript; charset=utf-8"
        ".svg"  = "image/svg+xml"
        ".png"  = "image/png"
        ".jpg"  = "image/jpeg"
        ".jpeg" = "image/jpeg"
        ".csv"  = "text/csv; charset=utf-8"
        ".xlsx" = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ".xls"  = "application/vnd.ms-excel"
        ".json" = "application/json; charset=utf-8"
    }

    $basePath = $PSScriptRoot

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($rawUrl)) {
            $rawUrl = "index.html"
        }

        # Normalize clean URLs and /admin/* aliases
        $normalized = $rawUrl
        if ($normalized -match "^admin/(verify|index)(\.html)?") {
            $normalized = $normalized -replace "^admin/", ""
        }
        if (-not ($normalized -match "\.[a-zA-Z0-9]+$")) {
            if (Test-Path (Join-Path $basePath ($normalized + ".html"))) {
                $normalized = $normalized + ".html"
            }
        }

        $filePath = Join-Path $basePath $normalized
        if (-not (Test-Path $filePath -PathType Leaf)) {
            $filePath = Join-Path $basePath $rawUrl
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()

    }
} finally {
    $listener.Stop()
}
