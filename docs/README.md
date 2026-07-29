# Hollow Oath — documentation

Reference docs for the game. If you're working on the code, read
[`../CLAUDE.md`](../CLAUDE.md) first — it maps the `js/` source files and tells
you which of these docs to open for a given task (and which to skip). Don't load
all of these at once; each is here for a specific job.

Every doc in this folder is listed below. If a doc isn't in this index, it
shouldn't be in the folder.

## Active

| Doc | Read it when |
|-----|--------------|
| [APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md) | **The forward plan, and the only one.** Holds *open* bundles only, with an "Open work at a glance" table at the top; read that, then the one bundle you're working on. Shipped bundles moved to ROADMAP_ARCHIVE.md. |
| [GAME_DESIGN.md](GAME_DESIGN.md) | Changing game rules, mechanics, scoring, or narrative canon (the Static, Glycon). The canonical design doc. |
| [COPY_DECK.md](COPY_DECK.md) | Editing any user-facing text/wording. Any PR that changes a player-facing string updates this deck too. |
| [DESIGN_SYSTEM_STARTER.md](DESIGN_SYSTEM_STARTER.md) | Adding UI/HUD: the colour, type, spacing and glow tokens as actually shipped in `css/game.css` / `js/render.js`. |
| [ACT_TWO_SPEC.md](ACT_TWO_SPEC.md) | **The 1.1 plan.** Act Two — the ten-level underground rescue campaign beneath SOLACE, where the pendulum debuts. Supersedes PENDULUM_SPEC.md and absorbs Bundle Q's caves. Read this for *what to build*. |
| [PENDULUM_SPEC.md](PENDULUM_SPEC.md) | **Superseded as a plan; still the physics reference.** The tether model, damage model and tow conventions, which carry over into Act Two unchanged. Read this for *how the sling works*. |
| [HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md) | Bundle Q. Its three new caves are absorbed into Act Two; what survives is the core (Laennec/AUSCULTATION, now an Act Two upgrade, and the ROTATION CHART as a 1.01 utility). |
| [GAMECENTER_ACHIEVEMENTS.md](GAMECENTER_ACHIEVEMENTS.md) | Touching ranks / Game Center achievements. |
| [STORE_LISTING.md](STORE_LISTING.md) | App Store Connect metadata: pricing, description, keywords, support/privacy URLs. |
| [PRESS_KIT.md](PRESS_KIT.md) | Sending something to press: a ready-to-copy fact sheet, pitch and boilerplate (UK English, no house jargon), plus an internal-only note on where the asset files live. |
| [LAUNCH_PLAN.md](LAUNCH_PLAN.md) | Planning or running the low/no-cost launch marketing push: Featuring Nomination, press/community targets, Apple Ads Basic, budget and timing. The marketing layer only — not the shipping checklist (that's APP_STORE_ROADMAP.md Bundle O). |
| [TESTER_KIT.md](TESTER_KIT.md) | Running a TestFlight round: the "What to Test" note, invite welcome message, and blind-play survey script. |
| [TESTER_LOG.md](TESTER_LOG.md) | Who's testing, and which build they were invited to. |
| [QA_HARNESS.md](QA_HARNESS.md) | Testing a build on a phone (or anywhere) without a console — `tests/qa-harness.html`'s tap menu + injected Eruda console. |

## Reference & history

Archival. Useful for *why* something is the way it is; never the source of
truth for what to build next — that's APP_STORE_ROADMAP.md.

| Doc | What it is |
|-----|------------|
| [ROADMAP_ARCHIVE.md](ROADMAP_ARCHIVE.md) | The 19 shipped roadmap bundles (A–N, R, S, U, QA, Y), moved out of the plan with their acceptance notes and code anchors. Grep here for a bundle/item ID the plan no longer mentions. |
| [CHANGELOG.md](CHANGELOG.md) | Change history, incl. the DOIDS → Hollow Oath rename log. |
| [RELEASE_READINESS_REVIEW.md](RELEASE_READINESS_REVIEW.md) | July 2026 QA snapshot, closed — every bug it found is fixed and its recommendations were folded into the roadmap. |
| [ROADMAP.md](ROADMAP.md) | The v2/v3 build-out log and the design reasoning trail behind shipped features. Superseded as a plan by APP_STORE_ROADMAP.md. |
| [HOLLOW_OATH_BRIEF.md](HOLLOW_OATH_BRIEF.md) | The rename & narrative brief that drove the current naming. |
