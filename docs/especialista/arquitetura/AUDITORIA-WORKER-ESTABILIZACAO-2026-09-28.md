# Auditoria e estabilização do `stream-mago-bot-worker` — 2026-09-28

## Escopo

Auditoria e correção controlada do worker de produção em `38.190.176.171`, projeto `/www/wwwroot/stream.mago-bot.com`. O escopo ficou limitado a refresh de catálogo, parser M3U, lock de filesystem, persistência de cache, retry/timeout, observabilidade e política PM2. Login, permissões, player/proxy, pagamentos, webhook, chat, catálogo público e dados financeiros não foram alterados.

## Diagnóstico real antes da mudança

A auditoria encontrou **drift entre a branch e a fonte carregada no servidor**. A produção ainda executava um worker legado, enquanto a branch já possuía scheduler e observabilidade AIP-151. O worker legado:

- chamava `response.text()` para a playlist inteira;
- fazia `split(/\\r?\\n/)`, mantendo múltiplas representações de uma playlist grande em RAM;
- gravava `playlist.json` e `playlist.m3u` de aproximadamente **69–72 MiB**;
- tinha timeout M3U de 30 segundos;
- não tinha retry exponencial explícito;
- esperava até 30 segundos por lock ocupado;
- usava stale por `mtime` de 15 minutos, sem lease/heartbeat no payload;
- buscava Live, VOD e séries em paralelo no fallback Xtream;
- não tinha chunking explícito para persistência do catálogo;
- mantinha `max_memory_restart` global em `512M`;
- encerrava imediatamente em `SIGINT`, produzindo ciclos de restart difíceis de distinguir de falha.

### Amostras sanitizadas de produção

Na janela agregada observada nos logs do worker:

| Indicador | Antes |
|---|---:|
| Falhas M3U/fallback observadas | 5.339 / 1 h |
| Locks ocupados | 918 / 1 h |
| Encerramentos `SIGINT` | 749 / janela agregada dos logs |
| Tasks iniciadas | 4.795 |
| Tasks concluídas com duração registrada | 12 |
| Duração média registrada | 64.865 ms |
| Duração máxima registrada | 94.170 ms |
| RSS do worker no diagnóstico | ~156 MiB |
| Limite PM2 configurado | 512M |

A fonte de produção também mostrou duas classes de lock: `storage/locks` e os locks legados em `.storage/server-filesystem-cache/locks/`. O patch não remove locks automaticamente nem toca os locks legados fora da rotina do lock ativo.

## Correção implementada

### 1. M3U streaming

- Novo `fetchRemotePlaylistStreaming` consome `Response.body` em chunks.
- O corpo é gravado em spool temporário no disco; a playlist não é montada como uma string integral no worker.
- Hash SHA-256 é calculado incrementalmente.
- O parser consome linhas conforme os chunks chegam e produz o `PlaylistCatalog` uma única vez.
- O spool é copiado atomically para `playlist.m3u` e removido no `finally` do refresh.
- O snapshot streaming não carrega `playlist_text`; o caminho local continua preservando a compatibilidade do cache em disco.
- A tabela legada `iptv_server_m3u_cache` não recebe uma string integral quando o refresh usa o caminho streaming, preservando o catálogo já persistido em `iptv_server_cache` e evitando pico de memória no worker.

### 2. Timeout e retry

- Timeout padrão do download streaming: **60 segundos**.
- Até **3 tentativas** por variante (`ts`, depois `m3u8`).
- Backoff exponencial limitado a partir de 750 ms.
- AbortController cancela a resposta e o reader quando o timeout ou o limite de bytes é atingido.
- Limite streaming: 128 MiB, com rejeição antecipada por `Content-Length` quando disponível.

### 3. Lock com lease/heartbeat

- Lease configurável por `WORKER_LOCK_LEASE_MS`, limitado entre 5 e 10 minutos; padrão: **8 minutos**.
- O payload do lock registra `lease_expires_at` e `heartbeat_at`.
- Heartbeat atualiza o lease a cada até 30 segundos.
- Contenção não espera em fila: registra `refresh_lock_skipped` e retorna `SERVER_FILESYSTEM_LOCK_BUSY` como skip operacional.
- Lease expirado é removido na próxima tentativa; lock ativo não é removido apenas porque existe outro refresh concorrente.

### 4. Persistência em lotes

- Catálogo de cache usa upsert por chunks de até **500 linhas**.
- O contrato de seis chaves (`categories` e `streams` para Live, filme e série) permanece intacto.
- A escrita local usa cópia atômica do spool e continua separada da persistência Supabase.

### 5. PM2

Somente o worker recebe a política nova:

- `max_memory_restart: 300M`;
- `restart_delay: 5000`;
- `exp_backoff_restart_delay: 1000`;
- `kill_timeout: 10000`;
- alerta de memória em 128 MiB e crítico em 150 MiB;
- `WORKER_LOCK_LEASE_MS=480000`;
- lock stale de observabilidade em 480 segundos.

Os outros três processos não receberam alteração de limite ou comando de restart fora do procedimento de validação.

## Backup e rollback

Backup preventivo criado **antes da edição**:

```text
Diretório: /root/backups/mago-worker-20260928T222418Z
Arquivo: /root/backups/mago-worker-20260928T222418Z.tar.gz
Tamanho: 29.650.065 bytes
SHA-256: 3c39ad0f5b61e3fa0656a8c175715ba4aa5923550af0240066a1bcd3dbe36388
Conteúdo aproximado: 178M descompactado
```

O backup contém fontes afetadas, output ativo, cache/playlist, locks, configurações PM2, estado PM2 sanitizado e cauda de logs sanitizada. O rollback operacional mantém o output anterior em diretório `.output.rollback-worker-<timestamp>` antes de qualquer troca.

## Validação local

- Suíte completa: **60/60 testes aprovados**.
- Testes novos do parser streaming: **3/3 aprovados**.
- `git diff --check`: aprovado.
- Build sanitizado local com Bun: aprovado após corrigir o PATH do Bun; os avisos de `use client` são warnings preexistentes do bundler.
- O build de validação usou URL pública correta e chave de validação não produtiva; não foi publicado.

## Gate de produção

O deploy deve ser considerado aprovado somente se todos os itens seguintes forem registrados:

- output novo gerado sem o identificador Supabase legado;
- SSR e asset retornando 200;
- token inválido retornando 403;
- quatro processos PM2 online;
- refresh manual controlado executado sem origem nova ou carga contra upstream não autorizada;
- memória, CPU, duração e eventos de skip/fallback registrados de forma sanitizada;
- rollback preservado.

## Limitações honestas

Este ciclo não certifica estabilidade de 24–72 horas. A meta de RSS abaixo de 150 MiB é um critério operacional de alerta/observação, não uma garantia matemática para uma origem de playlist arbitrariamente grande. O refresh manual em produção deve usar somente a origem já configurada e autorizada no servidor; não será feito teste de carga contra origens de clientes.

## Estado

- Diagnóstico: concluído.
- Backup: concluído e verificável.
- Implementação local: concluída.
- Testes locais: concluídos, 60/60.
- Deploy: preencher somente após stage, troca atômica, restart real e observação.
