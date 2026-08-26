# Plano De Implementacao - PM2 Multi-Servico

Atualizado em: 2026-08-14

Este documento traduz o desenho de servicos do plano anterior em uma ordem pratica de criacao.

Objetivo:

- manter o que ja funciona
- extrair fronteiras tecnicas com risco controlado
- permitir reinicio independente por dominio
- preparar o projeto para escala sem dor de cabeca

## 1. Ordem Exata De Criacao Dos Novos Entrypoints

Ordem recomendada:

1. `src/server-main.ts`
2. `src/server-player.ts`
3. `src/server-payments.ts`
4. `src/worker.ts`

### 1.1 Primeiro: `src/server-main.ts`

Motivo:

- e o ponto de entrada mais parecido com o runtime atual
- permite migrar a aplicacao principal sem mudar o comportamento funcional
- preserva UI, shell, autenticacao e rotas ja estaveis

Responsabilidade:

- user UI
- owner UI
- suporte UI
- navegacao
- paginas autenticadas

### 1.2 Segundo: `src/server-player.ts`

Motivo:

- o player e o proxy de stream sao os pontos com maior sensibilidade de carga e falha externa
- separar isso reduz impacto de timeouts, retries e falhas do provider

Responsabilidade:

- `/api/public/stream`
- criptografia do token
- reescrita de playlist
- fallback de media

### 1.3 Terceiro: `src/server-payments.ts`

Motivo:

- webhook e conciliacao devem ter vida propria
- o fluxo financeiro nao deve depender de shell da UI

Responsabilidade:

- preferencia de pagamento
- webhook Mercado Pago
- rastreio financeiro
- comprovante
- auditoria

### 1.4 Quarto: `src/worker.ts`

Motivo:

- tarefas de fundo nao devem disputar ciclo de request com o app principal

Responsabilidade:

- refresh de cache
- notificacoes em massa
- auditoria pesada
- sync e manutencao

## 2. Referencias Reais No Codigo Atual

### App principal

- [src/server.ts](/www/wwwroot/stream.mago-bot.com/src/server.ts)
- [src/start.ts](/www/wwwroot/stream.mago-bot.com/src/start.ts)
- [src/routes/_authenticated/route.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/route.tsx)
- [src/routes/_authenticated/inicio.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/inicio.tsx)
- [src/routes/_authenticated/conta.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/conta.tsx)
- [src/routes/_authenticated/usuarios.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/usuarios.tsx)
- [src/routes/_authenticated/painel.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/painel.tsx)
- [src/routes/_authenticated/suporte.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/suporte.tsx)

### Player / proxy

- [src/routes/api/public/stream.ts](/www/wwwroot/stream.mago-bot.com/src/routes/api/public/stream.ts)
- [src/lib/stream-proxy.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/stream-proxy.server.ts)
- [src/lib/player.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/player.functions.ts)
- [src/lib/iptv-cache.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)

### Pagamentos / webhooks

- [src/routes/api/public/mercadopago-webhook.ts](/www/wwwroot/stream.mago-bot.com/src/routes/api/public/mercadopago-webhook.ts)
- [src/lib/payments.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/payments.functions.ts)
- [src/lib/payments-tracking.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/payments-tracking.functions.ts)

### Worker / background

- [src/lib/notifications.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/notifications.functions.ts)
- [src/lib/owner.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/owner.functions.ts)
- [src/lib/iptv-cache.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [src/lib/test-flow.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/test-flow.functions.ts)

## 3. Modelo De `start-main.sh`

Arquivo sugerido:

- `deploy/pm2/start-main.sh`

Função:

- subir a aplicacao principal

Exemplo:

```bash
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

exec "$NODE_BIN" .output/server/index.mjs
```

Observacao:

- este e o equivalente ao processo atual
- ele preserva o comportamento que ja esta em producao

## 4. Modelo De `start-player.sh`

Arquivo sugerido:

- `deploy/pm2/start-player.sh`

Função:

- subir o runtime dedicado do player / proxy

Exemplo:

```bash
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
```

Observacao:

- esse arquivo so deve ser ativado depois que `src/server-player.ts` e o build separado existirem

## 5. Modelo De `start-payments.sh`

Arquivo sugerido:

- `deploy/pm2/start-payments.sh`

Função:

- subir o runtime dedicado de pagamentos / webhooks

Exemplo:

```bash
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

ENTRY_FILE="${ENTRY_FILE:-.output/payments/index.mjs}"

if [ ! -f "$ENTRY_FILE" ]; then
  echo "Entrada de pagamentos nao encontrada: $ENTRY_FILE" >&2
  exit 1
fi

exec "$NODE_BIN" "$ENTRY_FILE"
```

Observacao:

- esse processo deve servir os webhooks e a conciliacao sem depender da UI

## 6. Modelo De `start-worker.sh`

Arquivo sugerido:

- `deploy/pm2/start-worker.sh`

Função:

- rodar tarefas sem HTTP

Exemplo:

```bash
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

ENTRY_FILE="${ENTRY_FILE:-.output/worker/index.mjs}"

if [ ! -f "$ENTRY_FILE" ]; then
  echo "Entrada do worker nao encontrada: $ENTRY_FILE" >&2
  exit 1
fi

exec "$NODE_BIN" "$ENTRY_FILE"
```

Observacao:

- o worker so faz sentido quando houver rotinas internas fora do ciclo de request

## 7. Ecosystem Multi-Servico

Arquivo sugerido:

- `deploy/pm2/ecosystem.config.cjs`

Exemplo pronto:

```js
module.exports = {
  apps: [
    {
      name: "stream-mago-bot-main",
      script: "./deploy/pm2/start-main.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 6873,
        HOST: "127.0.0.1",
      },
    },
    {
      name: "stream-mago-bot-player",
      script: "./deploy/pm2/start-player.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 6874,
        HOST: "127.0.0.1",
        ENTRY_FILE: ".output/player/index.mjs",
      },
    },
    {
      name: "stream-mago-bot-payments",
      script: "./deploy/pm2/start-payments.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 6875,
        HOST: "127.0.0.1",
        ENTRY_FILE: ".output/payments/index.mjs",
      },
    },
    {
      name: "stream-mago-bot-worker",
      script: "./deploy/pm2/start-worker.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        ENTRY_FILE: ".output/worker/index.mjs",
      },
    },
  ],
};
```

## 8. Sequencia Segura De Implementacao

1. Criar o entrypoint principal e manter a app unica funcionando.
2. Extrair player / proxy para runtime proprio.
3. Extrair pagamentos / webhook para runtime proprio.
4. Extrair worker.
5. Substituir o PM2 unico pelo ecosystem multi-servico.
6. Validar login, player, checkout, suporte e notificacoes.
7. Salvar o PM2.

## 9. Regra De Ouro

Nao mover nada para outro processo antes de:

- existir entrypoint proprio
- existir build proprio
- existir validacao de porta
- existir health check ou evidencia equivalente

Esse documento serve para orientar a migracao sem causar regressao nos fluxos que ja estao perfeitos.
