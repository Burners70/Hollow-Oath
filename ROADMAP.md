# DOIDS — build-out notes

## Implemented (v2 build-out)

1. **Progression across levels** — five authored sectors, each introducing one
   element: Asclepion (basics) → Vesalius Ridge (saboteurs) → Nightingale Basin
   (darkness + your lamp) → Semmelweis Deep (fuel scarcity, fuel pods, drones)
   → Curie Fields (gravity anomalies) → secret finale, The Nullwave.
2. **Narrative / discovery** — mission transmissions before each sector,
   10 collectible log fragments (carried by certain Doids, and inside hidden
   black boxes) telling the story of the Static; recover ≥3 of 5 black boxes
   to triangulate the source and unlock the finale, which has **two endings**
   (destroy the beacon, or land and answer the call — primum non nocere).
3. **Animated Doids** — walk cycles, waving (with a saboteur "tell" in the
   rhythm), panic when explosions land nearby, gold shimmer on famous Doids.
4. **Famous Doids** — one per sector (Hippocrates, Vesalius, Nightingale,
   Semmelweis, Curie): reveal card on delivery + themed permanent upgrade.
5. **Saboteur Doids** — indistinguishable at a distance; tells: jerky wave,
   dull thud instead of a heartbeat on boarding, ECG arrhythmia while an
   active one is aboard. Active ones cut fuel lines and kill passengers;
   sleepers wait and slip into MERCY at delivery → timed breach countermission
   (dock at the red bay within 45s). Quarantine bay contains them for +750.

## Future ideas

- Persistent codex / rescue-log gallery across runs (who you've found).
- More famous Doids per sector, randomised from a larger pool.
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
