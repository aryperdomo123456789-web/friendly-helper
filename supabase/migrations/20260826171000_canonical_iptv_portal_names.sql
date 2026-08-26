-- Nomes canônicos dos portais e reorder atômico.
-- Aplicar somente após backup e autorização operacional.

with ordered as (
  select
    id,
    row_number() over (order by sort_order, created_at, id) - 1 as next_sort_order
  from public.iptv_servers
)
update public.iptv_servers servers
set
  sort_order = ordered.next_sort_order,
  name = 'Portal ' || (ordered.next_sort_order + 1)
from ordered
where servers.id = ordered.id;

create or replace function public.admin_reorder_iptv_servers(
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
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

  if coalesce(array_length(p_ordered_ids, 1), 0) <> (select count(*) from public.iptv_servers) then
    raise exception 'A ordem deve conter todos os portais' using errcode = '22023';
  end if;

  if exists (
    select requested.id
    from unnest(p_ordered_ids) as requested(id)
    group by requested.id
    having count(*) > 1
  ) then
    raise exception 'A ordem não pode conter portais duplicados' using errcode = '22023';
  end if;

  if exists (
    select requested.id
    from unnest(p_ordered_ids) as requested(id)
    left join public.iptv_servers servers on servers.id = requested.id
    where servers.id is null
  ) then
    raise exception 'A ordem contém portal inexistente' using errcode = '22023';
  end if;

  update public.iptv_servers servers
  set
    sort_order = ordered.ordinality - 1,
    name = 'Portal ' || ordered.ordinality
  from unnest(p_ordered_ids) with ordinality as ordered(id, ordinality)
  where servers.id = ordered.id;
end;
$$;

grant execute on function public.admin_reorder_iptv_servers(uuid[]) to authenticated;
