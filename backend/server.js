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
const docs = require('./lib/docs');
const push = require('./lib/push');
const fs = require('fs'), crypto = require('crypto');

// The build: a fingerprint of the files a browser loads, so a phone can tell that a new version is on the server
const BUILD = crypto.createHash('sha256').update(['../index.html', 'public/remote.js', 'public/sw.js'].map(f => { try { return fs.readFileSync(path.join(__dirname, f)); } catch (_) { return ''; } }).join('|')).digest('hex').slice(0, 12);
const RELEASE = (() => { try { return (fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').match(/const BOARD_RELEASE='([^']+)'/) || [])[1] || '—'; } catch (_) { return '—'; } })();
const NOTES = (() => { try { return fs.readFileSync(path.join(__dirname, '..', 'deploy', 'RELEASE.md'), 'utf8').split('\n').find(l => l.trim() && !l.startsWith('#')).trim().slice(0, 180); } catch (_) { return ''; } })();

const app = express();
// Express 4 does not catch a rejected async handler: wrap every route so a database error answers 500 instead of
// taking the process down
for (const m of ['get', 'put', 'post', 'delete']) {
  const orig = app[m].bind(app);
  app[m] = (route, ...hs) => (typeof route === 'string' && hs.length ? orig(route, ...hs.map(h => (req, res, next) => { try { const r = h(req, res, next); if (r && r.catch) r.catch(next); } catch (e) { next(e); } })) : orig(route, ...hs));
}
app.disable('x-powered-by');
app.set('trust proxy', 1); // Caddy in front: the client address comes from X-Forwarded-For
app.use(cookieParser());

// ---- abuse limits: a fixed window per client address, in memory (one process)
function limiter(windowMs, max, name) {
  const hits = new Map(); setInterval(() => hits.clear(), windowMs).unref();
  return (req, res, next) => {
    const k = name + '|' + req.ip, n = (hits.get(k) || 0) + 1; hits.set(k, n);
    if (n > max) { res.set('Retry-After', String(Math.ceil(windowMs / 1000))); return res.status(429).json({ error: 'too many requests, try again shortly' }); }
    next();
  };
}
app.use('/api/auth', limiter(60 * 1000, Number(process.env.RATE_AUTH_PER_MIN || 30), 'auth'));
app.use('/api/jobs', (req, res, next) => (req.method === 'POST' ? limiter(60 * 1000, 6, 'jobs')(req, res, next) : next()));
app.use('/api', limiter(60 * 1000, Number(process.env.RATE_API_PER_MIN || 600), 'api'));

// ---- a state-changing request must come from the board's own pages (cookies are SameSite=Lax as a second wall)
const ORIGIN = (() => { try { return new URL(process.env.BASE_URL || 'http://localhost:8080').origin; } catch (_) { return null; } })();
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const o = req.get('origin'); if (!o || !ORIGIN || o === ORIGIN) return next();
  res.status(403).json({ error: 'cross-site request refused' });
});
app.use(express.json({ limit: '4mb' }));
app.use(express.text({ type: ['text/*', 'application/octet-stream'], limit: '4mb' }));

// ---- sign-in
auth.mount(app);
const requireUser = async (req, res, next) => { const me = await auth.current(req); if (!me) return res.status(401).json({ error: 'sign in' }); req.me = me; next(); };

app.get('/api/version', (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ build: BUILD, release: RELEASE, notes: NOTES }); });
app.get('/api/health', async (req, res) => { try { await q('select 1'); res.json({ ok: true, time: new Date().toISOString() }); } catch (e) { console.error('health', e.message); res.status(500).json({ ok: false }); } });
app.get('/api/me', requireUser, (req, res) => res.json(req.me));

// ---- shared state
app.get('/api/kv', requireUser, async (req, res) => res.json(await kv.readAll(req.me, req.query.v === '1')));
app.get('/api/kv-versions', requireUser, async (req, res) => res.json(await kv.versions()));
app.put('/api/kv/:key', requireUser, async (req, res) => {
  try {
    const value = typeof req.body === 'string' ? JSON.parse(req.body) : req.body, im = req.get('if-match');
    const version = await kv.write(req.me, req.params.key, value, im != null && /^\d+$/.test(im) ? Number(im) : null);
    res.json({ ok: true, version });
  } catch (e) { if (e.status === 409) return res.status(409).json({ error: 'conflict', ...e.current }); res.status(e.status || 400).json({ error: e.message }); }
});
app.delete('/api/kv/:key', requireUser, async (req, res) => { try { await kv.remove(req.me, req.params.key); res.json({ ok: true }); } catch (e) { res.status(e.status || 400).json({ error: e.message }); } });

// ---- data inputs (the board fetches these as its link mode)
// Client roles (BM, SM, employee) receive their own branch only: the rows naming its people or the branch itself
const WIDE = ['superadmin', 'admin', 'consultant', 'md', 'director', 'hr'];
async function branchScope(me) {
  if (WIDE.includes(me.role)) return null;
  const r = (await q('select id, name, branch from roster where branch_id=$1', [me.branch_id || ''])).rows;
  return { ids: new Set(r.map(x => x.id)), names: new Set(r.map(x => x.name)), branches: new Set([...r.map(x => x.branch), me.branch_id].filter(Boolean)) };
}
const rowInScope = (s, row) => ['employee', 'cre'].some(k => row[k] != null && row[k] !== '' && (s.ids.has(String(row[k])) || s.names.has(String(row[k])))) || (row.branch != null && s.branches.has(String(row.branch)));
app.get('/api/source/:id', requireUser, async (req, res) => {
  const rows = await sources.read(req.params.id); if (!rows) return res.status(404).json({ error: 'unknown source' });
  const s = await branchScope(req.me); res.json(s ? rows.filter(r => rowInScope(s, r)) : rows);
});

// ---- admin: roster and profiles management (CSV or JSON body)
const requireAdmin = (req, res, next) => (['superadmin', 'admin'].includes(req.me.role) ? next() : res.status(403).json({ error: 'admin only' }));
app.get('/api/roster', requireUser, async (req, res) => { // contact details only for administrators
  const admin = ['superadmin', 'admin'].includes(req.me.role);
  const cols = admin ? '*' : "id,name,role,branch,branch_id,company,to_char(joined,'YYYY-MM-DD') as joined,to_char(left_on,'YYYY-MM-DD') as left_on";
  if (!WIDE.includes(req.me.role)) return res.json((await q(`select ${cols} from roster where branch_id=$1 order by company,branch,name`, [req.me.branch_id || ''])).rows); // own branch only
  res.json((await q(`select ${cols} from roster order by company,branch,name`)).rows);
});
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
app.get('/api/jobs', requireUser, async (req, res) => { if (!['superadmin', 'admin', 'consultant'].includes(req.me.role)) return res.status(403).json({ error: 'forbidden' }); const admin = ['superadmin', 'admin'].includes(req.me.role); const mask = s => (admin || !s ? s : String(s).replace(/^(.{3}).*(.{2})$/, '$1•••$2')); res.json({ jobs: (await q('select * from jobs_log order by id desc limit 200')).rows, messages: (await q('select * from messages_log order by id desc limit 500')).rows.map(r => ({ ...r, recipient: mask(r.recipient) })) }); });
app.post('/api/jobs/sync', requireUser, requireAdmin, async (req, res) => { try { res.json({ report: await require('./jobs/sync').run(req.query.adapter) }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/jobs/messages/:kind', requireUser, requireAdmin, async (req, res) => { try { res.json({ sent: await require('./jobs/messages').run(req.params.kind) }); } catch (e) { res.status(500).json({ error: e.message }); } });

// ---- document verification: the board registers each download; the QR code on it opens /verify/<id>
app.post('/api/docs', requireUser, async (req, res) => {
  try { const r = await docs.register(req.me, req.body && req.body.docs); const base = (process.env.BASE_URL || '').replace(/\/$/, ''); res.json(r.map(x => (x ? { id: x.id, url: base + '/verify/' + x.id } : null))); }
  catch (e) { res.status(e.status || 400).json({ error: e.message }); }
});
app.get('/verify/:id', limiter(60 * 1000, 120, 'verify'), async (req, res) => { res.set('Cache-Control', 'no-store'); res.type('html').send(await docs.page(String(req.params.id), req.query.h ? String(req.query.h) : null)); });

// ---- update notifications on phones and browsers (Web Push)
app.get('/api/push/key', requireUser, async (req, res) => res.json(await push.vapid()));
app.post('/api/push/subscribe', requireUser, async (req, res) => { try { await push.subscribe(req.me, req.body && req.body.subscription); res.json({ ok: true }); } catch (e) { res.status(e.status || 400).json({ error: e.message }); } });
app.delete('/api/push/subscribe', requireUser, async (req, res) => { await push.unsubscribe(req.me, req.body && req.body.endpoint); res.json({ ok: true }); });
app.post('/api/push/test', requireUser, async (req, res) => res.json(await push.send({ title: 'Incentive board', body: 'Notifications are on for this device.', url: '/', tag: 'board-test' }, req.me.email)));
app.post('/api/push/announce', requireUser, requireAdmin, async (req, res) => {
  const title = String((req.body && req.body.title) || '').slice(0, 80), body = String((req.body && req.body.body) || '').slice(0, 240);
  if (!title) return res.status(400).json({ error: 'a title is needed' });
  const r = await push.send({ title, body, url: '/', tag: 'board-announce' });
  await q('insert into audit_events(who,action,detail) values($1,$2,$3)', [req.me.email, 'Announcement pushed', `${title} · ${r.sent} sent`]);
  res.json(r);
});

// ---- the page and its files
const ROOT = path.join(__dirname, '..');
app.get('/sw.js', (req, res) => { res.set('Cache-Control', 'no-cache'); res.set('Service-Worker-Allowed', '/'); res.type('application/javascript').send(fs.readFileSync(path.join(__dirname, 'public', 'sw.js'), 'utf8').replace('__BUILD__', BUILD)); });
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '5m' }));
app.use('/docs', express.static(path.join(ROOT, 'docs'), { maxAge: '1h' }));
app.get('/favicon.ico', (req, res) => res.type('image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1F2D44"/><text x="16" y="21" font-family="Arial" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">MR</text></svg>'));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

// ---- errors: logged here, a plain answer to the browser
app.use((err, req, res, next) => { console.error(req.method, req.path, err); if (res.headersSent) return next(err); res.status(err.status || 500).json({ error: err.status ? err.message : 'server error' }); });
process.on('unhandledRejection', e => console.error('unhandled', e));

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
(process.env.MIGRATE_ON_START === '0' ? Promise.resolve() : migrate()).then(() => {
  if (process.env.JOBS !== '0') schedule();
  push.announceBuild(BUILD, RELEASE, NOTES).then(r => { if (r) console.log('release announced', r); }).catch(e => console.warn('release announcement skipped:', e.message));
  app.listen(PORT, () => console.log('incentive board back end on :' + PORT));
}).catch(e => { console.error('migration failed', e); process.exit(1); });
