// Issued documents: the board registers every download (report, statement, export, ledger) with its SHA-256
// fingerprint and a short summary; /verify/<id> is the public page the document's QR code opens. The ID is random
// and unguessable, so only someone holding the document reaches its record.
const crypto = require('crypto');
const { q } = require('./db');

const KINDS = { report: 'RPT', statement: 'STM', export: 'EXP', ledger: 'LDG' };
const LABEL = { report: 'Report', statement: 'Incentive statement', export: 'Table export', ledger: 'Adjustments ledger' };
const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newId = kind => KINDS[kind] + '-' + [...crypto.randomBytes(12)].map(b => B32[b % 32]).join('');
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

async function register(me, list) {
  if (!Array.isArray(list) || !list.length || list.length > 500) { const e = new Error('send 1 to 500 documents'); e.status = 400; throw e; }
  const out = [];
  for (const d of list) {
    const kind = Object.hasOwn(KINDS, d && d.kind) ? d.kind : null, title = String((d && d.title) || '').slice(0, 200), hash = String((d && d.hash) || '').toLowerCase();
    const summary = d && d.summary && typeof d.summary === 'object' ? d.summary : null, sj = summary ? JSON.stringify(summary) : null;
    if (!kind || !title || !/^[0-9a-f]{64}$/.test(hash) || (sj && sj.length > 4000)) { out.push(null); continue; }
    const id = newId(kind);
    await q('insert into issued_docs(id,kind,title,hash,summary,issued_by) values($1,$2,$3,$4,$5,$6)', [id, kind, title, hash, sj, me.email]);
    out.push({ id });
  }
  return out;
}

const mask = email => { const [u, d] = String(email || '').split('@'); return d ? u.slice(0, 2) + '•••@' + d : '—'; };
const ist = t => new Date(t).toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).slice(0, 16) + ' IST';
const fmt = v => (typeof v === 'number' ? v.toLocaleString('en-IN') : String(v));
function summaryRows(s) {
  const rows = [];
  for (const [k, v] of Object.entries(s || {})) {
    const label = ({ grand: 'Grand total', id: 'Employee ID', asOf: 'As of day', approvedNet: 'Approved net' })[k] || k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
    if (v && typeof v === 'object') for (const [k2, v2] of Object.entries(v)) rows.push([label + ' · ' + k2, fmt(v2)]);
    else rows.push([label, fmt(v)]);
  }
  return rows;
}

async function page(id, h) {
  const r = /^[A-Z]{3}-[A-Z0-9]{8,24}$/.test(id) ? (await q('select * from issued_docs where id=$1', [id])).rows[0] : null;
  const check = h ? (r && r.hash.startsWith(String(h).toLowerCase().slice(0, 64)) && String(h).length >= 12) : null;
  const state = !r ? ['bad', 'No such document', 'This ID was not issued by the incentive board. Treat the document as not genuine.']
    : check === false ? ['bad', 'The code does not match the record', 'The fingerprint in the QR code differs from the one recorded when the document was issued. Treat the document as altered.']
      : ['good', 'Genuine document', 'Issued by the Meubel Grande and Royal Group incentive board. Compare the title, period and figures below with the document in your hand.'];
  const rows = r ? [['Document ID', r.id], ['Type', LABEL[r.kind] || r.kind], ['Title', r.title], ['Issued', ist(r.issued_at)], ['Issued by', mask(r.issued_by)], ...summaryRows(r.summary), ['Fingerprint (SHA-256)', r.hash]] : [['Document ID', id]];
  const col = { good: ['#276B44', '#E9F3EA'], bad: ['#B4372B', '#FBEAE5'] }[state[0]];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Verify ${esc(id)} · Incentive board</title>
<style>body{margin:0;background:#F6F1EA;color:#2A2420;font:15px/1.55 Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}main{max-width:720px;margin:0 auto;padding:28px 16px}
.head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px}.head img{height:58px;border-radius:9px}.eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#B5651D;font-weight:700}h1{font:700 26px/1.2 Georgia,serif;color:#1E2A4A;margin:4px 0 0}
.state{border-radius:14px;padding:16px 18px;margin:0 0 16px;border-left:5px solid ${col[0]};background:${col[1]}}.state b{display:block;font-size:19px;color:${col[0]}}.card{background:#FFFEFB;border:1px solid #E5DCCF;border-radius:14px;overflow:hidden}
table{width:100%;border-collapse:collapse}td{padding:10px 14px;border-bottom:1px solid #E5DCCF;vertical-align:top}tr:last-child td{border-bottom:0}td:first-child{width:38%;color:#6A5F55;font-size:13px}td.h{font:12.5px ui-monospace,Menlo,Consolas,monospace;word-break:break-all}
.foot{margin-top:18px;font-size:12px;color:#6A5F55;text-align:center}.foot a{color:#4E3E87}</style></head><body><main>
<div class="head"><div><div class="eyebrow">Meubel Grande · Royal Group · incentive board</div><h1>Document verification</h1></div><img src="/assets/bpro-logo.jpg" alt="Bpro Consulting &amp; Technologies"></div>
<div class="state" role="status"><b>${esc(state[1])}</b>${esc(state[2])}</div>
<div class="card"><table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td${k.startsWith('Fingerprint') ? ' class="h"' : ''}>${esc(v)}</td></tr>`).join('')}</table></div>
<p class="foot">D&amp;D by Dr.Babu.B. Bpro Consulting &amp; Technologies · <a href="https://www.drbabu.in">www.drbabu.in</a> | <a href="https://www.bpropms.com">www.bpropms.com</a></p></main></body></html>`;
}
module.exports = { register, page, newId, KINDS };
