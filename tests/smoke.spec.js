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
