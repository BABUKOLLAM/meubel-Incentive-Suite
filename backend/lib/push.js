// Update notifications to phones and browsers (Web Push). The VAPID key pair is made on first use and kept in
// app_meta, so nothing has to be configured. When the server starts with a new build of the board, everyone who
// switched notifications on gets one message; an administrator can also send an announcement.
const webpush = require('web-push');
const { q } = require('./db');

let keys = null;
async function meta(k) { return ((await q('select value from app_meta where key=$1', [k])).rows[0] || {}).value || null; }
async function setMeta(k, v) { await q('insert into app_meta(key,value) values($1,$2) on conflict (key) do update set value=excluded.value', [k, v]); }

async function vapid() {
  if (keys) return keys;
  let pub = await meta('vapid_public'), priv = await meta('vapid_private');
  if (!pub || !priv) { const k = webpush.generateVAPIDKeys(); pub = k.publicKey; priv = k.privateKey; await setMeta('vapid_public', pub); await setMeta('vapid_private', priv); }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:tech@bpropms.com', pub, priv);
  keys = { publicKey: pub };
  return keys;
}

async function subscribe(me, sub) {
  if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) { const e = new Error('not a push subscription'); e.status = 400; throw e; }
  await q('insert into push_subscriptions(endpoint,email,keys) values($1,$2,$3) on conflict (endpoint) do update set email=excluded.email, keys=excluded.keys', [sub.endpoint, me.email, JSON.stringify({ p256dh: sub.keys.p256dh, auth: sub.keys.auth })]);
}
async function unsubscribe(me, endpoint) { await q('delete from push_subscriptions where endpoint=$1 and email=$2', [String(endpoint || ''), me.email]); }

// Send one message to every subscription (or to one person's); drop the ones the push service says are gone
async function send(message, email) {
  await vapid();
  const subs = (await q(email ? 'select * from push_subscriptions where email=$1' : 'select * from push_subscriptions', email ? [email] : [])).rows;
  const payload = JSON.stringify({ title: message.title, body: message.body, url: message.url || '/', tag: message.tag || 'board-update' });
  let sent = 0, gone = 0, failed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: typeof s.keys === 'string' ? JSON.parse(s.keys) : s.keys }, payload, { TTL: 24 * 3600, timeout: 15000 });
      sent++; await q('update push_subscriptions set last_ok=now() where endpoint=$1', [s.endpoint]);
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { gone++; await q('delete from push_subscriptions where endpoint=$1', [s.endpoint]); } else { failed++; console.warn('push failed', e.statusCode || e.message); }
    }
  }
  return { sent, gone, failed, total: subs.length };
}

// Called on start: announce a build once, the first time a server runs it
async function announceBuild(build, release, notes) {
  const last = await meta('announced_build');
  if (last === build) return null;
  await setMeta('announced_build', build);
  if (!last || process.env.PUSH_ON_DEPLOY === '0') return null; // the very first start has nothing to announce
  const r = await send({ title: `Incentive board updated · release ${release}`, body: notes || 'Open the board to load the new version.', url: '/', tag: 'board-update' });
  await q('insert into jobs_log(job,status,detail) values($1,$2,$3)', ['push:release', 'ok', `${release} (${build}): ${r.sent} sent, ${r.gone} removed, ${r.failed} failed`]);
  return r;
}
module.exports = { vapid, subscribe, unsubscribe, send, announceBuild };
