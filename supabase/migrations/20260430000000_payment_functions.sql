alter table public.payments
  drop constraint if exists payments_jam3iyya_id_user_id_month_number_key;

alter table public.payments
  add constraint payments_jam3iyya_id_user_id_month_number_key unique (jam3iyya_id, user_id, month_number);

create index if not exists idx_payments_jam3iyya_month
  on public.payments (jam3iyya_id, month_number);

create or replace function public.process_monthly_cycle(p_jam3iyya_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_circle record;
  v_current_month integer;
  v_due_date date := current_date;
  v_payment_amount numeric(10,2);
  v_insurance_percentage numeric(10,2);
  v_insurance_per_member numeric(10,2);
  v_active_members_count integer := 0;
  v_paid_members_count integer := 0;
  v_late_members_count integer := 0;
  v_pot_amount numeric(10,2) := 0;
  v_insurance_collected numeric(10,2) := 0;
  v_insurance_used numeric(10,2) := 0;
  v_total_collected numeric(10,2) := 0;
  v_total_late_required numeric(10,2) := 0;
  v_turn_holder record;
  v_member record;
  v_member_payment_id uuid;
  v_member_balance numeric(10,2);
  v_member_contribution numeric(10,2);
  v_late_member_ids uuid[] := array[]::uuid[];
  v_paid_member_ids uuid[] := array[]::uuid[];
  v_target_user_id uuid;
  v_errors text[] := array[]::text[];
  v_circle_completed boolean := false;
  v_new_month integer;
begin
  select *
  into v_circle
  from public.jam3iyyas
  where id = p_jam3iyya_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'jam3iyya_id', p_jam3iyya_id,
      'month', 0,
      'pot_amount', 0,
      'turn_holder', jsonb_build_object('id', '', 'name', ''),
      'paid_members_count', 0,
      'late_members_count', 0,
      'insurance_used', 0,
      'insurance_pool_after', 0,
      'is_circle_completed', false,
      'errors', array['Circle not found']
    );
  end if;

  if v_circle.status <> 'active' then
    return jsonb_build_object(
      'success', false,
      'jam3iyya_id', p_jam3iyya_id,
      'month', coalesce(v_circle.current_month, 0),
      'pot_amount', 0,
      'turn_holder', jsonb_build_object('id', '', 'name', ''),
      'paid_members_count', 0,
      'late_members_count', 0,
      'insurance_used', 0,
      'insurance_pool_after', coalesce(v_circle.insurance_pool, 0),
      'is_circle_completed', false,
      'errors', array['Circle not active']
    );
  end if;

  v_current_month := coalesce(v_circle.current_month, 0);
  if v_current_month < 1 then
    v_current_month := 1;
  end if;

  v_payment_amount := round(coalesce(v_circle.monthly_amount, 0)::numeric, 2);
  v_insurance_percentage := coalesce(v_circle.insurance_percentage, 0)::numeric;
  v_insurance_per_member := round((v_payment_amount * v_insurance_percentage) / 100, 2);

  select jm.user_id, p.full_name, jm.turn_number
  into v_turn_holder
  from public.jam3iyya_members jm
  join public.profiles p on p.id = jm.user_id
  where jm.jam3iyya_id = p_jam3iyya_id
    and jm.status = 'active'
    and jm.turn_number = v_current_month
  order by jm.joined_at
  limit 1;

  if not found then
    select jm.user_id, p.full_name, jm.turn_number
    into v_turn_holder
    from public.jam3iyya_members jm
    join public.profiles p on p.id = jm.user_id
    where jm.jam3iyya_id = p_jam3iyya_id
      and jm.status = 'active'
    order by
      case when jm.turn_number > v_current_month then 0 else 1 end,
      jm.turn_number nulls last,
      jm.joined_at
    limit 1;
  end if;

  if not found then
    return jsonb_build_object(
      'success', false,
      'jam3iyya_id', p_jam3iyya_id,
      'month', v_current_month,
      'pot_amount', 0,
      'turn_holder', jsonb_build_object('id', '', 'name', ''),
      'paid_members_count', 0,
      'late_members_count', 0,
      'insurance_used', 0,
      'insurance_pool_after', round(coalesce(v_circle.insurance_pool, 0), 2),
      'is_circle_completed', false,
      'errors', array['No active turn holder found']
    );
  end if;

  for v_member in
    select jm.id, jm.user_id, jm.turn_number, jm.status, jm.total_paid, p.wallet_balance, p.full_name
    from public.jam3iyya_members jm
    join public.profiles p on p.id = jm.user_id
    where jm.jam3iyya_id = p_jam3iyya_id
      and jm.status = 'active'
    order by jm.turn_number nulls last, jm.joined_at
  loop
    v_active_members_count := v_active_members_count + 1;
    v_member_balance := round(coalesce(v_member.wallet_balance, 0)::numeric, 2);
    v_member_contribution := round(v_payment_amount - v_insurance_per_member, 2);

    insert into public.payments (
      jam3iyya_id,
      user_id,
      amount,
      month_number,
      status,
      due_date,
      paid_date,
      payment_method
    ) values (
      p_jam3iyya_id,
      v_member.user_id,
      v_payment_amount,
      v_current_month,
      case when v_member_balance >= v_payment_amount then 'paid' else 'late' end,
      v_due_date,
      case when v_member_balance >= v_payment_amount then now() else null end,
      'wallet'
    )
    on conflict (jam3iyya_id, user_id, month_number)
    do update set
      amount = excluded.amount,
      status = excluded.status,
      due_date = excluded.due_date,
      paid_date = excluded.paid_date,
      payment_method = excluded.payment_method
    returning id into v_member_payment_id;

    if v_member_balance >= v_payment_amount then
      update public.profiles
      set wallet_balance = round(wallet_balance - v_payment_amount, 2)
      where id = v_member.user_id;

      update public.jam3iyya_members
      set total_paid = round(coalesce(total_paid, 0) + v_payment_amount, 2)
      where id = v_member.id;

      insert into public.transactions (from_user_id, amount, type, jam3iyya_id, description)
      values (v_member.user_id, v_member_contribution, 'contribution', p_jam3iyya_id, 'Monthly contribution');

      insert into public.transactions (from_user_id, amount, type, jam3iyya_id, description)
      values (v_member.user_id, v_insurance_per_member, 'insurance_contribution', p_jam3iyya_id, 'Insurance contribution');

      v_paid_members_count := v_paid_members_count + 1;
      v_pot_amount := round(v_pot_amount + v_member_contribution, 2);
      v_insurance_collected := round(v_insurance_collected + v_insurance_per_member, 2);
      v_total_collected := round(v_total_collected + v_payment_amount, 2);
      v_paid_member_ids := array_append(v_paid_member_ids, v_member.user_id);
    else
      v_late_members_count := v_late_members_count + 1;
      v_late_member_ids := array_append(v_late_member_ids, v_member.user_id);
    end if;
  end loop;

  update public.jam3iyyas
  set insurance_pool = round(coalesce(insurance_pool, 0) + v_insurance_collected, 2)
  where id = p_jam3iyya_id;

  if coalesce(array_length(v_late_member_ids, 1), 0) > 0 then
    v_total_late_required := round(v_payment_amount * coalesce(array_length(v_late_member_ids, 1), 0), 2);

    if v_total_late_required <= round(coalesce(v_circle.insurance_pool, 0) + v_insurance_collected, 2) then
      v_insurance_used := v_total_late_required;
      v_pot_amount := round(v_pot_amount + v_total_late_required, 2);

      update public.jam3iyyas
      set insurance_pool = round(coalesce(insurance_pool, 0) - v_total_late_required, 2)
      where id = p_jam3iyya_id;

      foreach v_target_user_id in array v_late_member_ids loop
        update public.payments
        set status = 'covered_by_insurance',
            paid_date = now()
        where jam3iyya_id = p_jam3iyya_id
          and user_id = v_target_user_id
          and month_number = v_current_month;
      end loop;

      foreach v_target_user_id in array v_late_member_ids loop
        insert into public.transactions (from_user_id, to_user_id, amount, type, jam3iyya_id, description)
        values (null, v_turn_holder.user_id, v_payment_amount, 'insurance_payout', p_jam3iyya_id, 'Insurance coverage for late payment');
      end loop;
    else
      v_errors := array_append(v_errors, 'partial_cycle_due_to_insufficient_insurance');
    end if;
  end if;

  update public.profiles
  set wallet_balance = round(wallet_balance + v_pot_amount, 2)
  where id = v_turn_holder.user_id;

  insert into public.transactions (from_user_id, to_user_id, amount, type, jam3iyya_id, description)
  values (null, v_turn_holder.user_id, v_pot_amount, 'payout', p_jam3iyya_id, 'Monthly payout');

  update public.jam3iyya_members
  set has_received = true,
      received_at = now()
  where jam3iyya_id = p_jam3iyya_id
    and user_id = v_turn_holder.user_id;

  v_new_month := v_current_month + 1;
  update public.jam3iyyas
  set current_month = v_new_month
  where id = p_jam3iyya_id;

  if v_new_month > coalesce(v_circle.duration_months, 0) then
    v_circle_completed := true;
    update public.jam3iyyas
    set status = 'completed'
    where id = p_jam3iyya_id;

    update public.jam3iyya_members
    set status = 'completed'
    where jam3iyya_id = p_jam3iyya_id;
  end if;

  foreach v_target_user_id in array v_paid_member_ids loop
    perform public.update_trust_score_if_available(v_target_user_id, 20, 'On-time monthly payment');
    insert into public.notifications (user_id, title, message, type, related_jam3iyya_id)
    values (v_target_user_id, 'Payment processed', format('Payment of %s JOD processed', v_payment_amount), 'payment_processed', p_jam3iyya_id);
  end loop;

  foreach v_target_user_id in array v_late_member_ids loop
    perform public.update_trust_score_if_available(v_target_user_id, -10, 'Late monthly payment');
    insert into public.notifications (user_id, title, message, type, related_jam3iyya_id)
    values (v_target_user_id, 'Payment overdue', 'Your payment is overdue', 'payment_overdue', p_jam3iyya_id);
  end loop;

  insert into public.notifications (user_id, title, message, type, related_jam3iyya_id)
  values (v_turn_holder.user_id, 'Payout received', format('You received %s JOD!', v_pot_amount), 'payout_received', p_jam3iyya_id);

  if round(v_pot_amount + v_insurance_collected - v_insurance_used, 2) < 0 then
    v_errors := array_append(v_errors, 'invalid_cycle_accounting');
  end if;

  return jsonb_build_object(
    'success', true,
    'jam3iyya_id', p_jam3iyya_id,
    'month', v_current_month,
    'pot_amount', round(v_pot_amount, 2),
    'turn_holder', jsonb_build_object('id', v_turn_holder.user_id, 'name', v_turn_holder.full_name),
    'paid_members_count', v_paid_members_count,
    'late_members_count', v_late_members_count,
    'insurance_used', round(v_insurance_used, 2),
    'insurance_pool_after', round(coalesce((select insurance_pool from public.jam3iyyas where id = p_jam3iyya_id), 0), 2),
    'is_circle_completed', v_circle_completed,
    'errors', v_errors
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'jam3iyya_id', p_jam3iyya_id,
      'month', coalesce(v_current_month, 0),
      'pot_amount', 0,
      'turn_holder', jsonb_build_object('id', '', 'name', ''),
      'paid_members_count', 0,
      'late_members_count', 0,
      'insurance_used', 0,
      'insurance_pool_after', coalesce((select insurance_pool from public.jam3iyyas where id = p_jam3iyya_id), 0),
      'is_circle_completed', false,
      'errors', array[sqlerrm]
    );
end;
$$;

create or replace function public.update_trust_score_if_available(
  p_user_id uuid,
  p_change integer,
  p_reason text
)
returns void
language plpgsql
as $$
declare
  v_current_score integer;
  v_new_score integer;
begin
  select trust_score
  into v_current_score
  from public.profiles
  where id = p_user_id;

  if not found then
    return;
  end if;

  v_new_score := greatest(0, least(1000, coalesce(v_current_score, 0) + p_change));

  update public.profiles
  set trust_score = v_new_score,
      tier = case
        when v_new_score >= 800 then 'platinum'
        when v_new_score >= 650 then 'gold'
        when v_new_score >= 450 then 'silver'
        else 'bronze'
      end
  where id = p_user_id;

  insert into public.trust_score_history (user_id, score_change, reason, new_total_score, metadata)
  values (p_user_id, p_change, p_reason, v_new_score, jsonb_build_object('source', 'process_monthly_cycle'));
end;
$$;

create or replace function public.process_manual_payment(
  p_user_id uuid,
  p_jam3iyya_id uuid,
  p_month_number integer
)
returns jsonb
language plpgsql
as $$
declare
  v_payment record;
  v_circle record;
  v_member record;
  v_wallet_balance numeric(10,2);
  v_insurance_contribution numeric(10,2);
  v_net_contribution numeric(10,2);
  v_new_balance numeric(10,2);
  v_new_insurance_pool numeric(10,2);
begin
  select *
  into v_payment
  from public.payments
  where jam3iyya_id = p_jam3iyya_id
    and user_id = p_user_id
    and month_number = p_month_number
  for update;

  if not found or v_payment.status <> 'late' then
    return jsonb_build_object(
      'success', false,
      'jam3iyya_id', p_jam3iyya_id,
      'user_id', p_user_id,
      'month', p_month_number,
      'status', coalesce(v_payment.status, 'late'),
      'amount', 0,
      'insurance_contribution', 0,
      'errors', array['Late payment not found']
    );
  end if;

  select *
  into v_circle
  from public.jam3iyyas
  where id = p_jam3iyya_id
  for update;

  select *
  into v_member
  from public.jam3iyya_members
  where jam3iyya_id = p_jam3iyya_id
    and user_id = p_user_id
  for update;

  select wallet_balance
  into v_wallet_balance
  from public.profiles
  where id = p_user_id
  for update;

  if coalesce(v_wallet_balance, 0) < coalesce(v_circle.monthly_amount, 0) then
    return jsonb_build_object(
      'success', false,
      'jam3iyya_id', p_jam3iyya_id,
      'user_id', p_user_id,
      'month', p_month_number,
      'status', 'late',
      'amount', round(coalesce(v_circle.monthly_amount, 0), 2),
      'insurance_contribution', 0,
      'errors', array['Insufficient wallet balance']
    );
  end if;

  v_insurance_contribution := round((coalesce(v_circle.monthly_amount, 0) * coalesce(v_circle.insurance_percentage, 0)) / 100, 2);
  v_net_contribution := round(coalesce(v_circle.monthly_amount, 0) - v_insurance_contribution, 2);

  update public.profiles
  set wallet_balance = round(wallet_balance - coalesce(v_circle.monthly_amount, 0), 2)
  where id = p_user_id
  returning wallet_balance into v_new_balance;

  update public.payments
  set status = 'paid',
      paid_date = now()
  where id = v_payment.id;

  update public.jam3iyyas
  set insurance_pool = round(coalesce(insurance_pool, 0) + v_insurance_contribution, 2)
  where id = p_jam3iyya_id
  returning insurance_pool into v_new_insurance_pool;

  update public.jam3iyya_members
  set total_paid = round(coalesce(total_paid, 0) + coalesce(v_circle.monthly_amount, 0), 2)
  where id = v_member.id;

  insert into public.transactions (from_user_id, amount, type, jam3iyya_id, description)
  values (p_user_id, v_net_contribution, 'contribution', p_jam3iyya_id, 'Manual payment contribution');

  insert into public.transactions (from_user_id, amount, type, jam3iyya_id, description)
  values (p_user_id, v_insurance_contribution, 'insurance_contribution', p_jam3iyya_id, 'Manual payment insurance contribution');

  perform public.update_trust_score_if_available(p_user_id, -5, 'Late payment cleared manually');

  insert into public.notifications (user_id, title, message, type, related_jam3iyya_id)
  values (p_user_id, 'Payment received', format('Your payment for month %s was processed', p_month_number), 'payment_processed', p_jam3iyya_id);

  return jsonb_build_object(
    'success', true,
    'jam3iyya_id', p_jam3iyya_id,
    'user_id', p_user_id,
    'month', p_month_number,
    'status', 'paid',
    'amount', round(coalesce(v_circle.monthly_amount, 0), 2),
    'insurance_contribution', v_insurance_contribution,
    'wallet_balance_after', v_new_balance,
    'insurance_pool_after', v_new_insurance_pool,
    'errors', array[]::text[]
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'jam3iyya_id', p_jam3iyya_id,
      'user_id', p_user_id,
      'month', p_month_number,
      'status', 'late',
      'amount', 0,
      'insurance_contribution', 0,
      'errors', array[sqlerrm]
    );
end;
$$;

create or replace function public.handle_default_payment(
  p_user_id uuid,
  p_jam3iyya_id uuid,
  p_month_number integer
)
returns jsonb
language plpgsql
as $$
declare
  v_payment record;
  v_circle record;
  v_member record;
  v_turn_holder_id uuid;
  v_turn_holder_name text;
  v_amount numeric(10,2);
  v_new_insurance_pool numeric(10,2);
  v_covered boolean := false;
begin
  select *
  into v_payment
  from public.payments
  where jam3iyya_id = p_jam3iyya_id
    and user_id = p_user_id
    and month_number = p_month_number
  for update;

  if not found or v_payment.status <> 'late' then
    return jsonb_build_object(
      'success', false,
      'jam3iyya_id', p_jam3iyya_id,
      'user_id', p_user_id,
      'month', p_month_number,
      'covered', false,
      'insurance_remaining', 0,
      'errors', array['Late payment not found']
    );
  end if;

  select *
  into v_circle
  from public.jam3iyyas
  where id = p_jam3iyya_id
  for update;

  select *
  into v_member
  from public.jam3iyya_members
  where jam3iyya_id = p_jam3iyya_id
    and user_id = p_user_id
  for update;

  select jm.user_id, p.full_name
  into v_turn_holder_id, v_turn_holder_name
  from public.jam3iyya_members jm
  join public.profiles p on p.id = jm.user_id
  where jm.jam3iyya_id = p_jam3iyya_id
    and jm.turn_number = p_month_number
  order by jm.joined_at
  limit 1;

  v_amount := round(coalesce(v_circle.monthly_amount, 0), 2);

  update public.payments
  set status = 'defaulted'
  where id = v_payment.id;

  update public.jam3iyya_members
  set status = 'defaulted'
  where id = v_member.id;

  if coalesce(v_circle.insurance_pool, 0) >= v_amount then
    update public.jam3iyyas
    set insurance_pool = round(coalesce(insurance_pool, 0) - v_amount, 2)
    where id = p_jam3iyya_id
    returning insurance_pool into v_new_insurance_pool;

    if found and v_turn_holder_id is not null then
      update public.profiles
      set wallet_balance = round(wallet_balance + v_amount, 2)
      where id = v_turn_holder_id;

      insert into public.transactions (from_user_id, to_user_id, amount, type, jam3iyya_id, description)
      values (null, v_turn_holder_id, v_amount, 'insurance_payout', p_jam3iyya_id, 'Insurance coverage for default');
    end if;

    v_covered := true;
  else
    v_new_insurance_pool := coalesce(v_circle.insurance_pool, 0);
  end if;

  perform public.update_trust_score_if_available(p_user_id, -100, 'Payment default');

  insert into public.notifications (user_id, title, message, type, related_jam3iyya_id)
  select jm.user_id, 'Default recorded', format('A member defaulted for month %s', p_month_number), 'default', p_jam3iyya_id
  from public.jam3iyya_members jm
  where jm.jam3iyya_id = p_jam3iyya_id;

  return jsonb_build_object(
    'success', true,
    'jam3iyya_id', p_jam3iyya_id,
    'user_id', p_user_id,
    'month', p_month_number,
    'covered', v_covered,
    'insurance_remaining', coalesce(v_new_insurance_pool, coalesce(v_circle.insurance_pool, 0)),
    'errors', array[]::text[]
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'jam3iyya_id', p_jam3iyya_id,
      'user_id', p_user_id,
      'month', p_month_number,
      'covered', false,
      'insurance_remaining', coalesce((select insurance_pool from public.jam3iyyas where id = p_jam3iyya_id), 0),
      'errors', array[sqlerrm]
    );
end;
$$;
