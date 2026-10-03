-- Meubel Grande and Royal Group incentive board: database schema (idempotent; run on every start)

-- Who may sign in and what they see. role matches the board's ROLES keys.
create table if not exists profiles (
  email       text primary key,
  name        text not null,
  role        text not null check (role in ('superadmin','admin','consultant','md','director','hr','bm','sm','employee')),
  branch_id   text,            -- board branch id (klm, ekm, ...) for bm, sm, employee
  person_id   text,            -- board person id for sm and employee
  phone       text,            -- E.164, for WhatsApp
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Shared board state: one JSON document per key (mr-cfg, mr-policy, mr-adj, mr-wire, mr-close, mr-audit, mr-hist, mr-users, mr-src)
create table if not exists kv (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- Append-only record of every change: nobody can edit or delete a row
create table if not exists audit_events (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  who     text not null,
  action  text not null,
  detail  text,
  key     text
);
create or replace function audit_events_readonly() returns trigger language plpgsql as $$
begin raise exception 'audit_events is append-only'; end $$;
drop trigger if exists audit_events_no_update on audit_events;
create trigger audit_events_no_update before update or delete on audit_events for each row execute function audit_events_readonly();

-- Roster: the people the board scores. id must match the person ids used in data rows (or the name, which the board also matches).
create table if not exists roster (
  id       text primary key,
  name     text not null,
  role     text not null check (role in ('Sales','CRE','Logistics','Back office','BM','SM')),
  branch   text not null,      -- branch name as the board shows it (Kollam, Kochi, ...)
  branch_id text,              -- board branch id
  company  text not null,
  phone    text,
  email    text,
  joined   date,
  left_on  date
);

-- Data feeds: one table per board data input, keyed by month 'YYYY-MM'. Columns are exactly the board's CSV columns.
create table if not exists src_targets      (month text, employee text, target numeric, loaded_at timestamptz default now());
create table if not exists src_orders       (month text, employee text, order_no text, day int, item text, list_price numeric, discount_pct numeric, status text, deliver_day int, pay_day int, cancel_day int, margin_pct numeric, upsell int, cross_sell int, review int, commitment_ok int, cre text, offer int, reason text, loaded_at timestamptz default now());
create table if not exists src_customers    (month text, employee text, day int, count int, loaded_at timestamptz default now());
create table if not exists src_attendance   (month text, employee text, day int, status text, loaded_at timestamptz default now());
create table if not exists src_walkins      (month text, branch text, day int, count int, cre text, loaded_at timestamptz default now());
create table if not exists src_followups    (month text, cre text, day int, on_time int, communicated int, loaded_at timestamptz default now());
create table if not exists src_deliveries   (month text, employee text, day int, on_time int, damage_free int, communicated int, loaded_at timestamptz default now());
create table if not exists src_collections  (month text, employee text, day int, on_time int, loaded_at timestamptz default now());
create table if not exists src_documents    (month text, employee text, day int, ok int, loaded_at timestamptz default now());
create table if not exists src_calls        (month text, employee text, day int, on_time int, loaded_at timestamptz default now());
create table if not exists src_branch       (month text, branch text, audit_score numeric, neatness numeric, google_rating numeric, last_month_discount numeric, loaded_at timestamptz default now());
create table if not exists src_activities   (month text, branch text, employee text, day int, name text, done int, loaded_at timestamptz default now());
create table if not exists src_appreciations(month text, employee text, day int, loaded_at timestamptz default now());
create table if not exists src_grooming     (month text, employee text, grooming numeric, neatness numeric, loaded_at timestamptz default now());

create index if not exists src_orders_month on src_orders(month);
create index if not exists src_attendance_month on src_attendance(month);

-- Current month in India
create or replace function board_month() returns text language sql stable as $$
  select to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM') $$;

-- Views the board reads: exactly the CSV columns, current month only
create or replace view v_targets       as select employee, target from src_targets where month = board_month();
create or replace view v_orders        as select employee, order_no, day, item, list_price, discount_pct, status, deliver_day, pay_day, cancel_day, margin_pct, upsell, cross_sell as cross, review, commitment_ok, cre, offer, reason from src_orders where month = board_month();
create or replace view v_customers     as select employee, day, count from src_customers where month = board_month();
create or replace view v_attendance    as select employee, day, status from src_attendance where month = board_month();
create or replace view v_walkins       as select branch, day, count, cre from src_walkins where month = board_month();
create or replace view v_followups     as select cre, day, on_time, communicated from src_followups where month = board_month();
create or replace view v_deliveries    as select employee, day, on_time, damage_free, communicated from src_deliveries where month = board_month();
create or replace view v_collections   as select employee, day, on_time from src_collections where month = board_month();
create or replace view v_documents     as select employee, day, ok from src_documents where month = board_month();
create or replace view v_calls         as select employee, day, on_time from src_calls where month = board_month();
create or replace view v_branch        as select branch, audit_score, neatness, google_rating, last_month_discount from src_branch where month = board_month();
create or replace view v_activities    as select branch, employee, day, name, done from src_activities where month = board_month();
create or replace view v_appreciations as select employee, day from src_appreciations where month = board_month();
create or replace view v_grooming      as select employee, grooming, neatness from src_grooming where month = board_month();

-- What was sent, to whom, with what result
create table if not exists messages_log (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  cadence     text, audience text, channel text,
  recipient   text, subject text,
  status      text, provider_id text, error text
);
create table if not exists jobs_log (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  job     text not null, status text not null, detail text
);
