-- User-scoped and server-scoped channel favorites.
-- Additive and idempotent: does not alter existing catalog rows.

create table if not exists public.user_channel_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  server_id uuid not null references public.iptv_servers(id) on delete cascade,
  channel_id text not null check (length(btrim(channel_id)) between 1 and 500),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_user_server_channel unique (user_id, server_id, channel_id)
);

create index if not exists idx_user_channel_favorites_lookup
  on public.user_channel_favorites(user_id, server_id, sort_order, created_at);

alter table public.user_channel_favorites enable row level security;

 drop policy if exists user_channel_favorites_select_own on public.user_channel_favorites;
 create policy user_channel_favorites_select_own
   on public.user_channel_favorites for select
   to authenticated
   using (auth.uid() = user_id);

 drop policy if exists user_channel_favorites_insert_own on public.user_channel_favorites;
 create policy user_channel_favorites_insert_own
   on public.user_channel_favorites for insert
   to authenticated
   with check (auth.uid() = user_id);

 drop policy if exists user_channel_favorites_delete_own on public.user_channel_favorites;
 create policy user_channel_favorites_delete_own
   on public.user_channel_favorites for delete
   to authenticated
   using (auth.uid() = user_id);

create or replace function public.toggle_user_channel_favorite(
  p_user_id uuid,
  p_server_id uuid,
  p_channel_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_id uuid;
  v_sort_order integer;
  v_channel_id text := btrim(coalesce(p_channel_id, ''));
begin
  if p_user_id is null or p_server_id is null or v_channel_id = '' or length(v_channel_id) > 500 then
    raise exception 'Dados de favorito inválidos' using errcode = '22023';
  end if;

  if not exists (
    select 1
      from public.iptv_servers s
      join public.user_server_access usa on usa.server_id = s.id
     where s.id = p_server_id
       and s.is_active = true
       and usa.user_id = p_user_id
  ) then
    raise exception 'Acesso ao servidor não autorizado' using errcode = '42501';
  end if;

  select f.id
    into v_existing_id
    from public.user_channel_favorites f
   where f.user_id = p_user_id
     and f.server_id = p_server_id
     and f.channel_id = v_channel_id
   for update;

  if v_existing_id is not null then
    delete from public.user_channel_favorites where id = v_existing_id;
    return jsonb_build_object('favorited', false, 'channel_id', v_channel_id);
  end if;

  select coalesce(max(f.sort_order), -1) + 1
    into v_sort_order
    from public.user_channel_favorites f
   where f.user_id = p_user_id
     and f.server_id = p_server_id;

  insert into public.user_channel_favorites(user_id, server_id, channel_id, sort_order)
  values (p_user_id, p_server_id, v_channel_id, v_sort_order);

  return jsonb_build_object(
    'favorited', true,
    'channel_id', v_channel_id,
    'sort_order', v_sort_order
  );
end;
$$;

revoke all on function public.toggle_user_channel_favorite(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.toggle_user_channel_favorite(uuid, uuid, text)
  to service_role;
