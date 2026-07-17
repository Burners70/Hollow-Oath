# Doids → a sellable, distinct game

**Status:** working design & positioning note. The repo currently contains only a
one-line `README.md`; this document is the first attempt to capture (a) what the
game inherits from the classic *Oids*, (b) the legal distinctness bar for the App
Store, and (c) a proposed original identity and evolved mechanics. Treat the
"evolved mechanics" and naming sections as **proposals to react to**, not settled
canon.

---

## 1. The lineage — what "Oids" was

*Doids* began life (per the README) as a recreation of **Oids** (FTL Games, 1987,
Atari ST / Amiga). Oids sits in the Thrust / Gravitar / Lunar-Lander family:

- **Newtonian flight.** You pilot a shuttle with rotate-left, rotate-right, and
  thrust. Momentum and gravity are constant; nothing stops unless you counter-burn.
- **The rescue loop.** Planetary bases hold captive androids ("oids"). You fly
  down through hostile terrain, land gently beside them, load them aboard, and
  ferry them back to a landing pad / mothership.
- **Hostile bases.** Gun turrets, missile launchers, fuel dumps and **reactors**.
  Blow the reactor and the whole base goes up — but you must outrun the blast.
- **Resource pressure.** Limited fuel; refuel on pads. Land too fast = crash.
- **Payoff.** Delivered androids are cashed in for score / money.
- **The killer feature.** Oids shipped with a **galaxy/level editor** — players
  built and shared their own worlds. This is worth remembering; it's cheap
  originality and huge retention.

**Fail states:** crash-landing (excess velocity), running out of fuel, being shot,
or being caught in a reactor blast.

---

## 2. The distinctness bar (why this matters before design)

You want to *sell* this. Two different bodies of law apply:

- **Not protectable → free to reuse:** the *mechanics* themselves — gravity,
  thrust, inertia, rescuing units, destructible bases, fuel management, a level
  editor. Gameplay ideas can't be copyrighted. Build on these freely.
- **Protectable → must be original:** the **name**, **faction/character names**
  (the "Oids", their captors), specific **story beats**, **art, sprites, sounds,
  and level layouts**. Copy these and you risk both a copyright claim and an App
  Store takedown.

**"Doids" fails the bar on name alone** — one letter off a trademarked title and
self-describing as a "recreation of Oids." Ship it under a clean name with an
original narrative wrapper and you're on solid ground. Keep the flight-and-rescue
loop; that part is yours to take.

> Not legal advice — if real money is at stake, a quick IP-lawyer sanity check on
> the final name is cheap insurance.

---

## 3. Proposed new identity

### Name candidates (need App Store + trademark search before committing)
Pick a direction, not a final word — each should be checked for existing apps /
trademarks:

- **STRANDED** — the survivors are stranded; you're the extraction pilot.
- **TETHER** — you're the lifeline; leans into a grapple/tow mechanic (see §4).
- **KESTREL** — the name of your rescue craft; clean, ownable, evocative.
- **ARKLIGHT** — beacon + ark; rescue-and-carry framing.
- **HOLLOWFALL / DEADFALL** — gravity-well tone.
- **SALVAGE RUN** — mercenary framing; you get *paid* per soul recovered.

Recommendation: a craft name (**KESTREL**) or a mechanic name (**TETHER**) —
short, one word, brandable, and semantically distant from "Oids."

### Narrative wrapper (original)
Rather than "rescue the androids from the Biocretes," a distinct framing:

> Deep-space colonies have gone dark. Their **synthetic caretakers** — the crew
> who kept the life-support running — are trapped in the collapsing habitats,
> guarded by the automated defence grid that's since gone rogue. You fly a
> single-seat extraction craft. Drop into the gravity well, pull them out before
> the reactor cascades, get paid per soul. No one else is coming.

This keeps the emotional core (small ship, big danger, rescue the helpless) while
replacing every protectable proper noun. The captives are **"caretakers"** or
**"the crew,"** the enemy is an impersonal **"defence grid" / "the Warden,"** and
the setting is dead colonies rather than enslaver aliens.

---

## 4. Evolved mechanics (originality + mobile fit)

Two goals: add genuine design originality (further distance from Oids) and make it
work on a **touchscreen**, which is where App Store money is.

### Core loop (keep)
Gravity flight → descend into a base → recover survivors → escape → cash in.

### Evolutions (propose / prioritise)
1. **The Tether.** Instead of survivors teleporting aboard on contact, you deploy
   a physics **grapple line** and *tow* them out. Towing changes your mass and
   handling — a real skill layer, and a distinctive signature mechanic (and a
   ready-made title). Multiple survivors on one line = risk/reward.
2. **Heat / reactor cascade timer.** Entering a base starts a visible **cascade
   countdown** — a soft timer that ratchets tension and makes "one more survivor"
   a genuine gamble. Replaces the static base with a collapsing one.
3. **Touch-first controls.** Left thumb = rotate/thrust wheel, right thumb =
   fire/tether. Ship auto-orients assist as a toggle for accessibility. Get this
   *feeling* right before anything else — it makes or breaks a mobile Thrust game.
4. **Run-based economy (roguelite lean).** Each run = one colony. Cash buys craft
   upgrades (fuel tank, thrusters, tether strength, shields) between runs. Gives
   the retention curve mobile needs without heavy content cost.
5. **Procedural + editor.** Ship with procedurally seeded colonies for infinite
   runs, *and* the classic Oids trick — a **level editor with sharing**. Cheap,
   original, and a community flywheel.
6. **Daily seed / leaderboard.** One shared seed per day, global time/score board.
   Near-zero content cost, strong day-1 retention.

### Deliberately drop / change (distance from Oids)
- Original art direction end to end (no recreated sprites, palettes, or sounds).
- Original level layouts (don't rebuild Oids galaxies).
- New faction/character/craft names throughout.

---

## 5. Suggested next steps
1. **Lock a name** — shortlist from §3, run an App Store + USPTO/EUIPO search.
2. **Prototype the tether + touch controls** — the two things that decide whether
   this is fun *and* distinct.
3. **Write a one-page story bible** with the final proper nouns so art and copy
   stay consistent.
4. **Rename the repo/project** away from "Doids" once the name lands.
