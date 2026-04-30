-- Fix RLS policy on trust_score_history to allow server-side inserts
-- The previous policy was too restrictive and blocked writes from API routes

-- Drop old policies if they exist
drop policy if exists "Users can insert their own trust score history" on public.trust_score_history;
drop policy if exists "Users can view their own trust score history" on public.trust_score_history;

-- Re-enable RLS (idempotent)
alter table public.trust_score_history enable row level security;

-- Allow users to SELECT their own history
create policy "Users can view their own trust score history"
  on public.trust_score_history
  for select
  using (auth.uid() = user_id);

-- Allow INSERT for own records (needed by API routes running as the authed user)
create policy "Users can insert their own trust score history"
  on public.trust_score_history
  for insert
  with check (auth.uid() = user_id);
