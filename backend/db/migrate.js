// Brings the database up to date, as the database owner:
//   1. db/schema.sql, the idempotent baseline (tables, views, the append-only audit trigger)
//   2. each file in db/migrations once, in name order, inside a transaction, recorded in schema_migrations
//   3. the application role (DB_APP_USER, default incentive_app, password DB_APP_PASSWORD) with data rights only:
//      it reads and writes rows but cannot change the schema, drop the audit trigger, or edit or delete audit rows
// Connection: MIGRATE_DATABASE_URL (the owner), else DATABASE_URL. docker-compose runs this as a one-shot service so
// the long-running app never holds the owner's password. `npm run migrate` runs it by hand.
const fs = require('fs'), path = require('path');
const { Pool } = require('pg');

const LOCK = 727401; // one migrator at a time
const lit = s => "'" + String(s).replace(/'/g, "''") + "'";

async function migrate(opts = {}) {
  const url = opts.url || process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: url, max: 1 });
  const c = await pool.connect(), applied = [];
  try {
    await c.query('select pg_advisory_lock($1)', [LOCK]);
    await c.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    await c.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
    const done = new Set((await c.query('select name from schema_migrations')).rows.map(r => r.name));
    const dir = path.join(__dirname, 'migrations');
    for (const f of fs.readdirSync(dir).filter(f => /^\d{3}_[\w-]+\.sql$/.test(f)).sort()) {
      if (done.has(f)) continue;
      await c.query('begin');
      try { await c.query(fs.readFileSync(path.join(dir, f), 'utf8')); await c.query('insert into schema_migrations(name) values($1)', [f]); await c.query('commit'); applied.push(f); }
      catch (e) { await c.query('rollback'); throw new Error(`migration ${f} failed: ${e.message}`); }
    }
    const app = process.env.DB_APP_USER || 'incentive_app', pw = process.env.DB_APP_PASSWORD;
    if (pw) {
      if (!/^[a-z_][a-z0-9_]{0,40}$/.test(app)) throw new Error('DB_APP_USER must be a plain lower-case name');
      const db = (await c.query('select current_database() as d')).rows[0].d;
      await c.query(`do $$ begin if not exists (select from pg_roles where rolname = ${lit(app)}) then create role ${app} login; end if; end $$`);
      await c.query(`alter role ${app} with login nosuperuser nocreatedb nocreaterole password ${lit(pw)}`);
      await c.query(`grant connect on database "${db.replace(/"/g, '""')}" to ${app}`);
      await c.query(`grant usage on schema public to ${app}`);
      await c.query(`grant select, insert, update, delete on all tables in schema public to ${app}`);
      await c.query(`grant usage, select on all sequences in schema public to ${app}`);
      await c.query(`revoke update, delete, truncate on audit_events from ${app}`);   // append-only, also for the app
      await c.query(`revoke insert, update, delete, truncate on schema_migrations from ${app}`);
    } else if (url === process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
      console.warn('DB_APP_PASSWORD is not set: the app connects as the database owner');
    }
  } finally {
    await c.query('select pg_advisory_unlock($1)', [LOCK]).catch(() => {});
    c.release(); await pool.end();
  }
  return applied;
}
module.exports = migrate;
if (require.main === module) migrate().then(a => { console.log('schema applied' + (a.length ? '; migrations: ' + a.join(', ') : '; no pending migrations')); process.exit(0); }, e => { console.error(e.message || e); process.exit(1); });
