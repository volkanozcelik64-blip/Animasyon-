// Screenshot a design sheet page (design/*.html) to PNG.
// NODE_PATH=$(npm root -g) node tools/render-sheet.js design/character-sheet.html design/character-sheet.png [scale]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [html, out, scale] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: +(scale || 1) });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.resolve(html));
  await p.waitForFunction(() => window.SHEET_READY === true);
  await p.locator('#sheet').screenshot({ path: out });
  await b.close();
  console.log(out, errs.length ? 'ERRORS ' + errs.join(' | ') : 'ok');
})();
