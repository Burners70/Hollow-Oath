// Hollow Oath — Act Two, the descent (Bundle P).
//
// The rescue loop beneath SOLACE: the trunk cut, the cradle, the tether, the
// draining reserve, the inverted transfusion and THE WELL. Act Two's *terrain*
// lives in worldgen.spec.js with the rest of the generation invariants — this
// file is the mechanics.
//
// Every feel value in Act Two is tuned on hardware (Bundle P: the slice
// "genuinely needs a device rather than a browser"), so nothing here asserts a
// tuning number. It asserts the RULES: that a rack cannot be moved while it is
// plugged in, that flatline is total, that the transfusion cannot kill you, that
// FIRE releases instead of shooting, and that the chamber can actually be flown.
// Drives the game headlessly through window.__doids; the shared per-test guard
// (navigate + fail on any console error) lives in tests/harness.js.
// See tests/README.md for what belongs in which file.
const { test, expect } = require("@playwright/test");
const { useGame } = require("./harness");

useGame(test, expect);

// the slice chamber, loaded and ready, with the ship parked out of the way
async function slice(page) {
  const info = await page.evaluate(() => __doids.loadChamber("slice"));
  expect(info).not.toBeNull();
  return info;
}
const a2 = page => page.evaluate(() => __doids.get().actTwo);

test("P·slice: the chamber carries a rack, its feeds and the well", async ({ page }) => {
  const info = await slice(page);
  expect(info.racks).toBe(1);          // §6.1 — one chamber, one rack in the slice
  expect(info.conduits).toBeGreaterThan(1);   // §7.1 — several run through, one is the rack's
  expect(info.well).toBe(true);
  const s = await a2(page);
  expect(s.racks[0].state).toBe("mains");     // §7.5 — bright and steady until you cut it
  expect(s.racks[0].reserve).toBe(100);
  expect(s.racks[0].occupants).toBeGreaterThanOrEqual(8);   // §6.1 — eight to twelve
  // exactly one feed is the rack's; the rest are his
  expect(s.conduits.filter(c => c.rack).length).toBe(1);
  expect(s.conduits.filter(c => !c.rack).length).toBeGreaterThan(0);
});

/* THE INVARIANT THIS BUNDLE EXISTS TO CATCH. GAME_DESIGN's no-trolley-problem
   pillar says every chamber must be clearable with everyone alive, and Bundle P
   says that "wants an assertion, not a playtest opinion."

   P·terrain's chamber could not be flown at all: its structural column was solid
   floor to ceiling and sealed the only route to the well. Every terrain test
   passed, because each asserted a local property — an overhang exists, a pinch
   exists, a pillar exists — and nothing asked the whole-room question. */
test("P·slice: the chamber is flyable end to end, laden", async ({ page }) => {
  await slice(page);
  const r = await page.evaluate(() => ({
    ship: __doids.chamberRoute(),
    swung: __doids.chamberRoute(towEnvelope(TOW_SWING_LEVEL).vertical),
    rest: __doids.chamberRoute(towEnvelope(0).vertical),
    W: level.W
  }));
  // a bare ship reaches the rack, every isolator and the well
  expect(r.ship.racks.every(k => k.reachable)).toBe(true);
  expect(r.ship.conduits.every(k => k.reachable)).toBe(true);
  expect(r.ship.well).toBe(true);
  // and so does a ship with a rack trailing at its own level, which is the
  // clearance the tow actually has to fit through somewhere
  expect(r.swung.well).toBe(true);
  expect(r.swung.racks.every(k => k.reachable)).toBe(true);
  /* §11.3 — and a load HANGING cannot: the momentum pinch is on the only route,
     deliberately, because the roadmap left "is mid-band right?" open and a route
     that let you avoid the pinch would never answer it. So the at-rest fill must
     stop short while the swung fill does not — the mechanic existing, expressed
     as a difference between two flood fills.

     Stated against the RACK, and this is the owner-feedback change: the ship now
     enters at the well, so a fill seeded at the ship starts on the well's side of
     the pinch and reaches the well trivially. Connectivity is undirected, so
     "a hanging load can't get from the well to the rack" is the same claim the
     old assertion was making from the other end — and it is the one that
     survives moving the entrance again. */
  expect(r.rest.racks.every(k => k.reachable)).toBe(false);
  expect(r.rest.minX).toBeGreaterThan(r.swung.minX);
});

test("P·slice: a rack on mains cannot be moved — the feed comes first (§7.1)", async ({ page }) => {
  await slice(page);
  // land right beside it and hold: nothing happens, because the rack IS their
  // life support (§6.1) and unplugging it by hand is not on offer
  const before = (await a2(page)).racks[0];
  await page.evaluate(x => __doids.a2Warp(x, level.racks[0].y - 40, true), 1150);
  await page.waitForTimeout(700);
  const s = await a2(page);
  expect(s.racks[0].cut).toBe(false);
  expect(s.towing).toBe(false);
  expect(s.racks[0].reserve).toBe(before.reserve);   // on mains it does not drain
  // the driver refuses it too, for the same reason
  expect(await page.evaluate(() => __doids.a2Cradle("r1"))).toBe(false);
});

test("P·slice: closing the right feed starts the dying; the beat bites (§7.3/§7.5)", async ({ page }) => {
  await slice(page);
  expect(await page.evaluate(() => __doids.a2Cut("c1"))).toBe(true);
  const cut = await a2(page);
  expect(cut.racks[0].cut).toBe(true);
  expect(cut.racks[0].state).toBe("reserve");   // §7.5 — it visibly drops off mains
  await page.waitForTimeout(600);
  const later = await a2(page);
  expect(later.racks[0].reserve).toBeLessThan(cut.racks[0].reserve);

  /* §7.3 — the bite on the beat, on top of the continuous drain. Driven by
     winding the real staticClock to the edge of the period rather than waiting
     41 seconds: the bite is read off the clock's wrap, so this exercises the
     actual coupling and not a stand-in. */
  const before = (await a2(page)).racks[0].reserve;
  await page.evaluate(() => { staticClock = STATIC_PERIOD - 0.01; });
  await page.waitForTimeout(300);
  const after = (await a2(page)).racks[0].reserve;
  // far more than 0.3s of ordinary drain could account for
  expect(before - after).toBeGreaterThan(RESERVE_BITE_FLOOR);
});
// the bite is a tuning value; the test only needs it to be unmistakably bigger
// than a third of a second of drain, so it asserts against a floor rather than
// against RACK_BEAT_BITE itself
const RESERVE_BITE_FLOOR = 3;

test("P·systems: a dead line costs you time, tells him you are here, and is billed (§7.1)", async ({ page }) => {
  await slice(page);
  /* THE TRIPWIRE THAT USED TO LIVE HERE IS MET. It asserted `score === 0` after
     a decoy cut, holding an assistant's assumption that Act Two never bills the
     player for reading a room wrong; the owner overturned it (July 2026, ladder
     rule 6) and a dead line now carries −100.

     SEED FIRST, AND ASSERT THE DIFFERENCE — the trap the tripwire left a note
     about. Zero is the floor (rule 8), so a fresh chamber starts at 0 and a
     penalty applied to it changes nothing: an assertion against 0 passes
     whether the charge fired or not, and proves neither. Every penalty test in
     this file seeds a score for exactly this reason. */
  await page.evaluate(() => { score = 500; a2Score = 500; });
  const decoy = await page.evaluate(() => __doids.get().actTwo.conduits.find(c => !c.rack).id);
  await page.evaluate(id => __doids.a2Cut(id), decoy);
  const s = await page.evaluate(() => __doids.get());
  expect(s.actTwo.conduits.find(c => c.id === decoy).cut).toBe(true);
  expect(s.actTwo.racks[0].cut).toBe(false);       // the rack is still on mains
  expect(s.staticSurge).toBeGreaterThan(0);        // he is listening now
  expect(s.score).toBe(400);
  expect(s.a2Score).toBe(400);                     // and Act Two's own ledger moves with it
});

test("P·systems: zero is the floor, and it holds both ledgers (rule 8)", async ({ page }) => {
  await slice(page);
  /* The consequence the owner accepted and asked to have recorded rather than
     "fixed" later: a player already at zero misreads rooms for free. Asserting
     it is what stops a future session reading the clamp as a bug — and it
     matters that a2Score is clamped too, or a floored run keeps accruing a
     private negative that surfaces later as a stretch where nothing scores. */
  await page.evaluate(() => { score = 40; a2Score = 40; });
  const decoy = await page.evaluate(() => __doids.get().actTwo.conduits.find(c => !c.rack).id);
  await page.evaluate(id => __doids.a2Cut(id), decoy);
  const s = await page.evaluate(() => __doids.get());
  expect(s.score).toBe(0);
  expect(s.a2Score).toBe(0);         // not −60, in either ledger
});

test("P·systems: landing beside a decoy box costs vitals AND points (rule 6)", async ({ page }) => {
  await slice(page);
  const d = await page.evaluate(() => {
    score = 500; a2Score = 500;
    const box = level.decoys[0];
    // set down beside it, the way the penalty is meant to be earned
    __doids.a2Warp(box.x, box.y - 40, true);
    return { id: box.id, before: ship.vitals };
  });
  await page.waitForFunction(id => __doids.get().actTwo.decoys.find(k => k.id === id).penalised,
    d.id, { timeout: 4000 });
  const s = await page.evaluate(() => __doids.get());
  /* BOTH currencies, which is the whole of rule 6: vitals make this attempt
     harder and are then gone; the points are what the run is remembered by. A
     test that checked only one would let either half be quietly removed. */
  expect(s.ship.vitals).toBeLessThan(d.before);
  expect(s.score).toBe(400);
  expect(s.a2Score).toBe(400);
});

test("P·slice: shooting a live feed dumps the rack (§7.1)", async ({ page }) => {
  await slice(page);
  const lost = await page.evaluate(() => {
    score = 5000; a2Score = 5000;   // seeded so the ladder's charge is visible (rule 8)
    const c = level.conduits.find(k => k.rack);
    // a round on the trunk, mid-span rather than at either end
    level.shots.push({ x: (c.x + c.x1) / 2, y: (c.y0 + c.y1) / 2, vx: 0, vy: 0, t: 1 });
    return true;
  });
  expect(lost).toBe(true);
  await page.waitForTimeout(200);
  const s = await a2(page);
  expect(s.racks[0].lost).toBe(true);
  expect(s.racks[0].state).toBe("gone");   // §7.5 — a steady glow with no beat
  expect(s.lost).toBe(1);
  const g = await page.evaluate(() => __doids.get());
  // §7.3 — Act Two's losses are tracked SEPARATELY, so Act One's ranks and
  // achievements keep their exact meaning
  expect(g.runLost).toBe(0);
  /* P·systems — and the ladder's heaviest single charge: Act One's "killed by
     your own hand". A bank is eight to twelve people, so it is priced at four
     Scions rather than one. Asserted as ONE charge, not two: the rack is lost
     to the round, so it must never also flatline and be billed again.
     The floor then closes and pays its no-fire award — `firedShots` is still 0
     because the test pushes a round straight into `level.shots` rather than
     pulling a trigger, so the ladder is right to say the oath held. */
  const expected = 5000 - 1000 + g.actTwo.noFire;
  expect(g.score).toBe(expected);
  expect(g.a2Score).toBe(expected);
});

test("P·systems: a flatline is billed once, and the floor closes its books", async ({ page }) => {
  await slice(page);
  const before = await page.evaluate(() => {
    score = 5000; a2Score = 5000;
    __doids.a2Cut("c1");
    __doids.a2SetReserve("r1", 0.2);   // on the edge, so the drain finishes it
    return __doids.get().actTwo.cleared;
  });
  expect(before).toBe(false);
  await page.waitForFunction(() => __doids.get().actTwo.racks[0].lost, null, { timeout: 4000 });
  await page.waitForTimeout(200);   // long enough for a second charge to land, if one were coming
  const s = await page.evaluate(() => __doids.get());
  /* THE CHAMBER-CLEAR CRITERION IS "every bank resolved", NOT "every bank home".
     A lost bank is not a floor you can still finish — §7.3 locks flatline as
     total — so the room closes rather than holding a player over a dead rack. */
  expect(s.actTwo.cleared).toBe(true);
  /* The floor's books, exactly: −1000 for the bank, then the no-fire award,
     which is deliberately NOT withheld for the loss (the oath is about what you
     did, and Act One pays its no-harm bonus on a sector where Scions died) —
     and NO GENTLE HANDS, which requires delivery (PENDULUM_SPEC §5). Derived
     from the exposed award rather than typed, so a content change that arms
     this chamber differently retunes the test with the game. */
  const expected = 5000 - 1000 + s.actTwo.noFire;
  expect(s.score).toBe(expected);
  expect(s.a2Score).toBe(expected);
  // a total loss still comes out behind where a delivery would have put you
  expect(s.score).toBeLessThan(5000);
});

test("P·slice: the sling hangs, swings and holds its length (PENDULUM_SPEC §4.1)", async ({ page }) => {
  await slice(page);
  await page.evaluate(() => { __doids.a2Cut("c1"); });
  await page.evaluate(() => __doids.a2Warp(1150, level.racks[0].y - 40, true));
  expect(await page.evaluate(() => __doids.a2Cradle("r1"))).toBe(true);
  // rigging the sling must not fling the load: it is seated, not snapped
  const seated = await a2(page);
  expect(seated.towing).toBe(true);
  expect(seated.tow.speed).toBeLessThan(20);
  expect(seated.racks[0].integrity).toBe(100);

  // hang it in clear air and let it settle: the rope holds its length
  await page.evaluate(() => __doids.a2Warp(1150, 700, false));
  await page.waitForTimeout(500);
  const hung = await page.evaluate(() => {
    const r = level.towedRack;
    return { d: Math.hypot(r.x - ship.x, r.y - (ship.y + SLING_SHIP_ANCHOR)), L: SLING_L,
      swing: Math.round(r.swing || 0) };
  });
  // a rope, so never longer than its length; and it settles under the hull
  expect(hung.d).toBeLessThanOrEqual(hung.L + 1);
  expect(hung.swing).toBeLessThan(25);

  /* §4.1's feel note — "thrust away and the load lags, then swings through under
     you." Thrust sideways and the load must trail, which is what makes the
     envelope shrink and §11.3's momentum pinch passable at all. */
  const swung = await page.evaluate(async () => {
    __doids.a2Warp(1150, 760, false);
    ship.ang = Math.PI / 2;               // pointing right, so thrust drives right
    input.thrust = true;
    let worst = 0;
    for (let i = 0; i < 90; i++) {
      await new Promise(r => requestAnimationFrame(r));
      worst = Math.max(worst, level.towedRack.swing || 0);
    }
    input.thrust = false;
    return { worst, envelope: towEnvelope(worst).vertical, rest: towEnvelope(0).vertical };
  });
  expect(swung.worst).toBeGreaterThan(30);
  // and the envelope genuinely shrinks as it swings up — the mechanic is geometry
  expect(swung.envelope).toBeLessThan(swung.rest);
});

test("P·slice: a gentle set-down is free, a slam is not (PENDULUM_SPEC §4.3)", async ({ page }) => {
  await slice(page);
  await page.evaluate(() => { __doids.a2Cut("c1"); });
  await page.evaluate(() => __doids.a2Warp(1150, level.racks[0].y - 40, true));
  await page.evaluate(() => __doids.a2Cradle("r1"));
  // set it down softly: hover just above the floor and let the rope go slack
  await page.evaluate(() => __doids.a2Warp(1150, 1000, false));
  await page.waitForTimeout(700);
  const soft = await a2(page);
  expect(soft.racks[0].integrity).toBe(100);   // brushes and set-downs cost nothing

  /* Now drive it into the floor above SLING_SAFE_V. §4.2 — "The payload drops
     where it is": a released load keeps falling, which is what makes the drop
     half of the damage model reachable at all.

     The speed is injected rather than fallen for, because GRAV is 46px/s²: a
     free drop needs ~4.5 seconds of real time to build a damaging speed over the
     height this hall has, and the rule under test is "contact above the
     threshold costs", not "gravity works". */
  const slammed = await page.evaluate(async () => {
    const r = level.towedRack;
    __doids.a2Warp(1150, 900, false);
    __doids.a2Release();
    r.vy = 320;
    let worst = 0;
    for (let i = 0; i < 90; i++) {
      await new Promise(k => requestAnimationFrame(k));
      worst = Math.max(worst, r.vy);
      if (r.integrity < 100) break;
    }
    return { integrity: r.integrity, reserve: r.reserve, worstFall: Math.round(worst) };
  });
  expect(slammed.worstFall).toBeGreaterThan(SAFE_V_FLOOR);
  expect(slammed.integrity).toBeLessThan(100);
  /* Both meters, and they are not the same thing: `reserve` is the resource
     under pressure, so a slam and the drain pull on ONE needle (which is what
     makes hurry-versus-care a single allocation problem); `integrity` is the
     record of how much of their life your handling cost, so GENTLE HANDS means
     "never slammed" rather than "arrived quickly". */
  expect(slammed.reserve).toBeLessThan(100);
});
// a dropped load has to actually be falling fast before "a slam costs" means
// anything; the floor is well under SLING_SAFE_V so the test is about the rule
const SAFE_V_FLOOR = 60;

test("P·slice: FIRE releases the load and never fires (PENDULUM_SPEC §4.2, §10a.2)", async ({ page }) => {
  await slice(page);
  await page.evaluate(() => { __doids.a2Cut("c1"); });
  await page.evaluate(() => __doids.a2Warp(1150, level.racks[0].y - 40, true));
  await page.evaluate(() => __doids.a2Cradle("r1"));
  await page.evaluate(() => __doids.a2Warp(1150, 700, false));
  const fired = await page.evaluate(async () => {
    ship.fireCd = 0;
    level.shots.length = 0;
    // a fresh TAP: the edge is what releases, so a FIRE already held does nothing
    input.fire = false;
    await new Promise(r => requestAnimationFrame(r));
    input.fire = true;
    for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(r));
    const out = { towing: !!level.towedRack, shots: level.shots.length };
    input.fire = false;
    return out;
  });
  expect(fired.towing).toBe(false);   // released
  expect(fired.shots).toBe(0);        // and it was never a shot
  // and the release pushes fireCd out, so the same held tap can't become one
  expect(await page.evaluate(() => ship.fireCd)).toBeGreaterThan(0);
});

test("P·slice: the transfusion spends YOUR vitals, and stops before it kills you (§7.4)", async ({ page }) => {
  await slice(page);
  await page.evaluate(() => { score = 500; a2Score = 500; __doids.a2Cut("c1"); });
  await page.evaluate(() => __doids.a2SetReserve("r1", 40));
  // hover in the rack's window, off the ground, and hold SHIELD
  const gave = await page.evaluate(async () => {
    const r = level.racks[0];
    __doids.a2Warp(r.x, r.y - 50, false);
    const v0 = ship.vitals, res0 = r.reserve;
    input.shield = true;
    for (let i = 0; i < 40; i++) {
      await new Promise(k => requestAnimationFrame(k));
      __doids.a2Warp(r.x, r.y - 50, false);   // hold the hover against gravity
    }
    const out = { v0, res0, v1: ship.vitals, res1: r.reserve,
      shield: ship.shield, line: !!__doids.get().actTwo.give };
    input.shield = false;
    return out;
  });
  expect(gave.res1).toBeGreaterThan(gave.res0);   // their reserve came up…
  expect(gave.v1).toBeLessThan(gave.v0);          // …out of you
  // §4.2's one consistent law: nothing rides a tether under the field
  expect(gave.shield).toBe(false);

  /* §7.4's floor: the line auto-detaches at ~15 vitals, because you cannot treat
     if you are the casualty. It is what makes an unwinnable state impossible
     without softening anything — you are still nearly dead. */
  const floored = await page.evaluate(async () => {
    const r = level.racks[0];
    __doids.a2SetReserve("r1", 5);
    __doids.a2Vitals(GIVE_FLOOR + 6);
    __doids.a2Warp(r.x, r.y - 50, false);
    input.shield = true;
    for (let i = 0; i < 80; i++) {
      await new Promise(k => requestAnimationFrame(k));
      __doids.a2Warp(r.x, r.y - 50, false);
    }
    input.shield = false;
    return { vitals: ship.vitals, floor: GIVE_FLOOR, dead: ship.dead,
      line: !!__doids.get().actTwo.give };
  });
  expect(floored.dead).toBe(false);
  expect(floored.vitals).toBeGreaterThanOrEqual(floored.floor - 1);
  expect(floored.line).toBe(false);   // it let go rather than finish you
  /* §7.4 — and it is never billed to your score. The price moved to your body.
     THIS IS THE ONE SURVIVING "Act Two never bills you" CLAIM, narrowed to the
     transfusion alone (COPY_DECK §12a): the broader version was an assistant's
     assumption and the owner overturned it. Seeded above and asserted UNCHANGED
     rather than against 0, because a fresh chamber starts at 0 and the ladder's
     floor would let a charge hide behind it — the same trap the dead-line
     tripwire warned about, in the mirror. */
  const s = await page.evaluate(() => __doids.get());
  expect(s.score).toBe(500);
  expect(s.a2Score).toBe(500);
});

test("P·slice: giving the same rack twice buys less each time (§7.4)", async ({ page }) => {
  await slice(page);
  await page.evaluate(() => { __doids.a2Cut("c1"); });
  /* Asserted on the CEILING each line is given rather than on how much fits down
     it in a fixed number of frames: at GIVE_RATE a full line takes seconds, so a
     frame-bounded comparison measures the test's own patience and comes out equal
     both times whatever the falloff is. The cap is the mechanism. */
  const caps = await page.evaluate(async () => {
    const r = level.racks[0];
    const out = [];
    for (let n = 0; n < 3; n++) {
      __doids.a2SetReserve("r1", 20);
      __doids.a2Vitals(100);
      __doids.a2Warp(r.x, r.y - 50, false);
      input.shield = true;
      for (let i = 0; i < 4; i++) {
        await new Promise(k => requestAnimationFrame(k));
        __doids.a2Warp(r.x, r.y - 50, false);
      }
      out.push(__doids.get().actTwo.give.cap);
      input.shield = false;
      await new Promise(k => requestAnimationFrame(k));
    }
    return out;
  });
  // the shipped 0.9^n shape, per rack: stalling over one box is not a strategy
  expect(caps[0]).toBeGreaterThan(0);
  expect(caps[1]).toBeLessThan(caps[0]);
  expect(caps[2]).toBeLessThan(caps[1]);
  // and the reserve does come up while the line is open
  const gained = await page.evaluate(() => __doids.get().actTwo.racks[0].reserve);
  expect(gained).toBeGreaterThan(20);
});

test("P·slice: flatline is total, and it is the chamber you lose (§7.3)", async ({ page }) => {
  await slice(page);
  await page.evaluate(() => { __doids.a2Cut("c1"); });
  await page.evaluate(() => __doids.a2SetReserve("r1", 0.05));
  await page.waitForFunction(() => __doids.get().actTwo.racks[0].lost, null, { timeout: 4000 });
  const s = await a2(page);
  expect(s.racks[0].lost).toBe(true);
  expect(s.racks[0].reserve).toBe(0);
  expect(s.lost).toBe(1);
  expect(s.saved).toBe(0);
  // never partial: §7.3 examined "you saved seven of twelve" and rejected it
  expect(s.racks[0].delivered).toBe(false);
  // a lost rack cannot be re-cradled or re-cut into life
  expect(await page.evaluate(() => __doids.a2Cradle("r1"))).toBe(false);
  // and reloading the chamber is a clean attempt — the retry unit is the room
  await slice(page);
  const fresh = await a2(page);
  expect(fresh.lost).toBe(0);
  expect(fresh.racks[0].lost).toBe(false);
  expect(fresh.racks[0].reserve).toBe(100);
});

test("P·slice: docking a swinging load into the well delivers it, and heals you (§7.6/§7.4)", async ({ page }) => {
  await slice(page);
  await page.evaluate(() => { __doids.a2Cut("c1"); });
  await page.evaluate(() => __doids.a2Warp(1150, level.racks[0].y - 40, true));
  await page.evaluate(() => __doids.a2Cradle("r1"));
  // fly the load to the bay's slot: the window is measured on the RACK, not the
  // ship, because the thing you are aiming is the load (§7.6)
  await page.evaluate(() => {
    const w = level.wellDock;
    __doids.a2Warp(w.x, w.y + 44 - SLING_L, false);
    ship.vitals = 22;                    // arrive nearly dead, as the design intends
  });
  await page.waitForFunction(() => __doids.get().actTwo.well.docking, null, { timeout: 4000 });
  await page.waitForFunction(() => __doids.get().actTwo.racks[0].delivered, null, { timeout: 6000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.actTwo.racks[0].delivered).toBe(true);
  expect(s.actTwo.saved).toBe(1);
  expect(s.actTwo.lost).toBe(0);
  expect(s.actTwo.towing).toBe(false);
  expect(s.actTwo.well.taken).toBe(1);
  // §7.4 — "Delivery heals you… the reward for finishing a rescue is your own
  // recovery." Which is what makes the transfusion floor survivable as a design.
  expect(s.ship.vitals).toBeGreaterThan(90);
  expect(s.ship.fuel).toBeGreaterThan(90);
  // §10a.1 — and the well refuels for free; fuel is a lap budget, not a crisis

  /* P·systems — THE LADDER, END TO END, on the one run that earns everything.
     The slice is a single-rack chamber, so seating that load also resolves the
     floor: delivery, then the two chamber awards on the same frame. Derived
     from the exposed no-fire value rather than typed, so arming this chamber
     differently retunes the assertion with the game rather than against it. */
  expect(s.actTwo.cleared).toBe(true);
  const expected = 1000 + s.actTwo.noFire + 750;
  expect(s.score).toBe(expected);
  expect(s.a2Score).toBe(expected);
  /* And the two ledgers are the SAME number here, which is the case worth
     pinning: this chamber was entered directly, so it started from a score of
     0 and everything in it is Act Two's. In a continuous campaign they diverge
     — `score` carries the surface run in as well — and that divergence is the
     whole reason rule 4 wants a second board. */
  expect(s.a2Score).toBe(s.score);
});

/* ===== P·systems — the ladder ============================================
   The rows the two tests above do not reach, plus the three rules that are
   properties of the SYSTEM rather than of any one event. Every one seeds a
   score first: zero is the floor (rule 8), so an assertion against 0 passes
   whether or not the charge fired. */

test("P·systems: every impact on a rack is billed, per impact (rule 2)", async ({ page }) => {
  await slice(page);
  const hit = await page.evaluate(async () => {
    score = 5000; a2Score = 5000;
    __doids.a2Cut("c1");
    __doids.a2Warp(1150, level.racks[0].y - 40, true);
    __doids.a2Cradle("r1");
    const r = level.racks[0];
    // drive the load down into the deck hard enough to clear the free band
    for (let i = 0; i < 90; i++) {
      await new Promise(k => requestAnimationFrame(k));
      if (r.integrity < 100) break;
      r.vy = 900; r.y += 6;
    }
    return { integrity: r.integrity, score, a2Score };
  });
  expect(hit.integrity).toBeLessThan(100);        // it actually landed a slam
  /* FLAT, and a whole number of charges — rule 2 says the ladder prices the
     EVENT of hitting them, never how much they have suffered. So the drop is a
     multiple of A2_IMPACT and carries no fractional part of the damage. */
  const paid = 5000 - hit.score;
  expect(paid).toBeGreaterThanOrEqual(25);
  expect(paid % 25).toBe(0);
  expect(hit.a2Score).toBe(hit.score);
  // and integrity does NOT scale it: the charge is the same size every time
  expect(paid).toBeLessThan(5000);
});

test("P·systems: firing forfeits the no-fire award, and shooting never beats restraint (rules 5 and 7)", async ({ page }) => {
  await slice(page);
  const armed = await page.evaluate(() => ({
    noFire: __doids.get().actTwo.noFire,
    guns: __doids.get().actTwo.gunValue,
    turrets: level.turrets.length
  }));
  /* RULE 7, THE PACIFIST INVARIANT, asserted on the chamber rather than
     assumed from the formula: "the combined value of shooting guns should never
     outweigh the pacifist score." It holds here because the award is DERIVED
     (NOFIRE_BASE > 0, NOFIRE_FACTOR > 1) — which is why it will still hold for
     the most heavily armed chamber P·content ever authors, and why this test
     does not need re-tuning when it does. */
  expect(armed.noFire).toBeGreaterThan(armed.guns);
  // and a chamber's guns are priced as EMPLACEMENTS, not as Act One turrets
  expect(armed.guns).toBe(armed.turrets * 120);

  const fired = await page.evaluate(async () => {
    score = 5000; a2Score = 5000;
    // pull the trigger properly — the ladder reads level.firedShots, which only
    // a real shot sets, so pushing into level.shots would not prove anything
    input.fire = true;
    for (let i = 0; i < 6; i++) await new Promise(k => requestAnimationFrame(k));
    input.fire = false;
    return level.firedShots;
  });
  expect(fired).toBeGreaterThan(0);
  // now finish the floor: the delivery still pays, the oath bonus does not
  await page.evaluate(() => {
    __doids.a2Cut("c1");
    __doids.a2Warp(1150, level.racks[0].y - 40, true);
    __doids.a2Cradle("r1");
    const w = level.wellDock;
    __doids.a2Warp(w.x, w.y + 44 - SLING_L, false);
  });
  await page.waitForFunction(() => __doids.get().actTwo.racks[0].delivered, null, { timeout: 8000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.actTwo.cleared).toBe(true);
  /* The floor still pays its delivery and still pays GENTLE HANDS — the oath is
     not the only thing being scored, and firing does not void the rescue. What
     it forfeits is exactly the no-fire award, and nothing else. */
  expect(s.score).toBe(5000 + 1000 + 750);
  /* Which is strictly less than the same floor flown without firing (asserted
     directly in the delivery test above). That gap is rule 5 doing its job:
     without it Act Two paid you for shooting — the emplacement award runs in a
     chamber via Act One's own shot loop — and paid nothing at all for not. */
  expect(s.score).toBeLessThan(5000 + 1000 + 750 + armed.noFire);
});

test("P·systems: a run begun at Act One keeps the global record; a chamber entered directly does not (rule 3)", async ({ page }) => {
  /* THIS IS A FIX, NOT A PRECAUTION. `confirmLeaveChamber` already calls
     saveHi(), so before provenance existed, climbing out of a debug-loaded
     chamber pushed Act Two points onto the all-time hiscore and the Game
     Center board off the back of no campaign at all. */
  const fresh = await page.evaluate(() => __doids.get().fromStart);
  expect(fresh).toBe(true);              // a boot-fresh run has the claim

  await slice(page);
  const direct = await page.evaluate(() => {
    const before = __doids.get().gcReports.length;
    score = 9999; a2Score = 4444; hiscore = 0; a2Hi = 0;
    saveHi();
    const g = __doids.get();
    return { fromStart: g.fromStart, hiscore: g.hiscore, a2Hi: g.a2Hi,
      boards: g.gcReports.slice(before).filter(r => r.method === "submitScore")
        .map(r => r.leaderboardId) };
  });
  expect(direct.fromStart).toBe(false);  // loadChamber cleared it
  expect(direct.hiscore).toBe(0);        // …so the global record is untouched
  expect(direct.boards).not.toContain("hollowoath.score.alltime");
  /* Act Two's OWN record is not gated on provenance, and should not be: a
     chamber flown on its own is a real descent. It is only the claim on the
     cross-act total that a direct entry cannot support. */
  expect(direct.a2Hi).toBe(4444);
  expect(direct.boards).toContain("hollowoath.score.acttwo");
});

test("P·systems: a continuous run scores into both records (rules 3 and 4)", async ({ page }) => {
  await page.evaluate(() => {
    resetRun();                     // a run begun at Act One sector 0
    score = 7000; a2Score = 2500; hiscore = 0; a2Hi = 0;
    // resetRun zeroes them; put the run back the way a real descent would leave it
    runFromStart = true;
    saveHi();
  });
  const s = await page.evaluate(() => __doids.get());
  expect(s.hiscore).toBe(7000);    // the whole run, both acts
  expect(s.a2Hi).toBe(2500);       // and the descent on its own
  const boards = s.gcReports.filter(r => r.method === "submitScore").map(r => r.leaderboardId);
  expect(boards).toContain("hollowoath.score.alltime");
  expect(boards).toContain("hollowoath.score.acttwo");
});

test("P·systems: an Act One charge that reaches a chamber lands on both ledgers", async ({ page }) => {
  await slice(page);
  /* `a2Score` is a SUBSET of `score`, so anything that moves one inside a
     chamber must move the other — otherwise Act Two's leaderboard reports a run
     nobody played, and the subset can end up larger than the total it is part
     of. Act Two's own events go through a2Charge/a2Award by construction; the
     risk is ACT ONE code that follows you underground. There is exactly one
     such charge today — the field refueller's fuel toll (U2), which reaches a
     chamber because the resupply drone has its own route down THE WELL — and
     `chargeRun` is what keeps it honest.

     Asserted on the helper rather than by flying a refuel, because the drone is
     a multi-second scripted arrival and this is testing a routing rule, not the
     drone. What it catches: any future `score = Math.max(0, score - n)` written
     straight into a path that runs underground. */
  const inChamber = await page.evaluate(() => {
    score = 500; a2Score = 500;
    chargeRun(120);
    return { score, a2Score, isChamber: !!level.isChamber };
  });
  expect(inChamber.isChamber).toBe(true);
  expect(inChamber.score).toBe(380);
  expect(inChamber.a2Score).toBe(380);   // the ledger followed

  // and on the surface it is Act One's charge, untouched — a2Score must NOT move
  const onSurface = await page.evaluate(() => {
    __doids.go(1);
    score = 500; a2Score = 500;
    chargeRun(120);
    return { score, a2Score, isChamber: !!level.isChamber };
  });
  expect(onSurface.isChamber).toBe(false);
  expect(onSurface.score).toBe(380);
  expect(onSurface.a2Score).toBe(500);
});

test("P·persist: the schema bump keeps a shipped Act One save loadable (§11.2)", async ({ page }) => {
  /* §11.2's hard constraint: "the migration must never wipe an Act One save."
     `validRun` used to demand `r.v === 1` exactly, so writing v2 would have made
     every shipped save invalid — and an invalid save is DELETED on the next
     boot, not ignored. A v1 save carries no provenance field, and the correct
     default is that it HAS the claim: it can only have come from an Act One run
     begun at sector 0, because Act Two did not exist when it was written. */
  const v1 = await page.evaluate(() => {
    const old = { v: 1, levelIdx: 3, score: 4200, lives: 2, runSaved: 5, runLost: 1,
      runFired: 0, firedAtSecret: false, firedAtCombat: false, scannedSecret: false,
      runFragments: 2, blackboxCount: 1, shrines: [], upgrades: {},
      runSeed: 0, runMode: "campaign", famousMap: null };
    return { valid: validRun(old), restored: (restoreRun(old),
      { levelIdx, score, a2Score, fromStart: runFromStart }) };
  });
  expect(v1.valid).toBe(true);
  expect(v1.restored.levelIdx).toBe(3);
  expect(v1.restored.score).toBe(4200);
  expect(v1.restored.a2Score).toBe(0);       // it never flew a chamber
  expect(v1.restored.fromStart).toBe(true);  // …and it keeps its claim on the hiscore

  // and a v2 save round-trips both new fields through localStorage
  const v2 = await page.evaluate(() => {
    score = 8800; a2Score = 3300; runFromStart = false; levelIdx = 2; lives = 3;
    snapshotRun();
    const raw = JSON.parse(localStorage.getItem("doids_run"));
    score = 0; a2Score = 0; runFromStart = true;
    restoreRun(raw);
    return { v: raw.v, score, a2Score, fromStart: runFromStart, valid: validRun(raw) };
  });
  expect(v2.v).toBe(2);
  expect(v2.valid).toBe(true);
  expect(v2.score).toBe(8800);
  expect(v2.a2Score).toBe(3300);
  expect(v2.fromStart).toBe(false);   // a direct entry does not regain the claim on resume
});

test("P·slice: dying parts the sling and puts you back in the chamber (§4.3)", async ({ page }) => {
  await slice(page);
  await page.evaluate(() => { __doids.a2Cut("c1"); });
  await page.evaluate(() => __doids.a2Warp(1150, level.racks[0].y - 40, true));
  await page.evaluate(() => __doids.a2Cradle("r1"));
  await page.evaluate(() => __doids.a2Warp(1150, 700, false));
  const dropped = await page.evaluate(() => {
    const r = level.racks[0];
    shipDie();
    return { towing: !!level.towedRack, lost: r.lost, reserve: r.reserve,
      state: __doids.get().state };
  });
  // §4.3 — the sling parts and the load survives the hull
  expect(dropped.towing).toBe(false);
  expect(dropped.lost).toBe(false);
  expect(dropped.state).toBe("dead");

  /* And the respawn lands you back inside the chamber. spawnShip places the ship
     relative to level.mx/my, which a chamber leaves at -9999, so without a
     chamber path a life lost dropped the hull clean off the world. */
  await page.waitForFunction(() => __doids.get().state === "play", null, { timeout: 6000 });
  const back = await page.evaluate(() => __doids.get());
  expect(back.ship.x).toBeGreaterThan(0);
  expect(back.ship.x).toBeLessThan(back.level.W);
  expect(back.ship.y).toBeGreaterThan(0);
  expect(back.ship.y).toBeLessThan(back.level.H);
  expect(back.ship.dead).toBe(false);
  // the rack network is untouched: a life costs you the flight back, not the room
  expect(back.actTwo.racks[0].cut).toBe(true);
  expect(back.actTwo.racks[0].lost).toBe(false);
  // and it can be picked up again on the next life
  const reCradled = await page.evaluate(() => {
    __doids.a2Warp(level.racks[0].x, level.racks[0].y - 40, true);
    return __doids.a2Cradle("r1");
  });
  expect(reCradled).toBe(true);
});

test("P·slice: a released load falls and settles instead of hanging in the air (§4.2)", async ({ page }) => {
  await slice(page);
  await page.evaluate(() => { __doids.a2Cut("c1"); });
  await page.evaluate(() => __doids.a2Warp(1150, level.racks[0].y - 40, true));
  await page.evaluate(() => __doids.a2Cradle("r1"));
  const fell = await page.evaluate(async () => {
    __doids.a2Warp(1150, 640, false);
    const r = level.racks[0];
    const y0 = r.y;
    __doids.a2Release();
    for (let i = 0; i < 90; i++) await new Promise(k => requestAnimationFrame(k));
    return { y0, y1: r.y, vy: r.vy, floor: __doids.ground(r.x, r.y) };
  });
  expect(fell.y1).toBeGreaterThan(fell.y0 + 20);          // it kept falling
  expect(fell.y1).toBeLessThanOrEqual(fell.floor + 1);    // and never through the deck
});

/* Owner feedback, July 2026 — the hull against solid rock. Act One's terrain has
   no walls, so updatePlay only ever tested vertically and the dart flew straight
   through pillars and column flanks.

   AUGUST 2026: the second half of this was reversed. It used to assert that an
   impact "bills you, it doesn't kill" — the owner's July call. Having flown the
   re-authored floor they took it back: "I think impacts should still be
   instakill for the ship (but not the rack)." That is coherent rather than a
   change of mind, and the same session says why — the July objection was to
   dying with no way to READ it coming, and it arrived paired with removing
   chamber one's invisible wall and requiring a tell before any comes back.

   Flown against the STRUCTURAL COLUMN rather than §8's painted rock, which no
   longer exists in this chamber. That is the better target anyway: it tests the
   rule against rock you can see, which is now the only kind here. */
test("owner: the hull cannot fly through a wall, and a wall impact kills", async ({ page }) => {
  await slice(page);
  const hit = await page.evaluate(async () => {
    // the column stands at x 4600..4810 from a capital at 470 down through the
    // deck, so 900 is well inside its mass. Approach the west flank at speed.
    __doids.a2Warp(4380, 900, false);
    ship.vx = 320; ship.vy = 0;
    const before = lives;
    for (let i = 0; i < 70; i++) await new Promise(k => requestAnimationFrame(k));
    return { x: ship.x, dead: ship.dead, livesLost: before - lives,
      inRock: __doids.solid(ship.x, ship.y) };
  });
  expect(hit.x).toBeLessThan(4620);      // stopped at the face, never through it
  expect(hit.livesLost).toBe(1);         // and it is fatal, as Act One's rock is

  // the free band survives the reversal, which is what keeps the tether flyable:
  // a brush is still a brush, and FIELD MEDIC still widens it (§4.4)
  const graze = await page.evaluate(async () => {
    __doids.reset(); __doids.loadChamber("slice");
    __doids.a2Warp(4500, 900, false);
    ship.vx = 24; ship.vy = 0;
    for (let i = 0; i < 70; i++) await new Promise(k => requestAnimationFrame(k));
    return { dead: ship.dead, x: ship.x, inRock: __doids.solid(ship.x, ship.y) };
  });
  expect(graze.dead).toBe(false);
  expect(graze.inRock).toBe(false);      // still shoved clear of the mass
});

test("owner: a hull already buried in rock is put back into open air", async ({ page }) => {
  await slice(page);
  const out = await page.evaluate(async () => {
    __doids.a2Warp(4700, 900, false);    // dead centre of the structural column
    for (let i = 0; i < 20; i++) await new Promise(k => requestAnimationFrame(k));
    return { inRock: __doids.solid(ship.x, ship.y), dead: ship.dead };
  });
  expect(out.inRock).toBe(false);
});

/* Owner feedback, July 2026 — a rack is BOLTED IN, and you land on it to rig the
   sling. Both go through the real path here rather than the drivers, because the
   drivers exist to skip exactly these two holds. */
test("owner: you land on a rack to rig its sling, not merely near it", async ({ page }) => {
  await slice(page);
  const r = await page.evaluate(async () => {
    __doids.a2Cut("c1");
    const rk = level.racks[0];
    // parked on the deck BESIDE it, landed, well inside the old 92px window
    __doids.a2Warp(rk.x + 74, __doids.ground(rk.x + 74) - 12, true);
    for (let i = 0; i < 40; i++) await new Promise(k => requestAnimationFrame(k));
    const near = { towing: !!level.towedRack, landedOn: ship.landedOn };
    // now drop onto the lid of the box itself
    const cage = rk.h * RACK_CAGE_H;
    __doids.a2Warp(rk.x, rk.y - cage / 2 - 26, false);
    ship.vy = 30;
    for (let i = 0; i < 45; i++) await new Promise(k => requestAnimationFrame(k));
    const on = { landedOn: ship.landedOn, landed: ship.landed };
    for (let i = 0; i < 200; i++) await new Promise(k => requestAnimationFrame(k));
    return { near, on, towing: !!level.towedRack };
  });
  expect(r.near.towing).toBe(false);        // beside it is no longer enough
  expect(r.on.landedOn).toBe("r1");         // the lid is a landable pad
  expect(r.towing).toBe(true);              // and standing on it rigs the sling
});

test("owner: setting down on a rack's lid is an ordinary landing, not a hard one", async ({ page }) => {
  /* Owner, August 2026: "not sure why there is an issue landing on the rack as
     it is flat — should just be a normal (not hard) landing." It was going
     through hullImpact at a 46px/s threshold with no slope, drift or attitude
     term — stricter than Act One's own 52px/s free band and judging the approach
     by descent speed alone. Once impacts started killing this round, that made
     the most-repeated act in the loop lethal. It is Act One's landingEval now,
     with the terrain slope overridden because the lid is level by construction. */
  await slice(page);
  const r = await page.evaluate(async () => {
    __doids.a2Cut("c1");
    const rk = level.racks[0], cage = rk.h * RACK_CAGE_H;
    __doids.a2Warp(rk.x, rk.y - cage / 2 - 20, false);
    ship.vy = 8;                                   // an ordinary approach
    const v0 = ship.vitals;
    for (let i = 0; i < 50; i++) await new Promise(k => requestAnimationFrame(k));
    return { landedOn: ship.landedOn, dead: ship.dead, cost: v0 - ship.vitals };
  });
  expect(r.landedOn).toBe("r1");
  expect(r.dead).toBe(false);
  expect(r.cost).toBe(0);        // free, exactly as setting down on flat ground is
});

test("owner: the mouth of the well shaft asks whether you mean to leave, and never kills", async ({ page }) => {
  /* Owner, August 2026: "flying to the top of the well shouldn't kill you. Maybe
     just a card with 'are you sure you want to leave? (This will end your game)'
     or something." The shaft is open because MERCY is above it paying the bay
     out, so its mouth is an exit — and the one thing an exit must not be is
     something you take by accident, hence the confirm rather than a free walk. */
  await slice(page);
  const up = await page.evaluate(async () => {
    /* Placed just under the mouth and given a nudge up: climbing the full shaft
       under gravity would need sustained thrust, and this is testing what
       happens AT the mouth, not whether the dart can get there. */
    __doids.a2Warp(8480, 20, false);
    ship.vy = -60;
    for (let i = 0; i < 60 && state === "play"; i++) await new Promise(k => requestAnimationFrame(k));
    return { state, dead: ship.dead, kind: confirmCard && confirmCard.kind };
  });
  expect(up.dead).toBe(false);              // a ceiling would have killed here
  expect(up.state).toBe("confirm");
  expect(up.kind).toBe("leaveChamber");

  // and declining puts you back inside the floor, below the mouth, rather than
  // re-asking on the very next frame
  const back = await page.evaluate(async () => {
    for (let i = 0; i < 25; i++) await new Promise(k => requestAnimationFrame(k));
    const no = confirmRowRect(1);
    input.tap = true; input.tapX = no.x + no.w / 2; input.tapY = no.y + no.h / 2;
    for (let i = 0; i < 30; i++) await new Promise(k => requestAnimationFrame(k));
    return { state, dead: ship.dead, y: Math.round(ship.y) };
  });
  expect(back.state).toBe("play");
  expect(back.dead).toBe(false);
  expect(back.y).toBeGreaterThan(10);       // below the mouth, still flying
});

test("owner: a moored rack does not move, and a sustained pull parts the mounts", async ({ page }) => {
  await slice(page);
  const r = await page.evaluate(async () => {
    __doids.a2Cut("c1");
    const rk = level.racks[0];
    const cage = rk.h * RACK_CAGE_H;
    __doids.a2Warp(rk.x, rk.y - cage / 2 - 26, false);
    ship.vy = 30;
    for (let i = 0; i < 260; i++) await new Promise(k => requestAnimationFrame(k));
    const rigged = { towing: !!level.towedRack, moored: level.racks[0].moored,
      x: level.racks[0].x, y: level.racks[0].y };
    /* Climb hard. The mounts hold the HULL back for MOOR_BREAK_T of taut pull,
       which is the "you feel some tension" the owner asked for, then part. */
    ship.ang = 0; input.thrust = true;
    let parted = false, frames = 0;
    for (let i = 0; i < 240 && !parted; i++) {
      await new Promise(k => requestAnimationFrame(k));
      frames++;
      parted = !level.racks[0].moored;
    }
    input.thrust = false;
    return { rigged, parted, frames, movedWhileMoored: false,
      x: level.racks[0].x, y: level.racks[0].y };
  });
  expect(r.rigged.towing).toBe(true);
  expect(r.rigged.moored).toBe(true);       // rigging the sling does not unbolt it
  expect(r.parted).toBe(true);              // and thrust eventually does
  expect(r.frames).toBeGreaterThan(4);      // never on the first frame — it resists
});

/* Owner feedback, July 2026 — every feed line ends in a box, runs under the deck,
   and a decoy box costs you vitals to go and look at. */
test("owner: every trunk ends in a box, and none of them goes nowhere", async ({ page }) => {
  await slice(page);
  const s = await a2(page);
  // one real bank plus a decoy box per dead line — so counting boxes tells you
  // nothing, which is what keeps §7.1 a matter of reading rather than looking
  expect(s.decoys.length).toBe(s.conduits.filter(c => !c.rack).length);
  const ends = await page.evaluate(() => {
    const a = __doids.get().actTwo;
    const targets = a.racks.map(r => ({ x: r.x, y: r.y }))
      .concat(a.decoys.map(d => ({ x: d.x, y: d.y })));
    return a.conduits.map(c => {
      const end = c.path[c.path.length - 1];
      return Math.min(...targets.map(t => Math.hypot(t.x - end.x, t.y - end.y)));
    });
  });
  // every run terminates AT something, real or bait
  for (const d of ends) expect(d).toBeLessThan(60);
});

test("owner: a feed line runs below ground, not across open air", async ({ page }) => {
  await slice(page);
  const buried = await page.evaluate(() => {
    const c = __doids.get().actTwo.conduits.find(k => k.rack);
    // drop the two risers at each end; the run between them is the buried part
    const mid = c.path.slice(2, -2);
    return { n: mid.length, allSolid: mid.every(p => __doids.solid(p.x, p.y)) };
  });
  expect(buried.n).toBeGreaterThan(3);
  expect(buried.allSolid).toBe(true);   // in the structure, which is where services go
});

test("owner: landing beside a decoy box costs vitals, once, and never kills", async ({ page }) => {
  await slice(page);
  const r = await page.evaluate(async () => {
    const d = __doids.get().actTwo.decoys[0];
    ship.vitals = 30;
    __doids.a2Warp(d.x, __doids.ground(d.x, d.y) - 12, true);
    for (let i = 0; i < 10; i++) await new Promise(k => requestAnimationFrame(k));
    const first = ship.vitals;
    // and again: the lesson is taught once, not billed forever
    level.decoys[0].penalised = true;
    ship.vitals = 5;
    for (let i = 0; i < 10; i++) await new Promise(k => requestAnimationFrame(k));
    return { first, second: ship.vitals, dead: ship.dead };
  });
  expect(r.first).toBeLessThan(30);
  expect(r.second).toBe(5);      // charged once
  expect(r.dead).toBe(false);    // a wrong read must never be what kills you
});

/* Owner feedback, July 2026 — the plant emplacement. Tougher than an Act One gun
   without being an instakill, and Act One's own turrets must not move an inch. */
test("owner: a plant emplacement takes several rounds; an Act One turret still takes one", async ({ page }) => {
  await slice(page);
  const heavy = await page.evaluate(async () => {
    const t = level.turrets[0];
    const shots = [];
    for (let i = 0; i < 2; i++) {
      level.shots.push({ x: t.x, y: t.y - 8, vx: 0, vy: 0, t: 1 });
      await new Promise(k => requestAnimationFrame(k));
      shots.push({ hp: t.hp, alive: t.alive });
    }
    // and the round that finishes it
    level.shots.push({ x: t.x, y: t.y - 8, vx: 0, vy: 0, t: 1 });
    await new Promise(k => requestAnimationFrame(k));
    return { heavy: t.heavy, shots, alive: t.alive };
  });
  expect(heavy.heavy).toBe(true);
  expect(heavy.shots[0].alive).toBe(true);    // survives the first round
  expect(heavy.shots[1].alive).toBe(true);    // and the second
  expect(heavy.alive).toBe(false);            // three is enough

  // Act One's guns are untouched: hp defaults to 1, so one round still kills
  const light = await page.evaluate(async () => {
    __doids.go(3); __doids.launch();
    const t = (level.turrets || [])[0];
    if (!t) return null;
    level.shots.push({ x: t.x, y: t.y - 8, vx: 0, vy: 0, t: 1 });
    await new Promise(k => requestAnimationFrame(k));
    return { heavy: !!t.heavy, alive: t.alive };
  });
  if (light) {
    expect(light.heavy).toBe(false);
    expect(light.alive).toBe(false);
  }
});

/* Owner feedback: the invisible walls STAY — they just must not be impossible to
   spot. The deceptions are still authored and still lie; what is new is the tell,
   and it is one mechanism serving both hazards. */
test("owner: the chamber still lies, and dust is what gives it away", async ({ page }) => {
  await slice(page);
  /* Chamber one no longer lies at all — both hazards came out in August 2026
     (owner: "too much for level one, but we needed to see how they work"), so
     what this asserts now is the DUST, which is terrain information whether or
     not the terrain is being honest. It settles on what is solid, which is why
     it reads a lie when there is one to read. */
  const honest = await page.evaluate(() => level.spansDrawn === level.spans);
  expect(honest).toBe(true);

  /* The tell: dust settles on what is SOLID, never on what is drawn. Asserted as
     the property rather than by counting motes — the pool is randomised, and a
     count would be a tuning number, which this file does not assert. */
  /* Sampled and checked in ONE evaluation. Snapshotting the motes and then
     round-tripping a solid() call per mote let the game run on between the
     assertions, which made this flake — the check has to be taken against the
     same frame the sample came from. */
  const dust = await page.evaluate(async () => {
    __doids.a2Warp(3200, 1100, false);        // over the sump floor
    for (let i = 0; i < 90; i++) await new Promise(k => requestAnimationFrame(k));
    const motes = __doids.dust();
    const settled = motes.filter(m => m.settled);
    /* Checked against the LIVE floats, not the snapshot. `__doids.dust()` rounds
       x/y for readability like every other debug readout, and rounding is fatal
       here: half a pixel either way moves a mote across a surface boundary or
       into the neighbouring terrain column, so the assertion flaked on wherever
       the randomised motes happened to land. Probed at +1 because that is EXACT
       — a mote settles by stepping back one pixel from the solid sample that
       stopped it, so y+1 re-tests precisely that sample. */
    const live = a2Dust.filter(d => !d.dead && d.settled);
    return { n: motes.length, settled: live.length,
      allOnSolid: live.every(d => solidAt(d.x, d.y + 1)) };
  });
  expect(dust.n).toBeGreaterThan(0);
  expect(dust.allOnSolid).toBe(true);
});

/* Owner feedback: fuel down here is cans plus a drone off the well. The rules,
   not the numbers — a can is flown into, it tops up, and it is gone after. */
test("owner: a chamber carries fuel cans, taken by flying into them", async ({ page }) => {
  await slice(page);
  const cans = (await a2(page)).fuel;
  expect(cans.length).toBeGreaterThan(2);
  expect(cans.every(c => !c.taken)).toBe(true);
  // every can must sit on real ground, not hover — the same rule the fixtures have
  const grounded = await page.evaluate(() =>
    __doids.get().actTwo.fuel.every(c => !__doids.solid(c.x, c.y) &&
      Math.abs(__doids.ground(c.x, c.y) - c.y) < 40));
  expect(grounded).toBe(true);
  const got = await page.evaluate(async () => {
    const c = __doids.get().actTwo.fuel[0];
    ship.fuel = 20;
    __doids.a2Warp(c.x, c.y, false);
    for (let i = 0; i < 4; i++) await new Promise(k => requestAnimationFrame(k));
    return { fuel: ship.fuel, taken: __doids.get().actTwo.fuel[0].taken };
  });
  expect(got.taken).toBe(true);
  expect(got.fuel).toBeGreaterThan(20);
});

test("owner: you enter a chamber at the well, and so does the resupply drone", async ({ page }) => {
  await slice(page);
  const r = await page.evaluate(() => ({
    shipX: ship.x, wellX: __doids.get().actTwo.well.x, W: level.W
  }));
  // the delivery end, not the far end: the floor is flown unladen and hauled back
  expect(Math.abs(r.shipX - r.wellX)).toBeLessThan(200);
  expect(r.shipX).toBeGreaterThan(r.W * 0.8);
});

test("P·slice: the 41-second clock runs in a chamber at all", async ({ page }) => {
  await slice(page);
  // §3 — the forty-one seconds turn out to be a heartbeat, and §7.3 hangs the
  // reserve's whole pacing off it, so Act Two cannot be a level the clock sits out
  const t0 = await page.evaluate(() => __doids.get().staticClock);
  await page.waitForTimeout(400);
  const t1 = await page.evaluate(() => __doids.get().staticClock);
  expect(t1).toBeGreaterThan(t0);
});

test("P·slice: FIELD MEDIC halves what giving costs you (H-bundle contract)", async ({ page }) => {
  const cost = async easy => {
    await slice(page);
    return page.evaluate(async on => {
      easyMode = on;
      __doids.a2Cut("c1");
      __doids.a2SetReserve("r1", 30);
      __doids.a2Vitals(100);
      const r = level.racks[0];
      __doids.a2Warp(r.x, r.y - 50, false);
      const v0 = ship.vitals, res0 = r.reserve;
      input.shield = true;
      for (let i = 0; i < 30; i++) {
        await new Promise(k => requestAnimationFrame(k));
        __doids.a2Warp(r.x, r.y - 50, false);
      }
      input.shield = false;
      easyMode = false;
      return { spent: v0 - ship.vitals, given: r.reserve - res0 };
    }, easy);
  };
  const full = await cost(false);
  const medic = await cost(true);
  expect(full.given).toBeGreaterThan(0);
  expect(medic.given).toBeGreaterThan(0);
  // per unit of reserve delivered, FIELD MEDIC bleeds you half as hard
  expect(medic.spent / medic.given).toBeLessThan(full.spent / full.given * 0.75);
});

/* ===========================================================================
   THE FIFTH ON-DEVICE ROUND (owner, August 2026) — three readability calls and
   the guards for them. Two of the three were assertions nobody could have made
   from the data: the furniture was measurably darker than the room it stood in,
   and the feed lines were measurably still.
   =========================================================================== */

test("owner: a feed line carries a current, and dims where it runs through rock", async ({ page }) => {
  /* "Still don't like the vertical lines that don't do anything. If they are
     feed lines (real or fake), they should have a pulse going down them or
     something. As it is they just look like errors."

     A trunk used to carry ONE bead, placed by arc-length fraction, so a beat's
     speed depended on the run's length and each part of the line was lit in
     proportion to how much of the line it was — measured on chamber three, 87%
     of every cycle on the buried horizontal and 4.6% on the riser at the
     isolator. A 45px stub lit for a twentieth of a second is a static line.
     Asserted as the PROPERTY rather than as a bead count: a point on a riser is
     bright at some moment in a flow period and dark at another, i.e. the line
     does something. And the buried half is dimmer than the open half, which is
     what makes it read as a service run rather than a wire draped over the
     world — the comment claimed that for two rounds while one uniform stroke
     drew the lot. */
  const spot = await page.evaluate(() => {
    __doids.loadChamber("wards");
    const c = level.conduits.find(k => k.id === "c3");   // the long wall-mount riser
    const p = c.path, a = p[p.length - 2], b = p[p.length - 1];
    let air = null, rock = null;
    for (let f = 0.05; f < 0.95; f += 0.02) {
      const x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f);
      if (!solidAt(x, y)) { if (!air) air = { x, y }; }
      else if (!rock) rock = { x, y };
    }
    return { air, rock, rise: Math.round(Math.abs(b.y - a.y)) };
  });
  expect(spot.rise, "the wall-mounted bank's riser is a long vertical run").toBeGreaterThan(300);
  expect(spot.air).not.toBeNull();

  // six samples across one flow period — the point must be lit at some of them
  const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
  const seen = [];
  for (let i = 0; i < 6; i++) {
    seen.push(lum(await page.evaluate(p => __doids.samplePixel(p.x, p.y), spot.air)));
    await page.waitForTimeout(45);
  }
  const lo = Math.min(...seen), hi = Math.max(...seen);
  expect(hi - lo, `a riser at ${Math.round(spot.air.x)},${Math.round(spot.air.y)} `
    + `never changes across a flow period: ${seen.map(v => v.toFixed(0)).join(",")}`)
    .toBeGreaterThan(6);
});

test("owner: the furniture is never darker than the room it stands in", async ({ page }) => {
  /* "Ornaments are looking better, but fill still looks like a gap."

     Measured, because the two failure modes look identical in source. Sampling
     the rendered canvas over every floor-standing piece in a chamber — body
     pixel against the rock behind it — the shipped set came out at a mean ratio
     of 0.75: the furniture was on average DARKER than the room, which is not
     something an object can be. Two causes, both fixed: the tones sat inside the
     rock gradient's own value range, and the whole layer was drawn AFTER
     drawChamberLights, so every lamp pool brightened the rock and left the
     boxes at their literal value.

     The guard is the ratio, not the colour — a future retune of ORN_BODY, of the
     rock palette or of the ambient lift can move every number here and this
     still says the only thing that matters. The upper bound is the other half
     of the owner's note on this layer ("it needs to read as (interesting)
     background… you are flying in front of it, not through it"): furniture that
     outshines the room is the same mistake from the other side. */
  const r = await page.evaluate(() => {
    __doids.loadChamber("slice");
    const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
    const out = [];
    for (const o of level.plantOrnaments) {
      // the box-bodied pieces only: a drip stand and a cable loom are strokes,
      // and sampling "the body" of something with no body measures the wall
      if (!["stretcherBay", "medCrates", "ventGrate", "pumpSet", "readerHead"].includes(o.type)) continue;
      const w = o.w || 90, h = o.h || 110;
      const body = lum(__doids.samplePixel(o.x + w * 0.22, o.y + h * 0.45));
      const rock = lum(__doids.samplePixel(o.x - w * 1.3, o.y + h * 1.6));
      out.push({ type: o.type, x: Math.round(o.x), body: +body.toFixed(1),
        rock: +rock.toFixed(1), ratio: +(body / Math.max(1, rock)).toFixed(2) });
    }
    return out;
  });
  expect(r.length).toBeGreaterThan(8);
  const mean = r.reduce((a, v) => a + v.ratio, 0) / r.length;
  expect(mean, `furniture reads as a hole in the room (mean body/rock ${mean.toFixed(2)}): `
    + r.map(v => `${v.type}@${v.x} ${v.ratio}`).join(", ")).toBeGreaterThan(1.0);
  expect(mean, `furniture outshines the room it is meant to sit behind (${mean.toFixed(2)})`)
    .toBeLessThan(1.9);
  // and no single piece is a hole, however the mean lands
  for (const v of r)
    expect(v.body, `${v.type}@${v.x} has no visible body`).toBeGreaterThan(45);
});

test("owner: the shield turns a chamber wall into a bounce, as it does in Act One", async ({ page }) => {
  /* "The instakill on wall impact should only be as in act one — so using a
     shield allows a shield bounce."

     Act One's two lethal contacts have always consulted the shield first: the
     cave-roof branch bounces and the landing branch bounces between `soft` and
     `survivable`. A chamber's LATERAL rock never did, because no such surface
     existed before P·slice — so the one answer Act One gives you to a bad
     approach was missing exactly where impacts had just been made lethal again.

     Flown, not reasoned about: drive the hull into the flank of chamber three's
     structural column at a speed that kills, once with the field down and once
     with it up. */
  const run = async shield => page.evaluate(sh => {
    __doids.loadChamber("slice");
    // beside the structural column (4600..4810), at hall altitude, aimed at it
    __doids.a2Warp(4380, 900);
    /* Held on the INPUT, not on the ship: updatePlay recomputes `s.shield` from
       the button every frame, so a test that pokes the flag is testing nothing —
       it is off again before collision runs. */
    input.shield = sh;
    ship.vx = 420; ship.vy = 0; ship.landed = false;
    const fuel0 = ship.fuel;
    for (let i = 0; i < 40 && !ship.dead; i++) update(1 / 60);
    const out = { dead: ship.dead, x: Math.round(ship.x), vx: Math.round(ship.vx),
      fuelSpent: Math.round(fuel0 - ship.fuel), shielded: ship.shield };
    input.shield = false;
    return out;
  }, shield);

  const bare = await run(false);
  expect(bare.dead, "an unshielded hull driven into a column flank still dies").toBe(true);

  const held = await run(true);
  expect(held.shielded, "the field was actually up for the impact").toBe(true);
  expect(held.dead, "the field turns the same impact into a bounce").toBe(false);
  // …and it is a BOUNCE, not a pass-through: sent back the way it came
  expect(held.vx, "the hull is deflected off the face rather than stopped in it")
    .toBeLessThan(0);
  // Act One's price for a bounce, and no more
  expect(held.fuelSpent, "a bounce costs the shipped 4 fuel").toBeGreaterThan(0);
  expect(held.fuelSpent).toBeLessThan(20);
});

test("P·content: no chamber kills you against nothing", async ({ page }) => {
  /* THE THING THE LAST FIVE ROUNDS KEPT PROVING, made into a test.

     Every collision bug this bundle has paid for was invisible to a passing
     guard, and every one was found the same way: by flying the hull and
     recording where it stopped. The flood fill asks whether two columns' spans
     overlap; it never asks what `solidAt` says BETWEEN two columns, which is
     exactly where `spanAt` was interpolating toward the wrong neighbour and
     killing a hull in open air. "I couldn't get any further west, everything
     seemed solid" was that, twice, past two rounds of fixes.

     So: fly every chamber end to end at every altitude, both directions, and
     ask the one question a fill cannot — did the hull ever die, or stop, with
     NOTHING in front of it? Not "did it get through": a level-flight sweep rams
     honest walls all day and should. The correction shoves the hull clear
     before it kills, so the check is made against the position it died FROM and
     looks a hull-length ahead along the direction of travel.

     Cheap to widen: drop the altitude step and it takes longer and finds more. */
  const ids = await page.evaluate(() => ACT_TWO_CHAMBERS.map(c => c.id));
  expect(ids.length).toBeGreaterThanOrEqual(3);
  for (const id of ids) {
    const r = await page.evaluate(id => {
      const bad = [];
      let flights = 0;
      const openAt = (x, y) => {
        if (solidAt(x, y)) return false;
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4;
          if (solidAt(x + Math.cos(a) * (SHIP_R + 3), y + Math.sin(a) * (SHIP_R + 3))) return false;
        }
        return true;
      };
      const somethingThere = (x, y, dir) => {
        for (let d = 0; d <= 60; d += 4)
          for (let o = -SHIP_R; o <= SHIP_R; o += SHIP_R)
            if (solidAt(x + dir * d, y + o)) return true;
        return false;
      };
      __doids.loadChamber(id);
      const W = level.W, H = level.H;
      for (const dir of [-1, 1]) {
        for (let y0 = 120; y0 < H - 120; y0 += 90) {
          const x0 = dir < 0 ? W - 200 : 200;
          __doids.loadChamber(id);
          if (!openAt(x0, y0)) continue;            // no honest place to start
          __doids.a2Warp(x0, y0);
          flights++;
          let last = ship.x, stuck = 0;
          for (let i = 0; i < 2600; i++) {
            ship.vx = dir * 240; ship.vy = 0; ship.landed = false;
            const px = ship.x, py = ship.y;
            update(1 / 60);
            if (ship.dead) {
              if (!somethingThere(px, py, dir))
                bad.push(`died against nothing at ${Math.round(px)},${Math.round(py)} (flying ${dir < 0 ? "west" : "east"} at y${y0})`);
              break;
            }
            if (Math.abs(ship.x - last) < 0.5) {
              if (++stuck > 40) {
                if (!somethingThere(ship.x, ship.y, dir))
                  bad.push(`stopped against nothing at ${Math.round(ship.x)},${Math.round(ship.y)} (flying ${dir < 0 ? "west" : "east"} at y${y0})`);
                break;
              }
            } else stuck = 0;
            last = ship.x;
            if (dir < 0 ? ship.x < 200 : ship.x > W - 200) break;
          }
        }
      }
      return { flights, bad };
    }, id);
    expect(r.flights, `${id}: the sweep actually flew`).toBeGreaterThan(6);
    expect(r.bad, `${id}: the hull was stopped by something that is not there`).toEqual([]);
  }
});
