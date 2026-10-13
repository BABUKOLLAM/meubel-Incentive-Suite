-- Every report, statement and export the board issues: its ID, fingerprint and a short summary, so the QR code on the
-- document can be checked at /verify/<id>. Rows are never edited; the app role may insert and read.
create table if not exists issued_docs (
  id         text primary key,
  kind       text not null,
  title      text not null,
  hash       text not null,
  summary    jsonb,
  issued_by  text not null,
  issued_at  timestamptz not null default now()
);
create index if not exists issued_docs_at on issued_docs (issued_at);
