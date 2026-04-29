create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text unique,
  national_id_hash text,
  profile_image_url text,
  trust_score integer default 100 check (trust_score >= 0 and trust_score <= 1000),
  tier text default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  verification_status text default 'unverified' check (verification_status in ('unverified', 'pending', 'verified')),
  wallet_balance numeric(10,2) default 5000.00,
  preferred_language text default 'ar' check (preferred_language in ('ar', 'en')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.jam3iyyas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text not null check (type in ('private', 'semi_public', 'public')),
  monthly_amount numeric(10,2) not null,
  total_members integer not null check (total_members between 3 and 20),
  duration_months integer not null,
  start_date date not null,
  status text default 'recruiting' check (status in ('recruiting', 'active', 'completed', 'cancelled')),
  creator_id uuid references public.profiles (id) on delete cascade,
  min_trust_score integer default 100,
  insurance_percentage numeric(4,2) default 1.50,
  insurance_pool numeric(10,2) default 0.00,
  turn_allocation_method text default 'lottery' check (turn_allocation_method in ('lottery', 'auction', 'first_come', 'manual')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.jam3iyya_members (
  id uuid primary key default gen_random_uuid(),
  jam3iyya_id uuid references public.jam3iyyas (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  turn_number integer,
  joined_at timestamptz default now(),
  status text default 'active' check (status in ('active', 'defaulted', 'completed', 'left')),
  total_paid numeric(10,2) default 0.00,
  has_received boolean default false,
  received_at timestamptz,
  unique (jam3iyya_id, user_id),
  unique (jam3iyya_id, turn_number)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  jam3iyya_id uuid references public.jam3iyyas (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  amount numeric(10,2) not null,
  month_number integer not null,
  status text default 'pending' check (status in ('pending', 'paid', 'late', 'defaulted', 'covered_by_insurance')),
  due_date date not null,
  paid_date timestamptz,
  payment_method text default 'wallet',
  created_at timestamptz default now()
);

create table if not exists public.trust_score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  score_change integer not null,
  reason text not null,
  new_total_score integer not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references public.profiles (id),
  to_user_id uuid references public.profiles (id),
  amount numeric(10,2) not null,
  type text not null check (type in ('contribution', 'payout', 'insurance_contribution', 'insurance_payout', 'deposit', 'withdrawal')),
  jam3iyya_id uuid references public.jam3iyyas (id),
  description text,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  is_read boolean default false,
  related_jam3iyya_id uuid references public.jam3iyyas (id),
  created_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_jam3iyyas_updated_at on public.jam3iyyas;
create trigger set_jam3iyyas_updated_at
before update on public.jam3iyyas
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.jam3iyyas enable row level security;
alter table public.jam3iyya_members enable row level security;
alter table public.payments enable row level security;
alter table public.trust_score_history enable row level security;
alter table public.transactions enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

-- Break infinite recursion by using a security definer function for membership checks
create or replace function public.is_jam3iyya_member(check_jam3iyya_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from jam3iyya_members
    where jam3iyya_id = check_jam3iyya_id and user_id = auth.uid()
  );
$$;

drop policy if exists "jam3iyyas_select_public_or_member" on public.jam3iyyas;
create policy "jam3iyyas_select_public_or_member"
on public.jam3iyyas
for select
using (
  type = 'public'
  or creator_id = auth.uid()
  or public.is_jam3iyya_member(id)
);

drop policy if exists "jam3iyyas_insert_creator" on public.jam3iyyas;
create policy "jam3iyyas_insert_creator"
on public.jam3iyyas
for insert
with check (creator_id = auth.uid());

drop policy if exists "jam3iyyas_update_creator" on public.jam3iyyas;
create policy "jam3iyyas_update_creator"
on public.jam3iyyas
for update
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

drop policy if exists "jam3iyya_members_select_self_or_creator" on public.jam3iyya_members;
drop policy if exists "jam3iyya_members_select" on public.jam3iyya_members;
create policy "jam3iyya_members_select"
on public.jam3iyya_members
for select
using (
  user_id = auth.uid()
  or public.is_jam3iyya_member(jam3iyya_id)
);

create policy "jam3iyya_members_insert_self"
on public.jam3iyya_members
for insert
with check (user_id = auth.uid());

create policy "payments_select_self_or_creator"
on public.payments
for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.jam3iyyas j
    where j.id = jam3iyya_id and j.creator_id = auth.uid()
  )
);

create policy "payments_insert_self"
on public.payments
for insert
with check (user_id = auth.uid());

create policy "trust_score_history_select_own"
on public.trust_score_history
for select
using (user_id = auth.uid());

create policy "transactions_select_participant"
on public.transactions
for select
using (
  from_user_id = auth.uid()
  or to_user_id = auth.uid()
  or exists (
    select 1 from public.jam3iyyas j
    where j.id = jam3iyya_id and j.creator_id = auth.uid()
  )
);

create policy "notifications_select_own"
on public.notifications
for select
using (user_id = auth.uid());

create policy "notifications_update_own"
on public.notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());