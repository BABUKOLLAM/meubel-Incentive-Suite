// Template: one REST endpoint per source, returning a JSON array of rows with the board's columns.
// Copy to http-json.js, set the URLs and the header, done. Add a transform per source if the field names differ.
const ENDPOINTS = {
  orders:     process.env.ERP_ORDERS_URL,       // e.g. https://erp.example.com/api/incentive/orders?month={month}
  customers:  process.env.ERP_CUSTOMERS_URL,
  targets:    process.env.ERP_TARGETS_URL,
  attendance: process.env.BIO_ATTENDANCE_URL,
  walkins:    process.env.CRM_WALKINS_URL,
  followups:  process.env.CRM_FOLLOWUPS_URL,
  deliveries: process.env.DELIVERY_URL,
};
const HEADERS = { Authorization: 'Bearer ' + (process.env.FEED_API_TOKEN || '') };

// Field-name mapping when the source calls things differently; identity otherwise
const TRANSFORM = {
  orders: r => ({ employee: r.salesperson || r.employee, order_no: r.order_no || r.so_number, day: +String(r.date || '').slice(8, 10) || r.day, item: r.item, list_price: r.list_price, discount_pct: r.discount_pct, status: (r.status || '').toLowerCase(), deliver_day: r.deliver_day, pay_day: r.pay_day, cancel_day: r.cancel_day, margin_pct: r.margin_pct, upsell: r.upsell ? 1 : 0, cross: r.cross ? 1 : 0, review: r.review ? 1 : 0, commitment_ok: r.commitment_ok === false ? 0 : 1, cre: r.cre || '', offer: r.offer ? 1 : 0, reason: r.reason || '' }),
};

module.exports = {
  sources: Object.keys(ENDPOINTS).filter(k => ENDPOINTS[k]),
  pull: async ({ month }) => {
    const out = {};
    for (const id of Object.keys(ENDPOINTS)) {
      if (!ENDPOINTS[id]) continue;
      const r = await fetch(ENDPOINTS[id].replace('{month}', month), { headers: HEADERS });
      if (!r.ok) throw new Error(`${id}: HTTP ${r.status}`);
      const rows = await r.json();
      out[id] = (Array.isArray(rows) ? rows : rows.rows || rows.data || []).map(TRANSFORM[id] || (x => x));
    }
    return out;
  },
};
