# Fluxo de Servidores, Cache M3U e Recarga Individual

Atualizado em: 2026-08-16

Este documento descreve o fluxo real do projeto `stream.mago-bot.com` para servidores IPTV, com foco em:

- cadastro de novo servidor
- isolamento total por `server_id`
- download e armazenamento da playlist M3U por servidor
- recarga manual da playlist
- fallback seguro para não quebrar a UI
- aplicação consistente em Canais, Filmes e Séries

O objetivo é deixar o comportamento claro para operação, manutenção e evolução sem embaraçar servidores diferentes entre si.

## 1. Princípio Central

Cada servidor é tratado de forma isolada.

Isso significa:

- um servidor não reaproveita cache de outro servidor
- uma playlist M3U pertence somente ao `server_id` que a originou
- as categorias, streams e metadados são gravados com chave de servidor
- o refresh manual recarrega apenas o servidor acionado

Na prática, a separação é garantida por:

- `iptv_servers.id`
- `server_credentials.server_id`
- `iptv_server_cache.server_id`
- `iptv_server_m3u_cache.server_id`

## 2. O Que Existe Hoje Na Implementação

Hoje o projeto trabalha com armazenamento persistido no banco do ambiente do app, não com arquivo físico na máquina.

As tabelas usadas são:

- `server_credentials`
- `iptv_server_cache`
- `iptv_server_m3u_cache`

Isso entrega:

- persistência por servidor
- baixo custo de leitura depois do primeiro fetch
- suporte a múltiplas conexões simultâneas
- fallback tolerante quando o upstream falha

## 3. Fluxo Completo Ao Cadastrar Um Servidor

Quando o dono cadastra ou edita um servidor no painel:

1. O servidor é salvo em `iptv_servers`.
2. A credencial associada é salva em `server_credentials`.
3. O sistema dispara automaticamente `refreshServerCatalogCache(serverId)`.
4. O worker e o painel passam a usar os caches daquele `server_id`.

Código relacionado:

- [`src/lib/owner.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/owner.functions.ts)
- [`src/lib/iptv-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [`src/lib/iptv-playlist.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-playlist.server.ts)

### 3.1 O que é gravado

O cadastro grava:

- nome do servidor
- status ativo/inativo
- ordem de exibição
- credenciais Xtream
- DNS

### 3.2 O que acontece em seguida

Após salvar, o sistema tenta:

- baixar a playlist M3U do servidor
- parsear o catálogo localmente
- armazenar a playlist bruta em `iptv_server_m3u_cache`
- armazenar os catálogos derivados em `iptv_server_cache`

## 4. Como A Playlist M3U É Baixada

O download da playlist acontece em:

- [`src/lib/iptv-playlist.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-playlist.server.ts)

Fluxo:

1. monta a URL Xtream `get.php`
2. tenta primeiro `output=ts`
3. se falhar, tenta `output=m3u8`
4. valida se a resposta contém `#EXTM3U`
5. gera hash da playlist
6. conta os itens
7. salva o snapshot

### 4.1 O que é salvo

Em `iptv_server_m3u_cache` ficam:

- `server_id`
- `source_url`
- `playlist_text`
- `playlist_hash`
- `item_count`
- `fetched_at`

Esse snapshot é o “espelho local” da playlist daquele servidor dentro da infraestrutura do app.

## 5. Como O Catálogo É Montado

Depois do snapshot M3U, o catálogo é derivado por parsing:

- [`src/lib/iptv-playlist.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-playlist.server.ts)

Ele separa automaticamente:

- `live`
- `movie`
- `series`

Para cada tipo, o parser extrai:

- categorias
- streams
- nome
- imagem
- extensão
- `category_id`

### 5.1 Isolamento do catálogo

O catálogo gerado fica salvo por:

- `server_id`
- `kind`
- `scope`

Isso evita cruzar:

- PORTAL1 com PORTAL2
- canais com filmes
- filmes com séries
- um refresh manual com outro refresh simultâneo

## 6. Fluxo De Leitura Na Tela Do Usuário

As telas do usuário usam a mesma base de servidor, mas cada área pede apenas o que precisa:

- `/canais` usa `kind = live`
- `/filmes` usa `kind = movie`
- `/series` usa `kind = series`

Arquivo principal:

- [`src/components/player/Catalog.tsx`](/www/wwwroot/stream.mago-bot.com/src/components/player/Catalog.tsx)

Serviços usados:

- `getCategories`
- `getStreams`
- `getSeriesInfo`
- `getPlaybackUrl`
- `getChannelEPG`

### 6.1 Regras de carregamento

O carregamento respeita:

- servidor ativo selecionado
- acesso liberado ao usuário
- categoria ativa
- cache válido
- fallback seguro

### 6.2 O que acontece se o cache estiver vazio

Se o cache não tiver dado útil, o sistema:

1. tenta Xtream direto
2. se necessário, tenta a playlist salva
3. se tudo falhar, mostra erro amigável sem derrubar a navegação lateral

## 7. Botão De Recarregar Servidor

Na área administrativa existe o botão de recarga do cache do servidor.

Arquivo:

- [`src/routes/_authenticated/painel.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/painel.tsx)

Servidor:

- [`src/lib/owner.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/owner.functions.ts)

Esse botão chama:

- `refreshServerCache(serverId)`

Que por sua vez chama:

- `refreshServerCatalogCache(serverId)`

### 7.1 Efeito da recarga manual

Quando o botão é usado:

- o cache daquele servidor é recarregado
- apenas o `server_id` acionado é afetado
- a UI invalida queries relacionadas
- o restante dos servidores não é misturado

Na implementação atual, a recarga reprocessa e sobrescreve o snapshot do próprio servidor nas tabelas de cache. Em termos operacionais, o resultado é equivalente a limpar o estado anterior daquele `server_id` e baixar novamente a playlist, sem tocar nos demais servidores.

### 7.2 Comportamento desejado

O fluxo esperado é:

1. apagar a playlist/catálogo antigo daquele servidor
2. baixar novamente a M3U
3. reprocessar categorias e streams
4. gravar tudo de novo para o mesmo `server_id`

Hoje a base já está estruturada para isso por servidor.

## 8. Por Que Isso Não “Embola” Entre Servidores

O isolamento acontece em três camadas:

### 8.1 Camada de credenciais

Cada servidor tem sua própria credencial em `server_credentials`.

### 8.2 Camada de cache

Cada cache é salvo com `server_id` como chave.

### 8.3 Camada de sessão e UI

A sessão do usuário só consulta os servidores liberados para ele.

Arquivos relevantes:

- [`src/lib/player-store.tsx`](/www/wwwroot/stream.mago-bot.com/src/lib/player-store.tsx)
- [`src/lib/player.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/player.functions.ts)

## 9. Fallback Seguro

Se a playlist M3U local não estiver disponível, o sistema preserva a operação com Xtream.

Isso evita:

- tela quebrada
- catálogo zerado por falha temporária
- queda total do player

O fallback está implementado em:

- [`src/lib/iptv-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [`src/lib/player.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/player.functions.ts)

## 10. Papel Do Worker

O worker existe para manter os catálogos atualizados sem depender do clique manual.

Arquivo:

- [`src/worker.ts`](/www/wwwroot/stream.mago-bot.com/src/worker.ts)

O worker:

- lista servidores ativos
- roda `refreshServerCatalogCache(server.id)`
- atualiza um servidor por vez

Isso ajuda a manter a experiência mais rápida e fluida em catálogos grandes.

## 11. Fluxo De Imagens E Mídias

O mesmo conceito de isolamento pode ser aplicado a imagens e outras mídias:

- salvar por servidor
- indexar por chave própria
- nunca reaproveitar asset de outro `server_id`

Hoje as imagens são lidas e exibidas no player, mas o princípio de organização já está alinhado com esse modelo.

Arquivos relacionados:

- [`src/components/player/Catalog.tsx`](/www/wwwroot/stream.mago-bot.com/src/components/player/Catalog.tsx)
- [`src/lib/media-url.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/media-url.ts)
- [`src/routes/api/public/image.ts`](/www/wwwroot/stream.mago-bot.com/src/routes/api/public/image.ts)

## 12. Observação Importante Sobre “Local No Aapanel”

No estado atual, o termo “local” deve ser entendido como:

- local da infraestrutura do app
- persistido no banco usado pela aplicação
- isolado por `server_id`

Se a exigência for salvar em arquivo físico no filesystem do Aapanel para cada servidor, isso é uma evolução separada.

Para essa evolução, seria necessário:

- criar diretórios por `server_id`
- persistir o `.m3u` em disco
- invalidar arquivo + cache ao recarregar
- implementar lock por servidor para evitar concorrência

Hoje o sistema já entrega o isolamento funcional por servidor dentro do stack atual.  
Se a operação exigir cache físico em disco por servidor, isso precisa ser implementado como camada adicional.

## 13. Checklist Operacional

### Cadastro

- [ ] novo servidor salvo em `iptv_servers`
- [ ] credencial salva em `server_credentials`
- [ ] refresh automático executado
- [ ] cache salvo para o mesmo `server_id`

### Recarga manual

- [ ] botão de recarregar acionado
- [ ] cache do servidor removido/atualizado
- [ ] playlist baixada novamente
- [ ] catálogo reprocessado

### Segurança de isolamento

- [ ] PORTAL1 não reaproveita cache de PORTAL2
- [ ] filmes não usam cache de canais
- [ ] séries não usam cache de live
- [ ] refresh de um servidor não derruba os demais

### Operação

- [ ] worker ativo
- [ ] PM2 com os 4 serviços online
- [ ] sem erro de fetch no proxy de stream
- [ ] player abrindo conteúdos sem mesclar servidores

## 14. Arquivos-Chave Para Este Fluxo

- [`src/lib/owner.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/owner.functions.ts)
- [`src/lib/iptv-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [`src/lib/iptv-playlist.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-playlist.server.ts)
- [`src/lib/player.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/player.functions.ts)
- [`src/lib/player-store.tsx`](/www/wwwroot/stream.mago-bot.com/src/lib/player-store.tsx)
- [`src/routes/_authenticated/painel.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/painel.tsx)
- [`src/routes/_authenticated/canais.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/canais.tsx)
- [`src/routes/_authenticated/filmes.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/filmes.tsx)
- [`src/routes/_authenticated/series.tsx`](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/series.tsx)

## 15. Resumo Executivo

O fluxo ideal do projeto é:

- cadastra servidor
- baixa M3U daquele servidor
- grava snapshot isolado por `server_id`
- reprocessa catálogo
- mantém recarga manual por servidor
- preserva fallback seguro
- não mistura servidores

Esse é o desenho que sustenta velocidade, fluidez e estabilidade em ambientes com muitos servidores e múltiplas conexões.
