// Hollow Oath — The finale & endings.
//
// Glycon's third act and the ways a run ends: the counterfeit MERCY, the twin
// reveal, the Solace, the answered epilogue and SILENCE BY FIRE.
// Drives the game headlessly through window.__doids; the shared per-test guard
// (navigate + fail on any console error) lives in tests/harness.js.
// See tests/README.md for what belongs in which file.
const { test, expect } = require("@playwright/test");
const { useGame } = require("./harness");

useGame(test, expect);

test("the answered ending plays the SOLACE epilogue and clears the haunt (Bundle L)", async ({ page }) => {
  // start haunted (as after an unresolved ending)
  await page.evaluate(() => localStorage.setItem("doids_unres", "1"));
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  let s = await page.evaluate(() => __doids.get());
  expect(s.unresolvedHaunt).toBe(true);
  // land beside the beacon and answer the call
  await page.evaluate(() => { __doids.go(7); __doids.launch(); __doids.warpBeacon(); __doids.answerBeacon(); });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 9000 });
  s = await page.evaluate(() => __doids.get());
  expect(s.endingType).toBe("answered");
  expect(s.unresolvedHaunt).toBe(false);   // the Static is heard; the title rests
  // V17 — the payoff moment: the whole submerged hull lights up the instant
  // her pulse is actually returned, not just on the ambient 41s-beat tell.
  // Owner playtest follow-up: the original fix only set sonarT once, and
  // since nothing decremented it during "epilogue" it sat frozen at exactly
  // SONAR_DUR — which is puls=0 (fully transparent) the whole scene, so the
  // hull never actually looked lit. updateEpilogue now ticks it down and
  // re-arms it, so the sweep plays and repeats through the whole scene.
  expect(s.level.beacon.sonarT).toBeGreaterThan(0);
  await page.waitForTimeout(2200);   // past one SONAR_DUR (1.8s) — must have re-armed
  expect(await page.evaluate(() => level.beacon.sonarT)).toBeGreaterThan(0);
  // the typed line arrives, then a tap advances to the ending card
  await page.waitForFunction(() => __doids.get().epilogueChars > 4, null, { timeout: 5000 });
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "ending", null, { timeout: 3000 });
});

test("the counterfeit MERCY: docking springs the trap — a full life lost; the real bays still work (Bundle N)", async ({ page }) => {
  await page.evaluate(() => { __doids.setVeteran(); __doids.go(7); __doids.launch(); level.mercySplitT = 0; });
  let s = await page.evaluate(() => __doids.get());
  expect(s.fakeMercy).toBeTruthy();
  expect(s.fakeMercy.dead).toBe(false);
  const livesBefore = s.lives;
  // hold the ship inside the decoy's bay — after 2s the bay shows its teeth
  await page.evaluate(() => {
    ship.x = level.fakeMercy.x; ship.y = level.fakeMercy.y + 70;
    ship.vx = ship.vy = 0; ship.landed = true;   // pin it for the dwell
  });
  await page.waitForFunction(() => level.fakeMercy.dead, null, { timeout: 5000 });
  s = await page.evaluate(() => __doids.get());
  expect(s.decoyOutcome).toBe("trapped");
  // V15 — the reveal now holds as a tap-gated panel; shipDie() (and the life
  // it costs) only fires once the player dismisses it, not in the same tick
  expect(s.state).toBe("trapcard");
  expect(s.lives).toBe(livesBefore);
  await page.waitForTimeout(450);   // clear the trapcard's stateT > 0.4 tap guard
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "dead", null, { timeout: 3000 });
  s = await page.evaluate(() => __doids.get());
  // V13 (owner steer) — the trap costs a full life, not a score ding
  expect(s.lives).toBe(livesBefore - 1);
  // the real MERCY's bay is untouched by the decoy machinery
  const realBayOk = await page.evaluate(() => {
    const b = bayRects().med;
    return b.x0 < level.mx && level.mx < b.x1;
  });
  expect(realBayOk).toBe(true);
});

test("the counterfeit MERCY yields to observation: landed scan powers it down for +2000 (Bundle N3)", async ({ page }) => {
  // V13 — the twin's position (and so the ship's midpoint spawn) now varies
  // run to run; go/launch and parking the stranded Scions must land in the
  // SAME evaluate() call, with no round trip between them, or an oid placed
  // near this run's particular spawn point can walk over and board (+500)
  // before the reset below ever takes effect, flaking the score assertion.
  await page.evaluate(() => {
    __doids.setVeteran(); __doids.go(7); __doids.launch(); level.mercySplitT = 0;
    level.turrets.forEach(t => { t.alive = false; });
    level.drones.forEach(d => { d.alive = false; });
    // park the stranded Scions far away so none boards (+500) mid-scan
    level.oids.forEach(o => { o.x = 150; o.home = 150; });
    // …and the scannable scenery too. updateScan() sweeps ANY unrevealed
    // fake/hollow prop within 60px x / 110px y of the landed ship, and a
    // lure-tree pays its own +500 (revealSecret, js/update.js) on top of the
    // twin's +800. Because the twin's spawn is randomised per run, one landed
    // near a lure-tree ~9% of the time and the score assertion saw 1300 —
    // measured over 400 generations while diagnosing it. Moving them is enough;
    // don't mark them dead, since that changes what the scan can find.
    level.scenery.forEach(sc => { if (sc.fake || sc.hollow) sc.x = 150; });
    const f = level.fakeMercy;
    ship.x = f.x; ship.y = __doids.ground(f.x) - 11;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true;
  });
  const before = await page.evaluate(() => __doids.get().score);
  await page.waitForFunction(() => level.fakeMercy.dead, null, { timeout: 9000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.decoyOutcome).toBe("observed");
  expect(s.score).toBe(before + 2000);   // owner steer: raised from +800
  expect(s.scannedSecret).toBe(true);
  expect(s.firedAtSecret).toBe(false);   // observed, not shot — the oath holds
  // the beacon is still there: both endings remain reachable
  expect(s.level.beacon.resolved).toBe(false);
});

test("V13: three rounds bring the counterfeit MERCY down, not one — a stray shot can't accidentally reveal her", async ({ page }) => {
  await page.evaluate(() => { __doids.setVeteran(); __doids.go(7); __doids.launch(); level.mercySplitT = 0; });
  const before = await page.evaluate(() => __doids.get().score);
  // first two rounds: she absorbs the hit but doesn't go down, and there's
  // no reward/reveal yet — a stray shot meant for something else can't trip it
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const f = level.fakeMercy;
      level.shots.push({ x: f.x, y: f.y - 10, vx: 0, vy: 0, t: 1 });
    });
    await page.waitForTimeout(80);
  }
  let s = await page.evaluate(() => __doids.get());
  expect(s.fakeMercy.dead, "two rounds aren't enough").toBe(false);
  expect(s.fakeMercy.hp, "one hp left").toBe(1);
  expect(s.decoyOutcome).toBeNull();
  expect(s.score, "no reward yet, just absorbed hits").toBe(before);
  // the third round finishes her — that's when the reveal card and reward land
  await page.evaluate(() => {
    const f = level.fakeMercy;
    level.shots.push({ x: f.x, y: f.y - 10, vx: 0, vy: 0, t: 1 });
  });
  await page.waitForTimeout(80);
  s = await page.evaluate(() => __doids.get());
  expect(s.fakeMercy.dead).toBe(true);
  expect(s.decoyOutcome).toBe("observed");
  expect(s.score).toBe(before + 2000);   // owner steer: raised from +800
  expect(s.firedAtSecret).toBe(true);
});

test("V3: landing beside the finale source reveals AMS Solace and pulses her hull", async ({ page }) => {
  await page.evaluate(() => { __doids.go(7); __doids.launch(); });
  await page.evaluate(() => {
    level.turrets.forEach(t => t.alive = false); level.drones.forEach(d => d.alive = false);
    (level.oids || []).forEach(o => o.x = -9999);
    const bx = level.beacon.x;
    ship.x = bx - 70; ship.y = __doids.ground(bx - 70) - 11;
    ship.vx = ship.vy = 0; ship.landed = true; ship.dead = false;
  });
  await page.waitForFunction(() => level.beacon.revealed === true, null, { timeout: 2000 });
  const s = await page.evaluate(() => ({ revealed: level.beacon.revealed, sonarT: level.beacon.sonarT }));
  expect(s.revealed).toBe(true);
  expect(s.sonarT).toBeGreaterThan(0);   // her hull is pulsing back into view
});

test("V6-finale: the Solace is answered by parrying her pulse, not by holding", async ({ page }) => {
  await page.evaluate(() => { __doids.go(7); __doids.launch(); });
  await page.evaluate(() => {
    level.turrets.forEach(t => t.alive = false); level.drones.forEach(d => d.alive = false);
    (level.oids || []).forEach(o => o.x = -9999);
    const bx = level.beacon.x;
    ship.x = bx - 60; ship.y = __doids.ground(bx - 60) - 11; ship.vx = ship.vy = 0; ship.landed = true; ship.dead = false;
  });
  // examining her pops a quiet clue card (not an instruction banner) — dismiss it
  await page.waitForFunction(() => level.beacon.revealed === true, null, { timeout: 2000 });
  expect(await page.evaluate(() => __doids.get().state), "a clue card, not a big message").toBe("reveal");
  await page.waitForTimeout(450);   // the reveal card guards taps until stateT > 0.4
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "play", null, { timeout: 2000 });
  // land-and-hold no longer answers: sit for well over the old 5s window
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => __doids.get().state), "holding no longer answers").toBe("play");
  expect(await page.evaluate(() => level.beacon.resolved)).toBe(false);
  // parry her pulse → answered
  await page.evaluate(() => { input.shield = false; ship.shield = false; ship.parryT = 0; });
  await page.waitForTimeout(40);
  await page.evaluate(() => { input.shield = true; __doids.armWave({ finale: true }); });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 4000 });
  expect(await page.evaluate(() => __doids.get().endingType)).toBe("answered");
  await page.evaluate(() => { input.shield = false; });
});

test("V12: the finale spawns two identical MERCYs at randomised, separated positions; the beat is the only tell", async ({ page }) => {
  await page.evaluate(() => { __doids.setVeteran(); __doids.go(7); __doids.launch(); });
  const s = await page.evaluate(() => ({
    mx: level.mx, fx: level.fakeMercy.x, split: level.mercySplitT, W: level.W, shipX: ship.x
  }));
  // both well inside the field and well separated (no fixed home / no fixed decoy spot)
  expect(Math.abs(s.mx - s.fx), "the two MERCYs are well separated").toBeGreaterThan(s.W * 0.2);
  expect(s.mx).toBeGreaterThan(s.W * 0.1);
  expect(s.fx).toBeGreaterThan(s.W * 0.1);
  expect(s.split, "arrives with the split-reveal running").toBeGreaterThan(0);
  // V13 (owner steer) — arriving right next to the real one would give the
  // answer away before the split even means anything; spawn is the midpoint
  // between both ships, not glued to level.mx
  expect(s.shipX, "spawn sits at the midpoint, not on the real MERCY").toBeCloseTo((s.mx + s.fx) / 2, 0);
  expect(Math.abs(s.shipX - s.mx)).toBeGreaterThan(s.W * 0.08);
  // the decoy is inert while the split reveal plays
  await page.evaluate(() => {
    const f = level.fakeMercy; ship.x = f.x; ship.y = f.y + 70; ship.vx = ship.vy = 0; ship.landed = true; ship.dead = false;
  });
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => level.fakeMercy.dead), "inert during the reveal").toBe(false);
  // once the reveal settles, docking the counterfeit still springs the trap
  await page.evaluate(() => {
    level.mercySplitT = 0;
    window.__pin = setInterval(() => { const f = level.fakeMercy; ship.x = f.x; ship.y = f.y + 70; ship.vx = ship.vy = 0; ship.landed = true; ship.dead = false; }, 16);
  });
  await page.waitForFunction(() => level.fakeMercy.dead, null, { timeout: 5000 });
  await page.evaluate(() => clearInterval(window.__pin));
  expect(await page.evaluate(() => __doids.get().decoyOutcome)).toBe("trapped");
});

test("V13: the finale twin's roll isn't tied to the deterministic campaign seed — it varies run to run", async ({ page }) => {
  // bug report: "fake mercy has always been on the left" — campaign mode
  // always regenerates sector 7 at the same seed (runSeed 0), so rolling the
  // twin with the level's seeded rng (rather than Math.random) made which
  // side is real perfectly reproducible: identical on every single campaign
  // veteran run. Regenerating the same seed-0 finale twice must NOT produce
  // the same roll (continuous positions — an exact repeat is a real bug, not
  // luck; see rollMercyTwin's call in js/world.js).
  await page.evaluate(() => { __doids.setVeteran(); __doids.go(7); __doids.launch(); });
  const first = await page.evaluate(() => ({ mx: level.mx, fx: level.fakeMercy.x }));
  await page.evaluate(() => { __doids.reset(); __doids.go(7); __doids.launch(); });
  const second = await page.evaluate(() => ({ mx: level.mx, fx: level.fakeMercy.x }));
  expect(first.mx === second.mx && first.fx === second.fx).toBe(false);
});

test("V13: the finale twin's arrival is staged — hold, flicker out, a gap, then flicker in", async ({ page }) => {
  await page.evaluate(() => { __doids.setVeteran(); __doids.go(7); __doids.launch(); });
  // phase 1 — the hold: a single ordinary MERCY, the real two fully invisible
  expect(await page.evaluate(() => twinInAlpha(1))).toBe(0);
  // phase 2 — partway through the illusion's flicker-out stretch
  await page.evaluate(() => { level.mercySplitT = MERCY_SPLIT_DUR - (TWIN_HOLD + 0.5); });
  expect(await page.evaluate(() => twinInAlpha(1)), "reals still invisible mid flicker-out").toBe(0);
  expect(await page.evaluate(() => {
    const e = MERCY_SPLIT_DUR - level.mercySplitT; return e > TWIN_HOLD && e < TWIN_OUT;
  }), "landed inside the OUT stretch").toBe(true);
  // the gap — illusion fully gone, reals not yet started: nothing visible at all
  await page.evaluate(() => { level.mercySplitT = MERCY_SPLIT_DUR - (TWIN_OUT + 0.1); });
  expect(await page.evaluate(() => twinInAlpha(1)), "the gap between OUT and the second pulse").toBe(0);
  // phase 3 — partway through the real two's flicker-in stretch
  await page.evaluate(() => { level.mercySplitT = MERCY_SPLIT_DUR - (TWIN_PULSE2 + 0.5); });
  const midIn = await page.evaluate(() => twinInAlpha(1));
  expect(midIn, "mid flicker-in: neither 0 nor fully solid").toBeGreaterThan(0);
  expect(midIn).toBeLessThan(1);
  // phase 4 — fully resolved, stable
  await page.evaluate(() => { level.mercySplitT = 0; });
  expect(await page.evaluate(() => twinInAlpha(1))).toBe(1);
});

test("V13: losing a life inside the unresolved finale twin re-rolls it and replays the split reveal", async ({ page }) => {
  await page.evaluate(() => { __doids.setVeteran(); __doids.go(7); __doids.launch(); });
  const before = await page.evaluate(() => {
    level.mercySplitT = 0;   // the reveal has already settled — still unresolved, just no longer playing
    return { mx: level.mx, fx: level.fakeMercy.x };
  });
  // die with lives remaining, inside the still-unresolved twin
  await page.evaluate(() => { lives = 2; ship.dead = false; ship.passengers = []; shipDie(); });
  expect(await page.evaluate(() => __doids.get().state)).toBe("dead");
  await page.waitForTimeout(1700);   // clear the "dead" state's stateT > 1.6 guard
  await page.waitForFunction(() => __doids.get().state === "play", null, { timeout: 3000 });
  const after = await page.evaluate(() => ({
    mx: level.mx, fx: level.fakeMercy.x, split: level.mercySplitT, shipX: ship.x, W: level.W
  }));
  expect(after.split, "the split reveal plays again on respawn").toBeGreaterThan(0);
  expect(after.mx !== before.mx || after.fx !== before.fx,
    "which side is real is re-rolled, not carried over from before the death").toBe(true);
  // and the respawn still lands at the (new) midpoint, not next to either ship
  expect(after.shipX).toBeCloseTo((after.mx + after.fx) / 2, 0);
});

test("Bad ending: the Solace can be destroyed by fire — full-hull blast, then SILENCE BY FIRE", async ({ page }) => {
  await page.evaluate(() => {
    __doids.go(7); __doids.launch();
    level.turrets.forEach(t => t.alive = false); level.drones.forEach(d => d.alive = false);
  });
  const hp0 = await page.evaluate(() => level.beacon.hp);
  expect(hp0).toBeGreaterThan(0);
  // she CAN be shot down — the destroy-on-sight order the CMO refused to sign.
  // A player round on the tower drops her HP (the shootable path is wired).
  await page.evaluate(() => { const b = level.beacon; level.shots.push({ x: b.x, y: b.y - 40, vx: 0, vy: 0, t: 1 }); });
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => level.beacon.hp), "a round drops her HP").toBe(hp0 - 1);
  // finish her off → a scripted destruction plays (the full hull revealed, breaking),
  // NOT an instant card
  await page.evaluate(() => __doids.fireSolace());
  expect(await page.evaluate(() => __doids.get().state)).toBe("destruct");
  expect(await page.evaluate(() => level.beacon.resolved && level.beacon.death != null)).toBe(true);
  // the scripted destruction (ignite → reveal → boom → crater) plays, then it
  // lands on the fire ending card
  await page.waitForFunction(() => __doids.get().state === "ending", null, { timeout: 9000 });
  expect(await page.evaluate(() => __doids.get().endingType)).toBe("fire");
  // V13 — the bad ending gets its own "win" panel (drawFireEnding), not a
  // reskinned MISSION COMPLETE; tap through and confirm it renders (no JS
  // error surfaces as a hung/blank page) and the tally is persisted for the
  // next veteran-intro recap
  await page.waitForTimeout(1100);
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "win", null, { timeout: 2000 });
  await page.waitForTimeout(100);   // let drawFireEnding actually paint a frame
  expect(await page.evaluate(() => __doids.get().endingType)).toBe("fire");
  expect(await page.evaluate(() => __doids.lastRunTally())).toEqual(
    await page.evaluate(() => ({ saved: __doids.get().runSaved, lost: __doids.get().runLost })));
});

/* (owner feedback, July 2026 — "the beacon wouldn't respond") — she used to pulse
   only AFTER being revealed by a landing within 120px, so hovering beside her gave
   nothing back at all and the beat had no tell once the hint label was removed. */
/* (owner feedback, July 2026 — "I didn't get the card either… it just started
   pinging me") — the reveal band was 120px, narrower than the ship she is buried
   under: the ridge is flattened ±250 and her hull spans ±198. Setting down on top
   of her buried hull, inside ANSWER_RANGE and being pulsed, gave nothing. The V3
   test above can't catch this because warpBeacon() teleports to her exact x. */
test("V3: landing anywhere ON the Solace's buried hull names her, not just beside her tower", async ({ page }) => {
  const hullHalf = 152 * 1.3;   // solaceMercyPath half-width × SOLACE_MS
  expect(await page.evaluate(() => REVEAL_RANGE)).toBeGreaterThanOrEqual(Math.floor(hullHalf));
  expect(await page.evaluate(() => REVEAL_RANGE)).toBeLessThan(await page.evaluate(() => ANSWER_RANGE));
  // touch down 170px off her tower — over her hull, outside the old 120 band
  await page.evaluate(() => {
    __doids.setVeteran(); __doids.go(7); __doids.launch();
    level.turrets.forEach(t => t.alive = false); level.drones.forEach(d => d.alive = false);
    const b = level.beacon;
    ship.x = b.x - 170; ship.y = groundAt(ship.x) - SHIP_R;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true;
  });
  await page.waitForFunction(() => level.beacon.revealed === true, null, { timeout: 3000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("reveal");
  expect(s.revealCard.kicker).toContain("AMS SOLACE");
  // the ridge really is flat out there — this was a landable spot, not a cliff
  const flat = await page.evaluate(() => {
    const b = level.beacon;
    return Math.abs(groundAt(b.x - 170) - groundAt(b.x)) < 6;
  });
  expect(flat, "her ridge is flattened, so 170px out is genuinely landable").toBe(true);
});

test("the Solace transmits on approach: a pre-reveal wash is free, and a pre-reveal parry names her rather than answering her", async ({ page }) => {
  await page.evaluate(() => {
    __doids.setVeteran(); __doids.go(7); __doids.launch();
    level.turrets.forEach(t => t.alive = false); level.drones.forEach(d => d.alive = false);
    level.waves = [];
    // sit parked 200px away: outside the 120px reveal band, inside the 300px
    // pulse radius. Landed rather than hovering so gravity can't drop the ship
    // into the reveal (or into a crash) while we wait out ANSWER_GAP.
    const b = level.beacon;
    ship.x = b.x - 200; ship.y = groundAt(ship.x) - SHIP_R;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true;
  });
  const d = await page.evaluate(() => Math.hypot(ship.x - level.beacon.x, ship.y - level.beacon.y));
  expect(d, "parked inside her pulse radius").toBeLessThan(300);
  expect(await page.evaluate(() => level.beacon.revealed), "too far to have named her").toBeFalsy();
  // she casts anyway, and the wave is marked pre-reveal
  await page.waitForFunction(() => (level.waves || []).some(w => w.finale), null, { timeout: 8000 });
  expect(await page.evaluate(() => level.waves.find(w => w.finale).preReveal)).toBe(true);
  // letting it wash over costs no vitals (it's a tell, not a punishment)
  const v0 = await page.evaluate(() => { ship.vitals = 90; return ship.vitals; });
  await page.evaluate(() => {
    ship.shield = false; ship.parryT = 0;
    level.waves = [{ src: level.beacon, ox: level.beacon.x, oy: level.beacon.y - 40,
      t: WAVE_ARRIVE - 0.01, done: false, hit: false, finale: true, preReveal: true }];
  });
  await page.waitForFunction(() => (level.waves[0] || {}).done === true, null, { timeout: 3000 });
  expect(await page.evaluate(() => ship.vitals), "a pre-reveal wash is free").toBe(v0);
  /* A pre-reveal parry must never be a no-op — it's the hardest input in the game.
     It doesn't resolve her (the STILL TRANSMITTING card would then land after its
     own payoff), it NAMES her: she answers being answered. Owner-reported as "I
     parry, I see it bounce back, and nothing happens". */
  await page.evaluate(() => { level.beacon.heardParry = true; });
  await page.waitForFunction(() => level.beacon.revealed === true, null, { timeout: 3000 });
  let s = await page.evaluate(() => __doids.get());
  expect(s.state, "the parry earns the reveal card").toBe("reveal");
  expect(s.revealCard.kicker).toContain("AMS SOLACE");
  expect(await page.evaluate(() => level.beacon.resolved), "named, not yet answered").toBeFalsy();
  expect(await page.evaluate(() => level.beacon.heardParry), "consumed, not banked").toBe(false);
  // dismiss it, and NOW a second parry answers her
  await page.waitForTimeout(600);
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "play", null, { timeout: 3000 });
  // her pulses cost full vitals from here — she's named and the card has said
  // the signal seeks a response
  expect(await page.evaluate(() => {
    level.waves = [];
    return null;
  })).toBeNull();
  await page.waitForFunction(() => (level.waves || []).some(w => w.finale), null, { timeout: 8000 });
  expect(await page.evaluate(() => level.waves.find(w => w.finale).preReveal)).toBe(false);
  await page.evaluate(() => { level.beacon.heardParry = true; });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 3000 });
  expect(await page.evaluate(() => __doids.get().endingType)).toBe("answered");
});

/* (owner feedback, July 2026) — the post-completion flow. A FIRST completion
   still flows straight on from the win screen (that tap is what plays the
   once-only VET_INTRO); a REPEAT completion goes home to the title with the
   rotation nudge, instead of silently launching sector 1 of another campaign. */
test("a repeat completion returns to the title with the rotation nudge, not straight into a new campaign", async ({ page }) => {
  // already a veteran (and the veteran opening already seen) before this run —
  // exactly the state the owner was in when the flow dumped them into sector 1
  await page.evaluate(() => {
    localStorage.setItem("doids_veteran", "1");
    localStorage.setItem("doids_vetintro", "1");
  });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  expect((await page.evaluate(() => __doids.get())).vetIntroSeen).toBe(true);
  await page.evaluate(() => { __doids.go(7); __doids.launch(); __doids.warpBeacon(); __doids.answerBeacon(); });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 9000 });
  // this run was NOT the first completion
  expect((await page.evaluate(() => __doids.get())).endingFirstRun).toBe(false);
  await page.waitForFunction(() => __doids.get().epilogueChars > 4, null, { timeout: 5000 });
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "ending", null, { timeout: 3000 });
  await page.waitForTimeout(1100);   // the ending's stateT > 1 guard
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "win", null, { timeout: 3000 });
  await page.waitForTimeout(700);    // the win screen's stateT > 0.6 tap guard
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "title", null, { timeout: 3000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.titleNudge, "the title carries the REMIX/DAILY nudge").toBe(true);
  expect(s.levelIdx, "no new campaign was launched behind the title").not.toBe(0);
  // and the nudge is spent the moment a rotation actually starts
  await page.evaluate(() => __doids.remix(7));
  expect((await page.evaluate(() => __doids.get())).titleNudge).toBe(false);
});

test("a first completion still flows straight on from the win screen into the veteran opening", async ({ page }) => {
  // a clean save: not a veteran, so this completion IS the first one
  await page.evaluate(() => { __doids.go(7); __doids.launch(); __doids.warpBeacon(); __doids.answerBeacon(); });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 9000 });
  expect((await page.evaluate(() => __doids.get())).endingFirstRun).toBe(true);
  await page.waitForFunction(() => __doids.get().epilogueChars > 4, null, { timeout: 5000 });
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "ending", null, { timeout: 3000 });
  await page.waitForTimeout(1100);
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "win", null, { timeout: 3000 });
  await page.waitForTimeout(700);
  await page.evaluate(() => { input.tap = true; });
  // V8's once-only veteran opening, not the title
  await page.waitForFunction(() => __doids.get().state === "intro", null, { timeout: 3000 });
  expect((await page.evaluate(() => __doids.get())).titleNudge).toBe(false);
});

test("the Solace's hull only watermarks the title once she has actually been met", async ({ page }) => {
  // a veteran who never reached her (an unresolved run) must not have the
  // finale's biggest reveal spoiled on the menu
  await page.evaluate(() => { __doids.setVeteran(); state = "title"; });
  expect((await page.evaluate(() => __doids.get())).solaceSeen).toBe(false);
  // resolving her (either way) is what lights it, and it survives a reload
  await page.evaluate(() => { __doids.go(7); __doids.launch(); __doids.fireSolace(); });
  expect((await page.evaluate(() => __doids.get())).solaceSeen).toBe(true);
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  expect((await page.evaluate(() => __doids.get())).solaceSeen).toBe(true);
  // ...and a full RESET PROGRESS takes it back off, along with the stale
  // veteran-intro recap tally
  await page.evaluate(() => { resetProgress(); });
  const s = await page.evaluate(() => __doids.get());
  expect(s.solaceSeen).toBe(false);
  expect(s.veteran).toBe(false);
  expect(await page.evaluate(() => __doids.lastRunTally())).toEqual({ saved: 0, lost: 0 });
});

test("V16: shooting the Solace takes a beside-her turret down with the crater", async ({ page }) => {
  await page.evaluate(() => {
    __doids.go(7); __doids.launch();
    level.drones.forEach(d => d.alive = false);
    // plant one turret well inside the crater radius (240), the rest well clear
    level.turrets.forEach(t => t.alive = false);
    level.turrets.push({ x: level.beacon.x + 60, y: level.beacon.y, cd: 99, alive: true, ang: 0, _mine: true });
  });
  await page.evaluate(() => __doids.fireSolace());
  await page.waitForFunction(() => __doids.get().state === "destruct", null, { timeout: 3000 });
  // before the boom, a turret inside the eventual crater is still standing
  expect(await page.evaluate(() => level.turrets.find(t => t._mine).alive)).toBe(true);
  await page.waitForTimeout(3200);   // SOL_BOOM (2.7s) — the crater carve fires
  expect(await page.evaluate(() => level.turrets.find(t => t._mine).alive), "left hanging over the crater").toBe(false);
});
