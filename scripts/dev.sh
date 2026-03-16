#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

go run ./cmd/admin &
GO_PID=$!
trap 'kill "$GO_PID" 2>/dev/null || true' EXIT

ADMIN_HTTP_ADDR_VAL="${ADMIN_HTTP_ADDR:-}"
if [ -z "$ADMIN_HTTP_ADDR_VAL" ] && [ -f "$ROOT_DIR/.env" ]; then
  ADMIN_HTTP_ADDR_VAL="$(grep -E '^\s*ADMIN_HTTP_ADDR\s*=' "$ROOT_DIR/.env" | tail -n 1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
fi
if [ -z "$ADMIN_HTTP_ADDR_VAL" ]; then
  ADMIN_HTTP_ADDR_VAL=":3001"
fi

if [[ "$ADMIN_HTTP_ADDR_VAL" =~ ^https?:// ]]; then
  export VITE_ADMIN_API_TARGET="$ADMIN_HTTP_ADDR_VAL"
elif [[ "$ADMIN_HTTP_ADDR_VAL" =~ ^: ]]; then
  export VITE_ADMIN_API_TARGET="http://localhost$ADMIN_HTTP_ADDR_VAL"
else
  export VITE_ADMIN_API_TARGET="http://$ADMIN_HTTP_ADDR_VAL"
fi

echo "Vite proxy target: $VITE_ADMIN_API_TARGET" >&2

cd "$ROOT_DIR/web"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run dev
