# Registro de Deploy — Chat Premium

**Data:** 26 de agosto de 2026

**Projeto:** MAGOPLAYERPRO / WebPlayer

**Ambiente:** produção em `stream.mago-bot.com`

**Branch:** `backup/stream-mago-bot-2026-08-05`

**Autor:** Manus AI

## Objetivo

Publicar a evolução do chat premium com confiabilidade de mensagens, operação de inbox, proteção de anexos, estados de atendimento e campos básicos de SLA, preservando autenticação, permissões, catálogo, player, proxy e contratos públicos existentes.

## Pré-condições e rollback

O preflight foi executado em modo somente leitura. Antes de qualquer alteração foi criado e validado um backup PostgreSQL customizado da produção, com aproximadamente 59 MiB. O backup foi validado com a mesma família de ferramentas PostgreSQL usada pelo container, sem exposição de dados, credenciais ou conteúdo de mensagens.

O preflight encontrou uma duplicidade histórica de threads abertas para um único usuário laboratorial. A migration foi ajustada para consolidar a thread mais antiga de forma idempotente e preservar o histórico antes de criar a restrição de uma thread ativa por usuário. Nenhuma linha foi apagada.

A primeira tentativa de deploy foi interrompida pelo nome incorreto dos processos PM2 e a segunda pela ausência do script de readiness no diretório publicado. Em ambos os casos, a troca não foi considerada concluída e o procedimento preservou o build anterior. A terceira tentativa utilizou os nomes reais dos processos e uma cópia temporária do readiness, com troca atômica e rollback automático.

O build anterior permanece preservado no caminho de rollback versionado criado durante a troca. O rollback consiste em restaurar o diretório `.output` anterior e recarregar individualmente os quatro processos do aplicativo.

## Migrations aplicadas

As migrations foram executadas em uma única transação no PostgreSQL de produção, após dry-run transacional aprovado e backup validado.

| Migration | Finalidade | Resultado |
|---|---|---|
| `20260826180000_support_chat_reliability.sql` | Idempotência por remetente/chave, uma thread ativa por usuário e timestamps de atendimento | Aplicada |
| `20260826200000_support_chat_storage_hardening.sql` | Restringir anexos ao participante e ao caminho da própria thread | Aplicada |
| `20260826201000_support_ticket_operations.sql` | Prioridade, categoria, responsável e campos de SLA | Aplicada |

A verificação posterior confirmou a existência das colunas, índices, políticas e normalização esperadas. As migrations não removem tabelas, não alteram permissões de autenticação e não modificam contratos do player.

## Build e publicação

O build foi gerado a partir do commit validado da branch de trabalho, utilizando a URL pública correta do Supabase em memória. O identificador legado do projeto Supabase não apareceu no artefato final. A integridade do artefato foi comparada por manifesto SHA-256 ordenado por arquivo antes da troca.

O release final incluiu o hotfix `da630953e47e71a99f3160c25913f3e7bfbe7c83`, que corrigiu o caminho do painel owner para usar `sendSupportOwnerMessage` e `sendSupportAttachment` server-side. O caminho legado de gravação direta no componente do painel não faz parte do build ativo.

O readiness pós-deploy confirmou HTTP 200 para a aplicação principal, player e pagamentos, além de quatro processos PM2 online. O acesso HTTPS público também respondeu HTTP 200.

## Smoke tests realizados

O login do usuário comum de laboratório funcionou e o catálogo permaneceu acessível. A conta comum acessou o próprio suporte e visualizou somente seu histórico. Ao tentar acessar `/painel`, recebeu `Acesso restrito`, sem exposição do inbox, usuários, servidores ou configuração administrativa.

O login owner funcionou e o inbox administrativo carregou a conversa laboratorial. A resposta owner apareceu no histórico após publicação do hotfix. A verificação read-only do banco confirmou uma thread laboratorial, estado `pending_customer`, `first_response_at` preenchido, `last_owner_message_at` preenchido, uma mensagem do cliente, duas mensagens owner, uma mensagem de sistema e duas mensagens com chave de idempotência.

A primeira resposta owner enviada antes do hotfix ficou registrada como uma evidência de diagnóstico: a mensagem apareceu, mas não atualizou os timestamps operacionais. Esse comportamento foi corrigido no hotfix e comprovado por uma nova resposta enviada no build corrigido. Nenhum registro antigo foi alterado manualmente.

## Estabilidade pós-deploy

Após aproximadamente cinco minutos de uptime do release final, os quatro processos alvo permaneciam online e os health checks continuavam respondendo 200. A amostra registrou aproximadamente 92,8 MiB no processo principal, 54,1 MiB no player, 56,4 MiB nos pagamentos e 96,4 MiB no worker.

Os contadores históricos de restart observados foram 15 no processo principal, 12 no player, 12 nos pagamentos e 637 no worker. Esses valores são acumulados pelo PM2 e não representam novos reinícios durante a janela de observação. O worker permaneceu online durante a observação, mas a dívida histórica de reinícios continua sendo um item operacional separado.

## Resultado de segurança

Não foram alteradas credenciais, `.env`, Nginx, firewall ou portas públicas. O deploy não publicou segredos no GitHub. O painel owner deixou de gravar mensagens e anexos diretamente pelo cliente e passou a utilizar server functions com autorização derivada da sessão, validação de thread, limite de conteúdo, rate limit e idempotência.

O teste confirma isolamento funcional entre owner e usuário comum, mas não substitui uma auditoria externa de segurança, um teste de carga ou uma revisão formal de retenção de anexos. O teste de upload de arquivo não foi executado nesta janela; a migration e o handler foram aplicados e compilados, mas a confirmação ponta a ponta de imagem/áudio permanece pendente.

## Critérios e limites

O chat está **publicado e operacionalmente validado como uma fundação premium**, com a correção crítica de resposta owner confirmada em produção. Não é correto declarar 10/10 absoluto de mercado ainda. Permanecem como próximos incrementos: reconexão realtime resiliente, estados enviado/entregue/lido, SLA automático com alertas, macros, tags, atribuição de equipe, busca avançada, analytics de primeira resposta/resolução, teste de carga e integrações omnichannel.

A classificação atual é **9/10 para o escopo single-owner validado em produção**, porque confiabilidade, autorização, inbox e estados principais foram publicados e testados. A nota 10/10 exigiria fechar os itens operacionais acima e observar o sistema por uma janela mais longa, especialmente o worker.

## Referências versionadas

- [Commit do chat premium](https://github.com/aryperdomo123456789-web/friendly-helper/commit/ba3b52f)
- [Commit das migrations e rollout](https://github.com/aryperdomo123456789-web/friendly-helper/commit/a362f1f)
- [Hotfix do painel owner](https://github.com/aryperdomo123456789-web/friendly-helper/commit/da63095)
- [Especificação técnica do chat premium](../arquitetura/ESPECIFICACAO-CHAT-PREMIUM-2026-08-26.md)

## Conclusão

O rollout foi concluído com backup, dry-run, aplicação transacional, troca atômica, readiness, rollback preservado, smoke tests de duas identidades e observação de estabilidade. A produção está servindo o chat premium corrigido. O próximo trabalho de escala deve ser medido por carga e operação contínua, não por novas alterações cosméticas no componente.

> **Status final:** publicado, monitorado e sem falha crítica aberta no fluxo de texto owner. Upload ponta a ponta, realtime resiliente, SLA automatizado e carga permanecem como validações futuras.
