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

test("recovered logs persist across reload and the codex ARCHIVE pages (Bundle K)", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.evaluate(() => { grantFragment(false); grantFragment(false); });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  let s = await page.evaluate(() => __doids.get());
  expect(s.logsSeen).toEqual([0, 1]);
  // open the codex from the title, switch to ARCHIVE, page forward
  await page.waitForTimeout(700);
  const pill = await page.evaluate(() => window.codexRect());
  await page.mouse.click(pill.x + pill.w / 2, pill.y + pill.h / 2);
  await page.waitForTimeout(450);
  s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("codex");
  const tab = await page.evaluate(() => window.codexTabRect(1));
  await page.mouse.click(tab.x + tab.w / 2, tab.y + tab.h / 2);
  await page.waitForTimeout(120);
  s = await page.evaluate(() => __doids.get());
  expect(s.codexTab).toBe(1);
  const panel = await page.evaluate(() => window.codexPanelRect());
  await page.mouse.click(panel.x + panel.w * 0.75, panel.y + panel.h * 0.6);
  await page.waitForTimeout(120);
  s = await page.evaluate(() => __doids.get());
  expect(s.archivePage).toBe(1);
  // tapping outside the panel closes back to the title
  await page.mouse.click(panel.x + panel.w / 2, 4);
  await page.waitForTimeout(120);
  s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("title");
});

test("the answered ending plays the SOLACE epilogue and clears the haunt (Bundle L)", async ({ page }) => {
  // start haunted (as after an unresolved ending)
  await page.evaluate(() => localStorage.setItem("doids_unres", "1"));
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  let s = await page.evaluate(() => __doids.get());
  expect(s.unresolvedHaunt).toBe(true);
  // land beside the beacon and answer the call
  await page.evaluate(() => { __doids.go(7); __doids.launch(); __doids.warpBeacon(); });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 9000 });
  s = await page.evaluate(() => __doids.get());
  expect(s.endingType).toBe("answered");
  expect(s.unresolvedHaunt).toBe(false);   // the Static is heard; the title rests
  // the typed line arrives, then a tap advances to the ending card
  await page.waitForFunction(() => __doids.get().epilogueChars > 4, null, { timeout: 5000 });
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "ending", null, { timeout: 3000 });
});

test("seed 0 reproduces the authored campaign; remix re-rolls it (Bundle M)", async ({ page }) => {
  await page.evaluate(() => __doids.go(1));
  let sum = await page.evaluate(() => __doids.heightChecksum());
  expect(sum).toBe(1827470476);   // golden checksum: authored VESALIUS RIDGE terrain
  // remix: fresh seed, 7 famous minds drawn from the wider pool, briefing up
  await page.evaluate(() => __doids.remix());
  let s = await page.evaluate(() => __doids.get());
  expect(s.runMode).toBe("remix");
  expect(s.runSeed).toBeGreaterThan(0);
  expect(s.famousMap).toHaveLength(7);
  expect(s.state).toBe("brief");
  await page.evaluate(() => __doids.go(1));
  const remixSum = await page.evaluate(() => __doids.heightChecksum());
  expect(remixSum).not.toBe(1827470476);
  // a fresh campaign run restores seed 0 and the exact authored terrain
  await page.evaluate(() => { __doids.reset(); __doids.go(1); });
  sum = await page.evaluate(() => __doids.heightChecksum());
  expect(sum).toBe(1827470476);
});

test("the daily flight is one attempt per UTC day (Bundle M3)", async ({ page }) => {
  await page.evaluate(() => __doids.daily());
  let s = await page.evaluate(() => __doids.get());
  expect(s.runMode).toBe("daily");
  expect(s.dailyDone).toBe(true);
  expect(s.state).toBe("brief");
  // a second attempt the same day is refused at the title
  await page.evaluate(() => { __doids.reset(); state = "title"; });
  await page.evaluate(() => __doids.daily());
  s = await page.evaluate(() => __doids.get());
  expect(s.runMode).toBe("campaign");
  expect(s.state).toBe("title");
});

test("the counterfeit MERCY: docking springs the trap; the real bays still work (Bundle N)", async ({ page }) => {
  await page.evaluate(() => { __doids.go(7); __doids.launch(); });
  let s = await page.evaluate(() => __doids.get());
  expect(s.fakeMercy).toBeTruthy();
  expect(s.fakeMercy.dead).toBe(false);
  const before = await page.evaluate(() => __doids.get().score);
  // hold the ship inside the decoy's bay — after 2s the bay shows its teeth
  await page.evaluate(() => {
    ship.x = level.fakeMercy.x; ship.y = level.fakeMercy.y + 70;
    ship.vx = ship.vy = 0; ship.landed = true;   // pin it for the dwell
  });
  await page.waitForFunction(() => level.fakeMercy.dead, null, { timeout: 5000 });
  s = await page.evaluate(() => __doids.get());
  expect(s.decoyOutcome).toBe("trapped");
  expect(s.state).toBe("reveal");   // the log-style card
  expect(s.score).toBeLessThanOrEqual(Math.max(0, before - 200) + 5);
  // the real MERCY's bay is untouched by the decoy machinery
  const realBayOk = await page.evaluate(() => {
    const b = bayRects().med;
    return b.x0 < level.mx && level.mx < b.x1;
  });
  expect(realBayOk).toBe(true);
});

test("the counterfeit MERCY yields to observation: landed scan powers it down for +800 (Bundle N3)", async ({ page }) => {
  await page.evaluate(() => { __doids.go(7); __doids.launch(); });
  await page.evaluate(() => {
    level.turrets.forEach(t => { t.alive = false; });
    level.drones.forEach(d => { d.alive = false; });
    // park the stranded Scions far away so none boards (+500) mid-scan
    level.oids.forEach(o => { o.x = 150; o.home = 150; });
    const f = level.fakeMercy;
    ship.x = f.x; ship.y = __doids.ground(f.x) - 11;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true;
  });
  const before = await page.evaluate(() => __doids.get().score);
  await page.waitForFunction(() => level.fakeMercy.dead, null, { timeout: 9000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.decoyOutcome).toBe("observed");
  expect(s.score).toBe(before + 800);
  expect(s.scannedSecret).toBe(true);
  expect(s.firedAtSecret).toBe(false);   // observed, not shot — the oath holds
  // the beacon is still there: both endings remain reachable
  expect(s.level.beacon.resolved).toBe(false);
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

test("stranding at 0 fuel: the signal brings a drone, a primer, and a line", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); __doids.strand(); });
  let s = await page.evaluate(() => __doids.get());
  expect(s.ship.fuel).toBe(0);
  expect(s.ship.landed).toBe(true);
  await page.evaluate(() => { input.thrust = true; });
  await page.waitForFunction(() => __doids.get().resupplyDrone !== null, null, { timeout: 4000 });
  await page.waitForFunction(() => (__doids.get().resupplyDrone || {}).phase === "line", null, { timeout: 4000 });
  await page.evaluate(() => { input.thrust = false; });
  s = await page.evaluate(() => __doids.get());
  expect(s.ship.fuel).toBeGreaterThan(6);   // the primer mist — enough to reach the line
});

test("the transfusion line: hover to flow, shield forced down, FIRE detaches cleanly", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); });
  await page.evaluate(() => {
    level.turrets.forEach(t => { t.alive = false; });
    level.drones.forEach(d => { d.alive = false; });
    __doids.strand();
    input.thrust = true;
  });
  await page.waitForFunction(() => (__doids.get().resupplyDrone || {}).phase === "line", null, { timeout: 6000 });
  await page.evaluate(() => { input.thrust = false; });
  // simulate holding the hover: pin the ship inside the capture window
  await page.evaluate(() => {
    window.__pin = setInterval(() => {
      if (!resupplyDrone) return;
      const cp = capturePoint(resupplyDrone);
      ship.x = cp.x; ship.y = cp.y; ship.vx = ship.vy = 0; ship.landed = false;
    }, 30);
  });
  await page.waitForFunction(() => (__doids.get().resupplyDrone || {}).attachedNow === true, null, { timeout: 4000 });
  const f0 = await page.evaluate(() => __doids.get().ship.fuel);
  await page.waitForFunction(f => __doids.get().ship.fuel > f + 6, f0, { timeout: 4000 });
  // the umbilical forces the shield down
  await page.evaluate(() => { input.shield = true; });
  await page.waitForTimeout(150);
  let s = await page.evaluate(() => __doids.get());
  expect(s.ship.shield).toBe(false);
  // tap FIRE: it detaches instead of shooting
  await page.evaluate(() => { clearInterval(window.__pin); input.shield = false; input.fire = true; });
  await page.waitForTimeout(120);
  await page.evaluate(() => {
    input.fire = false;
    // set the ship down so the post-detach free-fall can't muddy the test
    ship.y = __doids.ground(ship.x) - 11; ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true;
  });
  await page.waitForFunction(() => __doids.get().resupplyDrone === null, null, { timeout: 4000 });
  s = await page.evaluate(() => __doids.get());
  expect(s.ship.fuel).toBeGreaterThan(f0 + 6);   // the flow was kept on release
  expect(s.runFired).toBe(0);                    // the detach tap never became a shot
  expect(s.state).toBe("play");
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
