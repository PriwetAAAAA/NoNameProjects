-- ============================================================
-- NoName Chatter v2 — дополнение к схеме
-- Выполни ОДИН РАЗ в Supabase: SQL Editor → New query → Run
-- (можно поверх старого, не ломает)
-- ============================================================

-- Публичные профили (имя/аватар/почта для 2FA) — пароль сюда НЕ пишем
create table if not exists profiles (
  id text primary key,
  name text,
  avatar text,
  email text,
  last_seen timestamptz default now()
);

-- если таблица profiles уже создана без email — добавим колонку
alter table profiles add column if not exists email text;

-- Группы
create table if not exists groups (
  id bigserial primary key,
  name text not null,
  owner_id text not null,
  created_at timestamptz default now()
);

-- Участники групп
create table if not exists group_members (
  id bigserial primary key,
  group_id bigint not null,
  user_id text not null,
  user_name text,
  created_at timestamptz default now(),
  unique(group_id, user_id)
);

do $$ begin alter publication supabase_realtime add table groups;        exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table group_members; exception when others then null; end $$;

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;

drop policy if exists "prof_all" on profiles;
drop policy if exists "grp_all"  on groups;
drop policy if exists "gm_all"   on group_members;

create policy "prof_all" on profiles for all using (true) with check (true);
create policy "grp_all"  on groups   for all using (true) with check (true);
create policy "gm_all"   on group_members for all using (true) with check (true);


-- ===== Storage for chat files =====
insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', true)
on conflict (id) do nothing;

drop policy if exists "chatfiles read" on storage.objects;
create policy "chatfiles read" on storage.objects
  for select using (bucket_id = 'chat-files');

drop policy if exists "chatfiles insert" on storage.objects;
create policy "chatfiles insert" on storage.objects
  for insert with check (bucket_id = 'chat-files');


-- ===== push-токен для звонков =====
alter table profiles add column if not exists push_token text;


-- ===== недостающие колонки profiles =====
alter table profiles add column if not exists avatar text;
alter table profiles add column if not exists time_spent bigint default 0;


-- ===== ПОЛНЫЙ набор колонок profiles (безопасно: добавит недостающие) =====
alter table profiles add column if not exists name text;
alter table profiles add column if not exists avatar text;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists push_token text;
alter table profiles add column if not exists time_spent bigint default 0;
alter table profiles add column if not exists last_seen timestamptz default now();
