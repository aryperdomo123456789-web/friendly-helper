# Varredura Fina - Deploy Seguro

Este arquivo separa o que e novidade segura para portar para producao do que ja esta consolidado e nao deve ser mexido sem motivo.

## Novidades seguras para levar

### Banco de dados

- `deploy/sql/01-schema.sql`
  - adiciona origem da indicacao em `profiles`
  - cria `notifications`
  - inclui indices, grants e policies novos
  - preserva o resto do schema base

- `deploy/sql/02-dados-base.sql`
  - define a base oficial de planos, servidores, credenciais e links
  - deve ser usado como fonte de bootstrap
  - se o banco ja esta em producao, rode somente com intencao clara de sincronizar a base

### Seed e usuarios

- `deploy/seed/users.json`
- `deploy/seed/seed-users.mjs`
  - recria dono, usuarios, papeis e acessos
  - sincroniza referencias de indicacao
  - deve ser executado somente com `SUPABASE_SERVICE_ROLE_KEY`

### Infraestrutura

- `deploy/ecosystem.config.cjs`
  - trava `HOST=127.0.0.1`
  - trava `PORT=6873`
  - e seguro para o app atual

- `deploy/nginx.conf`
  - usa apenas `80` e `443` na borda publica
  - faz proxy para `127.0.0.1:6873`
  - nao mexe nas outras vhosts

### Documentacao operacional

- `deploy/CHECKLIST-MIGRACAO-SQL-LINHA-A-LINHA.md`
- `deploy/CHECKLIST-MIGRACAO-SQL-FINAL.md`
- `deploy/DOCUMENTACAO-ESPECIALISTA.md`
- `deploy/MIGRACAO-BACKEND-PROPRIO.md`
- `deploy/ROTEIRO-MIGRACAO-INDICACAO-SMARTTV.md`
- `deploy/AUDITORIA-PLAYER-REPRODUCAO.md`

Esses arquivos sao guias. Nao alteram runtime, mas ajudam a manter o fluxo seguro.

## Ja consolidado e nao mexer sem necessidade

### Player e reproducão

- `src/components/player/VideoPlayer.tsx`
- `src/components/player/Catalog.tsx`
- `src/lib/player.functions.ts`

Esses arquivos ja receberam os ajustes para:

- prefetch de playback
- recovery de HLS
- reproduzir canais, filmes e series com mais resiliencia

### Branding local

- `public/brand/webplayer-brand.png`
- `public/manifest.webmanifest`
- `src/routes/index.tsx`
- `src/routes/__root.tsx`
- `src/routes/_authenticated/route.tsx`
- `src/lib/config.functions.ts`

Esses pontos ja garantem:

- logo local
- favicon local
- independencia do asset remoto

### Fluxo de indicacao

- `src/lib/referral.ts`
- `src/lib/test-links.functions.ts`
- `src/lib/test-flow.functions.ts`
- `src/routes/api/public/mercadopago-webhook.ts`
- `src/lib/account.functions.ts`
- `src/lib/types.ts`

Esses arquivos ja carregam a origem do link e o bonus para o dono correto.

### Suporte e chat

- `src/lib/chat.functions.ts`
- `src/lib/notifications.functions.ts`
- `src/routes/_authenticated/suporte.tsx`

Esses pontos sustentam o chat e a trilha de notificacoes do sistema.

## O que eu considero seguro portar do GitHub para ca

Somente novidades que:

1. nao removam os ajustes acima
2. nao troquem o player atual por um comportamento menos confiavel
3. nao reintroduzam dependencia do logo remoto
4. nao alterem o dono `magodono`
5. nao mexam nas vhosts de outros projetos

## Regra pratica

Se a mudanca:

- melhora doc
- corrige migracao
- reforca seguranca
- reforca notificacao
- reforca indicacao

entao vale portar.

Se a mudanca:

- altera player funcionando
- troca branding local por URL externa
- mexe em nginx global
- recria schema sem validação

entao deve ser revisada antes.

