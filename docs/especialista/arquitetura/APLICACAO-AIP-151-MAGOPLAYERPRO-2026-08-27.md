# Aplicação do Google AIP-151 ao MAGOPLAYERPRO

## Síntese

O [Google AIP-151](https://google.aip.dev/151) define o padrão de operações de longa duração (LRO). Quando uma chamada pode levar tempo significativo, o servidor não deve bloquear o cliente até o resultado final. Em vez disso, deve devolver uma operação rastreável, com estado, metadados, progresso, resultado ou erro terminal. O documento usa aproximadamente 10 segundos como regra prática para identificar uma operação significativa.

O padrão exige identidade estável, estado observável e resultado posterior. A operação deve distinguir execução de conclusão; ao terminar, deve carregar exatamente um resultado de sucesso ou erro. Falhas durante a execução devem aparecer no resultado da operação, e não apenas no status HTTP inicial. Cancelamento é assíncrono e de melhor esforço. Operações paralelas precisam de política explícita: fila, execução simultânea ou rejeição com conflito claro. Operações concluídas podem expirar após retenção definida; 30 dias é uma referência prática do documento.

## Aplicação concreta

| Princípio | Aplicação no MAGOPLAYERPRO |
|---|---|
| Identidade | Refresh de catálogo emite `operation_ref` hash para correlação, sem URL, token ou conteúdo. |
| Estados | Refresh registra `pending`, `running`, `succeeded` e `failed`. |
| Etapas | `queued`, `acquiring_lock`, `fetching_m3u`, `parsing_catalog`, `fetching_catalog`, `persisting_cache`, `completed` e `failed`. |
| Progresso | Percentuais são derivados da etapa e `failed` retorna `null`; nenhum percentual é inventado. |
| Erros | Falha de execução é registrada como estado terminal sanitizado, separada da aceitação inicial. |
| Concorrência | O `refreshInFlight` existente mantém coalescing por portal e evita downloads duplicados. O lock de filesystem continua protegendo a escrita. |
| Contratos | `getPlaybackUrl`, catálogo, sessão, leases, pagamentos e endpoints públicos não foram alterados. |
| Observabilidade | Logs já existentes receberam estado, etapa, duração e referência hash. |

## Onde não aplicar

Playback de canal, filme ou episódio não deve virar uma LRO genérica. A reprodução precisa resposta imediata para o elemento `<video>`, com timeout de primeiro frame, recovery, fallback e QoE. Polling de uma operação para cada play acrescentaria latência sem resolver uma origem inválida.

Também não é necessário copiar literalmente o serviço `google.longrunning.Operations`. O projeto usa TanStack Start/server functions e Supabase; o importante é adotar a semântica de identidade, estado, metadados, resultado, erro, cancelamento, retenção e idempotência.

## Próxima evolução recomendada

O refresh ainda espera a conclusão quando chamado diretamente pela procedure administrativa. Para uma evolução posterior, a interface poderá receber imediatamente um snapshot `running` e consultar o estado por `operation_ref`, com polling limitado e backoff. Antes disso, é necessário escolher armazenamento durável para o snapshot; memória de processo não é suficiente quando há quatro processos PM2.

O cancelamento deve ser cooperativo e limitado ao próprio refresh. O sistema deve rejeitar ou coalescer uma segunda operação no mesmo portal, medir fila, duração, falhas e memória do worker, e só então discutir paralelismo.

## Resultado do lote

O helper puro de operação longa e o refresh instrumentado passaram 35/35 testes, lint lógico, `git diff --check` e build sanitizado. O incremento não cria job recorrente, não abre rota pública e não toca banco, credenciais ou fontes de clientes.

## Referências

[1]: https://google.aip.dev/151 "AIP-151: Long-running operations"
[2]: https://github.com/googleapis/googleapis/blob/master/google/longrunning/operations.proto "google.longrunning Operations service"
[3]: https://docs.cloud.google.com/service-infrastructure/docs/service-management/reference/rpc/google.longrunning "Package google.longrunning"
[4]: https://docs.cloud.google.com/storage/docs/using-long-running-operations "Use long-running operations in Cloud Storage"
