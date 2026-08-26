create table if not exists public.iptv_server_m3u_cache (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.iptv_servers(id) on delete cascade,
  source_url text not null,
  playlist_text text not null,
  playlist_hash text not null,
  item_count integer not null default 0,
  fetched_at timestamptz not null default timezone('utc'::text, now()),
  unique (server_id)
);

create index if not exists iptv_server_m3u_cache_server_id_idx on public.iptv_server_m3u_cache(server_id);
create index if not exists iptv_server_m3u_cache_fetched_at_idx on public.iptv_server_m3u_cache(fetched_at desc);

alter table public.iptv_server_m3u_cache enable row level security;

revoke all on public.iptv_server_m3u_cache from anon, authenticated;
grant all on public.iptv_server_m3u_cache to service_role;
