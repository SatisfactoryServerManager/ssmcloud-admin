#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

go run ./cmd/admin &
GO_PID=$!
trap 'kill "$GO_PID" 2>/dev/null || true' EXIT

ADMIN_HTTP_ADDR_VAL="${ADMIN_HTTP_ADDR:-:3001}"
if [[ "$ADMIN_HTTP_ADDR_VAL" =~ ^https?:// ]]; then
  export BACKEND_URL="$ADMIN_HTTP_ADDR_VAL"
elif [[ "$ADMIN_HTTP_ADDR_VAL" =~ ^: ]]; then
  export BACKEND_URL="http://localhost$ADMIN_HTTP_ADDR_VAL"
else
  export BACKEND_URL="http://$ADMIN_HTTP_ADDR_VAL"
fi

echo "Next.js proxy target: $BACKEND_URL" >&2

cd "$ROOT_DIR/web"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run dev
