// Hollow Oath — Boot, title & saved runs.
//
// Booting to the title screen, the onboarding fork and HOW TO FLY guide,
// the veteran intro, game over, save/resume (including a corrupt save), and
// iOS-lifecycle stability (foreground return, a thrown frame).
// Drives the game headlessly through window.__doids; the shared per-test guard
// (navigate + fail on any console error) lives in tests/harness.js.
// See tests/README.md for what belongs in which file.
const { test, expect } = require("@playwright/test");
const { GAME_URL, useGame } = require("./harness");

useGame(test, expect);

test("boots to the title screen", async ({ page }) => {
  await expect(page).toHaveTitle("Hollow Oath — a gravity rescue");
  const s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("title");
  expect(s.lives).toBe(3);
  expect(s.score).toBe(0);
});

test("run checkpoints and resumes after reload", async ({ page }) => {
  await page.evaluate(() => { __doids.go(3); __doids.launch(); });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  const s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("title");
  expect(s.hasSave).toBe(true);
});

test("title pills never overlap on a phone-height viewport", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const page = await ctx.newPage();
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  const r = await page.evaluate(() => __doids.get().rects);
  const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  expect(overlap(r.resume, r.daily)).toBe(false);
  expect(overlap(r.resume, r.remix)).toBe(false);
  await ctx.close();
});

test("game over returns to the main menu and the run survives as a RESUME save", async ({ page }) => {
  await page.evaluate(() => { __doids.go(2); __doids.launch(); });
  await page.evaluate(() => { lives = 1; shipDie(); });
  await page.waitForFunction(() => __doids.get().state === "gameover", null, { timeout: 5000 });
  // tap anywhere that isn't the CONTINUE box → back to the title, not a new run
  await page.waitForTimeout(800);
  await page.evaluate(() => { input.tap = true; input.tapX = 5; input.tapY = 5; });
  await page.waitForFunction(() => __doids.get().state === "title", null, { timeout: 3000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.hasSave).toBe(true);   // the checkpoint was written back (penalty applied)
  expect(s.levelIdx).toBe(2);
});

test("a corrupt saved run is rejected, not shown as a RESUME pill", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("doids_run", JSON.stringify({ v: 1, levelIdx: 99, score: "x" })));
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  const s = await page.evaluate(() => __doids.get());
  expect(s.hasSave).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem("doids_run"))).toBe(null);
});

test("R5: the title launches only from the START pill, not a stray tap", async ({ page }) => {
  await page.evaluate(() => markTrained());   // skip the X3 first-play fork — R5 tests the pill
  await page.waitForTimeout(700);   // clear the title's stateT > 0.6 guard
  // a tap on empty title space no longer starts a run
  await page.evaluate(() => { input.tap = true; input.tapX = 4; input.tapY = innerHeight / 2; });
  await page.waitForTimeout(60);
  expect(await page.evaluate(() => __doids.get().state)).toBe("title");
  // the explicit START pill does
  await page.evaluate(() => {
    const sr = startRect();
    input.tap = true; input.tapX = sr.x + sr.w / 2; input.tapY = sr.y + sr.h / 2;
  });
  await page.waitForTimeout(60);
  const s = await page.evaluate(() => __doids.get());
  expect(["intro", "brief", "play"]).toContain(s.state);   // a run has begun
});

test("R5: Enter aims the synthetic tap at the START pill", async ({ page }) => {
  await page.evaluate(() => markTrained());   // skip the X3 first-play fork — R5 tests the pill
  await page.waitForTimeout(700);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })));
  await page.waitForTimeout(60);
  const s = await page.evaluate(() => __doids.get());
  expect(["intro", "brief", "play"]).toContain(s.state);
});

test("R1/X1: the illustrated HOW TO FLY guide paginates and never runs off a 320-high phone", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 568, height: 320 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error") errs.push("console.error: " + m.text()); });
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.waitForTimeout(700);
  const hr = await page.evaluate(() => window.helpRect());
  await page.mouse.click(hr.x + hr.w / 2, hr.y + hr.h / 2);
  await page.waitForTimeout(300);   // HELP is a submenu now — wait out its just-opened guard
  const row0 = await page.evaluate(() => window.helpMenuRowRect(0));
  await page.mouse.click(row0.x + row0.w / 2, row0.y + row0.h / 2);
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => __doids.get().state)).toBe("help");
  const pages = await page.evaluate(() => __doids.get().guide.pages);
  expect(pages).toBeGreaterThan(1);   // the illustrated guide is multi-page
  await page.waitForTimeout(450);     // clear the guide's stateT > 0.4 tap guard
  // walk every page; the footer must stay on-screen the whole way (X1 respects
  // the R1 on-screen-fit contract — illustrated pages must fit too)
  for (let p = 0; p < pages; p++) {
    const foot = await page.evaluate(() => __doids.get().guide.footY);
    expect(foot).toBeLessThan(320);
    await page.evaluate(() => { input.tap = true; });
    await page.waitForTimeout(80);
  }
  // after the last page the guide dismisses back to the title
  expect(await page.evaluate(() => __doids.get().state)).toBe("title");
  expect(errs).toEqual([]);
  await ctx.close();
});

test("Y1: a foreground return clears and repaints the terrain tile cache", async ({ page }) => {
  await page.evaluate(() => { __doids.go(1); __doids.launch(); });
  await page.waitForTimeout(300);   // let a few frames build the terrain tiles
  expect(await page.evaluate(() => __doids.tileCacheSizes().terrain)).toBeGreaterThan(0);
  // the direct invalidation (what the foreground handlers call). Clear and read
  // in ONE evaluate so no render frame rebuilds the cache in between.
  const cleared = await page.evaluate(() => { __doids.invalidateTiles(); return __doids.tileCacheSizes().terrain; });
  expect(cleared).toBe(0);
  // the next frames repaint from the heightmap — terrain comes back, not blank
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => __doids.tileCacheSizes().terrain)).toBeGreaterThan(0);
  // and the real pageshow wiring in input.js clears it too (same synchronous read)
  const cleared2 = await page.evaluate(() => { window.dispatchEvent(new Event("pageshow")); return __doids.tileCacheSizes().terrain; });
  expect(cleared2).toBe(0);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => __doids.tileCacheSizes().terrain)).toBeGreaterThan(0);
});

test("Y2: a thrown frame is caught and the RAF loop stays alive", async ({ browser }) => {
  // own context — this test deliberately throws inside a frame, which logs a
  // console.error the shared harness would otherwise fail on
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.waitForTimeout(200);
  const before = await page.evaluate(() => window.__doids.frameErrors || 0);
  // make exactly one render() call throw, then it repairs itself
  await page.evaluate(() => {
    window.__y2orig = render;
    let thrown = false;
    render = function () { if (!thrown) { thrown = true; throw new Error("Y2 injected"); } return window.__y2orig(); };
  });
  await page.waitForTimeout(250);   // several frames — the loop must keep ticking
  await page.evaluate(() => { render = window.__y2orig; });
  const after = await page.evaluate(() => window.__doids.frameErrors || 0);
  expect(after).toBeGreaterThan(before);
  expect(await page.evaluate(() => !!window.__doids.lastFrameError)).toBe(true);
  // the loop is still alive: navigation still advances the sim
  await page.evaluate(() => { __doids.go(2); __doids.launch(); });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => __doids.get().state)).toBe("play");
  await ctx.close();
});

test("X3: first START opens the fork; YES flies straight in and is remembered", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error") errs.push("console.error: " + m.text()); });
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => __doids.get().trained)).toBe(false);
  // tap START NEW FLIGHT — an untrained first launch shows the fork, not a run
  let r = await page.evaluate(() => __doids.get().rects.start);
  await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => __doids.get().state)).toBe("fork");
  // tap YES — straight into the mission, no training state (no trainee level in 1.0)
  await page.waitForTimeout(300);
  r = await page.evaluate(() => window.forkRowRect(0));
  await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2);
  await page.waitForTimeout(200);
  const s = await page.evaluate(() => __doids.get());
  expect(s.trained).toBe(true);
  expect(["intro", "brief", "play"]).toContain(s.state);   // a run has begun
  expect(errs).toEqual([]);
  await ctx.close();
});

test("X3: fork NO opens the HOW TO FLY guide, then flies in", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error") errs.push("console.error: " + m.text()); });
  await page.goto(GAME_URL);
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.waitForTimeout(700);
  let r = await page.evaluate(() => __doids.get().rects.start);
  await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => __doids.get().state)).toBe("fork");
  // tap NO — opens the guide, primed to fly in when finished
  await page.waitForTimeout(300);
  r = await page.evaluate(() => window.forkRowRect(1));
  await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => __doids.get().state)).toBe("help");
  expect(await page.evaluate(() => __doids.get().guideReturn)).toBe("start");
  // page through the whole guide; the last tap flies in
  const pages = await page.evaluate(() => __doids.get().guide.pages);
  await page.waitForTimeout(450);
  for (let p = 0; p < pages; p++) {
    await page.evaluate(() => { input.tap = true; });
    await page.waitForTimeout(80);
  }
  const s = await page.evaluate(() => __doids.get());
  expect(s.trained).toBe(true);
  expect(["intro", "brief", "play"]).toContain(s.state);
  expect(errs).toEqual([]);
  await ctx.close();
});

test("V8: a veteran's first fresh run shows the one-panel veteran intro, once", async ({ page }) => {
  // a first-time (non-veteran) run shows the full multi-panel INTRO
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.evaluate(() => { markTrained(); startFreshRun(); });
  let s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("intro");
  expect(s.introLen).toBeGreaterThan(1);       // the full first-run INTRO
  // now become a veteran and start again → the single-panel veteran opening.
  // (a real veteran also has introSeen from their first run; set it so the
  // final "subsequent run skips to the tasking" step exercises the right path)
  await page.evaluate(() => { markVeteran(); markIntroSeen(); startFreshRun(); });
  s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("intro");
  expect(s.introLen).toBe(1);                  // VET_INTRO is one panel
  expect(s.vetIntroSeen).toBe(false);
  // tap through it → briefing, and it's marked seen
  await page.waitForTimeout(400);              // clear the intro's stateT guard
  await page.evaluate(() => { input.tap = true; });
  await page.waitForTimeout(80);
  s = await page.evaluate(() => __doids.get());
  expect(s.vetIntroSeen).toBe(true);
  expect(s.state).toBe("brief");
  // a subsequent veteran run skips straight to the tasking
  await page.evaluate(() => { startFreshRun(); });
  s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("brief");
});

test("V13: the veteran-intro recap names how many actually came home, not a blanket claim", async ({ page }) => {
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  // everything in one tick, as answerBeacon() must be — landing at the beacon
  // and waiting a frame would trigger the proximity reveal card first (state
  // flips to "reveal", where updateBeacon stops running and heardParry never
  // gets checked); answerBeacon sets revealed itself so that branch is skipped
  await page.evaluate(() => {
    markTrained(); startFreshRun(); __doids.go(7); __doids.launch(); __doids.warpBeacon();
    // stamp a tally with a loss before resolving the ending, so the snapshot
    // saveLastRunTally() takes is deterministic
    runSaved = 4; runLost = 2;
    __doids.answerBeacon();
  });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 9000 });
  expect(await page.evaluate(() => __doids.get().veteran)).toBe(true);
  expect(await page.evaluate(() => __doids.lastRunTally())).toEqual({ saved: 4, lost: 2 });
  // the next fresh (veteran) run's opening recap reflects it
  await page.evaluate(() => { markIntroSeen(); startFreshRun(); });
  expect(await page.evaluate(() => __doids.get().state)).toBe("intro");
  expect(await page.evaluate(() => __doids.introCaption())).toContain("You brought 4 home. 2 didn't make it.");
});
