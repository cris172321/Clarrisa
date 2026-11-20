param(
    [int]$Port = 8080
)

$root = (Get-Location).Path
$logFile = Join-Path $root "answers_log.txt"
$jsonFile = Join-Path $root "responses.json"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".json" = "application/json; charset=utf-8"
    ".txt"  = "text/plain; charset=utf-8"
}

$listener = $null
$portsToTry = @($Port, 8081, 8082, 3000, 5000)

foreach ($p in $portsToTry) {
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p)
        $listener.Start()
        $Port = $p
        break
    } catch {
        $listener = $null
    }
}

if ($null -eq $listener) {
    Write-Error "Could not bind to any local port ($($portsToTry -join ', '))."
    exit 1
}

Write-Output "=========================================================="
Write-Output "  💖 CUBAO EXPO DATE SERVER STARTED! 💕"
Write-Output "  🌐 URL: http://localhost:$Port/"
Write-Output "  📝 Answers will be saved to:"
Write-Output "     - answers_log.txt"
Write-Output "     - responses.json"
Write-Output "=========================================================="
Write-Output "Server running. Press Ctrl+C in this window to stop."

function Send-Http($stream, [int]$status, [string]$statusText, [string]$contentType, [byte[]]$bodyBytes) {
    $cors = "Access-Control-Allow-Origin: *`r`nAccess-Control-Allow-Methods: GET, POST, OPTIONS`r`nAccess-Control-Allow-Headers: Content-Type`r`n"
    $header = "HTTP/1.1 $status $statusText`r`nContent-Type: $contentType`r`nContent-Length: $($bodyBytes.Length)`r`nConnection: close`r`n$cors`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($bodyBytes.Length -gt 0) {
        $stream.Write($bodyBytes, 0, $bodyBytes.Length)
    }
    $stream.Flush()
}

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)

        # Read Request Line
        $reqLine = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($reqLine)) {
            $client.Close()
            continue
        }

        $parts = $reqLine.Split(' ')
        $method = $parts[0].ToUpper()
        $rawPath = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
        $pathOnly = $rawPath.Split('?')[0]

        # Read Headers
        $headers = @{}
        $contentLength = 0
        while ($true) {
          $line = $reader.ReadLine()
          if ([string]::IsNullOrEmpty($line)) { break }
          $idx = $line.IndexOf(':')
          if ($idx -gt 0) {
            $hName = $line.Substring(0, $idx).Trim().ToLower()
            $hVal = $line.Substring($idx + 1).Trim()
            $headers[$hName] = $hVal
            if ($hName -eq "content-length") {
              [int]::TryParse($hVal, [ref]$contentLength) | Out-Null
            }
          }
        }

        # Read Body if POST
        $bodyText = ""
        if ($contentLength -gt 0) {
          $buffer = New-Object char[] $contentLength
          $totalRead = 0
          while ($totalRead -lt $contentLength) {
            $read = $reader.Read($buffer, $totalRead, $contentLength - $totalRead)
            if ($read -le 0) { break }
            $totalRead += $read
          }
          $bodyText = [string]::new($buffer, 0, $totalRead)
        }

        # CORS Preflight
        if ($method -eq "OPTIONS") {
          $empty = [byte[]]@()
          Send-Http $stream 204 "No Content" "text/plain" $empty
          $client.Close()
          continue
        }

        # Route: POST /api/save-response
        if ($method -eq "POST" -and $pathOnly -eq "/api/save-response") {
            $parsed = $null
            try {
                $parsed = $bodyText | ConvertFrom-Json
            } catch {
                $err = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Invalid JSON"}')
                Send-Http $stream 400 "Bad Request" "application/json" $err
                $client.Close()
                continue
            }

            $timeStr = (Get-Date).ToString("yyyy-MM-dd hh:mm:ss tt")
            $dateVal = if ($parsed.date) { $parsed.date } else { "(Not specified)" }
            $timeVal = if ($parsed.time) { $parsed.time } else { "(Not specified)" }

            # 1. Format readable log entry
            $logEntry = @"
======================================================================
CUBAO EXPO DATE RESPONSE RECEIVED
Timestamp: $timeStr
----------------------------------------------------------------------
Date Chosen : $dateVal
Time Chosen : $timeVal
======================================================================

"@
            [System.IO.File]::AppendAllText($logFile, $logEntry, [System.Text.Encoding]::UTF8)

            # 2. Append to responses.json
            $existing = @()
            if (Test-Path $jsonFile) {
                try {
                    $rawJson = [System.IO.File]::ReadAllText($jsonFile, [System.Text.Encoding]::UTF8)
                    if (-not [string]::IsNullOrWhiteSpace($rawJson)) {
                        $existing = @($rawJson | ConvertFrom-Json)
                    }
                } catch {
                    $existing = @()
                }
            }

            $record = [ordered]@{
                id = (Get-Date).ToString("yyyyMMddHHmmssfff")
                timestamp = $timeStr
                date = $dateVal
                time = $timeVal
            }

            $existing += $record
            $newJson = $existing | ConvertTo-Json -Depth 5
            [System.IO.File]::WriteAllText($jsonFile, $newJson, [System.Text.Encoding]::UTF8)

            Write-Host "✅ [SAVED] Response recorded at $timeStr - $dateVal ($timeVal)" -ForegroundColor Green

            $respBytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Response saved!"}')
            Send-Http $stream 200 "OK" "application/json" $respBytes
            $client.Close()
            continue
        }

        # Route: GET /api/responses
        if ($method -eq "GET" -and $pathOnly -eq "/api/responses") {
            $jsonContent = "[]"
            if (Test-Path $jsonFile) {
                $raw = [System.IO.File]::ReadAllText($jsonFile, [System.Text.Encoding]::UTF8)
                if (-not [string]::IsNullOrWhiteSpace($raw)) {
                    $jsonContent = $raw
                }
            }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonContent)
            Send-Http $stream 200 "OK" "application/json" $bytes
            $client.Close()
            continue
        }

        # Route: POST /api/clear-responses
        if ($method -eq "POST" -and $pathOnly -eq "/api/clear-responses") {
            [System.IO.File]::WriteAllText($jsonFile, "[]", [System.Text.Encoding]::UTF8)
            [System.IO.File]::WriteAllText($logFile, "=== Answers Log Reset at $((Get-Date).ToString()) ===`r`n`r`n", [System.Text.Encoding]::UTF8)
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true}')
            Send-Http $stream 200 "OK" "application/json" $bytes
            $client.Close()
            continue
        }

        # Static File Serving
        $urlClean = $pathOnly.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlClean)) {
            $urlClean = "index.html"
        }

        $filePath = Join-Path $root $urlClean

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
            Send-Http $stream 200 "OK" $mime $fileBytes
        } else {
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - Not Found")
            Send-Http $stream 404 "Not Found" "text/plain" $errBytes
        }

        $client.Close()
    } catch {
        # Gracefully handle client disconnects
    }
}
