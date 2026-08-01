# Hollow Oath — Copy Deck

*Every player-facing string in the game, organised by surface, for owner review
and line edits. Requested in the July 2026 feedback round (roadmap item R10).*

**How to use this document:** edit the copy here (strike, rewrite, annotate),
and the changes get applied back to the code — which stays the source of
truth; this deck is the review surface. Each section names its code anchor (a
function or constant) so edits land in the right place: story tables and
constants live in `js/world.js`, on-screen text in `js/render.js`, run-time
messages in `js/update.js`. Anchors written as `index.html` predate the July
2026 source split — grep `js/` for the name.
**Any PR that changes a player-facing string must update this deck in the same
PR** (see APP_STORE_ROADMAP.md § How to work on this).

**LOCKED (owner decision, July 2026 — roadmap S6):** the player-facing term
for the counterfeit "Scions" is **Vectors**, singular **Vector** — applied
throughout this deck and in `index.html`. Code identifiers stay `"saboteur"`
(the `role` value, variable names) — same rule as the `doids_` prefix.

Landed (July 2026, Bundle T):
- **T6:** BRIEFS[2] (Nightingale Basin) rewritten for staged nightfall (see §7),
  and a new in-flight banner `NIGHT COMES DOWN ON THE BASIN` fires as the dark
  falls (see §8).

Landed (July 2026, Bundle S):
- **S4:** the extraction banner is now `MANIFEST CLOSED — MERCY IS SPOOLING TO
  JUMP / FLY INTO HER VENTRAL HANGAR BEFORE THE STATIC REACHES HER`, with an
  `ABOARD — SECTOR <name> CLOSED` beat on completion (see §8). The S4.5 triage
  card is `SIGNAL EARLY EXTRACTION?` and its next-briefing echo `You left N
  behind on <SECTOR>. The manifest remembers.` (see §4).
- **S5:** BRIEFS[3] gains `Prove a unit false — the salvage teams will take it
  from there. But prove it.`; the scan reads `CATALOGUED — COUNTERFEIT +250` /
  `VITALS VERIFIED — A HEARTBEAT`; HELP_CARD §3 updated. **Owner steer (July
  2026):** the scan is EARNED by rescuing Semmelweis (ANTISEPSIS) and replaces
  the old colour-tint reveal — there is no passive colour tell, only the earned
  active scan and its permanent `?` on a catalogued unit. SEMMELWEIS's
  `upgradeDesc` rewritten accordingly.
- **S7:** a Vector kill is now the banner `A PASSENGER IS DEAD — IT'S IN THE
  CABIN` (was a floating text).
- **S9:** the HELP_CARD cabin-medic line landed in §3.

---

## 1. Title screen (`drawTitle`)

| Line | Copy |
|---|---|
| Wordmark | `Hollow Oath` |
| Tagline (cyan) | `a gravity rescue — a love letter to the 16-bit lander classics` |
| Hook (green) | `seven sectors · something is repeating every 41 seconds` |
| Hook, haunted variant (violet, after an unresolved ending) | `the Static answers still — every 41 seconds` |
| Warning (yellow) | `not every Scion you rescue is what it seems` |
| Launch prompt | `▶ START NEW FLIGHT` (explicit pill; tap-anywhere no longer launches — R5). After a first completion (veteran) it becomes `▼ SOMETHING'S STILL DOWN THERE`, teasing the Hollows — V7 |
| Rotation nudge (gold; shown once, on returning here from a *repeat* completion) | `the sector still turns — try a REMIX ROTATION or the DAILY FLIGHT below` |
| Hi score | `hi score <n>` |
| Controller notice | `🎮 controller connected — stick steers · A thrust · X fire · LB/B shield` |
| Pills | `⚙ SETTINGS` · `✦ HOW TO FLY` · `▸ STORY` · `◎ HUD GUIDE` (U3) · `⚕ <n>/11 · ◈ <n>/14` (codex) · `▶ RESUME — <SECTOR>` · `⟳ REMIX ROTATION` · `☀ DAILY FLIGHT` / `☀ DAILY ✓ <score>` |

## 2. Intro panels (`INTRO`, 5 panels; skippable, replayable via ▸ STORY)

1. **THE MISSION** — "The hospital ship AMS MERCY runs mercy flights through
   the outer systems, one of the second relief wave alongside her sisters AMS
   VIGIL and AMS SUCCOUR. Her holds carry SCIONS — medical androids, each the
   inheritance of generations of human and machine endeavour, carrying true
   medical science forward." *(panel label: `A M S · M E R C Y`; V5 seeds the
   second wave)*
2. **THE CARGO** — "Most are standard units. A few carry something rarer — the
   complete minds of medicine's giants, preserved and still practising. All of
   them are needed where MERCY is headed." *(panel label: `WARD 7 · CRYOSTASIS`)*
3. **THE ZONE** — "The route crosses an interdicted zone: automated defences,
   dead relays, no traffic in living memory. The first wave came this way once
   — the SOLACE among them — and none ever called home." *(V5 seeds the Solace
   & the lost first wave)*
4. **THE FAILURE** — "Mid-crossing, every system aboard failed at once. Cause
   unknown. The recorders kept only one thing: a signal, repeating, every 41
   seconds." *(panel label: `· 41s ·`)*
5. **THE SCATTERING** — "The Scions evacuated in pods and were thrown across
   the zone. MERCY flies again — barely. You fly the rescue. Bring them home.
   And captain… count the heartbeats."

### 2·V8. Veteran opening (`VET_INTRO`, one panel; shown once after a first completion)

**SOMETHING DOESN'T SIT RIGHT** — "You brought them all home." *(or, if the
finished run lost anyone: "You brought N home. M didn't make it." — V13, the
opening line is now built from that run's actual `runSaved`/`runLost` tally,
snapshotted once via `saveLastRunTally()` right as the ending resolves, since
it often wasn't everyone)* "But if all of it — the Vectors, the counterfeits,
the Static itself — grew from a corruption of the Solace's distress call, two
questions were never answered. / Why did her call corrupt? And why did she go
down at all? / Fly it again. Look closer this time."
(the `/` marks are authored `\n\n` breaks — each key sentence starts on its own
line, per DESIGN_SYSTEM_STARTER.md · Copy. The panel shows the **actual
above-ground terrain** around one of the sector's lift pads, rendered exactly as
that level generates it, with the dart parked on the faint pad — no arrow, no
motion; a veteran should recognise the ground and wonder why *this* patch.)
*(replaces the first-run INTRO on a veteran's next fresh run; then veteran runs
launch straight into the tasking. Re-shows after a RESET PROGRESS wipe.)*

### 2·V9. Sound-led sector hook (appended by `briefText()`)

On a **lift-bearing surface sector** (where the pad rings hollow underfoot —
U1), the briefing gains one line. Three sectors carry a lift, so the hook is
**varied per sector** (`SOUND_HOOKS[levelIdx % 3]`) rather than repeating the
same line each time — all in the "something is below" register, none promising
what the pad's hollow ring can't deliver:
- *"And captain… listen when you touch down. Something below the rock is keeping time."*
- *"And captain… is that a sound coming from under the ground?"*
- *"And captain… the ground hums where you land here. Tell me you hear it too."*

## 3. HOW TO FLY guide (`GUIDE` / `GUIDE_PAGES`) — X1

The HOW TO FLY reference is now an **illustrated, paged guide** (Bundle X1): each
page is a labelled diagram of the ship + the real on-screen buttons with one
short caption, not a wall of text. Reached from the title's HELP submenu
(`✦ HOW TO FLY`) and from the X3 first-play "No" branch; reachable any time.
Header on every page: kicker `FLIGHT MANUAL · HOW TO FLY`, per-page title below.

> **TURN** — The two left buttons turn the ship. ↺ spins it left, ↻ spins it
> right. Thrust always pushes the way the nose points — so aim first, then burn.
>
> **THRUST** — Hold THRUST to fire the engine. It's momentum, not a throttle:
> the longer you hold, the faster and further you drift. For a small nudge, tap,
> don't hold.
>
> **SLOW DOWN** — There are no brakes. To slow, turn to face the way you're
> moving and thrust against it. A long fall needs a long burn to arrest — start
> slowing early.
>
> **SHIELD** — Hold SHIELD the instant before you hit rock, a drone or a shot.
> It saves the ship, but it drinks fuel. Raise it late, drop it the moment
> you're clear.
>
> **FUEL** — THRUST and SHIELD both burn FUEL — the yellow bar, top-left. Run
> dry and you're stranded. Land by a Scion or reach MERCY's bay to top up.
>
> **FIRE** — FIRE shoots, but firing is malpractice and costs your rank. Every
> Scion can come home without a shot; keep FIRE for when there's truly no other
> way.
>
> **LAND & RESCUE** — Set down slow and upright on flat ground beside a stranded
> Scion and it climbs aboard. The approach guide turns GREEN when it's safe —
> watch ↓ descent and ↔ drift — then ferry them to MERCY's cyan bay.
>
> **OTHER CONTROLS** — 🎮 Gamepad: stick or d-pad steers, A thrusts, X fires,
> LB/B shields.  ⌨ Keyboard: arrows steer, SPACE thrusts, X fires, C / ⇧ / ↓
> shields.

The guide always paginates: the footer reads `<page>/<pages> · tap for more`
and, on the last page, `<page>/<pages> · tap to fly`. It respects BIG TEXT
(caption scales), REDUCED FLASH (no pulsing footer / softened glow) and
COLORBLIND (the SAFE/WARN semantic colours in the shield/fuel/fire diagrams).

### 3·X3. First-play fork (`updateFork`)

The first time a brand-new player taps `▶ START NEW FLIGHT` (no `doids_trained`),
a one-time fork asks how to route them. Answering either way sets `doids_trained`
so it never shows again (a RESET PROGRESS in Settings brings it back).

> heading `BEFORE YOU FLY`
> prompt `Played a thrust / gravity flying game before?`
> `✓ YES — I know how to fly` · sub `straight into the mission`
> `✦ NO — show me how` · sub `a quick illustrated guide first`
> footnote `you can reopen HOW TO FLY any time from HELP`

**YES** launches straight in (the veteran path — story intro then Level 1).
**NO** routes into the X2 trainee sector below (1.01 — before X2 shipped, "No"
opened the HOW TO FLY guide above instead; the guide is still reachable any
time from HELP).

### 3·X2. Trainee sector guided-pause script (`TRAINING_CARDS`)

A bespoke, always-identical "Level 0": gentle wide terrain, two Scions (the
second added past the turret, owner refinement), one distant avoidable
turret, three fuel pods. Never scored, never ends on its own — the player
leaves via the pause menu's `END TRAINING` row (§12). Reached from the X3
fork's "No" answer, or any time from HELP (`◆ TRAINEE SECTOR`). Each line
below shows as its own tap-to-continue guided-pause card (X4), one-shot and
event-driven rather than purely sequential — the THRUST/drift cards need
real held-thrust time (1.5s) to fire, not just a tap, and FIRE/rescue/low-fuel/
return/refuel each wait for the real on-screen event they teach (a gun in
view, a Scion in view, the tank under a third, a passenger aboard, a
delivery made):

> `Hold THRUST to fight gravity, Captain. The longer you hold it, the faster and further you'll go.`
> `Now add RIGHT while you thrust — keep the UP thrust going too, or you'll sink.`
> `Speed costs fuel to shed. The faster you're moving, the more thrust it takes to stop — watch that tank.`
> `That's a gun. FIRE will drop it — but firing's malpractice, and it costs your rank. Every Scion can come home without a shot.`
> `See that Scion? Set down close and gentle, and it'll climb aboard on its own.`
> `Raise SHIELD the instant before impact. It'll save the ship — but it drinks fuel fast, so don't hold it a second longer than you need.`
> `Tank's getting low. Find a fuel barrel — the yellow ones — and top up before you're stranded.`
> `Good — you've got one aboard. Now fly it home: MERCY's blue recovery bay is where it gets delivered.`
> `While you're docked in the bay, hold there a moment — that tops off your tank too.`

The old "other ways to put a gun down" tease moved out of this script — see
§3·X5 below — since it gated on a parry the trainee sector never teaches.

### 3·X5. Post-death hint-card bank (`HINTS_ALWAYS` / `HINTS_GATED`)

One hint shown on the game-over screen — quoted and attributed to FLIGHT OPS,
in the clear space above `FLATLINE` (owner note: it read squashed wedged
between the tally and the buttons below) — rotating with no repeats until the
bank cycles. Seven are always eligible; five more unlock once the player has
met the system they describe (a parry landed, a scan finished, a counterfeit
pod taken, a Hollow lift found while veteran, AVICENNA's `CANON OF TRUTH`
earned).

> always: `“Thrust is momentum, not a throttle. To stop, thrust the other way.” — FLIGHT OPS`
> always: `“Raise SHIELD right before you hit rock. It'll save the ship — but it drinks fuel fast.” — FLIGHT OPS`
> always: `“Fuel's scarce out here. Once a pod's gone, it's gone.” — FLIGHT OPS`
> always: `“You don't have to fight. Any Scion can come home without a shot fired.” — FLIGHT OPS`
> always: `“A long fall needs a long burn to arrest. Start slowing early, not late.” — FLIGHT OPS`
> always: `“When you only need a nudge, tap. Don't hold.” — FLIGHT OPS`
> always: `“There's more than one way to put a gun down. Shooting it isn't the only one.” — FLIGHT OPS` *(moved here from the X2 training script — it gated on a parry a trainee hasn't been taught yet)*
> after a parry: `“A shield raised at just the right moment turns a shot back on whoever sent it.” — FLIGHT OPS`
> after a scan: `“Land beside a thing and read it. It'll tell you what firing never will.” — FLIGHT OPS`
> after a counterfeit pod: `“Not every fuel pod's a friend. The honest ones flicker like fire — the fakes keep to the Static's beat.” — FLIGHT OPS`
> after a lift (veteran): `“The ground rings hollow in places. There's a way down, if you're listening.” — FLIGHT OPS`
> after Avicenna: `“Your CANON OF TRUTH marks the fakes now. Trust the mark.” — FLIGHT OPS`

### 3·X6. In-app rating prompt — contextual line (`askForRating`)

Apple's native review sheet (`SKStoreReviewController.requestReview`) has its
own fixed OS text that cannot be customized. "Contextual wording" is this
line, shown inside the WIN/GAME OVER panel itself just before the native
prompt fires 1.8s later, in priority order — a new hiscore beats a clean
sweep beats the 5-completed-runs milestone beats a plain answered ending:

> hiscore: `New personal best — enjoying it?`
> clean sweep (an answered ending, no Scion lost): `Every Scion came home. Want others to share your success?`
> 5th completed run (any ending): `Five flights and counting — enjoying it?`

### 3a. WHAT YOU'RE LOOKING AT card (`LEGEND_CARD`, U3)

A companion to HOW TO FLY that names the on-screen readouts. Reached from the
title (`◎ HUD GUIDE` pill, beside HOW TO FLY) and from the PAUSE screen
(`◎ WHAT YOU'RE LOOKING AT` link). Paginates via the same R1 footer.

> kicker `THE HEADS-UP DISPLAY` · title `WHAT YOU'RE LOOKING AT` · subtitle
> `every readout, named`
>
> TOP-LEFT · FUEL — the yellow bar. THRUST and SHIELD both burn it. Empty and
> you're stranded until you signal for a resupply line.
>
> TOP-RIGHT · VITALS — your heartbeat drawn as a live ECG. It quickens and
> reddens as you fail; a stutter (arrhythmia) means something wrong is aboard.
>
> TOP-CENTRE · SCORE — with the sector name, ♥ lives and ◈ black boxes found.
>
> ❚❚ PAUSE — the button just left of the ECG. Tap it, or press ESC / P (gamepad
> START), to pause.
>
> BOTTOM BUTTONS · THRUST · FIRE · SHIELD — thrust burns fuel; FIRE shoots, but
> firing is malpractice and costs you; hold SHIELD for a force field.
>
> LANDING GUIDE — the chevrons under the ship on approach: ↓ is your descent
> rate, ↔ your sideways drift. They turn GREEN when a touchdown is safe. Only
> shown with ASSIST on (toggle in SETTINGS).
>
> THE STATIC CLOCK — from the deep sectors on, a countdown to the 41-second
> surge: the ECG jumps, the sector name corrupts, a caught fuel line rocks.
> Brace or land before it fires.

## 4. Sector briefings (`BRIEFS[0..7]`)

0. **ASCLEPION** — "MERCY to rescue flight. / Routine tasking: the
   convoy scatter left medical units stranded across Asclepion. Land near
   them, bring them home to the recovery bay. / The approach guide turns green
   when it's safe to set down — watch your ↓ descent and ↔ drift. / End
   transmission."
1. **VESALIUS RIDGE** — "Captain… some stranded units on the ridge have
   stopped answering triage pings. Comms has a name for them now: Vectors. /
   Carriers, not survivors. / If a rescue feels wrong — the wave wrong, the
   heartbeat missing — trust your instincts. The red isolation airlock is
   open. Do NOT bring contaminated units into the recovery bay."
2. **NIGHTINGALE BASIN** — "Dust occlusion across the basin, and night coming
   down fast. Your lamp is your lifeline, and theirs. / And captain… the
   dark out here listens back." [T6 — shipped; "Listen for them in the
   dark" cut, found on-device — no audio location tell exists (see
   APP_STORE_ROADMAP.md's parked stereo-beacon idea)]
3. **SEMMELWEIS DEEP** — "Supply lines are cut; the deep is rationed. Scavenge
   surface fuel pods where you find them. / And captain… we found tampering
   in the recovery bay overnight. Watch your passengers. Watch all of them."
   [S5 adds: *"Prove a unit false — the salvage teams will take it from
   there. But prove it."*]
4. **CURIE FIELDS** — "Radiation cells distort gravity across the fields. Fly
   wide of the purple rings. / One more thing. The Static repeats every 41
   seconds. We are close to a bearing — recover the black boxes where you find
   them."
5. **AVICENNA SHOALS** — "Captain… the surface scans are lying to us. Refuel
   points that drain tanks dry. Growths that aren't growths. / Somebody is
   seeding counterfeit salvation across the shoals. Real pods flicker like
   fire; the fakes keep perfect time. / Trust nothing that looks too convenient.
   / And if you won't fire on a lie — land beside it and look at it long
   enough."
6. **JENNER TERRACES** — "Last leg before the nullwave. Ground crews are
   matching patterns across every lure and every tampered unit out here — too
   many to be coincidence. / Whoever's behind this has been at it a long time,
   and hasn't finished. Bring our people home anyway." *(V13 — trimmed so a
   first run doesn't spoil the serpent mark/mask, which LOG 12/13 reveal
   gradually instead.)*
7. **THE NULLWAVE** — "Triangulation complete. The source of the Static is
   below the nullwave ridge. / Fleet orders: destroy on sight. The chief medical
   officer refused to sign. Her note is one line — primum non nocere. / Your
   call, captain." *(V12a — the old "two ships answer as MERCY … count the
   beats" twin warning is cut; the finale twin is no longer signposted, and the
   beat you've learned all game is the only read.)*

Brief-screen furniture: `— INCOMING TRANSMISSION · AMS MERCY —` ·
`REMIX ROTATION // seed <n>` · `DAILY FLIGHT // <n> · yesterday-you: <score>` ·
`TAP TO LAUNCH`. **Z1** appends a gravity label to either mode-line, re-rolled
every sector (owner steer, July 2026 — was one roll for the whole run, and the
~0.7x-1.4x range read as barely different from 1x; now ~0.4x-2.2x): `· crushing
gravity` (gravScale ≥ 1.7), `· heavy world` (≥ 1.05), `· near-weightless`
(≤ 0.5), `· thin gravity` (≤ 0.95) — silent (no label) for a near-1x roll.
**Owner feature:** a per-sector crosswind label can share the line, e.g.
`REMIX ROTATION // seed 12345 · heavy world · → wind` — `· → wind` (pulls
right) or `· ← wind` (pulls left) when the roll's tilt is meaningful, silent
otherwise. The same `→`/`← WIND` glyph appears on the in-flight score line
(`drawHUD`) for the whole sector, not just the one-time briefing.

## 5. Log fragments (`FRAGMENTS[0..13]`; logs 1–10 the Static, 11–14 Glycon)

1. "The convoy scattered after the relay burst. We logged it as a solar flare.
   Nobody checked the waveform."
2. "The burst wasn't natural. It repeats. Forty-one seconds. Always forty-one
   seconds."
3. "Some stranded units stopped answering triage pings. They still walk. They
   still wave. But the rhythm is wrong."
4. "Comms calls it the Static. It doesn't jam a signal. It rewrites the one
   who answers."
5. "Quarantine protocol drafted: any unit with an irregular heartbeat goes to
   the red bay. No exceptions. / Not even friends."
6. "First black box decoded. The Static's waveform matches... us. An old
   MERCY-class distress call, degraded, looping."
7. "It's a voice like ours. Every repeat is a copy of a copy. The rescued
   units corrupt because they answer honestly."
8. "Triangulation at 60%. The echo has a source, somewhere dark beyond the
   last ridge, transmitting on our own frequency."
9. "Fleet drafted destroy-on-sight orders. The CMO refused to sign. She wrote
   one line: primum non nocere."
10. "If it can be silenced without being destroyed, we owe it that. It has
    only ever been repeating a call for help."
11. "The lures aren't scavenger traps. They're placed. Someone wants rescues
    to fail, and wants it to look like bad luck."
12. "Every counterfeit carries the same maker's mark: a coiled serpent wearing
    a human mask. The archive is afraid of the match it found."
13. "Match confirmed. GLYCON — the puppet god of Alexander of Abonoteichus,
    Old Earth, second century. He wrapped a snake in linen and sold false
    plague cures while the plague spread. His amulets hung over doors where
    precautions should have been."
14. "The Static is a wound. Glycon is the hand keeping it open: amplifying
    the echo, farming the fear, selling the cure that kills. / Unmask him. Then
    answer the wound."

## 6. Shrine cards (`SHRINES`, one per Hollow)

1. **THE HOLLOWS · RELAY — IT ISN'T AN ECHO** — "A transmitter, hand-built
   into the rock. Not wreckage. Not corrosion. / Something down here is
   BOOSTING the Static — aiming it along the rescue lanes, keeping the wound
   open on purpose. / Scratched into the casing: a coiled serpent wearing a
   human mask."
2. **THE HOLLOWS · WORKSHOP — THEY WERE NEVER RESCUED** — "Racks of
   half-finished Scions. Dull chests. No hearts to tick. / The Vectors were
   never rescued units. Not corrupted. Hollow. Built empty, and dressed to be
   carried home in good faith. / The same serpent mark on every chassis."
3. **THE HOLLOWS · SHRINE — GLYCON** — "A shrine to a serpent with a human
   face. / Old Earth archive match: GLYCON — the puppet god of Alexander of
   Abonoteichus, a second-century charlatan who sold fake plague cures while
   the plague spread. Hope as bait. / Graves as yield. / Someone out here found
   his playbook. The Static is a wound; Glycon is the infection that keeps it
   open — counterfeit rescuers, counterfeit fuel, counterfeit hope. /
   Scratched beneath the idol, in the maker's own hand: *'An oath you never
   test is easy to keep.'*"

Shrine card kicker suffix: `· SECRET +1000`; all three found appends:
"★ GLYCON UNMASKED — the whole counterfeit laid bare. +3000".

## 7. Famous Scion reveal cards (`FAMOUS`; kicker `RESCUED · +1500`)

Format on card: story + `★ UPGRADE NAME — upgrade description`.

| Mind | Era | Story | Upgrade |
|---|---|---|---|
| HIPPOCRATES OF KOS | c. 460–370 BC | "The physician of Kos, whose oath still binds medicine twenty-four centuries on: first, do no harm." | **GENTLE TOUCH** — "Hard landings now do far less damage to your hull." |
| ANDREAS VESALIUS | 1514–1564 | "He looked inside the body for himself and rewrote anatomy — his Fabrica corrected a thousand years of guesswork." | **FABRICA HULL** — "Maximum vitals raised to 125." |
| FLORENCE NIGHTINGALE | 1820–1910 | "The Lady with the Lamp — she proved with statistics that sanitation saves more soldiers than surgery." | **THE LAMP** — "Your light reaches much further in the dark." |
| IGNAZ SEMMELWEIS | 1818–1865 | "He begged surgeons to wash their hands and saved countless mothers. He was ignored for decades." | **ANTISEPSIS** — "Vectors are now revealed by a sickly tint. You can see the contamination." |
| MARIE CURIE | 1867–1934 | "Twice a Nobel laureate; she drove X-ray units to the front lines herself in the First World War." | **RADIOSENSE** — "A compass now points toward unrecovered black boxes." |
| IBN SINA · AVICENNA | 980–1037 | "The Persian polymath whose Canon of Medicine taught physicians on three continents for six hundred years — observation, evidence, and honest doubt." | **CANON OF TRUTH** — "Counterfeits are unmasked — the counterfeiter's lures and lure-trees are marked for what they are." |
| EDWARD JENNER | 1749–1823 | "He noticed milkmaids who'd had cowpox never caught smallpox, and turned one careful observation into vaccination, the greatest life-saver medicine has known." | **INOCULATION** — "Your passengers are immunised — Vectors aboard can no longer kill them." |
| ELIZABETH BLACKWELL | 1821–1910 | "Rejected by ten medical schools for being a woman, she graduated first in her class anyway: the first woman M.D. in America. Then she opened the door for every one who followed." | **OPEN DOORS** — "MERCY's bay doors open wider — dock at approach speeds that would once have waved you off." |
| RUDOLF VIRCHOW | 1821–1902 | "The father of cellular pathology — omnis cellula e cellula — who insisted every disease begins somewhere specific, and that medicine's job is to look until it finds where." | **CELL DOCTRINE** — "Diagnosis comes faster — black boxes, shrines and counterfeit scans complete in two-thirds the time." |
| ALEXANDER FLEMING | 1881–1955 | "He came back from holiday to a spoiled culture plate and, instead of binning it, looked closer: the mould was killing the bacteria. Penicillin began as a noticed accident." | **PENICILLIN** — "Your hull cultures its own repair — vitals slowly self-heal while below half." |
| RITA LEVI-MONTALCINI | 1909–2012 | "Barred from her university by fascist race laws, she built a laboratory in her bedroom and kept working, and discovered nerve growth factor, how living tissue is told to grow." | **GROWTH FACTOR** — "Fuel cells grow denser — tank capacity raised to 120." |

## 8. In-flight banners (`banner()` call sites)

| Trigger | Copy |
|---|---|
| Controller connects | `CONTROLLER CONNECTED` |
| Sector start | `<SECTOR NAME>` |
| Lift descent | `SECRET LIFT — DESCENDING INTO THE HOLLOWS` |
| Cave exit | `SURFACE — <SECTOR NAME>` |
| Nightfall on the Basin (T6) | `NIGHT COMES DOWN ON THE BASIN` |
| Manifest closes | `MANIFEST CLOSED — MERCY IS SPOOLING TO JUMP` / `FLY INTO HER VENTRAL HANGAR BEFORE THE STATIC REACHES HER` *(S4 wording; the pre-S4 line was "DOCK IN THE RECOVERY BAY…")* |
| Breach — retrieve | `VECTOR RETRIEVED — CARRY IT TO THE RED ISOLATION BAY` / `IT WILL FIGHT YOU — LET GO OF THE CONTROLS TO RESTRAIN IT` *(E1/E2 rewrote the old "SECURITY BREACH ABOARD MERCY / DOCK AT THE RED BAY TO CONTAIN IT" pair; the live HUD prompts are `⚠ BREACH — RETRIEVE AT THE RECOVERY BAY <n>s` and `⚠ CARRY IT TO THE RED ISOLATION BAY`)* |
| Breach contained | `CONTAMINANT SEALED IN ISOLATION  +750` / `LOCKDOWN LIFTED` *(E4: an infected Scion instead reads `INFECTED SCION CURED IN ISOLATION  +750` / `RETURNED TO THE MANIFEST`)* |
| Breach failed | `RECOVERY BAY SABOTAGED  -1000 / HEALING OFFLINE THIS SECTOR` |
| Famous Scion boards | `SOMEONE EXTRAORDINARY IS ABOARD…` |
| Transfusion line snaps | `LINE SEVERED — REMAINDER LOST  -50 / SIGNAL AGAIN IF YOU NEED IT` |
| Transfusion window closes | `TRANSFUSION WINDOW CLOSED — SIGNAL AGAIN IF NEEDED` |
| First field resupply (V18, one-time) | `YOU'RE NOT ALONE. HELP IS ON THE WAY. BUT THERE IS A PRICE.` |
| Scuttle fired | `SCUTTLED IN THE HOLLOWS` underground; `SCUTTLED — NO CLIMBING OUT OF THAT ONE` on the surface (July 2026 — the surface scuttle is new; the Hollows line only ever fitted underground) |

### 8b. Stranded-at-zero-fuel prompts (`drawShip`)

Shown on the ship when landed with an empty tank and no drone inbound.

| Where | Copy |
|---|---|
| Surface, landed | `OUT OF FUEL — HOLD THRUST TO SIGNAL` and, below it in gold, `OR HOLD SHIELD TO SCUTTLE` *(July 2026 — the second line is new. THRUST calls the drone as before; SHIELD is a no-op at zero fuel, so it's free to carry the escape hatch. Both are offered; the player picks.)* |
| Surface, airborne | `OUT OF FUEL — SET DOWN TO SIGNAL` / `OR HOLD SHIELD TO SCUTTLE` *(July 2026 — the drone only answers a ship that has set down, and a gravity anomaly can hold a fuel-dry ship aloft indefinitely, so the prompt has to appear and the scuttle has to work while airborne)* |
| Hollows | `SIGNAL NOT RECEIVED — THE ROCK SWALLOWS IT` / `HOLD THRUST TO SCUTTLE` *(no drone reaches underground, so THRUST arms the charge directly)* |

## 9. Floating texts (`addText()` call sites)

`SHIP FULL` · `SCION ABOARD +500` · `◇ CARRYING DATA` · `DELIVERED +300` ·
`LOG FRAGMENT RECOVERED` · `FUEL +35` ·
`COUNTERFEIT — SOMEBODY'S LURE  -100` · `FUEL DRAINED -18` ·
`LURE-TREE DESTROYED` / `LURE-TREE READ FOR WHAT IT IS — COUNTERFEIT
TRANSMITTER +500` ·
`COUNTERFEIT POD DESTROYED` / `COUNTERFEIT POD READ FOR WHAT IT IS +200`
(owner feature: once CANON OF TRUTH marks a fake pod, scanning or shooting it
resolves it cleanly instead of only finding out by touching it) ·
`HIDDEN CACHE +400 — someone didn't want this found` · `SHIELD BOUNCE` ·
`SHIELD HELD` · `HARD LANDING -<n>` · `-40` / `-26` (hit damage) ·
`+250` / `+150` (turret / drone) · `FUEL LINE CUT` [S7 promotes] ·
`PASSENGER KILLED BY VECTOR` [S7 promotes to banner; draft: `A
PASSENGER IS DEAD — IT'S IN THE CABIN`] · `YOU LOST <FAMOUS NAME>` ·
`THE STATIC SURGES` · `THE SURGE ROCKS THE LINE` ·
`PRIMER MIST — FLY TO THE LINE` · `-<n>` (U2 running resupply toll, drained
live as the tank fills) · `TANK TOPPED — RESUPPLY COST -<n>` (U2, replaces the
old `CLEAN LINE +250`) · `LINE RELEASED — FUEL +<n>  ·  -<n>` (U2) ·
`THE PAD RINGS HOLLOW…` · `SCANNING…` · `SCANNING… hold position` ·
`SIGNAL FLATTENED — CATALOGUED +250` (V6 — parry a Vector's sonic wave with the
shield to catalogue it, no shot)

## 10. Discovery & finale cards (`showCard` call sites)

- **Solace reveal (V3/V6)** — on examining the finale source, kicker
  `AMS SOLACE · MERCY'S LOST SISTER`, title `STILL TRANSMITTING`: "Her distress
  call never stopped looping — years of it, alone out here in the dark. / It
  isn't asking to be silenced. It's asking to be answered. / The signal seeks a
  response." *(A clue, not an instruction — the player discovers that "a
  response" means parrying her pulse. Replaces the old cross-screen "raise
  shield" banner. **Two triggers** (July 2026): landing beside her, or parrying
  the pulse she loops on approach — a parry before she's named earns this card
  rather than resolving her, so the card can never land after its own payoff.)*
- **Black box** — kicker `BLACK BOX RECOVERED · SIGNAL <n>/7 · +800`; body =
  the log fragment, or "The recorder is blank — wiped clean. Someone got here
  first."; footer: "◈ Triangulation viable. Keep flying." / "◈ Recover at
  least 3 of 7 to triangulate the source."
- **Log fragment (sector clear)** — kicker `LOG FRAGMENT RECOVERED`.
- **Counterfeit MERCY, docked (the trap)** *(V15 — a tap-gated panel, not the
  transient banner it used to be; holds until dismissed, then `shipDie()`
  runs)* — kicker `THE THIRD ACT`, title `THE BAY IS A MOUTH`: "No healing.
  No fuel. A hull with nothing inside but appetite — wearing the one shape
  you stopped checking. / He built a better lure this time. He built the
  thing you trust." A new `swallow()` SFX (a lower, wetter `hydraulic()`)
  fires the instant the trap closes, before the panel appears.
- **Counterfeit MERCY, identified without docking** — kicker `COUNTERFEIT
  IDENTIFIED · +800`, title `MACHINE TIME`: "Her emblem pulses like a pulse.
  Its emblem keeps perfect time. / You counted the beats. He never learned a
  heartbeat."

## 11. Sector clear, endings, epilogue, ranks

- **Sector clear** (`drawClear`): `<SECTOR> CLEAR` · optional
  `PRIMUM NON NOCERE — Hippocratic bonus +2000` · optional `EVERY TRIP COUNTED
  — efficiency bonus +1000` (owner feature: every rescued Scion delivered in
  the minimum possible number of MERCY-bay trips for the sector's Scion count)
  · `⏱ STOPWATCH BEAT +500` · `saved <n>/<n> · ✝ lost <n>` · `(a signal source
  went unfound in this sector)` · `tap to continue`.
- **Epilogue** (`EPILOGUE_LINE`): `AMS SOLACE · crew manifest 214 · status:
  HEARD.`
- **THE ANSWERED CALL** — "You landed beside it and listened. / The beacon was
  AMS SOLACE — MERCY's sister ship, lost with all hands, her distress call
  looping for years. Every Scion that answered honestly was rewritten by the
  echo. / You didn't silence her. You told her she was heard. / The Static
  faded like a fever breaking. / +6000 [· OATH KEPT +2000]" — plus "The oath,
  kept whole." (no-fire) or "You found what he hid. It cost you the oath to
  do it." (secrets-only fire).
- **SILENCE BY FIRE** (the bad ending — take the destroy-on-sight order the CMO
  refused to sign, and shoot the Solace down. The kill plays out in beats: the
  glow ignites on her exposed broadcast tower, the red heat flows DOWN below the
  ground to draw out her buried hull — a MERCY-class *sister*, not a clone — we
  get a beat to realise the shape, then she blows in a shower of sparks and
  leaves a smoking crater) — "The signal stops. The Static is gone, and MERCY can
  continue. / But the CMO is very quiet. / That was no surprise outpost. No
  enemy relay. That was one of ours. / AMS SOLACE — crew of 214 — silenced, not
  answered. / The SOLACE deserved better. / +3000" (rank: `SECTOR WARDEN`)
- **ROTATION COMPLETE** (unresolved) — "The tour is over and the rescued are
  home. / But on the long ride back, under everything, the Static is still
  there. Repeating. / Left hollow. The Static answers still. / ◈ Black boxes
  recovered: <n>/7 — recover at least 3 to triangulate its source."
- **Glycon epilogue** (all shrines): "And in the fleet record, appended in
  your hand: the serpent's mask, catalogued for good. No one will buy his
  cures again." — plus, if the decoy was observed: "Even his best lure — the
  second MERCY — failed the moment you counted her heartbeat."
- **[S8 pending]** Workshop-seen ending addendum, draft: "And one line nobody
  signs off: if the counterfeits were never our Scions — where are ours?
  MERCY's manifest still lists the missing."
- **Win screen** (`drawWin`): `MISSION COMPLETE` / `A PERFECT ROTATION` ·
  `score <n> · hi <n>` · `saved <n> · ✝ lost <n> · ◈ <n>/7 · logs <n>/14` ·
  `spotless record — no Scion lost` · `☤ the serpent unmasked` ·
  `rank: <RANK>` · `tap to play again`. Ranks: `OATH KEEPER — PRIMUM NON
  NOCERE [· EYES OPEN]` · `HOLLOW KEEPER` · `THE ONE WHO ANSWERED` ·
  `SECTOR WARDEN` · `FLIGHT SURGEON, MERCY RESCUE DIVISION`.
- **Game over** (`drawGameOver`): `FLATLINE` · `GAME OVER — saved <n> · ✝ lost
  <n>` · `CONTINUE — <SECTOR>` / `<n> LIVES · -25% SCORE` · `MAIN MENU` ·
  `tap to return to the menu`.

## 12. Menus & system UI

- **Pause** (`drawPause`): `PAUSED` · `RESUME` · `RESTART SECTOR` ·
  `SETTINGS` · `QUIT TO TITLE` · `◎ WHAT YOU'RE LOOKING AT` (link into the HUD
  legend, U3). In the X2 trainee sector, the two run-scoped rows relabel to
  `RESTART TRAINING` and `END TRAINING` — the plain way to leave.
- **HELP submenu** (`drawHelpMenu`): `HELP` · rows `✦ HOW TO FLY` "controls &
  the basics" · `◎ HUD GUIDE` "what every readout means" · `▸ REPLAY STORY`
  "watch the opening again" · `◆ TRAINEE SECTOR` "one gentle, unscored rescue"
  (X2) · footer "tap outside to go back".
- **Settings** (`drawSettings`): `SETTINGS` · rows `SOUND / MUSIC / HAPTICS /
  ASSIST / COLORBLIND / FIELD MEDIC / BIG TEXT / REDUCED FLASH · ON|OFF`
  (TILT pulled for now — see APP_STORE_ROADMAP.md; re-add once a native
  CoreMotion bridge exists)
  · `USE CONTROLLER · ON|OFF` (disabled, reads `CONTROLLER · NONE`, when no
  gamepad is paired — a webpage can't force-disconnect a Bluetooth
  controller, so this is the practical stand-in: defaults ON the instant one
  connects, whether at boot or mid-play; switching it OFF stops the game
  reading the pad and brings touch controls back; a real disconnect always
  resets it to ON for next time. Doubles as a "yes, the game sees your
  controller" indicator)
  · `RESET PROGRESS` → `TAP AGAIN TO WIPE` · footers "field medic: gentler, 5
  lives, next run · reset wipes scores & codex, keeps settings" and "Hollow
  Oath · v1.0 · b2026-07 · no ads, no tracking · tap outside to close".
- **Codex** (`drawCodex`): `MEDICAL CODEX` · tabs `⚕ MINDS` / `◈ ARCHIVE` ·
  "the minds recovered · <n>/11 · all runs" · `UNIDENTIFIED` / "somewhere out
  there" / "not yet rescued" · `★ <UPGRADE>` · "the signal record · <n>/14
  logs · <n>/3 shrines · page <n>/<n>" · `LOG 07` + "— signal not yet
  recovered —" · `THE HOLLOWS · I/II/III` + "— not yet descended —" · footer
  "tap an entry to read · tap outside to close" (or "tap outside to close"
  when nothing is unlocked yet). Paging is via `‹` / `›` corner arrows; tapping
  a recovered entry opens its reveal card (`FROM THE CODEX` for a mind, the
  full log / shrine card for the archive) — any tap there returns to the codex (R7).
  [S8 adds locked row: `MANIFEST DISCREPANCY // — file remains open —`]
- **Daily modifiers** (`DAILY_MODS`, shown inside the briefing as "TODAY'S
  CONDITIONS — …"): `RATIONED TANK` "fuel cells run at 70% capacity" ·
  `SURGE FRONT` "the 41-second clock runs in every sector" · `CROWDED SKY`
  "two extra hunter drones per sector" · `SLEEPER CELL` "every Vector is a
  sleeper — listen closely" · `BLACKOUT ROTATION` "every sector is dark;
  fly by lamp" · `STOPWATCH` "clear each sector under 90s for +500".
- **HUD micro-labels** (`drawHUD` and friends): `FUEL`, the ECG bar, sector
  name, `❚❚` (pause), landing-guide reason text and `✓ / ! / ✕` glyphs,
  `CODEX` pill glyph `⚕`.
- **A2HS banner / portrait prompt**: install prompt text and the rotate-device
  prompt (in the HTML/IIFE near `#a2hs`).

## 12a. Act Two — the descent (Bundle P · P·slice)

**Not reachable in normal play.** Act Two is behind `__doids.loadChamber("slice")`
until P·content and P·persist wire it into the campaign, so none of this has
shipped to a player. It is here because the house rule is that copy lands in the
deck in the same PR as the code (R10), and because the voice of Act Two is worth
reviewing *before* ten chambers are authored against it.

Voice notes for review: Act Two is triage, not *primum non nocere*
([ACT_TWO_SPEC.md](ACT_TWO_SPEC.md) §7), so the lines are shorter and more
clinical than Act One's, and they name the cost out loud. Nothing here says
"points" — the **transfusion** is never billed in score (§7.4): giving your own
vitals is care, not a mistake. That is the *only* thing this exemption covers.
A broader "Act Two never bills the player" line stood here until July 2026 and
was an assistant's assumption, not an owner decision: **failures do cost
points** down here, and every impact on a rack is charged per impact. See
APP_STORE_ROADMAP.md, Bundle P · P·systems, for the ladder as decided.

### Banners (`banner()`, `js/acttwo-update.js`)

| Trigger | Copy |
|---|---|
| Closing the rack's real trunk feed | `FEED CLOSED — BANK ON INTERNAL RESERVE` / `IT IS DYING NOW. GET IT TO THE WELL.` |
| Closing one of his decoy lines | `DEAD LINE — NOTHING WAS ON THE END OF IT` / `HE KNOWS SOMEONE IS DOWN HERE NOW` |
| Cradling a rack for the first time | `CRADLED — SHE HANGS BELOW YOU NOW` / `FIRE RELEASES. EVERY SLAM IS FELT BY EVERYONE IN THE BOX.` |
| First transfusion into a rack | `YOUR OWN VITALS, INTO THEIRS` / `THERE IS NO MERCY DOWN HERE. YOU ARE THE SUPPLY.` |
| Reserve reaches zero | `FLATLINE — THE BANK IS GONE` + `THEY DON'T COME BACK. THIS FLOOR STARTS OVER.` |
| A slam finishes a failing rack | `THE LAST SLAM DID IT — THE BANK IS GONE` + `THEY DON'T COME BACK. THIS FLOOR STARTS OVER.` |
| Shooting a live feed (§7.1) | `THE FEED IS CUT — YOU SHOT THEIR LIFE SUPPORT` + `THEY DON'T COME BACK. THIS FLOOR STARTS OVER.` |
| Delivered at THE WELL | `ABOARD — <n> SOULS, AND SHE CAN STOP NOW` + either `· GENTLE HANDS — NOT ONE SLAM` or `INTEGRITY <n>%` |
| Respawning after a death in a chamber | `BACK IN — THEY ARE STILL DOWN HERE, AND STILL DYING` |
| Entering a chamber (`loadChamber`, `js/render.js`) | `<INTAKE>` / `<1> BANK ON THIS FLOOR · <WEST>` |

The entry banner is **navigation and nothing else** (owner, August 2026, after
arriving in a 9000px room with no idea which way to go). It names the floor,
counts the banks and gives the direction — and deliberately says nothing about
*which* bank is real, because pointing at that would delete §7.1's deduction.
The name and the direction are both derived (the chamber's own `name`, and the
side the racks are on relative to the entry), so it needs no re-authoring per
chamber. It sits in `loadChamber` only because that is currently the sole way
in; it belongs at the real entry once P·persist/P·content build one.
| Landing beside one of his decoy boxes | `NOBODY IN IT — AND IT WAS WAITING FOR YOU` / `HIS BOXES BLEED YOU FOR LOOKING` |

The flatline line was `THE CHAMBER IS THE UNIT OF RETRY` until the July 2026
owner round, which is a sentence out of the design doc and meant nothing read off
a phone. It now says what it was shorthand for. Worth keeping as a reminder that
internal vocabulary reads as jargon the moment it reaches a banner.

### Floating texts (`addText()`)

| Trigger | Copy |
|---|---|
| Landing beside an isolator, first time | `HOLD TO CLOSE THIS FEED` |
| The 41s beat takes its bite from a rack | `THE BEAT TOOK MORE` |
| A decoy line, at the isolator | `HIS LINE` |
| Shooting an already-dead line | `DEAD LINE` |
| A slam, above the rack | `-<n>` |
| Releasing the load | `RELEASED` |
| Letting go of the transfusion | `LINE CLOSED` |
| Drifting off the line | `LINE PARTED — YOU DRIFTED` |
| Hitting the vitals floor mid-transfusion | `YOU ARE THE CASUALTY NOW — LINE CLOSED` |
| One line's ceiling reached (§7.4's diminishing returns) | `THAT IS ALL THIS LINE WILL CARRY` |
| Taking a fuel can | `+<n> FUEL` |
| The moorings give way under sustained thrust | `MOUNTS PARTED` |
| Putting the hull into rock in a chamber | `IMPACT -<n>` |
| Landing beside a decoy box | `-<n> VITALS` |

And one PROMPT, drawn on the rack rather than pushed through `addText` — the
owner asked how you were even meant to connect, because proximity-while-landed
rigged the sling with no act on the player's part:

| Where | Copy |
|---|---|
| Above a cut, moored rack you are not standing on | `LAND ON IT TO RIG THE SLING` |

A slam's "yells from within" are deliberately **not** copy: the owner chose an
audio cue, a shudder and haptics over text or emoji (`muffledCry`, js/audio.js).
The game reads lives off rhythm, never captions.

Those four are all closing lines for the same transfusion, so `endGive` appends
the same suffix to whichever one fired: ` · +` and the reserve actually delivered,
rounded. Quoted above without it because the message and the suffix are separate
literals in the source — the deck's drift guard compares against `js/`, and a
row that quotes the assembled sentence matches nothing.

### World labels (`js/acttwo-render.js`)

| Element | Copy |
|---|---|
| Trunk-cut progress ring | `CLOSING…` |
| Cradle progress ring | `CRADLING…` |
| Isolator, live / closed | `ISOLATOR <n>` / `ISOLATOR <n> · CLOSED` |
| Rack label | `BANK 1 · 10 SOULS` |
| The docking bay | `THE WELL — LOWERED FROM MERCY` |
| Swing tell at the tether midpoint | `✓` docile · `!` swinging · `✕` about to hurt (glyphs, per the H2 shape-redundancy rule) |

## 13. Store & Game Center copy (reference only)

Achievement earned/pre-earned descriptions live in
[GAMECENTER_ACHIEVEMENTS.md](GAMECENTER_ACHIEVEMENTS.md); App Store metadata
drafts live in APP_STORE_ROADMAP.md § O2. Both follow the E7 trademark tiers.
