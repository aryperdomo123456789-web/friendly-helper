# Revisao SQL Linha a Linha

Este guia mostra exatamente o que pode ser colado no SQL Editor e o que muda entre banco novo e banco ja migrado.

## Regra geral

- `deploy/sql/01-schema.sql` e o bloco principal.
- `deploy/sql/02-dados-base.sql` e o bloco de bootstrap de dados.
- O seed de usuarios roda no terminal, nao no SQL Editor.

## Bloco 1 - Schema completo

Arquivo:

- `deploy/sql/01-schema.sql`

### Linhas 1-23

Roda em banco novo e em banco ja migrado:

- `create extension if not exists pgcrypto;`
- `do $$ ... create type public.app_role ... exception duplicate_object ...`
- `create or replace function public.update_updated_at_column()`

### Linhas 25-157

Roda em banco novo.

Em banco ja migrado, essas instrucoes sao seguras, mas observe:

- `create table if not exists ...` nao adiciona colunas novas em tabelas antigas.
- A parte de `public.profiles` com:
  - `referral_source_slug`
  - `referral_source_code`
  - `referral_source_url`
  so fica garantida se a tabela for nova ou se voce aplicar o bloco de alteracao adicional logo abaixo.
- A tabela `public.notifications` e criada aqui e nao depende de nada externo.

### Linhas 159-187

Roda em banco novo e em banco ja migrado:

- `create or replace function public.has_role(...)`
- indices novos
- inclusive os indices de indicacao
- inclusive os indices de `notifications`

### Linhas 189-243

Roda em banco novo e em banco ja migrado:

- `alter table ... enable row level security`
- `grant usage`
- `grant select/insert/update/delete`
- `grant execute`

Essas instrucoes sao apropriadas para reexecutar.

### Linhas 245-454

Roda em banco novo e em banco ja migrado:

- `revoke` e `grant` da funcao `has_role`
- policies de `app_config`
- `user_roles`
- `iptv_servers`
- `server_credentials`
- `subscription_plans`
- `profiles`
- `user_server_access`
- `device_sessions`
- `test_links`
- `test_device_tracking`
- `support_threads`
- `support_messages`
- `notifications`

Como o script faz `drop policy if exists` antes de recriar, ele e seguro para reaplicar.

### Linhas 456-483

Roda em banco novo e em banco ja migrado:

- limpeza de policies antigas em `storage.objects`
- criacao do bucket `chat-files-v2`
- policies de upload, leitura e delete

### Linhas 485-508

Roda em banco novo e em banco ja migrado:

- triggers de `updated_at`

## Bloco adicional para banco ja migrado antigo

Se o banco ja existia antes das colunas de indicacao, rode este bloco extra depois do `01-schema.sql`:

```sql
alter table public.profiles
  add column if not exists referral_source_slug text;

alter table public.profiles
  add column if not exists referral_source_code text;

alter table public.profiles
  add column if not exists referral_source_url text;
```

### Quando esse bloco e necessario

- quando `profiles` ja existia em uma versao anterior e nao tinha esses campos
- quando voce quer garantir explicitamente a rastreabilidade do link de indicacao

### Quando nao precisa

- em banco novo
- em banco que ja recebeu essa migracao especifica

## Bloco 2 - Dados base

Arquivo:

- `deploy/sql/02-dados-base.sql`

### Linhas 4-39

Roda em banco novo e em banco ja migrado, mas com efeito de sincronizacao:

- atualiza `app_config` pelo mesmo `id`
- sobrescreve a configuracao central com o valor do arquivo

### Linhas 41-55

Roda em banco novo e em banco ja migrado:

- planos
- usa ids fixos
- faz upsert por `id`

### Linhas 57-67

Roda em banco novo e em banco ja migrado:

- servidores
- usa ids fixos
- faz upsert por `id`

### Linhas 69-81

Roda em banco novo e em banco ja migrado:

- credenciais/DNS
- usa ids fixos
- faz upsert por `id`

### Linhas 83-95

Roda em banco novo e em banco ja migrado:

- links de teste/indicacao
- usa ids fixos
- faz upsert por `id`

### Observacao critica do bloco 2

Em banco ja migrado, o bloco e sintaticamente seguro, mas ele pode sobrescrever a base oficial se os ids coincidirem.

Isso e desejado quando voce quer sincronizar a base oficial.
Se houver dados manuais com outros ids, o bloco pode criar registros paralelos.

## Bloco 3 - Seed de usuarios

Arquivo:

- `deploy/seed/seed-users.mjs`

Roda no terminal, nao no SQL Editor.

### Requisitos

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Efeitos

- cria ou atualiza `auth.users`
- sincroniza `profiles`
- aplica `user_roles`
- aplica `user_server_access`
- liga `referred_by_id`
- vincula o dono como criador dos servidores e links

## Blocos exatos para colar

### Se o banco for novo

1. Cole e execute `deploy/sql/01-schema.sql`
2. Cole e execute `deploy/sql/02-dados-base.sql`
3. Rode `node deploy/seed/seed-users.mjs`

### Se o banco ja existir e estiver migrando agora

1. Cole e execute `deploy/sql/01-schema.sql`
2. Se faltar coluna de indicacao, rode o bloco adicional de `ALTER TABLE`
3. Cole e execute `deploy/sql/02-dados-base.sql`
4. Rode `node deploy/seed/seed-users.mjs`

## Validacoes finais

Depois do bloco 2 e do seed:

```sql
select id, username, display_name, referral_source_slug, referral_source_code, referral_source_url
from profiles
where username = 'magodono';
```

```sql
select id, slug, duration_minutes, max_connections, is_active
from test_links
order by created_at desc;
```

```sql
select id, name, url, is_active
from iptv_servers
order by sort_order, name;
```

