# Roteiro Especialista: SQL Editor do Supabase

Este roteiro foi montado para ser colado e executado com o menor risco possivel.
Ele foi conferido com base nos arquivos reais do projeto:

- `deploy/sql/01-schema.sql`
- `deploy/sql/02-dados-base.sql`
- `deploy/seed/users.json`
- `deploy/seed/seed-users.mjs`

## Objetivo

Colocar o backend proprio em funcionamento com:

- estrutura completa do banco
- dados iniciais
- bucket do suporte
- perfis e papeis
- fluxo de indicacao rastreavel
- dono preservado

## Regra de ouro

Numa execucao limpa:

1. Rode `01-schema.sql`.
2. Valide.
3. Rode `02-dados-base.sql`.
4. Valide.
5. Rode o seed em Node.
6. Valide.

Nao misture etapas.

## Antes de abrir o SQL Editor

Confirme que voce tem:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- backup do banco atual

Se o projeto ainda usa logo/icone remoto, isso nao bloqueia o banco. A interface ja possui fallback local em `/brand/webplayer-brand.png`.

## Bloco 1 - Schema completo

Abra o arquivo:

- `deploy/sql/01-schema.sql`

No SQL Editor do Supabase, cole o conteudo **integralmente** e execute.

### O que precisa existir ao final deste bloco

- extension `pgcrypto`
- enum `public.app_role`
- tabelas:
  - `app_config`
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
- funcao `public.has_role`
- indices de perfomance
- RLS habilitado
- grants aplicados
- policies de seguranca
- bucket `chat-files-v2`
- triggers de `updated_at`

### Validação imediata apos o schema

Cole e rode este bloco:

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

Se alguma consulta vier vazia, pare e corrija antes de seguir.

## Bloco 2 - Dados base

Abra o arquivo:

- `deploy/sql/02-dados-base.sql`

No SQL Editor, cole o conteudo **integralmente** e execute.

### O que este bloco deve popular

- configuracao central
- tema
- textos base
- TMDB
- EPG
- planos
- servidores
- credenciais
- links de teste / indicacao

### Validação imediata apos os dados base

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

### Ponto de corte

Se os planos, servidores e links aparecerem, o schema e os dados base estao ok.

## Bloco 3 - Seed de usuarios

Esse passo **nao** roda no SQL Editor. Ele roda no terminal.

### Arquivos usados

- `deploy/seed/users.json`
- `deploy/seed/seed-users.mjs`

### Comando exato

```bash
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
node deploy/seed/seed-users.mjs
```

### O que o seed faz

- cria os usuarios em `auth.users`
- cria `profiles`
- atribui `user_roles`
- configura `user_server_access`
- vincula `referred_by_id`
- amarra o dono como criador dos servidores e links

### O que precisa existir depois

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

## Bloco 4 - Teste do fluxo de indicacao

Depois do seed, valide o fluxo real:

1. Entre com o dono.
2. Abra `Painel do Dono`.
3. Abra a aba de links.
4. Copie um link de teste.
5. Abra o link em navegacao anonima.
6. Crie o teste.
7. Confira no banco se:
   - `referral_source_slug` foi gravado
   - `referral_source_code` foi gravado quando houver `ref`
   - `referral_source_url` foi montado corretamente
   - o bonus foi aplicado ao dono correto

## Bloco 5 - Teste de funcionamento independente

Depois de tudo pronto, confirme:

- a home abre com logo local em `/brand/webplayer-brand.png`
- o favicon usa o mesmo fallback local
- o player continua consumindo media pelo proxy interno
- canais, filmes e series continuam abrindo normalmente

## Ordem recomendada para nao quebrar nada

1. Backup do banco.
2. `01-schema.sql`
3. Validacao do schema.
4. `02-dados-base.sql`
5. Validacao dos dados base.
6. `seed-users.mjs`
7. Validacao do seed.
8. Teste do login do dono.
9. Teste de indicacao.
10. Teste do player e suporte.

## Se algo falhar

Pare na etapa que falhou e confira:

- se o SQL Editor foi executado sem erro
- se a `SUPABASE_SERVICE_ROLE_KEY` esta correta
- se o schema ja existe parcialmente
- se o seed esta sendo rodado no projeto certo

## Resultado esperado

Ao final dessa sequencia:

- o banco fica pronto para producao
- o dono `magodono` permanece preservado
- a indicacao fica auditavel
- o suporte funciona
- o app fica independente de imagem externa para a marca
- a operacao fica pronta para testes ponta a ponta

