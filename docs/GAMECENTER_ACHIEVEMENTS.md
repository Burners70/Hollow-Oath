# Hollow Oath — Game Center achievements (Bundle G3)

App Store Connect metadata for the nine launch achievements. Images live in
[`assets/gamecenter/achievements/`](../assets/gamecenter/achievements/) — one
1024×1024 PNG per achievement (Apple's recommended size; minimum is 512×512).
Game Center crops achievement art to a **circle**, so every image keeps its
meaning inside the centre circle; the outer ring is part of the composition
and survives the crop. SVG sources are in
[`assets/gamecenter/achievements/svg/`](../assets/gamecenter/achievements/svg/),
regenerable via `generate.py` in the same folder (render with headless
Chromium at 1024×1024).

Copy rules used below: **earned** text is past tense — what you did.
**Pre-earned** text is a hint that points at the deed without giving the game
away (no "shoot the beacon", no "shrine", no counts of things you haven't
found yet). The two hidden achievements stay hidden in Game Center until
earned, but App Store Connect still requires both descriptions.

| ID | Name | Hidden | Pre-earned (hint) | Earned |
|---|---|---|---|---|
| `hollowoath.oath_keeper` | OATH KEEPER | No | Earn the pacifist ending. | Completed the game without firing a shot. |
| `hollowoath.hollow_keeper` | HOLLOW KEEPER | **Yes** | Some oaths bend without breaking. | Answered the call — every shot spent on secrets, never in anger. |
| `hollowoath.the_one_who_answered` | THE ONE WHO ANSWERED | No | Something out there is calling. Answer it. | Reached the beacon and answered the call. |
| `hollowoath.sector_warden` | SECTOR WARDEN | No | The Static can be answered — or silenced. | Silenced the Static by fire. |
| `hollowoath.glycon_unmasked` | GLYCON UNMASKED | **Yes** | Someone is feeding the Static. Dig deeper — three times over. | Unmasked the puppet god — all three shrines found in a single rotation. |
| `hollowoath.archivist` | ARCHIVIST | No | Every voice on the record, in one rotation. | Recovered all 14 log fragments in a single run. |
| `hollowoath.spotless_rotation` | SPOTLESS ROTATION | No | Bring them all home. | Completed the campaign without losing a single Scion. |
| `hollowoath.first_do_no_harm` | FIRST DO NO HARM | No | Primum non nocere. | Cleared a sector without firing a shot. |
| `hollowoath.the_full_codex` | THE FULL CODEX | No | History is scattered among the Scions. Find all of it. | Recovered every famous mind, across all your rotations. |

## The art, achievement by achievement

All nine share the house style — neon vector strokes on the space-navy
gradient, starfield, glow — and the game's live palette (`#69f0ae` green,
`#00e5ff` cyan, `#ffc400` amber, `#ff4081` pink, `#b388ff` purple). Per
Bundle B, nothing uses a red cross; the medical emblem throughout is the
**rod of Asclepius**.

| Image | Reads as |
|---|---|
| `oath_keeper.png` | The rod of Asclepius inside an **unbroken** green ring — the oath, kept whole. |
| `hollow_keeper.png` | The same ring **cracked** by an amber fissure under cave stalactites — the oath bent in the Hollows, not in combat. |
| `the_one_who_answered.png` | The beacon on the ridge, signal arcs radiating, the player's ship landed beside it. |
| `sector_warden.png` | A warden's shield over a heartbeat trace going flat, with impact sparks — silence, by fire. |
| `glycon_unmasked.png` | The serpent rearing as the mask falls away; three shrine pips below. |
| `archivist.png` | A data slab holding all fourteen fragment blocks, recorder light green. |
| `spotless_rotation.png` | A Scion (chest emblem: the small serpent S-curve) ringed by seven lit sector pips and a completed rotation arrow — everyone came home. |
| `first_do_no_harm.png` | A clean heartbeat crossing the circle, empty ammo pips below — healing, zero shots. |
| `the_full_codex.png` | The open codex under a constellation of twelve famous minds — the twelfth (Mary Seacole, V1) joins as its own small satellite cluster off the original eleven-star chain, not a longer chain, so the constellation still reads at a glance once Act Two's ten more push the total to 22. |
| `every_hollow_heard.png` | Signature cyan; an ECG line either side of the rod of Asclepius — heard, not just seen. |
| `gentle_hands.png` | Safe mint; two cradling arcs around the rod — rescue without harm, no cross in sight. |

## Wiring notes (for G3)

- IDs above match the `hollowoath.*` scheme; the earn conditions map to the
  flags already tracked in code (`runFired`, `firedAtSecret`/`firedAtCombat`,
  `shrines`, `runFragments`, `runLost`, `firedShots`, `codex` vs `FAMOUS`).
- Report at the ending/win screens and on codex save; fail-silent, same as
  localStorage.
- **1.1 (Act Two)** adds EVERY HOLLOW HEARD and GENTLE HANDS to this set — see
  APP_STORE_ROADMAP.md, **P·ship**. *(This used to say 1.2 / Q·ship; 1.2 was
  cancelled when Act Two absorbed Bundle Q's caves — ACT_TWO_SPEC.md §13.)*
- **THE FULL CODEX becomes 12 in 1.01, and needs no code change.** The threshold
  is derived — `codex.size >= FAMOUS.length` (`js/update.js`) — so adding **Mary
  Seacole** as the twelfth famous Scion (roadmap V1) moves it automatically.
  Nothing in code, tests, COPY_DECK.md or STORE_LISTING.md pins the number, and
  the earned description above is count-free, per this file's own copy rule — so
  **the App Store Connect text does not change either.**
  **One asset does, and it's done:** `svg/the_full_codex.svg` and
  `the_full_codex.png` have the twelfth star (regenerated via `generate.py`,
  headless Chromium, 1024×1024) — the achievement worked correctly either way,
  so this could have waited for 1.01 to ship, but there was no reason to hold it.
- **EVERY HOLLOW HEARD and GENTLE HANDS art is delivered, wiring is not.**
  `every_hollow_heard.svg`/`.png` and `gentle_hands.svg`/`.png` exist now in
  `assets/gamecenter/achievements/` (same house style, `generate.py` regenerates
  both) — ahead of P·design's own "hold these until the act's chambers exist"
  guidance, again because there was no reason to wait on art that was already in
  hand. Neither has an `hollowoath.*` ID, a `GC_ACH` entry in `js/platform.js`,
  nor an earn condition yet: both depend on Act Two rescue mechanics that
  P·systems hasn't built. Adding the row to the ID table above and wiring
  `gc.achieve(...)` is **P·ship**'s job once those mechanics exist to define
  "heard" and "gentle" against.
