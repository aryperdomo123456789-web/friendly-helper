# Deploy no aaPanel / VPS com PM2

Guia completo para tirar o WebPlayer da Lovable e rodar 100% no seu servidor.

## 1. Requisitos no servidor

- Node.js 20+ (aaPanel → App Store → Node.js Version Manager)
- PM2 (`npm i -g pm2`)
- Nginx (já vem no aaPanel)
- Certificado SSL (Let's Encrypt pelo aaPanel) — **obrigatório**

## 2. Build de produção (target Node, não Cloudflare)

```bash
git clone <seu-repo> /www/wwwroot/webplayer
cd /www/wwwroot/webplayer
npm i -g bun            # ou use npm/pnpm
bun install
NITRO_PRESET=node_server bun run build     # gera .output/server/index.mjs
```

## 3. Variáveis de ambiente

Crie `/www/wwwroot/webplayer/.env.production` (chmod 600, dono do site):

```
NODE_ENV=production
HOST=127.0.0.1
PORT=3000

# Banco/Auth (Supabase self-host ou cloud)
SUPABASE_URL=https://...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # NUNCA exponha, NUNCA prefixe com VITE_
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=...

# Chave que cifra as URLs de mídia (AES-256-GCM). Gere uma única vez:
#   openssl rand -hex 32
STREAM_PROXY_SECRET=...
```

Regras: nada de `VITE_` para segredos (tudo `VITE_` vai para o navegador).
`chmod 600 .env.production` e `chown` para o usuário do site.

## 4. PM2

```bash
mkdir -p logs
pm2 start ecosystem.config.cjs --env production --update-env
pm2 save
pm2 startup            # habilita boot automático
pm2 logs webplayer
```

## 5. Nginx (aaPanel → Site → Configuração)

O bloco abaixo é o que faz canais/filmes/séries rodarem lisos: buffering
desligado no proxy de mídia (streaming ao vivo não pode ser bufferizado) e
timeouts longos.

```nginx
location /api/public/stream {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    proxy_buffering off;          # essencial para HLS/live
    proxy_request_buffering off;
    proxy_cache off;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    chunked_transfer_encoding on;
    add_header Cache-Control "no-store" always;
}

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 120s;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}

# Cabeçalhos de segurança do site
add_header Referrer-Policy "no-referrer" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 6. Firewall

- Libere só 80/443 para o mundo. A porta 3000 fica **apenas** em 127.0.0.1.
- Nunca exponha o Node direto na internet.

## 7. Atualização

```bash
cd /www/wwwroot/webplayer && git pull
bun install && NITRO_PRESET=node_server bun run build
pm2 reload webplayer      # reload sem downtime
```

## 8. Como as credenciais dos servidores IPTV ficam protegidas

- DNS, usuário e senha dos painéis vivem só na tabela `server_credentials`,
  lida exclusivamente por código de servidor (service role). Nenhuma rota,
  nenhum server function e nenhuma resposta JSON devolve esses campos.
- O player nunca recebe a URL real do painel. Ele recebe
  `/api/public/stream?s=<ciphertext AES-256-GCM>`, cifrado com
  `STREAM_PROXY_SECRET`. Sem essa chave (que fica no servidor) o token é
  matematicamente inútil.
- As playlists `.m3u8` são reescritas: cada segmento e cada chave AES também
  saem cifrados. Nenhuma linha do manifest expõe o host do painel.
- Cada token tem validade (6h) e carrega o id do usuário. Token alterado quebra
  a tag de autenticação do GCM → 403. Token vencido → 403.
- Respostas de erro nunca ecoam a URL ou o corpo do upstream.
- Tudo com `Cache-Control: no-store` + `Referrer-Policy: no-referrer`, então
  nem CDN, nem proxy, nem histórico guardam a mídia.
- O que um sniffer no cliente enxerga: seu próprio domínio HTTPS e blobs
  opacos. Nada aproveitável em outro app IPTV.

Se o `STREAM_PROXY_SECRET` for trocado, os tokens em circulação morrem na hora
(útil se você suspeitar de vazamento) — é só reiniciar: `pm2 reload webplayer`.
