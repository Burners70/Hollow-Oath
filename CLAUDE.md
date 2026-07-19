# CLAUDE.md — working map for Hollow Oath

Read this first. It exists so a session can find the right code and docs **without
loading everything**. Following the "How to work efficiently" rules below is the
difference between a cheap session and an expensive one.

## What this is

Hollow Oath is an original 2D gravity-rescue game: a single self-contained HTML5
canvas game (vanilla JS, no framework), shipped as a PWA and wrapped with
Capacitor for a native iOS build. Formerly "DOIDS" — that old name survives in
code identifiers and `localStorage` keys (see below), which is expected, not a bug.

## The one hard constraint: no build step

The game is served as static files, with **no bundler, no transpile, no
dependency install**. `index.html` is a thin shell: a `<link>` to `css/game.css`
and an ordered list of plain `<script src="js/*.js">` tags. Those scripts are
**not** ES modules — they load in order and share one global scope, exactly as the
old single inline `<script>` did (that's why the split was safe and why order
matters: constants/utils before their users, `js/main.js` last). GitHub Pages
deploys straight from `main` (https://burners70.github.io/Hollow-Oath/) and
Capacitor wraps the same files for iOS. Any change must keep the game runnable by
just opening `index.html`. Don't introduce a build tool or convert to
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
| `js/input.js`    | ~300  | Header notes, Capacitor/`NATIVE` detection, canvas + `resize()`; touch multi-touch tracker + on-screen buttons + `canvasTap`; keyboard (`keyMap`) + gamepad (`pollPad`); tilt/gyro steering |
| `js/audio.js`    | ~436  | WebAudio graph, `blip`/`boom`/`heartbeat`/`staticTick`/`hydraulic`/`ringHollow`, generative ambient music drone |
| `js/platform.js` | ~110  | Haptics facade (F1), iCloud `cloud` save-sync (E4), Game Center `gc` (G4); runs `gc.auth()` at load |
| `js/world.js`    | ~1016 | Utils (`mulberry32`, `clamp`, `lerp`, `wrapText`); story data tables (`SECTOR_NAMES`, `BRIEFS`, `FRAGMENTS`, `SHRINES`, `FAMOUS`); constants + global run state; run seed/mode plumbing + all `localStorage` persistence; daily modifiers; `genLevel`, `roofAt`, `genCave`; `resetRun`/`toBriefing` state flow |
| `js/update.js`   | ~1884 | The 41-second Static clock; landing rules + extraction/MERCY; `update(dt)` dispatch; rank system; per-screen + gameplay updates (`updatePlay`, oids, enemies, sabotage, scan/reveal, docking, blackbox, transfusion, lifts, counterfeit MERCY, epilogue) |
| `js/render.js`   | ~2883 | `render()` dispatch + `drawGlow`/perf helpers; world render (terrain, darkness, ship, drone, oids, scenery); figures; counterfeit MERCY; HUD/health/ECG; all screens (title, codex, intro, brief, clear, pause, settings, game over, win); the `window.__doids` debug handle |
| `js/main.js`     | ~25   | Bootstrap (`genLevel(0)`, `spawnShip`, …) + the `frame()`/`requestAnimationFrame` loop — must load last |

## localStorage keys (all prefixed `doids_`)

`doids_run` (resume snapshot), `doids_hi` (hiscore), `doids_codex`, `doids_logs`,
`doids_shrines_seen`, `doids_daily`, `doids_intro`, `doids_a2hs`, `doids_tilt`,
`doids_snd`, `doids_mus`, `doids_assist`, `doids_hapt`, `doids_cb` (colorblind),
`doids_easy` (Field Medic), `doids_bigtext`, `doids_flash` (reduced flash),
`doids_unres` (unresolved haunt), `doids_veteran`. Keep the `doids_` prefix on new
keys for consistency with the shipped save format.

## Documentation guide — what to read for what

The **active forward plan** is `docs/APP_STORE_ROADMAP.md`: checkbox-tracked
bundles toward the paid iOS release. To "follow the roadmap," grep it for the next
unchecked `[ ]` bundle and read only that section — don't ingest all 1,284 lines.

Everything else lives in `docs/` (see `docs/README.md` for the full index). Read a
doc only when the task touches it:

- `docs/GAME_DESIGN.md` — canonical design & narrative (the Static, Glycon, mechanics, scoring). Read when changing game rules or story.
- `docs/COPY_DECK.md` — user-facing text. Read when editing wording.
- `docs/PENDULUM_SPEC.md`, `docs/HOLLOWS_EXPANSION_SPEC.md` — feature specs (Bundle P, Bundle Q).
- `docs/GAMECENTER_ACHIEVEMENTS.md` — achievement/rank list.
- `docs/RELEASE_READINESS_REVIEW.md` — July 2026 QA snapshot.
- `docs/CHANGELOG.md` — history incl. the DOIDS→Hollow Oath rename. Reference only.
- `docs/ROADMAP.md`, `docs/HOLLOW_OATH_BRIEF.md` — older build-out notes and the rename brief. Archival; rarely needed.

## Workflow

- **Branch:** develop on the feature branch you were assigned; never push to `main` without explicit permission. Pages deploys from `main`, so a merge to `main` is a live release.
- **Tests:** Playwright smoke tests in `tests/` (`tests/smoke.spec.js`) load `index.html`. Run with `cd tests && npm ci && npx playwright test`. Chromium is preinstalled — don't run `playwright install`.
- **iOS wrapper:** `app/` holds the Capacitor config, custom plugins (`game-connect`, `icloud-kv`), and Mac setup notes (`app/MAC_SETUP.md`). Changing on-page JS that touches `window.Capacitor` can affect the native build — flag it.
- **Assets:** icons/manifest at root (`icon-*.png`, `manifest.webmanifest`, `apple-touch-icon.png`); art in `assets/`.

## Conventions

- Match the surrounding style: terse vanilla JS, single global scope, comment banners like `/* ===== render ===== */` and `/* Bundle X — ... */` tying code to roadmap bundles.
- Keep everything inline in `index.html` unless a restructure is explicitly requested.
- The game targets iPhone Safari first; test touch/gyro/safe-area behavior, not just desktop.
