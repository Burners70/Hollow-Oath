"use strict";
/* ================================================================
   HOLLOW OATH — a modern-glow gravity-rescue game (original code and art;
   mechanically in the lineage of the Atari ST gravity classic).
   Rescue the stranded Scions, ferry them to the hospital mothership
   AMS MERCY, and piece together what the Static is — seven sectors,
   hidden black boxes, famous Scions, Vectors, secret lifts down into
   the Hollows, Glycon's counterfeits, and a secret finale.
   NOTE: the game was formerly titled DOIDS and the androids were "Doids";
   renamed to HOLLOW OATH / "Scions" (see CHANGELOG.md). localStorage keys
   and internal identifiers keep the doids_/__doids prefix on purpose.
   ================================================================ */

/* Bundle E3 — running inside the Capacitor wrapper? Web-only furniture
   (fullscreen, the add-to-home-screen banner) switches off when native. */
const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform &&
                  window.Capacitor.isNativePlatform());

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let vw = 0, vh = 0, dpr = 1;
let saLeft = 0, saRight = 0;
let darkCanvas = null, dctx = null;
/* ?perf=1 — an FPS/frame-time meter, cost-free unless the flag is set (Bundle D1) */
const PERF = /(?:^|[?&])perf=1(?:&|$)/.test(location.search);
let perfFrameMs = 0, perfFps = 0;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  vw = window.innerWidth; vh = window.innerHeight;
  canvas.width = vw * dpr; canvas.height = vh * dpr;
  darkCanvas = document.createElement("canvas");
  darkCanvas.width = canvas.width; darkCanvas.height = canvas.height;
  dctx = darkCanvas.getContext("2d");
  // camera-cutout insets: keep the world clear of the lozenge
  const cs = getComputedStyle(document.documentElement);
  saLeft = parseFloat(cs.getPropertyValue("--sal")) || 0;
  saRight = parseFloat(cs.getPropertyValue("--sar")) || 0;
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 250));
resize();

/* ---------------- input ---------------- */
const input = { left:false, right:false, thrust:false, fire:false, shield:false, tap:false, tapX:0, tapY:0 };

/* One document-level multi-touch tracker instead of per-button listeners.
   Every active touch is hit-tested against every button on every touch
   event, so rolling a thumb from one button onto another (or pressing a
   second button while the first is still held) registers instantly —
   per-button touchstart/touchend can't do that, because a touch that
   starts on one element never fires events on its neighbour. */
const BTN_DEFS = [["btnL", "left"], ["btnR", "right"], ["btnThrust", "thrust"],
                  ["btnFire", "fire"], ["btnShield", "shield"]];
const btnEls = BTN_DEFS.map(([id, key]) => ({ key, el: document.getElementById(id) }));
const TOUCH_PAD = 14;   // default forgiveness margin around each button, in px
// C1 — turn & thrust get extra reach for panic stabs, but only in the
// directions AWAY from their neighbours, so the padded zones never overlap
// (an overlap would trigger both L+R at once, or FIRE while reaching THRUST).
// btnL/btnR sit 6px apart and THRUST/FIRE ~2px apart, so the neighbour-facing
// sides stay tight (2px) while up/down/edge sides open right up. {t,r,b,l} px.
const BTN_PAD = {
  left:   { t: 34, r: 2,  b: 46, l: 34 },   // reach up / down / toward the left edge
  right:  { t: 34, r: 26, b: 46, l: 2 },    // reach up / down / toward mid-screen
  thrust: { t: 30, r: 34, b: 46, l: 2 },    // reach up / down / toward the right edge
  fire:   { t: 14, r: 2,  b: 14, l: 14 }    // tight on the THRUST side — firing is malpractice
};
function btnPad(key) {
  const p = BTN_PAD[key];
  return p || { t: TOUCH_PAD, r: TOUCH_PAD, b: TOUCH_PAD, l: TOUCH_PAD };
}
// shared hit-test so a test can exercise it without synthesizing touches
function buttonsAt(x, y) {
  const hit = [];
  for (const b of btnEls) {
    const r = b.el.getBoundingClientRect();
    if (r.width === 0) continue;   // hidden
    const p = btnPad(b.key);
    if (x >= r.left - p.l && x <= r.right + p.r &&
        y >= r.top - p.t && y <= r.bottom + p.b)
      hit.push(b.key);
  }
  return hit;
}
function refreshButtonTouches(e) {
  const pressed = {};
  for (const t of e.touches)
    for (const key of buttonsAt(t.clientX, t.clientY)) pressed[key] = true;
  for (const b of btnEls) {
    input[b.key] = !!pressed[b.key];
    b.el.classList.toggle("down", !!pressed[b.key]);
  }
}
["touchstart", "touchmove", "touchend", "touchcancel"].forEach(ev =>
  document.addEventListener(ev, e => {
    if (ev === "touchstart") {
      initAudio();
      if (e.target && e.target.classList && e.target.classList.contains("btn"))
        e.preventDefault();   // stop synthesized mouse events on the buttons
    }
    refreshButtonTouches(e);
  }, { passive: false })
);
// desktop mouse still presses individual buttons
for (const b of btnEls) {
  const down = e => { e.preventDefault(); input[b.key] = true; b.el.classList.add("down"); initAudio(); };
  const up = () => { input[b.key] = false; b.el.classList.remove("down"); };
  b.el.addEventListener("mousedown", down);
  b.el.addEventListener("mouseup", up);
  b.el.addEventListener("mouseleave", up);
}

/* the tilt pill needs handling inside the raw gesture handler: iOS only
   grants DeviceOrientation permission from a real user gesture */
function canvasTap(x, y) {
  initAudio();
  // TILT permission must be requested from this synchronous gesture handler
  // (iOS DeviceOrientation rule) — never route it through the deferred
  // input.tap flag consumed later in the update() loop.
  if (state === "settings" && inRect(settingsRowRect(4), x, y)) { toggleTilt(); return; }
  input.tap = true; input.tapX = x; input.tapY = y;
}
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  canvasTap(e.touches[0].clientX, e.touches[0].clientY);
}, { passive:false });
canvas.addEventListener("mousedown", e => canvasTap(e.clientX, e.clientY));
document.addEventListener("touchmove", e => e.preventDefault(), { passive:false });
document.addEventListener("gesturestart", e => e.preventDefault());

function goFullscreen() {
  if (NATIVE) return;   // meaningless inside the wrapper (E3)
  if (!("ontouchstart" in window)) return;
  const standalone = window.navigator.standalone ||
    (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  if (standalone || document.fullscreenElement || document.webkitFullscreenElement) return;
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!fn) return;
  try {
    const p = fn.call(el);
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

/* add-to-home-screen guidance for first-time visitors from a shared
   link: iOS gets share-sheet instructions, Android an install button */
(function () {
  if (NATIVE) { window.hideA2HS = () => {}; return; }   // the app IS installed (E3)
  const el = document.getElementById("a2hs");
  const txt = document.getElementById("a2hsText");
  const btn = document.getElementById("a2hsBtn");
  const close = document.getElementById("a2hsClose");
  let deferred = null;
  const standalone = window.navigator.standalone ||
    (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  const inFrame = window.top !== window.self;
  let dismissed = false;
  try { dismissed = localStorage.getItem("doids_a2hs") === "1"; } catch (e) {}
  const dismiss = () => {
    el.classList.add("hidden");
    try { localStorage.setItem("doids_a2hs", "1"); } catch (e) {}
  };
  close.addEventListener("click", dismiss);
  close.addEventListener("touchstart", e => { e.preventDefault(); dismiss(); }, { passive:false });
  window.hideA2HS = () => el.classList.add("hidden");
  if (standalone || inFrame || dismissed) return;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) {
    btn.style.display = "none";
    txt.textContent = "Play fullscreen: tap ⬆ Share, then “Add to Home Screen”";
    el.classList.remove("hidden");
  } else {
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      deferred = e;
      txt.textContent = "Play Hollow Oath fullscreen anytime";
      el.classList.remove("hidden");
    });
    const install = e => {
      e.preventDefault();
      if (deferred) { deferred.prompt(); deferred = null; }
      dismiss();
    };
    btn.addEventListener("click", install);
    btn.addEventListener("touchstart", install, { passive:false });
  }
})();

const keyMap = { ArrowLeft:"left", ArrowRight:"right", ArrowUp:"thrust", " ":"fire", x:"fire", z:"thrust",
                 ArrowDown:"shield", c:"shield", Shift:"shield" };
// letter keys work regardless of Caps Lock (an active Caps Lock used to kill
// fire/thrust/shield entirely)
const keyFor = e => keyMap[e.key] !== undefined ? keyMap[e.key]
  : (e.key.length === 1 ? keyMap[e.key.toLowerCase()] : undefined);
window.addEventListener("keydown", e => {
  if (keyFor(e) !== undefined) { input[keyFor(e)] = true; e.preventDefault(); }
  if (e.key === "Enter") {
    input.tap = true;
    // keyboard confirm has no pointer position — aim it at the primary button
    if (state === "gameover") { const cr = continueRect(); input.tapX = cr.x + 1; input.tapY = cr.y + 1; }
    else if (state === "title") { const sr = startRect(); input.tapX = sr.x + 1; input.tapY = sr.y + 1; }
  }
  if (e.key === "Escape" || e.key === "p" || e.key === "P") {
    // pause now works from the text/story screens too, and resume returns to the
    // exact screen it was entered from (enterPause/leavePause remember the page)
    if (state === "pause") leavePause();
    else if (typeof PAUSABLE !== "undefined" && PAUSABLE.has(state)) enterPause();
    // R2 — Escape also backs out of the overlay menu screens, like tapping outside
    else if (e.key === "Escape") {
      if (state === "help") { HELP_CARD.page = 0; state = "title"; stateT = 0.7; }
      else if (state === "legend") { LEGEND_CARD.page = 0; state = legendReturnState || "title"; stateT = 0.4; }
      else if (state === "codex") {
        if (codexCard) codexCard = null; else { state = "title"; stateT = 0.7; }
      } else if (state === "settings") {
        resetArmed = false; state = settingsReturnState || "title"; stateT = 0;
      }
    }
  }
  initAudio();
});
window.addEventListener("keyup", e => { if (keyFor(e) !== undefined) input[keyFor(e)] = false; });

/* auto-pause when the tab/app is backgrounded — deliberate, not mid-flight */
document.addEventListener("visibilitychange", () => {
  // pause (and, in a live run, snapshot) whatever pausable screen you were on, so
  // backgrounding mid-briefing / mid-card / mid-ending never loses your place
  if (document.hidden && typeof enterPause === "function" &&
      typeof PAUSABLE !== "undefined" && PAUSABLE.has(state)) enterPause();
});
/* E2/A4 — inside the wrapper the iOS lifecycle backs the same auto-pause.
   WKWebView does fire visibilitychange on backgrounding, but the App
   plugin's appStateChange is the definitive native signal — belt and
   braces around a mid-run save. */
if (NATIVE) {
  try {
    const A = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (A && A.addListener)
      A.addListener("appStateChange", st => {
        if (st && st.isActive === false && typeof enterPause === "function" &&
            typeof PAUSABLE !== "undefined" && PAUSABLE.has(state)) enterPause();
      });
  } catch (e) {}
}

/* ---------------- external controller (Gamepad API) ---------------- */
const pad = { left:false, right:false, thrust:false, fire:false, shield:false, connected:false };
let padStartPrev = false, padAPrev = false;
function pollPad() {
  pad.left = pad.right = pad.thrust = pad.fire = pad.shield = false;
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = null;
  for (const g of gps) if (g && g.connected) { gp = g; break; }
  pad.connected = !!gp;
  if (!gp) { padStartPrev = padAPrev = false; return; }
  const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const ax = gp.axes[0] || 0;
  pad.left   = ax < -0.35 || b(14);
  pad.right  = ax >  0.35 || b(15);
  pad.thrust = b(0) || b(7) || b(12);          // A / RT / d-pad up
  pad.fire   = b(2) || b(5);                   // X / RB
  pad.shield = b(1) || b(4) || b(6);           // B / LB / LT
  const start = b(9), a = b(0);
  if (start && !padStartPrev) {
    if (state === "pause") leavePause();
    else if (typeof PAUSABLE !== "undefined" && PAUSABLE.has(state)) enterPause();
    else input.tap = true;
  } else if (state !== "play" && state !== "pause" && a && !padAPrev) {
    input.tap = true;
    // gamepad A on the title aims at the START pill (R5), matching Enter
    if (state === "title") { const sr = startRect(); input.tapX = sr.x + 1; input.tapY = sr.y + 1; }
  }
  padStartPrev = start; padAPrev = a;
}
window.addEventListener("gamepadconnected", () => banner("CONTROLLER CONNECTED", "#69f0ae"));

/* ---------------- gyro / tilt steering ---------------- */
let tilt = false;
try { tilt = localStorage.getItem("doids_tilt") === "1"; } catch (e) {}
const gyro = { ok:false, beta:0, gamma:0 };
let gyroBound = false;
function startGyro() {
  if (gyroBound) return;
  gyroBound = true;
  window.addEventListener("deviceorientation", e => {
    if (e.beta === null && e.gamma === null) return;
    gyro.ok = true; gyro.beta = e.beta || 0; gyro.gamma = e.gamma || 0;
  });
}
function enableGyro() {
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission()
      .then(r => { if (r === "granted") startGyro(); else disableTilt(); })
      .catch(() => disableTilt());
  } else startGyro();
}
function disableTilt() {
  tilt = false;
  try { localStorage.setItem("doids_tilt", "0"); } catch (e) {}
}
function toggleTilt() {
  tilt = !tilt;
  try { localStorage.setItem("doids_tilt", tilt ? "1" : "0"); } catch (e) {}
  if (tilt) enableGyro();
  blip(tilt ? 440 : 300, tilt ? 660 : 200, 0.12, "sine", 0.1);
}
if (tilt) { // re-arm a saved preference on the first gesture (iOS needs one)
  const arm = () => { if (tilt) enableGyro(); window.removeEventListener("touchstart", arm); };
  window.addEventListener("touchstart", arm);
  if (!("ontouchstart" in window)) startGyro();
}
/* tilt angle -> steering value in [-1, 1], respecting landscape flip */
function gyroSteerVal() {
  if (!tilt || !gyro.ok) return 0;
  let angle = 0;
  if (screen.orientation && typeof screen.orientation.angle === "number") angle = screen.orientation.angle;
  else if (typeof window.orientation === "number") angle = window.orientation;
  let t = angle === 90 ? gyro.beta : (angle === -90 || angle === 270) ? -gyro.beta : gyro.gamma;
  const dz = 4, full = 24;
  return Math.sign(t) * clamp((Math.abs(t) - dz) / (full - dz), 0, 1);
}

