-- Observações privadas do dono para referência operacional de cada portal.
-- Esta migration é aditiva e deve ser aplicada somente após backup e autorização operacional.

create table if not exists public.iptv_server_owner_notes (
  server_id uuid primary key references public.iptv_servers(id) on delete cascade,
  note text not null default '' check (char_length(note) <= 2000),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.iptv_server_owner_notes enable row level security;

revoke all on public.iptv_server_owner_notes from anon;
grant select, insert, update, delete on public.iptv_server_owner_notes to authenticated;
grant all on public.iptv_server_owner_notes to service_role;

drop policy if exists "Only owners manage portal notes" on public.iptv_server_owner_notes;
create policy "Only owners manage portal notes"
on public.iptv_server_owner_notes
for all
to authenticated
using (public.has_role(auth.uid(), 'owner'))
with check (public.has_role(auth.uid(), 'owner'));

comment on table public.iptv_server_owner_notes is
  'Observações operacionais privadas do owner para referências dos portais IPTV.';
