# Hollow Oath — Copy Deck

*Every player-facing string in the game, organised by surface, for owner review
and line edits. Requested in the July 2026 feedback round (roadmap item R10).*

**How to use this document:** edit the copy here (strike, rewrite, annotate),
and the changes get applied back to `index.html` — the code stays the source of
truth, this deck is the review surface. Each section names its code anchor
(function or constant in `index.html`) so edits land in the right place.
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
| Launch prompt | `▶ START NEW FLIGHT` (explicit pill; tap-anywhere no longer launches — R5) |
| Hi score | `hi score <n>` |
| Controller notice | `🎮 controller connected — stick steers · A thrust · X fire · LB/B shield` |
| Pills | `⚙ SETTINGS` · `✦ HOW TO FLY` · `▸ STORY` · `◎ HUD GUIDE` (U3) · `⚕ <n>/11 · ◈ <n>/14` (codex) · `▶ RESUME — <SECTOR>` · `⟳ REMIX ROTATION` · `☀ DAILY FLIGHT` / `☀ DAILY ✓ <score>` |

## 2. Intro panels (`INTRO`, 5 panels; skippable, replayable via ▸ STORY)

1. **THE MISSION** — "The hospital ship AMS MERCY runs mercy flights through
   the outer systems. Her holds carry SCIONS — medical androids, each the
   inheritance of generations of human and machine endeavour, carrying true
   medical science forward." *(panel label: `A M S · M E R C Y`)*
2. **THE CARGO** — "Most are standard units. A few carry something rarer — the
   complete minds of medicine's giants, preserved and still practising. All of
   them are needed where MERCY is headed." *(panel label: `WARD 7 · CRYOSTASIS`)*
3. **THE ZONE** — "The route crosses an interdicted zone — automated defences,
   dead relays, no traffic in living memory. Nobody remembers who they were
   built to keep out."
4. **THE FAILURE** — "Mid-crossing, every system aboard failed at once. Cause
   unknown. The recorders kept only one thing: a signal, repeating, every 41
   seconds." *(panel label: `· 41s ·`)*
5. **THE SCATTERING** — "The Scions evacuated in pods and were thrown across
   the zone. MERCY flies again — barely. You fly the rescue. Bring them home.
   And captain… count the heartbeats."

## 3. HOW TO FLY card (`HELP_CARD`)

> kicker `FLIGHT MANUAL` · title `HOW TO FLY`
>
> Left buttons rotate. THRUST burns fuel. FIRE shoots. SHIELD (hold) raises a
> force field — it eats fuel, but stops bullets, drones, rough landings and
> cave ceilings.
>
> Land slow and upright on flat ground near a stranded Scion — it walks over
> and climbs aboard. The approach guide turns GREEN when touchdown is safe;
> watch ↓ descent and ↔ drift.
>
> Ferry Scions to MERCY's cyan RECOVERY BAY to deliver, refuel and heal. The
> RED BAY is isolation — you'll know when you need it.
>
> Listen to what boards. Watch how they wave. Watch your own ECG. A full cabin
> steadies you, a little, between drop-offs. _(S9)_
>
> Suspect a unit? Park right on top of it and hold still to read its vitals — a
> real Scion's heartbeat verifies and it boards; a proven counterfeit is
> catalogued and can be left where it lies. Land a step away instead to rescue
> at speed. _(S5)_
>
> ◈ The zone hides black boxes, log fragments and famous healers — and
> stranger things. Some ground rings hollow under your struts. Real fuel pods
> flicker like fire; counterfeits keep perfect time. A counterfeit can be
> opened by fire — or unmasked without a shot: land beside it and hold still
> long enough. Explore.
>
> 🎮 Gamepads work: stick or d-pad steers, A thrusts, X fires, LB/B shields.
> Keyboard: arrows + space · X fire · C/⇧/↓ shield. TILT steering can be
> switched on in SETTINGS.

On a short landscape phone this card paginates (R1): the footer reads
`<page>/<pages> · tap for more` and, on the last page, `<page>/<pages> · tap to
continue`. Short cards show a single `tap to continue` as before.

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
> rate, ↔ your sideways drift. They turn GREEN when a touchdown is safe.
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
1. **VESALIUS RIDGE** — "Captain — some stranded units on the ridge have
   stopped answering triage pings. Comms has a name for them now: Vectors.
   Carriers, not survivors. / If a rescue feels wrong — the wave wrong, the
   heartbeat missing — trust your instincts. The red quarantine bay is open.
   Do NOT bring contaminated units into the recovery bay."
2. **NIGHTINGALE BASIN** — "Dust occlusion across the basin — and night coming
   down fast. Your lamp is your lifeline, and theirs. Listen for them in the
   dark. / And captain… the dark out here listens back." [T6 — shipped]
3. **SEMMELWEIS DEEP** — "Supply lines are cut; the deep is rationed. Scavenge
   surface fuel pods where you find them. / And captain — we found tampering
   in the recovery bay overnight. Watch your passengers. Watch all of them."
   [S5 adds: *"Prove a unit false — the salvage teams will take it from
   there. But prove it."*]
4. **CURIE FIELDS** — "Radiation cells distort gravity across the fields. Fly
   wide of the purple rings. / One more thing. The Static repeats every 41
   seconds. We are close to a bearing — recover the black boxes where you find
   them."
5. **AVICENNA SHOALS** — "Captain — the surface scans are lying to us. Refuel
   points that drain tanks dry. Growths that aren't growths. / Somebody is
   seeding counterfeit salvation across the shoals. Real pods flicker like
   fire; the fakes keep perfect time. Trust nothing that looks too convenient.
   / And if you won't fire on a lie — land beside it and look at it long
   enough."
6. **JENNER TERRACES** — "Last leg before the nullwave. The counterfeiter has a
   mark now — ground crews found the same coiled serpent stamped on every lure
   and every tampered unit. / Archive is still matching it. Whoever wears that
   mask has been rewriting rescue into ruin for a long time. Bring our people
   home anyway."
7. **THE NULLWAVE** — "Triangulation complete. The source of the Static is
   below the nullwave ridge. / One more thing. Two beacons answer as MERCY on
   approach. One of them is lying. Count the beats, captain. / Fleet orders:
   destroy on sight. The chief medical officer refused to sign. Her note is
   one line — primum non nocere. / Your call, captain."

Brief-screen furniture: `— INCOMING TRANSMISSION · AMS MERCY —` ·
`REMIX ROTATION // seed <n>` · `DAILY FLIGHT // <n> · yesterday-you: <score>` ·
`TAP TO LAUNCH`.

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
   the red bay. No exceptions. Not even friends."
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
    to fail — and wants it to look like bad luck."
12. "Every counterfeit carries the same maker's mark: a coiled serpent wearing
    a human mask. The archive is afraid of the match it found."
13. "Match confirmed. GLYCON — the puppet god of Alexander of Abonoteichus,
    Old Earth, second century. He wrapped a snake in linen and sold false
    plague cures while the plague spread. His amulets hung over doors where
    precautions should have been."
14. "The Static is a wound. Glycon is the hand keeping it open — amplifying
    the echo, farming the fear, selling the cure that kills. Unmask him. Then
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
   the plague spread. Hope as bait. Graves as yield. / Someone out here found
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
| IGNAZ SEMMELWEIS | 1818–1865 | "He begged surgeons to wash their hands and saved countless mothers — and was ignored for decades." | **ANTISEPSIS** — "Vectors are now revealed by a sickly tint. You can see the contamination." |
| MARIE CURIE | 1867–1934 | "Twice a Nobel laureate; she drove X-ray units to the front lines herself in the First World War." | **RADIOSENSE** — "A compass now points toward unrecovered black boxes." |
| IBN SINA · AVICENNA | 980–1037 | "The Persian polymath whose Canon of Medicine taught physicians on three continents for six hundred years — observation, evidence, and honest doubt." | **CANON OF TRUTH** — "Counterfeits are unmasked — the counterfeiter's lures and lure-trees are marked for what they are." |
| EDWARD JENNER | 1749–1823 | "He noticed milkmaids who caught cowpox never took smallpox — and turned one careful observation into vaccination, the greatest life-saver medicine has known." | **INOCULATION** — "Your passengers are immunised — Vectors aboard can no longer kill them." |
| ELIZABETH BLACKWELL | 1821–1910 | "Rejected by ten medical schools for being a woman, she graduated first in her class anyway — the first woman M.D. in America — and then opened the door for every one who followed." | **OPEN DOORS** — "MERCY's bay doors open wider — dock at approach speeds that would once have waved you off." |
| RUDOLF VIRCHOW | 1821–1902 | "The father of cellular pathology — omnis cellula e cellula — who insisted every disease begins somewhere specific, and that medicine's job is to look until it finds where." | **CELL DOCTRINE** — "Diagnosis comes faster — black boxes, shrines and counterfeit scans complete in two-thirds the time." |
| ALEXANDER FLEMING | 1881–1955 | "He came back from holiday to a spoiled culture plate and, instead of binning it, looked closer: the mould was killing the bacteria. Penicillin began as a noticed accident." | **PENICILLIN** — "Your hull cultures its own repair — vitals slowly self-heal while below half." |
| RITA LEVI-MONTALCINI | 1909–2012 | "Barred from her university by fascist race laws, she built a laboratory in her bedroom and kept working — and discovered nerve growth factor, how living tissue is told to grow." | **GROWTH FACTOR** — "Fuel cells grow denser — tank capacity raised to 120." |

## 8. In-flight banners (`banner()` call sites)

| Trigger | Copy |
|---|---|
| Controller connects | `CONTROLLER CONNECTED` |
| Sector start | `<SECTOR NAME>` |
| Lift descent | `SECRET LIFT — DESCENDING INTO THE HOLLOWS` |
| Cave exit | `SURFACE — <SECTOR NAME>` |
| Nightfall on the Basin (T6) | `NIGHT COMES DOWN ON THE BASIN` |
| Manifest closes | `MANIFEST CLOSED — MERCY IS SPOOLING TO JUMP / DOCK IN THE RECOVERY BAY BEFORE THE STATIC REACHES HER` *(S4 changes to the ventral-hangar wording)* |
| Breach | `SECURITY BREACH ABOARD MERCY / DOCK AT THE RED BAY TO CONTAIN IT` |
| Breach contained | `CONTAMINANT CONTAINED  +750 / LOCKDOWN LIFTED` |
| Breach failed | `RECOVERY BAY SABOTAGED  -1000 / HEALING OFFLINE THIS SECTOR` |
| Famous Scion boards | `SOMEONE EXTRAORDINARY IS ABOARD…` |
| Transfusion line snaps | `LINE SEVERED — REMAINDER LOST  -50 / SIGNAL AGAIN IF YOU NEED IT` |
| Transfusion window closes | `TRANSFUSION WINDOW CLOSED — SIGNAL AGAIN IF NEEDED` |
| Counterfeit MERCY trap | `COUNTERFEIT — THE BAY IS A MOUTH  -200` |

## 9. Floating texts (`addText()` call sites)

`SHIP FULL` · `SCION ABOARD +500` · `◇ CARRYING DATA` · `DELIVERED +300` ·
`LOG FRAGMENT RECOVERED` · `CONTAMINANT CONTAINED +750` · `FUEL +35` ·
`COUNTERFEIT — SOMEBODY'S LURE  -100` · `FUEL DRAINED -18` ·
`LURE-TREE DESTROYED` / `LURE-TREE READ FOR WHAT IT IS — COUNTERFEIT
TRANSMITTER +500` ·
`HIDDEN CACHE +400 — someone didn't want this found` · `SHIELD BOUNCE` ·
`SHIELD HELD` · `HARD LANDING -<n>` · `-40` / `-26` (hit damage) ·
`+250` / `+150` (turret / drone) · `FUEL LINE CUT` [S7 promotes] ·
`PASSENGER KILLED BY VECTOR` [S7 promotes to banner; draft: `A
PASSENGER IS DEAD — IT'S IN THE CABIN`] · `YOU LOST <FAMOUS NAME>` ·
`THE STATIC SURGES` · `THE SURGE ROCKS THE LINE` ·
`PRIMER MIST — FLY TO THE LINE` · `-<n>` (U2 running resupply toll, drained
live as the tank fills) · `TANK TOPPED — RESUPPLY COST -<n>` (U2, replaces the
old `CLEAN LINE +250`) · `LINE RELEASED — FUEL +<n>  ·  -<n>` (U2) ·
`THE PAD RINGS HOLLOW…` · `SCANNING…` · `SCANNING… hold position`

## 10. Discovery & finale cards (`showCard` call sites)

- **Black box** — kicker `BLACK BOX RECOVERED · SIGNAL <n>/7 · +800`; body =
  the log fragment, or "The recorder is blank — wiped clean. Someone got here
  first."; footer: "◈ Triangulation viable. Keep flying." / "◈ Recover at
  least 3 of 7 to triangulate the source."
- **Log fragment (sector clear)** — kicker `LOG FRAGMENT RECOVERED`.
- **Counterfeit MERCY, docked (the trap)** — kicker `THE THIRD ACT ·
  -200`, title `THE BAY IS A MOUTH`: "No healing. No fuel. A hull with
  nothing inside but appetite — wearing the one shape you stopped checking. /
  He built a better lure this time. He built the thing you trust."
- **Counterfeit MERCY, identified without docking** — kicker `COUNTERFEIT
  IDENTIFIED · +800`, title `MACHINE TIME`: "Her emblem pulses like a pulse.
  Its emblem keeps perfect time. / You counted the beats. He never learned a
  heartbeat."

## 11. Sector clear, endings, epilogue, ranks

- **Sector clear** (`drawClear`): `<SECTOR> CLEAR` · optional
  `PRIMUM NON NOCERE — Hippocratic bonus +2000` · `⏱ STOPWATCH BEAT +500` ·
  `saved <n>/<n> · ✝ lost <n>` · `(a signal source went unfound in this
  sector)` · `tap to continue`.
- **Epilogue** (`EPILOGUE_LINE`): `AMS SOLACE · crew manifest 214 · status:
  HEARD.`
- **THE ANSWERED CALL** — "You landed beside it and listened. / The beacon was
  AMS SOLACE — MERCY's sister ship, lost with all hands, her distress call
  looping for years. Every Scion that answered honestly was rewritten by the
  echo. / You didn't silence her. You told her she was heard. / The Static
  faded like a fever breaking. / +6000 [· OATH KEPT +2000]" — plus "The oath,
  kept whole." (no-fire) or "You found what he hid. It cost you the oath to
  do it." (secrets-only fire).
- **SILENCE BY FIRE** — "You burned the beacon out of the dark. / The Static
  is gone — and so is whatever was calling. MERCY logs the sector clean. / The
  silence feels heavier than it should. / Quiet, at a cost. The oath,
  hollowed. / +3000"
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
  legend, U3).
- **Settings** (`drawSettings`): `SETTINGS` · rows `SOUND / MUSIC / HAPTICS /
  ASSIST / TILT / COLORBLIND / FIELD MEDIC / BIG TEXT / REDUCED FLASH · ON|OFF`
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

## 13. Store & Game Center copy (reference only)

Achievement earned/pre-earned descriptions live in
[GAMECENTER_ACHIEVEMENTS.md](GAMECENTER_ACHIEVEMENTS.md); App Store metadata
drafts live in APP_STORE_ROADMAP.md § O2. Both follow the E7 trademark tiers.
