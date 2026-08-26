create or replace function public.admin_list_access_users(
  p_search text default '',
  p_status text default 'all',
  p_server_id uuid default null,
  p_plan_id uuid default null,
  p_referral text default 'all',
  p_sort_order text default 'newest',
  p_page integer default 1,
  p_page_size integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_cutoff timestamptz := now() - interval '3 minutes';
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := greatest(least(coalesce(p_page_size, 10), 1000), 1);
  v_offset integer := greatest((greatest(coalesce(p_page, 1), 1) - 1) * greatest(least(coalesce(p_page_size, 10), 1000), 1), 0);
  v_search text := lower(trim(coalesce(p_search, '')));
  v_status_counts jsonb;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('owner', 'admin')
  ) then
    raise exception 'Acesso restrito ao dono do sistema' using errcode = '42501';
  end if;

  with online_users as (
    select distinct ds.user_id
    from public.device_sessions ds
    where ds.last_seen > v_cutoff
  ),
  access_agg as (
    select
      usa.user_id,
      jsonb_agg(usa.server_id order by usa.server_id) as server_ids
    from public.user_server_access usa
    group by usa.user_id
  )
  select jsonb_build_object(
    'all', count(*)::int,
    'active', count(*) filter (where p.is_active = true and (p.expires_at is null or p.expires_at >= v_now))::int,
    'blocked', count(*) filter (where p.is_active = false)::int,
    'expired', count(*) filter (where p.expires_at is not null and p.expires_at < v_now)::int,
    'online', count(*) filter (where ou.user_id is not null)::int
  )
  into v_status_counts
  from public.profiles p
  left join online_users ou on ou.user_id = p.id;

  with online_users as (
    select distinct ds.user_id
    from public.device_sessions ds
    where ds.last_seen > v_cutoff
  ),
  access_agg as (
    select
      usa.user_id,
      jsonb_agg(usa.server_id order by usa.server_id) as server_ids
    from public.user_server_access usa
    group by usa.user_id
  ),
  filtered as (
    select
      p.id,
      p.username,
      p.display_name,
      p.max_connections,
      p.expires_at,
      p.is_active,
      p.created_at,
      p.plan_id,
      p.referred_by_id,
      coalesce(aa.server_ids, '[]'::jsonb) as server_ids,
      case
        when ou.user_id is null then 0
        else 1
      end as online,
      case
        when p.referred_by_id is null then null
        else jsonb_build_object(
          'username', ref.username,
          'display_name', ref.display_name
        )
      end as referred_by,
      to_jsonb(sp) as plan,
      count(*) over() as total_count
    from public.profiles p
    left join public.subscription_plans sp on sp.id = p.plan_id
    left join public.profiles ref on ref.id = p.referred_by_id
    left join access_agg aa on aa.user_id = p.id
    left join online_users ou on ou.user_id = p.id
    where
      (
        v_search = ''
        or lower(coalesce(p.username, '')) like '%' || v_search || '%'
        or lower(coalesce(p.display_name, '')) like '%' || v_search || '%'
      )
      and (
        p_server_id is null
        or exists (
          select 1
          from public.user_server_access usa
          where usa.user_id = p.id
            and usa.server_id = p_server_id
        )
      )
      and (
        p_plan_id is null
        or p.plan_id = p_plan_id
      )
      and (
        p_referral = 'all'
        or (p_referral = 'direct' and p.referred_by_id is null)
        or (p_referral = 'referred' and p.referred_by_id is not null)
      )
      and (
        p_status = 'all'
        or (p_status = 'active' and p.is_active = true and (p.expires_at is null or p.expires_at >= v_now))
        or (p_status = 'blocked' and p.is_active = false)
        or (p_status = 'expired' and p.expires_at is not null and p.expires_at < v_now)
        or (p_status = 'online' and ou.user_id is not null)
      )
    order by
      case when p_sort_order = 'newest' then p.created_at end desc nulls last,
      case when p_sort_order = 'oldest' then p.created_at end asc nulls last,
      case when p_sort_order = 'expiry' then p.expires_at end asc nulls last,
      p.created_at desc,
      p.username asc
    offset v_offset
    limit v_page_size
  )
  select jsonb_build_object(
    'items',
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', filtered.id,
          'username', filtered.username,
          'display_name', filtered.display_name,
          'max_connections', filtered.max_connections,
          'expires_at', filtered.expires_at,
          'is_active', filtered.is_active,
          'created_at', filtered.created_at,
          'plan_id', filtered.plan_id,
          'referred_by_id', filtered.referred_by_id,
          'server_ids', filtered.server_ids,
          'online', filtered.online,
          'referred_by', filtered.referred_by,
          'plan', filtered.plan
        )
      ),
      '[]'::jsonb
    ),
    'total', coalesce(max(filtered.total_count), 0),
    'status_counts', v_status_counts,
    'page', v_page,
    'page_size', v_page_size
  )
  into v_result
  from filtered;

  if v_result is null then
    return jsonb_build_object(
      'items', '[]'::jsonb,
      'total', 0,
      'status_counts', v_status_counts,
      'page', v_page,
      'page_size', v_page_size
    );
  end if;

  return v_result;
end;
$$;

grant execute on function public.admin_list_access_users(text, text, uuid, uuid, text, text, integer, integer) to authenticated;
