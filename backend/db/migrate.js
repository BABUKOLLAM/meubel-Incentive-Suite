// Applies db/schema.sql (idempotent). Run by the server on start and by `npm run migrate`.
const fs = require('fs'), path = require('path');
const { q } = require('../lib/db');
async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await q(sql);
}
module.exports = migrate;
if (require.main === module) migrate().then(() => { console.log('schema applied'); process.exit(0); }, e => { console.error(e); process.exit(1); });
