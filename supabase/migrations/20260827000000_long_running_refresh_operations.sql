-- AIP-151: snapshots duráveis para refresh de catálogo entre processos PM2.
-- Somente o service_role acessa diretamente estas tabelas; a aplicação valida o owner
-- antes de expor as procedures de criação, consulta ou cancelamento.

create table if not exists public.long_running_operations (
  id uuid primary key default gen_random_uuid(),
  operation_ref text not null unique,
  operation_type text not null,
  server_id uuid not null references public.iptv_servers(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'running',
  stage text not null default 'queued',
  progress_percent integer,
  request_payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error jsonb not null default '{}'::jsonb,
  worker_ref text,
  attempt_count integer not null default 0,
  started_at timestamptz not null default timezone('utc'::text, now()),
  last_heartbeat_at timestamptz,
  cancel_requested_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default timezone('utc'::text, now()) + interval '30 days',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint long_running_operations_type_check check (operation_type in ('refresh_server_catalog')),
  constraint long_running_operations_status_check check (
    status in ('pending', 'running', 'succeeded', 'failed', 'cancel_requested', 'cancelled')
  ),
  constraint long_running_operations_stage_check check (
    stage in (
      'queued',
      'acquiring_lock',
      'fetching_m3u',
      'parsing_catalog',
      'fetching_catalog',
      'persisting_cache',
      'completed',
      'failed',
      'cancelled'
    )
  ),
  constraint long_running_operations_progress_check check (
    progress_percent is null or (progress_percent >= 0 and progress_percent <= 100)
  )
);

create table if not exists public.long_running_operation_events (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.long_running_operations(id) on delete cascade,
  status text not null,
  stage text not null,
  progress_percent integer,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint long_running_operation_events_progress_check check (
    progress_percent is null or (progress_percent >= 0 and progress_percent <= 100)
  )
);

create index if not exists long_running_operations_server_created_idx
  on public.long_running_operations(server_id, created_at desc);
create index if not exists long_running_operations_status_created_idx
  on public.long_running_operations(status, created_at asc);
create index if not exists long_running_operations_heartbeat_idx
  on public.long_running_operations(last_heartbeat_at);
create index if not exists long_running_operations_expiry_idx
  on public.long_running_operations(expires_at);
create index if not exists long_running_operation_events_operation_created_idx
  on public.long_running_operation_events(operation_id, created_at asc);

create unique index if not exists long_running_operations_active_server_type_idx
  on public.long_running_operations(server_id, operation_type)
  where status in ('pending', 'running', 'cancel_requested');

alter table public.long_running_operations enable row level security;
alter table public.long_running_operation_events enable row level security;
revoke all on public.long_running_operations from anon, authenticated;
revoke all on public.long_running_operation_events from anon, authenticated;
grant all on public.long_running_operations to service_role;
grant all on public.long_running_operation_events to service_role;

create or replace function public.claim_next_long_running_operation(
  p_operation_type text,
  p_worker_ref text
)
returns setof public.long_running_operations
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidate as (
    select id
    from public.long_running_operations
    where operation_type = p_operation_type
      and expires_at > timezone('utc'::text, now())
      and (
        status = 'pending'
        or (
          status = 'running'
          and (
            worker_ref is null
            or last_heartbeat_at is null
            or last_heartbeat_at < timezone('utc'::text, now()) - interval '2 minutes'
          )
        )
        or (
          status = 'cancel_requested'
          and (
            worker_ref is null
            or last_heartbeat_at is null
            or last_heartbeat_at < timezone('utc'::text, now()) - interval '2 minutes'
          )
        )
      )
    order by created_at asc
    for update skip locked
    limit 1
  )
  update public.long_running_operations operation
  set worker_ref = p_worker_ref,
      attempt_count = operation.attempt_count + 1,
      status = case
        when operation.status = 'cancel_requested' then 'cancelled'
        else 'running'
      end,
      stage = case
        when operation.status = 'cancel_requested' then 'cancelled'
        else operation.stage
      end,
      progress_percent = case
        when operation.status = 'cancel_requested' then null
        else operation.progress_percent
      end,
      started_at = coalesce(operation.started_at, timezone('utc'::text, now())),
      last_heartbeat_at = timezone('utc'::text, now()),
      completed_at = case
        when operation.status = 'cancel_requested' then timezone('utc'::text, now())
        else operation.completed_at
      end,
      updated_at = timezone('utc'::text, now())
  from candidate
  where operation.id = candidate.id
  returning operation.*;
end;
$$;

create or replace function public.prune_long_running_operations(
  p_retention_days integer default 30
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
  retention_interval interval;
begin
  retention_interval := make_interval(days => greatest(1, least(p_retention_days, 365)));

  delete from public.long_running_operations
  where (
    status in ('succeeded', 'failed', 'cancelled')
    and coalesce(completed_at, updated_at) < timezone('utc'::text, now()) - retention_interval
  )
  or expires_at < timezone('utc'::text, now())
    and status in ('pending', 'running', 'cancel_requested');

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.claim_next_long_running_operation(text, text) from public, anon, authenticated;
revoke all on function public.prune_long_running_operations(integer) from public, anon, authenticated;
grant execute on function public.claim_next_long_running_operation(text, text) to service_role;
grant execute on function public.prune_long_running_operations(integer) to service_role;

drop trigger if exists update_long_running_operations_updated_at on public.long_running_operations;
create trigger update_long_running_operations_updated_at
before update on public.long_running_operations
for each row
execute function public.update_updated_at_column();
