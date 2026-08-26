# Auditoria Técnica do Player de Reprodução

## Objetivo

Validar e endurecer a experiência de reprodução de:

- canais ao vivo
- filmes
- séries

com foco em:

- abertura rápida
- reprodução contínua por longos períodos
- estabilidade sob múltiplos usuários simultâneos
- preservação da arquitetura que já estava funcionando

## Resumo Executivo

O sistema já estava com uma base boa para produção:

- proxy de mídia com URL opaca e expiração
- credenciais do servidor escondidas do cliente
- fallback/retry no acesso aos streams
- controle de limite de conexões por usuário
- interface unificada para canais, filmes e séries

Foram feitos reforços para reduzir falhas de sessão longa e acelerar a abertura do conteúdo:

- TTL de reprodução ampliado para 24h
- cache local de playback no catálogo
- prefetch de URL ao focar/hover nos itens
- recuperação HLS mais tolerante
- buffer e latência HLS mais estáveis
- manutenção do identificador do conteúdo em reprodução

## Arquitetura Atual

### Fluxo de reprodução

1. O usuário seleciona o conteúdo no catálogo.
2. O front chama `getPlaybackUrl`.
3. O backend valida acesso, limite e servidor liberado.
4. A URL real do provedor é convertida em uma URL criptografada local.
5. O player consome apenas o endpoint interno `/api/public/stream`.
6. Para HLS, playlists e segmentos são reescritos com novos tokens.

### Onde a reprodução fica forte

- o cliente nunca vê a URL do provedor
- o browser recebe mídia via HTTPS da própria aplicação
- existe retry no proxy de stream
- o player trata HLS com `hls.js` quando necessário

## Achados da Auditoria

### 1. Expiração da URL de playback

**Risco encontrado:** a URL assinada do stream podia expirar cedo demais para sessões longas.

**Impacto:** em canais abertos por muitas horas, a renovação da playlist poderia falhar quando o token expirasse.

**Correção aplicada:**

- TTL do playback aumentado para 24 horas
- mantém validade suficiente para maratonas longas e uso contínuo

### 2. Player HLS pouco tolerante a buffering prolongado

**Risco encontrado:** o player já tinha HLS, mas ainda podia ficar sensível a stalls, waiting e recovery limitado.

**Impacto:** travas intermitentes em streams com jitter, latência ou retomada lenta do provedor.

**Correção aplicada:**

- buffers e limites HLS ajustados
- recovery ampliado para erros de mídia e rede
- eventos de `canplay`, `loadeddata`, `waiting` e `stalled` tratados de forma mais sólida

### 3. Abertura inicial podia parecer lenta

**Risco encontrado:** cada clique sempre forçava ida ao backend antes de abrir o stream.

**Impacto:** sensação de atraso ao trocar canais ou iniciar filmes/séries.

**Correção aplicada:**

- cache de playback por conteúdo
- prefetch ao passar o foco/hover/touch em itens do catálogo

### 4. Informações do conteúdo em reprodução perdiam o ID

**Risco encontrado:** a área de EPG/TMDB usava o ID de carregamento temporário, que era limpo após abrir o stream.

**Impacto:** metadados podiam ficar inconsistentes após o início da reprodução.

**Correção aplicada:**

- o item em reprodução agora preserva `id`, `url`, `name` e `icon`
- a área de info usa o ID real do conteúdo

## Pontos Fortes Mantidos

- proxy de mídia criptografado
- proteção contra vazamento de credenciais do provedor
- validação de acesso por usuário/servidor
- controle de conexões simultâneas
- compatibilidade com canais, filmes e séries no mesmo catálogo

## Verificações Feitas

- build de produção concluído com sucesso
- reinício do processo PM2 realizado com sucesso
- endpoint público respondeu `HTTP 200`

## Limitações Reais de Teste

Nem todo problema de IPTV pode ser reproduzido só no código.

O que ainda depende de ambiente real:

- qualidade e estabilidade do DNS do provedor
- disponibilidade do servidor Xtream original
- carga simultânea real com muitos usuários assistindo ao mesmo tempo
- comportamento específico de cada browser/Smart TV

## Recomendação de Produção

Para operação mais estável:

1. manter o proxy de stream no mesmo domínio da aplicação
2. usar TTL longo para sessões de reprodução
3. monitorar erros HLS no log do player
4. testar pelo menos:
   - um canal ao vivo
   - um filme
   - uma série com vários episódios
   - um acesso em Smart TV/controle remoto
5. validar o limite simultâneo com múltiplos dispositivos

## Conclusão

O player ficou mais pronto para uso contínuo e concorrente.

Hoje ele está mais preparado para:

- abrir mais rápido
- resistir melhor a falhas momentâneas do stream
- sustentar sessões longas
- preservar a arquitetura segura do proxy

O gargalo que sempre pode continuar existindo é externo:

- qualidade do provedor IPTV
- disponibilidade dos DNS
- estabilidade da infraestrutura de origem

Mesmo assim, a camada da aplicação agora está bem mais robusta para operar em produção.

