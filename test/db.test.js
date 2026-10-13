// Database-backed checks against a real Postgres (CI starts one as a service):
//   migrations apply once and the restricted app role cannot change schema or the audit trail;
//   shared documents are versioned (a stale save is refused with the current copy);
//   client roles receive their own branch only; sign-out ends every session; PKCE on sign-in; cross-site writes and
//   floods are refused.
// Env: OWNER_URL (database owner) and APP_URL (connects as incentive_app with DB_APP_PASSWORD).
const path = require('path');
const root = path.join(__dirname, '..', 'backend');
const { Client } = require(root + '/node_modules/pg');
const OWNER = process.env.OWNER_URL, APP = process.env.APP_URL;
if (!OWNER || !APP) { console.log('db test skipped: OWNER_URL and APP_URL not set'); process.exit(0); }
const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
(async () => {
  const migrate = require(root + '/db/migrate.js');
  const first = await migrate({ url: OWNER }), second = await migrate({ url: OWNER });
  ok(second.length === 0, 'migrations ran twice: ' + second.join(','));
  const own = new Client({ connectionString: OWNER }); await own.connect();
  const month = (await own.query("select to_char(now() at time zone 'Asia/Kolkata','YYYY-MM') m")).rows[0].m;
  await own.query("delete from kv; delete from roster; delete from src_orders; delete from profiles");
  await own.query(`insert into roster(id,name,role,branch,branch_id,company,phone,email) values ('MG1','Anjali R.','Sales','Kollam','klm','Meubel Grande','+919800000001','a@x.in'),('MG5','Jithin K.','BM','Kollam','klm','Meubel Grande',null,'j@x.in'),('RG1','Sarath K.','Sales','Calicut','clt','Royal Group',null,null)`);
  await own.query(`insert into profiles(email,name,role,branch_id,person_id) values ('tech@bpropms.com','Tech','superadmin',null,null),('process@bpropms.com','Process','admin',null,null),('j@x.in','Jithin K.','bm','klm','MG5')`);
  await own.query(`insert into src_orders(month,employee,order_no,day,item,list_price,discount_pct,status,deliver_day,pay_day,margin_pct) values ($1,'Anjali R.','K1',2,'Sofa',100000,10,'paid',5,8,30),($1,'Sarath K.','C1',3,'Bed',90000,5,'paid',6,9,30)`, [month]);
  await own.end();
  const app = new Client({ connectionString: APP }); await app.connect();
  for (const [sql, what] of [['delete from audit_events', 'delete audit rows'], ['truncate audit_events', 'truncate the audit trail'], ['drop trigger audit_events_no_update on audit_events', 'drop the audit trigger'], ['create table x(a int)', 'create tables'], ['delete from schema_migrations', 'edit migration records']])
    ok(await app.query(sql).then(() => false, () => true), 'app role can ' + what);
  await app.end();
  const oc = require(root + '/node_modules/openid-client');
  oc.Issuer.discover = async () => new oc.Issuer({ issuer: 'https://accounts.google.com', authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth', token_endpoint: 'https://oauth2.googleapis.com/token', jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs' });
  Object.assign(process.env, { DATABASE_URL: APP, MIGRATE_ON_START: '0', PORT: '8092', JOBS: '0', DEV_LOGIN: '1', SESSION_SECRET: 'a'.repeat(48), BASE_URL: 'http://localhost:8092', OIDC_GOOGLE_CLIENT_ID: 'cid', OIDC_GOOGLE_CLIENT_SECRET: 'sec', RATE_AUTH_PER_MIN: '25' });
  console.error = () => {}; console.warn = () => {};
  process.chdir(root); require(root + '/server.js'); await new Promise(r => setTimeout(r, 700));
  const B = 'http://localhost:8092', login = async e => (await fetch(B + '/api/auth/dev?as=' + e, { redirect: 'manual' })).headers.get('set-cookie').split(';')[0];
  const loc = (await fetch(B + '/api/auth/login?provider=google', { redirect: 'manual' })).headers.get('location') || '';
  ok(/code_challenge=[\w-]{43}/.test(loc) && /code_challenge_method=S256/.test(loc), 'sign-in redirect has no PKCE challenge');
  const a1 = await login('tech@bpropms.com'), a2 = await login('process@bpropms.com'), bm = await login('j@x.in');
  const put = (c, body, v) => fetch(B + '/api/kv/mr-adj', { method: 'PUT', headers: { cookie: c, 'Content-Type': 'application/json', 'If-Match': String(v) }, body: JSON.stringify(body) });
  const s1 = await put(a1, [{ id: 'A' }], 0), j1 = await s1.json();
  const s2 = await put(a2, [{ id: 'B' }], 0), j2 = await s2.json();
  ok(s1.status === 200 && j1.version === 1, 'first save not version 1');
  ok(s2.status === 409 && j2.version === 1 && JSON.stringify(j2.value) === '[{"id":"A"}]', 'stale save not refused with the current copy');
  ok((await put(a2, [{ id: 'A' }, { id: 'B' }], 1)).status === 200, 'save from the current version refused');
  const v = await (await fetch(B + '/api/kv?v=1', { headers: { cookie: a1 } })).json();
  ok(v.versions['mr-adj'] === 2 && v.values['mr-adj'].length === 2, 'versions not reported');
  ok((await fetch(B + '/api/kv/mr-cfg', { method: 'PUT', headers: { cookie: a1, 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body: '{}' })).status === 403, 'cross-site write accepted');
  const ros = (await (await fetch(B + '/api/roster', { headers: { cookie: bm } })).json()).map(r => r.id).sort().join(',');
  const ord = (await (await fetch(B + '/api/source/orders', { headers: { cookie: bm } })).json()).map(r => r.employee).join(',');
  ok(ros === 'MG1,MG5' && ord === 'Anjali R.', 'branch manager sees beyond the branch: ' + ros + ' / ' + ord);
  ok((await (await fetch(B + '/api/source/orders', { headers: { cookie: a1 } })).json()).length === 2, 'admin does not see the group');
  const a1b = await login('tech@bpropms.com');
  ok((await fetch(B + '/api/auth/logout', { method: 'POST', headers: { cookie: a1, Accept: 'application/json' } })).status === 200, 'sign-out failed');
  ok((await fetch(B + '/api/me', { headers: { cookie: a1 } })).status === 401 && (await fetch(B + '/api/me', { headers: { cookie: a1b } })).status === 401, 'a session survived sign-out');
  ok((await fetch(B + '/api/me', { headers: { cookie: a2 } })).status === 200, "sign-out ended someone else's session");
  // document verification: register, the public page says genuine, a wrong fingerprint and an unknown ID are flagged
  const hash = 'ab'.repeat(32);
  const reg = await (await fetch(B + '/api/docs', { method: 'POST', headers: { cookie: a2, 'Content-Type': 'application/json' }, body: JSON.stringify({ docs: [{ kind: 'statement', title: 'Anjali R. · incentive statement · October 2026', hash, summary: { employee: 'Anjali R.', total: 7458 } }, { kind: 'bogus', title: 'x', hash }] }) })).json();
  ok(reg[0] && /^STM-[A-Z0-9]{12}$/.test(reg[0].id) && reg[0].url.endsWith('/verify/' + reg[0].id) && reg[1] === null, 'document not registered: ' + JSON.stringify(reg));
  const vp = await (await fetch(B + '/verify/' + reg[0].id + '?h=' + hash.slice(0, 16))).text();
  ok(/Genuine document/.test(vp) && vp.includes('7,458') && vp.includes('pr•••@bpropms.com') && !vp.includes('process@bpropms.com'), 'verification page wrong for a genuine document');
  ok(/does not match/.test(await (await fetch(B + '/verify/' + reg[0].id + '?h=' + 'cd'.repeat(8))).text()), 'altered fingerprint not flagged');
  ok(/No such document/.test(await (await fetch(B + '/verify/STM-NOTREAL0000')).text()), 'unknown document not flagged');
  ok(/No such document/.test(await (await fetch(B + '/verify/%3Cscript%3E')).text()) && !(await (await fetch(B + '/verify/%3Cscript%3E')).text()).includes('<script>'), 'verify page echoes input');
  ok((await fetch(B + '/api/docs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"docs":[]}' })).status === 401, 'anonymous registration accepted');
  { const appc = new Client({ connectionString: APP }); await appc.connect(); ok(await appc.query("update issued_docs set title='forged'").then(() => false, () => true), 'app role can rewrite an issued document'); await appc.end(); }
  let flood = 0; for (let i = 0; i < 40; i++) if ((await fetch(B + '/api/auth/logout')).status === 429) flood++;
  ok(flood > 0, 'sign-in routes not rate-limited');
  if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
  console.log(`db test: migrations ${first.length ? first.join(', ') : 'already applied'}; restricted app role; versioned saves; branch scope; sign-out everywhere; PKCE; document verification; cross-site and flood refused`);
  process.exit(0);
})().catch(e => { console.log('db test failed:', e.message); process.exit(1); });
