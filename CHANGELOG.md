# Changelog

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

### Repository & URL (action still required)
The GitHub **repo rename is a Settings action** that can't be done from git.
To complete the rename:
1. GitHub → repo **Settings** → rename **`Doids` → `hollow-oath`**.
2. GitHub Pages then serves from `https://burners70.github.io/hollow-oath/`.
   GitHub auto-redirects the old `.../Doids/` path for a while, but don't rely on
   it long-term — update any external links.
3. Local clones: `git remote set-url origin <new URL>`.

In-repo references (README, GAME_DESIGN, manifest description) already point to
the new `hollow-oath` URL in anticipation; they are correct the moment step 1 is
done.

### Verification
Headless Chromium (Playwright) smoke test after the changes: game boots, document
title is "Hollow Oath — a gravity rescue", all 8 sectors generate and run, the new
`firedAtSecret`/`firedAtCombat` flags are present, **no console errors**.
