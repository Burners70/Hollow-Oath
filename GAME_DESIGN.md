# Hollow Oath — Game Design & Narrative Document

*A&M internal — everything a developer or writer needs to pick this project up.*

Last updated: July 2026 · Live build: https://burners70.github.io/Hollow-Oath/

> **Renamed from "DOIDS" → "Hollow Oath"** (androids "Doids" → **Scions**).
> Full rename log — scope, what was deliberately kept (localStorage keys,
> internal identifiers), and why — is in [CHANGELOG.md](CHANGELOG.md); the brief
> that drove it is [HOLLOW_OATH_BRIEF.md](HOLLOW_OATH_BRIEF.md).

---

## 1. What Hollow Oath is

Hollow Oath is an original 2D gravity-thrust rescue game — in the *mechanical*
lineage of *Oids* (Atari ST, 1987), but with wholly original code, art, story,
and names — built as a **single self-contained HTML file** (canvas + inline
CSS/JS, zero dependencies) targeting iPhone Safari first, desktop second. You
fly a small rescue dart over procedurally seeded terrain, land gently near
stranded medical androids ("Scions"), and ferry them back to the hospital
mothership **AMS MERCY** — while the game quietly teaches you to distrust
what you rescue and, later, what you see on the ground.

The heart of the game is a medical-ethics theme: the player is scored and
ranked not just on skill but on care — *primum non nocere* (first, do no
harm) is both a scoring bonus and the closing moral choice.

## 2. The narrative (evolved, current canon)

### 2.1 Premise

The hospital ship **AMS MERCY** runs mercy flights through the outer
systems. Her holds carry **SCIONS** — medical androids, each programmed with a
lifetime of clinical expertise. A few carry something rarer: the complete
preserved minds of medicine's giants (Hippocrates, Vesalius, Nightingale,
Semmelweis, Curie, Avicenna, Jenner), still practising.

Crossing an interdicted zone, every system aboard fails at once. The Scions
evacuate in pods and are scattered across seven sectors. MERCY flies again —
barely. The player flies the rescue.

### 2.2 The Static

The recorders keep only one thing from the failure: a signal, repeating,
**every 41 seconds**. Comms names it *the Static*. It doesn't jam a signal —
it rewrites the one who answers. Rescued Scions who answer it honestly stop
answering triage pings; they still walk, they still wave, but the rhythm is
wrong.

The truth, pieced together from log fragments and black boxes: the Static is
a degraded, looping distress call from **AMS SOLACE** — MERCY's sister ship,
lost with all hands. Every repeat is a copy of a copy. It is, and always has
been, a call for help. It is a *wound*, not a weapon.

### 2.3 The villain: GLYCON (the medical-misinformation layer)

The later campaign reveals a second, deliberate hand. Counterfeit refuelling
points that drain tanks dry. Trees that aren't trees. Saboteur "Scions" that
were never rescued units at all. Every counterfeit carries the same maker's
mark: **a coiled serpent wearing a human mask**.

Archive match: **GLYCON** — the puppet god of **Alexander of Abonoteichus**,
a real second-century charlatan who wrapped a tame snake in linen, ran a fake
oracle, and sold false plague cures while the plague spread. His amulets hung
over doors where precautions should have been. (This is genuine history —
Lucian documented him — and it anchors the game's theme: the villain *is*
medical misinformation, ancient and modern.)

Whoever wears the serpent mask out here found his playbook. Glycon does not
cause the Static — he **amplifies** it, aiming it along the rescue lanes,
farming the fear, and selling counterfeit salvation into the panic:
counterfeit rescuers, counterfeit fuel, counterfeit hope. The Static is a
wound; Glycon is the infection that keeps it open.

The reveal is staged across three secret caves ("the Hollows"):

1. **THE RELAY** — a hand-built transmitter boosting the Static. Not
   wreckage. Deliberate. The serpent mark scratched into the casing.
2. **THE WORKSHOP** — racks of half-finished Scions with dull chests and no
   hearts. The saboteurs aren't corrupted survivors; they are counterfeits,
   built to be found and carried home in good faith.
3. **THE SHRINE** — the serpent-with-a-mask itself, and the archive match to
   Alexander. Finding all three = **GLYCON UNMASKED** (+3000, epilogue line
   in the ending).

### 2.4 The moral architecture

- The **saboteurs** spread harm by exploiting trust in rescue — the game's
  metaphor for misinformation carried by well-meaning hands.
- The **counterfeit pods/trees** punish credulity but reward observation:
  every fake has a *tell* (see §6). The skill the game teaches is the
  clinician's skill — look closely, verify, doubt the too-convenient.
- The **finale choice** (destroy the beacon vs. land and answer it) sets
  fleet orders against the medical oath. The CMO refuses to sign the
  destroy-on-sight order with one line: *primum non nocere*.

### 2.5 Endings

| Ending | How | Result |
|---|---|---|
| **THE ANSWERED CALL** | Land beside the beacon and hold ~5s | SOLACE is heard; the Static fades "like a fever breaking". +6000, +2000 more if the whole run was no-fire ("OATH KEPT"). Epilogue line "The oath, kept whole." Best rank: *Oath Keeper — Primum Non Nocere*. |
| **SILENCE BY FIRE** | Shoot the beacon (3 hits) | The Static dies — and so does whatever was calling. +3000. Epilogue line "Quiet, at a cost. The oath, hollowed." Rank: *Sector Warden*. |
| **ROTATION COMPLETE** (unresolved) | Finish sector 7 with < 3 black boxes | The finale never unlocks; epilogue line "Left hollow. The Static answers still." |

**Rank tiers on the answered ending** (see §7 and the title's meaning):
- **OATH KEEPER — PRIMUM NON NOCERE** — answered with *no shot fired all run*.
- **HOLLOW KEEPER** — answered, but the no-fire oath was broken *only* to crack
  open Glycon's secrets (a lure-tree or hollow rock), never in combat. Epilogue
  line: "You found what he hid. It cost you the oath to do it." This makes the
  title's tension — *chasing the hidden truth costs you the oath* — a visible,
  named outcome. Tracked by the `firedAtSecret` / `firedAtCombat` flags.
- **THE ONE WHO ANSWERED** — answered, but fired in combat (turrets/drones).

If all three shrines were found, the ending gains a further epilogue: the
serpent's mask is catalogued for good — no one will buy his cures again.

### 2.6 Story delivery mechanisms

- **Intro panels** (5 illustrated screens, first launch only; replayable via
  the ▸ STORY pill on the title).
- **Sector briefings** — teletyped mission transmissions before each sector.
- **14 log fragments** — carried by certain Scions (deliver them to read) and
  inside black boxes. Logs 1–10 tell the Static's story; 11–14 expose Glycon.
- **7 black boxes** — one hidden per campaign sector; land nearby and hold to
  scan. ≥3 recovered unlocks the secret finale.
- **3 shrine cards** in the Hollows (the Glycon reveal).
- **Famous-Scion reveal cards** on delivery (name, era, true story, upgrade).
- **The ECG** — the player's own health bar doubles as a narrative device
  (arrhythmia = contaminant aboard).

## 3. Campaign structure

Eight authored sectors; each introduces exactly one new element. Terrain is
seeded procedural heightmap (deterministic per sector).

| # | Sector | Introduces | Famous Scion → upgrade |
|---|---|---|---|
| 0 | ASCLEPION | Basics: land, rescue, deliver | Hippocrates → **Gentle Touch** (hard landings do far less damage) |
| 1 | VESALIUS RIDGE | Saboteurs + red quarantine bay; first secret lift | Vesalius → **Fabrica Hull** (max vitals 125) |
| 2 | NIGHTINGALE BASIN | Darkness + your lamp | Nightingale → **The Lamp** (much larger light radius) |
| 3 | SEMMELWEIS DEEP | Fuel scarcity, fuel pods, drones; second lift | Semmelweis → **Antisepsis** (saboteurs visibly tinted) |
| 4 | CURIE FIELDS | Gravity anomalies | Curie → **Radiosense** (compass to unrecovered black boxes) |
| 5 | AVICENNA SHOALS | Glycon's counterfeits (fake pods, lure-tree, hollow rock); third lift | Avicenna → **Canon of Truth** (counterfeits unmasked with a "?" mark) |
| 6 | JENNER TERRACES | Sleeper-saboteur gauntlet (75% sleepers) | Jenner → **Inoculation** (saboteurs can no longer kill passengers) |
| 7 | THE NULLWAVE | Secret finale: the beacon, two endings | — |

Sector clear = every Scion accounted for (saved / lost / contained), then the
**extraction dock**: MERCY spools to jump, drifts, and the Static shoves your
ship in quickening pulses while you dock one last time.

## 4. Core mechanics

- **Flight**: rotate + thrust against gravity; fuel is finite. Landing needs
  slow descent, low drift, flat ground, upright ship (green/amber/red
  approach guide with reason text). Optional landing assist (auto-level).
- **Rescue**: land near a waiting Scion; it walks over and climbs aboard
  (capacity 6). Delivering to MERCY's cyan **recovery bay** heals, refuels
  and scores; famous Scions step out last for the reveal.
- **Saboteurs**: indistinguishable at distance. Tells: mechanically perfect
  wave/blink rhythm, slightly-too-eager walk, a **dull thud** instead of a
  heartbeat on boarding, ECG **arrhythmia** while an active one is aboard.
  Active ones cut fuel lines and kill passengers; **sleepers** wait and slip
  into MERCY at delivery → timed breach (dock at the **red quarantine bay**
  within 45s or healing goes offline). Containing a saboteur in the red bay
  = +750.
- **Force field** (SHIELD, hold): drains fuel ~7/s; deflects turret fire,
  destroys drones harmlessly on contact, turns bad landings into bounces,
  and saves you from cave ceilings.
- **Enemies**: tracking turrets, homing drones. You *can* shoot back — but a
  no-fire sector earns the **Hippocratic bonus** (+2000) and a no-fire run
  affects the best ending/rank.
- **Friendly fire is malpractice**: your exhaust and stray shots can kill
  the very Scions you came for (score penalties, named famous casualties).
- **ECG health bar**: beat rate rises as vitals fall; arrhythmia is
  diagnostic information.

## 5. Controls

| Input | Mapping |
|---|---|
| Touch | ⟲ ⟳ rotate (left thumb) · THRUST / FIRE / SHIELD (right thumb). One document-level multi-touch tracker hit-tests every active touch against every button (14px margin) so rolling between buttons transfers instantly. Buttons exist **only in flight** — hidden on title/intro/briefings/cards. |
| Keyboard | ← → rotate · ↑/Z thrust · Space/X fire · C / Shift / ↓ shield · Enter tap |
| Gamepad | Stick or d-pad rotate · A thrust · X/RB fire · B/LB/LT shield · Start = tap (menus) |
| Gyro | ⟲ TILT pill on title (analog steering, 4° deadzone → full at 24°, orientation-aware, iOS permission flow) |

## 6. Secrets inventory (and their tells)

Design rule: **every secret has a subtle, learnable tell, and most tells
rhyme with the saboteur tell — mechanical perfection is the signature of the
counterfeit.**

| Secret | Tell | Payoff |
|---|---|---|
| Secret lifts (sectors 1, 3, 5) | Hairline seams + 4 rivets on a flat pad; a rare glint; "THE PAD RINGS HOLLOW…" when you settle on it | Land + hold 2.4s → descend into the Hollows (cave level: floor **and roof** heightmaps, darkness, fuel pods, a lurking drone, return lift) |
| Shrines (one per cave) | Glowing serpent idol, slow pulse rings | Staged Glycon reveal, +1000 each, all three = GLYCON UNMASKED +3000 + ending epilogue |
| Fake fuel pods (sectors 5–7) | Real pods flicker organically, each to its own rhythm; **fakes blink in perfect unison** | Touching drains 18 fuel, −100 score |
| Lure-trees (sectors 5–7) | Sways in perfect mechanical time; in the Nullwave it's *the only tree standing* | Shoot it: hidden Glycon transmitter, +500 |
| Hollow rock (sectors 5–7) | One rock "breathes" — its outline gently pulses | Shoot it: hidden real cache, +400 + a fuel pod |
| Black boxes (one per campaign sector) | Faint blink, stronger when near; Curie's compass points at them | +800, a log fragment, finale progress |
| Famous Scions | Gold shimmer particles if you watch closely | Reveal card + permanent upgrade + 1500 |
| Saboteurs | See §4 | Quarantine +750 / breach risk |

Note the tension: unmasking lure-trees and hollow rocks costs shots, which
breaks the Hippocratic/no-fire bonuses. Curiosity vs. the oath is a
deliberate choice the player makes — and, on the answered ending, a choice the
game now *names*: breaking the oath only for secrets earns the **HOLLOW KEEPER**
rank (§2.5), distinct from breaking it in combat.

## 7. Scoring

| Event | Points |
|---|---|
| Scion aboard | +500 |
| Scion delivered | +300 |
| Famous Scion delivered | +1500 (+upgrade) |
| Saboteur contained (red bay) | +750 |
| Breach resolved / failed | +750 / −1000 and healing offline |
| Turret / drone destroyed | +250 / +150 |
| Black box | +800 |
| Shrine | +1000 (all three: +3000) |
| Lure-tree / hidden cache | +500 / +400 |
| Fake pod touched | −100 (and −18 fuel) |
| Sector clear | +1000 (+2000 Hippocratic if no shots fired) |
| Scion lost | −250 (famous −500); crash with passengers −250 each |
| Endings | fire +3000 · answered +6000 (+2000 no-fire run) |

## 8. Persistence (localStorage)

| Key | Meaning |
|---|---|
| `doids_hi` | Hi-score |
| `doids_codex` | Famous Scions recovered across all runs (title CODEX) |
| `doids_assist` | Landing assist on/off |
| `doids_tilt` | Gyro steering on/off |
| `doids_intro` | Intro narrative seen (plays once; ▸ STORY replays) |
| `doids_a2hs` | Add-to-home-screen banner dismissed |

## 9. Architecture (for developers)

Everything lives in **`index.html`** (~2.9k lines). No build step: edit,
reload. Deliberate order inside the `<script>`:

1. **Input** — touch tracker, keyboard, `pollPad()` (Gamepad API), gyro.
2. **Audio** — tiny WebAudio synth: thrust noise, blips, boom, heartbeat
   (lub-dub), `staticTick()` (the Static's dry burst), dull thud.
3. **Story data** — `SECTOR_NAMES`, `BRIEFS`, `FRAGMENTS`, `SHRINES`,
   `FAMOUS`, `INTRO`. `FINALE_IDX` / `NBOX` derive from `SECTOR_NAMES`.
4. **World gen** — `RECIPE[]` (per-sector counts incl. `scn` scenery and
   `fakes`; `lift` flags), `genLevel(n)`, `genCave(ci)` (`LIFT_CAVE` maps
   sector→cave), `enterCave()/exitCave()` (swap `level`, keep `surfaceCtx`),
   `acctLevel()` (sector accounting always lands on the surface level).
5. **Simulation** — `updatePlay` and friends (`updateOids`, `updateEnemies`,
   `updateSabotage`, `updateDocking`, `updateBlackbox`, `updatePods`,
   `updateLift`, `updateShrine`, `updateBeacon`, `updateExtraction`).
   Landing rules in `landingEval()`; tunables at top (`GRAV`, `THRUST`,
   `ASSIST_*`).
6. **Rendering** — `drawWorld` (terrain, cave roof, scenery, mothership,
   pods/fakes, lift, shrine, oids, enemies, ship+shield, darkness overlay
   `drawDarkness` with punched lights), HUD (`drawECG` is the health bar),
   screens (title/intro/brief/cards/codex).
7. **State machine** — `state` ∈ title · intro · help · codex · brief · play
   · reveal · clear · dead · ending · gameover · win. Virtual buttons shown
   only in play/dead (`updateCtlVisibility`).

**Debug/test handle**: `window.__doids` exposes state plus `go(n)` (jump to
sector), `launch()`, `warpLift()`, `warpShrine()`, `give(upgrade)`,
`reset()`. All headless tests drive this. `get()` now also reports
`firedAtSecret` / `firedAtCombat` (the flags behind the HOLLOW KEEPER rank).
Note: the `__doids` handle name and the `doids_*` localStorage keys keep the old
prefix deliberately after the Hollow Oath rename — renaming the keys would wipe
existing players' saved progress and codex (see CHANGELOG.md).

**Testing**: Playwright + the pre-installed Chromium. Two suites were used
during development (kept in session scratchpad, easy to recreate): a smoke
suite (all sectors generate & run, cave round-trip, shield, fake pods, data
counts) and a UI suite (control visibility per state, intro-once, synthetic
multi-touch slide/second-finger tests). Pattern:
`page.evaluate(() => __doids.go(5))` etc., assert on `__doids.get()`.

**Branches / deployment**:
- `main` — current stable (this document, game, assets).
- `claude/doids-iphone-game-r4fnon` — **GitHub Pages deploys from this
  branch**; pushing here is deploying. (Branch name keeps the old "doids"
  slug — it's not user-facing, so it was left as-is; see CHANGELOG.md.)
- `claude/game-dev-next-stage-trwmua` — a dev branch.
- `claude/test-connection-79fx9k` — the Hollow Oath rename landed here first.
- **Repo renamed** `Doids` → `Hollow-Oath` (done). The repo URL and Pages base
  are now `https://burners70.github.io/Hollow-Oath/` (GitHub redirects the old
  `.../Doids/` path for a while). The live *content* updates once the rename
  reaches the Pages deploy branch. See CHANGELOG.md § "Repository & URL".
- PWA bits: `manifest.webmanifest`, apple-touch icons. **No service
  worker** — stale Home-Screen installs are plain browser cache (refresh in
  Safari or re-add the icon).

## 10. Future ideas (unbuilt)

- Non-violent way to expose lure-trees/hollow rocks (scan instead of shoot)
  so pacifist runs can also unmask Glycon.
- A version stamp on the title screen (build/date) to make stale caches
  obvious.
- More famous Scions per sector, randomised from a larger pool; second
  playthrough modifiers; difficulty settings.
- Moving rescue targets; saboteur ground-behaviour tells (refusing to panic,
  standing too still).
- A fourth cave / a Glycon confrontation beyond the shrines; a third finale
  branch if GLYCON UNMASKED.
- Sound design pass for the Hollows (drips, echo); haptics on iOS.
