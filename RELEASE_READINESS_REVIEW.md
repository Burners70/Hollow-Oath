# Hollow Oath — Release-Readiness Review (July 2026)

*A full stress-test of the current build and roadmap against the bar for a **paid
iOS App Store release**: code audit of `index.html` (all 4,929 lines), the live
docs (APP_STORE_ROADMAP / GAME_DESIGN / CHANGELOG / both 1.x specs), the smoke
suite, and live headless runs — screenshots at three viewport classes, a perf
soak, and failure-mode probes. Findings are ordered by severity; recommendations
are split into quality-of-life and perception (what makes the game feel worth
its price).*

---

## 1. Verdict

**The web build is genuinely at the $4.99 feature bar the roadmap claims.**
Everything the roadmap marks shipped (A–D, H–N, the web slices of E and F, plus
the transfusion line) is really in the code, wired the way the docs describe,
and covered by a green 24/24 smoke suite. Perf is a locked 60 FPS in the
heaviest sectors under desktop Chromium, there are zero page errors across
every screen, and the game boots and plays even with `localStorage` completely
denied (private-mode Safari).

**Nothing new blocks submission on the web side.** The genuine blockers are
exactly the ones the roadmap already names — E1/E2/E4–E8, F3, G, O — all
requiring a Mac, Xcode, and App Store Connect.

That said, this review found **one real pre-launch bug** (title-screen pill
overlap that can silently burn the player's daily attempt), a handful of small
visual collisions on phone-sized viewports, and a set of cheap QoL/perception
wins worth landing before the store screenshots are taken.

---

## 2. What was verified (methodology)

- **Code audit**: full read of `index.html` — input, audio/music, haptics
  facade, world gen, simulation, rendering, state machine, persistence.
- **Docs cross-check**: every `[x]` claim in APP_STORE_ROADMAP.md traced to its
  code anchor (e.g. `PAL()`/`PALETTES` for H1, `updateStaticClock` for I,
  `revealSecret(sc, viaFire)` for J2, `decoyBayRect`/`updateDecoy` for N5,
  `buildFamousMap` for M2, `glowSprite`/`glowStroke`/`buildHeightTile` for D).
  No claim was found to be overstated. ROADMAP/CHANGELOG/spec pointers agree.
- **Smoke suite**: `tests/` — **24/24 pass** (~1 min, pre-installed Chromium).
- **Live stress run** (844×390 @2x iPhone-14-class, 568×320 SE-class, 390×844
  portrait): screenshots of title, intro, briefing, sector 0 play, sector 5
  (scenery + counterfeits), dark sector, a Hollow, the finale with decoy,
  pause, settings, codex, portrait gate.
- **Perf**: `?perf=1` on sectors 5 and 7 and through a 12-surge soak of the
  41-second clock — steady 16.6 ms / 60 FPS throughout; no error output.
- **Failure modes**: `localStorage` throwing on every call (boots clean, all
  writes fail silent as designed); reload-resume; daily-attempt spend.

---

## 3. Bugs found (fix before launch screenshots)

### 3.1 HIGH — Title pills overlap; a mis-tap burns the daily attempt

`resumeRect()` sits at `y = vh*0.80, h = 34`; `remixRect()`/`dailyRect()` sit
at `y = vh*0.88, h = 30`. They overlap whenever `0.08*vh < 34` → **every
landscape iPhone short of a Pro Max** (vh ≈ 320–430 logical px). Confirmed
visually at 844×390: the RESUME box's bottom edge crosses both lower pills.

Worse than cosmetic: in `updateMenu()` the hit-tests run **remix → daily →
resume**, so a tap in the overlap strip goes to REMIX or DAILY first. DAILY
spends the day's one attempt *at launch* (by design, `startDaily()`), so a
player reaching for RESUME can silently lose their daily flight.

**Fix**: lay the three pills out from one function so they can't collide
(e.g. resume at `vh*0.76`, or stack remix/daily below resume with measured
spacing), and hit-test RESUME first while a save exists. One smoke test:
assert `resumeRect` intersects neither `remixRect` nor `dailyRect` at
390/375/320 heights.

### 3.2 MEDIUM — Title wordmark collides with the STORY pill on narrow screens

At ≤ ~600 px wide (SE/8 landscape, 568×320 tested) the 60 px "Hollow Oath"
wordmark overlaps the STORY pill and the top pill row generally. Cap the font
by width more aggressively (`Math.min(60, vw*0.12)` still yields 60 at 568) or
drop the title baseline to `vh*0.36` when `vw < 620`.

### 3.3 MEDIUM — Settings panel hints clip at vh ≤ 375

`settingsRowRect` stacks 8×32 px rows + gaps centered at `vh/2`; the two hint
lines below row 7 land at `y ≈ vh + 4` on a 375-高 viewport (iPhone 8/SE2
landscape — the FIELD MEDIC explainer is the one that clips). Shrink row
height/gap when `vh < 380`, or fold the two hints into one line.

### 3.4 LOW — HUD text collides with MERCY at some spawns

In sectors where the camera opens high (seen on Avicenna Shoals), MERCY's hull
and the RED BAY label render straight through the FUEL bar and the
SCIONS ABOARD tally for the first seconds. A subtle dark strip behind the HUD
band (or spawning the camera 40 px lower) would keep the opening frame clean —
this is the frame reviewers and screenshot-takers see first.

### 3.5 LOW — `doids_run` snapshot is restored without validation

`restoreRun()` trusts every field; a truncated/corrupt snapshot (or a future
schema change) yields `RESUME — undefined` on the pill and NaN state after
restore. It writes `v: 1` but never checks it. Guard: validate
`r.v === 1 && Number.isInteger(r.levelIdx) && r.levelIdx >= 0 &&
r.levelIdx <= FINALE_IDX` (and `typeof r.score === "number"`) before showing
the pill; discard otherwise. Matters more once E4 syncs snapshots through
iCloud between devices/app versions.

### 3.6 LOW — Caps Lock breaks keyboard flight

`keyMap` binds lowercase `x`/`z`/`c` only; with Caps Lock on, fire/thrust/
shield keys go dead (Shift is SHIELD, so Shift+X is also unmapped). Add the
uppercase variants to the map. Desktop-only nicety.

---

## 4. Release blockers — unchanged, all Mac-side

Confirming the roadmap's own list; nothing to add, nothing web-side remains:

| Item | Note from this review |
|---|---|
| **E1/E2** Capacitor scaffold + shell config | The `NATIVE` const and A2HS/fullscreen switches (E3) are already correct in code — verify inside the real wrapper. |
| **E4** iCloud KV sync | Land the §3.5 snapshot validation first — cloud snapshots make corrupt/foreign saves more likely, and the merge strategy (max hi, union sets, cloud run only if local empty) needs it. |
| **E5–E7** Privacy, icons, copy tiers | E7 already resolved; "no analytics, no data collected" is a real selling point — keep it in the store description. |
| **E8** Device matrix | Add two items to the checklist: (a) **memory** — the D4 tile LRU can transiently hold ~50–100 MB at 2× DPR in caves (terrain + roof maps both cached); watch for jetsam on 3 GB devices, and halve tile DPR if needed. (b) **silent switch** — WKWebView WebAudio follows the ringer by default; confirm and document the choice. |
| **F3** Haptics restraint pass | Reiterating the roadmap's own note: the intro-screen heartbeat fires a haptic pattern every ~1.5 s for the whole intro — cut it first; keep dullThud/breach/surge, they carry meaning. |
| **G** Game Center | `easyMode` gating for the main board is already exposed; note that `window.__doids` ships in the page, so treat all client scores as advisory (standard for GC). |
| **O** Store listing | See §6 — the screenshot set should be taken *after* the §3 fixes. |

---

## 5. Quality-of-life recommendations (web-side, cheap, high value)

Ordered by value-per-effort:

1. **Fix §3.1–§3.3 layout collisions.** An afternoon including tests; directly
   affects the first-run experience on the most common devices.
2. **Version stamp on the title screen** (already in GAME_DESIGN §10 ideas).
   One line, bottom-right, e.g. `v1.0 · b2026-07`. Makes stale Home-Screen
   caches and TestFlight builds diagnosable at a glance — you will want it the
   first time a tester reports a bug you already fixed.
3. **"RESET PROGRESS" row in settings** (double-tap-to-confirm). A paid game
   with no way to wipe codex/hi-score/veteran state draws support mail and
   review complaints. All the keys are known (§8 of GAME_DESIGN); ~30 lines.
4. **Duck the music in pause and settings.** `updateMusic`'s ducked-state list
   covers briefings/cards but not `pause`/`settings`; full-volume drone under
   the PAUSED overlay reads as an oversight next to the care taken everywhere
   else. Two string literals.
5. **Center the DAILY pill when REMIX is locked.** Pre-veteran, DAILY sits
   right-of-center with a conspicuous hole where REMIX will appear — reads as
   a layout bug to a new player (it's the majority state for a new purchase).
   When `!veteran`, center `dailyRect`.
6. **Decide the DAILY + CONTINUE policy.** Game-over on a daily currently
   offers checkpoint CONTINUE (−25%), and `recordDaily` keeps the max score
   across continues. Defensible ("same attempt"), but decide it on purpose
   before a leaderboard exists — one line either way (`checkpoint = null` when
   `runMode === "daily"` if you want dailies to be one clean life-stock).
7. **Reduced-flash option (H follow-up).** The Static surge randomizes window
   alpha, jitters the ECG, and glitches the HUD label; breach adds klaxon
   flash. A REDUCED FLASH settings row that halves those amplitudes is cheap
   insurance for photosensitive players and a good App Store accessibility
   line. (Camera shake is already modest.)
8. **Landing-guide onboarding line.** The guide's `✓/!/✕ ↓v ↔v` glyphs are
   excellent but unexplained until the player finds HOW TO FLY. One extra
   briefing sentence in BRIEFS[0] ("green means safe; watch ↓ descent and
   ↔ drift") closes the loop for the first landing — the game's highest-stakes
   first interaction.
9. **Save-schema guard** (§3.5) — do together with E4.

Deliberate non-recommendations: volume sliders (binary toggles are fine for
v1 and the roadmap says so); menu keyboard navigation (touch/pad are the
targets); culling off-screen entities (60 FPS with headroom already).

---

## 6. Perception improvements (what makes it *feel* premium)

These are about defending the price point and the first 90 seconds:

1. **The first frame matters most.** Fix §3.4 (HUD/MERCY collision) and
   consider opening each sector with the camera framing terrain + a waiting
   Scion rather than empty sky — several sectors open on a mostly-black
   viewport with a distant HUD. The Avicenna spawn screenshot demonstrates
   both at once.
2. **Take the O4 screenshot set after the fixes**, and lead with what no
   competitor has: the ECG-arrhythmia moment, the counterfeit-MERCY reveal,
   and a Hollows shrine. The landing-beside-a-waving-Scion shot should show
   the landing guide green — it advertises the core feel-mechanic in a still.
3. **Cache the darkness lights as sprites.** `drawDarkness` builds a radial
   gradient per light per frame (up to ~15 on Nightingale with Scions +
   MERCY + boxes). Desktop absorbs it; an A11-class GPU at 2× DPR may not.
   Reuse the `glowSprite` pattern with `destination-out`. Do it opportunistically
   with the E8 device pass rather than on faith — measure first.
4. **An "about / credits" line** (inside HOW TO FLY or settings footer):
   version, "made by one pilot and a debug handle", support URL (O5 requires
   one anyway). Paid games with visible authorship review better; it also
   gives App Review the support-contact surface 4.2 responses like to see.
5. **Sound the title.** The title screen is silent until the first tap
   (autoplay rules), which is fine — but after first interaction, returning to
   the title keeps the drone running, while the *haunted* title tick (L1) is
   its best moment. Consider a single soft `heartbeat(0.3)` on returning to
   the title after any run — a tiny signature that the phone-as-ECG store
   pitch is true from the first screen. Gate on `sound`, skip if it fights F3
   restraint on device.
6. **Keep the no-tracking stance loud** in the store description ("no ads, no
   analytics, no account — your saves stay on your device and your iCloud").
   It is rare, real, and already true of the code.

---

## 7. Suggested roadmap edits

- Add a small **Bundle A8 / UI-collision item** capturing §3.1–§3.3 (title
  pill layout + narrow-viewport fits) with the three-viewport smoke assertion.
- Extend **E8** with the memory-watch and silent-switch checks (§4).
- Add the **RESET PROGRESS** row and **version stamp** as C4/H follow-ups (or
  a tiny "polish" bundle) so they don't get lost between now and O.
- No change to P/Q sequencing — both specs are implementation-ready, and
  shipping them as free 1.1/1.2 remains the right call for the "complete
  game" positioning.

---

*Test artifacts (screenshots, stress script) were produced in a session
scratchpad; the stress script pattern (three viewport classes + storage-denied
boot + surge soak) is worth folding into `tests/` alongside the smoke suite if
it proves useful again.*
