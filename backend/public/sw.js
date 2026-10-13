// Service worker for the hosted board: makes it installable on phones ("Add to Home Screen"), keeps the last copy of
// the page for a weak connection, and shows update notifications. Board data (/api) and verification pages are never
// cached. The server stamps the build below, so a new release installs a new worker and the page offers the update.
const BUILD = '__BUILD__', CACHE = 'board-' + BUILD;
const SHELL = ['/', '/config.js', '/remote.js', '/fonts.css', '/assets/bpro-logo.jpg', '/manifest.webmanifest', '/icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(f => c.add(f).catch(() => {}))))); }); // waits until the page says "update now"
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/verify/') || u.pathname === '/sw.js') return;
  // network first, so a new release is picked up at once; the last good copy when the phone is offline
  e.respondWith(fetch(e.request).then(r => { if (r.ok && SHELL.includes(u.pathname)) { const c = r.clone(); caches.open(CACHE).then(x => x.put(u.pathname, c)); } return r; })
    .catch(() => caches.match(e.request.mode === 'navigate' ? '/' : u.pathname).then(hit => hit || Response.error())));
});
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch (_) { d = { title: 'Incentive board', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Incentive board', { body: d.body || '', icon: '/icons/icon-192.png', badge: '/icons/badge-72.png', tag: d.tag || 'board', data: { url: d.url || '/' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => { const w = ws.find(x => new URL(x.url).origin === location.origin); if (w) { w.focus(); return w.navigate(url); } return self.clients.openWindow(url); }));
});
