-- Confiabilidade, idempotência e diagnóstico do chat.
-- Aplicar somente após backup e autorização operacional.

do $$
begin
  alter table public.support_threads
    drop constraint if exists support_threads_status_check;
  alter table public.support_threads
    add constraint support_threads_status_check
    check (status in ('open', 'pending_support', 'pending_customer', 'closed'));
end $$;

alter table public.support_messages
  add column if not exists client_message_id text;

alter table public.support_threads
  add column if not exists first_response_at timestamptz;

alter table public.support_messages
  drop constraint if exists support_messages_client_message_id_length;

alter table public.support_messages
  add constraint support_messages_client_message_id_length
  check (client_message_id is null or char_length(client_message_id) between 8 and 128);

create unique index if not exists support_messages_sender_client_message_id_uidx
  on public.support_messages(sender_id, client_message_id)
  where sender_id is not null and client_message_id is not null;

create unique index if not exists support_threads_one_open_per_user_uidx
  on public.support_threads(user_id)
  where status = 'open';

create index if not exists support_messages_sender_created_idx
  on public.support_messages(sender_id, created_at desc)
  where sender_id is not null;

create index if not exists support_messages_thread_created_desc_idx
  on public.support_messages(thread_id, created_at desc);

comment on column public.support_messages.client_message_id is
  'Chave idempotente gerada pelo cliente e validada pelo backend para evitar duplicação em retries.';

comment on column public.support_threads.first_response_at is
  'Primeiro timestamp UTC em que a equipe respondeu ao cliente.';
