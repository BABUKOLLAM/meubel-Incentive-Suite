// Back-end security regressions: the real server.js against an in-memory database stub. Needs backend/node_modules
// (CI installs them). Checks that sign-in errors never echo input as HTML, that odd source names and database errors
// cannot crash the process, that client roles get only their slice of the shared state, that the audit trail records
// the signed-in user, and that the monthly round reads the month just ended in dry-run mode by default.
const path = require('path');
const root = path.join(__dirname, '..', 'backend');
const dbPath = require.resolve(root + '/lib/db.js');
const profiles = [{ email: 'tech@bpropms.com', name: 'T', role: 'superadmin', branch_id: null, person_id: null }, { email: 'e@x.in', name: 'E', role: 'employee', branch_id: 'klm', person_id: 'MG1' }];
const kv = { 'mr-hist': [{ month: 'September 2026', key: '2026-09', people: [{ id: 'MG1', total: 5 }, { id: 'MG2', total: 9 }], branches: [{ id: 'klm' }, { id: 'clt' }], products: [] }], 'mr-wire': [1], 'mr-close': {} };
const audit = [], logs = []; let srcMonth = null, failRoster = false;
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { pool: { end: async () => {} }, tx: async fn => fn({ query: async () => ({ rows: [] }) }), q: async (sql, p) => {
  if (/from profiles/.test(sql)) return { rows: profiles.filter(x => !p || x.email === String(p[0]).toLowerCase()) };
  if (/^select key, value from kv/.test(sql)) return { rows: Object.entries(kv).map(([key, value]) => ({ key, value })) };
  if (/insert into kv/.test(sql)) { kv[p[0]] = JSON.parse(p[1]); return { rows: [] }; }
  if (/select id, name from roster where branch_id/.test(sql)) return { rows: [{ id: 'MG1', name: 'E' }] };
  if (/from roster/.test(sql)) { if (failRoster) throw new Error('db down'); return { rows: [] }; }
  if (/insert into audit_events/.test(sql)) { audit.push(p); return { rows: [] }; }
  if (/insert into messages_log/.test(sql)) { logs.push(p); return { rows: [] }; }
  if (/from src_/.test(sql)) { srcMonth = p && p[0]; return { rows: [] }; }
  return { rows: [] };
} } };
Object.assign(process.env, { PORT: '8095', JOBS: '0', DEV_LOGIN: '1', SESSION_SECRET: 'test', BASE_URL: 'http://localhost:8095' });
delete process.env.DRY_RUN; delete process.env.OIDC_GOOGLE_CLIENT_ID;
const quiet = console.error; console.error = () => {}; console.warn = () => {};
process.chdir(root); require(root + '/server.js');
setTimeout(async () => {
  const B = 'http://localhost:8095', bad = [], ok = (c, m) => { if (!c) bad.push(m); };
  try {
    const r1 = await fetch(B + '/api/auth/login?provider=%3Cimg%20src=x%20onerror=alert(1)%3E');
    ok(/text\/plain/.test(r1.headers.get('content-type')) && !(await r1.text()).includes('<img'), 'login error echoes input as HTML');
    const r2 = await fetch(B + '/api/auth/callback/%3Csvg%20onload=1%3E');
    ok(/text\/plain/.test(r2.headers.get('content-type')) && !(await r2.text()).includes('svg'), 'callback error echoes input as HTML');
    const login = async e => (await fetch(B + '/api/auth/dev?as=' + e, { redirect: 'manual' })).headers.get('set-cookie').split(';')[0];
    const ce = await login('e@x.in'), ca = await login('tech@bpropms.com');
    for (const id of ['constructor', '__proto__', 'toString']) ok((await fetch(B + '/api/source/' + id, { headers: { cookie: ce } })).status === 404, 'source ' + id + ' not refused');
    const k = await (await fetch(B + '/api/kv', { headers: { cookie: ce } })).json();
    ok(!k['mr-wire'] && !k['mr-close'] && k['mr-hist'][0].people.length === 1 && k['mr-hist'][0].branches.length === 0, 'employee sees more than their own history');
    await fetch(B + '/api/kv/mr-audit', { method: 'PUT', headers: { cookie: ca, 'Content-Type': 'application/json' }, body: JSON.stringify([{ who: 'ceo@forged', action: 'x' }]) });
    ok(audit.filter(a => a[3] === 'mr-audit').every(a => a[0] === 'tech@bpropms.com'), 'audit entry took the client-supplied author');
    failRoster = true; ok((await fetch(B + '/api/roster', { headers: { cookie: ca } })).status === 500, 'database error not answered with 500'); failRoster = false;
    ok((await fetch(B + '/api/config')).status === 200, 'server died after a database error');
    await require(root + '/jobs/messages.js').run('monthly');
    ok(/^\d{4}-\d{2}$/.test(srcMonth || '') && srcMonth < new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).slice(0, 7), 'monthly round did not read the month just ended: ' + srcMonth);
    ok(logs.every(l => l[5] !== 'sent'), 'messages sent with DRY_RUN unset');
  } catch (e) { bad.push('threw ' + e.message); }
  console.error = quiet;
  if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
  console.log('backend test: sign-in errors plain text, routes survive bad input and database errors, scoped state, honest audit, monthly dry run on the closed month');
  process.exit(0);
}, 800);
