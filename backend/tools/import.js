// Load the roster or the sign-in profiles from a CSV, with validation first.
//   node tools/import.js roster   /data/roster.csv   [--check]
//   node tools/import.js profiles /data/profiles.csv [--check]
// --check validates and prints a report without touching the database. Rows are upserted by id (roster) or email
// (profiles); nothing is deleted. Mark a leaver with left_on rather than removing the row, so history keeps the name.
const fs = require('fs');

const ROSTER_ROLES = ['Sales', 'CRE', 'Logistics', 'Back office', 'BM', 'SM'];
const PROFILE_ROLES = ['superadmin', 'admin', 'consultant', 'md', 'director', 'hr', 'bm', 'sm', 'employee'];
const SPEC = {
  roster: { cols: ['id', 'name', 'role', 'branch', 'branch_id', 'company', 'phone', 'email', 'joined', 'left_on'], required: ['id', 'name', 'role', 'branch', 'company'] },
  profiles: { cols: ['email', 'name', 'role', 'branch_id', 'person_id', 'phone', 'active'], required: ['email', 'name', 'role'] },
};

function parseCSV(text) {
  const lines = text.replace(/^﻿/, '').replace(/\r/g, '').split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
  const split = l => { const out = []; let cur = '', qd = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (ch === '"') { if (qd && l[i + 1] === '"') { cur += '"'; i++; } else qd = !qd; } else if (ch === ',' && !qd) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(s => s.trim()); };
  const head = split(lines[0] || '').map(h => h.toLowerCase().replace(/\s+/g, '_'));
  return { head, rows: lines.slice(1).map((l, i) => { const v = split(l); const o = { _line: i + 2 }; head.forEach((h, j) => { o[h] = v[j] === undefined ? '' : v[j]; }); return o; }) };
}
const isDate = s => !s || (/^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s);
const isPhone = s => !s || /^\+?\d{10,15}$/.test(s.replace(/[\s-]/g, ''));
const isEmail = s => !s || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

function validate(kind, parsed) {
  const spec = SPEC[kind], errs = [], warns = [];
  const missing = spec.required.filter(c => !parsed.head.includes(c));
  if (missing.length) errs.push(`header is missing: ${missing.join(', ')} (expected ${spec.cols.join(',')})`);
  const unknown = parsed.head.filter(c => !spec.cols.includes(c));
  if (unknown.length) warns.push(`ignored columns: ${unknown.join(', ')}`);
  const seen = new Map();
  for (const r of parsed.rows) {
    const at = `line ${r._line}`;
    spec.required.forEach(c => { if (!r[c]) errs.push(`${at}: ${c} is empty`); });
    if (kind === 'roster') {
      if (r.role && !ROSTER_ROLES.includes(r.role)) errs.push(`${at}: role "${r.role}" must be one of ${ROSTER_ROLES.join(', ')}`);
      if (!isDate(r.joined) || !isDate(r.left_on)) errs.push(`${at}: dates must be YYYY-MM-DD`);
      if (!isPhone(r.phone)) errs.push(`${at}: phone "${r.phone}" is not a 10 to 15 digit number (use +91…)`);
      if (!isEmail(r.email)) errs.push(`${at}: email "${r.email}" is not valid`);
      if (r.phone && !r.phone.startsWith('+')) warns.push(`${at}: phone without country code; WhatsApp needs +91…`);
      if (!r.phone && !r.left_on) warns.push(`${at}: ${r.name} has no phone, so gets no WhatsApp`);
      const key = r.id; if (seen.has(key)) errs.push(`${at}: id ${key} repeats line ${seen.get(key)}`); else seen.set(key, r._line);
    } else {
      if (r.role && !PROFILE_ROLES.includes(r.role)) errs.push(`${at}: role "${r.role}" must be one of ${PROFILE_ROLES.join(', ')}`);
      if (!isEmail(r.email)) errs.push(`${at}: email "${r.email}" is not valid`);
      if (['bm', 'sm', 'employee'].includes(r.role) && !r.branch_id) errs.push(`${at}: ${r.role} needs branch_id`);
      if (['sm', 'employee'].includes(r.role) && !r.person_id) errs.push(`${at}: ${r.role} needs person_id (the roster id)`);
      const key = (r.email || '').toLowerCase(); if (seen.has(key)) errs.push(`${at}: ${key} repeats line ${seen.get(key)}`); else seen.set(key, r._line);
    }
  }
  if (kind === 'roster') {
    const byBranch = {}; parsed.rows.filter(r => !r.left_on).forEach(r => { (byBranch[r.branch] = byBranch[r.branch] || {})[r.role] = ((byBranch[r.branch] || {})[r.role] || 0) + 1; });
    Object.entries(byBranch).forEach(([b, roles]) => { if (!roles.BM) warns.push(`${b}: no Branch Manager on the roster`); if (!roles.Sales) warns.push(`${b}: no salespeople on the roster`); });
  }
  return { errs, warns };
}

async function load(kind, rows) {
  const { q, pool } = require('../lib/db');
  let n = 0;
  for (const r of rows) {
    if (kind === 'roster') await q('insert into roster(id,name,role,branch,branch_id,company,phone,email,joined,left_on) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (id) do update set name=$2,role=$3,branch=$4,branch_id=$5,company=$6,phone=$7,email=$8,joined=$9,left_on=$10', [r.id, r.name, r.role, r.branch, r.branch_id || null, r.company, r.phone ? r.phone.replace(/[\s-]/g, '') : null, r.email || null, r.joined || null, r.left_on || null]);
    else await q('insert into profiles(email,name,role,branch_id,person_id,phone,active) values(lower($1),$2,$3,$4,$5,$6,$7) on conflict (email) do update set name=$2,role=$3,branch_id=$4,person_id=$5,phone=$6,active=$7', [r.email, r.name, r.role, r.branch_id || null, r.person_id || null, r.phone || null, !/^(0|false|no)$/i.test(r.active || 'true')]);
    n++;
  }
  await q('insert into audit_events(who,action,detail) values($1,$2,$3)', ['import tool', `Imported ${kind}`, `${n} rows`]);
  await pool.end();
  return n;
}

async function main() {
  const [kind, file, flag] = process.argv.slice(2);
  if (!SPEC[kind] || !file) { console.log('usage: node tools/import.js roster|profiles <file.csv> [--check]'); process.exit(2); }
  const parsed = parseCSV(fs.readFileSync(file, 'utf8'));
  const { errs, warns } = validate(kind, parsed);
  console.log(`${kind}: ${parsed.rows.length} rows read from ${file}`);
  warns.forEach(w => console.log('  warning  ' + w));
  errs.forEach(e => console.log('  ERROR    ' + e));
  if (errs.length) { console.log(`${errs.length} error(s): nothing loaded. Fix the file and run again.`); process.exit(1); }
  if (flag === '--check') { console.log('check passed: run again without --check to load'); return; }
  const n = await load(kind, parsed.rows);
  console.log(`${n} ${kind} rows loaded`);
}
module.exports = { parseCSV, validate };
if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
