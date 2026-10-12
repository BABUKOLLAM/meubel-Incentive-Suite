// Reads /data/inbox/<source>.csv (or INBOX_DIR) for every board source that has a file. Works on day one with
// scheduled exports from the ERP, CRM and biometric software dropped by SFTP or a shared folder.
const fs = require('fs'), path = require('path');
const { SOURCES } = require('../../lib/sources');

const DIR = process.env.INBOX_DIR || '/data/inbox';
const picked = {};

function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (!lines.length) return [];
  const split = l => { const out = []; let cur = '', qd = false; for (const ch of l) { if (ch === '"') qd = !qd; else if (ch === ',' && !qd) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map(s => s.trim()); };
  const head = split(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(l => { const v = split(l); const o = {}; head.forEach((h, i) => { o[h] = v[i] === undefined ? '' : v[i]; }); return o; });
}

module.exports = {
  sources: Object.keys(SOURCES),
  pull: async () => {
    const out = {};
    if (!fs.existsSync(DIR)) return out;
    for (const id of Object.keys(SOURCES)) {
      const named = fs.readdirSync(DIR).filter(f => new RegExp('^' + id + '-\\d{4}-\\d{2}\\.csv$').test(f)).sort();
      const plain = path.join(DIR, id + '.csv');
      const f = named.length ? path.join(DIR, named[0]) : fs.existsSync(plain) ? plain : null; // one file per source per run
      if (!f) continue;
      const mm = (path.basename(f).match(/-(\d{4}-\d{2})\.csv$/) || [])[1];
      out[id] = { rows: parseCSV(fs.readFileSync(f, 'utf8')), month: mm };
      picked[id] = f;
    }
    return out;
  },
  done: async id => { // move a loaded file aside so it is not imported again into a later month
    const f = picked[id]; if (!f) return;
    const dir = path.join(DIR, 'done'); fs.mkdirSync(dir, { recursive: true });
    fs.renameSync(f, path.join(dir, path.basename(f, '.csv') + '.' + new Date().toISOString().replace(/[:.]/g, '-') + '.csv'));
    delete picked[id];
  },
};
