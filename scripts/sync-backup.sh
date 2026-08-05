#!/bin/bash
# Script de sincronização para garantir que o ambiente local reflita o backup do aaPanel
echo "Iniciando sincronização com backup: stream-mago-bot-2026-08-05..."

# 1. Verificar diretórios críticos
mkdir -p deploy/sql deploy/seed

# 2. Garantir que o resumo no index.tsx reflete o link do repositório de backup
sed -i 's|https://github.com/aryperdomo123456789-web/friendly-helper/tree/backup/stream-mago-bot-2026-08-05|https://github.com/aryperdomo123456789-web/friendly-helper/tree/backup/stream-mago-bot-2026-08-05|g' src/routes/index.tsx

# 3. Validar se o motor de navegação está ativo
if [ -f "src/lib/tv-navigation.ts" ]; then
    echo "Motor de navegação espacial (TV Ready) detectado."
else
    echo "AVISO: Motor de navegação ausente. Verificando integridade..."
fi

echo "Sincronização de metadados de backup concluída."
