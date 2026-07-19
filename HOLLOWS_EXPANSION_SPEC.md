# Bundle Q — The Listening Post (auscultation, the rotation chart, and the deep Hollows)

*Design + implementation spec. Proposed, not built — no code has changed.
Companion to [GAME_DESIGN.md](GAME_DESIGN.md) and sibling of
[PENDULUM_SPEC.md](PENDULUM_SPEC.md) (Bundle P). The two bundles are
independent — either ships without the other — but they compound: P gives
the Hollows things worth carrying out, Q gives players a way back down.*

Last updated: July 2026

---

## 1. Concept in one paragraph

The secret lifts stay exactly as hard to find as they are today — that
difficulty is a feature, and this bundle prices the aid instead of
deleting the secret. A twelfth famous Scion, **RENÉ LAENNEC** (the
inventor of the stethoscope — the man who taught medicine to *listen*),
is stranded not in the open but **inside a brand-new Hollow** under the
late game, knocking on the rock. Rescue him and two things open at once:
**AUSCULTATION** (hollow ground announces itself — unfound lift pads ring
softly and are marked when you fly near) and **the ROTATION CHART** (his
hand-drawn map of every hollow he heard, which convinces MERCY to re-fly
cleared sectors — levels that persist exactly as you left them). To give
the chart somewhere to point, the Hollows themselves grow: **three new
caves** under the sectors that currently have none, each with a new
discovery in the Static/Glycon canon.

## 2. Why (design rationale)

**"Hard to see" stays a virtue.** The game's whole grammar is *priced
observation* — every secret has a learnable tell, and the tells are the
skill. A free lift-finder would delete that. The fix follows an existing
precedent exactly: **Curie's RADIOSENSE** already converts one earned
rescue into a finding aid for black boxes. AUSCULTATION is Radiosense's
sibling for lifts — and it's priced twice over: you must first find the
*hardest* hollow unaided (Laennec's, sector 6), and by then the aid's
main value is retrospective, which is what the rotation chart is for.

**Gameplay.** The campaign is currently a one-way corridor: miss a lift
(or a black box, or a shrine) and it's gone for the run. That's clean but
harsh, and it wastes the game's best real estate — most players will
never see a Hollow. Return travel turns the back half of a campaign into
a hub-and-spokes completion game *for those who want it*, without
touching the forward path at all: revisits contain no rescues, no clear
bonus, no extraction — only exploration, and whatever hazards you left
alive. It also makes GLYCON UNMASKED (3 shrines), the ≥3-box finale
unlock, and Bundle P's three relics *achievable by persistence* rather
than only by per-sector perfection.

**Narrative.** Laennec is the patron saint of this game's core mechanic.
Hollow Oath's central skill — told to the player from sector 1 — is
*listening for a heartbeat and distrusting a rhythm that's wrong*. The
historical Laennec rolled a paper tube against a patient's chest in 1816
and heard the heart clearly for the first time in history; he named the
method **auscultation**, described the breath sounds physicians still
learn, and died of tuberculosis — the disease he taught the world to
hear. A Scion carrying his mind, stranded in the dark, would do exactly
one thing: **listen to the rock, map what rings hollow, and knock so
someone finds him.** The existing lift tell is even worded as percussion
— *"THE PAD RINGS HOLLOW…"* — the game has been doing auscultation since
sector 1 without saying so. He says so.

**Game-goal rationale.** Every system this bundle touches already pays
into a goal the player owns: shrines → GLYCON UNMASKED; boxes → the
finale; logs/cards → the codex ARCHIVE; relics (P) → GENTLE HANDS. Q
doesn't add a new goal so much as add the *second chance* at all of
them — and one new collection (the deep Hollows themselves) whose
completion is heard, not scored: **EVERY HOLLOW HEARD**.

## 3. The new famous Scion: RENÉ LAENNEC

- **`FAMOUS` entry** (data-driven like the rest):
  - name: `RENÉ LAENNEC`, era: `1781–1826`
  - story: *"He rolled a sheet of paper into a tube, set it to a
    patient's chest, and heard the heart clearly for the first time in
    history. Listening as diagnosis — auscultation — began as one act of
    tact. He died of the disease he taught the world to hear."*
  - upgrade: `auscult`, upgradeName: `AUSCULTATION`
  - upgradeDesc: *"Hollow ground announces itself — secret lift pads
    ring softly and are marked when you pass near. And his chart of the
    deep opens MERCY's rotation lanes: return to any cleared sector."*
- **Placement: fixed secret content, NOT in the rotation pool.** He is
  always in cave 5 (the Listening Post, under Jenner Terraces), campaign,
  remix and daily alike — like the shrines, he is seeded to the place,
  not the sector draw. `famousMap` and the M2 shuffle never touch him;
  the pool stays 7-of-11. (This keeps the design intact in every mode
  and avoids a 12th entry breaking the remix draw.)
- **He is found by ear.** Near the sector-6 lift pad, before it is
  found, a faint **knocking** plays — rhythmic but *human*-irregular
  (the tell grammar holds: organic rhythm is the signature of the true;
  Glycon's things tick in perfect unison, Laennec's knock is warm and
  slightly off). Volume by proximity, through `sfxGain`, haptic light
  tap at close range. He has been signalling the whole time.
- **Rescue is the normal verb.** He walks over and boards like any
  Scion (capacity, sabotage logic, delivery — all untouched); the only
  novelty is *where* he is. Deliver him to MERCY: standard famous reveal
  (+1500) plus a second card — the chart (§5).

## 4. AUSCULTATION (the lift-finder)

- While the upgrade is held: any **unfound** lift pad within ~240 px
  emits a slow expanding ring on the pad (PAL `REVEAL` colour, same
  family as the canon `?` marks) and a soft low chime every few seconds
  (`blip(180…)` family — the pad's own "rings hollow" note, heard from
  the air). Found lifts (already descended this run) just keep their
  existing seams/glint.
- **No map pings, no compass, no HUD arrow.** You still have to fly the
  ground; the upgrade shortens the last 240 px, not the search. This is
  deliberately weaker than Radiosense (a compass) because lifts are
  richer content than boxes — and because the unaided tell must stay
  worth learning (the virtue the owner named).
- Anchor: the lift renderer around the existing `glint` math
  (`drawWorld`'s lift block, ~`index.html:3627`), gated on
  `upgrades.auscult && !L.found`.

## 5. The ROTATION CHART (return travel)

**Fiction:** Laennec hands MERCY his hand-drawn chart of every hollow he
heard through the rock. Comms: *"The lanes behind us are swept, captain.
She'll fly them again — for this."*

**Mechanics:**

- **Unlock:** delivering Laennec (`upgrades.auscult`). Persisted in the
  run snapshot like any upgrade.
- **Where:** a `⟲ ROTATION CHART` pill on the **briefing screen** (the
  natural between-sectors beat — pattern: the existing title pills).
  Travel happens only at sector boundaries; no mid-sector warping.
- **The chart screen** (new `"chart"` state): a row per cleared sector —
  name plus completion glyphs (⚕ famous · ◼ box · lift found · shrine ·
  P's relic if Bundle P is in). Tap a sector → transit beat (reuse the
  briefing teletype, one line: `ROTATION — RETURNING TO <SECTOR>`) →
  arrive in the cached level.
- **"As you left it" — the level cache.** `toBriefing(n)` currently
  regenerates via `genLevel(n)` unconditionally. Add a run-scoped
  `sectorCache[n]` (and `caveCache[ci]` for Hollows): on first clear the
  level object is retained; a chart visit restores it instead of
  regenerating. Delivered Scions stay delivered, dead turrets stay dead,
  taken pods stay taken, found secrets stay found. Memory cost is a few
  KB per level — trivial.
- **Revisit rules (the guards):**
  - `level.cleared = true` on cached levels: `checkSectorClear` and
    `updateExtraction` early-out — the clear bonus and extraction can
    never re-fire. (Anchor: `checkSectorClear`, `updateExtraction`.)
  - Nothing rescueable remains (saved are saved; lost are lost —
    permanently: a famous Scion killed on the first pass is *not*
    recoverable, grief stays grief).
  - Hazards persist: turrets you never silenced still shoot. The
    Hippocratic ledger keeps running — firing on a revisit still sets
    `runFired`/`firedAtCombat`.
  - Black boxes, shrines, relics (P) found on revisit count normally —
    `blackboxCount`, `shrines`, `relicsDone` are already run globals.
  - MERCY is parked in every cached sector as normal: her bay heals and
    refuels, and docking there offers **RESUME ROTATION** (back to the
    briefing you left) or the chart again.
  - Not available in the finale (once sector 7's briefing plays, the
    chart pill hides — the Nullwave is a one-way flight; dramatic
    integrity over convenience).
- **Save/resume compromise (A1):** the mid-sector rule stays —
  checkpoints happen at boundaries, and `sectorCache` is **in-memory
  only**. On a RESUME from `doids_run`, caches are empty: a revisited
  sector regenerates terrain/turrets/pods fresh, but everything that
  *matters* (secrets found, boxes, shrines, relics, upgrades) already
  lives in run globals inside the snapshot, so nothing collectible is
  lost or duplicated. Document the seam; do not serialize level deltas
  in v1.

## 6. The deep Hollows (three new caves)

New lifts under the three mid-sectors that have none, so every sector
1–6 hides one (sector 0 stays clean for the tutorial; the finale stays
clean). `RECIPE[2/4/6].lift = true`; `LIFT_CAVE` grows to
`{1:0, 3:1, 5:2, 2:3, 4:4, 6:5}`. The unaided tell is unchanged
everywhere (seams, rivets, glint, "THE PAD RINGS HOLLOW…"); only cave 5
adds the knocking (§3). `genCave` gains a small per-cave feature table
(`CAVE_FEATURE[ci]`) alongside the existing shrine logic — shrines stay
exactly three; the new caves hold new discovery types:

| Cave | Under | Name | Discovery | Payoff |
|---|---|---|---|---|
| 3 | 2 · Nightingale Basin | **THE WARD** | The muster roll — a scannable ledger by fourteen cots cut into the rock: the first field ward for Scions who answered the Static honestly | +800 · unlocks 4 **WARD NOTES** (new ARCHIVE entries, §7) filling the gap between LOG 03 and LOG 07 |
| 4 | 4 · Curie Fields | **THE MINT** | The press — the machine stamping Glycon's serpent amulets and counterfeit shells, still warm. Shoot it **or** scan it (J's shared `revealSecret` pattern: `firedAtSecret` vs `scannedSecret`) | +800 · "the machine is bent": every remaining counterfeit's perfect-unison blink gains a slow phase drift — a hair easier to read for the rest of the run (a *diagnostic* reward, in the tell language, not a damage buff) |
| 5 | 6 · Jenner Terraces | **THE LISTENING POST** | Laennec himself, plus his wall chart of the deep | +1500 famous · AUSCULTATION · the ROTATION CHART (§4–5) |

Difficulty notes: cave 3 sits under the dark sector and is itself dark —
the lamp matters twice; cave 4 inherits a lurking drone like caves 1–2;
cave 5 has **two** drones patrolling between the lift and Laennec (Glycon
sealed him in; the drones are the seal). All three new caves are eligible
homes for future relics if Bundle P grows (hook noted, not specced).

**Completion:** entering all six Hollows in one run = **EVERY HOLLOW
HEARD** (+1500, Game Center achievement id for the G3 list).

> **Owner direction (July 2026 feedback round — roadmap item S8):** THE WARD
> also inherits the *missing-originals* thread. The Workshop shrine proves
> the Vectors were built, not corrupted — so the genuine Scions they
> impersonate were never rescued and are still missing from MERCY's
> manifest. Direction: beyond the fourteen cots, THE WARD holds **cells** —
> the original units, alive, held where Glycon's copies were fitted to their
> records — and they are recovered with **Bundle P's pendulum sling**
> (slung out through roof and dark, the 1.1 skill given its 1.2 emotional
> payload). The launch build seeds the question only (an ending line and a
> locked `MANIFEST DISCREPANCY` codex row — see S8); integrate the cells
> into §6/§7/§8 of this spec when Q is picked up.

## 7. Narrative delivery (draft copy, house voice)

**Briefing seed** (one sentence, J4/N4 precedent) — BRIEFS[6] only; the
other new hollows stay unseeded, pure secrets:

> *"Ground teams report a knocking under the terraces. Rock does not
> knock, captain."*

**THE WARD — muster roll card** (kicker `THE HOLLOWS · WARD`): *"Fourteen
cots cut into the rock, blankets folded to regulation. The first ward for
the ones who answered honestly.\n\nThey didn't abandon them. They carried
the ones who still ticked.\n\nThe roll is signed. Forgive us the
arithmetic."*

**WARD NOTES** (4 new ARCHIVE entries, `FRAGMENTS`-style, unlocked
together by the muster roll — displayed as `WARD I–IV`):

- `WARD I // We put the quiet ones here. Fourteen cots. They sleep with their eyes open and their hands folded, like they're waiting for rounds.`
- `WARD II // Sister says the rhythm is the tell. Take a pulse before you take a statement.`
- `WARD III / Evacuation tomorrow. The walking ones walk out. The waving ones — we vote at dawn.`
- `WARD IV // Last entry. If anyone reads this: we didn't abandon them. We carried the ones who still ticked.`

**THE MINT — press card** (kicker `THE HOLLOWS · MINT`): *"A stamping
press, still warm. Serpent amulets by the tray — the same charm Alexander
sold while the plague walked Old Earth. His amulets hung over doors where
precautions should have been.\n\nThe machine is bent now. Everything it
already shipped drifts a little further out of true."*

**THE LISTENING POST — the chart card** (second card after Laennec's
standard famous reveal, kicker `THE HOLLOWS · LISTENING POST`): *"A wall
of rock, mapped in a steady hand: every gallery, every seam, every place
the world rings hollow. He couldn't climb out. So he charted, and he
knocked, and he waited for someone who listens.\n\nMERCY has the chart
now. The lanes behind us are open."*

**Codex:** WARD I–IV persist via the existing `doids_logs` machinery
(append to `FRAGMENTS` as indices 14–17 with the `WARD` label styling in
the K2 ARCHIVE list; the title pill count becomes `◈ x/18`). The three
new cave cards persist in `doids_shrines_seen`'s pattern — fold into a
general `doids_cards_seen` or extend the shrine set with new indices;
implementer's choice, K conventions apply.

## 8. Scoring & economy

| Event | Points |
|---|---|
| Muster roll scanned (THE WARD) | +800 (+4 ARCHIVE entries) |
| The press bent (THE MINT, shot or scanned) | +800 (+the unison drift) |
| Laennec delivered | +1500 (standard famous) |
| EVERY HOLLOW HEARD (all six, one run) | +1500 |
| Revisited sectors | no clear bonus, no re-scores — exploration only |

The Hippocratic tension survives intact: the press is a `revealSecret`
secret (shoot = `firedAtSecret`, scan = `scannedSecret`, 6 s exposed),
and revisits keep the no-fire ledger live. Nothing in Q creates a new
score-farming loop: everything collectible is once-per-run.

## 9. Code anchors & task checklist

- [ ] **Q1. New lifts & caves.** `RECIPE[2/4/6].lift = true`;
  `LIFT_CAVE` += `{2:3, 4:4, 6:5}`; `genCave` reads a `CAVE_FEATURE[ci]`
  table (shrine / ward / mint / listening-post) instead of the implicit
  shrine-only branch; drones per §6.
- [ ] **Q2. Laennec.** `FAMOUS` entry (excluded from the M2 remix
  shuffle and the 7-of-11 draw — assert this in tests); spawn in cave 5
  as a normal waiting Scion; the knocking loop near the s6 pad
  (proximity gain through `sfxGain`, light haptic at close range),
  silenced once the lift is found.
- [ ] **Q3. AUSCULTATION.** `upgrades.auscult` gate in the lift
  renderer (ring pulse + chime within 240 px of an unfound pad, PAL
  `REVEAL`); no HUD/compass elements.
- [ ] **Q4. The chart screen.** New `"chart"` state + briefing pill
  (title-pill pattern); rows with completion glyphs; transit line;
  hidden from sector 7 on.
- [ ] **Q5. The level cache.** `sectorCache[n]`/`caveCache[ci]` run
  globals (cleared in `resetRun`); `toBriefing(n)` and `enterCave`
  consult them; `level.cleared` guards in `checkSectorClear` and
  `updateExtraction`; RESUME ROTATION on bay dock in a cached sector.
- [ ] **Q6. New discoveries.** Muster roll + press via the shared
  `revealSecret`/scan patterns (J); the unison-drift flag read by the
  fake-pod / lure-tree / counterfeit renderers (a slow per-entity phase
  offset once bent).
- [ ] **Q7. Copy & codex.** §7 cards; `FRAGMENTS` 14–17 (`WARD I–IV`);
  ARCHIVE list + title pill counts; BRIEFS[6] seed sentence.
- [ ] **Q8. Scoring & achievements.** §8 table; EVERY HOLLOW HEARD
  (run-global `hollowsEntered` Set) added to the G3 achievement list.
- [ ] **Q9. Snapshot.** A1 schema: `hollowsEntered`, card/log sets
  already covered; document the cache-drop-on-resume seam (§5).
- [ ] **Q10. Expose + test.** `__doids.get()` gains `{hollowsEntered,
  chartOpen, cleared}`; `warpLift()` learns the new sectors. Smoke:
  s2/s4/s6 lifts descend; Laennec boards/delivers and sets `auscult`;
  chart returns to a cleared sector with cached state (kill a turret,
  leave, return, assert it's still dead); clear bonus never re-fires;
  remix draw never places Laennec on a surface sector; press drift flag
  set by both shoot and scan paths.

## 10. Dependencies, risk, and P/Q sequencing

Dependencies are all shipped: J (shared reveal), K (codex/ARCHIVE), I
(cave clock already runs in caves), M (seeded generation — new caves
must thread `runSeed` like the rest), A (snapshot). Bundle P is *not* a
dependency — but if both ship, P's relics become recoverable via the
chart, and Q's three new caves are ready homes for a second wave of
relics later.

Highest-risk surface is **Q5, the level cache** — it touches the state
flow (`toBriefing`) that everything else trusts. Mitigations: the cache
is read at exactly two sites, `cleared` guards are early-outs, and the
resume seam is documented rather than solved. Second risk: remix/daily
interactions (Laennec exclusion, seeded new caves) — covered by Q10's
assertions.

## 11. Launch vs. update — recommendation

> **DECIDED (owner, July 2026): locked as the free 1.2 content update —
> "1.2 — THE DEEP HOLLOWS", after Bundle P's 1.1.** Tracked as Bundle Q
> in [APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md). The reasoning below is
> kept as the record of the recommendation the decision followed.

**Free content update, after Bundle P.** Same reasoning as P (nothing
here unblocks submission; the store positioning is "complete game, no
IAP"; updates are the retention and featuring lever) — plus Q is the
larger and riskier of the two (new levels, a new screen, state caching),
so it benefits most from landing on an already-stable shipped base.

Suggested staging: **1.1 — THE PENDULUM** (Bundle P), then **1.2 — THE
DEEP HOLLOWS** (Bundle Q) a cycle later; two named updates beat one, and
each gives lapsed players a distinct reason to redescend. If development
time arrives in one block instead, build Q first *internally* (P's feel
pass needs the native wrapper anyway, §P10) but still stage the releases.
If the owner prefers a single bigger beat: **1.1 — THE HOLLOWS UPDATE**
with both, priced into the $4.99 move.
