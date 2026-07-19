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

`index.html` is the whole game — one inline `<script>` and one `<style>`, served
as a static file. GitHub Pages deploys it straight from `main`
(https://burners70.github.io/Hollow-Oath/). There is **no bundler, no transpile,
no dependency install** for the game itself. Any change must keep `index.html`
runnable by just opening it. Don't introduce a build tool without asking.

## How to work efficiently in this repo (read before touching files)

`index.html` is ~5,400 lines / ~232 KB. Loading it whole costs ~58K tokens — do
**not** do that for a routine change. Instead:

1. **Find the section** in the index below (or `Grep` for a function/identifier).
2. **`Read` with `offset`/`limit`** to pull only that range, then `Edit` in place.
3. Reach for the full file only when a change genuinely spans many sections.
4. **Don't read the big docs for context you don't need** — see the doc guide. In
   particular, never load `docs/CHANGELOG.md`, `docs/GAME_DESIGN.md`, or all of
   `docs/APP_STORE_ROADMAP.md` just to warm up. Grep them for the one thing you need.

## index.html section index (line ranges are approximate — grep to confirm)

| Lines | Section |
|-------|---------|
| 85–127   | Header notes, Capacitor/`NATIVE` detection, canvas + viewport, `resize()` |
| 128–252  | Touch input: multi-touch tracker, on-screen buttons, `canvasTap`, fullscreen |
| 253–321  | Keyboard (`keyMap`) + gamepad (`pollPad`) |
| 322–368  | Tilt / gyro steering |
| 369–560  | Audio: WebAudio graph, `blip`/`boom`/`heartbeat`/`staticTick`/`hydraulic`, music drone |
| 561–665  | Haptics, iCloud `cloud`, Game Center `gc` integration |
| 666–791  | Utils (`mulberry32`, `clamp`, `lerp`, `wrapText`) + world data tables (`SECTOR_NAMES`, `BRIEFS`, `FRAGMENTS`, `SHRINES`, `FAMOUS`) |
| 792–808  | Core constants (`GRAV`, `THRUST`, `WORLD_H`, `CAPACITY`) + global run state |
| 809–1070 | Run seed/mode plumbing + persistence: `savedRun`, settings, codex, logs, daily, intro (all `localStorage`) |
| 1071–1180| Daily-challenge modifiers |
| 1181–1398| `genLevel(n)` — level generation |
| 1399–1546| `roofAt`, `genCave` — caves / interior surfaces |
| 1547–1761| The 41-second Static clock, extraction/MERCY logic, control visibility |
| 1762–1863| `update(dt)` — main state dispatch |
| 1864–2074| Rank system + per-screen updates (menu, intro, brief, clear, pause, settings) |
| 2075–2668| Gameplay updates: `updatePlay`, oids, enemies, sabotage, scan, docking, blackbox |
| 2669–3010| Transfusion refuel minigame, pods, resupply, lift, shrine, decoy, beacon |
| 3011–3062| Epilogue + `drawGlow` |
| 3089–3231| `render()` dispatch, boundary field |
| 3232–3687| World render: terrain, darkness, ship, resupply drone, landing guide, oids, scenery |
| 3688–4160| Figure render: android/Scions, Asclepius, shrine |
| 4161–4390| Tractor beam, mothership, decoy MERCY, beacon |
| 4391–4542| HUD, health bar, ECG |
| 4543–4955| Title screen, codex (Minds / Archive) |
| 4956–5149| Intro screen, portrait warning, brief, card panel, clear, pause |
| 5150–5346| Settings screen, game over, ending, win, centered text |
| 5347–5363| Main loop (`frame`, `requestAnimationFrame`) |

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
