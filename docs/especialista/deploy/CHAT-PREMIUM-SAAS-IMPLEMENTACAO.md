# Chat Premium SaaS

## Objetivo
Evoluir o chat atual de suporte para um padrao premium, leve e rapido, com a mesma sensacao de produto grande:

- indicadores de status em tempo real;
- respostas rapidas;
- inbox mais leve e objetiva.

O foco e melhorar a experiencia sem quebrar os fluxos que ja funcionam:

- envio direto de mensagem;
- anexos;
- encerramento de atendimento;
- satisfacao 1 a 5;
- historico paginado;
- realtime via Supabase.

## Base tecnica atual

Os pontos ja existentes no codigo e que devem ser preservados:

- `src/routes/_authenticated/suporte.tsx`
  - tela principal do suporte do dono e do historico do cliente;
  - lista paginada de conversas;
  - janela de mensagens paginada;
  - envio direto sem confirmacao;
  - anexos;
  - encerramento e avaliacao.
- `src/routes/_authenticated/inicio.tsx`
  - chat flutuante do usuario;
  - carregamento paginado;
  - reaproveitamento do fluxo de suporte.
- `src/lib/chat.functions.ts`
  - `listSupportThreadsPage`
  - `listMySupportThreads`
  - `listSupportMessagesPage`
  - `getOrCreateThread`
  - `sendSupportMessage`
  - `closeSupportThread`
  - `respondToClosurePrompt`
  - `submitSupportSatisfaction`
  - `getSupportStats`
- `src/lib/support-message.types.ts`
  - classifica as mensagens por tipo;
  - ja suporta `user_message`, `support_reply`, `closure_prompt`, `thread_closed`, `satisfaction_prompt` e `satisfaction_response`.
- `src/lib/types.ts`
  - `AppConfig` ja possui:
    - `support_auto_reply`
    - `support_attendant_name`

## Fluxo atual resumido

### Cliente
1. O usuario abre o chat.
2. O sistema encontra ou cria uma thread com `getOrCreateThread`.
3. A mensagem entra via `sendSupportMessage`.
4. O chat atualiza o inbox com realtime.
5. O historico e mantido com paginacao.

### Dono / operador
1. O dono abre `/suporte`.
2. O sistema lista threads com `listSupportThreadsPage`.
3. Ao abrir uma thread, carrega mensagens paginadas com `listSupportMessagesPage`.
4. O operador responde direto.
5. A thread e atualizada em realtime.

## Evolucao 1: indicadores de status em tempo real

### Problema que resolve
Hoje o chat ja mostra estado basico, mas ainda falta sensacao de atendimento vivo:

- se o cliente esta aguardando resposta;
- se o suporte respondeu por ultimo;
- se a conversa esta ativa agora;
- se a thread esta fechada;
- se ha mensagens novas sem ler.

### Estado atual que pode ser reaproveitado
Ja existem estes campos em `support_threads` e no fluxo:

- `status`
- `last_message_at`
- `last_owner_message_at`
- `last_user_message_at`
- `unread_count_owner`
- `unread_count_user`
- `closed_at`
- `satisfaction_score`
- `closure_prompt_at`

### Regra de negocio sugerida
O status visual deve ser calculado sem inventar outra logica paralela:

| Condicao | Status visual |
| --- | --- |
| `status = open` e ultimo envio foi do cliente | `Aguardando suporte` |
| `status = open` e ultimo envio foi do dono | `Aguardando cliente` |
| `unread_count_owner > 0` | `Nova demanda` |
| `unread_count_user > 0` | `Resposta recebida` |
| `status = closed` | `Encerrado` |
| diferenca entre `now` e `last_message_at` menor que 2 min | `Ao vivo` |

### O que implementar

#### Backend
- criar um helper derivado, por exemplo `deriveSupportThreadStatus(thread)`;
- usar os campos ja existentes para nao duplicar estado;
- manter o realtime via subscription de `support_threads` e `support_messages`;
- opcionalmente adicionar um timestamp de `last_activity_at` se quiser simplificar leitura futura.

#### UI
- badge compacto no card da thread:
  - `Ao vivo`
  - `Aguardando cliente`
  - `Aguardando suporte`
  - `Fechado`
- contador de nao lidas;
- timestamp relativo, por exemplo:
  - `ha 2 min`
  - `hoje`
  - `ontem`
- microfeedback no topo da conversa:
  - `mensagem enviada`
  - `cliente visualizou`
  - `resposta pendente`

### Exemplo pratico

Se o dono respondeu ha 20 segundos e o cliente ainda nao falou:

- card mostra `Aguardando cliente`;
- badge fica em azul ou verde;
- item fica destacado como ativo;
- nao se altera a lista inteira, apenas a thread afetada.

Se o cliente responder:

- `unread_count_owner` sobe;
- o card sobe visualmente na lista;
- o status muda para `Nova demanda`.

## Evolucao 2: respostas rapidas

### Problema que resolve
Operador perde tempo digitando respostas repetidas e o chat fica menos padrao empresa grande.

### Estrategia correta para este projeto
Como o app ja usa `AppConfig`, o melhor caminho e deixar as respostas rapidas configuraveis e por contexto.

### Fonte de dados sugerida
Adicionar em `app_config` um campo como:

```json
{
  "support_quick_replies": [
    "Estamos verificando agora.",
    "Pode me enviar uma captura da tela?",
    "Vou revalidar seu servidor.",
    "Recarregue a lista e teste novamente.",
    "Seu protocolo foi encaminhado para analise."
  ]
}
```

### Onde mostrar
- no rodape do chat do dono;
- acima do input;
- em chips curtos com clique unico;
- priorizando opcoes contextuais.

### Comportamento ideal
Ao clicar em uma resposta rapida:

1. o texto entra no input;
2. o operador pode editar;
3. o envio continua direto, sem confirmacao;
4. a interface nao bloqueia a navegacao.

### Regras de contexto
As respostas devem mudar conforme o estado:

| Contexto | Respostas sugeridas |
| --- | --- |
| thread aberta e recente | `Estamos analisando`, `Pode testar agora` |
| problema tecnico | `Envie o print`, `Vou validar o servidor` |
| pagamento | `Vou conferir seu comprovante`, `Acesso sera liberado` |
| encerramento | `Obrigado pelo retorno`, `Atendimento encerrado com sucesso` |

### Exemplo pratico

Se a conversa tiver palavras como `erro`, `cache`, `m3u`, `portal`, `servidor`:

- mostrar chips tecnicos primeiro;
- esconder respostas genéricas menos relevantes;
- manter no maximo 5 sugestoes para nao poluir.

## Evolucao 3: inbox mais leve

### Problema que resolve
A lista de conversas pode ficar pesada visualmente e cognitivamente quando cresce.

### Diretriz de UX
O inbox deve funcionar como painel de operacao:

- compacto;
- escaneavel;
- com pouca leitura obrigatoria;
- com foco na conversa ativa;
- sem duplicar informacao.

### O que manter
- paginacao atual em `listSupportThreadsPage`;
- carregamento sob demanda da conversa selecionada;
- realtime apenas na thread aberta e no resumo da lista;
- `placeholderData` para suavizar troca de pagina.

### O que reduzir
- texto repetido;
- labels longos;
- blocos de meta informacao que nao ajudam a operacao;
- cards muito altos;
- excesso de sombras e bordas.

### Estrutura recomendada do inbox
Cada item da lista deve mostrar apenas:

1. nome do usuario;
2. protocolo;
3. status curto;
4. ultima mensagem;
5. unread badge;
6. tempo relativo.

### Exemplo de card leve

```text
Teste (gratis)
#SUP-1234ABCD
Aguardando suporte
Ultima mensagem: "Enviei o print"
Nao lidas: 3
Ha 4 min
```

### Otimizacoes tecnicas
- manter a lista com pagina atual pequena, ex. 10 ou 12 threads por pagina;
- evitar carregar mensagens da thread nao selecionada;
- usar `invalidateQueries` apenas nas chaves afetadas;
- manter `refetchInterval` so onde precisa;
- usar `queryKey` isolada por thread e pagina;
- opcionalmente adicionar virtualizacao se o volume de threads aumentar muito.

## Arquitetura recomendada

### Arquivos que entram na evolucao
- `src/routes/_authenticated/suporte.tsx`
- `src/routes/_authenticated/inicio.tsx`
- `src/lib/chat.functions.ts`
- `src/lib/types.ts`
- `src/lib/support-message.types.ts`

### Arquivos que podem nascer depois
- `src/components/support/support-quick-replies.tsx`
- `src/components/support/support-status-badge.tsx`
- `src/components/support/support-thread-card.tsx`
- `src/components/support/support-inbox-header.tsx`

## Ordem segura de implementacao

### Fase 1
- criar o calculo visual de status;
- reutilizar os campos existentes da thread;
- expor badges e indicadores sem mudar o fluxo de envio.

### Fase 2
- adicionar respostas rapidas configuraveis;
- manter envio direto;
- permitir preenchimento automatico do input.

### Fase 3
- enxugar o inbox do dono;
- reduzir metadados visiveis;
- manter a thread ativa no centro da tela.

### Fase 4
- validar desempenho em telas grandes;
- validar mobile;
- validar troca de thread, pagina e envio;
- reiniciar PM2.

## Critérios de aceite

- o envio continua sem confirmacao;
- a thread muda de status em tempo real;
- respostas rapidas nao quebram o envio manual;
- o inbox fica mais simples sem perder informacao essencial;
- mensagens novas nao misturam threads;
- o fluxo do cliente e do dono continuam isolados;
- a tela nao precisa recarregar para refletir novas mensagens.

## Anti-regressao

Nao mexer nestes comportamentos sem necessidade:

- `sendSupportMessage` continua sendo a unica saida do cliente para envio;
- `closeSupportThread` continua encerrando e disparando avaliacao;
- `listSupportMessagesPage` continua paginando o historico;
- `listSupportThreadsPage` continua sendo a fonte do inbox do dono;
- `support-message.types.ts` continua classificando as mensagens.

## Resumo executivo

Se a meta e parecer uma central grande de suporte, a regra e:

- pouco ruido;
- pouca friccao;
- resposta imediata;
- status claro;
- inbox leve;
- historico confiavel.

Esse e o caminho mais seguro para um chat premium SaaS sem embolar os fluxos atuais.
