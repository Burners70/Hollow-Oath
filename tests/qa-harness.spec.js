// Hollow Oath — QA harness drift guard.
//
// tests/qa-harness.html is the tap-driven on-device rig (docs/QA_HARNESS.md).
// It is the tool Act Two's feel values are tuned with, and it is the one file in
// the repo that CANNOT be smoke-tested the way everything else is: it drives the
// game through an iframe, and reaching into `frame.contentWindow` needs the
// harness and the game to be same-origin. The suite deliberately loads the game
// over `file://` with no web server (tests/playwright.config.js), and a
// `file://` iframe is an opaque origin in Chromium — so a live test of the rig
// would mean standing up an HTTP server for one file and giving up the
// no-server property the rest of the suite is built on.
//
// So this is a STATIC guard instead, in the spirit of copy-deck.spec.js: read
// both sources as text and check they still agree. It catches the failure mode
// that actually happens — a `__doids` driver gets renamed or removed, and the
// harness keeps its button, which then does nothing on a phone with no clue why.
// It cannot catch a runtime bug in the harness's own logic; for that, serve the
// repo over HTTP and drive it by hand (see docs/QA_HARNESS.md).
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HARNESS = fs.readFileSync(path.join(__dirname, "qa-harness.html"), "utf8");

function jsSource() {
  const dir = path.join(ROOT, "js");
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".js"))
    .map(f => fs.readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

/* Methods the harness reads off the game's window rather than off __doids.
   Legal only for FUNCTION DECLARATIONS: a classic script's top-level `let`/
   `const` lives in the global lexical environment and is NOT a property of
   window, so `contentWindow.SLING_L` is undefined while
   `contentWindow.markTrained` works. That asymmetry is why the Act Two dials are
   exposed through __doids.a2Dials() instead of being read directly. */
const WINDOW_FNS = ["markTrained", "markIntroSeen", "startFreshRun"];

test("every harness button maps to an action", () => {
  const buttons = [...HARNESS.matchAll(/data-run="([^"]+)"/g)].map(m => m[1]);
  expect(buttons.length).toBeGreaterThan(10);
  // the actions object is `var actions = { ... };` — collect its top-level keys
  const block = HARNESS.slice(HARNESS.indexOf("var actions = {"));
  const missing = [...new Set(buttons)].filter(b =>
    !new RegExp("(^|[\\s{,])" + b + ":\\s*function").test(block));
  expect(missing, "buttons with no matching action in the harness script").toEqual([]);
});

test("every __doids call the harness makes still exists in the game", () => {
  const src = jsSource();
  /* Pull `d.something(` out of the harness — `d` is the __doids handle
     everywhere in the actions object. Then require each name to be defined as a
     key in the handle (`name:` or `name,` shorthand) somewhere in js/. */
  const called = [...new Set([...HARNESS.matchAll(/\bd\.([A-Za-z0-9_]+)\s*\(/g)].map(m => m[1]))];
  expect(called.length).toBeGreaterThan(10);
  const missing = called.filter(name =>
    !new RegExp("(^|[\\s{,])" + name + "\\s*:").test(src) &&
    !new RegExp("(^|[\\s{,])" + name + "\\s*,").test(src));
  expect(missing, "__doids methods the harness calls but the game no longer exposes").toEqual([]);
});

test("the window-level calls the harness makes are function declarations", () => {
  const src = jsSource();
  const called = [...new Set([...HARNESS.matchAll(/frame\.contentWindow\.([A-Za-z0-9_]+)\s*\(/g)]
    .map(m => m[1]))].filter(n => n !== "localStorage");
  expect(called.sort()).toEqual([...WINDOW_FNS].sort());
  /* Each must be a real `function name(` declaration. A `const name = () => {}`
     would parse fine and be unreachable from the harness — silently, which is
     the whole point of asserting the SHAPE and not just the presence. */
  for (const n of called)
    expect(new RegExp("function\\s+" + n + "\\s*\\(").test(src), n + " is a function declaration").toBe(true);
});

test("the harness stays branch-agnostic and SHA-pinned", () => {
  // docs/QA_HARNESS.md: pin a commit SHA, never a branch — raw.githack and iOS's
  // Home-Screen cache both serve stale content for a branch URL. The default is
  // only a starting point (?src= and the Build box override it), but a BRANCH
  // default is a trap: it silently drifts to whatever that branch is today.
  const defaults = [...HARNESS.matchAll(/raw\.githack\.com\/[^"'\s]+/g)].map(m => m[0]);
  expect(defaults.length).toBeGreaterThan(0);
  for (const url of defaults) {
    // the match starts at the HOST, not at the scheme:
    //   raw.githack.com / owner / repo / <ref> / path…
    //         0             1       2       3
    const ref = url.split("/")[3];
    expect(/^[0-9a-f]{40}$/.test(ref), url + " pins a 40-char commit SHA, not a branch").toBe(true);
  }
  // and the harness must not hardcode a branch name anywhere else either
  expect(/claude\/[a-z0-9-]+/.test(HARNESS), "no branch names in the harness").toBe(false);
});

test("harness preference keys never collide with the game's save format", () => {
  /* The harness and the game share an origin on purpose (that is what makes
     driving the iframe legal), so they share one localStorage. Harness keys must
     be `hoqa_`-prefixed, and "Clear save" must preserve them — a bare
     localStorage.clear() would take the build URL you just pasted with it. */
  const keys = [...HARNESS.matchAll(/localStorage\.(?:get|set)Item\(([^,)]+)/g)].map(m => m[1].trim());
  expect(keys.length).toBeGreaterThan(0);
  for (const k of keys)
    expect(/PREF|keep|k\b/.test(k), "harness localStorage key is prefixed: " + k).toBe(true);
  expect(HARNESS).toContain('var PREF = "hoqa_"');
  expect(HARNESS).not.toMatch(/localStorage\.setItem\(\s*["']doids_/);
});
