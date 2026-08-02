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

/* ---- the slice chamber ---------------------------------------------------
   ONE chamber, and it exists to prove the format, not to be content — the ten
   authored chambers are P·content and are deliberately not guessed at here.
   This is the geometry P·slice is required to tune against: per Bundle P it
   "must contain an overhang and a pinch point", because a slice tuned against
   Act One's tube caves would prove the tether against terrain the real chambers
   won't have. It is also larger than any surface sector (the widest is sector 6
   at 2200 + 6·550 = 5500px; the finale is 4400) — §11.0's other requirement.

   Reading the layout: an entry shaft drops in at the left into an upper gallery
   whose ceiling carries a rock SHELF with air above and below it (the overhang);
   a mid corridor squeezes to a PINCH of ~84px, against the 175px every Act One
   cave is guaranteed by construction; that opens into a deep lower gallery with
   a full-height PILLAR and a second shelf to tow a rack around. */
/* ---- the slice chamber, as a FLOOR ---------------------------------------
   Owner steer, July 2026: a chamber is **one floor of a subterranean complex**,
   not a vertical shaft. You clear a whole floor — everyone on it — and then
   descend to the next. So width is the point, and the descent belongs at the
   END of a level rather than threaded through it. The first pass had the route
   stepping down through three stacked galleries, which quietly made every
   chamber its own mini-descent and left nothing for the act's structure to do.

   So: a long working hall, bays and mezzanines along it, and a shaft at the far
   right that drops to the next floor's entrance — which is also where MERCY's
   well pays out to (§11.1: each chamber's exit is the next one's entrance, and
   she lowers the well deeper as you clear).

   ---- P·floor (owner, August 2026) ----------------------------------------
   Re-authored against the on-device note that "the floor can't all be flat".
   It was, near enough: one 8050x620 room with ±22px of noise on the deck, so
   the entire haul happened at one altitude with obstacles beside it. Three
   decisions shaped the replacement:

     BOTH SURFACES ROAM. The deck and the roof are independent profiles now,
       and the clear band between them runs from 260px to 870px along the
       floor — a factor of more than three, against a factor of one before.

     THE HAUL ASKS FOR ALTITUDE **AND** RHYTHM. Both, not either: the deck
       falls 280px into the sump and climbs 540px back out to the creep, so
       carrying a swinging load is a vertical problem; and wide stretches you
       can build speed in alternate with tight ones where the load has to be
       settled first, so the floor sets a tempo. Reading west to east — the
       laden direction — it goes muster, stoop, sump, gallery, structural bay,
       climb, creep, pinch, domed bay, well head: W t W W T t P W.

     IT IS AUTHORED FROM THE VOCABULARY, not from rectangles. That is the part
       meant to cascade to the other nine chambers (P·content): the shape here
       is one chamber's answer, but `hall`/`shelf`/`column`/`pinch`/… is the
       means of making any of them, and every fixture below takes its y from
       `hallAt` so retuning a station moves the furniture with it. */
const SLICE_CHAMBER_V1_LETTERBOX = null;   // (kept as a marker: see the note above)

/* THE PROFILE. Stations are `{x, ceil, floor}` and the hall is ruled between
   them (see `hall`). This list *is* the level design — everything else is
   features hung on it — so it is worth reading as a sequence rather than as
   numbers. `band` is the clear air at each station, and it is the rhythm.

   One rule constrains it and only one: the deck may not rise by more than
   200px between adjacent columns anywhere left of the structural column, or
   the pillar test in tests/worldgen.spec.js finds the wrong feature. Stations
   interpolate, so every climb here is 12px a column or gentler; the column and
   §8's painted rock are the only cliffs, and the column is first. */
const SLICE_HALL = [
  { x:  120, ceil: 470, floor: 1180, mt: MAT_MACH, mb: MAT_MACH },   // the west wall
  { x:  520, ceil: 430, floor: 1210 },   // THE MUSTER — widest air      band 780
  { x: 1000, ceil: 440, floor: 1180, mt: MAT_ROCK },   //   the bank stands   band 740
  { x: 1560, ceil: 480, floor: 1160 },   // THE RACK BAY                 band 680
  { x: 1980, ceil: 720, floor: 1120 },   //   the roof comes down        band 400
  { x: 2420, ceil: 820, floor: 1120 },   // THE STOOP — flat, and low    band 300
  { x: 2760, ceil: 720, floor: 1300, mb: MAT_ROCK },   //   deck falls away   band 580
  { x: 3160, ceil: 700, floor: 1460 },   // THE SUMP — 280 below the     band 760
  { x: 3560, ceil: 690, floor: 1440 },   //   muster, and domed over it  band 750
  { x: 3820, ceil: 700, floor: 1060 },   // THE NECK — a lip, not a lid   band 360
  { x: 3980, ceil: 560, floor: 1260, mb: MAT_MACH },   //   climbing out      band 700
  { x: 4380, ceil: 430, floor: 1180 },   // THE LONG GALLERY             band 750
  { x: 4720, ceil: 300, floor: 1170 },   // THE STRUCTURAL BAY — tallest band 870
  { x: 5060, ceil: 400, floor: 1160 },   //                              band 760
  { x: 5420, ceil: 520, floor: 1060, mb: MAT_ROCK },   //   deck starts up    band 540
  { x: 5820, ceil: 620, floor:  930 },   // THE CLIMB                    band 310
  { x: 6240, ceil: 630, floor:  920 },   // THE CREEP — tightest air     band 290
  { x: 6480, ceil: 620, floor: 1000, mb: MAT_MACH },   //   into the pinch    band 380
  { x: 6820, ceil: 600, floor: 1000 },   //   (the pinch is pinned here) band 400
  { x: 7240, ceil: 470, floor: 1060 },   // THE DOMED BAY                band 590
  { x: 7700, ceil: 450, floor: 1120 },   //                              band 670
  { x: 8120, ceil: 510, floor: 1300 },   //   the ramp down              band 790
  { x: 8680, ceil: 560, floor: 1420 }    // THE WELL HEAD                band 860
];
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
const SLICE_AT = hallRefs(SLICE_HALL);

/* CHAMBER THREE, and the id stays `slice`. It is the vertical slice — that is
   what it was built as and what every one of its ~20 test call sites, the QA
   harness and four rounds of notes call it — and the id is not player-facing.
   Renaming it would be twenty edits to buy nothing a comment cannot say: this
   is the THIRD chamber now (owner, August 2026), and THE BREACH and THE WARDS
   come before it. See the ladder above BREACH_CHAMBER. */
const SLICE_CHAMBER = {
  id: "slice", n: 3, name: "THE DEEP INTAKE", seed: 90210, W: 9000, H: 2050, zone: "cyan",
  brief: "The last of her, and the first of him. Past this floor the rock stops "
       + "being a wreck and starts being a facility.",
  /* SOLACE's breached intake is beat 1; the plant proper is 2–5 (spec §11.1), so
     this chamber is NOT dressed as a plant — `plant` stays false and the machined
     surfaces read as her own wrecked intake gear rather than his facility. */
  plant: false,
  // the owner rule: raw rock overhead, mechanical underfoot
  matTop: MAT_ROCK, matBot: MAT_MACH,
  /* ORDER IS THE GRAMMAR: rooms open air, rocks put it back, and a rock only
     bites the rooms declared before it. So every room-shaped feature is listed
     first and every rock-shaped one after — which also means the structural
     bay cannot erase a mezzanine that overlaps it, and the mezzanine cuts into
     the bay instead, which is what a mezzanine running into a bay should do. */
  parts: partList([
    /* --- the air ------------------------------------------------------- */
    // the way IN, dropping from the floor above — SOLACE's breach (§11.1 beat 1)
    shaft(240, 300, { top: 60, bot: 640 }),
    // THE WORKING HALL — one floor, 8.5km of it, and both its surfaces roam
    hall(SLICE_HALL, { roughTop: 40, roughBot: 20 }),
    // a domed cavern over the sump: the roof lifts where the deck falls, so the
    // low ground reads as a big room rather than as a ditch
    gallery(2760, 800, { top: 660, floor: 1420, rise: 90 }),
    // and the immaculate end of the range — a machined bore off the hall
    bore(6900, 800, { top: 470, floor: 1100, rise: 60 }),
    /* THE WELL SHAFT — the way down to the next chamber, and the way UP to
       MERCY. Owner, August 2026: "the well should have a thick cable going up
       off the top of the screen, which should be open (as, in theory, Mercy
       would now be hovering over the top of it, gradually lowering the well
       bucket down)." It was a pocket cut into the hall floor with the hall's
       own rock roof over it, so the cable she pays the bay out on would have
       had to pass through solid rock. `top: 0` puts the opening at the world's
       own ceiling with zero roughness, so no rock is drawn over it at all and
       the shaft reads as continuing up out of frame.
       Flying up it does NOT kill you (owner, same round): the mouth is declared
       an `exit`, and reaching it asks whether you mean to leave rather than
       billing you for touching a ceiling. See askLeaveChamber. */
    shaft(8300, 380, { top: 0, bot: 1950, roughTop: 0, exit: true }),

    /* --- the rock ------------------------------------------------------ */
    /* THE STRUCTURAL COLUMN. Listed first among the rock so its bay is opened
       before anything cuts into it. It was authored floor-to-ceiling under
       P·terrain and sealed the only route to the well — a fully-solid column
       and a route past it are mutually exclusive, since a route must cross
       every intermediate x. `column()` cannot express that mistake any more:
       it opens headroom over the capital, derived from the tow envelope. */
    column(4600, 210, { capital: 470, floor: 1170 }),
    /* THE ENTRY MEZZANINE — the first overhang on the floor, and the shape a
       heightmap cannot hold: air above it, rock inside it, air below it again.
       It is WEST of the bank, and that is the P·floor correction rather than a
       preference. Authored east of it first, and the sling test found the
       problem before a person could have: a mezzanine 80px along from the rack,
       at exactly the height a hanging load rides at, means you clip the deck of
       it in the first metre of every haul. An overhang belongs where you meet it
       unladen — on the way in — with the bay itself left clear so a fresh load
       has a thousand pixels of room to settle before the floor asks anything. */
    shelf(300, 400, { y: 800, h: 130 }),
    // a landing plinth in the muster, so the widest room still offers a choice
    bench(760, 300, { y: 1090 }),
    /* THE STOOP's slot — an ordinary tight spot at the derived rest gap. You
       meet it immediately after cradling the bank, which is the teaching: the
       first thing a laden run asks is that you stop barrelling along. */
    pinch(2140, 280, "rest", { floor: 1120 }),
    // stalactites off the raw roof on the way down into the sump
    stalactites(2460, 240, { y: 620, h: 170, n: 4, dy: 95 }),
    /* §8's FALSE FLOOR is out of this chamber too (owner, August 2026): "as with
       the invisible walls, let's remove fake walls from this level anyway, it is
       too much for level one but we needed to see how they work." Which is the
       right read of what a slice chamber is for — the hazard was authored here
       to prove the terrain model could hold a lie at all, and it has. Chamber
       one now carries NO deception of either kind, and `chamberLies` is false
       for it, so the two views are literally the same array.
       The capability keeps its own test against a purpose-built chamber, and
       the tell the owner specified in the same round — a 41-second flicker plus
       reveal on contact — is written up against P·systems, which is what these
       come back behind. */
    // the gallery mezzanine, running on into the structural bay
    shelf(3980, 640, { y: 800, h: 140 }),
    /* §8's PAINTED ROCK is deliberately NOT in this chamber (owner, August
       2026, after flying it): "we need to give some sort of clue to the
       invisible walls so they aren't unfair… we wouldn't want any on this
       first level anyway." There was one here, 440px tall, undrawn, sitting on
       the only route west — which is a trap in the tutorial chamber rather
       than a hazard. The `paintedRock()` helper stays in the vocabulary and is
       still exercised by the worldgen tests against a purpose-built chamber,
       so the capability is proven without chamber one carrying it. It comes
       back to authored content once §8.1's tell is built (P·systems).

       Note the ordering rule this leaves in place for whoever re-adds one:
       painted rock has the same signature to the pillar finder as a structural
       column, so it must be authored to the RIGHT of the column. */
    // a landing plinth on the climb, so the tight half of the floor still offers
    // somewhere to set down and think
    bench(5480, 300, { y: 940 }),
    /* THE MOMENTUM PINCH (owner idea, July 2026) — the mid-band gap you cannot
       creep through with a load hanging and can carry through with it swung up
       to your own level. Derived from the tow envelope, pinned from both ops,
       zero roughness on every boundary: the hall's own ±20px deck noise would
       otherwise swing this gap in and out of the band it exists to sit in.
       It is on the only route to the rack, deliberately — a route that let you
       avoid it would never answer whether mid-band is the right idea. */
    pinch(6480, 340, "momentum", { floor: 1000 }),
    // the bore's own mezzanine — milled, because a bore is cut and not found
    shelf(7150, 700, { y: 760, h: 140, mb: MAT_MACH })
  ]),
  /* Light sources, because a maintained facility is lit BY something (owner
     ask, July 2026 — brighter, via lots of light sources). Two jobs at once: it
     lifts the room, and each fixture is a point of interest in an otherwise even
     floor. Placed by x against the hall profile rather than by a typed y, so a
     retune of a station carries the lighting with it; `snap` then puts each one
     exactly on the compiled surface. Cool cyan fixtures are his; the warm ones
     on the deck are the failing original plant. */
  lights: [
    { x:  380, y:  300, r: 420, snap: "ceil", fit: 2.4 },   // down the entry shaft
    { x:  700, y: SLICE_AT.deck(700),  r: 340, snap: "floor", warm: true },
    { x:  900, y: SLICE_AT.roof(900),  r: 460, snap: "ceil" },
    { x: 1300, y: SLICE_AT.deck(1300), r: 320, snap: "floor", warm: true },
    { x: 1450, y: SLICE_AT.roof(1450), r: 420, snap: "ceil" },
    { x: 1780, y: SLICE_AT.roof(1780), r: 380, snap: "ceil" },
    { x: 2100, y: SLICE_AT.roof(2100), r: 340, snap: "ceil" },
    { x: 2260, y: SLICE_AT.deck(2260), r: 300, snap: "floor", warm: true },
    { x: 2800, y: SLICE_AT.roof(2800), r: 380, snap: "ceil" },
    { x: 3040, y: SLICE_AT.roof(3040), r: 420, snap: "ceil" },
    { x: 3200, y: SLICE_AT.deck(3200), r: 340, snap: "floor", warm: true },
    { x: 3400, y: SLICE_AT.roof(3400), r: 440, snap: "ceil" },
    { x: 3320, y: SLICE_AT.deck(3320), r: 340, snap: "floor", warm: true },
    { x: 3900, y: SLICE_AT.roof(3900), r: 320, snap: "ceil" },
    { x: 4180, y: SLICE_AT.roof(4180), r: 400, snap: "ceil" },
    { x: 4380, y: SLICE_AT.deck(4380), r: 340, snap: "floor", warm: true },
    { x: 4520, y: SLICE_AT.roof(4520), r: 420, snap: "ceil" },
    { x: 4800, y: SLICE_AT.roof(4800), r: 380, snap: "ceil", fit: 2.2 },  // the top of the bay
    { x: 5240, y: SLICE_AT.roof(5240), r: 400, snap: "ceil" },
    { x: 5460, y: SLICE_AT.deck(5460), r: 300, snap: "floor", warm: true },
    { x: 5620, y: SLICE_AT.roof(5620), r: 340, snap: "ceil" },
    { x: 6060, y: SLICE_AT.roof(6060), r: 320, snap: "ceil" },
    { x: 6180, y: SLICE_AT.deck(6180), r: 280, snap: "floor", warm: true },
    { x: 6360, y: SLICE_AT.roof(6360), r: 320, snap: "ceil" },
    { x: 6900, y: SLICE_AT.deck(6900), r: 340, snap: "floor", warm: true },
    { x: 7060, y: SLICE_AT.roof(7060), r: 440, snap: "ceil" },
    { x: 7420, y: SLICE_AT.roof(7420), r: 420, snap: "ceil" },
    { x: 7560, y: SLICE_AT.deck(7560), r: 320, snap: "floor", warm: true },
    { x: 7900, y: SLICE_AT.roof(7900), r: 400, snap: "ceil" },
    { x: 8060, y: SLICE_AT.deck(8060), r: 340, snap: "floor", warm: true },
    { x: 8180, y: SLICE_AT.roof(8180), r: 420, snap: "ceil" },
    { x: 8480, y: 1850, r: 380, snap: "floor" }          // the bottom of the well shaft
  ],
  /* dressing. These are #69's existing ornaments (js/acttwo-render.js), which
     were built and then never switched on by any level — conduitRun in
     particular runs a light along its length on the rack's own heartbeat.
     `snap` sits an ornament on the floor of whatever span its y falls in, so a
     retune of the terrain doesn't leave the furniture hovering. */
  /* THE FURNITURE. Owner decision, August 2026: **hers, wrecked — then his,
     installed over it.** This is chamber one, AMS SOLACE's own breached intake,
     so almost everything is a hospital ship's and almost none of it is running:
     stretcher bays, oxygen banks, a drip stand, spilled supply crates, all
     `dead`. What is `his` is sparse here and all of it `live` — a reader head, a
     pump set, cabling stapled across her structure — because he has only just
     started on this floor. That ratio inverts as the act descends (§11.1): by
     the plant chambers it is his equipment with her wreckage underneath.
     `state` is dead/failing/live and drives the accent through PAL(); a
     `failing` piece stutters on the Static's own 41-second beat, so it is
     visibly on the same clock as a failing bank of people. */
  ornaments: [
    { type: "medCrates",    x:  880, y: SLICE_AT.deck(880),  w: 88, h: 168, n: 3, snap: "floor", owner: "hers", state: "dead" },
    { type: "conduitRun",   x:  760, y: SLICE_AT.deck(760),  w: 420, snap: "floor", owner: "his", state: "live" },
    { type: "gantry",       x:  840, y: SLICE_AT.roof(840),  w: 280, snap: "ceil", owner: "hers", state: "dead" },
    { type: "dripStand",    x: 1180, y: SLICE_AT.deck(1180), h: 110, snap: "floor", owner: "hers", state: "dead" },
    { type: "stretcherBay", x: 1560, y: SLICE_AT.deck(1560), w: 96, h: 150, snap: "floor", owner: "hers", state: "dead" },
    { type: "oxyBank",      x: 1660, y: SLICE_AT.deck(1660), w: 92, h: 96, n: 4, snap: "floor", owner: "hers", state: "failing" },
    { type: "medCrates",    x: 2020, y: SLICE_AT.deck(2020), w: 84, h: 104, n: 2, snap: "floor", owner: "hers", state: "dead" },
    { type: "ventGrate",    x: 2200, y: SLICE_AT.deck(2200), w: 70, h: 90,  snap: "floor", owner: "hers", state: "dead" },
    { type: "pumpSet",      x: 2860, y: SLICE_AT.deck(2860), w: 150, h: 64, snap: "floor", owner: "his", state: "live" },
    { type: "gantry",       x: 3020, y: SLICE_AT.roof(3020), w: 300, snap: "ceil", owner: "hers", state: "dead" },
    { type: "conduitRun",   x: 3180, y: SLICE_AT.deck(3180), w: 460, snap: "floor", owner: "his", state: "live" },
    { type: "stretcherBay", x: 3100, y: SLICE_AT.deck(3100), w: 96, h: 150, snap: "floor", owner: "hers", state: "dead" },
    { type: "dripStand",    x: 3300, y: SLICE_AT.deck(3300), h: 110, snap: "floor", owner: "hers", state: "dead" },
    { type: "ventGrate",    x: 4060, y: SLICE_AT.deck(4060), w: 70, h: 90,  snap: "floor", owner: "hers", state: "dead" },
    { type: "oxyBank",      x: 4040, y: SLICE_AT.deck(4040), w: 92, h: 96, n: 4, snap: "floor", owner: "hers", state: "dead" },
    { type: "readerHead",   x: 4260, y: SLICE_AT.deck(4260), w: 76, h: 54, snap: "floor", owner: "his", state: "live" },
    { type: "gantry",       x: 4610, y: SLICE_AT.roof(4610), w: 190, snap: "ceil", owner: "hers", state: "dead" },
    { type: "cableLoom",    x: 4900, y: SLICE_AT.deck(4900), w: 220, snap: "floor", owner: "his", state: "live" },
    { type: "medCrates",    x: 5000, y: SLICE_AT.deck(5000), w: 88, h: 168, n: 3, snap: "floor", owner: "hers", state: "dead" },
    { type: "stretcherBay", x: 5680, y: SLICE_AT.deck(5680), w: 96, h: 150, snap: "floor", owner: "hers", state: "failing" },
    { type: "ventGrate",    x: 6060, y: SLICE_AT.deck(6060), w: 70, h: 90,  snap: "floor", owner: "hers", state: "dead" },
    { type: "cableLoom",    x: 6100, y: SLICE_AT.deck(6100), w: 180, snap: "floor", owner: "his", state: "live" },
    { type: "gantry",       x: 7040, y: SLICE_AT.roof(7040), w: 240, snap: "ceil", owner: "hers", state: "dead" },
    { type: "conduitRun",   x: 7060, y: SLICE_AT.deck(7060), w: 460, snap: "floor", owner: "his", state: "live" },
    { type: "medCrates",    x: 7560, y: SLICE_AT.deck(7560), w: 90, h: 216, n: 4, snap: "floor", owner: "hers", state: "dead" },
    { type: "readerHead",   x: 7430, y: SLICE_AT.deck(7430), w: 76, h: 54, snap: "floor", owner: "his", state: "live" },
    { type: "pumpSet",      x: 7180, y: SLICE_AT.deck(7180), w: 150, h: 64, snap: "floor", owner: "his", state: "live" },
    { type: "stretcherBay", x: 7500, y: SLICE_AT.deck(7500), w: 96, h: 150, snap: "floor", owner: "hers", state: "dead" },
    { type: "conduitRun",   x: 8340, y: 1900, w: 300, snap: "floor", owner: "his", state: "live" }
  ],
  /* ---- P·slice: one rack, its feed, and THE WELL ---------------------------
     "One chamber, one rack, the trunk cut, the tow, THE WELL, the reserve, the
     vitals transfusion" (Bundle P). One rack exactly, because the slice exists
     to prove the loop feels good in one room before any of it is authored ten
     times over.

     The rack sits near the START of the floor and the well at the END of it, so
     the tow is the whole vocabulary in one haul: the stoop's slot, the drop into
     the sump, the climb out, the structural column, the painted rock, two
     mezzanines and then the momentum pinch. That is deliberate and it is the
     point — the roadmap left "is mid-band right for a momentum pinch?" open
     because it needs the tether in hand, and a route that lets you avoid the
     pinch would never answer it. */
  racks: [
    { id: "r1", x: 1150, y: SLICE_AT.deck(1150), occupants: 10, label: "BANK 1 · 10 SOULS", snap: "floor" }
  ],
  /* Several conduits run through each chamber; one is the rack's (§7.1). You
     close a feed at its ISOLATOR — a floor-mounted breaker you land beside and
     hold, which is the shipped deliberate-act grammar (updateLift/updateBlackbox)
     and needs no new control.

     TEACHING PLACEMENT, per §7.1's own sequencing ("placed-and-visible for the
     first chamber or two… found-by-pulse everywhere after"): the real trunk is
     drawn as a line running from its isolator to the rack it feeds, so it is
     traceable by eye. What is NOT here is the deduction layer — a faked pulse
     that is metronomic where a real one drifts — because that is P·systems and
     guessing it here is what the phased plan says not to do. The silhouette
     tell drawConduitTrunk already carries (round beat = living line, square
     beat = faked) is switched on, so the two decoys read as his the moment a
     player learns to look, and the honest-versus-metronomic layer lands on top
     of it later without moving anything.

     The isolators sit well away from the rack on purpose: if the breaker were
     beside the box there would be nothing to read. Each also sits in air the
     hall gives you room to land in — the stoop and the creep are deliberately
     not places you are asked to set down. */
  conduits: [
    { id: "c1", rack: "r1", real: true,  x: 2000, y: SLICE_AT.deck(2000), snap: "floor",
      label: "ISOLATOR 1" },
    { id: "c2", rack: null, real: false, x: 3250, y: SLICE_AT.deck(3250), snap: "floor",
      label: "ISOLATOR 2" },
    { id: "c3", rack: null, real: false, x: 4450, y: SLICE_AT.deck(4450), snap: "floor",
      label: "ISOLATOR 3" }
  ],
  /* One box per decoy feed (owner feedback), same size and same mounting as the
     real bank, so the two cannot be told apart by looking — only by reading. One
     of the two is wall-mounted, which is the mount the owner opened up and which
     a real plant would use for a bank it did not want on the walking floor —
     here, up on the gallery mezzanine, where getting a look at it costs a climb
     as well as the vitals. */
  decoys: [
    { id: "d1", conduit: "c2", x: 3560, y: SLICE_AT.deck(3560), snap: "floor", label: "BANK 2 · 10 SOULS" },
    { id: "d2", conduit: "c3", x: 4180, y: 660, snap: "floor", mount: "wall",
      label: "BANK 3 · 9 SOULS" }
  ],
  /* PROVISIONAL placement, per the owner: siting is a level-design decision and
     this is here so the emplacement can be seen and flown against on a phone.
     Moved to the sump for P·floor, and for the reason the feedback round gave:
     the objection was never that it was hard, it was dying with no way to read
     it coming. The sump is the widest, best-lit air on the floor and you look
     down into it on the way west, so it can be seen, circled and dealt with
     unladen — which is the only answer available, since a slung rack cannot be
     shot for or shielded. Move or delete this line freely; nothing references it. */
  turrets: [
    { x: 3300, y: SLICE_AT.deck(3300), snap: "floor" }
  ],
  /* THE WELL (§7.6) — MERCY cannot land and cannot descend, so she pays out a
     docking bay on a cable. It hangs in the shaft at the END of the floor,
     which is where the next chamber's entrance is and where she lowers it
     deeper as you clear (§11.1). It sways, and you dock a swinging load into
     it: the mothership is doing exactly what you are doing. */
  well: { x: 8465, y: 950 },
  /* Fuel along the route (owner feedback). Placed against the SHAPE of the run
     rather than evenly: you enter at the well on the right, so the leftward leg
     is unladen and cheap, and the haul back is laden, slow and thirsty. Hence
     the tighter spacing on the right-hand half — the cans you actually need are
     the ones on the way home, and P·floor added the climb out of the sump,
     which is the thirstiest stretch on the floor. Deliberately clear of the
     authored hazards: the painted rock at 5150, the false floor at 3020, and
     both pinches. */
  fuel: [
    { x:  620, y: SLICE_AT.deck(620)  },
    { x: 1780, y: SLICE_AT.deck(1780) },
    { x: 2700, y: SLICE_AT.deck(2700) },
    { x: 3420, y: SLICE_AT.deck(3420) },
    { x: 4300, y: SLICE_AT.deck(4300) },
    { x: 5300, y: SLICE_AT.deck(5300) },
    { x: 6300, y: SLICE_AT.deck(6300) },
    { x: 7060, y: SLICE_AT.deck(7060) },
    { x: 7620, y: SLICE_AT.deck(7620) },
    { x: 8200, y: SLICE_AT.deck(8200) }
  ].map(f => Object.assign(f, { snap: "floor" }))
};

/* ===========================================================================
   THE FIRST TWO CHAMBERS, AND THE LADDER THEY START
   ---------------------------------------------------------------------------
   Owner, August 2026, on the chamber above after four on-device rounds:

     "As an actual first level in act two, this is still too hard, even after
      removing the false walls (that should come a lot later). This is because
      we've been building and testing the model. Don't lose this, but maybe this
      is level two — or even three. As with act one, our level design should
      progressively: ratchet up difficulty; introduce 1–2 new elements only per
      level (on the first level, the whole pendulum concept is new, as well as
      the new success criteria, etc); increase in size."

   That is a correct read of what the chamber above IS. It was built as a
   vertical slice — its job was to put every mechanic in one room so the loop
   could be judged end to end — and a room built to exercise everything at once
   is the exact opposite of a room built to teach one thing. Counted: it opens
   on a bank you must first deduce the feed of from three isolators (two of them
   decoys, one of those up a climb), and the haul crosses an authored rest gap,
   a 280px sump, a 540px climb, a structural column, three mezzanines, a
   momentum pinch you cannot creep through, and an armoured emplacement. Nine
   things, in the room where the tether itself is new.

   So it becomes chamber THREE, and the two below are what comes first. Nothing
   about it is lost — that was the owner's other instruction and it is the one
   worth honouring, because the geometry in it was tuned over four flights.

   THE LADDER, which is the part meant to outlive these two chambers. Act One's
   rule is one new element per sector (GAME_DESIGN §3, ACT_TWO_SPEC §11.1); the
   owner has widened it to 1–2 here, because Act Two's elements are smaller.
   Read down the "new" column and it is the teaching order:

     #  chamber        W      new this level                         built
     1  THE BREACH     5600   the tether · deliver to THE WELL       here
     2  THE WARDS      7200   the deduction (decoys) · an authored   here
                              gap the load must be settled for
     3  the slice      9000   the momentum pinch · the emplacement   above
     4  plant          9600   the deception tell (§8.1) · lights-out  P·content
     5  plant         10200   two banks in one room                  P·content
     6  deep line     10800   deep readers (live, unswitchable)      P·content
     7  deep line     11400   anomaly geology (Bundle Z gravity)     P·content
     8  deep line     12000   THE LAST HEART (§12)                   P·content
     9  the mask      12600   no fight — the husk                    P·content
    10  her           13200   one rescue, the climb, the quickening  P·content

   Three properties of that table are load-bearing and should survive any
   re-ordering of the rows:
     · SIZE IS MONOTONIC. 5600 is deliberately just past the widest surface
       sector (5500), which is §11.0's floor for a chamber — so chamber one is
       the smallest room that still satisfies "larger than any surface sector",
       and every later one is larger than the last.
     · AN ELEMENT IS INTRODUCED ALONE AND THEN COMPOUNDS. Chamber two adds the
       deduction to chamber one's tow; chamber three adds the pinch and the gun
       to both. Nothing is introduced in a room that also introduces something
       else it interacts with.
     · WHAT A CHAMBER TEACHES, IT TEACHES WITHOUT A HAZARD. Chamber one has no
       gap tighter than a hanging load, no gun and no deception, so the only way
       to fail it is to fly badly — which is what a first level is for.

   The beat table in ACT_TWO_SPEC §11.1 reads 1 entry / 2–5 plant / 6–8 deep
   line / 9 mask / 10 her. Three teaching chambers before the plant does not fit
   that, and re-cutting the act's narrative structure is the owner's call rather
   than mine, so it is left open and flagged in the roadmap. The assumption these
   two are authored under is the smallest one available: **the entry beat is
   three floors of her wreck rather than one**, which needs no re-dressing of
   anything (chamber three is already `plant: false` and furnished as hers) and
   costs the plant beat two floors. Both chambers are correct work whichever way
   that lands — only the labels move.
   =========================================================================== */

/* ---- chamber one: THE BREACH ---------------------------------------------
   AMS SOLACE's forward intake, opened to the rock by whatever put her down
   here. The emptiest, widest, best-lit room in the act, and it is emptiness on
   purpose: the only new verbs are the ones the whole of Act Two is built on.

   WHAT IT TEACHES, and it is two things:
     1. THE TETHER. Cut the feed at a breaker you can see from the bank, land on
        the lid, pull the mounts, and fly a mass that swings.
     2. THE SUCCESS CRITERION. A chamber is not cleared by killing anything or
        by reaching the far side — it is cleared by putting the people in that
        box into MERCY's bay. Nothing else in the room competes for attention
        with that.

   WHAT IT DELIBERATELY HAS NOT GOT: a second isolator (so there is nothing to
   deduce — one feed, one bank, and the run between them is traceable by eye,
   which is §7.1's own "placed-and-visible for the first chamber or two"), an
   authored gap of any tier, a gun, a deception, and a haul long enough to need
   the transfusion. Each of those arrives later, alone.

   The deck still rolls and the roof still moves, because a flat room is a dull
   room and P·floor's whole point was that the ground should change the swing —
   but the clear band never drops near the 105px a hanging load occupies, so the
   floor shapes the flight without ever threatening it. */
/* YOU HAVE TO BE ABLE TO SEE THE ROOF. The first pass ran bands of 590-850 the
   length of the floor, and the camera shows roughly 690px of world at this zoom
   — so from anywhere near the deck the ceiling was off the top of the screen and
   the first room in an UNDERGROUND act read as open sky. Bands here run 360-560
   for most of the floor and open out only at the well head, which is where the
   shaft goes up anyway and where a big room is the point. Nothing is near the
   147px a hanging load needs to be able to see its way through. */
const BREACH_HALL = [
  { x:  120, ceil: 620, floor: 1010, mt: MAT_MACH, mb: MAT_MACH },   // the west bulkhead   band 390
  { x:  560, ceil: 560, floor: 1030 },   // THE BANK, stood in the breach light   band 470
  { x: 1040, ceil: 600, floor: 1020, mt: MAT_ROCK },   //                         band 420
  { x: 1520, ceil: 640, floor: 1010 },   //   the roof comes down                 band 370
  { x: 2000, ceil: 620, floor: 1050 },   // THE BREAKER stands here               band 430
  { x: 2500, ceil: 560, floor: 1090 },   //   and the deck rolls away             band 530
  { x: 3000, ceil: 600, floor: 1070 },   //                                       band 470
  { x: 3450, ceil: 660, floor: 1020, mb: MAT_ROCK },   // THE LOW SPOT — tightest band 360
  { x: 3900, ceil: 620, floor: 1080 },   //                                       band 460
  { x: 4400, ceil: 560, floor: 1140, mb: MAT_MACH },   //   opening out           band 580
  { x: 4950, ceil: 520, floor: 1210 },   // THE WELL HEAD                         band 690
  { x: 5480, ceil: 540, floor: 1240 }    //                                       band 700
];
const BREACH_AT = hallRefs(BREACH_HALL);

const BREACH_CHAMBER = {
  id: "breach", n: 1, name: "THE BREACH", seed: 40771, W: 5600, H: 1500, zone: "cyan",
  plant: false,
  matTop: MAT_ROCK, matBot: MAT_MACH,
  /* The intro card's copy (roadmap P·content, owner August 2026: "a little
     allusion to the fact we are under Solace's wreck, seeing the remains of her
     attempts to keep her people alive"). Carried on the chamber so it is
     authored beside the geometry it explains and cannot be merged without it;
     the QA harness shows it on load, and P·content wires it into BRIEFS. */
  brief: "Her forward intake, opened to the rock. One bank still on mains, and "
       + "the light coming in is daylight she never saw.",
  parts: partList([
    /* --- the air ------------------------------------------------------- */
    // THE BREACH itself: a hole up through her hull at the west end. Not an
    // exit — you cannot leave that way — it is where the light falls on the bank.
    shaft(300, 300, { top: 120, bot: 700, roughTop: 26 }),
    hall(BREACH_HALL, { roughTop: 30, roughBot: 16 }),
    // the roof lifts over the middle so the widest air is not also the flattest
    /* A gallery lifts the ROOF. Its `floor` only has to reach down into the
       hall's air — set below the deck it digs a trench the depth of the
       difference, with a step at each end that no station list shows and that
       any fixture sited near it then floats on. Kept above the deck (which runs
       1070-1090 here) and with zero floor roughness, so it touches the ceiling
       and nothing else. */
    gallery(2450, 620, { top: 470, floor: 1000, rise: 60, roughBot: 0 }),
    // THE WELL SHAFT — open to the top of the world, and the way out (§11.1)
    shaft(4820, 360, { top: 0, bot: 1400, roughTop: 0, exit: true }),

    /* --- the rock ------------------------------------------------------ */
    /* The one overhang. It is 620px east of the bank, which is the P·floor
       correction applied before it could bite: an overhang at hanging-load
       height in the first metre of a haul is clipped on every single run. Its
       underside leaves 290px and the air over it 245px, so BOTH ways past it
       are comfortable — in this chamber an overhang is scenery you learn to
       read, not a choice with a wrong answer. */
    /* Moved east with the roof. An overhang needs a comfortable route BOTH ways
       past it — about 2x160 of clearance plus its own thickness — and the band
       west of the gallery is now 370-470px, which cannot hold one. It sits in
       the 580px air on the way in from the well instead, where it leaves 227px
       over and 219px under. Still 3700px clear of the bank, so a fresh load
       never meets it in the first metre of a haul (the P·floor rule). */
    shelf(4300, 380, { y: 800, h: 110 }),
    // a plinth to set down on and think, in the middle of the floor
    bench(2400, 260, { y: 1000 }),
    // teeth off the raw roof, well clear of anything — the ceiling should not
    // be a ruled line just because nothing is asked of it here
    // (see the authoring rule on stalactites(): the top starts well above the
    // roughest roof across the whole width, or the comb leaves a slot over it)
    stalactites(3300, 200, { y: 480, h: 240, n: 3, dy: 60 })
  ]),
  lights: [
    { x:  420, y:  260, r: 480, snap: "ceil", fit: 2.6 },                    // down the breach
    { x:  620, y: BREACH_AT.deck(620),  r: 340, snap: "floor", warm: true },
    { x:  900, y: BREACH_AT.roof(900),  r: 440, snap: "ceil" },
    { x: 1340, y: BREACH_AT.deck(1340), r: 320, snap: "floor", warm: true },
    { x: 1560, y: BREACH_AT.roof(1560), r: 420, snap: "ceil" },
    { x: 1940, y: BREACH_AT.roof(1940), r: 380, snap: "ceil" },
    { x: 2180, y: BREACH_AT.deck(2180), r: 320, snap: "floor", warm: true },
    { x: 2620, y: BREACH_AT.roof(2620), r: 460, snap: "ceil", fit: 2.2 },
    { x: 2980, y: BREACH_AT.deck(2980), r: 340, snap: "floor", warm: true },
    { x: 3140, y: BREACH_AT.roof(3140), r: 400, snap: "ceil" },
    { x: 3640, y: BREACH_AT.roof(3640), r: 380, snap: "ceil" },
    { x: 3820, y: BREACH_AT.deck(3820), r: 320, snap: "floor", warm: true },
    { x: 4180, y: BREACH_AT.roof(4180), r: 420, snap: "ceil" },
    { x: 4460, y: BREACH_AT.deck(4460), r: 340, snap: "floor", warm: true },
    { x: 4640, y: BREACH_AT.roof(4640), r: 400, snap: "ceil" },
    { x: 5000, y: 1330, r: 400, snap: "floor" }                              // the well shaft
  ],
  /* Hers, wrecked, and almost nothing of his — this is the first room in the
     act and the ratio is the story's opening statement (§11.1). One cable loom
     and one reader head are the only signs anyone has been down here since. */
  ornaments: [
    { type: "stretcherBay", x:  760, y: BREACH_AT.deck(760),  w: 96, h: 150, snap: "floor", owner: "hers", state: "dead" },
    { type: "medCrates",    x:  920, y: BREACH_AT.deck(920),  w: 88, h: 168, n: 3, snap: "floor", owner: "hers", state: "dead" },
    { type: "gantry",       x:  840, y: BREACH_AT.roof(840),  w: 260, snap: "ceil", owner: "hers", state: "dead" },
    { type: "oxyBank",      x: 1400, y: BREACH_AT.deck(1400), w: 92, h: 96, n: 4, snap: "floor", owner: "hers", state: "failing" },
    { type: "dripStand",    x: 1620, y: BREACH_AT.deck(1620), h: 110, snap: "floor", owner: "hers", state: "dead" },
    { type: "ventGrate",    x: 2260, y: BREACH_AT.deck(2260), w: 70, h: 90, snap: "floor", owner: "hers", state: "dead" },
    { type: "cableLoom",    x: 2060, y: BREACH_AT.deck(2060), w: 200, snap: "floor", owner: "his", state: "live" },
    { type: "conduitRun",   x: 2760, y: BREACH_AT.deck(2760), w: 420, snap: "floor", owner: "his", state: "live" },
    { type: "medCrates",    x: 3020, y: BREACH_AT.deck(3020), w: 84, h: 104, n: 2, snap: "floor", owner: "hers", state: "dead" },
    { type: "stretcherBay", x: 3860, y: BREACH_AT.deck(3860), w: 96, h: 150, snap: "floor", owner: "hers", state: "dead" },
    { type: "gantry",       x: 4120, y: BREACH_AT.roof(4120), w: 240, snap: "ceil", owner: "hers", state: "dead" },
    { type: "readerHead",   x: 4380, y: BREACH_AT.deck(4380), w: 76, h: 54, snap: "floor", owner: "his", state: "live" },
    { type: "medCrates",    x: 4560, y: BREACH_AT.deck(4560), w: 90, h: 130, n: 3, snap: "floor", owner: "hers", state: "dead" }
  ],
  racks: [
    { id: "r1", x: 560, y: BREACH_AT.deck(560), occupants: 8, label: "BANK 1 · 8 SOULS", snap: "floor" }
  ],
  /* ONE feed, and the breaker is 1440px east of the bank — far enough that the
     run has to be followed and near enough that it can be, which is the whole
     of §7.1 in chamber one. There is nothing to deduce here on purpose: the
     deduction is chamber two's element and putting it in the room where the
     tether is new is what made the slice chamber a bad first level. */
  conduits: [
    { id: "c1", rack: "r1", real: true, x: 2000, y: BREACH_AT.deck(2000), snap: "floor",
      label: "ISOLATOR 1" }
  ],
  decoys: [],
  turrets: [],
  well: { x: 5000, y: 700 },
  /* Generous, and weighted to the laden leg exactly as chamber three's are. A
     first level should never be lost to arithmetic the player has had no chance
     to learn. */
  fuel: [
    { x:  860 }, { x: 1700 }, { x: 2340 }, { x: 2900 },
    { x: 3560 }, { x: 4020 }, { x: 4520 }, { x: 4880 }
  ].map(f => Object.assign(f, { y: BREACH_AT.deck(f.x), snap: "floor" }))
};

/* ---- chamber two: THE WARDS -----------------------------------------------
   One deck down, and the first room where the answer is not in front of you.
   This was her ward deck: rows of bays, oxygen at the head of each, and it is
   where his cabling stops being occasional and starts being everywhere.

   WHAT IT ADDS, and it is two things:
     1. THE DEDUCTION (§7.1). Three breakers, one bank that matters and two that
        are his — same size, same mounting, same beat, so they cannot be told
        apart by looking. Going to check one costs vitals. Cutting the wrong
        line costs you nothing but time here, and time is the resource the
        reserve is spending. One of the decoy banks is up on a mezzanine, so
        the cheap answer costs a climb.
     2. AN AUTHORED GAP AT THE REST TIER. The first place the floor asks you to
        stop carrying speed and let the load hang still before you thread it.
        Sized from `restGapPx()`, so it moves with the sling and can never
        silently become a momentum pinch — which is chamber three's element and
        must not arrive early.

   Still no gun, no deception, and no momentum pinch. The haul is roughly half
   again chamber one's, which is what makes the transfusion worth reaching for
   once rather than a mechanic you are forced through on your first tow. */
const WARDS_HALL = [
  /* The deck is cut as BAYS AND RAMPS, deliberately, and it is the authoring
     rule chamber two exists to demonstrate as much as the deduction is: an
     ornament's ground has to stay inside the tilt clamp (ORN_TILT_MAX), so
     elevation change belongs in stretches nobody stands furniture on. The
     first pass ran a single 14.6-degree grade through the middle of the ward
     and put six pieces of furniture on it; they all clamped, and clamped
     furniture reads as debris. Flat bays carry the rooms, ramps carry the
     descent, and the fixture guard is what says which is which. */
  { x:  140, ceil: 620, floor: 1140, mt: MAT_MACH, mb: MAT_MACH },   // west bulkhead    band 520
  { x:  600, ceil: 560, floor: 1150 },   // THE WARD HEAD — the bank stands    band 590
  { x: 1240, ceil: 600, floor: 1150 },   //   bay: flat, and furnished         band 550
  { x: 1640, ceil: 700, floor: 1120, mt: MAT_ROCK },   // the roof comes down  band 420
  { x: 2000, ceil: 760, floor: 1100, mb: MAT_ROCK },   // THE SLOT             band 340
  { x: 2320, ceil: 760, floor: 1100 },   //   flat across the authored gap     band 340
  { x: 3000, ceil: 660, floor: 1230, mb: MAT_MACH },   //   the ramp down      band 570
  { x: 3400, ceil: 620, floor: 1280 },   // THE LONG WARD (domed — see below)  band 660
  { x: 3900, ceil: 610, floor: 1280 },   //   bay: flat, and furnished         band 670
  { x: 4400, ceil: 560, floor: 1200 },   //   the ramp up, under the mezzanine band 640
  { x: 4900, ceil: 620, floor: 1160, mb: MAT_ROCK },   // THE NARROWS          band 540
  { x: 5600, ceil: 600, floor: 1170 },   //   bay: flat, and furnished         band 570
  { x: 6100, ceil: 560, floor: 1250, mb: MAT_MACH },   //   opening out        band 690
  { x: 6600, ceil: 520, floor: 1330 },   // THE WELL HEAD                      band 810
  { x: 7080, ceil: 550, floor: 1360 }    //                                    band 810
];
const WARDS_AT = hallRefs(WARDS_HALL);

const WARDS_CHAMBER = {
  id: "wards", n: 2, name: "THE WARDS", seed: 51884, W: 7200, H: 1800, zone: "cyan",
  plant: false,
  matTop: MAT_ROCK, matBot: MAT_MACH,
  brief: "Her ward deck. The beds are still in their rows, and someone has run "
       + "new cable over every one of them.",
  parts: partList([
    /* --- the air ------------------------------------------------------- */
    shaft(360, 280, { top: 160, bot: 820, roughTop: 26 }),
    hall(WARDS_HALL, { roughTop: 34, roughBot: 18 }),
    // a dome over the long ward, so the low ground reads as a room and not a
    // ditch — and it is what gives the mezzanine below air above it as well as
    // under it, which is what an overhang has to have to be a choice
    // above the deck (1266-1280 here) and no floor roughness — see the note on
    // chamber one's gallery: a gallery that reaches below the deck digs a trench
    gallery(3160, 800, { top: 420, floor: 1200, rise: 80, roughBot: 0 }),
    shaft(6100, 360, { top: 0, bot: 1720, roughTop: 0, exit: true }),

    /* --- the rock ------------------------------------------------------ */
    /* THE SLOT. An ordinary tight spot at the derived rest gap — the first
       laden stretch out of the ward head, which is the teaching: what a hanging
       load asks first is that you stop barrelling along. On FLAT deck, because
       pinch() pins the floor to one height and a pinch authored across a grade
       puts a step inside the one gap in the room that has to be read exactly. */
    pinch(2020, 260, "rest", { floor: 1100 }),
    // teeth off the raw roof. Top well above the roughest ceiling across the
    // whole width — see the authoring rule on stalactites()
    stalactites(1760, 220, { y: 470, h: 320, n: 4, dy: 70 }),
    /* The overhang, under the dome. You meet it unladen on the way west and it
       is 2600px clear of the bank, so a fresh load never has to negotiate it in
       the first metre of a haul (the P·floor correction). Both ways past are
       generous: ~300px over it and ~510px under. */
    shelf(3260, 440, { y: 640, h: 130 }),
    // a plinth to set down on, in the flat bay before the narrows
    bench(4820, 240, { y: 1080 }),
    /* The mezzanine the wall-mounted decoy is racked on. East of the slot, so
       the climb to go and look at it is a decision made with the load already
       moving — which is what gives "is it worth checking" a price. */
    shelf(4380, 420, { y: 780, h: 130 })
  ]),
  lights: [
    { x:  480, y:  300, r: 460, snap: "ceil", fit: 2.5 },
    { x:  660, y: WARDS_AT.deck(660),  r: 340, snap: "floor", warm: true },
    { x:  980, y: WARDS_AT.roof(980),  r: 440, snap: "ceil" },
    { x: 1300, y: WARDS_AT.deck(1300), r: 320, snap: "floor", warm: true },
    { x: 1480, y: WARDS_AT.roof(1480), r: 400, snap: "ceil" },
    { x: 1900, y: WARDS_AT.deck(1900), r: 300, snap: "floor", warm: true },
    { x: 2400, y: WARDS_AT.roof(2400), r: 360, snap: "ceil" },
    { x: 2700, y: WARDS_AT.deck(2700), r: 340, snap: "floor", warm: true },
    { x: 2960, y: WARDS_AT.roof(2960), r: 420, snap: "ceil" },
    { x: 3520, y: WARDS_AT.roof(3520), r: 460, snap: "ceil", fit: 2.2 },
    { x: 3560, y: WARDS_AT.deck(3560), r: 340, snap: "floor", warm: true },
    { x: 3820, y: WARDS_AT.roof(3820), r: 420, snap: "ceil" },
    { x: 3980, y: WARDS_AT.deck(3980), r: 320, snap: "floor", warm: true },
    { x: 4560, y: WARDS_AT.roof(4560), r: 380, snap: "ceil" },
    { x: 4760, y: WARDS_AT.deck(4760), r: 300, snap: "floor", warm: true },
    { x: 5080, y: WARDS_AT.roof(5080), r: 400, snap: "ceil" },
    { x: 5260, y: WARDS_AT.deck(5260), r: 340, snap: "floor", warm: true },
    { x: 5560, y: WARDS_AT.roof(5560), r: 420, snap: "ceil" },
    { x: 5960, y: WARDS_AT.deck(5960), r: 340, snap: "floor", warm: true },
    { x: 6060, y: WARDS_AT.roof(6060), r: 400, snap: "ceil" },
    { x: 6600, y: WARDS_AT.deck(6600), r: 340, snap: "floor", warm: true },
    { x: 6800, y: WARDS_AT.roof(6800), r: 420, snap: "ceil" },
    { x: 6280, y: 1650, r: 380, snap: "floor" }                            // the well shaft
  ],
  /* The ratio has moved. Chamber one had two pieces of his in thirteen; this
     room has six in twenty-one, and they are all `live` while hers are dead or
     failing. Nobody says so — you read it off the furniture (§11.1).
     Every piece stands in one of the flat bays: 140-1240, 3400-3900,
     5140-5600 and 6600 east. The ramps between them carry no furniture, and
     neither does the ground inside a plinth's own fillets — a bench eases its
     ends over `radius` px and that ease is deck slope like any other, which is
     what caught two pieces here after the grades were already fixed. */
  ornaments: [
    { type: "stretcherBay", x:  760, y: WARDS_AT.deck(760),  w: 96, h: 150, snap: "floor", owner: "hers", state: "dead" },
    { type: "oxyBank",      x:  880, y: WARDS_AT.deck(880),  w: 92, h: 96, n: 4, snap: "floor", owner: "hers", state: "failing" },
    { type: "gantry",       x:  860, y: WARDS_AT.roof(860),  w: 280, snap: "ceil", owner: "hers", state: "dead" },
    { type: "cableLoom",    x: 1020, y: WARDS_AT.deck(1020), w: 220, snap: "floor", owner: "his", state: "live" },
    { type: "dripStand",    x: 1180, y: WARDS_AT.deck(1180), h: 110, snap: "floor", owner: "hers", state: "dead" },
    { type: "medCrates",    x:  980, y: WARDS_AT.deck(980),  w: 88, h: 168, n: 3, snap: "floor", owner: "hers", state: "dead" },
    { type: "readerHead",   x: 1120, y: WARDS_AT.deck(1120), w: 76, h: 54, snap: "floor", owner: "his", state: "live" },
    { type: "conduitRun",   x:  620, y: WARDS_AT.deck(620),  w: 460, snap: "floor", owner: "his", state: "live" },
    { type: "stretcherBay", x: 3460, y: WARDS_AT.deck(3460), w: 96, h: 150, snap: "floor", owner: "hers", state: "dead" },
    { type: "oxyBank",      x: 3580, y: WARDS_AT.deck(3580), w: 92, h: 96, n: 4, snap: "floor", owner: "hers", state: "dead" },
    { type: "medCrates",    x: 3720, y: WARDS_AT.deck(3720), w: 90, h: 216, n: 4, snap: "floor", owner: "hers", state: "dead" },
    { type: "pumpSet",      x: 3840, y: WARDS_AT.deck(3840), w: 150, h: 64, snap: "floor", owner: "his", state: "live" },
    { type: "conduitRun",   x: 3440, y: WARDS_AT.deck(3440), w: 440, snap: "floor", owner: "his", state: "live" },
    { type: "gantry",       x: 3600, y: WARDS_AT.roof(3600), w: 300, snap: "ceil", owner: "hers", state: "dead" },
    { type: "cableLoom",    x: 5200, y: WARDS_AT.deck(5200), w: 170, snap: "floor", owner: "his", state: "live" },
    { type: "dripStand",    x: 5260, y: WARDS_AT.deck(5260), h: 110, snap: "floor", owner: "hers", state: "dead" },
    { type: "ventGrate",    x: 5330, y: WARDS_AT.deck(5330), w: 70, h: 90, snap: "floor", owner: "hers", state: "dead" },
    { type: "stretcherBay", x: 5420, y: WARDS_AT.deck(5420), w: 96, h: 150, snap: "floor", owner: "hers", state: "failing" },
    { type: "medCrates",    x: 6560, y: WARDS_AT.deck(6560), w: 84, h: 104, n: 2, snap: "floor", owner: "hers", state: "dead" },
    { type: "readerHead",   x: 6700, y: WARDS_AT.deck(6700), w: 76, h: 54, snap: "floor", owner: "his", state: "live" },
    { type: "gantry",       x: 6620, y: WARDS_AT.roof(6620), w: 240, snap: "ceil", owner: "hers", state: "dead" },
    { type: "conduitRun",   x: 6480, y: WARDS_AT.deck(6480), w: 400, snap: "floor", owner: "his", state: "live" }
  ],
  racks: [
    { id: "r1", x: 600, y: WARDS_AT.deck(600), occupants: 11, label: "BANK 1 · 11 SOULS", snap: "floor" }
  ],
  conduits: [
    { id: "c1", rack: "r1", real: true,  x: 2700, y: WARDS_AT.deck(2700), snap: "floor",
      label: "ISOLATOR 1" },
    { id: "c2", rack: null, real: false, x: 3980, y: WARDS_AT.deck(3980), snap: "floor",
      label: "ISOLATOR 2" },
    { id: "c3", rack: null, real: false, x: 5260, y: WARDS_AT.deck(5260), snap: "floor",
      label: "ISOLATOR 3" }
  ],
  /* Same size, same mounting, same beat as the real bank — if any of that
     differed a decoy would be identifiable by looking and §7.1's deduction
     would be decoration. One is racked on the mezzanine, which is the mount a
     plant uses for a bank it does not want on the walking floor. */
  decoys: [
    { id: "d1", conduit: "c2", x: 3620, y: WARDS_AT.deck(3620), snap: "floor", label: "BANK 2 · 11 SOULS" },
    { id: "d2", conduit: "c3", x: 4560, y: 700, snap: "floor", mount: "wall", label: "BANK 3 · 10 SOULS" }
  ],
  turrets: [],
  well: { x: 6280, y: 820 },
  fuel: [
    { x:  900 }, { x: 1560 }, { x: 2400 }, { x: 3060 }, { x: 3660 },
    { x: 4240 }, { x: 4700 }, { x: 5340 }, { x: 5860 }, { x: 6200 }
  ].map(f => Object.assign(f, { y: WARDS_AT.deck(f.x), snap: "floor" }))
};

/* IN PLAY ORDER, which is also the order the ladder above reads in. `n` on each
   chamber is its position, so nothing has to infer it from this array's index —
   __doids.loadChamber takes either an id or a number, and a chamber that is
   later re-ordered carries its own answer. */
const ACT_TWO_CHAMBERS = [BREACH_CHAMBER, WARDS_CHAMBER, SLICE_CHAMBER];

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
