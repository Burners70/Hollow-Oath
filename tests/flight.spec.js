// Hollow Oath — Flight, landing & fuel.
//
// Flying the dart: the landing evaluator and rank flags, the shield parry, the
// secret lift down and back, and the fuel economy — stranding, the resupply
// drone, the transfusion line, the paid refueller.
// Drives the game headlessly through window.__doids; the shared per-test guard
// (navigate + fail on any console error) lives in tests/harness.js.
// See tests/README.md for what belongs in which file.
const { test, expect } = require("@playwright/test");
const { useGame } = require("./harness");

useGame(test, expect);

test("V19: a long flight's accumulated rotation doesn't survive into a landing spin", async ({ page }) => {
  // steer accumulates s.ang every tick with no wraparound, so a long or
  // hard-turning flight can sit several full turns past zero (e.g. ~15 rad)
  // at the moment it lands. With assist on (the bug's precondition — assist
  // keeps the raw angle instead of snapping to 0) that used to visibly spin
  // through every accumulated turn before easing to level.
  await page.evaluate(() => {
    __doids.go(0); __doids.launch();
    assist = true;
    ship.x = level.oids[0].x;   // a Scion's own pad — flattened at generation, always landable
    // several full turns past zero (4π), but the EQUIVALENT angle is upright
    // (~0.05 rad) — exactly the bug's precondition: a survivable landing that
    // used to spin through every accumulated turn before easing to level
    ship.ang = 4 * Math.PI + 0.05;
    ship.y = groundAt(ship.x) - SHIP_R + 1; ship.vx = 0; ship.vy = 5; ship.landed = false;
  });
  await page.waitForTimeout(120);   // the next physics tick detects touchdown
  const s = await page.evaluate(() => __doids.get());
  expect(s.ship.landed).toBe(true);
  // normalized to (-π, π] on touchdown — never left at the raw accumulated value
  expect(Math.abs(s.ship.ang)).toBeLessThanOrEqual(Math.PI + 0.001);
});

test("secret lift descends into the Hollows", async ({ page }) => {
  // sector 1 hides a lift; land on it and hold ~2.4s. The Hollows are a
  // veteran-only layer now, so unlock it first. (V10 escalates the veteran
  // return with extra guns; this test is about the descent, so quiet the field.)
  await page.evaluate(() => { __doids.setVeteran(); __doids.go(1); __doids.launch();
    level.turrets.forEach(t => t.alive = false); level.drones.forEach(d => d.alive = false);
    level.blackbox = null;   // a box near the (V10-relocated) lift would interrupt the hold
    __doids.warpLift(); });
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

test("owner fix: ASSIST off hides the landing-guide visuals", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  expect(await page.evaluate(() => assist)).toBe(true);   // default
  expect(await page.evaluate(() => __doids.landingGuideVisible())).toBe(true);
  await page.evaluate(() => { assist = false; });
  expect(await page.evaluate(() => __doids.landingGuideVisible())).toBe(false);
  await page.evaluate(() => { assist = true; });
  expect(await page.evaluate(() => __doids.landingGuideVisible())).toBe(true);
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

test("V18: the very first field resupply gets a one-time acknowledgement banner", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); __doids.strand(); });
  expect(await page.evaluate(() => runRefuels)).toBe(0);
  await page.evaluate(() => { input.thrust = true; });
  await page.waitForFunction(() => __doids.get().resupplyDrone !== null, null, { timeout: 4000 });
  const s = await page.evaluate(() => ({ str: bannerMsg && bannerMsg.str }));
  expect(s.str).toMatch(/HELP IS ON THE WAY/);
  await page.evaluate(() => { input.thrust = false; bannerMsg = null; });
  // deliver it and land — the SECOND resupply this run must stay silent
  await page.evaluate(() => {
    resupplyDrone.phase = "line";
    window.__pin = setInterval(() => {
      if (!resupplyDrone) return;
      const cp = capturePoint(resupplyDrone);
      ship.x = cp.x; ship.y = cp.y; ship.vx = ship.vy = 0; ship.landed = false;
    }, 30);
  });
  await page.waitForFunction(() => runRefuels > 0, null, { timeout: 4000 });
  await page.evaluate(() => {
    clearInterval(window.__pin);
    ship.fuel = 0; ship.y = __doids.ground(ship.x) - 11; ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true;
    resupplyDrone = null; ship.signalT = 0; bannerMsg = null;
    input.thrust = true;
  });
  await page.waitForFunction(() => __doids.get().resupplyDrone !== null, null, { timeout: 4000 });
  const s2 = await page.evaluate(() => ({ str: bannerMsg && bannerMsg.str }));
  expect(s2.str || "").not.toMatch(/HELP IS ON THE WAY/);
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

test("riding the lift back up lands the ship ON the pad, not below ground", async ({ page }) => {
  // regression: exitCave used to restore the mid-transit Y captured after
  // the descent animation had sunk the ship ~40px into the pad, leaving the
  // ship embedded in terrain on return (it snapped to the surface on thrust)
  await page.evaluate(() => { __doids.setVeteran(); __doids.go(3); __doids.launch(); __doids.warpLift(); });
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
  // V10 escalates the veteran return with extra guns; quiet the field so the
  // descent (what this test checks) isn't interrupted by a turret.
  await page.evaluate(() => { __doids.setVeteran(); __doids.go(1); __doids.launch();
    level.turrets.forEach(t => t.alive = false); level.drones.forEach(d => d.alive = false);
    level.blackbox = null;   // a box near the (V10-relocated) lift would interrupt the hold
    __doids.warpLift(); });
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

test("U1: the lift pad rings hollow once per touchdown and re-arms on lift-off", async ({ page }) => {
  // sector 1 hides a lift; settle on its plate and the pad rings once (veteran layer)
  await page.evaluate(() => { __doids.setVeteran(); __doids.go(1); __doids.launch(); __doids.warpLift(); });
  await page.waitForFunction(
    () => { const L = __doids.get().level.lift; return !!L && L.rung === true; },
    null, { timeout: 4000 });
  // lift clear of the plate — near goes false and the ring re-arms
  await page.evaluate(() => { ship.landed = false; ship.y -= 400; ship.vy = -60; });
  await page.waitForFunction(
    () => __doids.get().level.lift.rung === false, null, { timeout: 4000 });
  expect(await page.evaluate(() => __doids.get().level.lift.rung)).toBe(false);
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
