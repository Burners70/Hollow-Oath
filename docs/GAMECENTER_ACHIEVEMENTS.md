# Hollow Oath — Game Center achievements (Bundle G3)

App Store Connect metadata for the nine launch achievements. Images live in
[`assets/gamecenter/achievements/`](assets/gamecenter/achievements/) — one
1024×1024 PNG per achievement (Apple's recommended size; minimum is 512×512).
Game Center crops achievement art to a **circle**, so every image keeps its
meaning inside the centre circle; the outer ring is part of the composition
and survives the crop. SVG sources are in
[`assets/gamecenter/achievements/svg/`](assets/gamecenter/achievements/svg/),
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
| `the_full_codex.png` | The open codex under a constellation of eleven famous minds. |

## Wiring notes (for G3)

- IDs above match the `hollowoath.*` scheme; the earn conditions map to the
  flags already tracked in code (`runFired`, `firedAtSecret`/`firedAtCombat`,
  `shrines`, `runFragments`, `runLost`, `firedShots`, `codex` vs `FAMOUS`).
- Report at the ending/win screens and on codex save; fail-silent, same as
  localStorage.
- 1.2 adds EVERY HOLLOW HEARD and GENTLE HANDS to this set if Game Center has
  shipped (see APP_STORE_ROADMAP.md, Q·ship).
