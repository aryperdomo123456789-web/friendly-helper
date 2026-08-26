# Diagnóstico residual de memória do worker — 2026-08-26

## Contexto

Após o deploy do commit `beb7221`, o scheduler deixou de sobrepor ciclos e o worker iniciou com aproximadamente 63 MiB. No ciclo seguinte, porém, o processo chegou a aproximadamente 596 MiB, reiniciou pelo limite de memória do PM2 e deixou locks de refresh. O cache local do servidor de maior volume ocupava aproximadamente 3,5 GiB.

## Causa

O pipeline M3U utilizava `response.text()` para materializar a resposta inteira, depois executava `playlistText.split(/\\r?\\n/)` e construía o catálogo. Esse caminho mantinha simultaneamente a resposta completa, a matriz de linhas e os objetos de catálogo. O fallback Xtream já era sequencial, mas cada resposta JSON ainda era materializada sem limite durante `response.text()` e `JSON.parse`.

## Correção aplicada no código

Foi criado `src/lib/response-limit.server.ts`, que verifica `Content-Length` quando disponível e limita a leitura do corpo por bytes usando `ReadableStream`. M3U e Xtream passaram a usar o limite de 32 MiB. Quando uma origem ultrapassa o limite, o download é cancelado e o refresh pode seguir para o fallback Xtream sem tentar carregar gigabytes em memória.

A leitura de snapshots locais foi protegida antes de `readFile`: arquivos JSON de playlist acima de 64 MiB são ignorados, tanto no cache ativo quanto no legado. Isso evita que um request do player reabra um snapshot local gigante. O contrato `PlaylistSnapshot`, o parser para respostas válidas e os contratos públicos do player foram preservados.

## Validação

A suíte `npm run test:worker` passou com seis testes, cobrindo scheduler e leitor limitado. O `npm run build` passou com os quatro entrypoints e CSS legado. ESLint e Prettier passaram nos arquivos diretamente alterados.

## Limites e riscos restantes

O limite de 32 MiB é uma proteção contra OOM e contra payloads anômalos; ele não substitui um parser M3U verdadeiramente incremental. Uma playlist legítima maior que o limite será rejeitada e cairá no Xtream. O próximo passo recomendado é implementar parsing incremental com persistência resumida, depois medir por servidor antes de aumentar quotas.

O deploy desta segunda correção ainda requer nova janela controlada com backup do `.output` ativo, troca atômica, reload individual dos quatro processos e observação de pelo menos um ciclo do worker. O rollback é a restauração do diretório `.output.rollback-*` preservado no primeiro deploy.

## Rollback

Não aplicar `git reset --hard` nem remover o release anterior. Em caso de falha, restaurar o `.output` anterior preservado, recarregar cada processo individualmente e validar player, payments, domínio HTTPS e worker. A migration de capacidade e a migration de idempotência já aplicadas permanecem compatíveis com o código anterior.
