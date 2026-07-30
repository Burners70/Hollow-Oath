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
/* ================ end js/acttwo-data.js ================ */
