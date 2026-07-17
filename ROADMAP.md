# Hollow Oath — build-out notes

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
