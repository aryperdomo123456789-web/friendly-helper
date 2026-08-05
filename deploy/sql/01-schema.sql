-- Schema base do backend proprio
-- Executar uma vez em um projeto Supabase novo.

create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('admin', 'owner', 'user');
exception
  when duplicate_object then null;
end
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.app_config (
  id uuid primary key default gen_random_uuid(),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create table if not exists public.iptv_servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.server_credentials (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.iptv_servers(id) on delete cascade,
  username text not null,
  password text not null,
  dns text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null default 0.00,
  duration_days integer not null,
  duration_value integer not null,
  duration_unit text not null default 'days',
  max_connections integer not null default 1,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint subscription_plans_duration_unit_check check (duration_unit in ('days', 'hours', 'minutes'))
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  max_connections integer not null default 1,
  expires_at timestamptz,
  is_active boolean not null default true,
  plan_id uuid references public.subscription_plans(id),
  created_by uuid references auth.users(id),
  referral_code text unique,
  referred_by_id uuid references auth.users(id),
  referral_source_slug text,
  referral_source_code text,
  referral_source_url text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.user_server_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  server_id uuid not null references public.iptv_servers(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, server_id)
);

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  user_agent text,
  last_seen timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, device_id)
);

create table if not exists public.test_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  duration_minutes integer not null default 240,
  max_connections integer not null default 1,
  is_active boolean not null default true,
  owner_only boolean not null default false,
  allow_repeat_device boolean not null default false,
  bonus_days_monthly integer default 15,
  bonus_days_quarterly integer default 30,
  description text,
  created_by_id uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.test_device_tracking (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  ip_address text,
  created_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  last_message text,
  last_message_at timestamptz not null default timezone('utc'::text, now()),
  unread_count_owner integer not null default 0,
  unread_count_user integer not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id)
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  content text,
  file_url text,
  file_type text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  type text not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

create index if not exists user_roles_user_id_idx on public.user_roles(user_id);
create index if not exists profiles_referred_by_id_idx on public.profiles(referred_by_id);
create index if not exists profiles_referral_source_slug_idx on public.profiles(referral_source_slug);
create index if not exists profiles_referral_source_code_idx on public.profiles(referral_source_code);
create index if not exists profiles_plan_id_idx on public.profiles(plan_id);
create index if not exists profiles_created_by_idx on public.profiles(created_by);
create index if not exists iptv_servers_created_by_idx on public.iptv_servers(created_by);
create index if not exists server_credentials_server_id_idx on public.server_credentials(server_id);
create index if not exists user_server_access_user_id_idx on public.user_server_access(user_id);
create index if not exists user_server_access_server_id_idx on public.user_server_access(server_id);
create index if not exists device_sessions_user_id_idx on public.device_sessions(user_id);
create index if not exists support_messages_thread_idx on public.support_messages(thread_id, created_at);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);
create index if not exists test_links_owner_only_idx on public.test_links(owner_only);
create index if not exists test_links_allow_repeat_device_idx on public.test_links(allow_repeat_device);

alter table public.app_config enable row level security;
alter table public.user_roles enable row level security;
alter table public.iptv_servers enable row level security;
alter table public.server_credentials enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.profiles enable row level security;
alter table public.user_server_access enable row level security;
alter table public.device_sessions enable row level security;
alter table public.test_links enable row level security;
alter table public.test_device_tracking enable row level security;
alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.app_config to anon, authenticated;
grant insert, update on public.app_config to authenticated;
grant all on public.app_config to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select, insert, update, delete on public.iptv_servers to authenticated;
grant all on public.iptv_servers to service_role;

grant select, insert, update, delete on public.server_credentials to authenticated;
grant all on public.server_credentials to service_role;

grant select, insert, update, delete on public.subscription_plans to authenticated;
grant all on public.subscription_plans to service_role;

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select on public.user_server_access to authenticated;
grant all on public.user_server_access to service_role;

grant select on public.device_sessions to authenticated;
grant all on public.device_sessions to service_role;

grant select, insert, update, delete on public.test_links to anon, authenticated;
grant all on public.test_links to service_role;

grant select, insert on public.test_device_tracking to anon, authenticated;
grant all on public.test_device_tracking to service_role;

grant select, insert, update on public.support_threads to authenticated;
grant all on public.support_threads to service_role;

grant select, insert on public.support_messages to authenticated;
grant all on public.support_messages to service_role;

grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;

revoke all on function public.has_role(uuid, public.app_role) from public;
revoke all on function public.has_role(uuid, public.app_role) from anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to service_role;

drop policy if exists "Allow authenticated read app_config" on public.app_config;
drop policy if exists "Allow owner update app_config" on public.app_config;
create policy "Allow authenticated read app_config"
on public.app_config
for select
to anon, authenticated
using (true);

create policy "Allow owner update app_config"
on public.app_config
for all
to authenticated
using (public.has_role(auth.uid(), 'owner'::public.app_role) or public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'owner'::public.app_role) or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "authenticated_can_read_own_role" on public.user_roles;
create policy "authenticated_can_read_own_role"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Owners can manage servers" on public.iptv_servers;
create policy "Owners can manage servers"
on public.iptv_servers
for all
to authenticated
using (public.has_role(auth.uid(), 'owner'::public.app_role) or public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'owner'::public.app_role) or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Owners can manage credentials" on public.server_credentials;
create policy "Owners can manage credentials"
on public.server_credentials
for all
to authenticated
using (public.has_role(auth.uid(), 'owner'::public.app_role) or public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'owner'::public.app_role) or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Owners can manage plans" on public.subscription_plans;
drop policy if exists "Authenticated users can select plans" on public.subscription_plans;
create policy "Authenticated users can select plans"
on public.subscription_plans
for select
to authenticated
using (true);

create policy "Owners can manage plans"
on public.subscription_plans
for all
to authenticated
using (public.has_role(auth.uid(), 'owner'::public.app_role) or public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'owner'::public.app_role) or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Read own access" on public.user_server_access;
create policy "Read own access"
on public.user_server_access
for select
to authenticated
using (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Read own devices" on public.device_sessions;
create policy "Read own devices"
on public.device_sessions
for select
to authenticated
using (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Owners can manage test links" on public.test_links;
create policy "Owners can manage test links"
on public.test_links
for all
to authenticated
using (public.has_role(auth.uid(), 'owner'::public.app_role) or public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'owner'::public.app_role) or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Anyone can insert tracking info" on public.test_device_tracking;
drop policy if exists "Anyone can read tracking info" on public.test_device_tracking;
create policy "Anyone can insert tracking info"
on public.test_device_tracking
for insert
to anon, authenticated
with check (true);

create policy "Anyone can read tracking info"
on public.test_device_tracking
for select
to anon, authenticated
using (true);

drop policy if exists "Users can see their own thread" on public.support_threads;
drop policy if exists "Users can create their own thread" on public.support_threads;
drop policy if exists "Users and owners can update threads" on public.support_threads;
create policy "Users can see their own thread"
on public.support_threads
for select
to authenticated
using (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

create policy "Users can create their own thread"
on public.support_threads
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users and owners can update threads"
on public.support_threads
for update
to authenticated
using (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Participants can read messages" on public.support_messages;
drop policy if exists "Participants can send messages" on public.support_messages;
create policy "Participants can read messages"
on public.support_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.support_threads t
    where t.id = support_messages.thread_id
      and (
        t.user_id = auth.uid()
        or public.has_role(auth.uid(), 'owner'::public.app_role)
        or public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);

create policy "Participants can send messages"
on public.support_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.support_threads t
    where t.id = support_messages.thread_id
      and (
        t.user_id = auth.uid()
        or public.has_role(auth.uid(), 'owner'::public.app_role)
        or public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);

drop policy if exists "Users can read own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications
for select
to authenticated
using (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'owner'::public.app_role)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Authenticated can upload chat files" on storage.objects;
drop policy if exists "Authenticated can read chat files" on storage.objects;
drop policy if exists "Authenticated can delete chat files" on storage.objects;
drop policy if exists "Chat files are public" on storage.objects;

insert into storage.buckets (id, name, public)
values ('chat-files-v2', 'chat-files-v2', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

create policy "Authenticated can upload chat files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'chat-files-v2');

create policy "Authenticated can read chat files"
on storage.objects
for select
to authenticated
using (bucket_id = 'chat-files-v2');

create policy "Authenticated can delete chat files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'chat-files-v2');

drop trigger if exists update_app_config_updated_at on public.app_config;
drop trigger if exists update_subscription_plans_updated_at on public.subscription_plans;
drop trigger if exists update_test_links_updated_at on public.test_links;
drop trigger if exists update_support_threads_updated_at on public.support_threads;

create trigger update_app_config_updated_at
before update on public.app_config
for each row
execute function public.update_updated_at_column();

create trigger update_subscription_plans_updated_at
before update on public.subscription_plans
for each row
execute function public.update_updated_at_column();

create trigger update_test_links_updated_at
before update on public.test_links
for each row
execute function public.update_updated_at_column();

create trigger update_support_threads_updated_at
before update on public.support_threads
for each row
execute function public.update_updated_at_column();
