# Checklist Chat Premium SaaS

## Antes de iniciar
- [ ] Confirmar que o fluxo atual de envio direto continua sem confirmacao.
- [ ] Confirmar que o chat do dono e o do cliente continuam separados.
- [ ] Confirmar que `support_threads` e `support_messages` seguem como fonte unica do chat.

## Fase 1 - Status em tempo real
- [ ] Mostrar badge de status no card da thread.
- [ ] Derivar estado a partir de `status`, `last_message_at`, `last_owner_message_at`, `last_user_message_at`.
- [ ] Exibir `Ao vivo` quando a conversa estiver ativa recentemente.
- [ ] Exibir `Aguardando suporte` quando o ultimo envio for do cliente.
- [ ] Exibir `Aguardando cliente` quando o ultimo envio for do suporte.
- [ ] Exibir `Fechado` quando `status = closed`.
- [ ] Validar que a thread atualiza sem refresh manual.

## Fase 2 - Respostas rapidas
- [ ] Criar fonte configuravel em `app_config` para quick replies.
- [ ] Renderizar no maximo 5 sugestoes por contexto.
- [ ] Permitir preencher o input com um clique.
- [ ] Manter envio direto, sem modal.
- [ ] Priorizar respostas tecnicas quando houver palavras-chave do problema.
- [ ] Evitar poluir o rodape do chat.

## Fase 3 - Inbox mais leve
- [ ] Reduzir a quantidade de meta informacao por card.
- [ ] Manter apenas nome, protocolo, status, ultima mensagem, unread e tempo relativo.
- [ ] Garantir que apenas a thread selecionada carregue mensagens.
- [ ] Manter paginacao no inbox.
- [ ] Evitar invalidar queries fora da thread afetada.
- [ ] Testar com varias threads abertas.

## Validacao final
- [ ] Enviar mensagem do cliente e do dono.
- [ ] Verificar realtime no inbox.
- [ ] Verificar leitura/nao lida.
- [ ] Verificar encerramento de atendimento.
- [ ] Verificar avaliacao 1 a 5.
- [ ] Verificar anexos.
- [ ] Verificar performance da tela com muitas threads.
- [ ] Reiniciar e salvar os processos PM2 do projeto.

## Regra de ouro
- [ ] Nao quebrar o que ja funciona para melhorar o que ainda pode ser refinado.
