# Backup e restauração

Este roteiro salva e reconstrói o projeto `stream.mago-bot.com` sem mexer nos outros sites da VPS.

## O que precisa ser salvo

1. Código do app em `/www/wwwroot/stream.mago-bot.com`
2. Arquivo `.env` do app
3. Configuração do PM2
4. Configuração do nginx apenas deste domínio
5. Banco self-hosted do Supabase
6. Arquivos enviados no bucket de suporte, se houver

## Backup do app

```bash
cd /www/wwwroot
tar -czf /root/stream-mago-bot-app-$(date +%F-%H%M).tar.gz stream.mago-bot.com
cp /www/wwwroot/stream.mago-bot.com/.env /root/stream-mago-bot-app.env
pm2 save
```

Se quiser guardar também o estado dos logs:

```bash
tar -czf /root/stream-mago-bot-logs-$(date +%F-%H%M).tar.gz /www/wwwroot/stream.mago-bot.com/logs
```

## Backup do Supabase self-hosted

```bash
cd /www/wwwroot/supabase.mago-bot.com
cp .env /root/supabase-selfhost.env
docker exec -t supabase-db pg_dump -U postgres -d postgres > /root/supabase-db-$(date +%F-%H%M).sql
```

Se você quiser um backup em formato compacto, troque o comando por:

```bash
docker exec -t supabase-db pg_dump -U postgres -d postgres -Fc > /root/supabase-db-$(date +%F-%H%M).dump
```

## Backup do nginx

Salve somente a vhost deste domínio e não altere as outras:

```bash
cp /www/server/panel/vhost/nginx/stream.mago-bot.com.conf /root/stream-mago-bot-nginx.conf
```

## Restauração do app

```bash
cd /www/wwwroot
tar -xzf /root/stream-mago-bot-app-YYYY-MM-DD-HHMM.tar.gz
cp /root/stream-mago-bot-app.env /www/wwwroot/stream.mago-bot.com/.env
cd /www/wwwroot/stream.mago-bot.com
npm install
npm run build:node
pm2 start ecosystem.config.cjs
pm2 save
```

## Restauração do Supabase self-hosted

### Se o backup for SQL

```bash
cd /www/wwwroot/supabase.mago-bot.com
cat /root/supabase-db-YYYY-MM-DD-HHMM.sql | docker exec -i supabase-db psql -U postgres -d postgres
```

### Se o backup for `-Fc`

```bash
docker exec -i supabase-db pg_restore -U postgres -d postgres --clean --if-exists < /root/supabase-db-YYYY-MM-DD-HHMM.dump
```

## Restauração do nginx

```bash
cp /root/stream-mago-bot-nginx.conf /www/server/panel/vhost/nginx/stream.mago-bot.com.conf
nginx -t
systemctl reload nginx
```

## Checklist final

1. `pm2 list` mostra `stream-mago-bot` online
2. `curl -I http://127.0.0.1:6873` responde
3. `https://stream.mago-bot.com` abre sem erro
4. Login com `magodono / magodono123` funciona
5. Login com `magoadm / magodono123` funciona
6. `https://supabase.mago-bot.com` responde
7. O painel do dono carrega `Servidores`, `Usuários` e `Suporte`

## Observação importante

Este projeto já está preparado para usar Node 22 no processo do PM2 via `start-pm2.sh`.
Não volte o processo para Node 20, porque isso reativa o aviso do `@supabase/supabase-js`.
