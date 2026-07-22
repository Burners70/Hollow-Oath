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
- **Copy lives in two places.** Player-facing strings are authored in
  `index.html` and mirrored, organised for review, in
  [COPY_DECK.md](COPY_DECK.md). Any PR that changes a player-facing string
  must update COPY_DECK.md in the same PR (see R10).

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
| R | Playtest fixes (July 2026 feedback) | Bugs & UX corrections | **Yes — ship in launch** |
| S | Sound, endgame & saboteur upgrades | Feedback improvements | **Owner-requested for launch** |
| T | Zone identity — width, biomes, weather | Feedback improvements | Core in launch; deep items may slip to 1.1 |
| U | Second playtest — sound, refueller & UI | Feedback improvements | Owner-requested for launch |
| QA | Playtest QA: legibility & fairness | Polish + design-pillar fairness | No (recommended before O) |
| O | Store listing & submission | Shipping | **Yes (last)** |
| P | The pendulum sling | **Locked: free update 1.1** | No (post-launch) |
| Q | The deep Hollows | **Free update 1.2** (Laennec + ROTATION CHART split forward to 1.1) | No (post-launch) |
| V | 1.01 maintenance & narrative | Scan fairness, the Solace reveal, heard-scan parry, post-completion variants | Post-approval 1.01 |
| W | Landscape challenge escalation | Deeper valleys, overhangs, surface caves | Update 1.1 (ships with P) |

Minimum viable paid release = **A + B + C + D + E + F + R + O**. Everything else raises
the ceiling (and the defensible price). **Bundles R, S and T are the July 2026
owner-playtest feedback round** — R is straight bug fixing and blocks submission
(everything in it was found in a five-minute phone playtest, and App Review will
find it too); S and T are owner-requested for the launch build, with T's two
deepest items (destructible scenery, weather systems) explicitly allowed to slip
to 1.1 if they threaten the date.

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
- [x] **B5. The icons wore it too (found July 2026, fixed).** The B2 sweep covered
  canvas draw calls but not the PNG icons — `icon-512.png`, `icon-192.png` and
  `apple-touch-icon.png` still carried the red cross, and E6 would have shipped
  it as the App Store icon. All three (plus the new 1024 master) now wear the
  staff-and-serpent in the same `#ff2d55`, drawn with `drawAsclepius`'s exact
  bezier geometry.

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

- [x] **E1. Capacitor scaffold in `app/`.**
  `app/package.json` with `@capacitor/core`, `@capacitor/ios`, `@capacitor/haptics`,
  `@capacitor/app`, `@capacitor/status-bar`. `capacitor.config.ts` with
  `appId: "com.burners70.hollowoath"` (**owner-confirmed July 2026** — permanent),
  `appName: "Hollow Oath"`, `webDir: "www"`. A `sync.sh` (or npm script) that copies
  `index.html`, `manifest.webmanifest`, and the three PNGs from the repo root into
  `app/www/`. The root files remain the source of truth; never edit `app/www/`.
  *(Landed. `app/setup-mac.sh` is the one-shot bootstrap — it runs `npm install`,
  `sync.sh`, `npx cap add ios` and the E2 config script. See app/MAC_SETUP.md.)*
- [x] **E2. Native shell config.** In the generated Xcode project: landscape-only
  (`UISupportedInterfaceOrientations` = landscape left/right only), status bar
  hidden, `UIRequiresFullScreen`, black background behind the webview, and the
  webview's `contentInsetAdjustmentBehavior` left to Capacitor's default (the game
  already handles safe-area insets via `env(safe-area-inset-*)`).
  *(Landed as `app/configure-ios.sh` — idempotent PlistBuddy/pbxproj edits applied
  after `cap add ios`, plus the iOS 16.0 floor (owner decision) and the native
  `appStateChange` auto-pause hook in `index.html`. Verify once in Xcode on the
  first Mac build.)*
- [x] **E3. In-app web/native switches.** In `index.html`, detect the wrapper via
  `window.Capacitor?.isNativePlatform?.()`. When native: suppress the A2HS banner
  entirely (the IIFE that manages `#a2hs`), skip `goFullscreen()` (meaningless in
  a wrapper), and skip the `beforeinstallprompt` path. *(Landed as the `NATIVE`
  const — verify inside the real wrapper when E1/E2 are scaffolded on a Mac.)*
- [x] **E4. iCloud save sync.** Mirror `doids_run`, `doids_hi`, `doids_codex` (and
  Bundle K's `doids_logs`) to iCloud key-value storage via a small Capacitor
  plugin (community `capacitor-icloud-kv` or a ~40-line Swift plugin using
  `NSUbiquitousKeyValueStore`). Read-back strategy: on launch, take the larger of
  local vs. cloud hi-score, the union of codex/log sets, and the cloud run
  snapshot only if local has none.
  *(Landed: the ~40-line Swift plugin (`app/plugins/icloud-kv`), a web-no-op
  `cloud` facade in `index.html` mirroring every persistence write — plus
  `doids_shrines_seen` and `doids_veteran` — and `syncFromCloud()` implementing
  exactly that merge. Needs a two-device round-trip test with E8.)*
- [x] **E5. Privacy manifest & nutrition label.** `PrivacyInfo.xcprivacy` declaring
  no tracking, no data collection; App Store Connect privacy answers = "Data Not
  Collected". (No analytics SDK. Keep it that way — it is a selling point.)
  *(Landed at `app/ios-config/PrivacyInfo.xcprivacy` (UserDefaults/CA92.1 is the
  only required-reason API); installed by `configure-ios.sh`. The App Store
  Connect answers themselves happen at O6.)*
- [x] **E6. Icons & launch screen.** Generate the full AppIcon set from
  `icon-512.png` (needs a 1024×1024 master — ask the owner or upscale carefully),
  plus a plain black launch storyboard with the title wordmark.
  *(Landed: `app/resources/icon-1024.png` (owner-approved upscale; swap in a true
  master any time — configure-ios.sh re-installs it), single-size AppIcon set,
  and a black Menlo-wordmark `LaunchScreen.storyboard`. The upscale pass also
  caught a Bundle B escapee — see B5.)*
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
- [ ] **E8. Device test matrix.** Run on the oldest iOS you claim (~~suggest iOS
  15+~~ **iOS 16+, owner decision July 2026** — perf floor at A11): touch
  controls, gyro permission flow, pause-on-background, resume, silent-switch
  behaviour (game audio should respect the ringer switch — WKWebView default —
  confirm and document). *(Checklist table ready in app/MAC_SETUP.md §7.)*

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
  meaning here only if they stay rare. *(Needs a real iPhone — do with E8;
  scripted into app/MAC_SETUP.md §8. First candidates to cut if too chatty: the
  intro-screen heartbeat and the boarding lub-dub for ordinary Scions.)*

---

## Bundle G — Game Center

**Why:** Retention + expected furniture for a paid arcade game. The rank system is
already a finished achievement list. **Priority: 7. Dependencies: E.**

- [x] **G1. Plugin + auth.** Community `capacitor-game-connect` (or a small Swift
  plugin). Authenticate on launch, silently; never block play on Game Center.
  *(Landed as the small Swift plugin — `app/plugins/game-connect`, GameKit —
  with `gc.auth()` fired once at boot; the auth sheet only appears if iOS
  insists, and every call is fail-silent.)*
- [x] **G2. Leaderboards.** `score` (all-time). Report from `saveHi()`. (A daily
  board arrives with Bundle M's daily seed.)
  *(Landed: `hollowoath.score.alltime` from `saveHi()`, `hollowoath.score.daily`
  from `recordDaily()`; FIELD MEDIC runs post to neither (H3's gate). The App
  Store Connect records themselves are a table in app/MAC_SETUP.md §5.)*
- [x] **G3. Achievements** (IDs ↔ existing flags — all already tracked in code):
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
  *(Landed: `reportRunAchievements()` mirrors `drawWin`'s rank branches at the
  ending → win transition; FIRST DO NO HARM fires in `sectorClearNow()`, THE
  FULL CODEX at the codex save. IDs live in `GC_ACH` and must match the App
  Store Connect records — table in app/MAC_SETUP.md §5. The 1024×1024
  achievement images and the earned/pre-earned ASC description copy are in
  `assets/gamecenter/achievements/` + [GAMECENTER_ACHIEVEMENTS.md](GAMECENTER_ACHIEVEMENTS.md).)*
- [x] **G4. Web no-op.** All Game Center calls go through one `gc` facade that is
  a no-op outside the wrapper (same pattern as F1). *(On the web the facade also
  keeps a bounded intent trace, exposed as `gcReports` on `__doids.get()` — the
  smoke suite asserts the rank/score wiring against it.)*

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
- [x] **H5. Hide virtual touch controls while a gamepad is active.**
  `updateCtlVisibility()` only ever looked at `state` — it never checked
  `pad.connected`, which `pollPad()` already sets every frame from the
  Gamepad API. Fixed: `want = (state === "play" || state === "dead") &&
  !pad.connected`, so the on-screen thrust/fire/shield buttons disappear the
  instant a controller is detected and return the moment it disconnects
  (free, since `updateCtlVisibility()` runs every tick after `pollPad()`).
  TILT is unaffected; it writes to `input` directly and was never gated by
  `ctlShown`.

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
  **Gated behind `veteran` (owner decision, found in daily playtest, July
  2026)** — same gate as REMIX, not the original ungated behaviour: the daily
  seed re-rolls every generator, including mechanics (Glycon counterfeits,
  Vectors, the Hollows) that otherwise only appear once the campaign has
  introduced them across sectors 2–5. A first-time player hitting DAILY cold
  from the title skipped the story that explains them. This supersedes the
  RELEASE_READINESS_REVIEW.md §5.5 suggestion to just center the pill when
  REMIX is locked — DAILY isn't shown pre-veteran at all now.
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

## Bundle R — Playtest fixes (July 2026 feedback round)

**Why:** The owner's phone playtest surfaced a set of straight defects and UX
gaps — overflowing panels, overlapping text, an invisible pause button, a
tap-anywhere title that launches runs by accident. All are cheap, none are
optional: a reviewer holding an iPhone hits every one of these inside five
minutes. **Priority: before O. Dependencies: none (all web-side; keep the
smoke suite green).**

- [x] **R1. HOW TO FLY card overflows the phone screen.** `drawCardPanel()`
  computes `h = 86 + titleH + bodyLines.length * bodyLH` and only clamps the
  *top* (`y = Math.max(20, (vh - h) / 2)`) — with `HELP_CARD`'s six-paragraph
  body the card runs straight off the bottom of a landscape iPhone (vh ≈ 375),
  hiding the last paragraphs *and* the "tap to continue" line.
  Fix by paginating inside `drawCardPanel`: if `h > vh - 40`, split
  `bodyLines` into pages of `maxLines = floor((vh - 40 - 86 - titleH) / bodyLH)`
  lines (break on paragraph boundaries — empty lines — where possible), render
  the current page with a `1/3 · tap for more` footer instead of
  "tap to continue", and advance `card.page` on tap before the tap is allowed
  to dismiss the card. State: put `page` on the card object itself (reset to 0
  in `showCard()` and when entering `"help"`); the `case "help"` branch and
  `"reveal"` branch of `update()` must check "more pages?" before closing.
  Test: at a 568×320 viewport, walk every page of the help card via
  `__doids` and assert the footer line's y stays `< vh`.
- [x] **R2. Pause screen: PAUSED overlaps the RESUME row on short viewports.**
  `drawPause()` draws PAUSED at `vh * 0.28`, but `pauseRowRect(0)` starts at
  `vh / 2 - 101` — at vh ≤ 420 the heading lands inside the first button.
  Derive the heading position from the rows instead:
  `const topY = pauseRowRect(0).y - 26` and draw PAUSED there, shrinking the
  font (`Math.min(38, vw * 0.08, (pauseRowRect(0).y - 10) * 0.9)`) so it can
  never collide. While in there, harden the state machine so pause can never
  be seen outside a live run (the owner hit a pause screen offering RESTART
  SECTOR before ever launching): the `Escape`/`p` keydown branch and
  `pollPad()`'s Start-button branch both already require `state === "play"`,
  but make `Escape` *also* close the overlay screens — in `"help"`, `"codex"`
  and `"settings"` it should behave like tapping outside (return to
  `settingsReturnState` / title). Add a smoke assertion: from `"title"` and
  `"help"`, sending Escape/`p` never yields `state === "pause"`.
- [x] **R3. Shield button is still too far from FIRE/THRUST.** In the CSS,
  `#btnShield` sits at `right: 64px / bottom: 116px` — its centre is ~98 px
  from FIRE's centre, a full thumb-stretch. Tighten the right-hand cluster
  into an arc around the resting thumb: move SHIELD to
  `right: calc(88px + env(safe-area-inset-right)); bottom: calc(98px +
  env(safe-area-inset-bottom))` and bump it to 68×68 px (`line-height: 64px`)
  so the three buttons form a compact triangle (THRUST bottom-corner, FIRE
  left of it, SHIELD nestled above-between). The document-level touch tracker
  already hit-tests with a 14 px margin, so slight visual adjacency is good —
  rolling the thumb between buttons should transfer instantly. Verify no
  rect+margin overlap makes a button unreachable; screenshot at iPhone SE and
  Pro Max landscape sizes.
- [x] **R4. Pause button on the game screen is effectively invisible.** It
  exists — `pauseRect()` is 36×18 px at top-centre, stroked at 0.35 alpha,
  directly *under the score readout* — and the owner never saw it. Make it a
  real button: at least 44×30 px (Apple HIG minimum tap target), moved out of
  the score's way to the left of the ECG bar
  (`x: vw - bw - 14 - saRight - 54`), stroke alpha ≥ 0.6, `❚❚` glyph at 14 px.
  Keep the hit-test in `updatePlay()` *before* `input.tap` is cleared (already
  the case) and update `pauseRect()` so draw and hit-test stay one source of
  truth. Also honour it during `mercyBreach` and extraction (it already does —
  don't regress).
- [x] **R5. Explicit START NEW FLIGHT button on the title.** Tap-anywhere
  currently starts a run (`updateMenu()`'s final `else` branch) — the owner
  finds it annoying, and it eats taps meant for pills. Add a
  `startRect()` pill (pattern: `resumeRect()`; centred, `y: vh * 0.63`, width
  `Math.min(300, vw * 0.6)`, h 40) drawn as the *primary* button — replace the
  pulsing "TAP TO LAUNCH" text with `▶ START NEW FLIGHT` inside the pill.
  In `updateMenu()`, launch only when the tap lands in `startRect()` (keep all
  other pill branches; a title tap that hits nothing now does nothing).
  Keyboard Enter and gamepad A on the title should aim the synthetic tap at
  `startRect()` (same trick the game-over screen uses to aim Enter at
  CONTINUE). `"gameover"`/`"win"` keep their existing behaviour. Nudge the
  RESUME pill (when present) directly above START so the two read as a stack:
  resume-first for a checkpointed run, start-new below it.
- [x] **R6. Title screen line spacing is uneven.** The three subtitle lines
  sit at `vh * 0.40` (cyan), `0.48` (green), `0.54` (yellow) — the yellow line
  is visibly closer to the green than the green is to the cyan. Even them out:
  `0.40 / 0.47 / 0.54`. Check the controller-connected line (`vh * 0.60`) and
  the new START pill (R5) still clear each other on a 320-high viewport.
- [x] **R7. Codex: fix cramped line spacing and make entries clickable.**
  Two changes in the MINDS tab (`drawCodexMinds`):
  1. *Spacing.* `rowH = Math.min(46, (p.h - 118) / FAMOUS.length)` collapses to
     ~21 px on a 375-high viewport — the era line ("c. 460–370 BC") prints
     nearly on top of the name. Enforce a minimum: `rowH = Math.max(34, …)`,
     and when `FAMOUS.length * 34` no longer fits the panel, page the list
     (two pages of 6, same paging pattern as ARCHIVE) instead of squeezing.
     Keep name and era on separate baselines ≥ 14 px apart.
  2. *Clickable.* Tapping a **found** row opens that Scion's reveal card — the
     exact card shown on first delivery (`kicker: "FROM THE CODEX"`,
     `title: FAMOUS[i].name`, `subtitle: era`, `body: story + "\n\n★ " +
     upgradeName + " — " + upgradeDesc`, `color: "#ffd54f"`). Likewise in
     ARCHIVE, tapping an unlocked entry opens the full log / shrine card
     (shrines re-use their `SHRINES[ci]` card verbatim). Implement as a
     `codexCard` variable rendered via `drawCardPanel` on top of the codex;
     while it is open, any tap closes it back to the codex (not the title).
     ARCHIVE currently pages by tapping the panel's left/right *halves* —
     that conflicts with entry taps, so replace half-tap paging with explicit
     `‹` / `›` arrow rects in the panel's bottom corners and hit-test the four
     entry slots. Update the footer hint copy. Smoke test: open codex, tap a
     found mind, assert a card is showing; tap again, assert back to codex.
- [x] **R8. In-flight copy is too small and vanishes too fast.** Banners
  (`banner()`, drawn at 22 px for `t: 2.6` s) and floating texts (`addText()`,
  `t: 1.6` s) both under-serve a phone at arm's length. Change: banner font to
  `Math.min(26, vw * 0.05)` px and default life `4.2` s (keep the existing
  alpha fade on the last second); `addText` life to `2.6` s, font +2 px, and
  slow the float (`y -= 16 * dt` instead of 24). Bump card/brief body base
  size by +1 (`bodyFontPx(15)` call sites stay, change the base inside
  `bodyFontPx` from `base` to `base + 1`, keeping the BIG TEXT +2 on top).
  Re-check the longest banner ("MANIFEST CLOSED…") wraps/fits at 320 vh, and
  that `drawBrief`'s TAP TO LAUNCH line still clears the brief text.
- [x] **R9. Saboteur reveal colour reads as famous-Scion gold.** The normal
  palette's `REVEAL` is `#c6ff00` (yellow-lime) — at a glance it is too close
  to the famous gold shimmer (`#ffd54f`), muddling the game's two most
  important colour meanings ("extraordinary — protect" vs "counterfeit —
  distrust"). Change `PALETTES.normal.REVEAL` to a magenta-violet —
  recommended `#ff5ce1` (hot magenta: clearly distinct from famous gold,
  DANGER pink `#ff4081`, and the Static's soft lavender `#b388ff`; and
  narratively right — the counterfeit mark wears *Glycon's* serpent hue, not
  medicine's gold). Sweep every hard-coded `"#c6ff00"` literal (fake-pod
  touch text, decoy banner/explosion, the third shrine card's `color:`) to
  use `PAL().REVEAL` where code can call it, or the new hex in data literals.
  The colorblind palette keeps `#ff6bff`. Add a check (test or assertion)
  that a saboteur with `!upgrades.antisepsis` renders with the *same* body
  colour as a normal Scion — no colour tell may leak before the upgrade
  (see S7).
- [x] **R10. The copy deck.** All player-facing copy now lives, organised and
  code-anchored, in [COPY_DECK.md](COPY_DECK.md) for owner review and line
  edits. Treat it as a review surface, not a source of truth: when the owner
  returns edits, apply them to `index.html` and re-sync the deck. Add a line
  to the "How to work on this" section of this file: **any PR that changes a
  player-facing string must update COPY_DECK.md in the same PR.**

---

## Bundle S — Sound, endgame & saboteur upgrades (July 2026 feedback round)

**Why:** The owner's verdict after playing: sound effects are "TOO nostalgic"
(the shot is pure 1982 square wave), the sector endgame "often completes before
you notice what's happening", and identified saboteurs still *must* be dealt
with even after the game has told you they're counterfeit. These are the
feedback items that change how the game *feels* rather than how it looks.
**Priority: with R, before O. Dependencies: C (audio plumbing), I (surge), J
(scan pattern), N shipped (all are).**

- [x] **S1. Sound-effect modernisation (beyond C6's richness pass).**
  C6 added jitter and harmonics; the owner wants *character*. Three targets,
  in order of how often they're heard:
  - **The shot.** `blip(880, 180, 0.12, "square", 0.09)` at the fire call site
    is the most 1982 sound in the game. Replace with a new `shotSfx()`:
    a 0.12 s noise burst through a bandpass (~1800 Hz, Q ≈ 3, per-shot
    `rjit`), over a sine sub-thump 140→60 Hz (the `boom()` sub-oscillator
    pattern, quieter), plus a very low-gain detuned sawtooth blip for edge.
    Aim for a muffled energy-dart "thmp", not a laser "pew". Keep it *quiet*
    (≤ 0.08 peak) — firing is supposed to feel like malpractice, not fun.
  - **The explosion.** `boom()` gets a decaying tail: second noise source
    ~0.9 s with a lowpass sweeping 900→180 Hz, gain 0.1 — rubble, not pop.
  - **The heartbeat wants MORE heartbeats.** The owner's exact note. Make the
    cabin fill with pulses: while flying with passengers aboard, each
    non-saboteur passenger contributes a faint heartbeat on its own period —
    a new `updateCabinPulse(dt)` called from `updatePlay`, giving each
    passenger index a phase offset and ±5% rate variance around ~1.5 s, and
    playing `heartbeat(v, true)` (the no-haptic variant) at low volume
    (total loudness capped: `v = 0.22 / audibleCount`, at most 3 layers
    audible). An active saboteur's slot stays **silent** — the missing beat
    in the chorus is the same tell as the boarding dull-thud, now continuous.
    Do not fire cabin pulses while a card/brief is up or the ship is dead.
    This is the game's signature (the haptic bundle F2 already mirrors
    single beats); keep every layer soft enough that the boarding lub-dub /
    dull-thud read stays unmistakable — that tell is load-bearing (C6 note).
- [x] **S2. Vitals-reactive ambience — the score becomes your monitor.**
  Owner: "could the ambient sound reflect your vitals — more frantic as you
  take damage / are closer to death?" Yes — and it deepens the existing
  diagnostic-sound language (the ECG already speeds up as vitals fall).
  In `updateMusic(dt)` / a small new `updateVitalsAudio(dt)`, drive from
  `v = ship.vitals / maxVitals()` while `state === "play"`:
  - motif interval scales `× (0.45 + 0.55 * v)` — sparse when healthy,
    insistent when hurt (compose with the finale ×2 and the arrhythmia
    0.5/1.7 multipliers — arrhythmia must stay audibly *irregular*, not just
    fast);
  - the drone's filter-LFO rate eases `0.05 → 0.22 Hz` as v → 0 (breathing
    turns to flutter);
  - below 35% vitals, add one new quiet layer: a 440 Hz sine with a 6 Hz
    tremolo through `musicGain`, gain ramping 0 → 0.03 as vitals fall — a
    far-away monitor alarm. It must *duck to zero* the moment a heartbeat/
    dull-thud tell plays, and disappear entirely outside `"play"`.
  Clamp everything so the boarding tells and the Static's tick stay the
  loudest diagnostic sounds. Expose `vitalsAudioLevel` on `__doids.get()` and
  smoke-test that it rises when `ship.vitals` is set low.
- [x] **S3. Environmental audio — the world has acoustics.** Two parts:
  - **The Hollows echo.** Give `sfxGain` a wet send: `sfxGain → delay
    (0.28 s, feedback 0.35, lowpass 1200 Hz) → sfxGain`, with the send's gain
    at 0 on the surface and ramped to ~0.35 inside caves (`enterCave` /
    `exitCave` are the anchors; `level.isCave` is the state). Every blip,
    boom and heartbeat now rings in the rock — no per-callsite changes.
  - **Cave dressing.** While in a cave: a random drip every 4–9 s (short sine
    blip 1200→300 Hz through the echo bus at 0.04 gain) and a rare distant
    rumble (the `boom()` noise shape, 0.05 gain, lowpass 200 Hz, every
    20–40 s). Anchor in `updatePlay` behind `level.isCave`.
  Per-biome surface ambience (wind beds etc.) belongs to T3/T5 — build this
  item so a biome can later set the echo/dressing parameters from `RECIPE`.
- [x] **S4. Endgame rework — the last docking should be a docking.**
  Today `checkSectorClear()` starts the extraction and `updateExtraction()`
  completes the sector after 1.5 s of *sitting in the same med bay you were
  probably already parked in* — the owner often "completed before noticing".
  Make the extraction a distinct flying problem — you don't drop the last
  Scion off, you **fly into the ship that is leaving**:
  1. When the manifest closes, MERCY retracts her bay beams (both
     `bayRects()` become inert for the rest of the sector), **lifts ~140 px**
     toward jump altitude over ~3 s and drifts on the existing
     `mxo/myo` sway (keep the quickening Static pulses — they're good).
     If the player is parked in the bay at that moment, the deck simply
     rises away from under them — no instant clear (this alone fixes the
     "completed before I noticed" failure).
  2. She opens a **ventral hangar**: a slot in her underside ~1.6 ship-widths
     wide, marked with approach lights (use `PAL()` colours; pattern after
     the landing guide's always-readable treatment). New `hangarRect()`
     derived from `mercyPos()`.
  3. Completion = holding the ship inside the hangar window for a continuous
     1.2 s **in the air** — reuse the transfusion line's hover-window logic
     (`xfuseWindowR` pattern: inside = progress ring fills, drift out =
     resets). This is the sustained-hover skill the transfusion teaches, now
     as the sector's closing beat — and it is mechanically nothing like a
     Scion drop-off, which was the owner's request.
  4. Copy: banner becomes `"MANIFEST CLOSED — MERCY IS SPOOLING TO JUMP\nFLY
     INTO HER VENTRAL HANGAR BEFORE THE STATIC REACHES HER"`; on completion,
     a one-second beat (`"ABOARD — SECTOR " + name + " CLOSED"`) before
     `sectorClearNow()`.
  5. **The triage call (owner's "flee at a cost" idea).** Once ≥ 50% of
     `level.total` are accounted for *and* at least one Scion has been
     delivered, the hangar also answers **early**: holding in it with the
     manifest still open brings up a confirm card — `"SIGNAL EARLY
     EXTRACTION?"` / body: every Scion still waiting is listed as lost
     (−250 each, famous −500 *by name*), no sector-clear +1000, no
     Hippocratic bonus. Decline returns to play; accept runs the normal
     extraction. The next sector's briefing gains one grim line: `"You left
     N behind on <SECTOR>. The manifest remembers."` This is triage — the
     medical frame makes retreat *allowed but never free*, and it feeds the
     existing rank/lost accounting (`runLost`) with zero new score buckets.
  Guards: the finale keeps its own beacon flow (`checkSectorClear` already
  early-outs on `isFinale`); breach (`mercyBreach`) must still resolve before
  the hangar answers; `updateDocking` must ignore retracted bays. Tests:
  manifest close → bays inert → hangar hold completes; early extraction at
  50% marks the right losses; a ship parked in the bay at manifest-close does
  NOT auto-clear.
- [x] **S5. Identified saboteurs may be left behind.** `lvl.total =
  lvl.oids.length` counts saboteurs, so the manifest never closes until every
  counterfeit is boarded-and-contained or destroyed — even after Antisepsis
  has *shown* you it's a fake. The owner is right that this is wrong: once
  you can prove a unit is counterfeit, ignoring it should be a legitimate
  clinical decision. Design: **you may leave what you can prove.**
  - Add a third accounting state: `flagged`. A saboteur becomes flaggable
    when it is *identified*: visibly tinted by Antisepsis, or scanned — reuse
    Bundle J's landed-scan pattern (land within 60 px of any waiting Scion,
    hold ~4 s → if it's a saboteur: `"CATALOGUED — COUNTERFEIT +250"`, mark
    `o.flagged = true`, draw the `?` mark over it permanently; if it's real:
    `"VITALS VERIFIED — A HEARTBEAT"`, small reassurance, no score). The scan
    path means even a pilot *without* Semmelweis's upgrade can work the
    manifest — priced in time and exposure, same philosophy as J.
  - `checkSectorClear()` counts `delivered + lost + contained + flagged ≥
    total`. Red-bay containment keeps its +750 (flagging pays +250), so
    hauling the fake home under quarantine stays the braver, better-paid
    play; flagging is the safe, patient one. Boarding a flagged unit anyway
    is allowed (your funeral — all existing sabotage logic unchanged).
  - Sleepers with no tint and no scan stay unprovable — you carry them or
    you don't close the manifest. That tension is the game; don't soften it.
  - Copy: one line added to BRIEFS[3] (where tampering is introduced):
    `"Prove a unit false — the salvage teams will take it from there. But
    prove it."` Update HELP_CARD's "Listen to what boards" paragraph.
  - Tests: flagged saboteur + all real Scions delivered closes the manifest;
    unflagged sleeper blocks it; scan on a real Scion does not flag.
  - **Owner steer (July 2026 playtest, shipped):** the free always-on scan felt
    too powerful ("saboteurs will always be identified"). The scan is now
    **earned by rescuing Semmelweis (ANTISEPSIS)** and **replaces** the passive
    colour tint entirely — S7's magenta reveal-tint is gone; there is *no*
    colour tell at all. `provenLeftBehind` counts only units you actively
    catalogue (`o.flagged`), not a blanket ANTISEPSIS reveal. SEMMELWEIS's
    `upgradeDesc` and the R9 test were updated to match.
- [x] **S6. Rename the saboteurs → VECTORS (locked, owner decision, July
  2026).** The owner asked if "saboteur" should be "more redolent of
  medical misinformation"; **VECTOR** was the recommendation and is now
  locked as the player-facing term. Rationale: a *vector* is the
  epidemiological term for a carrier that spreads infection while
  healthy-seeming — exactly what these units are (misinformation carried
  home by well-meaning hands, GAME_DESIGN §2.4), it pairs with the game's
  existing quarantine/contaminant language, and it gives briefings a
  chilling clinical register. Code identifiers stay `"saboteur"` (the
  `role` value, variable names), same rule as the `doids_` keys.
  **Done:** the WORKSHOP shrine card, Antisepsis/Inoculation
  `upgradeDesc`s, the SLEEPER CELL daily-mod description, and the
  `"PASSENGER KILLED BY VECTOR"` floating text are swept in `index.html`;
  GAME_DESIGN.md §2.3/§2.4/§3/§4/§6/§7 and HOLLOWS_EXPANSION_SPEC.md
  updated; COPY_DECK.md reflects the final copy. BRIEFS[1]/[3] and
  HELP_CARD were checked and never named the role directly, so no change
  was needed there. **Still open:** the store-listing draft in O2 (write
  it "Vector"-first when O2 is drafted).
- [x] **S7. Saboteur effects are too subtle / colour spoils sleepers.** Two
  halves of one legibility problem:
  - *Active sabotage is missable.* "FUEL LINE CUT" is a small floating text.
    Give sabotage a moment: 0.5 s red vignette pulse at the screen edges
    (respect REDUCED FLASH — alpha halved), the fuel bar flashes, a new
    short hiss SFX (noise through a highpass, 0.3 s), `haptic.heavy()`, and
    promote passenger kills from `addText` to a full `banner("A PASSENGER IS
    DEAD — IT'S IN THE CABIN", DANGER)`. The player should never discover a
    kill from the score readout.
  - *Colour must not spoil what behaviour should reveal.* The owner clocked
    sleepers "due to colour" — before Semmelweis's upgrade there must be NO
    colour difference (verify: `doidFigure`'s tint is already gated on
    `upgrades.antisepsis`; add the R9 regression test), and after R9 the
    reveal tint is magenta, not gold-adjacent. The intended pre-upgrade
    tells stay behavioural only: the too-eager walk (40 vs 34), the
    mechanical wave, the boarding thud. Consider adding the two specced
    ground-tells from ROADMAP.md future ideas (refusing to panic near
    explosions; standing unnaturally still) since S5 now rewards *watching*
    Scions before committing to a rescue.
- [x] **S8. "If they were fake — where are our Scions?" (the 1.2 teaser).**
  The owner's sharpest narrative catch: the Workshop shrine proves the
  saboteurs were *built, not corrupted* — so the real units they impersonate
  were never rescued. Thread it, cheaply, now; pay it off in Q:
  - After any resolved ending where the WORKSHOP shrine (`shrinesSeen` has
    cave 1) was found, append one line to the ending card:
    `"And one line nobody signs off: if the counterfeits were never our
    Scions — where are ours? MERCY's manifest still lists the missing."`
  - Add it as a locked codex tease: the ARCHIVE tab's final row shows
    `"MANIFEST DISCREPANCY // — file remains open —"` once the Workshop is
    seen (a 15th, unresolvable entry — the itch 1.2 scratches).
  - In [HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md), note that
    **THE WARD** (already a specced 1.2 cave) is where the originals are
    found — held in cells, recovered with Bundle P's pendulum sling
    ("pendulum them out", exactly the owner's instinct). 1.1 ships the sling
    skill, 1.2 gives it its emotional payload. No launch-build work beyond
    the two copy lines above.
- [x] **S9. Scions gently repair the ship while aboard (owner-requested,
  July 2026).** A living crew should feel like one — carrying Scions should
  itself be a small kindness back, not just cargo. Add a slow passive vitals
  regen driven by who is currently riding, stacking with more aboard and
  reading a little stronger with a famous mind in the cabin.
  - **Where it lives:** a new `updateCabinMedic(dt)` call from `updatePlay`,
    right beside the existing Fleming self-heal block (`upgrades.penicillin`
    check, anchor: the comment `// Fleming: the hull cultures its own repair
    while vitals sit below half`). Same `s.vitals = Math.min(maxVitals(),
    s.vitals + rate * dt)` shape, so it composes with Fleming (additive,
    both are dt-scaled heals) without any special-casing.
  - **Who counts.** Only genuine Scions contribute — filter `s.passengers`
    with `p.role !== "saboteur"`, the same predicate `updateDocking`'s
    `deliverable` and the friendly-fire victim list already use. This isn't
    just code reuse: it's the same thematic point the WORKSHOP shrine makes
    ("dull chests, no hearts to tick") — a hollow counterfeit has no medical
    mind to lend, so it silently contributes nothing. A run with an
    unrevealed sleeper aboard heals a hair slower than the passenger count
    suggests, a fully passive, non-spoiling extension of the existing tell
    language (nothing new to render — the deficit is only ever felt, never
    flagged).
  - **The formula.** `rate = realCount * BASE_MEDIC_RATE + famousCount *
    FAMOUS_MEDIC_BONUS`, tuned slow on purpose: suggested
    `BASE_MEDIC_RATE = 0.5` (vitals/s per ordinary Scion — six aboard is
    3/s, a fraction of the med bay's 24–40/s) and `FAMOUS_MEDIC_BONUS = 1.0`
    extra per famous Scion currently riding (there is normally at most one
    per campaign sector, so in practice this reads as "a little stronger
    with someone extraordinary aboard," exactly the ask, without a second
    tunable to balance against remix's shuffled spawns). Stacking is
    already implicit — more real Scions aboard sums to a higher `rate`,
    capacity 6 caps it naturally.
  - **A cap that keeps the bay meaningful.** Don't let cabin healing reach
    full vitals — MERCY's bay must stay the only way to *finish* a repair,
    or the risk/reward of ferrying a full ship quietly dissolves. Clamp the
    target to `Math.min(maxVitals() * 0.85, s.vitals + rate * dt)` (a new
    ceiling distinct from Fleming's 50%-while-below-half rule; the two
    ceilings don't conflict since Fleming's is lower and only applies below
    half vitals — cabin medic can carry a hurt ship the rest of the way to
    85%, then real healing still requires docking).
  - **Guards.** No effect while `s.dead`, while `level.isCave` is irrelevant
    (Scions ride through cave transit fine, keep it active there too), and
    it must not fire during `mercyBreach`, `level.extraction`, or while
    inside the counterfeit MERCY's bay (`decoySnared()`) — those are
    already-tense states where a quiet heal would undercut the moment; gate
    on `state === "play"` the same way `updateVitalsAudio` (S2) will.
  - **Feel/audio hook (pairs with S1's cabin heartbeat chorus):** worth a
    one-line pass once S1 lands — the same per-passenger heartbeat layer
    that reads "who's aboard" could very slightly brighten in tone while
    cabin medic is actively healing, so the two features read as one
    system (a living cabin, heard and felt) rather than two unrelated
    numbers. Not required for S9 to ship; note it, don't block on it.
  - **Copy:** one line added to HELP_CARD's rescue paragraph — "A full
    cabin steadies you, a little, between drop-offs" — and a mention in
    GAME_DESIGN.md §4 (Core mechanics) alongside the existing bay-heal
    description. Add both to COPY_DECK.md in the same PR (per the standing
    rule).
  - **Tests:** board N ordinary Scions at reduced vitals, advance sim time,
    assert `ship.vitals` rises at the predicted `rate` and never exceeds
    85% of `maxVitals()` from this effect alone; board a famous Scion and
    assert the higher rate; board a (non-sleeper) saboteur alongside real
    Scions and assert it contributes zero to `rate`. Expose the live `rate`
    on `__doids.get()` (e.g. `cabinMedicRate`) so the smoke suite can assert
    directly instead of inferring it from vitals deltas.

---

## Bundle T — Zone identity: width, biomes, weather (July 2026 feedback round)

**Why:** The owner wants sectors that feel like *places*: progressively wider
maps, visually distinct landscapes with their own ornamentation, and eventually
weather and destructible terrain-objects. Today every sector shares one violet
palette (`buildHeightTile` hardcodes the gradient and stroke) and one width
formula. **Priority: T1–T3 + T6 in the launch build; T4–T5 are
explicitly allowed to slip to 1.1 if they threaten the date (they change
difficulty balance and need device-perf validation on top of Bundle D's
budget). Dependencies: D4 (terrain tiles — palettes thread through it), C/S3
(audio beds), I (surge), M1 (seed plumbing — widths change the golden
checksum deliberately).**

**Status (shipped):** the launch core **T1–T3 + T6 are done** on the web build.
Progressive widths + distance-scaled fuel pods (golden checksum updated to
`1488047869`), per-sector biome palettes (grad/stroke/glow + `night`/`star`
tints, caves keep the Static violet), biome ornamentation (boulders, reeds +
ward-lanterns that light the dark, ice spires, banded dunes, hedgerows) with
per-sector surface ambience (wind on the shoals, insect shimmer over the
terraces), and staged nightfall on the Basin (dusk → full dark with a banner,
a drone swell and a guttering lamp — the guttering itself was later cut, see
the parked Vector light-sabotage idea below). Smoke tests added for all four. **T4
(destructible scenery) and T5 (weather) remain** — the pre-approved slip to
1.1 stands.

- [x] **T1. Progressive sector widths.** `genLevel` currently uses
  `W = 2600 + Math.min(n, 5) * 400` (finale 4400) — the owner finds them too
  small, and the cap flattens 5–7. Change to `W = 2200 + n * 550`
  (sector 0: 2200 — *smaller* than today, it's the teaching sector; sector 6:
  5500; finale: keep 4400, it's dense and dark by design). Fuel must scale
  with distance — that's the point ("this will require refuel calls or local
  fuel pods"): give sectors 1–2 their first fuel pods (RECIPE `pods: 0 → 1`
  and `2`), and add +1 pod per full 800 px above 3000 in `genLevel` (placed
  via the existing `pick()`), so remix/daily widths stay survivable. The
  transfusion drone already provides the "refuel call" everywhere as the
  backstop. Consequences to handle deliberately: the M1 golden heightmap
  checksum changes — update the test value in the same PR and say so in the
  PR body; `spots`/`pick` min-distances can stay (more room, same counts =
  emptier ≠ wider, so ALSO scale `oids`/`turrets` on sectors 4+ by ~+1 each);
  Curie's compass and Radiosense matter more at width — no change needed,
  but verify black boxes stay findable (they blink stronger when near).
- [x] **T2. Per-sector terrain palettes.** Add a `pal` entry to each
  `RECIPE[n]`: `{ grad: [top, bottom], stroke, glow }`, threaded through
  `drawWorld`'s `getTiles(...)` call into `buildHeightTile` (which currently
  hardcodes `["#1b1040", "#0c0820"]` fill and `#b388ff`/`#7c4dff` stroke).
  Caves keep the current violet (the Hollows should stay the Static's
  colour). Suggested palette map — each sector's landscape echoing its
  healer, so the biome *is* the narrative:
  | # | Sector | Ground | Rationale |
  |---|--------|--------|-----------|
  | 0 | ASCLEPION | soft teal-greens | temple calm, the tutorial breathes |
  | 1 | VESALIUS RIDGE | rust reds / ochre | anatomy, exposed muscle of the land |
  | 2 | NIGHTINGALE BASIN | deep indigo | her sector is the dark one |
  | 3 | SEMMELWEIS DEEP | cold antiseptic grey-green | the scrubbed ward |
  | 4 | CURIE FIELDS | luminous violet-green | radium glow (keep anomaly violet) |
  | 5 | AVICENNA SHOALS | sand / amber | the Persian desert, his crossing |
  | 6 | JENNER TERRACES | pale pastoral green | cowpox country — the calm that lies |
  | 7 | THE NULLWAVE | near-black violet | as now — the Static's home |
  Also tint the darkness overlay and star field subtly per sector (one
  multiply each). Keep every palette *behind* the HUD's semantic colours —
  run the landing guide / ECG over each ground colour and check contrast in
  both PALETTES (H1).
- [x] **T3. Ornamentation sets — zone the levels visually.** The scenery
  system (`RECIPE[].scn`, `drawScenery`) already varies counts; give it
  *types* per biome, so L1 stops being "very plain" (owner). Additions, all
  decorative-first (collision comes in T4): **boulder stacks** (Vesalius —
  bump `rocks`, add a stacked-boulder draw variant), **reed clusters + dim
  ward-lanterns** (Nightingale — lights matter in the dark sector),
  **ice spires with internal glow** (Curie — reuse the glow-tree code with a
  crystalline silhouette), **dune-banded rocks + salt pans** (Avicenna),
  **hedgerows and a ruined village** (Jenner — pastoral, with `ruin` count
  up), extra wreck density on the Nullwave (already). Implementation:
  extend the `scn` object with new type counts, one draw function per type
  in `drawScenery` (respect the D-bundle rule: `glowStroke`, no shadowBlur
  in loops), and authored per-sector in `RECIPE`. Ambient audio per biome:
  S3's bus gains a per-sector bed (wind for desert, insect-shimmer for the
  terraces, silence + drips for dark sectors) — one small gain-node loop
  each, set in `toBriefing`/`genLevel`. Screenshot all 8 sectors for the O4
  store-shot pass — this bundle is what makes those screenshots sell.
- [ ] **T4. Destructible, collidable scenery.** *(Launch-stretch — may slip
  to 1.1, owner has pre-approved the slip; do not let it block O.)* Tall
  scenery becomes real: trees, buildings, ice spires get `solid: true` —
  ship collision behaves like terrain contact (crash or shield-bounce;
  shield already saves cave-roof hits, reuse that check), and shots destroy
  them: trees burn (2 s flame particles, leave a charred stump variant),
  buildings erode through 3 damage states before rubble, spires shatter.
  THE CRITICAL RULE: destroying scenery increments `firedShots`/`runFired`
  like any shot (it already would — verify nothing special-cases it) and
  exhaust near a tree can ignite it (reuse the friendly-fire exhaust check
  pattern in `updatePlay`) — *do-no-harm now extends to the world*, which is
  exactly the game's thesis; a scorched-earth approach path costs you the
  Hippocratic bonus. Fairness pass required (the sector-1–2 turret-cover
  rule is precedent): no Scion may wait where the only safe landing lane
  demands destroying scenery. Perf: burning/erosion must stay within D's
  frame budget on the finale — measure with `?perf=1` before merging.
  Lure-trees keep their special reveal behaviour — a *burning* lure-tree
  should still count as `firedAtSecret`, not vanish silently.
- [ ] **T5. Weather & atmospheric conditions.** *(Launch-stretch, same
  pre-approved slip as T4.)* One condition per sector max, authored via a
  new `RECIPE[].wx` key, each with an audio bed (S3) and a REDUCED FLASH-
  aware visual: **crosswinds + dust devils** on Avicenna (a steady lateral
  force ±20 px/s² with gusts, telegraphed by streaking particles; dust
  devils = slow-moving anomaly-force columns, reuse the anomaly pull code
  with an x-drift), **rain + lightning** on Vesalius or Jenner (rain
  streaks; lightning = 120 ms sky flash + delayed rumble, min 8 s apart,
  suppressed by REDUCED FLASH), **snow blizzards** on Curie-as-ice-fields
  (visibility swirls — reuse the darkness-overlay machinery with a soft
  white noise mask instead of black; lamp radius logic applies). Winds
  interact deliciously with the transfusion hover and (1.1) the pendulum —
  note the interaction in PENDULUM_SPEC when this lands. Daily-mod synergy:
  add `wx`-based mods to `DAILY_MODS` ("HEADWINDS — crosswinds in every
  sector") once stable. Each condition needs: tunable strength, a briefing
  sentence teaching it, and a smoke test that the force applies only in its
  sector.
- [x] **T6. Stage the darkness — give night a scarier entrance.** The owner
  loves the dark sector but feels it "deserves a scarier intro" and maybe a
  later slot. Moving it breaks two locked structures (each sector introduces
  exactly one element; Nightingale = the Lamp is canon — she IS the Lady
  with the Lamp), so instead **stage nightfall inside the sector**: Basin
  starts at dusk (darkness overlay alpha ~0.4), and over the first ~20 s —
  or at first boarding, whichever comes first — night *falls* (alpha ramps
  to full over 6 s) with a banner (`"NIGHT COMES DOWN ON THE BASIN"`), a
  long low drone swell (S3 bed), and the lamp flickering on. Rewrite
  BRIEFS[2] to foreshadow dread rather than describe dust: e.g. *"Dust
  occlusion across the basin — and night coming down fast. Your lamp is
  your lifeline. And captain… the dark out here listens back."* (final copy
  via COPY_DECK review). Keep full darkness available later anyway: the
  BLACKOUT ROTATION daily mod and the finale already reprise it. Test: alpha
  ramp fires once, REDUCED FLASH halves the flicker, resume mid-sector
  restores the post-nightfall state.

---

## Bundle U — Second playtest: sound, refueller economy & UI (mid-July 2026 feedback)

**Why:** A second phone playtest after the R/S/T round surfaced four more items —
a missing audio cue on the lift pad, a field-refuelling loop that currently costs
nothing (owner wants it to *cost*), no on-screen legend for the HUD readouts, and a
pause button a second player independently failed to find. All web-side; keep the
smoke suite green. **Priority: before O, alongside R/S. Dependencies: U4 sits on
top of R4/R2 (don't double-implement); U3 pairs well with R1's card pagination.**

- [x] **U1. "Rings hollow" sound when you land on a lift pad.** The pad already
  *reads* hollow — `updateLift()` (`js/update.js:1648`) floats
  `"THE PAD RINGS HOLLOW…"` and plays a tiny `blip(180, 120, 0.3, "sine", 0.1)`,
  but only after a 0.6 s hold, and there is no distinct cue at the moment the ship
  first settles on the plate. Add a `ringHollow()` primitive to `js/audio.js` (next
  to `hydraulic()`): a resonant, struck-tube tone — two detuned sine/triangle
  partials roughly an octave apart, a long exponential decay (~0.9 s), routed
  through a gentle lowpass like `hydraulic()` uses so it reads as "empty space
  underneath." Fire it **once** when `near` first becomes true in `updateLift`
  (guard with an `L.rung` flag so it doesn't retrigger every frame while parked;
  clear it when the ship leaves the pad, alongside the existing `L.holdT`/`armed`
  reset). Keep the hint text + blip as the secondary "hold to descend" cue. Gate on
  the SOUND setting like every other SFX. Test: land on a lift sector's pad via
  `__doids`, assert `L.rung` sets exactly once and clears on lift-off.
- [x] **U2. The refueller should cost points — and carry less each time.**
  Field-refuelling (THE TRANSFUSION LINE, `js/update.js:1472`; `XFUSE_RATE` /
  `XFUSE_PRIMER`) is currently a net *reward* — a CLEAN LINE pays **+250**. The
  owner wants it re-cast as a diminishing, priced lifeline:
  1. *Diminishing supply.* Track resupply uses per run (a `run.refuels` counter, or
     a field on the ship, reset in `resetRun()`), and cap each fill lower than the
     last — e.g. deliver up to `maxFuel() * (0.9 ** refuels)` so the drone visibly
     brings less every time (~full, then ~90%, ~81%…).
  2. *Score penalty scaled to fuel taken.* Replace the CLEAN-LINE bonus with a
     charge proportional to the fuel delivered — using the crutch should hurt the
     tally, not help it.
  3. *Watch it tick down.* During the `"fill"` flow (~`js/update.js:1591`) decrement
     `score` per unit delivered and float a running `-N` readout at the ship (reuse
     the `addText` float), so the player literally sees points draining as the tank
     climbs.
  4. *Keep the safety valve honest.* A ship stranded at 0 fuel must still be able to
     limp to the next pad (thrust and shield both require `fuel > 0`), so floor the
     per-use delivery at a usable margin (≥ `XFUSE_PRIMER` + enough to move).
  **This reverses an established reward — flag for owner sign-off and update
  `GAME_DESIGN.md` (scoring) + `COPY_DECK.md` before implementing.** Check the
  interaction with S4's endgame docking and the RATIONED TANK daily mod
  (`js/world.js:366`) so a hard mod plus the new penalty can't soft-lock a run.
- [x] **U3. Play-screen explainer — a legend for the HUD.** `HELP_CARD`
  (`js/world.js:509`) teaches the controls but never names the on-screen readouts,
  so a new player can't tell the FUEL bar from the ECG. Add a "WHAT YOU'RE LOOKING
  AT" explainer — either a second page of `HELP_CARD` (using R1's pagination) or a
  sibling card — that labels each element: the **FUEL** bar top-left (`drawBar`,
  `js/render.js:1822`), the **ECG / vitals** bar top-right (`drawECG`, `:1835`), the
  **score** readout top-centre, the **❚❚ pause** button (U4/R4), the on-screen
  **THRUST / FIRE / SHIELD** buttons, the **landing approach guide** (↓ descent /
  ↔ drift, green = safe touchdown), and the **Static clock**. A small labelled
  diagram is ideal if cheap; otherwise a short glossary list rendered via
  `drawCardPanel`. Reach it from the title (beside HOW TO FLY / `helpRect()`) and
  from the PAUSE screen. Keep all copy in `COPY_DECK.md`. Test at 568×320 that it
  paginates/fits within the viewport (same constraint as R1).
- [x] **U4. Pause button is still hard to find / overlaps other content.** This is
  the same defect **R4** ("pause button effectively invisible") and **R2** ("PAUSED
  overlaps RESUME") already target — filed here because a *second* playtester
  independently missed it, confirming the fix is needed. When filed, `pauseRect()`
  was `{ x: vw/2 - 18, y: 2, w: 36, h: 18 }`, stroked at 0.35 alpha and sitting
  directly under the centred score readout — exactly the collision the owner
  reports as "overlaps with other content." **Do not re-implement R4/R2 — land
  them.** The one addition from this round: whatever new home the button gets (R4
  proposes ≥44×30 px, left of the ECG bar, alpha ≥ 0.6) must clear the score
  readout **and** the FUEL/ECG bars at a 320-high viewport, not just the score. If
  R4 has already merged and players still miss it, escalate the outline to a
  filled, higher-contrast pill rather than a stroked box. *Delivered:* `pauseRect()`
  is now `{ x: vw - bw - 14 - saRight - 54, y: 12, w: 48, h: 30 }` (`js/world.js:471`),
  drawn in `drawHUD` as a filled, higher-contrast rounded pill clear of the score
  readout (`js/render.js:1752`) and both bars.

---

## Bundle QA — Playtest QA: legibility & level-generation fairness

**Why:** Three issues from owner playtesting that don't fit neatly into the
bundles above — two are legibility bugs and one was a fairness bug that broke a
stated design pillar. **Priority: no fixed slot, but land P-QA1/P-QA3 before O.
None blocks Apple review on its own. Dependencies: none.**

> Rescued from the abandoned branch `claude/roadmap-bundle-e-ffntf9`, where these
> notes were originally filed as "Bundle P" — a label since taken by the pendulum
> sling. Renumbered here so nothing is lost. QA2 has since been fixed; see below.

- [x] **QA2 (DONE). Level generation could silently pack a Scion inside
  point-blank turret range.** `pick(minDist)` in `genLevel` gave up its spacing
  check after 80 failed tries and returned an unchecked random x — a headless
  probe of the shipped seed-0 campaign found sector 1 (Vesalius Ridge) placing a
  Scion 6px and 43px from two of its four turrets, all within firing range,
  working against the pacifist-route pillar (OATH KEEPER/HOLLOW KEEPER).
  **Fixed in the July 2026 release-readiness polish pass (PR #6):** early-sector
  turret placement is now re-sited/retired so no waiting Scion in sectors 0–2
  sits inside more than one turret's cover, and a regression test guards it
  (`tests/smoke.spec.js` → "early sectors never pocket a Scion under interlocking
  turret cover", asserting ≤1 turret within 380px of any oid in sectors 0–2).
  *Remaining option, if ever wanted:* extend the same guard across all 8 sectors
  (denser later sectors fail the spacing search more often).
- [x] **QA1. Colour/render cues for "you can fly through this" vs. "this kills
  you."** Every scenery entry (`deco()` in `genLevel` — trees, rocks,
  buildings/ruins, both wreck types) is purely decorative: `drawScenery()` has no
  ship-collision check at all. Only `groundAt()`/`roofAt()` (terrain),
  `level.turrets`/`level.drones`/bullets, and the `fake`/`hollow` scenery flags
  (shootable, not collidable) can end a flight. A building rendered as a solid
  `rgba(8,12,30,.9)` fill (`drawBuilding`) or an opaque wreck hull reads exactly
  like the terrain silhouette next to it — nothing tells the player it's passable
  air, not a wall.
  *(Landed: terrain (`buildHeightTile`) fills fully opaque, on purpose — every
  decorative scenery fill (`drawBuilding` both variants, `drawRockScn`,
  `drawBoulder`, `drawDune`, `drawHedge`, `drawWreckM`, `drawWreckS`) now
  shares one `DECO_ALPHA` translucent fill constant instead of opaque hex/high-
  alpha fills, so "solid" vs. "flavour" reads at a glance without touching any
  stroke colour — no second, competing palette on top of H1/H2. Verified with
  a headless screenshot: the building's lit windows now show stars through the
  hull.)*
- [x] **QA3. Wreck art reads as "the intact vehicle, tipped over," not
  wreckage.** `drawWreckM` renders `mercyHullPath()` — the same unbroken hull
  outline `drawMothership` uses for the *live* station — at `sc.s * 0.62` scale,
  with a couple of stroked "breach" lines drawn on top of the fill rather than
  cut through it, so the silhouette never actually breaks apart.
  *(`drawWreckS`'s proportions and both wrecks' ground-line clip/`tornHullEdge`
  had already been fixed in an earlier unlabeled pass — confirmed live, not
  re-touched. Landed here: `drawWreckM`'s hull fill is split into two pieces —
  each clipped to its own side of the jagged breach line, then drawn from a
  slightly different translate/rotate of the SAME hull path — so the two
  halves visibly fail to line up at the seam instead of one continuous
  silhouette with lines drawn over it; `drawWreckS` gets a proportionate
  destination-out notch bite out of one flank (a full two-piece split would
  be clutter at its small scale). Verified with a headless screenshot:
  `drawWreckM` now reads as a broken, jagged, translucent hull.)*

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
  **Owner decision, updated:** the store-linked homepage is a dedicated
  marketing page (`about.html`), **not** the live playable build — see O7.
- [ ] **O3. Age rating questionnaire** — expect 9+ (infrequent mild fantasy
  violence). The player *can* shoot medics (malpractice mechanic); answer the
  violence questions honestly and keep the store description's framing on
  consequence, not carnage.
- [ ] **O4. Screenshots & preview.** 6.7" and 6.1" sets (landscape), 8 per
  size: title, a landing beside a waving Scion, MERCY docking, a dark-sector
  lamp shot, a Hollows shrine, the CONTAMINANT ABOARD warning (owner call,
  swapped in for the ECG-arrhythmia moment — less compelling on screen), the
  "SOMEONE EXTRAORDINARY IS ABOARD" famous-Scion reveal, and the
  transfusion-line field-refuel moment (both owner additions, filling gaps
  the other six don't cover — narrative depth and the refuel mechanic).
  15–30 s preview video of one full rescue loop. Capture from a real device
  after D (perf)
  lands.
- [ ] **O5. Support & privacy URLs.** A one-page privacy policy ("no data
  collected, saves stay on device/iCloud") and support contact, hosted on the
  existing GitHub Pages site.
- [ ] **O6. Submission dry run.** TestFlight internal build → full E8 matrix →
  external TestFlight round (5–10 players, watch where they die and quit) →
  submit. Budget one rejection cycle; 4.2 is the likely challenge and the
  response is the native-features list (F, G, E4).
- [ ] **O7. Take the public playable web build down before launch (owner
  decision, July 2026).** The live GitHub Pages deploy
  (`https://burners70.github.io/Hollow-Oath/`) was a development/testing
  convenience, not an intended permanent free release — the owner does not
  want a free web version coexisting with the $2.99 iOS app. Before
  submission:
  - Stop serving the playable build (`index.html` + `js/`/`css/`) publicly —
    either disable GitHub Pages entirely, or restructure the Pages source so
    it only serves the marketing/support/privacy shell (`about.html`,
    `support.html`, `privacy.html`), not the game itself.
  - Re-home the named homage paragraph (Oids/Thrust/Gravitar — E7) onto
    `about.html` specifically, since it can no longer live on the playable
    page.
  - `app/sync.sh` (mirrors web build into the Capacitor `webDir`) is
    unaffected either way — it reads from the repo directly, not from the
    public Pages deploy.
  - Note: this is a hosting/repo-settings change, not just a docs change —
    needs deciding *how* (Pages toggle vs. restructured source) before O6's
    dry run, since O5's Support/Privacy URLs and O2's Marketing URL all
    currently assume something is reachable at a `burners70.github.io` path.
  - **Resolved (owner decision, July 2026): restructure Pages to shell-only,
    do NOT disable it** — the marketing/support/privacy pages move to a
    **custom domain, `hollow-oath.com`** (see O8), so Pages stays on but serves
    only `about.html` / `support.html` / `privacy.html`, never the game.
- [ ] **O8. Move the public shell to a custom domain (`hollow-oath.com`).** The
  owner registered `hollow-oath.com` (Cloudflare, July 2026) to keep the
  personal `burners70` handle off anything users see (App Store
  Support/Marketing URLs, in-page links). It attaches to GitHub Pages for free
  — no change to how the site deploys. Steps: in Cloudflare DNS add a `CNAME`
  for the apex `@` → `burners70.github.io` (Cloudflare flattens it) and a
  `CNAME` for `www` → `burners70.github.io`, both **DNS only (grey cloud)** so
  GitHub issues its own HTTPS cert; set the custom domain in repo
  **Settings → Pages** (this commits the `CNAME` file automatically); enable
  **Enforce HTTPS**. With an *apex* custom domain the shell serves at the
  **domain root** (`https://hollow-oath.com/support.html`), not under
  `/Hollow-Oath/`. Only after it resolves: flip the Support/Marketing/Privacy
  URLs (O2/O5) and the "play it live" links in `README.md` / `GAME_DESIGN.md`
  to the new root, and set the two App Store URL fields. The GitHub Issues
  link has already been removed from `support.html` (email-only) so the handle
  isn't exposed even for click-through. (A paid custom domain, ~£10/yr, was the
  owner's explicit choice over a free neutral-org rename.)

---

## Bundle P — The pendulum sling (update 1.1)

**Why:** The Oids/Thrust pendulum homage, decoupled from Scion pickup (owner
direction, July 2026): each Hollow hides one towable relic of Glycon's
(THE FIRST CALL, THE LAST HEART, THE MASK), slung beneath the ship on real
pendulum physics and carried out through roof and darkness to MERCY —
patient transport as a flight skill. **Locked (owner decision, July 2026):
ships as the free 1.1 content update, "1.1 — THE PENDULUM", not in the
launch build.** Full spec, rationale and draft copy:
[PENDULUM_SPEC.md](PENDULUM_SPEC.md). **Priority: first post-launch.
Dependencies: all shipped (I, J, K, H, D, F1); the P10 feel pass needs the
E wrapper on a real device.**

- [ ] **P·impl. Implement per the spec checklist** — work through
  PENDULUM_SPEC.md §7, items P1–P9, checking off there (one source of
  truth; don't mirror the list here).
- [ ] **P·feel. P10 device feel pass** — `SLING_L`, damping, the 30% tug;
  the three handling characters must feel different before they feel
  hard. Do alongside F3.
- [ ] **P·ship. Release 1.1** — What's-New copy per the E7 trademark
  tiers (generic in-store, named homage on the site), review-refresh
  prompt consideration, and the $2.99 → $4.99 price move case if launch
  priced low (O1).

---

## Bundle Q — The deep Hollows (update 1.2)

**Why:** The lifts stay hard to find (a virtue, named by the owner) — the
aid is priced instead: René Laennec joins as a twelfth famous Scion hidden
inside a new Hollow, found by his knocking. AUSCULTATION makes unfound
lift pads ring when near (the Radiosense pattern applied to lifts); his
chart unlocks the ROTATION CHART (return travel to cleared sectors,
cached as-left); three new caves with new discoveries (THE WARD, THE
MINT, THE LISTENING POST). Full spec:
[HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md).

**Split by release (owner decision, July 2026).** The owner asked for fly-back
sooner (originally raised as a "1.01 fix"; see V1). Rather than break Q's
in-game unlock, Bundle Q is split across two releases:
- **Ships in 1.1 (with Bundle P):** René Laennec + AUSCULTATION + the
  **ROTATION CHART** (fly-back to cleared sectors, cached as-left) — sequenced
  *after* the pendulum work so the level cache lands on a settled base.
- **Ships in 1.2 ("THE DEEP HOLLOWS"):** the three new caves (THE WARD, THE
  MINT, THE LISTENING POST) and their discoveries.

**Priority: the 1.1 core rides with P; the caves are second post-launch (1.2).
Dependencies: P shipped/stable before the ROTATION CHART cache (still true even
within 1.1); J, K, I, M, A all shipped.**

- [ ] **Q·impl. Implement per the spec checklist** — work through
  HOLLOWS_EXPANSION_SPEC.md §9, items Q1–Q10, checking off there. **Tag each
  item to its release per the split above (Laennec/AUSCULTATION/ROTATION CHART
  core → 1.1; the three caves → 1.2) when scheduling.**
- [ ] **Q·guard. Regression gate** — the Q5 level cache touches
  `toBriefing`; the full smoke suite plus the M1 heightmap checksum must
  stay green, and remix/daily must never draw Laennec onto a surface
  sector (Q10 assertions).
- [ ] **Q·ship. Release 1.2** — What's-New copy, same trademark tiers;
  add EVERY HOLLOW HEARD and GENTLE HANDS (P) to the live G3 achievement
  set if Game Center shipped.

---

## Bundle V — 1.01 maintenance & narrative (post-approval owner round)

**Why:** Captured while **1.0 is in App Review (July 2026)**, this is the first
point release — the fixes and narrative beats the owner wants in **1.01** once
1.0 is approved. It is deliberately a *maintenance + narrative* bundle: no new
subsystem, but several fairness corrections and the payoff of the Solace as a
named sister ship. **Priority: first thing after 1.0 approval. Dependencies:
1.0 shipped; V3/V4/V5 share the Solace reveal, so build them together.**

> **Tilt is dropped here, on the record.** The gyro/tilt steering path is
> *not* on the forward plan (owner decision, July 2026 — "not really any good
> for this game"). It was pulled from Settings before 1.0; the scaffolding
> stays dormant in `js/input.js` (`tilt` / `enableGyro` / `toggleTilt`,
> `doids_tilt`). Do not resurface it in 1.01 without an explicit reversal.
> User-facing docs (`support.html`, `GAME_DESIGN.md` §5, `STORE_LISTING.md`)
> have been scrubbed of the stale Tilt references in this pass.

- [ ] **V1. Fly back to previous zones (rescue those left behind) — RESOLVED
  to 1.1, tracked under Bundle Q.** The owner's request is the **ROTATION
  CHART**: return travel to cleared sectors (cached as-left), **unlocked
  in-game** by rescuing René Laennec (AUSCULTATION). **Decision (owner, July
  2026): keep the in-game unlock, and split Bundle Q so this core ships in
  1.1** — sequenced *after* the pendulum (P) so the level cache lands on a
  settled base — while Q's three new caves stay in 1.2. Not a 1.01 item; listed
  here only because it was raised as a "1.01 fix". See Bundle Q's split note.
  Code anchors: HOLLOWS_EXPANSION_SPEC.md §Q5; the round-trip must reuse the
  checkpoint serialization (`doids_run`, `__doids.go(n)`).
- [ ] **V2. Scan-jeopardy fairness for Scions (design pillar: fair, not a
  cheat).** Today you often can't land far enough from a Scion for a scan to
  complete before it reaches you, which reads as a rigged loss. Two changes:
  (a) a **running** Scion should stop fleeing and start *approaching* the ship;
  (b) generation/tuning must guarantee there is *always* a reachable landing
  spot from which a scan can complete before the approaching Scion arrives —
  though it may be hard, and may be up or down a slope the Scion can climb.
  This is a fairness *invariant*, so add a generation-time assertion (like the
  M1 heightmap checks) that such a spot exists. Code anchors: the Scion scan /
  approach logic (`updateScionScan`, the `scanCandidate` gate and `"wait"` /
  `"run"` states around `js/update.js:1131`), `SCAN_T`, `scanRate()`,
  `slopeAt()` and the walkability the Scion uses to climb.
- [ ] **V3. The Solace reveal — a proper beat.** The discovery currently lacks
  a moment. Make the **first scan announce it is the top of a sister ship, the
  AMS Solace** (big reveal, not a whisper). On scan completion, trigger a
  **sonar-style pulse that draws the whole hull shape** — including the
  submerged section, which pulses *more dully* than the exposed part — then
  fades back to invisible. **Repeat that pulse on every 41-second Static
  beat.** Code anchors: the scan/reveal system (`updateScan` / the shrine-scan
  path); the Static clock (`updateStaticClock`, `js/update.js`) to hook the
  41-s pulse; a new draw pass in `js/render.js` for the hull outline (exposed
  vs. submerged alpha). Ties into the counterfeit-tell language — a real pulse
  that lives *with* the heartbeat clock. Update GAME_DESIGN.md narrative canon.
- [ ] **V4. Solace pre-scan label legibility.** The text above the Solace
  before it's scanned is illegible — fix size and contrast (add a backing
  plate / shadow like other world labels). Code anchor: the label draw in
  `js/render.js` for the pre-scan Solace; check against the `bigText`
  (`bodyFontPx()`) and reduced-flash paths so it stays legible in all modes.
- [ ] **V5. Seed the Solace in the story panels (lightly).** Reference the
  Solace without over-signposting that players *should* expect to meet it:
  establish that the MERCY is one of a **second wave** alongside **AMS X** and
  **AMS Y**, following an **initial wave** that included the **X, the Solace,
  and the Y**. A line or two in the intro / early BRIEFS. Code anchors:
  `BRIEFS` / intro copy in `js/world.js`; **mirror every changed string into
  [COPY_DECK.md](COPY_DECK.md) in the same PR (R10).**
- [ ] **V6. Make the "heard" scan playable — a sonic-wave parry.** Mirror the
  shield-parry mechanic, but instead of a bullet it's a **visible sonic wave**
  you must parry back to *flatten the corrupting signal*. Code anchors: the
  existing shield/parry code (deflection in `updatePlay` / the shield handling
  in `js/update.js`); render a travelling wavefront in `js/render.js`; resolve
  on a well-timed shield. **Needs a short design pass** (timing window, what
  failure costs, how it reads against the existing parry) before build.
- [ ] **V7. Post-completion title & "start a run" framing.** After a first
  completion (`veteran`), the title and the run-start language should
  acknowledge it. Change the visual — e.g. a shot of a **Hollow** to tease
  what's left to find — and change the button copy. **Options for the owner to
  pick from:** *"Is there more?"* · *"Go back down"* · *"Something's still
  down there"* · *"Return to the surface"*. Code anchors: `drawTitle` in
  `js/render.js`, the `veteran` flag, and the REMIX pill it already unlocks.
- [ ] **V8. Adapted second-run intro.** The veteran (post-completion) run
  opens with a different intro, e.g.: *"Something doesn't feel right. If
  everything came from a corruption of Solace's distress call, we're left with
  some big questions. Why did it corrupt? And why did it crash in the first
  place?"* Code anchors: the intro sequence gated on `veteran`; `doids_intro`;
  COPY_DECK.md.
- [ ] **V9. Sound-led level intros.** Give subsequent sector intros a similar
  sensory hook — e.g. *"Is there a sound coming from beneath the ground?"* on a
  Hollows-bearing surface sector. Light touch, per-sector. Code anchors:
  `BRIEFS[]` in `js/world.js`; keep in sync with COPY_DECK.md. (Note: an
  earlier "Listen for them in the dark" promise on Nightingale Basin was cut
  for lack of an audio tell — see the parked stereo-beacon idea below; don't
  re-introduce a promise the audio can't yet keep.)
- [ ] **V10. Post-win campaign variant.** The return (post-completion) run
  should differ from the first: **same landscape, but different Scion/Vector
  placements, more guns, and a higher proportion of Vectors.** This extends the
  existing veteran-return machinery (the finale already spawns the counterfeit
  MERCY only for `veteran`, `js/world.js:829`). Code anchors: `genLevel` in
  `js/world.js` (placement + `RECIPE`), gated on `veteran`; reconcile with the
  existing REMIX rotation (M) so the two return modes don't fight.
- [ ] **V11. (Candidate) Decoy MERCY reachability.** Owner question, July
  2026: the counterfeit MERCY is currently gated behind **`veteran` +
  reaching the secret finale + `blackboxCount >= TRIANGULATE_N`**
  (`js/world.js:829`, `js/update.js:695`), so most players never see it.
  Decide whether 1.01 should surface it earlier / more reliably, or leave it as
  a deep secret. Owner decision — logged so it isn't lost.
- [ ] **V·guard. Regression gate.** Smoke suite green; extend `__doids.get()`
  to expose new state (Solace pulse, heard-scan parry, fly-back availability);
  add tests for the V2 fairness invariant and V1 return-travel round-trip.
- [ ] **V·ship. Release 1.01.** What's-New copy; confirm no new App Review
  surface (no new data collection, no new entitlements). Update
  [CHANGELOG.md](CHANGELOG.md).

## Bundle W — Landscape challenge escalation (update 1.1, with P)

**Why:** Owner idea (July 2026) for a **1.1** feature update: more landscape
*challenge* as the campaign progresses — **crazy deep / narrow valleys, rocky
outcrops and overhangs you must fly under, and small caves on the surface
levels.** Distinct from the deep Hollows (Bundle Q, the lift-down cave network)
— this is difficulty and texture in the *surface* terrain itself. **Decision
(owner, July 2026): ships in 1.1 alongside Bundle P** (the pendulum), which
already owns the 1.1 label. **Priority: post-launch, with P. Dependencies:
builds on Bundle T (per-sector width/biome identity) and the terrain
generators.**

- [ ] **W1. Progressive surface-terrain challenge.** Scale terrain difficulty
  with sector index: deeper/narrower valleys, overhangs/outcrops that force
  flight *underneath* them, and small surface caves. Code anchors: `genLevel`,
  `roofAt`, `genCave`, `slopeAt` and the per-sector `RECIPE` in `js/world.js`;
  the `wideBump` width scaling (`js/world.js:711`) is the existing per-sector
  difficulty lever to build on. **Must respect the V2 fairness invariant** —
  harder terrain cannot make a scan-landing spot unreachable — and the Bundle T
  biome work. Overhangs interact with collision and the shield's roof-save
  (`updatePlay`), so this needs a design + test pass, not just generation
  tuning. (Related but separate: the parked **destructible scenery** (T4) and
  **weather** (T5) launch-stretch items.)
- [ ] **W·guard. Regression gate.** Full smoke suite plus the M1 heightmap
  checksum stay green; add fairness-invariant assertions for the new terrain
  shapes across every seed the campaign and REMIX/DAILY can produce.

---

## Suggested sequencing

```
A ──┬──────────────► E ──► F ──► G ──► O
B ──┤ (parallel)     ▲                 ▲
C ──┤                │                 │
D ──┴────────────────┘                 │
      then, in any order alongside E–G:
      H, I, J, K, L   → price floor $2.99
      then M, N       → price point $4.99 at launch
      then the July 2026 feedback round, before O:
      R (fixes — blocks submission)
      S (sound / endgame / saboteurs — owner-requested for launch)
      T1–T3 + T6 (zone identity core — launch)
      T4, T5 (destructible scenery, weather — launch-stretch; slip to 1.1 if needed)
      after 1.0 approval:
      V (1.01 — maintenance & the Solace reveal; scan fairness; heard-scan parry)
      then the feature updates (all free):
      1.1 = P (THE PENDULUM) → then Q-core (Laennec + ROTATION CHART / fly-back) + W (landscape challenge)
      1.2 = Q-caves (THE DEEP HOLLOWS: Ward / Mint / Listening Post)
```

**Status (July 2026, updated):** A–D and **H–N are all shipped** on the web
build, plus the web-safe slices of E (E3, E7) and F (F1/F2 — no-ops until the
wrapper exists). **The Mac-gated code is now written too**: E1/E2/E4/E5/E6 and
all of G live in `app/` (Capacitor scaffold, config scripts, two local Swift
plugins) and in `index.html` (`cloud` + `gc` facades, wired and smoke-tested);
the owner's bundle ID `com.burners70.hollowoath` and the iOS 16+ floor are
locked. What's left needs hands on the Mac itself: run `app/setup-mac.sh`,
sign in Xcode, create the Game Center records (app/MAC_SETUP.md §5), then the
on-device passes — E8 (matrix in §7), F3 (§8) — and Bundle O. The game already
plays at the $4.99 feature bar.
**The July 2026 owner-playtest feedback round is now bundled as R, S and T**
(above): R is pure defect-fixing and joins the submission-blocking set; S
(sound character, the extraction-hangar endgame, leavable identified
saboteurs, the VECTOR rename (locked), the 1.2 manifest teaser) and the core
of T (progressive sector widths, per-sector biome palettes and ornamentation,
staged nightfall on the Basin) are owner-requested for the launch build. T4
(destructible scenery) and T5 (weather) are launch-stretch with a
pre-approved slip to 1.1. All player-facing copy is now mirrored for owner
review in [COPY_DECK.md](COPY_DECK.md) (R10).
**P and Q are specced and locked** (owner decision, July 2026) as the free
1.1 and 1.2 post-launch updates — see their bundle sections above and
[PENDULUM_SPEC.md](PENDULUM_SPEC.md) /
[HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md).
**Bundle V is the 1.01 plan**, captured while 1.0 is in App Review: the
Solace sister-ship reveal (named ship, sonar hull pulse on the 41-s clock),
Scion scan-jeopardy fairness, a playable "heard" sonic-wave parry,
post-completion title/intro/campaign variants, and the record that **tilt is
dropped from the forward plan** (dormant scaffolding only). Fly-back to cleared
sectors (the owner's other "1.01" ask) was **resolved to 1.1**: keep Bundle Q's
in-game Laennec unlock and split its **ROTATION CHART** core forward to ship
with Bundle P (after the pendulum), leaving Q's three caves in 1.2. **Bundle W**
(landscape challenge) also **ships in 1.1 with P** (owner decision). One owner
decision remains open — whether to surface the decoy MERCY earlier (V11).
The support/marketing URL is moving to a **custom domain on GitHub Pages**,
**`hollow-oath.com`** (registered on Cloudflare, July 2026 — see O8). Once DNS
is pointed at Pages and the domain resolves, the live-site links and the App
Store URL fields flip to the new root.

Post-launch candidates (deliberately out of scope here): more famous Scions (M4
grows), second-playthrough modifiers, Android/Google Play via the
same Capacitor shell, a second wave of relics in Q's new caves, and the
counterfeit tanker (Glycon's fourth act, seeded by the transfusion line).
Formerly-listed candidates now promoted to locked bundles: ~~the pendulum
sling~~ → **Bundle P (1.1)**; ~~the deep Hollows / a fourth Hollow~~ →
**Bundle Q (1.2)**.
- ~~**the transfusion line**~~ — **shipped (July 2026), ahead of schedule**:
  field refuelling is now an active hover minigame — hold station on the
  drone's fuel line, choose when to detach (CLEAN LINE +250 for a full tank
  with no occlusion), shield forced down while tethered, FIRE means detach,
  the 41-second surge rocks the tether, and the pump goes arrhythmic with a
  contaminant aboard. The counterfeit tanker (Glycon's fourth act) remains a
  future hook. See ROADMAP.md § Future ideas for the design writeup.

**Parked from the on-device App Store testing round (July 2026) — not
scheduled, logged so they aren't lost:**
- **BIG TEXT, expanded to the in-flight HUD.** Today `bigText`
  (`bodyFontPx()`) only enlarges story/help/legend/codex card body text — the
  in-flight HUD (score, fuel, ECG, the sector tally), banner pop-ups, and the
  Settings panel itself all use flat pixel sizes and don't respond to the
  toggle, which reads as inconsistent (found on-device). Expanding it
  properly means touching the HUD layout this codebase has a history of
  tight-viewport collision bugs in (see the R-bundle fixes above) — do it as
  its own pass with real on-device verification, not folded into a bugfix.
- **Vector light-sabotage.** Owner idea, on-device: a Vector aboard the ship
  could make the headlight beams (see the T6 fix just above) flicker and
  eventually fail entirely, on top of the existing malpractice/contamination
  mechanics — a new sabotage *action* rather than just a tell. Needs its own
  design pass (how it resolves, whether ANTISEPSIS/isolation cures it) before
  it's buildable. **The flicker math already exists** — `drawDarkness()` in
  `js/render.js` has a `NIGHTFALL_GUTTER` constant (currently `false`) gating
  the exact sine-wave guttering formula T6 used for "the lamp gutters on as
  night falls." That effect was cut from nightfall itself (owner decision,
  found on-device: it doubled up confusingly with the ship's own headlight
  beams fading in — see the beamGlow fix, also just above) but the code was
  left in place specifically to be reused here.
- **A procedural mode.** Owner idea, on-device, for a future edition: a mode
  that generates a full run (or endless run) from a fresh seed each time
  rather than the authored campaign or the fixed REMIX/DAILY seed rotation —
  distinct from M1's seed plumbing (which re-rolls existing generators, not
  the campaign structure itself). Logged only; no design spec yet.
- **A stereo-panned proximity beacon for stranded Scions in the dark.** Owner
  idea, on-device: BRIEFS[2] (Nightingale Basin) used to promise "Listen for
  them in the dark," but no audio tell for locating a Scion exists —
  `js/audio.js` has no Scion-proximity sound at all; `heartbeat()` only fires
  once a Scion is already aboard, and the only "find them in the dark" cue is
  visual (`drawDarkness()`'s light-pool punch per waiting Scion). The claim
  was cut from the brief for now (found on-device, this round) rather than
  rushed. The real feature: a soft, `StereoPannerNode`-panned call (panned by
  the Scion's x-offset from the ship, volume/pitch rising on approach) —
  genuinely useful on headphones, and in keeping with the game's existing
  audio-as-diagnostic language (ECG, heartbeat, vitals drone). Needs its own
  tuning pass before it ships: how many Scions call at once, at what range,
  whether it competes with the ambient bed/vitals audio already established.
