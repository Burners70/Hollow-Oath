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
6. **External controllers & gyro** — Gamepad API (stick/d-pad, A thrust,
   X fire, LB/B shield, Start = tap) and TILT steering (DeviceOrientation,
   with iOS permission flow) toggled on the title screen.

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

- Persistent codex / rescue-log gallery across runs (who you've found).
- More famous Scions per sector, randomised from a larger pool.
- Caves/overhangs (needs non-heightmap terrain), moving rescue targets.
- Saboteur behavioural tells on the ground (wrong walk speed is in; could add
  refusing to panic, standing too still).
- Difficulty settings; second playthrough modifiers.
- **The pendulum carry (the classic Oids/Thrust homage) — proposed, not
  built.** Today a boarded Scion just vanishes into `s.passengers` (an
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
