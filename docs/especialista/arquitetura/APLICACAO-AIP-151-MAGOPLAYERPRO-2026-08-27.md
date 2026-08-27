# Aplicação do Google AIP-151 ao MAGOPLAYERPRO

## Síntese

O [Google AIP-151](https://google.aip.dev/151) define o padrão de operações de longa duração (LRO). Quando uma chamada pode levar tempo significativo, o servidor não deve bloquear o cliente até o resultado final. Em vez disso, deve devolver uma operação rastreável, com estado, metadados, progresso, resultado ou erro terminal. O documento usa aproximadamente 10 segundos como regra prática para identificar uma operação significativa.

O padrão exige identidade estável, estado observável e resultado posterior. A operação deve distinguir execução de conclusão; ao terminar, deve carregar exatamente um resultado de sucesso ou erro. Falhas durante a execução devem aparecer no resultado da operação, e não apenas no status HTTP inicial. Cancelamento é assíncrono e de melhor esforço. Operações paralelas precisam de política explícita: fila, execução simultânea ou rejeição com conflito claro. Operações concluídas podem expirar após retenção definida; 30 dias é uma referência prática do documento.

## Aplicação concreta

| Princípio | Aplicação no MAGOPLAYERPRO |
|---|---|
| Identidade | Refresh de catálogo emite `operation_ref` hash para correlação, sem URL, token ou conteúdo. |
| Estados | Refresh registra `pending`, `running`, `cancel_requested`, `succeeded`, `failed` e `cancelled`. |
| Etapas | `queued`, `acquiring_lock`, `fetching_m3u`, `parsing_catalog`, `fetching_catalog`, `persisting_cache`, `completed`, `failed` e `cancelled`. |
| Progresso | Percentuais são derivados da etapa e `failed` retorna `null`; nenhum percentual é inventado. |
| Erros | Falha de execução é registrada como estado terminal sanitizado, separada da aceitação inicial. |
| Concorrência | O coalescing durável por `(operation_type, server_id)` evita refreshes ativos duplicados; o claim SQL é atômico e o lock de filesystem continua protegendo a escrita. |
| Persistência | `long_running_operations` guarda o snapshot atual e `long_running_operation_events` guarda eventos sanitizados; ambos ficam no Supabase e sobrevivem aos quatro processos PM2. |
| Contratos | `getPlaybackUrl`, catálogo, sessão, leases, pagamentos e endpoints públicos não foram alterados. A procedure owner-only agora retorna `operation_ref` imediatamente em estado `running`. |
| Consulta | `getRefreshOperationStatus` retorna status sanitizado por referência opaca. O painel usa polling com backoff limitado, sem polling de sessão Manus ou job externo. |
| Cancelamento | `cancelRefreshOperation` grava `cancel_requested`; o worker verifica o pedido antes dos checkpoints M3U, Xtream, lock e persistência e conclui em `cancelled` quando possível. |
| Observabilidade | Logs já existentes receberam estado, etapa, duração e referência hash; payload de credenciais, URLs e playlists não é retornado. |

## Onde não aplicar

Playback de canal, filme ou episódio não deve virar uma LRO genérica. A reprodução precisa resposta imediata para o elemento `<video>`, com timeout de primeiro frame, recovery, fallback e QoE. Polling de uma operação para cada play acrescentaria latência sem resolver uma origem inválida.

Também não é necessário copiar literalmente o serviço `google.longrunning.Operations`. O projeto usa TanStack Start/server functions e Supabase; o importante é adotar a semântica de identidade, estado, metadados, resultado, erro, cancelamento, retenção e idempotência.

## Implementação final entregue

A procedure owner-only agora grava o snapshot e devolve imediatamente `operation_ref`, `operation_state=running`, etapa inicial e percentual inicial. O worker existente possui um segundo ciclo de consumo que reivindica uma operação por vez através de RPC SQL com `FOR UPDATE SKIP LOCKED`; não foi criado um processo PM2 adicional. Refreshes periódicos entram como `pending`, enquanto refreshes administrativos entram diretamente como `running`, conforme o contrato solicitado.

O endpoint de status e o cancelamento são server functions owner-only, com referência UUID opaca, resultado limitado a origem e contagens por tipo, e erro genérico sanitizado. O painel consulta por backoff determinístico de 1,0 s até 15 s e para ao atingir estado terminal. O botão de cancelamento comunica que a interrupção é cooperativa, não uma interrupção forçada de uma requisição externa já em curso.

A retenção é executada pelo ciclo de manutenção do worker. Operações expiradas há mais de 30 dias são removidas com seus eventos por `ON DELETE CASCADE`; a rotina registra somente contagem removida e a política aplicada. Operações ativas não são removidas por retenção enquanto ainda possuem heartbeat recente.

## Resultado do lote

O helper, a camada durável, o worker e o painel passaram 39/39 testes determinísticos, `git diff --check` e build sanitizado sem o identificador legado. A migration foi aplicada após backup verificável de 22.293.878 bytes, as tabelas/RPCs/RLS foram confirmadas, e a produção foi observada por mais de 60 segundos após restart real dos quatro processos. O incremento não cria rota pública, não altera contratos do player e não toca credenciais, playlists ou fontes de clientes.

## Referências

[1]: https://google.aip.dev/151 "AIP-151: Long-running operations"
[2]: https://github.com/googleapis/googleapis/blob/master/google/longrunning/operations.proto "google.longrunning Operations service"
[3]: https://docs.cloud.google.com/service-infrastructure/docs/service-management/reference/rpc/google.longrunning "Package google.longrunning"
[4]: https://docs.cloud.google.com/storage/docs/using-long-running-operations "Use long-running operations in Cloud Storage"
