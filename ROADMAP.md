# DOIDS — build-out notes

Ideas captured during prototype playtesting, to shape the next iteration.

## 1. Progression across levels

Build in a real sense of progression, not just "more turrets". Candidates:
gravity strength, fuel scarcity, terrain hostility (caves/overhangs), new
enemy types, ship upgrades earned between sectors, unlockable sectors.

## 2. Discovery / narrative elements

Create (narrative?) elements that reward progress with a sense of discovery —
e.g. mission briefings from AMS MERCY, fragments of a story about why the
Doids are stranded, hidden locations, log entries found on rescued Doids.

## 3. Animate the Doids

Give the Doids life: walk cycles, celebrating when boarding, panicking when
turret fire lands nearby, huddling in groups, being beamed aboard, waving
from the mothership windows after delivery.

## 4. Famous Doids from medical history (ties into #2)

Hide famous figures from medical history among the stranded Doids —
distinct look, name reveal on rescue, extra points and/or an upgrade
(e.g. rescuing a famous surgeon improves hull repair rate, a famous nurse
boosts healing at the mothership). Rescue log / gallery of who you've found.

## 5. Saboteur Doids (ties into #2)

Unidentifiable saboteur Doids that look like normal rescues but work against
you once aboard: losing points, draining fuel, gradually bumping off rescued
Doids — continuing until the player completes some defined action/mission
(e.g. an on-ship "quarantine" mini-action, delivering them to a brig bay,
or identifying them from behavioural tells before letting them board).

## Engineering notes

- Landing rules live in `landingEval()` in `index.html` — collision and the
  landing guide share it. Tunables: soft limits (vy 52 / vx 38 / slope 0.25 /
  tilt 0.5 rad), survivable limits (85 / 60 / 0.35).
- Landing assist tunables: `ASSIST_CAPTURE` (capture window) and
  `ASSIST_RATE` (correction speed).
- `window.__doids()` exposes ship/level/state for headless testing.
