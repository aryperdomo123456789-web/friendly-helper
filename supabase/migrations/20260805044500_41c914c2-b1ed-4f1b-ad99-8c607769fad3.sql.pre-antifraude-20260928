create table public.test_device_tracking (
    id uuid primary key default gen_random_uuid(),
    fingerprint text not null unique,
    ip_address text,
    created_at timestamptz default now()
);

grant select, insert on public.test_device_tracking to anon, authenticated;
grant all on public.test_device_tracking to service_role;

alter table public.test_device_tracking enable row level security;

create policy "Anyone can insert tracking info"
on public.test_device_tracking
for insert
with check (true);

create policy "Anyone can read tracking info"
on public.test_device_tracking
for select
using (true);
