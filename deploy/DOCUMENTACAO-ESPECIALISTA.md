# 📘 Documentação Especialista de Deploy & Configuração

## 🛡️ Segurança Anti-Abuso (Anti-Papateste)
O sistema implementa uma camada rigorosa de proteção contra a geração múltipla de testes gratuitos:
- **Fingerprinting de Dispositivo**: Cada solicitação de teste captura uma identidade única baseada em 6 vetores de hardware e software do navegador.
- **Bloqueio por Identidade**: O backend valida se o fingerprint já consta no banco de dados antes de liberar novas credenciais.
- **Segurança em Indicações**: A proteção de dispositivo é soberana; mesmo usando links de indicação diferentes, um mesmo aparelho só consegue gerar um teste uma única vez.

---

## 🏗️ 1. Estrutura do Backend (Supabase/PostgreSQL)

O sistema foi desenhado para ser totalmente portável. Toda a lógica de dados reside em um conjunto de tabelas otimizadas com **Row Level Security (RLS)**.

### Tabelas Principais:
1.  `app_config`: Armazena a identidade visual (logo, cores), chaves TMDB, EPG e segredos do Mercado Pago.
2.  `iptv_servers` & `server_credentials`: Gerencia o pool de DNS (DNS Failover) para cada servidor IPTV.
3.  `profiles`: Extensão da tabela de autenticação, controlando expiração, conexões simultâneas e indicações.
4.  `user_roles`: Gerenciamento de privilégios (`admin`, `owner`, `user`).
5.  `support_threads` & `notifications`: Sistema de chat persistente (Protocolos `SUP-YYYYMMDD-XXXX`), alertas em massa e controle de expiração.
6.  `support_messages`: Histórico persistente de mensagens com suporte a anexos (via Storage `chat-files-v2`).
7.  `device_sessions`: Controle rígido de multi-conexão por hardware ID.

---

## 💬 1.2 Fluxo de Suporte & Notificações
O sistema de atendimento foi desenhado para escalabilidade e persistência:
- **Bolha de Suporte Global**: Usuários comuns possuem acesso imediato ao suporte através de uma bolha flutuante no canto inferior direito, disponível em todas as abas.
- **Protocolos Únicos**: Cada linha de atendimento gera um protocolo persistente para rastreabilidade.
- **Notificações em Tempo Real**: O sino de notificações alerta sobre expirações (3 dias, 1 dia e no dia do vencimento) e mensagens globais enviadas pelo dono.
- **Isolamento de Conversas**: RLS garante que um usuário só veja suas próprias conversas, enquanto o dono visualiza o pool completo.

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

## 📡 4. DNS Failover, Performance & Hero Carousel
O sistema tenta automaticamente todos os DNS cadastrados em `server_credentials` caso o principal falhe (HTTP 404/Timeout). Para garantir fluidez máxima:
-   O Proxy de Stream utiliza cabeçalhos de VLC e handshake de 60s.
-   O Player HLS está configurado para 25 retentativas de fragmentos.
-   **Isolamento de Usuário**: A seleção de servidor é persistida localmente no navegador (`localStorage`), garantindo que a troca de servidor feita por um usuário seja individual e não afete nenhum outro cliente.
-   **Carrossel TMDB & Busca Inteligente**: O componente `TMDBHeroCarousel` busca tendências mundiais e o botão "ASSISTIR AGORA" navega para `/filmes` ou `/series` enviando o título do conteúdo como parâmetro de busca (`q`). O catálogo, por sua vez, detecta esse parâmetro e realiza uma filtragem automática no servidor IPTV selecionado, garantindo uma transição fluida do marketing (TMDB) para a reprodução real.

---

## 📝 5. Recuperação de Usuários
Caso migre de banco, utilize o script `deploy/seed/seed-users.mjs` junto com o arquivo `users.json` exportado para recriar as contas de autenticação mantendo os IDs vinculados aos perfis.

---

*Documento gerado automaticamente para suporte técnico avançado.*
