# Migração do backend próprio

Este guia leva o projeto do Lovable para um backend próprio em Supabase, com o app rodando em `stream.mago-bot.com` via PM2 na porta `6873`.

## 1. Criar o projeto Supabase

1. Crie um projeto novo no Supabase.
2. Anote estes valores no painel:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. O projeto deste repositório foi preparado para o domínio `stream.mago-bot.com`.

## 2. Rodar o schema

Abra o SQL Editor do Supabase e execute, nesta ordem:

1. `deploy/sql/01-schema.sql`
2. `deploy/sql/02-dados-base.sql`

Esses arquivos criam:

- `app_role`
- as 12 tabelas usadas pelo app
- índices
- `has_role`
- triggers de `updated_at`
- grants
- RLS + policies
- bucket `chat-files-v2`
- dados iniciais de config, planos, servidores, credenciais e links de teste

## 3. Seed de usuários

O arquivo `deploy/seed/users.json` recria os usuários conhecidos do Lovable, incluindo:

- dono `magodono`
- senha do dono `magodono123`
- perfis
- papéis
- acessos por servidor
- vínculos de indicação

### Rodar o seed

Na raiz do projeto:

```bash
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
node deploy/seed-users.mjs
```

Se preferir, coloque as variáveis no `.env` da raiz.

## 4. Variáveis de ambiente

Garanta um `.env` na raiz com no mínimo:

```env
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
STREAM_PROXY_SECRET=...
```

Se usar Mercado Pago, configure também:

```env
MP_ACCESS_TOKEN=...
MP_PUBLIC_KEY=...
```

## 5. Build e PM2

```bash
npm install
npm run build:node
pm2 start ecosystem.config.cjs
pm2 save
```

O processo já fica configurado para:

- `HOST=127.0.0.1`
- `PORT=6873`

## 6. Nginx / aaPanel

Mantenha o proxy reverso apontando para:

```text
http://127.0.0.1:6873
```

Para `stream.mago-bot.com`, use as portas públicas `80` e `443` apenas como entrada do nginx.

Se já existir outro projeto no servidor, não altere as outras vhosts. Edite somente a configuração deste domínio.

## 7. Webhook Mercado Pago

Configure no painel do Mercado Pago a URL:

```text
https://stream.mago-bot.com/api/public/mercadopago-webhook
```

O projeto já injeta automaticamente essa URL como `notification_url` em `src/lib/payments.functions.ts`, então o webhook só precisa estar acessível no domínio.

## 8. Login do dono

Após o seed, o acesso principal é:

- usuário: `magodono`
- senha: `magodono123`

## 9. Verificação rápida

Depois de subir tudo:

1. Abra `https://stream.mago-bot.com`
2. Faça login com o dono
3. Teste:
   - servidores
   - usuários
   - painel do dono
   - suporte
   - links de teste
