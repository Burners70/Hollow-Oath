// Hollow Oath — Story surfaces, codex & Game Center.
//
// The narrative and meta layers: briefings, the 41-second clock, recovered logs
// and the codex archive, and the Game Center facade.
// Drives the game headlessly through window.__doids; the shared per-test guard
// (navigate + fail on any console error) lives in tests/harness.js.
// See tests/README.md for what belongs in which file.
const { test, expect } = require("@playwright/test");
const { useGame } = require("./harness");

useGame(test, expect);

test("the 41-second clock runs only from sector 4 on and surges on period (Bundle I)", async ({ page }) => {
  // sector 2: the clock must not accumulate
  await page.evaluate(() => { __doids.go(2); __doids.launch(); });
  await page.waitForTimeout(400);
  let s = await page.evaluate(() => __doids.get());
  expect(s.staticClock).toBe(0);
  expect(s.staticSurge).toBe(0);
  // sector 4: wind the clock to just under the period and watch it fire
  await page.evaluate(() => { __doids.go(4); __doids.launch(); __doids.setStaticClock(40.8); });
  await page.waitForFunction(() => __doids.get().staticSurge > 0, null, { timeout: 3000 });
  s = await page.evaluate(() => __doids.get());
  expect(s.staticClock).toBeLessThan(1);   // wrapped, not still climbing
  expect(s.staticSurge).toBeGreaterThan(0);
  expect(s.staticSurge).toBeLessThanOrEqual(0.6);
});

test("recovered logs persist across reload and the codex ARCHIVE pages (Bundle K)", async ({ page }) => {
  await page.evaluate(() => { __doids.go(0); __doids.launch(); });
  await page.evaluate(() => { grantFragment(false); grantFragment(false); });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  let s = await page.evaluate(() => __doids.get());
  expect(s.logsSeen).toEqual([0, 1]);
  // open the codex from the title, switch to ARCHIVE, page forward
  await page.waitForTimeout(700);
  const pill = await page.evaluate(() => window.codexRect());
  await page.mouse.click(pill.x + pill.w / 2, pill.y + pill.h / 2);
  await page.waitForTimeout(450);
  s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("codex");
  const tab = await page.evaluate(() => window.codexTabRect(1));
  await page.mouse.click(tab.x + tab.w / 2, tab.y + tab.h / 2);
  await page.waitForTimeout(120);
  s = await page.evaluate(() => __doids.get());
  expect(s.codexTab).toBe(1);
  const panel = await page.evaluate(() => window.codexPanelRect());
  // R7 — paging is via the explicit › arrow now, not a half-panel tap
  const nextArrow = await page.evaluate(() => window.codexArrowRect(1));
  await page.mouse.click(nextArrow.x + nextArrow.w / 2, nextArrow.y + nextArrow.h / 2);
  await page.waitForTimeout(120);
  s = await page.evaluate(() => __doids.get());
  expect(s.archivePage).toBe(1);
  // tapping outside the panel closes back to the title
  await page.mouse.click(panel.x + panel.w / 2, 4);
  await page.waitForTimeout(120);
  s = await page.evaluate(() => __doids.get());
  expect(s.state).toBe("title");
});

test("every sector briefing renders", async ({ page }) => {
  // the story tables (SECTOR_NAMES, BRIEFS, …) are module-scoped, so verify
  // them behaviourally: go(n) throws on a missing entry, the briefing screen
  // renders a frame, and afterEach fails the test on any page error
  for (let n = 0; n < 8; n++) {
    await page.evaluate(i => __doids.go(i), n);
    const s = await page.evaluate(() => __doids.get());
    expect(s.state, `sector ${n} briefing`).toBe("brief");
    await page.waitForTimeout(60);
  }
});

test("Game Center facade traces auth, rank achievements and the score report (Bundle G)", async ({ page }) => {
  let s = await page.evaluate(() => __doids.get());
  // web build: no native bridge, but the intent trace is live from boot
  expect(s.cloudNative).toBe(false);
  expect(s.gcReports.map(r => r.method)).toContain("authenticate");
  // fly the answered ending without a single shot (same path as the L2 test)
  await page.evaluate(() => { __doids.go(7); __doids.launch(); __doids.warpBeacon(); __doids.answerBeacon(); });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 9000 });
  await page.waitForFunction(() => __doids.get().epilogueChars > 4, null, { timeout: 5000 });
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "ending", null, { timeout: 3000 });
  // the ending card holds for 1s before a tap advances to the win screen
  await page.waitForTimeout(1200);
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "win", null, { timeout: 3000 });
  s = await page.evaluate(() => __doids.get());
  const achievements = s.gcReports
    .filter(r => r.method === "reportAchievement").map(r => r.achievementId);
  // answered with runFired === 0 and runLost === 0 → G3's rank mirror
  expect(achievements).toContain("hollowoath.oath_keeper");
  expect(achievements).toContain("hollowoath.spotless_rotation");
  // saveHi posted the campaign score to the all-time board
  const scores = s.gcReports.filter(r => r.method === "submitScore");
  expect(scores.length).toBeGreaterThan(0);
  expect(scores[scores.length - 1].leaderboardId).toBe("hollowoath.score.alltime");
  expect(scores[scores.length - 1].value).toBeGreaterThan(0);
});

test("R7: a codex mind is clickable and opens its reveal card", async ({ page }) => {
  // record two famous minds so a MINDS row is tappable
  await page.evaluate(() => { localStorage.setItem("doids_codex", "[0,1]"); });
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.waitForTimeout(700);
  const pill = await page.evaluate(() => window.codexRect());
  await page.mouse.click(pill.x + pill.w / 2, pill.y + pill.h / 2);
  await page.waitForTimeout(450);
  expect(await page.evaluate(() => __doids.get().state)).toBe("codex");
  // tap the first (found) mind row → a reveal card opens over the codex
  await page.evaluate(() => {
    const r = codexMindRowRect(0);
    input.tap = true; input.tapX = r.x + r.w / 2; input.tapY = r.y + r.h / 2;
  });
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => __doids.get().codexCardOpen)).toBe(true);
  // any tap closes it back to the codex, not the title
  await page.evaluate(() => { input.tap = true; });
  await page.waitForTimeout(80);
  const s = await page.evaluate(() => __doids.get());
  expect(s.codexCardOpen).toBe(false);
  expect(s.state).toBe("codex");
});

test("S8: seeing the WORKSHOP opens a locked MANIFEST DISCREPANCY entry in the archive", async ({ page }) => {
  // no workshop seen → no discrepancy entry
  let has = await page.evaluate(() => archiveEntries().some(e => e.title === "MANIFEST DISCREPANCY"));
  expect(has).toBe(false);
  await page.evaluate(() => { shrinesSeen.add(1); });   // the WORKSHOP is cave 1
  has = await page.evaluate(() => archiveEntries().some(e => e.title === "MANIFEST DISCREPANCY" && e.on === false));
  expect(has).toBe(true);
});

test("FIELD MEDIC runs stay off the Game Center boards (H3 gate)", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("doids_easy", "1"));
  await page.reload();
  await page.waitForFunction(() => window.__doids !== undefined);
  await page.evaluate(() => { __doids.go(7); __doids.launch(); __doids.warpBeacon(); __doids.answerBeacon(); });
  await page.waitForFunction(() => __doids.get().state === "epilogue", null, { timeout: 9000 });
  await page.waitForFunction(() => __doids.get().epilogueChars > 4, null, { timeout: 5000 });
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "ending", null, { timeout: 3000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { input.tap = true; });
  await page.waitForFunction(() => __doids.get().state === "win", null, { timeout: 3000 });
  const s = await page.evaluate(() => __doids.get());
  expect(s.easyMode).toBe(true);
  // achievements still earnable on easy mode; the boards are not
  expect(s.gcReports.filter(r => r.method === "submitScore")).toHaveLength(0);
  expect(s.gcReports.filter(r => r.method === "reportAchievement").length).toBeGreaterThan(0);
});

test("A6: log reveal cards break one sentence per line, ellipses intact", async ({ page }) => {
  // LOG 02 is four short sentences — each should get its own line.
  const log2 = await page.evaluate(() => __doids.logCardBody(1));
  expect(log2.split("\n").length).toBe(4);
  expect(log2).toContain("Forty-one seconds.\nAlways forty-one seconds.");
  // LOG 06 has an ellipsis mid-sentence; it must NOT split there.
  const log6 = await page.evaluate(() => __doids.logCardBody(5));
  expect(log6).toContain("matches... us.");
  expect(log6).not.toContain("matches...\nus");
});
