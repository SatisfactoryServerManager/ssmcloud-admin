Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repo = (Resolve-Path (Join-Path $PSScriptRoot ".."))

Write-Host "Building web (Next.js static export)" -ForegroundColor Cyan
Set-Location (Join-Path $repo "web")

if (Test-Path (Join-Path (Get-Location) "package-lock.json")) {
    npm ci
} else {
    npm install
}

$env:NEXT_STATIC_BUILD = "1"
npm run build

Write-Host "Building Go binary" -ForegroundColor Cyan
Set-Location $repo

go test ./...

$releaseDir = Join-Path $repo "release/windows"
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

go build -o (Join-Path $releaseDir "ssmcloud-admin.exe") ./cmd/admin

Write-Host "Copying web/out into release folder" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path (Join-Path $releaseDir "web") | Out-Null
Copy-Item -Recurse -Force (Join-Path $repo "web/out") (Join-Path $releaseDir "web/")
Copy-Item -Force (Join-Path $repo ".env.example") (Join-Path $releaseDir ".env.example")

Write-Host "Built: $releaseDir" -ForegroundColor Green
