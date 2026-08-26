# Especificação do chat premium MAGOPLAYERPRO

**Data:** 26 de agosto de 2026
**Autor:** Manus AI
**Objetivo:** transformar o suporte atual em uma central de atendimento profissional, sem quebrar autenticação, permissões, player, pagamentos ou contratos públicos.

## Referências de mercado

A especificação combina padrões observados em plataformas maduras, sem copiar código ou interface proprietária. A Intercom recomenda respostas rápidas, personalizadas, transparentes e com encerramento que convide o cliente a continuar a conversa [1]. A mesma plataforma separa tópicos automatizados, atributos estruturados e tags flexíveis para classificação, filtros e relatórios [2]. A Zendesk documenta triggers condicionais avaliados em ordem, tornando precedência e idempotência requisitos de automação [3]. A HubSpot organiza help desk com pipeline, status, prioridade, views, disponibilidade, roteamento, SLAs e relatórios [4], além de metas para primeira resposta, próxima resposta e fechamento, com horários e pausas configuráveis [5].

| Capacidade de referência  | Aplicação no MAGOPLAYERPRO                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Inbox centralizado        | Lista de atendimentos com busca, filtros, prioridade, status e seleção de protocolo.                 |
| Classificação estruturada | Categoria, prioridade e tags controladas; texto livre não substitui metadados.                       |
| Roteamento                | Responsável explícito e fila; a conversa não fica “online” sem disponibilidade comprovada.           |
| SLA                       | Primeira resposta, próxima resposta e resolução, com horário operacional e pausa aguardando cliente. |
| Automação                 | Eventos condicionais, ordenados, idempotentes e auditáveis.                                          |
| Confiabilidade            | Envio server-side, deduplicação, retry limitado e estados de mensagem.                               |
| Experiência               | Contexto do cliente, protocolo, respostas rápidas e encerramento reabrível.                          |
| Métricas                  | Volume, backlog, idade, primeira resposta, resolução, satisfação e falhas de entrega.                |

## Invariantes não negociáveis

Uma conversa pertence a exatamente um usuário e só pode ser visualizada pelo próprio usuário ou pela equipe autorizada. Toda mutação deriva o papel da sessão server-side; flags enviadas pelo navegador não concedem privilégio. Mensagens devem ser gravadas pelo backend, com identidade do remetente derivada da sessão, e o cliente nunca pode escolher `sender_id`, `closedByRole` ou contador de não lidas para obter autorização.

O histórico deve permanecer íntegro. Uma mensagem enviada duas vezes por retry não pode produzir duas respostas comerciais ou duas atualizações inconsistentes. A chave de idempotência precisa ser associada à thread e ao remetente, com retenção suficiente para cobrir reenvio de rede. Erros devem ser visíveis, mas nunca podem incluir tokens, senhas, URLs com credenciais ou conteúdo sensível desnecessário.

Os estados de uma conversa são `open`, `pending_customer`, `pending_support` e `closed`, com transições server-side. A primeira resposta começa o relógio de resolução e encerra o relógio de primeira resposta; quando a equipe aguarda o cliente, o SLA pode ser pausado. O encerramento é reabrível somente por uma nova mensagem válida do cliente ou por ação autorizada da equipe.

## Entrega desta evolução

A entrega realizada corrigiu o caminho mais crítico sem criar uma plataforma paralela: retirou gravações privilegiadas diretas da UI do owner, criou funções server-side para responder e anexar arquivos, validou autorização pelo usuário autenticado, aplicou limite anti-spam, registrou timestamps de resposta e evitou corridas de criação de thread. A UI mantém estados de envio e erro recuperável, mas o backend é a fonte de verdade.

Nesta entrega, o inbox do owner recebeu prioridade, categoria, responsável, estado operacional, filtros por protocolo/status/prioridade e índices compatíveis. A aplicação mantém os endpoints atuais como adaptadores de compatibilidade durante a transição. Nenhum campo administrativo é incluído no retorno do cliente quando não é necessário.

### Implementação realizada nesta rodada

| Área           | Entrega                                                                                                   | Estado                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Confiabilidade | Envio server-side, chave de idempotência, retry seguro, limite de tamanho e rate limit                    | Entregue no código                                          |
| Concorrência   | Índice único para uma thread ativa por usuário e tratamento de corrida                                    | Entregue na migration; pendente de aplicação                |
| Autorização    | Papel derivado da sessão, owner-only para respostas administrativas e sem confiança em flags do navegador | Entregue no código                                          |
| Anexos         | Validação de thread, tipo, tamanho, caminho, rate limit e URL assinada                                    | Entregue na migration/código; pendente de aplicação         |
| Inbox          | Filtros server-side por protocolo, status e prioridade; estados operacionais honestos                     | Entregue no código                                          |
| Operação       | Categoria, prioridade, responsável e campos-base para SLA                                                 | Entregue na migration/código; SLA automático ainda pendente |
| UX             | Estado da conversa, protocolo, histórico preservado, erro recuperável e composer contextual               | Entregue parcialmente                                       |
| Realtime       | Reconexão, deduplicação de evento e estado de entrega                                                     | Fase posterior                                              |
| Omnichannel    | E-mail, WhatsApp, automações externas e roteamento multicanal                                             | Fase posterior                                              |

As migrations `20260826180000_support_chat_reliability.sql`, `20260826200000_support_chat_storage_hardening.sql` e `20260826201000_support_ticket_operations.sql` foram apenas versionadas nesta rodada. Elas não foram aplicadas na produção. Antes da aplicação, é obrigatório backup verificável, revisão do SQL, teste em ambiente isolado e plano de rollback.

## Fases posteriores

Depois desta camada de confiabilidade, a evolução segue por etapas: realtime com reconexão e deduplicação; SLA e alertas; macros/respostas rápidas; busca avançada e views; métricas de atendimento; e, por último, integrações omnichannel. Anexos com validação de tipo, tamanho e URL assinada já foram incluídos nesta rodada. Cada etapa precisa de teste isolado e rollback próprio. Não se considera o chat 10/10 apenas porque a aparência ficou sofisticada.

## Critérios de aceitação

| Área            | Critério objetivo                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Isolamento      | Usuário A não lê, altera ou marca como lida a thread de B; owner autorizado vê as threads operacionais. |
| Identidade      | `sender_id` e papel são derivados da sessão; payload adulterado é ignorado ou rejeitado.                |
| Idempotência    | O mesmo envio/retry não cria duplicata além do comportamento documentado.                               |
| Concorrência    | Duas solicitações simultâneas não criam duas threads abertas para o mesmo usuário.                      |
| Rate limit      | Excesso controlado retorna erro compreensível e não grava mensagens adicionais.                         |
| Estados         | Toda transição inválida é recusada; fechamento e reabertura deixam histórico.                           |
| SLA             | Primeira resposta e resolução possuem timestamps consistentes e timezone UTC.                           |
| Realtime        | Reconnect e evento duplicado não duplicam mensagens na UI.                                              |
| Privacidade     | Logs e respostas não expõem credenciais ou dados de outro usuário.                                      |
| Operação        | Há métricas para backlog, idade, resposta, resolução, erro e satisfação.                                |
| Compatibilidade | Login, player, proxy, pagamentos e catálogo passam a suíte existente.                                   |

## Estado da produção

Esta especificação é de desenvolvimento. Nenhuma migration, deploy, restart, alteração de Nginx, alteração de firewall ou mudança de configuração produtiva será executada automaticamente. Antes de aplicar uma mudança de banco, será necessário backup verificável, revisão do SQL, teste fora da produção, plano de rollback e autorização explícita.

## Referências

[1]: https://www.intercom.com/help/en/articles/198-our-best-practice-guide-to-customer-support "Intercom — Our best practice guide to customer support"
[2]: https://www.intercom.com/help/en/articles/7126365-how-and-when-to-use-conversation-topics-attributes-and-tags "Intercom — Conversation topics, attributes, and tags"
[3]: https://developer.zendesk.com/api-reference/ticketing/business-rules/triggers/ "Zendesk Developer Docs — Triggers"
[4]: https://knowledge.hubspot.com/help-desk/overview-of-the-help-desk-workspace "HubSpot — Set up help desk"
[5]: https://knowledge.hubspot.com/help-desk/set-sla-goals-in-help-desk "HubSpot — Set SLA goals in help desk"
