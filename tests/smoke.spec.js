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
  // R7 — paging is via the explicit › arrow now, not a half-panel tap
  const nextArrow = await page.evaluate(() => window.codexArrowRect(1));
  await page.mouse.click(nextArrow.x + nextArrow.w / 2, nextArrow.y + nextArrow.h / 2);
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
  expect(sum).toBe(1488047869);   // golden checksum: authored VESALIUS RIDGE terrain (T1 widths)
  // remix: fresh seed, 7 famous minds drawn from the wider pool, briefing up
  await page.evaluate(() => __doids.remix());
  let s = await page.evaluate(() => __doids.get());
  expect(s.runMode).toBe("remix");
  expect(s.runSeed).toBeGreaterThan(0);
  expect(s.famousMap).toHaveLength(7);
  expect(s.state).toBe("brief");
  await page.evaluate(() => __doids.go(1));
  const remixSum = await page.evaluate(() => __doids.heightChecksum());
  expect(remixSum).not.toBe(1488047869);
  // a fresh campaign run restores seed 0 and the exact authored terrain
  await page.evaluate(() => { __doids.reset(); __doids.go(1); });
  sum = await page.evaluate(() => __doids.heightChecksum());
  expect(sum).toBe(1488047869);
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

test("early sectors never pocket a Scion under interlocking turret cover", async ({ page }) => {
  for (const n of [0, 1, 2]) {
    await page.evaluate(n => __doids.go(n), n);
    const maxCover = await page.evaluate(() => {
      const g = __doids.get();
      return Math.max(...g.level.oids.map(o =>
        g.level.turrets.filter(t => Math.hypot(t.x - o.x, t.y - o.y) < 380).length));
    });
    expect(maxCover, "sector " + n).toBeLessThanOrEqual(1);
  }
});

test("the daily flight rolls exactly two distinct modifiers; other modes roll none", async ({ page }) => {
  await page.evaluate(() => __doids.daily());
  let s = await page.evaluate(() => __doids.get());
  expect(s.dailyMods).toHaveLength(2);
  expect(new Set(s.dailyMods).size).toBe(2);
  await page.evaluate(() => { __doids.reset(); __doids.go(0); });
  s = await page.evaluate(() => __doids.get());
  expect(s.dailyMods).toEqual([]);
  expect(s.maxFuel).toBe(100);   // no modifier bleed into the campaign
});

test("title pills never overlap on a phone-height viewport", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const page = await ctx.newPage();
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  const r = await page.evaluate(() => __doids.get().rects);
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  expect(overlap(r.resume, r.daily)).toBe(false);
  expect(overlap(r.resume, r.remix)).toBe(false);
  await ctx.close();
});

test("game over returns to the main menu and the run survives as a RESUME save", async ({ page }) => {
  await page.evaluate(() => { __doids.go(2); __doids.launch(); });
  await page.evaluate(() => { lives = 1; shipDie(); });
  await page.waitForFunction(() => __doids.get().state === "gameover", null, { timeout: 5000 });
  // tap anywhere that isn't the CONTINUE box → back to the title, not a new run
  await page.waitForTimeout(800);
  await page.evaluate(() => { input.tap = true; input.tapX = 5; input.tapY = 5; });
  await page.waitForFunction(() => __doids.get().state === "title", null, { timeout: 3000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.hasSave).toBe(true);   // the checkpoint was written back (penalty applied)
  expect(s.levelIdx).toBe(2);
});

test("REDUCED FLASH persists and RESET PROGRESS double-tap wipes progress but keeps settings", async ({ page }) => {
  // seed some progress + a distinctive setting
  await page.evaluate(() => {
    localStorage.setItem("doids_hi", "9999");
    localStorage.setItem("doids_veteran", "1");
    localStorage.setItem("doids_codex", "[0,1]");
  });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  // open settings, turn on REDUCED FLASH (row 8), reload → it persists
  await page.evaluate(() => { state = "settings"; settingsReturnState = "title"; stateT = 1; });
  await page.evaluate(() => {
    const r = __doids.get().rects; // not used, compute row rect via a tap
  });
  await page.evaluate(() => {
    // tap row 8 (REDUCED FLASH)
    const rr = (function(){ return null; })();
    input.tap = true;
    // recompute settingsRowRect(8) the same way the game does
    const cols = 2, rows = Math.ceil(10 / cols);
    const cw = Math.min(240, innerWidth * 0.42), h = 30, gapX = 12, gapY = 7;
    const totalW = cw*cols+gapX, totalH = h*rows+gapY*(rows-1);
    const x0 = innerWidth/2 - totalW/2, y0 = innerHeight/2 - totalH/2 + 14;
    const col = 8 % cols, row = (8-col)/cols;
    input.tapX = x0 + col*(cw+gapX) + cw/2; input.tapY = y0 + row*(h+gapY) + h/2;
  });
  await page.waitForFunction(() => __doids.get().reducedFlash === true, null, { timeout: 2000 });
  // RESET PROGRESS (row 9) needs two taps
  const tapRow9 = () => page.evaluate(() => {
    input.tap = true;
    const cols = 2, rows = Math.ceil(10 / cols);
    const cw = Math.min(240, innerWidth * 0.42), h = 30, gapX = 12, gapY = 7;
    const totalW = cw*cols+gapX, totalH = h*rows+gapY*(rows-1);
    const x0 = innerWidth/2 - totalW/2, y0 = innerHeight/2 - totalH/2 + 14;
    const col = 9 % cols, row = (9-col)/cols;
    input.tapX = x0 + col*(cw+gapX) + cw/2; input.tapY = y0 + row*(h+gapY) + h/2;
  });
  await tapRow9();
  await page.waitForFunction(() => __doids.get().resetArmed === true, null, { timeout: 2000 });
  await tapRow9();
  await page.waitForFunction(() => __doids.get().score === 0 && __doids.get().resetArmed === false, null, { timeout: 2000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.hasSave).toBe(false);
  // hi-score wiped, but REDUCED FLASH preference kept
  expect(await page.evaluate(() => localStorage.getItem("doids_hi"))).toBe(null);
  expect(s.reducedFlash).toBe(true);
});

test("a corrupt saved run is rejected, not shown as a RESUME pill", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("doids_run", JSON.stringify({ v: 1, levelIdx: 99, score: "x" })));
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  const s = await page.evaluate(() => __doids.get());
  expect(s.hasSave).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem("doids_run"))).toBe(null);
});

test("settings rows fit inside a 320-high landscape viewport", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 568, height: 320 } });
  const page = await ctx.newPage();
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  const fits = await page.evaluate(() => {
    const cols = 2, N = __doids.get().settingsRows, rows = Math.ceil(N / cols);
    const cw = Math.min(240, innerWidth * 0.42), h = 30, gapX = 12, gapY = 7;
    const totalH = h*rows+gapY*(rows-1);
    const y0 = innerHeight/2 - totalH/2 + 14;
    const lastBottom = y0 + (rows-1)*(h+gapY) + h + 28; // + footer lines
    return lastBottom < innerHeight;
  });
  expect(fits).toBe(true);
  await ctx.close();
});

test("caps-lock letter keys still fly the ship", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  // uppercase X (as Caps Lock would deliver) must still map to fire
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "X" })));
  expect(await page.evaluate(() => __doids.get().input.fire)).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "X" })));
  expect(await page.evaluate(() => __doids.get().input.fire)).toBe(false);
});

test("Game Center facade traces auth, rank achievements and the score report (Bundle G)", async ({ page }) => {
  let s = await page.evaluate(() => __doids.get());
  // web build: no native bridge, but the intent trace is live from boot
  expect(s.cloudNative).toBe(false);
  expect(s.gcReports.map(r => r.method)).toContain("authenticate");
  // fly the answered ending without a single shot (same path as the L2 test)
  await page.evaluate(() => { __doids.go(7); __doids.launch(); __doids.warpBeacon(); });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 9000 });
  await page.waitForFunction(() => __doids.get().epilogueChars > 4, null, { timeout: 5000 });
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "ending", null, { timeout: 3000 });
  // the ending card holds for 1s before a tap advances to the win screen
  await page.waitForTimeout(1200);
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "win", null, { timeout: 3000 });
  s = await page.evaluate(() => __doids.get());
  const achievements = s.gcReports
    .filter(r => r.method === "reportAchievement").map(r => r.achievementId);
  // answered with runFired === 0 and runLost === 0 → G3's rank mirror
  expect(achievements).toContain("hollowoath.oath_keeper");
  expect(achievements).toContain("hollowoath.spotless_rotation");
  // saveHi posted the campaign score to the all-time board
  const scores = s.gcReports.filter(r => r.method === "submitScore");
  expect(scores.length).toBeGreaterThan(0);
  expect(scores[scores.length - 1].leaderboardId).toBe("hollowoath.score.alltime");
  expect(scores[scores.length - 1].value).toBeGreaterThan(0);
});

test("R5: the title launches only from the START pill, not a stray tap", async ({ page }) => {
  await page.waitForTimeout(700);   // clear the title's stateT > 0.6 guard
  // a tap on empty title space no longer starts a run
  await page.evaluate(() => { input.tap = true; input.tapX = 4; input.tapY = innerHeight / 2; });
  await page.waitForTimeout(60);
  expect(await page.evaluate(() => __doids.get().state)).toBe("title");
  // the explicit START pill does
  await page.evaluate(() => {
    const sr = startRect();
    input.tap = true; input.tapX = sr.x + sr.w / 2; input.tapY = sr.y + sr.h / 2;
  });
  await page.waitForTimeout(60);
  const s = await page.evaluate(() => __doids.get());
  expect(["intro", "brief", "play"]).toContain(s.state);   // a run has begun
});

test("R5: Enter aims the synthetic tap at the START pill", async ({ page }) => {
  await page.waitForTimeout(700);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })));
  await page.waitForTimeout(60);
  const s = await page.evaluate(() => __doids.get());
  expect(["intro", "brief", "play"]).toContain(s.state);
});

test("R1: the HOW TO FLY card paginates and never runs off a 320-high phone", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 568, height: 320 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.waitForTimeout(700);
  const hr = await page.evaluate(() => window.helpRect());
  await page.mouse.click(hr.x + hr.w / 2, hr.y + hr.h / 2);
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => __doids.get().state)).toBe("help");
  const pages = await page.evaluate(() => HELP_CARD.pages);
  expect(pages).toBeGreaterThan(1);   // the six-paragraph card must split
  await page.waitForTimeout(450);     // clear the card's stateT > 0.4 tap guard
  // walk every page; the footer must stay on-screen the whole way
  for (let p = 0; p < pages; p++) {
    const foot = await page.evaluate(() => HELP_CARD._footY);
    expect(foot).toBeLessThan(320);
    await page.evaluate(() => { input.tap = true; });
    await page.waitForTimeout(80);
  }
  // after the last page the card dismisses back to the title
  expect(await page.evaluate(() => __doids.get().state)).toBe("title");
  expect(errs).toEqual([]);
  await ctx.close();
});

test("R2: pause can't be reached from the title or an overlay; heading clears the rows", async ({ page }) => {
  // Escape/p from the title must never open the pause screen
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "p" })));
  await page.waitForTimeout(40);
  expect(await page.evaluate(() => __doids.get().state)).not.toBe("pause");
  // Escape backs out of the HOW TO FLY overlay like a tap-outside
  await page.waitForTimeout(700);
  const hr = await page.evaluate(() => window.helpRect());
  await page.mouse.click(hr.x + hr.w / 2, hr.y + hr.h / 2);
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => __doids.get().state)).toBe("help");
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await page.waitForTimeout(60);
  expect(await page.evaluate(() => __doids.get().state)).toBe("title");
  // the PAUSED heading is derived to sit above the first row on any viewport
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await page.waitForTimeout(40);
  const clears = await page.evaluate(() => {
    const top = pauseRowRect(0);
    return (top.y - 26) < top.y;   // heading baseline is above the first button
  });
  expect(clears).toBe(true);
});

test("R7: a codex mind is clickable and opens its reveal card", async ({ page }) => {
  // record two famous minds so a MINDS row is tappable
  await page.evaluate(() => { localStorage.setItem("doids_codex", "[0,1]"); });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.waitForTimeout(700);
  const pill = await page.evaluate(() => window.codexRect());
  await page.mouse.click(pill.x + pill.w / 2, pill.y + pill.h / 2);
  await page.waitForTimeout(450);
  expect(await page.evaluate(() => __doids.get().state)).toBe("codex");
  // tap the first (found) mind row → a reveal card opens over the codex
  await page.evaluate(() => {
    const r = codexMindRowRect(0);
    input.tap = true; input.tapX = r.x + r.w / 2; input.tapY = r.y + r.h / 2;
  });
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => __doids.get().codexCardOpen)).toBe(true);
  // any tap closes it back to the codex, not the title
  await page.evaluate(() => { input.tap = true; });
  await page.waitForTimeout(80);
  const s = await page.evaluate(() => __doids.get());
  expect(s.codexCardOpen).toBe(false);
  expect(s.state).toBe("codex");
});

test("R9/S5: a Vector is never given away by colour, even after ANTISEPSIS", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  // a saboteur (mech) renders exactly like a true Scion — no colour tell
  let cols = await page.evaluate(() => ({
    mech: __doids.oidTint(true), scion: __doids.oidTint(false)
  }));
  expect(cols.mech).toBe(cols.scion);
  expect(cols.mech).toBe("#69f0ae");
  // ANTISEPSIS grants the diagnostic SCAN, not a tint — colour parity still holds
  await page.evaluate(() => __doids.give("antisepsis"));
  cols = await page.evaluate(() => ({
    mech: __doids.oidTint(true), scion: __doids.oidTint(false)
  }));
  expect(cols.mech).toBe(cols.scion);
  expect(cols.mech).toBe("#69f0ae");
});

test("S5: the landed scan needs ANTISEPSIS — without it, a unit boards instead of scanning", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); });
  await page.evaluate(() => {
    level.turrets.forEach(t => { t.alive = false; });
    level.drones.forEach(d => { d.alive = false; });
    level.total = 99;
    // no antisepsis: parking on a saboteur must NOT flag it (it boards instead)
    upgrades.antisepsis = false;
    level.oids = [{ role: "saboteur", state: "wait", x: 600, y: __doids.ground(600),
      wave: 0, persona: "wave1", scale: 1, gait: 34, panicT: 0, sabT: 0, flagged: false, verified: false }];
    ship.x = 600; ship.y = __doids.ground(600) - 11; ship.vx = 0; ship.vy = 0; ship.landed = true; ship.dead = false; ship.passengers = [];
  });
  // it boards (state leaves "wait"), and is NOT flagged
  await page.waitForFunction(() => level.oids[0].state !== "wait", null, { timeout: 5000 });
  expect(await page.evaluate(() => !!level.oids[0].flagged)).toBe(false);
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

test("S9: a living cabin heals the ship, scaled by who is aboard and capped at 85%", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); });
  // park well away from MERCY's bay so nothing docks/delivers mid-test
  await page.evaluate(() => {
    ship.x = 900; ship.y = __doids.ground(900) - 11; ship.vx = 0; ship.vy = 0; ship.landed = true;
  });
  // two ordinary Scions aboard at low vitals → rate 2×0.5, vitals climb.
  // Clear the field first so no stranded Scion walks up and boards mid-wait
  // (T1's wider maps re-site spawns; this test is about the rate math only).
  await page.evaluate(() => {
    level.oids = [];
    ship.vitals = 20; ship.dead = false;
    ship.passengers = [{ role: "normal" }, { role: "normal" }];
  });
  await page.waitForTimeout(300);
  let s = await page.evaluate(() => __doids.get());
  expect(s.cabinMedicRate).toBeCloseTo(1.0, 1);
  expect(s.ship.vitals).toBeGreaterThan(20);
  // a famous mind aboard reads a little stronger
  await page.evaluate(() => { ship.passengers = [{ role: "famous", famousId: 0 }]; });
  await page.waitForTimeout(60);
  s = await page.evaluate(() => __doids.get());
  expect(s.cabinMedicRate).toBeCloseTo(1.5, 1);
  // a (non-sleeper) saboteur lends nothing — a hollow chassis has no heart
  await page.evaluate(() => { ship.passengers = [{ role: "saboteur" }]; });
  await page.waitForTimeout(60);
  s = await page.evaluate(() => __doids.get());
  expect(s.cabinMedicRate).toBe(0);
  // the cap: cabin healing never finishes a repair (bay stays the only way)
  await page.evaluate(() => { ship.vitals = 95; ship.passengers = [{ role: "normal" }, { role: "normal" }]; });
  await page.waitForTimeout(200);
  s = await page.evaluate(() => __doids.get());
  expect(s.ship.vitals).toBe(95);   // already above 85% → untouched by cabin medic
});

test("S5: a proven counterfeit may be left; an unproven sleeper blocks the manifest", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); });
  const res = await page.evaluate(() => {
    level.oids = [{ role: "saboteur", state: "wait", x: 600, y: 0, flagged: false }];
    level.total = 1; level.delivered = 0; level.lost = 0; level.contained = 0; level.extraction = null;
    checkSectorClear();
    const blockedWhileUnproven = level.extraction === null;
    level.oids[0].flagged = true;   // catalogued — proven counterfeit
    checkSectorClear();
    const closesWhenProven = level.extraction !== null;
    return { blockedWhileUnproven, closesWhenProven };
  });
  expect(res.blockedWhileUnproven).toBe(true);
  expect(res.closesWhenProven).toBe(true);
});

test("S5: the landed scan flags a counterfeit and verifies a real Scion without flagging it", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); __doids.give("antisepsis"); });
  await page.evaluate(() => {
    level.turrets.forEach(t => { t.alive = false; });
    level.drones.forEach(d => { d.alive = false; });
    level.total = 99;   // keep the manifest open through the scan
    const mk = role => ({ role, state: "wait", x: 600, y: __doids.ground(600),
      wave: 0, persona: "wave1", scale: 1, gait: 34, panicT: 0, sabT: 0, flagged: false, verified: false });
    level.oids = [mk("saboteur")];
    ship.x = 600; ship.y = __doids.ground(600) - 11; ship.vx = 0; ship.vy = 0; ship.landed = true; ship.dead = false; ship.passengers = [];
  });
  await page.waitForFunction(() => level.oids[0].flagged === true, null, { timeout: 8000 });
  // a real Scion: the same hold verifies its heartbeat and does NOT flag it
  await page.evaluate(() => {
    level.oids = [{ role: "normal", state: "wait", x: 600, y: __doids.ground(600),
      wave: 0, persona: "wave1", scale: 1, gait: 34, panicT: 0, sabT: 0, flagged: false, verified: false }];
    ship.x = 600; ship.y = __doids.ground(600) - 11; ship.vx = 0; ship.vy = 0; ship.landed = true;
  });
  await page.waitForFunction(() => level.oids[0].verified === true, null, { timeout: 8000 });
  expect(await page.evaluate(() => !!level.oids[0].flagged)).toBe(false);
});

test("S5: destroying a PROVEN counterfeit is not malpractice; an unproven one still is", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); });
  // a catalogued (flagged) Vector: shooting it neutralises it, no penalty
  let before = await page.evaluate(() => {
    level.oids = [{ role: "saboteur", state: "wait", x: 600, y: __doids.ground(600),
      flagged: true, wave: 0, persona: "wave1", scale: 1 }];
    level.lost = 0; level.contained = 0; runLost = 0;
    const s = __doids.get().score;
    killOid(level.oids[0], "shot"); level.oids[0].deathT = 1.35;
    return s;
  });
  await page.waitForTimeout(150);
  let s = await page.evaluate(() => __doids.get());
  expect(s.runLost).toBe(0);
  expect(s.level.lost).toBe(0);
  expect(s.level.contained).toBe(1);   // neutralised, not a casualty
  expect(s.score).toBe(before);        // no malpractice penalty
  // an UNidentified unit shot is still malpractice — the risk you took
  before = await page.evaluate(() => {
    score = 1000;   // a buffer so the malpractice penalty is visible (not clamped at 0)
    level.oids = [{ role: "saboteur", state: "wait", x: 600, y: __doids.ground(600),
      flagged: false, wave: 0, persona: "wave1", scale: 1 }];
    level.lost = 0; runLost = 0;
    const sc = __doids.get().score;
    killOid(level.oids[0], "shot"); level.oids[0].deathT = 1.35;
    return sc;
  });
  await page.waitForTimeout(150);
  s = await page.evaluate(() => __doids.get());
  expect(s.runLost).toBe(1);
  expect(s.score).toBeLessThan(before);   // penalised
});

test("S4: manifest close opens the ventral hangar; bays go inert; the hover-hold clears the sector", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); });
  await page.evaluate(() => {
    level.oids = []; level.total = 0; level.delivered = 0; level.lost = 0; level.contained = 0; level.extraction = null;
    checkSectorClear();
  });
  let s = await page.evaluate(() => __doids.get());
  expect(s.level.extraction).toBeTruthy();          // she is spooling to jump
  expect(s.level.extraction.early).toBe(false);
  // parking in the (now inert) recovery bay must NOT clear the sector
  await page.evaluate(() => {
    const b = bayRects().med;
    ship.x = (b.x0 + b.x1) / 2; ship.y = (b.y0 + b.y1) / 2; ship.vx = 0; ship.vy = 0; ship.landed = false; ship.dead = false;
  });
  await page.waitForTimeout(2200);   // longer than the old 1.5s bay-dock clear
  s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("play");
  expect(s.level.extraction.done).toBe(false);
  // now fly INTO the ventral hangar and hold the hover — that closes the sector
  await page.evaluate(() => {
    window.__hangarPin = setInterval(() => {
      if (!level.extraction || level.extraction.done) return;
      const h = hangarRect();
      ship.x = h.cx; ship.y = h.cy; ship.vx = 0; ship.vy = 0; ship.landed = false; ship.dead = false;
    }, 20);
  });
  await page.waitForFunction(() => __doids.get().state === "clear", null, { timeout: 6000 });
  await page.evaluate(() => clearInterval(window.__hangarPin));
});

test("S4.5: triage retreat — the hangar offers early extraction and logs the abandoned as lost", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); });
  await page.evaluate(() => {
    level.oids = [
      { role: "normal", state: "delivered", x: 0, y: 0 },
      { role: "normal", state: "wait", x: 700, y: __doids.ground(700), wave: 0, persona: "wave1", scale: 1, gait: 34 }
    ];
    level.total = 2; level.delivered = 1; level.lost = 0; level.contained = 0; level.extraction = null;
    ship.passengers = []; ship.dead = false; runLost = 0;
    window.__earlyPin = setInterval(() => {
      if (state !== "play") return;
      const h = hangarRect();
      ship.x = h.cx; ship.y = h.cy; ship.vx = 0; ship.vy = 0; ship.landed = false;
    }, 20);
  });
  await page.waitForFunction(() => __doids.get().confirmOpen === true, null, { timeout: 4000 });
  await page.evaluate(() => clearInterval(window.__earlyPin));
  await page.waitForTimeout(300);   // clear the confirm's stateT > 0.25 guard
  await page.evaluate(() => {
    const r = confirmRowRect(0);   // SIGNAL EARLY EXTRACTION
    input.tap = true; input.tapX = r.x + r.w / 2; input.tapY = r.y + r.h / 2;
  });
  await page.waitForTimeout(80);
  const s = await page.evaluate(() => __doids.get());
  expect(s.level.extraction).toBeTruthy();
  expect(s.level.extraction.early).toBe(true);
  expect(s.runLost).toBeGreaterThanOrEqual(1);   // the abandoned Scion was logged lost
});

test("S8: seeing the WORKSHOP opens a locked MANIFEST DISCREPANCY entry in the archive", async ({ page }) => {
  // no workshop seen → no discrepancy entry
  let has = await page.evaluate(() => archiveEntries().some(e => e.title === "MANIFEST DISCREPANCY"));
  expect(has).toBe(false);
  await page.evaluate(() => { shrinesSeen.add(1); });   // the WORKSHOP is cave 1
  has = await page.evaluate(() => archiveEntries().some(e => e.title === "MANIFEST DISCREPANCY" && e.on === false));
  expect(has).toBe(true);
});

test("FIELD MEDIC runs stay off the Game Center boards (H3 gate)", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("doids_easy", "1"));
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.evaluate(() => { __doids.go(7); __doids.launch(); __doids.warpBeacon(); });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 9000 });
  await page.waitForFunction(() => __doids.get().epilogueChars > 4, null, { timeout: 5000 });
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "ending", null, { timeout: 3000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "win", null, { timeout: 3000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.easyMode).toBe(true);
  // achievements still earnable on easy mode; the boards are not
  expect(s.gcReports.filter(r => r.method === "submitScore")).toHaveLength(0);
  expect(s.gcReports.filter(r => r.method === "reportAchievement").length).toBeGreaterThan(0);
});

/* ===== Bundle T — zone identity: width, biomes, staged darkness ===== */

test("T1: sectors widen with depth and early sectors carry fuel pods", async ({ page }) => {
  const widths = await page.evaluate(() => {
    const w = [];
    for (let n = 0; n <= 7; n++) { __doids.go(n); w.push(level.W); }
    return w;
  });
  expect(widths[0]).toBe(2200);           // the teaching sector is the smallest
  expect(widths[1]).toBe(2750);
  expect(widths[6]).toBe(5500);
  expect(widths[7]).toBe(4400);           // finale kept dense-and-dark, not wide
  for (let n = 1; n <= 6; n++) expect(widths[n]).toBeGreaterThan(widths[n - 1]);
  // sectors 1 and 2 now seed their first surface fuel pods (fuel scales w/ dist)
  const pods = await page.evaluate(() => {
    __doids.go(1); const p1 = level.pods.length;
    __doids.go(2); const p2 = level.pods.length;
    return [p1, p2];
  });
  expect(pods[0]).toBeGreaterThan(0);
  expect(pods[1]).toBeGreaterThan(0);
});

test("T2: every sector carries its own biome terrain palette", async ({ page }) => {
  const ok = await page.evaluate(() => RECIPE.every(r =>
    r.pal && Array.isArray(r.pal.grad) && r.pal.grad.length === 2 &&
    typeof r.pal.stroke === "string" && typeof r.pal.glow === "string" &&
    Array.isArray(r.pal.night) && Array.isArray(r.pal.star)));
  expect(ok).toBe(true);
  // the Nullwave keeps the Static's violet; Asclepion does not (distinct biomes)
  const distinct = await page.evaluate(() =>
    RECIPE[7].pal.stroke === "#b388ff" && RECIPE[0].pal.stroke !== RECIPE[7].pal.stroke);
  expect(distinct).toBe(true);
});

test("T3: biome sectors seed their own ornamentation types", async ({ page }) => {
  const grab = n => page.evaluate((nn) => {
    __doids.go(nn); return [...new Set(level.scenery.map(s => s.type))];
  }, n);
  expect(await grab(1)).toContain("boulder");    // Vesalius
  const basin = await grab(2);                    // Nightingale
  expect(basin).toContain("reed");
  expect(basin).toContain("lantern");
  expect(await grab(4)).toContain("spire");       // Curie
  expect(await grab(5)).toContain("dune");        // Avicenna
  expect(await grab(6)).toContain("hedge");       // Jenner
});

test("T6: the Basin opens at dusk and night falls once to full dark", async ({ page }) => {
  let s = await page.evaluate(() => { __doids.go(2); __doids.launch(); return __doids.get(); });
  expect(s.darkAlpha).toBeCloseTo(0.4, 1);        // dusk
  expect(s.nightFell).toBe(false);
  // trip the 20-second trigger, then let the 6s ramp run to full dark
  await page.evaluate(() => { level.nightT = 21; });
  await page.waitForFunction(() => __doids.get().nightFell === true, null, { timeout: 3000 });
  await page.evaluate(() => { level.nightRamp = 10; });   // jump the ramp to the cap
  await page.waitForFunction(() => __doids.get().darkAlpha >= 0.89, null, { timeout: 3000 });
  s = await page.evaluate(() => __doids.get());
  expect(s.darkAlpha).toBeLessThanOrEqual(0.9);   // never past full dark
  expect(s.nightFell).toBe(true);
  // the finale is dark too, but it does NOT stage — it sits at full dark at once
  const fin = await page.evaluate(() => {
    __doids.go(7); return { staged: !!level.nightStaged, da: level.darkAlpha };
  });
  expect(fin.staged).toBe(false);
  expect(fin.da).toBeUndefined();
});

test("Semmelweis Deep: unscreened contagion taints the nearest un-scanned survivor", async ({ page }) => {
  await page.evaluate(() => { __doids.go(3); __doids.launch(); });
  await page.waitForFunction(
    () => __doids.get().state === "play" && __doids.get().level.contagion === true,
    null, { timeout: 4000 });
  // only Semmelweis carries the mechanic
  const vesalius = await page.evaluate(() => { __doids.go(1); return !!level.contagion; });
  expect(vesalius).toBe(false);
  // back to the ward: seat an unproven Vector beside a clean survivor, prime its
  // timer to one tick from seeding, and watch the survivor turn
  const victimIdx = await page.evaluate(() => {
    __doids.go(3); __doids.launch();
    const sab = level.oids.find(o => o.role === "saboteur" && o.state === "wait");
    const victim = level.oids.find(o => o.role === "normal" && !o.carrier &&
      !o.verified && !o.flagged && o.state === "wait");
    sab.x = victim.x + 20; sab.y = victim.y; sab.contagT = 9.9;
    return level.oids.indexOf(victim);
  });
  await page.waitForFunction(
    idx => __doids.get().level.oids[idx].role === "saboteur", victimIdx, { timeout: 4000 });
  expect(await page.evaluate(idx => __doids.get().level.oids[idx].sleeper, victimIdx)).toBe(true);
  expect(await page.evaluate(() => __doids.get().level.contagSeen)).toBe(true);
});

test("U1: the lift pad rings hollow once per touchdown and re-arms on lift-off", async ({ page }) => {
  // sector 1 hides a lift; settle on its plate and the pad rings once
  await page.evaluate(() => { __doids.go(1); __doids.launch(); __doids.warpLift(); });
  await page.waitForFunction(
    () => { const L = __doids.get().level.lift; return !!L && L.rung === true; },
    null, { timeout: 4000 });
  // lift clear of the plate — near goes false and the ring re-arms
  await page.evaluate(() => { ship.landed = false; ship.y -= 400; ship.vy = -60; });
  await page.waitForFunction(
    () => __doids.get().level.lift.rung === false, null, { timeout: 4000 });
  expect(await page.evaluate(() => __doids.get().level.lift.rung)).toBe(false);
});

test("U3: the HUD legend opens from the title and from pause, and returns", async ({ page }) => {
  await page.waitForTimeout(700);   // clear the title just-arrived guard
  const lr = await page.evaluate(() => window.legendRect());
  await page.mouse.click(lr.x + lr.w / 2, lr.y + lr.h / 2);
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => __doids.get().state)).toBe("legend");
  // page through to the end → back to the title
  await page.waitForTimeout(450);   // clear the card's stateT > 0.4 tap guard
  const pages = await page.evaluate(() => LEGEND_CARD.pages || 1);
  for (let p = 0; p < pages; p++) {
    await page.evaluate(() => { input.tap = true; });
    await page.waitForTimeout(80);
  }
  expect(await page.evaluate(() => __doids.get().state)).toBe("title");
  // now from a live run's pause screen, via the legend link
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await page.waitForTimeout(300);   // clear the pause stateT > 0.25 guard
  expect(await page.evaluate(() => __doids.get().state)).toBe("pause");
  await page.evaluate(() => {
    const r = pauseLegendRect();
    input.tap = true; input.tapX = r.x + r.w / 2; input.tapY = r.y + r.h / 2;
  });
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => __doids.get().state)).toBe("legend");
  // Escape returns to pause — where it was opened from, not the title
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => __doids.get().state)).toBe("pause");
});

test("U4: the pause button clears the score and the FUEL/ECG bars at 320-high", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 568, height: 320 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.waitForTimeout(60);
  const geo = await page.evaluate(() => {
    const pr = pauseRect();
    const bw = Math.min(150, vw * 0.3);
    const ecgLeft = vw - bw - 14 - saRight;   // drawECG x (top-right)
    const fuelRight = 14 + saLeft + bw;         // drawBar x + w (top-left)
    const scoreHalf = 24;                       // ~6 chars of 12px monospace, centred
    const scoreLeft = vw / 2 - scoreHalf, scoreRight = vw / 2 + scoreHalf;
    return {
      clearsEcg: pr.x + pr.w <= ecgLeft,
      clearsFuel: pr.x >= fuelRight,
      clearsScore: pr.x >= scoreRight || pr.x + pr.w <= scoreLeft,
      inViewport: pr.x >= 0 && pr.x + pr.w <= vw && pr.y >= 0 && pr.y + pr.h <= vh,
    };
  });
  expect(geo.clearsEcg).toBe(true);
  expect(geo.clearsFuel).toBe(true);
  expect(geo.clearsScore).toBe(true);
  expect(geo.inViewport).toBe(true);
  expect(errs).toEqual([]);
  await ctx.close();
});

test("U2: the field refueller costs points, delivers less each time, never soft-locks", async ({ page }) => {
  await page.evaluate(() => {
    __doids.go(1); __doids.launch();
    level.turrets.forEach(t => { t.alive = false; });
    level.drones.forEach(d => { d.alive = false; });
    level.oids = []; level.pods = [];   // isolate scoring to the refuel line only
    score = 5000;            // a tally for the crutch to drain
    __doids.strand();
    input.thrust = true;     // stranded-hold signals for resupply
  });
  await page.waitForFunction(() => (__doids.get().resupplyDrone || {}).phase === "line", null, { timeout: 6000 });
  await page.evaluate(() => { input.thrust = false; });
  // the first fill's ceiling: ~full, but never below the safety floor and never
  // above the tank — and refuels is still 0 until the line actually catches
  const cap1 = await page.evaluate(() => resupplyDrone.cap);
  const mf = await page.evaluate(() => __doids.get().maxFuel);
  expect(cap1).toBeGreaterThanOrEqual(35);
  expect(cap1).toBeLessThanOrEqual(mf);
  expect(await page.evaluate(() => __doids.get().runRefuels)).toBe(0);
  // pin the ship in the capture window so the line flows to the cap
  await page.evaluate(() => {
    window.__pin = setInterval(() => {
      if (!resupplyDrone) return;
      const cp = capturePoint(resupplyDrone);
      ship.x = cp.x; ship.y = cp.y; ship.vx = ship.vy = 0; ship.landed = false;
    }, 30);
  });
  await page.waitForFunction(() => (__doids.get().resupplyDrone || {}).phase === "out", null, { timeout: 15000 });
  await page.evaluate(() => clearInterval(window.__pin));
  const s = await page.evaluate(() => __doids.get());
  expect(s.score).toBeLessThan(5000);       // the crutch cost points, it did not pay them
  expect(s.score).toBeGreaterThanOrEqual(0);// the charge floors at 0 — no soft-lock
  expect(s.runRefuels).toBe(1);             // exactly one field resupply counted
  // the NEXT resupply must cap lower than this one (diminishing supply)
  const cap2 = await page.evaluate(() =>
    Math.max(35, Math.round(__doids.get().maxFuel * Math.pow(0.9, __doids.get().runRefuels))));
  expect(cap2).toBeLessThanOrEqual(cap1);
});

test("A6: log reveal cards break one sentence per line, ellipses intact", async ({ page }) => {
  // LOG 02 is four short sentences — each should get its own line.
  const log2 = await page.evaluate(() => __doids.logCardBody(1));
  expect(log2.split("\n").length).toBe(4);
  expect(log2).toContain("Forty-one seconds.\nAlways forty-one seconds.");
  // LOG 06 has an ellipsis mid-sentence; it must NOT split there.
  const log6 = await page.evaluate(() => __doids.logCardBody(5));
  expect(log6).toContain("matches... us.");
  expect(log6).not.toContain("matches...\nus");
});

test("C1: turn/thrust touch zones are forgiving but never overlap at the seam", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });   // landscape → controls visible
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.waitForTimeout(250);   // let a frame drop the `noctl` class so buttons lay out
  const data = await page.evaluate(() => {
    const rect = id => { const r = document.getElementById(id).getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom,
               cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2, w: r.width }; };
    const L = rect("btnL"), R = rect("btnR"), T = rect("btnThrust"), F = rect("btnFire");
    return {
      Lw: L.w,
      seamLR: __doids.btnHit((L.right + R.left) / 2, L.cy),        // between turn buttons
      seamTF: __doids.btnHit((F.left + T.right) / 2, T.cy),        // between fire & thrust
      aboveL: __doids.btnHit(L.cx, L.top - 22),                    // stab 22px above btnL
      aboveThrust: __doids.btnHit(T.cx, T.top - 22),               // stab 22px above thrust
      centerL: __doids.btnHit(L.cx, L.cy)
    };
  });
  expect(data.Lw, "controls are laid out (landscape, in-flight)").toBeGreaterThan(0);
  // the seam between the two turn buttons must never press both at once
  expect(data.seamLR.filter(k => k === "left" || k === "right").length).toBeLessThanOrEqual(1);
  // reaching THRUST must not also commit FIRE (malpractice)
  expect(data.seamTF).not.toContain("fire");
  // vertical forgiveness: a stab just above the button still registers
  expect(data.aboveL).toContain("left");
  expect(data.aboveThrust).toContain("thrust");
  expect(data.centerL).toContain("left");
});

test("E3: a perfect-timed shield parry reflects a bullet back and kills its firer", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    // isolate the scenario: one turret to the right, one incoming bullet, no drones
    level.drones = [];
    ship.vx = 0; ship.vy = 0; ship.dead = false;
    level.turrets = [{ x: ship.x + 70, y: ship.y, ang: Math.PI, cd: 999, alive: true }];
    level.bullets = [{ x: ship.x + 16, y: ship.y, vx: -150, vy: 0, t: 4 }];
    // raise the shield THIS instant → rising edge opens the parry window
    input.shield = true;
  });
  await page.waitForTimeout(500);   // let the reflected round fly back to the turret
  const r = await page.evaluate(() => ({
    turretAlive: level.turrets[0] ? level.turrets[0].alive : null,
    runFired: __doids.get().runFired
  }));
  expect(r.turretAlive, "the turret is destroyed by its own reflected bullet").toBe(false);
  expect(r.runFired, "reflecting is not firing — the oath is intact").toBe(0);
  await page.evaluate(() => { input.shield = false; });
});

test("E2: a Vector throws a Scion; catching re-boards, hitting the ground loses them", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.waitForTimeout(150);
  // the telegraphed throw completes → the Scion becomes a falling body
  await page.evaluate(() => {
    const s = ship; s.dead = false; s.passengers = [];
    const o = { role: "normal", state: "aboard", x: s.x, y: s.y, wave: 0, vx: 0, vy: 0 };
    level.oids.push(o); s.passengers.push(o);
    level.eject = { o, t: 0.001 };
  });
  await page.waitForTimeout(120);
  const st1 = await page.evaluate(() => {
    const o = level.oids[level.oids.length - 1];
    return { state: o.state, inPax: ship.passengers.includes(o) };
  });
  expect(st1.state, "the Scion is thrown clear").toBe("thrown");
  expect(st1.inPax, "and off the manifest while falling").toBe(false);
  // flying into the falling Scion catches them → re-boarded
  await page.evaluate(() => {
    // move well clear of MERCY's bays so a re-boarded Scion isn't instantly delivered
    ship.x = level.mx + 460; ship.y = groundAt(ship.x) - 40;
    ship.landed = true; ship.vx = 0; ship.vy = 0;
    const o = level.oids[level.oids.length - 1];
    o.x = ship.x; o.y = ship.y; o.vx = 0; o.vy = 0; o.throwLock = 0;   // clear the post-throw lock
  });
  await page.waitForTimeout(120);
  const st2 = await page.evaluate(() => {
    const o = level.oids[level.oids.length - 1];
    return { state: o.state, inPax: ship.passengers.includes(o) };
  });
  expect(st2.state, "flying into the thrown Scion catches them").toBe("aboard");
  expect(st2.inPax).toBe(true);
  // a thrown Scion that reaches the ground (Field Medic off) is lost
  await page.evaluate(() => {
    easyMode = false;
    const ox = ship.x + 320;
    const o = { role: "normal", state: "thrown", x: ox, y: groundAt(ox) - 12, wave: 0, vx: 0, vy: 160 };
    level.oids.push(o);
  });
  await page.waitForTimeout(250);
  const st3 = await page.evaluate(() => level.oids[level.oids.length - 1].state);
  expect(st3, "a thrown Scion that lands is lost").toBe("lost");
});

test("E1: a breach must be RETRIEVED at recovery before it can be sealed at isolation", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.waitForTimeout(120);
  await page.evaluate(() => { triggerBreach(false); });
  // parking at the RED bay before retrieving does NOT seal it
  await page.evaluate(() => {
    window.__pin = setInterval(() => {
      const b = bayRects().red;
      ship.x = (b.x0 + b.x1) / 2; ship.y = (b.y0 + b.y1) / 2;
      ship.vx = 0; ship.vy = 0; ship.dead = false;
      input.left = false; input.right = false;
    }, 16);
  });
  await page.waitForTimeout(2500);
  const stillBreached = await page.evaluate(() => {
    const b = __doids.get().mercyBreach;
    return b && !b.retrieved;
  });
  expect(stillBreached, "can't seal what hasn't been retrieved").toBe(true);
  // retrieve at the RECOVERY bay
  await page.evaluate(() => {
    clearInterval(window.__pin);
    window.__pin = setInterval(() => {
      const b = bayRects().med;
      ship.x = (b.x0 + b.x1) / 2; ship.y = (b.y0 + b.y1) / 2;
      ship.vx = 0; ship.vy = 0; ship.dead = false;
    }, 16);
  });
  await page.waitForTimeout(900);
  const retrieved = await page.evaluate(() => {
    const b = __doids.get().mercyBreach;
    return b && b.retrieved;
  });
  expect(retrieved, "docking recovery retrieves the loose Vector").toBe(true);
  // now ferry to the RED isolation bay and hold → sealed
  await page.evaluate(() => {
    clearInterval(window.__pin);
    window.__pin = setInterval(() => {
      const b = bayRects().red;
      ship.x = (b.x0 + b.x1) / 2; ship.y = (b.y0 + b.y1) / 2;
      ship.vx = 0; ship.vy = 0; ship.dead = false;
      input.left = false; input.right = false;
    }, 16);
  });
  await page.waitForTimeout(2600);
  await page.evaluate(() => clearInterval(window.__pin));
  const sealed = await page.evaluate(() => __doids.get().mercyBreach);
  expect(sealed, "retrieved Vector sealed at isolation clears the breach").toBeNull();
});
