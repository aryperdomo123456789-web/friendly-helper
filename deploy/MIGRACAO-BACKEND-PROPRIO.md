# Migração para backend próprio + aaPanel (Ubuntu 22.04)

Este guia leva **tudo** (schema, dados, dono, usuários, planos, servidores, links de indicação) do ambiente atual para um projeto Supabase **seu**, e depois roda a aplicação no aaPanel via PM2 na porta **6873**.

---

## Parte 1 — Criar o backend próprio

1. Crie um projeto em <https://supabase.com/dashboard> (região São Paulo é a melhor latência).
2. No painel do projeto, vá em **Project Settings → API** e copie:
   - `Project URL` → será `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon / publishable key` → `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (**só no servidor, nunca no frontend**)
3. Em **Authentication → Providers → Email**: deixe **Confirm email = OFF** (o sistema usa e-mails sintéticos `usuario@iptv.local` e confirma pelo admin API).

## Parte 2 — Importar o banco

No **SQL Editor** do seu projeto, rode nesta ordem:

| Ordem | Arquivo | O que faz |
|---|---|---|
| 1 | `deploy/sql/01-schema.sql` | Cria enum `app_role`, todas as tabelas, índices, função `has_role`, triggers, **GRANTs**, RLS + policies e o bucket `chat-files-v2`. |
| 2 | `deploy/sql/02-dados-base.sql` | Insere configuração global (tema, TMDB, EPG), os 5 planos, os 4 servidores IPTV com todas as credenciais/DNS e os 2 links de teste/indicação. |

Ambos são idempotentes — pode rodar novamente sem duplicar nada.

## Parte 3 — Importar os usuários (dono + usuários)

As senhas do `auth` **não são exportáveis** (ficam como hash no Supabase de origem). Por isso os usuários são recriados pelo script, com as senhas definidas em `deploy/seed/users.json`.

```bash
cd /www/wwwroot/stream.mago-bot.com
npm install                       # precisa do @supabase/supabase-js

SUPABASE_URL="https://SEU-PROJETO.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY" \
node deploy/seed/seed-users.mjs
```

O script cria/atualiza:
- usuários em `auth.users` (`magodono@iptv.local`, `teste@iptv.local`)
- `profiles` (plano, validade, limite de conexões, código de indicação)
- `user_roles` (`owner` para o dono, `user` para os demais)
- `user_server_access` (quais servidores cada usuário vê)
- vínculos de indicação (`referred_by_id`) e `created_by` do dono

**Acesso do dono após o seed:** usuário `magodono` / senha `magodono123` — troque em `users.json` antes de rodar, ou pela aba **Conta** depois de logar.

## Parte 4 — Variáveis de ambiente no servidor

Crie `/www/wwwroot/stream.mago-bot.com/.env`:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=service_role_xxx
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
STREAM_PROXY_SECRET=<gere com: openssl rand -hex 32>
NODE_ENV=production
HOST=127.0.0.1
PORT=6873
```

> `STREAM_PROXY_SECRET` é a chave que criptografa as URLs de stream. Gere uma nova e **não** comite.

## Parte 5 — Build e PM2

```bash
cd /www/wwwroot/stream.mago-bot.com
npm install
npm run build:node                      # gera .output/server/index.mjs
pm2 start deploy/ecosystem.config.cjs   # sobe na porta 6873
pm2 save
pm2 logs webplayer --lines 50
```

## Parte 6 — Nginx (aaPanel)

Use `deploy/nginx.conf` como base no arquivo de configuração do site (proxy reverso para `127.0.0.1:6873`, timeouts de 60s+ para o streaming). Depois emita o SSL pelo aaPanel (Let's Encrypt) e recarregue o Nginx.

## Parte 7 — Mercado Pago (quando ativar)

1. Painel do Dono → **Configuração Central** → cole **Access Token** e **Public Key** e ative.
2. No Mercado Pago, cadastre o webhook:
   `https://stream.mago-bot.com/api/public/mercadopago-webhook` (evento `payment`).
3. O crédito de bônus por indicação (+15 dias em plano mensal, +30 em planos maiores) é aplicado automaticamente na aprovação do pagamento.

---

## Checklist final

- [ ] `01-schema.sql` executado sem erro
- [ ] `02-dados-base.sql` executado (5 planos, 4 servidores, 6 DNS, 2 links)
- [ ] `seed-users.mjs` rodado e login `magodono` funcionando
- [ ] `.env` no servidor com as 6 variáveis + `STREAM_PROXY_SECRET`
- [ ] `npm run build:node` + `pm2 start` OK na porta 6873
- [ ] Nginx com proxy e SSL ativos
- [ ] Testado: canais, filmes e séries em cada um dos 4 servidores
