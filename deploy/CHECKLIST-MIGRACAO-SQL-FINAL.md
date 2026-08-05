# Checklist Final de Migracao SQL

Este checklist e a ordem segura para levar o backend proprio para producao sem mexer no que ja funciona.

## Regra principal

- Se o banco ja esta em uso, rode cada bloco apenas com validacao entre um passo e outro.
- Nao misture schema, base de dados e seed no mesmo lance.
- Se houver qualquer divergencia, pare antes de seguir.

## Passo 0 - Preflight

Confirme antes de abrir o SQL Editor:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- backup do banco atual
- app online no dominio `stream.mago-bot.com`

## Guia de leitura

Se voce quiser o mapa mais operacional, abra tambem:

- `deploy/REVISAO-SQL-LINHA-A-LINHA.md`

## Passo 1 - Schema

Execute integralmente:

- `deploy/sql/01-schema.sql`

O que este bloco consolida:

- `app_role`
- as 12 tabelas do sistema
- indices
- `has_role`
- triggers de `updated_at`
- grants
- RLS e policies
- bucket `chat-files-v2`
- campos de origem de indicacao em `profiles`
- tabela `notifications`

### Validacao apos o schema

Rode estes testes:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'app_config',
    'user_roles',
    'iptv_servers',
    'server_credentials',
    'subscription_plans',
    'profiles',
    'user_server_access',
    'device_sessions',
    'test_links',
    'test_device_tracking',
    'support_threads',
    'support_messages',
    'notifications'
  )
order by table_name;
```

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in (
    'referral_source_slug',
    'referral_source_code',
    'referral_source_url'
  )
order by column_name;
```

```sql
select id, name, public
from storage.buckets
where id = 'chat-files-v2';
```

Se algo vier vazio, corrija antes de continuar.

## Passo 2 - Dados base

Execute integralmente:

- `deploy/sql/02-dados-base.sql`

Use este passo apenas quando quiser aplicar a base oficial do projeto.

O que este bloco popula:

- `app_config`
- 5 planos
- 4 servidores
- 6 credenciais/DNS
- links de teste e indicacao

### Validacao apos os dados base

```sql
select id, name, price, duration_unit, duration_value, max_connections
from subscription_plans
order by name;
```

```sql
select id, name, url, is_active, sort_order
from iptv_servers
order by sort_order, name;
```

```sql
select id, slug, duration_minutes, max_connections, is_active, bonus_days_monthly, bonus_days_quarterly
from test_links
order by created_at desc;
```

```sql
select config
from app_config
limit 1;
```

## Passo 3 - Seed de usuarios

Este passo nao e SQL. Rode no terminal.

Arquivos:

- `deploy/seed/users.json`
- `deploy/seed/seed-users.mjs`

Comando:

```bash
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
node deploy/seed/seed-users.mjs
```

O seed faz:

- cria ou atualiza usuarios em `auth.users`
- sincroniza `profiles`
- aplica `user_roles`
- grava `user_server_access`
- amarra `referred_by_id`
- define o dono como autor dos servidores e links

### Validacao apos o seed

```sql
select id, username, display_name, max_connections, expires_at, is_active, referral_code, referred_by_id, referral_source_slug, referral_source_code, referral_source_url
from profiles
where username = 'magodono';
```

```sql
select user_id, role
from user_roles
where user_id = (
  select id
  from profiles
  where username = 'magodono'
  limit 1
);
```

```sql
select username, referral_source_slug, referral_source_code, referral_source_url
from profiles
where referral_source_slug is not null
order by created_at desc
limit 20;
```

```sql
select u.username, count(usa.server_id) as servers
from profiles u
left join user_server_access usa on usa.user_id = u.id
group by u.username
order by u.username;
```

## Passo 4 - Teste funcional

Depois do banco pronto:

1. Entre com o dono.
2. Abra `Painel do Dono`.
3. Valide a aba de links.
4. Copie um link de teste.
5. Abra em aba anonima.
6. Confirme se o bonus caiu no dono certo.
7. Valide suporte, usuarios e servidores.

## Passo 5 - Teste de independencia

Confirme em producao:

- logo local em `/brand/webplayer-brand.png`
- favicon local no mesmo asset
- player continuando via proxy interno
- conteudos abrindo sem depender do asset remoto

## Ordem curta para colar e executar

1. `deploy/sql/01-schema.sql`
2. validar schema
3. `deploy/sql/02-dados-base.sql`
4. validar dados
5. `node deploy/seed/seed-users.mjs`
6. validar login, dono, links e suporte
