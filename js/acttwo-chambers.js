"use strict";
/* =============================================================================
   js/acttwo-chambers.js — THE AUTHORED CHAMBERS. Data, not machinery.

   Split out of js/acttwo-data.js (August 2026), before P·content authors seven
   more. The vocabulary that makes a chamber (`hall`/`shelf`/`column`/`pinch`/…,
   the compiler, the builders) stayed there; what lives here is the three
   chambers written WITH it, and nothing else. Three chambers were already ~700
   of that file's 2,145 lines, so ten would have made it a second render.js —
   and the two halves change for different reasons: the vocabulary changes when
   terrain gains a capability, this file changes every time someone authors a
   floor.

   Load order: after js/acttwo-data.js (SLICE_AT and friends call `hallRefs` at
   load time, so the vocabulary must already exist) and before the -render and
   -update files. Scripts share one global scope — nothing is imported.

   THE TEACHING LADDER — what each chamber introduces, and why size is monotonic
   — is the comment block above BREACH_CHAMBER below. That block is the thing
   P·content authors against; read it before adding chamber four.

     SLICE_HALL / SLICE_AT / SLICE_CHAMBER ..... chamber 3, "THE THEATRE"
     BREACH_HALL / BREACH_AT / BREACH_CHAMBER .. chamber 1, "THE INTAKE"
     WARDS_HALL / WARDS_AT / WARDS_CHAMBER ..... chamber 2, "THE WARDS"
     ACT_TWO_CHAMBERS ......................... the ladder, in play order
   ============================================================================= */

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

const SLICE_AT = hallRefs(SLICE_HALL);

/* CHAMBER THREE, and the id stays `slice`. It is the vertical slice — that is
   what it was built as and what every one of its ~20 test call sites, the QA
   harness and four rounds of notes call it — and the id is not player-facing.
   Renaming it would be twenty edits to buy nothing a comment cannot say: this
   is the THIRD chamber now (owner, August 2026), and THE INTAKE and THE WARDS
   come before it. See the ladder above BREACH_CHAMBER. */
const SLICE_CHAMBER = {
  id: "slice", n: 3, name: "THE THEATRE", seed: 90210, W: 9000, H: 2050, zone: "cyan",
  brief: "The deepest room she finished, and the best cut of the three. He set "
       + "up in it because she had already done the hard part.",
  // P·intake — the clock is nearly full rate by the third floor; see the ladder
  // above BREACH_CHAMBER for the whole ramp, and rackPace() for what it scales
  pace: 0.9,
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

     #  chamber        W    pace  new this level                       built
     1  THE INTAKE     5600  0.6  the tether · deliver to THE WELL      here
     2  THE WARDS      7200 0.75  the deduction (decoys) · an authored  here
                                  gap the load must be settled for
     3  THE THEATRE    9000  0.9  the momentum pinch · the emplacement  above
     4  plant          9600    1  the deception tell (§8.1) · lights-out P·content
     5  plant         10200    1  two banks in one room                 P·content
     6  deep line     10800    1  deep readers (live, unswitchable)     P·content
     7  deep line     11400    1  anomaly geology (Bundle Z gravity)    P·content
     8  deep line     12000    1  THE LAST HEART (§12)                  P·content
     9  the mask      12600    1  no fight — the husk                   P·content
    10  her           13200    1  one rescue, the climb, the quickening P·content

   `pace` is P·intake's: how fast a bank dies here, scaling both the continuous
   drain and the beat's bite (rackPace(), js/acttwo-data.js). It is a fourth
   monotonic column and it belongs in this table rather than in a tuning file,
   because the clock is the difficulty of a rescue level — chamber one gives 129
   seconds from the cut, the full rate gives 77, and an author choosing a pace is
   choosing how much room the element being taught has to be learned in. From
   four it is 1, so nothing later needs a value typed.

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

   THE FICTION THAT CARRIES THREE FLOORS, decided by the owner in August 2026
   and written up as ACT_TWO_SPEC §5.1b. They are NOT three floors of her hull —
   the player has measured that hull against their own ship for a whole act and
   it cannot hold them. They are three floors **she built**: after she came down
   and before Glycon took anyone, her crew went into the caves under her and cut
   a field hospital to keep two hundred and fourteen people alive. Intake, wards,
   theatre, in the order any field hospital is built in.
   It costs the plant beat two levels (§11.1 is now 1–3 hers / 4–6 plant / 7–8
   deep line) and it buys a **seam** at chamber four the act did not have — you
   stop being in a place built for people and start being in a facility that was
   never meant for any. It also explains, for free, three things that were
   already true and unmotivated: why the furniture is a hospital's, why "rock
   overhead, mechanical underfoot" (she never cut the roof; she laid every deck
   plate), and why a chamber may be larger than any surface sector.
   =========================================================================== */

/* ---- chamber one: THE INTAKE ---------------------------------------------
   NOT a room in AMS SOLACE. A room she BUILT — ACT_TWO_SPEC §5.1b, owner
   decision August 2026: the player has measured her 320px hull against their own
   ship for a whole act, so she cannot hold three floors of interior and must not
   be stretched to try. What she can hold is what her crew did after she came
   down and before Glycon took anyone: they went into the caves under her and cut
   somewhere to keep two hundred and fourteen people alive. Three floors, decked
   by hand. Intake, wards, theatre — the order a field hospital is built in, and
   the order you descend through them.

   This is the first of them: triage. Where they carried people down out of the
   ship and decided who was seen first. The emptiest, widest, best-lit room in
   the act, and the emptiness is the point twice over — the beds are gone because
   he took them, and the only new verbs are the ones all of Act Two is built on.

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
  { x:  560, ceil: 560, floor: 1030 },   // THE BANK, under the downshaft light   band 470
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
  id: "breach", n: 1, name: "THE INTAKE", seed: 40771, W: 5600, H: 1500, zone: "cyan",
  plant: false,
  /* P·intake (owner, August 2026: "slow the vitals decay of the racks, certainly
     in the earlier levels"). The slowest clock in the act, because this is the
     room where cutting a feed is a thing you have never done: 129s to flatline
     against the full rate's 77s, on a floor that asks for a 4,440px laden haul
     and at least two fuel stops. See rackPace() for what it scales and why both
     terms take the same factor. */
  pace: 0.6,
  matTop: MAT_ROCK, matBot: MAT_MACH,
  /* The intro card's copy (roadmap P·content, owner August 2026: "a little
     allusion to the fact we are under Solace's wreck, seeing the remains of her
     attempts to keep her people alive"). Carried on the chamber so it is
     authored beside the geometry it explains and cannot be merged without it;
     the QA harness shows it on load, and P·content wires it into BRIEFS. */
  brief: "She cut this floor herself, and decked it, and carried them down into "
       + "it. His racks are standing where her beds were.",
  parts: partList([
    /* --- the air ------------------------------------------------------- */
    // THE DOWNSHAFT her crew cut at the west end — the way they brought people
    // in from the wreck above. Not an exit; you cannot leave that way. It is
    // where the light still falls, onto the bank standing where her beds were.
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
     act and the ratio is the story's opening statement (§5.1b, §11.1). Every
     piece of it is a field hospital's, because that is what this floor was: she
     built it, ran it, and it stopped mid-shift. One cable loom and one reader
     head are the only signs he has been up this far. */
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
   The second floor she cut (§5.1b), and the first room where the answer is not
   in front of you. Where triage sent them: rows of bays, oxygen at the head of
   each, and it is where his cabling stops being occasional and starts being
   everywhere. He came UP into her floors to use them, so the higher you are in
   her workings the more of her is left — the gradient runs the other way from
   the one a player expects, and that is deliberate.

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
  // P·intake — one step up from chamber one, and the deduction has to be paid for
  // out of the same clock, so it is a step and not a jump
  pace: 0.75,
  matTop: MAT_ROCK, matBot: MAT_MACH,
  brief: "Where triage sent them. The bays are still in their rows, and someone "
       + "has run new cable over every one of them.",
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
     failing. Nobody says so — you read it off the furniture (§5.1b, §11.1).
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
