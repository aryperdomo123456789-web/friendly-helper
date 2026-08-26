# Cobertura Final Por Tela - Catalogo E Play

Atualizado em: 2026-08-14

Este documento consolida a cobertura real do catalogo do player por tela, com foco em:

- confirmar o que ja usa cache local por servidor
- mostrar onde o fallback legado ainda existe
- evitar mexer em fluxos que ja estavam funcionando
- servir como referencia rapida de operacao e manutencao

## 1. Resumo Executivo

O catalogo do player ficou coberto por cache local por servidor nas tres telas principais:

- `TV ao Vivo`
- `Filmes`
- `Séries`

Essas telas usam o mesmo componente de catalogo e agora passam a ler:

1. cache local derivado da M3U por servidor
2. cache parsed interno de catalogo
3. fallback Xtream legado quando a playlist local nao estiver disponivel

Isso reduz falhas intermitentes sem mudar o comportamento esperado do usuario final.

## 2. Mapa Por Tela

| Tela | Rota | Função usada | Cache local ativo | Fallback legado disponível | Risco residual |
|---|---|---|---|---|---|
| TV ao Vivo | `/canais` | `Catalog kind="live"` | Sim, via `iptv_server_m3u_cache` e `iptv_server_cache` | Sim, via Xtream | Baixo, depende da disponibilidade da playlist ou da API do servidor |
| Filmes | `/filmes` | `Catalog kind="movie"` | Sim, via `iptv_server_m3u_cache` e `iptv_server_cache` | Sim, via Xtream | Baixo, principalmente em servidores sem M3U valida ou sem retorno de VOD |
| Séries | `/series` | `Catalog kind="series"` | Sim, via `iptv_server_m3u_cache` e `iptv_server_cache` | Sim, via Xtream | Baixo, com possível dependência do endpoint `get_series_info` para detalhe por temporada |

## 3. Fluxo Tecnico Real

### 3.1 Entrada do catalogo

As tres telas acima chamam o mesmo componente:

- [src/components/player/Catalog.tsx](/www/wwwroot/stream.mago-bot.com/src/components/player/Catalog.tsx)

Esse componente consome:

- `getCategories`
- `getStreams`
- `getSeriesInfo`
- `getChannelEPG`
- `getPlaybackUrl`

### 3.2 Camadas de leitura agora existentes

O fluxo de dados segue esta ordem:

1. leitura do cache de catalogo por servidor
2. leitura do cache da M3U local
3. tentativa Xtream direta
4. fallback para o cache ja salvo quando a fonte upstream falha

### 3.3 O que ficou coberto pelo cache local

Ficaram cobertos por cache local de M3U:

- lista de categorias
- lista de streams por categoria
- bootstrap do catalogo por servidor

## 4. O Que Ainda Nao E Cache M3U

Esses fluxos continuam fora do cache bruto da playlist, por desenho:

- `getPlaybackUrl`
- `getChannelEPG`
- `getSeriesInfo`
- `getVodInfo`

Eles continuam com cache próprio e fallback legado, mas nao dependem diretamente da M3U salva para reproduzir o conteudo.

## 5. Arquivos-Chave

- [src/lib/iptv-playlist.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-playlist.server.ts)
- [src/lib/iptv-cache.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [src/lib/player.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/player.functions.ts)
- [src/lib/player-store.tsx](/www/wwwroot/stream.mago-bot.com/src/lib/player-store.tsx)
- [src/routes/_authenticated/canais.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/canais.tsx)
- [src/routes/_authenticated/filmes.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/filmes.tsx)
- [src/routes/_authenticated/series.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/series.tsx)

## 6. Status Operacional

- build de producao validado
- PM2 do app principal recarregado
- processo de stream/player pronto para o proximo restart sincronizado
- processo de pagamentos pronto para o proximo restart sincronizado
- worker pronto para o proximo restart sincronizado

## 7. Observacao De Risco

O risco residual agora esta concentrado em:

- servidor IPTV sem playlist M3U valida
- servidor IPTV sem retorno do Xtream legado
- banco remoto ainda nao ter recebido a migration da nova tabela de cache M3U

Nesse cenario, o sistema continua tentando os fallbacks existentes sem quebrar a navegacao.
