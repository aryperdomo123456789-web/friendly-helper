# Isolamento de servidor IPTV por usuário

**Data:** 26 de agosto de 2026<br>
**Projeto:** MAGOPLAYERPRO<br>
**Escopo:** seleção de origem, sessões, cache do player e autorização por usuário<br>
**Ambiente:** código e artefato local; **nenhum deploy ou alteração de produção foi executado**

## 1. Regra de negócio

Cada usuário deve visualizar somente os servidores liberados para o seu acesso, escolher livremente uma dessas origens e trocar de servidor sem alterar o estado de qualquer outro usuário. A seleção de um usuário não pode modificar o catálogo, a sessão, o cache, o heartbeat, o lease ou a origem atualmente utilizada por outra identidade.

A regra comercial e a capacidade operacional são dimensões diferentes:

| Dimensão                   | Fonte                                                       | Responsabilidade                                                                          |
| -------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Entitlement do usuário** | `profiles.max_connections`, preenchido pelo plano/permissão | Define quantas sessões simultâneas o cliente pode manter.                                 |
| **Autorização de origem**  | `user_server_access`                                        | Define quais servidores aquele usuário pode escolher.                                     |
| **Capacidade da origem**   | `iptv_servers.connection_capacity`                          | Representa o limite operacional contratado da origem IPTV. Não altera o plano do usuário. |
| **Sessão**                 | `device_sessions` com `user_id`, `device_id` e `server_id`  | Registra o dispositivo do usuário e a origem usada por ele.                               |

O sistema pode negar temporariamente uma nova sessão quando a origem selecionada estiver cheia, mas isso deve ser reportado como **indisponibilidade operacional da origem**, não como redução ou alteração do limite comercial do usuário. O próximo nível de escala é adicionar seleção/failover entre origens autorizadas quando uma delas saturar.

## 2. Auditoria realizada

O backend já filtrava `getMySession` por `user_server_access` para usuários comuns, enquanto owner/admin podia visualizar as origens administrativas. `resolveAccess` também validava no servidor a autorização do usuário antes de buscar credenciais ou catálogo. O heartbeat enviava `server_id` e chamava `claim_device_session`, que verifica primeiro `profiles.max_connections` e depois `iptv_servers.connection_capacity`.

O lease possui chave lógica por usuário/dispositivo e registra a origem na linha de `device_sessions`. A troca de origem de um dispositivo atualiza somente a sessão daquele `user_id + device_id`. O catálogo e o cache server-side são indexados por `server_id`, portanto uma troca de origem não altera o cache de outra origem.

Foi encontrado, entretanto, um risco de isolamento de experiência no frontend: a origem selecionada era persistida em uma chave global, `wp_server_id`. Em um mesmo navegador, o usuário seguinte poderia herdar a seleção visual do usuário anterior. A autorização server-side impediria acesso indevido, mas a experiência e a separação de estado não eram suficientemente rigorosas.

Também foi encontrada uma falha de invalidação: a query de categorias usa a forma `['categories', kind, serverId]`, porém a lógica antiga verificava somente a segunda posição para alguns escopos. Isso poderia preservar dados em cache do servidor anterior durante uma troca.

## 3. Correção implementada

A seleção local passou a usar uma chave derivada da identidade autenticada:

```text
wp_server_id:<auth_user_id>
```

A chave legada não é reutilizada para outro usuário. Assim, o servidor selecionado pelo usuário A não é lido nem gravado pelo usuário B, mesmo quando ambos usam o mesmo navegador ou dispositivo.

A query de sessão passou a ser escopada por `authUserId`, e o provider observa as mudanças de Auth. Quando a identidade muda, o provider cancela e remove queries do player, limpa conjuntos de aquecimento de catálogo, zera a origem selecionada e remove o estado de bloqueio anterior antes de iniciar o carregamento da nova identidade.

A função de troca agora aceita somente um `server_id` que esteja na lista autorizada retornada para a identidade corrente. Um identificador fora dessa lista não é persistido nem enviado ao heartbeat. A seleção válida é resolvida pelo servidor armazenado por usuário ou, quando não existir, pelo primeiro servidor autorizado.

A invalidação de cache passou a reconhecer qualquer posição posterior ao escopo da query. Isso cobre categorias, streams, informações de série, EPG e playback sem cruzar servidores. O heartbeat também não é iniciado enquanto a identidade Auth ainda não foi resolvida.

## 4. Invariantes de isolamento

| Invariante                              | Garantia                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Usuário só vê servidores autorizados    | `getMySession` filtra por `user_server_access`; operações server-side revalidam o acesso.            |
| Seleção não é global                    | Persistência local inclui o `auth_user_id`.                                                          |
| Troca não cruza catálogo                | Query keys, cache IPTV e cache de playlist incluem `server_id`.                                      |
| Troca não cruza sessão                  | Lease usa `user_id`, `device_id` e `server_id`; a alteração é limitada à sessão atual.               |
| Usuário anterior não deixa estado ativo | Mudança de Auth remove queries, aquecimentos e seleção em memória do provider.                       |
| Servidor não redefine plano             | `max_connections` continua vindo de perfil/plano; capacidade IPTV é uma guarda operacional distinta. |
| Cliente não bypassa autorização         | O frontend apenas melhora isolamento de estado; o backend continua sendo a autoridade.               |

## 5. Validação

Foram executados testes puros de seleção e isolamento, além da suíte existente do worker:

| Verificação                                 | Resultado                                                         |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Seleção de servidor por identidade          | Aprovada; usuários diferentes produzem chaves diferentes.         |
| Fallback para servidor autorizado           | Aprovado; seleção inválida cai no primeiro servidor permitido.    |
| Query keys por servidor                     | Aprovada; servidor A não corresponde à invalidação de servidor B. |
| Limpeza da sessão ao trocar identidade Auth | Coberta pelo fluxo do provider e escopo de query por usuário.     |
| `npm run test:worker`                       | 12 testes aprovados.                                              |
| ESLint direcionado                          | Aprovado nos arquivos alterados.                                  |
| Prettier direcionado                        | Aprovado.                                                         |
| Build multisserviço                         | Aprovado com o Supabase público correto fornecido em memória.     |
| Identificador Supabase legado no `.output`  | Ausente.                                                          |
| Banco, migrations, permissões e produção    | Não alterados.                                                    |

A validação automatizada prova as invariantes puras e a compilação, mas não substitui um teste de navegador com duas contas laboratoriais simultâneas. Esse teste deve ser executado em ambiente sandbox ou com usuários de laboratório previamente autorizados; não foi criado novo usuário nem feita mutação adicional em produção nesta etapa.

## 6. Próximo passo de escala

Com o isolamento de escolha consolidado, o próximo passo é um teste de carga controlado por origem. A carga deve respeitar o entitlement de cada usuário e variar apenas a quantidade de sessões distribuídas entre as origens autorizadas. O objetivo é medir saturação, latência, leases, heartbeats, proxy, CPU, RAM e reinícios, sem transformar a capacidade de uma origem em limite comercial do cliente.

Depois da medição, pode ser implementado um roteador de origem com política explícita, por exemplo: selecionar uma origem autorizada com capacidade disponível, manter afinidade durante a sessão e fazer failover somente quando a origem falhar ou atingir seu limite operacional. Essa etapa exige diagnóstico e teste separado para não alterar silenciosamente a experiência do player.

## Referências internas

[1]: ../../../src/lib/player.functions.ts "Autorização, heartbeat e lease do player"
[2]: ../../../src/lib/player-store.tsx "Provider de sessão, seleção e cache do player"
[3]: ../../../src/lib/player-isolation.ts "Regras puras de isolamento da seleção"
[4]: ../../../src/lib/device.ts "Identificador do dispositivo"
[5]: ../../../supabase/migrations/20260826091000_server_connection_capacity.sql "Lease e capacidade operacional da origem"
