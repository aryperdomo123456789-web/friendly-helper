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

  update public.iptv_servers s
  set sort_order = ordered.ordinality - 1
  from unnest(p_ordered_ids) with ordinality as ordered(id, ordinality)
  where s.id = ordered.id;
end;
$$;

grant execute on function public.admin_reorder_iptv_servers(uuid[]) to authenticated;
