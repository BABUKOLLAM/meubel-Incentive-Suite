// Postgres pool and a small query helper. DATABASE_URL comes from the environment (docker-compose sets it).
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
const q = (text, params) => pool.query(text, params);
async function tx(fn) {
  const c = await pool.connect();
  try { await c.query('BEGIN'); const r = await fn(c); await c.query('COMMIT'); return r; }
  catch (e) { await c.query('ROLLBACK'); throw e; }
  finally { c.release(); }
}
module.exports = { pool, q, tx };
