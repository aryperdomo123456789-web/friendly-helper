create table if not exists public.iptv_server_cache (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.iptv_servers(id) on delete cascade,
  cache_key text not null,
  payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default timezone('utc'::text, now()),
  unique (server_id, cache_key)
);

create index if not exists iptv_server_cache_server_id_idx on public.iptv_server_cache(server_id);
create index if not exists iptv_server_cache_cache_key_idx on public.iptv_server_cache(cache_key);

alter table public.iptv_server_cache enable row level security;

revoke all on public.iptv_server_cache from anon, authenticated;
grant all on public.iptv_server_cache to service_role;
