# Hollow Oath — build-out notes

> **This file is the historical build-out log.** The forward plan — the
> prioritised, checkbox-tracked path to a paid iOS App Store release — is
> [APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md).

## Rename pass (DOIDS → Hollow Oath)

Renamed the product **DOIDS → Hollow Oath** and the androids **Doids → Scions**
across the game and docs, threaded the title's meaning through the narrative
(Glycon's "an oath you never test…" line, the Workshop's "hollow" reveal, ending
epilogue lines), and added the **HOLLOW KEEPER** rank (new `firedAtSecret` /
`firedAtCombat` flags). localStorage keys and internal identifiers kept the old
prefix deliberately. Full detail: [CHANGELOG.md](CHANGELOG.md); driving brief:
[HOLLOW_OATH_BRIEF.md](HOLLOW_OATH_BRIEF.md).

## Implemented (v3 build-out)

1. **Two new campaign sectors** — Avicenna Shoals (counterfeit fuel lures) and
   Jenner Terraces (sleeper-saboteur gauntlet), each with a famous Scion and
   upgrade (Canon of Truth unmasks counterfeits; Inoculation protects
   passengers from saboteurs). Black boxes now 7, finale still needs ≥3.
2. **Scenery** — glow-trees, rocks, buildings with lit windows, ruined
   buildings, crashed MERCY-class hulks (flickering red cross, garbled name)
   and downed rescue darts, all authored per-sector via `RECIPE[].scn`.
3. **Secret lifts & the Hollows** — three sectors hide a pad that "rings
   hollow" (hairline seams + rare glint); land and hold to descend into a
   cave network (floor + roof heightmaps, darkness, return lift). Each cave
   holds a shrine revealing the villain in stages.
4. **The villain: GLYCON** — medical misinformation embodied; the puppet
   snake-god of Alexander of Abonoteichus (the 2nd-century charlatan who sold
   fake plague cures). His counterfeits: fake fuel pods that drain the tank
   (tell: they blink in perfect unison; real pods flicker organically),
   lure-trees that sway in mechanical time (transmitters — shoot them), and
   the saboteur Scions themselves (built, not corrupted — see cave 2). One
   hollow rock per lure-sector hides a real cache. Logs 11–14 extend the
   record; finding all 3 shrines = GLYCON UNMASKED (+3000, ending epilogue).
5. **Force field** — hold SHIELD (touch button, C/Shift/↓, or LB/B): burns
   fuel, deflects bullets, kills drones on contact harmlessly, turns bad
   landings into bounces, and saves you from cave roofs.
6. **External controllers** — Gamepad API (stick/d-pad, A thrust,
   X fire, LB/B shield, Start = tap). ~~TILT steering (DeviceOrientation,
   with iOS permission flow) toggled on the title screen.~~ **Dropped from the
   forward plan (owner decision, July 2026): tilt isn't a good fit for this
   game.** It was pulled from Settings before the 1.0 build and is off the
   roadmap. The gyro scaffolding survives *dormant* in `js/input.js`
   (`tilt` / `enableGyro` / `toggleTilt`, `doids_tilt` key) so it can be
   revived if that call is ever reversed, but nothing surfaces it to players.

## Implemented (v2 build-out)

1. **Progression across levels** — five authored sectors, each introducing one
   element: Asclepion (basics) → Vesalius Ridge (saboteurs) → Nightingale Basin
   (darkness + your lamp) → Semmelweis Deep (fuel scarcity, fuel pods, drones)
   → Curie Fields (gravity anomalies) → secret finale, The Nullwave.
2. **Narrative / discovery** — mission transmissions before each sector,
   10 collectible log fragments (carried by certain Scions, and inside hidden
   black boxes) telling the story of the Static; recover ≥3 of 5 black boxes
   to triangulate the source and unlock the finale, which has **two endings**
   (destroy the beacon, or land and answer the call — primum non nocere).
3. **Animated Scions** — walk cycles, waving (with a saboteur "tell" in the
   rhythm), panic when explosions land nearby, gold shimmer on famous Scions.
4. **Famous Scions** — one per sector (Hippocrates, Vesalius, Nightingale,
   Semmelweis, Curie): reveal card on delivery + themed permanent upgrade.
5. **Saboteur Scions** — indistinguishable at a distance; tells: jerky wave,
   dull thud instead of a heartbeat on boarding, ECG arrhythmia while an
   active one is aboard. Active ones cut fuel lines and kill passengers;
   sleepers wait and slip into MERCY at delivery → timed breach countermission
   (dock at the red bay within 45s). Quarantine bay contains them for +750.

## Future ideas

- **The deep Hollows (Bundle Q) — specced (July 2026), not built; locked
  as the free 1.2 update (after Bundle P's 1.1) in APP_STORE_ROADMAP.md.**
  Laennec as a hidden famous Scion (AUSCULTATION lift-sense), the
  ROTATION CHART (return to cleared sectors, cached as-left), three new
  caves with new discoveries. Spec:
  [HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md).
- **A Mac desktop build (keyboard/gamepad-first) — proposed, not built.**
  Nothing about the *input* is missing: `keyMap` already covers arrows/`x`/
  `z`/`Shift`/`c`, and `pollPad()` (Gamepad API) already drives `pad`. This is
  a packaging question, not a design one, and it splits into two genuinely
  different products depending on what "a Mac version" is for:
  - **Mac Catalyst on Bundle E's Xcode project (recommended if the goal is a
    Mac App Store listing).** Once `app/ios/` exists, Catalyst is a checkbox
    on the same target — iCloud sync (E4), Game Center (G), and haptics (F,
    where Catalyst maps it to nothing gracefully) mostly carry over
    unmodified. Needs: the on-screen touch-button HUD (`btnEls`,
    `updateCtlVisibility()`) hidden entirely under Catalyst rather than just
    de-emphasised — touch buttons on a trackpad-driven window read as a bug,
    not a feature, so this wants its own platform check alongside `NATIVE`
    (e.g. detect Catalyst via `navigator.maxTouchPoints === 0` on the native
    bridge, or a flag the wrapper injects), not just Bundle H5's
    controller-only hide. Also needs a resizable-window layout pass — the
    game currently assumes one fixed landscape viewport sized off
    `env(safe-area-inset-*)`, which Catalyst windows don't provide.
  - **Ship the existing web build, promoted as "the desktop way to play."**
    The game already runs fullscreen with full keyboard control in any
    desktop browser today, for free, with zero extra engineering. Not
    installable, and doesn't get Game Center/iCloud/haptics, but it's the
    entire scope if the goal is just "let people play at a keyboard," not "a
    second paid SKU."
  - **Owner decision needed before scoping this further:** is the target a
    Mac App Store release (own price-point conversation, its own review
    cycle) or just surfacing the free web build for keyboard players? That
    answer decides whether this rides on Bundle E's Xcode project or is a
    same-day README/store-listing addition.
- Persistent codex / rescue-log gallery across runs (who you've found).
- More famous Scions per sector, randomised from a larger pool.
- Caves/overhangs (needs non-heightmap terrain), moving rescue targets.
- Saboteur behavioural tells on the ground (wrong walk speed is in; could add
  refusing to panic, standing too still).
- Difficulty settings; second playthrough modifiers.
- ~~**The pendulum carry (the classic Oids/Thrust homage)**~~ —
  **superseded (July 2026)** by [PENDULUM_SPEC.md](PENDULUM_SPEC.md)
  (Bundle P: the pendulum sling — relic recovery from the Hollows, fully
  decoupled from Scion pickup, per owner direction; **locked as the free
  1.1 update** in APP_STORE_ROADMAP.md). The original
  core-loop writeup below is kept for the reasoning trail; its damage
  model (proportional to rough flying, always-readable warning) and its
  loss-accounting rule survive in the new spec. Original proposal: today
  a boarded Scion just vanishes into `s.passengers` (an
  abstract array, `CAPACITY` 6) the moment `o.state` flips to `"aboard"` in
  `updateOids` — no physical risk between pickup and delivery. The pendulum
  mechanic makes the *carry itself* the tension, not just the landing:
  - **Where it fits:** this is a core-loop change, not a bolt-on — it touches
    every sector, the saboteur-kill logic in `updateSabotage`, the breach/
    quarantine flow, and scoring (a dropped Scion should just increment
    `runLost`, same bucket as existing losses, so ranks/achievements don't
    need new categories). Score it as its own bundle, sequenced **after H**
    (so FIELD MEDIC can dampen it) and **before N** (the counterfeit MERCY
    finale shouldn't be the first thing to teach a new failure mode).
    Depends on B1's boundary-field work being in — you need to be able to
    *see* the wall you might swing a passenger into for the risk to feel fair.
  - **How:** only the most recently boarded Scion physically dangles (a short
    tether below the ship, rendered in `drawWorld` right after `drawShip`);
    earlier pickups are already "stowed" and ride safely, which keeps the
    physics to one lagging bob instead of simulating `CAPACITY` of them.
    The bob's offset from the ship is a simple damped spring driven by the
    ship's lateral acceleration and `s.ang` change rate — hard turns and
    thrust changes swing it out. If the swung position intersects terrain,
    a turret, scenery, or now-visible boundary field, the Scion is lost
    (`killOid`-style, same as other loss paths). Below a tuned amplitude
    threshold nothing happens — the tension is proportional to how roughly
    you fly, not a hair-trigger.
  - **The tell:** give it the same "always readable" treatment as the
    landing guide — an amber warning once swing amplitude crosses a safe
    threshold, so losing a passenger reads as "I flew badly" rather than
    "I got surprised." Fits the game's own "primum non nocere" throughline:
    the ship's own exhaust can already kill a waiting Scion (the friendly-
    fire check in `updatePlay`); this extends that idea to the ones you've
    already saved.

- **The transfusion line (refuel as a thrust minigame) — SHIPPED (July
  2026).** Built as designed below (see CHANGELOG.md for the landed
  details; deviations: the −50 sting applies to a line *snap* rather than a
  fumbled primer — failed primers just cost the re-signal time — and the
  counterfeit tanker stays future work). Original writeup, kept for the
  reasoning trail: the *field* refuel becomes an active transfusion — the drone
  arrives, unspools a fuel line to a hover point, and **you fly the refuelled
  ship**: hold station inside a small capture window, in the air, while fuel
  flows. The bay stays passive on purpose (home must stay a relief moment;
  don't put a minigame between a hurt player and safety).
  - **Why it's fresh vs. the core loop:** the whole game teaches *approach
    management* — decelerate, level, settle onto ground, done. The
    transfusion demands the one thrust skill the game never asks for:
    **sustained hover with no landing** — feathering throttle against
    gravity for seconds at a time, nothing to settle onto. Same verbs
    (rotate/thrust), opposite goal (stillness in the air, not arrival on the
    ground). That inversion is what keeps it from being "another landing".
  - **The dial, not the pickup:** flow is continuous (~12 fuel/s) and *you
    choose when to detach* — tap FIRE to release cleanly at any moment and
    keep what you took. Wander outside the window and the line "occludes"
    (flow stutters, drips stop); drift past a hard limit and it snaps — the
    drone leaves with the remainder and must be re-signalled. Greed vs.
    exposure becomes a live decision every second, where a pod is a binary
    +35. Full tank on one line without a single occlusion: "CLEAN LINE
    +250".
  - **Exposure is the price** (same pricing philosophy as the Bundle J
    scan): while tethered you are slow, predictable, and *the shield cannot
    come up* — the field would sever the umbilical. Turrets keep shooting.
    In anomaly sectors the pull works against your hover. Detaching is
    always instant and always safe; staying on the line is the gamble.
  - **The clock gets teeth (once):** the 41-second surge (`staticSurge`)
    physically shoves the tethered ship — the one place the clock the player
    has learned to *feel* becomes mechanical. A pilot who has internalised
    the period times the transfusion between surges; one who hasn't learns
    why the world keeps flinching. Still no damage — the surge costs you
    line stability, not hull.
  - **It's a transfusion, and it diagnoses:** medical language throughout —
    the line renders as an IV with a drip-pulse; flow audio is a soft
    metered pulse through `sfxGain` (haptics: the light tap per drip via the
    F facade). While a contaminant is aboard the pump inherits the
    **arrhythmia** (same 0.5/1.7 stutter as the score) — a third place the
    player can *hear* that something wrong rides with them. And the door is
    open for Glycon's fourth act later: a counterfeit tanker that answers
    the signal first, drip perfectly metronomic (the one rule: mechanical
    perfection is the counterfeit), drinking instead of pouring.
  - **Stranded start:** at 0 fuel you can't hover, so the drone first mists
    a primer (+8, auto) — enough to lift to the line, not enough to go
    anywhere. Fumble the primer and you're stranded again: re-signal, small
    score sting (−50), the drone is patient but not free.
  - **Access:** FIELD MEDIC (`doids_easy`) widens the capture window ~1.3×
    and softens surge shove; ASSIST auto-level applies as in normal flight.
    Landing-guide-style always-readable UI: window brackets + a `✓/!/✕`
    flow glyph, colours through `PAL()`.
  - **Where it fits:** isolated to the resupply path (`updateResupplySignal`
    → a new `updateTransfusion`, `drawResupplyDrone` grows the line), so far
    lower risk than the pendulum carry — no touch to boarding, sabotage, or
    scoring buckets beyond the new bonuses. Dependencies: I (surge), C
    (audio routing), H (easy mode); pairs naturally with the pendulum carry
    as an "advanced flight" 1.1/1.2 content update — carry risk on the way
    out, line risk on the way back.

## Engineering notes

- Landing rules in `landingEval()`; tunables at top of file
  (`ASSIST_CAPTURE`, `ASSIST_RATE`, soft/survivable limits inside).
- Sector recipes in `RECIPE[]`; story text in `BRIEFS`/`FRAGMENTS`/`FAMOUS`.
- Bays: `bayRects()` — med bay (left, heal/refuel/deliver) and red quarantine
  bay (right, contain saboteurs, resolve breaches).
- Darkness overlay: offscreen canvas punched with radial lights
  (`drawDarkness`); lamp radius via `lampRadius()`.
- `window.__doids` exposes state + `go(n)`/`launch()` for headless testing
  (see scratchpad smoke tests).
