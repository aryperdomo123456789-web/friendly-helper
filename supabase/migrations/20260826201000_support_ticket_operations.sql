-- Metadados operacionais do inbox e base para SLA.
-- Aplicar somente após backup e autorização operacional.

alter table public.support_threads
  add column if not exists priority text not null default 'normal',
  add column if not exists category text not null default 'general',
  add column if not exists assigned_to_user_id uuid references auth.users(id) on delete set null,
  add column if not exists first_response_due_at timestamptz,
  add column if not exists resolution_due_at timestamptz,
  add column if not exists waiting_since timestamptz;

do $$
begin
  alter table public.support_threads
    drop constraint if exists support_threads_priority_check;
  alter table public.support_threads
    add constraint support_threads_priority_check
    check (priority in ('low', 'normal', 'high', 'urgent'));

  alter table public.support_threads
    drop constraint if exists support_threads_category_check;
  alter table public.support_threads
    add constraint support_threads_category_check
    check (category in ('general', 'access', 'billing', 'playback', 'catalog', 'technical', 'other'));
end $$;

create index if not exists support_threads_priority_idx
  on public.support_threads(priority, last_message_at desc);

create index if not exists support_threads_category_idx
  on public.support_threads(category, last_message_at desc);

create index if not exists support_threads_assigned_idx
  on public.support_threads(assigned_to_user_id, status, last_message_at desc);

create index if not exists support_threads_sla_idx
  on public.support_threads(first_response_due_at, resolution_due_at)
  where status <> 'closed';
