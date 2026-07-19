# Handoff brief — split `index.html` into smaller source files (Tier B)

**For:** D (first action). **Status:** not started. **Type:** structural refactor, no gameplay change.

## Why this exists

`index.html` is ~5,400 lines / ~232 KB in one inline `<script>` + one `<style>`.
Every code edit forces a session to load the whole file (~58K tokens) before it
can change anything. `CLAUDE.md` (the section map) already softened this; splitting
the file into concern-based source files finishes the job — an edit to audio then
touches a ~200-line file, not a 5,400-line one. This is the last outstanding
token-saver from the July 2026 efficiency pass (see PRs #10/#11).

## The one hard constraint (do not break it)

**No build step.** The game must still run by opening `index.html` as a static
file — GitHub Pages serves `main` straight to the live site, and Capacitor wraps
the same file for iOS. No bundler, no transpile, no dependency install. See
`../CLAUDE.md` → "The one hard constraint".

## Recommended approach: plain `<script src>` split (lowest risk)

The whole script currently lives in **one global scope** (310 top-level
declarations, no modules). So the safe, no-build split is to cut the inline
`<script>` into several **ordinary** `<script src="js/*.js">` tags loaded in order
— they keep sharing the global scope exactly as today. **Do not** convert to
`type="module"` on the first pass: ES modules change scoping (everything becomes
file-local) *and* can fail to load over Capacitor's iOS `file://` origin. Modules
are a possible later step, only after the plain split is verified.

Also extract the `<style>` block to `css/game.css` via `<link rel="stylesheet">`.

### Suggested file split (mirror the `CLAUDE.md` section index)

Cut on the existing `/* ===== ... ===== */` banners so ranges stay clean:

| New file | Covers (see CLAUDE.md line ranges) |
|----------|-------------------------------------|
| `js/input.js`   | canvas/resize, touch, keyboard, gamepad, tilt (85–368) |
| `js/audio.js`   | WebAudio, sfx, music (369–560) |
| `js/platform.js`| haptics, iCloud `cloud`, Game Center `gc` (561–665) |
| `js/world.js`   | utils, data tables, constants, persistence, daily, level/cave gen (666–1546) |
| `js/update.js`  | Static clock, extraction, all `update*` gameplay (1547–3062) |
| `js/render.js`  | all `draw*`/`render` (3063–5346) |
| `js/main.js`    | the `frame()` loop + bootstrap (5347–end) |

Adjust boundaries as needed — the ordering must satisfy load-time references
(constants/utils before the code that uses them; `main.js` last). Because it's one
shared global scope, function *definitions* can be split freely; only top-level
*executed* statements are order-sensitive.

## Guardrails

- Keep the `doids_` localStorage prefix and any `__doids`/global debug handles.
- Don't rename functions/vars — this is a move, not a rewrite. A near-empty diff
  per line (just relocated) is the goal; makes review trivial.
- Watch anything touching `window.Capacitor` / `NATIVE` — flag iOS-affecting moves.

## Verification (must pass before merge)

1. **Open `index.html` directly** in a browser — game boots, plays, no console errors.
2. **Smoke tests:** `cd tests && npm ci && npx playwright test` — all green.
3. **iOS/Capacitor:** confirm the wrapped build still loads all `js/*.js` over
   `file://` (this is the main risk of the split — verify before merging).
4. Merging to `main` publishes live, so treat this as a release: verify first.

## Acceptance

- `index.html` is a thin shell (`<link>` + ordered `<script src>` tags), game
  unchanged, tests green, iOS build loads. Then `CLAUDE.md`'s section index should
  be updated to point at the new files instead of line ranges.
