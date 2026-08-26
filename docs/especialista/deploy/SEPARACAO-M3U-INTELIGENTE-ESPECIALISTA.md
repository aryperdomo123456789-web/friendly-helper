# Separação Inteligente de M3U por Servidor

Atualizado em: 2026-08-16

Este documento descreve, de forma prática e fiel ao código atual, como o `stream.mago-bot.com` separa uma playlist M3U em:

- Canais ao vivo
- Filmes
- Séries

O foco é garantir:

- isolamento total por `server_id`
- leitura rápida depois do primeiro carregamento
- troca de categoria estável em qualquer servidor
- recarga segura sem embolar dados entre portais

---

## 1. Regra Mestre

Cada servidor é processado de forma independente.

Isso significa que:

- cada servidor tem seu próprio `server_id`
- cada servidor tem sua própria credencial Xtream
- cada servidor tem sua própria playlist salva localmente
- cada servidor tem seu próprio catálogo derivado
- um portal nunca reaproveita o catálogo do outro

Na prática:

- `PORTAL1` não mistura com `PORTAL2`
- `PORTAL7` não mistura com `PORTAL1`
- canais, filmes e séries são cacheados e lidos por servidor

---

## 2. Onde a Separação Acontece

A lógica central está em:

- [`src/lib/iptv-playlist.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-playlist.server.ts)
- [`src/lib/iptv-cache.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [`src/lib/player.functions.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/player.functions.ts)
- [`src/components/player/Catalog.tsx`](/www/wwwroot/stream.mago-bot.com/src/components/player/Catalog.tsx)

Esses arquivos fazem o ciclo completo:

1. baixar a M3U
2. identificar o tipo do conteúdo
3. separar por categoria
4. salvar o cache por servidor
5. servir a interface com o que pertence somente àquele servidor

---

## 3. Como o Tipo do Conteúdo é Identificado

O separador usa a URL de reprodução como fonte principal.

### Regra prática atual

- se o link contém `/movie/`, o item é `movie`
- se o link contém `/series/`, o item é `series`
- qualquer outro caso cai como `live`

Isso cobre:

- `/movie/...`
- `/series/...`
- `/live/...`
- links `.ts`
- links sem caminho explícito de filme/série

### Exemplo 1: filme

```m3u
#EXTINF:-1 tvg-name="UFC 3: The American Dream (1994)" tvg-logo="..." group-title="LUTAS | UFC",UFC 3: The American Dream (1994)
http://nitro.lat:80/movie/Felipe-vod438911079/771214532/327819.mp4
```

Leitura:

- `/movie/` => `movie`
- `group-title` => `LUTAS | UFC`
- `tvg-name` => nome exibido
- `tvg-logo` => capa/ícone

### Exemplo 2: série

```m3u
#EXTINF:-1 tvg-name="De Ferias com o Ex Diretoria S02E04" tvg-logo="..." group-title="REALITY SHOW",De Ferias com o Ex Diretoria S02E04
http://nitro.lat:80/series/Felipe-vod438911079/771214532/531863.mp4
```

Leitura:

- `/series/` => `series`
- `group-title` => `REALITY SHOW`
- `tvg-name` => nome da série/episódio

### Exemplo 3: canal ao vivo

```m3u
#EXTINF:-1 tvg-name="Globo Brasília FHD" tvg-logo="..." group-title="CANAIS | GLOBO",Globo Brasília FHD
http://nitro.lat:80/Felipe-vod438911079/771214532/45225.ts
```

Leitura:

- sem `/movie/` e sem `/series/` => `live`
- `.ts` reforça o fluxo de canal ao vivo

---

## 4. Como a Categoria é Identificada

A categoria vem do `group-title`.

No parser atual:

- `group-title` é a fonte principal
- `group_title` também é aceito
- `group` também é aceito como fallback

Exemplo:

```m3u
group-title="CANAIS | FILMES & SERIES"
```

vira:

- `category_id = "CANAIS | FILMES & SERIES"`
- `category_name = "CANAIS | FILMES & SERIES"`

### Observação importante

O sistema usa essa categoria como chave de agrupamento na interface.
Se o upstream devolver categorias inconsistentes, o backend prefere o cache válido daquele servidor e, quando necessário, o recorte local da playlist salva.

---

## 5. Como o Nome do Item é Definido

O nome mostrado na interface segue esta ordem:

1. `tvg-name`
2. nome legível da linha `#EXTINF`
3. fallback genérico `"Conteúdo"`

Isso vale para:

- canais
- filmes
- séries

---

## 6. Como a Playlist é Baixada

O download acontece em:

- [`src/lib/iptv-playlist.server.ts`](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-playlist.server.ts)

Fluxo:

1. monta a URL Xtream em `get.php`
2. tenta `output=ts`
3. se falhar, tenta `output=m3u8`
4. valida `#EXTM3U`
5. gera `playlist_hash`
6. conta os itens
7. salva o snapshot local

### Campos salvos no snapshot

- `source_url`
- `playlist_text`
- `playlist_hash`
- `item_count`
- `fetched_at`

---

## 7. Como a Separação em Canais, Filmes e Séries Funciona

Depois de baixar a M3U, o parser:

1. percorre linha por linha
2. reconhece `#EXTINF`
3. captura os atributos
4. lê o link de reprodução logo abaixo
5. identifica o tipo pelo path da URL
6. lê a categoria por `group-title`
7. guarda o item dentro do bloco certo:
   - `live`
   - `movie`
   - `series`

### Resultado

O catálogo final já sai separado em três grupos independentes:

- `catalog.live`
- `catalog.movie`
- `catalog.series`

---

## 8. Como o Cache é Gravado

Cada servidor tem seu espaço próprio em disco.

Pasta atual usada pelo projeto:

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/
```

Estrutura principal:

```text
storage/servers/{server_id}/
  playlist.json
  playlist.m3u
  catalog/
    catalog_live_categories....
    catalog_live_streams....
    catalog_movie_categories....
    catalog_movie_streams....
    catalog_series_categories....
    catalog_series_streams....
```

### Regra de ouro

Um `server_id` não escreve na pasta de outro `server_id`.

---

## 9. O Botão de Recarregar

Quando o dono usa **Recarregar M3U / Cache**:

1. o sistema valida a nova playlist
2. só depois limpa o cache local do servidor
3. baixa de novo a M3U
4. reprocessa categorias e streams
5. grava tudo novamente para o mesmo `server_id`

Isso evita:

- apagar cache bom antes de ter novo cache válido
- derrubar a tela se o portal vier 502
- misturar dados de portais diferentes

---

## 10. Como a Interface Usa Isso

As telas do usuário pedem apenas o que precisam:

- `/canais` => `live`
- `/filmes` => `movie`
- `/series` => `series`

Arquivo principal:

- [`src/components/player/Catalog.tsx`](/www/wwwroot/stream.mago-bot.com/src/components/player/Catalog.tsx)

Esse componente:

- lê o servidor ativo
- busca categorias daquele servidor
- busca streams daquele tipo
- pagina sem misturar conteúdo
- abre player só para o item selecionado

---

## 11. Por Que a Separação é “Inteligente”

A inteligência está em 4 camadas:

### Camada 1 - Tipo

O path da URL define o tipo:

- `/movie/`
- `/series/`
- resto => `live`

### Camada 2 - Categoria

`group-title` define a pasta lógica da categoria.

### Camada 3 - Servidor

Tudo é salvo e lido por `server_id`.

### Camada 4 - Fallback

Se o Xtream estiver inconsistente:

- o sistema usa a playlist salva localmente
- o usuário continua navegando
- a UI não quebra

---

## 12. Exemplo Completo do Fluxo

### Entrada

```m3u
#EXTINF:-1 tvg-name="Filme X" tvg-logo="..." group-title="AÇÃO",Filme X
http://servidor:80/movie/user/pass/12345.mp4
```

### Processamento

- tipo: `movie`
- categoria: `AÇÃO`
- nome: `Filme X`
- ícone: URL do logo
- id: `12345`

### Saída

O item vai para:

- servidor atual
- kind `movie`
- categoria `AÇÃO`
- cache de filmes daquele servidor

---

## 13. Garantias Técnicas

O sistema foi desenhado para:

- não misturar servidores
- não misturar categorias
- não misturar tipos
- não perder cache bom em falha temporária
- manter a navegação rápida depois do primeiro fetch

---

## 14. Resultado Esperado Em Produção

Depois que a playlist é baixada e separada:

- o usuário vê só canais no fluxo de canais
- vê só filmes no fluxo de filmes
- vê só séries no fluxo de séries
- cada portal mantém seus próprios dados
- a troca de servidor continua segura

---

## 15. Resumo Executivo

```text
M3U -> detecta tipo pelo link -> agrupa por group-title -> salva por server_id -> mostra só o tipo certo na tela
```

Ou, em linguagem operacional:

- `/movie/` = filme
- `/series/` = série
- resto = canal ao vivo
- `group-title` = categoria
- `server_id` = isolamento total

