# QA de EPG multi-canal, QoE e escala sintética — 2026-08-28

## Resumo executivo

Esta entrega evolui o MAGOPLAYERPRO em três superfícies: grade EPG multi-canal com virtualização bidimensional, auto-healing do player com failover limitado e proteção de sessão para tokens HMAC. O trabalho foi publicado após backup PostgreSQL, migration aditiva, build sanitizado, testes determinísticos e observação pós-restart dos quatro processos PM2.

O resultado é uma base mais próxima de um produto OTT comercial, mas os números abaixo não são uma certificação de 60 FPS, disponibilidade de alta escala ou compatibilidade universal. A medição de EPG é sintética e local; a medição de PM2 é uma janela de 60 segundos em produção. O próximo gate ainda é teste físico/multi-browser e carga prolongada.

## Implementação

| Frente | Estado entregue |
|---|---|
| EPG 2D | Linhas por canal, eixo temporal horizontal, busca instantânea, janela vertical e janela temporal virtualizada. O DOM recebe somente linhas e eventos que intersectam o viewport mais overscan. |
| Índice EPG | Parsing de timestamps, ordenação determinística, programa atual, busca por linha e seleção temporal por busca binária. |
| Cache | IndexedDB continua escopado por usuário, servidor e canal. O snapshot local permanece fallback; o servidor continua sendo a fonte de verdade. |
| QoE | Telemetria de first frame, buffer start/end, resumo terminal de stalls, duração observada, taxa de stalls por minuto e eventos de qualidade. |
| Auto-healing | Máquina pura com estados `healthy`, `degraded`, `recovering`, `switching_upstream` e `failed`; recovery e troca de upstream são finitos. |
| Failover | Candidatos de playback por DNS alternativo, mantendo a origem primária primeiro e limite máximo de candidatos. |
| HMAC/replay | Envelope HMAC v2 com JTI e session key. O token-raiz pode criar a sessão HttpOnly; tokens filhos exigem o cookie da mesma sessão e o mesmo subject. |

## Benchmark sintético reproduzível

O script `scripts/stream-load.mjs` executa parsing/indexação e consultas sobre uma carga determinística de 48 canais e 240 programas por canal. Também simula 256 sessões de playback com 7.680 ticks e falhas controladas.

| Métrica | Resultado |
|---|---:|
| Eventos EPG | 11.520 |
| Canais | 48 |
| Indexação | 8,55 ms |
| Buscas | 1.000 |
| Tempo total de busca/virtualização | 590,87 ms |
| Média por busca | 0,5909 ms |
| Média de linhas virtuais | 6,83 |
| Média da janela temporal virtual | 1.014,4 px |
| Sessões simuladas | 256 |
| Ticks de playback simulados | 7.680 |
| Ações de recovery | 294 |
| Trocas de upstream | 2 |
| Tempo das decisões de recovery | 2,64 ms |

Esses resultados demonstram que o algoritmo puro não precisa materializar os 11.520 eventos no DOM. Eles não demonstram a taxa de frames do navegador, pois não substituem medição com DevTools, dispositivos físicos ou um browser real sob carga.

## Telemetria e PM2 em produção

Após o deploy, foram coletadas 12 amostras, aproximadamente uma a cada cinco segundos, dos quatro serviços. CPU é a leitura instantânea de `%CPU` do processo no momento da amostra; RSS é memória residente em KiB.

| Serviço | Amostras | CPU média | RSS médio | Observação |
|---|---:|---:|---:|---|
| `stream-mago-bot` | 12 | 3,97% | 87.260 KiB | Processo principal online. |
| `stream-mago-bot-player` | 12 | 0,82% | 55.441 KiB | Serviço dedicado online. |
| `stream-mago-bot-payments` | 12 | 0,85% | 57.525 KiB | Serviço de pagamentos online. |
| `stream-mago-bot-worker` | 12 | 14,63% | 288.208 KiB | Pico de memória relevante; exige observação de longo prazo. |

O worker continua sendo o componente de maior risco operacional. Uma janela curta de estabilidade não é suficiente para afirmar ausência de vazamento, pressão de heap ou comportamento seguro sob concorrência prolongada.

## Segurança e replay

A migration `20260827010000_stream_token_sessions.sql` criou uma tabela sem acesso para `anon` ou `authenticated`, com RPC `security definer` concedida somente a `service_role`. O fluxo validado transacionalmente foi:

| Cenário | Resultado |
|---|---|
| Token-raiz, sem sessão prévia | Permitido e cria sessão. |
| Mesmo token/sessão sem cookie | Rejeitado. |
| Token filho com cookie correto | Permitido. |
| Token com subject diferente | Rejeitado. |
| Token expirado | Rejeitado pelo envelope HMAC/AES antes do claim. |
| Assinatura adulterada | Rejeitada. |

O mecanismo não transforma cada segmento HLS em token de uso único, pois retries legítimos e múltiplas requisições do mesmo playback precisam continuar funcionando. A proteção entregue é **binding de sessão durável**: copiar um link e reutilizá-lo fora da sessão HttpOnly original é bloqueado. Isso é proteção contra reutilização não autorizada, não DRM nem garantia de impossibilidade de captura por um cliente já autorizado.

## Produção e rollback

O banco foi protegido por dump custom PostgreSQL de 22.239.763 bytes, SHA-256 `a423f5de…`. A migration foi aplicada sem alterar dados existentes. A validação final confirmou tabela nova com RLS habilitado e zero registros reais de sessão após o smoke transacional.

O build ativo foi publicado com manifesto determinístico `fb78624f…`, igual no local e no stage remoto. Root SSR respondeu `200`, o asset extraído do HTML respondeu `200`, token inválido respondeu `403` e os quatro PM2 ficaram online após restart real. O rollback anterior permaneceu preservado. Scripts temporários de deploy e medição foram removidos.

## Testes e versionamento

A suíte determinística passou em **49/49**. O benchmark EPG/recovery foi executado sem rede e sem origem IPTV. O `git diff --check` passou. O build sanitizado foi produzido com os valores atuais de produção em memória, sem versionar `.env`, e o identificador legado de Supabase não apareceu nos artefatos.

O código foi versionado no commit [`5d66c54`](https://github.com/aryperdomo123456789-web/friendly-helper/commit/5d66c54) na branch `backup/stream-mago-bot-2026-08-05`. A documentação anterior de streaming foi mantida; este relatório registra a matriz 2D, auto-healing, segurança de sessão e evidências de escala sintética.

## Limitações e próximos gates

Ainda não é correto declarar 8,5/10 ou top 1. Faltam playback real multi-browser em Safari/iOS, Android, tablet e TV; estatística de TTFF e rebuffer em amostras suficientes; teste de recovery durante perda real de segmento; carga prolongada de reprodução concorrente; análise de heap do worker; teste de restauração do backup; e validação end-to-end do painel com sessão autenticada após a publicação.

A próxima etapa profissional é executar a matriz de compatibilidade e uma janela de estabilidade de 24–72 horas com dados QoE agregados, sem expor URLs upstream, tokens, credenciais ou identificadores de usuário.

## Referências

[1]: https://google.aip.dev/151 "Google AIP-151 — Long-running operations"
[2]: https://github.com/video-dev/hls.js/blob/master/docs/API.md "HLS.js API e políticas de buffer/retry"
[3]: https://hlsjs-dev.video-dev.org/api-docs/ "HLS.js API Reference"
[4]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API "MDN IndexedDB API"
