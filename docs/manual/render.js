// Render an HTML file to an A4 PDF with Chromium. argv: html, pdf, header(1|0)
const { chromium } = (() => { try { return require('playwright'); } catch (_) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const path = require('path');
(async () => {
  const [html, pdf, header] = process.argv.slice(2);
  const b = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(html), { waitUntil: 'load' });
  await p.emulateMedia({ media: 'print' });
  await p.evaluate(() => document.fonts.ready);
  const font = "font-family:'Liberation Sans','DejaVu Sans',Arial,sans-serif;font-size:7.5pt;color:#6E6052;width:100%;padding:0 16mm;display:flex;justify-content:space-between;align-items:center;";
  await p.pdf({
    path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: false,
    margin: header === '1' ? { top: '18mm', bottom: '17mm', left: '16mm', right: '16mm' } : { top: 0, bottom: 0, left: 0, right: 0 },
    displayHeaderFooter: header === '1',
    headerTemplate: `<div style="${font}border-bottom:0.6pt solid #DDD3C4;padding-bottom:3pt;margin-top:6mm"><span style="font-weight:700;color:#3E2C1A;letter-spacing:.08em;text-transform:uppercase">Incentive Board Manual</span><span>Meubel Grande · Royal Group · release 1.2</span></div>`,
    footerTemplate: `<div style="${font}border-top:0.6pt solid #DDD3C4;padding-top:3pt;margin-bottom:6mm"><span>Designed and developed by Dr. Babu B. · Team Bpro Consulting &amp; Technologies</span><span style="font-weight:700;color:#3E2C1A">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
