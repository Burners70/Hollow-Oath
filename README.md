# Hollow Oath

An original 2D gravity-rescue game, built for iPhone Safari as a single
self-contained HTML5 canvas game. All code, art, story, and character names are
original; the flight-and-rescue *mechanic* is in the lineage of the classic Atari
ST gravity games.

> **Formerly "DOIDS".** The game was renamed to **Hollow Oath** and the rescued
> androids from "Doids" to **Scions**. See [CHANGELOG.md](CHANGELOG.md) for the
> full rename log (what changed, what was deliberately kept, and why).

**Play it live:** https://burners70.github.io/hollow-oath/
*(this URL goes live once the GitHub repo is renamed `Doids` → `hollow-oath`; see
CHANGELOG.md § "Repository & URL").*

**New developers / writers:** start with [GAME_DESIGN.md](GAME_DESIGN.md) — the full
game definition, evolved narrative canon (the Static, Glycon), mechanics, secrets,
scoring, code architecture, branch/deployment layout, and future ideas.
Build-out history is in [ROADMAP.md](ROADMAP.md); the rename & narrative brief that
drove the current naming is in [HOLLOW_OATH_BRIEF.md](HOLLOW_OATH_BRIEF.md).

## Play

Open `index.html` in any browser — on iPhone, serve it (e.g. GitHub Pages) and use
Safari's **Share → Add to Home Screen** for a fullscreen, app-like experience.
Landscape is best.

## How it plays

- **Left thumb**: rotate left / right
- **Right thumb**: THRUST and FIRE, plus a SHIELD force field that burns fuel but
  stops bullets, drones and rough landings (keyboard: arrows + space/X, C/Shift/↓
  for shield)
- **Gamepads** are supported (stick/d-pad steer, A thrust, X fire, LB/B shield),
  and **TILT steering** (gyro) can be switched on at the title screen.
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

## Tech

Zero dependencies: one HTML file with inline CSS/JS, canvas rendering with glow
effects, seeded procedural terrain, multi-touch virtual buttons with safe-area
insets, and a tiny Web Audio synth (thrust noise, laser blips, explosions, and a
lub-dub heartbeat when a Scion comes aboard).
