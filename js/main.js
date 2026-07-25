"use strict";
/* ---------------- main loop ---------------- */
level = genLevel(0);
spawnShip();
camera = { x: ship.x, y: ship.y, shake: 0 };
particles = []; texts = [];

let last = performance.now();
let prevState = state;
// Y2 — surface a live count of frames that threw (0 in normal play) so QA and
// the smoke suite can assert the guard held and the loop stayed alive.
if (window.__doids) { window.__doids.frameErrors = 0; window.__doids.lastFrameError = null; }
function frame(t) {
  // Y2 — a single thrown update()/render() must NOT kill the RAF loop. Before
  // this guard, one bad frame stopped requestAnimationFrame permanently and the
  // game read as "UI stuck, world blank, nothing responds". Wrap the body so a
  // bad frame is logged and skipped while the loop keeps running.
  try {
    const rawMs = t - last;
    const dt = Math.min(rawMs / 1000, 0.05);
    last = t;
    if (PERF) { perfFrameMs = rawMs; perfFps = rawMs > 0 ? 1000 / rawMs : 0; }
    update(dt);
    // returning to the title after a run gets one soft, quiet heartbeat — the
    // phone-as-ECG signature is true from the first screen (sound-gated, no
    // haptic buzz on a menu)
    if (state === "title" && prevState !== "title" &&
        (prevState === "gameover" || prevState === "pause")) heartbeat(0.3, true);
    prevState = state;
    render();
  } catch (e) {
    if (window.__doids) {
      window.__doids.frameErrors = (window.__doids.frameErrors || 0) + 1;
      window.__doids.lastFrameError = String((e && e.stack) || e);
    }
    try { console.error("[HollowOath] frame error (loop kept alive):", e); } catch (_) {}
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
