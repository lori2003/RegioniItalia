create table if not exists public.game_progress (
  player_name text primary key,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint game_progress_lorenzo_only check (player_name = 'Lorenzo')
);

alter table public.game_progress enable row level security;

create or replace function public.set_game_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_game_progress_updated_at on public.game_progress;

create trigger set_game_progress_updated_at
before update on public.game_progress
for each row
execute function public.set_game_progress_updated_at();

drop policy if exists "Lorenzo can read progress" on public.game_progress;
drop policy if exists "Lorenzo can insert progress" on public.game_progress;
drop policy if exists "Lorenzo can update progress" on public.game_progress;

create policy "Lorenzo can read progress"
on public.game_progress
for select
to anon
using (player_name = 'Lorenzo');

create policy "Lorenzo can insert progress"
on public.game_progress
for insert
to anon
with check (player_name = 'Lorenzo');

create policy "Lorenzo can update progress"
on public.game_progress
for update
to anon
using (player_name = 'Lorenzo')
with check (player_name = 'Lorenzo');
