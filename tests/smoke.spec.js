// Hollow Oath — smoke suite.
// Drives the game headlessly through window.__doids (see GAME_DESIGN.md §9).
// Pattern for new tests: page.evaluate(() => __doids.go(n)) etc., then assert
// on __doids.get(). When you add a feature, expose its state in __doids.get()
// and add a test here (see APP_STORE_ROADMAP.md — "How to work on this").
const { test, expect } = require("@playwright/test");
const path = require("path");

const GAME_URL = "file://" + path.resolve(__dirname, "..", "index.html");

// every test records console errors / uncaught exceptions and fails on them
let errors = [];
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => {
    if (m.type() === "error") errors.push("console.error: " + m.text());
  });
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
});
test.afterEach(() => {
  expect(errors, "no console errors or uncaught exceptions").toEqual([]);
});

test("boots to the title screen", async ({ page }) => {
  await expect(page).toHaveTitle("Hollow Oath — a gravity rescue");
  const s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("title");
  expect(s.lives).toBe(3);
  expect(s.score).toBe(0);
});

test("all 8 sectors generate and run", async ({ page }) => {
  for (let n = 0; n < 8; n++) {
    await page.evaluate(i => { __doids.go(i); __doids.launch(); }, n);
    await page.waitForTimeout(250); // let the sim run a few frames
    const s = await page.evaluate(() => __doids.get());
    expect(s.state, `sector ${n} is playable`).toBe("play");
    expect(s.levelIdx).toBe(n);
    expect(s.ship.dead).toBe(false);
    expect(s.level.total).toBeGreaterThanOrEqual(0);
  }
});

test("finale sector has the beacon; campaign sectors have black boxes", async ({ page }) => {
  await page.evaluate(() => { __doids.go(7); __doids.launch(); });
  let s = await page.evaluate(() => __doids.get());
  expect(s.level.isFinale).toBe(true);
  expect(s.level.beacon).toBeTruthy();
  await page.evaluate(() => { __doids.go(2); __doids.launch(); });
  s = await page.evaluate(() => __doids.get());
  expect(s.level.blackbox).toBeTruthy();
});

test("secret lift descends into the Hollows", async ({ page }) => {
  // sector 1 hides a lift; land on it and hold ~2.4s
  await page.evaluate(() => { __doids.go(1); __doids.launch(); __doids.warpLift(); });
  await page.waitForFunction(() => __doids.get().inCave, null, { timeout: 6000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.inCave).toBe(true);
  expect(s.level.shrine).toBeTruthy();
  expect(s.state).toBe("play");
});

test("landing evaluator and rank flags are exposed", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  const ev = await page.evaluate(() => __doids.evalLanding());
  expect(ev).toHaveProperty("soft");
  expect(ev).toHaveProperty("survivable");
  const s = await page.evaluate(() => __doids.get());
  // HOLLOW KEEPER rank machinery (see GAME_DESIGN.md §2.5)
  expect(s.firedAtSecret).toBe(false);
  expect(s.firedAtCombat).toBe(false);
  expect(s.runFired).toBe(0);
});

test("run checkpoints and resumes after reload", async ({ page }) => {
  await page.evaluate(() => { __doids.go(3); __doids.launch(); });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  const s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("title");
  expect(s.hasSave).toBe(true);
});

test("pause freezes play and resume returns to it", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
  let s = await page.evaluate(() => __doids.get());
  expect(s.paused).toBe(true);
  await page.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
  s = await page.evaluate(() => __doids.get());
  expect(s.paused).toBe(false);
  expect(s.state).toBe("play");
});

test("settings persist across reload and the sound toggle gates sfxGain", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("doids_snd", "0");
    localStorage.setItem("doids_mus", "0");
  });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.evaluate(() => window.initAudio());   // module-scoped fn on a classic <script> == a window property
  const s = await page.evaluate(() => __doids.get());
  expect(s.sound).toBe(false);
  expect(s.music).toBe(false);
  expect(s.sfxGainValue).toBe(0);
});

test("settings panel opens from the title pill and toggles ASSIST", async ({ page }) => {
  await page.waitForTimeout(700);   // clear the title's stateT > 0.6 just-arrived guard
  const pill = await page.evaluate(() => window.settingsRect());
  await page.mouse.click(pill.x + pill.w / 2, pill.y + pill.h / 2);
  await page.waitForTimeout(50);
  let s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("settings");
  const before = s.assist;
  await page.waitForTimeout(350);   // clear the stateT > 0.3 just-opened guard
  const assistRow = await page.evaluate(() => window.settingsRowRect(3));
  await page.mouse.click(assistRow.x + assistRow.w / 2, assistRow.y + assistRow.h / 2);
  await page.waitForTimeout(50);
  s = await page.evaluate(() => __doids.get());
  expect(s.assist).toBe(!before);
});

test("FIELD MEDIC / colorblind / big text persist and take effect (Bundle H)", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("doids_easy", "1");
    localStorage.setItem("doids_cb", "1");
    localStorage.setItem("doids_bigtext", "1");
  });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  let s = await page.evaluate(() => __doids.get());
  expect(s.easyMode).toBe(true);
  expect(s.colorblind).toBe(true);
  expect(s.bigText).toBe(true);
  // FIELD MEDIC: a fresh run launches with 5 lives
  await page.evaluate(() => { __doids.reset(); __doids.go(0); __doids.launch(); });
  s = await page.evaluate(() => __doids.get());
  expect(s.lives).toBe(5);
  expect(s.state).toBe("play");
});

test("the 41-second clock runs only from sector 4 on and surges on period (Bundle I)", async ({ page }) => {
  // sector 2: the clock must not accumulate
  await page.evaluate(() => { __doids.go(2); __doids.launch(); });
  await page.waitForTimeout(400);
  let s = await page.evaluate(() => __doids.get());
  expect(s.staticClock).toBe(0);
  expect(s.staticSurge).toBe(0);
  // sector 4: wind the clock to just under the period and watch it fire
  await page.evaluate(() => { __doids.go(4); __doids.launch(); __doids.setStaticClock(40.8); });
  await page.waitForFunction(() => __doids.get().staticSurge > 0, null, { timeout: 3000 });
  s = await page.evaluate(() => __doids.get());
  expect(s.staticClock).toBeLessThan(1);   // wrapped, not still climbing
  expect(s.staticSurge).toBeGreaterThan(0);
  expect(s.staticSurge).toBeLessThanOrEqual(0.6);
});

test("a landed 6s scan unmasks a lure-tree without breaking the oath (Bundle J)", async ({ page }) => {
  await page.evaluate(() => { __doids.go(5); __doids.launch(); });
  // clear the guns so the scan test can't be shot mid-hold
  await page.evaluate(() => {
    level.turrets.forEach(t => { t.alive = false; });
    level.drones.forEach(d => { d.alive = false; });
  });
  const warped = await page.evaluate(() => __doids.warpScenery("fake"));
  expect(warped).toBe(true);
  await page.waitForFunction(() => __doids.get().scannedSecret, null, { timeout: 9000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.scannedSecret).toBe(true);
  expect(s.runFired).toBe(0);
  expect(s.firedAtSecret).toBe(false);   // the oath flag stays clean
  const treeDead = await page.evaluate(() => level.scenery.some(c => c.fake && c.dead));
  expect(treeDead).toBe(true);
});

test("every sector briefing renders", async ({ page }) => {
  // the story tables (SECTOR_NAMES, BRIEFS, …) are module-scoped, so verify
  // them behaviourally: go(n) throws on a missing entry, the briefing screen
  // renders a frame, and afterEach fails the test on any page error
  for (let n = 0; n < 8; n++) {
    await page.evaluate(i => __doids.go(i), n);
    const s = await page.evaluate(() => __doids.get());
    expect(s.state, `sector ${n} briefing`).toBe("brief");
    await page.waitForTimeout(60);
  }
});

test("stranding at 0 fuel is recoverable via the resupply signal", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); __doids.strand(); });
  let s = await page.evaluate(() => __doids.get());
  expect(s.ship.fuel).toBe(0);
  expect(s.ship.landed).toBe(true);
  await page.evaluate(() => { input.thrust = true; });
  await page.waitForFunction(() => __doids.get().resupplyDrone !== null, null, { timeout: 4000 });
  await page.waitForFunction(() => __doids.get().resupplyDrone === null, null, { timeout: 4000 });
  await page.evaluate(() => { input.thrust = false; });
  s = await page.evaluate(() => __doids.get());
  expect(s.ship.fuel).toBeGreaterThan(0);
});

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

test("riding the lift back up lands the ship ON the pad, not below ground", async ({ page }) => {
  // regression: exitCave used to restore the mid-transit Y captured after
  // the descent animation had sunk the ship ~40px into the pad, leaving the
  // ship embedded in terrain on return (it snapped to the surface on thrust)
  await page.evaluate(() => { __doids.go(3); __doids.launch(); __doids.warpLift(); });
  await page.waitForFunction(() => __doids.get().inCave && !liftTransit, null, { timeout: 8000 });
  // the return lift spawns un-armed (you must leave the pad once) — step off, then back on
  await page.evaluate(() => { ship.x = 600; });
  await page.waitForTimeout(120);
  await page.evaluate(() => __doids.warpLift());
  await page.waitForFunction(() => !__doids.get().inCave && !liftTransit, null, { timeout: 8000 });
  const r = await page.evaluate(() => {
    const s = __doids.get();
    return { y: s.ship.y, rest: __doids.ground(s.ship.x) - 11, landed: s.ship.landed };
  });
  expect(r.landed).toBe(true);
  expect(Math.abs(r.y - r.rest)).toBeLessThan(0.75);   // resting exactly on the surface
});

test("lift transition fades out, swaps level, and fades back in", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); __doids.warpLift(); });
  // "black" is a full 0.3s window before the swap — safe to poll on, unlike
  // fade>0.95 which the tail of "black" and the head of "reveal" both hit
  await page.waitForFunction(() => liftTransit && liftTransit.phase === "black", null, { timeout: 6000 });
  const mid = await page.evaluate(() => __doids.get().inCave);
  expect(mid).toBe(false);   // still the surface level while the screen is black
  await page.waitForFunction(() => !liftTransit, null, { timeout: 6000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.inCave).toBe(true);
  expect(s.state).toBe("play");
});
