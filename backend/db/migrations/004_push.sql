-- Phones and browsers that asked for update notifications (Web Push), and small server facts such as the VAPID key
-- pair and the last release announced
create table if not exists push_subscriptions (
  endpoint   text primary key,
  email      text not null,
  keys       jsonb not null,
  created_at timestamptz not null default now(),
  last_ok    timestamptz
);
create table if not exists app_meta (
  key   text primary key,
  value text not null
);
