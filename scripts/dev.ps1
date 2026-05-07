Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot ".."))

Write-Host "Starting Go admin API (loads .env if present)" -ForegroundColor Cyan
$goProc = Start-Process -FilePath "go" -ArgumentList @("run", "./cmd/admin") -WorkingDirectory $repo -PassThru

try {
    Write-Host "Starting Next.js dev server on port 3000" -ForegroundColor Cyan
    Set-Location (Join-Path $repo "web")

    # Proxy /api and /auth to the Go server. Set BACKEND_URL if the Go server
    # listens on a non-default address.
    $goAddr = $env:ADMIN_HTTP_ADDR
    if (-not $goAddr) { $goAddr = ":3001" }
    if ($goAddr.StartsWith(":")) {
        $env:BACKEND_URL = "http://localhost$goAddr"
    } elseif (-not $goAddr.StartsWith("http")) {
        $env:BACKEND_URL = "http://$goAddr"
    } else {
        $env:BACKEND_URL = $goAddr
    }
    Write-Host "Next.js proxy target: $env:BACKEND_URL" -ForegroundColor DarkGray

    if (-not (Test-Path (Join-Path (Get-Location) "node_modules"))) {
        npm install
    }

    npm run dev
}
finally {
    if ($goProc -and -not $goProc.HasExited) {
        Write-Host "Stopping Go admin API" -ForegroundColor Yellow
        $goProc.Kill()
    }
}
