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

// r − √(r²−d²) at each end, so both boundaries curve in to meet the wall
function cornerInset(radius, x, x0, w) {
  if (!radius) return 0;
  const d = Math.min(x - x0, x0 + w - x);
  if (d >= radius || d < 0) return 0;
  return radius - Math.sqrt(Math.max(0, radius * radius - d * d));
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
const SLICE_CHAMBER_V1_LETTERBOX = null;   // (kept as a marker: see the note below)

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
   she lowers the well deeper as you clear). */
const SLICE_CHAMBER = {
  id: "slice", name: "INTAKE", seed: 90210, W: 9000, H: 2050, zone: "cyan",
  /* SOLACE's breached intake is beat 1; the plant proper is 2–5 (spec §11.1), so
     this chamber is NOT dressed as a plant — `plant` stays false and the machined
     surfaces read as her own wrecked intake gear rather than his facility. */
  plant: false,
  // the owner rule: raw rock overhead, mechanical underfoot
  matTop: MAT_ROCK, matBot: MAT_MACH,
  parts: [
    // the way IN, dropping from the floor above
    { op: "room", x: 240,  y: 60,   w: 300,  h: 560, roughTop: 6,  roughBot: 0 },
    // THE WORKING HALL — one floor, 8km of it. Rock ceiling, paved floor.
    { op: "room", x: 150,  y: 520,  w: 8050, h: 620, roughTop: 44, roughBot: 22 },

    // mezzanines: milled pad on top to land on, raw rock underneath to fly beneath
    { op: "rock", x: 1400, y: 700,  w: 900,  h: 150, roughTop: 10, roughBot: 24,
      mt: MAT_MACH, mb: MAT_ROCK },
    { op: "rock", x: 5600, y: 720,  w: 850,  h: 150, roughTop: 10, roughBot: 24,
      mt: MAT_MACH, mb: MAT_ROCK },
    // stalactite teeth off the raw ceiling
    { op: "rock", x: 2500, y: 500,  w: 520,  h: 90,  roughBot: 8,
      profBot: { kind: "teeth", n: 6, dy: 95 }, mt: MAT_ROCK, mb: MAT_ROCK },
    // the pinch between two bays of the hall — squeeze under it
    { op: "rock", x: 3100, y: 500,  w: 300,  h: 540, roughBot: 8, mb: MAT_ROCK },
    // a structural pillar, floor to ceiling
    { op: "rock", x: 4600, y: 440,  w: 210,  h: 800, mt: MAT_MACH },
    // a domed machined bay off the hall — the immaculate end of the range
    { op: "room", x: 6800, y: 560,  w: 800,  h: 560, roughTop: 8, roughBot: 8,
      profTop: { kind: "arc", dy: -150 }, radius: 110, mt: MAT_MACH, mb: MAT_MACH },
    // a ramped stretch of floor, so not every landing on this floor is level
    { op: "room", x: 7450, y: 700,  w: 780,  h: 440, roughTop: 20, roughBot: 8,
      profBot: { kind: "ramp", dy: 190 }, mt: MAT_ROCK, mb: MAT_MACH },
    // THE WAY DOWN, at the end of the floor — the next chamber's entrance
    { op: "room", x: 8250, y: 700,  w: 430,  h: 1250, roughTop: 8, roughBot: 10,
      radius: 60, mt: MAT_ROCK, mb: MAT_MACH },

    /* ---- §8's two hazards, as the only two parts that differ between the
       views. Neither has its tell yet (P·systems); what matters here is that
       the terrain model can hold them at all. */
    // FALSE FLOOR — drawn as a milled ledge, absent from collision. Commit to
    // landing on it and you drop to the real hall floor ~140px below.
    { op: "rock", x: 2050, y: 1000, w: 420,  h: 60, mt: MAT_MACH, mb: MAT_MACH,
      view: "drawn" },
    // PAINTED ROCK — a real outcrop that is never drawn. Looks like open hall.
    { op: "rock", x: 5150, y: 700,  w: 260,  h: 460, roughBot: 10, view: "solid" }
  ],
  /* Light sources, because a maintained facility is lit BY something (owner
     ask, July 2026 — brighter, via lots of light sources). Two jobs at once: it
     lifts the room, and each fixture is a point of interest in an otherwise even
     floor. `snap` puts a fixture on the surface it belongs to, so retuning the
     terrain can't leave one buried in rock or floating in a hall. */
  lights: [
    { x: 500,  y: 560,  r: 420, snap: "ceil" },
    { x: 1150, y: 560,  r: 380, snap: "ceil" },
    { x: 1850, y: 1100, r: 300, snap: "floor", warm: true },
    { x: 2750, y: 560,  r: 340, snap: "ceil" },
    { x: 3550, y: 560,  r: 400, snap: "ceil" },
    { x: 4300, y: 1100, r: 320, snap: "floor", warm: true },
    { x: 5000, y: 560,  r: 360, snap: "ceil" },
    { x: 5900, y: 560,  r: 380, snap: "ceil" },
    { x: 7150, y: 620,  r: 440, snap: "ceil" },
    { x: 7800, y: 1100, r: 320, snap: "floor", warm: true },
    { x: 8450, y: 900,  r: 400, snap: "ceil" },
    { x: 8450, y: 1850, r: 360, snap: "floor" }
  ],
  /* dressing. These are #69's existing ornaments (js/acttwo-render.js), which
     were built and then never switched on by any level — conduitRun in
     particular runs a light along its length on the rack's own heartbeat.
     `snap` sits an ornament on the floor of whatever span its y falls in, so a
     retune of the terrain doesn't leave the furniture hovering. */
  ornaments: [
    { type: "conduitRun",   x: 620,  y: 1100, w: 460, snap: "floor" },
    { type: "rackingFrame", x: 1500, y: 1100, w: 90,  h: 140, snap: "floor" },
    { type: "ventGrate",    x: 2350, y: 1100, w: 70,  h: 90,  snap: "floor" },
    { type: "conduitRun",   x: 3600, y: 1100, w: 520, snap: "floor" },
    { type: "junctionTruss",x: 4950, y: 1100, scale: 1.2, snap: "floor" },
    { type: "rackingFrame", x: 5750, y: 860,  w: 90,  h: 140, snap: "floor" },
    { type: "ventGrate",    x: 6500, y: 1100, w: 70,  h: 90,  snap: "floor" },
    { type: "conduitRun",   x: 7000, y: 1100, w: 480, snap: "floor" },
    { type: "conduitRun",   x: 8300, y: 1900, w: 320, snap: "floor" }
  ]
};
const ACT_TWO_CHAMBERS = [SLICE_CHAMBER];

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
function snapToSurface(list, spans) {
  return (list || []).map(o => {
    if (!o.snap) return Object.assign({}, o);
    const col = spans[clamp(Math.round(o.x / STEP), 0, spans.length - 1)] || [];
    const sp = pickSpan(col, o.y);
    if (!sp) return Object.assign({}, o);
    return Object.assign({}, o, o.snap === "ceil"
      ? { y: sp.top + 10 }                       // hung from the ceiling
      : { y: sp.bot - (o.h || 0) - 2 });         // standing on the floor
  });
}

function genChamber(ch) {
  /* Two views compiled from one definition (see chamberLies): `spans` is the
     truth collision uses, `spansDrawn` is what the renderer shows. They are the
     SAME array unless the chamber declares a deception, so an honest chamber
     costs nothing and cannot disagree with itself. */
  const spans = compileChamber(ch, "solid");
  const drawn = chamberLies(ch) ? compileChamber(ch, "drawn") : spans;
  return {
    n: 0, W: ch.W, H: ch.H, spans, spansDrawn: drawn, chamberId: ch.id,
    isChamber: true, isPlant: !!ch.plant, plantZone: ch.zone, dark: false,
    // ornaments and lights are placed against what is REALLY there, not against
    // the lie — a fixture bolted to a floor that doesn't exist would give it away
    plantOrnaments: snapToSurface(ch.ornaments, spans),
    lights: snapToSurface(ch.lights, spans),
    oids: [], turrets: [], bullets: [], shots: [], drones: [], pods: [],
    fakePods: [], anomalies: [], scenery: [], fragmentsHere: [],
    blackbox: null, beacon: null, lift: null, shrine: null, roof: null,
    mx: -9999, my: -9999, mxo: 0, myo: 0,
    delivered: 0, lost: 0, contained: 0, total: 0, firedShots: 0,
    extraction: null, pulse: null, isCave: false, isFinale: false,
    contamKnown: false
  };
}
/* ================ end js/acttwo-data.js ================ */
