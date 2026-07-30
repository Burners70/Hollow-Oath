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
| `js/world.js`    | ~1470 | Utils (`mulberry32`, `clamp`, `lerp`, `wrapText`); the design-system token layer (`TOK`, `PALETTES`/`PAL()`, `shade()`, `mono()`/`body()`/`display()` — Bundle DS); story data tables (`SECTOR_NAMES`, `BRIEFS`, `FRAGMENTS`, `SHRINES`, `FAMOUS`); constants + global run state; run seed/mode plumbing + all `localStorage` persistence; daily modifiers; `genLevel`, `roofAt`, `genCave`; the span terrain layer (`spanAt`/`solidAt`/`levelH` — Bundle P, P·terrain); `resetRun`/`toBriefing` state flow |
| `js/update.js`   | ~2610 | The 41-second Static clock; landing rules + extraction/MERCY; `update(dt)` dispatch; rank system; per-screen + gameplay updates (`updatePlay`, oids, enemies, sabotage, scan/reveal, docking, blackbox, transfusion, lifts, counterfeit MERCY, epilogue) |
| `js/render.js`   | ~4400 | `render()` dispatch + `drawGlow`/perf helpers; world render (terrain, darkness, ship, drone, oids, scenery); figures; counterfeit MERCY; HUD/health/ECG; all screens (title, codex, intro, brief, clear, pause, settings, game over, win); the `window.__doids` debug handle |
| `js/main.js`     | ~40   | Bootstrap (`genLevel(0)`, `spawnShip`, …) + the `frame()`/`requestAnimationFrame` loop — must load last |

### Bundle P / Act Two gets new files — an approved exception

**Owner decision, July 2026.** The "keep new code inside the existing files"
convention below is **explicitly lifted for Act Two** (Bundle P — span terrain,
the tether, racks, the ten chambers, a second rank ladder). Folding that much new
code into `js/world.js`, `js/update.js` and `js/render.js` would make every future
session more expensive to run, which is the exact cost the July 2026 split was
done to avoid. **Do not "tidy" these files back into the originals.**

Planned files and their load position (insert **after `js/world.js`** so the token
layer, constants and utils exist, and **before `js/update.js`**):

| File | Lines | Covers |
|------|-------|--------|
| `js/acttwo-data.js`   | ~250 | **Landed (P·design):** the rack's token/state layer — `RACK_STATES`, `RACK_PULSE_PERIOD`, the beat envelope, `rackColor`/`rackBrightness`, `PLANT_ZONES`/`plantPal` — same data/no-drawing split as `PAL()`/`TOK` in `js/world.js`. **Landed (P·terrain):** the chamber authoring grammar (`room`/`rock` parts with per-boundary roughness) and its compiler — `compileChamber`, `spanUnion`/`spanSubtract`, `chamberNoise`, `spanCountAt` — plus `SLICE_CHAMBER` (the one chamber, proving the format) and `genChamber` (compiles a chamber to a level-shaped object, **terrain only**). A part may declare a **view** (`drawn`/`solid`), which is how §8's false floors and painted rock are held: `genChamber` compiles `spans` (collision truth) and `spansDrawn` (what you see) from one definition, identical unless a deception is declared. Chambers also carry **lights** and **ornaments**, snapped to real surfaces. `RACK_SIZE`/`RACK_OCCUPANTS_DEFAULT` size a rack against what a laden ship can lift through a chamber, and `SLING_L`/`towEnvelope`/`towTierForGap` classify every gap as passable at rest, a **momentum pinch** (only with the load swung up to your level), or unladen-only. Per-boundary **materials** (`MAT_ROCK`/`MAT_MACH`, `ROCK_PAL`) carry the owner's "rock overhead, mechanical underfoot" rule, and boundary **profiles** (`boundaryProfile` — `ramp`/`arc`/`teeth`, plus `cornerInset` fillets) keep chambers off pure right angles. **Still to come:** the other nine chambers (P·content), Act Two's story tables and its own rank ladder (P·scions) |
| `js/acttwo-update.js` | — | Not started. Tether physics, racks and reserves, trunk-cut pulse reading, the well, the transfusion inversion, chamber checkpointing |
| `js/acttwo-render.js` | ~510 | **Landed (P·design):** the rack cage, conduit real-vs-fake tell, the network ripple/dip (riding the real `staticClock`), directional edge bleed, ornamentation, the sling and the well's bay/winch — gated on level fields no `genLevel` path sets yet (inert no-ops today). **Landed (P·terrain):** span terrain drawing — `buildSpanTile`/`getSpanTiles`/`drawChamberTerrain` draw a chamber's rock as the *complement* of its spans, reusing Act One's per-512px tile cache contract (`tileTouch`/`TILE_CACHE_CAP`/`invalidateTiles`), `drawMachinedPanelTicks` walks spans so an overhang's underside gets ticked too, and `drawChamberLights` lays additive light pools plus an ambient lift over the terrain (§9.2 — a plant is lit *by* something). Drawing reads `level.spansDrawn`; collision reads `level.spans`. The provisional heightmap stand-in this file shipped with is gone. **Still to come:** the ward's four readability channels (P·systems), Act Two screens |

**The span primitives deliberately stayed in `js/world.js`**, beside `groundAt` —
they generalise the *shipped* terrain model rather than adding to Act Two, and
Act One's collision calls them every frame. Grep "columns of spans" there:
`spanAt`/`pickSpan`/`matchSpan`/`solidAt`/`levelH`, plus the **optional second
argument** on `groundAt`/`roofAt` that says which span you mean. Every Act One
call site passes `x` alone and takes the heightmap path completely unchanged,
which is what keeps the M1 golden checksum green — that equivalence is the
constraint to preserve if you touch any of it.

The constraints that are *not* lifted, because they are technical rather than
stylistic: scripts stay **non-module** sharing one global scope, **load order
stays significant**, `index.html`'s `<script>` list must be updated in the same
PR, and `app/sync.sh` copies `js/` wholesale so new files inside `js/` need no
sync change. Update this table as more of each file lands.

## localStorage keys (all prefixed `doids_`)

`doids_run` (resume snapshot), `doids_hi` (hiscore), `doids_codex`, `doids_logs`,
`doids_shrines_seen`, `doids_daily`, `doids_intro`, `doids_a2hs`, `doids_tilt`,
`doids_snd`, `doids_mus`, `doids_assist`, `doids_hapt`, `doids_cb` (colorblind),
`doids_easy` (Field Medic), `doids_bigtext`, `doids_flash` (reduced flash),
`doids_unres` (unresolved haunt), `doids_veteran`, `doids_plays` (completed-run
counter, for the review-prompt milestone), `doids_solace` (has the Solace actually
been met — gates her hull on the title). Keep the `doids_` prefix on new
keys for consistency with the shipped save format.

## Documentation guide — what to read for what

The **active forward plan** is `docs/APP_STORE_ROADMAP.md`: checkbox-tracked
bundles toward the paid iOS release, holding **open work only**. To "follow the
roadmap," read its *Open work at a glance* table (top of file) to pick the
bundle, then read only that bundle's section — never the whole file. It is the
*only* forward plan; anything else that reads like a plan is history. Shipped
bundles (A–N, R, S, U, QA, Y, DS, X, Z) moved to `docs/ROADMAP_ARCHIVE.md` — grep there for
an item ID (R10, M1, Y5, …) the plan no longer mentions, and move a bundle there
yourself once its last `[ ]` is checked.

Everything else lives in `docs/` (see `docs/README.md` for the full index). Read a
doc only when the task touches it:

- `docs/GAME_DESIGN.md` — canonical design & narrative (the Static, Glycon, mechanics, scoring). Read when changing game rules or story.
- `docs/COPY_DECK.md` — user-facing text. Read when editing wording (and update it in the same PR).
- `docs/DESIGN_SYSTEM_STARTER.md` — shipped UI tokens (colour/type/spacing/glow) and, in §8, which layer to reach for. Read when adding or restyling a HUD/panel element.
- `docs/ACT_TWO_SPEC.md` — **Bundle P / the 1.1 plan.** Act Two: a ten-level
  authored underground rescue campaign beneath SOLACE, where the pendulum
  debuts. Read this for *what to build*; §14 records what was rejected and why,
  and §15 what's still open. Supersedes PENDULUM_SPEC.md and absorbs Bundle Q's
  caves. Nothing is implemented yet. **Next step is `P·terrain`, not `P·slice`:**
  the shipped heightmap can't express an overhang, so span terrain (§11.0) lands
  before the vertical slice can prove anything. Key July 2026 sections: §5.1a
  (the beacon is a relay), §8.1 (the deception tell, reversed — the old
  "perfectly level" rule was false against `flatten()`), §9.1 (ten new famous
  minds), §11.0 (span terrain), §11.2 (persistence).
- `docs/DESIGN_BRIEF_ACT_TWO.md` — the hand-out for briefing a designer on Act
  Two (roadmap `P·design`). Self-contained by design; read it when a design
  handoff, the rack's visual states or the achievement art comes up. States the
  thing outsiders always need telling: **the game has no sprites** — all visuals
  are procedural canvas drawing, so a handoff is direction + timing numbers.
- `docs/PENDULUM_SPEC.md` — superseded as a plan, but still the **tether-physics
  reference**: the sling model, damage model and tow conventions, which carry
  into Act Two unchanged. Read this for *how the sling works*.
- `docs/HOLLOWS_EXPANSION_SPEC.md` — Bundle Q, now fully dispositioned. Its caves
  are absorbed into Act Two; what survives is the ROTATION CHART's cache design
  (§Q5), a **1.01** item unlocked by Mary Seacole on the Nullwave — see roadmap
  V1. There is no 1.2.
- `docs/GAMECENTER_ACHIEVEMENTS.md` — achievement/rank list.
- `docs/STORE_LISTING.md` — App Store Connect metadata (pricing, description, URLs).
- `docs/TESTER_KIT.md`, `docs/TESTER_LOG.md` — TestFlight round: invite/survey copy, and who's testing.
- `docs/QA_HARNESS.md` — the on-device tap-driven test rig.
- **Archival, rarely needed:** `docs/ROADMAP_ARCHIVE.md` (shipped roadmap bundles), `docs/CHANGELOG.md` (history incl. the DOIDS→Hollow Oath rename), `docs/RELEASE_READINESS_REVIEW.md` (closed July 2026 QA snapshot), `docs/ROADMAP.md` (v2/v3 build-out log + design reasoning trails), `docs/HOLLOW_OATH_BRIEF.md` (the rename brief).

## Workflow

- **Branch:** develop on the feature branch you were assigned; never push to `main` without explicit permission. `main` is not auto-published anywhere (see Bundle O7 above) — a merge is the source for the *next* TestFlight/App Store build, not an instant live release; it only reaches players once someone runs the manual archive/upload step (`app/MAC_SETUP.md`). Still treat a merge as consequential — it's what ships next.
- **Tests:** Playwright smoke suite in `tests/` — 133 tests across concern-based spec files (`boot`, `settings`, `audio`, `worldgen`, `flight`, `rescue`, `finale`, `story`, `copy-deck`), sharing `tests/harness.js`; see `tests/README.md` for which file holds what. They load `index.html` over `file://`. Run with `cd tests && npm ci && npx playwright test` (or `npx playwright test rescue` for one file). CI runs the same suite on every PR (`.github/workflows/tests.yml`). Chromium is preinstalled — don't run `playwright install`. `playwright.config.js` auto-detects the container's browser (the stable symlink `/opt/pw-browsers/chromium`), so no env var is needed. If a run ever errors *"Executable doesn't exist at …chromium…-<rev>"*, that's a version-pin mismatch (the installed `@playwright/test` wants a different Chromium revision than the container ships), **not** a missing file — the config already handles it; only if that fails, set `PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium`.
- **iOS wrapper:** `app/` holds the Capacitor config, custom plugins (`game-connect`, `icloud-kv`), and Mac setup notes (`app/MAC_SETUP.md`). Changing on-page JS that touches `window.Capacitor` can affect the native build — flag it.
- **Manual/on-device testing:** `tests/qa-harness.html` is a standalone tap-driven rig + injected console for trying a build on a phone without a Mac or typed commands — see `docs/QA_HARNESS.md`. It's decoupled from any one branch (`?src=` picks the build), so reuse the same file rather than forking it.
- **Assets:** icons/manifest at root (`icon-*.png`, `manifest.webmanifest`, `apple-touch-icon.png`); art in `assets/`.

## Conventions

- Match the surrounding style: terse vanilla JS, single global scope, comment banners like `/* ===== render ===== */` and `/* Bundle X — ... */` tying code to roadmap bundles.
- **Colour and type come from the token layer, never a literal** (Bundle DS). In JS: `PAL().SAFE|WARN|DANGER|REVEAL` for anything encoding state (it swaps for colourblind mode), `shade(PAL().WARN, .55)` for a translucent variant, `TOK.*` for fixed chrome/flavour, and `body()`/`mono()`/`display()` for type — all in `js/world.js`. In `css/game.css`: `rgba(var(--ho-safe-rgb), a)`. On the marketing pages: `var(--ho-safe)`. A hardcoded `#69f0ae` or `rgba(105,240,174,.7)` fails the guards in `tests/settings.spec.js`. See `docs/DESIGN_SYSTEM_STARTER.md` §8 for which layer to reach for.
- Keep new code inside the existing `js/*.js` concern boundaries (and `css/game.css`); don't add source files or restructure the split unless asked. `index.html` stays a thin shell. **Exception: Act Two / Bundle P has approved new files** — see "Bundle P / Act Two gets new files" above. The rule exists to stop *unasked* drift back toward the old 5,400-line sprawl, not because adding a file is technically risky; adding one is fine when it's asked for, ordered correctly and recorded in the file map.
- Keep the docs honest: `docs/README.md` lists every file in `docs/`, and there is one forward plan (`docs/APP_STORE_ROADMAP.md`). Don't add a second plan doc or a per-branch handover — record the decision in the roadmap bundle it belongs to.
- The game targets iPhone Safari first; test touch/gyro/safe-area behavior, not just desktop.
