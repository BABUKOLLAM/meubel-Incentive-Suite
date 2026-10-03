// Browser smoke test: opens index.html in headless Chromium, walks every view under three roles, and fails on any
// page error, on NaN/undefined in the rendered text, or on horizontal overflow at phone width.
// Needs Playwright with Chromium (CI installs it); skipped with a notice when it is not available.
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (_) { console.log('browser test skipped: playwright not installed'); process.exit(0); } }
const path = require('path');
(async () => {
  const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'), { waitUntil: 'load' });
  await p.waitForTimeout(500);
  const bad = await p.evaluate(() => {
    const out = [];
    const roles = ['tech@bpropms.com', allUsers().find(u => u.role === 'bm').email, allUsers().find(u => u.role === 'employee').email];
    for (const email of roles) {
      setUser(email);
      const views = (typeof role().views === 'object') ? role().views : [];
      for (const v of views) {
        go(v === 'board' ? homeState() : { ...homeState(), level: v });
        const txt = document.body.innerText;
        for (const w of ['NaN', 'undefined', '[object Object]']) if (txt.includes(w)) out.push(`${email} ${v}: ${w}`);
      }
    }
    return out;
  });
  const ph = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  ph.on('pageerror', e => errs.push('phone pageerror: ' + e.message));
  await ph.goto('file://' + path.resolve(__dirname, '..', 'index.html'), { waitUntil: 'load' });
  await ph.waitForTimeout(400);
  const overflow = await ph.evaluate(() => { const r = []; for (const v of ['group', 'sales', 'leaderboard']) { setUser('tech@bpropms.com'); go({ level: v }); if (document.documentElement.scrollWidth > innerWidth) r.push(v + ': ' + document.documentElement.scrollWidth); } return r; });
  await b.close();
  const problems = [...errs, ...bad, ...overflow.map(o => 'phone overflow ' + o)];
  if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
  console.log('browser test: no page errors, no bad text, no phone overflow');
})().catch(e => { console.error(e); process.exit(1); });
