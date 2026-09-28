-- Atomic public test abuse protection.
-- The owner-exclusive link intentionally bypasses this function in the server.

alter table public.test_links
  add column if not exists owner_only boolean not null default false;
alter table public.test_links
  add column if not exists allow_repeat_device boolean not null default false;

insert into public.test_links (
  slug, duration_minutes, max_connections, is_active,
  owner_only, allow_repeat_device, bonus_days_monthly, bonus_days_quarterly, description
)
values (
  'dono-livre', 360, 1, true,
  true, true, 15, 30, 'Link Exclusivo do Dono'
)
on conflict (slug) do update set
  is_active = true,
  owner_only = true,
  allow_repeat_device = true,
  description = coalesce(public.test_links.description, excluded.description),
  updated_at = timezone('utc'::text, now());

revoke all on public.test_device_tracking from anon, authenticated;

create index if not exists test_device_tracking_ip_created_at_idx
  on public.test_device_tracking(ip_address, created_at desc);

create table if not exists public.test_rate_limits (
    scope_key text primary key,
    window_started_at timestamptz not null,
    request_count integer not null default 0,
    updated_at timestamptz not null default now()
);

revoke all on public.test_rate_limits from anon, authenticated;
grant all on public.test_rate_limits to service_role;

create or replace function public.claim_public_test_slot(
    p_fingerprint text,
    p_ip_address text default null,
    p_rate_window_seconds integer default 900,
    p_max_requests integer default 3
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    now_utc timestamptz := timezone('utc'::text, now());
    window_seconds integer := greatest(30, least(p_rate_window_seconds, 86400));
    max_requests integer := greatest(1, least(p_max_requests, 20));
    rate_key text := case
      when nullif(trim(p_ip_address), '') is not null then 'ip:' || trim(p_ip_address)
      else 'fingerprint:' || trim(p_fingerprint)
    end;
    current_limit public.test_rate_limits%rowtype;
begin
    if p_fingerprint is null or length(trim(p_fingerprint)) < 8 then
        return jsonb_build_object('allowed', false, 'reason', 'fingerprint');
    end if;

    if exists (
        select 1 from public.test_device_tracking
        where fingerprint = trim(p_fingerprint)
    ) then
        return jsonb_build_object('allowed', false, 'reason', 'fingerprint');
    end if;

    if nullif(trim(p_ip_address), '') is not null and exists (
        select 1 from public.test_device_tracking
        where ip_address = trim(p_ip_address)
          and created_at > now_utc - interval '24 hours'
    ) then
        return jsonb_build_object('allowed', false, 'reason', 'ip');
    end if;

    select * into current_limit
    from public.test_rate_limits
    where scope_key = rate_key
    for update;

    if not found then
        insert into public.test_rate_limits(scope_key, window_started_at, request_count, updated_at)
        values (rate_key, now_utc, 1, now_utc);
    elsif current_limit.window_started_at <= now_utc - make_interval(secs => window_seconds) then
        update public.test_rate_limits
        set window_started_at = now_utc, request_count = 1, updated_at = now_utc
        where scope_key = rate_key;
    elsif current_limit.request_count >= max_requests then
        return jsonb_build_object('allowed', false, 'reason', 'rate');
    else
        update public.test_rate_limits
        set request_count = request_count + 1, updated_at = now_utc
        where scope_key = rate_key;
    end if;

    insert into public.test_device_tracking(fingerprint, ip_address, created_at)
    values (trim(p_fingerprint), nullif(trim(p_ip_address), ''), now_utc);

    return jsonb_build_object('allowed', true);
exception
    when unique_violation then
        return jsonb_build_object('allowed', false, 'reason', 'fingerprint');
end;
$$;

revoke all on function public.claim_public_test_slot(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_public_test_slot(text, text, integer, integer) to service_role;

create table if not exists public.referral_rewards (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid not null unique references public.payments(id) on delete cascade,
    referred_user_id uuid not null references auth.users(id) on delete cascade,
    referrer_id uuid not null references auth.users(id) on delete cascade,
    bonus_days integer not null check (bonus_days > 0),
    created_at timestamptz not null default timezone('utc'::text, now())
);

revoke all on public.referral_rewards from anon, authenticated;
grant all on public.referral_rewards to service_role;

create or replace function public.apply_referral_bonus_once(
    p_payment_id uuid,
    p_referred_user_id uuid,
    p_source_slug text,
    p_bonus_days integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    referred_by uuid;
    reward_id uuid;
    referrer_expiry timestamptz;
    base_expiry timestamptz;
begin
    if p_payment_id is null or p_referred_user_id is null
       or p_source_slug is null or p_source_slug = 'dono-livre'
       or p_bonus_days is null or p_bonus_days <= 0 then
        return jsonb_build_object('applied', false, 'reason', 'ineligible');
    end if;

    select referred_by_id into referred_by
    from public.profiles
    where id = p_referred_user_id;

    if referred_by is null or referred_by = p_referred_user_id then
        return jsonb_build_object('applied', false, 'reason', 'no_referrer');
    end if;

    if exists (
        select 1 from public.user_roles
        where user_id = referred_by and role in ('owner', 'admin')
    ) then
        return jsonb_build_object('applied', false, 'reason', 'referrer_not_public');
    end if;

    insert into public.referral_rewards(payment_id, referred_user_id, referrer_id, bonus_days)
    values (p_payment_id, p_referred_user_id, referred_by, p_bonus_days)
    on conflict (payment_id) do nothing
    returning id into reward_id;

    if reward_id is null then
        return jsonb_build_object('applied', false, 'reason', 'already_applied');
    end if;

    select expires_at into referrer_expiry
    from public.profiles
    where id = referred_by
    for update;

    base_expiry := case
      when referrer_expiry is not null and referrer_expiry > timezone('utc'::text, now())
        then referrer_expiry
      else timezone('utc'::text, now())
    end;

    update public.profiles
    set expires_at = base_expiry + make_interval(days => p_bonus_days)
    where id = referred_by;

    return jsonb_build_object('applied', true, 'reward_id', reward_id);
end;
$$;

revoke all on function public.apply_referral_bonus_once(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.apply_referral_bonus_once(uuid, uuid, text, integer) to service_role;
