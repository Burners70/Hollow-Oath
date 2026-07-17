# DOIDS

A modern-glow homage to the classic Atari ST gravity-rescue game, built for iPhone
Safari as a single self-contained HTML5 canvas game. All code and art are original.

## Play

Open `index.html` in any browser — on iPhone, serve it (e.g. GitHub Pages) and use
Safari's **Share → Add to Home Screen** for a fullscreen, app-like experience.
Landscape is best.

## How it plays

- **Left thumb**: rotate left / right
- **Right thumb**: THRUST and FIRE (keyboard: arrows + space/X on desktop)
- Gravity is always pulling you down; thrust burns fuel.
- Land gently (slow, upright, on flattish ground) near a stranded **Doid** and it
  will walk over and climb aboard.
- Ferry Doids to the hospital mothership **AMS MERCY** — dock in the dashed bay to
  drop them off, refuel, and heal.
- Turrets track and shoot you. You can shoot back… but completing a sector without
  firing a single shot earns the **Hippocratic bonus** (*primum non nocere*, +2000).
- Your hull health is a live **ECG trace** — the beat races as your vitals fall.
- Three sectors: Asclepion, Vesalius Ridge, Nightingale Basin.

## Tech

Zero dependencies: one HTML file with inline CSS/JS, canvas rendering with glow
effects, seeded procedural terrain, multi-touch virtual buttons with safe-area
insets, and a tiny Web Audio synth (thrust noise, laser blips, explosions, and a
lub-dub heartbeat when a Doid comes aboard).
