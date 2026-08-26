#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

NODE_BIN="/www/server/nodejs/v22.23.2/bin/node"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

ENTRY_FILE="${ENTRY_FILE:-.output/player/index.mjs}"

if [ ! -f "$ENTRY_FILE" ]; then
  echo "Entrada do player nao encontrada: $ENTRY_FILE" >&2
  exit 1
fi

exec "$NODE_BIN" "$ENTRY_FILE"
