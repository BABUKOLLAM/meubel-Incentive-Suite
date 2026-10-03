# Adapters

One file per system. Each exports:

```js
module.exports = {
  sources: ['orders', 'customers'],                // which board inputs it supplies
  pull: async ({ month, env }) => ({ orders: [...rows], customers: [...rows] }),
};
```

Rows are plain objects with the board's CSV column names (see `backend/lib/sources.js` or **Copy template** in the
board's Data inputs). `day` is the day of the month. Names in `employee`, `cre` and `branch` must match the roster
exactly (the board also accepts roster ids).

Files ending in `.example.js` are not loaded. Copy one, drop the suffix, fill in the mapping, and the sync job picks
it up on its next run (every 15 minutes) or on `npm run sync <name>`.

| Adapter | Supplies | Typical system |
|---|---|---|
| `csv-inbox` (ready) | any source | a folder where the ERP, CRM or biometric software drops exports: `/data/inbox/<source>.csv` |
| `http-json.example.js` | any source | a REST endpoint per source returning a JSON array with the board's columns |
| `erp.example.js` | orders, customers, targets | billing / ERP database or API |
| `crm.example.js` | walkins, followups, appreciations | CRM / enquiry register |
| `biometric.example.js` | attendance | biometric attendance export |
| `delivery.example.js` | deliveries | delivery app |
| `accounts.example.js` | collections, documents, calls | accounts system |
| `gbp.example.js` | branch (google_rating) | Google Business Profile API |
| `sheets.example.js` | branch, activities, grooming | audit and activity sheets |

Rows for a month are replaced in full on every run, so an adapter must return the whole month, not the delta.
