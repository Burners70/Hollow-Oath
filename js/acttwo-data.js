"use strict";
/* ================================================================
   Bundle P — Act Two (the descent). Token/state data layer.
   docs/ACT_TWO_SPEC.md §4/§5/§6/§7.5/§8, docs/DESIGN_BRIEF_ACT_TWO.md.

   New file, approved exception to "keep new code inside the existing files"
   (see CLAUDE.md, "Bundle P / Act Two gets new files"). Loads after
   js/world.js (so PAL()/TOK/shade()/reducedFlash/clamp/lerp already exist)
   and before js/update.js/js/render.js — same load-order rule as everything
   else in this project (see index.html and CLAUDE.md's file map).

   This file is pure data/tokens, same split as PAL()/TOK in js/world.js:
   rack state, its beat envelope, colour, and the plant chamber's zone accent
   palette. Drawing lives in js/acttwo-render.js; game logic (chamber
   authoring, tow/dock state, tether physics) is P·terrain/P·slice/P·systems
   work and isn't guessed at here — see docs/APP_STORE_ROADMAP.md Bundle P.

   Two clocks, never conflated: a rack's OWN resting pulse
   (RACK_PULSE_PERIOD, 1.10s, constant across every state — only its shape
   degrades) and the Static's network-wide beat, which is NOT a separate demo
   clock but the game's real STATIC_PERIOD/staticClock (js/update.js) —
   every rack takes a simultaneous bite from the shared reserve on the same
   41s beat the whole game already runs on (see js/acttwo-render.js for the
   network-dip/ripple math that consumes staticClock). */

const RACK_PULSE_PERIOD = 1.10;   // seconds/cycle — resting pulse, all 4 states

/* ---- how big a rack is (owner review, July 2026) -------------------------
   The first pass drew it far too large: a nominal 130x170 becomes a 94x112 cage
   (drawRack insets to 72%/66%), and a rack is TOWED beneath the hull, so the
   clearance it needs is ship + tether + cage height = 22 + ~24 + 112 = 158px.
   The slice chamber's tightest passage is 98px. It could not physically be
   lifted through the level it was standing in, which is what the owner spotted
   by eye ("hard to see how you'd have the space").

   Two corrections, not one. Smaller, and WIDER THAN TALL: a rack is a bank of
   eight to twelve people read side by side (§6.1), so a portrait box was the
   wrong silhouette for the thing it is. Height is also the axis that costs
   towing clearance, and width the axis that buys readability, so landscape is
   cheaper on both counts.

   Sized against the SHIP rather than the room, in the end, and by eye rather than
   by arithmetic. A sixth of the hall (~98px) was the first ceiling and 66px
   cleared it, but it still read "out of kilter with the ship" — the room is 586px
   tall and the ship only 22px across, so the room is the forgiving reference and
   the wrong one. At a 70x48 cage the rack is 3.2x the ship's width: a load one
   ship should visibly struggle with, not a container towed by a dart. ~70% off
   the first pass's cage area, chosen from four candidates rendered side by side.

   Explicitly NOT sized to fit its occupants (owner steer, July 2026): scale in
   this game was never literal — a Scion is about as tall as the dart — so what
   matters is visual fit against the ship and the physics of towing it.

   Authored here rather than as a magic default in drawRacks, so a chamber that
   wants an unusual rack overrides data instead of passing render arguments. */
const RACK_SIZE = { w: 97, h: 73 };            // nominal → a 70 x 48 cage
const RACK_CAGE_W = 0.72, RACK_CAGE_H = 0.66;  // drawRack's insets, named
// §6.1 — a rack holds eight to twelve. The occupant count is data, so the cells
// stay legible at any size instead of always being ten of them.
/* Cell count is a VISUAL DENSITY choice, not a headcount. Owner steer, July 2026:
   this game has never been to literal scale — a Scion stands about as tall as the
   dart — so sizing a rack to fit eight bodies would be solving a problem the game
   does not have. Eight cells simply read as separate cells at this cage width;
   §6.1's "eight to twelve" is narrative, and a chamber can set any count. */
const RACK_OCCUPANTS_DEFAULT = 8;

/* ---- the tow envelope, and the MOMENTUM PINCH ----------------------------
   docs/PENDULUM_SPEC.md §4.1 is the tether reference and survives into Act Two
   unchanged: the payload is one point mass on a rigid sling attached at the
   ship's centre, `SLING_L = 46` px centre-to-centre. The physics — verlet point
   plus distance constraint, the 30/70 correction split that makes towing tug the
   ship, the damage model above SLING_SAFE_V — is P·systems and is NOT built
   here. What is needed *now* is the geometry, because it decides what a chamber
   can be authored to ask of you.

   The envelope depends on how far the load has swung. Hanging straight down the
   stack is tall; trailing at your own level it is short but long:

     swing 0°   vertical = SHIP_R + SLING_L + cage/2   = 11 + 46 + 24 = 81px
     swing 90°  vertical = max(2·SHIP_R, cage)         =           48px

   Which gives three tiers of gap, and the middle one is the owner's idea
   (July 2026): **a pinch too tight to creep through with the load hanging, but
   passable if you carry enough momentum to trail the rack near your own level.**

     gap ≥ 81      pass at rest, load hanging — an ordinary tight spot
     48 ≤ gap < 81 MOMENTUM PINCH — you must motor through, load swung up
     gap < 48      the rack cannot pass at all; unladen route only

   It is a good mechanic because it costs nothing to build (it falls out of the
   sling that already had to exist), and because going fast with a rack is the
   dangerous thing — every turn is felt by everyone in the box — so it prices
   speed against care instead of gating on an upgrade.

   The band is 33px wide at these numbers (it was only 24 before the rack came
   down, so shrinking the rack widened the authoring target as a side effect —
   the cage height is subtracted from both ends of the band but hurts the top
   twice as hard). Wide enough to author against; if a momentum pinch turns out to
   want more room still, `SLING_L` is the dial — a 70px sling gives 57px of band.
   Not retuned here: tether length is a feel value and belongs on hardware. */
/* PENDULUM_SPEC §4.1 says `SLING_L = 46`, and that number was set for a payload
   of **radius 8** — the Hollows' relics. It gave ~28px of visible cable. Against a
   rack whose cage is 48px tall the same 46 leaves 12px, and at the first pass's
   112px cage it left *nothing*: the sling was geometrically inside the rack.

   So the sling is derived to preserve the thing the constant was really choosing —
   a readable length of cable — rather than the literal 46 that only expressed it
   for one payload size. The pendulum needs to be SEEN: PENDULUM_SPEC's whole feel
   note is "thrust away and the load lags, then swings through under you", which a
   12px cable cannot show. Owner steer, July 2026: judge this on visual fit and
   physics, not on occupancy fidelity.

   A longer sling also means a slower, wider swing, which is the right direction
   for a load you are supposed to respect. Exact feel is P·slice's, on hardware. */
const SLING_SHIP_ANCHOR = 10;           // cable leaves the hull this far below centre
const SLING_VISIBLE = 36;               // px of cable actually on screen at rest
const SLING_L = SLING_SHIP_ANCHOR + RACK_SIZE.h * RACK_CAGE_H / 2 + SLING_VISIBLE;
const TOW_SWING_LEVEL = 90;             // degrees from vertical = load at your level

// vertical and horizontal extent of ship-plus-slung-rack at a given swing angle
function towEnvelope(swingDeg, tether) {
  const L = tether != null ? tether : SLING_L;
  const th = (swingDeg || 0) * Math.PI / 180;
  const cage = { w: RACK_SIZE.w * RACK_CAGE_W, h: RACK_SIZE.h * RACK_CAGE_H };
  const payloadCY = L * Math.cos(th), payloadCX = L * Math.sin(th);
  const top = Math.min(-SHIP_R, payloadCY - cage.h / 2);
  const bot = Math.max(SHIP_R, payloadCY + cage.h / 2);
  return { vertical: bot - top, horizontal: Math.abs(payloadCX) + cage.w / 2 + SHIP_R,
    cage };
}

// which tier of gap is this? "rest" | "momentum" | "unladen"
function towTierForGap(gap, tether) {
  if (gap >= towEnvelope(0, tether).vertical) return "rest";
  if (gap >= towEnvelope(TOW_SWING_LEVEL, tether).vertical) return "momentum";
  return "unladen";
}

/* The gap a momentum pinch should be authored to: the middle of the band, so it
   is unambiguously both "too tight to creep through" and "passable swung up".

   DERIVED, not a literal, because the rack's height is in the envelope: the cage
   went 112 → 66 → 48 across three owner rounds, and a hardcoded pinch drifts
   toward one edge of the band or straight out of it each time. Measured: at a
   40px cage the at-rest depth falls to 77, so a hardcoded 78px pinch stops being
   a momentum pinch at all — it becomes an ordinary gap and the mechanic quietly
   evaporates with nothing failing. Deriving it made the pinch follow the rack from
   78px to 65px on the last resize, with no edit and the test still green. */
function momentumGapPx(tether) {
  const rest = towEnvelope(0, tether).vertical;
  const swung = towEnvelope(TOW_SWING_LEVEL, tether).vertical;
  return Math.round((rest + swung) / 2);
}

/* And the gap an ORDINARY tight spot should be authored to: comfortably past the
   at-rest depth, with enough margin to survive the surrounding floor roughness
   (±22px in the hall) without slipping into the momentum band. Derived for the
   same reason — lengthening the sling to 70 pushed the at-rest depth from 81 to
   105, which silently turned the chamber's ordinary 98px pinch INTO a momentum
   pinch and collapsed the distinction the two are there to teach. */
function restGapPx(tether) {
  return Math.round(towEnvelope(0, tether).vertical + 30);
}

/* ---- P·slice: the tether's feel dials ------------------------------------
   docs/PENDULUM_SPEC.md §4.1 is the model and it carries over unchanged: the
   payload is ONE point mass on a rope of length SLING_L anchored under the
   ship's centre, integrated like the ship and pulled back onto length by a
   distance constraint run twice a frame. What makes it feel like a pendulum
   rather than a rigid stick is that the correction is SPLIT — the payload takes
   most of it, the ship takes the rest, so towing genuinely tugs you.

   A ROPE, not a rod: the constraint only resists stretch, never compression.
   That is what makes §4.2's "the payload settles onto terrain first, the sling
   goes slack" and "taking off re-tensions" fall out for free instead of needing
   a special case, and it is why a rack resting on the floor doesn't lever the
   ship down onto it.

   Every number here is a FEEL value and belongs on hardware, not in a browser
   (Bundle P: the slice "genuinely needs a device"). SLING_VISIBLE is the one
   worth reaching for first, because SLING_L is derived from it and the momentum
   band plus both authored pinch gaps follow SLING_L automatically — see
   momentumGapPx/restGapPx above. Moving it is a one-number change, never a
   re-author of the chamber. */
const SLING_SHIP_W = 0.3;      // §4.1 — correction split: 30% ship, 70% payload
const SLING_DAMP = 0.999;      // §4.1 — per-frame velocity damping on the payload
const SLING_ITER = 2;          // §4.1 — constraint iterations per frame
/* Contact BELOW this costs nothing (§4.3: "gentle set-downs and brushes cost
   nothing… never a hair-trigger"). Measured on the NORMAL component of the
   payload's velocity, not its speed: a rack sliding along a floor at cruise is
   a graze and a rack driven into that same floor at cruise is a slam, and only
   the normal component tells those apart. Speed alone would bill you for every
   fast pass through the momentum pinch, which is the one place the design
   actively wants you to carry speed. */
const SLING_SAFE_V = 40;
const SLING_DMG_K = 0.25;      // §4.3 — cost per px/s of normal speed over SAFE
const SLING_SURGE_KICK = 70;   // §4.1 — the 41s surge shoves the PAYLOAD, not you

/* ---- P·slice: the reserve, and what your blood buys -----------------------
   §7.3's drain model: continuous so it is legible (you can judge how long
   you've got), PLUS a bite on the Static's beat, because every rack in the
   network is on the same tap. The bite is what turns the 41 seconds from a
   shove into "can I reach the well before the next beat, or do I give now?".

   §7.5's states are already in RACK_STATES; these are the thresholds that pick
   between them. Note what does NOT happen here: the drain never speeds up. A
   failing rack reads WEAKER, never faster (§7.3) — the same trace going flat —
   so degradation lives entirely in the beat's SHAPE (RACK_STATES.beats) and
   RACK_PULSE_PERIOD is constant across all four states. */
const RACK_RESERVE_MAX = 100;
const RACK_DRAIN = 1.2;        // reserve/second once the trunk is cut
const RACK_BEAT_BITE = 7;      // the network's simultaneous bite, per 41s beat
const RACK_FAILING_AT = 34;    // below this the beat drops to a single flicker

/* The transfusion, inverted (§7.4). Same machinery as Act One's resupply line
   (updateTransfusion, js/update.js) and the exact opposite direction: MERCY is
   not here, so you are the supply. The floor is the clinical rule — you cannot
   treat if you are the casualty — and it is what makes an unwinnable state
   impossible without softening anything. */
const GIVE_RATE = 9;           // reserve units/second down the line
const GIVE_COST = 1.0;         // YOUR vitals per reserve unit (FIELD MEDIC halves it)
const GIVE_FLOOR = 15;         // vitals at which the line auto-detaches
const GIVE_PER_LINE = 40;      // reserve one line-out can deliver, before falloff
const GIVE_FALLOFF = 0.9;      // §7.4 — the shipped 0.9^n shape, per rack
const GIVE_WINDOW_R = 78;      // how close you must hover to stay connected
const GIVE_SNAP_R = 126;       // drift past this and the line parts
const GIVE_HOVER_V = 95;       // and you must be moving slower than this

/* ---- the plant EMPLACEMENT (owner feedback, July 2026) ---------------------
   "That laser turret is cool, but brutal… It should look like a slightly bigger,
   more blocky version of the gun emplacements in act one. And while it should be
   tougher than those guns, it shouldn't be an instakill."

   Worth recording that the thing being described did not exist: what the owner
   saw was the junctionTruss ornament, and what killed them was §8's painted rock
   200px to its right. The turret is therefore NEW, built to that brief — which
   is the right brief anyway, because Act Two needs something that makes a room
   hostile without competing with the racks for attention.

   Tougher means HP, not a bigger gun. Act One's turrets die to one round
   (`t.alive = false` at the shot loop), and that stays exactly true: `hp`
   defaults to 1 everywhere, so nothing about Act One changes. A plant
   emplacement takes EMPLACE_HP rounds, flashing on each hit, so the fight is a
   commitment rather than a reflex — which also prices §10a.2's oath question
   properly, since every round spent here is a round you chose to fire while a
   bank was dying.

   PLACEMENT IS DEFERRED (owner: "placement needs to be decided when we have
   level design"). The one below is provisional, sited only so the thing can be
   seen and driven on a phone, and it is a single line to move. */
const EMPLACE_HP = 3;          // rounds to kill a plant emplacement
const EMPLACE_R = 20;          // hit radius — bigger body, easier to hit
const EMPLACE_RANGE = 430;     // slightly shorter reach than Act One's 500
const EMPLACE_CD = [1.9, 1.1]; // [base, jitter] — slower cadence than Act One's

/* ---- the moorings (owner feedback, July 2026) -----------------------------
   "Connected with the rack and it suddenly lifted in the air. (And somersaulted
   over me in one case). Should stay where it is and require my thrust to lift
   them. Maybe even a slight extra thrust needed to break the moorings."

   The somersault was real and it was pure pendulum: you cradle from beside the
   box, so the rope starts near HORIZONTAL, and a point mass released from
   horizontal on a slack rope swings down, through underneath you, and up the far
   side. Nothing was wrong with the tether — the rack simply had nothing holding
   it down, so the first frame of physics was a release from the worst possible
   starting angle.

   A rack is BOLTED IN. It is life support for eight to twelve people (§6.1), so
   of course it is fixed to the structure rather than parked on a floor. While
   moored it does not move at all — which is the somersault gone, not damped —
   and the rope coming taut pulls on the SHIP instead. Hold that pull and the
   mounts part.

   Free, per the owner's call: breaking the moorings costs no reserve and no
   integrity. What it costs is a moment of thrust against something that will not
   move, which is the whole sensation asked for ("you feel some tension"). */
const MOOR_BREAK_T = 0.55;     // seconds of taut pull before the mounts let go
/* Barely more than zero, and that is not a fudge. The mounts cannot be timed
   against how far the rope STRETCHES, because the constraint pulls the hull back
   onto the circle every frame — the stretch is gone as fast as it appears, so a
   threshold of even a few px never accumulates and the mounts hold forever. Held
   at the rope's limit the hull hovers in equilibrium and moves a fraction of a
   pixel per frame, so even 0.5 was above the noise floor. What TAUT means here is
   "the line is doing work" — which is the correct reading of pulling anyway: let
   go and the rope goes slack, and the timer falls back. */
const MOOR_TAUT = 3;           // px short of full extension that still counts as taut

/* ---- fuel, down here (owner feedback, July 2026) -------------------------
   "Obviously we need fuel cans for this to be achievable in one run", and the
   arithmetic backs it: thrust burns 5.2/s against a 100 tank, so a full tank is
   about nineteen seconds of engine. The slice chamber is a 9000px floor entered
   at the well, which means flying its length unladen and then hauling a rack
   back along it — comfortably more than one tank, and the shipped answer
   (MERCY's bays) is nine thousand pixels of rock away.

   Two sources, per the owner's call, and they answer different problems. CANS
   are placed: they make the route itself the fuel plan, and a chamber can be
   authored so the last one sits before the haul rather than after it. The
   RESUPPLY DRONE stays the safety net for a hull that is already dry, and it
   now launches from THE WELL instead of from MERCY (see updateResupplySignal)
   — it used to fly in from mx/my, which a chamber leaves at -9999, so help
   took the better part of a minute to cross ten thousand pixels of nothing.

   A can is flown INTO, not landed on. Landing is spoken for down here — it is
   how you close a feed and how you rig a sling — and a fuel stop that needed a
   set-down would price a top-up at the same rate as a rescue decision. */
const FUEL_CAN_GIVE = 34;      // per can — deliberately the XFUSE_FLOOR figure
const FUEL_CAN_R = 30;         // fly this close and it's yours

/* Hold durations. All three reuse the shipped hold-to-act grammar (updateShrine
   /updateBlackbox: accumulate scanT × scanRate(), draw a progress ring) so
   Virchow's CELL DOCTRINE applies to all of them — diagnosis is diagnosis. */
const TRUNK_CUT_T = 1.6;       // landed at an isolator, closing the feed
const CRADLE_T = 2.5;          // §4.2 — rigging the sling the first time
const RECRADLE_T = 0.8;        // re-hooking a rack already on reserve
const WELL_WINCH_T = 1.5;      // §4.2's winch beat, reused at THE WELL
const WELL_DOCK_R = 72;        // hover window around the bay's own swinging slot
const WELL_DOCK_V = 70;        // and how still you must hold it

/* base = resting brightness (0-1), amp = how much the beat lifts it, beats =
   how many lobes in the envelope (2 = a double-beat "lub-dub", 1 = a single
   thin flicker, 0 = no beat at all — degrading SHAPE, not rate, is the point:
   RACK_PULSE_PERIOD never changes). token names a PAL() key, or "ramp" for
   failing's WARN->DANGER colour ramp (see rackColor below). */
const RACK_STATES = {
  mains:   { base: .55, amp: .45, beats: 2, token: "SAFE" },
  reserve: { base: .34, amp: .34, beats: 2, token: "SAFE" },
  failing: { base: .18, amp: .28, beats: 1, token: "ramp" },
  gone:    { base: .5,  amp: 0,   beats: 0, token: "DANGER" }
};
/* §7.5's table as a function of a rack's actual reserve — DERIVED, never stored,
   so the box's look cannot drift out of step with the number driving it. It lives
   here in the data layer because that is where the state table itself lives; the
   simulation (js/acttwo-update.js) and the renderer (js/acttwo-render.js) both
   call it rather than each keeping their own copy of the thresholds.

   RACK_PULSE_PERIOD is constant across all four states: what degrades as a rack
   fails is the beat's SHAPE, never its rate (§7.3 — "not faster as it fails, but
   weaker… the same trace, going flat"). */
function rackStateFor(r) {
  if (r.lost) return "gone";
  if (!r.cut) return "mains";
  return r.reserve <= RACK_FAILING_AT ? "failing" : "reserve";
}

/* the beat envelope shapes: a tight gaussian lobe normally, a raised-cosine
   (smooth oscillation, no sharp edge) under REDUCED FLASH — trading sharp
   pulses for smooth ones is the accessibility rule (never a slower motion). */
function rackGauss(x, mu, s) { return Math.exp(-((x - mu) ** 2) / (2 * s * s)); }
function rackRaisedCos(x, mu, w) {
  const d = Math.abs(x - mu);
  return d > w ? 0 : 0.5 * (1 + Math.cos(Math.PI * d / w));
}
function rackEnvelope(phase, beats) {
  if (beats <= 0) return 0;
  if (reducedFlash) {
    let v = rackRaisedCos(phase, 0.18, 0.22);
    if (beats >= 2) v += rackRaisedCos(phase, 0.62, 0.20) * 0.65;
    return v;
  }
  let v = rackGauss(phase, 0.15, 0.055);
  if (beats >= 2) v += rackGauss(phase, 0.5, 0.05) * 0.7;
  return v;
}
/* brightness (0-1) for a rack state at world time `now` (seconds); `cutT01`
   (0-1, or null) is "cutting the feed" transition progress (mains->reserve,
   ~1s, cubic in-out — see rackCutEase) laid over the resting state. */
function rackCutEase(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
function rackBrightness(stateKey, now, cutT01) {
  let def = RACK_STATES[stateKey];
  if (cutT01 != null) {
    const e = rackCutEase(clamp(cutT01, 0, 1));
    const from = RACK_STATES.mains, to = RACK_STATES.reserve;
    def = { base: lerp(from.base, to.base, e), amp: lerp(from.amp, to.amp, e), beats: to.beats };
  }
  const phase = (now % RACK_PULSE_PERIOD) / RACK_PULSE_PERIOD;
  return clamp(def.base + rackEnvelope(phase, def.beats) * def.amp, 0, 1);
}
/* colour for a rack state — routes through PAL()/shade() like everything else
   (DS1/DS4): failing RAMPS from WARN toward DANGER over time rather than
   holding one hue, "gone" is a steady DANGER glow, never an alarm strobe. */
function rackColor(stateKey, now) {
  const def = RACK_STATES[stateKey];
  if (def.token === "ramp") {
    const ramp = Math.sin(now / 4) * 0.5 + 0.5;
    return lerpHex(PAL().WARN, PAL().DANGER, 0.3 + ramp * 0.5);
  }
  return PAL()[def.token];
}
const _lerpHexMemo = {};
function lerpHex(h1, h2, t) {
  const k = h1 + "|" + h2 + "|" + t.toFixed(2);
  let v = _lerpHexMemo[k];
  if (v !== undefined) return v;
  const a = [1, 3, 5].map(i => parseInt(h1.slice(i, i + 2), 16));
  const b = [1, 3, 5].map(i => parseInt(h2.slice(i, i + 2), 16));
  v = _lerpHexMemo[k] = "#" + a.map((c, i) => Math.round(lerp(c, b[i], t)).toString(16).padStart(2, "0")).join("");
  return v;
}
/* §5 — the plant chamber's three zone accents (surgical cyan / radiation-bay
   violet / old-works gold), reused from the existing flavour set rather than
   invented hues — the same way Act One's eight sectors each get their own
   RECIPE[].pal, but here the fill is flat steel (two close neutral stops, no
   organic gradient) and only the accent carries the zone's colour. `top`/
   `bottom` are the flat fill; `stroke`/`glow` reuse TOK's own accent tokens so
   a zone never invents a colour outside the existing chrome/flavour set.
   PROVISIONAL against P·terrain (see js/acttwo-render.js's
   plantChamberPal/drawMachinedPanelTicks): this palette is terrain-
   representation-agnostic and should carry over unchanged once span terrain
   replaces the heightmap tiles it's currently rendered through. */
const PLANT_ZONES = {
  cyan:   { name: "Surgical",     top: "#c3ccd9", bottom: "#727d90", stroke: TOK.CYAN,   glow: TOK.CYAN_SOFT },
  violet: { name: "Radiation bay", top: "#c7c2d6", bottom: "#6d6786", stroke: TOK.VIOLET, glow: TOK.VIOLET_SOFT },
  gold:   { name: "Old works",    top: "#d6cdb8", bottom: "#867a5e", stroke: TOK.GOLD,   glow: TOK.GOLD_WARM }
};
function plantPal(zoneKey) { return PLANT_ZONES[zoneKey] || PLANT_ZONES.cyan; }

/* The rock a chamber is cut into — flavour, not state, so it lives here beside
   PLANT_ZONES rather than in TOK (same precedent: these are scene tones, and the
   semantic SAFE/WARN/DANGER ramp that has to swap under colourblind mode stays in
   PAL()). Three clearly separated values are what make the owner's "rock overhead,
   mechanical underfoot" rule legible at a glance:

     void  #05060f (TOK.VOID)      — open, flyable space
     rock  below                    — the mass, a cold violet-grey stone
     steel PLANT_ZONES[].top/bottom — the paved band behind a milled face

   Deliberately NOT as dark as the Hollows' CAVE_PAL: the Hollows are an unlit
   cave read by lamplight, whereas a chamber is lit (spec §9.2), so near-black
   stone in a lit room reads as a hole rather than as rock. It keeps the violet
   cast, though, which ties Act Two's stone to Act One's. */
const ROCK_PAL = { top: "#3b3454", bottom: "#241f38" };

/* The BODY tone of manufactured furniture — dark, but never black. Owner,
   August 2026: "I'd avoid using black for object fills as it reads as
   absence/accident too." They are right and it was compounding a second bug: a
   near-black rectangle drawn over lit rock reads as a hole in the world, so a
   half-sunk crate did not look sunk, it looked like a rendering fault. A dark
   STEEL still gives the silhouette that makes an object an object, and says
   "thing" rather than "nothing". Two tones, so hers and his are separable in
   silhouette as well as by accent.

   ---- and it was still not enough (owner, August 2026, third pass on this) ----
   "Ornaments are looking better, but fill still looks like a gap." Correct, and
   the numbers say why: the old tones sat at luma ~45, INSIDE the rock
   gradient's own range (~35 at the bottom of a tile, ~58 at the top). So a body
   drawn against rock was the same value as the rock at some height in every
   single tile, and a body drawn against lit rock was darker than it — which is
   a hole, whatever hue it is. The sinking that is supposed to read as
   "installed" can only read that way if the buried part still reads as an
   object.

   These are lifted clear of the rock's whole range instead of merely off black,
   and each is a PAIR: `lit` is the top of the body and `base` its own shade, so
   ornBody can rule a vertical gradient down it. A flat fill of any single value
   reads as a cutout at silhouette scale; the gradient is what says solid. They
   stay desaturated steel, so hue still belongs to the accent (and therefore to
   PAL()) and CONTRAST still carries the depth ORN_BACK is managing. */
const ORN_BODY = {
  hers: { lit: "#495468", base: "#2d3546" },   // cold steel, her ship's
  his:  { lit: "#4d4670", base: "#312c4a" }    // violet steel, his kit
};
/* The values were picked by sampling the rendered canvas rather than by eye,
   because both failure modes here look plausible in source. Measured over all
   21 floor-standing pieces in chamber one — body pixel against the rock behind
   it — the shipped set came out at a mean ratio of **0.75**: the furniture was
   on average DARKER than the room it stood in, which is the whole complaint in
   one number and is not a thing an object can be. Lifting it clear of the rock
   and then lighting it with the room (see ornBody, js/acttwo-render.js)
   overshot to **1.43**, which reads as foreground and would have re-broken the
   note that put ORN_BACK in. These land it near **1.15**: brighter than the
   rock in every light, never competing with the bank, the cans or the hull. */

/* How far a rigid object may tilt to follow the ground it stands on. Owner,
   same round: "some of these items are too sunken — it looks like accidental,
   not design." The footprint rule that stopped things floating did it by
   sinking them to the DEEPEST ground underneath, which on the ramp down to the
   well buried a stretcher bay most of its height. Neither extreme is right,
   because a rigid box on a slope does neither: it TILTS. So a floor ornament
   takes the slope across its own footprint, rests on the middle of it, and only
   sinks the couple of px that reads as settled. Clamped at ~13°, because past
   that a tilted crate stops reading as furniture and starts reading as debris —
   and at that point the authoring is wrong, not the placement: put the furniture
   somewhere a person would have put it. */
const ORN_TILT_MAX = 0.22;

/* ================================================================
   P·terrain — the chamber authoring grammar, compiled to spans at load.

   Ten chambers each larger than any surface sector cannot be hand-typed as
   columns (docs/ACT_TWO_SPEC.md §11.0), and authoring them as noise would
   defeat the point: the courses have to teach the swing, which is why the owner
   decision was authored geometry. So a chamber is a short list of coarse PARTS,
   applied in order, each either opening flyable space or putting rock back:

     { op: "room", x, y, w, h }   open a rectangle of air
     { op: "rock", x, y, w, h }   put solid rock back

   Rock inside a room is what makes a column hold two spans, which is to say:
   rock is how you author an overhang. Order matters, which is why parts are a
   list and not a set — a rock only bites the rooms declared before it.

   Both ops take optional `roughTop`/`roughBot` amplitudes in px, which wobble
   that boundary with the same cosine-interpolated value noise genLevel/genCave
   use, so a chamber reads as rock rather than as a floor plan. Coordinates are
   world px and need not align to STEP; the compiler samples per column.

   Deterministic: the only randomness is a mulberry32 seeded from the chamber's
   own `seed`, so a chamber compiles byte-identically every load and can be
   checksummed in a test exactly as Act One's heightmap is under M1. */

/* Every boundary carries a MATERIAL — "rock" or "mach" (owner steer, July 2026:
   for the first eight or so chambers the ceiling is raw rock and only the floor
   is mechanical, so the plant reads as a facility *installed in a cave* rather
   than a tiled box). It is per-boundary rather than per-chamber because that is
   the whole point: one span's ceiling can be rock while its floor is paved. The
   material rides through union and subtraction so a face newly exposed by
   carving rock into a room comes out as rock, which is what actually happens. */
const MAT_ROCK = "rock", MAT_MACH = "mach";

function spanUnion(list, top, bot, mt, mb) {
  if (bot - top <= 0) return list;
  const out = [];
  let t = top, b = bot, tm = mt || MAT_ROCK, bm = mb || MAT_ROCK;
  for (const sp of list) {
    if (sp.bot < t || sp.top > b) { out.push(sp); continue; }   // disjoint — keep
    if (sp.top < t) { t = sp.top; tm = sp.mt; }                 // absorb, and the
    if (sp.bot > b) { b = sp.bot; bm = sp.mb; }                 // surviving face wins
  }
  out.push({ top: t, bot: b, mt: tm, mb: bm });
  out.sort((p, q) => p.top - q.top);
  return out;
}

/* Carving rock out of a room exposes TWO faces and they need not match — a shelf
   can be a milled pad on top and raw stone underneath, which is the single most
   useful thing the material split buys. `matUp` dresses the rock's upper surface
   (it becomes the FLOOR of the air left above the cut); `matDown` dresses its
   underside (the CEILING of the air left below). */
function spanSubtract(list, top, bot, matUp, matDown) {
  const mu = matUp || MAT_ROCK, md = matDown || matUp || MAT_ROCK;
  const out = [];
  for (const sp of list) {
    if (bot <= sp.top || top >= sp.bot) { out.push(sp); continue; }             // misses it
    if (top > sp.top) out.push({ top: sp.top, bot: top, mt: sp.mt, mb: mu });   // air above
    if (bot < sp.bot) out.push({ top: bot, bot: sp.bot, mt: md, mb: sp.mb });   // air below
  }
  return out;
}

/* A boundary is not obliged to be a straight line. Beyond the value-noise
   roughness, a part may give either boundary a PROFILE, which is what stops a
   chamber being nothing but right angles (owner note, July 2026 — slopes,
   spikes and immaculate rounded edges). `u` is 0..1 across the part:

     ramp  — descends (or climbs) linearly by dy. Sloped floors to land on.
     arc   — a half-sine bulge of dy. A machined bore, or a domed cavern.
     teeth — n triangular spikes of depth dy. Stalactites in rock; a cut
             comb in steel. Deliberately shallow by default: a spike that
             seals a passage is a bug, not a hazard.

   Rounded corners are separate: a part's `radius` eases both boundaries in at
   each end by r − √(r²−d²), so a machined room ends in a fillet rather than a
   square corner. Profiles compose with roughness — a rough ramp is a rough ramp. */
function boundaryProfile(prof, u) {
  if (!prof) return 0;
  const dy = prof.dy || 0;
  switch (prof.kind) {
    case "ramp":  return dy * u;
    case "arc":   return dy * Math.sin(Math.PI * clamp(u, 0, 1));
    case "teeth": {
      const n = prof.n || 6, t = (clamp(u, 0, 1) * n) % 1;
      return dy * (1 - Math.abs(2 * t - 1));
    }
    default: return 0;
  }
}

/* A quarter-circle fillet: the boundary is pulled IN hardest at the corner and
   eases to nothing `radius` px inside it.

   The original was inverted, and the inversion was not cosmetic. `r − √(r²−d²)`
   with d measured from the END is 0 at the corner and grows to r just before the
   interior — so a filleted room was full height at its very edge, pinched
   `radius` px in, and then jumped back out by the whole radius at exactly d = r.
   A `bore`'s 110px radius therefore put a 110px STEP in the roof 110px inside
   each end, which is the bump measured at x 7000 while chasing why a gantry
   would not sit flat, and one more thing reading as a wall that should not.
   Measuring the circle from the corner inward — √ of (r − d) — is both the
   shape intended and continuous with the interior. */
function cornerInset(radius, x, x0, w) {
  if (!radius) return 0;
  /* Clamped at zero, not skipped when negative. compileChamber samples from
     floor(x/STEP), so the first column of a part sits slightly OUTSIDE it and
     d comes out negative — which used to return 0 inset and hand that column
     the part's full un-filleted height, putting back the one-column step the
     fillet exists to remove. */
  const d = Math.max(0, Math.min(x - x0, x0 + w - x));
  if (d >= radius) return 0;
  return radius - Math.sqrt(Math.max(0, radius * radius - (radius - d) * (radius - d)));
}

// the same cosine-interpolated value noise as genLevel's `octave` / genCave's,
// normalised to ±1 so a part scales it by its own roughTop/roughBot amplitude
function chamberNoise(rng, wl, W) {
  const pts = [];
  for (let i = 0; i <= Math.ceil(W / wl) + 1; i++) pts.push(rng() * 2 - 1);
  return x => {
    const p = x / wl, i = Math.floor(p), t = p - i;
    return lerp(pts[i], pts[i + 1], (1 - Math.cos(t * Math.PI)) / 2);
  };
}

/* compile a chamber definition to level.spans — one array of open intervals per
   column, top to bottom. Slivers thinner than `minGap` are dropped: they would
   read as rendering noise and let collision flicker between two spans. */
/* ---- the two views: what is there, and what you can see ------------------
   §8's hazards are not decoration on top of terrain, they ARE terrain telling
   you something false, so the representation has to be able to hold a lie:

     false floor  — a ledge that is drawn and is not there. You commit to a
                    landing and drop through it.
     painted rock — a real outcrop drawn as empty space. You fly into a wall
                    that looked like air. The scarier of the two.

   So a part declares which VIEW it belongs to. Everything is in both by
   default; a part in only one is a deception, and the mismatch between the two
   views is precisely the hazard rather than a bug:

     view: "drawn" — appears when drawing, absent from collision → false floor
     view: "solid" — collides, never drawn                       → painted rock

   Both views compile from the same definition through the same code, so a
   chamber cannot drift out of agreement by accident. It can only lie on
   purpose, in one declared place, which is the property worth having. The
   TELL is not here: raising grit off real rock and none off a projection
   (§8.1) is exhaust-particle work in P·systems. This is the hook it needs. */
function chamberLies(ch) { return ch.parts.some(p => p.view); }
function partInView(p, view) { return !p.view || p.view === view; }

function compileChamber(ch, view) {
  view = view || "solid";
  const cols = Math.floor(ch.W / STEP) + 2;
  const rng = mulberry32(ch.seed);
  // rock wants a coarser, bigger wobble than milled steel does — genLevel stacks
  // three octaves for the surface; two per boundary is enough underground, where
  // a chamber's shape is authored rather than found
  const nT1 = chamberNoise(rng, 320, ch.W), nT2 = chamberNoise(rng, 90, ch.W);
  const nB1 = chamberNoise(rng, 360, ch.W), nB2 = chamberNoise(rng, 110, ch.W);
  const defTop = ch.matTop || MAT_ROCK, defBot = ch.matBot || MAT_ROCK;
  const spans = [];
  for (let i = 0; i < cols; i++) spans.push([]);
  for (const p of ch.parts) {
    if (!partInView(p, view)) continue;
    const i0 = Math.max(0, Math.floor(p.x / STEP));
    const i1 = Math.min(cols - 1, Math.ceil((p.x + p.w) / STEP));
    const mt = p.mt || defTop, mb = p.mb || defBot;
    for (let i = i0; i <= i1; i++) {
      const x = i * STEP, u = p.w ? (x - p.x) / p.w : 0;
      const inset = cornerInset(p.radius, x, p.x, p.w);
      // a milled face takes only the fine octave, and at a fraction of it: the
      // difference between cut steel and raw rock is mostly how quiet it is
      const rT = p.roughTop ? (mt === MAT_MACH ? nT2(x) * 0.35 : nT1(x) * 0.7 + nT2(x) * 0.3) * p.roughTop : 0;
      const rB = p.roughBot ? (mb === MAT_MACH ? nB2(x) * 0.35 : nB1(x) * 0.7 + nB2(x) * 0.3) * p.roughBot : 0;
      const top = p.y + rT + boundaryProfile(p.profTop, u) + inset;
      const bot = p.y + p.h + rB + boundaryProfile(p.profBot, u) - inset;
      // for a rock part, mt/mb name its OWN two surfaces: mt the upper face you
      // can land on, mb the underside you fly beneath
      spans[i] = p.op === "rock" ? spanSubtract(spans[i], top, bot, mt, mb)
                                 : spanUnion(spans[i], top, bot, mt, mb);
    }
  }
  const minGap = ch.minGap != null ? ch.minGap : 10;
  for (let i = 0; i < cols; i++) spans[i] = spans[i].filter(sp => sp.bot - sp.top >= minGap);
  return spans;
}

// how many open spans sit in the column containing x — 2+ means an overhang
function spanCountAt(x, spans) {
  const s = spans || (level && level.spans);
  if (!s) return 0;
  return (s[clamp(Math.round(x / STEP), 0, s.length - 1)] || []).length;
}

/* ================================================================
   P·floor — THE CHAMBER FEATURE VOCABULARY.

   Owner decision, August 2026, on the on-device note "the floor can't all be
   flat — need lots more variety for interest… get this one right so we can
   cascade those changes across the rest of the levels". Asked what should
   cascade — the shape, or the means of making it — the answer was **the means**:
   a named kit the other nine chambers compose from, rather than a worked example
   they copy coordinates out of.

   So this is the layer between `compileChamber`'s two primitives (open a
   rectangle of air, put rock back) and an authored chamber. The primitives stay
   exactly as they were; nothing here is a new terrain capability. What it adds
   is that a feature is declared by NAME, with its materials and its safety
   margins already right, so authoring a chamber is a list of features rather
   than a list of rectangles whose interactions you have to hold in your head.

   THE SPLIT WORTH KNOWING, because it decides which tool to reach for:

     the HALL carries the floor and the ceiling.  Both surfaces roam (owner,
       August 2026) — the deck steps, dips and climbs, the roof rises and falls
       with it, and the clear band between them varies by a factor of three
       along the floor. That is one continuous profile, authored as STATIONS
       and interpolated between them, not as a pile of overlapping boxes.

     the FEATURES carry what a profile cannot express: an overhang, a column,
       an authored gap, a lie, a shaft. Each is one call.

   Three rules are enforced BY CONSTRUCTION here, because each one has already
   cost this project a bug that every local test passed through:

   1. **A fully-solid column and a route past it are mutually exclusive.**
      P·terrain's "pillar" covered every open interval in its own columns, so it
      sealed the only route to the well; the flood fill stopped dead and three
      tests still went green because each asserted a local property. `column()`
      cannot author that shape: it opens the bay's ceiling above the capital
      first, and the headroom is DERIVED from the tow envelope, so retuning the
      sling can never quietly seal it either.

   2. **An authored gap has to be pinned from BOTH ops.** A rock alone leaves
      the hall's own floor roughness underneath it, which swung the momentum
      pinch between 54 and 106px — i.e. randomly between "unladen only" and
      "just fly through". `pinch()` emits the pinning pair and the mass overhead
      as one call, with zero roughness on every boundary, and derives the gap
      from the tier rather than taking a number.

   3. **The flood fill joins two columns only where their spans overlap by the
      clearance being tested.** So a band that is BOTH narrow and climbing can
      break a route that is plainly flyable by eye: a 90px passage whose floor
      rises 20px per column overlaps by only 70, and `chamberRoute` calls that a
      wall. `hall()` therefore interpolates between stations instead of stepping
      between them — a 300px climb spread over 400px of floor moves 12px per
      column, which nothing notices. Author elevation change as stations; author
      cliffs only where you mean a cliff.

   And one ordering rule that is not enforceable here, so it is written down
   instead: **the structural column must be the first feature in the chamber
   that raises the deck by more than 200px between adjacent columns.** The
   pillar test in tests/worldgen.spec.js finds the feature by exactly that
   property and takes the first match, and §8's painted rock — real outcrop,
   never drawn — has the same signature. Column left of painted rock. */

// Authoring returns single parts and groups of parts interchangeably; this is
// what flattens them back into the flat array compileChamber, chamberLies and
// __doids.declaredPinches all read. Nulls drop out, so a feature can opt out.
function partList(items) {
  const out = [];
  (function walk(v) {
    if (!v) return;
    if (Array.isArray(v)) { for (const k of v) walk(k); return; }
    out.push(v);
  })(items);
  return out;
}

/* ---- the hall ------------------------------------------------------------
   STATIONS are `{ x, ceil, floor }`, in increasing x, and the hall is the
   ruled surface between them: one room per interval, with a `ramp` profile on
   each boundary carrying it to the next station's height. Two consequences
   worth knowing:

     - the boundaries are continuous across a station, because the value noise
       is a function of absolute x and the amplitude is the same on every
       segment. Vary the roughness per segment and you author a step you did
       not mean.
     - the deck and the roof are independent, so "wide here, tight there" and
       "high here, low there" are separate axes. Rhythm is the band; altitude
       is the floor. The owner asked for both (August 2026), which is what the
       station list is for.
     - a station may carry `mt`/`mb`, which changes that boundary's MATERIAL
       from there eastward. That is the dressing pass in the same list as the
       shape, and it has a visible consequence beyond colour: a milled face
       takes one quiet octave of noise and raw rock takes two coarse ones, so
       the seam where paving ends is a small lip in the deck. Deliberate — a
       working floor stops being finished somewhere, and you can see where. */
function hall(stations, opts) {
  const o = opts || {};
  const rT = o.roughTop != null ? o.roughTop : 40;
  const rB = o.roughBot != null ? o.roughBot : 20;
  const out = [];
  let mt = o.mt, mb = o.mb;
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i], b = stations[i + 1];
    if (a.mt) mt = a.mt;
    if (a.mb) mb = a.mb;
    out.push({
      op: "room", x: a.x, y: a.ceil, w: b.x - a.x, h: a.floor - a.ceil,
      roughTop: rT, roughBot: rB,
      profTop: b.ceil !== a.ceil ? { kind: "ramp", dy: b.ceil - a.ceil } : null,
      profBot: b.floor !== a.floor ? { kind: "ramp", dy: b.floor - a.floor } : null,
      mt, mb
    });
  }
  return out;
}

/* Read the hall back at any x — the same interpolation `hall()` compiles, so a
   fixture placed with it is placed against the profile rather than against a
   number that goes stale the next time the floor is retuned.

   This is the other half of what makes a re-author cheap. Every light, can,
   ornament, rack, isolator and decoy in a chamber is positioned by x and takes
   its y from here; `snapToSurface` then puts it exactly on the compiled
   surface, roughness and all. Moving a station moves the furniture with it. */
function hallAt(stations, x) {
  let a = stations[0], b = stations[1] || stations[0];
  for (let i = 0; i < stations.length - 1; i++) {
    if (x >= stations[i].x && x <= stations[i + 1].x) { a = stations[i]; b = stations[i + 1]; break; }
    if (x > stations[i + 1].x) { a = stations[i]; b = stations[i + 1]; }
  }
  const u = b.x === a.x ? 0 : clamp((x - a.x) / (b.x - a.x), 0, 1);
  const ceil = lerp(a.ceil, b.ceil, u), floor = lerp(a.floor, b.floor, u);
  return { ceil, floor, mid: (ceil + floor) / 2, band: floor - ceil };
}

/* ---- features ------------------------------------------------------------ */

/* A SHELF: rock hanging in the hall with air above and below it — the shape a
   heightmap cannot hold at all, and the one that makes a column carry two
   spans. Milled pad on top (you land on it), raw stone underneath (you fly
   beneath it), which is the owner's "rock overhead, mechanical underfoot" rule
   applied to a single object that is both. */
function shelf(x, w, o) {
  o = o || {};
  return { op: "rock", x, y: o.y, w, h: o.h != null ? o.h : 150,
    roughTop: o.roughTop != null ? o.roughTop : 10,
    roughBot: o.roughBot != null ? o.roughBot : 24,
    radius: o.radius, mt: o.mt || MAT_MACH, mb: o.mb || MAT_ROCK, view: o.view };
}

/* A BENCH: a plinth standing ON the deck, to land on and to fly over. Filleted
   at both ends by default, which is cosmetic and also load-bearing — the
   fillet spreads its rise over a few columns instead of authoring a vertical
   face, and a vertical face taller than 200px reads to the pillar finder as a
   structural column (see the ordering rule above). Keep a bench under that. */
function bench(x, w, o) {
  o = o || {};
  return { op: "rock", x, y: o.y, w, h: o.h != null ? o.h : 420,
    roughTop: o.roughTop != null ? o.roughTop : 6,
    radius: o.radius != null ? o.radius : 60,
    mt: o.mt || MAT_MACH, mb: o.mb || MAT_ROCK, view: o.view };
}

/* A STRUCTURAL COLUMN, and the bay that carries it. Two parts, always: the bay
   raises the hall's ceiling locally so there is air over the capital, then the
   column stands in it from the capital down through the deck. That is how a
   real plant hall carries a column and it is the only way a column and a route
   past it can both exist (rule 1 above).

   `headroom` is DERIVED from the tow envelope rather than typed, so the clear
   air over the capital survives a change to SLING_VISIBLE the same way the
   authored gaps do — restGapPx() plus margin for the bay's own roughness. */
function column(x, w, o) {
  o = o || {};
  const head = o.headroom != null ? o.headroom : restGapPx() + 45;
  const bayW = o.bayW != null ? o.bayW : w + 450;
  const bayTop = o.capital - head;
  /* The bay's roof is FILLETED across its overhang, by exactly the distance
     between its edge and the column's. Without it the bay is a rectangle
     unioned into the hall, so its ends are a one-column vertical step in the
     roof — 170px here — and flying west at bay altitude you meet it with no
     warning and, since impacts kill, die. The radius is derived rather than
     chosen so the ease finishes precisely where the column starts: full
     headroom over the capital (rule 1 is not negotiable), a smooth roof
     everywhere else. */
  const bayR = o.bayRadius != null ? o.bayRadius : (bayW - w) / 2;
  return [
    { op: "room", x: x - (bayW - w) / 2, y: bayTop, w: bayW, h: o.floor - bayTop,
      roughTop: o.roughTop != null ? o.roughTop : 14,
      roughBot: o.roughBot != null ? o.roughBot : 22, radius: bayR,
      mt: o.bayMt || MAT_ROCK, mb: o.bayMb || MAT_MACH },
    { op: "rock", x, y: o.capital, w, h: (o.floor - o.capital) + (o.base != null ? o.base : 130),
      radius: o.radius, mt: o.mt || MAT_MACH, mb: o.mb || MAT_ROCK }
  ];
}

/* An AUTHORED GAP, at a named tier rather than a number (rule 2 above).

     "rest"      an ordinary tight spot — thread it, the load can hang
     "momentum"  too tight to creep through with a load hanging; passable only
                 with it swung up to your own level, which means carrying speed

   Three parts, because pinning takes both ops: a room forces the deck no
   shallower than `floor`, a rock immediately below forces it no deeper, and
   the mass overhead is cut to leave exactly the tier's gap. Every boundary is
   zero-roughness — a gap that IS the mechanic is authored, not sampled. `ceil`
   only has to start above the hall's roof here; it is not a visible surface. */
function pinch(x, w, tier, o) {
  o = o || {};
  const gap = tier === "momentum" ? momentumGapPx() : restGapPx();
  const floor = o.floor, inset = o.inset != null ? o.inset : 40;
  const ceil = o.ceil != null ? o.ceil : floor - 700;
  const deckMat = o.deck || MAT_MACH;
  return [
    { op: "room", x, y: floor - (o.lift != null ? o.lift : 240), w,
      h: o.lift != null ? o.lift : 240, roughTop: 0, roughBot: 0, mb: deckMat },
    { op: "rock", x, y: floor, w, h: o.base != null ? o.base : 260,
      roughTop: 0, roughBot: 0, mt: deckMat },
    /* `pinchX`/`pinchW` are the AUTHORED extent, not this part's. The overhead
       mass is inset from the pinch's ends, so reporting the rock's own x/w told
       __doids.declaredPinches a range 40px narrower at each end — and anything
       asking "is this tight spot one somebody meant?" then answered no for the
       pinch's own approach columns. */
    { op: "rock", x: x + inset, y: ceil, w: w - 2 * inset, h: floor - gap - ceil,
      roughTop: 0, roughBot: 0, mt: o.mt || MAT_ROCK, mb: o.mb || MAT_ROCK,
      pinch: tier, pinchX: x, pinchW: w }
  ];
}

/* A GALLERY: the ceiling lifted over a stretch, optionally domed. The wide half
   of the rhythm — where you can build speed and let the load swing. `rise` is
   how far the dome climbs above `top` at its centre. */
function gallery(x, w, o) {
  o = o || {};
  return { op: "room", x, y: o.top, w, h: o.floor - o.top,
    roughTop: o.roughTop != null ? o.roughTop : 34,
    roughBot: o.roughBot != null ? o.roughBot : 18,
    profTop: o.rise ? { kind: "arc", dy: -o.rise } : null,
    radius: o.radius, mt: o.mt || MAT_ROCK, mb: o.mb };
}

/* A BORE: the machined end of the range — a cut bay, filleted, milled on both
   boundaries. The counterpoint to `gallery`, and the one place the "rock
   overhead" default is deliberately broken, because a bore is cut, not found. */
function bore(x, w, o) {
  o = o || {};
  return { op: "room", x, y: o.top, w, h: o.floor - o.top,
    roughTop: o.roughTop != null ? o.roughTop : 8,
    roughBot: o.roughBot != null ? o.roughBot : 8,
    profTop: o.rise ? { kind: "arc", dy: -o.rise } : null,
    radius: o.radius != null ? o.radius : 110,
    mt: o.mt || MAT_MACH, mb: o.mb || MAT_MACH };
}

/* STALACTITES, or a cut comb in steel — teeth off a boundary. Shallow on
   purpose: a spike that seals a passage is a bug and not a hazard, and one
   that leaves less than the swung tow envelope makes a stretch unladen-only
   without anybody authoring it.

   AUTHORING RULE, and it cost a compile on chamber two: `y` must sit ABOVE the
   roof everywhere along the feature's width, with margin for the hall's own
   `roughTop`. This is a `rock` part, so it does not hang from the ceiling — it
   is a block placed at an absolute y. Put its top inside the air and you have
   not made teeth, you have made a bar with a slot over it: chamber two's first
   pass left a 25px channel between the comb and the roof for 100px, which is
   under the 48px a load trailing at your own level needs and would have been
   an unladen-only gap nobody authored. Take the *highest* roof across the whole
   width (the lowest ceil value of the stations it spans), subtract the
   roughness, and start above that. */
function stalactites(x, w, o) {
  o = o || {};
  return { op: "rock", x, y: o.y, w, h: o.h != null ? o.h : 90,
    roughBot: o.roughBot != null ? o.roughBot : 8,
    profBot: { kind: "teeth", n: o.n || 6, dy: o.dy != null ? o.dy : 95 },
    mt: o.mt || MAT_ROCK, mb: o.mb || MAT_ROCK };
}

/* A SHAFT: vertical space, for the way in and the way down. §11.1 — a chamber's
   exit is the next chamber's entrance, and it is where MERCY's well pays out. */
/* `exit: true` marks the mouth as a way OUT of the chamber rather than a lid —
   collected by genChamber into level.skyExits and read by atSkyExit. Declared
   rather than inferred from "is its top at y 0", because a chamber that happens
   to reach the world's ceiling for scenery reasons is not offering to let you
   leave through it. */
function shaft(x, w, o) {
  o = o || {};
  return { op: "room", x, y: o.top, w, h: o.bot - o.top, exitUp: !!o.exit,
    roughTop: o.roughTop != null ? o.roughTop : 8,
    roughBot: o.roughBot != null ? o.roughBot : 10,
    radius: o.radius != null ? o.radius : 60,
    mt: o.mt || MAT_ROCK, mb: o.mb || MAT_MACH };
}

/* §8's two hazards, as the only parts that differ between the two views. Named
   rather than left as `view:` on a raw rock, because what makes them safe to
   author is that the lie is declared in one place and the worldgen test counts
   any undeclared drift between the views as a failure. */
// drawn as a ledge, absent from collision — commit to it and you drop through
function falseFloor(x, w, o) {
  return shelf(x, w, Object.assign({ h: 60, mt: MAT_MACH, mb: MAT_MACH }, o, { view: "drawn" }));
}
// a real outcrop that is never drawn — open hall, right up until it isn't
function paintedRock(x, w, o) {
  return { op: "rock", x, y: o.y, w, h: o.h,
    roughTop: o.roughTop != null ? o.roughTop : 0,
    roughBot: o.roughBot != null ? o.roughBot : 10,
    mt: o.mt || MAT_ROCK, mb: o.mb || MAT_ROCK, view: "solid" };
}

/* Where a fixture that stands on the deck wants to be told to look, and where
   one hung from the roof does. snapToSurface does the rest, so these only have
   to land inside the right span — never on the surface itself.

   A FACTORY, one per chamber, rather than the four module-level consts this
   started as. Those closed over `SLICE_HALL` by name, which was fine while
   there was one chamber and is the first thing in the way of there being three:
   every fixture in a second chamber would have been placed against the FIRST
   chamber's profile, silently, and snapToSurface would then have moved it onto
   some real surface — so the bug would not have been a fixture in mid-air, it
   would have been a chamber whose furniture was in plausible but arbitrary
   places. Bound to its own stations, it cannot happen. */
function hallRefs(stations) {
  const ceil = x => Math.round(hallAt(stations, x).ceil);
  const floor = x => Math.round(hallAt(stations, x).floor);
  return { ceil, floor, deck: x => floor(x) - 40, roof: x => ceil(x) + 40 };
}

/* compile a chamber to a level-shaped object — TERRAIN ONLY. Deliberately no
   racks, no well, no tow, no oids, no reserve: those are P·slice/P·systems and
   guessing them here is exactly what the phased plan says not to do. What this
   buys now is that the span model is loadable and therefore testable — spans
   drive collision, rendering and the tile cache the moment a level carries them,
   so the format can be proven before anything is built on it. The empty arrays
   are the same set genCave fills, because drawWorld/updatePlay iterate them
   unconditionally. `heights` is deliberately absent, not stubbed: a chamber that
   accidentally depends on the heightmap should fail loudly here, not silently
   render half a level. */
/* sit an ornament on the floor of whichever span its y falls in, so terrain
   retuning never leaves the furniture hovering in mid-air. h (or 0) is how far
   above the floor its origin has to sit for the thing to rest ON the floor. */
/* The surface an EXTENDED object rests on. Owner, August 2026, flying the
   re-authored floor: "items on the landscape need to be integrated better, so
   they either sit on or are sunken into the ground, not partially floating."

   This used to sample ONE column, which was indistinguishable from correct while
   the deck was flat and wrong the moment P·floor gave it a slope: a 70px vent
   grate snapped at its origin hangs off the low end, and a 520px conduit run is
   hopeless. So sample the whole FOOTPRINT and take the DEEPEST floor across it.
   The object then rests at the lowest ground under it and buries into everything
   higher — which is exactly the direction the note asks for, because sunk reads
   as installed and floating reads as broken.

   CEILINGS DO NOT MIRROR IT, and that asymmetry is deliberate. Embedding a roof
   fitting the way a crate sinks into the deck would simply hide it — a buried
   lamp is an absent lamp — so a ceiling fixture takes the DEEPEST top under its
   footprint and hangs from the lowest rock there. It can leave a small gap over
   uneven roof; it can never disappear. (Which is also why nothing in the slice
   chamber is sited under the stalactites: a 95px tooth is not uneven roof, it
   is a different surface.)

   `foot` is [left, right] in px relative to the object's own x, set by whichever
   builder knows the object's shape — top-left-origin ornaments get [0, w],
   centre-origin racks and cans get [-w/2, w/2]. Absent, it degrades to the old
   point sample, which is right for something genuinely pointlike. */
function surfaceAcross(o, spans, ceil) {
  const foot = o.foot || [0, 0];
  const n = Math.max(1, Math.ceil((foot[1] - foot[0]) / STEP));
  let best = null;
  for (let k = 0; k <= n; k++) {
    const sp = spanAt(o.x + lerp(foot[0], foot[1], k / n), o.y, spans);
    if (!sp) continue;
    if (!best || (ceil ? sp.top > best.top : sp.bot > best.bot)) best = sp;
  }
  return best;
}

/* The SLOPE of the deck an object stands on, measured over a baseline wide
   enough not to be reading noise. Taking it from the object's own two ends was
   the first attempt and it was badly wrong for small furniture: a 90px crate
   stack across a deck carrying ±20px of value noise reports up to 24° of slope
   on ground that is running at 7°, so the whole set stood about drunkenly. So:
   a minimum baseline regardless of the object's size, several samples, and the
   ends AVERAGED — which is a two-tap low-pass, and enough. */
const ORN_TILT_BASE = 200;      // px, the shortest baseline worth trusting
function deckTilt(o, spans) {
  const half = Math.max(ORN_TILT_BASE, o.foot[1] - o.foot[0]) / 2;
  const cx = o.x + (o.foot[0] + o.foot[1]) / 2;
  const at = dx => { const sp = spanAt(cx + dx, o.y, spans); return sp ? sp.bot : null; };
  const l1 = at(-half), l2 = at(-half * 0.7), r1 = at(half), r2 = at(half * 0.7);
  if (l1 == null || l2 == null || r1 == null || r2 == null) return 0;
  const run = half * 1.7;       // between the two averaged shoulders
  return clamp(Math.atan2(((r1 + r2) - (l1 + l2)) / 2, run), -ORN_TILT_MAX, ORN_TILT_MAX);
}

function snapToSurface(list, spans) {
  return (list || []).map(o => {
    if (!o.snap) return Object.assign({}, o);
    /* A rigid object that TILTS: it takes the slope across its own footprint and
       sits on the middle of it, which is what something with a flat base
       actually does on a ramp. Reserved for furniture — a rack, a breaker or a
       fuel can is small, upright by construction, and keeps the deepest-floor
       rule that stops it floating. */
    if (o.tilt && o.snap === "floor" && o.foot) {
      const c = spanAt(o.x + (o.foot[0] + o.foot[1]) / 2, o.y, spans);
      if (c) return Object.assign({}, o,
        { y: c.bot - (o.h || 0) - 2, tiltA: deckTilt(o, spans) });
    }
    // the INTERPOLATED surface, i.e. the one collision and groundAt see — not
    // the nearest sampled column, which is a fraction of a slope away from it
    const sp = surfaceAcross(o, spans, o.snap === "ceil");
    if (!sp) return Object.assign({}, o);
    if (o.snap === "ceil") return Object.assign({}, o, { y: sp.top + 10 });
    /* Standing on the floor: the deepest ground under the whole footprint, so
       it sinks rather than floats — and then LIFTED BACK OUT if that buried its
       own origin.

       The deepest-floor rule is right for an extended rigid object and can
       overshoot for a small one: an isolator's footprint is ±16px, so a couple
       of px of the deck's own value noise between its two shoulders is enough
       to put the origin below the floor at its own x. That is not a sunken
       breaker, it is a breaker inside rock, and the fixture guard rightly calls
       it unreachable. Chamber two produced it on all three of its isolators on
       the first compile; chamber three has always been one noise sample away
       from the same thing and simply got lucky, which is the kind of latent
       fault worth fixing where it lives rather than by nudging coordinates.

       Lifting can never reintroduce the float this rule exists to prevent: the
       lift is exactly the depth it was buried by, so a fixture buried 1px ends
       up 1px proud at the deepest point of its footprint. Anything buried by
       more than the guard's tolerance was unreachable and wants moving, which
       is authoring and not arithmetic. */
    let y = sp.bot - (o.h || 0) - 2;
    /* …and the test is whether the ORIGIN lands in rock, not whether the local
       floor differs from the deepest one. Those are not the same question and
       the difference is the whole tolerance: a centre-origin object (a rack, a
       decoy, a can) has its origin half a cage up in clear air and is SUPPOSED
       to sink its base into the deck, so lifting it by the difference floats it
       — which is exactly what a first pass at this did, by 7px, to a decoy that
       had been sitting correctly for four rounds. Only a base-origin object
       (`h: 0` — an isolator) can have its origin buried at all. */
    const local = spanAt(o.x, o.y, spans);
    if (local && y >= local.bot) y = local.bot - (o.h || 0) - 2;
    return Object.assign({}, o, { y });
  });
}

/* ---- P·slice: the rack network, built from the chamber's own authoring ----
   Racks, their isolators and the well are all snapped onto real surfaces by the
   same snapToSurface the ornaments use, for the same reason: the chamber has
   been retuned four times now and a hand-typed y goes stale silently. A rack
   floating 40px off the deck is the exact bug that got the fixtures snapped.

   All the mutable per-run state a rack carries is initialised here in one
   place, which is also what P·persist needs: a chamber checkpoint (§11.2) is a
   shallow copy of these objects plus the ship pose, and nothing about a rack's
   state lives anywhere else. */
function buildRacks(ch, spans) {
  const cage = { w: RACK_SIZE.w * RACK_CAGE_W, h: RACK_SIZE.h * RACK_CAGE_H };
  /* snapToSurface puts an object's ORIGIN `h` above the floor, which is right for
     the ornaments it was written for (they draw down-right from a top-left
     corner). A rack's x/y is its CENTRE, so it wants half a cage, not a whole
     one — passing the full height left the box floating a cage-height clear of
     the deck. */
  return snapToSurface((ch.racks || []).map(r =>
    Object.assign({}, r, { h: cage.h / 2, foot: [-cage.w / 2, cage.w / 2] })), spans).map(r => ({
    id: r.id, x: r.x, y: r.y, w: RACK_SIZE.w, h: RACK_SIZE.h,
    /* The footprint and the offset it was SNAPPED with, carried onto the built
       object. Without them nothing downstream can check the placement rule —
       the worldgen guard was silently passing every rack because it could only
       see the draw height, which is not the number snapToSurface used. */
    foot: r.foot, snapH: cage.h / 2,
    occupants: r.occupants || RACK_OCCUPANTS_DEFAULT, label: r.label,
    // §7.5 — on mains it is bright and steady. Cutting the feed is what starts
    // the dying, and the player watches it happen because they caused it.
    state: "mains", reserve: RACK_RESERVE_MAX, integrity: 100,
    cut: false, cutT01: null, towed: false, delivered: false, lost: false,
    gives: 0, vx: 0, vy: 0, cradleT: 0, slamT: 0,
    /* Bolted to the structure until you pull it off (owner feedback). `mount`
       is which surface it is fixed to, and it is authoring rather than
       geometry — a wall-mounted bank hangs off the rock beside it, which is how
       a real plant racks something it does not want on the walking floor. */
    mount: r.mount || "floor", moored: true, moorT: 0
  }));
}

/* ---- where a feed line RUNS (owner feedback, July 2026) --------------------
   Three complaints, one cause. "What do the lines represent — don't really make
   sense", "why does the feed line to the left go nowhere", and "the feed lines
   keeping them alive should run at — or maybe better, below — ground level."

   All three were true. A trunk was a single straight segment from its isolator to
   the rack it fed, drawn across whatever open air lay between: at the slice
   chamber's spacing that is an 870px diagonal through the middle of the room,
   which reads as a laser or a tether and not as plumbing. And a decoy had no
   destination at all — `x1 = c.x + 240, y1 = c.y - 300` — so it was a line to
   literally nowhere, which is exactly what the owner saw.

   Now a trunk is a POLYLINE that goes down into the deck, runs buried along the
   floor, and comes back up at the far end. That is what makes it read as a feed:
   services are routed in the structure, not strung through the air. Buried depth
   is derived from the floor at each sample rather than a constant offset, so it
   follows the terrain over rough ground and through the hall's dips instead of
   diving through rock. */
const TRUNK_BURY = 26;         // px below the deck the run sits
const TRUNK_STEP = 64;         // sample spacing of the buried run

function trunkPath(x0, y0, x1, y1, spans) {
  const pts = [{ x: x0, y: y0 }];
  const floorAt = x => {
    const sp = spanAt(x, y0, spans);      // the same interpolated floor as above
    return sp ? sp.bot : y0;
  };
  const dir = x1 >= x0 ? 1 : -1;
  pts.push({ x: x0, y: floorAt(x0) + TRUNK_BURY });          // down into the deck
  for (let x = x0 + dir * TRUNK_STEP; dir > 0 ? x < x1 : x > x1; x += dir * TRUNK_STEP)
    pts.push({ x, y: floorAt(x) + TRUNK_BURY });             // along, under the floor
  pts.push({ x: x1, y: floorAt(x1) + TRUNK_BURY });
  pts.push({ x: x1, y: y1 });                                // and up to what it feeds
  return pts;
}

function buildConduits(ch, spans, racks, decoys) {
  /* h is how far above the floor the ORIGIN sits so the thing rests ON it, and
     drawIsolator draws its box from `y - 22` up to `y` — so the origin is the
     box's BASE and wants h = 0, not 26. At 26 every breaker in the chamber
     hovered a clear 28px off the deck (owner feedback: "should be attached to a
     wall or floor, not floating"). */
  return snapToSurface((ch.conduits || []).map(c =>
    Object.assign({}, c, { h: 0, foot: [-16, 16] })), spans).map(c => {
    const lid = RACK_SIZE.h * RACK_CAGE_H / 2 + 8;
    const rk = racks.find(r => r.id === c.rack);
    /* Every trunk ends at a BOX, real feed or decoy (owner feedback: "false
       feeds need a box too, same placement rules"). Which is also what makes the
       deduction honest — if only the real line terminated in something, the
       decoys would be identifiable by geometry rather than by reading a pulse,
       and §7.1's whole mechanic would be decorative. */
    const box = rk || (decoys || []).find(d => d.conduit === c.id);
    const x1 = box ? box.x : c.x + 240;
    const y1 = box ? box.y - lid : c.y - 120;
    return { id: c.id, rack: c.rack, real: !!c.real, label: c.label,
      foot: c.foot, snapH: 0,
      // the isolator, stood on the floor
      x: c.x, y: c.y, cut: false, scanT: 0,
      // kept for the shot test and anything that wants the run's endpoints
      y0: c.y - 18, x1, y1,
      // and the route it actually takes: down, along under the deck, and up
      path: trunkPath(c.x, c.y - 18, x1, y1, spans) };
  });
}

/* ---- the decoy boxes (owner feedback, July 2026) ---------------------------
   "False feeds need a box too. (Same placement rules). Landing beside a false
   feed box needs a penalty. Therefore the false pulse needs to be a similar size
   to the real one."

   Read as one requirement rather than three, because they only work together: if
   a decoy box were smaller, or unmounted, or free to inspect, then telling it
   from a real bank would be a matter of looking rather than of reading a pulse —
   and §7.1's deduction is the act this whole chamber is built around. So a decoy
   is the same size, bolted the same way, pulsing on the same clock, and
   approaching one costs you.

   What it costs is VITALS (owner's call). It is the right currency: you are the
   blood supply down here, so anything that takes vitals takes reserve you could
   have given a real bank later.
   It costs points AS WELL, once the ladder lands (P·systems) — not instead. The
   "never score" reasoning that used to sit here was an assistant's assumption and
   the owner overturned it (July 2026): "your score is the only permanent record
   of your success. The others just make your game harder." Vitals shape this
   attempt; score is the record of it. See APP_STORE_ROADMAP.md, Bundle P. */
const DECOY_VITALS = 12;       // the cost of going to have a look
const DECOY_R = 104;           // how close is "beside it"

function buildDecoys(ch, spans) {
  const cage = RACK_SIZE.h * RACK_CAGE_H;
  return snapToSurface((ch.decoys || []).map(d =>
    Object.assign({}, d, { h: cage / 2, foot: [-RACK_SIZE.w * RACK_CAGE_W / 2, RACK_SIZE.w * RACK_CAGE_W / 2] })), spans).map(d => ({
    id: d.id, conduit: d.conduit, x: d.x, y: d.y, foot: d.foot, snapH: cage / 2,
    mount: d.mount || "floor", occupants: d.occupants || RACK_OCCUPANTS_DEFAULT,
    label: d.label, penalised: false
  }));
}

/* A chamber's emplacements, in Act One's own turret shape so updateEnemies and
   the shot loop need no special case — `heavy` and `hp` are the only additions,
   and both default harmlessly on an Act One turret. */
function buildEmplacements(ch, spans) {
  return snapToSurface((ch.turrets || []).map(t =>
    Object.assign({}, t, { h: 0, foot: [-18, 18] })), spans).map(t => ({
    x: t.x, y: t.y, foot: t.foot, snapH: 0,
    cd: 1 + Math.random() * 2, alive: true, ang: -Math.PI / 2,
    heavy: true, hp: EMPLACE_HP, hitT: 0
  }));
}

function genChamber(ch) {
  /* Two views compiled from one definition (see chamberLies): `spans` is the
     truth collision uses, `spansDrawn` is what the renderer shows. They are the
     SAME array unless the chamber declares a deception, so an honest chamber
     costs nothing and cannot disagree with itself. */
  const spans = compileChamber(ch, "solid");
  const drawn = chamberLies(ch) ? compileChamber(ch, "drawn") : spans;
  const racks = buildRacks(ch, spans);
  const decoys = buildDecoys(ch, spans);
  return {
    racks, decoys, conduits: buildConduits(ch, spans, racks, decoys),
    /* §7.6 — the bay hangs and sways; `docking` and `winchT` are the beat that
       seats a load in it, driven by updateWellDock. `phase` offsets the sway so
       a chamber with more than one well never pulses as one object. */
    wellDock: ch.well ? Object.assign({ phase: 0, winchT: 0, tension: 0,
      docking: false, rackState: "reserve", occupants: RACK_OCCUPANTS_DEFAULT,
      taken: 0 }, ch.well) : null,
    towedRack: null,
    // the mouths you can leave by (§11.1) — see atSkyExit/askLeaveChamber
    skyExits: partList(ch.parts).filter(p => p.exitUp).map(p => [p.x, p.x + p.w]),
    n: 0, W: ch.W, H: ch.H, spans, spansDrawn: drawn, chamberId: ch.id,
    isChamber: true, isPlant: !!ch.plant, plantZone: ch.zone, dark: false,
    // ornaments and lights are placed against what is REALLY there, not against
    // the lie — a fixture bolted to a floor that doesn't exist would give it away
    /* An ornament draws down-right from a top-left origin, so its footprint runs
       from its own x eastward — EXCEPT conduitRun, which samples the deck along
       its whole length as it draws and so lays itself along the terrain already.
       Giving that one a footprint snaps its origin to the deepest ground under a
       460px run and buries the near end. The distinction is "is this thing
       rigid?", not "how wide is it". */
    plantOrnaments: snapToSurface((ch.ornaments || []).map(o =>
      Object.assign({}, o, { foot: o.type === "conduitRun" ? [0, 0]
        : [0, o.w || (o.scale ? 80 * o.scale : 80)],
        // a conduit run already lays itself along the terrain, and a gantry
        // hangs from the roof; everything else stands on the deck and tilts
        tilt: o.type !== "conduitRun" && o.snap !== "ceil" })), spans),
    /* A light is an ANCHOR, not a rigid box: the fitting is drawn symmetric
       about it, so the footprint rule would sink it below its own surface on a
       slope and hide it. Point snap, and site fixtures off the steep bits. */
    lights: snapToSurface(ch.lights, spans),
    /* Fuel cans sit ON the deck, so the origin is lifted by the can's own half
       height — the same correction buildRacks needs, and for the same reason:
       snapToSurface puts an ORIGIN `h` above the floor, and a can is drawn from
       its centre. `taken` is per-attempt, which is what makes a chamber retry a
       genuine reset of the fuel plan rather than a stripped route. */
    fuelCans: snapToSurface((ch.fuel || []).map(f =>
      Object.assign({}, f, { h: 13, foot: [-14, 14] })), spans).map((f, i) =>
      ({ id: "f" + i, x: f.x, y: f.y, foot: f.foot, snapH: 13, taken: false })),
    oids: [], turrets: buildEmplacements(ch, spans),
    bullets: [], shots: [], drones: [], pods: [],
    fakePods: [], anomalies: [], scenery: [], fragmentsHere: [],
    blackbox: null, beacon: null, lift: null, shrine: null, roof: null,
    mx: -9999, my: -9999, mxo: 0, myo: 0,
    delivered: 0, lost: 0, contained: 0, total: 0, firedShots: 0,
    extraction: null, pulse: null, isCave: false, isFinale: false,
    contamKnown: false
  };
}
/* ================ end js/acttwo-data.js ================ */
