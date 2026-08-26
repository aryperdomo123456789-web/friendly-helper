# Meta de Arquitetura por Nucleos - MAGOPLAYERPRO

Este documento define a meta de evolucao do sistema MAGOPLAYERPRO para uma arquitetura mais profissional, rastreavel e facil de manter, sem quebrar os fluxos que ja funcionam hoje.

O objetivo nao e refazer tudo de uma vez. O objetivo e separar responsabilidades com seguranca, paginação e auditoria, preservando o comportamento atual enquanto o sistema evolui por etapas.

## 1. Objetivo Central

Transformar a MAGOPLAYERPRO em um sistema com nucleos claros, onde cada area tenha:

- responsabilidade unica
- navegacao propria
- dados proprios
- rastreio de eventos
- paginacao consistente
- historico auditavel
- integracao previsivel entre modulos

## 2. Principios Do Projeto

### 2.1 Nao quebrar fluxos existentes

Tudo que ja funciona bem deve continuar funcionando durante a separacao.

Regras:

- nao misturar grandes refatoracoes com mudanças de negocio
- nao alterar rotas estaveis sem necessidade
- nao remover comportamento atual sem substituir por equivalente
- manter compatibilidade com dados e APIs existentes enquanto a migracao acontece

### 2.2 Separar por responsabilidade

Cada nucleo deve ser pequeno o suficiente para ser entendido sozinho.

### 2.3 Rastreabilidade total

Toda acao relevante precisa deixar trilha:

- quem fez
- quando fez
- o que foi alterado
- qual usuario foi afetado
- qual pagamento, chat ou evento foi relacionado

### 2.4 Paginacao como regra

Listagens grandes devem usar paginacao desde o inicio.

Prioridades:

- paginacao server-side para administracao
- paginacao por cursor para historico de chat
- filtros com paginação em pagamentos
- busca + paginação em usuarios e logs

## 3. Mapa De Nucleos

### 3.1 Nucleo do Usuario

Responsavel pela experiencia do usuario final.

Escopo:

- inicio
- catalogo
- filmes
- series
- canais
- servidores liberados
- conta do usuario
- renovacao
- comprovantes
- chat de suporte do proprio usuario

Rotas sugeridas:

- `/inicio`
- `/canais`
- `/filmes`
- `/series`
- `/servidores`
- `/conta`
- `/pagamentos`
- `/suporte`

Regras:

- o usuario nao deve ver ferramentas de dono
- o usuario nao deve enxergar dados de outros usuarios
- o historico do chat deve ser individual por usuario
- comprovantes de pagamento devem aparecer na propria timeline do usuario

### 3.2 Nucleo do Dono

Responsavel por operacao, configuracao, controle e auditoria.

Escopo:

- usuarios
- servidores
- planos
- configuracoes
- pagamentos
- auditoria
- suporte interno
- notificacoes
- logs de integracao

Rotas sugeridas:

- `/painel/dono`
- `/painel/usuarios`
- `/painel/servidores`
- `/painel/planos`
- `/painel/pagamentos`
- `/painel/suporte`
- `/painel/auditoria`
- `/painel/configuracoes`
- `/painel/notificacoes`
- `/painel/logs`

Regras:

- o dono precisa ter visao completa
- o painel deve ser modular
- cada modulo deve carregar somente o necessario
- a navegacao do dono deve ser separada da navegacao do usuario comum

### 3.3 Nucleo de Chat Interno

Responsavel pela comunicacao assíncrona e rastreavel.

Escopo:

- chat por usuario
- mensagens do suporte
- comprovantes de pagamento
- avisos automaticos
- respostas do suporte

Regras:

- cada usuario deve ter uma thread principal ou um conjunto controlado de threads
- mensagens nao podem se misturar entre usuarios
- cada mensagem deve ter tipo definido
- comprovantes e eventos de pagamento devem ser anexados na thread correta

Tipos de mensagem sugeridos:

- `user_message`
- `support_reply`
- `payment_receipt`
- `payment_event`
- `system_notification`
- `admin_note`

### 3.4 Nucleo de Pagamentos

Responsavel por cobranca, renovacao e prova de pagamento.

Escopo:

- criacao de cobranca
- status de pagamento
- webhook
- comprovante
- renovacao de plano
- auditoria de evento financeiro

Regras:

- cada pagamento deve ter um ID proprio
- cada pagamento deve estar ligado a um usuario
- cada pagamento deve estar ligado a um plano
- cada pagamento deve guardar o ID externo do Mercado Pago
- cada webhook recebido deve ser registrado antes do processamento
- cada pagamento aprovado deve gerar comprovante no chat do usuario

Campos minimos recomendados:

- `id`
- `user_id`
- `plan_id`
- `provider`
- `provider_payment_id`
- `provider_preference_id`
- `external_reference`
- `status`
- `amount`
- `currency`
- `created_at`
- `approved_at`
- `webhook_payload`
- `webhook_received_at`

### 3.5 Nucleo de Servidores

Responsavel pela infraestrutura de fonte IPTV.

Escopo:

- cadastro
- edicao
- credenciais
- DNS
- ordem
- status ativo/inativo
- atribuicao de acesso aos usuarios

Regras:

- editar servidor nao pode apagar DNS por acidente
- nome do servidor deve ser renomeavel a qualquer momento
- credenciais devem ser protegidas
- o usuario final nao deve ver credenciais originais

### 3.6 Nucleo de Planos

Responsavel pelas regras comerciais.

Escopo:

- nome do plano
- preco
- duracao
- conexoes
- elegibilidade
- bonus de indicacao

Regras:

- precos e duracoes devem ser centralizados
- alteracoes devem ser auditadas
- o plano precisa ser referenciavel por pagamentos e renovações

### 3.7 Nucleo de Auditoria

Responsavel por historico tecnico e operacional.

Escopo:

- login
- alteracao de perfil
- edicao de servidor
- alteracao de plano
- pagamento
- webhook
- chat
- notificacoes
- acao administrativa

Regras:

- toda acao sensivel deve gerar log
- logs devem ser consultaveis por data, usuario e tipo
- logs nao devem substituir dados de negocio; devem complementar

### 3.8 Nucleo de Notificacoes

Responsavel por alertas, avisos e comunicacao massiva.

Escopo:

- notificacao de pagamento aprovado
- notificacao de renovacao
- aviso de expiracao
- mensagens em massa
- alertas do suporte

Regras:

- notificacoes automatizadas devem estar ligadas a eventos
- notificacoes manuais devem ser auditadas
- notificacoes relevantes devem ter registro no chat do usuario

### 3.9 Nucleo de Logs Tecnicos

Responsavel por falhas, integracoes e diagnostico.

Escopo:

- webhook recebido
- erro de API
- erro de pagamento
- erro de chat
- erro de servidor
- erro de integracao externa

Regras:

- log tecnico nao e historico de negocio
- log tecnico deve ajudar suporte e engenharia
- erros de integracao devem ser consultaveis sem expor segredos

## 4. Separacao De Navegacao

### 4.1 Navegacao do usuario

Deve ser simples e focada no consumo.

Blocos:

- home
- catalogo
- servidores
- conta
- pagamentos
- suporte

### 4.2 Navegacao do dono

Deve ser operacional e orientada a gestao.

Blocos:

- usuarios
- servidores
- planos
- pagamentos
- chat interno
- notificacoes
- auditoria
- configuracoes
- logs

### 4.3 Regra de isolamento visual

A experiencia do usuario e do dono nao devem se misturar.

O dono pode acessar tudo, mas o usuario normal deve ver apenas o necessario.

## 5. Modelo De Rastreamento

### 5.1 Pagamentos

Cada pagamento deve ser rastreavel do inicio ao fim.

Fluxo:

1. usuario escolhe plano
2. sistema cria intento/preferencia/pagamento
3. ID externo e salvo
4. webhook chega
5. sistema valida evento
6. sistema confirma status
7. sistema atualiza assinatura
8. comprovante vai para o chat do usuario
9. auditoria registra tudo

### 5.2 Chat

Cada usuario deve ter contexto proprio.

Fluxo:

1. thread do usuario e localizada ou criada
2. mensagem do usuario entra na thread dele
3. mensagem do suporte entra na mesma thread
4. comprovante de pagamento entra como mensagem de sistema
5. eventos importantes ficam visiveis no historico

### 5.3 Auditoria cruzada

Um unico evento pode gerar rastros em mais de um nucleo.

Exemplo de pagamento aprovado:

- registro financeiro
- atualizacao de assinatura
- mensagem no chat
- evento na auditoria
- possivel notificacao adicional

## 6. Estrutura De Dados Recomendada

### 6.1 Entidades centrais

- `profiles`
- `subscription_plans`
- `iptv_servers`
- `server_credentials`
- `user_server_access`
- `support_threads`
- `support_messages`
- `payments`
- `payment_events`
- `audit_logs`
- `notifications`

### 6.2 Relacionamentos importantes

- `payments.user_id -> profiles.id`
- `payments.plan_id -> subscription_plans.id`
- `payment_events.payment_id -> payments.id`
- `support_threads.user_id -> profiles.id`
- `support_messages.thread_id -> support_threads.id`
- `audit_logs.user_id -> profiles.id`
- `audit_logs.actor_user_id -> auth.users.id`

### 6.3 Regras de integridade

- pagamento sem usuario nao existe
- mensagem sem thread nao existe
- comprovante sem pagamento vinculado nao existe
- evento de webhook sem payload nao existe
- log sensivel sem ator nao deve existir

## 7. Paginacao E Consulta

### 7.1 Quando usar paginacao

- lista de usuarios
- lista de pagamentos
- lista de mensagens antigas
- lista de auditoria
- lista de servidores em escala maior
- lista de notificacoes

### 7.2 Tipo de paginacao recomendado

- `offset + limit` para telas simples
- cursor por data/ID para chat e auditoria pesada
- paginação server-side para dados administrativos

### 7.3 Regras de UX

- nunca carregar historico infinito sem estrategia
- sempre mostrar total ou contexto da pagina
- filtros precisam manter estado ao trocar de pagina

## 8. Fases De Implementacao

### Fase 1 - Organizacao estrutural

Objetivo:

- separar mentalmente e visualmente os nucleos
- organizar rotas e menus
- preservar o comportamento atual

Entrega:

- navegacao do usuario separada
- navegacao do dono separada
- rotas agrupadas por dominio funcional

### Fase 2 - Pagamentos rastreaveis

Objetivo:

- registrar cada pagamento com ID proprio
- registrar webhook e status
- vincular pagamento ao usuario

Entrega:

- tabela de pagamentos
- tabela de eventos de pagamento
- comprovante automatico no chat

### Fase 3 - Chat por usuario

Objetivo:

- transformar chat em historico individual
- impedir mistura entre usuarios

Entrega:

- thread unica ou controlada por usuario
- comprovantes e notificacoes dentro da thread
- suporte interno com contexto

### Fase 4 - Auditoria e logs

Objetivo:

- tornar tudo consultavel
- eliminar eventos “invisiveis”

Entrega:

- auditoria operacional
- logs de integracao
- trilha por usuario e por acao

### Fase 5 - Refinamento e escalabilidade

Objetivo:

- otimizar paginação
- separar mais as telas
- melhorar manutencao

Entrega:

- modulos menores
- telas mais rapidas
- menor acoplamento

## 9. Critérios De Pronto

O projeto so deve ser considerado bem separado quando:

- usuario comum nao enxerga area de dono
- dono acessa area administrativa sem misturar com consumo
- cada pagamento tem ID e usuario vinculados
- cada pagamento aprovado gera comprovante no chat
- historico de chat e individual
- paginacao existe nas listas grandes
- auditoria registra eventos sensiveis
- erros de integracao podem ser investigados

## 10. O Que Nao Fazer

- nao centralizar tudo em uma unica pagina gigante
- nao misturar suporte, pagamento e configuracao sem separacao
- nao deixar chat sem thread por usuario
- nao registrar pagamento sem vinculo com usuario
- nao depender apenas de logs soltos
- nao quebrar o fluxo atual para refatorar arquitetura

## 11. Diretriz Final

A MAGOPLAYERPRO deve evoluir como um sistema de nucleos conectados, nao como uma unica pagina com tudo dentro.

O padrao desejado e:

- cada area tem dono
- cada evento tem rastro
- cada usuario tem historico proprio
- cada pagamento tem identidade unica
- cada tela carrega apenas o que precisa

Essa e a base para crescer com seguranca, clareza e profissionalismo.

