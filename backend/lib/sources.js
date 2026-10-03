// The board's data inputs: id → database view (current month) and table (all months). Column names are the
// board's CSV columns; the orders table stores `cross` as cross_sell because cross is a reserved word.
const { q } = require('./db');

const SOURCES = {
  targets:       { view: 'v_targets',       table: 'src_targets',       cols: ['employee', 'target'] },
  orders:        { view: 'v_orders',        table: 'src_orders',        cols: ['employee', 'order_no', 'day', 'item', 'list_price', 'discount_pct', 'status', 'deliver_day', 'pay_day', 'cancel_day', 'margin_pct', 'upsell', 'cross', 'review', 'commitment_ok', 'cre', 'offer', 'reason'] },
  customers:     { view: 'v_customers',     table: 'src_customers',     cols: ['employee', 'day', 'count'] },
  attendance:    { view: 'v_attendance',    table: 'src_attendance',    cols: ['employee', 'day', 'status'] },
  walkins:       { view: 'v_walkins',       table: 'src_walkins',       cols: ['branch', 'day', 'count', 'cre'] },
  followups:     { view: 'v_followups',     table: 'src_followups',     cols: ['cre', 'day', 'on_time', 'communicated'] },
  deliveries:    { view: 'v_deliveries',    table: 'src_deliveries',    cols: ['employee', 'day', 'on_time', 'damage_free', 'communicated'] },
  collections:   { view: 'v_collections',   table: 'src_collections',   cols: ['employee', 'day', 'on_time'] },
  documents:     { view: 'v_documents',     table: 'src_documents',     cols: ['employee', 'day', 'ok'] },
  calls:         { view: 'v_calls',         table: 'src_calls',         cols: ['employee', 'day', 'on_time'] },
  branch:        { view: 'v_branch',        table: 'src_branch',        cols: ['branch', 'audit_score', 'neatness', 'google_rating', 'last_month_discount'] },
  activities:    { view: 'v_activities',    table: 'src_activities',    cols: ['branch', 'employee', 'day', 'name', 'done'] },
  appreciations: { view: 'v_appreciations', table: 'src_appreciations', cols: ['employee', 'day'] },
  grooming:      { view: 'v_grooming',      table: 'src_grooming',      cols: ['employee', 'grooming', 'neatness'] },
};
const col = c => (c === 'cross' ? 'cross_sell' : c);

async function read(id) {
  const s = SOURCES[id]; if (!s) return null;
  const r = await q(`select * from ${s.view}`);
  return r.rows;
}

// Replace a month's rows for one source inside a transaction (what the sync job calls)
async function replaceMonth(client, id, month, rows) {
  const s = SOURCES[id]; if (!s) throw new Error('unknown source ' + id);
  await client.query(`delete from ${s.table} where month=$1`, [month]);
  const cols = s.cols.map(col);
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const values = [], params = [];
    chunk.forEach((row, ri) => {
      const ph = [];
      params.push(month); ph.push('$' + params.length);
      s.cols.forEach(c => { params.push(row[c] === '' || row[c] === undefined ? null : row[c]); ph.push('$' + params.length); });
      values.push('(' + ph.join(',') + ')');
    });
    await client.query(`insert into ${s.table}(month,${cols.join(',')}) values ${values.join(',')}`, params);
  }
  return rows.length;
}

module.exports = { SOURCES, read, replaceMonth };
