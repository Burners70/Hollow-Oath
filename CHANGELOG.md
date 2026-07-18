# Changelog

## Game Center achievement art & App Store Connect copy (July 2026)

The asset half of G3, ready to paste into App Store Connect
(*Services → Game Center → Achievements*):

- **Nine 1024×1024 achievement images** in
  `assets/gamecenter/achievements/` — one per launch achievement, composed
  for Game Center's circular crop (meaning inside the centre circle, the
  outer ring survives the crop). SVG sources in `svg/`, regenerable via
  `generate.py` (headless Chromium render).
- **`GAMECENTER_ACHIEVEMENTS.md`** — the full ASC metadata table: ID, name,
  hidden flag, and the earned/pre-earned description copy (earned = past
  tense, what you did; pre-earned = a hint that never spoils — the SECTOR
  WARDEN hint was reworked to stay oblique about the ending).
- Housekeeping in the same pass: `configure-ios.sh` now also sets
  `ITSAppUsesNonExemptEncryption = false` (the game uses no encryption
  beyond HTTPS — exempt), so TestFlight builds skip the manual
  export-compliance question on every upload.

## Bundles E + G: the native wrapper and Game Center (July 2026)

The Mac-gated work, written so the Mac session is a checklist
(`app/MAC_SETUP.md`). Owner decisions locked in: bundle ID
`com.burners70.hollowoath` (permanent), iOS 16+ floor, E+G in one pass,
1024 icon upscaled from `icon-512.png`.

- **E1 Capacitor scaffold** in `app/`: `package.json` (core/ios/haptics/app/
  status-bar + two local plugins), `capacitor.config.ts`, `sync.sh` (root →
  `www/`, root files stay the source of truth), `setup-mac.sh` one-shot
  bootstrap.
- **E2 native shell config** as an idempotent script (`configure-ios.sh`):
  landscape-only, status bar hidden, `UIRequiresFullScreen`, black webview
  background, iOS 16.0 target; plus a native `appStateChange` hook in
  `index.html` backing A4's auto-pause inside the wrapper.
- **E4 iCloud save sync**: `hollow-icloud-kv` Swift plugin
  (`NSUbiquitousKeyValueStore`, ~40 lines) + a web-no-op `cloud` facade —
  every persistence write mirrors up (`doids_run/hi/codex/logs/
  shrines_seen/veteran`), `syncFromCloud()` merges on launch (max hi-score,
  union sets, cloud run only if local has none), RESET PROGRESS wipes the
  cloud copy too.
- **E5 privacy manifest**: no tracking, no collection, UserDefaults/CA92.1
  only.
- **E6 icon & launch screen**: single-size 1024 AppIcon + black Menlo
  wordmark storyboard.
- **B5 (found during E6): the icon PNGs still wore the red cross** — the
  Geneva-Conventions emblem Bundle B removed from the game. All three web
  icons and the new 1024 master now carry the staff-and-serpent
  (drawAsclepius's exact bezier geometry, same `#ff2d55`).
- **G Game Center**: `hollow-game-connect` Swift plugin (silent auth, never
  blocks play) behind a fail-silent `gc` facade; all-time + daily
  leaderboards from `saveHi()`/`recordDaily()` with FIELD MEDIC runs kept
  off both (H3); all nine achievements wired (`reportRunAchievements()`
  mirrors `drawWin`'s rank branches; FIRST DO NO HARM in `sectorClearNow`,
  THE FULL CODEX at the codex save).

Smoke suite now **34 tests**, all green (added: Game Center trace on the
answered-ending win path; easy-mode board gate). Still needing the Mac
itself: `setup-mac.sh` + signing, App Store Connect Game Center records,
E8 device matrix, F3 haptics restraint pass.


## Polish pass 2: remaining review items (July 2026)

Follow-on to the six owner fixes — the rest of the release-readiness review's
open bugs and the cheap QoL/perception wins:

- **§3.3 Settings fit + two new rows.** Settings is now a two-column grid
  (`settingsRowRect`) that fits a 320-high landscape viewport, with room for
  **REDUCED FLASH** and **RESET PROGRESS**; footer carries the build stamp and
  the no-ads/no-tracking line.
- **§3.4 HUD scrim.** A soft top-of-screen gradient behind the HUD band keeps
  the fuel bar / tally / score legible when MERCY or scenery renders through
  them on a high-camera spawn.
- **§3.5 Save validation.** `validRun()` gates the `doids_run` snapshot on
  schema version + field sanity before it becomes a RESUME pill; a corrupt or
  foreign snapshot is discarded, not restored into NaN state.
- **§3.6 Caps Lock.** Letter keys (`x`/`z`/`c`) now map case-insensitively, so
  an active Caps Lock no longer kills fire/thrust/shield.
- **RESET PROGRESS** (double-tap-to-confirm): wipes scores, codex, saves,
  veteran/daily/intro state; **keeps** the player's audio/assist/difficulty
  settings.
- **REDUCED FLASH** (`doids_flash`): softens the Static's high-frequency
  strobing — window flicker, ECG jitter, HUD label glitch — for
  photosensitive players; diagnostic meaning stays, amplitude drops.
- **Version stamp** bottom-right on the title (`BUILD_TAG`).
- **Music ducks** in pause and settings (was only briefings/cards).
- **Landing-guide onboarding line** added to the first briefing.
- **Darkness lights cached as sprites** (`darkPunchSprite`) — no more building
  ~15 radial gradients per frame on Nightingale.
- **Soft title heartbeat** on returning to the menu from a run (sound-gated,
  no haptic) — the phone-as-ECG signature from the first screen.

Smoke suite now **32 tests**, all green (added: reduced-flash persistence +
reset-keeps-settings, corrupt-save rejection, settings-fit at 320 h,
caps-lock flight). Review report updated (§3.1–§3.6 all marked fixed).


## Polish pass: six owner fixes (July 2026)

Post-review fixes on `claude/game-release-readiness-review-fq4o3n`, following
the release-readiness review (see RELEASE_READINESS_REVIEW.md):

1. **Lift transitions made graceful.** `startLiftTransit`/`updateLiftTransit`
   now smoothstep every phase (no linear jolts), the pad breathes dust while
   the plate moves, a new **hold** phase holds a beat in the dark showing the
   destination line + travelling chevrons, and arrival lands with a soft
   thunk (camera nudge, dust burst, low blip, haptic) instead of a cut.
2. **Early-sector turret fairness.** `genLevel` gains a pass (sectors 0–2)
   that guarantees no waiting Scion sits inside more than one turret's cover
   (380 px): crowding turrets are re-sited to a fair spot, or retired if none
   exists. Fixes the Vesalius Ridge Scion pocketed between three turrets that
   forced a shot before the shield is taught. (Golden terrain checksum
   updated: `1827470476` → `204786080`.)
3. **All fail paths return to the menu.** Game over's second option is now
   **MAIN MENU** (was "NEW ROTATION"); a tap anywhere off the CONTINUE box
   also returns to the title, and the run is written back as a RESUME save
   (continue penalty applied) so it is never lost on a fail.
4. **Main-menu layout fixed.** The three lower pills are laid out from one
   place so they can't collide on phone-height viewports (the old overlap
   could burn the daily attempt on a tap meant for RESUME); RESUME sits on
   its own row, REMIX + DAILY pair below, and DAILY centres itself while
   REMIX is still locked. Wordmark shrinks on narrow screens.
5. **Daily flight has teeth.** Two deterministic **daily modifiers** (same
   for every pilot, seeded from the day) drawn from a pool of six —
   RATIONED TANK (70% fuel), SURGE FRONT (41 s clock everywhere), CROWDED
   SKY (+2 drones/sector), SLEEPER CELL (every saboteur a sleeper, +1),
   BLACKOUT ROTATION (all sectors dark), STOPWATCH (clear each under 90 s
   for +500). Shown in the briefing as "TODAY'S CONDITIONS"; STOPWATCH adds
   a HUD countdown and a clear-screen bonus line.
6. **Shield button regrouped.** Moved from its lone float up-and-right to
   nestle directly above the FIRE/THRUST pair (one thumb serves all three).

Smoke suite extended to 28 tests (turret fairness, daily modifiers, title
pill non-overlap, fail→menu with save survival); all green. **No change to
the campaign's authored feel beyond the turret fairness re-siting.**


## Decision: Bundles P & Q locked as the 1.1 and 1.2 updates (July 2026)

Owner decision. The two specced post-launch bundles are no longer
candidates — they are the committed, free post-launch release plan:

- **Bundle P — the pendulum sling → "1.1 — THE PENDULUM"** (free).
- **Bundle Q — the deep Hollows → "1.2 — THE DEEP HOLLOWS"** (free,
  after 1.1 — the Q5 level cache lands on a stable shipped base).

APP_STORE_ROADMAP.md now carries both as proper bundle sections (P·impl /
P·feel / P·ship, Q·impl / Q·guard / Q·ship) with rows in the
bundle-order table and the sequencing diagram; the implementation
checklists stay in the specs (single source of truth). Decision stamps
added to PENDULUM_SPEC.md §10 and HOLLOWS_EXPANSION_SPEC.md §11
(recommendation text kept as the reasoning trail), and the
"post-launch candidates" list updated — the pendulum sling and the
fourth-Hollow ideas are promoted out of it. **No code changed.**


## Proposal: the deep Hollows — Bundle Q specced, not built (July 2026)

Second spec of the pass, sibling to Bundle P. The secret lifts stay as
hard to find as ever — the owner named that difficulty a virtue, so the
aid is priced instead of the secret deleted, on the Radiosense precedent
(an earned rescue converts into a finding aid):

- **RENÉ LAENNEC** (the stethoscope — listening as diagnosis, the game's
  own core skill made canon) joins as a twelfth famous Scion, hidden
  *inside* a new Hollow under Jenner Terraces and found by his knocking —
  human-irregular, warm, the tell grammar inverted against Glycon's
  perfect unison. Excluded from the remix pool; he is seeded content,
  like the shrines.
- His **AUSCULTATION** upgrade makes unfound lift pads ring softly and
  mark themselves within ~240 px (no compass, no HUD arrow — weaker than
  Radiosense on purpose); his wall chart unlocks the **ROTATION CHART**:
  return travel from the briefing screen to any cleared sector, cached
  **as you left it** (dead turrets stay dead, found secrets stay found,
  lost Scions stay lost; no clear bonus or extraction can re-fire).
- **Three new Hollows** under sectors 2/4/6 — THE WARD (the muster roll
  + four WARD NOTES for the archive), THE MINT (bend Glycon's amulet
  press: every remaining counterfeit's unison blink drifts out of true),
  THE LISTENING POST (Laennec). All six hollows in one run = EVERY
  HOLLOW HEARD.
- Spec: [HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md) —
  rationale, mechanics, draft copy, checklist Q1–Q10 with code anchors,
  save-schema seams, tests. **Recommendation: free 1.2 update, after
  Bundle P's 1.1** (larger and riskier of the two; lands best on a
  stable shipped base). Pointers updated in GAME_DESIGN.md §10,
  APP_STORE_ROADMAP.md and ROADMAP.md. **No code changed.**


## Proposal: the pendulum sling — Bundle P specced, not built (July 2026)

Wrote the full design + implementation spec for the classic Oids/Thrust
**pendulum** element — redesigned per owner direction to be **decoupled from
Scion pickup** and to live in the secret Hollows as a whole new story
element: each cave hides one towable **relic** of Glycon's (THE FIRST CALL —
SOLACE's original recorder core; THE LAST HEART — the one genuine heart in
the counterfeit workshop; THE MASK — the idol's human face), slung beneath
the ship on real pendulum physics and carried out through roof, darkness and
lift to MERCY without slamming it into rock. Patient transport as a flight
skill — *primum non nocere*, made kinetic.

- Spec: [PENDULUM_SPEC.md](PENDULUM_SPEC.md) — gameplay/narrative/goal
  rationale, three handling characters (heavy → fragile → wild), tether
  physics model, tell language (mini-ECG, `✓/!/✕`, each relic found by its
  rhythm — or its total silence), scoring (deliver +1200, GENTLE HANDS
  +500, all three +2000, broken −400), draft card copy, ending hooks,
  checklist P1–P10 with code anchors, persistence, tests.
- **Recommendation: free 1.1 content update, not launch** — everything
  still blocking submission is Mac-side, and the mechanic's feel pass
  needs real hardware; free (not paid) preserves the "complete game, no
  IAP" store positioning and buys a re-feature moment.
- Supersedes the earlier "pendulum carry" core-loop proposal (now struck
  through in ROADMAP.md § Future ideas, reasoning trail kept); pointers
  updated in GAME_DESIGN.md §10 and APP_STORE_ROADMAP.md's post-launch
  candidates. **No code changed.**


## The transfusion line — field refuel as a hover minigame (July 2026)

The stranded-ship resupply drone no longer drops +40 in your lap. It now
arrives, mists a **primer** (+10 — enough to reach the line, not to leave),
and unspools a **transfusion line** to a hover point overhead. The rest is
the one thrust skill the game never asked for: **sustained hover** inside a
capture window while fuel flows at 12/s.

- **Detach is a choice:** TAP FIRE releases cleanly at any moment and keeps
  what you took; while the line is caught, FIRE never shoots (and a detach
  tap can't accidentally become a shot — pacifist runs are safe). A full
  tank with zero occlusions earns **CLEAN LINE +250**.
- **Exposure is the price:** the shield is forced down while attached (the
  field would sever the umbilical), turrets keep shooting, and the
  41-second surge physically rocks a tethered ship — the one place the
  clock has mechanical teeth. Drift out of the window and the line
  *occludes* (flow stops); drift past the snap radius and it parts: −50,
  remainder lost, signal again.
- **It diagnoses:** the pump drips on a beat (audio + a light haptic tap),
  and goes **arrhythmic while a contaminant is aboard** — the same 0.5/1.7
  stutter as the score and the ECG. A third place to hear the lie.
- **Always readable:** dashed capture ring, sagging line (taut green when
  flowing, stuttering dashes when occluded, red near the limit), drips
  travelling down the line, and `✓ / ! / ✕` status through the colorblind-
  safe `PAL()` palette. FIELD MEDIC widens the window ~1.3×.
- MERCY's recovery bay stays passive on purpose — no minigame between a
  hurt player and safety. Design writeup: ROADMAP.md § Future ideas.

Smoke suite: 24/24 green (strand→primer→line, and a full
hover→flow→shield-lockout→clean-detach cycle).


## Bundles I–N + haptics wiring (July 2026)

One pass took the roadmap's whole no-Xcode tail. Per bundle:

- **I — The 41-second clock.** "Repeating, every 41 seconds" is now
  observable, not just lore: from Curie Fields onward (and in every cave)
  the world surges on the Static's period — a dry tick, ECG baseline
  jitter, settlement windows dimming, the lamp faltering ~8%, the HUD
  sector label glitching for a beat. Diagnostic atmosphere, no damage. In
  the finale the surge fires hard on the same phase, stronger the closer
  you fly to SOLACE.
- **J — The landed scan.** Lure-trees and hollow rocks can now be opened
  without a shot: land within 60 px and hold ~6 s, grounded and in every
  turret's sights. Same payoff via a shared `revealSecret(sc, viaFire)`;
  sets `scannedSecret` instead of `firedAtSecret`, and a no-fire answered
  run that still read Glycon's lies ranks **OATH KEEPER · EYES OPEN**.
  Taught once, in the Avicenna briefing.
- **K — The codex archive.** Every log fragment (`doids_logs`) and shrine
  card (`doids_shrines_seen`) ever recovered persists across runs. The
  codex gains MINDS/ARCHIVE tabs (paged by tapping left/right); the title
  pill counts both: `⚕ 2/11 · ◈ 5/14`.
- **L — Haunting & epilogue.** An unresolved ending sets `doids_unres`:
  the title subtitle turns violet — *"the Static answers still — every 41
  seconds"* — with a faint tick on that exact period, until any run
  resolves the beacon. The answered ending now holds a 6-second beat in a
  new `"epilogue"` state: camera eases to the beacon, rings fade, and one
  line types on — *"AMS SOLACE · crew manifest 214 · status: HEARD."*
- **M — Remix, daily, wider pool.** `runSeed` threads every generator
  (seed 0 = the authored campaign, regression-locked by checksum).
  Resolving the beacon once sets `doids_veteran` and unlocks ⟳ REMIX
  ROTATION (random seed, famous minds shuffled across sectors). ☀ DAILY
  FLIGHT is one attempt per UTC day (`doids_daily`), spent at launch, with
  yesterday-you shown as the bar to beat. Four new famous Scions join the
  pool — Blackwell (OPEN DOORS), Virchow (CELL DOCTRINE), Fleming
  (PENICILLIN), Levi-Montalcini (GROWTH FACTOR) — remix/daily draw 7 of 11.
- **N — The counterfeit MERCY.** The finale hides a second, identical
  MERCY between spawn and the beacon. One tell only: her emblem pulses
  like a pulse; its emblem blinks in perfect mechanical unison with the
  fake fuel pods. Docking is a mouth — fuel drain, ECG *and* soundtrack
  arrhythmia, −200 and a card ("He built the thing you trust"). Reading it
  from the ground (J's scan) or one shot powers it down for +800 ("You
  counted the beats. He never learned a heartbeat."). Fully unmasked runs
  get an extra epilogue line.
- **F1/F2 + E3 (web-safe slices).** A `haptic` facade (no-op on web,
  Capacitor-ready) wired to the medical language: heartbeat lub-dub,
  dullThud's single heavy beat, the Static's wrong double-tick, arrhythmia
  taps, hard landings, shield bounces, the breach klaxon. `NATIVE`
  detection suppresses A2HS/fullscreen inside the future wrapper.

Smoke suite grew 13 → 23 tests, all green.

## Lift-return bugfix (July 2026)

- **Riding a lift back up out of the Hollows left the ship embedded ~40px
  below the surface** (most visible returning from the sector-3 cave), then
  "snapping" to the ground on the first thrust. Cause: `enterCave()` captures
  `surfaceCtx` mid-transit, *after* the descent animation has already sunk
  the ship into the pad, and `exitCave()` restored that contaminated Y
  verbatim. `exitCave()` now recomputes the resting height from the restored
  surface heightmap (`groundAt(x) - SHIP_R`). New regression test rides the
  sector-3 lift down and back and asserts the ship rests exactly on the pad.

## Bundle H — Accessibility & difficulty (July 2026)

- **H1 Colorblind mode is live** (`doids_cb`): the four *semantic* colours —
  SAFE / WARN / DANGER / REVEAL — now route through `PAL()`; colorblind mode
  swaps them to blue / orange / white / magenta on the landing guide, the ECG
  ramp, the antisepsis tint and every canon `?` counterfeit mark. Nothing else
  is re-skinned.
- **H2 Shape redundancy:** the landing guide prefixes a `✓ / ! / ✕` glyph to
  the descent numbers, so the landing state reads with no colour at all.
- **H3 FIELD MEDIC mode** (`doids_easy`): 5 lives, landing tolerances ×1.3,
  saboteur fuel-cuts halved, breach timer 60 s. Applies to the next run, not
  mid-run. Settings copy: "for pilots who want the story."
- **H4 BIG TEXT** (`doids_bigtext`): +2 px on card, briefing and intro body
  text (line heights follow).
- Settings panel grows to 8 rows (TILT keeps its gesture-path slot at row 4).


## CONTINUE box overflow fix + SFX variety pass (July 2026)

- **A7: CONTINUE box text overspill on game over.** `continueRect()`'s box
  and the flat 13px line couldn't accommodate long sector names ("AVICENNA
  SHOALS", "JENNER TERRACES") on narrow viewports. The box grew to two
  lines (`h: 40` → `54`), the sector name got its own auto-shrinking line
  (measures and steps the font down to 9px if still too wide), and "3 LIVES
  · -25% SCORE" moved to its own line below.
- **C6: Sound-effect variety pass.** `blip`, `boom`, `heartbeat`,
  `staticTick`, `dullThud`, and `hydraulic` now carry a small `rjit()`
  pitch/duration jitter (±3-15% depending on the sound) so repeats across a
  run don't sample identically, plus a quiet second layer per sound (an
  upper harmonic on `blip`, an overtone on each `heartbeat` pulse, a sub
  thump under `boom`) for a touch more body. What each sound signals is
  unchanged — `heartbeat` is still lub-dub, `dullThud` is still one heavy
  low note, and the two stay clearly distinct from each other.

Smoke suite: 13/13 green.

## Emblem centring + shrine cue (July 2026)

- **AMS MERCY's emblem** now sits vertically centred on the whole hull
  (`translate(0,-15)`, the midpoint of the tower's -50 top and the hull's
  +20 bottom edge) instead of riding up on the tower alone — mothership,
  intro screen, and wreck all follow.
- **The Hollows shrine drops its clue text entirely.** Rather than reading
  small or reading at all, the pre-scan hint is now a pulsing yellow
  landing-pad marker (corner brackets + a glowing baseline) placed beside
  the shrine, inside the same 80px landing radius `updateShrine` actually
  checks — a visual invitation instead of an instruction. The
  "READING THE MARKS…" label during an active scan is unchanged.

## Audio + legibility fixes (July 2026)

- **Thrust noise kept playing behind panels, on game over, everywhere.**
  `thrustGain.gain.value` was only ever written inside `updatePlay`'s own
  thrust check, so any transition away from `"play"` mid-thrust (opening a
  card or the codex, pausing, dying, clearing a sector, the lift-transit
  freeze…) left the looping thrust buffer at whatever gain it last had —
  the noise just kept going behind the panel until thrust happened to be
  pressed and released again in flight. Fixed by zeroing `thrustGain` once
  at the top of every `update(dt)` tick before the state dispatch;
  `updatePlay` still sets the real value right back the instant flight is
  actually live, so nothing changes about how thrust sounds in play. New
  smoke test holds thrust into a pause and asserts the gain is silenced.
- **AMS MERCY's emblem** was riding a little high on the new command tower
  and read small. Moved down and enlarged (`translate(0,-28)` /
  `drawAsclepius(36,…)`, up from -36/26) across the mothership, the intro
  screen, and the wreck.
- **The Hollows shrine's pre-scan hint was unreadable** — 9px at 60% alpha,
  crammed onto one line. Bumped to 13px bold at 85% alpha across two lines
  ("SOMETHING OLD IS ENSHRINED HERE" / "LAND AND LOOK CLOSER"), matching the
  size of the "READING THE MARKS…" label shown once you're actually scanning
  it.

Smoke suite: 13/13 green (also hardened the lift-transition test, which was
polling on `fade > 0.95` — a ~15ms window shared by both the tail of the
"black" phase and the head of "reveal" — to poll on the much wider
`phase === "black"` instead).

## Bug fixes & polish pass (July 2026)

**Bug fixes:**
- **Fuel-out-while-landed softlock.** A ship that landed with an empty tank
  away from MERCY or a fuel pod had no way to move again — both thrust and
  shield require `fuel>0`, and nothing else could reach it; the run was
  permanently stuck with no death trigger. Fixed with a graceful bail-out:
  holding THRUST while stranded (fuel<=0, landed) — otherwise a dead input in
  that exact state — charges a "signal for resupply" call (`OUT OF FUEL —
  HOLD THRUST TO SIGNAL`, a ring showing charge progress). A small drone
  drops in and delivers +40 fuel, enough to reach a real pod or MERCY. It's
  also just handy any time you're grounded and running low, not only at the
  hard zero.
- **Invisible walls.** `s.x` was hard-clamped to `[40, level.W-40]` and `s.y`
  floored at `20` with zero visual indication — you'd just stop with no
  explanation. Both are now rendered as a pulsing "containment field" (framed
  as the interdicted zone's own automated defences) that brightens as the
  ship approaches and fades when it's far away.

**Additional changes:**
- **Lift transitions now play out instead of cutting.** Descending/ascending
  a secret lift used to swap levels instantly. Now the ship sinks (or rises)
  out of view on the departure screen, the screen fades to black, the level
  swaps, and it fades back in with the same motion completing (settling onto
  the new pad) — with a hydraulic hiss-and-whine sound cue on each leg.
- **Subtle lift floor cue.** Surface lifts get a faint violet gradient
  "thickening" of the ground plate under the hairline seams — visible if you
  look, easy to miss if you don't, alongside the existing rare glint.
- **Quarantine bay moved off to the side.** It used to hang under MERCY right
  next to the recovery bay, in the same row. It now comes off the starboard
  side of the hull, level with the ship itself, reinforcing that
  quarantine ≠ delivery.
- **Both bays redesigned as tractor beams.** Dashed rectangles replaced with
  a converging beam (soft gradient fill + animated scan lines) — recovery's
  beam scans outward (dispensing), quarantine's scans inward (containing).
- **AMS MERCY redesigned.** The flat hexagon hull gained a raised dorsal
  command tower (where the emblem now sits), tapered bow/stern, panel-seam
  greebles, and soft engine glow at both tips (`mercyHullPath()`/
  `mercyGreebles()`, shared by the mothership, the intro-screen ship, and the
  crashed MERCY-class wreck, which got the matching hull + a repositioned
  emblem and hull breach).
- **Pendulum carry — proposed, not built.** Wrote up where/how the classic
  Oids/Thrust pendulum-carry mechanic (a boarded passenger physically
  dangling and swingable into hazards) could fit into the roadmap — see
  ROADMAP.md § Future ideas and APP_STORE_ROADMAP.md's post-launch
  candidates.

Smoke suite still 10/10 green (`__doids.strand()` added for testing the
softlock fix; `resupplyDrone`/`liftTransit` exposed via `__doids.get()`).
Verified visually via Playwright screenshots: the resupply drone end-to-end,
the boundary field at both edges, the full lift transition (black frame +
arrival), the lift floor cue, and the new MERCY silhouette across the
mothership, intro screen, and a wreck.

## Bundle D — performance pass (July 2026)

Implemented the fourth App Store roadmap bundle (App Review runs on real
hardware, and `ctx.shadowBlur` was set on nearly every draw call — terrain,
scenery, every Scion, every particle, every bullet). Added an FPS/frame-time
meter behind `?perf=1` in `drawHUD`, free unless the flag is set. Replaced
shadowBlur on point objects (particles, bullets/shots, fuel pods/fake pods)
with a cached-per-colour `glowSprite()`/`drawGlow()` radial-gradient blob
drawn under the crisp icon instead of blurring it live. Replaced shadowBlur on
per-entity stroked shapes (`doidFigure`'s limbs/torso/head/antenna, turrets,
drones, lure-trees, buildings, wreck hulls, gravity anomalies) with a
`glowStroke()` 2-pass stroke (soft wide pass + crisp normal pass) — call
sites stay one line. Terrain and cave-roof geometry are now rendered once
per 512px-wide chunk into an offscreen canvas (bounded to each chunk's local
height range, not the whole world height) instead of retracing the full
heightmap path every frame; chunks build lazily as the camera reaches them
and live in a 12-tile-per-level LRU. `shadowBlur` now only appears on
singletons drawn once per frame (ship, mothership, title text, HUD text),
never inside a per-entity or per-particle loop. Measured via direct
`render()` timing (bypasses vsync pacing) at 2× DPR: Avicenna Shoals
(scenery + counterfeits) dropped from a 28.2ms to 20.6ms per-frame median
(~1.37×), the finale (dark, wrecks, drones) from 55.2ms to 43.1ms (~1.28×);
gains on real mobile Safari — where shadowBlur is markedly more expensive
than on desktop Chromium — are expected to be larger but weren't verified on
physical hardware in this pass. `__doids.get()` now exposes `perfFrameMs`/
`perfFps`; smoke suite still 10/10 green (no new game state to test — purely
a rendering-cost change, verified visually via Playwright screenshots of a
surface sector and a cave interior for tile-seam artifacts).

## Bundle C — audio baseline & settings menu (July 2026)

Implemented the third App Store roadmap bundle (paid-game floor — the game
previously shipped with zero music and no mute). All sound now routes
through a new `sfxGain` node; a generative ambient score (`startMusic()`:
two detuned drone oscillators through a lowpass with an LFO on cutoff, plus
a sparse pentatonic motif) routes through `musicGain`. The score ducks under
briefings/cards, drops an octave and halves its motif rate in the finale,
and — the same diagnostic language as the ECG — goes arrhythmic in its own
timing while a contaminant is aboard. Added a `"settings"` state (⚙ pill on
the title, a new row in the pause menu) with SOUND/MUSIC/HAPTICS/ASSIST/
TILT/COLORBLIND toggles; moved the old title-screen ASSIST and TILT pills
into it (TILT's iOS permission request still fires from the raw
`canvasTap()` gesture handler, not the deferred tap flow, per Apple's rule).
HAPTICS/COLORBLIND are no-ops until Bundles F/H land, but their flags
persist now. `__doids.get()` exposes `sound`/`music`/`haptics`/`colorblind`/
gain values; 4 new smoke tests (persistence, sfxGain gating, and an
end-to-end settings-panel toggle) bring the suite to 10/10 green.

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
