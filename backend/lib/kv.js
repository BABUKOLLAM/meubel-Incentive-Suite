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

// Read everything the role may see; narrow the ledger and hide the audit log and user list from client roles
async function readAll(profile) {
  const r = await q('select key, value from kv');
  const out = {}; r.rows.forEach(x => { out[x.key] = x.value; });
  const role = profile.role;
  if (!WIDE.includes(role)) {
    delete out['mr-audit'];
    delete out['mr-users'];
    if (Array.isArray(out['mr-adj'])) {
      let allowed = [];
      if (role === 'employee') allowed = [profile.person_id];
      else if (profile.branch_id) allowed = (await branchPeople(profile.branch_id)).flatMap(p => [p.id, p.name]);
      out['mr-adj'] = out['mr-adj'].filter(a => allowed.includes(a.person));
    }
  }
  return out;
}

async function write(profile, key, value) {
  if (!canWrite(profile.role, key)) { const e = new Error('forbidden'); e.status = 403; throw e; }
  await q('insert into kv(key,value,updated_at,updated_by) values($1,$2,now(),$3) on conflict (key) do update set value=excluded.value, updated_at=now(), updated_by=excluded.updated_by', [key, JSON.stringify(value), profile.email]);
  // the audit log the board keeps is a capped working copy; every new entry is also appended here, immutably
  if (key === 'mr-audit' && Array.isArray(value)) {
    const last = await q('select detail from audit_events where key=$1 order by id desc limit 1', ['mr-audit']);
    const newest = value[0];
    if (newest && (!last.rows[0] || last.rows[0].detail !== JSON.stringify(newest)))
      await q('insert into audit_events(who,action,detail,key) values($1,$2,$3,$4)', [newest.who || profile.email, newest.action || 'audit', JSON.stringify(newest), 'mr-audit']);
  } else {
    await q('insert into audit_events(who,action,detail,key) values($1,$2,$3,$4)', [profile.email, 'Saved ' + key, null, key]);
  }
}

async function remove(profile, key) {
  if (!canWrite(profile.role, key)) { const e = new Error('forbidden'); e.status = 403; throw e; }
  await q('delete from kv where key=$1', [key]);
  await q('insert into audit_events(who,action,detail,key) values($1,$2,$3,$4)', [profile.email, 'Reset ' + key, null, key]);
}

module.exports = { KEYS, readAll, write, remove, canWrite };
