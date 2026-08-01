# QA harness — on-device testing without a console

`tests/qa-harness.html` is a standalone test rig for trying a build on a phone
(or any browser) without needing a Mac, Safari Web Inspector, or typed console
commands. It never touches game code — it loads whatever build's `index.html`
you point it at in an `<iframe>` and drives that build's existing
`window.__doids` debug handle (see `js/render.js`, bottom) from a tap menu.

## Why it exists

The game's own debug handle (`__doids`) has always been reachable from a
browser console, but getting a console open on an iPhone normally means
plugging into a Mac (Settings → Safari → Advanced → Web Inspector, then Mac
Safari's Develop menu — the proper way to fully inspect a build on-device).
When that isn't available, or a quick tap-through is faster than typing
commands, the harness gives you both:

- A **menu of buttons** for the common test recipes (jump to a sector, force
  veteran/husks-known flags, warp to the beacon/lift/shrine, fire or answer
  the finale, give an upgrade, dump full state, reset, clear save).
- An **Act Two section** (Bundle P): load a chamber, warp to the rack or the
  well, close the real feed or one of his decoys, cradle and release, force a
  reserve or a vitals level, and read the live tuning dials. Act Two is tuned by
  hand on a phone, and every one of those was a typed console command before.
- An injected **Eruda** console overlay, for anything the menu doesn't cover.

## Using it

1. Open `tests/qa-harness.html` (via a raw.githack link, or any static host —
   it's a plain file, no build step).
2. The **src box** lives in the menu's **Build** group and remembers the last
   build you loaded (see the Home Screen note below for how that interacts with
   `?src=`). Paste a link and tap **Load** to point it at another build —
   the harness page itself never needs to change for this. `?src=<url>` on the
   harness's own URL does the same thing without any typing, which is the easiest
   way to open a specific build from a message or a note.
3. Tap **☰ menu** to expand the button panel. Tap **Toggle console** for the
   Eruda overlay if you need to type something ad hoc.

### Getting the chrome out of the way

The harness chrome **floats over** the game rather than sitting above it, so the
game always gets the full viewport and opening the menu never resizes it. That
matters more than it sounds: the game lays itself out against the iframe's
viewport, so a harness that shrinks the iframe shrinks the game — which on a
landscape phone (~390px tall) squeezed it to a third of the screen and pushed its
own bottom controls off the bottom edge.

Three states, and you want the third for most of a device pass:

| State | How | Use it for |
|---|---|---|
| Menu open | **☰ menu** | Driving — jumping, warping, forcing state |
| Bar only | **☰ menu** again | Glancing at the status line while you fly |
| Nothing at all | **▲ hide**, or the tab | Reviewing the game completely unobstructed |

Fully hidden leaves one small **tab at the middle of the right edge** — the only
part of the screen the game doesn't use, since the HUD owns the top band and every
touch control sits along the bottom. Tap it to bring the chrome back. The choice
is remembered between visits, and loading a chamber or launching a sector hides
the chrome automatically, on the grounds that you pressed the button in order to
go and fly the thing.

### Act Two, from a cold start

Act Two isn't reachable in normal play yet — there's no route to it from the
title, by design, until `P·content` and `P·persist` wire it into the campaign. The
harness is the way in:

1. **Load chamber** (picker defaults to `slice`). The chrome hides itself and you
   are in the chamber, flying.
2. Fly to `ISOLATOR 1` and **land beside it and hold** to close the feed — or tap
   **Close the real feed** to skip the flying. The bank drops off mains and starts
   dying the moment it's cut.
3. **Warp to rack**, then hold to cradle. (**Cradle** does it outright.)
4. Fly it to the well at the far right end. **SHIELD held** over a dying rack is
   the transfusion — it spends *your* vitals, so try it with **vitals → 20** to
   see the floor auto-detach the line.
5. **Warp to the well** puts you where a slung load hangs in the bay's slot; hold
   it still and the winch takes it.

**Route check** is worth knowing about: it floods the chamber's open space at
three heights — bare ship, load swung up, load hanging — and reports whether the
rack, every isolator and the well are reachable at each. `well: false` on
*hanging* is expected and is the momentum pinch doing its job; `well: false` on
*swungUp* would mean the chamber can't be cleared laden, which is a bug in the
chamber. **Dials** prints the live feel values, which is the question you always
have first on a phone and can't otherwise answer from inside the game.

### Add it to your Home Screen

Add the harness (not the game) to your Home Screen for one-tap access. The
harness loads the game inside itself, so you get the full game plus the menu
in one place. To test a new build later, there's no need to re-add anything —
just paste the new link into the **Build** box and tap Load.

That last sentence is load-bearing, and the harness is built to honour it. An
icon relaunches the same URL every time, so if `?src=` won unconditionally your
next launch would snap back to whatever build was frozen in the icon's query
string — silently undoing the link you had just pasted. Instead the harness
remembers which `?src=` it has already seen: **a link you have not opened before
wins (that is intent), and otherwise your own last Load wins.** So sending
someone a link works, going back to an old link works, and the build you chose
sticks across relaunches.

Practical consequence: the *game* build is overridable forever from the Build
box, but the **harness page itself** is pinned by the icon. Re-add the icon only
when the harness gains something you want (a new section, a new button) — not
when the game changes.

### Cache gotcha: use SHA-pinned links, not branch links

Both raw.githack (which caches per URL, sometimes for several minutes) and
iOS's own caching of a Home-Screen-saved page can serve you a stale build even
after a fresh push. A **branch-name** link (`.../branch-name/index.html`)
points at a URL whose content changes over time, so it's exactly the kind of
URL a cache can get stuck on.

A **commit-SHA-pinned** link (`.../<full-sha>/index.html`) never has this
problem — the content at that exact path can never change, so it can be
cached forever with zero staleness risk. Ask for (or generate) a fresh
SHA-pinned link after every push, and paste it into the src box rather than
relying on a branch link staying fresh.

## Menu reference

| Button | Calls | Notes |
|---|---|---|
| Sector dropdown + **Go + Launch** | `__doids.go(n)` then `.launch()` | Jumps straight into a sector, skipping the briefing. |
| **Set veteran** | `__doids.setVeteran()` | Unlocks the Hollows lifts/shrines and the finale twin for this session. |
| **Set husks known** | `__doids.setHusksKnown()` | Flips the "husks discovered" story gate (see `js/world.js` `husksKnown()`) without actually visiting the WORKSHOP shrine. |
| **Check husks known** | `__doids.husksKnown()` | Reports the current gate state in the status line. |
| **Mark trained** / **Mark intro seen** | `markTrained()` / `markIntroSeen()` | Skip the first-play fork / intro flow. |
| **Start fresh run (title flow)** | `startFreshRun()` | Restarts through the normal title → intro → briefing flow, unlike `go(n)`'s raw jump. |
| **Warp to beacon / lift / shrine** | `__doids.warpBeacon()` / `.warpLift()` / `.warpShrine()` | Teleports the ship to that feature in the current sector (sector 7 for the beacon). |
| **Fire Solace (bad ending)** | `__doids.fireSolace()` | Takes the destroy-on-sight order immediately. |
| **Answer beacon (good ending)** | `__doids.answerBeacon()` | Forces a successful parried answer. |
| Upgrade dropdown + **Give upgrade** | `__doids.give(key)` | Grants any of the eleven FAMOUS upgrades directly. |
| **Show state** | `__doids.get()` | Dumps the full debug state as on-screen JSON (tap the dump to dismiss). |
| **Reset run** | `__doids.reset()` | Same as the in-game reset. |
| **Clear save + reload** | clears the iframe's `localStorage`, reloads | For testing first-run/onboarding flows from a clean slate. |
| **Toggle console** | shows/hides the injected Eruda panel | If Eruda failed to load (no network), this is a no-op rather than an error. |

### Act Two (Bundle P) — needs a `P·slice` build or later

Every button here is feature-detected, so on an older build it reports that the
build doesn't have it rather than failing silently.

| Button | Calls | Notes |
|---|---|---|
| Chamber picker + **Load chamber** | `__doids.loadChamber(id)` | The picker fills itself from `__doids.a2Chambers()`, so it grows as `P·content` adds chambers — no edit per chamber. Hides the chrome on success. |
| **Dials** | `__doids.a2Dials()` | The live feel values *and* the geometry they imply (`envelopeAtRest`, `envelopeSwung`, `momentumGap`, `restGap`). Exposed through `__doids` because a top-level `const` is **not** a property of `window` — `contentWindow.SLING_L` is `undefined`. |
| **Act Two state** | `__doids.get().actTwo` | The focused dump: racks, feeds, tow, transfusion line, well. Far more readable on a phone than the whole `get()`. |
| **Route check** | `__doids.chamberRoute(need)` ×3 | The clearable-laden invariant, at bare-ship / swung-up / hanging heights. See above for reading it. |
| **Warp to rack** | `__doids.a2WarpRack(id)` | Lands you inside cradle reach. |
| **Warp to the well** | `__doids.a2WarpWell()` | Parks you where a slung load hangs in the bay's slot. |
| **Close the real feed** | `__doids.a2Cut(id)` | Picks the live feed that actually feeds a rack. Routes through the real `closeTrunk`, so the rack genuinely drops to reserve and starts dying. |
| **Close a decoy** | `__doids.a2Cut(id)` | Picks one of his. Alerts him, exactly as closing it in play would. |
| **Cradle** / **Release** | `__doids.a2Cradle(id)` / `.a2Release()` | Cradle refuses a rack still on mains — the rack *is* their life support, so the feed comes first. |
| reserve dropdown + **Set** | `__doids.a2SetReserve(id, v)` | Reach `failing` or a flatline without waiting out the drain. |
| vitals dropdown + **Set** | `__doids.a2Vitals(v)` | For testing the transfusion's floor. |

## Reusing it on other branches

The harness is intentionally decoupled from any one branch or feature — it
takes the target build as a parameter (`?src=` query string, or the src box),
so the same file works unmodified for every future branch. There's no need to
copy or fork it; just point the existing one at a new build's `index.html`.

**Act Two got a section, not its own harness**, for the same reason. The iframe
plumbing, the same-origin trick, the Eruda fallback, the src box and the dump
overlay are the bulk of the page; a second copy would duplicate all of it and
then have to be kept in step, and two rigs is exactly how one of them starts
lying about which build it is driving.

## The drift guard (`tests/qa-harness.spec.js`)

The harness is the one file in the repo that can't be smoke-tested the way
everything else is: driving the iframe needs the harness and the game to be
same-origin, and the suite loads the game over `file://` with no web server —
where an iframe is an opaque origin. Standing up an HTTP server for one file
would give up the no-server property the rest of the suite is built on.

So there's a **static** guard instead, in the spirit of `copy-deck.spec.js`: it
reads both sources as text and checks they still agree — every button maps to an
action, every `__doids` method the harness calls still exists in `js/`, the
`frame.contentWindow` calls are all function *declarations* (a `const` arrow
would be unreachable), the default build URL is SHA-pinned rather than a branch,
and the harness's `localStorage` keys stay `hoqa_`-prefixed so they can't collide
with the game's `doids_` save format.

It catches the failure that actually happens — a driver gets renamed and the
harness keeps its button, which then does nothing on a phone with no clue why.
It cannot catch a runtime bug in the harness's own logic. For that, serve the
repo over HTTP (`python3 -m http.server`) and point the harness at
`http://127.0.0.1:<port>/index.html` — same origin, so the rig works exactly as
it does on raw.githack.
