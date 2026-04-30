create or replace function public.add_to_insurance_pool(
  p_jam3iyya_id uuid,
  p_amount numeric,
  p_from_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_pool numeric(10,2);
begin
  if p_jam3iyya_id is null then
    return jsonb_build_object('success', false, 'error', 'jam3iyya_id is required');
  end if;

  if p_from_user_id is null then
    return jsonb_build_object('success', false, 'error', 'from_user_id is required');
  end if;

  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'amount must be positive');
  end if;

  update public.jam3iyyas
  set insurance_pool = round(coalesce(insurance_pool, 0) + p_amount, 2)
  where id = p_jam3iyya_id
  returning insurance_pool into v_updated_pool;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Insurance circle not found');
  end if;

  insert into public.transactions (
    from_user_id,
    to_user_id,
    amount,
    type,
    jam3iyya_id,
    description
  ) values (
    p_from_user_id,
    null,
    round(p_amount, 2),
    'insurance_contribution',
    p_jam3iyya_id,
    'Insurance pool contribution'
  );

  return jsonb_build_object(
    'success', true,
    'insurance_pool_after', v_updated_pool
  );
exception
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.use_insurance(
  p_jam3iyya_id uuid,
  p_required_amount numeric,
  p_recipient_user_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pool_remaining numeric(10,2);
  v_current_pool numeric(10,2);
begin
  if p_jam3iyya_id is null then
    return jsonb_build_object('success', false, 'error', 'jam3iyya_id is required');
  end if;

  if p_recipient_user_id is null then
    return jsonb_build_object('success', false, 'error', 'recipient_user_id is required');
  end if;

  if p_required_amount is null or p_required_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'required_amount must be positive');
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    return jsonb_build_object('success', false, 'error', 'reason is required');
  end if;

  update public.jam3iyyas
  set insurance_pool = round(insurance_pool - p_required_amount, 2)
  where id = p_jam3iyya_id
    and coalesce(insurance_pool, 0) >= p_required_amount
  returning insurance_pool into v_pool_remaining;

  if found then
    insert into public.transactions (
      from_user_id,
      to_user_id,
      amount,
      type,
      jam3iyya_id,
      description
    ) values (
      null,
      p_recipient_user_id,
      round(p_required_amount, 2),
      'insurance_payout',
      p_jam3iyya_id,
      p_reason
    );

    return jsonb_build_object(
      'covered', true,
      'amount_used', round(p_required_amount, 2),
      'pool_remaining', round(v_pool_remaining, 2),
      'shortfall', 0
    );
  end if;

  select coalesce(insurance_pool, 0)
  into v_current_pool
  from public.jam3iyyas
  where id = p_jam3iyya_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Insurance circle not found');
  end if;

  return jsonb_build_object(
    'covered', false,
    'amount_used', 0,
    'pool_remaining', round(v_current_pool, 2),
    'shortfall', round(greatest(p_required_amount - v_current_pool, 0), 2)
  );
exception
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.get_overall_insurance_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_circles integer;
  v_total_pool_value numeric(10,2);
  v_total_protected_value numeric(10,2);
  v_total_defaults_covered integer;
  v_protection_ratio numeric(10,4);
begin
  select count(*), coalesce(sum(insurance_pool), 0)
  into v_total_circles, v_total_pool_value
  from public.jam3iyyas;

  select coalesce(sum(monthly_amount * duration_months), 0)
  into v_total_protected_value
  from public.jam3iyyas
  where status = 'active';

  select count(*)
  into v_total_defaults_covered
  from public.transactions
  where type = 'insurance_payout';

  if v_total_protected_value > 0 then
    v_protection_ratio := round(v_total_pool_value / v_total_protected_value, 4);
  else
    v_protection_ratio := 0;
  end if;

  return jsonb_build_object(
    'total_circles', v_total_circles,
    'total_pool_value', round(v_total_pool_value, 2),
    'total_protected_value', round(v_total_protected_value, 2),
    'total_defaults_covered', v_total_defaults_covered,
    'protection_ratio', v_protection_ratio
  );
exception
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;
