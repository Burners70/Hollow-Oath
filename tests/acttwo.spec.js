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
     stop somewhere short of the well while the swung fill does not — that is the
     mechanic existing, expressed as a difference between two flood fills. */
  expect(r.rest.well).toBe(false);
  expect(r.rest.maxX).toBeLessThan(r.swung.maxX);
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

test("P·slice: a dead line costs you time and tells him you are here (§7.1)", async ({ page }) => {
  await slice(page);
  const decoy = await page.evaluate(() => __doids.get().actTwo.conduits.find(c => !c.rack).id);
  await page.evaluate(id => __doids.a2Cut(id), decoy);
  const s = await page.evaluate(() => __doids.get());
  expect(s.actTwo.conduits.find(c => c.id === decoy).cut).toBe(true);
  expect(s.actTwo.racks[0].cut).toBe(false);       // the rack is still on mains
  expect(s.staticSurge).toBeGreaterThan(0);        // he is listening now
  // and no score was taken for it — Act Two does not bill you for reading a room
  // wrong (§7.4's principle, applied to §7.1)
  expect(s.score).toBe(0);
});

test("P·slice: shooting a live feed dumps the rack (§7.1)", async ({ page }) => {
  await slice(page);
  const lost = await page.evaluate(() => {
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
  // §7.3 — Act Two's losses are tracked SEPARATELY, so Act One's ranks and
  // achievements keep their exact meaning
  expect((await page.evaluate(() => __doids.get())).runLost).toBe(0);
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
  await page.evaluate(() => { __doids.a2Cut("c1"); });
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
  // §7.4 — and it is never billed to your score. The price moved to your body.
  expect((await page.evaluate(() => __doids.get())).score).toBe(0);
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
  expect(s.score).toBe(0);   // Act Two scores on its own ladder (P·systems)
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
