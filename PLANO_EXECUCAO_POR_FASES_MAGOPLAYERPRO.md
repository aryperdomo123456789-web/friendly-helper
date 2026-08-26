# Plano De Execucao Por Fases - MAGOPLAYERPRO

Este documento transforma a meta de arquitetura em um plano pratico de execucao.

O foco e evoluir com controle, priorizacao tecnica e rastreabilidade, sem mexer nos fluxos que ja estao estaveis.

## 1. Regra Principal

Antes de qualquer alteracao estrutural:

- preservar autenticacao atual
- preservar player e proxy de stream
- preservar edicao e listagem de servidores que ja funcionam
- preservar login, permissao e sessao
- preservar chat e pagamento ja implementados enquanto a base nova nao estiver pronta

Se um fluxo ja esta funcionando e nao precisa ser tocado para entregar a proxima fase, ele deve ficar fora da mudanca.

## 2. Ordem De Prioridade Tecnica

### 2.1 O que fazer primeiro

1. Fixar a base de dados e os relacionamentos centrais.
2. Garantir rastreio de pagamento, webhook e auditoria.
3. Separar a navegacao do usuario e do dono.
4. Tornar chat e comprovantes totalmente ligados ao usuario.
5. Aplicar paginacao consistente em listas grandes.
6. Introduzir realtime e invalidações inteligentes onde houver necessidade.
7. Refinar UI e modularizacao sem alterar regras de negocio estaveis.

### 2.2 O que nao pode ser mexido agora

- fluxo de login e permissao atual
- proxy de stream e logica de reprodução
- contrato de API que ja atende o player
- regras de acesso que ja estao funcionando em producao
- comportamento do seletor de servidor fora da correcao pontual que ja foi aplicada
- qualquer refatoracao grande de UI que misture dono e usuario no mesmo fluxo

## 3. Fases De Execucao

### Fase 0 - Congelamento Operacional

Objetivo:

- mapear o que existe hoje
- evitar regressao
- estabelecer pontos de controle

Entregas:

- inventario de rotas
- inventario de tabelas
- inventario de fluxos sensiveis
- lista do que nao deve ser alterado nesta etapa

Critério de saida:

- existe visao clara do que pode ser mexido sem quebrar o sistema

### Fase 1 - Base De Dados E Integridade

Objetivo:

- garantir que pagamentos, chat, auditoria e acesso tenham estrutura correta

Dependencias:

- banco de dados
- migrations
- indices
- relacoes

Entregas:

- `payments`
- `payment_events`
- `support_threads`
- `support_messages`
- `audit_logs`
- `notifications`
- chaves estrangeiras e indices
- constraints de integridade

O que precisa ser garantido:

- cada pagamento tem usuario vinculado
- cada pagamento tem plano vinculado
- cada webhook salva o payload recebido
- cada thread de chat pertence a um usuario
- cada mensagem pertence a uma thread
- cada acao sensivel gera auditoria

Critério de saida:

- o sistema consegue rastrear um evento do inicio ao fim no banco

### Fase 2 - Pagamentos, Webhook E Auditoria

Objetivo:

- transformar pagamento em fluxo rastreavel e confiavel

Dependencias:

- banco
- webhook
- provedor Mercado Pago
- auditoria

Entregas:

- criacao de preferencia ou intento com ID proprio
- salvamento do `provider_payment_id`
- salvamento do `provider_preference_id`
- salvamento do `external_reference`
- validacao de webhook
- idempotencia no processamento
- atualizacao de status de pagamento
- comprovante automatico no chat do usuario
- registro em auditoria de cada etapa

O que nao deve ser feito nesta fase:

- trocar toda a tela de pagamentos
- alterar o fluxo do usuario sem necessidade
- quebrar a compatibilidade com pagamentos ja existentes

Critério de saida:

- um pagamento aprovado aparece no chat correto, com rastreio completo e sem duplicidade

### Fase 3 - Chat Individual Por Usuario

Objetivo:

- impedir mistura de mensagens entre usuarios
- deixar o historico limpo e consultavel

Dependencias:

- banco
- UI do suporte
- auditoria

Entregas:

- thread principal por usuario ou modelo equivalente controlado
- historico paginado
- mensagens de sistema separadas por tipo
- comprovante de pagamento como evento visivel na thread
- suporte interno com contexto do usuario

Regras:

- usuario nao enxerga thread de outro usuario
- dono enxerga o necessario para operar suporte
- mensagem de comprovante deve ser distinguivel de mensagem humana

Critério de saida:

- o chat de cada usuario permanece isolado e rastreavel

### Fase 4 - Separacao De UI E Navegacao

Objetivo:

- tornar a experiencia mais profissional sem tocar na logica central

Dependencias:

- UI
- rotas
- permissao

Entregas:

- navegacao do usuario separada
- navegacao do dono separada
- rotas agrupadas por nucleo
- telas menores e mais claras
- componentes reutilizaveis por dominio

Regras:

- o usuario comum nao deve enxergar ferramentas do dono
- o dono nao deve depender de telas misturadas para operar
- a separacao visual nao pode mudar o comportamento da regra de negocio

Critério de saida:

- cada perfil entra no seu proprio fluxo sem confusao de contexto

### Fase 5 - Paginacao, Busca E Performance

Objetivo:

- evitar listas pesadas e melhorar experiencia em escala

Dependencias:

- queries
- UI de listagem
- API de paginação

Entregas:

- paginação server-side em areas administrativas
- paginação por cursor para chat e auditoria
- busca com paginação em usuarios, pagamentos e logs
- preservacao de filtros entre paginas

Regras:

- nada de listas infinitas sem controle
- nada de carregar tudo de uma vez quando houver grande volume

Critério de saida:

- o sistema continua rapido mesmo com crescimento de dados

### Fase 6 - Realtime E Atualizacao Imediata

Objetivo:

- reduzir dependencia exclusiva de cache invalido

Dependencias:

- realtime
- query invalidation
- canal de eventos

Entregas:

- atualizacao imediata para alteracoes sensiveis
- refetch automatico de telas afetadas
- sincronizacao do seletor de servidor
- sincronizacao de listas ligadas a usuario, pagamento e suporte

Regras:

- realtime deve ser usado onde o impacto visual ou operacional justificar
- nao substituir fluxo confiavel por polling agressivo sem motivo

Critério de saida:

- mudanças importantes aparecem no frontend sem o usuario precisar forcar atualizacao

### Fase 7 - Hardening Final

Objetivo:

- fechar lacunas de manutencao e operacao

Entregas:

- logs tecnicos padronizados
- alertas de erro critico
- revisao de permissoes
- revisao de indices
- revisao de mensagens e estados vazios
- revisao final de consistencia entre banco, webhook e UI

Critério de saida:

- o sistema fica pronto para operar com menos acoplamento e menos risco

## 4. Dependencias Por Dominio

### 4.1 O que depende de banco

- pagamentos
- eventos de pagamento
- auditoria
- threads de chat
- mensagens de chat
- notificacoes
- relacoes de usuario com servidor
- indices para consulta e paginacao

### 4.2 O que depende de UI

- navegacao por nucleo
- separacao do painel do dono
- area do usuario comum
- modais de edicao
- tabelas com paginação
- estados vazios e feedback visual

### 4.3 O que depende de webhook e auditoria

- pagamento aprovado
- pagamento recusado
- pagamento pendente
- reprocessamento de evento
- duplicidade de webhook
- comprovante no chat
- trilha tecnica de integracao

## 5. Fluxos Que Devem Ficar Protegidos

- editar servidor sem perder DNS
- renomear servidor a qualquer momento
- selecionar servidor no topo sem quebrar a sessao
- consumir canais, filmes e series sem mudar contrato de dados
- manter o checkout funcionando enquanto a arquitetura evolui
- manter o chat existente ate a migração controlada para threads individuais

## 6. Ordem Recomendada De Entrega

Se a equipe tiver que priorizar de forma objetiva:

1. banco e integridade
2. pagamento e webhook
3. auditoria
4. chat individual
5. separacao de UI
6. paginacao
7. realtime
8. refinamento final

## 7. Resultado Esperado

Ao final desse plano, a MAGOPLAYERPRO deve ter:

- mais rastreabilidade
- menos acoplamento
- mais controle operacional
- separacao clara entre dono e usuario
- pagamento totalmente vinculado ao usuario
- comprovante registrado no chat certo
- historico consultavel sem mistura
- atualizacao imediata quando for necessario

