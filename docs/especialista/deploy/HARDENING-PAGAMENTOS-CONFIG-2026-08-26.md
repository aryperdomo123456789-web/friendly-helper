# Hardening de configuração e pagamentos — 2026-08-26

## Alterações preparadas

A configuração pública e a configuração administrativa foram separadas. `getAppConfig` continua abastecendo login, branding, TMDB, EPG e tema, mas não devolve `mp_access_token` nem `mp_webhook_secret`. O painel usa `getAdminAppConfig`, protegido por `requireSupabaseAuth` e pela validação server-side de papel `owner`/`admin`. A configuração completa usada pelo checkout fica em `src/lib/config.server.ts` e é carregada apenas dentro de handlers server-side.

A simulação de pagamento foi restringida. Em `NODE_ENV=production`, usuário comum não pode simular aprovação; owner/admin ainda pode executar uma simulação controlada. Fora de produção, o usuário autenticado só pode simular a própria conta. O checkout real continua usando token server-side, preferência do Mercado Pago, `external_reference` e registro local.

O webhook deixou de aceitar segredo ausente como assinatura válida, não registra o payload inteiro no log e passa a consultar `claim_payment_approval` antes de aplicar renovação, indicação e comprovante. A função retorna `should_apply=false` em replay de um pagamento já aprovado e mantém o evento/auditoria da duplicidade sem repetir os efeitos.

## Migration pendente

`supabase/migrations/20260826090000_claim_payment_approval.sql` cria a função `public.claim_payment_approval` como `security definer`, com `search_path=public`, lock da linha de pagamento e concessão de execução somente para `service_role`. A função usa os índices/constraints únicos já existentes em `provider_payment_id` e `provider_preference_id` e valida que usuário/plano não mudem para um pagamento existente.

A migration **não foi aplicada** em produção. Antes da aplicação, é obrigatório fazer backup verificável do banco, testar em staging compatível, conferir o plano de rollback e validar o resultado das funções com pagamento pendente, aprovado, replay e conflito de usuário/plano. Se a migration for aplicada, o rollback deverá ser uma migration posterior que remova a função somente depois de retirar o uso no código ou restaurar o código compatível.

## Compatibilidade e risco

O código do webhook novo depende da função SQL. Portanto, publicar o código antes da migration deixaria aprovações sem processamento; aplicar a migration antes do código é compatível, pois apenas cria uma função não utilizada até a publicação. A ordem segura é: backup, migration em staging, validação, backup de produção, migration em produção, publicação do código, smoke test assinado e observação.

O fail-closed do segredo pode retornar `503` quando `mp_webhook_secret` não estiver configurado. Na fotografia de produção de 26 de agosto, `mp_enabled=false`, token ausente e segredo ausente. Por isso, não se deve publicar esse caminho em produção antes de configurar e validar o segredo do webhook em janela autorizada.

## Validação local

`npm run test:worker` passou com 3 testes. `npm run build` passou localmente usando Bun fornecido via `npm exec`, gerando o CSS legado e os entrypoints main/player/payments/worker. O lint global possui problemas preexistentes de formatação no repositório; os arquivos novos do scheduler e o script de build passaram no lint direcionado. A migration foi revisada estaticamente, mas não foi executada contra banco.
