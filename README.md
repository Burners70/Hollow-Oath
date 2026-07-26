# Hollow Oath

An original 2D gravity-rescue game, built for iPhone Safari as a single
self-contained HTML5 canvas game — and a love letter to the 16-bit
gravity-lander classics. If you wore out a mouse on *Oids* (FTL Games, Atari ST,
1987), fought gravity in *Thrust*, or fed coins to *Gravitar*, this is for you:
the same land-gently-or-die flying, rebuilt from scratch. All code, art, story,
and names here are original; this is an unaffiliated fan homage to a genre, not
a remake of any of them.

> **Formerly "DOIDS".** The game was renamed to **Hollow Oath** and the rescued
> androids from "Doids" to **Scions**. See [CHANGELOG.md](docs/CHANGELOG.md) for the
> full rename log (what changed, what was deliberately kept, and why).

**Play it:** shipping as a paid iOS app via TestFlight/the App Store — there is
no public web build to play in a browser. The free web demo that used to live
at https://hollow-oath.com/ was retired ahead of launch so it wouldn't compete
with the paid release (see `docs/APP_STORE_ROADMAP.md`, Bundle O7); that URL
now serves the marketing/support/privacy pages only, from a separate
`gh-pages` branch.

**Working on the code with Claude?** Start with [CLAUDE.md](CLAUDE.md) — a
navigation map (section index into `index.html`, doc guide, conventions) that
keeps sessions from re-reading the whole codebase.

**New developers / writers:** start with [GAME_DESIGN.md](docs/GAME_DESIGN.md) — the full
game definition, evolved narrative canon (the Static, Glycon), mechanics, secrets,
scoring, code architecture, branch/deployment layout, and future ideas.
**The forward plan is [APP_STORE_ROADMAP.md](docs/APP_STORE_ROADMAP.md)** — the
prioritised, checkbox-tracked bundles taking the game to a paid iOS App Store
release; pick up the next unchecked bundle from there.
It is the only forward plan — [ROADMAP.md](docs/ROADMAP.md) and
[CHANGELOG.md](docs/CHANGELOG.md) are history, not plans.
All reference docs live in [`docs/`](docs/README.md), indexed there.

## Play (local/dev only)

The game itself isn't publicly hosted (see above). To try it from a clone,
open `index.html` in any browser — desktop keyboard controls work, but touch,
haptics, and gyro need an actual phone, i.e. the iOS build via `app/` (see
`app/MAC_SETUP.md`). Landscape is best.

## How it plays

- **Left thumb**: rotate left / right
- **Right thumb**: THRUST and FIRE, plus a SHIELD force field that burns fuel but
  stops bullets, drones and rough landings (keyboard: arrows + space/X, C/Shift/↓
  for shield)
- **Gamepads** are supported (stick/d-pad steer, A thrust, X fire, LB/B shield).
- Gravity is always pulling you down; thrust burns fuel.
- Land gently (slow, upright, on flattish ground) near a stranded **Scion** and it
  will walk over and climb aboard.
- Ferry Scions to the hospital mothership **AMS MERCY** — dock in the dashed bay to
  drop them off, refuel, and heal.
- Turrets track and shoot you. You can shoot back… but completing a sector without
  firing a single shot earns the **Hippocratic bonus** (*primum non nocere*, +2000).
- Your hull health is a live **ECG trace** — the beat races as your vitals fall,
  and it can tell you other things too, if you watch it.
- **Not every Scion you rescue is what it seems.** Watch how they wave. Listen to
  what boards. The red quarantine bay exists for a reason.
- **Not everything on the ground is what it seems either.** Real fuel pods flicker
  like fire; counterfeits keep perfect time. Some ground rings hollow under your
  struts — secret lifts descend into cave networks that hold the truth about who
  is really keeping the Static alive.
- Seven sectors, each introducing something new — plus famous figures from medical
  history hidden among the stranded (each grants an upgrade), log fragments that
  piece together what the Static is, hidden black boxes to recover, scenery from
  glow-forests to ruined settlements and crashed MERCY-class sisters, and a secret
  finale with two endings — plus the **Hollow Keeper** rank for pilots who break
  the oath only to uncover Glycon's secrets.

## Tests

Headless smoke tests live in [`tests/`](tests/) (Playwright driving the game's
`window.__doids` debug handle):

```
cd tests && npm ci && npm test
```

`playwright.config.js` auto-detects a pre-installed Chromium (e.g. in Claude
Code remote containers, `/opt/pw-browsers/chromium`) — no `playwright install`
needed there. On a machine without one, run `npx playwright install chromium`
once first.

## Tech

Zero dependencies and **no build step**: static files you can run by opening
`index.html`. It's a thin shell — `css/game.css` plus ordered, non-module
`<script src="js/*.js">` tags sharing one global scope (input, audio, platform,
world, update, render, main). Canvas rendering with glow effects, seeded
procedural terrain, multi-touch virtual buttons with safe-area insets, and a
tiny Web Audio synth (thrust noise, laser blips, explosions, and a lub-dub
heartbeat when a Scion comes aboard). `app/` wraps the same files with Capacitor
for the iOS build.
