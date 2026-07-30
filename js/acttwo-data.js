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

function spanUnion(list, top, bot) {
  if (bot - top <= 0) return list;
  const out = [];
  let t = top, b = bot;
  for (const sp of list) {
    if (sp.bot < t || sp.top > b) out.push(sp);                  // disjoint — keep
    else { t = Math.min(t, sp.top); b = Math.max(b, sp.bot); }   // touches — absorb
  }
  out.push({ top: t, bot: b });
  out.sort((p, q) => p.top - q.top);
  return out;
}

function spanSubtract(list, top, bot) {
  const out = [];
  for (const sp of list) {
    if (bot <= sp.top || top >= sp.bot) { out.push(sp); continue; }   // misses it
    if (top > sp.top) out.push({ top: sp.top, bot: top });            // air left above
    if (bot < sp.bot) out.push({ top: bot, bot: sp.bot });            // air left below
  }
  return out;
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
function compileChamber(ch) {
  const cols = Math.floor(ch.W / STEP) + 2;
  const rng = mulberry32(ch.seed);
  const nTop = chamberNoise(rng, 150, ch.W), nBot = chamberNoise(rng, 180, ch.W);
  const spans = [];
  for (let i = 0; i < cols; i++) spans.push([]);
  for (const p of ch.parts) {
    const i0 = Math.max(0, Math.floor(p.x / STEP));
    const i1 = Math.min(cols - 1, Math.ceil((p.x + p.w) / STEP));
    for (let i = i0; i <= i1; i++) {
      const x = i * STEP;
      const top = p.y + (p.roughTop ? nTop(x) * p.roughTop : 0);
      const bot = p.y + p.h + (p.roughBot ? nBot(x) * p.roughBot : 0);
      spans[i] = p.op === "rock" ? spanSubtract(spans[i], top, bot)
                                 : spanUnion(spans[i], top, bot);
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
const SLICE_CHAMBER = {
  id: "slice", name: "INTAKE", seed: 90210, W: 6000, H: 2400, zone: "cyan",
  parts: [
    { op: "room", x: 180,  y: 120,  w: 300,  h: 720, roughTop: 6,  roughBot: 0  },  // entry shaft
    { op: "room", x: 120,  y: 620,  w: 2600, h: 700, roughTop: 26, roughBot: 34 },  // upper gallery
    { op: "rock", x: 1500, y: 850,  w: 760,  h: 170, roughTop: 14, roughBot: 18 },  // the overhang shelf
    { op: "room", x: 2650, y: 980,  w: 900,  h: 340, roughTop: 12, roughBot: 16 },  // mid corridor
    { op: "rock", x: 2900, y: 980,  w: 280,  h: 256, roughTop: 0,  roughBot: 8  },  // the pinch (~84px)
    { op: "room", x: 3400, y: 1300, w: 2450, h: 900, roughTop: 30, roughBot: 40 },  // lower gallery
    { op: "rock", x: 4400, y: 1240, w: 200,  h: 1000, roughTop: 0, roughBot: 0  },  // pillar, floor to ceiling
    { op: "rock", x: 4950, y: 1620, w: 700,  h: 180, roughTop: 12, roughBot: 14 }   // tow-around shelf
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
function genChamber(ch) {
  return {
    n: 0, W: ch.W, H: ch.H, spans: compileChamber(ch), chamberId: ch.id,
    isChamber: true, isPlant: true, plantZone: ch.zone, dark: false,
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
