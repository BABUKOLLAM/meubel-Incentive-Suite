-- A version number on every shared document: a save names the version it started from, and a save based on an older
-- version is refused (409) so the board can merge instead of silently overwriting another person's change
alter table kv add column if not exists version integer not null default 0;
