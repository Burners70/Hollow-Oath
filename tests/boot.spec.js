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

test("X5: game over shows one hint from the always-available bank, no repeat until it cycles", async ({ page }) => {
  await page.evaluate(() => { __doids.go(2); __doids.launch(); });
  await page.evaluate(() => { lives = 1; shipDie(); });
  await page.waitForFunction(() => __doids.get().state === "gameover", null, { timeout: 5000 });
  const first = await page.evaluate(() => __doids.get().currentHint);
  expect(first.length).toBeGreaterThan(0);
  // die six more times (there are 7 always-available hints) — none should repeat
  const seen = new Set([first]);
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(700);   // updateMenu ignores a tap before stateT > 0.6
    await page.evaluate(() => { input.tap = true; input.tapX = 5; input.tapY = 5; });
    await page.waitForFunction(() => __doids.get().state === "title", null, { timeout: 3000 });
    await page.evaluate(() => { __doids.go(2); __doids.launch(); lives = 1; shipDie(); });
    await page.waitForFunction(() => __doids.get().state === "gameover", null, { timeout: 5000 });
    const hint = await page.evaluate(() => __doids.get().currentHint);
    expect(seen.has(hint)).toBe(false);
    seen.add(hint);
  }
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

test("X3: fork NO routes into the X2 trainee sector", async ({ browser }) => {
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
  // tap NO — now that X2 has shipped, this drops straight into training (1.0;
  // pre-X2 it opened the HOW TO FLY guide instead)
  await page.waitForTimeout(300);
  r = await page.evaluate(() => window.forkRowRect(1));
  await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2);
  await page.waitForTimeout(150);
  const s = await page.evaluate(() => __doids.get());
  expect(s.trained).toBe(true);
  expect(s.training).toBe(true);
  expect(s.state).toBe("play");
  expect(errs).toEqual([]);
  await ctx.close();
});

test("X2: the trainee sector is its own mode — never ends on its own and never writes a hiscore", async ({ page }) => {
  await page.evaluate(() => { localStorage.setItem("doids_hi", "0"); __doids.training(); });
  let s = await page.evaluate(() => __doids.get());
  expect(s.training).toBe(true);
  expect(s.runMode).toBe("training");
  expect(s.state).toBe("play");
  expect(s.level.total).toBe(2);   // owner refinement: a second Scion was added past the turret
  // guided-pause cards (X2a) can auto-fire here — e.g. "rescue" the instant
  // the Scion is on screen, which it is at spawn — this test is about
  // checkSectorClear, not the coach script, so mark every card pre-shown
  await page.evaluate(() => { for (const c of TRAINING_CARDS) trainingShown[c.id] = true; });
  // X2b — even with "everyone accounted for," the sector-clear check no-ops
  await page.evaluate(() => { level.delivered = level.total; checkSectorClear(); });
  s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("play");
  // a life-loss to gameover must not touch the hiscore in training
  await page.evaluate(() => { score = 500; hiscore = 0; saveHi(); });
  expect(await page.evaluate(() => localStorage.getItem("doids_hi"))).toBe("0");
});

/* X/Z integration (found merging the two bundles) — resetRun cleared gravScale but
   not gravTilt. A campaign run is saved by rollGravity()'s runSeed === 0 early
   return, but TRAINING never calls rollGravity at all: startTraining builds its
   level directly instead of going through toBriefing. So the trainee sector
   inherited whatever crosswind the last REMIX/DAILY run rolled, and taught "hold
   THRUST and see it work" while an unexplained sideways shove pushed the ship off
   course. */
test("X/Z: the trainee sector always flies at plain 1x gravity, never inheriting a REMIX roll", async ({ page }) => {
  // fly a REMIX seed that actually rolls a crosswind, then open training
  const rolled = await page.evaluate(() => {
    for (let seed = 1; seed < 400; seed++) {
      __doids.remix(seed);
      if (Math.abs(gravTilt) > 0.3 && Math.abs(gravScale - 1) > 0.2) {
        return { seed, scale: gravScale, tilt: gravTilt };
      }
    }
    return null;
  });
  expect(rolled, "found a REMIX seed with both a scale and a crosswind").not.toBeNull();
  expect(Math.abs(rolled.tilt)).toBeGreaterThan(0.3);
  await page.evaluate(() => { __doids.training(); });
  const s = await page.evaluate(() => ({
    runMode, gravScale, gravTilt, grav: grav(), gravSide: gravSide() }));
  expect(s.runMode).toBe("training");
  expect(s.gravScale, "no inherited gravity scale").toBe(1);
  expect(s.gravTilt, "no inherited crosswind").toBe(0);
  expect(s.gravSide, "no sideways shove in the tutorial").toBe(0);
  expect(s.grav).toBe(await page.evaluate(() => GRAV));
});

test("X2a/X4: the trainee sector opens with a guided-pause card; sustained thrust advances it", async ({ page }) => {
  await page.evaluate(() => { __doids.training(); });
  // the "thrust" card fires automatically shortly after entering play
  await page.waitForTimeout(900);
  let s = await page.evaluate(() => __doids.get());
  expect(s.coach.active).toBe(true);
  expect(s.coach.text).toMatch(/THRUST/);
  expect(s.state).toBe("coach");
  // tap anywhere to dismiss, like a "reveal" card
  await page.evaluate(() => { input.tap = true; });
  await page.waitForTimeout(450);
  s = await page.evaluate(() => __doids.get());
  expect(s.coach.active).toBe(false);
  expect(s.state).toBe("play");
  expect(s.trainingShown.thrust).toBe(true);
  expect(s.trainingShown.drift).toBeFalsy();
  // owner note: a brief tap must NOT immediately advance — the player needs
  // real time to hold thrust and see it work first
  await page.evaluate(() => { input.thrust = true; });
  await page.waitForTimeout(200);
  s = await page.evaluate(() => __doids.get());
  expect(s.coach.active).toBe(false);
  // holding it past the 1.5s gate fires the next card ("drift")
  await page.waitForTimeout(1500);
  s = await page.evaluate(() => __doids.get());
  expect(s.coach.active).toBe(true);
  expect(s.trainingShown.drift).toBe(true);
});

test("X6: a new high score requests the native rating prompt", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.evaluate(() => { hiscore = 0; score = 500; saveHi(); });
  // owner refinement (X6) — on native, the custom banner shows first, then
  // the real prompt a beat later (Apple's own dialog text can't be
  // customized). The web build (this test) is never native, so the request
  // still records to the trace immediately, with no banner line.
  await page.waitForFunction(
    () => __doids.get().ratingReports.some(r => r.reason === "hiscore"),
    null, { timeout: 3000 });
});

test("owner follow-up: no standalone banner line on a non-native build — it reads as a needy non sequitur with no prompt to follow", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.evaluate(() => { hiscore = 0; score = 500; saveHi(); });
  await page.waitForTimeout(2200);   // past the native-path 1800ms delay, if any
  const s = await page.evaluate(() => __doids.get());
  expect(s.ratingAskMsg).toBeFalsy();
  expect(s.ratingReports.some(r => r.reason === "hiscore")).toBe(true);
});

test("X6 (owner refinement): the 5th completed run requests a milestone rating prompt", async ({ page }) => {
  await page.evaluate(() => { __doids.go(2); __doids.launch(); });
  await page.evaluate(() => { hiscore = 999999; runsPlayed = 4; lives = 1; shipDie(); });
  await page.waitForFunction(() => __doids.get().state === "gameover", null, { timeout: 5000 });
  let s = await page.evaluate(() => __doids.get());
  expect(s.runsPlayed).toBe(5);
  // hiscore is pinned sky-high above, so the milestone ask (not the hiscore
  // ask) must be the one that fires on this 5th completed run
  await page.waitForFunction(
    () => __doids.get().ratingReports.some(r => r.reason === "milestone-5"),
    null, { timeout: 3000 });
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
