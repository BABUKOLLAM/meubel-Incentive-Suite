-- Sign-out ends every session of that person: the session cookie carries the epoch it was issued in
alter table profiles add column if not exists session_epoch integer not null default 0;
