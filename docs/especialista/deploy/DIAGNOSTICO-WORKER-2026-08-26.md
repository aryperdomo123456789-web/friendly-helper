# Diagnóstico e correção do worker — 2026-08-26

## Contexto

A auditoria de produção do MAGOPLAYERPRO observou 566 reinícios no processo `stream-mago-bot-worker`. O PM2 registrou reinícios por `max_memory_restart`, com aproximadamente 970 MiB e 610 MiB contra o limite de 512 MiB. Os logs também registraram contenção repetida do lock de refresh e falhas de download M3U com fallback Xtream.

## Causa técnica confirmada no código

O worker usava `setInterval` para chamar `runTick()` a cada 15 minutos sem aguardar a conclusão do tick anterior. Como o refresh de catálogo de um servidor pode durar mais do que o intervalo, ciclos podiam se sobrepor. O pipeline M3U mantém o texto completo em memória, calcula hash, faz `split` para contagem e parseia a playlist antes de cortar cada categoria em até 4.000 itens. No fallback Xtream, live, movie e series eram buscados em `Promise.all`, mantendo respostas grandes simultaneamente.

## Correção aplicada nesta etapa

A alteração é limitada ao código local e não foi publicada na produção:

1. `src/lib/worker-scheduler.ts` introduz um scheduler testável que mantém no máximo um tick em andamento, agenda o próximo tick apenas depois da conclusão e aguarda o tick ativo no shutdown.
2. `src/worker.ts` passa a usar o scheduler, registra sinais antes do primeiro refresh e mantém a ordem atual das tarefas e o intervalo configurado.
3. `src/lib/iptv-cache.server.ts` busca live, movie e series sequencialmente no fallback Xtream, preservando o formato do catálogo.
4. `scripts/worker-scheduler.test.ts` cobre anti-sobreposição, reagendamento após conclusão e espera segura no shutdown.
5. `package.json` inclui `npm run test:worker` sem dependência nova.
6. `scripts/generate-legacy-css.mjs` deixa de depender de `/www/wwwroot/stream.mago-bot.com` e usa `.output/public` relativo ao workspace, com `MAGO_OUTPUT_DIR` opcional para ambientes específicos.

## Rollback

O rollback da alteração é feito revertendo o commit desta correção. Não é necessário apagar histórico, usar force push ou executar migration. A publicação em produção exige backup/verificação do build, janela operacional e plano de retorno para o build anterior.

## Fora desta etapa

Não foi aplicado streaming parser da playlist, limite de bytes, fila persistente, lease distribuído, dead-letter, rotação de segredos, alteração de `max_memory_restart`, mudança de usuário do processo, migration ou deploy. Esses pontos exigem diagnóstico e plano próprios para preservar o contrato do player e o comportamento de produção.

## Validação

A suíte `npm run test:worker` passou com 3 testes. O `npm run build` passou localmente usando Bun disponibilizado no ambiente de build e gerou `.output/public/legacy.css`, `.output/player/index.mjs`, `.output/payments/index.mjs` e `.output/worker/index.mjs`. O lint global permanece bloqueado por problemas preexistentes de formatação no repositório; lint e Prettier passaram no subconjunto novo/alterado, com exceção do arquivo legado `src/lib/iptv-cache.server.ts`, que já apresentava divergência de estilo antes desta alteração.
