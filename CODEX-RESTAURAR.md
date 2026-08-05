# CODEX — Onde estao as coisas para restaurar no aaPanel

Repositorio: https://github.com/aryperdomo123456789-web/friendly-helper

Tudo que o Codex precisa esta na pasta `deploy/`. Nada fica fora dela.

## Mapa dos arquivos

| Arquivo | O que e |
|---|---|
| `deploy/MIGRACAO-BACKEND-PROPRIO.md` | Guia passo a passo completo (ler primeiro) |
| `deploy/sql/01-schema.sql` | Schema completo: enum `app_role`, 12 tabelas, indices, `has_role`, triggers, GRANTs, RLS + policies, bucket de anexos |
| `deploy/sql/02-dados-base.sql` | Dados: config global (tema/TMDB/EPG), 5 planos, 4 servidores (METAPLAY, WOLF TV, ALPHA PLAY, ZEUS PLAY) com 6 DNS/credenciais, 2 links de indicacao com bonus 15/30 dias |
| `deploy/seed/users.json` | Usuarios exportados (dono `magodono` + `teste`) com plano, conexoes e codigo de indicacao |
| `deploy/seed/seed-users.mjs` | Script Node que cria os usuarios em `auth.users` e vincula profiles/papeis/acessos |
| `deploy/ecosystem.config.cjs` | PM2 na porta 6873 (isolado dos outros projetos) |
| `deploy/nginx.conf` | Proxy reverso para `127.0.0.1:6873` com SSL e timeouts de 60s |
| `deploy/instructions.txt` | Comandos SSH resumidos |
| `DEPLOY-AAPANEL.md` | Visao geral do deploy |

## Ordem de execucao

```bash
# 1. clonar no diretorio do site
cd /www/wwwroot/stream.mago-bot.com
git clone https://github.com/aryperdomo123456789-web/friendly-helper .

# 2. no NOVO projeto de backend, rodar no SQL editor (nesta ordem):
#    deploy/sql/01-schema.sql
#    deploy/sql/02-dados-base.sql

# 3. criar .env (a service role key vem do NOVO projeto, nunca commitar)
cat > .env <<'EOF'
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_publishable_key
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
STREAM_PROXY_SECRET=uma_string_aleatoria_longa
EOF

# 4. recriar os usuarios (dono magodono / magodono123)
node deploy/seed/seed-users.mjs

# 5. build + subir
npm ci
npm run build:node
pm2 start deploy/ecosystem.config.cjs
pm2 save

# 6. aplicar deploy/nginx.conf no site do aaPanel e recarregar o nginx
```

## Observacoes

- A service role key do backend antigo (Lovable Cloud) **nao pode ser exportada**. Use a do projeto novo, pega no painel de API do proprio provedor.
- Senhas do `auth.users` sao hash e nao viajam no export: as senhas iniciais estao definidas no `users.json` e podem ser trocadas depois na aba Conta.
- Mercado Pago: adicionar `MERCADOPAGO_ACCESS_TOKEN` no `.env` quando a conta estiver pronta; o webhook fica em `/api/public/mercadopago-webhook`.
