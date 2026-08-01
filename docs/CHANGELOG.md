# Changelog

**Newest first.** Each `##` entry is one landed change or decision. Every entry
below ships in the **1.0 launch build** — 1.0 has not yet gone out to users, so
there are no post-release versions to separate yet.

**Convention going forward:** once 1.0 is live, start each new entry with a
`**Release:** 1.01` (or 1.1, 1.2) line, so a reader can tell what an existing
player already has from what's queued in the next update. Entries stay in this
file; the *plan* they came from is
[APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md) (open work) and
[ROADMAP_ARCHIVE.md](ROADMAP_ARCHIVE.md) (shipped bundles).

## P·floor, second on-device round — a wall you could not see, and one you could not pass (August 2026)

The owner flew the re-authored floor on a phone. Thirteen notes; the two that
mattered were both cases of the chamber being provably fine and actually
unflyable.

**"I couldn't get any further west. Everything seemed solid."** It was solid, at
the altitude they were flying. The gallery mezzanine ended at exactly the x where
the neck's roof descended to meet it, so the upper corridor tapered into a wedge;
the way on was a blind 400px dive underneath. Every guard passed, because the
corridor overlapped the space beyond by 113px against the 105.2 a hanging load
needs. **Traversable and findable are different properties and only one of them
had a test.** The neck is re-cut as a floor hump rather than a roof plunge, and a
new guard requires every undeclared transition to be at least 1.4x the at-rest
tow envelope.

**"A dodgy thing going on with the outline — missing for part of the wall."** A
shipped bug, not an authoring slip. `matchSpan` never returns null for a
non-empty column, so where a column holds two spans and its neighbour holds one,
both answer with that one and the rock between them is drawn — and collided — as
if it tapered away. `matchSpanMutual` makes the match mutual so the losing span
ends in a face, and `spanAt` and the tile builder share the call: the rock you
see and the rock you hit end in the same place. It also fixes the full-height
verticals at a drawn-only ledge, which were the same fault from the other side.

**Impacts kill the hull again**, reversing July's cap — paired with removing
chamber one's invisible wall and gating any return on a tell, so what is left is
rock you can see. The rack is untouched: clipping a wall kills you, not the
people in the box. Landing on a rack's lid was pulled out of the blast radius and
uses Act One's hard-landing rule instead.

**The well is a well.** The cable was a 1.5px hairline 220px long starting in
mid-air, under a rock roof MERCY could not have lowered it through. The shaft
opens to the top of the world and the cable runs up out of frame.

**Fixtures sink rather than float.** `snapToSurface` sampled one column, which
was indistinguishable from correct on a flat deck; it samples the whole footprint
now and takes the deepest floor. Ceilings deliberately do not mirror it.

Also: bigger lamps and far more of them, three new ornament kinds including the
set's first ceiling furniture, both draw loops culled to the view, and an entry
banner giving the floor's name and direction — navigation only, silent on which
bank is real.

Suite 169 -> 175.

## P·floor — the chamber feature vocabulary, and a floor with shape (August 2026)

Act Two's slice chamber was one 8050x620 room with 22px of noise on the deck. The
owner flew it on a phone and said the floor can't all be flat, and — on scoping
the fix — that it should be got right once so the changes cascade to the other
nine chambers.

**Asked what should cascade, the shape or the means of making it, the owner
chose the means.** So the deliverable is a **named feature vocabulary** in
`js/acttwo-data.js`, and the chamber is its first customer rather than its
purpose. `hall`/`hallAt` carry the deck and the roof as one ruled profile between
**stations**; `shelf`, `bench`, `column`, `pinch`, `gallery`, `bore`, `shaft`,
`stalactites`, `falseFloor` and `paintedRock` hang named features on it. It adds
no terrain capability — every helper emits the same `room`/`rock` parts the
compiler already took — but three rules this project has already paid for are now
enforced by construction: a column always opens headroom over its capital
(derived from the tow envelope, so retuning the sling cannot seal it), an
authored gap is pinned from both ops at a named tier rather than a number, and
elevation change is interpolated between stations so a narrow *climbing* passage
cannot read as a wall to the flood fill.

**Two more decisions shaped the chamber itself:** both surfaces roam — deck and
roof are independent, and the clear band now runs 260–870px against a constant
620 — and the laden haul asks for altitude *and* rhythm, both: a 280px sump and
a 540px climb out of it, with wide stretches you can build speed in alternating
with tight ones where the load has to be settled. The dressing pass is in the
same station list, because a station may change its material from there eastward:
paving ends where the sump begins, and the seam is visible.

**The new accidental-pinch test earned its keep immediately.** The re-author
produced four gaps nobody authored — a starved shelf underside, a plinth beneath
a mezzanine, and a rock hung from a roof a later room lifted above its root,
leaving a 40px slot. The chamber now has exactly one run of sub-envelope air in
9000px: the declared momentum pinch. Flying it found what tests could not: the
rack-bay mezzanine sat 80px from the bank at exactly the hanging load's height,
so you clipped it in the first metre of every haul. The overhang moved west of
the bank, where you meet it unladen.

**One shipped bug fixed on the way.** `snapToSurface` and `trunkPath` placed
objects against the nearest sampled column while `groundAt`/`solidAt` read the
interpolated surface between two columns — invisible on the hall's gentle deck,
but it put a conduit run 2.5px under the floor of the well shaft. `spanAt` now
takes an optional spans array so level-building code asks the same question
collision asks.

Suite 169 → 173.

## Release routing corrected: the patch version is 1.0.1, and the merged work ships in 1.0 (August 2026)

Two findings, both while planning the submission.

**`1.01` cannot be used as a version string.** App Store version components have
their leading zeros stripped, so `1.01` parses as `1.1` — identical to the Act
Two release that carries the price move. Shipping it would have consumed the 1.1
slot and forced the next version to 1.2. Every forward-looking reference is now
`1.0.1`; this file and ROADMAP_ARCHIVE.md keep their original wording, because
they record decisions as they were made.

**The merged post-1.0 work goes into launch-day 1.0 rather than a second
version.** With 1.0 in review, a new version could not be created at all — App
Store Connect requires the current version to be Ready for Distribution first. So
1.0 is removed from review, a new build uploaded, and the same version
resubmitted. Review restarts; in exchange the fixes reach every launch-day player
in their first download, and V·pacifism's scoring change never lands on anyone
who had already scored under the old rules.

## V·pacifism — restraint outscores shooting again (1.01), July 2026

Act One's no-harm bonus was a flat +2000 while its guns were worth more than
that: 8 turrets and 2 drones is 2300, so on sectors 4, 5 and 6 a shooter beat a
pacifist outright, and sector 7 joined them under the `crowded` daily modifier.
The ladder was paying better for clearing the room with the gun.

Fixed by deriving the award from the guns you passed up rather than by
re-pricing kills — `noFireAward()` in js/world.js — so restraint always pays more
and cannot be overtaken by a future content change. One helper, shared with Act
Two's ladder, so the invariant cannot hold in one act and fail in the other. The
kill awards now use the same named constants the helper sums.

The award is `500 + 1.25 x the sector's gun value`, so it scales with the
temptation resisted instead of paying the same for a room with two turrets as for
one with nine — a perfect pacifist campaign moves from 16,000 to 19,600 rather
than to 31,600, which keeps shipped hiscores meaningful.

A parried kill still pays full price without setting `firedShots`, so reflecting
everything collects both the kills and the bonus and outscores a pure pacifist.
**Recorded in three places as a deliberate design choice rather than a loophole**,
because it reads as an oversight: a parry is defensive and is the hardest skill
in the game, so it belongs on the restraint side of the ledger. The bonus has
always measured "you did not shoot first", not "nobody died".

## Act Two — P·feedback (the first on-device round on the slice), July 2026

Twenty notes off a phone pass through the QA harness, most of which collapsed
into a handful of causes.

- Act One's sector logic no longer runs in a chamber: the extraction banner was
  firing on frame one, because a chamber has no Scions and the manifest is
  therefore trivially closed. The HUD counts banks down here.
- The hull collides with walls. Act One's heightmap has none, so `updatePlay`
  only ever tested vertically and the dart flew through pillars, column flanks
  and §8's painted rock. Chamber impacts hurt instead of killing, capped below a
  hard landing.
- The "laser turret" was the junction-truss ornament being blamed for a death
  caused by invisible painted rock 200px away. Truss redrawn as a cabinet.
- A rack is bolted in. The somersault on cradling was a pendulum released from
  horizontal; a moored rack is not simulated, and sustained thrust parts the
  mounts. You land on the rack to rig its sling.
- Contact damping is applied after the Verlet step, so friction exists at all —
  a dropped rack used to slide frictionlessly.
- Feed lines run buried between risers and every one, decoy included, ends in a
  box; landing beside a decoy costs vitals.
- Fuel cans along the route, the resupply drone launched from the well instead of
  from a mothership at -9999, and the chamber entered at the well.
- A slam reacts: muffled cry, shudder, haptic. No text, no emoji.
- Lamp fittings, conduit runs, isolator height, the well's duplicate rack, and
  the flatline banner's design-doc jargon.
- A plant emplacement: Act One's gun, blockier and armoured (`EMPLACE_HP`), and
  slower and shorter-reaching to match. Act One's turrets are untouched — `hp`
  defaults to 1. Placement in the slice chamber is provisional pending level
  design.
- §8.1's tell, first pass. The invisible walls stay; dust now settles on what is
  solid, so it falls through a false floor and rests in mid-air against painted
  rock. One mechanism, both hazards, and it knows nothing the physics doesn't.

### Act Two's score ladder, specified (no code yet — P·systems builds it)

Settled with the owner after the feedback round, and recorded because several
code comments asserted the opposite on my authority rather than theirs. Failures
cost points; integrity does not scale the delivery award but every impact on a
rack does, per impact; a chamber cleared without firing pays the same award a
sector does; zero stays the floor. The governing principle is the owner's: *your
score is the only permanent record of your success — the others just make your
game harder*, so a failure that already costs vitals costs points as well.

The same round found a live scoring bug in **Act One**: the flat +2000 no-harm
bonus is already beaten by clearing a late sector's guns (8 turrets + 2 drones =
2300), so restraint currently pays worse than shooting on the back half of the
campaign. Filed as V·pacifism for 1.01, to be fixed by deriving the award from
the guns you passed up rather than by re-pricing kills.

## Index

Grouped by phase, newest phase first. Don't read the whole file — jump.

**1.1 — Act Two (building; not reachable in normal play)**
- [The QA harness gets an Act Two section, and chrome that hides](#the-qa-harness-gets-an-act-two-section-and-chrome-that-hides-july-2026) — the on-device rig for tuning the slice
- [P·slice — the Act Two loop, end to end in one chamber](#pslice--the-act-two-loop-end-to-end-in-one-chamber-july-2026) — the tether, the trunk cut, the reserve, the inverted transfusion and THE WELL; plus the pillar that turned out to be a wall
- [P·terrain — span terrain and the chamber authoring grammar](#pterrain--span-terrain-and-the-chamber-authoring-grammar-july-2026) — the heightmap generalised to columns of spans, so an overhang is expressible at all
- [1.1 planning round: span terrain, the reversed deception tell, ten new minds, and Mary Seacole](#11-planning-round-span-terrain-the-reversed-deception-tell-ten-new-minds-and-mary-seacole) — the round that phased Bundle P, and the two places the spec was wrong against the code

**1.01 (queued for the first post-launch update)**
- [The scuttle charge becomes a universal escape hatch](#the-scuttle-charge-becomes-a-universal-escape-hatch) — the gravity-anomaly soft-lock, and why the fuel floor deliberately stays flat
- [The Solace's hull reveal reads brighter and holds](#the-solaces-hull-reveal-reads-brighter-and-holds) — the reflected-ping hull outline was a blink, not a reveal
- [Bundle X + Z integration: the trainee sector's inherited crosswind](#bundle-x--z-integration-the-trainee-sectors-inherited-crosswind) — a bug that only exists once X's training mode and Z's gravity share a codebase
- [Bundle X — onboarding: trainee sector, guided pauses, hint bank, in-app rating](#bundle-x--onboarding-trainee-sector-guided-pauses-hint-bank-in-app-rating) — the first 1.01 bundle to land; sequenced ahead of Bundles V and Z
- [Bundle X owner-feedback round: onboarding refinements, an efficiency bonus, and an ASSIST fix](#bundle-x-owner-feedback-round-onboarding-refinements-an-efficiency-bonus-and-an-assist-fix) — owner playtest notes on PR #61, plus the minimum-journeys bonus and the ASSIST landing-guide fix
- [Bundle Z — REMIX variable gravity](#bundle-z--remix-variable-gravity) — a per-sector gravity scale and crosswind, plus the landing-fairness re-tune both required
- [Bundle V — fairness fixes and owner-playtest defects](#bundle-v--fairness-fixes-and-owner-playtest-defects) — the V14 REMIX scan-fairness domino, V15's tap-gated trap reveal, V16–V20's smaller playtest fixes

**Design system & accessibility**
- [Bundle DS — the design system made enforceable, and colourblind mode made real](#bundle-ds--the-design-system-made-enforceable-and-colourblind-mode-made-real) — token layer, 130 hardcoded semantic colours routed through `PAL()`, the flight controls made swappable

**Copy & content passes**
- [Copy pass: cut "MERCY ACTUAL", fix name/term leaks and a location ambiguity](#copy-pass-cut-mercy-actual-fix-nameterm-leaks-and-a-location-ambiguity) — comprehension/continuity sweep over every player-facing string; three name-gating bugs found
- [Audio + legibility fixes](#audio--legibility-fixes-july-2026) · [CONTINUE box overflow fix + SFX variety pass](#continue-box-overflow-fix--sfx-variety-pass-july-2026) · [Emblem centring + shrine cue](#emblem-centring--shrine-cue-july-2026)

**Playtest feedback rounds**
- [July 2026 owner-playtest feedback → Bundles R, S, T + the copy deck](#july-2026-owner-playtest-feedback--bundles-r-s-t--the-copy-deck) — the round that produced the R/S/T bundles and COPY_DECK.md
- [Polish pass 2: remaining review items](#polish-pass-2-remaining-review-items-july-2026) · [Polish pass: six owner fixes](#polish-pass-six-owner-fixes-july-2026) · [Bug fixes & polish pass](#bug-fixes--polish-pass-july-2026)

**Store, native wrapper & platform**
- [Game Center achievement art & App Store Connect copy](#game-center-achievement-art--app-store-connect-copy-july-2026) — the nine launch achievements, art and metadata
- [Bundles E + G: the native wrapper and Game Center](#bundles-e--g-the-native-wrapper-and-game-center-july-2026) — Capacitor scaffold, the two Swift plugins, `cloud`/`gc` facades

**Design decisions & proposals** (specs, no code)
- [Decision: Bundles P & Q locked as the 1.1 and 1.2 updates](#decision-bundles-p--q-locked-as-the-11-and-12-updates-july-2026)
- [Proposal: the deep Hollows — Bundle Q specced, not built](#proposal-the-deep-hollows--bundle-q-specced-not-built-july-2026) · [Proposal: the pendulum sling — Bundle P specced, not built](#proposal-the-pendulum-sling--bundle-p-specced-not-built-july-2026)

**Gameplay build-out**
- [The transfusion line — field refuel as a hover minigame](#the-transfusion-line--field-refuel-as-a-hover-minigame-july-2026)
- [Bundles I–N + haptics wiring](#bundles-in--haptics-wiring-july-2026) — the 41-second clock, scan, codex, epilogue, remix/daily, the counterfeit MERCY
- [Bundle H — Accessibility & difficulty](#bundle-h--accessibility--difficulty-july-2026) · [Bundle D — performance pass](#bundle-d--performance-pass-july-2026) · [Bundle C — audio baseline & settings menu](#bundle-c--audio-baseline--settings-menu-july-2026) · [Bundle B — emblem replacement, red cross → rod of Asclepius](#bundle-b--emblem-replacement-red-cross--rod-of-asclepius-july-2026) · [Bundle A — pause, mid-run save & resume](#bundle-a--pause-mid-run-save--resume-july-2026)
- [Lift-return bugfix](#lift-return-bugfix-july-2026)

**Foundations**
- [App Store roadmap added](#app-store-roadmap-added-july-2026) — where the bundle structure came from
- [Rename: DOIDS → Hollow Oath](#rename-doids--hollow-oath-july-2026) — full scope, and what was deliberately kept (`doids_` keys, internal identifiers)

---

## The QA harness gets an Act Two section, and chrome that hides (July 2026)

**Release:** tooling — no game behaviour, beyond four read-only `__doids` drivers.

Act Two is tuned by hand on a phone, and `tests/qa-harness.html` had no way into
it: every button drove Act One, so reaching the slice meant opening the Eruda
console and typing `__doids.loadChamber("slice")` by thumb — exactly the friction
the rig exists to remove. It now has an Act Two section: load any chamber (the
picker fills itself from the build, so it grows as P·content adds the other nine),
warp to the rack or the well, close the real feed or one of his decoys, cradle and
release, force a reserve or a vitals level, read the live dials, and run the
clearable-laden route check at three envelope heights on the device.

**Adapted, not forked.** The file is deliberately decoupled from any branch and
meant to be reused; a second rig would duplicate the iframe plumbing, the
same-origin trick, the Eruda fallback, the src box and the dump overlay, then have
to be kept in step — which is how one of two rigs starts lying about which build
it is driving.

**The chrome no longer shrinks the game.** It sat above the iframe as flex rows,
so the bar permanently took ~40px and an open menu up to 46vh. The game lays
itself out against the iframe's viewport, so that didn't merely cover the game, it
*shrank* it — on a landscape phone squeezing it to a third of the screen and
pushing its own bottom controls off the bottom edge. The chrome now floats over a
full-viewport iframe, and hides entirely to a small tab at the middle of the right
edge — the only region the game doesn't use, since the HUD owns the top band and
every touch control runs along the bottom.

**A Home-Screen icon can no longer clobber the build you loaded.** The rig is
meant to live on a Home Screen, and an icon relaunches the same URL every time, so
`?src=` winning unconditionally silently broke the one workflow the docs promise:
add the icon once, paste newer builds in later. The next launch snapped back to
the build frozen in the query string. A newly pasted link is intent and an icon
relaunching is not, so a link the harness has not seen before wins and otherwise
your own last Load does.

Two smaller fixes: "Clear save + reload" called `localStorage.clear()` on an
origin the harness *shares* with the game, taking its own settings — including the
build URL just pasted — so harness keys are now `hoqa_`-prefixed and preserved.
And the four new drivers exist because **a classic script's top-level `const` is
not a property of `window`**: `contentWindow.SLING_L` is `undefined` while
`contentWindow.markTrained` works, so reading the dials the way the harness
already reads those functions would have failed silently.

New `tests/qa-harness.spec.js`, a static drift guard. The rig is the one file the
suite cannot drive live — that needs same-origin, and the suite loads the game over
`file://` where an iframe is an opaque origin; an HTTP server for one file would
give up the no-server property the rest of the suite is built on. So it
cross-checks the two sources as text: every button maps to an action, every
`__doids` method the harness calls still exists, the `contentWindow` calls are all
function *declarations*, the default build URL is SHA-pinned rather than a branch,
the load precedence holds, and the preference keys cannot collide with `doids_`.
Mutation-tested. Suite green at 156.

## P·slice — the Act Two loop, end to end in one chamber (July 2026)

**Release:** 1.1. **Not reachable in normal play** — Act Two is behind
`__doids.loadChamber("slice")` until P·content and P·persist wire it into the
campaign, and `main` stays releasable for a 1.01 hotfix throughout, which is what
Bundle P's phasing is for.

The vertical slice the whole bundle was gated on: one chamber, one rack, and the
loop from end to end. Read which trunk feeds the rack, land at its isolator and
hold to close it, watch the bank drop off mains and start dying, cradle it, tow it
the length of the floor on a swinging sling, give it your own vitals when it won't
make the trip, and dock a swinging load into the swinging bay MERCY lowers down
the shaft. New file `js/acttwo-update.js` (the approved Act Two exception), plus
the readability layer it needs in `js/acttwo-render.js` and its feel dials in
`js/acttwo-data.js`. 17 tests in a new `tests/acttwo.spec.js`; suite green at 150,
M1 golden checksum unchanged.

**Three controls, no new buttons.** The cut and the cradle are landed holds, which
is the shipped `updateBlackbox` grammar, so Virchow's CELL DOCTRINE applies to
both. FIRE is the release and never a shot while towing — which is the Act Two
oath question made kinetic: not *shoot or don't* but *put them down, in this room,
and pick up a gun.* And the transfusion is a **held SHIELD**, because every other
input is already spoken for while you hover over a dying rack and the shield is the
one that is semantically free: the field would sever the line anyway. The hand
that shields you is the hand that gives.

**The tether, with one correction found by flying it.** PENDULUM_SPEC §4.1's model
throughout — a point mass on a rope, verlet integration, a distance constraint run
twice a frame — but the ship's 30% share of the correction is applied as an
impulse against the *radial closing speed* rather than as `err/dt`. The latter
makes the coupling stiffness proportional to `1/dt`, so the same flight feels
different at 60 and 120fps, which for a value being tuned on hardware is worse
than useless; it is also unbounded on a long frame, which is how the first version
threw a rack the length of the hall. Position on the load, velocity on the hull.

**Slams cost the reserve as well as integrity, and that is the design, not a
double charge.** The reserve is the resource under pressure, so the drain and rough
flying pull on one needle — which is what makes hurry-versus-care a single
allocation problem instead of two unrelated meters. Integrity is the record of what
your handling cost, never touched by the drain, so GENTLE HANDS means "never
slammed" rather than "arrived quickly". Damage is measured on the **normal**
component of the payload's velocity, not its speed, because a rack sliding along a
floor at cruise is a graze and a rack driven into that same floor at cruise is a
slam — and speed alone would bill the player for every fast pass through the
momentum pinch, the one place the design actively wants speed carried.

**The pillar was a wall.** The slice chamber could not be flown: a flood fill over
its open spans stopped dead at x 4592 for a laden ship, an unladen ship and a bare
point alike, because P·terrain's "floor-to-ceiling pillar" covered every open
interval in its own columns and sealed the only route to the well. Every terrain
test passed anyway — each asserted a *local* property (an overhang exists, a pinch
exists, a pillar exists) and nothing asked the whole-room question.

The conflict is provable rather than a tuning slip, and it constrains how all ten
chambers can be authored: **a fully-solid column and a route past it are mutually
exclusive**, since a span-less column means no air at that x and a route must pass
through every intermediate x. So the column was re-authored the way a real plant
hall carries one — a taller structural bay, with the mass standing from the floor
to a capital and clear air over the top, which turns a dead end into a routing
problem: lift the load over it. The pillar test now locates the feature by the
property that actually defines it, and the whole-room question is an assertion
(`__doids.chamberRoute`, run at three envelope heights).

**Two more bugs, both invisible before there was a tether.** `seatPayload` forced
a *slack* sling taut, which drove the load into the deck on the frame you cradled
it — a sling being fastened does not shove the box away from you. And the 41s beat
was inferred from `staticClock` getting smaller, which is wrong exactly when the
wrap lands early in a period; there is now an explicit `staticBeat` flag set by
`updateStaticClock`. A third was a gap rather than a bug: only the *towed* rack was
simulated, so a released load hung in mid-air and §4.2's drop damage was
unreachable.

**Death in a chamber was off-world.** `spawnShip` places the ship relative to
`level.mx/my`, which a chamber leaves at `-9999`, so a life lost dropped the hull
clean out of the world — the single most common thing a player does while a slice is
being hand-tuned. `respawnInChamber` re-enters at the chamber's own entrance with
the rack network untouched: a life costs you the flight back, not the room. Full
per-chamber checkpointing is still P·persist, and the slice was built to hand it a
clean shape — all per-chamber state lives on `level.racks`/`level.conduits`/
`level.wellDock`, with nothing hiding in module scope.

**Two open design questions closed, and the answers were "yes" and "no".**
Mid-band *is* right for a momentum pinch: the derived 77px sits between the 105px a
hanging load needs and the 48px a load trailing at your own level needs, and
steady-state thrust puts the load at ~72° off vertical (a 57px envelope), so it
passes under power with about 20px of margin and cannot be crept through. And the
floor *was* too landable — it gained the structural column, and the pinch now sits
on the only route to the well so the question cannot be dodged.

**What it has not had is a phone.** Every feel value is authored, exposed through
`__doids.get().actTwo` and defaulted; none of it is tuned. The dials sit in one
block at the top of `js/acttwo-data.js` — `SLING_VISIBLE` first, because it derives
`SLING_L` and with it the momentum band and both authored gaps, so moving it is a
one-number change rather than a re-author. No test asserts a tuning number, on
purpose: the suite proves the rules.

## P·terrain — span terrain and the chamber authoring grammar (July 2026)

**Release:** 1.1. Not reachable in normal play. *(Recorded here retrospectively —
the bundle landed in PR #70 without its changelog line, which the per-bundle
convention at the top of this file asks for.)*

**The shipped terrain model could not express an overhang.** Terrain was a
heightmap — `heights[]`, one floor per column every 16px — plus at most one
parallel ceiling for caves, clamped so every Act One cave is a tube with a
guaranteed 175px gap. No overhangs, no pinch points, by construction. Act Two's
chambers are specified as larger than any surface sector with overhangs and tight
spaces authored for a tether, so the representation had to change before the slice
could prove anything.

**Generalised to columns of spans** rather than moved to polygon terrain: each
column carries N open `{top, bot}` intervals instead of one floor, which is a
strict superset of what shipped. Collision stays an O(1) column lookup, `STEP`
survives, the tile cache survives, and `groundAt`/`roofAt` keep their shape with an
optional second argument saying which span you mean — every Act One call site
passes `x` alone and takes the heightmap path completely unchanged, which is how
the M1 golden checksum stayed at `1090254029`. Two spans in a column *is* an
overhang; a short span is a pinch; a column with none is solid rock. A true
re-entrant hook remains unexpressible, and that was accepted rather than paying to
invalidate every terrain helper, the landing maths and the fairness passes.

Ten large chambers cannot be hand-typed as columns, so the bundle also brought the
**authoring grammar**: a chamber is a short ordered list of coarse `room`/`rock`
parts, compiled to spans at load, deterministic from the chamber's own seed and
therefore checksummable exactly as the heightmap is. Rock inside a room is how you
author an overhang. Boundaries carry a **material** (raw rock or milled, so "rock
overhead, mechanical underfoot" is expressible per surface rather than per chamber)
and a **profile** (ramp, arc, teeth, plus corner fillets, so a chamber is not
condemned to right angles). A part may also declare a **view**, which is how §8's
false floor and painted rock are held: `spans` is collision truth and `spansDrawn`
is what you see, compiled from one definition and identical unless a deception is
declared.

`SLICE_CHAMBER` is the one authored chamber and exists to prove the format rather
than to be content — a 9000×2050 working floor with bays and mezzanines and the way
down at the far end, plus the tow-envelope geometry (`towEnvelope`/`towTierForGap`)
that classifies every gap as passable at rest, a momentum pinch, or unladen-only.
Drawing is the complement of the spans through Act One's own per-512px tile cache
contract, with additive light pools over it so a plant reads as lit *by* something.

Two bugs came out of it, both invisible to Act One: `pickSpan` returned null for a
column that plainly had spans, which silently made `groundAt(x)` return the bottom
of the world on any chamber; and the pixel-agreement test had been parking the ship
at its own probe point and reading the hull's cyan as rock.

## 1.1 planning round: span terrain, the reversed deception tell, ten new minds, and Mary Seacole

**Release:** planning only — no code changed. Affects **1.01** (V1) and **1.1**
(Bundle P).

An owner round settling how Act Two gets built. Six decisions, three of which
came out of checking the spec against the code and finding it wrong.

**Span terrain, because the shipped model can't express an overhang.** The
chambers are specified as larger than any surface sector, with overhangs and tight
spaces, authored for a tether. Terrain today is a heightmap — one value per 16px
column — and caves add a single parallel `roof[]` clamped to
`heights[i] - 175`, so every Act One cave is a tube with a guaranteed gap and no
re-entrant geometry at all. Decision: generalise `roof[]` to **N floor/ceiling
pairs per column**, a strict superset that keeps O(1) collision, `STEP`, the tile
cache and the shape of `groundAt`/`roofAt`. True re-entrant hooks stay
unexpressible and that's accepted; polygon terrain was rejected as it would
invalidate every terrain helper, the tile renderer, the landing maths, the M1
checksum and the V2 fairness passes. This now **gates the vertical slice**, and
the slice chamber must contain an overhang and a pinch point — otherwise it
proves the tether against terrain the real chambers won't have.
See ACT_TWO_SPEC.md §11.0.

**The deception tell was false against the code, and is replaced.** The spec said
a projected ledge reads as fake because it is *"perfectly flat and perfectly
level — nothing in this game's terrain is level except things he made."* But
`flatten()` sets every heightmap sample in a span to a single height, so every
landing pad, lift pad and V2 scan shelf in the shipped game is mathematically
level; and Act Two is set inside a maintained facility, where machined level
floors are legitimately everywhere. Replaced with **"the world doesn't respond to
you"**: thruster wash raises grit off real rock and nothing off a projection (and
the inverse for painted rock), with the lamp-casts-no-shadow tell promoted to a
real second channel. Better than a patch — it's an active probe that costs only
time and care, so hovering to check now fights the draining reserve instead of
sitting beside it, and it never touches the oath. See §8.1.

**Ten new famous minds, each tied to a system** (owner ask). Laennec
(AUSCULTATION), Snow (THE PUMP HANDLE), Harvey (CLOSED CIRCUIT), Paré (I DRESSED
HIM), Röntgen (RADIOGRAPH — capped at one sweep per chamber or it disables the
deception layer), Landsteiner (CROSSMATCH), Morton (THE ETHER DOME), Forssmann
(THE CATHETER), Apgar (THE APGAR SCORE) and Saunders (THE VIGIL). THE VIGIL is
the load-bearing one: it lets a failing rack hold at a single flicker rather than
flatline, which resolves the standing tension between "flatline is total death"
and "the player must always be able to save everyone" without softening either —
and because it's earned, the softening is a reward rather than a difficulty
setting. Checked against `FAMOUS` for benefit collisions; none. See §9.1.

**Mary Seacole unlocks the ROTATION CHART, in 1.01.** Fly-back to cleared sectors
lost its unlock when Laennec moved into Act Two. The owner's answer: a **twelfth
famous Scion in THE NULLWAVE**, left behind the finale's existing 6-of-7
black-box gate — she paid her own passage to the Crimea after being refused, and
went back onto the field for men others had left behind, which is precisely what
the chart is for. The unlock is persistent (keyed off `codex`, like the CANON hint
gate) so it arms every *subsequent* rotation, making it the veteran's tool. Two
constraints recorded: the new finale placement must not consume RNG (or the
finale layout shifts), and she must be pinned and excluded from
`buildFamousMap`'s shuffle or REMIX can draw her onto a surface sector.
**THE FULL CODEX becomes 12 for free** — the threshold is derived from
`FAMOUS.length` and the Game Center description is count-free — but
`the_full_codex.png` depicts eleven stars and needs a twelfth.
She lands in **1.01, not the 1.0 build in review**: a new binary would restart
App Review, and completing the codex takes multiple REMIX rotations, so
effectively nobody can hit 11/11 before 1.01 ships. See roadmap V1.

**SOLACE's beacon was a relay, not the transmitter** (owner refinement). This
closes a hole in the first draft — *why did the signal read as coming from her?* —
because her beacon has been faithfully rebroadcasting what's tapped below it all
along. The instruments were right about the bearing and wrong about the origin,
which is the game's thesis in one object. No shipped copy contradicts it: THE
ANSWERED CALL identifies *where* the beacon was, not what was transmitting, and
Hollow 0's shrine card already establishes hand-built relay hardware. See §5.1a.

**Also:** persistence promoted from an open question to real scope (§11.2 — a
`doids_run` schema bump with a non-destructive migration, per-chamber
checkpointing, the E4 iCloud mirror, and a test that an Act One save still
loads); Bundle P **phased** into eight dependency-ordered items; Bundle Q **fully
dispositioned** with its items struck and its guard moved to V1; **1.2 confirmed
cancelled** and the two queued achievements moved to P·ship; device tuning
**confirmed available**, which decouples build order from release order so Act Two
is built now and held for 1.01; and **new source files approved for Act Two** —
`js/acttwo-data.js`, `js/acttwo-update.js`, `js/acttwo-render.js`, loaded between
`world.js` and `update.js`. That last one lifts a convention rather than breaking
it: the "don't add files" rule was a guardrail against unasked drift back to the
old 5,400-line sprawl, not a technical constraint, and the technical ones
(non-module, load order, `index.html`'s script list, `app/sync.sh` copying `js/`
wholesale) all still hold.

## The scuttle charge becomes a universal escape hatch

**Release:** 1.01

Owner playtest: *"You can get trapped in a gravity well with no fuel to escape. We
need a scuttle for that situation."* The "gravity well" is a **gravity anomaly** —
the concentric rings in CURIE FIELDS and later sectors — not a dip in the terrain,
which is how it was first read. The anomaly case is the substantive fix below; the
first attempt at a terrain reading has been rolled back.

- **The resupply floor stays flat across gravity** (owner decision). It was briefly
  scaled by `gravScale`: `XFUSE_FLOOR = 35` is documented as the smallest tank the
  drone will leave you with — "≥ primer + enough to limp to the next pad" — so the
  lifeline "can never soft-lock a run", and that was measured at 1× while Bundle Z
  now allows ~2.2×. **Rolled back.** The anti-soft-lock guarantee is carried by the
  scuttle charge instead, which works on any empty tank whether the ship is landed
  or held aloft, so no amount of gravity can make a strand terminal. With the
  soft-lock closed there, scaling the floor would only hand the player a bigger tank
  in exactly the sectors Z widened its range to make *harder*, and quietly inflate
  the points `XFUSE_COST` charges for the fill. Heavy gravity is meant to be heavy.
  The reasoning is recorded at the constant so it isn't re-derived and re-applied.
- **The scuttle charge now works above ground, and does not require a landing.**
  It existed already but was gated to the Hollows, where there's no drone to call.
  On the surface it sits on **SHIELD** rather than THRUST: THRUST already signals
  the drone there, and the force field is a genuine no-op at zero fuel
  (`wantShield` requires `fuel > 0`), so there is nothing to collide with. Same
  2.4s hold and progress ring as underground, so it reads as the one mechanic it
  is. Deliberately **not** gated on the drone having been used — the two are
  alternatives the player chooses between, and U2's diminishing priced resupply
  economy is untouched. (A first attempt did gate it that way and broke three
  existing tests, including U2's own "never soft-locks" case, which legitimately
  takes two tanks in one sector.)
- **The gravity-anomaly soft-lock** — the owner's actual "gravity well", and the
  reason the scuttle can't require a landing. An anomaly's pull is strongest at its
  **core** (`str * (1 - d/r)`, so it grows as you approach) and **nothing in the
  physics damps velocity** — the only velocity scaling anywhere is the resupply
  drone's own speed clamp. So a fuel-dry ship carried into one oscillates around
  the equilibrium indefinitely: it never touches ground, `ship.landed` never goes
  true, and therefore *neither* the drone signal *nor* (before this fix) the
  scuttle could be reached. The run could only be abandoned from the pause menu.
  Both the charge and the on-ship prompt now trigger on an empty tank alone,
  airborne or not; the prompt reads `OUT OF FUEL — SET DOWN TO SIGNAL` while
  airborne, since the drone genuinely does need a touchdown. Allowing it mid-air
  everywhere else costs nothing — a dry ship anywhere but an anomaly is simply
  falling, and it still takes a deliberate 2.4s hold.

**Owner decision, no code change: the anomaly stays dangerous.** `str` is 80–120
against `THRUST` 138, so escaping a core under power is possible but tight — and
tighter still in a heavy Bundle Z sector, where a strong anomaly may be inescapable
even with a full tank. Asked directly, the owner wants that risk kept: *"Happy with
the chance of being stuck in an anomaly. Like that risk."* So `str` is deliberately
**not** capped against `THRUST` and **not** scaled against `gravScale`. It reads like
a fairness bug and isn't one: losing the ship to an anomaly is a legitimate outcome,
and the out is the scuttle. Being unable to *act at all* was the bug. Recorded at the
force calculation in `updatePlay` as well as here, since that's where a future
session would go looking to "fix" it.

New copy in [COPY_DECK.md](COPY_DECK.md) §8/§8b: the surface prompt gains
`OR HOLD SHIELD TO SCUTTLE`, and the scuttle banner no longer claims the Hollows
when you're on the surface. Three new smoke tests (the surface scuttle including
release-decay, the untouched THRUST lifeline, and the gravity-scaled floor at
0.4×/1×/2.2×); full suite green at 120.

## The Solace's hull reveal reads brighter and holds

**Release:** 1.01

Owner playtest: *"she could ping slightly brighter/more sustained"* — meaning the
reflected-ping reveal that outlines her **whole** drowned hull, not her outgoing
pulse.

Two causes, both in the sweep's envelope. `SONAR_DUR` was 1.8s, and the opacity
was `Math.sin(p × π)` — a hump that only touched full brightness at the exact
midpoint, so the biggest reveal in the game was effectively a blink. Now 2.6s with
a **held plateau**: a quick sweep-in, full brightness while the sweep ring finishes
travelling out, then a fade. The sweep still paints her in progressively; what it
has painted now stays lit. The hull gradient is also lifted across the board and
most at the *bottom* stop (0.12 → 0.3) — the buried belly is the part that says
"this is a whole ship, not the bit you can see", and it was barely visible.
Reduced-flash still tones the glow, and a steadier reveal is if anything gentler
than the old hump.

## Bundle X + Z integration: the trainee sector's inherited crosswind

**Release:** 1.01

Found while merging Bundles X, V and Z into one build — the bug only exists once
X's training mode and Z's gravity system share a codebase, so neither branch's own
suite could have caught it.

`resetRun()` reset `gravScale` but **not** `gravTilt`. A campaign run is saved from
the leak by `rollGravity()`'s `runSeed === 0` early return, but **training never
calls `rollGravity` at all**: `startTraining()` builds its level directly instead
of going through `toBriefing()`. So opening the trainee sector after a REMIX or
DAILY run inherited that run's crosswind, and the tutorial taught "hold THRUST and
see it work" while an unexplained sideways shove pushed the ship off course —
teaching the wrong thing to exactly the players Bundle X exists for.

`resetRun()` now clears both. One new smoke test flies a REMIX seed that rolls a
real crosswind, then asserts the trainee sector comes up at plain 1× with no
sideways force. Full suite green at 116.

## Bundle X — onboarding: trainee sector, guided pauses, hint bank, in-app rating

**Release:** 1.01

The first 1.01 bundle to land — sequenced ahead of Bundles V and Z per the
roadmap's own priority order (X was flagged "highest-value retention work,
do it first"). Closes out Bundle X (X1/X3 already shipped in 1.0): X2, X4,
X5, and X6 (moved here from Bundle P, since 1.01 now ships before 1.1).

- **X2 — the trainee sector ("Level 0").** A bespoke, always-identical
  level under a new `runMode === "training"` — gentle terrain, one Scion,
  one distant avoidable turret, two fuel pods — entirely separate from
  `RECIPE`/`SECTOR_NAMES`/`BRIEFS` and the scored campaign. Never writes a
  hiscore. Reached from the X3 fork's "No" answer (which previously opened
  the HOW TO FLY guide) or any time from a new `◆ TRAINEE SECTOR` row in
  the HELP submenu.
- **X4 — the reusable "guided pause" overlay.** A new `"coach"` state
  dims the world and shows one tap-to-continue instruction, reusing the
  existing card-panel chrome; freezes the sim for free and composes with a
  real pause (Escape still works over it and resumes back into it).
- **X2a — the trainee sector's guided-pause script**, built on X4: six
  authored cards teaching THRUST, drift, fuel awareness, FIRE, SHIELD and
  a tease of the parry, the first three timed to the action they teach.
- **X2b — free-play after the rescue.** The sector never ends on its own
  (the Static clock, extraction, and the triage-flee UI are all no-ops in
  training); the plain way out is the pause menu, relabelled `RESTART
  TRAINING` / `END TRAINING` for training runs.
- **X5 — the post-death hint-card bank.** One rotating hint per death, no
  repeats until the bank cycles; six are always eligible, five more unlock
  once the player has met the system they describe (a parry, a scan, a
  counterfeit pod, a Hollow lift while veteran, Avicenna's CANON OF TRUTH).
  Three new persistent flags cover the gates without existing state.
- **X6 — the StoreKit in-app rating prompt.** A new `rating` facade
  (`js/platform.js`, mirroring the `gc`/`cloud` pattern) bridges to a new
  local Capacitor plugin (`app/plugins/rating`,
  `SKStoreReviewController.requestReview`). Called on a new high score and
  on a clean ("answered") ending; Apple's own OS-level throttling means no
  extra logic is needed on the JS side.

Copy for all of the above is mirrored in [COPY_DECK.md](COPY_DECK.md) §3
(new §3·X2/§3·X5 subsections). The full 96-test smoke suite is green,
including five new/updated tests covering the trainee mode, the guided
pauses, the hint bank's no-repeat rotation, and the rating-prompt trigger.

## Bundle X owner-feedback round: onboarding refinements, an efficiency bonus, and an ASSIST fix

**Release:** 1.01

A round of owner playtest notes on the shipped Bundle X (PR #61), plus two
requests that landed alongside it. All copy below is directional, not final.

- **Guided-pause pacing.** The THRUST → drift cards no longer advance on a
  bare tap; drift now needs 1.5s of *cumulative* held thrust so the player
  can actually feel THRUST work before the next card interrupts.
- **Event-driven training script (`TRAINING_CARDS`).** Rebuilt the
  sequential `TRAINING_SCRIPT` as an ordered list of `{id, cond, text}`
  cards, each firing the first time its own real condition is true rather
  than on a timer — FIRE waits for a gun actually on screen, a new "land
  close and it'll board" card waits for a Scion on screen, a low-fuel card
  fires under 33% tank, and two new cards ("fly it home to the recovery
  bay" / "hold in the bay to refuel") land after the first pickup and
  first delivery respectively. The old "other ways to put a gun down"
  tease — which gated on a parry the trainee sector never taught — moved
  out of the script entirely into the always-available hint bank.
- **A second Scion in the trainee sector**, placed past the turret, plus a
  third fuel pod — somewhere to fly once the FIRE/rescue cards land, and a
  reason to keep flying in X2b's free-play afterward.
- **Hint bank reworded and re-set.** All twelve hint-bank lines (`HINTS_ALWAYS`
  / `HINTS_GATED`) reworded to read as a flight-training officer's own
  advice, now quoted and attributed (`— FLIGHT OPS`) on the game-over
  screen, repositioned into the clear space above `FLATLINE` instead of
  wedged between the tally and the buttons below.
- **Bug fix: a "pace" Scion's post-panic position jump.** `explode()` panics
  any grounded Scion within 160px of gunfire; when the panic ended, the
  `persona === "pace"` branch snapped straight to an absolute sine-wave
  position instead of continuing from wherever the Scion actually was,
  reading as a visible teleport (reported on Level 1 / Asclepion). Now eases
  toward the target instead of snapping.
- **Owner feature: the minimum-journeys efficiency bonus.** Deliver every
  Scion in a sector using the fewest possible MERCY-bay trips for that
  sector's Scion count (`⌈scions / CAPACITY⌉`) and the sector-clear screen
  now shows `EVERY TRIP COUNTED — efficiency bonus +1000`, alongside the
  existing Hippocratic and stopwatch bonuses.
- **X6 refinement: a 5-completed-runs rating milestone.** `rating.request`
  is unchanged (Apple's own `SKStoreReviewController` dialog text can't be
  customized), but the contextual line shown just before it now has three
  tiers in priority order — a new hiscore, a clean sweep ("Every Scion came
  home. Want others to share your success?"), then the 5th completed run of
  any kind ("Five flights and counting — enjoying it?"). A new
  `doids_plays` counter tracks completed runs (wiped by RESET PROGRESS along
  with the rest of a player's save).
  **Owner follow-up:** on the web build the contextual line was showing with
  no native prompt to follow it (there's no OS dialog outside the Capacitor
  wrapper), reading as an odd standalone comment ("New personal best —
  enjoying it?" with nothing else happening). It's a lead-in to the review
  ask, not a comment on its own — a new `rating.native()` check gates it, so
  it only shows when a real prompt is actually about to fire.
- **Owner fix: ASSIST now also gates the landing-guide visuals.** Previously
  the dashed landing line, its SAFE/WARN/DANGER colour and glyph, and the
  descent/drift readout drew regardless of the ASSIST setting — only the
  post-touchdown auto-level behaviour actually respected it. With ASSIST off,
  none of that on-screen guidance draws; judging a landing is now unaided,
  matching what the toggle's label implies.
- **Owner feature: known-fake fuel pods can be scanned or destroyed, not
  only stumbled into.** Once Avicenna's CANON OF TRUTH marks a counterfeit
  pod, blind contact with it is no longer an automatic trap — land beside it
  and hold (same pacing as a lure-tree scan) or shoot it, either way +200 and
  no fuel/score penalty. Before CANON OF TRUTH, nothing changes: the pod is
  indistinguishable from a real one and blind contact still drains the tank.
- **Bug fix: answering the Solace's signal didn't reliably light up her
  submerged hull.** The hull-sweep visual (`sonarT`) only refreshed on the
  41-second Static beat, which stops entirely the instant the beacon
  resolves — so at the exact moment of a successful parry the pulse was
  often already stale by up to 41s and the payoff scene played with a dark
  hull. `resolveBeacon("answered")` now lights it immediately, and
  `updateEpilogue` keeps re-arming it so she stays visibly lit through the
  whole scripted scene, not just one flash.

Copy updates mirrored in [COPY_DECK.md](COPY_DECK.md) §3·X2/§3·X5 (rewritten)
and a new §3·X6, plus the §11 sector-clear line. Full smoke suite green.
## Bundle Z — REMIX variable gravity

**Release:** 1.01

Closes out Bundle Z: variable gravity for REMIX/DAILY replay variety, plus
the fairness re-tune it required.

- **Z1 — a per-run gravity scale** (~0.7×–1.4×), drawn deterministically from
  `runSeed` so the same seed always rolls the same gravity. REMIX/DAILY
  only — campaign (seed 0) always plays at exactly 1×, byte-identical to
  before. Surfaced in the briefing mode-line: `REMIX ROTATION // seed <n> ·
  heavy world` / `· thin gravity` (no label for a near-1x roll).
- **Z2 — the landing-fairness thresholds now scale with gravity.** A heavier
  world means a naturally faster, harder-to-arrest descent; the safe-speed
  tolerance scales by `sqrt(gravScale)` (not linearly — doubling gravity
  only needs ~41% more allowed descent speed to stay equivalently fair) so
  the same quality of approach reads the same across the whole gravity
  range. Sideways drift and ground-slope tolerance are untouched, since
  gravity doesn't cause either.

M1 golden checksum unchanged; two new smoke tests confirm the seed-to-scale
determinism and the fairness re-tune's exact scaling relationship.

**Owner playtest follow-up:** the ~0.7x-1.4x range read as barely different
from 1x, and one roll for the whole run meant a REMIX flight sat at that
one barely-noticed value the entire time.
- Widened to **~0.4x-2.2x**.
- **Re-rolled every sector** (`toBriefing(n)` now calls `rollGravity(n)`,
  seeded from `(runSeed, n)`) instead of once at launch — a REMIX/DAILY run
  now moves through a genuinely different gravity each sector, still fully
  deterministic per seed.
- `gravLabel()` gained two more tiers at the new extremes: `crushing
  gravity` (≥1.7x) and `near-weightless` (≤0.5x), alongside the existing
  `heavy world`/`thin gravity`.
- Campaign (seed 0) is unaffected either way — still exactly 1x, every
  sector, always.

**Owner feature: a per-sector crosswind.** The owner asked for gravity that
could "have fun" with direction too — sides, even above. Scoped to a
tractable version: a constant sideways pull alongside the existing downward
one, not a full direction flip (which would mean rethinking terrain, camera
orientation and the HUD for those sectors — closer to a new game mode).
"Down" stays down; the ship is just also being shoved sideways.
- **`gravTilt`** (-1..1, + pulls right) rolls alongside `gravScale` from the
  same `(runSeed, sector)` seed. `gravSide()` returns the sideways
  acceleration, capped at half of that sector's own (scaled) vertical pull
  (`TILT_STRENGTH = 0.5`) — a strong crosswind never dominates the descent.
  Applied to `ship.vx` every frame the ship is airborne, same gating as the
  vertical pull.
- **The sideways landing tolerance widens with it**, on the same "the
  environment did this, not the player" logic as Z2 — linearly this time
  (a constant added force, not an accelerating one), so the same quality of
  approach still reads the same in a crosswind.
- **Surfaced everywhere the player needs to know before or during flight**:
  the briefing mode-line (`· → wind` / `· ← wind`, alongside any magnitude
  label) and a persistent HUD readout on the score line during flight — not
  a one-time brief you can forget mid-sector.
- Scope note: affects ship flight only for now, not particle debris or a
  thrown/rescued Scion's fall — those still fall straight down regardless of
  a sector's crosswind.

New Z3 smoke test covers the tilt roll's determinism/bounds, that it
actually pushes the ship, and the widened drift tolerance. Full suite green.
## Bundle V — fairness fixes and owner-playtest defects

**Release:** 1.01

Closes out Bundle V's remaining open items: a real generation-fairness bug
(V14), a story-climax reveal that used to race the death screen (V15), and
five smaller owner-playtest defects (V16–V20). V11 was an owner decision
(resolved: leave the decoy MERCY as a deep secret, no code change) and V12's
checkbox was stale (its sub-items had already shipped).

- **V14 — the V2 scan-landing fairness invariant now holds across the whole
  REMIX seed space**, not just the deterministic campaign. `startRemix(seed)`
  takes an optional explicit seed (`__doids.remix(seed)`), so a failure is
  reproducible instead of a one-shot. A brute-force sweep (30,000 seeds × 7
  sectors) found two real domino effects the original single-pass fix never
  re-checked for — the lift-flat reassert's own repair overwriting a third,
  unrelated Scion's already-fair band, and a mutual ping-pong between two
  neighbours whose pads never overlap but whose checked scan-bands do. Fixed
  by re-running the fairness pass a second time after the lift reassert, plus
  a final verify-as-you-go backstop. M1 golden checksum unchanged.
- **V15 — the counterfeit MERCY's trap is a held beat, not a banner that
  raced the death screen.** A new `swallow()` SFX (a lower, wetter
  `hydraulic()`) fires the instant the trap closes; a tap-gated panel then
  holds until dismissed, and only then does the ship go down.
- **V16 — a turret beside the Solace no longer floats over her crater** once
  the ridge collapses; it goes down with the blast.
- **V17 — answering the Solace's pulse re-lights her whole hull**, the same
  reveal the ambient 41-second tell gives, instead of only spawning
  particles.
  **Owner playtest follow-up:** the fix only set `sonarT` once in
  `resolveBeacon`, and nothing decremented it during the "epilogue" state —
  so it sat frozen at exactly `SONAR_DUR`, which is the sweep animation's
  `puls = 0` (fully transparent) for the whole 6.5s scene. The hull never
  actually looked lit. `updateEpilogue` now ticks it down and re-arms it, so
  the sweep plays and repeats through the whole scene, not just a
  never-visible freeze-frame.
- **V18 — the first field resupply gets a one-time acknowledgement** ("You're
  not alone. Help is on the way. But there is a price."), instead of a drone
  appearing with no context.
- **V19 — the occasional landing spin is gone.** `s.ang` could sit several
  full turns past zero after a long flight; a new `normAngle()` helper
  normalizes it to `(-π, π]` before the assist ease, instead of visibly
  spinning through every accumulated turn.
- **V20 — Avicenna's dunes no longer spill past their own terrain on a
  slope.** Every other wide ground-anchored decoration rotates to the local
  ground tilt; `drawDune` was the one that didn't.

Copy for V15/V18 mirrored in [COPY_DECK.md](COPY_DECK.md). Five new/updated
smoke tests; full suite green.

### Owner playtest round 2

A second live round on the same branch. Earlier items in this round (the
pre-reveal Solace hint removed, the sonar hull-shape bug, the COUNTERFEIT TIME
card, the veteran ending line) are described in the commits; this entry covers
the post-completion flow, the reset wipe and the Solace's tell.

One report from this round is **not** fixed: a "floating gun" turret left
hanging, which two investigations could not reproduce or explain — V16's kill
radius provably matches the crater's. It's tracked as roadmap item **V21**,
pending a retest against the now-merged `main`.

- **A repeat completion goes home to the title, not into another campaign.**
  Finishing a run that was *already* a veteran run used to tap straight through
  the win screen into `startFreshRun()` — and because `vetIntroSeen` was set,
  that meant no menu and no acknowledgement, just sector 1 of a fresh campaign.
  A **first** completion still flows on unbroken (that tap is what plays V8's
  once-only VET_INTRO); a repeat now lands on the title with a one-off gold
  nudge toward the rotations, which are the actual loop once the campaign is
  done. `endingFirstRun` is now also stamped on the "unresolved" ending path,
  where it previously kept a stale value from a previous run.
- **AMS Solace's hull watermarks the title** — an outline-only ghost under the
  wordmark, drawn from the same `solaceMercyPath()` the destruction reveal and
  the bad-ending card use. Gated on a new persisted `solaceSeen`
  (`doids_solace`), set only by `resolveBeacon` — so a player who never reached
  her doesn't get the finale's biggest reveal spoiled on the menu. Deliberately
  *not* set by the "unresolved" ending, which fires before the finale sector is
  ever entered.
- **Two save-wipe gaps closed.** `RESET PROGRESS` now also clears
  `doids_solace` and `doids_lastrun_tally`; the latter meant a freshly-reset
  save could still be told it "brought them all home" by the VET_INTRO recap,
  on the strength of a run that no longer existed.
- **A wipe now takes the live run with it** (owner: "the reset didn't fully
  clear"). SETTINGS is reachable from the pause menu, so `RESET PROGRESS` can be
  triggered mid-flight — and it cleared every save and flag while leaving the run
  itself completely untouched, then tapping out of settings returned you to that
  same pause screen. You resumed a run belonging to the save you had just
  deleted, still carrying the veteran-only Glycon layer, because the counterfeit
  MERCY twin and the Hollows lift are gated on `veteran` at `genLevel` time and
  the sector had been generated before the wipe. `resetProgress()` now rebuilds
  boot-fresh state (`resetRun`, `genLevel(0)`, `spawnShip`, camera/particles) and
  lands on the title, which also makes the wipe visible: hi score 0, empty codex,
  no REMIX/DAILY pills.

- **The Solace transmits on approach** (owner: "the beacon wouldn't respond").
  She used to pulse only once `revealed` — and `revealed` requires you *landed*
  within 120px of her. Until then she was completely inert: you could hover right
  beside her, well inside the 300px `ANSWER_RANGE`, and get nothing back at all.
  The pre-reveal "land beside it, or open fire" label removed earlier in this same
  round was the only thing carrying that requirement, so the beat was left with no
  tell whatsoever. She now casts her looping distress wave as soon as you are near,
  revealed or not — she *is* "still transmitting", and that is the clue, wordlessly.
  Landing still names her; only a post-reveal parry answers her (a lucky early
  parry is discarded rather than banked). A **pre-reveal wash costs no vitals** —
  being docked 12 vitals every 4.5s for approaching a mystery you haven't been told
  how to answer would just relocate the unfairness — but it keeps the surge, shake
  and flash. Full stakes resume once she's named.
- **A pre-reveal parry names her instead of being thrown away** (owner: "when I
  parry the Solace's signal, I see it bounce back and hit the ship — but nothing
  happens"). A follow-up defect in the change above: now that she pulses on
  approach, a player can parry her *before* ever touching down. That parry
  succeeded — the round visibly bounced off the shield and burst back at her — and
  then the beacon logic silently discarded it, because resolving her before the
  STILL TRANSMITTING card would land the card after its own payoff. A successful
  parry is the hardest input in the game and must never be a no-op. It now
  triggers the **reveal**: she answers being answered by giving up her name, and
  the next pulse you parry resolves her. Same beats, same order, nothing wasted.
  The reveal is factored into a shared `revealBeacon()` so the landing route and
  the parry route can't drift apart. One consequence, deliberate: landing beside
  her is no longer the *only* way to earn the name card.
- **Landing anywhere on her buried hull names her** (owner: "I didn't get the card
  either… it just started pinging me"). The reveal band was **120px** — narrower
  than the ship the player is standing on. `genLevel` flattens a **±250** ridge
  over her, and her hull (`solaceMercyPath`, ±152 × `SOLACE_MS` 1.3) spans **±198**.
  So you could set down directly on top of her, well inside `ANSWER_RANGE` and
  being pulsed every `ANSWER_GAP`, and get nothing at all — her tower is a small
  target on a wide flat ridge, and in the dark it's barely visible. Now a named
  `REVEAL_RANGE = 200`, matching her actual hull: land anywhere *on* her and she
  gives up her name. Strictly a superset of the old band, so nothing regresses.
  The existing V3 test couldn't catch this — `warpBeacon()` teleports to her exact
  x — so the new test lands 170px out and also asserts the ridge really is flat
  there, i.e. that it was a genuinely landable spot rather than a cliff.

Owner decision, no code change: arriving at the finale with no fuel makes the
Solace unanswerable (the shield, and so the parry, needs `fuel > 0`) while her
pulses keep draining vitals. Reviewed and **left as-is** — flying in dry is a
planning failure and losing the run to it is fair.

Five new smoke tests (both routing branches, the hull gate, the mid-run wipe, and
the pre-reveal pulse); full suite green at 101.

## Bundle DS — the design system made enforceable, and colourblind mode made real

An audit of the live game assets against
[DESIGN_SYSTEM_STARTER.md](DESIGN_SYSTEM_STARTER.md) found the doc described
the build accurately but nothing enforced it — and one consequence was not
cosmetic. **Colourblind mode barely worked.** `PAL()` was called 22× across
`js/render.js` and `js/update.js` while the four semantic hexes were hardcoded
~93× in the same files, so the palette swap reached the landing guide, the ECG
and the transfusion line but not the fuel bar, the shield bubble, the settings
toggles, the codex markers or any on-screen button. The flight controls could
not swap at all: their colours live in `css/game.css`, which cannot read
`PALETTES`.

Pulled into the **1.0 launch build** (owner decision) rather than 1.01 — a
shipped accessibility toggle that doesn't do what its label implies is a launch
problem.

- **A token layer** in `js/world.js` beside `PALETTES`: `TOK` for the fixed skin
  (void, cyan ramp, violet, gold, ember, focus), `PALETTES` for the four
  *meanings* that swap. `shade(hex, a)` builds translucent semantic colours —
  hand-written `rgba()` literals were the other half of the leak, with a stroke
  staying green while the fill beside it swapped.
- **130 semantic literals and 27 rgba variants** now resolve through `PAL()`.
  Fire flavour was split out first so it *doesn't* swap: a flame's hot core is
  amber for a different reason than a fuel warning is amber.
- **The flight controls swap**, via channel-triple CSS custom properties and a
  `body.cb` class. Also collapsed four duplicated `.down` rules into one.
- **`#eaff6b` was one undocumented literal doing two jobs** — the selection
  cursor and the parried-round tell. Split into `TOK.FOCUS` and `TOK.PARRIED`.
  Hostile fire now swaps to the colourblind white, so parried-vs-hostile reads
  by hue *and* luminance for every CVD type; yellow-green against pink did not.
- **111 font strings** migrated to `mono()` / `body()` / `display()`. The four
  sizes outside the documented scale were all headings, so the scale was widened
  to admit a 16–18px mono heading step rather than the hierarchy flattened.
- **The marketing pages** (`about.html`, `support.html`, `privacy.html`) now use
  `--ho-*` colour tokens instead of raw hex duplicated three ways, and the
  JetBrains Mono Google Fonts import is gone — a third typeface the system
  doesn't allow, which never won the cascade on Apple hardware, and which made a
  third-party request to Google from the page promising *"No data is sent to us,
  sold, or shared with third parties."* All three now issue zero external
  requests.
- **Two guards** in `tests/settings.spec.js` instrument a live frame and assert
  on every colour actually painted, plus the computed border colour of the
  buttons. The old test checked only that the *flag* persisted — which is how
  this drifted unnoticed. Suite green at 92.

Left alone deliberately, flagged for on-device review: `PALETTES.cb.DANGER` is
`#ffffff`, and after this change it reaches enemies and hostile fire. Pure white
is the conventional third channel next to the cb blue and orange, but §7 says
don't use saturated white for large fills.

Full record: **Bundle DS** in [ROADMAP_ARCHIVE.md](ROADMAP_ARCHIVE.md).

## Copy pass: cut "MERCY ACTUAL", fix name/term leaks and a location ambiguity

Owner-requested: "MERCY ACTUAL" read oddly as a message source and, on
reflection, the military-radio "ACTUAL" (the real command station, as
opposed to a subordinate relaying) was an accidental hint at the finale's
counterfeit-MERCY twist sitting in the very first briefing, sector 0 — cut
to plain "MERCY" (the only occurrence, `BRIEFS[0]`).

That prompted a full comprehension/continuity pass over every player-facing
string (index.html's copy, cross-checked against COPY_DECK.md), which
surfaced three real bugs beyond the requested fix — all now corrected in
both the game and the deck:

- **The villain's name leaked around the story's own gating.** Two floating
  texts (`"COUNTERFEIT — GLYCON'S LURE"` on a fake pod, `"— GLYCON
  TRANSMITTER"` on a lure-tree reveal) and one card kicker (`"GLYCON · THE
  THIRD ACT"` on the counterfeit-MERCY trap) all named GLYCON directly and
  fire in the ordinary campaign path starting sector 5 and in the finale —
  but the name is otherwise earned *only* through the optional hidden
  Hollows shrine or a late log fragment (both of which the game's own
  fragment-drip (`grantFragment`) correctly serves in strict order, so
  that part was never the problem). Worse, sector 6's own briefing still
  says "archive is still matching it" a full sector *after* the UI had
  already asserted the name as fact. Renamed to `SOMEBODY'S LURE`,
  `COUNTERFEIT TRANSMITTER`, and dropped the kicker's `GLYCON ·` prefix —
  none of which need the name to land, and the shrine/ending reveals (which
  *are* correctly gated on `shrines.size`) are untouched.
- **"Vector" had no antecedent.** The July 2026 rename (roadmap S6) swapped
  "saboteur" for "Vector" throughout player-facing copy, but no line ever
  told the player what a Vector *was* — the term could appear (a boarding
  kill, the Antisepsis upgrade card) before any in-fiction introduction.
  `BRIEFS[1]` (Vesalius Ridge, where they're first encountered) now adds
  one clause: "Comms has a name for them now: Vectors. Carriers, not
  survivors." — enough to anchor the term without spelling out the
  mechanic, ahead of every other place it's used.
- **A location-name ambiguity.** `BRIEFS[6]`'s "Last leg before the ridge"
  risked reading as a callback to Vesalius Ridge (five sectors past)
  instead of the finale's nullwave ridge, named explicitly one briefing
  later. Changed to "Last leg before the nullwave."
- Also cleaned up a smaller ambiguity in the hollow-rock cache pickup text
  ("stashed away from the serpent" → "someone didn't want this found") —
  the true rod-of-Asclepius serpent is on screen from sector 0, so "the
  serpent" alone risked reading as the wrong one before Glycon's mark is
  established (the exact emblem-duality risk GAME_DESIGN.md §2.4 already
  flags for writers).

## July 2026 owner-playtest feedback → Bundles R, S, T + the copy deck

The owner's phone-playtest feedback structured into three new roadmap bundles
in APP_STORE_ROADMAP.md, sequenced before Bundle O (submission):

- **Bundle R — playtest fixes (blocks submission):** help-card overflow on
  phone viewports, PAUSED/RESUME overlap + pause-state guards, shield-button
  placement, a visible pause button, an explicit ▶ START NEW FLIGHT pill
  (no more tap-anywhere), even title line spacing, codex spacing + clickable
  codex entries (re-open reveal cards), bigger/longer-lived in-flight copy,
  and a new saboteur-reveal colour (magenta — the old `#c6ff00` lime read as
  famous-Scion gold).
- **Bundle S — feel improvements (owner-requested for launch):** SFX
  modernisation (the shot loses its 1982 square wave; the cabin fills with
  per-passenger heartbeats — a saboteur is the silent slot in the chorus),
  vitals-reactive ambience, cave echo + drips, the extraction endgame
  reworked into a fly-into-the-ventral-hangar docking (plus the ≥50% "triage
  call" early-extraction option at a cost), identified saboteurs may now be
  flagged and left behind (catalogue scan), the VECTOR rename recommendation,
  sabotage-legibility pass, and the "where are the original Scions?" 1.2
  teaser (pays off in Bundle Q's THE WARD via Bundle P's pendulum).
- **Bundle T — zone identity:** progressive sector widths (with fuel-economy
  compensation), per-sector biome palettes threaded through the D4 terrain
  tiles, per-biome ornamentation sets and ambient beds, staged nightfall on
  Nightingale Basin (scarier intro, canon pairing preserved); destructible
  scenery (T4) and weather systems (T5) specced as launch-stretch with a
  pre-approved slip to 1.1.
- **`COPY_DECK.md` (new):** every player-facing string, organised by surface
  with code anchors, for owner line edits — plus a standing rule that any PR
  touching a player-facing string updates the deck in the same PR.

## Game Center achievement art & App Store Connect copy (July 2026)

The asset half of G3, ready to paste into App Store Connect
(*Services → Game Center → Achievements*):

- **Nine 1024×1024 achievement images** in
  `assets/gamecenter/achievements/` — one per launch achievement, composed
  for Game Center's circular crop (meaning inside the centre circle, the
  outer ring survives the crop). SVG sources in `svg/`, regenerable via
  `generate.py` (headless Chromium render).
- **`GAMECENTER_ACHIEVEMENTS.md`** — the full ASC metadata table: ID, name,
  hidden flag, and the earned/pre-earned description copy (earned = past
  tense, what you did; pre-earned = a hint that never spoils — the SECTOR
  WARDEN hint was reworked to stay oblique about the ending).
- Housekeeping in the same pass: `configure-ios.sh` now also sets
  `ITSAppUsesNonExemptEncryption = false` (the game uses no encryption
  beyond HTTPS — exempt), so TestFlight builds skip the manual
  export-compliance question on every upload.

## Bundles E + G: the native wrapper and Game Center (July 2026)

The Mac-gated work, written so the Mac session is a checklist
(`app/MAC_SETUP.md`). Owner decisions locked in: bundle ID
`com.burners70.hollowoath` (permanent), iOS 16+ floor, E+G in one pass,
1024 icon upscaled from `icon-512.png`.

- **E1 Capacitor scaffold** in `app/`: `package.json` (core/ios/haptics/app/
  status-bar + two local plugins), `capacitor.config.ts`, `sync.sh` (root →
  `www/`, root files stay the source of truth), `setup-mac.sh` one-shot
  bootstrap.
- **E2 native shell config** as an idempotent script (`configure-ios.sh`):
  landscape-only, status bar hidden, `UIRequiresFullScreen`, black webview
  background, iOS 16.0 target; plus a native `appStateChange` hook in
  `index.html` backing A4's auto-pause inside the wrapper.
- **E4 iCloud save sync**: `hollow-icloud-kv` Swift plugin
  (`NSUbiquitousKeyValueStore`, ~40 lines) + a web-no-op `cloud` facade —
  every persistence write mirrors up (`doids_run/hi/codex/logs/
  shrines_seen/veteran`), `syncFromCloud()` merges on launch (max hi-score,
  union sets, cloud run only if local has none), RESET PROGRESS wipes the
  cloud copy too.
- **E5 privacy manifest**: no tracking, no collection, UserDefaults/CA92.1
  only.
- **E6 icon & launch screen**: single-size 1024 AppIcon + black Menlo
  wordmark storyboard.
- **B5 (found during E6): the icon PNGs still wore the red cross** — the
  Geneva-Conventions emblem Bundle B removed from the game. All three web
  icons and the new 1024 master now carry the staff-and-serpent
  (drawAsclepius's exact bezier geometry, same `#ff2d55`).
- **G Game Center**: `hollow-game-connect` Swift plugin (silent auth, never
  blocks play) behind a fail-silent `gc` facade; all-time + daily
  leaderboards from `saveHi()`/`recordDaily()` with FIELD MEDIC runs kept
  off both (H3); all nine achievements wired (`reportRunAchievements()`
  mirrors `drawWin`'s rank branches; FIRST DO NO HARM in `sectorClearNow`,
  THE FULL CODEX at the codex save).

Smoke suite now **34 tests**, all green (added: Game Center trace on the
answered-ending win path; easy-mode board gate). Still needing the Mac
itself: `setup-mac.sh` + signing, App Store Connect Game Center records,
E8 device matrix, F3 haptics restraint pass.


## Polish pass 2: remaining review items (July 2026)

Follow-on to the six owner fixes — the rest of the release-readiness review's
open bugs and the cheap QoL/perception wins:

- **§3.3 Settings fit + two new rows.** Settings is now a two-column grid
  (`settingsRowRect`) that fits a 320-high landscape viewport, with room for
  **REDUCED FLASH** and **RESET PROGRESS**; footer carries the build stamp and
  the no-ads/no-tracking line.
- **§3.4 HUD scrim.** A soft top-of-screen gradient behind the HUD band keeps
  the fuel bar / tally / score legible when MERCY or scenery renders through
  them on a high-camera spawn.
- **§3.5 Save validation.** `validRun()` gates the `doids_run` snapshot on
  schema version + field sanity before it becomes a RESUME pill; a corrupt or
  foreign snapshot is discarded, not restored into NaN state.
- **§3.6 Caps Lock.** Letter keys (`x`/`z`/`c`) now map case-insensitively, so
  an active Caps Lock no longer kills fire/thrust/shield.
- **RESET PROGRESS** (double-tap-to-confirm): wipes scores, codex, saves,
  veteran/daily/intro state; **keeps** the player's audio/assist/difficulty
  settings.
- **REDUCED FLASH** (`doids_flash`): softens the Static's high-frequency
  strobing — window flicker, ECG jitter, HUD label glitch — for
  photosensitive players; diagnostic meaning stays, amplitude drops.
- **Version stamp** bottom-right on the title (`BUILD_TAG`).
- **Music ducks** in pause and settings (was only briefings/cards).
- **Landing-guide onboarding line** added to the first briefing.
- **Darkness lights cached as sprites** (`darkPunchSprite`) — no more building
  ~15 radial gradients per frame on Nightingale.
- **Soft title heartbeat** on returning to the menu from a run (sound-gated,
  no haptic) — the phone-as-ECG signature from the first screen.

Smoke suite now **32 tests**, all green (added: reduced-flash persistence +
reset-keeps-settings, corrupt-save rejection, settings-fit at 320 h,
caps-lock flight). Review report updated (§3.1–§3.6 all marked fixed).


## Polish pass: six owner fixes (July 2026)

Post-review fixes on `claude/game-release-readiness-review-fq4o3n`, following
the release-readiness review (see RELEASE_READINESS_REVIEW.md):

1. **Lift transitions made graceful.** `startLiftTransit`/`updateLiftTransit`
   now smoothstep every phase (no linear jolts), the pad breathes dust while
   the plate moves, a new **hold** phase holds a beat in the dark showing the
   destination line + travelling chevrons, and arrival lands with a soft
   thunk (camera nudge, dust burst, low blip, haptic) instead of a cut.
2. **Early-sector turret fairness.** `genLevel` gains a pass (sectors 0–2)
   that guarantees no waiting Scion sits inside more than one turret's cover
   (380 px): crowding turrets are re-sited to a fair spot, or retired if none
   exists. Fixes the Vesalius Ridge Scion pocketed between three turrets that
   forced a shot before the shield is taught. (Golden terrain checksum
   updated: `1827470476` → `204786080`.)
3. **All fail paths return to the menu.** Game over's second option is now
   **MAIN MENU** (was "NEW ROTATION"); a tap anywhere off the CONTINUE box
   also returns to the title, and the run is written back as a RESUME save
   (continue penalty applied) so it is never lost on a fail.
4. **Main-menu layout fixed.** The three lower pills are laid out from one
   place so they can't collide on phone-height viewports (the old overlap
   could burn the daily attempt on a tap meant for RESUME); RESUME sits on
   its own row, REMIX + DAILY pair below, and DAILY centres itself while
   REMIX is still locked. Wordmark shrinks on narrow screens.
5. **Daily flight has teeth.** Two deterministic **daily modifiers** (same
   for every pilot, seeded from the day) drawn from a pool of six —
   RATIONED TANK (70% fuel), SURGE FRONT (41 s clock everywhere), CROWDED
   SKY (+2 drones/sector), SLEEPER CELL (every saboteur a sleeper, +1),
   BLACKOUT ROTATION (all sectors dark), STOPWATCH (clear each under 90 s
   for +500). Shown in the briefing as "TODAY'S CONDITIONS"; STOPWATCH adds
   a HUD countdown and a clear-screen bonus line.
6. **Shield button regrouped.** Moved from its lone float up-and-right to
   nestle directly above the FIRE/THRUST pair (one thumb serves all three).

Smoke suite extended to 28 tests (turret fairness, daily modifiers, title
pill non-overlap, fail→menu with save survival); all green. **No change to
the campaign's authored feel beyond the turret fairness re-siting.**


## Decision: Bundles P & Q locked as the 1.1 and 1.2 updates (July 2026)

Owner decision. The two specced post-launch bundles are no longer
candidates — they are the committed, free post-launch release plan:

- **Bundle P — the pendulum sling → "1.1 — THE PENDULUM"** (free).
- **Bundle Q — the deep Hollows → "1.2 — THE DEEP HOLLOWS"** (free,
  after 1.1 — the Q5 level cache lands on a stable shipped base).

APP_STORE_ROADMAP.md now carries both as proper bundle sections (P·impl /
P·feel / P·ship, Q·impl / Q·guard / Q·ship) with rows in the
bundle-order table and the sequencing diagram; the implementation
checklists stay in the specs (single source of truth). Decision stamps
added to PENDULUM_SPEC.md §10 and HOLLOWS_EXPANSION_SPEC.md §11
(recommendation text kept as the reasoning trail), and the
"post-launch candidates" list updated — the pendulum sling and the
fourth-Hollow ideas are promoted out of it. **No code changed.**


## Proposal: the deep Hollows — Bundle Q specced, not built (July 2026)

Second spec of the pass, sibling to Bundle P. The secret lifts stay as
hard to find as ever — the owner named that difficulty a virtue, so the
aid is priced instead of the secret deleted, on the Radiosense precedent
(an earned rescue converts into a finding aid):

- **RENÉ LAENNEC** (the stethoscope — listening as diagnosis, the game's
  own core skill made canon) joins as a twelfth famous Scion, hidden
  *inside* a new Hollow under Jenner Terraces and found by his knocking —
  human-irregular, warm, the tell grammar inverted against Glycon's
  perfect unison. Excluded from the remix pool; he is seeded content,
  like the shrines.
- His **AUSCULTATION** upgrade makes unfound lift pads ring softly and
  mark themselves within ~240 px (no compass, no HUD arrow — weaker than
  Radiosense on purpose); his wall chart unlocks the **ROTATION CHART**:
  return travel from the briefing screen to any cleared sector, cached
  **as you left it** (dead turrets stay dead, found secrets stay found,
  lost Scions stay lost; no clear bonus or extraction can re-fire).
- **Three new Hollows** under sectors 2/4/6 — THE WARD (the muster roll
  + four WARD NOTES for the archive), THE MINT (bend Glycon's amulet
  press: every remaining counterfeit's unison blink drifts out of true),
  THE LISTENING POST (Laennec). All six hollows in one run = EVERY
  HOLLOW HEARD.
- Spec: [HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md) —
  rationale, mechanics, draft copy, checklist Q1–Q10 with code anchors,
  save-schema seams, tests. **Recommendation: free 1.2 update, after
  Bundle P's 1.1** (larger and riskier of the two; lands best on a
  stable shipped base). Pointers updated in GAME_DESIGN.md §10,
  APP_STORE_ROADMAP.md and ROADMAP.md. **No code changed.**


## Proposal: the pendulum sling — Bundle P specced, not built (July 2026)

Wrote the full design + implementation spec for the classic Oids/Thrust
**pendulum** element — redesigned per owner direction to be **decoupled from
Scion pickup** and to live in the secret Hollows as a whole new story
element: each cave hides one towable **relic** of Glycon's (THE FIRST CALL —
SOLACE's original recorder core; THE LAST HEART — the one genuine heart in
the counterfeit workshop; THE MASK — the idol's human face), slung beneath
the ship on real pendulum physics and carried out through roof, darkness and
lift to MERCY without slamming it into rock. Patient transport as a flight
skill — *primum non nocere*, made kinetic.

- Spec: [PENDULUM_SPEC.md](PENDULUM_SPEC.md) — gameplay/narrative/goal
  rationale, three handling characters (heavy → fragile → wild), tether
  physics model, tell language (mini-ECG, `✓/!/✕`, each relic found by its
  rhythm — or its total silence), scoring (deliver +1200, GENTLE HANDS
  +500, all three +2000, broken −400), draft card copy, ending hooks,
  checklist P1–P10 with code anchors, persistence, tests.
- **Recommendation: free 1.1 content update, not launch** — everything
  still blocking submission is Mac-side, and the mechanic's feel pass
  needs real hardware; free (not paid) preserves the "complete game, no
  IAP" store positioning and buys a re-feature moment.
- Supersedes the earlier "pendulum carry" core-loop proposal (now struck
  through in ROADMAP.md § Future ideas, reasoning trail kept); pointers
  updated in GAME_DESIGN.md §10 and APP_STORE_ROADMAP.md's post-launch
  candidates. **No code changed.**


## The transfusion line — field refuel as a hover minigame (July 2026)

The stranded-ship resupply drone no longer drops +40 in your lap. It now
arrives, mists a **primer** (+10 — enough to reach the line, not to leave),
and unspools a **transfusion line** to a hover point overhead. The rest is
the one thrust skill the game never asked for: **sustained hover** inside a
capture window while fuel flows at 12/s.

- **Detach is a choice:** TAP FIRE releases cleanly at any moment and keeps
  what you took; while the line is caught, FIRE never shoots (and a detach
  tap can't accidentally become a shot — pacifist runs are safe). A full
  tank with zero occlusions earns **CLEAN LINE +250**.
- **Exposure is the price:** the shield is forced down while attached (the
  field would sever the umbilical), turrets keep shooting, and the
  41-second surge physically rocks a tethered ship — the one place the
  clock has mechanical teeth. Drift out of the window and the line
  *occludes* (flow stops); drift past the snap radius and it parts: −50,
  remainder lost, signal again.
- **It diagnoses:** the pump drips on a beat (audio + a light haptic tap),
  and goes **arrhythmic while a contaminant is aboard** — the same 0.5/1.7
  stutter as the score and the ECG. A third place to hear the lie.
- **Always readable:** dashed capture ring, sagging line (taut green when
  flowing, stuttering dashes when occluded, red near the limit), drips
  travelling down the line, and `✓ / ! / ✕` status through the colorblind-
  safe `PAL()` palette. FIELD MEDIC widens the window ~1.3×.
- MERCY's recovery bay stays passive on purpose — no minigame between a
  hurt player and safety. Design writeup: ROADMAP.md § Future ideas.

Smoke suite: 24/24 green (strand→primer→line, and a full
hover→flow→shield-lockout→clean-detach cycle).


## Bundles I–N + haptics wiring (July 2026)

One pass took the roadmap's whole no-Xcode tail. Per bundle:

- **I — The 41-second clock.** "Repeating, every 41 seconds" is now
  observable, not just lore: from Curie Fields onward (and in every cave)
  the world surges on the Static's period — a dry tick, ECG baseline
  jitter, settlement windows dimming, the lamp faltering ~8%, the HUD
  sector label glitching for a beat. Diagnostic atmosphere, no damage. In
  the finale the surge fires hard on the same phase, stronger the closer
  you fly to SOLACE.
- **J — The landed scan.** Lure-trees and hollow rocks can now be opened
  without a shot: land within 60 px and hold ~6 s, grounded and in every
  turret's sights. Same payoff via a shared `revealSecret(sc, viaFire)`;
  sets `scannedSecret` instead of `firedAtSecret`, and a no-fire answered
  run that still read Glycon's lies ranks **OATH KEEPER · EYES OPEN**.
  Taught once, in the Avicenna briefing.
- **K — The codex archive.** Every log fragment (`doids_logs`) and shrine
  card (`doids_shrines_seen`) ever recovered persists across runs. The
  codex gains MINDS/ARCHIVE tabs (paged by tapping left/right); the title
  pill counts both: `⚕ 2/11 · ◈ 5/14`.
- **L — Haunting & epilogue.** An unresolved ending sets `doids_unres`:
  the title subtitle turns violet — *"the Static answers still — every 41
  seconds"* — with a faint tick on that exact period, until any run
  resolves the beacon. The answered ending now holds a 6-second beat in a
  new `"epilogue"` state: camera eases to the beacon, rings fade, and one
  line types on — *"AMS SOLACE · crew manifest 214 · status: HEARD."*
- **M — Remix, daily, wider pool.** `runSeed` threads every generator
  (seed 0 = the authored campaign, regression-locked by checksum).
  Resolving the beacon once sets `doids_veteran` and unlocks ⟳ REMIX
  ROTATION (random seed, famous minds shuffled across sectors). ☀ DAILY
  FLIGHT is one attempt per UTC day (`doids_daily`), spent at launch, with
  yesterday-you shown as the bar to beat. Four new famous Scions join the
  pool — Blackwell (OPEN DOORS), Virchow (CELL DOCTRINE), Fleming
  (PENICILLIN), Levi-Montalcini (GROWTH FACTOR) — remix/daily draw 7 of 11.
- **N — The counterfeit MERCY.** The finale hides a second, identical
  MERCY between spawn and the beacon. One tell only: her emblem pulses
  like a pulse; its emblem blinks in perfect mechanical unison with the
  fake fuel pods. Docking is a mouth — fuel drain, ECG *and* soundtrack
  arrhythmia, −200 and a card ("He built the thing you trust"). Reading it
  from the ground (J's scan) or one shot powers it down for +800 ("You
  counted the beats. He never learned a heartbeat."). Fully unmasked runs
  get an extra epilogue line.
- **F1/F2 + E3 (web-safe slices).** A `haptic` facade (no-op on web,
  Capacitor-ready) wired to the medical language: heartbeat lub-dub,
  dullThud's single heavy beat, the Static's wrong double-tick, arrhythmia
  taps, hard landings, shield bounces, the breach klaxon. `NATIVE`
  detection suppresses A2HS/fullscreen inside the future wrapper.

Smoke suite grew 13 → 23 tests, all green.

## Lift-return bugfix (July 2026)

- **Riding a lift back up out of the Hollows left the ship embedded ~40px
  below the surface** (most visible returning from the sector-3 cave), then
  "snapping" to the ground on the first thrust. Cause: `enterCave()` captures
  `surfaceCtx` mid-transit, *after* the descent animation has already sunk
  the ship into the pad, and `exitCave()` restored that contaminated Y
  verbatim. `exitCave()` now recomputes the resting height from the restored
  surface heightmap (`groundAt(x) - SHIP_R`). New regression test rides the
  sector-3 lift down and back and asserts the ship rests exactly on the pad.

## Bundle H — Accessibility & difficulty (July 2026)

- **H1 Colorblind mode is live** (`doids_cb`): the four *semantic* colours —
  SAFE / WARN / DANGER / REVEAL — now route through `PAL()`; colorblind mode
  swaps them to blue / orange / white / magenta on the landing guide, the ECG
  ramp, the antisepsis tint and every canon `?` counterfeit mark. Nothing else
  is re-skinned.
- **H2 Shape redundancy:** the landing guide prefixes a `✓ / ! / ✕` glyph to
  the descent numbers, so the landing state reads with no colour at all.
- **H3 FIELD MEDIC mode** (`doids_easy`): 5 lives, landing tolerances ×1.3,
  saboteur fuel-cuts halved, breach timer 60 s. Applies to the next run, not
  mid-run. Settings copy: "for pilots who want the story."
- **H4 BIG TEXT** (`doids_bigtext`): +2 px on card, briefing and intro body
  text (line heights follow).
- Settings panel grows to 8 rows (TILT keeps its gesture-path slot at row 4).


## CONTINUE box overflow fix + SFX variety pass (July 2026)

- **A7: CONTINUE box text overspill on game over.** `continueRect()`'s box
  and the flat 13px line couldn't accommodate long sector names ("AVICENNA
  SHOALS", "JENNER TERRACES") on narrow viewports. The box grew to two
  lines (`h: 40` → `54`), the sector name got its own auto-shrinking line
  (measures and steps the font down to 9px if still too wide), and "3 LIVES
  · -25% SCORE" moved to its own line below.
- **C6: Sound-effect variety pass.** `blip`, `boom`, `heartbeat`,
  `staticTick`, `dullThud`, and `hydraulic` now carry a small `rjit()`
  pitch/duration jitter (±3-15% depending on the sound) so repeats across a
  run don't sample identically, plus a quiet second layer per sound (an
  upper harmonic on `blip`, an overtone on each `heartbeat` pulse, a sub
  thump under `boom`) for a touch more body. What each sound signals is
  unchanged — `heartbeat` is still lub-dub, `dullThud` is still one heavy
  low note, and the two stay clearly distinct from each other.

Smoke suite: 13/13 green.

## Emblem centring + shrine cue (July 2026)

- **AMS MERCY's emblem** now sits vertically centred on the whole hull
  (`translate(0,-15)`, the midpoint of the tower's -50 top and the hull's
  +20 bottom edge) instead of riding up on the tower alone — mothership,
  intro screen, and wreck all follow.
- **The Hollows shrine drops its clue text entirely.** Rather than reading
  small or reading at all, the pre-scan hint is now a pulsing yellow
  landing-pad marker (corner brackets + a glowing baseline) placed beside
  the shrine, inside the same 80px landing radius `updateShrine` actually
  checks — a visual invitation instead of an instruction. The
  "READING THE MARKS…" label during an active scan is unchanged.

## Audio + legibility fixes (July 2026)

- **Thrust noise kept playing behind panels, on game over, everywhere.**
  `thrustGain.gain.value` was only ever written inside `updatePlay`'s own
  thrust check, so any transition away from `"play"` mid-thrust (opening a
  card or the codex, pausing, dying, clearing a sector, the lift-transit
  freeze…) left the looping thrust buffer at whatever gain it last had —
  the noise just kept going behind the panel until thrust happened to be
  pressed and released again in flight. Fixed by zeroing `thrustGain` once
  at the top of every `update(dt)` tick before the state dispatch;
  `updatePlay` still sets the real value right back the instant flight is
  actually live, so nothing changes about how thrust sounds in play. New
  smoke test holds thrust into a pause and asserts the gain is silenced.
- **AMS MERCY's emblem** was riding a little high on the new command tower
  and read small. Moved down and enlarged (`translate(0,-28)` /
  `drawAsclepius(36,…)`, up from -36/26) across the mothership, the intro
  screen, and the wreck.
- **The Hollows shrine's pre-scan hint was unreadable** — 9px at 60% alpha,
  crammed onto one line. Bumped to 13px bold at 85% alpha across two lines
  ("SOMETHING OLD IS ENSHRINED HERE" / "LAND AND LOOK CLOSER"), matching the
  size of the "READING THE MARKS…" label shown once you're actually scanning
  it.

Smoke suite: 13/13 green (also hardened the lift-transition test, which was
polling on `fade > 0.95` — a ~15ms window shared by both the tail of the
"black" phase and the head of "reveal" — to poll on the much wider
`phase === "black"` instead).

## Bug fixes & polish pass (July 2026)

**Bug fixes:**
- **Fuel-out-while-landed softlock.** A ship that landed with an empty tank
  away from MERCY or a fuel pod had no way to move again — both thrust and
  shield require `fuel>0`, and nothing else could reach it; the run was
  permanently stuck with no death trigger. Fixed with a graceful bail-out:
  holding THRUST while stranded (fuel<=0, landed) — otherwise a dead input in
  that exact state — charges a "signal for resupply" call (`OUT OF FUEL —
  HOLD THRUST TO SIGNAL`, a ring showing charge progress). A small drone
  drops in and delivers +40 fuel, enough to reach a real pod or MERCY. It's
  also just handy any time you're grounded and running low, not only at the
  hard zero.
- **Invisible walls.** `s.x` was hard-clamped to `[40, level.W-40]` and `s.y`
  floored at `20` with zero visual indication — you'd just stop with no
  explanation. Both are now rendered as a pulsing "containment field" (framed
  as the interdicted zone's own automated defences) that brightens as the
  ship approaches and fades when it's far away.

**Additional changes:**
- **Lift transitions now play out instead of cutting.** Descending/ascending
  a secret lift used to swap levels instantly. Now the ship sinks (or rises)
  out of view on the departure screen, the screen fades to black, the level
  swaps, and it fades back in with the same motion completing (settling onto
  the new pad) — with a hydraulic hiss-and-whine sound cue on each leg.
- **Subtle lift floor cue.** Surface lifts get a faint violet gradient
  "thickening" of the ground plate under the hairline seams — visible if you
  look, easy to miss if you don't, alongside the existing rare glint.
- **Quarantine bay moved off to the side.** It used to hang under MERCY right
  next to the recovery bay, in the same row. It now comes off the starboard
  side of the hull, level with the ship itself, reinforcing that
  quarantine ≠ delivery.
- **Both bays redesigned as tractor beams.** Dashed rectangles replaced with
  a converging beam (soft gradient fill + animated scan lines) — recovery's
  beam scans outward (dispensing), quarantine's scans inward (containing).
- **AMS MERCY redesigned.** The flat hexagon hull gained a raised dorsal
  command tower (where the emblem now sits), tapered bow/stern, panel-seam
  greebles, and soft engine glow at both tips (`mercyHullPath()`/
  `mercyGreebles()`, shared by the mothership, the intro-screen ship, and the
  crashed MERCY-class wreck, which got the matching hull + a repositioned
  emblem and hull breach).
- **Pendulum carry — proposed, not built.** Wrote up where/how the classic
  Oids/Thrust pendulum-carry mechanic (a boarded passenger physically
  dangling and swingable into hazards) could fit into the roadmap — see
  ROADMAP.md § Future ideas and APP_STORE_ROADMAP.md's post-launch
  candidates.

Smoke suite still 10/10 green (`__doids.strand()` added for testing the
softlock fix; `resupplyDrone`/`liftTransit` exposed via `__doids.get()`).
Verified visually via Playwright screenshots: the resupply drone end-to-end,
the boundary field at both edges, the full lift transition (black frame +
arrival), the lift floor cue, and the new MERCY silhouette across the
mothership, intro screen, and a wreck.

## Bundle D — performance pass (July 2026)

Implemented the fourth App Store roadmap bundle (App Review runs on real
hardware, and `ctx.shadowBlur` was set on nearly every draw call — terrain,
scenery, every Scion, every particle, every bullet). Added an FPS/frame-time
meter behind `?perf=1` in `drawHUD`, free unless the flag is set. Replaced
shadowBlur on point objects (particles, bullets/shots, fuel pods/fake pods)
with a cached-per-colour `glowSprite()`/`drawGlow()` radial-gradient blob
drawn under the crisp icon instead of blurring it live. Replaced shadowBlur on
per-entity stroked shapes (`doidFigure`'s limbs/torso/head/antenna, turrets,
drones, lure-trees, buildings, wreck hulls, gravity anomalies) with a
`glowStroke()` 2-pass stroke (soft wide pass + crisp normal pass) — call
sites stay one line. Terrain and cave-roof geometry are now rendered once
per 512px-wide chunk into an offscreen canvas (bounded to each chunk's local
height range, not the whole world height) instead of retracing the full
heightmap path every frame; chunks build lazily as the camera reaches them
and live in a 12-tile-per-level LRU. `shadowBlur` now only appears on
singletons drawn once per frame (ship, mothership, title text, HUD text),
never inside a per-entity or per-particle loop. Measured via direct
`render()` timing (bypasses vsync pacing) at 2× DPR: Avicenna Shoals
(scenery + counterfeits) dropped from a 28.2ms to 20.6ms per-frame median
(~1.37×), the finale (dark, wrecks, drones) from 55.2ms to 43.1ms (~1.28×);
gains on real mobile Safari — where shadowBlur is markedly more expensive
than on desktop Chromium — are expected to be larger but weren't verified on
physical hardware in this pass. `__doids.get()` now exposes `perfFrameMs`/
`perfFps`; smoke suite still 10/10 green (no new game state to test — purely
a rendering-cost change, verified visually via Playwright screenshots of a
surface sector and a cave interior for tile-seam artifacts).

## Bundle C — audio baseline & settings menu (July 2026)

Implemented the third App Store roadmap bundle (paid-game floor — the game
previously shipped with zero music and no mute). All sound now routes
through a new `sfxGain` node; a generative ambient score (`startMusic()`:
two detuned drone oscillators through a lowpass with an LFO on cutoff, plus
a sparse pentatonic motif) routes through `musicGain`. The score ducks under
briefings/cards, drops an octave and halves its motif rate in the finale,
and — the same diagnostic language as the ECG — goes arrhythmic in its own
timing while a contaminant is aboard. Added a `"settings"` state (⚙ pill on
the title, a new row in the pause menu) with SOUND/MUSIC/HAPTICS/ASSIST/
TILT/COLORBLIND toggles; moved the old title-screen ASSIST and TILT pills
into it (TILT's iOS permission request still fires from the raw
`canvasTap()` gesture handler, not the deferred tap flow, per Apple's rule).
HAPTICS/COLORBLIND are no-ops until Bundles F/H land, but their flags
persist now. `__doids.get()` exposes `sound`/`music`/`haptics`/`colorblind`/
gain values; 4 new smoke tests (persistence, sfxGain gating, and an
end-to-end settings-panel toggle) bring the suite to 10/10 green.

## Bundle B — emblem replacement, red cross → rod of Asclepius (July 2026)

Implemented the second App Store roadmap bundle (legal blocker — the red
cross is protected under the Geneva Conventions). Added `drawAsclepius(h,
color, minimal)`: a serpent coiled on a staff drawn with the same
neon-stroke bezier style as `drawShrine`'s coil, with a `minimal` mode (a
single S-curve stroke, no staff) for the tiny Scion-scale emblem. Replaced
every red-cross `fillRect` pair — `drawMothership()`, `drawWreckM()`,
`iShip()`, and the `doidFigure()` chest emblem — with calls into the new
helper; renamed the `crossCol` parameter to `emblemCol` throughout and swept
"cross" out of nearby comments. `GAME_DESIGN.md` §2.4 now records the emblem
duality (the true serpent vs. Glycon's masked one). Verified visually via
Playwright screenshots of the title screen and two sectors; smoke suite
still 8/8 green (no new state to test — purely visual).

## Bundle A — pause, mid-run save & resume (July 2026)

Implemented the first App Store roadmap bundle. `doids_run` now snapshots
`levelIdx`/score/lives/upgrades/etc. at every sector boundary (`toBriefing`);
the title screen shows a `▶ RESUME — <SECTOR>` pill when a snapshot exists,
restoring it via a new `restoreRun()` helper. Added a `"pause"` state (❚❚ HUD
button, `Escape`/`p`, and the gamepad Start button while flying) with a
RESUME / RESTART SECTOR / QUIT TO TITLE menu; auto-pauses on
`visibilitychange` so backgrounding never loses a run mid-flight. Game over
now offers **CONTINUE** (restores the sector-start checkpoint with 3 lives
and −25% score, via a new `checkpoint` captured just before the run snapshot
is cleared) alongside the existing NEW ROTATION. `__doids.get()` gained
`hasSave` and `paused`; two new smoke tests cover reload-resume and the pause
toggle (8/8 passing).

## App Store roadmap added (July 2026)

Added **[APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md)**: the prioritised,
checkbox-tracked plan to ship Hollow Oath as a paid iOS App Store title. Fifteen
PR-sized bundles (A–O) covering pause/save/resume, the red-cross emblem
replacement (legal), audio & settings, performance, the Capacitor wrapper and
compliance, haptics, Game Center, accessibility, and the narrative/replay
elevation work (41-second clock, scan mechanic, log archive, remix mode,
counterfeit-MERCY finale). Each bundle names its code anchors, storage keys,
acceptance criteria, and tests so any developer can pick one up cold.
Cross-links added from README.md, ROADMAP.md (now explicitly the historical
log), and GAME_DESIGN.md §10. No game code changed in this pass.

**A&M references scrubbed (personal project).** The default end-of-run rank in
`index.html` is now "FLIGHT SURGEON, MERCY RESCUE DIVISION" (was "…A&M RESCUE
DIVISION"), the doc headers no longer say "A&M internal", and the roadmap's
suggested bundle ID is a personal reverse-DNS ID (`com.burners70.hollowoath`,
to be confirmed before first submission). The in-fiction ship prefix **AMS**
(AMS MERCY, AMS SOLACE) is unrelated naval-style styling and is unchanged.

**Test harness bootstrapped in `tests/`.** The Playwright smoke suite the docs
referenced previously lived only in an ephemeral session scratchpad; it is now
committed: `tests/smoke.spec.js` (boot, all 8 sectors, finale beacon/black
boxes, cave descent via secret lift, landing evaluator + rank flags, briefing
render, and a fail-on-any-console-error guard on every test), plus
`package.json`/`playwright.config.js` (with a `PLAYWRIGHT_EXECUTABLE_PATH`
override for containers with a pre-installed Chromium). Run:
`cd tests && npm install && npm test`. README, GAME_DESIGN §9, and the roadmap
conventions now point at it. 6/6 passing at commit time.

**Homage line loosened, nostalgia kept loud (owner decision).** The homage is
now tiered by surface: the in-game title tagline is era-evocative without
trademarks ("a love letter to the 16-bit lander classics", was "in the spirit
of the Atari ST classic"); the README names the lineage outright (*Oids*,
*Thrust*, *Gravitar*) with an explicit original-and-unaffiliated line, because
the web is where nostalgia searchers arrive from Google; App Store metadata
will stay trademark-free per Apple 2.3.7 (see roadmap E7/O2, where the policy
is recorded).

## Rename: DOIDS → Hollow Oath (July 2026)

The game was renamed from **DOIDS** to **Hollow Oath**, and the rescued medical
androids from **"Doids"** to **"Scions"**. This log exists so any developer can
see exactly what changed, what was deliberately left alone, and why.

### Why
- **Distinctness for release.** "Doids" is one letter from *Oids* (an FTL Games
  trademark) and the project openly described itself as an "homage to Oids" —
  too close to safely publish. Mechanics aren't protectable, but the *name* is
  the exposure. "Hollow Oath" is brandable and semantically distant.
- **Scions** replaces "Doids" as the in-fiction android name: they are carriers
  of true medical science, the culmination of generations of human — and now
  machine — endeavour. It also sharpens the theme (the villain's counterfeits are
  *hollow* Scions).
- **The title now earns its place.** New copy and one new rank tie "hollow" (the
  caves, the counterfeits) and "oath" (*primum non nocere*) together in-game
  rather than leaving them to box art.

### What changed
**Product name (user-facing) → "Hollow Oath":**
- `index.html`: `<title>`, `apple-mobile-web-app-title` meta, the add-to-home
  banner text, the big title-screen text (now "Hollow Oath", mixed case, resized
  to fit), and the portrait-gate line.
- `manifest.webmanifest`: `name`, `short_name`, `description`.

**In-fiction android name → "Scions":** every user-facing string and code comment
in `index.html` (HUD "SCION ABOARD" / "SCIONS ABOARD" / "SCION(S) LOST", help
text, intro captions, title subtitle, shrine/ending narrative, codex), and all
prose in `README.md`, `GAME_DESIGN.md`, `ROADMAP.md`.

**Docs:** `README.md`, `GAME_DESIGN.md`, `ROADMAP.md` updated; this `CHANGELOG.md`
and `HOLLOW_OATH_BRIEF.md` added. An earlier scratch reconstruction (`DESIGN.md`,
written before the real code/docs were available) was **removed** — fully
superseded by `GAME_DESIGN.md` and the brief.

**Narrative — title threaded through the story (new copy):**
- **THE SHRINE** (Glycon reveal) gains a line in the villain's register:
  *"An oath you never test is easy to keep."*
- **THE WORKSHOP** reveal now names the method: *"Not corrupted. Hollow. Built
  empty, and dressed to be carried home in good faith."*
- **Ending epilogue lines:** answered → *"The oath, kept whole."*; fire →
  *"Quiet, at a cost. The oath, hollowed."*; unresolved → *"Left hollow. The
  Static answers still."*

**New rank: HOLLOW KEEPER.** On the answered ("good") ending, a player who broke
the no-fire oath *only* to open Glycon's secrets (shot a lure-tree or hollow
rock), never in combat, is now ranked **HOLLOW KEEPER** — between OATH KEEPER
(no shot fired) and THE ONE WHO ANSWERED (fired in combat). Epilogue: *"You found
what he hid. It cost you the oath to do it."*
- New module state: `firedAtSecret` (set when a shot destroys a lure-tree /
  hollow rock) and `firedAtCombat` (set when a shot destroys a turret / drone),
  declared and reset in `resetRun()`, and now reported by `window.__doids.get()`.

### What was deliberately NOT changed (and why)
- **localStorage keys** (`doids_hi`, `doids_codex`, `doids_assist`, `doids_tilt`,
  `doids_intro`, `doids_a2hs`) — kept. Renaming them would wipe existing testers'
  hi-scores, codex, and settings for zero player-facing benefit. They're
  invisible to players.
- **Internal identifiers** — `window.__doids`, `doidFigure()`, `iDoid()`, and
  similar are not user-facing; left as-is to avoid churn and needless diff noise.
- **Branch names** (`claude/doids-iphone-game-r4fnon`, etc.) — not user-facing;
  left as-is.

### Repository & URL
**Done:** the GitHub repo was renamed **`Doids` → `Hollow-Oath`** (a Settings
action; not doable from git). Live consequences:
1. Repo is now `https://github.com/Burners70/Hollow-Oath` and Pages serves from
   `https://burners70.github.io/Hollow-Oath/`. GitHub auto-redirects the old
   `.../Doids/` paths for a while, but update external links.
2. The live Pages *content* only reflects the rename once these changes land on
   the Pages deploy branch (`claude/doids-iphone-game-r4fnon`).
3. Local clones need `git remote set-url origin https://github.com/Burners70/Hollow-Oath.git`.

In-repo references (README, GAME_DESIGN, manifest description) point to the
`Hollow-Oath` URL and are now correct.

### Verification
Headless Chromium (Playwright) smoke test after the changes: game boots, document
title is "Hollow Oath — a gravity rescue", all 8 sectors generate and run, the new
`firedAtSecret`/`firedAtCombat` flags are present, **no console errors**.
