-- Add current_month to jam3iyyas table
alter table public.jam3iyyas
  add column if not exists current_month integer default 0;
