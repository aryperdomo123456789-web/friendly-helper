-- Capacidade por servidor e lease atômico de dispositivo.
-- Aplicar somente após backup, staging e plano de rollback.

alter table public.iptv_servers
  add column if not exists connection_capacity integer;

alter table public.device_sessions
  add column if not exists server_id uuid references public.iptv_servers(id) on delete cascade;

create index if not exists device_sessions_server_id_last_seen_idx
  on public.device_sessions(server_id, last_seen desc);

create index if not exists device_sessions_user_server_last_seen_idx
  on public.device_sessions(user_id, server_id, last_seen desc);

create or replace function public.claim_device_session(
  p_user_id uuid,
  p_server_id uuid,
  p_device_id text,
  p_user_agent text default null
)
returns table (
  allowed boolean,
  reason text,
  user_active integer,
  user_limit integer,
  server_active integer,
  server_limit integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_limit integer;
  v_server_limit integer;
  v_user_active integer;
  v_server_active integer;
  v_existing_server_id uuid;
  v_has_existing_session boolean := false;
  v_same_session boolean;
begin
  if p_user_id is null or p_server_id is null or nullif(trim(p_device_id), '') is null then
    raise exception 'Dados de sessão inválidos';
  end if;

  -- Serializa apenas as decisões de capacidade do mesmo usuário.
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select max_connections
    into v_user_limit
    from public.profiles
   where id = p_user_id;

  -- Donos/admins sem perfil de acesso não consomem a quota de assinante.
  if not found then
    return query select true, 'admin_or_owner', 0, null::integer, 0, null::integer;
    return;
  end if;

  select connection_capacity
    into v_server_limit
    from public.iptv_servers
   where id = p_server_id
     and is_active = true;

  if not found then
    return query select false, 'server_unavailable', 0, v_user_limit, 0, null::integer;
    return;
  end if;

  delete from public.device_sessions
   where user_id = p_user_id
     and last_seen < timezone('utc'::text, now()) - interval '3 minutes';

  select server_id
    into v_existing_server_id
    from public.device_sessions
   where user_id = p_user_id
     and device_id = p_device_id
   for update;

  v_has_existing_session := found;
  v_same_session := v_has_existing_session and v_existing_server_id = p_server_id;

  select count(*)::integer
    into v_user_active
    from public.device_sessions
   where user_id = p_user_id;

  select count(*)::integer
    into v_server_active
    from public.device_sessions
   where server_id = p_server_id;

  if not v_same_session
     and v_user_limit is not null
     and v_user_limit > 0
     and v_user_active >= v_user_limit
     and not v_has_existing_session then
    return query select false, 'user_limit', v_user_active, v_user_limit, v_server_active, v_server_limit;
    return;
  end if;

  if not v_same_session
     and v_server_limit is not null
     and v_server_limit > 0
     and v_server_active >= v_server_limit then
    return query select false, 'server_limit', v_user_active, v_user_limit, v_server_active, v_server_limit;
    return;
  end if;

  insert into public.device_sessions (user_id, device_id, user_agent, server_id, last_seen)
  values (p_user_id, p_device_id, p_user_agent, p_server_id, timezone('utc'::text, now()))
  on conflict (user_id, device_id) do update
    set user_agent = excluded.user_agent,
        server_id = excluded.server_id,
        last_seen = excluded.last_seen;

  return query select true, 'ok',
    case when v_has_existing_session then v_user_active else v_user_active + 1 end,
    v_user_limit,
    case when v_same_session then v_server_active else v_server_active + 1 end,
    v_server_limit;
end;
$$;

revoke all on function public.claim_device_session(uuid, uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.claim_device_session(uuid, uuid, text, text)
  to service_role;
