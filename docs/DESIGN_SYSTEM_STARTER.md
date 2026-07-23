# Hollow Oath — Design System Starter

*Extracted from the shipped game (`css/game.css`, `js/render.js`, `js/world.js`) as a
starting point to refine in Claude Design. Every token below is a real value pulled
from the live build, not invented — treat this as "current state," then adjust.*

## 1. Identity in one line

A neon-glow flight HUD in a dark void — Lunar Lander's mechanical lineage rendered
like a hospital terminal readout, with a medical-ethics undercurrent (the game is
about rescue, triage, and *primum non nocere*). Everything reads as **diegetic UI**:
text and controls look like they belong to the ship's instrument panel, not an
overlay bolted on top.

**Mood keywords:** dark, terse, glowing, clinical, mechanical, quietly ominous, warm
only where it counts (rescue/safe states).

## 2. Color

### 2.1 Base / void

| Token | Hex | Usage |
|---|---|---|
| `bg-void` | `#05060f` | Page/canvas background, deepest black |
| `bg-void-mid` | `#0a0d22` | Background gradient midpoint |
| `bg-void-high` | `#101433` | Background gradient top (horizon glow) |
| `panel-bg` | `rgba(8,10,26,.95)` | Modal/panel fill (near-opaque navy) |
| `panel-bg-dim` | `rgba(5,6,15,.72–.9)` | Full-screen scrims behind menus |

### 2.2 Signature accent (primary UI color)

| Token | Hex | Usage |
|---|---|---|
| `cyan` | `#00e5ff` | The default glow/accent — borders, primary text glow, active HUD elements, thrust/left/right flight buttons |
| `cyan-ink` | `#aef4ff` | Brightest text on cyan glow (title wordmark, emphasis) |
| `cyan-text` | `#9beaf9` | Secondary/body HUD text |
| `cyan-text-soft` | `#7fe9ff` | Tertiary labels, help-menu rows |
| `cyan-bright` | `#eaffff` | Near-white highlight text |
| `cyan-pale` | `#bfeefb` | Install/system banner text |

Buttons and panels built from cyan use a consistent alpha ramp: border `~55%`
opacity, fill `~7%` opacity at rest, fill `~28%` + wider glow when pressed/active.

### 2.3 Semantic state colors (used consistently for meaning, not decoration)

| Token | Hex | Meaning | Colorblind-mode swap |
|---|---|---|---|
| `safe` / `success` | `#69f0ae` (mint green) | Safe to land, docked, objective complete | `#40c4ff` |
| `warn` | `#ffc400` (amber) | Caution, fuel, in-progress | `#ffab40` |
| `danger` | `#ff4081` (hot pink-red) | Damage, threat, enemy fire | `#ffffff` |
| `reveal` | `#ff5ce1` (magenta) | Scanned/revealed-but-unknown marker | `#ff6bff` |

A full alternate palette exists and swaps automatically in colorblind mode — treat
`safe`/`warn`/`danger`/`reveal` as a **semantic token layer**, never hardcode the hex
directly in a new component.

### 2.4 Narrative / rare accents

| Token | Hex | Usage |
|---|---|---|
| `mystic-violet` | `#b388ff` | Caves, shrines, story fragments, "unresolved haunt" state |
| `mystic-violet-deep` | `#7c4dff` | Glow shadow paired with mystic-violet |
| `mystic-violet-soft` | `#c9a6ff` | Shrine-lit variant |
| `void-purple` | `#151040` / `#1b1040` / `#0c0820` | Cave interior fills |
| `gold` | `#ffd54f` | Fragments/collectibles, codex highlight |
| `gold-warm` | `#ffe9a8` | Found/collected state |
| `ember` | `#ff6d00` / `#ff9e40` | Fire/torched death-state accents |
| `alert-red` | `#ff1744` / `#ff2d55` | Critical alarms, low-health pulse, Asclepius emblem |

### 2.5 Contrast rule of thumb

Every accent color is paired with a matching `shadowColor` glow of the *same* hue at
the same or one step darker — glow is never a neutral drop shadow. Neutral white is
used sparingly and only at low opacity (`rgba(255,255,255,.25–.6)`) for
disabled/inactive states.

## 3. Typography

Two families only, doing distinct jobs — do not introduce a third.

| Role | Family | Weight | Notes |
|---|---|---|---|
| **Display** (title wordmark, screen headlines, HELP title) | `'Helvetica Neue', Arial, sans-serif` | 800–900 | Large, tight, no letter-spacing tricks needed — the glow does the work |
| **UI / HUD / body** (everything else: labels, meters, menu rows, dialogue) | `Menlo, monospace` | 600–800 | Small sizes (8–15px), always paired with a colored glow shadow |

- Button labels use the display sans at small size with `letter-spacing: 1px` and
  uppercase text (`L`, `R`, `FIRE`, `THRUST`).
- Monospace is the "instrument panel" voice — it should feel like a printed readout,
  not prose. Keep line lengths short.
- Sizes cluster tightly: **8, 9, 10, 11, 12, 13, 14, 15px** for mono UI text; the
  display face only appears at **22–60px** (scales with viewport width, capped).

## 4. Glow — the core visual signature

Nearly every drawn element pairs a `shadowColor` + `shadowBlur` with its own
stroke/fill color, at blur radii of **4–20px** depending on emphasis (resting text
≈ 6–10px, emphasis/active ≈ 12–20px, alarm pulses up to 30px). This is the single
most identity-defining rule in the system:

> **Nothing is flat. Every meaningful color also glows in that color.**

Panels add an `inset` glow as well as an outer one (see `.btn` in `css/game.css`),
giving controls a faint internal light rather than a hard fill.

## 5. Components

### 5.1 Flight control buttons (primary interactive pattern)
- Circular, 68–88px diameter (fixed device px, not scaled)
- 2px colored border at ~55% opacity, fill at ~7% opacity, outer glow + inset glow
- Pressed (`.down`) state: fill jumps to ~28% opacity, glow widens and intensifies
- Each control has its own accent: L/R = cyan, FIRE = danger pink, THRUST = warn
  amber, SHIELD = safe green — color encodes function, not just position

### 5.2 Panels / banners
- `rgba(8,10,26,.95)` fill, 1.5px cyan border, 8–12px radius, cyan outer glow
- Reserved for system chrome (install prompt) and full-screen overlays (help, pause,
  codex) — the scrim behind them is `rgba(5,6,15,.72–.9)`, never fully opaque, so the
  world stays faintly visible behind menus

### 5.3 HUD meters / bars
- Thin horizontal bars (~10px tall), track in low-opacity neutral, fill in the
  semantic color for that stat (fuel = warn amber, shield = safe green, damage flash
  = danger pink), label in mono caps above or beside

### 5.4 Iconography
- No icon font/SVG set — glyphs are drawn or typed as Unicode symbols with the same
  glow treatment as text: `✦` `◎` `▸` `❚❚` `✓` `↓` `↔`
- One bespoke drawn icon: an Asclepius staff (single-serpent caduceus) in
  `alert-red`/`gold`, used for the MERCY/medical motif — this is the closest thing
  to a "brand mark" and should be preserved if a logomark is ever formalized

### 5.5 Motion
- **Pulse**: `0.7 + 0.3 * sin(t * 2)` — a slow breathing glow on the title wordmark
  and other "alive" elements; alarms use a faster variant
- **Flicker**: irregular light flicker on fire/torch/lamp effects, distinct from the
  smooth sine pulse — reserve flicker for danger/organic light sources, pulse for
  calm/system elements

## 6. Voice & tone (for any copy in the system)

- Labels: **ALL CAPS**, terse, 1–3 words (`FUEL`, `HOW TO FLY`, `HUD GUIDE`)
- Subcopy: sentence case, dry and short (`"controls & the basics"`,
  `"tap outside to go back"`)
- Flavor lines lean literary/melancholy, not jokey (`"a gravity rescue — a love
  letter to the 16-bit lander classics"`)
- Never breaks the diegesis with generic app-UI phrasing ("Click here," "Settings
  saved!") — everything is framed as ship/mission language

## 7. Do / Don't

- **Do** reuse the semantic 4-color state system (safe/warn/danger/reveal) for any
  new status indicator, and route it through a palette-swap layer for
  accessibility, the way `PAL()` does in `js/world.js`.
- **Do** keep glow color = fill/stroke color; a mismatched glow reads as a bug, not
  a style choice.
- **Don't** introduce flat/matte UI elements with no glow — it will look out of
  place against every existing screen.
- **Don't** add a third typeface or switch the mono role to a humanist sans; the
  monospace-as-instrument-panel read is load-bearing for the sci-fi/medical tone.
- **Don't** use pure saturated white for large fills — the palette stays in cyan/
  violet/amber/pink family even for "neutral" chrome.

---

*Source references for follow-up questions: `css/game.css` (buttons, banner),
`js/render.js` (all screen/HUD drawing + glow calls), `js/world.js:271-275`
(semantic `PAL()` palette + colorblind swap).*
