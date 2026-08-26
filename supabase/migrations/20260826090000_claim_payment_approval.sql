-- Reivindicação atômica de aprovação para impedir replay e dupla ativação.
-- Aplicar somente após backup e validação em staging.

create or replace function public.claim_payment_approval(
  p_provider_payment_id text,
  p_provider_preference_id text,
  p_user_id uuid,
  p_plan_id uuid,
  p_external_reference text,
  p_amount numeric,
  p_currency text,
  p_webhook_payload jsonb,
  p_webhook_received_at timestamptz,
  p_approved_at timestamptz
)
returns table (
  payment_id uuid,
  should_apply boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
begin
  if nullif(trim(p_provider_payment_id), '') is null then
    raise exception 'provider_payment_id é obrigatório';
  end if;

  select *
    into v_payment
    from public.payments
   where provider_payment_id = p_provider_payment_id
   for update;

  if not found and p_provider_preference_id is not null then
    select *
      into v_payment
      from public.payments
     where provider_preference_id = p_provider_preference_id
     for update;
  end if;

  if not found then
    insert into public.payments (
      user_id,
      plan_id,
      provider,
      provider_payment_id,
      provider_preference_id,
      external_reference,
      status,
      amount,
      currency,
      webhook_payload,
      webhook_received_at,
      approved_at,
      updated_at
    ) values (
      p_user_id,
      p_plan_id,
      'mercadopago',
      p_provider_payment_id,
      p_provider_preference_id,
      p_external_reference,
      'approved',
      p_amount,
      coalesce(nullif(p_currency, ''), 'BRL'),
      coalesce(p_webhook_payload, '{}'::jsonb),
      p_webhook_received_at,
      p_approved_at,
      timezone('utc'::text, now())
    )
    returning * into v_payment;

    return query select v_payment.id, true;
    return;
  end if;

  if v_payment.user_id <> p_user_id or v_payment.plan_id <> p_plan_id then
    raise exception 'Pagamento existente não corresponde ao usuário ou plano informado';
  end if;

  if v_payment.status = 'approved' then
    return query select v_payment.id, false;
    return;
  end if;

  update public.payments
     set provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
         provider_preference_id = coalesce(provider_preference_id, p_provider_preference_id),
         external_reference = coalesce(external_reference, p_external_reference),
         status = 'approved',
         amount = p_amount,
         currency = coalesce(nullif(p_currency, ''), currency),
         webhook_payload = coalesce(p_webhook_payload, webhook_payload),
         webhook_received_at = coalesce(p_webhook_received_at, webhook_received_at),
         approved_at = coalesce(p_approved_at, approved_at),
         last_error = null,
         updated_at = timezone('utc'::text, now())
   where id = v_payment.id
  returning * into v_payment;

  return query select v_payment.id, true;
end;
$$;

revoke all on function public.claim_payment_approval(
  text,
  text,
  uuid,
  uuid,
  text,
  numeric,
  text,
  jsonb,
  timestamptz,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.claim_payment_approval(
  text,
  text,
  uuid,
  uuid,
  text,
  numeric,
  text,
  jsonb,
  timestamptz,
  timestamptz
) to service_role;
