// Sign-in through the company's identity provider (Google Workspace or Microsoft Entra, OpenID Connect) and a
// signed httpOnly session cookie. Only emails on the profiles table may enter. DEV_LOGIN=1 adds a development
// sign-in by email with no password; never set it in production.
const jwt = require('jsonwebtoken');
const { Issuer, generators } = require('openid-client');
const { q } = require('./db');

const SECRET = process.env.SESSION_SECRET || 'change-me';
const BASE = (process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const COOKIE = 'mr_session';
const PROVIDERS = {
  google: { name: 'Google Workspace', issuer: 'https://accounts.google.com', id: process.env.OIDC_GOOGLE_CLIENT_ID, secret: process.env.OIDC_GOOGLE_CLIENT_SECRET },
  microsoft: { name: 'Microsoft 365', issuer: `https://login.microsoftonline.com/${process.env.OIDC_MICROSOFT_TENANT || 'common'}/v2.0`, id: process.env.OIDC_MICROSOFT_CLIENT_ID, secret: process.env.OIDC_MICROSOFT_CLIENT_SECRET },
};
const clients = {};
async function client(p) {
  const def = PROVIDERS[p]; if (!def || !def.id) throw new Error('provider not configured: ' + p);
  if (!clients[p]) { const iss = await Issuer.discover(def.issuer); clients[p] = new iss.Client({ client_id: def.id, client_secret: def.secret, redirect_uris: [`${BASE}/api/auth/callback/${p}`], response_types: ['code'] }); }
  return clients[p];
}
function providers() { return Object.entries(PROVIDERS).filter(([, d]) => d.id).map(([id, d]) => ({ id, name: d.name })); }
async function profileFor(email) {
  const r = await q('select email,name,role,branch_id,person_id,phone from profiles where lower(email)=lower($1) and active', [email]);
  return r.rows[0] || null;
}
function setSession(res, profile) {
  const token = jwt.sign({ email: profile.email }, SECRET, { expiresIn: '12h' });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: BASE.startsWith('https'), maxAge: 12 * 3600 * 1000, path: '/' });
}
async function current(req) {
  try { const t = req.cookies[COOKIE]; if (!t) return null; const { email } = jwt.verify(t, SECRET); return await profileFor(email); } catch (_) { return null; }
}
function mount(app) {
  app.get('/api/config', (req, res) => res.json({ providers: providers(), devLogin: process.env.DEV_LOGIN === '1' }));
  app.get('/api/auth/login', async (req, res) => {
    try {
      const p = req.query.provider; const c = await client(p);
      const nonce = generators.nonce(), state = generators.state();
      res.cookie('mr_oidc', jwt.sign({ nonce, state, p }, SECRET, { expiresIn: '10m' }), { httpOnly: true, sameSite: 'lax', secure: BASE.startsWith('https'), path: '/' });
      res.redirect(c.authorizationUrl({ scope: 'openid email profile', nonce, state, prompt: 'select_account' }));
    } catch (e) { res.status(400).send('Sign-in is not configured: ' + e.message); }
  });
  app.get('/api/auth/callback/:provider', async (req, res) => {
    try {
      const p = req.params.provider; const c = await client(p);
      const saved = jwt.verify(req.cookies.mr_oidc || '', SECRET);
      const params = c.callbackParams(req);
      const tokens = await c.callback(`${BASE}/api/auth/callback/${p}`, params, { nonce: saved.nonce, state: saved.state });
      const claims = tokens.claims();
      const email = (claims.email || claims.preferred_username || '').toLowerCase();
      const prof = await profileFor(email);
      res.clearCookie('mr_oidc', { path: '/' });
      if (!prof) { await q('insert into audit_events(who,action,detail) values($1,$2,$3)', [email || 'unknown', 'Sign-in refused', 'not on the profiles table']); return res.status(403).send(`<p style="font-family:sans-serif">${email || 'This account'} is not on the roster for the board. Ask the administrator to add it. <a href="/">Back</a></p>`); }
      setSession(res, prof);
      await q('insert into audit_events(who,action,detail) values($1,$2,$3)', [prof.email, 'Signed in', p]);
      res.redirect('/');
    } catch (e) { res.status(400).send('Sign-in failed: ' + e.message); }
  });
  if (process.env.DEV_LOGIN === '1') app.get('/api/auth/dev', async (req, res) => {
    const prof = await profileFor(String(req.query.as || '')); if (!prof) return res.status(403).send('not on the profiles table');
    setSession(res, prof); res.redirect('/');
  });
  app.get('/api/auth/logout', (req, res) => { res.clearCookie(COOKIE, { path: '/' }); res.redirect('/'); });
}
module.exports = { mount, current, providers };
