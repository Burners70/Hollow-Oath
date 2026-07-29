// Hollow Oath — World generation & fairness.
//
// Level and cave generation: sectors run, biomes and widths, black boxes and
// beacons, wrecks and lift pads, seeded/daily runs, the veteran gating and
// escalation — plus the generation-fairness invariants (no Scion pocketed
// under interlocking turret cover, every scannable Scion has a landing spot,
// pads on flats, turrets on the surface).
// Drives the game headlessly through window.__doids; the shared per-test guard
// (navigate + fail on any console error) lives in tests/harness.js.
// See tests/README.md for what belongs in which file.
const { test, expect } = require("@playwright/test");
const { useGame } = require("./harness");

useGame(test, expect);

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

test("first playthrough seals the Glycon layer; a veteran run opens it", async ({ page }) => {
  // fresh (non-veteran): no Hollows lifts, no counterfeit MERCY, logs cap at 10
  for (const n of [1, 3, 5]) {
    await page.evaluate(i => __doids.go(i), n);
    const lift = await page.evaluate(() => __doids.get().level.lift);
    expect(lift, "sector " + n + " lift sealed on a first run").toBeFalsy();
  }
  await page.evaluate(() => __doids.go(7));
  expect(await page.evaluate(() => !!__doids.get().fakeMercy)).toBe(false);
  await page.evaluate(() => { __doids.go(0); __doids.launch(); for (let i = 0; i < 14; i++) grantFragment(false); });
  expect(await page.evaluate(() => __doids.get().runFragments)).toBe(10);   // 1–10 only
  // a veteran run unlocks the lifts, the counterfeit MERCY and all 14 logs
  await page.evaluate(() => { __doids.setVeteran(); __doids.reset(); __doids.go(1); });
  expect(await page.evaluate(() => !!__doids.get().level.lift)).toBe(true);
  await page.evaluate(() => __doids.go(7));
  expect(await page.evaluate(() => !!__doids.get().fakeMercy)).toBe(true);
  await page.evaluate(() => { __doids.go(0); __doids.launch(); for (let i = 0; i < 14; i++) grantFragment(false); });
  expect(await page.evaluate(() => __doids.get().runFragments)).toBe(14);
});

test("seed 0 reproduces the authored campaign; remix re-rolls it (Bundle M)", async ({ page }) => {
  await page.evaluate(() => __doids.go(1));
  let sum = await page.evaluate(() => __doids.heightChecksum());
  expect(sum).toBe(1090254029);   // golden checksum: authored VESALIUS RIDGE terrain (updated when the return-lift's flat is now re-asserted last, so the pad never sits on a slope)
  // remix: fresh seed, 7 famous minds drawn from the wider pool, briefing up
  await page.evaluate(() => __doids.remix());
  let s = await page.evaluate(() => __doids.get());
  expect(s.runMode).toBe("remix");
  expect(s.runSeed).toBeGreaterThan(0);
  expect(s.famousMap).toHaveLength(7);
  expect(s.state).toBe("brief");
  await page.evaluate(() => __doids.go(1));
  const remixSum = await page.evaluate(() => __doids.heightChecksum());
  expect(remixSum).not.toBe(1090254029);
  // a fresh campaign run restores seed 0 and the exact authored terrain
  await page.evaluate(() => { __doids.reset(); __doids.go(1); });
  sum = await page.evaluate(() => __doids.heightChecksum());
  expect(sum).toBe(1090254029);
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

test("every turret sits on the surface, not below the crust", async ({ page }) => {
  // owner report: a turret sank under Jenner's terraces when a later flatten
  // re-shaped the ground under its pad. genLevel re-seats turrets on the final
  // heightmap, so every turret's base must equal the ground at its x.
  for (let n = 0; n < 7; n++) {
    await page.evaluate(i => __doids.go(i), n);
    const maxGap = await page.evaluate(() => {
      const g = __doids.get();
      return Math.max(0, ...g.level.turrets.map(t => Math.abs(t.y - __doids.ground(t.x))));
    });
    expect(maxGap, "sector " + n + " turrets on the ground").toBeLessThan(0.75);
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

test("Y3: wrecks generate on wreck sectors; the per-wreck cant is stable and RNG-free", async ({ page }) => {
  // sector 5 carries a wreck; render a few frames (afterEach fails on any error
  // thrown by the new groundAt-profile clip / cant / crash-scar draw paths)
  await page.evaluate(() => { __doids.go(5); __doids.launch(); });
  await page.waitForTimeout(200);
  const wrecks = await page.evaluate(() =>
    __doids.get().level.scenery.filter(s => s.type === "wreckM" || s.type === "wreckS").length);
  expect(wrecks).toBeGreaterThan(0);
  // the cant is a pure function of x — same x always yields the same angle,
  // frame to frame, and roughly half of a spread of positions lie flat (cant 0)
  const stable = await page.evaluate(() => __doids.wreckCant(1234) === __doids.wreckCant(1234));
  expect(stable).toBe(true);
  const flatCount = await page.evaluate(() => {
    let flat = 0;
    for (let x = 400; x < 4400; x += 37) if (__doids.wreckCant(x) === 0) flat++;
    return flat;
  });
  expect(flatCount).toBeGreaterThan(20);   // a meaningful share sit level, not all canted
  // the authored terrain is untouched by the wreck work (no RNG draw added) —
  // seed 0 still reproduces VESALIUS RIDGE's golden heightmap (see Bundle M)
  await page.evaluate(() => { __doids.reset(); __doids.go(1); });
  expect(await page.evaluate(() => __doids.heightChecksum())).toBe(1090254029);
});

test("Y5: the secret lift pad is marked on EVERY run, even pre-veteran", async ({ page }) => {
  // a first (non-veteran) run seals the usable lift but must still mark the pad
  // so it reads on the surface — drawLift renders the marker from level.liftPad
  for (const n of [1, 3, 5]) {
    await page.evaluate(i => __doids.go(i), n);
    const s = await page.evaluate(() => __doids.get());
    expect(s.level.lift, "sector " + n + " usable lift sealed pre-veteran").toBeFalsy();
    expect(s.level.liftPad, "sector " + n + " pad still marked").toBeTruthy();
  }
  // a sector without a lift has no pad marker at all
  await page.evaluate(() => __doids.go(0));
  expect(await page.evaluate(() => __doids.get().level.liftPad)).toBeFalsy();
  // a veteran run keeps the pad and unlocks the usable lift, both at the same x
  await page.evaluate(() => { __doids.setVeteran(); __doids.reset(); __doids.go(1); });
  const v = await page.evaluate(() => __doids.get());
  expect(v.level.lift).toBeTruthy();
  expect(v.level.liftPad).toBeTruthy();
  expect(v.level.liftPad.x).toBe(v.level.lift.x);
});

test("V2: every scannable Scion has a fair scan-landing spot (campaign + REMIX)", async ({ page }) => {
  // fairness invariant: from some reachable, landable spot the scan must finish
  // before the Scion creeps to the hatch — guaranteed at generation (widened
  // pads). __doids.scanSpotFailures() returns the x of any Scion without one.
  for (let n = 0; n < 8; n++) {
    await page.evaluate(i => __doids.go(i), n);
    const fails = await page.evaluate(() => __doids.scanSpotFailures());
    expect(fails, `campaign sector ${n}`).toEqual([]);
  }
  // the invariant must also hold across the REMIX seed space
  for (let k = 0; k < 8; k++) {
    await page.evaluate(() => __doids.remix());
    for (let n = 0; n < 7; n++) {
      await page.evaluate(i => __doids.go(i), n);
      const fails = await page.evaluate(() => __doids.scanSpotFailures());
      expect(fails, `remix run #${k} sector ${n}`).toEqual([]);
    }
  }
});

test("the return-lift pad always sits on a flat, never halfway up a slope", async ({ page }) => {
  // you land and HOLD on the lift, and its surface marker must sit on that flat.
  // A crowded map used to make pick() drop the lift beside a Scion whose V2
  // pad-widen then re-sloped the lift's ground; the flat is now re-asserted last.
  await page.evaluate(() => __doids.setVeteran());
  for (const seed of [0, 1, 42, 99, 123, 777, 1000, 31337, 60123]) {
    for (const n of [1, 3, 5]) {   // the lift-bearing surface sectors
      const span = await page.evaluate(({ seed, n }) => {
        runSeed = seed;
        const lvl = genLevel(n);
        if (!lvl.liftPad) return 0;
        const lx = lvl.liftPad.x;
        const ys = [-44, -22, 0, 22, 44].map(d => groundOf(lvl.heights, lx + d));
        return Math.max(...ys) - Math.min(...ys);
      }, { seed, n });
      expect(span, `lift pad flat on seed ${seed} sector ${n}`).toBeLessThan(6);
    }
  }
  await page.evaluate(() => __doids.reset());
});

test("V10: a veteran campaign return escalates — more guns, more Vectors, moved", async ({ page }) => {
  // first run (non-veteran) of a mid campaign sector
  await page.evaluate(() => __doids.go(3));
  const first = await page.evaluate(() => {
    const g = __doids.get();
    return { turrets: g.level.turrets.length,
      sab: g.level.oids.filter(o => o.role === "saboteur").length,
      xs: g.level.oids.map(o => Math.round(o.x)) };
  });
  // the veteran RETURN of the same sector: same landscape, escalated
  await page.evaluate(() => { __doids.setVeteran(); __doids.reset(); __doids.go(3); });
  const vet = await page.evaluate(() => {
    const g = __doids.get();
    return { turrets: g.level.turrets.length,
      sab: g.level.oids.filter(o => o.role === "saboteur").length,
      xs: g.level.oids.map(o => Math.round(o.x)) };
  });
  expect(vet.turrets, "more guns on return").toBeGreaterThan(first.turrets);
  expect(vet.sab, "higher Vector proportion on return").toBeGreaterThan(first.sab);
  expect(vet.xs, "different placements on return").not.toEqual(first.xs);
});

/* ===== Bundle Z — REMIX variable gravity ===== */

test("Z1: gravity varies by seed AND sector in REMIX/DAILY, and never in campaign", async ({ page }) => {
  // campaign (seed 0) always plays at exactly 1x — the authored feel and the
  // M1 golden heightmap stay untouched
  await page.evaluate(() => { __doids.go(0); });
  let s = await page.evaluate(() => __doids.get());
  expect(s.gravScale).toBe(1);
  expect(s.grav).toBe(46);   // GRAV's base value
  // deterministic per (seed, sector), and bounded to the ~0.4x-2.2x range —
  // owner steer (July 2026): widened from ~0.7x-1.4x (read as barely
  // different from 1x) and re-rolled every sector, not once per run
  const rolls = await page.evaluate(() => {
    const out = {};
    for (const seed of [1, 2, 3, 42, 12345]) {
      runSeed = seed;
      out[seed] = [0, 1, 2, 3, 4, 5, 6, 7].map(n => { rollGravity(n); return gravScale; });
    }
    return out;
  });
  for (const seed of Object.keys(rolls)) {
    for (const v of rolls[seed]) {
      expect(v, "seed " + seed).toBeGreaterThanOrEqual(0.4);
      expect(v, "seed " + seed).toBeLessThanOrEqual(2.2);
    }
    // a whole run doesn't sit at one barely-noticed value — sectors differ
    expect(new Set(rolls[seed].map(v => v.toFixed(6))).size, "seed " + seed).toBeGreaterThan(1);
  }
  // same (seed, sector) → same roll, every time (reproducible, no RNG bleed)
  const again = await page.evaluate(() => { runSeed = 42; rollGravity(3); return gravScale; });
  expect(again).toBeCloseTo(rolls[42][3], 10);
  // even called directly, seed 0 never scales
  const zero = await page.evaluate(() => { runSeed = 0; rollGravity(2); return gravScale; });
  expect(zero).toBe(1);
  // __doids.remix(seed) applies it end-to-end (sector 0) and surfaces a label
  await page.evaluate(() => __doids.remix(1));
  s = await page.evaluate(() => __doids.get());
  expect(s.gravScale).toBeCloseTo(rolls[1][0], 10);
  expect(s.grav).toBeCloseTo(46 * rolls[1][0], 5);
  expect(["", "heavy world", "thin gravity", "crushing gravity", "near-weightless"]).toContain(s.gravLabel);
  // advancing sectors within the same REMIX run re-rolls gravity, not just at launch
  await page.evaluate(() => { __doids.go(1); });
  s = await page.evaluate(() => __doids.get());
  expect(s.gravScale).toBeCloseTo(rolls[1][1], 10);
});

test("Z2: landing fairness thresholds scale with gravity, so the same approach reads the same across the range", async ({ page }) => {
  await page.evaluate(() => {
    __doids.go(0); __doids.launch();
    ship.x = level.oids[0].x;   // a Scion's own pad — flattened at generation, always flat
    ship.landed = false; ship.vx = 0; ship.ang = 0;
  });
  const base = 52;   // landingEval's non-gentle vyMax at gravScale === 1
  const check = (gs, vy) => page.evaluate(({ gs, vy }) => {
    gravScale = gs; ship.vy = vy;
    return __doids.evalLanding();
  }, { gs, vy });
  // at 1x, just under the base threshold is soft; just over is not
  expect((await check(1, base - 1)).soft).toBe(true);
  expect((await check(1, base + 1)).soft).toBe(false);
  // heavy world (1.4x): the same speed that failed at 1x now passes —
  // sqrt(1.4) ≈ 1.18x, so base+1 sits comfortably under the new max
  expect((await check(1.4, base + 1)).soft).toBe(true);
  // thin gravity (0.7x): the threshold tightens — a speed that passed at 1x
  // can now fail
  expect((await check(0.7, base - 1)).soft).toBe(false);
  // the widened range (owner steer) still holds the same sqrt relationship
  // at its new extremes — crushing gravity (2.2x) widens further...
  expect((await check(2.2, base * Math.sqrt(2.2) - 1)).soft).toBe(true);
  // ...near-weightless (0.4x) tightens further
  expect((await check(0.4, base * Math.sqrt(0.4) + 1)).soft).toBe(false);
});
