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
- An injected **Eruda** console overlay, for anything the menu doesn't cover.

## Using it

1. Open `tests/qa-harness.html` (via a raw.githack link, or any static host —
   it's a plain file, no build step).
2. The **src box** at the top defaults to a specific build's `index.html`.
   Paste a different link and tap **Load** to point it at another build —
   the harness page itself never needs to change for this.
3. Tap **☰ menu** to expand the button panel. Tap **Toggle console** for the
   Eruda overlay if you need to type something ad hoc.

### Add it to your Home Screen

Add the harness (not the game) to your Home Screen for one-tap access. The
harness loads the game inside itself, so you get the full game plus the menu
in one place. To test a new build later, there's no need to re-add anything —
just paste the new link into the src box and tap Load.

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

## Reusing it on other branches

The harness is intentionally decoupled from any one branch or feature — it
takes the target build as a parameter (`?src=` query string, or the src box),
so the same file works unmodified for every future branch. There's no need to
copy or fork it; just point the existing one at a new build's `index.html`.
