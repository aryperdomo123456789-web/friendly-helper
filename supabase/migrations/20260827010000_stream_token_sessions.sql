create table if not exists public.stream_token_sessions (
  session_key text primary key,
  subject text,
  root_replay_key text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists stream_token_sessions_expiry_idx
  on public.stream_token_sessions (expires_at);

alter table public.stream_token_sessions enable row level security;

revoke all on table public.stream_token_sessions from anon, authenticated;
grant select, insert, update, delete on table public.stream_token_sessions to service_role;

drop function if exists public.claim_stream_token_session(text, text, text, boolean, bigint);
create or replace function public.claim_stream_token_session(
  p_session_key text,
  p_replay_key text,
  p_subject text,
  p_cookie text,
  p_is_root boolean,
  p_expires_at bigint
)
returns table(allowed boolean, set_cookie boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_session public.stream_token_sessions%rowtype;
  requested_expiry timestamptz;
begin
  if p_session_key is null or p_session_key !~ '^[A-Za-z0-9_-]{20,128}$'
    or p_replay_key is null or p_replay_key !~ '^[A-Za-z0-9_-]{20,128}$'
    or p_expires_at is null
  then
    return query select false, false;
    return;
  end if;

  requested_expiry := to_timestamp(p_expires_at);
  if requested_expiry <= now() then
    return query select false, false;
    return;
  end if;

  select * into current_session
  from public.stream_token_sessions
  where session_key = p_session_key
  for update;

  if not found then
    if not coalesce(p_is_root, false) then
      return query select false, false;
      return;
    end if;

    insert into public.stream_token_sessions (
      session_key,
      subject,
      root_replay_key,
      expires_at
    ) values (
      p_session_key,
      nullif(left(coalesce(p_subject, ''), 128), ''),
      p_replay_key,
      requested_expiry
    );
    return query select true, true;
    return;
  end if;

  if current_session.expires_at <= now() then
    delete from public.stream_token_sessions where session_key = p_session_key;
    return query select false, false;
    return;
  end if;

  if current_session.subject is distinct from nullif(left(coalesce(p_subject, ''), 128), '') then
    return query select false, false;
    return;
  end if;

  if p_cookie is null or p_cookie <> p_session_key then
    return query select false, false;
    return;
  end if;

  update public.stream_token_sessions
  set last_seen_at = now(),
      expires_at = least(expires_at, requested_expiry)
  where session_key = p_session_key;

  return query select true, false;
end;
$$;

revoke all on function public.claim_stream_token_session(text, text, text, text, boolean, bigint)
  from public, anon, authenticated;
grant execute on function public.claim_stream_token_session(text, text, text, text, boolean, bigint)
  to service_role;

create or replace function public.prune_stream_token_sessions(
  p_before timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.stream_token_sessions
  where expires_at < p_before;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.prune_stream_token_sessions(timestamptz)
  from public, anon, authenticated;
grant execute on function public.prune_stream_token_sessions(timestamptz)
  to service_role;
