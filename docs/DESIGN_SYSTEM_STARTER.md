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
| `ember` | `#ff6d00` / `#ff9e40` / `#ffae40` | Fire/torched death-state accents (`EMBER` / `EMBER_LIT` / `EMBER_MID`) |
| `ember-core` | `#ffc400` | A flame's hot core. **Shares its value with `warn` by coincidence of art, not intent** — split out in DS1 so colourblind mode swaps the fuel warning and leaves fire looking like fire |
| `ember-white` | `#fff3d6` | The white-hot centre of an ignition or detonation |
| `alert-red` | `#ff1744` / `#ff2d55` | Critical alarms, low-health pulse, Asclepius emblem |

### 2.4b Focus, parry & the counterfeit sign

| Token | Hex | Usage |
|---|---|---|
| `FOCUS` / `FOCUS_INK` | `#eaff6b` / `#f7ffd0` | Keyboard/gamepad selection cursor — title pills, codex legend rows, settings rows |
| `PARRIED` / `PARRIED_INK` | `#eaff6b` / `#f7ffd0` | A shield-parried round, now flying home as yours (E3) |
| `COUNTERFEIT_NEON` | `#c6ff00` | The counterfeit MERCY's flickering serpent sign (Bundle N) |

These sit **outside** the cyan / violet / amber / pink / mint family on purpose:
the cursor has to read *over* cyan chrome, and the counterfeit's sign has to look
wrong. **None of them swaps in colourblind mode**, and that is deliberate:

- `FOCUS` doesn't need to — the cursor is already a stroked box around the
  selected row, so the state reads by shape without colour at all (§H2 redundancy).
- `PARRIED` doesn't need to *because* hostile fire does. Hostile rounds are
  `PAL().DANGER`, which swaps to the colourblind white, so parried-vs-hostile
  reads by hue **and** luminance for every CVD type. The pre-DS build had one
  literal doing both the cursor and the parry job, against a pink hostile round
  — the worst possible pairing for red-green deficiency.
- `COUNTERFEIT_NEON` must stay constant or the tell you learn stops being a tell.

`FOCUS` and `PARRIED` share values today but are separate tokens, so one can
change without silently dragging the other with it.

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
  display face appears at **20–60px** (scales with viewport width, capped).
- **Mono headings are a third step, 16–18px at weight 800.** The audit found four
  sizes outside the old documented ranges and they turned out to be headings, not
  drift — an intro-panel title, the ROTATE TO LANDSCAPE prompt, a codex arrow
  glyph, a flight-manual page title. That is hierarchy doing its job, so the scale
  was widened to admit it rather than the emphasis flattened (DS5). Keep it to
  those two steps; body/label text stays 8–15px.
- **Build type through the helpers, not by hand** (`js/world.js`): `body(base)`
  for anything a player reads as prose — it routes through `bodyFontPx()`, so the
  BIG TEXT accessibility toggle reaches it — and `mono(px)` for fixed HUD chrome
  that must not reflow. `display(px)` is the wordmark/headline face. A literal
  `ctx.font = "700 11px Menlo, monospace"` is how the third-family and off-scale
  drift got in; the helpers make it hard to repeat.

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

### 5.6 Further component patterns (documented for future use, not yet built)

A 2026-07 design-system export (Claude Design) proposed named vanilla-CSS classes
for patterns that today exist only as canvas-drawn HUD or ad hoc markup: `Pill`
(title/menu action pill with a leading glyph), `Badge` (semantic status chip —
`CONTAINED`, `COUNTERFEIT`), `StatReadout` (mono micro-readout: glyph + label +
value, e.g. `◈ 2/7`), `Card` (a story-reveal card: kicker → title → body →
footer, accent recolouring the whole card per beat), and `Wordmark` (the
breathing-glow title face). None of these are implemented as reusable classes
anywhere in the repo yet — build them only when a concrete screen needs one,
and when you do:

- **Reuse the existing tokens; don't add a second set.** The export's CSS used
  its own `--ho-a` accent variable plus a full parallel `--ho-*` scale
  (`--ho-cyan`, `--ho-ink`, `--ho-font-mono`, …) that collides in *name* — but
  not in *value* — with the tokens already live in `css/game.css`
  (`--ho-cyan-rgb`, `--ho-safe-rgb`, …) and inline in `about.html` /
  `support.html` / `privacy.html` (`--ho-cyan`, `--ho-ink`, …, see §8). That file
  was deliberately **not** merged, for exactly this reason — two definitions of
  `--ho-cyan` under one prefix is the ambiguity a token layer exists to prevent.
  Any new component should read the tokens that already exist on whichever
  surface it lands on, and never introduce another `--ho-*` name.
- **The "accent encodes function" idea is already shipped** — it's `.btn` + `--c`
  in `css/game.css` (§5.1). Don't rebuild it.
- **Anything that encodes state must go through the swap layer** (§8): `PAL()` in
  canvas, `rgba(var(--ho-*-rgb), a)` in `css/game.css`. A `Badge` reading
  `CONTAINED` vs `COUNTERFEIT` is a semantic colour, not decoration — if it's
  built from `TOK` or a literal it will be invisible to colourblind players and
  will fail the guards in `tests/settings.spec.js`.
- Match §4's glow law and §7's Do/Don't for any new pattern: outer + inset glow,
  glow colour = stroke colour, no flat fills, no third typeface.

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
- **Isolate the line that has to land.** Owner ruling (July 2026): the strongest
  sentence in a block is often the shortest, and it gets buried when it sits at
  the tail of a long paragraph. If a line is doing the emotional or narrative
  work, give it its own `\n\n` block so it stands alone. *"Fly it again. Look
  closer this time."* lands because nothing shares its air; the same words at the
  end of a five-line paragraph read as an afterthought. This is a **deliberate
  authoring choice, not a wrapping concern** — `wrapText` only wraps *within* an
  authored line, so isolation has to be written into the string. Applies to
  briefings, story cards, log fragments and epilogue text. Use it sparingly: if
  every paragraph is one line, nothing is emphasised.
  situation → qualifier pair (a hook line, a HUD banner) reads well split across
  two lines *when each half is a complete thought* — `about.html`'s hook keeps
  `"Something calls every 41 seconds."` and `"Not everything that answers should
  be trusted."` on separate lines because both are full sentences. If splitting
  would strand one bare word alone on the second line (an in-canvas banner like
  `NIGHT COMES DOWN ON THE BASIN` breaking as `…DOWN` / `ON THE BASIN`), keep it
  on one line instead. That's why that exact banner ships as a single string
  (`docs/COPY_DECK.md`). One line beats an orphaned word, two lines beat a
  run-on, and you should never trade one problem for the other.
- **A dangling dash is the tell that a line break has gone wrong.** `wrapText`
  treats an em-dash as an ordinary word boundary, so a dash can end up stranded
  at the end of a line or orphaned at the start of the next (`Dust occlusion
  across the basin` / `— and night coming down fast.`). If a rendered break looks
  wrong, check for a dash before reaching for the wrapper: removing the dash per
  the rule below usually fixes the break as a side effect. Balanced
  minimum-raggedness wrapping was prototyped against the real copy and is **not**
  an improvement, so the greedy wrap in `wrapText` stays.
- **Casing is per medium.** In-canvas flavour/subcopy runs lowercase (diegetic,
  canvas-only); in-canvas *labels* stay UPPERCASE (`FUEL`, `SETTINGS`). **Every
  other medium** — marketing pages, store copy, docs, decks — uses sentence case.
  Proper nouns stay capitalised everywhere (Scion, MERCY, the Static, sector
  names) regardless of casing mode. `about.html` ships the tagline as
  `A gravity rescue. A love letter to the 16-bit lander classics.`; the canvas
  form is the same line lowercased, not a different line.
- **Spelling:** UK English throughout (`colour`, `catalogued`, `immunised`) —
  matches the copy already in `docs/COPY_DECK.md` and `js/world.js`. Don't
  Americanise new strings. *(Note: this doc's own older headings use US
  spellings like "Color" and "Flavor" — the rule is about **player-facing
  copy**, not these headings.)*

### Avoiding AI tells

Keep new copy clear of the patterns that read as machine-written:

- **The em-dash splice is the loudest tell in this codebase, and it is not the
  house voice.** Owner ruling (July 2026): the em-dash habit in the shipped
  strings is Claude's, not the author's, and it is to be **minimised
  everywhere** — canvas copy included, not just prose. Do not defend an existing
  em-dash on the grounds that it shipped; a lot of them shipped because an AI
  wrote them. What to reach for instead:
  - **`— and` / `— but` joining two clauses → a comma, or two sentences.** This
    is the clearest offender: *"saved countless mothers — and was ignored for
    decades"* wants *"saved countless mothers. He was ignored for decades."*
  - **A vocative → a comma.** *"Captain — the surface scans are lying"* wants
    *"Captain, the surface scans are lying."*
  - **An appositive gloss → a colon.** *"an interdicted zone — automated
    defences, dead relays"* wants *"an interdicted zone: automated defences,
    dead relays."*
  - **Two separate facts in one readout → `·`**, the separator the HUD already
    uses (`SCIONS ABOARD 0 · SECTOR 0/7`, `saved 3 · ✝ lost 1`).
  **Two uses stay legitimate**, and they are different things from the splice:
  (a) a *paired* parenthetical where both dashes are present — *"if all of it —
  the Vectors, the counterfeits, the Static itself — grew from…"*; and (b) the
  ALL-CAPS `STATUS — DETAIL` separator in HUD banners (`CAUGHT — SCION SAFE`),
  which is instrument-panel punctuation rather than prose. Neither is a tell.
- Cut hedges and filler adverbs (*quietly, simply, truly, seamlessly*) — if a
  sentence needs one to land softer, split it into two instead.
- Vary rhythm; not every list needs exactly three parallel clauses.
- No generic app-UI phrasing (*"Click here," "Settings saved!," "Get started
  today"*) — it breaks the diegesis on any surface, not just in-canvas.
- No emoji as UI or decoration (see §5.4 Iconography — the game's glyphs are
  Unicode symbols with the same glow treatment as text, which is not the same
  thing).

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
  new status indicator, and route it through `PAL()` (`js/world.js`) — never a
  hex literal. For a translucent variant use `shade(PAL().SAFE, .7)`; typing
  `rgba(105,240,174,.7)` by hand is the same bug wearing a different hat, and it
  produced two-tone controls nobody designed.
- **Do** ask whether a new colour is a *meaning* or a *skin*. Meanings go in
  `PALETTES` and swap; skins go in `TOK` and don't. Amber fuel warnings and amber
  flame cores look identical and are not the same thing (see `EMBER_CORE`).
- **Do** keep glow color = fill/stroke color; a mismatched glow reads as a bug, not
  a style choice.
- **Don't** introduce flat/matte UI elements with no glow — it will look out of
  place against every existing screen.
- **Don't** add a third typeface or switch the mono role to a humanist sans; the
  monospace-as-instrument-panel read is load-bearing for the sci-fi/medical tone.
- **Don't** use pure saturated white for large fills — the palette stays in cyan/
  violet/amber/pink family even for "neutral" chrome.

---

## 8. How the system is enforced (Bundle DS, July 2026 — shipped)

**The audit that opened this section is closed: the rules above are now
mechanism, not convention.** Where to reach for what:

| You need… | Use | Swaps for colourblind? |
|---|---|---|
| A state colour — safe / caution / danger / unknown | `PAL().SAFE` `.WARN` `.DANGER` `.REVEAL` | **Yes** |
| That state colour at partial alpha | `shade(PAL().WARN, .55)` | **Yes** |
| Chrome or flavour — void, cyan, violet, gold, ember, focus | `TOK.*` (`js/world.js`) | No, by design |
| Player-facing prose | `body(base)` — picks up BIG TEXT | — |
| Fixed HUD chrome / the display face | `mono(px)` / `display(px)` | — |
| Anything in `css/game.css` | `rgba(var(--ho-safe-rgb), a)` | **Yes**, via `body.cb` |
| Anything on the marketing pages | `var(--ho-safe)` (plain hex tokens) | n/a |

A hex literal at a call site is the bug this bundle removed — 130 semantic
literals and 27 hand-written `rgba()` variants were resolving past `PAL()`, which
is why colourblind mode reached the landing guide and ECG but not the fuel bar,
the shield bubble, the settings toggles or any on-screen button. `css/game.css`
could not swap at all, since CSS cannot read `PALETTES`; the `body.cb` class is
that bridge.

**Two guards in `tests/settings.spec.js` keep it honest** — they instrument a live
frame and assert on every colour actually painted, plus the computed border colour
of the flight controls. A new hardcoded semantic hex fails CI. The old test only
checked that the *flag* persisted, which is how this drifted so far unnoticed.

Two things deliberately left alone, both flagged for on-device review rather than
changed blind:

- **`PALETTES.cb.DANGER` is `#ffffff`.** Pure white is the conventional maximally-
  distinguishable third channel next to the cb blue and orange, but §7 says don't
  use saturated white for large fills — worth a look on real hardware now that it
  reaches enemies and hostile fire, which it previously did not.
- **One `#fff` remains** on a hover state in `about.html` — a genuine neutral, not
  a palette colour.
- **The two `SHRINES` accent colours in `js/world.js` stay literal.** They're
  narrative *content* in a data table, not UI chrome, and the tables are defined
  above the token layer in load order, so they can't reference `TOK` without
  moving code in a load-order-sensitive file for no behavioural gain. If the
  shrine palette ever needs to move with the system, move `TOK` above the story
  tables in the same change — it has no dependencies.

---

*Source references for follow-up questions: `css/game.css` (buttons, banner),
`js/render.js` (all screen/HUD drawing + glow calls), `js/world.js:271-275`
(semantic `PAL()` palette + colorblind swap).*
