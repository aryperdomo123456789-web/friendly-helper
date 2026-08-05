alter table public.test_links
  add column if not exists owner_only boolean not null default false;

alter table public.test_links
  add column if not exists allow_repeat_device boolean not null default false;

create index if not exists test_links_owner_only_idx on public.test_links(owner_only);
create index if not exists test_links_allow_repeat_device_idx on public.test_links(allow_repeat_device);

insert into public.test_links (
  slug,
  duration_minutes,
  max_connections,
  is_active,
  owner_only,
  allow_repeat_device,
  bonus_days_monthly,
  bonus_days_quarterly,
  description,
  created_at,
  updated_at
)
values (
  'dono-livre',
  360,
  1,
  true,
  true,
  true,
  15,
  30,
  'Link Exclusivo do Dono',
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
)
on conflict (slug) do update
set duration_minutes = excluded.duration_minutes,
    max_connections = excluded.max_connections,
    is_active = excluded.is_active,
    owner_only = excluded.owner_only,
    allow_repeat_device = excluded.allow_repeat_device,
    bonus_days_monthly = excluded.bonus_days_monthly,
    bonus_days_quarterly = excluded.bonus_days_quarterly,
    description = excluded.description,
    updated_at = excluded.updated_at;
