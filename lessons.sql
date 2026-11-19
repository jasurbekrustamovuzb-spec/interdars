-- InterDars: testlarni bulutda saqlash va hammaga ulashish.
-- Supabase → SQL Editor'da BIR MARTA ishga tushiring.

create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  owner_name  text,
  code        text not null unique check (code ~ '^[0-9]{6}$'),
  title       text not null check (char_length(title) between 1 and 180),
  sub         text,
  method      text not null check (method in ('quiz','team','mill','memory','cross','live')),
  cls         text,
  payload     jsonb not null check (pg_column_size(payload) < 600000),
  is_public   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists lessons_owner_idx  on public.lessons (owner_id, created_at desc);
create index if not exists lessons_public_idx on public.lessons (created_at desc) where is_public;

create or replace function public.lessons_touch()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists lessons_touch on public.lessons;
create trigger lessons_touch before update on public.lessons
  for each row execute function public.lessons_touch();

alter table public.lessons enable row level security;

-- Kirgan foydalanuvchi: ommaviy testlarni va o'zinikini ko'radi
drop policy if exists lessons_read on public.lessons;
create policy lessons_read on public.lessons for select to authenticated
  using (is_public or owner_id = (select auth.uid()));

-- Faqat o'z nomidan yaratadi, o'zgartiradi, o'chiradi
drop policy if exists lessons_insert on public.lessons;
create policy lessons_insert on public.lessons for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists lessons_update on public.lessons;
create policy lessons_update on public.lessons for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists lessons_delete on public.lessons;
create policy lessons_delete on public.lessons for delete to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.lessons from anon;
grant select, insert, update, delete on public.lessons to authenticated;
