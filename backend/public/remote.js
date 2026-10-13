/* Connects the board to the hosted back end.
   - preload(): signs the person in (or shows the sign-in screen), loads the shared state (settings, policy versions,
     ledger, wirings, month close, audit, archive, users) into browser storage as a cache, then lets the board start.
   - write-through: every save of a shared key goes to the server as well, so all browsers see one truth.
   - afterBoot(): pulls every data source from the server and re-renders; shows who is signed in; refreshes the session.
   - versions: every shared document carries a version; a save names the version it started from. If another person
     saved in between, the server refuses (409) and this file merges three ways (what the page started from, what is
     on the server now, what this person changed), saves the merge and reloads, so neither change is lost.
   Per-person preferences (theme, menu position, welcome card, last view) stay in the browser. */
(function () {
  const cfg = window.BPRO_CONFIG || {}; if (!cfg.api) return;
  const SHARED = ['mr-cfg', 'mr-src', 'mr-users', 'mr-policy', 'mr-adj', 'mr-wire', 'mr-close', 'mr-audit', 'mr-hist'];
  const BUILT_IN = ['tech@bpropms.com', 'process@bpropms.com', 'drbabu@bpropms.com'];
  const api = (p, o = {}) => fetch(cfg.api + p, { credentials: 'same-origin', ...o, headers: { 'Content-Type': 'application/json', ...(o.headers || {}) } });
  let me = null; const timers = {}, ver = {}, base = {}, pending = {};
  const LABEL = { 'mr-cfg': 'Settings', 'mr-src': 'Data inputs', 'mr-users': 'Users', 'mr-policy': 'Policy versions', 'mr-adj': 'Adjustments', 'mr-wire': 'Wirings', 'mr-close': 'Month close', 'mr-audit': 'Audit log', 'mr-hist': 'History' };
  const ID = { 'mr-adj': x => x.id, 'mr-audit': x => [x.t, x.who, x.action, x.detail].join('|'), 'mr-hist': x => x.key || x.month, 'mr-users': x => x.email, 'mr-policy': x => x.v, 'mr-wire': x => x.id };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // Three-way merge: an item this person did not change takes the server's copy; an item they changed keeps theirs;
  // new items from both sides are kept; an item deleted on the server and untouched here stays deleted
  function merge3(b, theirs, mine, idf) {
    if (Array.isArray(mine) && Array.isArray(theirs) && idf) {
      const B = new Map((b || []).map(x => [idf(x), x])), M = new Map(mine.map(x => [idf(x), x])), seen = new Set(), out = [];
      for (const t of theirs) { const id = idf(t); seen.add(id); const m = M.get(id); out.push(m !== undefined && !same(m, B.get(id)) ? m : t); }
      for (const m of mine) { const id = idf(m); if (!seen.has(id) && !B.has(id)) out.push(m); }
      return out;
    }
    if (mine && theirs && typeof mine === 'object' && typeof theirs === 'object' && !Array.isArray(mine) && !Array.isArray(theirs)) {
      const bb = b || {}, out = { ...theirs };
      for (const k of Object.keys(mine)) if (!same(mine[k], bb[k])) out[k] = (bb[k] && typeof mine[k] === 'object' && typeof theirs[k] === 'object') ? merge3(bb[k], theirs[k], mine[k]) : mine[k];
      for (const k of Object.keys(bb)) if (!(k in mine) && same(theirs[k], bb[k])) delete out[k];
      return out;
    }
    return mine;
  }
  function notice(text, reload) {
    let el = document.getElementById('kvNotice');
    if (!el) { el = document.createElement('div'); el.id = 'kvNotice'; el.setAttribute('role', 'status'); el.setAttribute('style', 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:90;max-width:min(560px,92vw);background:#1E2A4A;color:#fff;padding:10px 14px;border-radius:12px;font:13px/1.45 Inter,system-ui,sans-serif;box-shadow:0 12px 30px -12px rgba(0,0,0,.5)'); document.body.appendChild(el); }
    el.textContent = text + ' ';
    const b = document.createElement('button'); b.textContent = 'Reload now'; b.setAttribute('style', 'margin-left:8px;border:0;border-radius:8px;padding:4px 10px;background:#ECE6F6;color:#4E3E87;font-weight:600;cursor:pointer'); b.onclick = () => location.reload(); el.appendChild(b);
    if (reload) setTimeout(() => location.reload(), 2500);
  }

  function signInScreen(conf) {
    const el = document.createElement('div');
    el.setAttribute('style', 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#F6F1EA;font:15px/1.5 Inter,system-ui,sans-serif;color:#2A2420;z-index:100;padding:20px');
    const btn = p => `<a href="${cfg.api}/auth/login?provider=${p.id}" style="display:block;margin:8px 0;padding:11px 16px;border:1px solid #E5DCCF;border-radius:10px;background:#fff;color:#2A2420;text-decoration:none;font-weight:600;text-align:center">Sign in with ${p.name}</a>`;
    el.innerHTML = `<div style="width:min(420px,100%);background:#fff;border:1px solid #E5DCCF;border-radius:16px;padding:28px 26px;box-shadow:0 20px 50px -30px rgba(16,24,40,.4)">
      <img src="/assets/bpro-logo.jpg" alt="Bpro Consulting &amp; Technologies" style="display:block;width:132px;border-radius:10px;margin:0 0 16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#1E2A4A,#6B58A6);color:#fff;font-weight:700;font-size:12.5px">MR</span><b style="letter-spacing:.14em;font-size:11px;text-transform:uppercase;color:#4E3E87">Meubel Grande · Royal Group</b></div>
      <h1 style="font:600 26px/1.15 'Cormorant Garamond',Georgia,serif;margin:6px 0 4px">Incentive board</h1>
      <p style="margin:0 0 16px;color:#6A5F55">Sign in with your company account. You will see the group, your branch or your own page according to your role.</p>
      ${(conf.providers || []).map(btn).join('') || '<p style="color:#B42318">No sign-in provider is configured on the server yet.</p>'}
      ${conf.devLogin ? `<form method="get" action="${cfg.api}/auth/dev" style="margin-top:14px;border-top:1px dashed #E5DCCF;padding-top:12px"><label style="font-size:12px;color:#6A5F55">Development sign-in (disabled in production)<br><input name="as" placeholder="email on the profiles table" style="width:100%;margin-top:4px;padding:8px;border:1px solid #E5DCCF;border-radius:8px"></label><button style="margin-top:8px;padding:8px 12px;border:1px solid #E5DCCF;border-radius:8px;background:#F6F1EA;cursor:pointer">Continue</button></form>` : ''}
      ${conf.message ? `<p style="margin:14px 0 0;color:#B42318;font-size:13px">${conf.message}</p>` : ''}
    </div>`;
    document.body.appendChild(el);
    return new Promise(() => {}); // the board does not start until the redirect comes back signed in
  }

  function installable() { // the board installs as an app on phones: manifest, icons, theme colour
    const add = (tag, attrs) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); document.head.appendChild(el); };
    add('link', { rel: 'manifest', href: '/manifest.webmanifest' });
    add('link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' });
    add('meta', { name: 'theme-color', content: '#1E2A4A' });
    add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    add('meta', { name: 'apple-mobile-web-app-title', content: 'Incentive' });
  }

  // ---- updates: a new release on the server shows a banner on every open board, and a push message on phones
  let bootBuild = null, swReg = null, bannerShown = false;
  function updateBanner(release, notes) {
    if (bannerShown) return; bannerShown = true;
    const el = document.createElement('div'); el.id = 'updBanner'; el.setAttribute('role', 'status');
    el.setAttribute('style', 'position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:95;width:min(560px,94vw);background:#1E2A4A;color:#F6F1EA;padding:12px 14px;border-radius:14px;font:13.5px/1.45 Inter,system-ui,sans-serif;box-shadow:0 14px 34px -14px rgba(0,0,0,.55);display:flex;gap:12px;align-items:center');
    const t = document.createElement('div'); t.style.flex = '1'; t.innerHTML = '<b style="color:#fff">A new version of the board is ready' + (release ? ' · release ' + String(release).replace(/[<>&"]/g, '') : '') + '</b>';
    if (notes) { const n = document.createElement('div'); n.style.cssText = 'opacity:.85;font-size:12.5px'; n.textContent = notes; t.appendChild(n); }
    const b = document.createElement('button'); b.textContent = 'Update now'; b.setAttribute('style', 'border:0;border-radius:10px;padding:8px 14px;background:#C9BFF0;color:#1E2A4A;font-weight:700;cursor:pointer;white-space:nowrap');
    b.onclick = () => { if (swReg && swReg.waiting) { swReg.waiting.postMessage('skipWaiting'); setTimeout(() => location.reload(), 1500); } else location.reload(); };
    el.appendChild(t); el.appendChild(b); document.body.appendChild(el);
  }
  async function checkVersion() {
    try { const v = await (await api('/version')).json(); if (!bootBuild) bootBuild = v.build; else if (v.build && v.build !== bootBuild) updateBanner(v.release, v.notes); } catch (_) {}
  }
  async function serviceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      swReg.addEventListener('updatefound', () => { const w = swReg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) checkVersion().then(() => updateBanner()); }); });
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (bannerShown) location.reload(); });
    } catch (e) { console.warn('service worker', e); }
  }

  // ---- notifications on this device (Web Push): a switch in the header
  const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
  const pushable = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const iosNotInstalled = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator.standalone || matchMedia('(display-mode: standalone)').matches);
  async function pushState() { if (!pushable() || !swReg) return null; return swReg.pushManager.getSubscription(); }
  async function togglePush(btn, toast) {
    try {
      if (iosNotInstalled()) { toast('On iPhone, add the board to the Home Screen first (Share → Add to Home Screen), then switch updates on there.'); return; }
      const cur = await pushState();
      if (cur) { await api('/push/subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint: cur.endpoint }) }); await cur.unsubscribe(); paintPush(btn, false); toast('Update notifications are off on this device'); return; }
      if ((await Notification.requestPermission()) !== 'granted') { toast('Notifications were not allowed. They can be allowed later in the browser settings for this site.'); return; }
      const { publicKey } = await (await api('/push/key')).json();
      const sub = await swReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(publicKey) });
      const r = await api('/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub.toJSON() }) }); if (!r.ok) throw new Error('HTTP ' + r.status);
      paintPush(btn, true); toast('Update notifications are on: this device hears about every new release');
      api('/push/test', { method: 'POST' }).catch(() => {});
    } catch (e) { console.warn('push', e); toast('Could not switch notifications on here: ' + e.message); }
  }
  function paintPush(btn, on) { btn.textContent = on ? '🔔 Updates on' : '🔕 Get updates'; btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.title = on ? 'This device gets a notification for every new release. Click to switch off.' : 'Get a notification on this device when the board is updated'; }
  async function pushButton(toast) {
    const box = document.querySelector('.hbtns'); if (!box || !pushable() || document.getElementById('pushBtn')) return;
    const btn = document.createElement('button'); btn.className = 'hbtn'; btn.id = 'pushBtn'; box.appendChild(btn);
    paintPush(btn, !!(await pushState())); btn.addEventListener('click', () => togglePush(btn, toast));
  }
  async function announce(title, body) { const r = await api('/push/announce', { method: 'POST', body: JSON.stringify({ title, body }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status)); return j; }

  async function preload() {
    installable();
    let r;
    try { r = await api('/me'); } catch (e) { offline = true; offlineNote(); throw e; } // no connection: the board opens on the copy from the last visit
    if (r.status === 401 || r.status === 403) {
      const conf = await (await api('/config')).json();
      if (r.status === 403) conf.message = 'This account is not on the roster for the board. Ask the administrator to add it.';
      return signInScreen(conf);
    }
    if (!r.ok) throw new Error('me: HTTP ' + r.status);
    me = await r.json();
    const kvr = await (await api('/kv?v=1')).json(), kv = kvr.values || {};
    Object.assign(ver, kvr.versions || {}); Object.keys(kv).forEach(k => { base[k] = kv[k]; });
    const roster = await (await api('/roster')).json();
    try { if (Array.isArray(roster) && roster.length) localStorage.setItem('mr-roster', JSON.stringify(roster)); else localStorage.removeItem('mr-roster'); } catch (_) {}
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
    const save = async (k, body, tries = 0) => {
      pending[k] = true;
      try {
        const res = await api('/kv/' + k, { method: 'PUT', body, headers: { 'If-Match': String(ver[k] || 0) } });
        if (res.ok) { const j = await res.json(); ver[k] = j.version; base[k] = JSON.parse(body); return; }
        if (res.status === 409 && tries < 3) { // someone saved in between: merge and save again
          const cur = await res.json(), mine = JSON.parse(body), merged = merge3(base[k], cur.value, mine, ID[k]);
          ver[k] = cur.version; base[k] = cur.value;
          if (k === 'mr-audit' && Array.isArray(merged)) merged.sort((a, b) => String(b.t).localeCompare(String(a.t))).splice(300);
          const mb = JSON.stringify(merged); origSet(k, mb);
          await save(k, mb, tries + 1);
          notice(`${LABEL[k] || k} was also changed by ${cur.by || 'another user'} a moment ago. Both changes are kept; the board reloads to show them.`, true);
          return;
        }
        console.warn('save refused', k, res.status);
        if (res.status === 409) notice(`${LABEL[k] || k} keeps changing on another screen; your last change was not saved. Reload and make it again.`, false);
      } catch (e) { console.warn('save failed', k, e); notice('A change could not be saved: the connection to the server dropped. It will be retried with your next change.', false); }
      finally { pending[k] = false; }
    };
    localStorage.setItem = (k, v) => { origSet(k, v); if (SHARED.includes(k)) { clearTimeout(timers[k]); timers[k] = setTimeout(() => save(k, v), 400); } };
    localStorage.removeItem = k => { origDel(k); if (SHARED.includes(k)) api('/kv/' + k, { method: 'DELETE' }).then(() => { ver[k] = 0; delete base[k]; }).catch(() => {}); };
  }

  // offline: say so, keep the last copy readable, and reload once the connection is back
  let offline = false;
  function offlineNote() {
    const show = () => notice('You are offline. This is the copy from your last visit; changes are not saved until the connection is back.', false);
    if (document.body) show(); else addEventListener('DOMContentLoaded', show);
    addEventListener('online', () => location.reload(), { once: true });
  }
  async function afterBoot(B) {
    if (offline) { const sel = document.getElementById('selUser'); if (sel) sel.disabled = true; return; }
    const sel = document.getElementById('selUser'); if (sel) { sel.disabled = true; sel.setAttribute('data-tip', 'Signed in through single sign-on; the role comes from the roster.'); }
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
    await checkVersion(); setInterval(checkVersion, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { checkVersion(); if (swReg) swReg.update().catch(() => {}); } });
    await serviceWorker(); await pushButton(B.toast || (() => {}));
    // someone else's save shows up here within a minute, before this person edits a stale copy
    setInterval(() => api('/kv-versions').then(r => r.ok ? r.json() : {}).then(v => {
      const changed = SHARED.filter(k => k in v && (ver[k] || 0) < v[k] && !pending[k] && !timers[k + ':seen']);
      if (changed.length) { changed.forEach(k => { timers[k + ':seen'] = 1; }); notice(`${changed.map(k => LABEL[k] || k).join(', ')} ${changed.length > 1 ? 'were' : 'was'} updated by another user.`, false); }
    }).catch(() => {}), 60 * 1000);
  }

  async function registerDocs(list) { // the server records each download and returns its verification address
    const r = await api('/docs', { method: 'POST', body: JSON.stringify({ docs: list }) });
    if (!r.ok) throw new Error('docs: HTTP ' + r.status);
    return r.json();
  }
  async function signOut() { // ends this person's sessions on every device
    try { await api('/auth/logout', { method: 'POST', headers: { Accept: 'application/json' } }); } catch (_) {}
    location.href = '/';
  }
  window.BPRO_REMOTE = { preload, afterBoot, signOut, registerDocs, announce, me: () => me, _merge3: merge3 };
})();
