create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  jam3iyya_id uuid references public.jam3iyyas(id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_chat_messages enable row level security;

create policy "Users can view their own chat messages"
  on public.ai_chat_messages
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
  on public.ai_chat_messages
  for insert
  with check (auth.uid() = user_id);
