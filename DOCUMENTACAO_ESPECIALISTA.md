# Documentação Especialista - MAGOPLAYERPRO IPTV v2.0 (High Performance & Security)

Este documento detalha a arquitetura, segurança, e lógica de negócios do sistema MAGOPLAYERPRO IPTV, projetado para alta escalabilidade e implantação em servidores dedicados (Ubuntu 22/aaPanel).

## 1. Arquitetura do Sistema

O projeto utiliza a stack **TanStack Start (v1)**, que combina o poder do React 19 com funções de servidor (Server Functions) e roteamento de alto desempenho.

### Componentes Principais:
- **Frontend:** React 19 + Tailwind CSS v4 + Shadcn UI.
- **Gerenciamento de Estado:** TanStack Query para cache de APIs e Context API para sessões.
- **Backend (Server Functions):** Localizado em `src/lib/*.functions.ts`. Executa lógica privilegiada sem expor credenciais ao cliente.
- **Proxy de Stream:** `src/routes/api/public/stream.ts` + `src/lib/stream-proxy.server.ts`.
- **Banco de Dados:** PostgreSQL via Supabase (gerenciado via Lovable Cloud).

## 2. Lógica de Segurança e Fluxo de Dados

### 2.1 Proteção de Credenciais IPTV (Zero-Exposure)
A lógica XTREAM reside exclusivamente no servidor (`xtream.server.ts`). 
1. O cliente solicita uma categoria/stream enviando apenas o `serverId` (UUID).
2. O servidor recupera as credenciais (DNS/User/Pass) do banco usando `supabaseAdmin`.
3. A chamada à API IPTV é feita do servidor para o servidor IPTV.
4. O resultado é filtrado e retornado ao cliente. 
**Resultado:** O navegador do usuário final nunca vê o domínio ou a senha do servidor IPTV original.

### 2.2 Criptografia de Streams (AES-256-GCM)
Para evitar que "sniffer de rede" ou ferramentas de inspeção descubram a origem do conteúdo:
- Toda URL de vídeo é criptografada usando **AES-256-GCM** com uma chave mestra (`STREAM_PROXY_SECRET`).
- O token gerado inclui: URL original, tempo de expiração (TTL) e ID do usuário.
- O endpoint `api/public/stream` descriptografa o token, valida a integridade (Auth Tag) e faz o streaming binário para o player.

### 2.3 Controle de Conexões Simultâneas
- **Mecanismo:** Cada dispositivo gera um `wp_device_id` persistente no LocalStorage.
- **Heartbeat:** A cada 60 segundos, o cliente envia um "pulso" ao servidor.
- **Validação:** Antes de iniciar qualquer vídeo, o servidor conta as sessões ativas nos últimos 3 minutos. Se exceder o `max_connections` do perfil, a reprodução é negada.

## 3. Integrações Inteligentes

- **EPG (Guia de TV):** Integração com XMLTV externo e cache de curto prazo. Decodifica automaticamente metadados em Base64 vindos de servidores Xtream.
- **TMDB:** Enriquecimento automático de filmes e séries. O sistema limpa tags de nomes (ex: [4K], (2024)) para garantir alta precisão na busca de posters e sinopses em Português.

## 4. Auditoria de Segurança e Bugs (Relatório)

### Itens Auditados:
1. **Injeção de SQL:** Protegido pelo uso de RLS (Row Level Security) e PostgREST.
2. **Exposição de Segredos:** Verificado. Nenhuma chave de API ou segredo de criptografia é vazado para o bundle cliente.
3. **Cross-Site Request Forgery (CSRF):** Protegido pelo `csrfMiddleware` configurado em `src/start.ts`.
4. **Mixed Content (SSL):** Resolvido via Proxy de Stream (converte fluxos HTTP em HTTPS através do servidor do app).

### Otimizações Realizadas:
- Redução do tempo de limpeza de sessões mortas de 5 para 3 minutos para liberar telas mais rápido.
- Implementação de `staleTime` agressivo no TanStack Query para evitar requisições desnecessárias ao servidor IPTV.

## 5. Deployment (VPS / aaPanel)

### Requisitos:
- Node.js 20+
- PM2 (Process Manager)
- Nginx (Configurado como Proxy Reverso)

### Comandos:
```bash
# Build
NITRO_PRESET=node_server npm run build

# Start com PM2
pm2 start ecosystem.config.cjs
```

---
*Documentação gerada para uso técnico e suporte de infraestrutura.*
