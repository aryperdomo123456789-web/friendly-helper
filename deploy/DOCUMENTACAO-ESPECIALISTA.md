# 📘 Documentação Especialista de Deploy & Configuração

Este documento fornece as diretrizes técnicas necessárias para o Codex ou um administrador de sistemas realizar o deploy do **WebPlayer IPTV** em um ambiente de produção (Ubuntu 22.04 + aaPanel + PM2 + Backend Próprio).

---

## 🏗️ 1. Estrutura do Backend (Supabase/PostgreSQL)

O sistema foi desenhado para ser totalmente portável. Toda a lógica de dados reside em um conjunto de tabelas otimizadas com **Row Level Security (RLS)**.

### Tabelas Principais:
1.  `app_config`: Armazena a identidade visual (logo, cores), chaves TMDB, EPG e segredos do Mercado Pago.
2.  `iptv_servers` & `server_credentials`: Gerencia o pool de DNS (DNS Failover) para cada servidor IPTV.
3.  `profiles`: Extensão da tabela de autenticação, controlando expiração, conexões simultâneas e indicações.
4.  `user_roles`: Gerenciamento de privilégios (`admin`, `owner`, `user`).
5.  `support_threads` & `notifications`: Sistema de chat persistente e alertas em massa/expiração.
6.  `device_sessions`: Controle rígido de multi-conexão por hardware ID.

### Scripts SQL (Localizados em `/deploy/sql`):
-   `01-schema.sql`: Estrutura completa, triggers de auditoria e políticas de segurança.
-   `02-dados-base.sql`: Carga inicial de planos e servidores de exemplo.

---

## 🚀 2. Deploy no aaPanel (Porta 6873)

Para evitar conflitos com outros projetos, o app roda nativamente na porta **6873** via PM2.

### Passo-a-passo SSH:
1.  **Clone o Repositório**: `git clone <url-do-repo> /www/wwwroot/stream.mago-bot.com`
2.  **Instalação**: `npm install && npm run build`
3.  **Configuração PM2**: 
    -   Use o arquivo `deploy/ecosystem.config.cjs`.
    -   Comando: `pm2 start deploy/ecosystem.config.cjs`
4.  **Nginx**: Use o arquivo `deploy/nginx.conf` como modelo no painel do aaPanel para habilitar Proxy Reverso com SSL e suporte a WebSockets/Streams longos.

---

## 🔧 3. Variáveis de Ambiente (.env)

No novo servidor, configure as seguintes variáveis:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-PROTEGIDA
TMDB_API_KEY=56bb2e86749197e89c3dbb878314ea03
PORT=6873
```

---

## 📡 4. DNS Failover & Performance
O sistema tenta automaticamente todos os DNS cadastrados em `server_credentials` caso o principal falhe (HTTP 404/Timeout). Para garantir fluidez máxima:
-   O Proxy de Stream utiliza cabeçalhos de VLC e handshake de 60s.
-   O Player HLS está configurado para 25 retentativas de fragmentos.

---

## 📝 5. Recuperação de Usuários
Caso migre de banco, utilize o script `deploy/seed/seed-users.mjs` junto com o arquivo `users.json` exportado para recriar as contas de autenticação mantendo os IDs vinculados aos perfis.

---
*Documento gerado automaticamente para suporte técnico avançado.*
