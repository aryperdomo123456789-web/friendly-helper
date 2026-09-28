# Auditoria de usuários: exclusão em lote e status de vencimento

**Data:** 2026-09-28  
**Ambiente:** produção `stream.mago-bot.com`  
**Branch de trabalho:** `backup/stream-mago-bot-2026-08-05`  
**Commits locais:** `ebc8f26` — correção funcional; `5f6e057` — confirmação do Auth antes de remover o profile.

## Resultado executivo

A correção foi compilada e publicada com troca atômica. A rota raiz respondeu `200`, o asset CSS servido respondeu `200`, um token de stream inválido respondeu `403` e os quatro processos mandatórios ficaram online durante a observação de aproximadamente 60 segundos.

A causa do badge incorreto foi confirmada: o RPC já filtrava e contava vencimentos usando `expires_at < now()`, mas a tabela renderizava apenas `is_active`. Assim, um perfil com `is_active = true` e vencimento passado aparecia visualmente como **Ativo**.

A causa do mass delete incompleto também foi confirmada no código: a rotina de produção limpava apenas algumas relações e não removia explicitamente `profiles`; o delete individual chamava diretamente `auth.admin.deleteUser`. A nova rotina centraliza a limpeza, protege owner/admin no servidor e remove o profile antes do Auth delete.

## Diagnóstico do banco

Consulta somente leitura no PostgreSQL de produção, excluindo o usuário owner `magodono`:

| Situação                                                      | Quantidade |
| ------------------------------------------------------------- | ---------: |
| `is_active = true`, vencimento ainda válido ou sem vencimento |          4 |
| `is_active = true`, vencimento passado                        |         29 |
| `is_active = false`                                           |          0 |
| Expirados por data                                            |         29 |
| Total analisado                                               |         33 |

A procedure `public.admin_list_access_users` já usa `v_now := now()` e aplica a regra correta nos contadores e filtros `active`/`expired`. Por isso, **não foi necessária migration de banco** neste ciclo; a divergência estava na apresentação do frontend.

## Alterações aplicadas

### Frontend

- Seleção individual e “selecionar todos os usuários visíveis” preservadas.
- Exclusão em lote mantém o owner fora da seleção.
- Hooks permanecem no topo do componente, antes do guard de permissão, evitando regressão React #310.
- Novo helper puro `resolveUserStatus`:
  - vencimento passado sempre resulta em `expired`;
  - `is_active = true` dentro do prazo resulta em `active`;
  - `is_active = false` resulta em `blocked`;
  - o instante exato do vencimento ainda é considerado válido.
- Badge visual agora diferencia **Ativo**, **Expirado** e **Bloqueado**.
- Relógio local é atualizado a cada 60 segundos para evitar badge obsoleto durante a permanência na tela.
- Após delete em lote, modal fecha, seleção é zerada e as queries são invalidadas/refetchadas.

### Backend

- `deleteAccessUser` e `deleteAccessUsers` usam a mesma rotina de limpeza.
- A proteção server-side rejeita owner e admin, não apenas o username do owner.
- Limpeza operacional antes do Auth delete:
  - `profiles.referred_by_id` e `profiles.created_by` são desvinculados;
  - `iptv_servers.created_by` e `test_links.created_by_id` são desvinculados;
  - sessões, acessos a servidores, roles e notificações do usuário são removidos;
  - referências anuláveis de auditoria e mensagens são anonimizadas;
  - responsáveis de threads são desvinculados e threads pertencentes ao usuário são removidas;
  - o registro de `profiles` é removido explicitamente;
  - o usuário Auth é removido em lotes de até cinco.
- Pagamentos e recompensas não são apagados neste ciclo: permanecem como histórico financeiro. A coluna `payments.user_id` é não nula e não há FK para profiles; apagar o ledger seria uma regressão de rastreabilidade.
- Auditoria administrativa registra a quantidade de exclusões em lote sem persistir IDs em detalhes.

## Backup e rollback

Backup preventivo criado antes da alteração em produção:

- Arquivo: `/root/backups/mago-users-20260928T215844Z.tar.gz`
- Tamanho: `2.859.192` bytes
- SHA-256: `e15f3514b982578b1c89244a6ea9a0dd47d1b6944e2ccf48134c45801d3f7cae`
- Conteúdo: fontes originais da rota/procedure, output ativo, dump customizado das tabelas relacionadas e consultas de status/constraints.
- Rollback de output preservado em: `/www/wwwroot/stream.mago-bot.com/.output.rollback-users-20260928T220645Z`

O banco não recebeu migration nem alteração de dados neste ciclo.

## Validação local

- Suíte existente + teste novo: **57 testes aprovados, 0 falhas**.
- `git diff --check`: aprovado.
- `npm run build`: aprovado com Bun, incluindo os quatro entrypoints multi-serviço.
- Build feito com `VITE_SUPABASE_URL=https://supabase.mago-bot.com` em memória.
- `swxxyftiwnpazegpkqib`: ausente no `.output`.
- Nenhum `.env`, token, segredo de Supabase ou credencial foi versionado.

## Deploy e smoke

Manifestos sanitizados:

- Manifesto anterior: `855c13ff680c5840962aeca752a8b0e9cbd647a3f0d1bae527dae82a742479b7`
- Manifesto do stage ativo: `86d80ce9851913c6228107cc30988bb01a251505cd3ab64e74a79c4c8544b57d`
- Manifesto do stage final após a correção de ordem: `ec3634d01f2238ff2d94a6b5ea3a54d47351693a702f63d2a5682ea2b6c96d92`

Checks pós-troca:

- SSR raiz: `200`
- Asset servido: `200`
- Token inválido em `/api/public/stream`: `403`
- `stream-mago-bot`: online
- `stream-mago-bot-player`: online
- `stream-mago-bot-payments`: online
- `stream-mago-bot-worker`: online
- Observação final: três amostras espaçadas por aproximadamente 60 segundos passaram sem novo restart durante a janela final.

O browser Sandbox validou a rota `/usuarios` com sessão de usuário comum e mostrou corretamente **“Área restrita ao dono do sistema”**. A sessão de owner não estava disponível no browser desta execução, então não foi acionada uma exclusão real pela UI e nenhum usuário de produção foi apagado.

## Risco restante observado

Na primeira janela pós-publicação houve um restart do worker; o log mostra encerramento por `SIGINT` e reinício controlado durante refresh de catálogo, além de timeouts de M3U e mensagens de lock ocupado. A publicação final ficou estável durante a janela de 60 segundos, mas o histórico confirma o risco de estabilidade prolongada e impede declarar estabilidade de 24–72 horas.

Também permanece pendente uma validação manual autenticada como owner com usuários descartáveis para exercitar o clique do mass delete de ponta a ponta. O código foi compilado e a procedure foi publicada, mas nenhuma exclusão destrutiva real foi executada como “teste”.

## GitHub

Os commits locais `ebc8f26`, `2c9e9db` e `5f6e057` foram criados, mas o push foi rejeitado porque as credenciais GitHub configuradas no Sandbox retornaram `Invalid username or token`. Não foi feito force push nem alteração de histórico. A produção foi publicada de forma controlada e reversível; o repositório precisa ser sincronizado quando a autenticação GitHub for revalidada.
