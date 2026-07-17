# Changelog

## Bundle B — emblem replacement, red cross → rod of Asclepius (July 2026)

Implemented the second App Store roadmap bundle (legal blocker — the red
cross is protected under the Geneva Conventions). Added `drawAsclepius(h,
color, minimal)`: a serpent coiled on a staff drawn with the same
neon-stroke bezier style as `drawShrine`'s coil, with a `minimal` mode (a
single S-curve stroke, no staff) for the tiny Scion-scale emblem. Replaced
every red-cross `fillRect` pair — `drawMothership()`, `drawWreckM()`,
`iShip()`, and the `doidFigure()` chest emblem — with calls into the new
helper; renamed the `crossCol` parameter to `emblemCol` throughout and swept
"cross" out of nearby comments. `GAME_DESIGN.md` §2.4 now records the emblem
duality (the true serpent vs. Glycon's masked one). Verified visually via
Playwright screenshots of the title screen and two sectors; smoke suite
still 8/8 green (no new state to test — purely visual).

## Bundle A — pause, mid-run save & resume (July 2026)

Implemented the first App Store roadmap bundle. `doids_run` now snapshots
`levelIdx`/score/lives/upgrades/etc. at every sector boundary (`toBriefing`);
the title screen shows a `▶ RESUME — <SECTOR>` pill when a snapshot exists,
restoring it via a new `restoreRun()` helper. Added a `"pause"` state (❚❚ HUD
button, `Escape`/`p`, and the gamepad Start button while flying) with a
RESUME / RESTART SECTOR / QUIT TO TITLE menu; auto-pauses on
`visibilitychange` so backgrounding never loses a run mid-flight. Game over
now offers **CONTINUE** (restores the sector-start checkpoint with 3 lives
and −25% score, via a new `checkpoint` captured just before the run snapshot
is cleared) alongside the existing NEW ROTATION. `__doids.get()` gained
`hasSave` and `paused`; two new smoke tests cover reload-resume and the pause
toggle (8/8 passing).

## App Store roadmap added (July 2026)

Added **[APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md)**: the prioritised,
checkbox-tracked plan to ship Hollow Oath as a paid iOS App Store title. Fifteen
PR-sized bundles (A–O) covering pause/save/resume, the red-cross emblem
replacement (legal), audio & settings, performance, the Capacitor wrapper and
compliance, haptics, Game Center, accessibility, and the narrative/replay
elevation work (41-second clock, scan mechanic, log archive, remix mode,
counterfeit-MERCY finale). Each bundle names its code anchors, storage keys,
acceptance criteria, and tests so any developer can pick one up cold.
Cross-links added from README.md, ROADMAP.md (now explicitly the historical
log), and GAME_DESIGN.md §10. No game code changed in this pass.

**A&M references scrubbed (personal project).** The default end-of-run rank in
`index.html` is now "FLIGHT SURGEON, MERCY RESCUE DIVISION" (was "…A&M RESCUE
DIVISION"), the doc headers no longer say "A&M internal", and the roadmap's
suggested bundle ID is a personal reverse-DNS ID (`com.burners70.hollowoath`,
to be confirmed before first submission). The in-fiction ship prefix **AMS**
(AMS MERCY, AMS SOLACE) is unrelated naval-style styling and is unchanged.

**Test harness bootstrapped in `tests/`.** The Playwright smoke suite the docs
referenced previously lived only in an ephemeral session scratchpad; it is now
committed: `tests/smoke.spec.js` (boot, all 8 sectors, finale beacon/black
boxes, cave descent via secret lift, landing evaluator + rank flags, briefing
render, and a fail-on-any-console-error guard on every test), plus
`package.json`/`playwright.config.js` (with a `PLAYWRIGHT_EXECUTABLE_PATH`
override for containers with a pre-installed Chromium). Run:
`cd tests && npm install && npm test`. README, GAME_DESIGN §9, and the roadmap
conventions now point at it. 6/6 passing at commit time.

**Homage line loosened, nostalgia kept loud (owner decision).** The homage is
now tiered by surface: the in-game title tagline is era-evocative without
trademarks ("a love letter to the 16-bit lander classics", was "in the spirit
of the Atari ST classic"); the README names the lineage outright (*Oids*,
*Thrust*, *Gravitar*) with an explicit original-and-unaffiliated line, because
the web is where nostalgia searchers arrive from Google; App Store metadata
will stay trademark-free per Apple 2.3.7 (see roadmap E7/O2, where the policy
is recorded).

## Rename: DOIDS → Hollow Oath (July 2026)

The game was renamed from **DOIDS** to **Hollow Oath**, and the rescued medical
androids from **"Doids"** to **"Scions"**. This log exists so any developer can
see exactly what changed, what was deliberately left alone, and why.

### Why
- **Distinctness for release.** "Doids" is one letter from *Oids* (an FTL Games
  trademark) and the project openly described itself as an "homage to Oids" —
  too close to safely publish. Mechanics aren't protectable, but the *name* is
  the exposure. "Hollow Oath" is brandable and semantically distant.
- **Scions** replaces "Doids" as the in-fiction android name: they are carriers
  of true medical science, the culmination of generations of human — and now
  machine — endeavour. It also sharpens the theme (the villain's counterfeits are
  *hollow* Scions).
- **The title now earns its place.** New copy and one new rank tie "hollow" (the
  caves, the counterfeits) and "oath" (*primum non nocere*) together in-game
  rather than leaving them to box art.

### What changed
**Product name (user-facing) → "Hollow Oath":**
- `index.html`: `<title>`, `apple-mobile-web-app-title` meta, the add-to-home
  banner text, the big title-screen text (now "Hollow Oath", mixed case, resized
  to fit), and the portrait-gate line.
- `manifest.webmanifest`: `name`, `short_name`, `description`.

**In-fiction android name → "Scions":** every user-facing string and code comment
in `index.html` (HUD "SCION ABOARD" / "SCIONS ABOARD" / "SCION(S) LOST", help
text, intro captions, title subtitle, shrine/ending narrative, codex), and all
prose in `README.md`, `GAME_DESIGN.md`, `ROADMAP.md`.

**Docs:** `README.md`, `GAME_DESIGN.md`, `ROADMAP.md` updated; this `CHANGELOG.md`
and `HOLLOW_OATH_BRIEF.md` added. An earlier scratch reconstruction (`DESIGN.md`,
written before the real code/docs were available) was **removed** — fully
superseded by `GAME_DESIGN.md` and the brief.

**Narrative — title threaded through the story (new copy):**
- **THE SHRINE** (Glycon reveal) gains a line in the villain's register:
  *"An oath you never test is easy to keep."*
- **THE WORKSHOP** reveal now names the method: *"Not corrupted. Hollow. Built
  empty, and dressed to be carried home in good faith."*
- **Ending epilogue lines:** answered → *"The oath, kept whole."*; fire →
  *"Quiet, at a cost. The oath, hollowed."*; unresolved → *"Left hollow. The
  Static answers still."*

**New rank: HOLLOW KEEPER.** On the answered ("good") ending, a player who broke
the no-fire oath *only* to open Glycon's secrets (shot a lure-tree or hollow
rock), never in combat, is now ranked **HOLLOW KEEPER** — between OATH KEEPER
(no shot fired) and THE ONE WHO ANSWERED (fired in combat). Epilogue: *"You found
what he hid. It cost you the oath to do it."*
- New module state: `firedAtSecret` (set when a shot destroys a lure-tree /
  hollow rock) and `firedAtCombat` (set when a shot destroys a turret / drone),
  declared and reset in `resetRun()`, and now reported by `window.__doids.get()`.

### What was deliberately NOT changed (and why)
- **localStorage keys** (`doids_hi`, `doids_codex`, `doids_assist`, `doids_tilt`,
  `doids_intro`, `doids_a2hs`) — kept. Renaming them would wipe existing testers'
  hi-scores, codex, and settings for zero player-facing benefit. They're
  invisible to players.
- **Internal identifiers** — `window.__doids`, `doidFigure()`, `iDoid()`, and
  similar are not user-facing; left as-is to avoid churn and needless diff noise.
- **Branch names** (`claude/doids-iphone-game-r4fnon`, etc.) — not user-facing;
  left as-is.

### Repository & URL
**Done:** the GitHub repo was renamed **`Doids` → `Hollow-Oath`** (a Settings
action; not doable from git). Live consequences:
1. Repo is now `https://github.com/Burners70/Hollow-Oath` and Pages serves from
   `https://burners70.github.io/Hollow-Oath/`. GitHub auto-redirects the old
   `.../Doids/` paths for a while, but update external links.
2. The live Pages *content* only reflects the rename once these changes land on
   the Pages deploy branch (`claude/doids-iphone-game-r4fnon`).
3. Local clones need `git remote set-url origin https://github.com/Burners70/Hollow-Oath.git`.

In-repo references (README, GAME_DESIGN, manifest description) point to the
`Hollow-Oath` URL and are now correct.

### Verification
Headless Chromium (Playwright) smoke test after the changes: game boots, document
title is "Hollow Oath — a gravity rescue", all 8 sectors generate and run, the new
`firedAtSecret`/`firedAtCombat` flags are present, **no console errors**.
