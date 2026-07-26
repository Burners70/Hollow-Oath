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

### 2.4b Focus / selection — undocumented until the July 2026 audit

| Token | Hex | Usage |
|---|---|---|
| `focus` | `#eaff6b` (yellow-green) | Keyboard/gamepad selection highlight on codex legend rows and settings rows; also reused as the "reflected projectile" tell |

This is the one hue in the shipped build that sits **outside** the cyan / violet /
amber / pink / mint family, it has **no colourblind variant**, and it carries two
unrelated meanings. It is recorded here because it *is* in the build — not because
it is endorsed. Bundle DS3 in [APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md) is the
decision to either promote it to a real `focus` token or fold it into existing ones.

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
- **Line breaks: don't let a sentence run on across an awkward wrap.** For any
  multi-line body copy (intro captions, briefings, reveal/clue cards), break the
  string at sentence/thought boundaries with explicit `\n\n` so a distinct
  sentence starts on its own line rather than trailing off the end of one line
  and picking up mid-next. e.g. the veteran opening puts *"Why did her call
  corrupt? And why did she go down at all?"* and *"Fly it again. Look closer this
  time."* on their own lines. Width-wrapping (`wrapText`) then only wraps within
  each authored line. Keep final lines from stranding a single orphan word.

## 6.5 Layering & occlusion (the "one is always in front" rule)

Depth must always read cleanly — the terrain and any object over it must look
like one is clearly **in front of** the other, never a translucent overlap where
the hillside's own outline shows straight through an object (an "X-ray glitch").

- **Solid masses occlude.** Anything that is a physical mass sitting in the
  landscape — rock, sand dune, hedge, building, boulder, a downed ship — fills
  its body near-opaque (`SOLID_ALPHA`, see `js/render.js`) so it hides the
  terrain and scenery behind it. Draw order already puts scenery after terrain;
  opaque body + drawn-after = reliably in front. The neon edge stroke still
  carries the flavour, so "solid" doesn't mean "flat".
- **Only non-solid *materials* stay see-through**, and only where the
  translucency reads as the material rather than a bug: airy foliage (tree
  canopies), ice/crystal (spires), thin line-art with no body to X-ray (reeds,
  lantern poles), and flat accents that lie *on* the ground (dune bands, salt-pan
  sheen, the lift-pad seam). If in doubt, make it occlude.
- A sheared/buried edge (a wreck cut by a ledge) gets a drawn torn edge so the
  silhouette still closes — never leave a hard clip with no outline, which reads
  as unfinished.

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

## 8. Conformance status (audit, July 2026)

**This document describes the intended system; the build only partly enforces
it.** Read this before assuming a rule below is live in the code:

- **The semantic colour layer is mostly bypassed.** §2.3 says never hardcode
  `safe`/`warn`/`danger`/`reveal` — but `PAL()` is called 9× in `js/render.js`
  and 13× in `js/update.js`, against ~93 hardcoded literals of those same four
  hexes. The swap reaches the landing guide, ECG and transfusion line; it does
  **not** reach the fuel bar, shield bubble, settings toggles or codex markers.
- **The on-screen buttons (§5.1) cannot swap at all** — their colours live in
  `css/game.css`, which has no access to `PALETTES` and no colourblind hook.
- **There is no token layer.** ~126 literal `ctx.font` strings and 250+ raw hex
  literals in `js/render.js`; conformance is convention, not mechanism.
- **Typography drifts past §3's ranges**: mono at 16px and 18px, display at 20px.
- **The marketing pages** (`about.html`, `support.html`, `privacy.html`) tokenise
  fonts but not colour, and add JetBrains Mono via Google Fonts — a third family
  §3 does not allow and the game cannot match.

All five are tracked as **Bundle DS** in
[APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md). Keep this section updated as they
land; when DS is fully checked off, this section should say so rather than be
deleted.

---

*Source references for follow-up questions: `css/game.css` (buttons, banner),
`js/render.js` (all screen/HUD drawing + glow calls), `js/world.js:271-275`
(semantic `PAL()` palette + colorblind swap).*
