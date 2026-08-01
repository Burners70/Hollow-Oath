"use strict";
/* ================================================================
   Bundle P — Act Two (the descent). Simulation layer. P·slice.
   docs/ACT_TWO_SPEC.md §7 (the loop), §7.1 (the trunk), §7.3 (the reserve),
   §7.4 (the transfusion), §7.5 (the ward), §7.6 (THE WELL);
   docs/PENDULUM_SPEC.md §4.1–4.4 (the tether, which carries over unchanged).

   New file, approved exception to "keep new code inside the existing files"
   (see CLAUDE.md, "Bundle P / Act Two gets new files"). Loads after
   js/world.js (constants, the span primitives, grav()/maxVitals()/scanRate())
   and js/acttwo-data.js (the tunables and the chamber's authored rack network),
   and BEFORE js/update.js — so everything it borrows from update.js and
   render.js (banner/addText/showCard/haptic/explode/wellSlotPos…) is consumed
   inside function bodies only, never at parse time. Same load-order discipline
   as js/acttwo-render.js; see index.html.

   THE LOOP THIS FILE IS (§7). Three pressures pulling against each other:

     HURRY   the reserve is draining
     CARE    it is a box of people, and every slam costs them
     COST    every minute you buy them is vitals you don't have for the climb

   and the sequence that expresses them, end to end, which is exactly P·slice's
   brief: read which trunk feeds the rack → land at its isolator and close it →
   the rack drops to internal reserve and starts dying → cradle it → tow it,
   swinging, the length of the floor → give it your own blood when it won't make
   the trip → dock a swinging load into MERCY's swinging bay.

   What is deliberately NOT here, because the phased plan says not to guess it:
   the pulse-reading deduction layer (honest versus metronomic), the §8.1 tells
   for the two deception hazards, deep readers, the ward's four readability
   channels beyond what §7.5's primary already gives, Act Two's score and rank
   ladder, and the save schema. Those are P·systems, P·scions and P·persist. */

/* ---- run state -----------------------------------------------------------
   §7.3: Act Two's losses are tracked SEPARATELY from Act One's `runLost`, so
   existing ranks and achievements keep their exact meaning. Two counters, and
   they are the whole of it — a rack is saved or it is gone, never partial
   (§7.3 examined and rejected partial survival).

   Everything else a rack carries lives on the rack object itself (genChamber
   initialises it), which is the shape P·persist wants: a chamber checkpoint is
   a shallow copy of level.racks + level.conduits + level.wellDock plus the ship
   pose, with no state hiding in module scope. These two counters and the beat
   cursor are the only exceptions, and both are per-chamber-attempt. */
let a2Saved = 0, a2Lost = 0;
let a2Line = null;            // the transfusion line, while it is out
let a2FirePrev = true;        // FIRE is edge-triggered (a held FIRE never releases)

function actTwoActive() { return !!(level && level.racks && level.racks.length); }
function towing() { return !!(level && level.towedRack) && !ship.dead; }
function towedCage() {
  return { w: RACK_SIZE.w * RACK_CAGE_W, h: RACK_SIZE.h * RACK_CAGE_H };
}

function resetActTwo() {
  a2Saved = 0; a2Lost = 0; a2Line = null; a2FirePrev = true;
}

/* ---- §7.1 the trunk, and closing it --------------------------------------
   A rack runs on the plant's mains; to move it you get it onto internal
   reserve, which means closing its trunk feed. You close a feed at its
   ISOLATOR: land beside it and hold. That is verbatim the shipped
   deliberate-act grammar (updateBlackbox: landed, within reach, accumulate
   scanT × scanRate(), draw a ring), so Virchow's CELL DOCTRINE applies and no
   new control had to be invented for it. */
function updateTrunkCut(dt) {
  const s = ship;
  for (const c of level.conduits) {
    if (c.cut) { c.scanT = 0; continue; }
    const near = s.landed && !s.dead && Math.abs(s.x - c.x) < 70 &&
      Math.abs((s.y + SHIP_R) - c.y) < 64;
    if (!near) { c.scanT = 0; c.armed = true; continue; }
    // the lift's own teaching pattern (updateLift): name the gesture once, on
    // arrival, and re-arm when you leave — so a landing beside a breaker tells
    // you what a breaker is for without a tutorial card
    if (c.armed) { c.armed = false; addText(c.x, c.y - 40, "HOLD TO CLOSE THIS FEED", PAL().WARN); }
    c.scanT += dt * scanRate();
    if (c.scanT >= TRUNK_CUT_T) { c.scanT = 0; closeTrunk(c); }
  }
}

function closeTrunk(c) {
  c.cut = true;
  const r = c.rack && level.racks.find(k => k.id === c.rack);
  if (r && !r.cut) {
    /* §7.5 — "The act of starting the rescue is what starts the dying, and the
       player watches it happen because they caused it." cutT01 drives the ~1s
       mains→reserve ease already built into rackBrightness, so the rack visibly
       drops the instant you throw the breaker. */
    r.cut = true; r.cutT01 = 0;
    banner("FEED CLOSED — BANK ON INTERNAL RESERVE\nIT IS DYING NOW. GET IT TO THE WELL.", PAL().WARN);
    hydraulic(true); haptic.medium();
    blip(300, 140, 0.35, "sine", 0.13);
    return;
  }
  /* A decoy. §7.1: "it's his line, so he now knows you're here." The cost is
     that he is listening and the time is gone.
     A SCORE PENALTY BELONGS HERE and is not yet wired — it lands with the ladder
     in P·systems. This comment used to claim Act Two never bills the player for
     reading a room wrong; that was an assistant's assumption and the owner
     overturned it (July 2026). It costs points AS WELL as the time and his
     attention, which is not charging twice: "your score is the only permanent
     record of your success. The others just make your game harder." The other
     currencies shape the attempt you are having; score is what survives it.
     See APP_STORE_ROADMAP.md, Bundle P · P·systems for the proposed table. */
  banner("DEAD LINE — NOTHING WAS ON THE END OF IT\nHE KNOWS SOMEONE IS DOWN HERE NOW", PAL().DANGER);
  staticTick(); staticSurge = Math.max(staticSurge, 0.9);
  camera.shake += 7; haptic.heavy();
  addText(c.x, c.y - 40, "HIS LINE", PAL().REVEAL);
}

/* §7.1 — "Shooting a feed dumps the rack." The oath has teeth again, and it is
   a wire rather than a lecture: a live trunk carries the rack's life support,
   so putting a round through it kills everyone in the box. Called from the shot
   loop (js/update.js) under a level.conduits guard. */
function actTwoShotHit(b) {
  if (!level.conduits) return false;
  for (const c of level.conduits) {
    if (c.cut) continue;
    // the trunk is the line from its isolator up to whatever it feeds; test the
    // segment, not just the endpoints, or a shot slips through the middle of it
    if (!segNear(b.x, b.y, c.x, c.y0, c.x1, c.y1, 12)) continue;
    c.cut = true;
    const r = c.rack && level.racks.find(k => k.id === c.rack);
    explode(b.x, b.y, PAL().DANGER, 18);
    if (r && !r.lost && !r.delivered) {
      loseRack(r, "THE FEED IS CUT — YOU SHOT THEIR LIFE SUPPORT");
    } else {
      addText(b.x, b.y - 20, "DEAD LINE", PAL().WARN);
    }
    return true;
  }
  return false;
}

// distance from a point to a segment, against a radius — no allocation
function segNear(px, py, x0, y0, x1, y1, rad) {
  const dx = x1 - x0, dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? clamp(((px - x0) * dx + (py - y0) * dy) / len2, 0, 1) : 0;
  return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t)) < rad;
}

/* ---- §7.3 the reserve ----------------------------------------------------
   Continuous so it is legible — you can judge how long you've got — plus a
   bite on the beat, because every rack in the network is on the same tap. The
   bite is what makes the 41 seconds a planning problem rather than a shove:
   can I reach the well before the next beat, or do I give now? */
function updateReserves(dt, beat) {
  for (const r of level.racks) {
    if (r.cutT01 != null) {
      r.cutT01 += dt;                       // the ~1s mains→reserve ease
      if (r.cutT01 >= 1) r.cutT01 = null;
    }
    r.slamT = Math.max(0, r.slamT - dt * 3);
    if (!r.cut || r.delivered || r.lost) { r.state = rackStateFor(r); continue; }
    r.reserve -= RACK_DRAIN * dt;
    if (beat) {
      r.reserve -= RACK_BEAT_BITE;
      // the network's bite is simultaneous across every rack (§7.3); the ripple
      // that leads it is already drawn (networkRippleT, js/acttwo-render.js)
      if (r.reserve > 0) { addText(r.x, r.y - 46, "THE BEAT TOOK MORE", PAL().DANGER); }
    }
    if (r.reserve <= 0) { loseRack(r, "FLATLINE — THE BANK IS GONE"); continue; }
    r.state = rackStateFor(r);
  }
}

/* §7.3 — flatline is death, total, never partial. The chamber is the retry unit
   (§11.1), which is what lets that be true without training the player to
   save-scum; the checkpoint itself is P·persist. */
function loseRack(r, why) {
  r.lost = true; r.reserve = 0; r.state = "gone"; r.towed = false;
  if (level.towedRack === r) level.towedRack = null;
  a2Lost++;
  /* Owner feedback: the second line used to read "THE CHAMBER IS THE UNIT OF
     RETRY", which is a sentence from the design doc and meant nothing to the
     person reading it off a phone. Say the thing it was shorthand for. */
  banner(why + "\nTHEY DON'T COME BACK. THIS FLOOR STARTS OVER.", PAL().DANGER);
  /* §7.5's last row is the whole grammar of the game in one cue: a steady,
     unbroken glow with NO beat at all. Absence of rhythm has always meant
     something is wrong; here it means someone died. So the sound is the
     no-heartbeat one, not an alarm. */
  dullThud(); haptic.heavy();
  camera.shake += 9;
  explode(r.x, r.y, PAL().DANGER, 22, true);
}

/* ---- landing ON the rack (owner feedback, July 2026) ----------------------
   "To keep some of the previous functionality, you should land on the rack to
   connect your cable." Which is right on two counts: Act One's whole grammar is
   that you land on the thing you are here for, and the shipped version had NO
   input at all — updateCradle accumulated on mere proximity while landed, so the
   sling rigged itself and the owner reasonably asked how you were meant to
   connect.

   So a moored rack is a landable surface. Its cage top is the pad, and the
   landing is billed exactly like any other: a soft touch sets you down, a hard
   one costs the hull. Only while moored — a rack on a rope is not somewhere to
   put a spacecraft. */
function rackPad(r) {
  const cage = { w: (r.w || RACK_SIZE.w) * RACK_CAGE_W, h: (r.h || RACK_SIZE.h) * RACK_CAGE_H };
  return { top: r.y - cage.h / 2, hw: cage.w / 2 };
}
function landableRacks() {
  return (level.racks || []).filter(r => r.moored && !r.towed && !r.delivered && !r.lost);
}
/* Returns false if the touchdown killed the hull, matching shipSolidCollide's
   contract so updatePlay can bail the same way. */
function shipRackLanding() {
  const s = ship;
  if (s.dead) return true;
  /* Only ever ACQUIRES a pad, exactly like the terrain path's `if (!s.landed &&
     …)`. Re-running while landed would re-zero vy every frame and pin the hull to
     the lid: thrust adds about 3px/s per frame, so it could never build the climb
     needed to leave. `landedOn` therefore survives until the takeoff clears
     s.landed, which is also what the cradle wants to read. */
  if (s.landed) return true;
  s.landedOn = null;
  for (const r of landableRacks()) {
    const pad = rackPad(r);
    if (Math.abs(s.x - r.x) > pad.hw + SHIP_R * 0.5) continue;
    if (s.y + SHIP_R < pad.top || s.y > r.y) continue;      // on the lid, not inside the cage
    if (s.vy < 4) continue;                                 // must be settling ONTO it
    const vn = Math.max(0, s.vy);
    s.y = pad.top - SHIP_R; s.vy = 0; s.vx = 0;
    s.landed = true; s.landedOn = r.id;
    s.ang = assist ? normAngle(s.ang) : 0;
    /* The same free band the hull gets against rock, so setting down on a bank of
       people is not held to a stricter standard than setting down on stone —
       what it costs above that is the hull's, never the rack's. Slamming INTO a
       rack is towContact's business and always was. */
    if (vn > HULL_SAFE_V) return hullImpact(vn);
    return true;
  }
  return true;
}

/* ---- §4.2 the cradle -----------------------------------------------------
   Land within reach of a rack already on internal reserve and hold. Only a cut
   rack can be cradled, which sequences the whole loop for free: the rack IS
   their life support (§6.1), so unplugging it by hand is not on offer — you
   close its feed first, and that is what starts the clock.

   Re-cradling a rack you have already rigged is quicker than the first time
   (RECRADLE_T): the sling is already made up, you are re-hooking it. Setting a
   rack down to give it blood is a decision the design wants to be affordable,
   and 2.5s each way was quietly billing the player twice for making it. */
function updateCradle(dt) {
  if (level.towedRack) { for (const r of level.racks) r.cradleT = 0; return; }
  const s = ship;
  for (const r of level.racks) {
    /* Landed ON it, not merely near it (owner feedback). Proximity-while-landed
       meant the sling rigged itself with no act on the player's part; standing on
       the box is an act, it is Act One's own grammar, and it gives the hold ring
       somewhere to be that reads as "this one". */
    const ok = r.cut && !r.delivered && !r.lost && s.landed && !s.dead &&
      s.landedOn === r.id;
    if (!ok) { r.cradleT = 0; continue; }
    r.cradleT += dt * scanRate();
    if (r.cradleT >= (r.everTowed ? RECRADLE_T : CRADLE_T)) {
      r.cradleT = 0;
      cradleRack(r);
      return;
    }
  }
}

function cradleRack(r) {
  level.towedRack = r;
  r.towed = true;
  r.vx = 0; r.vy = 0;
  /* Seat it on the sling before the first physics frame ever runs. You cradle
     from up to 92px away while landed, so the rope starts over-length by ~25px;
     letting the constraint take that up on frame one converts a rigging
     operation into a yank, and the Verlet step then reads that yank as velocity.
     A sling coming taut does not fling the box it is being fastened to. */
  seatPayload(r);
  if (!r.everTowed) {
    r.everTowed = true;
    banner("CRADLED — SHE HANGS BELOW YOU NOW\nFIRE RELEASES. EVERY SLAM IS FELT BY EVERYONE IN THE BOX.", PAL().SAFE);
  }
  blip(220, 520, 0.25, "sine", 0.11);
  haptic.light();
  a2FirePrev = true;   // a FIRE still held from the cradle must not release it
}

/* ---- §4.1 the tether ----------------------------------------------------
   One point mass on a ROPE of length SLING_L anchored under the ship's centre,
   integrated like the ship and pulled back onto length by a distance constraint
   run SLING_ITER times a frame. Not angle math: PENDULUM_SPEC picked this model
   because it degrades gracefully exactly where angles fall apart — when the
   payload is resting on ground and the sling is slack, and when the ship spins.

   A rope rather than a rod is what makes two of §4.2's rules free instead of
   special-cased: the payload settles onto terrain first and the sling goes
   slack (no constraint while d < SLING_L, so a rack on the floor never levers
   the ship down onto it), and taking off re-tensions.

   The correction SPLIT is the feel. The payload takes most of it as position —
   that is what holds the rope's length — and the ship takes SLING_SHIP_W of it
   as VELOCITY rather than position, because the ship's position is owned by the
   collision solver that has already run this frame. Shoving ship.x directly
   would fight that solver and could teleport the hull into rock; an impulse is
   also the truer reading of "towing genuinely tugs the ship", because a tug is
   something you feel in the controls, not a jump. */
/* Put the payload on the sling circle directly, with no velocity. The recovery
   path for every case where the load and the hull are further apart than a rope
   can explain: rigging the sling (cradleRack), a debug warp, and the scripted
   lift/extraction beats that move the ship without simulating it. Without it the
   constraint takes up hundreds of px in one frame and the Verlet step reads that
   as a colossal velocity, which slams the load into the nearest rock and kills
   everyone in it. */
function seatPayload(r, down) {
  const s = ship;
  const ax = s.x, ay = s.y + SLING_SHIP_ANCHOR;
  let dx = r.x - ax, dy = r.y - ay;
  const d = Math.hypot(dx, dy);
  /* `down` hangs it straight below instead of along the line it currently lies
     on. Which one is right depends on why we are re-seating. Rigging a sling
     keeps the direction, because that is genuinely where the load is relative to
     the hull. Recovering from a teleport must NOT keep it: the old direction is
     a fact about where the ship used to be, and preserving it hangs the load out
     sideways at hull height, which then swings through a quarter circle the
     player did nothing to cause. */
  if (down || d < 1e-6) {
    r.x = ax; r.y = ay + SLING_L; r.vx = 0; r.vy = 0;
    return;
  }
  /* A rope, so an UNDER-length sling is simply slack and the load stays exactly
     where it is. Forcing it out to SLING_L was wrong and visibly so: you cradle
     while landed beside a rack that is sitting on the same floor you are, which
     is well inside the rope's length, and pushing it out to full extension drove
     it down into the deck — a collision, at speed, on the frame you picked it up.
     A sling being fastened does not shove the box away from you. */
  if (d <= SLING_L) { r.vx = 0; r.vy = 0; return; }
  r.x = ax + dx / d * SLING_L; r.y = ay + dy / d * SLING_L;
  r.vx = 0; r.vy = 0;
}

/* ---- the moorings (owner feedback) ----------------------------------------
   A moored rack is not simulated: it is part of the structure, so it does not
   fall, swing or drift, and the rope coming taut pulls the SHIP instead. That is
   the somersault fixed at the cause rather than damped — see the note on
   MOOR_BREAK_T for why cradling from beside the box was a pendulum release from
   horizontal.

   The ship is held ON the rope's circle while the mounts hold, which is what
   makes "requires my thrust to lift them" true without a special input: you
   climb, the line stops you, and you hold that against the mounts until they go.
   Returns true while it is still holding, so updateTow can skip the tether. */
function updateMooring(dt, r) {
  const s = ship;
  r.vx = 0; r.vy = 0;
  const ax = s.x, ay = s.y + SLING_SHIP_ANCHOR;
  const dx = r.x - ax, dy = r.y - ay;
  const d = Math.hypot(dx, dy);
  /* THRUST against a line at full extension is the signal — not stretch, and not
     stretch plus thrust either. Held at the rope's limit the hull sits in
     equilibrium and moves a fraction of a pixel per frame, so `d` falls either
     side of SLING_L frame by frame: gravity wins one frame, thrust the next.
     Any test of the form "d is BEYOND its length" therefore alternates, and the
     timer is wiped by its own decay before it can fill. Measured instead as "the
     line is at its length, within a hair" plus a held thrust — which is what is
     actually being asked of the player, and what they can see themselves doing:
     "require my thrust to lift them, maybe a slight extra thrust to break the
     moorings." */
  const taut = d >= SLING_L - MOOR_TAUT;
  const pulling = taut && (input.thrust || pad.thrust);
  if (pulling) { r.moorT += dt; camera.shake += 0.6; }   // the strain, felt not told
  else r.moorT = Math.max(0, r.moorT - dt * 1.5);

  /* Taut against a bolted rack: the whole correction goes on the hull, because
     the other end genuinely cannot move — the inverse of the towing case, where
     the payload takes the position and the ship takes a share as an impulse.
     Only ever pulling the hull IN, never pushing it out: still a rope. */
  if (d > SLING_L) {
    const ux = dx / d, uy = dy / d, err = d - SLING_L;
    s.x += ux * err; s.y += uy * err;
    const vr = s.vx * -ux + s.vy * -uy;   // how fast the hull is pulling away
    if (vr > 0) { s.vx += ux * vr; s.vy += uy * vr; }   // the line takes it out
    s.landed = false;
  }

  if (r.moorT < MOOR_BREAK_T) return true;

  r.moored = false; r.moorT = 0;
  /* Free of the mounts, and NOT flung: the load is placed on the rope's circle
     with no velocity, hanging straight below. Letting the constraint take up the
     slack on the frame it comes free would read as a yank — the same reason
     cradleRack seats it rather than letting frame one do the work. */
  seatPayload(r);
  addText(r.x, r.y - 44, "MOUNTS PARTED", PAL().WARN);
  hydraulic(); haptic.heavy();
  camera.shake += 5;
  return false;
}

function updateTow(dt) {
  const r = level.towedRack;
  if (!r) return;
  const s = ship;
  /* §4.2 — the field would sever the sling. One consistent law: nothing rides a
     tether under the field. (The shield input is gated in updatePlay too, so
     the button never even flickers the field on while a load is up.) */
  s.shield = false;

  if (dt <= 0) return;
  // still bolted in? then nothing about the tether runs yet — see updateMooring
  if (r.moored && updateMooring(dt, r)) return;
  const px = r.x, py = r.y;
  r.vy += grav() * dt;
  r.vx *= SLING_DAMP; r.vy *= SLING_DAMP;
  r.x += r.vx * dt; r.y += r.vy * dt;

  const ax = s.x, ay = s.y + SLING_SHIP_ANCHOR;
  const d0 = Math.hypot(r.x - ax, r.y - ay);
  // more than a rope's length out of place is not a stretched rope, it is a
  // teleport somewhere upstream — re-seat rather than snap the load across a room
  if (d0 > SLING_L * 2) { seatPayload(r, true); return; }

  if (d0 > SLING_L && !s.landed) {
    /* THE TUG (§4.1: "Constraint correction split ship 30% / payload 70% —
       towing genuinely tugs the ship. That 30% *is* the pendulum feel.")

       The ship's share is applied as an impulse against the RADIAL CLOSING
       SPEED, not as err/dt. Two reasons, both found by flying it: err/dt makes
       the coupling stiffness proportional to 1/dt, so the tug's strength depends
       on the framerate — the same flight feels different at 60 and 120fps, which
       for a value being tuned on hardware is worse than useless. And it is
       unbounded on a long frame, which is how the first version threw a rack the
       length of the hall. Against relative speed it is framerate-independent,
       bounded by how fast the two are actually separating, and it only fires
       when the rope is genuinely catching — thrust away and you feel the load
       come onto the line, which is the whole sensation the split exists for. */
    const ux = (r.x - ax) / d0, uy = (r.y - ay) / d0;
    const vrel = (r.vx - s.vx) * ux + (r.vy - s.vy) * uy;
    if (vrel > 0) { s.vx += ux * vrel * SLING_SHIP_W; s.vy += uy * vrel * SLING_SHIP_W; }
  }

  /* The payload then takes the whole positional correction, so the rope holds
     its length exactly rather than stretching by the ship's share every frame.
     Position on the load, velocity on the hull: a clean split, and the rope
     never quietly becomes elastic. */
  for (let it = 0; it < SLING_ITER; it++) {
    const dx = r.x - s.x, dy = r.y - (s.y + SLING_SHIP_ANCHOR);
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) break;
    const err = d - SLING_L;
    if (err <= 0) break;                    // slack — a rope pulls, never pushes
    r.x -= dx / d * err; r.y -= dy / d * err;
  }

  towCollide(r, dt);
  // the Verlet step: velocity is whatever the payload ACTUALLY moved, so the
  // rope sheds the radial component it just cancelled and the load swings
  // instead of pumping itself. This is what makes it a pendulum.
  r.vx = (r.x - px) / dt; r.vy = (r.y - py) / dt;
  applyContactDamping(r);      // the drag the Verlet step used to throw away
  r.tension = clamp(1 - (SLING_L - Math.hypot(r.x - s.x, r.y - (s.y + SLING_SHIP_ANCHOR))) / 44, 0, 1);
  r.swing = Math.abs(Math.atan2(r.x - s.x, Math.max(1, r.y - s.y)) * 180 / Math.PI);
}

/* A rack that is NOT on the sling still obeys gravity. §4.2: "The payload drops
   where it is; a gentle drop (contact speed < SLING_SAFE_V) is free, a hard one
   costs integrity." Without this a released load hangs in mid-air, which makes
   the release a free teleport-and-park instead of a decision with a cost — and
   silently voids the drop half of the damage model.

   It also settles a rack the chamber authored slightly off its floor, so a
   terrain retune can never leave the box hovering. */
function updateLooseRacks(dt) {
  if (dt <= 0) return;
  for (const r of level.racks) {
    if (r.towed || r.delivered || r.lost) continue;
    const px = r.x, py = r.y;
    r.vy += grav() * dt;
    r.vx *= SLING_DAMP; r.vy *= SLING_DAMP;
    r.x += r.vx * dt; r.y += r.vy * dt;
    towCollide(r, dt);
    r.vx = (r.x - px) / dt; r.vy = (r.y - py) / dt;
    applyContactDamping(r);    // §4.2 — dropped where it fell, and it STAYS there
  }
}

/* §4.3 — contact costs integrity in proportion to how roughly you fly, and is
   free below SLING_SAFE_V. Measured on the NORMAL component of the payload's
   velocity, not its speed: sliding a rack along a floor at cruise is a graze,
   driving it into that same floor at cruise is a slam, and only the normal
   component tells those apart. Speed alone would bill the player for every fast
   pass through the momentum pinch — the one place the design actively wants
   speed carried (§11.3).

   Damage lands on BOTH meters, and they are not the same thing. `reserve` is
   the resource under pressure — so a slam and the drain pull on one needle,
   which is what makes hurry-versus-care a single allocation problem rather than
   two unrelated ones. `integrity` is the RECORD of how much of their life you
   spent by handling, never touched by the drain, so GENTLE HANDS (§10a.4) means
   "never slammed" and not "arrived quickly". */
/* Contact damping, applied AFTER the Verlet step (owner feedback: a dropped rack
   "sliding frictionlessly back toward me").

   towCollide's `r.vx *= 0.86` was dead code. Both integrators recompute velocity
   from actual displacement on the next line — `r.vx = (r.x - px) / dt` — which is
   what makes the rope shed its radial component and swing, but it also overwrote
   every friction and restitution value the collision had just set. So a rack
   slid on SLING_DAMP (0.999) alone: effectively frictionless, on a box the owner
   rightly points out weighs enough that it "wouldn't move far".

   The fix keeps the Verlet recompute authoritative for *position*-derived motion
   and then applies contact damping to the result, in the same order a solver
   would: resolve, derive, damp. towCollide records what it wants here rather
   than assigning to r.vx, so there is one place that owns the payload's
   velocity and no second writer to go stale. */
function applyContactDamping(r) {
  const touched = r.dampX != null || r.dampY != null || r.clampVx || r.clampVy;
  if (r.dampX != null) { r.vx *= r.dampX; r.dampX = null; }
  if (r.dampY != null) { r.vy *= r.dampY; r.dampY = null; }
  if (r.clampVy === "down") { r.vy = Math.min(0, r.vy); r.clampVy = null; }
  else if (r.clampVy === "up") { r.vy = Math.max(0, r.vy); r.clampVy = null; }
  if (r.clampVx === "left") { r.vx = Math.min(0, r.vx); r.clampVx = null; }
  else if (r.clampVx === "right") { r.vx = Math.max(0, r.vx); r.clampVx = null; }
  /* A load at rest stays at rest: without a deadband the 0.72 tail leaves it
     creeping for seconds, which is the owner's complaint in slow motion.
     ONLY on a contact frame, though — applied unconditionally it also eats
     gravity's per-frame increment (~1.5px/s at 60fps), which pins a rack in
     mid-air and makes a dropped one hover. Free fall is not a contact. */
  if (!touched) return;
  if (Math.abs(r.vx) < 3) r.vx = 0;
  if (Math.abs(r.vy) < 3) r.vy = 0;
}

function towCollide(r, dt) {
  const cage = towedCage(), hw = cage.w / 2, hh = cage.h / 2;
  const sp = spanAt(r.x, r.y);
  if (!sp) {   // buried: the load has been dragged into rock, push it back out
    const col = level.spans[clamp(Math.round(r.x / STEP), 0, level.spans.length - 1)] || [];
    const near = pickSpan(col, r.y);
    if (near) r.y = clamp(r.y, near.top + hh, near.bot - hh);
    r.vx *= 0.4; r.vy *= 0.4;
    return;
  }
  if (r.y + hh > sp.bot) {                       // floor
    towContact(r, Math.max(0, r.vy));
    r.y = sp.bot - hh;
    r.clampVy = "down"; r.dampY = 0.2;
    r.dampX = 0.72;                              // it drags, it doesn't skate
  }
  if (r.y - hh < sp.top) {                       // ceiling
    towContact(r, Math.max(0, -r.vy));
    r.y = sp.top + hh;
    r.clampVy = "up"; r.dampY = 0.2;
    r.dampX = 0.9;
  }
  for (const side of [-1, 1]) {                  // walls, and a pillar's flank
    if (!solidAt(r.x + side * hw, r.y)) continue;
    towContact(r, Math.max(0, r.vx * side));
    r.x -= side * 3;
    r.clampVx = side > 0 ? "left" : "right";
    r.dampX = 0.3;
  }
}

/* THE LADDER'S HOOK (owner decision, July 2026 — not yet implemented). Integrity
   must NOT scale the delivery award, but every impact on the rack costs points,
   per impact — and it costs them ON TOP of the reserve and integrity it already
   takes, because those two only make this attempt harder while the score is the
   permanent record. This function is where that belongs: it already fires exactly once
   per qualifying impact, already knows the damage, and already carries FIELD
   MEDIC's wider free band — so a penalty added here inherits all three rather
   than re-deriving them. Left unwired until P·systems builds the ladder. */
function towContact(r, vn) {
  // §4.4's FIELD MEDIC contract, unchanged: a wider free band and half damage
  const safe = easyMode ? SLING_SAFE_V * 1.3 : SLING_SAFE_V;
  if (vn <= safe) return;
  const dmg = (vn - safe) * SLING_DMG_K * (easyMode ? 0.5 : 1);
  if (dmg < 0.4) return;
  r.integrity = Math.max(0, r.integrity - dmg);
  r.reserve = Math.max(0, r.reserve - dmg);
  r.slamT = 1;
  addText(r.x, r.y - 40, "-" + Math.max(1, Math.round(dmg)), PAL().DANGER);
  /* Owner feedback: "hitting the ground and walls should damage the rack. Maybe
     there are even yells or something from within" — answered as audio, a
     shudder and haptics, with no text and no emoji (owner's call, and the right
     one: the game reads lives off rhythm, never captions). The knock is the hull
     and the cry is what is inside it, scaled by how hard you hit. */
  dullThud();
  muffledCry(clamp(dmg / 12, 0.15, 1));
  haptic.medium();
  camera.shake += Math.min(7, dmg * 0.35);
  if (r.reserve <= 0) loseRack(r, "THE LAST SLAM DID IT — THE BANK IS GONE");
}

/* §4.2 — TAP FIRE releases, edge-triggered, and while towing FIRE never shoots
   (gated in updatePlay). fireCd is pushed out on release so the same tap can't
   become a shot the moment the load is gone — the exact convention
   finishTransfusion already uses. §10a.2: this is the Act Two oath question,
   which is not "shoot or don't" but "put them down, in this room, and pick up a
   gun." */
function updateTowRelease() {
  const fire = input.fire || pad.fire;
  if (towing() && fire && !a2FirePrev) releaseRack();
  a2FirePrev = fire;
}

function releaseRack() {
  const r = level.towedRack;
  if (!r) return;
  partSling();
  ship.fireCd = Math.max(ship.fireCd, 0.5);
  addText(r.x, r.y - 40, "RELEASED", PAL().WARN);
  blip(360, 200, 0.14, "sine", 0.09);
  haptic.light();
}

/* The sling comes off, whatever the reason — a deliberate release, or the hull
   dying under it (PENDULUM_SPEC §4.3: "the sling parts, the payload drops where
   it fell… and can be re-cradled on the next life"). The load keeps its
   velocity, so a release mid-swing throws it exactly as far as it was going;
   updateLooseRacks flies it from there. Called from shipDie (js/update.js) as
   well as from here, which is why it is its own function: a rack left attached
   through a respawn would be dragged across the chamber by a hull that
   spawnShip has just re-placed. */
function partSling() {
  const r = level.towedRack;
  if (!r) return;
  level.towedRack = null;
  r.towed = false;
  if (level.wellDock) { level.wellDock.docking = false; level.wellDock.winchT = 0; }
  // and the line goes with it: you cannot be giving blood to something you have
  // just dropped, and a stale line would draw to a rack that is no longer there
  if (a2Line && a2Line.rack === r) a2Line = null;
}

/* ---- §7.4 the transfusion, inverted -------------------------------------
   Act One's line is MERCY supplying you (updateTransfusion, js/update.js).
   Down here there is no MERCY: you are the supply. Same machinery — sustained
   hover, a line that parts if you drift, shield down while it is out,
   diminishing returns per fill — and the opposite direction.

   THE CONTROL. Hold SHIELD. Every other input is already spoken for while you
   are hovering over a dying rack (thrust holds you up, steering aims, and FIRE
   is the release), and the shield is the one button that is *semantically*
   free: the field would sever the line, so it cannot be up while the line is
   out. Using the button that raises your own protection to instead open a vein
   is the same inversion the whole mechanic is — the hand that shields you is
   the hand that gives. It is a hold, so it is deliberate and abandonable,
   which is what a bleed should be.

   Works whether the rack is slung or set down, so "set them down and treat
   them" and "give on the wing" are both available and both cost something
   different: the first costs the time to re-cradle, the second costs holding a
   hover with a load swinging under you. */
function giveTarget() {
  const s = ship;
  if (s.dead || s.landed || s.vitals <= GIVE_FLOOR) return null;
  if (Math.hypot(s.vx, s.vy) > GIVE_HOVER_V) return null;
  let best = null, bestD = Infinity;
  for (const r of level.racks) {
    if (!r.cut || r.delivered || r.lost || r.reserve >= RACK_RESERVE_MAX) continue;
    const d = Math.hypot(s.x - r.x, s.y - r.y);
    if (d < GIVE_WINDOW_R && d < bestD) { bestD = d; best = r; }
  }
  return best;
}

// "is the SHIELD button currently a transfusion rather than a field?" Read by
// updatePlay's shield gate as well as by this file, so the two can never
// disagree about what the button meant this frame.
function giveWanted() {
  return !!(actTwoActive() && (input.shield || pad.shield) && giveTarget());
}
function giving() { return !!a2Line; }

function updateGive(dt) {
  const s = ship;
  const held = input.shield || pad.shield;
  if (a2Line) {
    const r = a2Line.rack;
    const d = Math.hypot(s.x - r.x, s.y - r.y);
    if (r.lost || r.delivered) return endGive(null);
    if (!held) return endGive("LINE CLOSED");
    if (d >= GIVE_SNAP_R) {
      /* Act One charges -50 for letting the resupply line part. Nothing is
         charged here, deliberately: §7.4 — "Act Two must not bill you for
         keeping people alive… the price moved from your score to your body."
         The cost of a parted line is already the blood that went nowhere. */
      endGive("LINE PARTED — YOU DRIFTED");
      camera.shake += 4;
      return;
    }
    if (d >= GIVE_WINDOW_R) { a2Line.stall = true; return; }   // stretched, no flow
    a2Line.stall = false;
    s.shield = false;
    /* §7.4's floor, at ~15 vitals: the line auto-detaches. Diegetic and a real
       clinical rule — you cannot treat if you are the casualty — and it is what
       makes an unwinnable state impossible without softening anything. You will
       still be nearly dead and about to haul a heavy load up a shaft. */
    if (s.vitals <= GIVE_FLOOR) return endGive("YOU ARE THE CASUALTY NOW — LINE CLOSED");
    if (a2Line.given >= a2Line.cap) return endGive("THAT IS ALL THIS LINE WILL CARRY");
    const room = Math.min(RACK_RESERVE_MAX - r.reserve, a2Line.cap - a2Line.given);
    const step = Math.min(GIVE_RATE * dt, room);
    if (step <= 0) return endGive("THAT IS ALL THIS LINE WILL CARRY");
    r.reserve += step;
    a2Line.given += step;
    // FIELD MEDIC halves the cost, per the existing accessibility contract
    s.vitals = Math.max(0, s.vitals - step * GIVE_COST * (easyMode ? 0.5 : 1));
    r.state = rackStateFor(r);
    a2Line.dripT += dt;
    if (a2Line.dripT >= 0.3) {
      a2Line.dripT = 0;
      blip(240, 300, 0.06, "sine", 0.05);
      haptic.light();
    }
    return;
  }
  if (!held) return;
  const r = giveTarget();
  if (r) startGive(r);
}

function startGive(r) {
  /* §7.4 — diminishing returns per rack, the shipped 0.9^n shape, so stalling
     over one box is not a strategy. Counted per rack rather than per chamber:
     the falloff is about how much good another top-up of the SAME failing
     reserve does, which is a fact about that rack. */
  a2Line = { rack: r, given: 0, dripT: 0, stall: false,
    cap: GIVE_PER_LINE * Math.pow(GIVE_FALLOFF, r.gives) };
  r.gives++;
  ship.shield = false;
  blip(300, 460, 0.14, "sine", 0.1);
  haptic.light();
  if (r.gives === 1)
    banner("YOUR OWN VITALS, INTO THEIRS\nTHERE IS NO MERCY DOWN HERE. YOU ARE THE SUPPLY.", PAL().WARN);
}

function endGive(msg) {
  const g = a2Line;
  a2Line = null;
  if (!g) return;
  if (msg) {
    addText(ship.x, ship.y - 44, msg + "  ·  +" + Math.round(g.given), PAL().WARN);
    blip(420, 280, 0.13, "sine", 0.09);
  }
}

/* ---- §7.6 THE WELL ------------------------------------------------------
   MERCY cannot land and cannot descend, so she lowers a docking bay down the
   shaft on a cable. It hangs, and it sways. You dock a swinging load into a
   swinging bay — the mothership is doing exactly what you are doing, carrying
   something precious on a line and trying not to hurt it.

   The window is measured on the RACK against the bay's slot, not on the ship,
   because the thing you are aiming is the load. That is the whole skill of it:
   hold a swinging box still under a swinging slot for long enough that the
   winch can take it. */
function updateWellDock(dt, now) {
  const w = level.wellDock;
  if (!w) return;
  const s = ship;
  const slot = wellSlotPos(w, now);
  if (w.docking) {
    w.winchT = Math.min(1, w.winchT + dt / WELL_WINCH_T);
    w.tension = 0.55 + 0.4 * w.winchT;
    if (w.winchT >= 1) deliverRack(w);
    return;
  }
  w.winchT = 0;
  // §10a.1 — refuel is free at the well, and fuel is a per-chamber lap budget
  // rather than a fourth pressure. Vitals come back on DELIVERY, not on arrival.
  const shipNear = Math.hypot(s.x - slot.x, s.y - slot.y) < 200 && !s.dead;
  if (shipNear) s.fuel = Math.min(maxFuel(), s.fuel + 30 * dt);
  const r = level.towedRack;
  if (!r || s.dead) return;
  const d = Math.hypot(r.x - slot.x, r.y - slot.y);
  const still = Math.hypot(r.vx, r.vy) < WELL_DOCK_V;
  if (d < WELL_DOCK_R && still) {
    w.docking = true; w.winchT = 0;
    w.rackState = rackStateFor(r); w.occupants = r.occupants;
    hydraulic(false); haptic.medium();
    blip(420, 760, 0.22, "sine", 0.11);
  }
}

function deliverRack(w) {
  const r = level.towedRack;
  w.docking = false; w.winchT = 0;
  if (!r) return;
  level.towedRack = null;
  r.towed = false; r.delivered = true; r.state = "reserve";
  a2Saved++; w.taken++;
  /* §7.4 — "Delivery heals you… The reward for finishing a rescue is your own
     recovery." Which is what makes the transfusion floor survivable as a design:
     you fly the last leg nearly dead, and getting them home is what fixes you. */
  ship.vitals = maxVitals();
  ship.fuel = maxFuel();
  const gentle = r.integrity >= 100;
  banner("ABOARD — " + r.occupants + " SOULS, AND SHE CAN STOP NOW" +
    (gentle ? "\n· GENTLE HANDS — NOT ONE SLAM" : "\nINTEGRITY " + Math.round(r.integrity) + "%"),
    PAL().SAFE);
  goldBurst(r.x, r.y);
  heartbeat(); haptic.medium();
  blip(520, 1040, 0.3, "sine", 0.14);
}

/* The hull died. §4.3's rule for the load, plus the line: you cannot be giving
   blood while dead, and a line left set would keep drawing to a rack from a ship
   that no longer exists. Called from shipDie (js/update.js). */
function actTwoShipDied() {
  partSling();
  a2Line = null;
}

/* Where a chamber puts you back. The entry is authored as the chamber's first
   `room` part, so this reads the geometry rather than storing a spawn point that
   could drift out of step with a retune — the same reason the fixtures snap.
   Deliberately does NOT touch the racks: a life costs you the flight back, not
   the room, and the room is P·persist's unit of retry. */
function respawnInChamber() {
  const e = chamberEntryPos();
  ship = Object.assign({}, ship, {
    x: e.x, y: e.y,
    vx: 0, vy: 0, ang: 0, fuel: maxFuel(), vitals: maxVitals(),
    passengers: [], landed: false, dead: false, fireCd: 0,
    shield: false, parryT: 0, signalT: 0, scuttleT: 0
  });
  camera.x = ship.x; camera.y = ship.y;
  a2FirePrev = true;
  banner("BACK IN — THEY ARE STILL DOWN HERE, AND STILL DYING", PAL().WARN);
}

/* ---- the decoy boxes (owner feedback, July 2026) --------------------------
   Landing beside one costs vitals, once. See the note on DECOY_VITALS for why
   vitals and not score: you are the blood supply down here, so it is taken out of
   the same pool a real bank will need later — the cost is real without inventing
   a ladder Act Two does not have yet.

   Once per box, deliberately. A repeating charge for standing in the wrong place
   would turn a wrong read into a bleed you cannot walk away from, and the lesson
   is already taught the first time. */
function updateDecoys() {
  if (!level.decoys) return;
  const s = ship;
  if (!s.landed || s.dead) return;
  for (const d of level.decoys) {
    if (d.penalised) continue;
    if (Math.hypot(s.x - d.x, s.y - d.y) > DECOY_R) continue;
    d.penalised = true;
    s.vitals = Math.max(1, s.vitals - (easyMode ? DECOY_VITALS * 0.5 : DECOY_VITALS));
    /* Never below 1: the clinical floor GIVE_FLOOR exists for, applied here for
       the same reason. A wrong read must never be the thing that kills you — it
       costs you what you had to give someone else. */
    banner("NOBODY IN IT — AND IT WAS WAITING FOR YOU\nHIS BOXES BLEED YOU FOR LOOKING", PAL().DANGER);
    addText(d.x, d.y - 46, "-" + Math.round(easyMode ? DECOY_VITALS * 0.5 : DECOY_VITALS) + " VITALS",
      PAL().DANGER);
    staticTick(); staticSurge = Math.max(staticSurge, 0.7);
    camera.shake += 6; haptic.heavy();
  }
}

/* ---- fuel cans (owner feedback, July 2026) --------------------------------
   Flown into rather than landed on — see the note on FUEL_CAN_GIVE for why a
   fuel stop must not cost a set-down. Tops the tank up to full at most, so a can
   taken on a nearly-full tank is wasted and the player learns to leave it where
   it is until the way back. */
function updateFuelCans() {
  if (!level.fuelCans) return;
  const s = ship;
  if (s.dead) return;
  for (const f of level.fuelCans) {
    if (f.taken) continue;
    if (Math.hypot(s.x - f.x, s.y - f.y) > FUEL_CAN_R) continue;
    const before = s.fuel;
    s.fuel = Math.min(maxFuel(), s.fuel + FUEL_CAN_GIVE);
    f.taken = true;
    addText(f.x, f.y - 34, "+" + Math.round(s.fuel - before) + " FUEL", PAL().WARN);
    blip(420, 700, 0.16, "sine", 0.1);
    haptic.light();
  }
}

/* Where a chamber puts you IN — the well, per the owner's call: MERCY cannot
   descend, so the shaft she pays her bay down is the only way a hull arrives.
   It also sets the shape of the run, which is why it is worth more than a spawn
   point: you enter at the delivery end, fly the floor unladen, and haul back
   toward the light. Falls back to the authored entrance room for a chamber with
   no well yet (P·content will have some). */
function chamberEntryPos() {
  const w = level.wellDock;
  if (w) {
    const y = w.y + 130;                 // clear of the swaying bay itself
    const sp = spanAt(w.x, y);
    if (sp) return { x: w.x, y: clamp(y, sp.top + SHIP_R + 6, sp.bot - SHIP_R - 6) };
  }
  const ch = ACT_TWO_CHAMBERS.find(c => c.id === level.chamberId);
  const entry = ch && ch.parts.find(p => p.op === "room");
  const x = entry ? entry.x + entry.w / 2 : level.W * 0.05;
  const sp = spanAt(x, entry ? entry.y + 40 : 200);
  return { x, y: sp ? Math.min(sp.bot - SHIP_R - 4, sp.top + 60) : 200 };
}

/* ---- the hull against SOLID rock (owner feedback, July 2026) --------------
   Act One's terrain is a heightmap — exactly one floor and one ceiling per
   column — so updatePlay only ever tested the hull VERTICALLY. There was no
   such thing as a wall to hit, and `solidAt` was used for nothing but bullets.
   Spans express pillars, the flanks of a structural column and §8's painted
   rock, and with no lateral test the hull flew straight through all three
   ("shouldn't be able to fly through the steel surface").

   A chamber impact HURTS rather than killing outright, which is the same
   round's other note. Act One's cave-roof rule is untouched — instant death
   unless the field is up — because down here there are overhangs, a pinch the
   design asks you to carry speed through, and a load on a rope: an unforgiving
   ceiling would make the tether unflyable. It is also what made §8's painted
   rock read as a turret that shoots you, since an invisible wall that kills on
   contact has no other available explanation. */
const HULL_SAFE_V = 46;        // a brush below this costs nothing
const HULL_DMG_K = 0.28;       // vitals per px/s of normal closing speed over it
/* Capped, and the cap is the whole point of the change. Act One's worst landing
   costs a flat 35 of a 100-vitals pool, so an uncapped linear ramp is off that
   scale immediately: at K=0.5 a 320px/s wall hit billed 137 and killed outright
   from full health, which is the instakill this was written to remove. One
   impact can now never be fatal on its own — it takes a run of bad flying, or a
   hull already hurt, which is the difference between a punishing wall and a
   trap. Deliberately just under a hard landing: you were, after all, flying. */
const HULL_DMG_MAX = 30;

/* The cost of putting the hull into rock. Returns FALSE if it killed you, so
   callers inside updatePlay can bail exactly the way the `shipDie(); return;`
   paths they replace do. */
function hullImpact(vn) {
  const s = ship;
  const safe = easyMode ? HULL_SAFE_V * 1.3 : HULL_SAFE_V;   // §4.4's FIELD MEDIC contract
  if (vn <= safe) { camera.shake += 1.5; return true; }
  const dmg = Math.round(Math.min(HULL_DMG_MAX,
    (vn - safe) * HULL_DMG_K * (easyMode ? 0.5 : 1)));
  camera.shake += Math.min(9, 2 + dmg * 0.3);
  blip(150, 60, 0.22, "sawtooth", 0.16);
  haptic.medium();
  if (dmg < 1) return true;
  s.vitals -= dmg;
  addText(s.x, s.y - 30, "IMPACT -" + dmg, PAL().DANGER);
  if (s.vitals <= 0) { shipDie(); return false; }
  return true;
}

/* The ceiling, in a chamber only — shoved back down off the rock and billed for
   it, where Act One dies. Called from updatePlay's existing roof block so the
   span-picking `roofAt(s.x, s.y)` above it is not duplicated here. */
function hullCeilingImpact(rY) {
  const s = ship;
  const vn = Math.max(0, -s.vy);
  s.y = rY + SHIP_R + 1;
  s.vy = Math.abs(s.vy) * 0.35 + 12;
  return hullImpact(vn);
}

/* Walls, pillar flanks and painted rock. Called from updatePlay AFTER the
   vertical resolution, so it corrects a hull that has already settled onto a
   floor instead of fighting the code that put it there.

   `a2FreeX/Y` is the recovery for a hull that is already buried. Resolving a
   burial by pushing to the nearest span's edge takes its direction from
   geometry that has already been violated, and on the flank of a tall column
   that can eject you out the FAR side — through the very wall you just failed
   to fly through. Backing up to the last position that was genuinely open air
   cannot do that, because you were demonstrably there. */
function shipSolidCollide() {
  const s = ship;
  if (!level.spans || s.dead) return true;
  if (!solidAt(s.x, s.y)) {
    /* Lateral faces, sampled at hull-centre height. Skipped while landed: on
       rough ground the deck itself is solid at centre height on the downhill
       side, and nudging a settled hull every frame reads as jitter. */
    if (!s.landed) {
      for (const side of [-1, 1]) {
        if (!solidAt(s.x + side * SHIP_R, s.y)) continue;
        const vn = Math.max(0, s.vx * side);
        s.x -= side * 4;
        s.vx = side > 0 ? Math.min(0, s.vx) * 0.3 : Math.max(0, s.vx) * 0.3;
        if (!hullImpact(vn)) return false;
      }
    }
    s.a2FreeX = s.x; s.a2FreeY = s.y;
    return true;
  }
  const vn = Math.hypot(s.vx, s.vy);
  if (s.a2FreeX != null && !solidAt(s.a2FreeX, s.a2FreeY)) { s.x = s.a2FreeX; s.y = s.a2FreeY; }
  else {
    const col = level.spans[clamp(Math.round(s.x / STEP), 0, level.spans.length - 1)] || [];
    const sp = pickSpan(col, s.y);
    if (sp) s.y = clamp(s.y, sp.top + SHIP_R + 1, sp.bot - SHIP_R - 1);
  }
  s.vx *= 0.2; s.vy *= 0.2;
  s.landed = false;
  return hullImpact(vn);
}

/* ---- the dispatch -------------------------------------------------------
   One call from updatePlay, after the ship's own integration and collision have
   resolved (the tether corrects against a settled hull) and after
   updateStaticClock, so a beat lands in the same frame it fires. */
function updateActTwo(dt) {
  if (!actTwoActive()) return;
  const now = performance.now() / 1000;
  // set by updateStaticClock this same frame (js/update.js) — an exact signal,
  // not inferred from the clock's value; see the note on `staticBeat` there
  const beat = staticBeat;

  updateReserves(dt, beat);
  updateFuelCans();
  updateDecoys();
  updateTrunkCut(dt);
  /* The winch beat is scripted: while a load is being seated in the bay the
     payload's position comes from wellRackPos (it eases up past the ship's side
     and into the slot), so the tether must not simulate it and must not be
     releasable half-way in. Verbatim the rule PENDULUM_SPEC §4.2 sets for riding
     a lift while towing — skip physics, damage-free, re-tension on settle. */
  const winching = !!(level.wellDock && level.wellDock.docking);
  if (!winching) {
    updateCradle(dt);
    updateTowRelease();
    updateTow(dt);
    updateLooseRacks(dt);
  }
  /* §4.1 — the 41-second surge applies a lateral impulse to the PAYLOAD while
     towing: the same "the clock has mechanical teeth while tethered" rule the
     Act One transfusion line established, moved onto the thing you are trying
     to protect. */
  if (beat && level.towedRack && !ship.landed && !winching) {
    level.towedRack.vx += (Math.random() < 0.5 ? -1 : 1) * SLING_SURGE_KICK;
    camera.shake += 5;
  }
  updateGive(dt);
  updateWellDock(dt, now);
}
/* ================ end js/acttwo-update.js ================ */
