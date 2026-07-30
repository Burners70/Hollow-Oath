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

test("V14: the V2 fairness invariant holds across a broad REMIX seed sweep", async ({ page }) => {
  // V14 — __doids.remix(seed) now takes an explicit seed, so a failure is a
  // fixed repro, not a one-shot. These are the exact seeds a brute-force sweep
  // (4000 seeds × 7 sectors, on the pre-fix generator) found failing: a domino
  // between the lift-flat reassert's own repair and a THIRD Scion's
  // already-fair band elsewhere in the level, and a mutual ping-pong between
  // two neighbours ~260px apart whose pads never overlap but whose checked
  // BANDS (which reach further than either pad) do.
  const knownFailingSeeds = [402, 1476, 1661, 2024, 2340, 2528, 3234, 3386, 3479, 3678, 3788, 3954];
  for (const seed of knownFailingSeeds) {
    await page.evaluate(s => __doids.remix(s), seed);
    for (let n = 0; n < 7; n++) {
      await page.evaluate(i => __doids.go(i), n);
      const fails = await page.evaluate(() => __doids.scanSpotFailures());
      expect(fails, `remix seed ${seed} sector ${n}`).toEqual([]);
    }
  }
  // a fast, broad sweep in-process (bypassing the full remix()/toBriefing()
  // flow) — thousands of generations in one call, the same brute-force check
  // that found the seeds above, so the invariant is verified far beyond what
  // a handful of live runs could cover. Does not touch the current live run.
  const sweepFails = await page.evaluate(() => {
    const savedSeed = runSeed, savedMode = runMode;
    runMode = "remix";
    const fails = [];
    for (let seed = 1; seed <= 5000; seed++) {
      runSeed = seed;
      for (let n = 0; n < 7; n++) {
        const lvl = genLevel(n);
        const bad = (lvl.oids || [])
          .filter(o => o.role === "normal" || o.role === "saboteur" || o.role === "famous")
          .filter(o => !scanSpotOK(lvl.heights, lvl.W, o.x));
        if (bad.length) fails.push("seed " + seed + " sector " + n);
      }
    }
    runSeed = savedSeed; runMode = savedMode;
    return fails;
  });
  expect(sweepFails).toEqual([]);
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
  // owner feature — a crosswind can now share the label with a magnitude
  // tier ("heavy world · → wind"), so check each part, not a fixed list
  const magParts = ["", "heavy world", "thin gravity", "crushing gravity", "near-weightless"];
  for (const part of s.gravLabel.split(" · ")) {
    expect(magParts.includes(part) || part === "→ wind" || part === "← wind",
      "unexpected gravLabel part: " + part).toBe(true);
  }
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

test("Z3 (owner feature): a per-sector crosswind pushes the ship sideways, never in campaign, and widens the drift tolerance", async ({ page }) => {
  // campaign (seed 0): no crosswind, ever, even if rollGravity is forced
  await page.evaluate(() => { __doids.go(0); });
  let s = await page.evaluate(() => __doids.get());
  expect(s.gravTilt).toBe(0);
  expect(s.gravSide).toBe(0);
  // deterministic per (seed, sector), and bounded to -1..1
  const tilts = await page.evaluate(() => {
    const out = {};
    for (const seed of [1, 2, 3, 42, 12345]) {
      runSeed = seed;
      out[seed] = [0, 1, 2, 3, 4, 5, 6, 7].map(n => { rollGravity(n); return gravTilt; });
    }
    return out;
  });
  for (const seed of Object.keys(tilts)) {
    for (const v of tilts[seed]) {
      expect(v, "seed " + seed).toBeGreaterThanOrEqual(-1);
      expect(v, "seed " + seed).toBeLessThanOrEqual(1);
    }
    expect(new Set(tilts[seed].map(v => v.toFixed(6))).size, "seed " + seed).toBeGreaterThan(1);
  }
  // a real crosswind actually pushes the ship: pin gravTilt strongly positive
  // (pulls right) while airborne and confirm vx climbs, not just vy
  await page.evaluate(() => {
    __doids.go(0); __doids.launch();
    gravScale = 1; gravTilt = 1;
    ship.x = 600; ship.y = 300; ship.vx = 0; ship.landed = false; ship.dead = false;
  });
  await page.waitForTimeout(200);
  const vxAfter = await page.evaluate(() => ship.vx);
  expect(vxAfter).toBeGreaterThan(0);   // pushed right, as gravTilt > 0 promises
  // the sideways drift tolerance widens with a strong crosswind, same
  // "the environment did this, not the player" logic as Z2's descent scaling
  await page.evaluate(() => {
    ship.x = level.oids[0].x; ship.landed = false; ship.vy = 0; ship.ang = 0;
  });
  const checkVx = (gt, vx) => page.evaluate(({ gt, vx }) => {
    gravScale = 1; gravTilt = gt; ship.vx = vx;
    return __doids.evalLanding();
  }, { gt, vx });
  expect((await checkVx(0, 39)).soft, "no crosswind: just over base vxMax fails").toBe(false);
  expect((await checkVx(1, 39)).soft, "full crosswind: the same speed now passes").toBe(true);
});

/* ===== Bundle P (P·terrain) — span terrain and the chamber grammar =========
   docs/ACT_TWO_SPEC.md §11.0. Two things are on trial here: that Act One's
   heightmap generation is bit-for-bit untouched (the M1 golden checksum, which
   is the bundle's stated proof), and that spans express the three shapes a
   heightmap cannot — an overhang, a pinch point tighter than a cave's
   guaranteed 175px, and a pillar. Gameplay is NOT on trial: a chamber is
   terrain only until P·slice (see genChamber, js/acttwo-data.js). */

test("P·terrain: Act One generation is untouched by the span layer (M1)", async ({ page }) => {
  // the whole bundle rests on this: spans are additive, so seed 0 must still
  // produce the exact authored heightmap the shipped game does
  await page.evaluate(() => { __doids.reset(); __doids.go(1); });
  expect(await page.evaluate(() => __doids.heightChecksum())).toBe(1090254029);
  // and a surface level carries no spans at all, so every groundAt/roofAt call
  // site takes the heightmap path it always did
  expect(await page.evaluate(() => !!__doids.get().level.spans)).toBe(false);
  expect(await page.evaluate(() => __doids.spanStats().cols)).toBe(0);
  // groundAt ignores the new optional y argument on a heightmap level
  const same = await page.evaluate(() => {
    const x = 900;
    return [__doids.ground(x), __doids.ground(x, 200), __doids.ground(x, 1400)];
  });
  expect(same[1]).toBe(same[0]);
  expect(same[2]).toBe(same[0]);
});

test("P·terrain: the slice chamber compiles, and is a wide floor of a complex", async ({ page }) => {
  const info = await page.evaluate(() => __doids.loadChamber("slice"));
  expect(info).not.toBeNull();
  /* Owner steer, July 2026: a chamber is one FLOOR of a subterranean complex —
     you clear everyone on it, then descend. So width is the point, and the
     descent belongs at the end of a level rather than threaded through it. */
  expect(info.W).toBeGreaterThan(5500);       // wider than any surface sector
  const st = await page.evaluate(() => __doids.spanStats());
  expect(st.cols).toBe(info.cols);
  // wide, not a shaft: the floor must read as horizontal, and the way down at
  // the end must still reach past Act One's world box
  expect(info.W / st.verticalUsed).toBeGreaterThan(3);
  expect(st.deepest).toBeGreaterThan(1500);
  // the chamber renders and simulates without a heightmap present
  await page.waitForTimeout(250);
  const s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("play");
  expect(s.ship.dead).toBe(false);
});

test("P·terrain: spans express an overhang, a pinch and a pillar", async ({ page }) => {
  await page.evaluate(() => __doids.loadChamber("slice"));
  const st = await page.evaluate(() => __doids.spanStats());

  /* Located by PROPERTY, not by hardcoded x: the chamber gets retuned (it has
     been twice already) and a coordinate literal turns a real regression into a
     puzzle about which number went stale. */
  const found = await page.evaluate(() => {
    const s = level.spans;
    let overhang = null, pillar = null, tightest = null, tg = Infinity;
    for (let i = 1; i < s.length - 1; i++) {
      const col = s[i];
      if (!overhang && col.length >= 2) overhang = i * STEP;
      // a pillar is a RUN of solid columns with hall either side of the run —
      // not a single column (the pillar is 13 columns wide) and not the
      // chamber's own sealed ends, which are also span-less
      if (!pillar && !col.length && s[i - 1].length) {
        let j = i;
        while (j < s.length - 1 && !s[j].length) j++;
        if (s[j].length) pillar = i * STEP;
      }
      for (const sp of col) if (sp.bot - sp.top < tg) { tg = sp.bot - sp.top; tightest = i * STEP; }
    }
    return { overhang, pillar, tightest };
  });

  // an OVERHANG is a column holding two open spans — the shape a
  // one-value-per-column heightmap cannot hold at all
  expect(st.overhangs).toBeGreaterThan(0);
  expect(found.overhang).not.toBeNull();
  const shelf = await page.evaluate(x => __doids.spans(x), found.overhang);
  expect(shelf.length).toBeGreaterThanOrEqual(2);
  // air above the shelf, rock inside it, air below it again
  const probe = await page.evaluate(x => {
    const col = __doids.spans(x);
    const above = (col[0].top + col[0].bot) / 2;
    const inside = (col[0].bot + col[1].top) / 2;
    const below = (col[1].top + col[1].bot) / 2;
    return [__doids.solidAt(x, above), __doids.solidAt(x, inside), __doids.solidAt(x, below)];
  }, found.overhang);
  expect(probe).toEqual([false, true, false]);
  // and the ceiling you get depends on which span you ask from — the whole
  // point of the optional y argument
  const roofs = await page.evaluate(x => {
    const col = __doids.spans(x);
    return [__doids.roofAtY(x, (col[0].top + col[0].bot) / 2),
            __doids.roofAtY(x, (col[1].top + col[1].bot) / 2)];
  }, found.overhang);
  expect(roofs[1]).toBeGreaterThan(roofs[0]);

  // a PINCH tighter than the 175px every Act One cave is guaranteed by
  // construction (genCave clamps roof to heights - 175), but still flyable
  expect(st.tightest).toBeLessThan(175);
  expect(st.tightest).toBeGreaterThan(2 * 11);   // wider than the ship (SHIP_R 11)

  // a PILLAR is a column with no open span at all, with hall either side
  expect(st.solidCols).toBeGreaterThan(0);
  expect(found.pillar).not.toBeNull();
  expect(await page.evaluate(x => __doids.spans(x), found.pillar)).toEqual([]);
});

test("P·terrain: a chamber compiles deterministically", async ({ page }) => {
  // the authoring format is only authoring if the same definition always
  // compiles to the same rock — the span equivalent of the M1 anchor
  const first = await page.evaluate(() => { __doids.loadChamber("slice"); return __doids.spanChecksum(); });
  const second = await page.evaluate(() => { __doids.loadChamber("slice"); return __doids.spanChecksum(); });
  expect(second).toBe(first);
  expect(first).not.toBe(0);
});

test("P·terrain: landing picks the span you are in, not the deepest floor", async ({ page }) => {
  await page.evaluate(() => __doids.loadChamber("slice"));
  const r = await page.evaluate(() => {
    const s = level.spans;
    let x = null;
    for (let i = 1; i < s.length - 1; i++) if (s[i].length >= 2) { x = i * STEP; break; }
    const col = __doids.spans(x);
    const above = (col[0].top + col[0].bot) / 2, below = (col[1].top + col[1].bot) / 2;
    return { x, above, below,
      fromAbove: __doids.ground(x, above), fromBelow: __doids.ground(x, below) };
  });
  // over a mezzanine: from above the ground is the shelf's milled top face;
  // from below it is the hall floor far beneath it
  expect(r.fromAbove).toBeLessThan(r.fromBelow);
  // settle the ship onto the shelf and it must come to rest ON the shelf
  await page.evaluate(p => {
    ship.x = p.x; ship.y = p.above; ship.vx = 0; ship.vy = 0;
    ship.ang = 0; ship.landed = false; ship.dead = false;
  }, r);
  await page.waitForTimeout(900);
  const s = await page.evaluate(() => __doids.get());
  expect(s.ship.dead).toBe(false);
  expect(s.ship.y).toBeLessThan(r.fromBelow);
});

/* ---- §8: the terrain is allowed to LIE, in declared places only ---------- */

test("P·terrain: drawn and solid terrain agree — except where §8 says they lie", async ({ page }) => {
  /* This replaces an earlier test asserting "the rock you see is the rock you
     hit" everywhere. That is the right invariant for HONEST terrain and exactly
     the wrong one for Act Two: §8's two hazards are a false floor (drawn, not
     there — you drop through it) and painted rock (real, never drawn — you fly
     into a wall that looked like air). Asserting global agreement would have
     forced the deceptions to be built outside the terrain model. */
  const r = await page.evaluate(() => {
    __doids.loadChamber("slice");
    return __doids.deceptions();
  });
  // the chamber declares both hazards, and they are the ONLY disagreements
  expect(r.falseFloors).toBeGreaterThan(0);
  expect(r.paintedRock).toBeGreaterThan(0);

  // a false floor: drawn geometry has a ledge there, collision does not, so the
  // real ground is strictly lower than the ledge you can see
  const ff = await page.evaluate(() => __doids.falseFloorProbe());
  expect(ff).not.toBeNull();
  expect(ff.drawnLedge).toBeLessThan(ff.realGround);   // you drop
  expect(ff.solidAtLedge).toBe(false);                 // nothing there to land on

  // painted rock: collision has a wall, the drawn view has open space
  const pr = await page.evaluate(() => __doids.paintedRockProbe());
  expect(pr).not.toBeNull();
  expect(pr.solid).toBe(true);        // you hit it
  expect(pr.drawnOpen).toBe(true);    // it looks like air

  // and the two views differ ONLY inside a part that declared a view, so a
  // deception can only ever be deliberate — never drift
  expect(r.undeclaredColumns).toBe(0);
});

test("P·terrain: what you see is what you hit, wherever the terrain is honest", async ({ page }) => {
  // the pixel-level version of the above: sample the RENDERED canvas and compare
  // with solidAt at points chosen to sit well away from the two declared lies.
  const probes = await page.evaluate(() => {
    __doids.loadChamber("slice");
    // lights off: they are additive radial pools, so two points a few px apart
    // differ in brightness and this test would measure the lighting rather than
    // the geometry. Lighting has its own test below.
    level.lights = [];
    const honest = __doids.honestProbePoints();
    /* Classify by nearest REFERENCE colour rather than a luminance threshold, so
       this keeps testing geometry rather than palette — the rock tone has already
       changed once (steel to ROCK_PAL when materials landed) and a hardcoded
       threshold silently inverted the whole test when it did. __doids.samplePixel
       keeps the probe clear of the ship, the HUD and the containment field. */
    const refRock = __doids.samplePixel(honest.refRock[0], honest.refRock[1]);
    const refAir = __doids.samplePixel(honest.refAir[0], honest.refAir[1]);
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const out = honest.points.map(([name, wx, wy]) => {
      const px = __doids.samplePixel(wx, wy);
      return { name, drawnRock: dist(px, refRock) < dist(px, refAir),
        solid: __doids.solidAt(wx, wy) };
    });
    // guard the references themselves: if rock and air render alike the test is
    // meaningless and must fail loudly rather than pass by coincidence
    out.push({ name: "references are distinguishable",
      drawnRock: dist(refRock, refAir) > 24, solid: true });
    return out;
  });
  expect(probes.length).toBeGreaterThanOrEqual(7);
  for (const pr of probes) expect(pr.drawnRock, pr.name).toBe(pr.solid);
  expect(probes.some(p => p.solid)).toBe(true);
  expect(probes.some(p => !p.solid)).toBe(true);
});
test("P·terrain: chamber rock is seamless across tile boundaries", async ({ page }) => {
  // spans are drawn per 512px tile, and each tile only covers the vertical band
  // its own spans occupy. Anchoring the rock gradient to that band instead of to
  // the world puts a hard vertical step at every boundary where the band changes
  // — visible as a seam down the middle of solid rock. Act One avoids it by
  // passing fixed gradient stops into buildHeightTile; spans must do the same.
  const seams = await page.evaluate(() => {
    __doids.loadChamber("slice");
    level.lights = [];   // additive light pools would read as a false seam
    const out = [];
    for (const bx of [3072, 4096, 5120]) {
      // derive a y that is rock on BOTH sides rather than hardcoding one, so this
      // stays honest if the chamber is ever retuned: sit above the shallowest
      // ceiling either side of the boundary
      const tops = [bx - 14, bx + 14].map(x => {
        const col = __doids.spans(x);
        return col.length ? col[0].top : null;
      }).filter(v => v != null);
      const wy = Math.max(20, Math.min(...tops) - 40);
      const a = __doids.samplePixel(bx - 14, wy), b = __doids.samplePixel(bx + 14, wy);
      out.push({ bx,
        solid: __doids.solidAt(bx - 14, wy) && __doids.solidAt(bx + 14, wy),
        delta: Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])) });
    }
    return out;
  });
  for (const s of seams) {
    expect(s.solid, `x=${s.bx} is rock either side`).toBe(true);
    // a band-anchored gradient showed deltas of 20+ here; world-anchored is ~0
    expect(s.delta, `seam at tile boundary x=${s.bx}`).toBeLessThan(8);
  }
});

test("P·terrain: a chamber is lit by fixtures, and they sit on real surfaces", async ({ page }) => {
  /* §9.2 — a plant is a lit, maintained facility, and the owner ask was to get
     there via lots of light sources rather than a brighter flat fill. Two things
     matter: the room is measurably brighter with them than without, and no
     fixture is buried in rock or floating in mid-air (they snap to a surface). */
  const r = await page.evaluate(() => {
    __doids.loadChamber("slice");
    const lights = level.lights.map(L => ({ x: L.x, y: L.y,
      // a fitting must be within a span, i.e. in open space, not inside the mass
      inAir: !__doids.solidAt(L.x, L.y + (L.snap === "ceil" ? 6 : -6)),
      // and close to the surface it claims to be fixed to
      offSurface: L.snap === "ceil"
        ? Math.abs(L.y - __doids.roofAtY(L.x, L.y + 6))
        : Math.abs(L.y - __doids.ground(L.x, L.y - 6)) }));
    // brightness with and without, sampled over the hall
    const lum = () => {
      camera.x = 1200; camera.y = 850; ship.x = 1200; ship.y = 850;
      ship.landed = true; ship.dead = false; level.total = 1;
      render(performance.now() / 1000);
      const d = ctx.getImageData(0, 0, Math.floor(vw * dpr), Math.floor(vh * dpr)).data;
      let t = 0, n = 0;
      for (let i = 0; i < d.length; i += 4 * 97) { t += d[i] + d[i + 1] + d[i + 2]; n += 3; }
      return t / n;
    };
    const withLights = lum();
    const saved = level.lights; level.lights = [];
    const without = lum();
    level.lights = saved;
    return { count: lights.length, lights, withLights, without };
  });
  expect(r.count).toBeGreaterThanOrEqual(8);          // "lots of light sources"
  expect(r.withLights).toBeGreaterThan(r.without);    // and they actually light it
  for (const L of r.lights) {
    expect(L.inAir, `fixture at ${L.x},${L.y} is not buried in rock`).toBe(true);
    expect(L.offSurface, `fixture at ${L.x},${L.y} is fixed to its surface`).toBeLessThan(40);
  }
});

test("P·terrain: groundAt works with one argument on a chamber too", async ({ page }) => {
  /* Regression: pickSpan started `best` at null with a strict `<`, so the
     no-y sentinel left every candidate at distance Infinity, failed the
     comparison every time and returned null for a column that plainly had
     spans. groundAt(x) then fell through to levelH() — the bottom of the
     world. Act One never hit it (heightmap path), but dozens of shipped call
     sites pass x alone, so every one of them would have broken in a chamber. */
  const r = await page.evaluate(() => {
    __doids.loadChamber("slice");
    const s = level.spans;
    let single = null, multi = null;
    for (let i = 2; i < s.length - 2; i++) {
      if (!single && s[i].length === 1) single = i * STEP;
      if (!multi && s[i].length >= 2) multi = i * STEP;
    }
    return {
      H: level.H,
      singleOneArg: __doids.ground(single), singleSpans: __doids.spans(single),
      multiOneArg: __doids.ground(multi), multiSpans: __doids.spans(multi)
    };
  });
  // one argument must give a real floor, never the world's bottom edge
  expect(r.singleOneArg).toBeLessThan(r.H);
  expect(r.singleOneArg).toBeCloseTo(r.singleSpans[0].bot, 0);
  // in a column with an overhang, one argument means the LOWEST floor — the
  // heightmap's single answer, which is what every Act One call site expects
  expect(r.multiOneArg).toBeLessThan(r.H);
  expect(r.multiOneArg).toBeCloseTo(r.multiSpans[r.multiSpans.length - 1].bot, 0);
});

test("P·terrain: rack scale and the tow envelope, including the momentum pinch", async ({ page }) => {
  /* Owner review: the rack read as too big, and measuring showed worse — but the
     first correction's arithmetic was ALSO wrong. It assumed a 24px tether and
     stacked the full cage height below it; PENDULUM_SPEC §4.1 gives SLING_L = 46
     centre-to-centre, so the real at-rest depth is SHIP_R + SLING_L + cage/2 =
     11 + 46 + 33 = 90px, not 158. The 98px pinch was passable all along.

     What the geometry actually gives is three tiers, and the middle one is the
     owner's momentum-pinch idea: a gap too tight to creep through with the load
     hanging, passable if you carry enough speed to trail it at your own level. */
  const t = await page.evaluate(() => { __doids.loadChamber("slice"); return __doids.towClearance(); });

  // the size rules the owner set: under a sixth of the room's height, and a bank
  // of eight to twelve read side by side is wider than it is tall
  expect(t.cage.h).toBeLessThan(t.medianGap / 6);
  expect(t.cage.w).toBeGreaterThan(t.cage.h);

  /* The envelope, asserted as the FORMULA rather than as literals. Writing
     `atRest === 90` here was the same mistake this file keeps catching elsewhere:
     it pins a value that follows from a tunable, so it failed the moment the rack
     was resized — even though the geometry was still perfectly correct. */
  expect(t.tether).toBe(46);                                    // PENDULUM_SPEC §4.1
  expect(t.atRest).toBeCloseTo(t.shipDiameter / 2 + t.tether + t.cage.h / 2, 1);
  expect(t.atSpeed).toBeCloseTo(Math.max(t.shipDiameter, t.cage.h), 1);
  expect(t.atSpeed).toBeLessThan(t.atRest);

  // the chamber authors a real momentum pinch, and it sits strictly inside the
  // band — not merely tight, and not impassable
  expect(t.tiers.momentum).toBeGreaterThan(0);
  expect(t.tightestMomentum).toBeGreaterThanOrEqual(t.atSpeed);
  expect(t.tightestMomentum).toBeLessThan(t.atRest);

  // nothing in the chamber blocks a laden ship outright: this is one hall, so an
  // unladen-only gap here would make the floor unclearable while towing, which is
  // the invariant P·content carries (every chamber clearable with everyone alive)
  expect(t.tiers.unladen).toBe(0);
  // and the great majority of the floor is still ordinary flying
  expect(t.tiers.rest / t.gapCount).toBeGreaterThan(0.9);
});

test("P·terrain: an authored pinch compiles to the tier it claims", async ({ page }) => {
  /* The gap IS the mechanic, so it cannot be left to the terrain noise. The
     hall's ±22px floor roughness put this pinch at 75px rather than the intended
     78 until it was pinned from both sides, and a reseed could have dropped it
     out of the momentum band entirely. Assert intent against compiled geometry. */
  const r = await page.evaluate(() => {
    __doids.loadChamber("slice");
    const declared = __doids.declaredPinches();
    return declared.map(d => {
      // the tightest gap actually compiled across the part's span
      let tightest = Infinity;
      for (let x = d.x; x <= d.x + d.w; x += STEP) {
        for (const sp of __doids.spans(x)) tightest = Math.min(tightest, sp.bot - sp.top);
      }
      return { kind: d.kind, x: d.x, tightest: Math.round(tightest),
        tier: __doids.towTier(tightest) };
    });
  });
  expect(r.length).toBeGreaterThan(0);
  for (const d of r) expect(d.tier, `pinch at x=${d.x} claims ${d.kind}`).toBe(d.kind);
});
