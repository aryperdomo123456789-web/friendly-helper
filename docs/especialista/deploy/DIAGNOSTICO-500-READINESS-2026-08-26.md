# Diagnóstico do HTTP 500 no readiness — 2026-08-26

## Resumo

As duas tentativas de publicação do bundle com o endpoint Supabase atual foram revertidas automaticamente porque o readiness classificou o processo principal como indisponível. O bundle não era a causa do erro: ele respondeu `200` em processo isolado, com o mesmo diretório de trabalho e as variáveis de produção.

## Causa-raiz

O endpoint raiz do processo `main` atende HTML. O script `scripts/check-release-readiness.mjs` consultava todos os serviços com o header `Accept: application/json,text/plain`. Para o `main`, essa negociação de conteúdo resultava em HTTP `500` com a mensagem `Only HTML requests are supported here`, enquanto player e payments respondiam JSON normalmente.

## Correção

O readiness agora envia `Accept: text/html,application/xhtml+xml` para o serviço `main` e mantém `Accept: application/json,text/plain` para player e payments. A alteração não modifica rotas, contratos públicos, autenticação, player, proxy, catálogo, migrations ou banco.

O helper foi sincronizado na área isolada de release e validado contra as portas atuais, retornando readiness positivo. A correção foi versionada no commit `b5baa39` da branch `backup/stream-mago-bot-2026-08-05`.

## Procedimento de publicação

Antes de uma nova troca, deve existir backup root-only do `.output` ativo, hash do build anterior e hash do novo build. A troca deve ser atômica, os quatro processos devem ser recarregados individualmente e o readiness deve usar polling. Em falha de qualquer check crítico, o `.output` novo deve ser preservado para análise e o release anterior deve ser restaurado.

## Validações concluídas

O bundle novo contém `https://supabase.mago-bot.com`, não contém o projeto Supabase antigo e não embute valores de service-role, Mercado Pago, webhook ou segredo do proxy. Os quatro entrypoints foram gerados e o build local passou após a correção. A produção permanece no release anterior até uma nova janela autorizada e validada.

## Limitações

A validação de login administrativo e de usuário comum foi concluída no preview isolado, mas o login em produção ainda depende da publicação deste bundle. A senha de laboratório não é armazenada neste documento, em arquivos ou em commits; deve ser trocada antes do uso real.
