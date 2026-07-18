# Hollow Oath — App Store Roadmap

*The prioritised plan to take Hollow Oath from a live web game to a **paid iOS App Store
title**. Work through the bundles in order; check items off (`[ ]` → `[x]`) as they land,
and add a line to [CHANGELOG.md](CHANGELOG.md) per bundle.*

Read [GAME_DESIGN.md](GAME_DESIGN.md) first — it explains the game, the narrative canon,
and the code architecture. [ROADMAP.md](ROADMAP.md) is the *historical* build-out log;
**this file is the forward plan.**

---

## How to work on this

- **The web game stays a single self-contained `index.html`** (inline CSS/JS, zero
  dependencies, no build step). Do not introduce bundlers, frameworks, or split files
  for the game itself. The native wrapper (Bundle E) lives in its own `app/` directory
  and *copies* the web files in — the HTML file remains the source of truth.
- **Keep the `doids_` localStorage prefix and the `__doids` debug handle.** They are
  deliberately unrenamed (renaming wipes existing players' saves — see CHANGELOG.md).
  New persistence keys should also use the `doids_` prefix for consistency.
- **Each bundle = one branch / one PR.** Bundles are ordered by priority and sized to
  be independently shippable. Dependencies are stated per bundle; anything not listed
  as a dependency can be done in parallel.
- **Testing:** the smoke suite lives in **`tests/`** — run it with
  `cd tests && npm install && npm test` (see `tests/playwright.config.js` for
  the pre-installed-Chromium override). It drives the game headlessly through
  `window.__doids` (`get()`, `go(n)`, `launch()`, `warpLift()`, `warpShrine()`,
  `give(upgrade)`, `reset()`), e.g. `page.evaluate(() => __doids.go(5))` then
  assert on `__doids.get()`. Copy the patterns in `tests/smoke.spec.js`. When
  you add a feature: extend `__doids.get()` to expose its state, add a test,
  and **run the suite before opening the PR** — it must stay green.
- **Code anchors** in this document name functions/variables, not line numbers
  (line numbers drift). Everything named lives in `index.html`.

### Status key

- `[ ]` not started · `[x]` done · strike through items we decide to drop (don't delete
  them — the reasoning trail matters).

### Bundle order at a glance

| # | Bundle | Theme | Blocks App Store submission? |
|---|--------|-------|------------------------------|
| A | Pause, save & resume | Playability on mobile | **Yes** |
| B | Emblem replacement | Legal (red cross) | **Yes** |
| C | Audio baseline & settings | Paid-game floor | **Yes** |
| D | Performance pass | Review on real hardware | **Yes** |
| E | Native wrapper & compliance | The actual app | **Yes** |
| F | Haptics | Signature feature | No (but do it with E) |
| G | Game Center | Retention | No |
| H | Accessibility & difficulty | Reach | No |
| I | The 41-second clock | Narrative → mechanic | No |
| J | Scan mechanic | Pacifist path | No |
| K | Log archive codex | Narrative QoL | No |
| L | Title haunting & epilogue | Narrative payoff | No |
| M | Remix mode & daily seed | Replay value / price point | No |
| N | Counterfeit MERCY finale | Glycon's third act | No |
| O | Store listing & submission | Shipping | **Yes (last)** |

Minimum viable paid release = **A + B + C + D + E + F + O**. Everything else raises
the ceiling (and the defensible price).

---

## Bundle A — Pause, mid-run save & resume

**Why:** There is currently no pause and no mid-run persistence. A campaign is 8
sectors in one sitting; if iOS reclaims the app or the player stops, the run is gone.
Game over restarts from sector 0. This is the single biggest playability gap for
mobile. **Priority: 1. Dependencies: none.**

Design decision (keep scope tight): **checkpoint at sector boundaries, not
mid-sector.** Resuming a run re-enters the briefing of the sector the player was in.
Mid-sector world state (positions, which Scions are aboard, etc.) is *not* serialized
in v1.

- [x] **A1. Serialize run state to `doids_run`.**
  Write a JSON snapshot to `localStorage["doids_run"]` at every sector boundary —
  i.e. inside `toBriefing(n)` — containing: `levelIdx`, `score`, `lives`,
  `runSaved`, `runLost`, `runFired`, `firedAtSecret`, `firedAtCombat`,
  `runFragments`, `blackboxCount`, `shrines` (as an array), `upgrades`, and a
  `v: 1` schema version. Wrap in `try/catch` like the other storage calls.
  Clear the key in three places: on game over (`state = "gameover"` transition in
  the `dead` case of `update()`), on win (`saveHi()` is called from both — clearing
  inside a new `clearRun()` helper called next to both `saveHi()` call sites is
  cleanest), and at the top of `resetRun()` **only when starting a fresh run from
  the title** (see A2 — resume must not clear it before restoring).
- [x] **A2. RESUME pill on the title screen.**
  In `drawTitle()`, when a valid `doids_run` exists, draw a `▶ RESUME — <SECTOR
  NAME>` pill (follow the pattern of `assistRect()`/`helpRect()`/`storyRect()`:
  add a `resumeRect()`, draw a stroked rect + label, hit-test it in `updateMenu()`).
  Tapping it restores all fields from the snapshot into the run globals
  (`shrines = new Set(saved.shrines)`, `upgrades = saved.upgrades`, …) and calls
  `toBriefing(saved.levelIdx)`. Plain TAP TO LAUNCH still starts a fresh run
  (calls `resetRun()`, which clears the snapshot).
- [x] **A3. Pause state.**
  Add `"pause"` to the state machine. Enter it from `"play"` via: a small `❚❚`
  tap-target drawn in the HUD top-centre (add `pauseRect()`, hit-test in a new
  early branch of `updatePlay()` using `input.tap` — note `updatePlay` currently
  clears `input.tap` on entry, so check the rect *before* clearing), the `Escape`
  or `p` key, and the gamepad Start button while in play (see `pollPad()` — Start
  currently maps to `input.tap` only when `state !== "play"`).
  The pause screen dims the world (reuse `drawCardPanel`-style overlay) and offers
  three rows, tap-hit-tested: **RESUME**, **RESTART SECTOR** (calls
  `toBriefing(levelIdx)` — run totals stay, sector re-rolls), **QUIT TO TITLE**
  (writes the A1 snapshot first, then `state = "title"`).
  While paused: freeze the sim (early-return in `update()` before `updatePlay`),
  silence `thrustGain`, and keep virtual buttons hidden
  (`updateCtlVisibility()` — add `"pause"` to the states where `want` is false).
- [x] **A4. Auto-pause on backgrounding.**
  On `document.visibilitychange` → hidden while `state === "play"`, enter the
  pause state and write the snapshot. (rAF already stops when hidden; this makes
  the *resume* experience deliberate instead of mid-flight.)
- [x] **A5. Continue from checkpoint on game over.**
  On the game-over screen (`drawCenter("FLATLINE", …)`), offer two options instead
  of only "tap to try again": **CONTINUE — restart <SECTOR> with 3 lives, score
  −25%** (restores the A1 snapshot, `lives = 3`,
  `score = Math.floor(score * 0.75)`, `toBriefing(levelIdx)`) and **NEW ROTATION**
  (current behaviour). Hit-test two stacked rects; keyboard Enter = continue.
- [x] **A6. Expose + test.**
  Add `hasSave` (boolean) and `paused` to `__doids.get()`. Smoke test: start a
  run, `go(3)`, reload the page, assert the resume pill state restores
  `levelIdx === 3` and score/upgrades survive.
- [x] **A7. Bug: CONTINUE box text overspill on game over.** `continueRect()`
  caps the box at `Math.min(300, vw * 0.72)` wide with a fixed `h: 40`, but
  `drawGameOver()` draws `"CONTINUE — " + SECTOR_NAMES[...] + " · 3 LIVES ·
  -25% SCORE"` at a flat `13px` with no measure/shrink/wrap step — on a
  narrow viewport (72% of `vw` can be well under 300px) or a long sector name
  ("AVICENNA SHOALS", "JENNER TERRACES") the text runs past the box edges.
  Fix by measuring and shrinking the font to fit (same idea as `wrapText`)
  or splitting the sector name onto its own line in a taller box.

---

## Bundle B — Emblem replacement (red cross → rod of Asclepius)

**Why:** MERCY, the wrecks, and every Scion currently wear a red cross. The red
cross emblem is protected under the Geneva Conventions; games have been formally
required to remove it (e.g. Prison Architect). This **will** surface in App Review
or after launch. The fix is also a narrative upgrade: the true emblem of medicine
becomes a serpent (rod of Asclepius) — mirroring Glycon, *the serpent wearing a
mask*. Sector 0 is already ASCLEPION. **Priority: 2. Dependencies: none.**

- [x] **B1. Draw a `drawAsclepius(w, h)` helper** — a vertical staff with a single
  serpent coiled around it (2–3 bezier curves, same neon-stroke style as
  `drawShrine`'s coil). Parameterise size so one helper serves ship-scale and
  Scion-scale.
- [x] **B2. Replace the crosses.** Call sites, all in `index.html`:
  - `drawMothership()` — the two pulsing `fillRect` pairs after
    `ctx.shadowColor = "#ff1744"`.
  - `drawWreckM()` — the flickering cross (`ctx.fillRect(-5, -16, …)` pair).
  - `iShip()` (intro panels) — the `#ff2d55` rect pair.
  - `doidFigure()` — the chest emblem (`crossCol` rects). At Scion scale a full
    staff won't read; use a single S-curve serpent stroke (~4px tall) in the same
    `crossCol` colour slot. Keep the parameter name `crossCol` or rename to
    `emblemCol` consistently.
  - Keep the colour family (`#ff1744` / `#ff5d7d`) — the *shape* is the issue, and
    the pink-red reads well against the teal Scions.
- [x] **B3. Sweep the copy.** Search the file for "cross" in comments/strings and
  update. The HUD `⚕` glyph (CODEX pill) already IS the staff of Asclepius — no
  change. Add one line to GAME_DESIGN.md §2.4 noting the emblem duality (the true
  serpent vs. Glycon's masked serpent) so writers build on it.
- [x] **B4. Visual check.** Screenshot title, sector 0 with a waiting Scion, MERCY
  close-up, a wreck, and intro panel 1 (Playwright `page.screenshot`) and eyeball
  that the emblem reads at all five scales.

---

## Bundle C — Audio baseline & settings menu

**Why:** A paid game cannot ship with zero music, no volume control, and no mute.
All sound currently routes straight to `AC.destination` from ~8 tiny synth
functions. **Priority: 3. Dependencies: none (A3's pause screen will link to the
same settings panel if A lands first — otherwise settings is title-only until A
merges).**

- [x] **C1. Master/music gain plumbing.** In `initAudio()`, create `sfxGain` and
  `musicGain`, both → `AC.destination`. Reroute every existing sound
  (`blip`, `boom`, `heartbeat`, `staticTick`, `dullThud`, `thrustGain`) through
  `sfxGain`. Two persisted toggles: `doids_snd`, `doids_mus` ("1"/"0", default on)
  driving `sfxGain.gain` / `musicGain.gain` (0 or 1 — no sliders in v1).
- [x] **C2. Generative ambient score.** A `startMusic()` that builds a quiet,
  slowly-evolving WebAudio drone: two detuned sine/triangle oscillators around
  55–110 Hz through a lowpass, an LFO on filter cutoff (~0.05 Hz), and a sparse
  pentatonic motif (one `blip`-like sine note every 9–15 s, randomised). Route via
  `musicGain`. Duck it (gain ×0.4, 1 s ramp) under briefings and cards; restore in
  play. On the finale sector, halve the motif rate and drop the drone an octave.
  Keep it *very* quiet — this is atmosphere, not melody.
- [x] **C3. Arrhythmic score tell.** While `contaminantAboard()` is true, push the
  music motif's timing off-grid (multiply the next-note delay by 0.5/1.7
  alternately). The soundtrack itself develops an arrhythmia — same diagnostic
  language as the ECG. One-line hook where the motif timer is armed.
- [x] **C4. SETTINGS panel.** New `"settings"` state, reachable from a `⚙ SETTINGS`
  pill on the title (pattern: `helpRect()` et al) and from the pause menu (A3).
  Rows with tap-toggles: SOUND, MUSIC, HAPTICS (no-op until Bundle F; still show
  it), ASSIST, TILT, COLORBLIND (no-op until Bundle H). Move the existing
  title-screen ASSIST and TILT pills into this panel and delete them from
  `drawTitle` — the title is getting crowded. **Keep the TILT toggle's
  requirement that iOS permission is requested from a real user gesture** (see
  `canvasTap()` — the tilt toggle must stay inside the raw gesture path, so keep
  routing its tap through the same synchronous handler).
- [x] **C5. Test.** Smoke: toggle each setting, reload, assert persistence.
  Assert `thrustGain` routes through `sfxGain` (thrust is silent with sound off).
- [x] **C6. Sound-effect variety pass.** The SFX functions (`blip`, `boom`,
  `heartbeat`, `staticTick`, `dullThud`, `hydraulic`) are all quick one-shot
  synths built from the same handful of oscillator/noise-burst shapes;
  played dozens of times a run, repeats start to sample identically. Give
  each a touch more character — a little per-call pitch/timing jitter so
  repeats don't sound cloned, a second harmonic layer, gentle filter
  movement — without changing what any of them signal or drifting from the
  game's deliberately sparse, diagnostic sound language (this is a richness
  pass, not a redesign). Spot-check the highest-frequency ones first: `blip`
  (fire/pickups) and `heartbeat`/`dullThud` (the boarding tell — the
  saboteur read depends on these staying clearly distinct from each other).

---

## Bundle D — Performance pass

**Why:** `ctx.shadowBlur` is set on nearly every draw call — terrain, scenery, every
Scion, every particle, every bullet, HUD text. Canvas shadow blur is extremely
expensive; at 2× DPR on an iPhone XR/11-class GPU this drops frames and drains
battery. App Review tests on real hardware. **Priority: 4. Dependencies: none.**

Rule of thumb after this bundle: **`shadowBlur` may appear on singletons drawn once
per frame (ship, mothership, title text) but never inside a per-entity or
per-particle loop.**

- [x] **D1. FPS meter behind a flag.** If the URL contains `?perf=1`, draw
  frame-time ms + FPS in the corner of `drawHUD`. Ship it — it costs nothing and
  every later bundle uses it.
- [x] **D2. Glow-sprite helper.** Pre-render small radial-gradient circles
  (one offscreen canvas per colour, cached in a map) and `drawImage` them under
  point objects to fake glow. Replace shadowBlur in: the `particles` loop, the
  `bullets`/`shots` loops, star field (stars need no glow at all — delete their
  shadow), and fuel pods / fake pods.
- [x] **D3. Multi-stroke glow for lines.** For stroked shapes drawn per-entity
  (Scions via `doidFigure`, turrets, drones, scenery trees/rocks), replace
  `shadowBlur` with a 2-pass stroke: first pass `lineWidth+3` at `globalAlpha
  0.25`, second pass normal. Wrap as `glowStroke()` so call sites stay one line.
- [x] **D4. Cache the terrain.** Terrain + cave roof geometry is static per level.
  Render the filled/stroked terrain path once into an offscreen canvas **per
  visible chunk** (e.g. 512px-wide tiles rendered lazily as the camera reaches
  them, kept in an LRU of ~12 tiles) rather than re-tracing the full heightmap
  path every frame. Do NOT pre-render the whole level at full DPR (a 4400×1500
  finale at 2× is >100 MB — that's why tiles).
- [x] **D5. Measure.** Before/after frame-time numbers in the PR description, from
  a desktop Chromium run (`?perf=1`, sector 5 with scenery + counterfeits) and,
  if available, a real iPhone via the live Pages build.

---

## Bundle E — Native wrapper & App Store compliance

**Why:** The App Store does not accept PWAs. The game needs to become a real iOS
app — and a *defensible* one: Apple guideline 4.2 (minimum functionality) is used
to reject thin web wrappers, so the wrapper must add genuinely native capabilities
(haptics — Bundle F, Game Center — Bundle G, iCloud key-value sync for saves).
**Priority: 5. Dependencies: A (pause/save gives the wrapper something to sync);
F should land in the same release.**

- [ ] **E1. Capacitor scaffold in `app/`.**
  `app/package.json` with `@capacitor/core`, `@capacitor/ios`, `@capacitor/haptics`,
  `@capacitor/app`, `@capacitor/status-bar`. `capacitor.config.ts` with
  `appId: "com.burners70.hollowoath"` (a personal reverse-DNS ID — confirm the
  final value with the owner before first submission; it is permanent), `appName:
  "Hollow Oath"`, `webDir: "www"`. A `sync.sh` (or npm script) that copies
  `index.html`, `manifest.webmanifest`, and the three PNGs from the repo root into
  `app/www/`. The root files remain the source of truth; never edit `app/www/`.
- [ ] **E2. Native shell config.** In the generated Xcode project: landscape-only
  (`UISupportedInterfaceOrientations` = landscape left/right only), status bar
  hidden, `UIRequiresFullScreen`, black background behind the webview, and the
  webview's `contentInsetAdjustmentBehavior` left to Capacitor's default (the game
  already handles safe-area insets via `env(safe-area-inset-*)`).
- [x] **E3. In-app web/native switches.** In `index.html`, detect the wrapper via
  `window.Capacitor?.isNativePlatform?.()`. When native: suppress the A2HS banner
  entirely (the IIFE that manages `#a2hs`), skip `goFullscreen()` (meaningless in
  a wrapper), and skip the `beforeinstallprompt` path. *(Landed as the `NATIVE`
  const — verify inside the real wrapper when E1/E2 are scaffolded on a Mac.)*
- [ ] **E4. iCloud save sync.** Mirror `doids_run`, `doids_hi`, `doids_codex` (and
  Bundle K's `doids_logs`) to iCloud key-value storage via a small Capacitor
  plugin (community `capacitor-icloud-kv` or a ~40-line Swift plugin using
  `NSUbiquitousKeyValueStore`). Read-back strategy: on launch, take the larger of
  local vs. cloud hi-score, the union of codex/log sets, and the cloud run
  snapshot only if local has none.
- [ ] **E5. Privacy manifest & nutrition label.** `PrivacyInfo.xcprivacy` declaring
  no tracking, no data collection; App Store Connect privacy answers = "Data Not
  Collected". (No analytics SDK. Keep it that way — it is a selling point.)
- [ ] **E6. Icons & launch screen.** Generate the full AppIcon set from
  `icon-512.png` (needs a 1024×1024 master — ask the owner or upscale carefully),
  plus a plain black launch storyboard with the title wordmark.
- [x] **E7. IP-sensitive copy check — RESOLVED (owner decision, July 2026).**
  Nostalgia is part of the sell: the homage stays loud, tiered by surface so it
  is both discoverable and trademark-safe.
  - **In-game** (title tagline): era-evocative, no trademarks — *"a love letter
    to the 16-bit lander classics"*. Done.
  - **Web** (README / GitHub Pages / the homepage the store listing links to):
    factual, *named* homage — *Oids*, *Thrust*, *Gravitar* are named outright,
    with an explicit "original, unaffiliated" line (nominative fair use). Done.
    This is where nostalgia searchers land from Google — keep it named.
  - **App Store metadata**: no third-party trademarks anywhere (Apple guideline
    2.3.7 — other companies' marks in keywords/description risk rejection).
    Evoke the era generically and link the homepage, which carries the named
    lineage. Details in O2.
  At submission (O6), verify all three tiers still hold.
- [ ] **E8. Device test matrix.** Run on the oldest iOS you claim (suggest iOS 15+,
  which bounds hardware at ~iPhone 6s/SE1 — consider iOS 16+ to keep the perf
  floor at A11): touch controls, gyro permission flow, pause-on-background,
  resume, silent-switch behaviour (game audio should respect the ringer switch —
  WKWebView default — confirm and document).

---

## Bundle F — Haptics (the signature feature)

**Why:** The game's best mechanic is *listening for a heartbeat*. On iPhone the
player should **feel** it — the phone becomes the ECG. This is the headline
App-Store-description feature and the strongest 4.2 defence. **Priority: 6 (ship
with E). Dependencies: E (native bridge), C4 (settings toggle).**

- [x] **F1. JS haptics facade.** In `index.html`, a `haptic` object:
  `haptic.light()`, `haptic.medium()`, `haptic.heavy()`, `haptic.pattern([...])`
  (array of {delay, style}). Web build: no-ops. Native: bridge to Capacitor
  Haptics (impact styles; patterns via chained `setTimeout` — fine at this
  granularity). Gate every call on the `doids_hapt` setting (C4).
  *(Landed; the bridge path needs a real device once E exists.)*
- [x] **F2. Wire the medical language.** Call sites:
  - `heartbeat()` → `pattern` lub-dub: medium at 0 ms, light at 180 ms (mirrors
    the audio pulse timings already in `heartbeat()`).
  - `dullThud()` → one heavy impact. Nothing else. The *absence* of the second
    beat is the tell.
  - ECG arrhythmia (while `contaminantAboard()`): in the same place `drawECG`
    computes the early third beat, fire a light tap on the early beat — subtle,
    ~every few seconds.
  - The Static (`staticTick()` during extraction pulses and Bundle I's clock) →
    two light taps 40 ms apart (a "wrong" double-tick, distinct from lub-dub).
  - Hard landing → heavy. Shield bounce → medium. Breach klaxon → heavy ×2.
  *(All wired, including the 41-second clock's double-tick from Bundle I and
  the arrhythmia tap every 3–5 s while a contaminant rides / the counterfeit
  bay has you. No-ops on web.)*
- [ ] **F3. Restraint pass.** Play a full sector; if haptics fire more than ~once
  per 5 s of normal flight, cut the least meaningful call sites. Haptics carry
  meaning here only if they stay rare. *(Needs a real iPhone — do with E8.
  First candidates to cut if too chatty: the intro-screen heartbeat and the
  boarding lub-dub for ordinary Scions.)*

---

## Bundle G — Game Center

**Why:** Retention + expected furniture for a paid arcade game. The rank system is
already a finished achievement list. **Priority: 7. Dependencies: E.**

- [ ] **G1. Plugin + auth.** Community `capacitor-game-connect` (or a small Swift
  plugin). Authenticate on launch, silently; never block play on Game Center.
- [ ] **G2. Leaderboards.** `score` (all-time). Report from `saveHi()`. (A daily
  board arrives with Bundle M's daily seed.)
- [ ] **G3. Achievements** (IDs ↔ existing flags — all already tracked in code):
  - OATH KEEPER — answered ending, `runFired === 0`
  - HOLLOW KEEPER — answered, `firedAtSecret && !firedAtCombat`
  - THE ONE WHO ANSWERED — answered ending, any fire
  - SECTOR WARDEN — fire ending
  - GLYCON UNMASKED — `shrines.size >= 3`
  - ARCHIVIST — all 14 log fragments in one run (`runFragments`)
  - SPOTLESS ROTATION — campaign complete, `runLost === 0`
  - FIRST DO NO HARM — any sector cleared with `firedShots === 0`
  - THE FULL CODEX — `codex.size === FAMOUS.length` (across runs)
  - Report at the ending/win screens and codex save; wrap in the same
    fail-silent style as localStorage.
- [ ] **G4. Web no-op.** All Game Center calls go through one `gc` facade that is
  a no-op outside the wrapper (same pattern as F1).

---

## Bundle H — Accessibility & difficulty

**Why:** The landing guide and saboteur tint are green/amber/red and green/lime —
exactly the hues colorblind players lose. Assist-on is currently the only
difficulty dial. **Priority: 8. Dependencies: C4 (settings panel).**

- [x] **H1. Colorblind mode** (`doids_cb`). A palette indirection for the
  *semantic* colours only: define `SAFE`, `WARN`, `DANGER`, `REVEAL` colour
  constants used by `drawLandingGuide`, the ECG bar colour ramp, the antisepsis
  tint, and the canon `?` marks; colorblind mode swaps to a blue/orange/white
  set. Do not re-skin the whole game — just the four meanings.
  *(Landed as `PALETTES`/`PAL()`; the CB set is blue/orange/white plus magenta
  for REVEAL so revealed counterfeits stay distinct from both WARN and DANGER.)*
- [x] **H2. Shape redundancy.** The landing guide already prints reason text; add
  a `✓ / ! / ✕` glyph next to the descent numbers so the state reads without
  colour at all. Saboteur antisepsis tint gains the `?` mark it already uses for
  canon — one glyph language for "counterfeit". *(The antisepsis `?` was already
  in; the landing-guide glyph is new.)*
- [x] **H3. FIELD MEDIC mode** (easier; `doids_easy`): 5 lives, landing tolerances
  ×1.3 (`landingEval` thresholds), saboteur fuel-cut damage halved, breach timer
  60 s. Label scores on the leaderboard-reporting path so easy-mode runs don't
  post to the main board (report only when off). Surface as a settings toggle
  with one honest line: "for pilots who want the story". *(Leaderboard labelling
  = `easyMode` is exposed on `__doids.get()`/run state; when G lands, gate the
  main-board report on `!easyMode`.)*
- [x] **H4. Text size.** The card/brief body font sizes (`drawCardPanel`,
  `drawBrief`, captions in `drawIntroScreen`) get +2px when `doids_bigtext` is
  on. Wrap widths already derive from measured text, so this is low-risk.

---

## Bundle I — The 41-second clock (narrative → mechanic)

**Why:** "Repeating, every 41 seconds" is the story's best hook and it never
actually happens in gameplay. Make the player's own observation skill — the thing
the game claims to teach — real. Small bundle, outsized payoff.
**Priority: 9. Dependencies: none (F enriches it).**

- [x] **I1. World clock.** A `staticClock` accumulator in `updatePlay`, active on
  sectors ≥ 4 (Curie briefing is where the 41 s figure is first mentioned) and in
  caves. Every 41.0 s: `staticTick()` audio, `haptic` double-tick (F), and set
  `staticSurge = 0.6` (seconds, decays).
- [x] **I2. Visible symptoms while `staticSurge > 0`:** the ECG trace jitters
  (±1px noise on the baseline in `drawECG`), lit windows in scenery flicker off
  (multiply their alpha), the lamp radius dips ~8% in dark sectors, and the HUD
  sector label glitches one frame. No gameplay damage — this is diagnostic
  atmosphere, not a hazard.
- [x] **I3. The beacon syncs.** In the finale, fire the surge at the same 41 s
  phase but *strong* (surge 1.2, camera shake 4) — the closer you get to SOLACE,
  the more the world flinches with her. `updateBeacon` is the anchor.
  *(Landed in `updateStaticClock`: surge 1.2, shake 2 + 4×proximity.)*
- [x] **I4. Test.** Expose `staticClock` in `__doids.get()`; smoke-test that it
  only runs on sectors ≥ 4 and fires within 41±0.1 s. *(Test winds the clock to
  40.8 s via `__doids.setStaticClock` and asserts the surge fires and wraps.)*

---

## Bundle J — Scan mechanic (the priced pacifist path)

**Why:** Currently lure-trees and hollow rocks only open under fire, so pacifist
runs are locked out of Glycon content — but a free scan would delete the HOLLOW
KEEPER dilemma. The fix: scanning is possible but **priced in time and exposure**,
so the oath costs risk instead of being impossible.
**Priority: 10. Dependencies: none.**

- [x] **J1. Scan interaction.** When landed within 60 px of a live `fake` tree or
  `hollow` rock (scenery entries), a scan timer accumulates — same pattern as
  `updateBlackbox`/`updateShrine` (`scanT`, progress ring, "SCANNING…" label).
  Duration: **6 s** (vs. ~1 s to shoot). While scanning you are landed, static,
  and takeable by turret fire — that's the price.
- [x] **J2. Same payoff, clean oath.** Completion triggers the same reveal as the
  shot path (`sc.dead = true`, score, cache pod spawn, banner) but sets a new
  `scannedSecret = true` flag instead of `firedAtSecret`. Refactor the shot-path
  reveal in `updateEnemies` into a shared `revealSecret(sc, viaFire)` so the two
  paths cannot drift.
- [x] **J3. Rank language.** `drawWin`: an answered ending with `runFired === 0`
  **and** `scannedSecret` stays OATH KEEPER but appends "· eyes open" to the
  rank line; GAME_DESIGN.md §2.5 gets the new outcome row. HOLLOW KEEPER
  (revealed by fire, no combat) is unchanged — the dilemma survives, it just has
  a patient alternative.
- [x] **J4. Teach it once.** One line added to the Avicenna briefing (BRIEFS[5]):
  "If you won't fire on a lie, land beside it and *look* at it long enough."
  *(Also one sentence in the HOW TO FLY card's secrets paragraph.)*
- [x] **J5. Test.** Warp to a fake tree (`__doids` needs a `warpScenery(type)`
  helper — add it), scan, assert reveal + `runFired === 0` + `scannedSecret`.

---

## Bundle K — Log archive in the codex

**Why:** Log fragments and shrine cards appear once and vanish; the Static's story
is told in fragments players will half-forget. Re-readability is cheap and pays
the mystery off. **Priority: 11. Dependencies: none.**

- [x] **K1. Persist recovered logs across runs** in `doids_logs` (a Set of
  fragment indices, same save/load pattern as `codex`/`saveCodex()`). Add to it
  inside `grantFragment()`. Shrines likewise into `doids_shrines_seen`.
- [x] **K2. Codex tabs.** `drawCodex` gains two tabs: **MINDS** (current view) and
  **ARCHIVE** — a scrollable (paged, tap left/right halves) list of LOG 01–14,
  locked entries shown as `LOG 07 // — signal not yet recovered —`, plus the
  three shrine cards at the bottom once seen. Follow the existing found/unfound
  styling (gold vs. 30% white). *(4 entries per page; shrine cards show their
  kicker + title and first body line, locked as "THE HOLLOWS · I/II/III".)*
- [x] **K3. Count on the pill.** Title CODEX pill shows both:
  `⚕ 5/7 · ◈ 9/14`.

---

## Bundle L — Title haunting & the answered epilogue

**Why:** Two small narrative payoffs with outsized feel. **Priority: 12.
Dependencies: C (audio routing), K optional.**

- [x] **L1. The Static haunts the title.** On an unresolved ending
  (`endingType === "unresolved"`), set `doids_unres = "1"`. While it is set, the
  title screen plays a faint `staticTick()` (through `sfxGain`, ×0.4) every 41 s,
  and the subtitle line changes to *"the Static answers still — every 41
  seconds"* (in the Static's violet). Clear the flag on any answered/fire ending.
- [x] **L2. The SOLACE epilogue.** After `resolveBeacon("answered")`, before the
  ending card: a 6-second scripted beat in a new `"epilogue"` state — the world
  keeps rendering, the camera eases toward the beacon (lerp `camera.x/y`), the
  pulse rings fade, and one line types on: *"AMS SOLACE · crew manifest 214 ·
  status: HEARD."* Then auto-advance to the existing ending card (tap skips).
  Keep it to ~40 lines; the restraint is the point.

---

## Bundle M — Remix mode & daily seed (replay value)

**Why:** Terrain is seeded deterministically per sector (`mulberry32(1013*(n+3)+77)`)
— every run is identical. Three endings give replay *reasons* but no replay
*variety*; at a paid price point that's thin. **Priority: 13. Dependencies: A
(don't let remix snapshots collide with campaign snapshots — store the seed in the
A1 snapshot). G2 for the daily board.**

- [x] **M1. Run seed plumbing.** A `runSeed` global (0 = authored campaign).
  Thread it into every generator: `genLevel` seed becomes
  `1013 * (n + 3) + 77 + runSeed`, `genCave` likewise, and the star seed. Seed 0
  must produce today's exact levels (regression-test one heightmap checksum via
  `__doids`). *(Golden checksum for VESALIUS RIDGE is asserted in the suite.)*
- [x] **M2. Remix unlock.** Completing the campaign with any resolved ending sets
  `doids_veteran = "1"`. Title then shows a `⟳ REMIX ROTATION` pill: new run with
  `runSeed = random 1..2^31`, famous-Scion sector assignment shuffled (permute
  the `famousId ↔ sector` mapping with the run rng), and briefings prefixed
  "REMIX ROTATION //". Ranks/achievements still earnable; snapshot includes the
  seed so resume works.
- [x] **M3. Daily flight.** `☀ DAILY` pill: `runSeed = YYYYMMDD` (UTC), one
  attempt per day recorded in `doids_daily` (`{date, score, done}`), score
  reported to a daily Game Center board (G). Show yesterday-you as the bar to
  beat if no board. *(The attempt is spent at launch so a bad start can't be
  re-rolled; the GC report hook is a marked comment in `recordDaily()` for G.)*
- [x] **M4. (Stretch) widen the famous pool.** 3–4 additional famous Scions
  (candidates with the same rigor as the current seven: Elizabeth Blackwell,
  Rudolf Virchow, Alexander Fleming, Rita Levi-Montalcini) with modest upgrades;
  remix draws 7 of N. Requires new `FAMOUS` entries + codex rows only — the
  reveal/upgrade machinery is data-driven already. *(All four landed: OPEN
  DOORS — wider bay-approach speed caps; CELL DOCTRINE — all scans ×1.5 speed;
  PENICILLIN — slow self-heal below half vitals; GROWTH FACTOR — 120 fuel.)*

---

## Bundle N — The counterfeit MERCY (Glycon's third act)

**Why:** The shrine reveal is strong, but Glycon is discovered, never confronted —
the finale belongs entirely to the Static plotline. The game's own tell-system
("mechanical perfection is the signature of the counterfeit") begs for one final
inversion: *now distrust the thing you've trusted all game.* The crashed
MERCY-class wrecks already foreshadow it. **Priority: 14 — the biggest narrative
lift, do it when A–F are shipped. Dependencies: B (emblem), I (surge timing),
ideally J (scan).**

- [x] **N1. The decoy.** In `genLevel(FINALE_IDX)`, place a second mothership
  (`level.fakeMercy = {x: W*0.45, y: 170}`) between spawn and the beacon. It
  renders via `drawMothership`-style code with ONE difference: the real MERCY's
  emblem pulses organically (`0.55 + 0.45*sin(now*3)` — current code), the
  counterfeit's blinks in **perfect mechanical unison with the fake fuel pods**
  (`sin(now*PI*2) > 0` — the exact tell already used in the fakePods renderer).
  Name plate: "A M S · M E R C Y" — identical. No other visual tell.
  *(Avicenna's Canon of Truth marks it `?` like every counterfeit; the music
  and ECG both go arrhythmic inside its bay — one diagnostic language.)*
- [x] **N2. The trap.** Docking in the counterfeit's bay: no heal, no refuel —
  fuel drains 6/s, ECG arrhythmia flag while inside, and after 2 s a reveal:
  banner "COUNTERFEIT — THE BAY IS A MOUTH", −200 score, the decoy powers down
  permanently (goes dark, serpent mark flickers on its hull), and a log-style
  card: *"He built a better lure this time. He built the thing you trust."*
- [x] **N3. The observed win.** Identifying it *without* docking — scanning it
  (J's mechanic, 6 s hold landed beneath it) or shooting it once
  (`firedAtSecret`) — powers it down for +800 and the card *"You counted the
  beats. He never learned a heartbeat."* If GLYCON UNMASKED (3 shrines), the
  ending epilogue adds one line acknowledging the decoy.
- [x] **N4. Briefing seed.** BRIEFS[7] gains one sentence: "Two beacons answer as
  MERCY on approach. One of them is lying. Count the beats, captain."
- [x] **N5. Balance guard.** The decoy must not be reachable before the player has
  seen fake pods (it's the finale — they have). Ensure `checkSectorClear`/
  extraction logic ignores the decoy (it is scenery-with-behaviour, not a bay:
  keep it out of `bayRects()`', give it its own rects + update function).
  *(Own `decoyBayRect()`/`updateDecoy()`; `checkSectorClear` already early-outs
  on the finale, and `updateDocking` only ever reads `bayRects()`.)*
- [x] **N6. Tests.** Finale smoke: dock decoy → trap fires, real bays unaffected;
  scan decoy → +800 path; both endings still reachable.

---

## Bundle O — Store listing & submission (last)

**Why:** The actual shipping checklist. **Priority: last. Dependencies: A–F
merged; G/H strongly recommended.**

- [ ] **O1. Pricing decision** with the owner. Recommendation from review: launch
  **$2.99** with A–F+I..L shipped; $4.99 is defensible only once M (remix/daily)
  and N (counterfeit MERCY) are in. No IAP, no ads — "complete game, no data
  collected" is the positioning.
- [ ] **O2. Metadata.** Name "Hollow Oath", subtitle ≤30 chars (e.g. "A gravity
  rescue with a heartbeat"), description leading on: feel the heartbeat
  (haptics), trust nothing perfect, primum non nocere — **plus one nostalgia
  paragraph in generic terms** ("if you grew up steering a lander through
  16-bit caves and gravity wells, this is for you"). Keywords (all generic
  genre/mechanic words — defensible even where they coincide with old game
  names): lander, gravity, thrust, rescue, retro, arcade, 16-bit, cave, story.
  **No third-party trademarks in any metadata field (E7 / Apple 2.3.7)** — the
  *named* homage (Oids, Thrust, Gravitar) lives on the store-linked homepage
  and README instead, which is what search engines index for "games like Oids".
- [ ] **O3. Age rating questionnaire** — expect 9+ (infrequent mild fantasy
  violence). The player *can* shoot medics (malpractice mechanic); answer the
  violence questions honestly and keep the store description's framing on
  consequence, not carnage.
- [ ] **O4. Screenshots & preview.** 6.7" and 6.1" sets (landscape): title, a
  landing beside a waving Scion, MERCY docking, a dark-sector lamp shot, a
  Hollows shrine, the ECG-arrhythmia moment. 15–30 s preview video of one full
  rescue loop. Capture from a real device after D (perf) lands.
- [ ] **O5. Support & privacy URLs.** A one-page privacy policy ("no data
  collected, saves stay on device/iCloud") and support contact, hosted on the
  existing GitHub Pages site.
- [ ] **O6. Submission dry run.** TestFlight internal build → full E8 matrix →
  external TestFlight round (5–10 players, watch where they die and quit) →
  submit. Budget one rejection cycle; 4.2 is the likely challenge and the
  response is the native-features list (F, G, E4).

---

## Suggested sequencing

```
A ──┬──────────────► E ──► F ──► G ──► O
B ──┤ (parallel)     ▲
C ──┤                │
D ──┴────────────────┘
      then, in any order alongside E–G:
      H, I, J, K, L   → price floor $2.99
      then M, N       → price point $4.99, "1.1 content update" if post-launch
```

**Status (July 2026):** A–D and **H–N are all shipped** on the web build, plus
the web-safe slices of E (E3, E7) and F (F1/F2 — no-ops until the wrapper
exists). Everything left — E1/E2/E4–E8, F3, G, O — needs a Mac with Xcode
and/or App Store Connect. The game already plays at the $4.99 feature bar.

Post-launch candidates (deliberately out of scope here): more famous Scions (M4
grows), a fourth Hollow, second-playthrough modifiers, Android/Google Play via the
same Capacitor shell, and two proposed flight bundles with full placement
writeups in ROADMAP.md § Future ideas:
- **the pendulum sling (Bundle P)** — the Oids/Thrust pendulum homage,
  redesigned (July 2026) as relic recovery from the Hollows: tow what
  Glycon kept below on a swinging sling, decoupled from Scion pickup.
  Full spec (design, copy, checklist P1–P10, launch-vs-update
  recommendation: **free 1.1 update**) in
  [PENDULUM_SPEC.md](PENDULUM_SPEC.md). Supersedes the earlier
  "pendulum carry" core-loop proposal (struck through in ROADMAP.md);
- **the deep Hollows (Bundle Q)** — René Laennec as a hidden famous Scion
  (AUSCULTATION lift-sense, the Radiosense pattern for lifts), the ROTATION
  CHART (return to cleared sectors, cached as-left), and three new caves
  with new discoveries (THE WARD, THE MINT, THE LISTENING POST). Full spec
  (checklist Q1–Q10, recommendation: **free 1.2 update, after P**) in
  [HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md);
- ~~**the transfusion line**~~ — **shipped (July 2026), ahead of schedule**:
  field refuelling is now an active hover minigame — hold station on the
  drone's fuel line, choose when to detach (CLEAN LINE +250 for a full tank
  with no occlusion), shield forced down while tethered, FIRE means detach,
  the 41-second surge rocks the tether, and the pump goes arrhythmic with a
  contaminant aboard. The counterfeit tanker (Glycon's fourth act) remains a
  future hook. See ROADMAP.md § Future ideas for the design writeup.
