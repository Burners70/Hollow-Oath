const { chromium } = require('@playwright/test');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await p.waitForFunction(() => window.__doids !== undefined);
  const r = await p.evaluate(() => {
    let near = 0, trials = 0, dists = [];
    for (let i = 0; i < 400; i++) {
      __doids.setVeteran(); __doids.go(7); __doids.launch();
      const f = level.fakeMercy;
      const fakes = (level.secrets || []).filter(s => s.fake && !s.dead);
      if (!fakes.length) continue;
      const d = Math.min(...fakes.map(s => Math.abs(s.x - f.x)));
      dists.push(Math.round(d)); trials++;
      if (d < 120) near++;      // roughly a landed-scan sweep radius
    }
    dists.sort((a, b) => a - b);
    return { trials, near, pct: Math.round(near / trials * 100), min: dists[0], p10: dists[Math.floor(dists.length * .1)], median: dists[Math.floor(dists.length / 2)] };
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
