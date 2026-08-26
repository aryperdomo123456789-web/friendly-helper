# Plano Especializado - PM2 Por Servicos e Nucleos

Atualizado em: 2026-08-14

Este documento define uma arquitetura de evolucao em servicos para a MAGOPLAYERPRO, com foco em separar responsabilidades reais de operacao sem quebrar os fluxos que ja funcionam.

O objetivo nao e dividir tudo em muitos processos por impulso.
O objetivo e criar fronteiras tecnicas claras onde existe ganho operacional de verdade.

## 1. Resumo Executivo

O desenho recomendado e este:

1. Um processo PM2 para a aplicacao principal.
2. Um processo PM2 para o player / proxy de stream.
3. Um processo PM2 para pagamentos / webhooks.
4. Um processo PM2 para worker assincrono.

Essa separacao faz sentido porque cada grupo tem nivel diferente de carga, risco e ritmo de mudanca.

### O que fica na aplicacao principal

- usuario comum
- dono
- servidores
- indicacao
- suporte UI

### O que fica no player / proxy

- proxy de stream
- criptografia do token de stream
- reescrita de playlist
- validacao de acesso de playback
- cache do catalogo de IPTV

### O que fica em pagamentos / webhooks

- criacao de preferencia
- recebimento de webhook
- conciliacao
- rastreio financeiro
- comprovante no chat
- auditoria do evento

### O que fica no worker

- notificacoes em lote
- auditoria pesada
- refresh de cache
- sync
- tarefas atrasadas ou periodicas

## 2. Regra Principal

Antes de separar processos:

- preservar login e permissao
- preservar player e proxy de stream
- preservar fluxo de edicao de servidores
- preservar chat e suporte
- preservar pagamentos ja rastreados
- preservar branding e shells que ja estao estaveis

Se um fluxo ja esta funcionando e nao precisa sair do processo atual, ele nao deve ser movido por vaidade arquitetural.

## 3. Estado Atual Do Codigo

Hoje o repositorio ainda roda como uma aplicacao unica em PM2:

- `deploy/ecosystem.config.cjs`
- `start-pm2.sh`
- `src/server.ts`
- `src/start.ts`

O processo atual sobe a app inteira, incluindo:

- rotas do usuario
- rotas do dono
- rotas de API publica
- player
- proxy de stream
- webhook
- funcoes de servidor

### Exemplo do fluxo atual

#### Entrada unica do servidor

- [src/server.ts](/www/wwwroot/stream.mago-bot.com/src/server.ts)

Esse arquivo:

- instala o capturador global de erro
- carrega o server entry do TanStack Start
- normaliza respostas 500 e pagina HTML de erro
- garante `no-store` em HTML

#### Middleware global

- [src/start.ts](/www/wwwroot/stream.mago-bot.com/src/start.ts)

Esse arquivo:

- instala `attachSupabaseAuth`
- protege server functions com CSRF
- centraliza o middleware de request

#### Proxy de stream

- [src/routes/api/public/stream.ts](/www/wwwroot/stream.mago-bot.com/src/routes/api/public/stream.ts)
- [src/lib/stream-proxy.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/stream-proxy.server.ts)

Esse bloco:

- le o token criptografado
- faz fetch no upstream
- reescreve playlists
- retorna fallback valido quando o provider falha

#### Pagamentos e auditoria

- [src/routes/api/public/mercadopago-webhook.ts](/www/wwwroot/stream.mago-bot.com/src/routes/api/public/mercadopago-webhook.ts)
- [src/lib/payments.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/payments.functions.ts)
- [src/lib/payments-tracking.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/payments-tracking.functions.ts)

Esse bloco:

- cria preferencia
- valida webhook
- grava payment record
- registra payment event
- registra audit log
- atualiza assinatura
- anexa comprovante no chat

#### Chat e notificacoes

- [src/lib/chat.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/chat.functions.ts)
- [src/lib/notifications.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/notifications.functions.ts)

Esse bloco:

- lista threads
- pagina mensagens
- envia mensagens
- envia notificacao em massa
- sustenta suporte e historico

#### Player e session store

- [src/lib/player.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/player.functions.ts)
- [src/lib/player-store.tsx](/www/wwwroot/stream.mago-bot.com/src/lib/player-store.tsx)

Esse bloco:

- monta a sessao do player
- valida limite de conexoes
- invalida catalogo por realtime
- controla servidor ativo
- faz heartbeat

## 4. Arquitetura Recomendadas Dos Processos

### 4.1 Processo 1 - Aplicacao Principal

Responsabilidade:

- UI do usuario comum
- UI do dono
- shells de navegacao
- pagina de conta
- pagina de usuarios
- pagina de servidores
- pagina de suporte UI
- pagina inicial
- layout global

Rotas que continuam aqui hoje:

- `/inicio`
- `/canais`
- `/filmes`
- `/series`
- `/servidores`
- `/conta`
- `/suporte`
- `/usuarios`
- `/painel`

Arquivos de referencia:

- [src/routes/_authenticated/route.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/route.tsx)
- [src/routes/_authenticated/inicio.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/inicio.tsx)
- [src/routes/_authenticated/conta.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/conta.tsx)
- [src/routes/_authenticated/usuarios.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/usuarios.tsx)
- [src/routes/_authenticated/painel.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/painel.tsx)
- [src/routes/_authenticated/suporte.tsx](/www/wwwroot/stream.mago-bot.com/src/routes/_authenticated/suporte.tsx)

O que nao deve sair deste processo por enquanto:

- login
- permissao
- header e sidebar
- telas administrativas
- consumo normal do usuario

### 4.2 Processo 2 - Player / Proxy De Stream

Responsabilidade:

- servir o media gateway
- esconder DNS, usuario e senha dos servidores IPTV
- proteger o streaming com token criptografado
- reescrever playlists
- suportar fallback de media

Arquivos que demonstram a fronteira atual:

- [src/routes/api/public/stream.ts](/www/wwwroot/stream.mago-bot.com/src/routes/api/public/stream.ts)
- [src/lib/stream-proxy.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/stream-proxy.server.ts)
- [src/lib/player.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/player.functions.ts)
- [src/lib/iptv-cache.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [src/components/player/VideoPlayer.tsx](/www/wwwroot/stream.mago-bot.com/src/components/player/VideoPlayer.tsx)
- [src/components/player/Catalog.tsx](/www/wwwroot/stream.mago-bot.com/src/components/player/Catalog.tsx)

Por que este processo merece isolamento:

- pode consumir mais CPU e banda
- responde a falhas de provider remoto
- trabalha com timeout, retry e range requests
- precisa de comportamento previsivel sob carga

Regras de desenho:

- nao expor upstream ao cliente
- nao vazar credenciais de painel
- nao transformar erro de provider em erro da aplicacao inteira
- manter resposta 204 ou playlist vazia quando o media estiver indisponivel

### 4.3 Processo 3 - Pagamentos / Webhooks

Responsabilidade:

- criar preferencia
- receber webhook
- consultar provider
- atualizar assinatura
- criar comprovante
- registrar auditoria
- manter idempotencia

Arquivos de referencia:

- [src/routes/api/public/mercadopago-webhook.ts](/www/wwwroot/stream.mago-bot.com/src/routes/api/public/mercadopago-webhook.ts)
- [src/lib/payments.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/payments.functions.ts)
- [src/lib/payments-tracking.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/payments-tracking.functions.ts)

Por que vale separar:

- webhook nao deve depender da UI
- pagamento precisa sobreviver a pico e retry
- auditoria precisa ser gravada mesmo se o front cair
- o fluxo financeiro deve ficar isolado de catalaogo e navegação

Regras de desenho:

- registrar evento antes de considerar concluido
- manter idempotencia por `provider_payment_id`, `provider_preference_id` e `external_reference`
- nunca perder o comprovante do chat

### 4.4 Processo 4 - Worker Assincrono

Responsabilidade:

- tarefas em background
- notificacoes em massa ou agendadas
- refresh de cache
- sincronizacao de catalogos
- auditoria pesada
- limpeza e manutencao

Arquivos que hoje ja apontam para esse tipo de tarefa:

- [src/lib/notifications.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/notifications.functions.ts)
- [src/lib/iptv-cache.server.ts](/www/wwwroot/stream.mago-bot.com/src/lib/iptv-cache.server.ts)
- [src/lib/owner.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/owner.functions.ts)
- [src/lib/payments-tracking.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/payments-tracking.functions.ts)
- [src/lib/test-flow.functions.ts](/www/wwwroot/stream.mago-bot.com/src/lib/test-flow.functions.ts)

Esse processo ainda nao existe como runtime dedicado no repositorio.
Ele e uma evolucao natural para:

- refreshServerCatalogCache
- envio de notificacao massiva
- auditoria de integracoes
- eventuais rotinas de limpeza

## 5. O Que Vai Para Cada Processo

### 5.1 Aplicacao principal

Vai ficar com:

- shells
- rotas autenticadas
- modais administrativos
- listas paginadas
- areas de suporte UI
- conta
- indicacao

### 5.2 Player / proxy

Vai ficar com:

- stream proxy
- signing do token
- validation of stream access
- playlist rewrite
- media fallback

### 5.3 Pagamentos / webhooks

Vai ficar com:

- Mercado Pago
- webhook
- payment tracking
- audit log
- mensagem de comprovante

### 5.4 Worker

Vai ficar com:

- sync de cache
- notificacoes
- auditoria
- tarefas repetitivas

## 6. O Que Nao Deve Ser Separado Agora

Nao separar por PM2 ainda:

- usuario comum
- dono
- servidores
- indicacao
- suporte UI

Motivo:

- essas areas compartilham sessao
- usam o mesmo shell
- dependem do mesmo cache de app
- mudam junto na mesma experiencia de uso

Separar isso agora em processos diferentes tende a gerar mais coordenação do que ganho.

## 7. Estrategia De Migracao Segura

### Fase 0 - Congelar

- mapear o que ja funciona
- registrar entradas e saidas
- nao mudar regras de negocio

### Fase 1 - Extrair contratos

- separar funcoes puras
- isolar helpers
- manter o app unico ainda ativo

### Fase 2 - Criar runtime do player

- criar uma entrada dedicada para media/proxy
- mover apenas o que e estritamente necessario
- manter a UI principal apontando para o novo endpoint

### Fase 3 - Criar runtime de pagamentos

- separar webhook e conciliacao
- manter a mesma tabela e a mesma trilha de auditoria

### Fase 4 - Criar worker

- agendar sync e manutencao
- tirar tarefas pesadas da request principal

### Fase 5 - Ajustar PM2

- cada servico passa a ter um app no PM2
- cada app tem porta, logs e health check proprios
- a aplicacao principal continua sendo o ponto de entrada da UI

## 8. Exemplo De Topologia PM2 Alvo

Exemplo de nomes:

- `stream-mago-bot-main`
- `stream-mago-bot-player`
- `stream-mago-bot-payments`
- `stream-mago-bot-worker`

Exemplo de papeis:

- `main` atende UI e rotas autenticadas
- `player` atende media gateway e proxy
- `payments` atende webhooks e conciliacao
- `worker` atende tarefas em background

### Exemplo conceitual de ecosystem

```js
module.exports = {
  apps: [
    {
      name: "stream-mago-bot-main",
      script: "./start-main.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 6873,
        HOST: "127.0.0.1",
      },
    },
    {
      name: "stream-mago-bot-player",
      script: "./start-player.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 6874,
        HOST: "127.0.0.1",
      },
    },
    {
      name: "stream-mago-bot-payments",
      script: "./start-payments.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 6875,
        HOST: "127.0.0.1",
      },
    },
    {
      name: "stream-mago-bot-worker",
      script: "./start-worker.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

Observacao:

- isso e o desenho-alvo
- o repositorio ainda nao esta fracionado dessa forma
- nao aplicar sem criar os respectivos entrypoints

## 9. Entry Points Recomendados No Codigo

Para este desenho virar codigo, o repositorio vai precisar de pontos de entrada separados.

Sugestao de estrutura:

- `src/server-main.ts`
- `src/server-player.ts`
- `src/server-payments.ts`
- `src/worker.ts`

### O que cada entry point faria

#### `src/server-main.ts`

- sobe a UI principal
- expoe rotas autenticadas
- mantém shells e navegacao

#### `src/server-player.ts`

- expõe `api/public/stream`
- atende o player e o proxy
- valida tokens e reescreve playlists

#### `src/server-payments.ts`

- expõe webhook e servicos de pagamento
- trata conciliacao
- registra auditoria

#### `src/worker.ts`

- roda rotinas sem HTTP
- refresh de cache
- notificacoes
- auditoria pesada

## 10. Variaveis De Ambiente Por Servico

### Aplicacao principal

- `NODE_ENV`
- `PORT`
- `HOST`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_CONFIG`

### Player / proxy

- `NODE_ENV`
- `PORT`
- `HOST`
- `STREAM_PROXY_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Pagamentos / webhooks

- `NODE_ENV`
- `PORT`
- `HOST`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MP_ACCESS_TOKEN`
- `MP_PUBLIC_KEY`
- `MP_WEBHOOK_SECRET`

### Worker

- `NODE_ENV`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WORKER_INTERVAL_MS`

## 11. Criticos De Seguranca E Operacao

### Nao quebrar o que ja protege

- `src/start.ts` protege server functions com CSRF
- `src/server.ts` trata erro critico e pagina HTML de fallback
- `src/lib/stream-proxy.server.ts` esconde upstream e criptografa token
- `src/routes/api/public/mercadopago-webhook.ts` valida assinatura do webhook

### Nao mover sem revisar

- auth middleware
- guardas de sessao
- regras de conexao simultanea
- store do servidor ativo
- invalidacoes de catalogo

## 12. Beneficios Reais Deste Desenho

- reiniciar player sem tocar na UI
- reiniciar webhook sem derrubar o consumo
- processar tarefas pesadas sem travar request principal
- reduzir impacto de falha pontual
- organizar logs por dominio
- facilitar escala posterior

## 13. Riscos Se Separar Demais

Se o projeto for dividido em muitas partes muito cedo, vao aparecer:

- mais custo de deploy
- mais coordenação de ambiente
- mais risco de divergencia de contrato
- mais dificuldade de debug
- mais pontos de falha entre servicos

Por isso a recomendacao e:

1. separar so os dominios que realmente pedem isolamento
2. manter o restante no app principal
3. migrar em etapas curtas e validaveis

## 14. Ordem Recomendada Para Implementar

1. Criar entrypoint principal preservando a UI atual.
2. Criar entrypoint do player / proxy.
3. Criar entrypoint de pagamentos / webhook.
4. Criar worker.
5. Atualizar PM2 com quatro apps.
6. Validar login, player, checkout e suporte.
7. Fazer `pm2 save`.

## 15. Regra Pratica Para A Equipe

Se a mudanca:

- reduz acoplamento
- melhora recuperacao de erro
- isola carga
- protege pagamento
- protege stream

ela entra no plano.

Se a mudanca:

- mistura telas que ja estao boas
- troca contrato de API sem necessidade
- duplica logica de auth
- cria processo sem ganho real

ela deve ficar fora.

## 16. Conclusao

O caminho mais seguro para "soltar o projeto no mercado" nao e explodir tudo em muitos processos.

O caminho certo e:

- app principal bem organizado
- player isolado
- pagamentos isolados
- worker para tarefas de background

Isso entrega:

- menos dor de cabeca
- menos regressao
- mais previsibilidade operacional
- mais capacidade de escala

E isso pode ser implementado sem destruir os fluxos que ja estao funcionando hoje.
