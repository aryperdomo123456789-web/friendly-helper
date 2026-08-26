# Registro de deploy do endpoint Supabase — 2026-08-26

## Resultado

O bundle do MAGOPLAYERPRO foi publicado no aaPanel em troca atômica, com rollback preservado e reload individual de `main`, `player`, `payments` e `worker`. O release ativo usa o endpoint Supabase atual `https://supabase.mago-bot.com`.

## Hashes ativos

| Entrypoint | SHA-256 |
|---|---|
| `server/index.mjs` | `6650fe4e261fbfd07b7c7302008607427074cddc7ec8f787e94f033083f523ef` |
| `player/index.mjs` | `5eca3270926dbdfb93ae7460c51b4eac36819fe2e4c3895ce37297b4117eb423` |
| `payments/index.mjs` | `2d65079ab61fdec358282b9995b3237c117f5aac700b5a5f045608d321d34104` |
| `worker/index.mjs` | `6713452abbfe531163834c378b738c3faa256c5d0daf2e289dd13e575324870c` |

## Validações

O readiness passou com todos os quatro processos online e main, player e payments retornando HTTP `200`. O domínio público e `/dono` retornaram `200`. O bundle ativo contém a URL atual, não contém `swxxyftiwnpazegpkqib` e não contém os valores reais de service-role, Mercado Pago, segredo de webhook ou segredo do proxy.

O login administrativo de laboratório foi validado em produção e abriu `/painel`. Após logout, o usuário comum de laboratório foi autenticado e redirecionado para `/inicio`, carregando catálogo e servidor. `/conta` mostrou apenas recursos de cliente, sem controles administrativos.

O monitoramento por 60 segundos manteve os quatro processos online, sem novo restart, com worker aproximadamente em 59 MiB. O caminho de rollback ficou preservado em `/www/wwwroot/stream.mago-bot.com/.output.rollback-supabase-20260826T132000Z/`.

## Restrições preservadas

Nenhuma migration, banco, permissão, player, proxy, Nginx ou contrato público foi alterado nesta publicação. Nenhum `.env`, storage, playlist, log ou segredo foi incluído no release ou versionado.

A senha de laboratório não é registrada neste documento e deve ser trocada antes de qualquer uso real.
