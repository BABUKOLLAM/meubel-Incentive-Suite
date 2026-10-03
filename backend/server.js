// Incentive board back end: serves the page, signs people in, keeps the shared state, answers the data inputs,
// and runs the scheduled syncs and message sends. One process; Postgres beside it; Caddy in front for TLS.
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const migrate = require('./db/migrate');
const { q } = require('./lib/db');
const auth = require('./lib/auth');
const kv = require('./lib/kv');
const sources = require('./lib/sources');

const app = express();
app.disable('x-powered-by');
app.use(cookieParser());
app.use(express.json({ limit: '4mb' }));
app.use(express.text({ type: ['text/*', 'application/octet-stream'], limit: '4mb' }));

// ---- sign-in
auth.mount(app);
const requireUser = async (req, res, next) => { const me = await auth.current(req); if (!me) return res.status(401).json({ error: 'sign in' }); req.me = me; next(); };

app.get('/api/health', async (req, res) => { try { await q('select 1'); res.json({ ok: true, time: new Date().toISOString() }); } catch (e) { res.status(500).json({ ok: false, error: e.message }); } });
app.get('/api/me', requireUser, (req, res) => res.json(req.me));

// ---- shared state
app.get('/api/kv', requireUser, async (req, res) => res.json(await kv.readAll(req.me)));
app.put('/api/kv/:key', requireUser, async (req, res) => {
  try { const value = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; await kv.write(req.me, req.params.key, value); res.json({ ok: true }); }
  catch (e) { res.status(e.status || 400).json({ error: e.message }); }
});
app.delete('/api/kv/:key', requireUser, async (req, res) => { try { await kv.remove(req.me, req.params.key); res.json({ ok: true }); } catch (e) { res.status(e.status || 400).json({ error: e.message }); } });

// ---- data inputs (the board fetches these as its link mode)
app.get('/api/source/:id', requireUser, async (req, res) => { const rows = await sources.read(req.params.id); if (!rows) return res.status(404).json({ error: 'unknown source' }); res.json(rows); });

// ---- admin: roster and profiles management (CSV or JSON body)
const requireAdmin = (req, res, next) => (['superadmin', 'admin'].includes(req.me.role) ? next() : res.status(403).json({ error: 'admin only' }));
app.get('/api/roster', requireUser, async (req, res) => res.json((await q('select * from roster order by branch,name')).rows));
app.put('/api/roster', requireUser, requireAdmin, async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : []; let n = 0;
  for (const r of rows) { await q('insert into roster(id,name,role,branch,branch_id,company,phone,email,joined,left_on) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (id) do update set name=$2,role=$3,branch=$4,branch_id=$5,company=$6,phone=$7,email=$8,joined=$9,left_on=$10', [r.id, r.name, r.role, r.branch, r.branch_id || null, r.company, r.phone || null, r.email || null, r.joined || null, r.left_on || null]); n++; }
  await q('insert into audit_events(who,action,detail) values($1,$2,$3)', [req.me.email, 'Roster updated', n + ' rows']);
  res.json({ ok: true, rows: n });
});
app.get('/api/profiles', requireUser, requireAdmin, async (req, res) => res.json((await q('select email,name,role,branch_id,person_id,phone,active from profiles order by role,email')).rows));
app.put('/api/profiles', requireUser, async (req, res) => {
  if (req.me.role !== 'superadmin') return res.status(403).json({ error: 'super admin only' });
  const rows = Array.isArray(req.body) ? req.body : [req.body]; let n = 0;
  for (const p of rows) { await q('insert into profiles(email,name,role,branch_id,person_id,phone,active) values(lower($1),$2,$3,$4,$5,$6,coalesce($7,true)) on conflict (email) do update set name=$2,role=$3,branch_id=$4,person_id=$5,phone=$6,active=coalesce($7,true)', [p.email, p.name, p.role, p.branch_id || null, p.person_id || null, p.phone || null, p.active]); n++; }
  await q('insert into audit_events(who,action,detail) values($1,$2,$3)', [req.me.email, 'Profiles updated', n + ' rows']);
  res.json({ ok: true, rows: n });
});
app.get('/api/audit', requireUser, async (req, res) => { if (!['superadmin', 'admin', 'consultant'].includes(req.me.role)) return res.status(403).json({ error: 'forbidden' }); res.json((await q('select * from audit_events order by id desc limit 1000')).rows); });
app.get('/api/jobs', requireUser, async (req, res) => { if (!['superadmin', 'admin', 'consultant'].includes(req.me.role)) return res.status(403).json({ error: 'forbidden' }); res.json({ jobs: (await q('select * from jobs_log order by id desc limit 200')).rows, messages: (await q('select * from messages_log order by id desc limit 500')).rows }); });
app.post('/api/jobs/sync', requireUser, requireAdmin, async (req, res) => { try { res.json({ report: await require('./jobs/sync').run(req.query.adapter) }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/jobs/messages/:kind', requireUser, requireAdmin, async (req, res) => { try { res.json({ sent: await require('./jobs/messages').run(req.params.kind) }); } catch (e) { res.status(500).json({ error: e.message }); } });

// ---- the page and its files
const ROOT = path.join(__dirname, '..');
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '5m' }));
app.use('/docs', express.static(path.join(ROOT, 'docs'), { maxAge: '1h' }));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

// ---- schedules (Asia/Kolkata)
function schedule() {
  const tz = { timezone: 'Asia/Kolkata' };
  const safe = (name, fn) => async () => { try { const r = await fn(); console.log(new Date().toISOString(), name, Array.isArray(r) ? r.length + ' items' : 'ok'); } catch (e) { console.error(name, e); await q('insert into jobs_log(job,status,detail) values($1,$2,$3)', [name, 'failed', e.message]).catch(() => {}); } };
  const sync = require('./jobs/sync'), msgs = require('./jobs/messages');
  cron.schedule('*/15 * * * *', safe('sync', () => sync.run()), tz);
  cron.schedule('0 21 * * *', safe('messages:daily', () => msgs.run('daily')), tz);
  cron.schedule('0 19 * * 6', safe('messages:weekly', () => msgs.run('weekly')), tz);
  cron.schedule('0 8 * * 1', safe('messages:bm-email', () => msgs.run('bm-email')), tz);
  cron.schedule('0 8 1 * *', safe('messages:monthly', () => msgs.run('monthly')), tz);
  cron.schedule('0 8 16 * *', safe('messages:md-preview', () => msgs.run('md-preview')), tz);
}

const PORT = process.env.PORT || 8080;
migrate().then(() => {
  if (process.env.JOBS !== '0') schedule();
  app.listen(PORT, () => console.log('incentive board back end on :' + PORT));
}).catch(e => { console.error('migration failed', e); process.exit(1); });
