drop policy if exists "profiles_select_same_circle_member" on public.profiles;

create policy "profiles_select_same_circle_member"
on public.profiles
for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.jam3iyya_members self_member
    join public.jam3iyya_members target_member
      on self_member.jam3iyya_id = target_member.jam3iyya_id
    where self_member.user_id = auth.uid()
      and target_member.user_id = profiles.id
  )
);
