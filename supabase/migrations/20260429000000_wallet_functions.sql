-- Add safety check constraint to prevent negative balances
alter table public.profiles
  add constraint positive_balance check (wallet_balance >= 0);

-- RPC for securely depositing funds and recording the transaction atomically
create or replace function wallet_deposit(p_user_id uuid, p_amount numeric)
returns table(new_balance numeric, transaction_id uuid) as $$
declare
  v_tx_id uuid;
begin
  -- Insert transaction first
  insert into public.transactions (to_user_id, amount, type, description)
  values (p_user_id, p_amount, 'deposit', 'Wallet deposit')
  returning id into v_tx_id;

  -- Update balance
  update public.profiles
  set wallet_balance = wallet_balance + p_amount
  where id = p_user_id;

  return query
  select wallet_balance, v_tx_id
  from public.profiles where id = p_user_id;
end;
$$ language plpgsql security definer;

-- RPC for securely withdrawing funds and recording the transaction atomically
create or replace function wallet_withdraw(p_user_id uuid, p_amount numeric)
returns table(new_balance numeric, transaction_id uuid) as $$
declare
  v_tx_id uuid;
begin
  -- Insert transaction first
  insert into public.transactions (from_user_id, amount, type, description)
  values (p_user_id, p_amount, 'withdrawal', 'Wallet withdrawal')
  returning id into v_tx_id;

  -- Update balance (the CHECK constraint will prevent this if balance goes < 0)
  update public.profiles
  set wallet_balance = wallet_balance - p_amount
  where id = p_user_id;

  return query
  select wallet_balance, v_tx_id
  from public.profiles where id = p_user_id;
end;
$$ language plpgsql security definer;
