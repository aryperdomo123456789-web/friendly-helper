# Observabilidade profissional do worker

**Data:** 26 de agosto de 2026<br>
**Projeto:** MAGOPLAYERPRO<br>
**Escopo:** worker de refresh de catálogo, locks de filesystem e diagnóstico operacional<br>
**Ambiente:** código e artefato local; **nenhum deploy ou reload de produção foi executado**

## 1. Objetivo e decisão arquitetural

A frente A foi tratada como uma camada operacional, não como uma simples troca de mensagens de log. O objetivo é permitir que a equipe responda, com evidência, às perguntas essenciais: o worker está vivo, há sobreposição de ciclos, qual servidor está lento, o refresh caiu para Xtream, os locks são legítimos ou órfãos, a memória está subindo, e o PM2 está reiniciando o processo?

Foram consideradas duas abordagens. Uma pilha externa de Prometheus/Grafana ofereceria retenção, dashboards e alertas mais completos, porém exigiria novos serviços, exposição de endpoints, credenciais e uma operação adicional. A implementação escolhida foi a instrumentação nativa com relatório JSON: ela não adiciona banco, migration, dependência externa, endpoint público ou contrato de API, e pode ser conectada posteriormente a cron, PM2, Uptime Kuma, Prometheus ou outro monitor.

> **Princípio operacional:** o worker registra sinais estruturados; o relatório interpreta esses sinais; o supervisor externo decide a notificação e a escalada.

## 2. Diagnóstico de baseline

A fotografia read-only obtida na produção revelou risco operacional concreto. Os números abaixo são uma amostra do estado observado, não uma medição de capacidade sustentada; por isso não devem ser tratados como SLO ou limite definitivo sem uma janela histórica maior.

| Sinal                                 |                             Observação | Interpretação                                                                                                                 |
| ------------------------------------- | -------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------- |
| Estado PM2                            |                               `online` | O processo estava respondendo ao supervisor no momento da coleta.                                                             |
| Reinícios PM2                         |                                    618 | Frequência historicamente elevada; requer investigação de causa e acompanhamento após a instrumentação.                       |
| Memória no monitor PM2                | aproximadamente 872 MiB em uma amostra | Acima do `max_memory_restart` configurado em 512 MiB; sinal de reinício ou leitura transitória a investigar.                  |
| RSS do processo                       |                aproximadamente 433 MiB | Próximo do limite operacional; exige alerta preventivo antes do restart automático.                                           |
| Pico residente observado              |                aproximadamente 879 MiB | Evidência de que a série histórica de memória precisa ser preservada fora do processo.                                        |
| Locks encontrados                     |                                      4 | Todos os quatro estavam associados a PIDs já encerrados na coleta; são candidatos a órfãos, não foram removidos nesta frente. |
| Falhas históricas de refresh por lock |             906 eventos no log de erro | Indica contenção persistente ou locks órfãos; a origem passa a ser identificável por referências redigidas.                   |
| Logs estruturados                     |                   ausentes no baseline | O worker usava mensagens textuais sem correlação por ciclo, tarefa ou servidor.                                               |

A análise também identificou uma discrepância entre eventos iniciados e concluídos nos logs legados. Ela não foi usada isoladamente para inferir quantidade de execuções, porque logs PM2 acumulados contêm stack traces, reinícios e mensagens de processos diferentes. A nova camada registra eventos de controle em uma única linha JSON para permitir contagem confiável.

## 3. Implementação entregue

O worker passou a gerar eventos JSON com timestamp UTC, nível, serviço, PID, evento e campos sanitizados. Identificadores de ciclo, refresh e servidor não são enviados em claro: são convertidos em referências curtas por SHA-256, suficientes para correlação sem expor UUIDs de negócio.

O estado em memória inclui contadores de ticks, tarefas, ciclos de refresh, refresh por servidor, fallback M3U/Xtream, coalescência, locks e alertas de memória. O heartbeat periódico inclui memória do processo, atividade corrente e contadores acumulados. Como esses contadores vivem no processo, o relatório PM2 continua sendo a fonte correta para reinícios e o histórico externo continua sendo necessário para retenção de longo prazo.

### Eventos principais

| Evento                                                       | Nível             | Finalidade                                                                           |
| ------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `worker_started`                                             | `info`            | Registrar versão de execução e thresholds carregados em runtime.                     |
| `worker_heartbeat`                                           | `info`            | Emitir estado periódico de memória, atividade e contadores.                          |
| `worker_tick_started` / `worker_tick_completed`              | `info`            | Medir duração e quantidade de tarefas falhas por ciclo.                              |
| `worker_task_started` / `worker_task_completed`              | `info`            | Correlacionar cada tarefa ao ciclo e medir duração.                                  |
| `worker_task_failed`                                         | `error`           | Registrar falha da tarefa sem interromper as demais tarefas do tick.                 |
| `refresh_cycle_started` / `refresh_cycle_completed`          | `info`            | Medir o ciclo que consulta os servidores ativos.                                     |
| `refresh_server_started` / `refresh_server_completed`        | `info`            | Medir o refresh de cada origem, com fonte e contagens do catálogo.                   |
| `refresh_m3u_failed_fallback` / `refresh_m3u_empty_fallback` | `warn`            | Explicar por que o fallback Xtream foi selecionado.                                  |
| `refresh_lock_contended`                                     | `warn`            | Mostrar que houve espera por lock já existente.                                      |
| `refresh_lock_stale_removed`                                 | `warn`            | Registrar remoção automática de lock que ultrapassou a janela de stale já existente. |
| `refresh_lock_timeout`                                       | `error`           | Registrar que a espera excedeu o timeout de 30 segundos.                             |
| `worker_memory_alert`                                        | `warn` ou `error` | Sinalizar RSS acima do threshold preventivo ou crítico.                              |
| `worker_memory_recovered`                                    | `info`            | Registrar retorno da memória abaixo do threshold de atenção.                         |
| `worker_shutdown_started` / `worker_shutdown_completed`      | `info`            | Evidenciar encerramento gracioso e seu estado final.                                 |

O logger redige chaves como senha, token, segredo, autorização, cookie, credencial e conteúdo integral de playlist. Também mascara credenciais em query strings e limita tamanho de strings, erros e estruturas aninhadas. A sanitização é defensiva; ainda assim, novos campos sensíveis devem ser evitados na origem.

## 4. Thresholds operacionais

Os valores padrão foram escolhidos para alertar antes do limite PM2 de 512 MiB, não para substituir o limite do supervisor. Podem ser ajustados por ambiente sem recompilar o worker.

| Variável                         |   Padrão | Significado                                                                  |
| -------------------------------- | -------: | ---------------------------------------------------------------------------- |
| `WORKER_INTERVAL_MS`             | `900000` | Intervalo entre ciclos; valores abaixo de 30 segundos são rejeitados.        |
| `WORKER_HEARTBEAT_INTERVAL_MS`   |  `60000` | Frequência do heartbeat; valores abaixo de 30 segundos são rejeitados.       |
| `WORKER_MEMORY_WARN_MB`          |    `384` | Nível preventivo de RSS.                                                     |
| `WORKER_MEMORY_CRITICAL_MB`      |    `460` | Nível crítico; sempre fica acima do nível preventivo.                        |
| `WORKER_RESTART_ALERT_THRESHOLD` |      `5` | Reinícios PM2 que abrem alerta crítico no relatório.                         |
| `WORKER_LOCK_STALE_SECONDS`      |    `900` | Idade a partir da qual o lock é tratado como stale pelo relatório.           |
| `WORKER_HEARTBEAT_STALE_SECONDS` |    `180` | Tempo máximo esperado sem heartbeat quando PM2 informa o worker como online. |
| `WORKER_ERROR_ALERT_THRESHOLD`   |      `5` | Eventos de erro de controle na janela do relatório.                          |
| `WORKER_LOG_WINDOW_SECONDS`      |   `3600` | Janela de leitura dos eventos recentes do log.                               |

A configuração PM2 versionada declara os thresholds sem alterar o intervalo atual, o modo fork, o autorestart ou o `max_memory_restart`. O relatório não apaga locks e não reinicia processos; ele somente lê PM2, `/proc`, locks e logs.

## 5. Relatório e integração de alertas

O comando operacional é:

```bash
npm run worker:observability
```

Ele imprime um único objeto JSON com estado PM2, memória, CPU, uptime, reinícios, locks redigidos, contadores de logs, thresholds e alertas. Quando há qualquer alerta, o processo termina com código `1`, permitindo integração segura com cron, systemd timer, pipeline de deploy ou monitor externo. Para inspeção que não deve falhar o shell, use:

```bash
npm run worker:observability -- --no-fail
```

O relatório classifica como crítico, entre outros casos, worker ausente/offline, memória acima do crítico, reinícios acima do limite, lock stale, burst de erros e heartbeat stale. Locks de PID encerrado abaixo da janela stale são classificados como warning. Nenhuma limpeza automática foi adicionada ao relatório.

A implementação deliberadamente não envia alertas para e-mail, Telegram, Slack ou webhook nesta fase. Isso evita introduzir credenciais e dependências sem uma decisão de operação. O código de saída e o JSON são a interface estável para uma próxima integração.

## 6. Proteções de compatibilidade

A lógica de scheduler permanece anti-sobreposição: um tick em andamento continua impedindo um segundo tick e o próximo timer continua sendo agendado apenas após a conclusão do ciclo. O refresh segue sequencial por servidor, mantém o limite de resposta, o fallback M3U/Xtream e os locks existentes. A mudança no lock consiste apenas em callbacks opcionais de observabilidade; chamadas antigas continuam válidas sem fornecer observer.

As tabelas, migrations, permissões, autenticação, sessões, player, proxy, catálogo, checkout, webhook e chat não foram alterados. O relatório não consulta o banco e não expõe URLs, credenciais, UUIDs completos ou conteúdo de playlist.

## 7. Validação executada

A validação local foi concluída com os seguintes resultados:

| Verificação                                         | Resultado                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| `npm run test:worker`                               | 9 testes aprovados.                                                         |
| Teste de sanitização JSON                           | Aprovado, incluindo campos sensíveis aninhados e query strings.             |
| Teste de hash de correlação                         | Aprovado, determinístico e sem expor o identificador original.              |
| Teste de métricas/thresholds                        | Aprovado.                                                                   |
| Smoke test do relatório em diretório vazio          | Aprovado; JSON válido e código controlado com `--no-fail`.                  |
| Prettier direcionado                                | Aprovado.                                                                   |
| ESLint direcionado                                  | Aprovado sem exceções após tipagem local das consultas históricas do cache. |
| Build multisserviço completo                        | Aprovado com URL/chave pública do Supabase fornecidas em memória.           |
| Busca do identificador Supabase legado no `.output` | Nenhuma ocorrência.                                                         |
| Marcadores de observabilidade no bundle             | Encontrados em 2 artefatos server-side.                                     |
| Produção                                            | Sem deploy, reload ou alteração operacional nesta frente.                   |

## 8. Limitações e próximos passos

A solução entrega observabilidade profissional de primeira camada, mas não cria retenção histórica por si só. Para operar com SLOs, será necessário enviar o JSON para um coletor externo, manter série histórica de RSS/restarts/locks e configurar o canal de plantão. Também será necessário observar pelo menos alguns ciclos longos após um deploy autorizado para confirmar se o número de locks órfãos e reinícios diminui.

O baseline revelou comportamento que merece uma investigação operacional separada: reinícios acumulados, memória acima do limite PM2 em amostras e locks associados a PIDs mortos. Nenhuma remoção foi feita neste trabalho, porque limpeza de locks e restart exigem autorização operacional específica e backup conforme o procedimento do projeto.

O artefato está pronto para commit na branch de trabalho, mas **não deve ser publicado na produção automaticamente**. Para o primeiro deploy, o procedimento recomendado é backup/hash do `.output` atual, troca atômica, reload isolado apenas do worker, readiness, observação de memória e rollback imediato se houver aumento de falhas ou regressão do catálogo.

## Referências internas

[1]: ../../../src/worker.ts "Loop e ciclo do worker"
[2]: ../../../src/lib/worker-observability.server.ts "Logger e métricas do worker"
[3]: ../../../src/lib/server-filesystem-cache.server.ts "Lock e cache de filesystem"
[4]: ../../../src/lib/iptv-cache.server.ts "Refresh de catálogo e fallback"
[5]: ../../../deploy/pm2/ecosystem.config.cjs "Topologia e thresholds do PM2"
[6]: ../../../scripts/worker-observability-report.mjs "Relatório operacional JSON"
