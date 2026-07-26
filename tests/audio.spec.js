// Hollow Oath — Audio.
//
// The WebAudio graph observed from outside: thrust noise lifecycle and the
// ambience that tracks the ship's vitals.
// Drives the game headlessly through window.__doids; the shared per-test guard
// (navigate + fail on any console error) lives in tests/harness.js.
// See tests/README.md for what belongs in which file.
const { test, expect } = require("@playwright/test");
const { useGame } = require("./harness");

useGame(test, expect);

test("thrust noise stops when leaving play, even mid-thrust", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); window.initAudio(); });
  await page.evaluate(() => { input.thrust = true; });
  await page.waitForFunction(() => thrustGain && thrustGain.gain.value > 0, null, { timeout: 2000 });
  // pause without ever releasing thrust — the old bug left the loop playing behind the panel.
  // state flips synchronously in the keydown handler, but the gain is only zeroed on the next
  // update(dt) tick, so poll rather than reading it back in the same microtask.
  await page.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
  expect(await page.evaluate(() => __doids.get().paused)).toBe(true);
  await page.waitForFunction(() => thrustGain.gain.value === 0, null, { timeout: 2000 });
  await page.evaluate(() => { input.thrust = false; });
});

test("S2: the ambience level rises as vitals fall", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); window.initAudio(); });
  await page.evaluate(() => { ship.vitals = 90; });
  await page.waitForTimeout(150);
  const hi = await page.evaluate(() => __doids.get().vitalsAudioLevel);
  await page.evaluate(() => { ship.vitals = 10; });
  await page.waitForTimeout(150);
  const lo = await page.evaluate(() => __doids.get().vitalsAudioLevel);
  expect(lo).toBeGreaterThan(hi);   // hurt reads louder than healthy
});
