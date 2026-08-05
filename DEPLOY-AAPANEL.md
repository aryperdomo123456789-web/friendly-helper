# Deploy no aaPanel / VPS Ubuntu 22.04

Projeto em TanStack Start, pronto para produção na porta **6873** com PM2 + Nginx.

> **Vai usar backend próprio (Supabase seu ou Postgres na VPS)?**
> Siga o guia completo: [`deploy/MIGRACAO-BACKEND-PROPRIO.md`](deploy/MIGRACAO-BACKEND-PROPRIO.md).
> Ele traz os scripts SQL de schema + dados e o seed do dono/usuários.

## Requisitos
- Node.js 18 ou superior
- PM2 (`npm install -g pm2`)
- Um projeto Supabase (o atual ou o seu próprio)

## Arquivos de deploy
| Arquivo | Uso |
|---|---|
| `deploy/MIGRACAO-BACKEND-PROPRIO.md` | Guia passo a passo da migração completa |
| `deploy/sql/01-schema.sql` | Schema: tabelas, índices, RLS, grants, funções, triggers, bucket |
| `deploy/sql/02-dados-base.sql` | Planos, servidores IPTV + DNS, links de indicação, config global |
| `deploy/seed/users.json` | Usuários a recriar (dono + usuários) e suas senhas |
| `deploy/seed/seed-users.mjs` | Cria auth users, profiles, papéis, acessos e indicações |
| `deploy/ecosystem.config.cjs` | PM2 na porta 6873, isolado dos outros apps |
| `deploy/nginx.conf` | Proxy reverso 127.0.0.1:6873 com timeouts de streaming |

## Passos rápidos
```bash
cd /www/wwwroot/stream.mago-bot.com
npm install
npm run build:node
pm2 start deploy/ecosystem.config.cjs && pm2 save
```

## Variáveis de ambiente (`.env` no servidor, nunca no Git)
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `STREAM_PROXY_SECRET`,
`NODE_ENV=production`, `HOST=127.0.0.1`, `PORT=6873`.

## Mercado Pago
1. Painel do Dono → Configuração Central → Access Token + Public Key.
2. Webhook no Mercado Pago: `https://seu-dominio.com/api/public/mercadopago-webhook` (evento `payment`).
3. Bônus por indicação é creditado automaticamente na aprovação do pagamento.

## Dica (Nginx)
O proxy de streaming já roda dentro da aplicação (resolve mixed content HTTP/HTTPS). Garanta apenas timeouts de 60s+ no Nginx.
