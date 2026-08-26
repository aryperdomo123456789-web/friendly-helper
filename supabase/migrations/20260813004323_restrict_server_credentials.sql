revoke all on public.server_credentials from authenticated;

drop policy if exists "Owners can manage credentials" on public.server_credentials;
