#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/root/backups}"
STAMP="$(date +%F-%H%M%S)"
ARCHIVE_NAME="stream-mago-bot-editable-${STAMP}.tar.gz"
ARCHIVE_PATH="${BACKUP_DIR}/${ARCHIVE_NAME}"

mkdir -p "${BACKUP_DIR}"

cd "${ROOT_DIR}"

tar -czf "${ARCHIVE_PATH}" \
  --exclude=".git" \
  --exclude=".git/*" \
  --exclude=".env" \
  --exclude=".env.*" \
  --exclude="node_modules" \
  --exclude="node_modules/*" \
  --exclude=".output" \
  --exclude=".output/*" \
  --exclude=".wrangler" \
  --exclude=".wrangler/*" \
  --exclude=".tanstack" \
  --exclude=".tanstack/*" \
  --exclude="logs" \
  --exclude="logs/*" \
  --exclude="*.log" \
  --exclude="*.tar.gz" \
  --exclude="*.zip" \
  --exclude="*.dump" \
  --exclude="*.sql.gz" \
  --exclude="tmp" \
  --exclude="tmp/*" \
  .

cat <<EOF
Backup created successfully:
${ARCHIVE_PATH}
EOF
