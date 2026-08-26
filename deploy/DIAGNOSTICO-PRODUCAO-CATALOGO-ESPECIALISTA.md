# Diagnóstico De Produção - Catálogo E Play

Atualizado em: 2026-08-14

Este documento consolida o estado atual da operação do catálogo e do play, com foco em:

- TV ao Vivo
- Filmes
- Séries
- Playback
- Cache persistido ou fallback ativo

O objetivo é permitir uma checagem curta e objetiva em produção, sem mexer em fluxos que já estão estáveis.

## 1. Estado Técnico Já Confirmado

- O servidor IPTV `PORTAL1` responde normalmente ao Xtream.
- O catálogo consegue buscar:
  - categorias ao vivo
  - streams ao vivo
  - categorias de filmes
  - streams de filmes
  - categorias de séries
  - streams de séries
- O fluxo de leitura do player já tem fallback legado preservado.
- A gravação de cache foi tornada tolerante para não quebrar a tela quando o schema remoto ainda não estiver sincronizado.

## 2. Mapa Curto Por Área

| Área | O que validar | Estado esperado |
|---|---|---|
| Canais | abrir `/canais` e carregar categorias + streams | deve listar categorias e canais sem erro de servidor |
| Filmes | abrir `/filmes` e carregar catálogo | deve listar categorias e filmes sem erro de servidor |
| Séries | abrir `/series` e carregar catálogo | deve listar categorias e séries sem erro de servidor |
| Playback | abrir um item e iniciar reprodução | deve abrir o player e tocar o conteúdo sem quebrar a tela inteira |
| Cache persistido | verificar se o snapshot foi salvo | se a migration estiver aplicada, deve gravar em `iptv_server_m3u_cache` e `iptv_server_cache` |
| Fallback ativo | verificar se o cache falhou sem quebrar a UI | se o schema remoto ainda não estiver pronto, o fluxo deve continuar por fallback sem derrubar a tela |

## 3. O Que Já É Fallback E O Que Já É Cache

### 3.1 Cache local por servidor

O código já está preparado para usar:

- [`src/lib/iptv-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [`src/lib/iptv-playlist.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-playlist.server.ts)

Esse bloco tenta:

1. salvar a playlist M3U local por servidor
2. derivar o catálogo a partir dela
3. cair para Xtream legado quando necessário

### 3.2 Fallback legado

Se a persistência do cache ainda não estiver disponível no banco remoto, o sistema:

- continua buscando o catálogo direto do Xtream
- mantém a UI carregando
- evita quebrar o player inteiro por erro de cache

## 4. Sinais De Sucesso Que Eu Preciso Receber

Quando você fizer o teste em produção, me devolva exatamente isso:

| Item | Resultado |
|---|---|
| Canais | carregou ou deu erro |
| Filmes | carregou ou deu erro |
| Séries | carregou ou deu erro |
| Playback | tocou ou falhou |
| Cache persistido | gravou ou não gravou |
| Fallback ativo | entrou ou não entrou |

Se quiser mandar de forma ainda mais rápida, responda neste formato:

```text
Canais: ok/erro
Filmes: ok/erro
Series: ok/erro
Playback: ok/erro
Cache: persistido/fallback
```

## 5. O Que Seria Um Resultado Ideal

O cenário ideal em produção é:

- `canais`: ok
- `filmes`: ok
- `series`: ok
- `playback`: ok
- `cache`: persistido

Se ainda aparecer `fallback`, o sistema ainda funciona, mas a persistência do snapshot local precisa da sincronização completa da migration no banco remoto.

## 6. Arquivos Mais Importantes Para Esse Diagnóstico

- [src/components/player/Catalog.tsx](/www/wwwroot/stream.mago-bot.com/src/components/player/Catalog.tsx)
- [src/lib/player.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/player.functions.ts)
- [src/lib/iptv-cache.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [src/lib/iptv-playlist.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-playlist.server.ts)
- [src/lib/player-store.tsx](/www/wwwroot/stream.mago-bot.com/src/lib/player-store.tsx)
- [src/routes/_authenticated/canais.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/canais.tsx)
- [src/routes/_authenticated/filmes.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/filmes.tsx)
- [src/routes/_authenticated/series.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/series.tsx)

## 7. Observação De Operação

Se o catálogo carregar, mas o cache persistido ainda não aparecer, o sistema não está quebrado.
Nesse caso, o que está ativo é o fallback legado com catálogo vivo e tolerância a schema incompleto.

Isso é aceitável como modo de operação temporário até a persistência do cache ficar plenamente reconhecida no ambiente remoto.
