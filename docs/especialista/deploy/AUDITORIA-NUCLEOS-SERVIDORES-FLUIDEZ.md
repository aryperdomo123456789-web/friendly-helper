# Auditoria Completa: Núcleos, Servidores e Fluidez

Atualizado em: 2026-08-16

Este documento registra o estado real do `stream.mago-bot.com` com foco em:

- troca de servidor sem embolar
- navegação entre abas leve e instantânea
- isolamento por `server_id`
- refresh de M3U apenas no servidor ativo
- separação por núcleos para cada área do sistema

## 1. Objetivo Da Auditoria

O objetivo é manter o sistema:

- rápido
- fluido
- isolado por servidor
- previsível em múltiplas conexões
- sem mistura entre usuários ou servidores

## 2. O Que Já Está Em Produção

### 2.1 PM2 separado por função

O projeto já roda com 4 processos PM2:

- `stream-mago-bot`
- `stream-mago-bot-player`
- `stream-mago-bot-payments`
- `stream-mago-bot-worker`

Responsabilidade de cada um:

- `stream-mago-bot`: shell principal, rotas do usuário e do dono
- `stream-mago-bot-player`: playback e proxy de stream
- `stream-mago-bot-payments`: webhooks e pagamentos
- `stream-mago-bot-worker`: refresh e manutenção em background

Referência:

- [`deploy/pm2/ecosystem.config.cjs`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/ecosystem.config.cjs)

### 2.2 Servidor ativo por `server_id`

Cada servidor é identificado por `server_id`.

Isso já é a fronteira principal do sistema.

Arquivos centrais:

- [`src/lib/player-store.tsx`](/www/wwwroot/stream.mago-bot.com/src/lib/player-store.tsx)
- [`src/routes/_authenticated/servidores.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/servidores.tsx)

### 2.3 Troca de servidor sem reaproveitar estado antigo

A troca de servidor já está protegida para não manter catálogo velho na tela.

O comportamento atual faz:

- grava o novo `server_id`
- limpa queries do servidor anterior
- desmonta e remonta o catálogo por servidor
- evita exibir dados antigos no novo contexto

Arquivos envolvidos:

- [`src/lib/player-store.tsx`](/www/wwwroot/stream.mago-bot.com/src/lib/player-store.tsx)
- [`src/components/player/Catalog.tsx`](/www/wwwroot/stream.mago-bot.com/src/components/player/Catalog.tsx)
- [`src/routes/_authenticated/canais.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/canais.tsx)
- [`src/routes/_authenticated/filmes.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/filmes.tsx)
- [`src/routes/_authenticated/series.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/series.tsx)

### 2.4 Cache local por servidor

O sistema já grava cache local isolado por servidor.

Hoje ele está operando em:

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/
```

O fallback legado ainda é aceito para segurança durante a migração.

Arquivos:

- [`src/lib/server-filesystem-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/server-filesystem-cache.server.ts)
- [`src/lib/server-media-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/server-media-cache.server.ts)
- [`src/lib/iptv-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)

### 2.5 Botão de recarregar M3U

O refresh do dono já atua no servidor selecionado:

1. limpa o cache local daquele `server_id`
2. baixa a M3U novamente
3. reconstrói canais, filmes e séries
4. grava tudo só naquele servidor

Arquivos:

- [`src/lib/owner.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/owner.functions.ts)
- [`src/routes/_authenticated/painel.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/painel.tsx)

### 2.6 Worker em background

O worker já faz refresh periódico dos servidores ativos.

Arquivo:

- [`src/worker.ts`](/www/wwwroot/stream.mago-bot.com/src/worker.ts)

## 3. Auditoria Da Fluidez Das Abas

### 3.1 O que importa para ficar leve

A navegação só fica instantânea se:

- a aba mudar sem recarregar tudo
- o catálogo antigo não for reaproveitado
- a troca de servidor limpar o contexto anterior
- os dados já estiverem pré-carregados quando possível

### 3.2 Estado atual

Hoje a interface já segue esse padrão:

- shell principal persistente
- aba ativa destacada
- páginas de catálogo remountadas por `server_id`
- queries do servidor anterior descartadas

### 3.3 Resultado prático

Isso evita:

- canal velho aparecendo no servidor novo
- lista antiga “grudando” na troca de aba
- mistura entre PORTAL1 e PORTAL2
- atraso visual causado por reutilização indevida de cache

## 4. Auditoria Do Isolamento Por Núcleo

### 4.1 Núcleo do usuário

Responsável por:

- Início
- TV ao Vivo
- Filmes
- Séries
- Servidores
- Conta

Regra:

- o usuário só vê o que pertence ao próprio acesso

### 4.2 Núcleo dos servidores

Responsável por:

- cadastro
- edição
- troca ativa
- recarga manual
- isolamento de M3U

Regra:

- cada servidor precisa permanecer independente

### 4.3 Núcleo do player

Responsável por:

- playback
- proxy
- URL segura
- mídia fluida

Regra:

- o player não deve herdar contexto errado de outro servidor

### 4.4 Núcleo do dono

Responsável por:

- gerenciar servidores
- recarregar M3U
- liberar usuário
- auditar operação

Regra:

- uma ação no servidor A não pode afetar o servidor B

### 4.5 Núcleo do worker

Responsável por:

- refresh automático
- sincronização de cache
- manutenção

Regra:

- nunca travar a UI principal

## 5. O Que Já Está Seguro

- servidor trocado pelo usuário não misturando dados anteriores
- cache local por servidor
- refresh individual
- fallback em banco e Xtream
- PM2 segmentado
- build de produção já validado

## 6. Pontos Que Merecem Atenção

### 6.1 Migração de cache antigo

Existe suporte ao caminho legado durante a transição.

Isso é bom para estabilidade, mas o objetivo final é ficar só na árvore nova por `server_id`.

### 6.2 Catálogos grandes

Em catálogos grandes, a fluidez depende de:

- paginação
- memoização de cards
- pré-carregamento só do que está visível
- descarte de estado antigo na troca de servidor

### 6.3 Realtime

Realtime é útil quando invalida só o que mudou.

Se usado de forma excessiva, pode gerar ruído visual.

O que já está correto:

- invalidar por escopo
- não invalidar tudo sem necessidade

## 7. Estado Real Das Navegações

### 7.1 Aba Início

- shell preservado
- conteúdo isolado
- sem mistura de servidor

### 7.2 Aba TV ao Vivo

- catálogos separados
- mudança de servidor limpa
- player continua na lateral

### 7.3 Aba Filmes

- paginação e busca independentes
- catálogos por servidor

### 7.4 Aba Séries

- séries e episódios isolados
- troca de servidor sem reaproveitar temporada antiga

## 8. O Que Já Foi Feito E Deve Ser Mantido

- `server_id` como chave de tudo
- pasta local por servidor
- refresh manual no servidor ativo
- cache local por servidor
- remount do catálogo ao trocar servidor
- PM2 separado por domínio
- fallback seguro para banco/Xtream

## 9. O Que Ainda Pode Evoluir

- migrar de forma definitiva toda a camada legada para o caminho final sem fallback
- documentar um manual de operação para o dono com 1 tela por ação
- consolidar mais validações automáticas do refresh em produção

## 10. Checklist De Auditoria Final

- [x] trocar de servidor não mistura catálogo
- [x] cada servidor tem seu `server_id`
- [x] cache local é isolado por servidor
- [x] refresh manual atua no servidor ativo
- [x] PM2 está separado por função
- [x] catálogos grandes têm paginação e melhora de fluidez
- [x] o player continua independente do shell do catálogo
- [x] existe fallback seguro para o fluxo legado

## 11. Resumo Executivo

O sistema já está estruturado para não embolar entre servidores.

O que sustenta isso hoje:

- `server_id` como fronteira
- cache local por servidor
- reset de estado ao trocar servidor
- remount por servidor
- refresh manual isolado
- processos PM2 separados

Se quiser ver isso em uma frase:

> cada núcleo faz só o seu trabalho, cada servidor vive na sua própria pasta, e a troca de aba ou de servidor não deve carregar lixo do contexto anterior.

## 12. Ajustes Aplicados Em Produção Em 2026-08-16

- cache curto de `resolveAccess` por `user_id + server_id`
- deduplicação de resoluções concorrentes do mesmo servidor
- remoção do aquecimento automático em lote de todos os servidores
- manutenção apenas do warm-up por intenção e do servidor ativo
- blindagem de headers hop-by-hop no proxy interno de stream
- limpeza de headers hop-by-hop no servidor fetch genérico
- build validado e `pm2 restart` aplicado nos quatro processos do projeto

### Resultado esperado agora

- menos roundtrips repetidos para a mesma combinação usuário/servidor
- menos pressão de background sobre servidores que o usuário não abriu
- menor chance de erro `invalid connection header`
- troca de servidor mais fluida e sem aquecimento em cascata
