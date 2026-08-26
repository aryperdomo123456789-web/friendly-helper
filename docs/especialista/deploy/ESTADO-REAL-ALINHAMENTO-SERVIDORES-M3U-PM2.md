# Estado Real E Alinhamento Do Projeto

Atualizado em: 2026-08-16

Este documento resume, de forma simples e honesta, o que o `stream.mago-bot.com` já faz em produção, o que já está em código mas ainda é uma etapa de evolução, e o que ainda falta para fechar a arquitetura ideal de servidores sem embolar.

## 1. Regra Central

Cada servidor tem:

- seu `server_id`
- seu cache próprio
- seu ciclo próprio de refresh
- sua troca independente na interface

O sistema não deve misturar:

- PORTAL1 com PORTAL2
- canais com filmes
- filmes com séries
- cache local de um servidor com cache local de outro

## 2. O Que Já Está Em Produção

### 2.1 PM2 separado por função

Hoje a produção opera com 4 processos:

- [`stream-mago-bot`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-main.sh)
- [`stream-mago-bot-player`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-player.sh)
- [`stream-mago-bot-payments`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-payments.sh)
- [`stream-mago-bot-worker`](/www/wwwroot/stream.mago-bot.com/deploy/pm2/start-worker.sh)

Isso já está ativo em produção e separado por responsabilidade.

### 2.2 Troca de servidor sem mistura visual

O frontend já foi ajustado para:

- trocar o servidor ativo com isolamento
- não reaproveitar dados antigos ao alternar de servidor
- refazer o carregamento do catálogo por `server_id`

Arquivos relacionados:

- [`src/lib/player-store.tsx`](/www/wwwroot/stream.mago-bot.com/src/lib/player-store.tsx)
- [`src/components/player/Catalog.tsx`](/www/wwwroot/stream.mago-bot.com/src/components/player/Catalog.tsx)
- [`src/routes/_authenticated/canais.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/canais.tsx)
- [`src/routes/_authenticated/filmes.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/filmes.tsx)
- [`src/routes/_authenticated/series.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/series.tsx)

### 2.3 Cache local por servidor já existe no código

O projeto já grava cache local por servidor em filesystem.

Arquivos envolvidos:

- [`src/lib/server-filesystem-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/server-filesystem-cache.server.ts)
- [`src/lib/server-media-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/server-media-cache.server.ts)
- [`src/lib/iptv-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)

O fluxo atual faz:

- leitura local primeiro
- fallback em banco
- fallback em Xtream quando necessário
- escrita local e escrita em banco

### 2.4 Botão de recarregar servidor já apaga e baixa de novo

No painel do dono, o refresh já chama a limpeza local antes de baixar novamente o cache do servidor ativo.

Fluxo:

1. identifica o `server_id`
2. limpa cache local daquele servidor
3. baixa a M3U novamente
4. reconstrói catálogo e mídias daquele servidor

Arquivos relacionados:

- [`src/lib/owner.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/owner.functions.ts)
- [`src/routes/_authenticated/painel.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/painel.tsx)

### 2.5 Imagens e mídia podem usar cache local por servidor

O proxy de imagem já consegue usar cache físico local por servidor.

Arquivos relacionados:

- [`src/routes/api/public/image.ts`](/www/wwwroot/stream.mago-bot.com/src/routes/api/public/image.ts)
- [`src/lib/media-url.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/media-url.ts)

## 3. O Estado Real Do Filesystem

Aqui está a diferença importante entre a proposta e o runtime atual:

### 3.1 Caminho real hoje

O cache local está gravando por padrão em:

```text
/www/wwwroot/stream.mago-bot.com/.storage/server-filesystem-cache/
```

Dentro dele existem diretórios por servidor, locks e mídia local.

### 3.2 Caminho alvo da proposta

A arquitetura desejada para o aaPanel continua sendo:

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/
```

### 3.3 Conclusão prática

Hoje:

- o filesystem local por servidor já existe e está ativo
- mas o caminho físico padrão ainda é `.storage/server-filesystem-cache`
- a migração para `storage/servers/{server_id}` é evolução de organização, não ruptura funcional

## 4. O Que Já Está Em Código E Também Já Foi Levado Para Produção

- cache local por servidor
- lock por servidor para refresh
- limpeza do cache local no refresh manual
- persistência em banco como fallback
- invalidação da interface ao trocar servidor
- remount do catálogo por `server_id`
- worker de refresh dos catálogos
- cache local de imagens

## 5. O Que Ainda Não Está Fechado Como Arquitetura Final

### 5.1 Raiz física final no aaPanel

Ainda falta padronizar, se desejado, o caminho físico final para a pasta:

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/
```

Hoje o sistema já opera com filesystem local, mas o caminho real padrão ainda não é esse.

### 5.2 Separação total sem duplicidade de persistência

Hoje o sistema grava:

- no filesystem local
- no banco

Isso é bom como fallback, mas ainda é uma duplicação proposital.

### 5.3 Consolidação documental final do storage

A documentação da camada física existe, mas ainda pode ser consolidada em uma versão única de operação, caso queira um manual operacional ainda mais direto.

## 6. Objetivos Já Feitos

- servidor separado por `server_id`
- UI sem mistura ao trocar de servidor
- refresh individual do servidor
- cache local por servidor
- player e catálogo mais fluidos
- PM2 dividido por função
- build de produção validado
- processos reiniciados e salvos com `pm2 save`

## 7. Objetivos Ainda Em Aberto

- migrar o caminho físico padrão para a raiz final do aaPanel, se isso for obrigatório para operação
- definir se o banco continua como fallback permanente ou apenas transição
- unificar a documentação operacional final em um único manual de suporte

## 8. Resumo Curto

Se eu resumir o estado real em uma linha:

> o sistema já trabalha com servidor isolado e cache local por servidor, mas o caminho físico padrão ainda está na camada `.storage/server-filesystem-cache`, enquanto a raiz `storage/servers/{server_id}` continua como arquitetura alvo.

## 9. Referências Principais

- [`ARQUITETURA-SERVIDORES-M3U-PM2-ESPECIALISTA.md`](/www/wwwroot/stream.mago-bot.com/ARQUITETURA-SERVIDORES-M3U-PM2-ESPECIALISTA.md)
- [`PROPOSTA-FILESYSTEM-POR-SERVIDOR-AAPANEL.md`](/www/wwwroot/stream.mago-bot.com/PROPOSTA-FILESYSTEM-POR-SERVIDOR-AAPANEL.md)
- [`PLANO-IMPLEMENTACAO-FILESYSTEM-POR-SERVIDOR.md`](/www/wwwroot/stream.mago-bot.com/PLANO-IMPLEMENTACAO-FILESYSTEM-POR-SERVIDOR.md)
- [`PLANO-PM2-NUCLEOS-SERVICOS.md`](/www/wwwroot/stream.mago-bot.com/PLANO-PM2-NUCLEOS-SERVICOS.md)
- [`PLANO-PM2-MULTISERVICO-IMPLEMENTACAO.md`](/www/wwwroot/stream.mago-bot.com/PLANO-PM2-MULTISERVICO-IMPLEMENTACAO.md)

## 10. Atualização de Produção em 2026-08-16

- `resolveAccess` ganhou cache curto e deduplicação por combinação usuário/servidor
- o aquecimento em lote de todos os servidores foi removido
- o warm-up ficou restrito ao servidor ativo e à intenção do usuário
- o proxy público de stream passou a remover headers hop-by-hop antes de encaminhar
- o servidor fetch genérico também passou a limpar headers hop-by-hop
- build final validado e `pm2 restart` executado nos processos:
  - `stream-mago-bot`
  - `stream-mago-bot-player`
  - `stream-mago-bot-payments`
  - `stream-mago-bot-worker`
