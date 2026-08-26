-- Base de pagamentos, eventos e auditoria.
-- Adiciona rastreabilidade sem alterar fluxos existentes.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  provider text not null default 'mercadopago',
  provider_payment_id text unique,
  provider_preference_id text unique,
  external_reference text,
  status text not null default 'pending',
  amount numeric(10, 2) not null default 0.00,
  currency text not null default 'BRL',
  webhook_payload jsonb not null default '{}'::jsonb,
  webhook_received_at timestamptz,
  approved_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint payments_status_check check (
    status in (
      'pending',
      'processing',
      'approved',
      'rejected',
      'cancelled',
      'refunded',
      'chargeback',
      'expired',
      'error',
      'simulated'
    )
  )
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  source text not null default 'server',
  request_id text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.support_messages
  add column if not exists message_type text not null default 'user_message';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_messages_message_type_check'
  ) then
    alter table public.support_messages
      add constraint support_messages_message_type_check
      check (
        message_type in (
          'user_message',
          'support_reply',
          'payment_receipt',
          'payment_event',
          'system_notification',
          'admin_note'
        )
      );
  end if;
end
$$;

create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_plan_id_idx on public.payments(plan_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_created_at_idx on public.payments(created_at desc);
create index if not exists payment_events_payment_id_idx on public.payment_events(payment_id);
create index if not exists payment_events_created_at_idx on public.payment_events(created_at desc);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs(actor_user_id);
create index if not exists audit_logs_target_user_id_idx on public.audit_logs(target_user_id);
create index if not exists audit_logs_entity_type_idx on public.audit_logs(entity_type);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.audit_logs enable row level security;

grant select on public.payments to authenticated;
grant select on public.payment_events to authenticated;
grant select on public.audit_logs to authenticated;
grant all on public.payments to service_role;
grant all on public.payment_events to service_role;
grant all on public.audit_logs to service_role;

drop policy if exists "Users can read own payments" on public.payments;
create policy "Users can read own payments"
on public.payments
for select
to authenticated
using (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Users can read own payment events" on public.payment_events;
create policy "Users can read own payment events"
on public.payment_events
for select
to authenticated
using (
  exists (
    select 1
    from public.payments p
    where p.id = payment_events.payment_id
      and (
        p.user_id = auth.uid()
        or public.has_role(auth.uid(), 'owner'::public.app_role)
        or public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);

drop policy if exists "Owners can read audit logs" on public.audit_logs;
create policy "Owners can read audit logs"
on public.audit_logs
for select
to authenticated
using (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop trigger if exists update_payments_updated_at on public.payments;
create trigger update_payments_updated_at
before update on public.payments
for each row
execute function public.update_updated_at_column();
