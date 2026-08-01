# Design brief — Act Two (update 1.1)

*A hand-out brief for a designer with no repo access. Everything needed to start
is in this file; the underlying design decisions live in
[ACT_TWO_SPEC.md](ACT_TWO_SPEC.md) and the build order in
[APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md) Bundle P, but you shouldn't need
either to do the work below.*

Last updated: July 2026 · Status: **open brief, nothing delivered yet.**

---

## 0. Read this first: there are no sprites

**Hollow Oath has no in-game art files.** Every single thing the player sees in
play — the ship, the terrain, the figures, the mothership, the HUD, the glow — is
drawn procedurally in code on an HTML canvas, every frame. The `assets/` folder
holds only Game Center achievement art and marketing screenshots. There is no
sprite sheet, no texture atlas, and no tileset to extend.

**So the deliverable is not art. It is specified direction that a programmer can
implement in vector drawing code**, plus exactly two real image files (§7).

That changes what "useful" looks like:

| Useful | Not useful |
|---|---|
| Annotated mock-ups / paint-overs showing intent | Finished sprite sheets |
| Explicit colour values, tagged by *meaning* (§8) | A palette with no semantic mapping |
| Timing as numbers — periods, amplitudes, easing | "It should feel alive" |
| Silhouettes buildable from strokes, arcs and fills | Raster texture, photobashing, gradients with many stops |
| A stated fallback for every animated state (§8) | One beautiful state and nothing else |

Mock-ups can be raster, Figma, whatever suits you — they're reference for
implementation, not assets for import. If it can't be described as strokes,
fills, arcs and a timing curve, it can't be built.

## 1. How to actually see the game

There is **no public web build** — the playable game was deliberately taken off
the web before launch so it wouldn't compete with the paid iOS app. Three ways to
see it:

1. **Open it locally.** Clone the repo and open `index.html` in a browser. No
   build step, no install, no dependencies — it just runs. This is the best
   option: you can reach any sector instantly via the debug handle if someone on
   the team shows you how.
2. **The demo video** — `assets/marketing/Video/demo-preview.mp4`.
3. **Eight annotated stills per device** in
   `assets/marketing/Screenshots/iPhone-17/` and `…/iPhone-17-Pro-Max/`, covering
   the title, a Scion scan, docking with the mothership, the dark sector, a
   shrine, a contaminant, a famous rescue and a refuel.

Act One's underground caves ("the Hollows") are the closest existing reference
for Act Two, and **the brief below is partly about deliberately not looking like
them** — see §3.

## 2. The fifteen-second version of the fiction

You fly a small rescue craft. People are trapped and you bring them home without
hurting them; the game's whole ethic is *first, do no harm*, and shooting is
possible but costly. Act Two goes underground, into an industrial plant beneath a
wrecked hospital ship, where the missing are held in **racks** — sealed,
powered banks of eight to twelve people, kept alive by the machine they're locked
in.

You can't carry a rack inside your hull. You **cut its mains feed**, which puts it
on a draining internal battery, **sling it underneath your ship on a tether**, and
fly it to a docking bay lowered down the shaft on a cable. The tether swings with
real momentum. Every bump costs the people inside.

Three pressures pull against each other the whole time: **hurry** (the battery is
draining), **care** (it's a box of people), and **cost** (you can give them your
own vitals to buy time, which leaves you nearly dead for the climb out).

**Glossary:** *rack* — the sealed bank of people you tow · *reserve* — its
internal battery, draining · *trunk* — the mains feed you cut to start a rescue ·
*the well* — the swaying docking bay you deliver into · *the Static* — a signal
that pulses every 41 seconds, which turns out to be a dying woman's heartbeat.

## 3. The look we're moving away from

Act One's caves are dark violet, organic, and lit by your own lamp. **Act Two's
plant chambers are the opposite, and that inversion is the point:**

> Glycon's plant is a **working facility** — maintained, orderly, and *lit*. The
> horror of medical misinformation is that it looks legitimate. A bright, clean,
> orderly room full of people being read is worse than a dark cave.

So: industrial-clinical, not cavernous. Kept-up, not ruined. The darkness is
reserved for the connective tunnels between chambers, and for one or two
**lights-out events** across the whole act — rare enough to frighten.

Reference feelings, not styles to copy: a working dairy; a data centre's cold
aisle; a hospital ward at 4am with the lights on and nobody at the desk.

---

## 4. Priority 1 — THE RACK (blocks everything)

**This is the single most important visual in Act Two, and the vertical slice
cannot be judged until it reads correctly.** Please treat it as the whole of your
first pass.

A rack is a life-support machine holding 8–12 people. It has status indication,
because life-support machines do. **Its glow *is* its pulse** — we deliberately
refused to put a row of medical readouts along the top of the screen, because that
would turn the game into a management screen. The player reads the ward by
*looking at the room*.

### 4.1 The four states

| State | Reads as | When |
|---|---|---|
| **On mains** | Bright, steady, a full double-beat (*lub-dub*) | Before you cut it — the machine is doing its job |
| **On reserve, healthy** | Dimmer, still a clear double-beat | You've cut the feed. The rescue has started, and so has the dying |
| **Failing** | Thinner and weaker, down to a single flicker | Running out of time |
| **Gone** | **A steady, unbroken glow with no beat at all** | Everyone inside is dead |

That last row is the one to get right. Throughout this game, **absence of rhythm
means something is wrong** — a flat line, a held note, a silence. Here it means
people died. It should be quietly awful, not loud: no explosion, no alarm, just a
light that stopped pretending to be alive.

**One detail worth designing around:** cutting the feed visibly dims the rack. The
player's own first action is what starts the dying, and they watch it happen
because they caused it.

### 4.2 Two clocks, and only one of them changes

Please specify both, in numbers:

- **The rack's own pulse.** A double-beat, at a *constant rate* — it does **not**
  speed up as it fails. Only the amplitude and the shape degrade: the second beat
  (the "dub") drops out first, leaving a single flicker. We suggest a resting-pulse
  feel around **1.0–1.2s per cycle**, but the number is yours.
- **The 41-second network beat.** Every 41 seconds, every rack in the plant takes
  an extra bite out of its reserve *simultaneously*, because they're all on the
  same tap. This is a fixed constant in the game and cannot change. **What should
  that moment look like?** Our instinct is a synchronised dip that resettles at a
  slightly lower floor, so the player learns to plan around it — but this is a real
  open question and we'd like your answer.

### 4.3 Deliverable for §4

1. Rack silhouette — buildable from strokes, arcs and fills; readable at a glance
   on a ~6" phone screen while you're flying past it.
2. The four states, specified: colour role (§8), brightness, the beat's shape and
   amplitude, and what degrades between each state.
3. The `reducedFlash` variant of all four (§8) — mandatory, not optional.
4. What "cutting the feed" looks like as a transition, over roughly a second.

## 5. Priority 2 — the plant chamber

The chambers are large, lit, industrial rooms, **bigger than any level in Act
One**, with overhangs, ledges and tight passages. The player flies through them
carrying something precious.

What we need is a **terrain palette** in the shape the code already uses per
sector: two gradient stops for the ground fill, one stroke colour for its edge,
and one glow colour. Act One has eight of these — one per sector, each echoing its
own healer (temple teal, anatomical rust, Nightingale's indigo, antiseptic grey,
radium violet, desert amber, pastoral green, near-black). Act Two needs its own,
and it should read as *facility* against all eight of them.

Also wanted:

- **Ornamentation vocabulary** — what furnishes a chamber that isn't a rack.
  Handling machinery, conduit runs, racking frames, gantries. Decorative first;
  some of it becomes solid later.
- **The lit / dark contrast pair** — the same chamber palette under working lights
  and under a lights-out event, where the racks become the only light source.
- **How the trunk conduits read.** Several run through each chamber; one is the
  rack's. A live feed carries the rhythm of what's on the end of it, so **a
  conduit's pulse is readable along its length** — and a *faked* pulse is
  mechanically perfect where a real one drifts. The player solves this with their
  eyes. Making "metronomic" visually distinguishable from "alive" at a glance is
  the interesting problem here, and it's the closest thing in the brief to a
  puzzle.

## 6. Priority 3 — three smaller pieces

- **Directional edge bleed.** When a critical rack is off-screen, the screen edge
  nearest it picks up its pulse and its state colour. It must read as **light
  spilling in from off-camera**, not as a HUD arrow or a marker. How far in does it
  reach, how soft is the falloff, and how does it behave with two racks in
  different states on the same edge?
- **The sling.** The tether line plus a rack hanging beneath the ship, readable at
  speed, in a lit room, without obscuring the terrain the player is about to hit.
  The line's tension should be visible.
- **THE WELL.** The docking bay the mothership lowers down the shaft on a cable.
  **It hangs and it sways** — you dock a swinging load into a swinging bay. It is
  the act's home, resupply point and checkpoint, so it needs to read as safety and
  as slightly precarious at the same time. The mothership already exists in Act One
  and appears in the screenshots; the bay should read as *hers*.

## 7. The only two real image files

Everything above is direction. These two are actual assets, and both are
independent of the rest of the brief:

1. **`the_full_codex.png` needs a twelfth star** — do this one first, it's tiny
   and it ships sooner than Act Two (in update 1.01). The achievement art is
   described as *"the open codex under a constellation of eleven famous minds"*,
   and we're adding a twelfth rescuable historical figure. The SVG source and a
   `generate.py` render script are in `assets/gamecenter/achievements/svg/`.
   **Act Two adds ten more on top**, taking the constellation to 22 — so design
   the constellation to stay legible rather than countable.
2. **Two new achievement badges for Act Two** — *EVERY HOLLOW HEARD* and *GENTLE
   HANDS*. These match a shipped set of nine; house style is neon vector strokes on
   a space-navy gradient with a starfield and glow. **Game Center crops achievement
   art to a circle**, so the meaning must sit inside the centre circle while the
   outer ring survives as composition. Hold these until the act's chambers exist —
   they're not urgent.

Store screenshots and update artwork come later still: the act doesn't have a
name yet, and there's nothing to photograph.

---

## 8. Non-negotiables

These are constraints from legal, accessibility and performance, not preferences.

**Colour must be specified by meaning, not by hex.** The game has a token layer
with four *semantic* colours that **swap wholesale in colourblind mode**, and a
separate set of fixed "flavour" colours that never swap. Tell us which of these a
thing is:

| Meaning | Default | Colourblind mode |
|---|---|---|
| `SAFE` | `#69f0ae` green | `#40c4ff` blue |
| `WARN` | `#ffc400` amber | `#ffab40` orange |
| `DANGER` | `#ff4081` pink | `#ffffff` white |
| `REVEAL` | `#ff5ce1` magenta | `#ff6bff` bright magenta |

Fixed flavour colours (they do **not** swap): void `#05060f`, cyan `#00e5ff`,
violet `#b388ff`, gold `#ffd54f`, ember `#ff6d00`, alert `#ff1744`.

Our suggested rack mapping, offered as a starting point to argue with: mains =
`SAFE` bright · reserve-healthy = `SAFE` dimmed · failing = `WARN` ramping to
`DANGER` · gone = `DANGER`, steady. **A hardcoded colour that isn't mapped to a
role fails our automated tests**, so an unmapped palette can't be built.

**Colour can never be the only channel.** Every state must be fully readable with
colour removed — for the rack, the *beat shape* is that second channel, which is
why §4.2 matters as much as the palette.

**Reduced-flash mode must be honoured.** There's an accessibility setting for it,
and this system is built entirely out of flashing lights, so it matters here more
than anywhere else in the game. With it on, a pulse becomes a **smooth brightness
or scale oscillation, never a strobe.** Every animated state needs both variants
specified.

**Most players are on a muted phone.** iPhone is the primary target and most phone
play is silent, so **sound is a bonus channel, never the carrier.** Anything you
design must work with the volume off. (Positional audio and haptics exist and are
used, but only as reinforcement.)

**No red cross, ever.** For trademark reasons the game uses the **rod of
Asclepius** as its medical emblem throughout. A red cross on anything is a legal
problem, not a style note.

**Performance is tight.** The game holds 60fps on a phone by avoiding expensive
blur effects inside drawing loops. Glow is achieved with layered strokes rather
than true blur, so effects need to be expressible that way. Big soft multi-stop
gradients per object are the main thing to avoid.

**Safe areas.** Notch, dynamic island and home indicator must all stay clear, in
both orientations.

## 9. What we'd like back, and in what order

1. **The rack** (§4), complete with all four states, both flash variants and the
   two clocks. On its own, this unblocks the vertical slice.
2. **The chamber palette and its ornamentation vocabulary** (§5).
3. **The twelfth star** (§7.1) — tiny, independent, ships first.
4. Everything in §6, in any order.
5. The two achievement badges (§7.2), once chambers exist.

## 10. Questions we're genuinely asking, not rhetorically

1. What does the 41-second network beat *look* like across a whole room of racks
   (§4.2)?
2. How do you make a **metronomic** pulse visually distinguishable from a **living**
   one, at a glance, on a phone (§5)?
3. Does our suggested rack colour mapping survive contact with a real designer, or
   is there a better use of the four roles (§8)?
4. Can a "gone" rack be made to land as quietly devastating rather than as a
   failure state? We think steady-and-unbroken does it, but we'd like a second
   opinion.
5. For a lit facility, is a terrain palette even the right lever — or does the
   chamber need to read as *built* rather than *geological*, which the current
   two-stop-gradient terrain system may not express well? If so, say so early; it
   changes what we build.
