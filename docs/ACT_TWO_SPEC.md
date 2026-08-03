# Act Two — the descent (working title)

*Design spec — the target, not a report of what runs. Companion to
[GAME_DESIGN.md](GAME_DESIGN.md) (read that first) and
[APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md), where this replaces Bundle P.
**Supersedes [PENDULUM_SPEC.md](PENDULUM_SPEC.md)** — see §12 for what survives
from it — and **absorbs Bundle Q's three new caves** (see §13).*

Last updated: August 2026 · Status: **partly built.** The July 2026 planning
round settled terrain (§11.0), the deception tell (§8.1), the ten new famous
minds (§9.1), persistence (§11.2) and the relay chain (§5.1a). Since then
**P·design, P·terrain, P·slice, P·feedback, P·floor and P·ramp have landed** —
the visual language (the rack's four states, the conduit tell, the sling, the
well, the achievement art), span terrain, the tether and its damage model, the
trunk cut, the cradle, the reserve, the transfusion, and three chambers
(THE INTAKE · THE WARDS · THE THEATRE) in `js/acttwo-data.js` / `-chambers.js` /
`-render.js` / `-update.js`. Still unbuilt: P·systems, P·persist, P·scions and
chambers four to ten (P·content).

> **This file does not track build state — [APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md)
> Bundle P's checkboxes do.** Where a section here describes something that
> already runs, read it as the specification the code was written against.
The act has no name yet; the owner's steer is that it should come out of the
work rather than be chosen up front.

---

## 1. The one-paragraph version

Hollow Oath's first act ends with a woman heard and nothing else changed. Act
Two is the rescue that should have followed. Beneath AMS SOLACE — anchored over
the shaft as a cap and a mast, not sunk — runs Glycon's network: the plant where
Vectors are made. Your missing Scions are down there in **racks**, sealed banks
of eight to twelve, being read. He isn't killing them; he's diagnosing them,
because a lie only sells if it's shaped to fit a weakness he's already found.
You can't carry them inside — there are more people in a rack than your hold
takes, and it can't be opened mid-cycle — so you cut its feed, put it on
internal reserve, and **sling it beneath your hull**, and every turn you make is
felt by everyone in the box. The reserve is draining while you fly. You can buy
them time by putting a transfusion line out and giving them your own vitals. And
the clock the whole game has been running on — the 41-second Static — turns out
to be a heartbeat.

## 2. The spine

> **He reads them to find the crack. The expertise is what he sells; the
> weakness is what makes it sell.**

Glycon's product is counterfeit authority. To make a convincing fake doctor he
needs a real one to copy — but a copy of a copy degrades (that is, and always
was, the Static's own logic), so he must keep returning to originals. Reading a
Scion gets him two things: how a clinician reasons and sounds, and where that
mind's fault line is. A Vector built from that diagnosis isn't merely a fake
doctor. It's a fake doctor that knows how to be believed. That's why they get
carried home in good faith. He didn't guess at trust; he diagnosed it.

**The Scions are not degraded by the reading.** His copies degrade; the
originals are held, re-read and kept. So Act Two is a real rescue with a real
win — you get them out and they are alive and whole. What was taken is the
knowledge of where they break, and you don't get that back by being rescued.
Say it once, in the epilogue, about all of them. It is not a per-rescue
mechanic (see §14, rejected).

**They are androids, and that is the point.** Scions were manufactured on a
line. He has put them back on one and is revising them. A human on an assembly
line is generic horror; a machine being edited by the process that built it is
precise, and it's specific to what these people are.

**One rule held absolutely: Glycon is a stage magician, never a wizard.**
Alexander of Abonoteichus had a tame snake, a linen wrap and a speaking tube.
Every trick down here must be riggable by a charlatan with resources. The moment
the environment obeys him because he is *powerful*, the game stops being about
medical misinformation and becomes science fiction about a sorcerer.

## 3. The forty-one seconds

The Static repeats every 41 seconds because **that is how often her heart
beats.**

She has been in the deepest reader for years. To keep someone readable that long
you slow them almost to stopping — suppressed, preserved, held at the edge. He
tapped her, and what he tapped was a living rhythm, so the whole network pulses
on it: every relay, every surge, every counterfeit in the field, timed to a
dying woman's heartbeat. For the entire first act, every 41 seconds, the player
has been listening to her heart without knowing it.

This costs almost nothing to build — the clock, the surge and the ECG all ship
already — and it pays for itself four times over:

1. **It unifies the game's instruments.** The player's health bar, the
   arrhythmia when something's wrong aboard, a rack's trace going flat, and the
   world's own clock become one thing. The 41-second clock was always an ECG;
   there was simply no trace drawn.
2. **The shipped copy already agrees.** The answered ending says the Static
   faded *"like a fever breaking."* Forty-one is the temperature at which a
   fever stops being a symptom and becomes the thing that kills. Leave it for
   the people who notice; don't explain it on screen.
3. **It gives the act its ending sound** (§10).
4. **It gives the act its motive** (§4).

### 3.1 Why this is not a retcon

Act One says the Static is a degraded looping recording — a copy of a copy. Act
Two says it is live. That reads as a contradiction only until you notice that
**the game has no narrator.** Every word of Act One is a briefing, a log
fragment, a card or the CMO: in-world voices, and in-world voices can be wrong.

Act One's account was **a plausible misdiagnosis**. A repeating signal that
degrades — obviously a recording. Reasonable. Wrong. Act Two is the differential
nobody ran.

For a game whose entire skill is *look closer, doubt the convenient
explanation*, having the first act's official account turn out to be a
comfortable misreading is not a betrayal of the story. It is the thesis eating
its own tail, and it is the best available justification for a second act
existing at all.

**Writing rule:** the reveal must land as a *discovery*, never as a correction.
No character says "we were wrong about the Static." Someone hears a pulse and
recognises it.

## 4. The motive

In THE ANSWERED CALL you match her rhythm, tell her she was heard, and she stops
calling. Re-read with Act Two's knowledge: **the distress stopped; the tap did
not.** She went quiet and stayed exactly where she was.

You told her she was heard. Then you flew home.

That is the line the act opens on.

## 5. The world

### 5.1 SOLACE is the door, not the dungeon

`SOLACE_HULL` (`js/render.js:2327`) is a ~320px MERCY-class lozenge. The player
has measured her against their own ship. She cannot hold ten levels and must not
be stretched to try.

So she doesn't. **She's the wellhead.** Glycon didn't sink her — he anchored her
over the shaft: a cap, and a mast. That's why only the command tower breaks the
surface (the existing finale flatten, `js/world.js` `genLevel`, `n ===
FINALE_IDX`), and why the relay in Hollow 0 was boosting a signal that
originates *at* her. She's his aerial.

Her interior appears **once**, as the entry corridor of level one: a breached
intake, twenty seconds of flying through a dead ship whose silhouette the player
already knows, and out through the bottom. That is the beat her size can carry,
and it is the right one — she is a door you pass through, never a place you
explore. What is on the other side of that door is **not** his workings yet; see
§5.1b.

### 5.1b The first three floors are HERS — and she built them

**Owner decision, August 2026, and it resolves the one thing §5.1 left short.**
The difficulty ramp (roadmap P·ramp) needs three teaching chambers before the
plant, and §5.1 is right that she cannot hold three floors of interior: the
player has measured her hull against their own ship for a whole act, and
stretching a 320px lozenge into a dungeon is precisely the mistake §5.1 exists
to forbid.

So they are not floors **of** her. They are floors **she made**.

She came down answering a call that was bait (§5.2). Before Glycon took anyone,
her crew did the only thing a hospital ship's crew stranded on a rock could do:
they went down into the caves beneath her and built somewhere to keep two
hundred and fourteen people alive. Three floors, cut and decked by hand.
**Intake, wards, theatre** — the order any field hospital is built in, and the
order you descend through them.

That is why the caves are the shallow end of this network and not a coincidence
(§5.4): she did not excavate from nothing, she **adapted what was already
there**. Which is also, exactly, the "rock overhead, mechanical underfoot" rule
the chambers are authored to — she never cut the roof, and she laid every deck
plate underfoot herself.

Four things fall out of it, and all four are already built:

- **The furniture has a reason to be a hospital's.** Stretcher bays, oxygen
  banks, drip stands, spilled supply crates: not a ship's fittings torn loose,
  but a ward that ran and then stopped mid-shift. Nothing about the dressing
  changes; what changes is that it now makes sense.
- **The "hers, wrecked — then his, installed over it" gradient gets a
  mechanism.** He came UP into her floors to use them, so the top three carry
  his cabling stapled over her decking, and the deep ones carry almost nothing
  of hers. There is a **seam** at the third floor, which is where a player
  stops being in a place built for people and starts being in a facility that
  was never meant for any.
- **The scale objection disappears.** An excavation can be any size; §11.0's
  "each chamber is larger than any surface sector" stops fighting the fiction
  and starts belonging to it.
- **It makes the taking worse.** She did not lose them in the crash. She kept
  them alive down here — triaged, warded, operated on — and *then* he came, and
  took every one of them out of the beds she had built for them. The rooms are
  the evidence that she nearly managed it.

**Writing rule, per §3.1: nobody says any of this.** You read it off a room of
made things — decking laid over cave floor, beds in rows, a theatre lamp — and
one line of framing per chamber (the intro cards, roadmap P·content).

### 5.1a The relay chain (owner refinement, July 2026)

**SOLACE's beacon was a relay, not the transmitter.** This is the load-bearing
detail, and it closes a hole the first draft left open: *why did the signal read
as coming from her?* Because her beacon has been faithfully rebroadcasting what
is tapped below it, for years, exactly as designed. The instruments were right
about the bearing and wrong about the origin — which is the game's thesis again,
in one object: correct data, comfortable conclusion, nobody ran the differential.

The chain, every stage of it a place the player has already been:

| Stage | What it is |
|---|---|
| **Her heart**, in the deepest reader | The source. A living rhythm, slowed to the edge of stopping. |
| **His tap** | The splice — the point where he cut into her (§12, THE FIRST CALL's disposition). |
| **SOLACE's beacon** | The relay. Her own distress hardware, repurposed as his aerial. |
| **The hand-built repeater in Hollow 0** | The boost that pushed it out into the lanes. |
| **The lanes** | Where every Scion in Act One heard it. |

This makes §5.1's "she's his aerial" literal rather than metaphorical, and it
retro-fits Act One without contradicting a word of shipped copy. THE ANSWERED
CALL says *"The beacon was AMS SOLACE — her distress call looping for years"* —
an identification of **where**, not a claim about the transmitting device, so it
survives untouched and re-reads correctly. And Hollow 0's shrine card already
says *"IT ISN'T AN ECHO — a transmitter, hand-built…"*, so relay hardware is
seeded in Act One's own record.

**Writing rule, per §3.1:** nobody explains the chain. Someone follows a cable
the wrong way and finds it doesn't end where the instruments said.

### 5.2 Why she was taken

She wasn't corrupted. **She answered a distress call that was bait.** The first
counterfeit he ever ran was somebody asking for help, and a hospital ship cannot
not answer. It is the trap the whole first act teaches the player to see, run
once, perfectly, on the people who came before them. *Lost with all hands* is
what the record says, because no one was left to file a correction.

**And there is a gap in that record, which is where Act Two lives.** She was not
taken on arrival. She came down, she could not leave, and for however long it
lasted her crew kept two hundred and fourteen people alive underneath her — the
three floors of §5.1b. *Lost with all hands* compresses all of that into four
words, and the whole of the descent is the player finding out how much those
four words were hiding.

### 5.3 Both endings open the door, differently

| Act One ending | How Act Two opens |
|---|---|
| **THE ANSWERED CALL** | The beacon stops, and the shaft it was masking is suddenly on your scope. She stopped screaming and you could hear the hole. |
| **SILENCE BY FIRE** | You blew the cap off. You made the door by doing the wrong thing. |

Cheap to build (one differing opening beat) and it gives a player a real reason
to have played both. Note that Act Two makes SILENCE BY FIRE retroactively far
worse: you burned the roof over 214 living people, and the CMO's *"The SOLACE
deserved better"* stops being elegiac and becomes an accusation. Protect that.

### 5.4 The Hollows were the shallow end

The three shipped caves are the top of the same network. Act One's players met
its edge and read three cards about it. Act Two is the rest.

## 6. What you carry

Three tiers, one mechanic, escalating fiction. Tiers 2 and 3 add no new systems.

### 6.1 A RACK — the bulk of the act

A sealed, powered bank holding **eight to twelve** ordinary Scions mid-revision.
Programmed clinical expertise: a commodity, batch-read, industrial.

**Why it goes on a sling and not in the hold** — three reasons, all arithmetic
rather than special pleading:
- There are more people in it than your hold takes (capacity 6).
- It can't be opened mid-cycle; they'd be left half-written.
- The rack *is* their life support. Unplugging it is killing them.

### 6.2 A DEEP READER — the giants

A handful of Scions carry the complete preserved minds of actual people
(Vesalius, Curie, Nightingale…). Those aren't programs, so they can't be
batch-copied and the read can't be paused: stop it mid-cycle and the mind is
lost.

So a deep reader is towed **live, still running, still transmitting** — which
means carrying one lights you up. He knows exactly where you are, you can't turn
it off, and shooting whatever comes means firing while towing a person. Smaller
than a rack, heavier, worse to handle, worth far more.

### 6.3 HER — the last one

**Who she is (decided, July 2026).** Act One's *"she"* is the **ship** — naval
convention throughout the shipped copy (*"her distress call"*, *"she could
finally stop"*). Act Two's reveal is that the call was never automated. Her
beacon is still working perfectly; it is simply a **relay** (§5.1a), and what it
has been relaying all along is **a person**, and nobody ever checked what was on
the far end of the line. This is a deliberate shift, not an inheritance — write
it as a discovery (§3.1).

**She is human**, one of the 214. The plausibility gap you would expect isn't
there: the game already has *preserved human minds* inside the famous Scions, so
preservation is established technology in this world. It also gives the act its
ladder — twelve androids in a box, then a preserved giant, then one woman — and
the point of the ladder is that you flew exactly as carefully for the racks.


The maximum version of the same idea. She isn't merely transmitting; she is the
carrier. Everything he broadcasts rides on her. Carrying her out is carrying a
lighthouse, and the reason the lanes go quiet behind you is that the light is in
your hands now.

## 7. The loop: hurry, care, cost

Act One's ethic is *primum non nocere* — don't harm. **Act Two is triage:**
they're dying while you're being careful, and you must decide how careful you
can afford to be.

Three pressures, pulling against each other, every level:

| Pressure | What it is |
|---|---|
| **Hurry** | The reserve is draining. |
| **Care** | It's a box of people, and every slam costs them. |
| **Cost** | Every minute you buy them is vitals you don't have for the climb. |

**No trolley problems.** Real triage isn't choosing who dies; it's allocating
under pressure, where good management saves everyone and only bad management
loses someone. **The player must always be able to save everyone in a chamber.**
A loss is a skill failure the player can learn from, never a designed sacrifice.

### 7.1 Find the feed — reading by pulse

A rack runs on the plant's mains. To move it you get it onto internal reserve,
which means closing its trunk feed. Several conduits run through each chamber;
one is the rack's.

**You identify it by taking its pulse.** A live feed carries the rhythm of what
is on the end of it. The rack has an ECG; so does its trunk. You fly the
pipework and read it — visually by the pulse in the line, audibly up close.

Nothing is hidden. Everything is visible from the moment you arrive. You have to
*read* it, which is exactly Act One's skill transposed underground: Act One
taught you to read the ground for tells, Act Two asks you to read a body for a
pulse.

**The deception layer, on the existing grammar:** he fakes pulses on decoy
lines. A faked pulse is *mechanically perfect* — metronomic, no variance. A real
one drifts, the way a real heart does. So the deduction has two layers: find the
rhythm, then decide whether the rhythm is honest. That is the whole thesis of
Hollow Oath compressed into one puzzle solved with the eyes.

Cutting the wrong line costs: it's his line, so he now knows you're here, and
the rack's real feed keeps draining while you try again. **Shooting a feed dumps
the rack** — the oath has teeth again, and it's a wire rather than a lecture.

*Sequencing:* placed-and-visible for the first chamber or two as teaching;
found-by-pulse everywhere after.

### 7.2 The tow

Per the tether physics inherited from PENDULUM_SPEC.md §4.1 (verlet point +
distance constraint, ship-side correction as the source of feel). Contact above
a safe speed costs the rack integrity; below it is free. Shield forced down
while towing. FIRE is release, never a shot.

Racks are heavy and many. Deep readers are singular and wild. She is the
heaviest thing in the game.

### 7.3 The reserve

The rack's own ECG is the readout: not faster as it fails, but **weaker** — the
same trace, going flat. The player watches two ECGs, theirs and the rack's, and
theirs stops being the one they care about.

**Drain model: continuous, with a bite on the beat.** The reserve ebbs steadily
(legible — you can judge how long you've got), *and* every 41 seconds her pulse
pulls an extra chunk out of every rack in the network at once, because they are
all on the same tap. The surge stops being a shove and becomes the moment people
die. It is also what the player plans around: *can I reach the well before the
next beat, or do I give now?*

**Flatline is death — total, never partial.** There has to be jeopardy, and a
rack is eight to twelve people. Tracked separately from Act One's `runLost` so
existing ranks and achievements keep their meaning.

*Why not partial survival* (examined July 2026 and rejected): "you saved seven
of twelve" is a number, not a feeling, and it destroys the death state §7.5
depends on, whose whole power is that a steady unbroken glow with no beat is
absolute. Half-written Scions would also open a narrative branch — what MERCY
does with them — that the act would then owe an answer to.

*The real problem total loss creates, and its actual fix.* Two locked pillars
say the player must always be able to save everyone, and that there are no
trolley problems. A total loss sits in tension with both: the instant a rack
flatlines the chamber's intended outcome is gone, so anyone chasing a clean run
restarts — and the mistake that killed it usually happened minutes earlier, so
cause and consequence are badly separated. Partial survival is the wrong fix.
**Checkpointing is the right one:** the chamber is the unit of retry (§11.1), so
a flatline costs you a room rather than an act. Teeth kept, save-scumming
removed.

### 7.4 The transfusion — your vitals, not your fuel

Inverts the shipped transfusion line (`updateTransfusion`, `js/update.js:2186`),
whose machinery transposes without modification: sustained hover, a line that
snaps if you drift, shield down while it's out, FIRE detaches, and diminishing
returns per fill.

In Act One MERCY supplies you. Down here there is no MERCY: **you are the
supply.** You hover over a failing rack, put the line out, and give it your own
vitals to keep twelve people ticking a few minutes longer.

- **A floor at ~15 vitals** — the line auto-detaches. Diegetic and a real
  clinical rule: *you cannot treat if you are the casualty.* It prevents an
  unwinnable state without softening anything; you'll still be nearly dead and
  about to haul a heavy load up a shaft.
- **Delivery heals you.** MERCY's cyan bay already heals on delivery, so you get
  well by getting them home. The reward for finishing a rescue is your own
  recovery.
- **No score penalty.** Act One charges −4/unit for a field refuel because
  taking supply is a favour called in. Act Two must not bill you for keeping
  people alive — the cost is blood, and charging as well is both perverse and
  double jeopardy. *Same line, opposite direction: the price moved from your
  score to your body.*
- **Diminishing returns per rack** (the existing `0.9^refuels` shape): each
  top-up buys less, so stalling isn't a strategy.
- **FIELD MEDIC** (`doids_easy`): transfusion cost ×0.5, per the existing
  accessibility contract.

### 7.5 The ward — readable without a HUD, and without sound

Two things this must not be. A strip of ECGs along the top of the screen would
turn Act Two into a management screen and wreck a deliberately austere HUD. And
an audio-only ward is unplayable for the majority of this game's audience —
**it targets iPhone first, and most phone play is muted** (owner note, July
2026). Sound is a bonus channel here, never the carrier.

**The racks are the light.**

A rack is a life-support machine in a pitch-dark plant, so it has status
indication — and in a black chamber that makes it the only thing you can see.
Its glow *is* its pulse:

| State | How it reads |
|---|---|
| On mains | Bright, steady, a full double-beat |
| On reserve, healthy | Dimmer, still a clear double-beat |
| Failing | Thinner and weaker, down to a single flicker |
| **Gone** | A steady, unbroken glow with **no beat at all** |

That last row holds the game's grammar: absence of rhythm has always meant
something is wrong. Here it means someone died.

**Cutting the feed dims it.** On mains a rack is bright and steady; the moment
you close its trunk and put it on internal reserve it visibly drops — dimmer,
and now fading. The act of starting the rescue is what starts the dying, and the
player watches it happen because they caused it.

**Off-screen racks:** the screen edge nearest a critical rack picks up its pulse
— directional light bleed in its state colour and its rhythm. Not an arrow, not
a HUD widget; it reads as light spilling from off-camera.

**Four channels, none of them required:**

| Channel | Available when |
|---|---|
| The rack's own pulsing glow | **Always — the primary** |
| Directional edge bleed | **Always**, for racks off-screen |
| Positional audio pulse (weaker = more urgent) | Sound on |
| Lub-dub haptics via the F1 facade | Phone, haptics on |

**Accessibility contract:**
- Colour through `PAL()` so it swaps for colourblind mode, with the **beat shape
  as the H2 redundancy partner** — a rack's state must be fully readable with
  the colour channel removed.
- **`reducedFlash`** (`js/world.js:390`) must be honoured: with it on, the pulse
  becomes a smooth brightness/scale oscillation rather than a strobe. This
  matters more here than anywhere else in the game, because the whole system is
  built out of flashing lights.

**AUSCULTATION** (René Laennec, rescued from Bundle Q where it was to be spent
on finding lifts) is the upgrade that lets you **perceive the whole ward
regardless of line of sight** — racks pulse faintly through rock — delivered
through whichever channels the player has switched on. Earned, not given, and
not sound-dependent.

### 7.6 The dock: THE WELL

MERCY cannot land and cannot descend, so she lowers a docking bay down the shaft
on a cable. **It hangs. It sways.** You dock a swinging load into a swinging
bay.

The mothership is doing exactly what you're doing — carrying something precious
on a line and trying not to hurt it — and that rhyme costs nothing to write. A
fixed, findable home for the act that is emphatically not a hidden pad.

*Rejected: a teleporter.* It throws away the physicality that makes the sling
mean anything.

## 8. Deception underground

He has walls to project onto and darkness to hide the emitter in. Two hazards,
both stagecraft (§2):

- **False floor** — a ledge that isn't there. You commit to a landing and drop
  through it.
- **Painted rock** — a real outcrop dressed as empty space. You fly into a wall
  that looked like air. The scarier of the two.

### 8.1 The tell — reversed, July 2026

> **Status, August 2026 — the tell now GATES the hazard.** After the second
> on-device round the owner removed §8's painted rock from chamber one ("we need
> to give some sort of clue to the invisible walls so they aren't unfair… we
> wouldn't want any on this first level anyway"). There was a 440px undrawn wall
> sitting on the only route west, which is a trap rather than a hazard in a
> tutorial floor. The terrain model still expresses both and `paintedRock()` is
> still in the authoring vocabulary — the capability keeps its own test against a
> purpose-built chamber — but authored content does not get another one until the
> channels below exist. See APP_STORE_ROADMAP.md, P·systems.
>
> **THE TELL IS BUILT (August 2026, roadmap P·systems).** The 41-second flicker
> and reveal-on-contact both run: `updateLies`/`touchLie`/`probeLies`
> (`js/acttwo-update.js`), `recompileDrawn` and a reveal-aware `partInView`
> (`js/acttwo-data.js`), and `drawnAt` (`js/world.js`) — the drawn view's own
> containment predicate, which had to exist because every hook this section
> named resolves against *solid* geometry and a false floor never is one. The
> truth never flickers: `spans` is compiled once and only `spansDrawn` is ever
> rebuilt, so a reveal can never move a wall a player has already flown against.
> Reduced flash gets a longer window rather than no tell. It ships **proved but
> unmet** — see below.
>
> **Correction, August 2026: the layer is not "one-sided", it is EMPTY.** This
> paragraph said chamber one still had a false floor; it does not. The owner
> pulled that in the same round ("let's remove fake walls from this level anyway,
> it is too much for level one but we needed to see how they work"), and the
> paragraph was written before it. **No authored chamber carries a deception of
> either kind** — `falseFloor()` and `paintedRock()` have zero call sites in
> `js/acttwo-chambers.js`, `chamberLies` is false everywhere, and
> `spansDrawn === spans` by identity. That is **not** a gap the tell closes, and
> it should not be: the teaching ladder (the comment above `BREACH_CHAMBER`)
> puts the deception at **chamber four**, and chamber one's whole property is
> that it teaches without a hazard. So the tell is proved against a
> purpose-built chamber entered live through `__doids.enterChamber`, and
> chamber four — P·content's — is where a player first meets it.
>
> **And the tell itself is now decided (owner, August 2026): the 41-second
> flicker, plus reveal on contact.** One rule serving both hazards, and the
> reverse of each other — the painted rock flicks INTO view on the beat, the
> false floor flicks OUT of it; either becomes permanently honest the moment a
> ship, shield, bullet or rack touches it. It runs on the Static's own clock,
> so a player who watches a room for one beat can read it and a player who
> charges through cannot, and it makes the first time a lie catches you the
> only time. The grit and lamp-shadow channels below are additive to this, not
> alternatives to it.


**The first draft's tell was false against the code, and had to go.** It read:
*"a projected ledge is perfectly flat and perfectly level — nothing in this
game's terrain is level except things he made."* Two things kill it:

- **`flatten()` makes exactly-level ground everywhere.** It sets every heightmap
  sample in a span to a single height (`js/world.js`), so every landing pad,
  every lift pad and every V2 scan shelf in the shipped game is mathematically
  level. Landings tolerate slope up to 0.25, but authored pads sit at zero. "Level
  means fake" would indict the entire surface campaign.
- **Act Two is set inside a plant.** §9.2 commits to a lit, orderly, maintained
  facility — where machined level floors are legitimately everywhere. The tell
  dies twice.

**The replacement: the world doesn't respond to you.**

| Deception | Tell |
|---|---|
| **False floor** | Your thruster wash raises no grit off it. Real rock kicks up dust; a projection is inert. |
| **Painted rock** | The inverse — dust kicks up in what looks like empty space. |
| **Both, second channel** | Your lamp throws no shadow on a lie (promoted from second-order to a real channel). |

This is better than a shape rule, for a reason that matters beyond the bug: it is
an **active probe that costs nothing but time and care.** You hover, you watch
the wash, you commit — and hovering to check is a deliberate slow-down that
fights directly against the draining reserve (§7). The deception system stops
sitting beside the act's central tension and starts pushing on it. It also never
touches the oath, because probing is not shooting.

It reuses the shipped exhaust-particle system, so the build cost is a response
test rather than new art.

**The terrain model holds both hazards as of P·terrain.** A chamber part may
declare a `view` — `drawn` or `solid` — and `genChamber` compiles two span sets
from the one definition: `spans` is what collision uses, `spansDrawn` is what the
renderer draws. A false floor is a part in the drawn view only; painted rock is a
part in the solid view only. Everything else appears in both, so the two views are
identical on honest terrain and can differ **only** where a deception is declared —
a test asserts exactly that, and counts any undeclared difference as a bug. What
is still to come is the tell itself (the grit, the lamp shadow), which is
P·systems; this is the hook it needs.

**Consequence for §9.1:** Röntgen's RADIOGRAPH sees through solid matter, which
is a direct counter to both hazards. **It must be limited to one sweep per
chamber**, or the earned upgrade disables the whole deception layer for the rest
of the act.

## 9. Gravity, and the rest of the environment

Don't give him gravity — give him **opportunism.** CURIE FIELDS already
establishes gravity anomalies as a real radiological feature of this world. He
dug where the anomalies were, because that's what made the digging cheap and the
tunnels unreachable. Reversal and low-g zones are geology he exploited, not
powers he has. Same rule as §2, and it keeps him a charlatan.

### 9.2 Light — a place, not a default

**Act Two is mostly lit, and that reverses an earlier call in this document
(owner correction, July 2026).** The first draft made the racks the only light
source. Three things were wrong with it:

- **It disabled §8.** False floors and painted rocks are *visual* deceptions
  whose tell is "perfectly flat and perfectly level." You cannot read terrain
  shape in the dark. The two systems cancelled each other.
- **Darkness in this game is a contrast effect.** NIGHTINGALE BASIN works
  because it is one sector in eight. Ten dark levels neutralise it.
- **The fiction is better lit.** Glycon's plant is a *working facility*.
  Alexander of Abonoteichus ran a successful business, and the horror of medical
  misinformation is that it looks legitimate. A bright, clean, orderly room full
  of people being read is worse than a dark cave — and it contrasts against Act
  One's Hollows instead of repeating them.

| Space | Light |
|---|---|
| **Plant chambers** | Lit. His facility, maintained and orderly. Terrain readable, so §8 functions. |
| **Connective tunnels** | Dark. The parts between his rooms, where nothing is kept up. |
| **Lights-out** | An *event*, once or twice across the act — the lighting fails or he kills it, and the racks become the only light exactly as §7.5 describes. Frightening because it is rare. |

§7.5 is unaffected: a rack's glow signals through colour and beat rather than
brightness alone, so it reads in a lit room and becomes primary in the dark.

### 9.1 The new medical-history layer — ten new minds

**Ten, decided July 2026** (owner: *"we need new famous scions — 10 — and
associated benefits"*). The rule applied: **every one is tied to an Act Two
system**, so no upgrade is flavour-only, and none duplicates a benefit already
in `FAMOUS`.

| Figure | Why them | Benefit |
|---|---|---|
| **René Laennec** (1781–1826) | Heard through what he couldn't see — rolled a paper tube and invented the stethoscope | **AUSCULTATION** — the whole ward pulses through rock, line of sight or not (§7.5) |
| **John Snow** (1813–1858) | Mapped an outbreak to one pump and took the handle off | **THE PUMP HANDLE** — reveals which trunk feeds which rack (§7.1) |
| **William Harvey** (1578–1657) | Proved blood circulates in a closed loop rather than being consumed | **CLOSED CIRCUIT** — reserves drain slower; the thematic anchor for reading the tunnels as a body (§7.3) |
| **Ambroise Paré** (c. 1510–1590) | Abandoned boiling oil for gentleness: *"I dressed him, God healed him"* | **I DRESSED HIM** — towing tolerance; rough contact costs less integrity (§7.2) |
| **Wilhelm Röntgen** (1845–1923) | Saw through solid matter, and refused to patent it | **RADIOGRAPH** — **one sweep per chamber** shows true geometry, defeating false floors and painted rock (§8.1) |
| **Karl Landsteiner** (1868–1943) | Blood groups — the discovery that made transfusion survivable instead of lethal | **CROSSMATCH** — your vitals transfer at a far better ratio (§7.4) |
| **William Morton** (1819–1868) | The Ether Dome, 1846 — the first public demonstration of surgical anaesthesia | **THE ETHER DOME** — deepen a rack's suppression to halve its drain for a window (§7.3) |
| **Werner Forssmann** (1904–1979) | Threaded a catheter into his own beating heart to prove it could be done, and was dismissed for it | **THE CATHETER** — transfuse **while towing**, not only from a hover (§7.4) |
| **Virginia Apgar** (1909–1974) | Scored a newborn's life in sixty seconds, and cut infant mortality by making assessment instant | **THE APGAR SCORE** — exact reserve readout on every rack in line of sight (§7.5) |
| **Cicely Saunders** (1918–2005) | Founded the hospice movement: time and dignity at the edge, when cure is no longer the goal | **THE VIGIL** — a failing rack holds at a single flicker for a grace window instead of flatlining (§7.3) |

**Why THE VIGIL is the most valuable of the ten.** §7.3 locks flatline as total
death and §7 locks "the player must always be able to save everyone," and those
two pillars sit in permanent tension. THE VIGIL resolves it without softening
either: it converts the act's harshest rule into something a skilled player can
recover from, and because it is *earned*, the softening is a reward rather than a
difficulty setting. Checkpointing (§11.1) handles the failure case; THE VIGIL
handles the near-miss.

**No collisions with the shipped eleven** — checked against `FAMOUS`
(`js/world.js`): Curie's RADIOSENSE is a compass, Röntgen is imaging;
Nightingale's LAMP is reach, Apgar is readout; Hippocrates' GENTLE TOUCH is
*hull* landing damage, Paré is *cargo* integrity.

**Substitution available:** Nikolai Pirogov (battlefield triage, and the first
to sort casualties by urgency) is the fallback if any of the ten needs replacing.

**Interaction with V1 and the codex.** Mary Seacole is a **1.0.1** addition —
the twelfth entry, unlocking the ROTATION CHART from THE NULLWAVE (roadmap V1).
So Act Two's ten start from 13 and take `FAMOUS.length` to **22**. THE FULL
CODEX's threshold is derived (`codex.size >= FAMOUS.length`) so it follows
automatically, but check the codex pagination (`MINDS_PER_PAGE`, `js/render.js`)
still lays out cleanly, and expect the completion grind to lengthen a lot —
which is the point of a paid act's collectibles.

## 10. The ending

**No boss.** Alexander of Abonoteichus was never the god; he ran the god. If
there is a confrontation, the right one is that you finally reach him and find
**a husk wearing a stolen voice.** There is no man down there. There never was.
That is the mask all the way down, and it costs nothing to build.

**The finale is one rescue.** You cut her out of the deepest reader, you sling
her, and you climb. And as you climb, **the signal goes with you** — because it
is her, and she's in your hands now. By the time you reach the well the lanes
are quiet for the first time in the game's history. An industry dies because you
carried its power supply out of the room.

**The ending sound.** As she comes back, the interval *shortens*. The tick that
has been dread for two acts accelerates toward an ordinary human pulse — same
sound, opposite meaning, and the last thing the player hears is a heart rate
that is merely fast.

**And the last level gets harder as she recovers,** because the world surges on
her pulse and her pulse is quickening. Owner steer (July 2026): *definitely
gets faster/harder as you leave — exciting, harder, dramatic.* Suggested
tuning so it reads as recovery rather than punishment: the surge **quickens in
frequency while weakening in amplitude.** She is getting stronger; the machine
is losing its grip.

## 10a. Fuel, threat, and the oath

### 10a.1 Fuel is a lap budget, not a crisis

Three pressures is the design (§7). Fuel scarcity would be a fourth and would
blunt all of them. **Refuel is free at THE WELL**, and fuel becomes a
per-chamber budget: enough to clear the room flying efficiently, not enough to
be careless. `genCave` already scatters three pods per cave — keep pods in
chambers as the pressure valve and a reason to explore.

### 10a.2 The oath, made physical

The inherited tow convention (PENDULUM_SPEC §4.2) makes FIRE the release. So
**you physically cannot shoot while carrying.** The Act Two oath question is
therefore not *shoot or don't* but **put them down, in this room, and pick up a
gun.** Same moral question as Act One, made kinetic, at zero build cost.

OATH KEPT carries into Act Two unchanged.

### 10a.3 What threatens you

He is a charlatan, not a warlord. His defences are cheap tricks and repurposed
kit — **never military hardware.** Two classes:

- **Handling machinery, repurposed.** Mechanical, shootable, no guilt. The
  ordinary threat.
- **Unfinished husks.** Vectors that were never given a voice, wandering the
  plant. Not malicious — incomplete. Shooting one is shooting a Scion that never
  got made, after seven sectors of learning that a husk is what a person gets
  turned into. An oath question with real teeth, and free: the fiction exists
  already.

### 10a.4 Ranks, scoring and replay

Act Two runs **its own score and its own rank ladder**, in the same oath
grammar as Act One's but with its own names. Folding it into Act One's rank
would make a single run eighty-plus minutes.

Integrity-based bonuses in the shape of GENTLE HANDS (PENDULUM_SPEC §5).

**Replay** comes from performance, not new content: the chambers are authored
and fixed, but rack integrity delivered, vitals spent, time taken and oath
intact vary enormously. Per-chamber bests plus an act rank make it replay the
way a speedrun does — which suits a score-attack game and costs nothing to
author.

## 11. Structure

Ten levels, hand-authored (owner decision: authored geometry, not procedural —
the courses must teach the swing, which noise can't do).

### 11.0 Chamber scale, and the terrain rewrite it forces

**Owner direction, July 2026:** each chamber is **larger than any surface
sector**, and includes **overhangs and tight spaces** — geometry authored to make
a tether interesting rather than terrain that happens to be underground.

**The shipped terrain model cannot express that.** Terrain is a heightmap:
`heights[]` sampled every `STEP` (16px), one value per column. Caves add a single
parallel `roof[]`, clamped by `roof[i] = Math.min(roof[i], heights[i] - 175)`
(`genCave`, `js/world.js`), so every Act One cave is a tube with a guaranteed
175px gap — no overhangs, no re-entrant geometry, no pinch points, by
construction. This is a hard limit of the representation, not a tuning value.

**Decision: columns of spans** (owner, July 2026). Generalise `roof[]` from one
ceiling per column to **N floor/ceiling pairs per column.** It is a strict
superset of what ships:

| Property | Heightmap today | Spans |
|---|---|---|
| Collision cost | O(1) column lookup | O(1) column lookup, plus "which span" |
| `STEP` = 16 | yes | unchanged |
| Terrain tile cache | yes | unchanged |
| `groundAt`/`roofAt` shape | yes | same, with a span argument |
| Overhangs, shelves, pillars, pinch points | **no** | **yes** |
| True re-entrant hook (under it and back up into it) | no | **still no — accepted** |

*Rejected: polygon terrain with segment collision.* Fully expressive, and it
invalidates every terrain helper, the tile renderer, the landing-slope maths, the
M1 golden checksum and the V2 fairness passes. Only revisit if the vertical slice
proves spans can't carry the level design.

**Two consequences that change the build order.**

1. **The slice chamber must contain an overhang and a pinch point.** A slice
   tuned against tube geometry proves the tether against terrain the real
   chambers won't have — which is the single failure mode the slice exists to
   prevent.
2. **Ten large chambers cannot be hand-typed heightmaps.** They need an authoring
   representation — a coarse room/span grammar compiled to spans at load —
   built *before* the content, not after two levels of it.

Act One's surface generation must be untouched by any of this; the M1 golden
heightmap checksum is the proof, and it stays green.

**Implemented (P·terrain).** `level.spans` holds one array of open `{top, bot}`
intervals per column, ordered top to bottom, with solid rock outside them; two
spans in a column *is* an overhang, a short span is a pinch point, and a column
with none is a pillar. The primitives are in `js/world.js` under the "columns of
spans" banner — `spanAt`, `pickSpan`, `matchSpan`, `solidAt`, `levelH` — and
`groundAt`/`roofAt` gained the optional `y` argument this section anticipated as
"a span argument". The room/span grammar and its compiler are in
`js/acttwo-data.js` (`compileChamber`; `SLICE_CHAMBER`, in
`js/acttwo-chambers.js`, is the worked
example); drawing is `drawChamberTerrain` in `js/acttwo-render.js`. The M1
checksum is unchanged at `1090254029`, so the table above held: collision stayed
an O(1) column lookup, `STEP` and the tile cache both survived, and the
re-entrant hook is still the one thing spans cannot express.

**Owner review of the first pass (July 2026)** added two things to the model,
both of which turned out to be cheap because a span's two boundaries are already
independent. Each boundary carries a **material** — raw rock or milled — so
"rock overhead, mechanical underfoot" is expressible per surface rather than per
chamber, and a single shelf can be a landing pad on top and raw stone beneath.
`spanAt` returns the material of the span you are in, which §8.1's tell needs:
thruster wash raising grit off real rock and nothing off a projection is a
question about what the surface *is*. Each boundary can also take a **profile** —
`ramp`, `arc` or `teeth` — plus a corner radius, so an authored chamber is not
condemned to right angles. Both are `js/acttwo-data.js`.

**And the layer P·content actually authors against is the feature vocabulary**
(owner decision, August 2026 — see APP_STORE_ROADMAP.md, P·floor). The parts
grammar above is the compiler's input, not the author's: a chamber is written as
a `hall` of **stations** (`{x, ceil, floor}`, with the deck and the roof roaming
independently and materials changing per station) with named features hung on
it — `shelf`, `bench`, `column`, `pinch`, `gallery`, `bore`, `shaft`,
`stalactites`, `falseFloor`, `paintedRock`. It adds no terrain capability; what
it adds is that the three rules this chapter learned the expensive way are
enforced by construction rather than remembered: a column always opens headroom
over its capital, an authored gap is pinned from both ops at a derived tier, and
elevation change is interpolated so a narrow climbing passage cannot read as a
wall to the flood fill. Fixtures take their y from `hallAt`, so retuning a
station moves the furniture with it.

### 11.1 The descent, and where the checkpoint lives

The act is a descent, so the structure is one: **each chamber's exit is the next
chamber's entrance**, going down, with a long climb out at the end.

**MERCY lowers the well deeper as you clear.** She pays out more cable each
time, so THE WELL always sits at the level you last finished. One idea, five
jobs: delivery point, resupply, **checkpoint**, save, and a physical progress
meter. It bounds every haul to roughly one level, so a chamber's route stays
tractable — and it is quietly tense, because MERCY is committing more and more
of herself to a hole.

**The finale earns itself:** at the deepest point the well cannot follow —
something forces it to withdraw — so the last climb is yours alone, carrying
her, with the surge quickening the whole way (§10).

**Checkpoint unit is the chamber.** See §14 on why this matters: it is what lets
a rack flatline be total loss without training the player to save-scum.

| Beat | Levels | Content |
|---|---|---|
| **Her floors** | 1–3 | The field hospital she built under the wreck (§5.1b): intake, wards, theatre. His racks stand in her rooms and his cabling is stapled over her decking, but the rooms are hers. Placed feeds, one rack each, teaching the tow — then the deduction, then the momentum pinch and the first gun. |
| **The plant** | 4–6 | Through the seam and into what was never built for people. Pulse-reading proper, false floors, the first painted rock. Ward rounds begin. |
| **The deep line** | 7–8 | Deep readers: live, unswitchable, and they light you up. Anomaly geology. THE LAST HEART (§12). |
| **The mask** | 9 | The husk in the mask. No fight. |
| **Her** | 10 | One rescue, the climb, the quickening. |

**Revised August 2026** from 1 entry / 2–5 plant, and the reason is the ramp
rather than the story: Act Two needs three teaching chambers before it can ask
anything, because the tether, the delivery criterion, the deduction, the
momentum pinch and the gun cannot all arrive in the room where the tether is
new. The fiction that carries three floors is §5.1b — they are hers, and she
built them — which costs the plant beat two levels and buys a **seam** at
chamber four that the act did not previously have. The plant is stronger for
arriving somewhere rather than being where you started.

**One or two new elements per level** (owner, August 2026), widened from the
campaign's exactly-one rule (GAME_DESIGN §3) because Act Two's elements are
smaller than a sector's. The ten-row ladder as built — what each chamber
introduces, and why size is monotonic — is the comment block above
`BREACH_CHAMBER` in `js/acttwo-chambers.js`, beside the chambers it governs rather
than in a doc that would drift from them. See APP_STORE_ROADMAP.md, Bundle P ·
P·ramp.

### 11.2 Persistence and the save schema

Promoted out of §15's open questions into real scope (owner, July 2026: *"agree
we need to design persistence"*), and **designed during the vertical slice rather
than after it** — the slice is what reveals how much per-chamber state actually
has to survive a backgrounded phone.

**Act Two is a second campaign, not a run mode.** `runMode` today is
`"campaign" | "remix" | "daily" | "training"` and every one of those plays the
same eight surface sectors. Act Two has its own levels, its own score, its own
rank ladder (§10a.4) and its own loss tracking (§7.3), so it is a parallel
progression rather than a variant of the existing one.

What that costs:

- **A schema bump on `doids_run`, with a migration.** It is a shipped save
  format with real players behind it by the time 1.1 lands. **The migration must
  never wipe an Act One save** — that constraint is why the `doids_` prefix and
  the `__doids` handle were never renamed, and it applies here unchanged. Add a
  forward-compatible version field and treat a missing one as "Act One, v1".
- **Per-chamber checkpointing** (§11.1) alongside Act One's A1 resume snapshot.
  The chamber is the retry unit, so a checkpoint has to capture the chamber's
  entry state — rack positions and reserves, which trunks are cut, what the well
  has already taken — not just a level index and a ship pose.
- **The E4 iCloud mirror in the same pass.** Every persisted key is mirrored
  through `cloud.set`/`cloud.get` (`js/platform.js`); a new key that skips the
  mirror silently breaks cross-device continuity for exactly the players most
  likely to notice.
- **New keys keep the `doids_` prefix**, per the shipped convention.

**Test obligation:** an Act One 1.0.1 save must still load, resume and finish
after the bump. That is a regression test in `P·guard`, not a manual check.

**Still deliberately unanswered:** whether Act Two progress is a single linear
save or per-chamber bests kept alongside it (§10a.4 wants both eventually). The
slice decides.

### 11.3 The momentum pinch (owner idea, July 2026)

**Scale here is not literal.** A Scion stands about as tall as the dart (owner,
July 2026), so a rack is sized by visual fit against the ship and by the physics of
towing it, never by fitting its occupants. Its cell count is visual density.

A slung rack hangs `SHIP_R + SLING_L + cage/2` below you — 90px at PENDULUM_SPEC
§4.1's numbers — but only `max(2·SHIP_R, cage)` = 66px when it is trailing at
your own level. That 24px band is a mechanic: **a gap you cannot creep through
with the load hanging, and can take if you carry the speed to swing it up.**

It is worth having because it prices speed against care instead of gating on an
upgrade, and because going fast with a rack is the dangerous thing — every turn
is felt by everyone in the box (§6.1), and damage accrues above `SLING_SAFE_V`.
So the shortcut is real and it costs the thing you are trying to protect.

`SLING_L` is derived rather than PENDULUM_SPEC §4.1's literal 46: that number was
set for a payload of radius 8 and expressed a *readable length of visible cable*,
which a rack-sized payload destroys. The sling keeps the readable length instead.

Three tiers follow, and they are the chamber-authoring vocabulary — pass at rest ·
momentum pinch · unladen route only — with the boundaries computed from the
envelope, and both authored gaps derived from it, so retuning the rack or the sling
moves the pinches with it instead of quietly voiding them. An unladen-only
gap needs a parallel laden route, which is P·content's clearable-while-towing
invariant. Implemented as geometry in `js/acttwo-data.js` (`towEnvelope`,
`towTierForGap`) under P·terrain; the tether physics itself is P·systems.

## 12. What survives from PENDULUM_SPEC.md

The tether physics (§4.1), the release/shield/landing conventions (§4.2), the
damage model proportional to rough flying (§4.3), the readability rules (§4.4)
and the FIELD MEDIC contract all carry over intact — they were the good part,
and they were always about towing rather than about relics.

The three relics change:

| Relic | Disposition |
|---|---|
| **THE FIRST CALL** | **Cut as written.** A recorder core holding "the original call" contradicts the live-feed reveal and, worse, pre-empts it. **The place survives:** the relay is a repeater on a live line, so what's in the cradle is **the splice** — the point where he cut into her. Scanned (not towed) in Act One, using the shipped scan pattern; the card says something is being tapped and does not say what. A foreshadow, not a spoiler, and it makes Hollow 0 retroactively the most important room in Act One. |
| **THE LAST HEART** | **Survives, promoted to Act Two.** A Vector must *sound* alive to be carried home in good faith, and every tell the player has learned exists because his copies of the rhythm are slightly wrong. THE LAST HEART is the **reference rhythm** — the calibration source for every lie in the game. Not a relic: an explanation. Towable, and it belongs in the chamber where the player finally understands why the tells were always off. |
| **THE MASK** | **Survives, becomes the ending object** (§10). *"A lie is weightless. Carrying it home is the heavy part"* was written before Act Two became a game about weight, and now reads as if it always knew. |

Act One keeps its three caves and three shrines exactly as shipped. It simply
stops pretending it was ever going to have a pendulum in it.

**The pendulum debuts here or nowhere** (owner decision, July 2026). No light
introduction in an earlier release: introducing the mechanic quietly and then
re-introducing it grandly spends the reveal twice.

## 13. Release plan

**Three releases, not four.**

| Release | Contents | Price |
|---|---|---|
| **1.0** | Live (in App Review at time of writing) | £2.99 |
| **1.0.1** | The fixes already in branches, X onboarding, Z if ready, V15–V20 playtest defects | £2.99 |
| **1.1** | Act Two, entire | **£4.99** |

**There is no 1.2, and that is a simplification rather than a sacrifice.**
Bundle Q's three new caves (THE WARD, THE MINT, THE LISTENING POST) were the
only thing 1.2 was for, and a ten-level underground network supersedes them —
two separate cave systems with different rules would confuse, not enrich. What
survives from Q is its core: **Laennec and AUSCULTATION move into Act Two**
(§7.5); the ROTATION CHART stays a 1.0.1 utility.

**Bundle W** (surface terrain escalation) is no longer load-bearing. It improves
Act One but does no pricing work; it becomes optional polish.

**Why 1.0.1 is a hard dependency, not housekeeping.** Act Two is gated behind
finishing the campaign, and the loudest finding from the July 2026 TestFlight
round is that new players bounce off before the game gets good. Every player who
quits in sector two is a player who will never see Act Two. **X onboarding is
therefore a commercial dependency of Act Two**, not a separate retention bundle
— fix the on-ramp first, or build a second game for the small fraction of buyers
who got through the first one. The same logic makes V15–V20 (which affect
*finishing*) part of the same gate.

**The gap is the one real cost.** A long quiet stretch between 1.0.1 and 1.1
hurts App Store ranking. Two mitigations, neither needing a 1.2: split 1.0.1 into
two smaller updates if the branches allow, and use the TestFlight tuning builds
as public "it's coming" material rather than silent internal work.

**De-risking the build: vertical slice before content.** One chamber, one rack,
the trunk cut, the tow, the well, the reserve, the transfusion — end to end and
tuned on device — *before a single additional level is authored.* If
hurry-versus-care doesn't feel good in that one room, no amount of level design
saves it, and you'll know in weeks instead of months.

**Device tuning is confirmed available** (owner, July 2026 — Mac, Xcode and
TestFlight all in hand). This was previously an inference from "1.0 is in App
Review" and is now verified, which closes §15 q1 and means every feel-critical
item is tuned on hardware rather than in a browser.

**Build order versus release order (July 2026).** 1.0 is still in App Review and
1.0.1 is not yet live, so "1.0.1 first" constrains *when Act Two ships*, not when
it is built. Act Two is built and refined now and held until 1.0.1 has gone out.
Practically that means Bundle P runs as a sequence of PRs against a long-lived
integration branch with everything behind a feature flag, so `main` stays
releasable for a 1.0.1 hotfix at any point.

## 14. Decisions taken, and what was rejected

**Locked:** SOLACE as wellhead, not dungeon · **the first three floors are ones
she BUILT, not rooms in her** (§5.1b) · the reading finds the crack, not
just the expertise · originals are not degraded · racks (arithmetic, not
mysticism) · three tiers · hurry vs. care vs. cost · rack ECG going flat ·
continuous drain with a bite on the beat · flatline is death, never partial ·
no trolley problems · **the chamber is the checkpoint** · trunk-cut found by
pulse · vitals not fuel · **the ward is read by light, with sound and haptics as
bonus channels** · **mostly lit, darkness as a place and an event** · THE WELL,
lowered deeper as you clear · **fuel is a lap budget** · **you cannot shoot
while carrying** · **she is human** · 41 seconds is her heartbeat · quickening
finale · Act Two runs its own score and rank · pendulum debuts here · 1.0.1 →
1.1, no 1.2.

**Locked by the July 2026 planning round, on top of the above:** the beacon is a
**relay, not the transmitter** (§5.1a) · **span terrain** — N floor/ceiling pairs
per column, chambers larger than any surface sector, with overhangs and pinch
points (§11.0) · the deception tell is **"the world doesn't respond to you"**,
not "perfectly level", which was false against `flatten()` (§8.1) · **ten new
famous minds**, each tied to a system, RADIOGRAPH capped at one sweep per chamber
(§9.1) · **persistence is a schema bump with a non-destructive migration**,
designed during the slice (§11.2) · **Mary Seacole is a 1.0.1 addition**, not an
Act Two one — the ROTATION CHART's unlock, behind the finale gate (roadmap V1) ·
**device tuning is confirmed**, and build order is decoupled from release order
(§13).

**Rejected, with reasons:**

- **Jails you shoot open to free prisoners.** Puts a gun back at the centre of a
  rescue act and muddies the no-fire oath, which is the best system in the game.
  Sealed racks you tow carry the pendulum instead of competing with it.
- **Post-rescue susceptibility** (a Scion pulled from a reader riding as a soft
  `contaminantAboard()` state). It makes every successful rescue sour, and it
  turns the quarantine-bay decision — currently a rare, agonising call — into a
  per-rack habit. Put the "something was taken" note in the epilogue instead:
  one line about all of them lands harder than a hundred arrhythmias.
- **Towing individual Scions.** Shonky when the hold takes six. Racks fix it.
- **The scale shift** (a tiny drone exploring SOLACE's interior at 1:50).
  Genuinely clever and a real solution to the size problem, but it costs the
  dart — the ship the player spent the whole campaign learning — and with it the
  landing model, the tuning, the muscle memory and the pendulum itself. Act Two
  would open by taking away everything Act One taught. **Banked for a sequel**,
  where "we go inside" is a first act rather than a pivot.
- **Sequel questions** — where MERCY was going, where Glycon came from, whether
  they're connected. Fenced off by the owner and the fence stays up.
- **A boss fight** (§10).
- **A teleporter dock** (§7.6).

## 15. Open questions

Resolved by the July 2026 drains-up review, kept for the reasoning trail:
~~how dark is Act Two~~ (§9.2, reversed — mostly lit) · ~~partial flatline
survival~~ (§7.3, rejected; checkpointing is the fix) · ~~who "she" is~~ (§6.3,
human) · ~~descent structure and checkpoint unit~~ (§11.1) · ~~fuel~~ (§10a.1) ·
~~combat and the oath~~ (§10a.2–3) · ~~ranks and replay~~ (§10a.4).

Resolved by the July 2026 planning round: ~~**is there Mac access right now?**~~
(§13 — confirmed by the owner; the inference is now verified) ·
~~**does Act Two leave the surface level cache untouched?**~~ (yes — and it no
longer matters for sequencing, because the ROTATION CHART's unlock is Mary
Seacole rather than an Act Two rescue, so V1 ships in 1.0.1 ahead of Bundle P) ·
~~**persistence and save schema**~~ (scoped in §11.2; the remaining question is
narrower and listed below) · ~~**terrain representation**~~ (§11.0, spans) ·
~~**the §8 tell**~~ (§8.1, replaced).

Resolved by P·slice (July 2026): ~~**is mid-band right for a momentum pinch?**~~
(yes — the derived 77px sits between the 105px a hanging load needs and the 48px a
load trailing at your own level needs, and steady-state thrust puts the load at
~72° off vertical, a 57px envelope, so it passes under power with ~20px of margin
and cannot be crept through) · ~~**how much of a chamber floor should be
level?**~~ (less than the first pass had — the slice floor gained a structural
column to climb over, and the momentum pinch now sits on the only route to the
well so the hurry-versus-care question cannot be dodged).

Still open:

1. **The name of the act**, and with it the What's-New line that does the
   price-move work in the store. Owner steer: it comes out of the work, so it is
   written last. **This is the only open owner decision on the forward plan.**
2. ~~**Scoring numbers** — the shape is decided (§10a.4); the table isn't.~~
   **Closed twice over:** the owner signed the table off in July 2026, and it was
   built in August 2026 (roadmap Bundle P · P·systems, which holds the numbers,
   the eight rules and the build notes). The line above about the slice touching
   `score` nowhere is no longer true and was already false when written — Act
   One's shot loop runs in a chamber unchanged, so an emplacement kill scored
   from the moment P·feedback gave chambers guns. **What is still open is the
   rank NAMES**, deferred with the act's own name in q1 below: §10a.4 wants Act
   Two's ladder to carry its own, and they are written from the finished act
   rather than ahead of it. The scoring runs without them.
3. **Chamber pacing** — racks per chamber, and how long one takes. Still open,
   and now answerable: the slice is one rack across a 9000px floor, and what a
   device pass measures is how long that actually takes against the reserve.
4. **One save or bests alongside it** — the narrow remainder of the persistence
   question (§11.2). The two narrower questions that came out of the slice are
   both **answered**: a rack's position resets with the room, and `integrity`
   does not survive a retry, so **GENTLE HANDS is per-attempt** — which the
   ladder gets for free, since integrity lives on `level.racks` and therefore
   resets when the room does. The schema half of the persistence work shipped
   with the ladder (`doids_run` v2, the v1 migration, `doids_a2hi`, both
   mirrored through E4); what is left is the chamber checkpoint itself and the
   descent, on P·persist.

## 16. Next step

~~**P·terrain, then P·slice**~~ — **both have landed** (roadmap Bundle P). Span
terrain and the chamber authoring format came first because the slice could not
prove the tether without an overhang to swing it under (§11.0); the slice then
built the loop end to end in one chamber: the trunk cut, the cradle, the tether,
the draining reserve, the inverted transfusion and THE WELL. Its copy is now in
[COPY_DECK.md](COPY_DECK.md) §12a. **What it has not had is a phone** — every feel
value is authored, exposed and defaulted, and none of it is tuned; the dials are
named in one block at the top of `js/acttwo-data.js` and no test asserts a tuning
number, deliberately.

**Next is a device pass, then P·persist and P·systems.** This document still owes
its scoring table (§15 q2) and its implementation checklist in the shape of
PENDULUM_SPEC §7, both of which want the hardware round first. Nothing is
authored at scale until one chamber feels right in the hand — that constraint has
not moved.

**One thing the slice changed about how §11.1's ten chambers can be authored,**
because it is a property of the terrain model rather than a preference: **a
fully-solid column and a route past it are mutually exclusive.** A span-less
column means no air at that x, and a route from one side of it to the other has to
pass through every intermediate x. The slice chamber's "floor-to-ceiling pillar"
was therefore a wall, and it sealed the only route to the well — which every
P·terrain test missed, because each asserted a local property and none asked
whether the room could be flown. A structural column you fly *around* must be
flanked by air: the hall is locally taller than the column, which is also how a
real plant hall carries one. The whole-room question is now an assertion
(`__doids.chamberRoute`, run at three envelope heights in `tests/acttwo.spec.js`),
and it is the form §7's "the player must always be able to save everyone" takes in
geometry.
