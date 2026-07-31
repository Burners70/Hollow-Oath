# Tests

Headless Playwright smoke suite. It loads `../index.html` over `file://` (no web
server, no build) and drives the game through the `window.__doids` debug handle
exposed at the bottom of `js/render.js`.

```
npm ci && npm test          # or: npx playwright test
npx playwright test rescue  # one file
npx playwright test -g "V12" # one test, by title
```

`playwright.config.js` auto-detects a pre-installed Chromium (the stable symlink
`/opt/pw-browsers/chromium` in the dev containers), so **don't run
`playwright install`** there. On a machine without one, run
`npx playwright install chromium` once.

## Which file holds what

150 tests, split by concern so an edit loads one small file instead of the whole
suite. `harness.js` holds the shared per-test guard — navigate to the game, wait
for `__doids`, and fail the test on any console error or uncaught exception.

| File | Covers |
|------|--------|
| `boot.spec.js` | Booting to the title, the first-play fork and HOW TO FLY guide, the veteran intro, game over, save/resume (incl. a corrupt save), iOS-lifecycle stability |
| `settings.spec.js` | The settings panel and every persisted toggle, pause menu, HUD legend, tight-viewport layout fits, keyboard/touch input |
| `audio.spec.js` | Thrust-noise lifecycle, ambience tracking the ship's vitals |
| `worldgen.spec.js` | Level/cave generation, biomes and widths, beacons and black boxes, wrecks and lift pads, seeded/daily runs, veteran gating and escalation, plus the generation-**fairness** invariants. Also Act Two's **span terrain** (Bundle P, P·terrain): that Act One's heightmap is untouched, that a chamber compiles deterministically, that overhangs/pinches/pillars exist, and that the drawn rock matches `solidAt` |
| `flight.spec.js` | The landing evaluator and rank flags, shield parry, the secret lift down and back, fuel economy (stranding, resupply drone, transfusion line, paid refueller) |
| `rescue.spec.js` | Scions vs Vectors: the landed scan, counterfeit tells, malpractice rules, contagion and the healing cabin, breach retrieval/isolation, extraction hangar and triage retreat |
| `finale.spec.js` | The counterfeit MERCY, the twin reveal, the Solace, and every ending |
| `story.spec.js` | Briefings, the 41-second clock, recovered logs and the codex archive, Game Center facade |
| `acttwo.spec.js` | **Act Two's mechanics** (Bundle P, P·slice): the trunk cut, the cradle, the tether and its damage model, the draining reserve and its bite on the 41s beat, the inverted transfusion, THE WELL, death-while-towing — plus the **traversability invariant** (every chamber must be flyable laden). Act Two's *terrain* stays in `worldgen.spec.js` with the other generation invariants. Nothing here asserts a tuning number: Act Two's feel values are tuned on hardware, so the tests assert the rules |
| `copy-deck.spec.js` | Guards `docs/COPY_DECK.md` against drift — see below |

Adding a test: pick the file by concern, follow the pattern in it
(`page.evaluate(() => __doids.go(n))`, then assert on `__doids.get()`), and when
you add a feature, expose its state in `__doids.get()` first. `useGame(test,
expect)` is already called at the top of each spec file.

## The copy-deck guard

`copy-deck.spec.js` reads `docs/COPY_DECK.md` and asserts that a sample of
player-facing strings quoted there still appear in `js/`. The convention is that
any PR changing a player-facing string updates the deck in the same PR; this
makes the convention fail loudly instead of rotting quietly. If it fails, the
fix is normally to update the deck — not to weaken the test.

## Also here

`qa-harness.html` is a standalone tap-driven rig for testing a build on a phone
without a Mac or a console — see [`../docs/QA_HARNESS.md`](../docs/QA_HARNESS.md).
It isn't part of the Playwright run.
