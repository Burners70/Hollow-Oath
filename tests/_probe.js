const { chromium } = require('@playwright/test');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await p.waitForFunction(() => window.__doids !== undefined);
  const r = await p.evaluate(() => {
    __doids.setVeteran(); __doids.go(7); __doids.launch();
    return { fakeMercyX: Math.round(level.fakeMercy.x), oidXs: level.oids.map(o => Math.round(o.x)) };
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
