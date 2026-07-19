"use strict";
/* ---------------- main loop ---------------- */
level = genLevel(0);
spawnShip();
camera = { x: ship.x, y: ship.y, shake: 0 };
particles = []; texts = [];

let last = performance.now();
let prevState = state;
function frame(t) {
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
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
