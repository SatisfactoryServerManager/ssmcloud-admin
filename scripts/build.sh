#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Building web (Next.js static export)"
cd "$ROOT_DIR/web"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
NEXT_STATIC_BUILD=1 npm run build

echo "Building Go binary"
cd "$ROOT_DIR"
go test ./...

mkdir -p "release/linux/web"
go build -o "release/linux/ssmcloud-admin" ./cmd/admin

echo "Copying web/out into release folder"
cp -R "web/out" "release/linux/web/"
cp ".env.example" "release/linux/.env.example"

echo "Built: $ROOT_DIR/release/linux"