// Hollow Oath — Scions, Vectors & the manifest.
//
// Who you carry and how you tell them apart: the landed scan, counterfeit tells
// and malpractice rules, contagion and the healing cabin, breach retrieval and
// isolation, the extraction hangar and triage retreat.
// Drives the game headlessly through window.__doids; the shared per-test guard
// (navigate + fail on any console error) lives in tests/harness.js.
// See tests/README.md for what belongs in which file.
const { test, expect } = require("@playwright/test");
const { useGame } = require("./harness");

useGame(test, expect);

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
    level.heights.fill(1000);   // flat pad so the unit creeps in cleanly, no terrain step
    // owner steer: the read now creeps the unit toward you — land a SAFE step away
    // (well beyond the ~90px danger band) so the read completes before it arrives
    const mk = role => ({ role, state: "wait", x: 740, y: 1000,
      wave: 0, persona: "wave1", scale: 1, gait: 34, panicT: 0, sabT: 0, flagged: false, verified: false });
    level.oids = [mk("saboteur")];
    ship.x = 600; ship.y = 1000 - 11; ship.vx = 0; ship.vy = 0; ship.landed = true; ship.dead = false; ship.passengers = [];
  });
  await page.waitForFunction(() => level.oids[0].flagged === true, null, { timeout: 8000 });
  // a real Scion: the same hold verifies its heartbeat and does NOT flag it
  await page.evaluate(() => {
    level.heights.fill(1000);
    level.oids = [{ role: "normal", state: "wait", x: 740, y: 1000,
      wave: 0, persona: "wave1", scale: 1, gait: 34, panicT: 0, sabT: 0, flagged: false, verified: false }];
    ship.x = 600; ship.y = 1000 - 11; ship.vx = 0; ship.vy = 0; ship.landed = true;
  });
  await page.waitForFunction(() => level.oids[0].verified === true, null, { timeout: 8000 });
  expect(await page.evaluate(() => !!level.oids[0].flagged)).toBe(false);
});

test("S5: once the husks are known, destroying a PROVEN counterfeit is not malpractice; an unproven one still is", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); __doids.setHusksKnown(); });
  // a catalogued (flagged) Vector, post-discovery: shooting it neutralises it, no penalty
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

test("V13: before the husks are known, a flagged unit is only CORRUPTED — destroying it is still malpractice, and it boards for isolation instead of sitting inert", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); });
  expect(await page.evaluate(() => __doids.husksKnown())).toBe(false);
  // pre-discovery, a catalogued (flagged) Vector destroyed on the ground is
  // still malpractice — it's suspected CORRUPTED, not proven hollow
  const before = await page.evaluate(() => {
    score = 1000;
    level.oids = [{ role: "saboteur", state: "wait", x: 600, y: __doids.ground(600),
      flagged: true, wave: 0, persona: "wave1", scale: 1 }];
    level.lost = 0; level.contained = 0; runLost = 0;
    const s = __doids.get().score;
    killOid(level.oids[0], "shot"); level.oids[0].deathT = 1.35;
    return s;
  });
  await page.waitForTimeout(150);
  let s = await page.evaluate(() => __doids.get());
  expect(s.runLost).toBe(1);
  expect(s.score).toBeLessThan(before);   // still penalised, unlike post-discovery
  // pre-discovery, a flagged unit left standing boards like anyone else (it no
  // longer sits inert on the ground once catalogued) — the correct play is to
  // carry it to the red isolation bay, not leave it or shoot it
  await page.evaluate(() => {
    level.heights.fill(1000);
    level.oids = [{ role: "saboteur", state: "wait", x: 740, y: 1000, flagged: true,
      wave: 0, persona: "wave1", scale: 1, panicT: 0, sabT: 0 }];
    ship.x = 600; ship.y = 1000 - 11; ship.vx = 0; ship.vy = 0; ship.landed = true; ship.dead = false;
    ship.passengers = [];
  });
  await page.waitForFunction(() => level.oids[0].state === "aboard", null, { timeout: 8000 });
  expect(await page.evaluate(() => ship.passengers.length)).toBe(1);
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

test("E2: a breached MERCY throws a rescued Scion; catching re-boards, hitting the ground loses them", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.waitForTimeout(150);
  // a Vector is loose in MERCY (breached, not retrieved) and a rescued Scion is
  // aboard her — updateMercyThrow hurls it back out of her bay as a falling body
  await page.evaluate(() => {
    const s = ship; s.dead = false; s.passengers = [];
    mercyBreach = { t: 45, retrieved: false, wasInfected: false, ph: 0,
                    fightT: 999, struggle: false, calmT: 0, throwT: 0.001 };
    const o = { role: "normal", state: "delivered", x: level.mx, y: level.my, wave: 0, vx: 0, vy: 0 };
    level.oids.push(o); level.delivered = 1;
  });
  await page.waitForTimeout(120);
  const st1 = await page.evaluate(() => {
    const o = level.oids[level.oids.length - 1];
    return { state: o.state, inPax: ship.passengers.includes(o) };
  });
  expect(st1.state, "the rescued Scion is thrown out of the bay").toBe("thrown");
  expect(st1.inPax, "and not aboard the player ship while falling").toBe(false);
  // stop the breach re-throwing while we test the catch
  await page.evaluate(() => { mercyBreach = null; });
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

test("E4: an infected Scion is CURED at isolation; a born Vector is only sealed", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.waitForTimeout(120);
  // pin the ship in the RED isolation bay for both drop-offs
  await page.evaluate(() => {
    window.__pin = setInterval(() => {
      const b = bayRects().red;
      ship.x = (b.x0 + b.x1) / 2; ship.y = (b.y0 + b.y1) / 2;
      ship.vx = 0; ship.vy = 0; ship.dead = false;
    }, 16);
  });
  // an infected Scion (turned by the ward) → treated and cured = a save
  await page.evaluate(() => {
    const o = { role: "saboteur", infected: true, state: "aboard", x: ship.x, y: ship.y, wave: 0, sabT: 99 };
    level.oids.push(o); ship.passengers = [o];
  });
  await page.waitForTimeout(700);
  const cured = await page.evaluate(() => level.oids[level.oids.length - 1].state);
  expect(cured, "an infected Scion is cured (delivered), not just contained").toBe("delivered");
  // a BORN Vector → sealed/contained, never cured
  await page.evaluate(() => {
    const o = { role: "saboteur", state: "aboard", x: ship.x, y: ship.y, wave: 0, sabT: 99 };
    level.oids.push(o); ship.passengers = [o];
  });
  await page.waitForTimeout(700);
  const sealed = await page.evaluate(() => level.oids[level.oids.length - 1].state);
  await page.evaluate(() => clearInterval(window.__pin));
  expect(sealed, "a born Vector is sealed, never cured").toBe("contained");
});

test("Y4: counterfeit pods only blink loud with Avicenna; a subtle Static-beat dip without", async ({ page }) => {
  await page.evaluate(() => { __doids.go(5); __doids.launch(); });
  // unmasked (canon): the loud 1Hz metronome swings fully between bright and dim
  const loud = await page.evaluate(() => {
    let hi = 0, lo = 1;
    for (let t = 0; t < 2; t += 0.02) { const a = __doids.fakePodAlpha(t, true); hi = Math.max(hi, a); lo = Math.min(lo, a); }
    return { hi, lo };
  });
  expect(loud.hi).toBeCloseTo(1, 2);
  expect(loud.lo).toBeCloseTo(0.38, 2);
  // pre-Avicenna: near-steady, never the loud blink — a faint dip only on the beat
  await page.evaluate(() => __doids.setStaticClock(0));   // right on the Static tick
  const onBeat = await page.evaluate(() => __doids.fakePodAlpha(0, false));
  await page.evaluate(() => __doids.setStaticClock(20));  // mid-cycle, quiet
  const quiet = await page.evaluate(() => __doids.fakePodAlpha(0, false));
  expect(quiet).toBeCloseTo(0.82, 2);          // steady between beats
  expect(onBeat).toBeLessThan(quiet);          // a dip lands on Glycon's clock
  expect(onBeat).toBeGreaterThan(0.4);         // subtle, never the loud 0.38 strobe
});

test("V6: parrying a Vector's sonic wave flattens it and catalogues the Vector; a mid-game miss costs half", async ({ page }) => {
  await page.evaluate(() => { __doids.go(5); __doids.launch(); });   // Avicenna Shoals — waves start here
  await page.evaluate(() => {
    level.turrets.forEach(t => t.alive = false); level.drones.forEach(d => d.alive = false);
    level.oids = [{ role: "saboteur", state: "wait", x: 720, y: __doids.ground(720),
      sleeper: false, flagged: false, verified: false, wave: 0, persona: "wave1", scale: 1 }];
    ship.x = 650; ship.y = __doids.ground(650) - 11; ship.vx = ship.vy = 0; ship.landed = true; ship.dead = false;
  });
  // MISS (no shield): the wave washes over — no catalogue, and mid-game costs
  // HALF the finale penalty (6 of 12 vitals)
  await page.evaluate(() => { input.shield = false; ship.shield = false; ship.parryT = 0; ship.vitals = 80; __doids.armWave(); });
  await page.waitForTimeout(200);
  let s = await page.evaluate(() => ({ flagged: !!level.oids[0].flagged, vitals: ship.vitals }));
  expect(s.flagged, "a missed wave does not catalogue").toBe(false);
  expect(s.vitals, "mid-game miss costs half (−6)").toBe(74);
  // PARRY (shield raised into the window): the signal is flattened, Vector catalogued
  await page.evaluate(() => { input.shield = false; ship.shield = false; ship.parryT = 0; });
  await page.waitForTimeout(40);
  await page.evaluate(() => { input.shield = true; __doids.armWave(); });
  await page.waitForFunction(() => level.oids[0].flagged === true, null, { timeout: 2000 });
  expect(await page.evaluate(() => level.oids[0].flagged)).toBe(true);
  // V13 — a parried wave is knocked back into whatever cast it, not just
  // flashed at the ship; give it its return-flight time and confirm the
  // landing burst fires
  await page.waitForFunction(
    () => (__doids.waves() || []).some(w => w.hit && w.returnBurst),
    null, { timeout: 2000 });
  await page.evaluate(() => { input.shield = false; });
});
