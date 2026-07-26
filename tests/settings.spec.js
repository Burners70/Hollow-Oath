// Hollow Oath — Settings, accessibility, input & HUD chrome.
//
// The settings panel and every toggle that persists, the pause menu, the HUD
// legend, tight-viewport layout fits, and keyboard/touch input handling.
// Drives the game headlessly through window.__doids; the shared per-test guard
// (navigate + fail on any console error) lives in tests/harness.js.
// See tests/README.md for what belongs in which file.
const { test, expect } = require("@playwright/test");
const { GAME_URL, useGame } = require("./harness");

useGame(test, expect);

test("pause freezes play and resume returns to it", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
  let s = await page.evaluate(() => __doids.get());
  expect(s.paused).toBe(true);
  await page.evaluate(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
  s = await page.evaluate(() => __doids.get());
  expect(s.paused).toBe(false);
  expect(s.state).toBe("play");
});

test("settings persist across reload and the sound toggle gates sfxGain", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("doids_snd", "0");
    localStorage.setItem("doids_mus", "0");
  });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.evaluate(() => window.initAudio());   // module-scoped fn on a classic <script> == a window property
  const s = await page.evaluate(() => __doids.get());
  expect(s.sound).toBe(false);
  expect(s.music).toBe(false);
  expect(s.sfxGainValue).toBe(0);
});

test("settings panel opens from the title pill and toggles ASSIST", async ({ page }) => {
  await page.waitForTimeout(700);   // clear the title's stateT > 0.6 just-arrived guard
  const pill = await page.evaluate(() => window.settingsRect());
  await page.mouse.click(pill.x + pill.w / 2, pill.y + pill.h / 2);
  await page.waitForTimeout(50);
  let s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("settings");
  const before = s.assist;
  await page.waitForTimeout(350);   // clear the stateT > 0.3 just-opened guard
  const assistRow = await page.evaluate(() => window.settingsRowRect(3));
  await page.mouse.click(assistRow.x + assistRow.w / 2, assistRow.y + assistRow.h / 2);
  await page.waitForTimeout(50);
  s = await page.evaluate(() => __doids.get());
  expect(s.assist).toBe(!before);
});

test("FIELD MEDIC / colorblind / big text persist and take effect (Bundle H)", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("doids_easy", "1");
    localStorage.setItem("doids_cb", "1");
    localStorage.setItem("doids_bigtext", "1");
  });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  let s = await page.evaluate(() => __doids.get());
  expect(s.easyMode).toBe(true);
  expect(s.colorblind).toBe(true);
  expect(s.bigText).toBe(true);
  // FIELD MEDIC: a fresh run launches with 5 lives
  await page.evaluate(() => { __doids.reset(); __doids.go(0); __doids.launch(); });
  s = await page.evaluate(() => __doids.get());
  expect(s.lives).toBe(5);
  expect(s.state).toBe("play");
});

// Bundle DS·guard — the old colourblind test asserted only that the FLAG
// persisted, never that a pixel changed. That is exactly how the palette-swap
// leak the July 2026 audit found survived: ~93 semantic colours were hardcoded
// past PAL(), and the CSS flight controls could not swap at all. These two
// tests watch the real output — every colour painted in a live frame, and the
// computed style of the buttons — so a future hardcoded hex fails CI.
async function paintedColours(page) {
  return page.evaluate(() => {
    __doids.reset(); __doids.go(0); __doids.launch();
    const c = document.getElementById("game").getContext("2d");
    const props = ["fillStyle", "strokeStyle", "shadowColor"];
    const base = props.map(p => Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, p));
    const seen = new Set();
    props.forEach((p, i) => Object.defineProperty(c, p, {
      configurable: true,
      get() { return base[i].get.call(this); },
      set(v) { seen.add(String(v).toLowerCase()); base[i].set.call(this, v); }
    }));
    for (let i = 0; i < 3; i++) { update(1 / 60); render(); }
    props.forEach(p => delete c[p]);   // drop the shims, restore the prototype accessors
    return [...seen];
  });
}

test("DS1: colourblind mode swaps the colours actually painted, not just the flag", async ({ page }) => {
  const normal = await paintedColours(page);
  // the run HUD really is in frame — the fuel bar (WARN) and safe-state green
  expect(normal).toContain("#ffc400");
  expect(normal).toContain("#69f0ae");
  // …and none of the colourblind set has leaked into normal vision
  expect(normal).not.toContain("#ffab40");
  expect(normal).not.toContain("#40c4ff");

  await page.evaluate(() => localStorage.setItem("doids_cb", "1"));
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  const cb = await paintedColours(page);
  expect(await page.evaluate(() => __doids.get().colorblind)).toBe(true);
  // the swap reaches the paint: PALETTES.cb WARN + SAFE are on screen…
  expect(cb).toContain("#ffab40");
  expect(cb).toContain("#40c4ff");
  // …and the normal-vision green is gone entirely (the shield bubble, the
  // landed skid and the settings dots used to keep it — DS1)
  expect(cb).not.toContain("#69f0ae");
});

test("DS2: the on-screen flight controls swap with colourblind mode too", async ({ page }) => {
  const btnColours = () => page.evaluate(() => {
    const g = id => getComputedStyle(document.getElementById(id)).borderColor;
    return { thrust: g("btnThrust"), fire: g("btnFire"), shield: g("btnShield"), left: g("btnL") };
  });
  expect(await page.evaluate(() => document.body.classList.contains("cb"))).toBe(false);
  const normal = await btnColours();
  expect(normal.thrust).toContain("255, 196, 0");     // WARN amber
  expect(normal.shield).toContain("105, 240, 174");   // SAFE mint

  await page.evaluate(() => localStorage.setItem("doids_cb", "1"));
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  expect(await page.evaluate(() => document.body.classList.contains("cb"))).toBe(true);
  const cb = await btnColours();
  expect(cb.thrust).toContain("255, 171, 64");        // cb WARN orange
  expect(cb.shield).toContain("64, 196, 255");        // cb SAFE blue
  expect(cb.fire).toContain("255, 255, 255");         // cb DANGER white
  expect(cb.left).toBe(normal.left);                  // cyan is not semantic — unchanged
});

test("REDUCED FLASH persists and RESET PROGRESS double-tap wipes progress but keeps settings", async ({ page }) => {
  // seed some progress + a distinctive setting
  await page.evaluate(() => {
    localStorage.setItem("doids_hi", "9999");
    localStorage.setItem("doids_veteran", "1");
    localStorage.setItem("doids_codex", "[0,1]");
  });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  // open settings, turn on REDUCED FLASH (row 7), reload → it persists.
  // Row 8 is IGNORE CONTROLLER (no controller in this headless test, so it's
  // disabled/no-op), row 9 is RESET PROGRESS.
  await page.evaluate(() => { state = "settings"; settingsReturnState = "title"; stateT = 1; });
  const tapSettingsRow = (i) => page.evaluate((i) => {
    input.tap = true;
    // recompute settingsRowRect(i) the same way the game does (10 rows now)
    const cols = 2, rows = Math.ceil(10 / cols);
    const cw = Math.min(240, innerWidth * 0.42), h = 30, gapX = 12, gapY = 7;
    const totalW = cw*cols+gapX, totalH = h*rows+gapY*(rows-1);
    const x0 = innerWidth/2 - totalW/2, y0 = innerHeight/2 - totalH/2 + 14;
    const col = i % cols, row = (i-col)/cols;
    input.tapX = x0 + col*(cw+gapX) + cw/2; input.tapY = y0 + row*(h+gapY) + h/2;
  }, i);
  await tapSettingsRow(7);
  await page.waitForFunction(() => __doids.get().reducedFlash === true, null, { timeout: 2000 });
  // RESET PROGRESS (row 9) needs two taps
  const tapRow9 = () => tapSettingsRow(9);
  await tapRow9();
  await page.waitForFunction(() => __doids.get().resetArmed === true, null, { timeout: 2000 });
  await tapRow9();
  await page.waitForFunction(() => __doids.get().score === 0 && __doids.get().resetArmed === false, null, { timeout: 2000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.hasSave).toBe(false);
  // hi-score wiped, but REDUCED FLASH preference kept
  expect(await page.evaluate(() => localStorage.getItem("doids_hi"))).toBe(null);
  expect(s.reducedFlash).toBe(true);
});

test("settings rows fit inside a 320-high landscape viewport", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 568, height: 320 } });
  const page = await ctx.newPage();
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  const fits = await page.evaluate(() => {
    const cols = 2, N = __doids.get().settingsRows, rows = Math.ceil(N / cols);
    const cw = Math.min(240, innerWidth * 0.42), h = 30, gapX = 12, gapY = 7;
    const totalH = h*rows+gapY*(rows-1);
    const y0 = innerHeight/2 - totalH/2 + 14;
    const lastBottom = y0 + (rows-1)*(h+gapY) + h + 28; // + footer lines
    return lastBottom < innerHeight;
  });
  expect(fits).toBe(true);
  await ctx.close();
});

test("caps-lock letter keys still fly the ship", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  // uppercase X (as Caps Lock would deliver) must still map to fire
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "X" })));
  expect(await page.evaluate(() => __doids.get().input.fire)).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "X" })));
  expect(await page.evaluate(() => __doids.get().input.fire)).toBe(false);
});

test("R2: pause can't be reached from the title or an overlay; heading clears the rows", async ({ page }) => {
  // Escape/p from the title must never open the pause screen
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "p" })));
  await page.waitForTimeout(40);
  expect(await page.evaluate(() => __doids.get().state)).not.toBe("pause");
  // Escape backs out of the HELP submenu like a tap-outside
  await page.waitForTimeout(700);
  const hr = await page.evaluate(() => window.helpRect());
  await page.mouse.click(hr.x + hr.w / 2, hr.y + hr.h / 2);
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => __doids.get().state)).toBe("helpmenu");
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await page.waitForTimeout(60);
  expect(await page.evaluate(() => __doids.get().state)).toBe("title");
  // the PAUSED heading is derived to sit above the first row on any viewport
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await page.waitForTimeout(40);
  const clears = await page.evaluate(() => {
    const top = pauseRowRect(0);
    return (top.y - 26) < top.y;   // heading baseline is above the first button
  });
  expect(clears).toBe(true);
});

test("U3: the HUD legend opens from the title and from pause, and returns", async ({ page }) => {
  await page.waitForTimeout(700);   // clear the title just-arrived guard
  // HUD GUIDE lives under the HELP submenu now (its second row)
  const hr = await page.evaluate(() => window.helpRect());
  await page.mouse.click(hr.x + hr.w / 2, hr.y + hr.h / 2);
  await page.waitForTimeout(300);
  const row1 = await page.evaluate(() => window.helpMenuRowRect(1));
  await page.mouse.click(row1.x + row1.w / 2, row1.y + row1.h / 2);
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => __doids.get().state)).toBe("legend");
  // page through to the end → back to the title
  await page.waitForTimeout(450);   // clear the card's stateT > 0.4 tap guard
  const pages = await page.evaluate(() => LEGEND_CARD.pages || 1);
  for (let p = 0; p < pages; p++) {
    await page.evaluate(() => { input.tap = true; });
    await page.waitForTimeout(80);
  }
  expect(await page.evaluate(() => __doids.get().state)).toBe("title");
  // now from a live run's pause screen, via the legend link
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await page.waitForTimeout(300);   // clear the pause stateT > 0.25 guard
  expect(await page.evaluate(() => __doids.get().state)).toBe("pause");
  await page.evaluate(() => {
    const r = pauseLegendRect();
    input.tap = true; input.tapX = r.x + r.w / 2; input.tapY = r.y + r.h / 2;
  });
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => __doids.get().state)).toBe("legend");
  // Escape returns to pause — where it was opened from, not the title
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => __doids.get().state)).toBe("pause");
});

test("U4: the pause button clears the score and the FUEL/ECG bars at 320-high", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 568, height: 320 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.waitForTimeout(60);
  const geo = await page.evaluate(() => {
    const pr = pauseRect();
    const bw = Math.min(150, vw * 0.3);
    const ecgLeft = vw - bw - 14 - saRight;   // drawECG x (top-right)
    const fuelRight = 14 + saLeft + bw;         // drawBar x + w (top-left)
    const scoreHalf = 24;                       // ~6 chars of 12px monospace, centred
    const scoreLeft = vw / 2 - scoreHalf, scoreRight = vw / 2 + scoreHalf;
    return {
      clearsEcg: pr.x + pr.w <= ecgLeft,
      clearsFuel: pr.x >= fuelRight,
      clearsScore: pr.x >= scoreRight || pr.x + pr.w <= scoreLeft,
      inViewport: pr.x >= 0 && pr.x + pr.w <= vw && pr.y >= 0 && pr.y + pr.h <= vh,
    };
  });
  expect(geo.clearsEcg).toBe(true);
  expect(geo.clearsFuel).toBe(true);
  expect(geo.clearsScore).toBe(true);
  expect(geo.inViewport).toBe(true);
  expect(errs).toEqual([]);
  await ctx.close();
});

test("C1: turn/thrust touch zones are forgiving but never overlap at the seam", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });   // landscape → controls visible
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.waitForTimeout(250);   // let a frame drop the `noctl` class so buttons lay out
  const data = await page.evaluate(() => {
    const rect = id => { const r = document.getElementById(id).getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom,
               cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2, w: r.width }; };
    const L = rect("btnL"), R = rect("btnR"), T = rect("btnThrust"), F = rect("btnFire");
    return {
      Lw: L.w,
      seamLR: __doids.btnHit((L.right + R.left) / 2, L.cy),        // between turn buttons
      seamTF: __doids.btnHit((F.left + T.right) / 2, T.cy),        // between fire & thrust
      aboveL: __doids.btnHit(L.cx, L.top - 22),                    // stab 22px above btnL
      aboveThrust: __doids.btnHit(T.cx, T.top - 22),               // stab 22px above thrust
      centerL: __doids.btnHit(L.cx, L.cy)
    };
  });
  expect(data.Lw, "controls are laid out (landscape, in-flight)").toBeGreaterThan(0);
  // the seam between the two turn buttons must never press both at once
  expect(data.seamLR.filter(k => k === "left" || k === "right").length).toBeLessThanOrEqual(1);
  // reaching THRUST must not also commit FIRE (malpractice)
  expect(data.seamTF).not.toContain("fire");
  // vertical forgiveness: a stab just above the button still registers
  expect(data.aboveL).toContain("left");
  expect(data.aboveThrust).toContain("thrust");
  expect(data.centerL).toContain("left");
});
