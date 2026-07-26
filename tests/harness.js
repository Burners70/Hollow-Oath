// Shared harness for the Hollow Oath smoke specs.
//
// The suite drives the game headlessly through `window.__doids` (exposed at the
// bottom of `js/render.js`). Every spec file loads the game the same way and
// fails on any console error or uncaught exception, so that lives here rather
// than being copy-pasted per file.
//
// Adding a test: pick the spec file whose concern it belongs to (see
// tests/README.md), call `useGame(test, expect)` once at the top of the file if
// it isn't there already, then
//   await page.evaluate(() => { __doids.go(3); __doids.launch(); });
//   const s = await page.evaluate(() => __doids.get());
// and assert on `s`. When you add a feature, expose its state in
// `__doids.get()` first (see APP_STORE_ROADMAP.md — "How to work on this").
const path = require("path");

const GAME_URL = "file://" + path.resolve(__dirname, "..", "index.html");

// Installs the per-test guard: navigate to the game, wait for the debug handle,
// and fail the test if anything logged an error or threw. Call once per file.
function useGame(test, expect) {
  let errors = [];
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on("pageerror", e => errors.push("pageerror: " + e.message));
    page.on("console", m => {
      if (m.type() === "error") errors.push("console.error: " + m.text());
    });
    await page.goto(GAME_URL);
    await page.waitForFunction(() => window.__doids !== undefined);
  });
  test.afterEach(() => {
    expect(errors, "no console errors or uncaught exceptions").toEqual([]);
  });
}

module.exports = { GAME_URL, useGame };
