# Bundle P — The Pendulum Sling (the Hollows' recoveries)

*Design + implementation spec. Proposed, not built — no code has changed.
Companion to [GAME_DESIGN.md](GAME_DESIGN.md) (read that first) and
[APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md) (where this slots in as Bundle P).
Supersedes the old "pendulum carry" proposal in ROADMAP.md § Future ideas —
see §11 for why.*

Last updated: July 2026

---

## 1. Concept in one paragraph

The classic *Oids*/*Thrust* pendulum — a heavy load tethered beneath your
ship, swinging with real momentum, punishing rough flying — enters Hollow
Oath **decoupled from Scion rescue**. Each of the three secret Hollows
hides, beyond its shrine, one physical **relic**: a thing Glycon took, kept,
or built his lies around. The player can land beside it, **cradle** it
(scan-style hold), and tow it out on a sling — through the cave's floor
*and roof*, up the secret lift, across the surface sector, and home to
MERCY's bay — without slamming it into rock. It is patient transport as a
flight skill: *primum non nocere*, made kinetic. Your hands are the
treatment now, and the payload feels every turn you make.

## 2. Why this, why here (design rationale)

**Gameplay.** The whole game teaches *approach management*: decelerate,
level, settle. The transfusion line then added *sustained hover*. The
pendulum adds the third and last classic thrust skill the game never asks
for: **momentum management under load** — a coupled mass that lags your
thrust, swings on your turns, and keeps moving when you stop. The Hollows
are the only place in the game with a roof heightmap, and today that roof
is barely used (it exists mostly to be shield-bounced). A swung load
between floor and ceiling in the dark is the *Thrust* run this engine was
built to host — and it lives entirely inside optional secret levels, so
the core rescue loop is untouched.

**Narrative.** The Hollows currently *reveal* and nothing more: three
one-visit rooms, three cards, leave. The relics give the reveal a verb.
You don't just read what Glycon did — you **take it back**. Each relic
answers one of the three shrine reveals in kind:

- The Relay boosts the Static → so *cut out the source it loops* and carry
  it home (THE FIRST CALL).
- The Workshop counterfeits hearts → so *rescue the one real heart* he was
  copying (THE LAST HEART).
- The Shrine sells a masked god → so *seize the mask itself* as evidence
  (THE MASK).

**Game-goal rationale.** Hollow Oath scores *care*, not just skill. Every
existing bonus prices gentleness or observation (Hippocratic no-fire, the
landed scan, CLEAN LINE). The sling is the same economy applied to cargo:
the reward scales with how gently you flew, and the tension is the game's
own throughline — your flying can hurt the thing you came to save. It also
deepens two systems that are already paid for: the Hollows get a second
act (a reason to descend again, a reason the drone down there matters),
and the ending/epilogue machinery gets one more earned line. Nothing new
is bolted onto the core loop; the new risk exists only while you choose to
carry it.

**One rule kept sacred:** like every secret, the relics obey the tell
grammar — *mechanical perfection (or its inversion, total silence) is the
signature of the counterfeit; organic rhythm is the signature of the
true.* Two relics are found by their honest rhythm; the third is found by
having none at all.

## 3. The three relics

One per cave, placed on a flat shelf **beyond the shrine** (shrine at
`W − 260`; relic at ~`W − 120`), so the tow route is the full cave back to
the lift at `x = 220`, then the surface leg to MERCY. Difficulty ramps with
the sectors that host the lifts (1 → 3 → 5) *and* with each relic's
handling character:

| Cave | Under sector | Relic | Handling character | The tell (how you find it) |
|---|---|---|---|---|
| 0 · THE RELAY | 1 · Vesalius Ridge | **THE FIRST CALL** — SOLACE's recorder core, cut from the relay's cradle: the original call, before the copies of copies | The heavy one. Standard tether, high inertia — teaches the swing. No drone in cave 0; this is the tutorial tow | Every 41 s it plays the call *clean* — a soft, un-degraded voice tone (a gentler cousin of `staticTick()`), on the exact phase of the world surge |
| 1 · THE WORKSHOP | 3 · Semmelweis Deep | **THE LAST HEART** — the single genuine Scion heart in a workshop of hollow chests; the template every counterfeit was measured against, and never matched | The fragile one. Integrity 70 (not 100), lower damage threshold — teaches gentleness | It **ticks**: an honest lub-dub through `sfxGain`, volume by proximity — in the dark you find it by sound, exactly like the boarding tell taught you |
| 2 · THE SHRINE | 5 · Avicenna Shoals | **THE MASK** — the human face lifted off the serpent idol; cast to fit any wearer, lighter than it should be | The wild one. Low damping, wide swing (it *wants* to be worn) — teaches damping. Picking it up wakes a second drone ("he notices when you touch his things") | The inversion: it is the only object in the Hollows with **no rhythm at all** — no tick, no blink, dead silent. The absence is the signature |

Display copy note: relics never use the word "relic" on screen (it's the
internal name only). Banners say what the thing is: `THE CRADLE IS NOT
EMPTY`, `A HEART, STILL TICKING`, `THE MASK COMES LOOSE`.

## 4. Mechanics spec

### 4.1 The tether (physics)

- **Model:** payload = one point mass on a rigid-length sling below the
  ship. Implement as a verlet point + distance constraint (2 iterations),
  *not* angle math — it degrades gracefully when the payload rests on
  ground (slack) and when the ship spins.
  - `SLING_L = 46` (px), payload radius 8, tether attach at ship centre.
  - Payload integrates `GRAV` like the ship; per-frame velocity damping
    `0.999` (THE MASK: `0.9997`).
  - Constraint correction split **ship 30% / payload 70%** — towing
    genuinely tugs the ship. That 30% *is* the pendulum feel: thrust away
    and the load lags, then swings through under you.
- **Tunables at top of file** next to `GRAV`/`THRUST`:
  `SLING_L`, `SLING_SHIP_W = 0.3`, `SLING_DAMP`, `SLING_SAFE_V = 40`,
  `SLING_DMG_K = 0.25`.
- **The 41-second surge** (`staticSurge`, Bundle I) applies a lateral
  impulse to the *payload* while towing — the same "the clock has
  mechanical teeth while tethered" rule the transfusion line established.
  Anchor: wherever `updateStaticClock` sets the surge.

### 4.2 Cradle, carry, release, deliver

- **Cradle (pickup):** land within 60 px of a live relic → hold-to-scan,
  same pattern as `updateShrine`/`updateBlackbox`: `scanT` accumulates,
  progress ring, label `CRADLING…`. Duration **2.5 s ÷ `scanRate()`**
  (Virchow's CELL DOCTRINE applies — diagnosis is diagnosis). On
  completion the sling attaches; the relic lifts with you on next takeoff.
- **Release:** while towing, **TAP FIRE = release** (edge-triggered,
  `fireCd = 0.5` on release so a held FIRE never becomes a shot — the
  exact convention `finishTransfusion` uses). The payload drops where it
  is; a gentle drop (contact speed < `SLING_SAFE_V`) is free, a hard one
  costs integrity. It can be re-cradled. **While towing, FIRE never
  shoots** — you cannot fire a weapon and carry a patient with the same
  hand. (Turrets on the surface leg therefore force the oath question
  physically: release and fight, or carry on and endure.)
- **Shield:** forced down while towing (`s.shield = false` in the tow
  update — verbatim the transfusion rule: the field would sever the
  sling). One consistent law: *nothing rides a tether under the field.*
- **Landing while towing:** allowed and unchanged (`landingEval()` is not
  touched). The payload settles onto terrain first, the sling goes slack;
  contact below `SLING_SAFE_V` does no damage. Taking off re-tensions.
- **The lift:** riding a lift while towing is allowed. During
  `updateLiftTransit` the payload freezes relative to the ship (skip
  physics, damage-free — it's a scripted beat) and re-tensions on
  `settle`. This is the intended route: cave → lift → surface → MERCY.
- **Deliver:** enter MERCY's cyan med bay (`bayRects()`, same dock logic
  path as `updateDocking`) with a relic in tow → 1.5 s winch beat (payload
  eases up into the bay), then the story card (§6). The red quarantine bay
  refuses relics (nothing to contain — one line: `WRONG BAY — THIS ONE IS
  REAL`).
- **Passengers:** orthogonal. Boarding/capacity/sabotage logic untouched —
  Scions stow inside, the relic hangs outside. No interaction, by design
  (that separation is the point of this bundle).

### 4.3 Integrity, damage, loss

- `relic.integrity` starts 100 (THE LAST HEART: 70).
- **Terrain / roof / scenery contact** at speed `v > SLING_SAFE_V`:
  `integrity −= (v − SLING_SAFE_V) × SLING_DMG_K`. Below the threshold,
  free — gentle set-downs and brushes cost nothing. The tension must be
  proportional to how roughly you fly, never a hair-trigger (same
  principle as the old carry proposal, kept).
- **Turret bullets** hit the payload (−15). **Drone contact**: the drone
  dies (explodes harmlessly, as on shield contact), relic −25.
- **Integrity zero:** the relic breaks — `−400`, banner, a one-line card
  in Glycon's favour (§6), gone for the run (tracked like a lost famous —
  but **not** counted in `runLost`, which is a Scion bucket; ranks and
  achievements keep their meaning).
- **Ship death while towing:** the sling parts, the relic drops where it
  fell (integrity −20 if the fall is hard) and can be re-cradled on the
  next life.
- **Cave regeneration:** `enterCave` calls `genCave` fresh each descent,
  so relic state must live in run globals, not the level: `relicsDone`
  (Set of cave indices delivered) and `relicsLost` (Set, broken this run).
  `genCave(ci)` spawns the relic only if `ci` is in neither set — the
  exact pattern `shrines` already uses for shrine spawn.

### 4.4 Always readable (the tell language)

- **Swing warning:** when payload speed relative to the ship crosses a
  safe threshold, an amber `!` glyph at the tether midpoint (red `✕` when
  contact at damaging speed is imminent — i.e. swinging fast *and* near
  terrain/roof). Green `✓` while docile. Colours through `PAL()`, glyphs
  per the H2 shape-redundancy rule.
- **Integrity readout:** a **miniature ECG** above the payload — the
  game's one health language, reused. Full and slow at 100; faster and
  spikier as integrity falls (the heart relic's mini-ECG *is* its tick).
  Shown only when towing or after first damage, to keep the dark caves
  clean.
- **Audio:** each relic's tell (§3) keeps sounding while towed — the
  clean 41 s call, the lub-dub, the silence. Damage = one `dullThud()`.
  Haptics via the F facade: light tap on cradle, medium on damage, the
  lub-dub pattern when towing the heart (the phone becomes *its* ECG too).
- **FIELD MEDIC** (`doids_easy`): damage threshold ×1.3, damage taken
  ×0.5 — same accessibility contract as landings and breaches.

## 5. Scoring & economy

| Event | Points |
|---|---|
| Relic cradled (first time per relic per run) | +150 |
| Relic delivered to MERCY | +1200 |
| **GENTLE HANDS** — delivered at full integrity (100/70/100, untouched) | +500 more |
| All three delivered in one run | +2000 |
| Relic destroyed | −400 |
| Hard drop / wall hit | 0 (integrity is the price, not score) |

Deliberate mirrors: GENTLE HANDS is CLEAN LINE's big sibling; the
all-three bonus sits between GLYCON UNMASKED (+3000) and the Hippocratic
sector bonus (+2000). Optional (owner decision, see §10): an answered
ending with all three delivered appends **· GENTLE HANDS** to the rank
line, the same grammar as `· EYES OPEN`.

## 6. Narrative delivery (draft copy, house voice)

**Post-shrine hooks** (one banner per cave, fired when the shrine card
closes, seeding the relic without a briefing spoiler):

- Cave 0: `THE RELAY'S CRADLE IS NOT EMPTY — SOMETHING STILL PLAYS`
- Cave 1: `ONE CHEST IN THE RACKS IS TICKING`
- Cave 2: `THE IDOL'S FACE COMES LOOSE`

**Delivery cards** (via `showCard`, kicker `THE HOLLOWS · RECOVERY`):

- **THE FIRST CALL** — *"A recorder core, cut from the relay's cradle.
  The original. Before the copies of copies.\n\nPlayed back in MERCY's
  bay, it is not a weapon and it is not a wound. It is a voice, saying
  what it has always said:\n\nplease.\n\nThe lanes fly quieter with the
  relay's heart gone."*
- **THE LAST HEART** — *"One genuine heart in a workshop of hollow
  chests — the template he measured every counterfeit against, and never
  matched.\n\nIt has been ticking down there in the dark the whole
  time.\n\nSomewhere a Scion walks without it. Carry it like it's
  theirs."*
- **THE MASK** — *"Lifted from the idol: a human face, cast to fit any
  wearer. Lighter than it should be. It swings like it wants to be
  worn.\n\nEvidence now, in a sealed case in MERCY's archive.\n\nA lie is
  weightless. Carrying it home is the heavy part."*

**Breakage card** (any relic, one line, Glycon's favour): *"Broken on the
carry. He would have liked that — proof, he'd say, that nothing true
survives being handled."*

**Diegetic reward, one only:** after THE FIRST CALL is delivered, surface
`staticSurge` softens for the rest of the run (0.6 → 0.45) — the relay's
source is gone, so the lanes literally fly quieter. (The finale's beacon
surge is untouched — SOLACE herself still calls.) No other relic grants a
mechanical boon; recoveries are story, score, and pride, not an upgrade
tree.

**Ending hooks:**

- THE FIRST CALL delivered + answered ending → the epilogue's typed line
  gains a clause: *"AMS SOLACE · crew manifest 214 · status: HEARD — in
  her own voice."*
- All three delivered → one extra epilogue line: *"What he took is home.
  What he built is catalogued. What he broke is answered."*
- Codex: three ARCHIVE rows (persisted in `doids_relics_seen`, K-style),
  locked entries shown as `RECOVERY · I/II/III — still below`.

**Teach it once** (J4 precedent): one sentence in the HOW TO FLY card's
secrets paragraph — *"Some of what he keeps below can be carried home —
slung under your hull, feeling every turn you make."*

## 7. Code anchors & task checklist

Everything in `index.html`; anchors are functions/variables, not line
numbers.

- [ ] **P1. Relic data & spawn.** `RELICS[3]` const next to `SHRINES`
  (name, handling params, card copy, tell config). `genCave(ci)` places
  `lvl.relic` on a `flatten()`ed shelf at `W − 120` unless `ci` is in
  `relicsDone`/`relicsLost` (run globals; reset in `resetRun()`; add to
  the A1 snapshot in `toBriefing`). Cave 2 pickup spawns the second drone.
- [ ] **P2. Tether physics.** New `updateSling(dt)` called from
  `updatePlay` (skip while `liftTransit`): verlet payload, distance
  constraint with `SLING_SHIP_W` ship correction, slack-when-grounded,
  surge impulse. Tunables at top of file next to `GRAV`.
- [ ] **P3. Cradle / release / deliver.** Cradle per `updateShrine`
  pattern; FIRE-as-release with the `fireCd = 0.5` convention; shield
  suppression; winch beat + card on med-bay entry (hook beside
  `updateDocking`'s bay checks; quarantine bay refuses). Suppress shooting
  while towing at the fire-input site.
- [ ] **P4. Damage & loss.** Contact tests vs `groundAt`/`roofAt`/scenery
  verts; bullet/drone hits; breakage path (−400, card, `relicsLost`);
  ship-death drop. FIELD MEDIC multipliers beside the existing
  `doids_easy` reads.
- [ ] **P5. Rendering.** `drawRelic()` (three small sprites: recorder
  core, ticking heart, pale mask), sagging/taut sling (reuse the
  transfusion line's segmented rendering approach), mini-ECG, `✓/!/✕`
  swing glyph through `PAL()`. Draw order: in `drawWorld` right after
  `drawShip` (the payload hangs in front of terrain, behind HUD).
- [ ] **P6. Audio & haptics.** The clean-call tone (41 s phase), proximity
  lub-dub for the heart, silence for the mask; `dullThud()` on damage;
  haptic wiring per §4.4 through the F facade (no-ops on web).
- [ ] **P7. Scoring, cards, codex.** §5 table; `showCard` copy from §6;
  `doids_relics_seen` persistence + ARCHIVE rows + title-pill count if it
  fits (`⚕ · ◈ · ⚘`?— owner call); GENTLE HANDS flag per relic.
- [ ] **P8. Ending & surge hooks.** Epilogue clause + extra line;
  `staticSurge` softening after FIRST CALL; Game Center achievement id
  **GENTLE HANDS** added to the G3 list (all three delivered, one run).
- [ ] **P9. Expose + test.** `__doids.get()` gains
  `{towing, relicIntegrity, relicsDone, relicsLost}`; add
  `warpRelic()` beside `warpShrine()`. Smoke: descend → cradle → tow →
  scripted wall hit drains integrity → lift up with tow → deliver →
  +1200 and card; FIRE while towing releases and `runFired` stays 0;
  shield stays down while towing; break path sets `relicsLost` and the
  cave stops spawning it.
- [ ] **P10. Feel pass on device.** The pendulum lives or dies on tuning
  (`SLING_L`, damping, the 30% tug). Budget a real-iPhone session with
  F3's restraint pass; the three handling characters must feel *different
  before they feel hard*.

## 8. Persistence & save schema

| Key / field | Meaning |
|---|---|
| `doids_relics_seen` | Recovery cards ever read (codex ARCHIVE), K-style Set |
| A1 snapshot `relicsDone`, `relicsLost` | Arrays, restored on RESUME (schema bump `v: 2` with a default-empty migration for old snapshots) |
| `__doids.get()` additions | `towing`, `relicIntegrity`, `relicsDone`, `relicsLost` |

## 9. Dependencies & risk

All dependencies are **already shipped**: I (surge), J (scan pattern),
K (codex), H (easy mode + PAL), D (perf — the payload is one entity, no
shadowBlur), F1 (haptic facade). The bundle is isolated to the secret
path: no changes to boarding, sabotage, breach, extraction, `landingEval`,
or any scoring bucket that feeds existing ranks. Riskiest surface:
`updateDocking` (one new branch) and the fire-input site (suppression
while towing) — both small and testable. Biggest genuine risk is **feel**,
which is why P10 is a real device pass, not a checkbox.

## 10. Launch vs. update — recommendation

**Ship it as the free 1.1 content update, not in the launch build.**

- **It doesn't gate launch, so don't let it delay launch.** Everything
  still blocking submission (E1/E2/E4–E8, F3, G, O) needs a Mac and App
  Store Connect, not content. The game already plays at the $4.99 feature
  bar (roadmap status, July 2026). Adding a coupled-physics mechanic now
  adds regression surface across caves, docking, and input during the
  exact window the build should be freezing.
- **The pendulum needs the device you don't have yet.** Its quality is
  90% tuning-by-feel on real hardware (P10) — the same reason F3 waits.
  Tuning it via TestFlight builds *after* the wrapper exists is strictly
  better than tuning it blind before.
- **Free, not paid.** The store positioning is "complete game, no IAP, no
  data collected" (O1/E5) — paid DLC contradicts the pitch, adds IAP
  machinery and review scope to the wrapper, and no $2.99–4.99 arcade
  title can carry a paid add-on this small. A **named free update** ("1.1
  — THE PENDULUM", generically worded per the E7 trademark tiers, with the
  *Oids*/*Thrust* homage named on the website as usual) buys what paid
  DLC can't: a What's-New re-feature moment, a review-refresh prompt, a
  reason for lapsed players to redescend, and — if launch price was $2.99
  — the content case for moving to $4.99.
- **One caveat:** if launch slips for external reasons (no Mac access for
  a quarter), P is the best use of the wait — it's implementable today on
  the web build, minus the P10 feel pass.

## 11. Relationship to the old "pendulum carry" proposal

ROADMAP.md § Future ideas proposed the pendulum as a *core-loop* change:
the most recently boarded Scion dangles and can be swung into hazards.
This spec supersedes it, deliberately:

- **Owner direction (July 2026):** the pendulum should be *separate from
  picking Scions up* — a whole new story element, not added risk on the
  existing one.
- The carry version touched every sector, sabotage, breach and loss
  accounting (its own writeup called it "a core-loop change, not a
  bolt-on"); this version is a bolt-on by construction, confined to
  content most players meet after they can already fly.
- The carry version punished the rescue loop's *existing* verb; this one
  adds a new verb with its own reward channel — closer to what the
  transfusion line proved works (new skill, opt-in exposure, clean
  detach, priced gentleness).

The old writeup stays in ROADMAP.md (struck through, reasoning trail
kept) — its two best ideas survive here: damage proportional to rough
flying with an always-readable amber warning, and losses that never
corrupt existing rank buckets.
