// Builds and sends the scheduled messages with the board's own engine. Usage: node jobs/messages.js <run>
//   daily    → daily SM WhatsApp, daily BM WhatsApp                  (21:00 every day)
//   weekly   → weekly Sales, CRE, Logistics, Back office WhatsApps   (Saturday 19:00)
//   bm-email → weekly BM email with the SM in copy                   (Monday 08:00)
//   monthly  → personal summaries, monthly CRE WhatsApp, MD email, HR email (1st 08:00 after reconciliation)
//   md-preview → MD mid-month email                                   (16th 08:00)
// Recipients come from the roster (phone, email) and the profiles table (md, director, hr). Every send is logged.
const { q } = require('../lib/db');
const engine = require('../lib/engine');
const wa = require('../send/whatsapp');
const mail = require('../send/email');

const DRY = process.env.DRY_RUN === '1';

async function roster() { const r = await q('select id,name,role,branch,branch_id,phone,email from roster where left_on is null or left_on > now()'); return r.rows; }
async function profilesByRole(roles) { const r = await q('select email,name,role,phone from profiles where active and role = any($1)', [roles]); return r.rows; }

async function log(row) { await q('insert into messages_log(cadence,audience,channel,recipient,subject,status,provider_id,error) values($1,$2,$3,$4,$5,$6,$7,$8)', [row.cadence, row.audience, row.channel, row.recipient, row.subject, row.status, row.provider_id || null, row.error || null]); }

async function deliver(channel, to, built, meta) {
  if (!to) { await log({ ...meta, channel, recipient: '', subject: built.subject, status: 'skipped', error: 'no contact on roster' }); return; }
  if (DRY) { await log({ ...meta, channel, recipient: to, subject: built.subject, status: 'dry-run' }); return; }
  try {
    const res = channel === 'whatsapp' ? await wa.send(to, built.text, built.subject) : await mail.send(to, built.subject, built.html, built.text, meta.cc);
    await log({ ...meta, channel, recipient: to, subject: built.subject, status: 'sent', provider_id: res.id });
  } catch (e) { await log({ ...meta, channel, recipient: to, subject: built.subject, status: 'failed', error: e.message }); }
}

async function run(kind) {
  const E = await engine.load();
  const R = await roster();
  const contact = (name, role, branchName) => R.find(x => x.name === name && (!role || x.role === role) && (!branchName || x.branch === branchName)) || R.find(x => x.name === name) || {};
  const g = E.computeGroup(), rk = E.rankings(g);
  const branchesC = E.branches.map(br => ({ br, b: E.computeBranch(br) }));
  const meta = cad => ({ cadence: cad });
  const sent = [];
  const perBranch = async (aud, cad, ch, toRole) => {
    for (const { br, b } of branchesC) {
      const built = E.buildMessage(aud, cad, ch, { b, rk, person: null });
      const heads = b.members.filter(m => toRole.includes(m.p.role)).map(m => contact(m.p.name, m.p.role, br.name));
      if (aud === 'BM' && ch === 'email') { const bm = heads.find(h => h.role === 'BM'), sm = heads.find(h => h.role === 'SM'); await deliver('email', bm && bm.email, built, { ...meta(cad), audience: aud, cc: sm && sm.email }); }
      else for (const h of heads) await deliver(ch, ch === 'whatsapp' ? h.phone : h.email, built, { ...meta(cad), audience: aud });
      sent.push(`${aud} ${cad} ${ch} ${br.name}`);
    }
  };
  const teamGroups = async (aud, cad) => { // team WhatsApps go to every member of the team in the branch
    for (const { br, b } of branchesC) {
      const built = E.buildMessage(aud, cad, 'whatsapp', { b, rk, person: null });
      for (const m of b.members.filter(m => m.p.role === aud)) await deliver('whatsapp', contact(m.p.name, m.p.role, br.name).phone, built, { ...meta(cad), audience: aud });
      sent.push(`${aud} ${cad} whatsapp ${br.name}`);
    }
  };
  const groupMail = async (aud, cad, roles) => {
    const built = E.buildMessage(aud, cad, 'email', { b: branchesC[0].b, rk, person: null });
    for (const p of await profilesByRole(roles)) await deliver('email', p.email, built, { ...meta(cad), audience: aud });
    sent.push(`${aud} ${cad} email`);
  };
  if (kind === 'daily') { await perBranch('SM', 'daily', 'whatsapp', ['SM']); await perBranch('BM', 'daily', 'whatsapp', ['BM']); }
  else if (kind === 'weekly') { for (const t of ['Sales', 'CRE', 'Logistics', 'Back office']) await teamGroups(t, 'weekly'); }
  else if (kind === 'bm-email') { await perBranch('BM', 'weekly', 'email', ['BM', 'SM']); await groupMail('MD', 'weekly', ['md', 'director']); }
  else if (kind === 'monthly') {
    for (const { br, b } of branchesC) for (const m of b.members) { const built = E.buildMessage('person', 'monthly', 'whatsapp', { b, rk, person: m }); await deliver('whatsapp', contact(m.p.name, m.p.role, br.name).phone, built, { ...meta('monthly'), audience: 'person' }); }
    await teamGroups('CRE', 'monthly'); await groupMail('MD', 'monthly', ['md', 'director']); await groupMail('HR', 'monthly', ['hr']);
  }
  else if (kind === 'md-preview') await groupMail('MD', 'monthly', ['md', 'director']);
  else throw new Error('unknown run: ' + kind);
  await q('insert into jobs_log(job,status,detail) values($1,$2,$3)', ['messages:' + kind, 'ok', sent.length + ' message groups' + (DRY ? ' (dry run)' : '')]);
  return sent;
}
module.exports = { run };
if (require.main === module) run(process.argv[2] || 'daily').then(r => { console.log(r.join('\n')); process.exit(0); }, e => { console.error(e); process.exit(1); });
