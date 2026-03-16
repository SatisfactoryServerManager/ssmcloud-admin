#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Building web"
cd "$ROOT_DIR/web"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build

echo "Building Go binary"
cd "$ROOT_DIR"
go test ./...

mkdir -p "release/linux/web"
go build -o "release/linux/ssmcloud-admin" ./cmd/admin

echo "Copying web/dist into release folder"
cp -R "web/dist" "release/linux/web/"
cp ".env.example" "release/linux/.env.example"

echo "Built: $ROOT_DIR/release/linux"
