// Runs the board's own engine on the server, so scheduled messages carry exactly the figures the board shows.
// The page script is extracted from index.html and executed against a stub DOM (the same technique as the
// render test), with the shared state from the kv table and the month's data from the source tables loaded in.
const fs = require('fs'), path = require('path');
const { q } = require('./db');
const sources = require('./sources');

const INDEX = process.env.BOARD_HTML || path.join(__dirname, '..', '..', 'index.html');

function stubDom(store) {
  const stub = () => ({ innerHTML: '', textContent: '', className: '', value: '', hidden: false, style: {}, dataset: {}, files: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, addEventListener() {}, setAttribute() {}, getAttribute() { return null; }, removeAttribute() {}, getBoundingClientRect() { return { left: 0, width: 600 }; }, querySelectorAll() { return []; }, querySelector() { return stub(); }, closest() { return null; } });
  const nodes = {};
  const g = {
    document: { querySelector: s => nodes[s] || (nodes[s] = stub()), getElementById: id => nodes['#' + id] || (nodes['#' + id] = stub()), createElement: () => stub(), body: undefined, documentElement: undefined },
    window: { BPRO_CONFIG: { month: process.env.BOARD_MONTH || null }, scrollTo() {}, getSelection() { return { removeAllRanges() {}, addRange() {} }; } },
    localStorage: { getItem: k => (k in store ? JSON.stringify(store[k]) : null), setItem(k, v) { try { store[k] = JSON.parse(v); } catch (_) { store[k] = v; } }, removeItem(k) { delete store[k]; } },
    navigator: { clipboard: { writeText: () => Promise.resolve() } },
  };
  return g;
}

async function load(opts = {}) {
  const html = fs.readFileSync(INDEX, 'utf8');
  const js = html.match(/<script id="board-src"[^>]*>([\s\S]*?)<\/script>/)[1];
  const kv = await q('select key, value from kv'); const store = {}; kv.rows.forEach(r => { store[r.key] = r.value; });
  store['mr-user'] = 'tech@bpropms.com';
  const g = stubDom(store);
  const keys = Object.keys(g);
  const api = {};
  const body = js + `
    ;const __today=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));asOf=Math.min(DAYS,Math.max(1,${opts.asOf || '__today.getDate()'}));
    return {SOURCES,applySource,computeGroup,computeBranch,rankings,buildMessage,branches,people,allUsers,AUDIENCES,CADS,CHANNELS,asOf:()=>asOf,setAsOf:d=>{asOf=d},DAYS,MONTH,CAL,inr,inrL,pct};`;
  const fn = new Function(...keys, body);
  const engine = fn(...keys.map(k => g[k]));
  // feed the month's data
  const loaded = {};
  for (const src of engine.SOURCES) {
    const rows = await sources.read(src.id);
    if (rows && rows.length) { try { loaded[src.id] = engine.applySource(src, JSON.stringify(rows)); } catch (e) { loaded[src.id] = 'error: ' + e.message; } }
  }
  engine.loaded = loaded;
  return engine;
}

module.exports = { load };
