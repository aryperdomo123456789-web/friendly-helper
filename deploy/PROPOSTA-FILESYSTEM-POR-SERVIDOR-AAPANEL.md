# Proposta De Evolução: Filesystem Local Por Servidor

Atualizado em: 2026-08-16

Este documento propõe a próxima camada de evolução do `stream.mago-bot.com` para armazenar arquivos locais por servidor em disco, dentro do ambiente do Aapanel, com isolamento total por `server_id`.

O objetivo é transformar o cache atual, que hoje é persistido em banco, em uma camada física local por servidor para:

- acelerar leituras
- reduzir dependência de rede em acessos repetidos
- evitar mistura entre servidores
- permitir limpeza e recarga física por servidor
- manter a operação fluida em catálogos grandes

## 1. Estado Atual Do Projeto

Hoje o projeto já possui isolamento lógico por servidor usando:

- `server_credentials`
- `iptv_server_cache`
- `iptv_server_m3u_cache`

Isso já funciona bem para:

- Canais
- Filmes
- Séries
- playback
- fallback seguro

Mas o cache ainda está persistido em banco, não em filesystem físico.

## 2. Objetivo Da Evolução

A evolução proposta é gravar arquivos por servidor em uma árvore local como esta:

```text
/www/wwwroot/stream.mago-bot.com/storage/
  servers/
    {server_id}/
      m3u/
        playlist.m3u
        playlist.meta.json
      catalog/
        live/
          categories.json
          streams.json
        movie/
          categories.json
          streams.json
          vod-info/
            {vod_id}.json
        series/
          categories.json
          streams.json
          series-info/
            {series_id}.json
      media/
        posters/
        covers/
        logos/
      temp/
```

Cada `server_id` teria seu próprio diretório, sem reaproveitar conteúdo de outro servidor.

## 3. Princípios Obrigatórios

### 3.1 Isolamento absoluto

Nada pode ser compartilhado entre:

- PORTAL1 e PORTAL2
- live e movie
- movie e series
- cache de catálogo e cache de mídia

### 3.2 Escrita atômica

Toda gravação deve ser feita em dois passos:

1. escrever em arquivo temporário
2. renomear para o destino final

Isso evita:

- arquivo truncado
- leitura parcial
- corrupção em caso de queda de processo

### 3.3 Lock por servidor

Cada `server_id` precisa ter lock próprio durante refresh.

Assim evitamos:

- duas recargas simultâneas do mesmo servidor
- sobrescrita concorrente
- cache misturado

### 3.4 Fallback seguro

Se o filesystem falhar, o sistema deve continuar funcionando com o fluxo atual de banco e Xtream.

Ou seja:

- filesystem é camada de aceleração
- banco continua como fallback/estado confiável

## 4. Estrutura Proposta De Diretórios

### 4.1 Raiz

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/
```

### 4.2 M3U

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/m3u/playlist.m3u
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/m3u/playlist.meta.json
```

Conteúdo esperado em `playlist.meta.json`:

```json
{
  "server_id": "uuid",
  "source_url": "https://...",
  "playlist_hash": "sha256...",
  "item_count": 12345,
  "fetched_at": "2026-08-16T00:00:00.000Z",
  "kind": "m3u"
}
```

### 4.3 Catálogo

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/live/categories.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/live/streams.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/movie/categories.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/movie/streams.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/series/categories.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/series/streams.json
```

### 4.4 Metadados de detalhe

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/movie/vod-info/{vod_id}.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/series/series-info/{series_id}.json
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/catalog/live/epg/{stream_id}.json
```

### 4.5 Mídia opcional

```text
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/media/posters/
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/media/covers/
/www/wwwroot/stream.mago-bot.com/storage/servers/{server_id}/media/logos/
```

## 5. Como O Fluxo Funcionaria

### 5.1 Cadastro de novo servidor

Ao salvar um novo servidor no painel:

1. o servidor é persistido em banco
2. a credencial é salva em `server_credentials`
3. o sistema dispara refresh daquele `server_id`
4. o refresh baixa a M3U
5. a M3U é salva em disco no diretório do servidor
6. o catálogo derivado é salvo em JSON por servidor
7. a UI passa a ler primeiro do filesystem daquele servidor

### 5.2 Recarga manual

Ao clicar em “Recarregar servidor”:

1. o diretório de cache daquele `server_id` é limpo
2. a M3U é baixada novamente
3. os JSONs são reconstruídos
4. os arquivos novos substituem os antigos
5. somente aquele servidor é afetado

### 5.3 Leitura na UI

Quando Canais, Filmes ou Séries pedirem dados:

1. tenta ler do filesystem daquele `server_id`
2. se não existir ou estiver corrompido, cai no banco
3. se o banco não resolver, cai no Xtream
4. se o upstream falhar, a UI mostra fallback amigável

## 6. Benefícios Esperados

### 6.1 Velocidade

Leitura de JSON local tende a ser muito mais rápida que:

- bater em API externa
- recomputar catálogo em tempo real
- repetir parse em cada interação

### 6.2 Fluidez

Categorias, listas e detalhes passam a abrir mais rápido, especialmente em:

- servidores grandes
- múltiplas conexões simultâneas
- usuários alternando entre servidores

### 6.3 Isolamento operacional

Se um servidor quebrar, os outros continuam intactos.

### 6.4 Cache limpo por servidor

Uma recarga remove o estado anterior apenas daquele servidor.

## 7. Modelagem Técnica Recomendada

### 7.1 Camada de storage

Criar um módulo como:

- `src/lib/server-filesystem-cache.server.ts`

Responsabilidades:

- montar paths por `server_id`
- garantir diretórios
- salvar JSON com escrita atômica
- ler cache com fallback
- apagar árvore de um servidor
- criar lock por servidor

### 7.2 Camada de coordenação

Atualizar o fluxo existente em:

- `src/lib/iptv-cache.server.ts`
- `src/lib/player.functions.ts`

para consultar:

1. filesystem
2. banco
3. Xtream
4. playlist fallback

### 7.3 Camada de mídia

O proxy de imagem já existe hoje em:

- [`src/routes/api/public/image.ts`](/www/wwwroot/stream.mago-bot.com/src/routes/api/public/image.ts)

A evolução pode adicionar cache local de mídia com:

- hash de URL
- pasta por servidor
- expiração por TTL

## 8. Regras De Cache

### 8.1 M3U

- chave por `server_id`
- overwrite completo no refresh
- hash para detectar mudança

### 8.2 Categorias

- JSON separado por `kind`
- nunca salvar live em movie
- nunca salvar movie em series

### 8.3 Streams

- salvar lista bruta e lista filtrada por categoria
- manter tamanho controlado
- não duplicar conteúdo entre servidores

### 8.4 Detalhes

- episódios por série
- detalhes de filme
- EPG por canal

## 9. Migração Segura

### Fase 1

- manter banco como fonte atual
- adicionar filesystem como camada opcional
- ler do filesystem apenas quando existir

### Fase 2

- salvar M3U e JSONs no filesystem em cada refresh
- validar leitura do filesystem em produção

### Fase 3

- usar filesystem como primeira leitura
- banco como fallback

### Fase 4

- adicionar cache de mídia por servidor
- aplicar política de limpeza automática

## 10. Limpeza E Recarga

Ao recarregar um servidor:

- apagar `/storage/servers/{server_id}/m3u/*`
- apagar `/storage/servers/{server_id}/catalog/*`
- apagar `/storage/servers/{server_id}/media/*` opcionalmente
- rebaixar playlist
- reconstruir catálogo

Importante:

- nunca apagar a árvore de outro `server_id`
- nunca executar limpeza global por engano

## 11. Concorrência

Para evitar embolar processos:

- usar lock por `server_id`
- impedir dois refreshes simultâneos do mesmo servidor
- permitir refresh de servidores diferentes em paralelo, se desejado

Recomendação de lock:

- arquivo `.lock` por servidor
- expiração de lock
- liberação segura em caso de crash

## 12. Integração Com PM2

Se essa camada for implementada, os processos devem continuar separados:

- `stream-mago-bot`
- `stream-mago-bot-player`
- `stream-mago-bot-payments`
- `stream-mago-bot-worker`

O worker pode ser estendido para:

- renovar filesystem por servidor
- validar integridade dos arquivos
- limpar arquivos vencidos

## 13. Observações Sobre Aapanel

No Aapanel, a estrutura física pode ficar sob:

```text
/www/wwwroot/stream.mago-bot.com/storage/
```

Recomendações:

- garantir permissão de escrita para o usuário do processo
- monitorar tamanho do diretório
- criar rotina de backup
- evitar limpar manualmente sem respeitar `server_id`

## 14. Riscos E Como Mitigar

### Risco: arquivo parcialmente gravado

Mitigação:

- escrita atômica
- rename final

### Risco: concorrência em refresh

Mitigação:

- lock por servidor

### Risco: cache corrompido

Mitigação:

- validar JSON antes de usar
- fallback para banco/Xtream

### Risco: crescimento excessivo de mídia

Mitigação:

- TTL
- limpeza por último acesso
- limite por servidor

## 15. Decisão Arquitetural Recomendada

A melhor estratégia para este projeto é:

1. manter o fluxo atual funcionando
2. adicionar filesystem por servidor como camada nova
3. fazer leitura preferencial do local físico
4. preservar fallback para banco e Xtream
5. garantir que cada `server_id` tenha sua própria árvore

Isso entrega velocidade sem romper a operação atual.

## 16. Resumo Final

A proposta de filesystem local por servidor em `/www/wwwroot/...` deve seguir estas regras:

- diretório separado por `server_id`
- arquivos separados por tipo de dado
- escrita atômica
- lock por servidor
- recarga limpa por servidor
- fallback para banco/Xtream
- sem mistura entre servidores

Essa é a forma mais segura de escalar o projeto mantendo fluidez e previsibilidade operacional.
