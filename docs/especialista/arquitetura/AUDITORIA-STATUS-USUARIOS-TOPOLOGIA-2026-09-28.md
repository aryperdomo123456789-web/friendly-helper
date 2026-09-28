# Auditoria de status de usuários e topologia de dados — 2026-09-28

## Escopo

Investigar a divergência entre os cards `Todos 34 / Ativos 5 / Expirados 29` e badges visuais de usuários vencidos como `Ativo`, sem alterar dados de usuários, permissões, pagamentos, player ou catálogo.

## Causa raiz confirmada

O produto tinha **duas telas administrativas com tabelas de usuários**:

- `/usuarios`: já usava `resolveUserStatus(user, statusNow)` e renderizava `Expirado` corretamente.
- `/painel`: ainda usava a regra antiga `user.is_active ? "Ativo" : "Bloqueado"`, ignorando `expires_at`.

Assim, a mesma linha podia aparecer correta em `/usuarios` e incorreta no Painel do dono. Não era um problema de `Date` apenas nem de um segundo cadastro de usuários.

## Correção aplicada no código

- `src/lib/user-status.ts`
  - bloqueio (`is_blocked === true` ou `is_active === false`) tem precedência;
  - vencimento passado retorna `expired` mesmo com `is_active = true`;
  - aceita ISO, data ISO sem horário e `DD/MM/YYYY` como fallback seguro;
  - mantém o instante exato do vencimento válido.
- `src/routes/_authenticated/usuarios.tsx`
  - já utilizava o helper e foi preservado.
- `src/routes/_authenticated/painel.tsx`
  - passou a usar o mesmo helper;
  - vencidos aparecem como `Expirado`;
  - bloqueados aparecem como `Bloqueado`;
  - relógio é atualizado a cada 60 segundos.
- `scripts/user-status.test.ts`
  - cobertura de bloqueio prioritário, data brasileira, ISO e limite exato.

## Banco de dados e migration

A função `public.admin_list_access_users(...)` foi atualizada por `CREATE OR REPLACE FUNCTION`, sem apagar tabelas ou linhas:

- `active`: `is_active = true` e sem vencimento ou vencimento futuro;
- `blocked`: `is_active = false`;
- `expired`: `is_active = true` e `expires_at < now()`;
- filtros e contadores usam a mesma regra mutuamente exclusiva.

A definição anterior do RPC foi salva antes da migration para rollback. O grant para `authenticated` foi confirmado após a alteração.

## Topologia real — não são dois bancos de usuários

O app usa Supabase pela URL HTTP configurada em `SUPABASE_URL`/`VITE_SUPABASE_URL`.

- `supabase-db`: PostgreSQL do stack Supabase; contém `public.profiles`, `public.user_roles` e `public.user_server_access`, além do RPC administrativo.
- `mago-pg`: container PostgreSQL separado/legado; a consulta administrativa do produto não encontrou as tabelas públicas do app e o código-fonte não referencia `mago-pg`, `postgresql://`, `PGHOST` ou `DATABASE_URL` para o fluxo de usuários.

Portanto, a origem dos usuários do painel é **um único banco Supabase (`supabase-db`)**. Os quatro PM2 são processos da aplicação, não quatro bancos.

## Regressão de autenticação e recuperação

Durante a primeira tentativa de publicação deste ciclo, um build local de validação com `VITE_SUPABASE_PUBLISHABLE_KEY=build-validation-placeholder` foi levado indevidamente ao output de produção. Isso causou `AuthApiError: Unauthorized` no login.

A ação corretiva foi imediata:

1. rollback do output anterior;
2. preservação do output problemático para análise;
3. rebuild no servidor com `VITE_SUPABASE_URL="$SUPABASE_URL"` e `VITE_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY"` apenas em memória;
4. `VITE_SUPABASE_PROJECT_ID` e `SUPABASE_PROJECT_ID` removidos do ambiente de build;
5. verificação do bundle sem o placeholder e sem `swxxyftiwnpazegpkqib`;
6. login owner validado novamente pelo navegador do usuário.

## Evidência técnica

- Suíte determinística: **65/65 testes aprovados**.
- Build multi-serviço: aprovado (`server`, `player`, `payments`, `worker`).
- Health pós-deploy do rebuild correto: root `200`, asset `200`, token inválido `403`, quatro PM2 `online`.
- Manifesto ativo do rebuild correto: `2158d7836caa6cd0b0482dffc1cffcfa6e2210ab5dee05c143843a78020ede63`.
- Chrome owner, após carregamento assíncrono de `/usuarios`: `Todos 34`, `Ativos 5`, `Expirados 29`; linhas com vencimento em agosto e `25/09/2026` renderizaram `Expirado`.

## Próxima validação obrigatória

Após o deploy do ajuste do Painel, abrir `/painel` e conferir as mesmas linhas vencidas. A validação de `/usuarios` não substitui a validação do Painel, porque eram componentes diferentes.

## Rollback

O output anterior e o output da tentativa inválida permanecem preservados no servidor em diretórios `.output.rollback-*`/`.output.failed-*`. A migration é reversível reaplicando a definição SQL salva no backup anterior.
