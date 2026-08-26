-- Suporte com histórico, encerramento, satisfação e rastreabilidade.

alter table public.support_threads
  drop constraint if exists support_threads_user_id_key;

alter table public.support_threads
  add column if not exists protocol text,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists closed_by_role text,
  add column if not exists satisfaction_score integer,
  add column if not exists satisfaction_note text,
  add column if not exists satisfaction_requested_at timestamptz,
  add column if not exists satisfaction_submitted_at timestamptz,
  add column if not exists last_user_message_at timestamptz,
  add column if not exists last_owner_message_at timestamptz,
  add column if not exists closure_prompt_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_threads_status_check'
  ) then
    alter table public.support_threads
      add constraint support_threads_status_check
      check (status in ('open', 'closed'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_threads_satisfaction_score_check'
  ) then
    alter table public.support_threads
      add constraint support_threads_satisfaction_score_check
      check (satisfaction_score is null or satisfaction_score between 1 and 5);
  end if;
end
$$;

create index if not exists support_threads_user_id_idx on public.support_threads(user_id);
create index if not exists support_threads_status_idx on public.support_threads(status);
create index if not exists support_threads_last_message_at_idx on public.support_threads(last_message_at desc);
create index if not exists support_threads_satisfaction_score_idx on public.support_threads(satisfaction_score);
create index if not exists support_threads_closed_at_idx on public.support_threads(closed_at desc);
create index if not exists support_threads_protocol_idx on public.support_threads(protocol);

alter table public.support_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.support_messages
  drop constraint if exists support_messages_message_type_check;

alter table public.support_messages
  add constraint support_messages_message_type_check
  check (
    message_type in (
      'user_message',
      'support_reply',
      'payment_receipt',
      'payment_event',
      'system_notification',
      'admin_note',
      'closure_prompt',
      'closure_response',
      'thread_closed',
      'satisfaction_prompt',
      'satisfaction_response'
    )
  );
