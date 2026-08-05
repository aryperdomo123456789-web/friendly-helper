# CODEX RESTAURAR

Este arquivo é o ponto de entrada para restaurar o backend próprio deste projeto sem embolar com outros projetos do servidor.

## Objetivo

Subir e manter o projeto em produção em:

- `stream.mago-bot.com`
- processo `PM2`
- porta interna `6873`
- proxy reverso `Nginx` apontando para `127.0.0.1:6873`

## Ordem correta de execução

1. `deploy/sql/01-schema.sql`
2. `deploy/sql/02-dados-base.sql`
3. `deploy/seed/users.json`
4. `deploy/seed/seed-users.mjs`
5. `npm run build:node`
6. `pm2 start ecosystem.config.cjs`
7. `pm2 save`
8. ajuste de `Nginx` apenas para o domínio `stream.mago-bot.com`

## Arquivos-chave

### `deploy/sql/01-schema.sql`

Cria a base estrutural do Supabase:

- enum `app_role`
- 12 tabelas do app
- índices
- função `has_role`
- triggers de atualização
- `GRANTs`
- RLS
- policies
- bucket de anexos do suporte `chat-files-v2`

### `deploy/sql/02-dados-base.sql`

Semeia os dados principais:

- configuração global
- tema
- TMDB
- EPG
- 5 planos
- 4 servidores
- 6 DNS / credenciais
- 2 links de indicação / teste

### `deploy/seed/users.json`

Define os usuários que devem existir no backend:

- dono `magodono`
- senha `magodono123`
- demais usuários
- papéis
- acessos por servidor
- vínculos de indicação

### `deploy/seed/seed-users.mjs`

Script de seed idempotente para:

- criar usuários em `auth.users`
- atualizar `profiles`
- sincronizar `user_roles`
- sincronizar `user_server_access`
- ajustar vínculos de indicação

### `deploy/MIGRACAO-BACKEND-PROPRIO.md`

Guia de migração com:

- criação do projeto Supabase
- variáveis de ambiente
- execução dos SQLs
- seed
- build
- PM2
- Nginx
- webhook do Mercado Pago
- função de notificação do Mercado Pago via `notification_url` + webhook `/api/public/mercadopago-webhook`

### `DEPLOY-AAPANEL.md`

Atalho curto para o guia principal de migração.

## Funções novas de notificação

O sistema agora possui dois fluxos de notificação:

- **Notificações internas do app**:
  - `src/lib/notifications.functions.ts`
  - barra superior com leitura individual de avisos
  - envio em massa pelo painel do dono
- **Notificação do Mercado Pago**:
  - `src/lib/payments.functions.ts`
  - `src/routes/api/public/mercadopago-webhook.ts`

O fluxo do Mercado Pago envia `notification_url` e processa a confirmação no webhook público, mantendo a ativação do plano e os bônus de indicação.

## Observações de produção

- Não alterar as vhosts de `80` e `443` de outros projetos.
- O app deve responder sempre via `127.0.0.1:6873` no backend.
- O domínio público continua sendo `https://stream.mago-bot.com`.
- O código já está preparado para ler o host real da requisição e ajustar a config em runtime.

## Acesso inicial

- usuário: `magodono`
- senha: `magodono123`

## Backup e restauração

Se quiser salvar e reconstruir o ambiente inteiro depois, use:

- [`BACKUP-RESTAURACAO.md`](/www/wwwroot/stream.mago-bot.com/BACKUP-RESTAURACAO.md)

## Quando iniciar uma nova sessão

Se o contexto estiver perdido, abra este arquivo primeiro e siga a ordem acima.
