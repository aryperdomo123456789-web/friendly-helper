#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ -f .env ]; then
  set -a
  # Load deployment variables for PM2 without relying on Node's --env-file support.
  . ./.env
  set +a
fi

NODE_BIN="/www/server/nodejs/v22.23.2/bin/node"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

exec "$NODE_BIN" .output/server/index.mjs
