// Reads /data/inbox/<source>.csv (or INBOX_DIR) for every board source that has a file. Works on day one with
// scheduled exports from the ERP, CRM and biometric software dropped by SFTP or a shared folder.
const fs = require('fs'), path = require('path');
const { SOURCES } = require('../../lib/sources');

const DIR = process.env.INBOX_DIR || '/data/inbox';

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
      const f = path.join(DIR, id + '.csv');
      if (fs.existsSync(f)) out[id] = parseCSV(fs.readFileSync(f, 'utf8'));
    }
    return out;
  },
};
