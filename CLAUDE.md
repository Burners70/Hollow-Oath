# CLAUDE.md — working map for Hollow Oath

Read this first. It exists so a session can find the right code and docs **without
loading everything**. Following the "How to work efficiently" rules below is the
difference between a cheap session and an expensive one.

## What this is

Hollow Oath is an original 2D gravity-rescue game: a self-contained HTML5
canvas game (vanilla JS, no framework, no build step), shipped as a PWA and wrapped with
Capacitor for a native iOS build. Formerly "DOIDS" — that old name survives in
code identifiers and `localStorage` keys (see below), which is expected, not a bug.

## The one hard constraint: no build step

The game is served as static files, with **no bundler, no transpile, no
dependency install**. `index.html` is a thin shell: a `<link>` to `css/game.css`
and an ordered list of plain `<script src="js/*.js">` tags. Those scripts are
**not** ES modules — they load in order and share one global scope, exactly as the
old single inline `<script>` did (that's why the split was safe and why order
matters: constants/utils before their users, `js/main.js` last). **There is no
public web build.** Bundle O7 (July 2026) took the playable game off the web
before launch so it wouldn't compete with the paid iOS app — `main` is not
published anywhere automatically; it's the source for local dev and for the
Capacitor iOS wrapper, and only reaches players through the manual
TestFlight/App Store release process (`app/MAC_SETUP.md`). The custom domain
https://hollow-oath.com/ (the old `burners70.github.io/Hollow-Oath/` address
still redirects) serves only the marketing/support/privacy shell
(`about.html`/`support.html`/`privacy.html`), from a separate `gh-pages`
branch — not `main`, and not the game. Capacitor wraps the same `main` files
for iOS. Any change must keep the game runnable by just opening `index.html`.
Don't introduce a build tool or convert to
`type="module"` without asking (modules change scoping *and* can fail over
Capacitor's iOS `file://` origin).

`app/sync.sh` mirrors the web build into the Capacitor `webDir` — it copies
`index.html`, the manifest/icons, **and the `js/` + `css/` dirs**. If you add a new
top-level web asset dir, add it there too or the iOS build 404s.

## How to work efficiently in this repo (read before touching files)

The old ~5,400-line `index.html` was split into concern-based files under `js/`
(plus `css/game.css`). An audio tweak now loads a ~440-line file, not the whole
game. To make a change:

1. **Pick the file** from the map below (or `Grep` across `js/` for a
   function/identifier), then `Read` it — most are small enough to read whole.
2. For the two big ones (`js/render.js`, `js/update.js`) still prefer
   `Read` with `offset`/`limit` on the relevant section.
3. **Don't read the big docs for context you don't need** — see the doc guide. In
   particular, never load `docs/CHANGELOG.md`, `docs/GAME_DESIGN.md`, or all of
   `docs/APP_STORE_ROADMAP.md` just to warm up. Grep them for the one thing you need.

## Source file map (line numbers within each file — grep to confirm)

Load order is the order below; it is significant (see "no build step").

| File | Lines | Covers |
|------|-------|--------|
| `js/input.js`    | ~485  | Header notes, Capacitor/`NATIVE` detection, canvas + `resize()`; touch multi-touch tracker + on-screen buttons + `canvasTap`; keyboard (`keyMap`) + gamepad (`pollPad`); tilt/gyro steering |
| `js/audio.js`    | ~605  | WebAudio graph, `blip`/`boom`/`heartbeat`/`staticTick`/`hydraulic`/`ringHollow`, generative ambient music drone |
| `js/platform.js` | ~110  | Haptics facade (F1), iCloud `cloud` save-sync (E4), Game Center `gc` (G4); runs `gc.auth()` at load |
| `js/world.js`    | ~1470 | Utils (`mulberry32`, `clamp`, `lerp`, `wrapText`); the design-system token layer (`TOK`, `PALETTES`/`PAL()`, `shade()`, `mono()`/`body()`/`display()` — Bundle DS); story data tables (`SECTOR_NAMES`, `BRIEFS`, `FRAGMENTS`, `SHRINES`, `FAMOUS`); constants + global run state; run seed/mode plumbing + all `localStorage` persistence; daily modifiers; `genLevel`, `roofAt`, `genCave`; `resetRun`/`toBriefing` state flow |
| `js/update.js`   | ~2610 | The 41-second Static clock; landing rules + extraction/MERCY; `update(dt)` dispatch; rank system; per-screen + gameplay updates (`updatePlay`, oids, enemies, sabotage, scan/reveal, docking, blackbox, transfusion, lifts, counterfeit MERCY, epilogue) |
| `js/render.js`   | ~4400 | `render()` dispatch + `drawGlow`/perf helpers; world render (terrain, darkness, ship, drone, oids, scenery); figures; counterfeit MERCY; HUD/health/ECG; all screens (title, codex, intro, brief, clear, pause, settings, game over, win); the `window.__doids` debug handle |
| `js/main.js`     | ~40   | Bootstrap (`genLevel(0)`, `spawnShip`, …) + the `frame()`/`requestAnimationFrame` loop — must load last |

## localStorage keys (all prefixed `doids_`)

`doids_run` (resume snapshot), `doids_hi` (hiscore), `doids_codex`, `doids_logs`,
`doids_shrines_seen`, `doids_daily`, `doids_intro`, `doids_a2hs`, `doids_tilt`,
`doids_snd`, `doids_mus`, `doids_assist`, `doids_hapt`, `doids_cb` (colorblind),
`doids_easy` (Field Medic), `doids_bigtext`, `doids_flash` (reduced flash),
`doids_unres` (unresolved haunt), `doids_veteran`, `doids_solace` (has the Solace
actually been met — gates her hull on the title). Keep the `doids_` prefix on new
keys for consistency with the shipped save format.

## Documentation guide — what to read for what

The **active forward plan** is `docs/APP_STORE_ROADMAP.md`: checkbox-tracked
bundles toward the paid iOS release, holding **open work only**. To "follow the
roadmap," read its *Open work at a glance* table (top of file) to pick the
bundle, then read only that bundle's section — never the whole file. It is the
*only* forward plan; anything else that reads like a plan is history. Shipped
bundles (A–N, R, S, U, QA, Y, DS) moved to `docs/ROADMAP_ARCHIVE.md` — grep there for
an item ID (R10, M1, Y5, …) the plan no longer mentions, and move a bundle there
yourself once its last `[ ]` is checked.

Everything else lives in `docs/` (see `docs/README.md` for the full index). Read a
doc only when the task touches it:

- `docs/GAME_DESIGN.md` — canonical design & narrative (the Static, Glycon, mechanics, scoring). Read when changing game rules or story.
- `docs/COPY_DECK.md` — user-facing text. Read when editing wording (and update it in the same PR).
- `docs/DESIGN_SYSTEM_STARTER.md` — shipped UI tokens (colour/type/spacing/glow) and, in §8, which layer to reach for. Read when adding or restyling a HUD/panel element.
- `docs/PENDULUM_SPEC.md`, `docs/HOLLOWS_EXPANSION_SPEC.md` — feature specs (Bundle P, Bundle Q).
- `docs/GAMECENTER_ACHIEVEMENTS.md` — achievement/rank list.
- `docs/STORE_LISTING.md` — App Store Connect metadata (pricing, description, URLs).
- `docs/TESTER_KIT.md`, `docs/TESTER_LOG.md` — TestFlight round: invite/survey copy, and who's testing.
- `docs/QA_HARNESS.md` — the on-device tap-driven test rig.
- **Archival, rarely needed:** `docs/ROADMAP_ARCHIVE.md` (shipped roadmap bundles), `docs/CHANGELOG.md` (history incl. the DOIDS→Hollow Oath rename), `docs/RELEASE_READINESS_REVIEW.md` (closed July 2026 QA snapshot), `docs/ROADMAP.md` (v2/v3 build-out log + design reasoning trails), `docs/HOLLOW_OATH_BRIEF.md` (the rename brief).

## Workflow

- **Branch:** develop on the feature branch you were assigned; never push to `main` without explicit permission. `main` is not auto-published anywhere (see Bundle O7 above) — a merge is the source for the *next* TestFlight/App Store build, not an instant live release; it only reaches players once someone runs the manual archive/upload step (`app/MAC_SETUP.md`). Still treat a merge as consequential — it's what ships next.
- **Tests:** Playwright smoke suite in `tests/` — 92 tests across concern-based spec files (`boot`, `settings`, `audio`, `worldgen`, `flight`, `rescue`, `finale`, `story`, `copy-deck`), sharing `tests/harness.js`; see `tests/README.md` for which file holds what. They load `index.html` over `file://`. Run with `cd tests && npm ci && npx playwright test` (or `npx playwright test rescue` for one file). CI runs the same suite on every PR (`.github/workflows/tests.yml`). Chromium is preinstalled — don't run `playwright install`. `playwright.config.js` auto-detects the container's browser (the stable symlink `/opt/pw-browsers/chromium`), so no env var is needed. If a run ever errors *"Executable doesn't exist at …chromium…-<rev>"*, that's a version-pin mismatch (the installed `@playwright/test` wants a different Chromium revision than the container ships), **not** a missing file — the config already handles it; only if that fails, set `PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium`.
- **iOS wrapper:** `app/` holds the Capacitor config, custom plugins (`game-connect`, `icloud-kv`), and Mac setup notes (`app/MAC_SETUP.md`). Changing on-page JS that touches `window.Capacitor` can affect the native build — flag it.
- **Manual/on-device testing:** `tests/qa-harness.html` is a standalone tap-driven rig + injected console for trying a build on a phone without a Mac or typed commands — see `docs/QA_HARNESS.md`. It's decoupled from any one branch (`?src=` picks the build), so reuse the same file rather than forking it.
- **Assets:** icons/manifest at root (`icon-*.png`, `manifest.webmanifest`, `apple-touch-icon.png`); art in `assets/`.

## Conventions

- Match the surrounding style: terse vanilla JS, single global scope, comment banners like `/* ===== render ===== */` and `/* Bundle X — ... */` tying code to roadmap bundles.
- **Colour and type come from the token layer, never a literal** (Bundle DS). In JS: `PAL().SAFE|WARN|DANGER|REVEAL` for anything encoding state (it swaps for colourblind mode), `shade(PAL().WARN, .55)` for a translucent variant, `TOK.*` for fixed chrome/flavour, and `body()`/`mono()`/`display()` for type — all in `js/world.js`. In `css/game.css`: `rgba(var(--ho-safe-rgb), a)`. On the marketing pages: `var(--ho-safe)`. A hardcoded `#69f0ae` or `rgba(105,240,174,.7)` fails the guards in `tests/settings.spec.js`. See `docs/DESIGN_SYSTEM_STARTER.md` §8 for which layer to reach for.
- Keep new code inside the existing `js/*.js` concern boundaries (and `css/game.css`); don't add source files or restructure the split unless asked. `index.html` stays a thin shell.
- Keep the docs honest: `docs/README.md` lists every file in `docs/`, and there is one forward plan (`docs/APP_STORE_ROADMAP.md`). Don't add a second plan doc or a per-branch handover — record the decision in the roadmap bundle it belongs to.
- The game targets iPhone Safari first; test touch/gyro/safe-area behavior, not just desktop.
