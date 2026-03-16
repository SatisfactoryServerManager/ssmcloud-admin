Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot ".."))

function Get-AdminApiTarget {
    param([string]$RepoRoot)

    $addr = $env:ADMIN_HTTP_ADDR
    $envFile = Join-Path $RepoRoot ".env"
    if (-not $addr -and (Test-Path $envFile)) {
        $line = Get-Content $envFile | Where-Object { $_ -match '^\s*ADMIN_HTTP_ADDR\s*=' } | Select-Object -Last 1
        if ($line) {
            $addr = ($line -split "=", 2)[1].Trim()
            $addr = $addr.Trim('"').Trim("'")
        }
    }
    if (-not $addr) { $addr = ":3001" }

    if ($addr -match '^https?://') { return $addr }
    if ($addr.StartsWith(":")) { return "http://localhost$addr" }
    return "http://$addr"
}

Write-Host "Starting Go admin API (loads .env if present)" -ForegroundColor Cyan
$goProc = Start-Process -FilePath "go" -ArgumentList @("run", "./cmd/admin") -WorkingDirectory $repo -PassThru

try {
    Write-Host "Starting Vite dev server" -ForegroundColor Cyan
    Set-Location (Join-Path $repo "web")

    $env:VITE_ADMIN_API_TARGET = Get-AdminApiTarget -RepoRoot $repo
    Write-Host "Vite proxy target: $env:VITE_ADMIN_API_TARGET" -ForegroundColor DarkGray

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
