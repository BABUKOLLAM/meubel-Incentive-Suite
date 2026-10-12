// Shared board state as JSON documents, with role-based write rules and scope filtering on read.
const { q } = require('./db');

const KEYS = ['mr-cfg', 'mr-src', 'mr-users', 'mr-policy', 'mr-adj', 'mr-wire', 'mr-close', 'mr-audit', 'mr-hist'];
const ADMIN = ['superadmin', 'admin'];
const WIDE = ['superadmin', 'admin', 'consultant', 'md', 'director', 'hr'];

function canWrite(role, key) {
  if (!KEYS.includes(key)) return false;
  if (key === 'mr-users') return role === 'superadmin';
  if (key === 'mr-adj') return [...ADMIN, 'hr'].includes(role);          // HR raises regularisations and disputes
  return ADMIN.includes(role);
}

async function branchPeople(branchId) {
  const r = await q('select id, name from roster where branch_id=$1', [branchId]);
  return r.rows;
}

// Read everything the role may see; narrow the ledger and hide the audit log and user list from client roles.
// With versions, also each document's version, which a later save must name.
async function readAll(profile, withVersions) {
  const r = await q('select key, value, version from kv');
  const out = {}, versions = {}; r.rows.forEach(x => { out[x.key] = x.value; versions[x.key] = x.version || 0; });
  const role = profile.role;
  if (!WIDE.includes(role)) {
    for (const k of ['mr-audit', 'mr-users', 'mr-wire', 'mr-close', 'mr-src']) delete out[k]; // administration only
    let allowed = [];
    if (role === 'employee') allowed = [profile.person_id];
    else if (profile.branch_id) allowed = (await branchPeople(profile.branch_id)).flatMap(p => [p.id, p.name]);
    if (Array.isArray(out['mr-adj'])) out['mr-adj'] = out['mr-adj'].filter(a => allowed.includes(a.person));
    if (Array.isArray(out['mr-hist'])) // closed months: only the people (and, for managers, the branch) in scope
      out['mr-hist'] = out['mr-hist'].map(h => ({ ...h, people: (h.people || []).filter(p => allowed.includes(p.id)), branches: role === 'employee' ? [] : (h.branches || []).filter(b => b.id === profile.branch_id), products: role === 'employee' ? [] : (h.products || []).filter(x => x.br === profile.branch_id) }));
  }
  if (!withVersions) return out;
  Object.keys(versions).forEach(k => { if (!(k in out)) delete versions[k]; });
  return { values: out, versions };
}

async function versions() { return Object.fromEntries((await q('select key, version from kv')).rows.map(r => [r.key, r.version || 0])); }

// Save a document. `expected` is the version the browser started from: if someone saved in between, nothing is
// written and the caller gets 409 with the current value and version, so the board can merge and try again.
// Without `expected` (old clients, tools) the save is unconditional.
async function write(profile, key, value, expected) {
  if (!canWrite(profile.role, key)) { const e = new Error('forbidden'); e.status = 403; throw e; }
  const json = JSON.stringify(value);
  let version;
  if (expected == null) {
    version = (await q('insert into kv(key,value,updated_at,updated_by,version) values($1,$2,now(),$3,1) on conflict (key) do update set value=excluded.value, updated_at=now(), updated_by=excluded.updated_by, version=kv.version+1 returning version', [key, json, profile.email])).rows[0].version;
  } else {
    let r = await q('update kv set value=$2, updated_at=now(), updated_by=$3, version=version+1 where key=$1 and version=$4 returning version', [key, json, profile.email, expected]);
    if (!r.rows.length && expected === 0) r = await q('insert into kv(key,value,updated_at,updated_by,version) values($1,$2,now(),$3,1) on conflict (key) do nothing returning version', [key, json, profile.email]);
    if (!r.rows.length) {
      const cur = (await q('select value, version, updated_by from kv where key=$1', [key])).rows[0];
      const e = new Error('conflict'); e.status = 409; e.current = cur ? { value: cur.value, version: cur.version, by: cur.updated_by } : { value: null, version: 0 }; throw e;
    }
    version = r.rows[0].version;
  }
  // the audit log the board keeps is a capped working copy; every new entry is also appended here, immutably
  if (key === 'mr-audit' && Array.isArray(value)) {
    const last = await q('select detail from audit_events where key=$1 order by id desc limit 1', ['mr-audit']);
    const newest = value[0];
    if (newest && (!last.rows[0] || last.rows[0].detail !== JSON.stringify(newest)))
      await q('insert into audit_events(who,action,detail,key) values($1,$2,$3,$4)', [profile.email, String(newest.action || 'audit').slice(0, 200), JSON.stringify(newest), 'mr-audit']);
  } else {
    await q('insert into audit_events(who,action,detail,key) values($1,$2,$3,$4)', [profile.email, 'Saved ' + key, null, key]);
  }
  return version;
}

async function remove(profile, key) {
  if (!canWrite(profile.role, key)) { const e = new Error('forbidden'); e.status = 403; throw e; }
  await q('delete from kv where key=$1', [key]); // a later save starts again from version 0
  await q('insert into audit_events(who,action,detail,key) values($1,$2,$3,$4)', [profile.email, 'Reset ' + key, null, key]);
}

module.exports = { KEYS, readAll, versions, write, remove, canWrite };
