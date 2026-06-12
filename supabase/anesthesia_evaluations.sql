-- Ejecutar en Supabase SQL Editor.
-- Guarda evaluaciones preanestesicas por usuario autenticado.

create extension if not exists pgcrypto;

create table if not exists public.anesthesia_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_key text not null,
  patient_name text not null default '',
  hcn text not null default '',
  evaluation_date date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anesthesia_evaluations_user_record_key unique (user_id, record_key)
);

create index if not exists anesthesia_evaluations_user_updated_idx
  on public.anesthesia_evaluations (user_id, updated_at desc);

create index if not exists anesthesia_evaluations_user_patient_idx
  on public.anesthesia_evaluations (user_id, lower(patient_name));

create index if not exists anesthesia_evaluations_user_hcn_idx
  on public.anesthesia_evaluations (user_id, lower(hcn));

create or replace function public.set_anesthesia_evaluations_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_anesthesia_evaluations_updated_at on public.anesthesia_evaluations;

create trigger set_anesthesia_evaluations_updated_at
before update on public.anesthesia_evaluations
for each row
execute function public.set_anesthesia_evaluations_updated_at();

alter table public.anesthesia_evaluations enable row level security;
alter table public.anesthesia_evaluations force row level security;

revoke all on table public.anesthesia_evaluations from public;
revoke all on table public.anesthesia_evaluations from anon;

drop policy if exists "Users can read their own anesthesia evaluations" on public.anesthesia_evaluations;
drop policy if exists "Users can insert their own anesthesia evaluations" on public.anesthesia_evaluations;
drop policy if exists "Users can update their own anesthesia evaluations" on public.anesthesia_evaluations;
drop policy if exists "Users can delete their own anesthesia evaluations" on public.anesthesia_evaluations;

create policy "Users can read their own anesthesia evaluations"
on public.anesthesia_evaluations
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own anesthesia evaluations"
on public.anesthesia_evaluations
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own anesthesia evaluations"
on public.anesthesia_evaluations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own anesthesia evaluations"
on public.anesthesia_evaluations
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.anesthesia_evaluations to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.anesthesia_evaluations;
  end if;
exception
  when duplicate_object then null;
end $$;
