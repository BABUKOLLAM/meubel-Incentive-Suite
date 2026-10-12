// Sign-in through the company's identity provider (Google Workspace or Microsoft Entra, OpenID Connect) and a
// signed httpOnly session cookie. Only emails on the profiles table may enter. DEV_LOGIN=1 adds a development
// sign-in by email with no password; never set it in production.
const jwt = require('jsonwebtoken');
const { Issuer, generators } = require('openid-client');
const { q } = require('./db');

const SECRET = process.env.SESSION_SECRET || '';
const BASE_URL = process.env.BASE_URL || '';
if (SECRET.length < 32 || /change|example|secret/i.test(SECRET)) { // a guessable secret lets anyone mint a session cookie
  if (BASE_URL.startsWith('https')) { console.error('SESSION_SECRET must be a random value of 32 or more characters (openssl rand -hex 32)'); process.exit(1); }
  console.warn('SESSION_SECRET is weak or missing: acceptable only for local development');
}
const BASE = (process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const COOKIE = 'mr_session';
const MS_TENANT = process.env.OIDC_MICROSOFT_TENANT || '';
const DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean); // optional extra gate
const PROVIDERS = {
  google: { name: 'Google Workspace', issuer: 'https://accounts.google.com', id: process.env.OIDC_GOOGLE_CLIENT_ID, secret: process.env.OIDC_GOOGLE_CLIENT_SECRET },
  microsoft: { name: 'Microsoft 365', issuer: `https://login.microsoftonline.com/${MS_TENANT}/v2.0`, id: MS_TENANT && !/^(common|organizations|consumers)$/i.test(MS_TENANT) ? process.env.OIDC_MICROSOFT_CLIENT_ID : '', secret: process.env.OIDC_MICROSOFT_CLIENT_SECRET },
};
const clients = {};
async function client(p) {
  const def = Object.hasOwn(PROVIDERS, p) ? PROVIDERS[p] : null; if (!def || !def.id) throw new Error('provider not configured');
  if (!clients[p]) { const iss = await Issuer.discover(def.issuer); clients[p] = new iss.Client({ client_id: def.id, client_secret: def.secret, redirect_uris: [`${BASE}/api/auth/callback/${p}`], response_types: ['code'] }); }
  return clients[p];
}
function providers() { return Object.entries(PROVIDERS).filter(([, d]) => d.id).map(([id, d]) => ({ id, name: d.name })); }
async function profileFor(email) {
  const r = await q('select email,name,role,branch_id,person_id,phone,session_epoch from profiles where lower(email)=lower($1) and active', [email]);
  return r.rows[0] || null;
}
const page = (res, status, text) => res.status(status).type('text/plain').send(text); // never echo request data as HTML
// The email may be trusted only when the provider vouches for it: a verified Google address, or the company's own Entra tenant
function trustedEmail(p, claims) {
  let email = '';
  if (p === 'google') { if (claims.email_verified === true || claims.email_verified === 'true') email = String(claims.email || ''); }
  else if (p === 'microsoft') { if (claims.tid && String(claims.tid).toLowerCase() === MS_TENANT.toLowerCase()) email = String(claims.email || claims.preferred_username || ''); }
  email = email.toLowerCase();
  if (email && DOMAINS.length && !DOMAINS.includes(email.split('@')[1])) return '';
  return email;
}
function setSession(res, profile) {
  const token = jwt.sign({ email: profile.email, ep: profile.session_epoch || 0 }, SECRET, { expiresIn: '12h' });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: BASE.startsWith('https'), maxAge: 12 * 3600 * 1000, path: '/' });
}
async function current(req) {
  try {
    const t = req.cookies[COOKIE]; if (!t) return null;
    const { email, ep } = jwt.verify(t, SECRET);
    const prof = await profileFor(email); if (!prof) return null;
    if ((ep || 0) !== (prof.session_epoch || 0)) return null; // signed out since this cookie was issued
    const { session_epoch, ...me } = prof; return me;
  } catch (_) { return null; }
}
function mount(app) {
  app.get('/api/config', (req, res) => res.json({ providers: providers(), devLogin: process.env.DEV_LOGIN === '1' }));
  app.get('/api/auth/login', async (req, res) => {
    try {
      const p = req.query.provider; const c = await client(p);
      const nonce = generators.nonce(), state = generators.state(), cv = generators.codeVerifier(); // PKCE: the code is useless without the verifier kept here
      res.cookie('mr_oidc', jwt.sign({ nonce, state, p, cv }, SECRET, { expiresIn: '10m' }), { httpOnly: true, sameSite: 'lax', secure: BASE.startsWith('https'), path: '/' });
      res.redirect(c.authorizationUrl({ scope: 'openid email profile', nonce, state, prompt: 'select_account', code_challenge: generators.codeChallenge(cv), code_challenge_method: 'S256' }));
    } catch (e) { console.warn('login:', e.message); page(res, 400, 'Sign-in with this provider is not configured.'); }
  });
  app.get('/api/auth/callback/:provider', async (req, res) => {
    try {
      const p = req.params.provider; const c = await client(p);
      const saved = jwt.verify(req.cookies.mr_oidc || '', SECRET);
      if (saved.p !== p) throw new Error('provider mismatch');
      const params = c.callbackParams(req);
      const tokens = await c.callback(`${BASE}/api/auth/callback/${p}`, params, { nonce: saved.nonce, state: saved.state, code_verifier: saved.cv });
      const claims = tokens.claims();
      const email = trustedEmail(p, claims);
      const prof = email ? await profileFor(email) : null;
      res.clearCookie('mr_oidc', { path: '/' });
      if (!prof) { await q('insert into audit_events(who,action,detail) values($1,$2,$3)', [email || 'unknown', 'Sign-in refused', 'not on the profiles table']); return page(res, 403, 'This account is not on the roster for the board, or its email is not verified by the company directory. Ask the administrator to add it, then open the board again.'); }
      setSession(res, prof);
      await q('insert into audit_events(who,action,detail) values($1,$2,$3)', [prof.email, 'Signed in', p]);
      res.redirect('/');
    } catch (e) { console.warn('callback:', e.message); page(res, 400, 'Sign-in failed. Open the board and try again.'); }
  });
  if (process.env.DEV_LOGIN === '1') app.get('/api/auth/dev', async (req, res) => {
    const prof = await profileFor(String(req.query.as || '')); if (!prof) return page(res, 403, 'not on the profiles table');
    setSession(res, prof); res.redirect('/');
  });
  // Sign out is a POST (a link elsewhere cannot sign anyone out) and ends every session of that person, on every device
  app.post('/api/auth/logout', async (req, res) => {
    const me = await current(req);
    if (me) { await q('update profiles set session_epoch = session_epoch + 1 where lower(email)=lower($1)', [me.email]); await q('insert into audit_events(who,action,detail) values($1,$2,$3)', [me.email, 'Signed out', 'all sessions']); }
    res.clearCookie(COOKIE, { path: '/' }); res.clearCookie('mr_oidc', { path: '/' });
    if ((req.get('accept') || '').includes('application/json')) return res.json({ ok: true });
    res.redirect(303, '/');
  });
  app.get('/api/auth/logout', (req, res) => res.type('html').send('<!doctype html><meta charset="utf-8"><title>Sign out</title><form method="post" action="/api/auth/logout" style="font:15px system-ui;margin:40px"><p>Sign out of the incentive board on every device?</p><button>Sign out</button> <a href="/">Back</a></form>'));
}
module.exports = { mount, current, providers };
