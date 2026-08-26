-- Garante uma unica credencial canonica por servidor.
-- Mantem a credencial mais recente de cada server_id e remove duplicatas antigas.

delete from public.server_credentials sc
using (
  select ctid
  from (
    select
      ctid,
      row_number() over (
        partition by server_id
        order by created_at desc, id desc
      ) as rn
    from public.server_credentials
  ) ranked
  where rn > 1
) dup
where sc.ctid = dup.ctid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'server_credentials_server_id_key'
  ) then
    alter table public.server_credentials
      add constraint server_credentials_server_id_key unique (server_id);
  end if;
end
$$;
