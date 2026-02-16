-- Execute in Supabase SQL editor

create table if not exists public.user_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id bigint not null,
  pick_team_id bigint not null,
  team_a_id bigint,
  team_b_id bigint,
  score_a int,
  score_b int,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table public.user_picks enable row level security;

drop policy if exists "user_picks_select_own" on public.user_picks;
create policy "user_picks_select_own"
on public.user_picks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_picks_insert_own" on public.user_picks;
create policy "user_picks_insert_own"
on public.user_picks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_picks_update_own" on public.user_picks;
create policy "user_picks_update_own"
on public.user_picks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists user_picks_match_id_idx on public.user_picks(match_id);
create index if not exists user_picks_user_id_idx on public.user_picks(user_id);
