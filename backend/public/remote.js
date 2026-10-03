/* Connects the board to the hosted back end.
   - preload(): signs the person in (or shows the sign-in screen), loads the shared state (settings, policy versions,
     ledger, wirings, month close, audit, archive, users) into browser storage as a cache, then lets the board start.
   - write-through: every save of a shared key goes to the server as well, so all browsers see one truth.
   - afterBoot(): pulls every data source from the server and re-renders; shows who is signed in; refreshes the session.
   Per-person preferences (theme, menu position, welcome card, last view) stay in the browser. */
(function () {
  const cfg = window.BPRO_CONFIG || {}; if (!cfg.api) return;
  const SHARED = ['mr-cfg', 'mr-src', 'mr-users', 'mr-policy', 'mr-adj', 'mr-wire', 'mr-close', 'mr-audit', 'mr-hist'];
  const BUILT_IN = ['tech@bpropms.com', 'process@bpropms.com', 'drbabu@bpropms.com'];
  const api = (p, o = {}) => fetch(cfg.api + p, { credentials: 'same-origin', ...o, headers: { 'Content-Type': 'application/json', ...(o.headers || {}) } });
  let me = null; const timers = {};

  function signInScreen(conf) {
    const el = document.createElement('div');
    el.setAttribute('style', 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#F3F5F8;font:15px/1.5 Inter,system-ui,sans-serif;color:#1B2430;z-index:100;padding:20px');
    const btn = p => `<a href="${cfg.api}/auth/login?provider=${p.id}" style="display:block;margin:8px 0;padding:11px 16px;border:1px solid #DCE2EA;border-radius:10px;background:#fff;color:#1B2430;text-decoration:none;font-weight:600;text-align:center">Sign in with ${p.name}</a>`;
    el.innerHTML = `<div style="width:min(420px,100%);background:#fff;border:1px solid #DCE2EA;border-radius:16px;padding:28px 26px;box-shadow:0 20px 50px -30px rgba(16,24,40,.4)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#1F2D44,#0E7C86);color:#fff;font-weight:700;font-size:12.5px">MR</span><b style="letter-spacing:.14em;font-size:11px;text-transform:uppercase;color:#0A5E66">Meubel Grande · Royal Group</b></div>
      <h1 style="font:600 26px/1.15 'Cormorant Garamond',Georgia,serif;margin:6px 0 4px">Incentive board</h1>
      <p style="margin:0 0 16px;color:#5B6776">Sign in with your company account. You will see the group, your branch or your own page according to your role.</p>
      ${(conf.providers || []).map(btn).join('') || '<p style="color:#B42318">No sign-in provider is configured on the server yet.</p>'}
      ${conf.devLogin ? `<form method="get" action="${cfg.api}/auth/dev" style="margin-top:14px;border-top:1px dashed #DCE2EA;padding-top:12px"><label style="font-size:12px;color:#5B6776">Development sign-in (disabled in production)<br><input name="as" placeholder="email on the profiles table" style="width:100%;margin-top:4px;padding:8px;border:1px solid #DCE2EA;border-radius:8px"></label><button style="margin-top:8px;padding:8px 12px;border:1px solid #DCE2EA;border-radius:8px;background:#F3F5F8;cursor:pointer">Continue</button></form>` : ''}
      ${conf.message ? `<p style="margin:14px 0 0;color:#B42318;font-size:13px">${conf.message}</p>` : ''}
    </div>`;
    document.body.appendChild(el);
    return new Promise(() => {}); // the board does not start until the redirect comes back signed in
  }

  async function preload() {
    const r = await api('/me');
    if (r.status === 401 || r.status === 403) {
      const conf = await (await api('/config')).json();
      if (r.status === 403) conf.message = 'This account is not on the roster for the board. Ask the administrator to add it.';
      return signInScreen(conf);
    }
    if (!r.ok) throw new Error('me: HTTP ' + r.status);
    me = await r.json();
    const kv = await (await api('/kv')).json();
    Object.keys(kv).forEach(k => { try { localStorage.setItem(k, JSON.stringify(kv[k])); } catch (_) {} });
    try { // the signed-in person must exist in the users list the board reads
      const extra = JSON.parse(localStorage.getItem('mr-users') || '[]');
      if (!BUILT_IN.includes(me.email) && !extra.some(u => u.email === me.email)) {
        extra.push({ email: me.email, name: me.name, role: me.role, br: me.branch_id || undefined, person: me.person_id || undefined });
        localStorage.setItem('mr-users', JSON.stringify(extra));
      }
    } catch (_) {}
    try { localStorage.setItem('mr-user', me.email); } catch (_) {}
    const origSet = localStorage.setItem.bind(localStorage), origDel = localStorage.removeItem.bind(localStorage);
    localStorage.setItem = (k, v) => { origSet(k, v); if (SHARED.includes(k)) { clearTimeout(timers[k]); timers[k] = setTimeout(() => api('/kv/' + k, { method: 'PUT', body: v }).then(res => { if (!res.ok) console.warn('save refused', k, res.status); }).catch(e => console.warn('save failed', k, e)), 400); } };
    localStorage.removeItem = k => { origDel(k); if (SHARED.includes(k)) api('/kv/' + k, { method: 'DELETE' }).catch(() => {}); };
  }

  async function afterBoot(B) {
    const sel = document.getElementById('selUser'); if (sel) { sel.disabled = true; sel.setAttribute('data-tip', 'Signed in through single sign-on; the role comes from the roster.'); }
    const note = document.getElementById('userNote'); if (note) note.innerHTML = `${me.email} · <a href="${cfg.api}/auth/logout">Sign out</a>`;
    let n = 0;
    for (const src of B.SOURCES) {
      try {
        const r = await api('/source/' + src.id); if (!r.ok) continue;
        const t = await r.text(); if (t.trim() === '[]') continue;
        const m = B.applySource(src, t);
        B.SRC_STATE[src.id] = { ...(B.SRC_STATE[src.id] || {}), url: cfg.api + '/source/' + src.id, mode: 'api', error: '', status: m, at: new Date().toISOString() };
        n++;
      } catch (e) { B.SRC_STATE[src.id] = { ...(B.SRC_STATE[src.id] || {}), mode: 'api', error: e.message }; }
    }
    if (n) { B.render(); if (B.toast) B.toast(n + ' data source' + (n > 1 ? 's' : '') + ' loaded from the server'); }
    setInterval(() => api('/me').then(r => { if (r.status === 401) location.reload(); }).catch(() => {}), 5 * 60 * 1000);
  }

  window.BPRO_REMOTE = { preload, afterBoot, me: () => me };
})();
