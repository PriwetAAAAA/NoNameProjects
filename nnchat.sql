-- ============================================================
-- NoName Chatter — схема БД
-- Выполни ОДИН РАЗ в Supabase: SQL Editor → New query → вставь → Run
-- ============================================================

-- Заявки в друзья
create table if not exists friend_requests (
  id bigserial primary key,
  from_id   text not null,
  from_name text,
  to_id     text not null,
  status    text not null default 'pending',   -- pending | accepted | rejected
  created_at timestamptz default now()
);

-- Дружба (каждая строка = пара a_id/b_id, a_id < b_id)
create table if not exists friendships (
  id bigserial primary key,
  a_id text not null,
  b_id text not null,
  a_name text,
  b_name text,
  created_at timestamptz default now(),
  unique(a_id, b_id)
);

-- Личные сообщения
create table if not exists dm_messages (
  id bigserial primary key,
  conv        text not null,     -- 'idA|idB' (по возрастанию)
  sender_id   text not null,
  sender_name text,
  content     text not null,
  created_at  timestamptz default now()
);

-- Почта: коды подтверждения (4 цифры)
create table if not exists email_codes (
  id bigserial primary key,
  owner_id  text,
  email     text not null,
  code      text not null,
  purpose   text default 'link',   -- link | login
  expires_at timestamptz not null,
  used      boolean default false,
  created_at timestamptz default now()
);

-- Realtime (если уже добавлено — эти строки можно проигнорировать)
alter publication supabase_realtime add table friend_requests;
alter publication supabase_realtime add table friendships;
alter publication supabase_realtime add table dm_messages;

-- Открытые политики (для демо; можно ужесточить позже)
alter table friend_requests enable row level security;
alter table friendships   enable row level security;
alter table dm_messages   enable row level security;
alter table email_codes   enable row level security;

create policy "fr_all" on friend_requests for all using (true) with check (true);
create policy "fs_all" on friendships     for all using (true) with check (true);
create policy "dm_all" on dm_messages     for all using (true) with check (true);
create policy "ec_all" on email_codes     for all using (true) with check (true);
