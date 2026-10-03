// Pulls every configured adapter and replaces the current month's rows per source. Adapters live in
// jobs/adapters/*.js and export { sources: ['orders', ...], pull: async (ctx) => ({ orders: rows, ... }) }.
const fs = require('fs'), path = require('path');
const { q, tx } = require('../lib/db');
const sources = require('../lib/sources');

function month() { return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).slice(0, 7); }
function adapters() {
  const dir = path.join(__dirname, 'adapters');
  return fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.endsWith('.example.js')).map(f => ({ name: f.replace(/\.js$/, ''), mod: require(path.join(dir, f)) }));
}
async function run(only) {
  const m = month(); const report = [];
  for (const a of adapters()) {
    if (only && a.name !== only) continue;
    try {
      const out = await a.mod.pull({ month: m, env: process.env });
      for (const id of Object.keys(out || {})) {
        if (!sources.SOURCES[id]) { report.push(`${a.name}: unknown source ${id}`); continue; }
        const n = await tx(c => sources.replaceMonth(c, id, m, out[id] || []));
        report.push(`${a.name}: ${id} ${n} rows`);
      }
      await q('insert into jobs_log(job,status,detail) values($1,$2,$3)', ['sync:' + a.name, 'ok', report.filter(r => r.startsWith(a.name)).join('; ')]);
    } catch (e) {
      report.push(`${a.name}: FAILED ${e.message}`);
      await q('insert into jobs_log(job,status,detail) values($1,$2,$3)', ['sync:' + a.name, 'failed', e.message]);
    }
  }
  return report;
}
module.exports = { run, month };
if (require.main === module) run(process.argv[2]).then(r => { console.log(r.join('\n') || 'no adapters configured'); process.exit(0); }, e => { console.error(e); process.exit(1); });
