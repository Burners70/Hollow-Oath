# Hollow Oath — App Store Roadmap

*The prioritised plan for **open** work on Hollow Oath, a paid iOS App Store
title. Work through the bundles in order; check items off (`[ ]` → `[x]`) as they
land, and add a line to [CHANGELOG.md](CHANGELOG.md) per bundle. When every item
in a bundle is checked, move the whole section to
[ROADMAP_ARCHIVE.md](ROADMAP_ARCHIVE.md) and leave a row in the shipped table
below — that's what keeps this file cheap to read.*

**This file holds only what is still open.** The 22 fully shipped bundles (A–N,
R, S, U, QA, Y, DS, X, Z) live in [ROADMAP_ARCHIVE.md](ROADMAP_ARCHIVE.md) with their
acceptance notes and code anchors intact — go there when you need the record of
*how* something was built, not to decide what to build.

Read [GAME_DESIGN.md](GAME_DESIGN.md) first — it explains the game, the narrative canon,
and the code architecture. [ROADMAP.md](ROADMAP.md) is the *historical* build-out log;
**this file is the forward plan.**

---


## How to work on this

- **The game stays static files with no build step** — zero dependencies, no
  bundler, no transpile; it must keep running by opening `index.html`. Since the
  July 2026 split, `index.html` is a thin shell over `css/game.css` and ordered,
  **non-module** `<script src="js/*.js">` tags sharing one global scope (see
  `../CLAUDE.md` for the per-file map). Work inside those existing files; don't
  add source files, and don't convert to `type="module"` (it changes scoping and
  can fail over Capacitor's iOS `file://` origin). The native wrapper (Bundle E)
  lives in its own `app/` directory and *copies* the web files in — the repo
  root remains the source of truth.
- **Keep the `doids_` localStorage prefix and the `__doids` debug handle.** They are
  deliberately unrenamed (renaming wipes existing players' saves — see CHANGELOG.md).
  New persistence keys should also use the `doids_` prefix for consistency.
- **Each bundle = one branch / one PR.** Bundles are ordered by priority and sized to
  be independently shippable. Dependencies are stated per bundle; anything not listed
  as a dependency can be done in parallel.
- **Testing:** the smoke suite lives in **`tests/`** — run it with
  `cd tests && npm ci && npm test` (`tests/playwright.config.js` auto-detects a
  pre-installed Chromium, so no `playwright install` is needed in the dev
  containers). It drives the game headlessly through
  `window.__doids` (`get()`, `go(n)`, `launch()`, `warpLift()`, `warpShrine()`,
  `give(upgrade)`, `reset()`), e.g. `page.evaluate(() => __doids.go(5))` then
  assert on `__doids.get()`. Pick the spec file by concern (`tests/README.md`)
  and copy the patterns in it. When
  you add a feature: extend `__doids.get()` to expose its state, add a test,
  and **run the suite before opening the PR** — it must stay green.
- **Code anchors** in this document name functions/variables, not line numbers
  (line numbers drift). Everything named lives in one of the `js/*.js` files —
  grep for it. Anchors written before the July 2026 split say `index.html`;
  read those as "somewhere in `js/`".
- **Copy lives in two places.** Player-facing strings are authored in
  `js/world.js` / `js/render.js` and mirrored, organised for review, in
  [COPY_DECK.md](COPY_DECK.md). Any PR that changes a player-facing string
  must update COPY_DECK.md in the same PR (see R10).

### Status key

- `[ ]` not started · `[x]` done · strike through items we decide to drop (don't delete
  them — the reasoning trail matters).

### Versioning (1.0 vs 1.0.1 vs 1.1)

**The patch release is `1.0.1`, never `1.01`.** It was written as `1.01`
throughout this plan until August 2026, when submitting it turned out to be
impossible for a reason worth recording: **App Store version components have
their leading zeros stripped**, so `1.01` is parsed as `1.1` — the two are the
same version number to Apple. Shipping `1.01` would therefore *consume the 1.1
slot*, and 1.1 is the Act Two release that carries the price move; the next
version after it would have had to be 1.2. A developer hit exactly this failure:
shipped 1.01, submitted 1.1, and was told a build with that version number
already existed. Sources: Apple's own version guidance and the forum report, both
cited in the release notes below. All forward-looking references in this plan and
in ACT_TWO_SPEC.md were renamed; CHANGELOG.md and ROADMAP_ARCHIVE.md keep their
original wording, because they record what was decided at the time.

Two numbers, moving at different times. The **version string** players see
(`1.0`, `1.0.1`, `1.1`, …) changes only when a build is **released to the
public**; the **build number** increments on every upload to App Store Connect.
So:

- **Still 1.0** — anything that lands *before 1.0 is approved and live.* You
  upload a **new build of 1.0** (build 2, 3, …); the version string stays `1.0`
  and launch-day players get the fixes in their very first download. Re-uploading
  a build while in review restarts the review, but it does **not** need a version
  bump.
- **Becomes 1.0.1** — anything that lands *after 1.0 is live.* Existing players
  already hold 1.0, so changing what they have needs a new **version**, submitted
  and reviewed as an update.

The line is drawn by *"has 1.0 shipped to real users yet?"* — **not** by "have we
touched code?" That's why the sequencing calls below (pull a stability fix into
1.0, or hold it for 1.0.1) are real choices, not automatic ones.

**Owner decision, August 2026 — the merged post-1.0 work goes into launch-day
1.0, not into a separate version.** With 1.0 still in App Review, submitting a
second version was not possible anyway: App Store Connect requires the current
version to be *Ready for Distribution* before a new one can be created, and a
version in review is not. So the route taken is to **remove 1.0 from review,
upload a new build, and resubmit as 1.0** — the rule above, applied. The cost is
that review restarts (the app goes to *Developer Rejected* and any accepted items
must be resubmitted); the gain is that every launch-day player gets the fixes in
their first download, and V·pacifism's scoring change never lands on anyone who
had already earned a score under the old rules.

That reassigns bundles rather than deleting them: **everything already merged —
Bundle V's landed items including V·pacifism, Bundle X, Bundle Z — ships as part
of 1.0.** What remains unchecked in Bundle V is now the *next* release, 1.0.1,
whenever it is cut.

### Open work at a glance

Every unchecked item in this file, by bundle. Counts are `[ ]` items in that
bundle's section — grep the bundle heading to jump there.

| # | Bundle | Open | Release | What's left |
|---|--------|------|---------|-------------|
| O | Store listing & submission | 1 | 1.0 | O9 — swap the "coming soon" CTA for a real App Store link (**launch-day, after approval**; lands on `gh-pages`) |
| T | Zone identity | 2 | launch-stretch → 1.1 | T4 destructible scenery, T5 weather — both pre-approved to slip |
| V | 1.0.1 maintenance & narrative | 2 | 1.0.1 | V1 the ROTATION CHART, now unlocked by **Mary Seacole on the Nullwave** (a twelfth famous Scion), V·ship (the release action itself — code side is done) |
| P | **Act Two — the descent** | 7 | **1.1** | Phased — spec is [ACT_TWO_SPEC.md](ACT_TWO_SPEC.md). Re-scoped July 2026 to a ten-level underground rescue campaign; PENDULUM_SPEC.md is the physics reference only. **P·terrain, P·slice, P·feedback and P·floor have landed** — the loop runs end to end in one chamber, has had its first on-device round, and that chamber is now a floor with shape. Next are **P·systems** (the ladder, from a locked table) and **P·persist** (run provenance + chamber checkpointing), both fully specified and neither blocked on a decision. P·content authors the other nine against P·floor's vocabulary |
| W | Landscape challenge escalation | 2 | optional polish | W1 progressive terrain difficulty, W·guard — **no longer load-bearing** (Act Two carries 1.1 and the price move) |
| Q | The deep Hollows | 0 | fully dispositioned | Nothing open. Caves absorbed by Act Two; Laennec/AUSCULTATION → Bundle P; the ROTATION CHART → V1. Section kept, items struck, for the reasoning trail |

**One owner decision is open: the name of Act Two** (and with it the 1.1
What's-New line that does the price-move work in the store). The owner's steer
is that it comes out of the work, so it is written last — see
[ACT_TWO_SPEC.md](ACT_TWO_SPEC.md) §15. (V11 — whether to surface the decoy
MERCY earlier — was resolved with Bundle V: leave it as a deep secret, no code
change.)

Unscheduled ideas are parked at the bottom of this file, under *Suggested
sequencing* — that's the only backlog; don't start a new one.

### Shipped — see [ROADMAP_ARCHIVE.md](ROADMAP_ARCHIVE.md)

All items checked off; sections moved out of this file with their acceptance
notes and code anchors. The minimum viable paid release (**A + B + C + D + E +
F + R + O**) is complete: every pre-submission item in Bundle O has landed, and
the one remaining item (O9, the App Store CTA) is a launch-day task that can
only be done *after* approval.

Item-level anchors cited elsewhere in the docs (R10, S6, M1, M4, H3, H5, Y5,
E7…) are searchable in the archive — if you grep this file for a bundle ID and
find nothing, it shipped: grep [ROADMAP_ARCHIVE.md](ROADMAP_ARCHIVE.md) instead.
Bundles with *any* item still open stay in this file whole, shipped items
included (T, O and V are all partly done), so their anchors — T1, T6, O2,
V3 — are still here. Bundle X is fully shipped (X1–X6 + X·guard) and moved
to the archive in full, including its already-shipped X1/X3 slices.

| # | Bundle | Theme |
|---|--------|-------|
| A | Pause, save & resume | Playability on mobile |
| B | Emblem replacement | Legal (red cross → rod of Asclepius) |
| C | Audio baseline & settings | Paid-game floor |
| D | Performance pass | Review on real hardware |
| E | Native wrapper & compliance | The actual app |
| F | Haptics | Signature feature |
| G | Game Center | Retention |
| H | Accessibility & difficulty | Reach |
| I | The 41-second clock | Narrative → mechanic |
| J | Scan mechanic | The priced pacifist path |
| K | Log archive codex | Narrative QoL |
| L | Title haunting & epilogue | Narrative payoff |
| M | Remix mode & daily seed | Replay value / price point |
| N | Counterfeit MERCY finale | Glycon's third act |
| R | Playtest fixes (July 2026) | Bugs & UX — blocked submission |
| S | Sound, endgame & saboteur upgrades | Owner-requested for launch |
| U | Second playtest — sound, refueller & UI | Owner-requested for launch |
| QA | Playtest QA: legibility & fairness | Polish + design-pillar fairness |
| Y | 1.0.1 release-fix defects | Stability + render/telegraphing fixes |
| DS | Design-system conformance | Token layer; colourblind mode made real (**1.0**) |
| X | Onboarding & new-player experience | Trainee sector, guided pauses, hint bank, in-app rating (**1.0.1**) |
| Z | REMIX variable gravity | Per-seed gravity scale + landing-fairness re-tune (**1.0.1**) |

---

## Bundle T — Zone identity: width, biomes, weather (July 2026 feedback round)

**Why:** The owner wants sectors that feel like *places*: progressively wider
maps, visually distinct landscapes with their own ornamentation, and eventually
weather and destructible terrain-objects. Today every sector shares one violet
palette (`buildHeightTile` hardcodes the gradient and stroke) and one width
formula. **Priority: T1–T3 + T6 in the launch build; T4–T5 are
explicitly allowed to slip to 1.1 if they threaten the date (they change
difficulty balance and need device-perf validation on top of Bundle D's
budget). Dependencies: D4 (terrain tiles — palettes thread through it), C/S3
(audio beds), I (surge), M1 (seed plumbing — widths change the golden
checksum deliberately).**

**Status (shipped):** the launch core **T1–T3 + T6 are done** on the web build.
Progressive widths + distance-scaled fuel pods (golden checksum updated to
`1837799405`), per-sector biome palettes (grad/stroke/glow + `night`/`star`
tints, caves keep the Static violet), biome ornamentation (boulders, reeds +
ward-lanterns that light the dark, ice spires, banded dunes, hedgerows) with
per-sector surface ambience (wind on the shoals, insect shimmer over the
terraces), and staged nightfall on the Basin (dusk → full dark with a banner,
a drone swell and a guttering lamp — the guttering itself was later cut, see
the parked Vector light-sabotage idea below). Smoke tests added for all four. **T4
(destructible scenery) and T5 (weather) remain** — the pre-approved slip to
1.1 stands.

- [x] **T1. Progressive sector widths.** `genLevel` currently uses
  `W = 2600 + Math.min(n, 5) * 400` (finale 4400) — the owner finds them too
  small, and the cap flattens 5–7. Change to `W = 2200 + n * 550`
  (sector 0: 2200 — *smaller* than today, it's the teaching sector; sector 6:
  5500; finale: keep 4400, it's dense and dark by design). Fuel must scale
  with distance — that's the point ("this will require refuel calls or local
  fuel pods"): give sectors 1–2 their first fuel pods (RECIPE `pods: 0 → 1`
  and `2`), and add +1 pod per full 800 px above 3000 in `genLevel` (placed
  via the existing `pick()`), so remix/daily widths stay survivable. The
  transfusion drone already provides the "refuel call" everywhere as the
  backstop. Consequences to handle deliberately: the M1 golden heightmap
  checksum changes — update the test value in the same PR and say so in the
  PR body; `spots`/`pick` min-distances can stay (more room, same counts =
  emptier ≠ wider, so ALSO scale `oids`/`turrets` on sectors 4+ by ~+1 each);
  Curie's compass and Radiosense matter more at width — no change needed,
  but verify black boxes stay findable (they blink stronger when near).
- [x] **T2. Per-sector terrain palettes.** Add a `pal` entry to each
  `RECIPE[n]`: `{ grad: [top, bottom], stroke, glow }`, threaded through
  `drawWorld`'s `getTiles(...)` call into `buildHeightTile` (which currently
  hardcodes `["#1b1040", "#0c0820"]` fill and `#b388ff`/`#7c4dff` stroke).
  Caves keep the current violet (the Hollows should stay the Static's
  colour). Suggested palette map — each sector's landscape echoing its
  healer, so the biome *is* the narrative:
  | # | Sector | Ground | Rationale |
  |---|--------|--------|-----------|
  | 0 | ASCLEPION | soft teal-greens | temple calm, the tutorial breathes |
  | 1 | VESALIUS RIDGE | rust reds / ochre | anatomy, exposed muscle of the land |
  | 2 | NIGHTINGALE BASIN | deep indigo | her sector is the dark one |
  | 3 | SEMMELWEIS DEEP | cold antiseptic grey-green | the scrubbed ward |
  | 4 | CURIE FIELDS | luminous violet-green | radium glow (keep anomaly violet) |
  | 5 | AVICENNA SHOALS | sand / amber | the Persian desert, his crossing |
  | 6 | JENNER TERRACES | pale pastoral green | cowpox country — the calm that lies |
  | 7 | THE NULLWAVE | near-black violet | as now — the Static's home |
  Also tint the darkness overlay and star field subtly per sector (one
  multiply each). Keep every palette *behind* the HUD's semantic colours —
  run the landing guide / ECG over each ground colour and check contrast in
  both PALETTES (H1).
- [x] **T3. Ornamentation sets — zone the levels visually.** The scenery
  system (`RECIPE[].scn`, `drawScenery`) already varies counts; give it
  *types* per biome, so L1 stops being "very plain" (owner). Additions, all
  decorative-first (collision comes in T4): **boulder stacks** (Vesalius —
  bump `rocks`, add a stacked-boulder draw variant), **reed clusters + dim
  ward-lanterns** (Nightingale — lights matter in the dark sector),
  **ice spires with internal glow** (Curie — reuse the glow-tree code with a
  crystalline silhouette), **dune-banded rocks + salt pans** (Avicenna),
  **hedgerows and a ruined village** (Jenner — pastoral, with `ruin` count
  up), extra wreck density on the Nullwave (already). Implementation:
  extend the `scn` object with new type counts, one draw function per type
  in `drawScenery` (respect the D-bundle rule: `glowStroke`, no shadowBlur
  in loops), and authored per-sector in `RECIPE`. Ambient audio per biome:
  S3's bus gains a per-sector bed (wind for desert, insect-shimmer for the
  terraces, silence + drips for dark sectors) — one small gain-node loop
  each, set in `toBriefing`/`genLevel`. Screenshot all 8 sectors for the O4
  store-shot pass — this bundle is what makes those screenshots sell.
- [ ] **T4. Destructible, collidable scenery.** *(Launch-stretch — may slip
  to 1.1, owner has pre-approved the slip; do not let it block O.)* Tall
  scenery becomes real: trees, buildings, ice spires get `solid: true` —
  ship collision behaves like terrain contact (crash or shield-bounce;
  shield already saves cave-roof hits, reuse that check), and shots destroy
  them: trees burn (2 s flame particles, leave a charred stump variant),
  buildings erode through 3 damage states before rubble, spires shatter.
  THE CRITICAL RULE: destroying scenery increments `firedShots`/`runFired`
  like any shot (it already would — verify nothing special-cases it) and
  exhaust near a tree can ignite it (reuse the friendly-fire exhaust check
  pattern in `updatePlay`) — *do-no-harm now extends to the world*, which is
  exactly the game's thesis; a scorched-earth approach path costs you the
  Hippocratic bonus. Fairness pass required (the sector-1–2 turret-cover
  rule is precedent): no Scion may wait where the only safe landing lane
  demands destroying scenery. Perf: burning/erosion must stay within D's
  frame budget on the finale — measure with `?perf=1` before merging.
  Lure-trees keep their special reveal behaviour — a *burning* lure-tree
  should still count as `firedAtSecret`, not vanish silently.
- [ ] **T5. Weather & atmospheric conditions.** *(Launch-stretch, same
  pre-approved slip as T4.)* One condition per sector max, authored via a
  new `RECIPE[].wx` key, each with an audio bed (S3) and a REDUCED FLASH-
  aware visual: **crosswinds + dust devils** on Avicenna (a steady lateral
  force ±20 px/s² with gusts, telegraphed by streaking particles; dust
  devils = slow-moving anomaly-force columns, reuse the anomaly pull code
  with an x-drift), **rain + lightning** on Vesalius or Jenner (rain
  streaks; lightning = 120 ms sky flash + delayed rumble, min 8 s apart,
  suppressed by REDUCED FLASH), **snow blizzards** on Curie-as-ice-fields
  (visibility swirls — reuse the darkness-overlay machinery with a soft
  white noise mask instead of black; lamp radius logic applies). Winds
  interact deliciously with the transfusion hover and (1.1) the pendulum —
  note the interaction in PENDULUM_SPEC when this lands. Daily-mod synergy:
  add `wx`-based mods to `DAILY_MODS` ("HEADWINDS — crosswinds in every
  sector") once stable. Each condition needs: tunable strength, a briefing
  sentence teaching it, and a smoke test that the force applies only in its
  sector.
- [x] **T6. Stage the darkness — give night a scarier entrance.** The owner
  loves the dark sector but feels it "deserves a scarier intro" and maybe a
  later slot. Moving it breaks two locked structures (each sector introduces
  exactly one element; Nightingale = the Lamp is canon — she IS the Lady
  with the Lamp), so instead **stage nightfall inside the sector**: Basin
  starts at dusk (darkness overlay alpha ~0.4), and over the first ~20 s —
  or at first boarding, whichever comes first — night *falls* (alpha ramps
  to full over 6 s) with a banner (`"NIGHT COMES DOWN ON THE BASIN"`), a
  long low drone swell (S3 bed), and the lamp flickering on. Rewrite
  BRIEFS[2] to foreshadow dread rather than describe dust: e.g. *"Dust
  occlusion across the basin — and night coming down fast. Your lamp is
  your lifeline. And captain… the dark out here listens back."* (final copy
  via COPY_DECK review). Keep full darkness available later anyway: the
  BLACKOUT ROTATION daily mod and the finale already reprise it. Test: alpha
  ramp fires once, REDUCED FLASH halves the flicker, resume mid-sector
  restores the post-nightfall state.

---

## Bundle O — Store listing & submission (last)

**Why:** The actual shipping checklist. **Priority: last. Dependencies: A–F
merged; G/H strongly recommended.**

- [x] **O1. Pricing decision** with the owner. **Locked (owner, July 2026):
  launch at $2.99 / £2.99** — the UK point is Apple's direct equivalent of the
  $2.99 tier (confirm the auto-filled figure in App Store Connect when setting
  the base price); £1.99 held in reserve as an optional launch-week promo only.
  Recommendation from review: launch
  **$2.99** with A–F+I..L shipped; $4.99 is defensible only once M (remix/daily)
  and N (counterfeit MERCY) are in. No IAP, no ads — "complete game, no data
  collected" is the positioning.
- [x] **O2. Metadata.** *(Store listing entered in App Store Connect — owner,
  July 2026.)* Name "Hollow Oath", subtitle ≤30 chars (e.g. "A gravity
  rescue with a heartbeat"), description leading on: feel the heartbeat
  (haptics), trust nothing perfect, primum non nocere — **plus one nostalgia
  paragraph in generic terms** ("if you grew up steering a lander through
  16-bit caves and gravity wells, this is for you"). Keywords (all generic
  genre/mechanic words — defensible even where they coincide with old game
  names): lander, gravity, thrust, rescue, retro, arcade, 16-bit, cave, story.
  **No third-party trademarks in any metadata field (E7 / Apple 2.3.7)** — the
  *named* homage (Oids, Thrust, Gravitar) lives on the store-linked homepage
  and README instead, which is what search engines index for "games like Oids".
  **Owner decision, updated:** the store-linked homepage is a dedicated
  marketing page (`about.html`), **not** the live playable build — see O7.
- [x] **O3. Age rating questionnaire** *(completed — owner, July 2026)* — expect 9+ (infrequent mild fantasy
  violence). The player *can* shoot medics (malpractice mechanic); answer the
  violence questions honestly and keep the store description's framing on
  consequence, not carnage.
- [x] **O4. Screenshots & preview.** *(Captured and uploaded — owner, July
  2026.)* 6.7" and 6.1" sets (landscape), 8 per
  size: title, a landing beside a waving Scion, MERCY docking, a dark-sector
  lamp shot, a Hollows shrine, the CONTAMINANT ABOARD warning (owner call,
  swapped in for the ECG-arrhythmia moment — less compelling on screen), the
  "SOMEONE EXTRAORDINARY IS ABOARD" famous-Scion reveal, and the
  transfusion-line field-refuel moment (both owner additions, filling gaps
  the other six don't cover — narrative depth and the refuel mechanic).
  15–30 s preview video of one full rescue loop. Capture from a real device
  after D (perf)
  lands.
- [x] **O5. Support & privacy URLs.** A one-page privacy policy ("no data
  collected, saves stay on device/iCloud") and support contact, hosted on the
  existing GitHub Pages site. Live at `https://hollow-oath.com/privacy.html`
  and `https://hollow-oath.com/support.html`.
- [x] **O6. Submission dry run.** *(Test submission completed via TestFlight —
  owner, July 2026.)* TestFlight internal build → full E8 matrix →
  external TestFlight round (5–10 players, watch where they die and quit) →
  submit. Budget one rejection cycle; 4.2 is the likely challenge and the
  response is the native-features list (F, G, E4).
- [x] **O7. Take the public playable web build down before launch (owner
  decision, July 2026).** The live GitHub Pages deploy
  (`https://burners70.github.io/Hollow-Oath/`) was a development/testing
  convenience, not an intended permanent free release — the owner does not
  want a free web version coexisting with the $2.99 iOS app. Before
  submission:
  - Stop serving the playable build (`index.html` + `js/`/`css/`) publicly —
    either disable GitHub Pages entirely, or restructure the Pages source so
    it only serves the marketing/support/privacy shell (`about.html`,
    `support.html`, `privacy.html`), not the game itself.
  - Re-home the named homage paragraph (Oids/Thrust/Gravitar — E7) onto
    `about.html` specifically, since it can no longer live on the playable
    page.
  - `app/sync.sh` (mirrors web build into the Capacitor `webDir`) is
    unaffected either way — it reads from the repo directly, not from the
    public Pages deploy.
  - Note: this is a hosting/repo-settings change, not just a docs change —
    needs deciding *how* (Pages toggle vs. restructured source) before O6's
    dry run, since O5's Support/Privacy URLs and O2's Marketing URL all
    currently assume something is reachable at a `burners70.github.io` path.
  - **Resolved (owner decision, July 2026): restructure Pages to shell-only,
    do NOT disable it** — the marketing/support/privacy pages move to a
    **custom domain, `hollow-oath.com`** (see O8), so Pages stays on but serves
    only `about.html` / `support.html` / `privacy.html`, never the game.
  - **Implemented via a dedicated `gh-pages` publish branch (July 2026).**
    Deploy-from-branch only offers `/(root)` or `/docs`, and `/docs` holds the
    internal design docs (would leak) — so a separate publish branch is the
    clean fit. `gh-pages` contains **only** the shell: `index.html` (the
    marketing page, promoted from `about.html`), `about.html` (now a redirect to
    `/`), `support.html`, `privacy.html`, `icon-512.png`, `manifest.webmanifest`,
    the `iPhone-17` marketing shots, `CNAME`, and `.nojekyll`. The game
    (`index.html` + `js/` + `css/`) and all of `docs/` are intentionally
    absent, so the game is not downloadable from the web. `main` keeps the
    full game untouched for the Capacitor iOS build, plus draft copies of the
    same three shell pages at repo root (`about.html`/`support.html`/
    `privacy.html`) kept in sync with `gh-pages` for reference.
  - **Confirmed complete (owner, 25 July 2026):** the playable web app is no
    longer publicly accessible — the site now serves only from the shell-only
    publish branch, and the game (`index.html` + `js/` + `css/`) is not reachable
    from the web. Takedown done; ready for App Store submission.
    **Restyled to the shipped neon-glow brand (July 2026)** — Menlo/JetBrains
    Mono, cyan glow, ECG divider — replacing the earlier plain-dark draft;
    `icon-512.png`/`manifest.webmanifest` were added to `gh-pages` at the same
    time since the new pages reference them.
    **Done: owner confirmed `hollow-oath.com` is serving from `gh-pages`
    (July 2026)** — Settings → Pages → Build and deployment → Source:
    "Deploy from a branch" → Branch: `gh-pages` / `(root)`. Custom domain is
    `hollow-oath.com` (CNAME on `gh-pages`), "Enforce HTTPS" on. The playable
    game is no longer reachable on the web; `main` keeps it for the Capacitor
    iOS build only.
- [x] **O8. Move the public shell to a custom domain (`hollow-oath.com`).**
  *(Complete — owner, July 2026. The domain resolves and serves the shell over
  HTTPS from `gh-pages`, the in-repo links were flipped to the new root, and
  the three App Store Connect URL fields — Privacy, Support, Marketing — are
  set to the `hollow-oath.com` addresses in `STORE_LISTING.md` §O5.)* The
  owner registered `hollow-oath.com` (Cloudflare, July 2026) to keep the
  personal `burners70` handle off anything users see (App Store
  Support/Marketing URLs, in-page links). It attaches to GitHub Pages for free
  — no change to how the site deploys. Steps: in Cloudflare DNS add a `CNAME`
  for the apex `@` → `burners70.github.io` (Cloudflare flattens it) and a
  `CNAME` for `www` → `burners70.github.io`, both **DNS only (grey cloud)** so
  GitHub issues its own HTTPS cert. (Cloudflare nags "Proxying is required for
  most security/performance features" — safe to ignore for a static Pages site;
  proxied/orange cloud blocks GitHub's cert issuance and, on the default
  "Flexible" SSL mode, causes an HTTPS redirect loop.) Set the custom domain in
  repo
  **Settings → Pages** (this commits the `CNAME` file automatically); enable
  **Enforce HTTPS**. With an *apex* custom domain the shell serves at the
  **domain root** (`https://hollow-oath.com/support.html`), not under
  `/Hollow-Oath/`. Only after it resolves: flip the Support/Marketing/Privacy
  URLs (O2/O5) and the "play it live" links in `README.md` / `GAME_DESIGN.md`
  to the new root, and set the two App Store URL fields. The GitHub Issues
  link has already been removed from `support.html` (email-only) so the handle
  isn't exposed even for click-through. (A paid custom domain, ~£10/yr, was the
  owner's explicit choice over a free neutral-org rename.)
- [ ] **O9. Turn the marketing shell's CTA into a real App Store link.**
  `about.html` currently ships `<span class="cta">▶ Coming soon to the App
  Store</span>` — a non-clickable placeholder. Once the app is live, swap the
  `<span>` for an `<a href="…">` pointing at the App Store product page (same
  URL as the two App Store URL fields in O8) and keep the `▶` glyph and `.cta`
  class so the styling and the design-system glow treatment carry over
  unchanged. **Launch-day task, easy to forget** — it's the only place on the
  public site that would still read "coming soon" after release. Surfaced by the
  Claude Design handoff review (July 2026); the shell deploys from `gh-pages`,
  so this lands there, not on `main` (see the Bundle O7/O8 notes above).

---

## Bundle P — Act Two, the descent (update 1.1)

**Why:** Re-scoped by an owner design round, July 2026. P was three towable
relics hidden in Act One's Hollows; the review found that placement fatal —
the relics sit behind the veteran gate *and* the deliberately-hard-to-find
lifts, so the headline mechanic of a paid update would have been invisible to
most buyers and unable to carry a price move. **P is now Act Two: a ten-level
authored underground rescue campaign beneath AMS SOLACE**, where the pendulum
debuts and nowhere earlier.

Your missing Scions are in **racks** — sealed banks of eight to twelve, being
read so Glycon can find the fault line that makes a counterfeit persuasive. You
cut a rack's feed (identified by taking its pulse), sling it beneath the hull,
and fly it to a docking bay MERCY lowers down the shaft on a cable, while its
reserve drains and you spend your own vitals to keep it alive. The 41-second
Static turns out to be a heartbeat. Full spec, rationale, rejected options and
release plan: **[ACT_TWO_SPEC.md](ACT_TWO_SPEC.md)**;
[PENDULUM_SPEC.md](PENDULUM_SPEC.md) survives as the tether-physics reference.

**Priority: the 1.1 release, entire. Dependencies: 1.0.1 must ship first and is
a hard commercial dependency, not housekeeping** — Act Two is gated behind
finishing the campaign, and Bundle X exists because new players don't. That is
a constraint on *release order, not build order*: 1.0 is still in App Review and
1.0.1 is not live, so Act Two is built and refined now and held until 1.0.1 has
shipped. **Device tuning is confirmed available** (owner, July 2026 — Mac,
Xcode and TestFlight all in hand), which closes ACT_TWO_SPEC §15 q1 and means
every feel-critical item below is tuned on hardware rather than in a browser.

**Phased (owner round, July 2026).** The bundle is too large for one branch, so
it runs as a sequence of PRs against a long-lived integration branch, everything
behind a feature flag until P·slice signs off — `main` stays releasable for a
1.0.1 hotfix throughout. The order below is a dependency chain, not a preference:
**P·terrain gates P·slice, and P·slice gates everything after it.** P·terrain is
done, so the chain now starts at P·slice.

- [x] **P·terrain. Span terrain, and the chamber authoring format.** *(Owner
  decision, July 2026: spans, not heightmaps.)* **The shipped terrain model
  cannot express an overhang.** Terrain is a heightmap — `heights[]` sampled
  every `STEP` (16px), one value per column — and caves add a single parallel
  `roof[]`, clamped by `roof[i] = Math.min(roof[i], heights[i] - 175)`
  (`genCave`, `js/world.js`). So every cave is a tube with a guaranteed 175px
  gap: no overhangs, no re-entrant geometry, no pinch points. Act Two's chambers
  are specified as **larger than any surface sector, with overhangs and tight
  spaces, authored for a tether** (owner, July 2026), so the representation has
  to change first.
  **Generalise `roof[]` to N floor/ceiling pairs per column** ("columns of
  spans"). It is a strict superset of what ships: collision stays an O(1) column
  lookup, `STEP` survives, the terrain tile cache survives, and
  `groundAt`/`roofAt` keep their shape with a "which span" argument. It
  expresses overhangs, shelves, pillars, tight passages and pinch points.
  **What it cannot express is a true re-entrant hook** (fly under it and back up
  into it) — accepted, rather than paying for polygon terrain, which would
  invalidate every terrain helper, the tile renderer, the landing-slope maths,
  the M1 checksum and the V2 fairness passes. Revisit only if P·slice proves
  spans can't carry the level design.
  Also here, because ten large chambers cannot be hand-typed heightmaps: **a
  compact authoring representation** (a coarse room/span grammar compiled to
  spans at load), built before the content rather than after two levels of it.
  Act One's surface generation must be untouched — the M1 golden checksum is the
  proof.
  **Landed.** `level.spans` — one array of open `{top, bot}` intervals per
  column, ordered top to bottom, solid rock outside them. Primitives sit in
  `js/world.js` beside `groundAt` (grep "columns of spans"):
  `spanAt`/`pickSpan`/`matchSpan`/`solidAt`/`levelH`, and `groundAt`/`roofAt`
  took an **optional second argument** — the `y` that says which span you mean.
  Every shipped call site passes `x` alone and takes the heightmap path
  unchanged, which is how Act One stayed untouched; the M1 checksum is still
  `1090254029`. Three call sites opted in: the ship's ground and ceiling tests
  (`updatePlay`) and the projectile test, which now uses `solidAt` — the same
  predicate on both models, so a shot is stopped by a pillar as well as a floor.
  The authoring grammar is in `js/acttwo-data.js`: a chamber is a list of coarse
  `{op:"room"|"rock", x, y, w, h}` parts applied in order, with optional
  per-boundary roughness, compiled by `compileChamber` (interval union and
  subtract per column) — **rock inside a room is how you author an overhang**.
  Deterministic from the chamber's own `seed`, so it is checksummable exactly as
  the heightmap is (`__doids.spanChecksum`). Drawing is `drawChamberTerrain`
  (`js/acttwo-render.js`), which builds a chamber's rock as the complement of its
  spans through Act One's own per-512px tile cache contract; the provisional
  heightmap stand-in P·design shipped is gone.
  `SLICE_CHAMBER` is the one authored chamber, and it exists to prove the format,
  not as content: **6000×2400** (the widest surface sector is 5500, the finale
  4400), with **96 overhang columns, an 85px pinch** against the 175px every Act
  One cave is guaranteed, and a floor-to-ceiling **pillar**. That is P·slice's
  required geometry, ready for it. Seven tests in `tests/worldgen.spec.js`, one of
  which samples the *rendered canvas* against `solidAt` at twelve points — the
  rock you see is the rock you hit. Suite green at 133. (`flight.spec.js` U2, the Act One field refueller, flaked once on an unrelated timing assertion and passes on re-run.)
  Not done here, deliberately: no racks, well, tow, reserve or tether — `genChamber`
  builds terrain only, and `heights` is absent rather than stubbed so anything
  that secretly wants a heightmap fails loudly. Re-entrant hooks remain
  unexpressible, as accepted above.
  **Owner review, July 2026 — two additions, both landed.** The first pass was
  called *cold and dull, and ten levels of it a chore*, with three specific notes:
  1. **Rock overhead, mechanical underfoot** for roughly the first eight chambers,
     so the plant reads as a facility *installed in a cave* rather than a tiled
     box. Landed as a per-boundary **material** (`MAT_ROCK`/`MAT_MACH`) rather than
     a per-chamber flag, because the useful case is one surface being both — the
     slice chamber's shelf is a milled pad on top and raw stone underneath. Three
     separated values carry it: void (open) < `ROCK_PAL` (the mass) < the zone's
     steel (a paved band behind a milled face). Raw rock strokes violet and keeps
     the Hollows' glow, tying Act Two's stone to Act One's; milled faces stroke the
     zone accent and are the only ones that get panel ticks. Chambers set
     `matTop`/`matBot` defaults, so P·content gets the rule for free.
  2. **Not everything at right angles.** The grammar gained boundary **profiles** —
     `ramp` (sloped floors, so not every landing is level), `arc` (a domed cavern
     or a machined bore) and `teeth` (stalactites, or a cut comb) — plus a
     `radius` corner fillet for "immaculate rounded edges". They compose with the
     roughness, and rock now takes two noise octaves against a milled face's one
     quiet one. The slice chamber demonstrates all four to the right of the proven
     overhang/pinch/pillar, which kept their coordinates.
  3. **Points of interest in the ground.** Mostly already built and never switched
     on: #69's `PLANT_ORNAMENTS` (conduit run, racking frame, junction truss, vent
     grate) had no level setting `plantOrnaments`. The slice chamber now carries
     seven, `snap`ped onto whatever floor they sit above so retuning terrain can't
     leave them hovering. `conduitRun` already runs a light along its length on the
     rack's own heartbeat — the pulsing the owner asked for exists.
  Also fixed in the same pass: `genChamber` hardcoded `isPlant: true`, which dressed
  SOLACE's breached intake (beat 1, §11.1) as one of Glycon's plant rooms. It now
  comes from the chamber, and the chamber-terrain render path keys on `level.spans`
  rather than `isPlant` — every chamber is underground, only 2–5 are the plant.
  **Owner review, round two (July 2026) — three more, all landed.**
  4. **Keep "some rock you see is NOT rock you hit."** Correctly flagged: §8's
     hazards are a false floor (drawn, not there) and painted rock (real, never
     drawn), and nothing in the model could hold either — a deception would have
     had to be bolted on outside the terrain system, and a test was asserting
     drawn-equals-solid *everywhere*, which is the exact opposite invariant. A
     part now declares a `view` (`drawn`/`solid`) and `genChamber` compiles both
     `spans` (collision) and `spansDrawn` (rendering) from one definition. They
     are the same array on an honest chamber; a test asserts the two views differ
     only inside a part that declared a view, and counts undeclared drift as a
     failure. The slice chamber carries one of each. The tell — grit off real rock,
     none off a projection, no lamp shadow on a lie — stays P·systems.
  5. **Brighter, via many light sources.** `drawChamberLights`: additive radial
     pools per fixture plus a flat ambient lift, over the terrain and outside the
     tile cache so nothing needs relighting. Ambient is lifted *alongside* the
     fixtures deliberately — pools over a dark fill read as a cave with lamps in
     it, which is what §9.2 explicitly does not want. Cool cyan fixtures are his,
     warm gold ones the failing original plant, and they double as the points of
     interest a bare floor lacked. Fixtures snap to a real surface; a test asserts
     none is buried in rock or hovering, and that the room measures brighter with
     them than without.
  6. **A chamber is one FLOOR of a subterranean complex** — wide, cleared
     entirely, then descend at the far end. The first layout stepped down through
     three stacked galleries, making every chamber its own mini-descent and
     leaving the act's structure nothing to do. Re-authored as a 9000×2050 working
     hall with bays and mezzanines along it and the way down at the right-hand
     end, which is where the next chamber's entrance and MERCY's well belong
     (§11.1). Its test now asserts width-to-vertical > 3 rather than a hardcoded
     size, and every feature test locates its feature by property (first column
     with two spans, the solid run with hall either side) instead of by
     coordinate — the chamber has been retuned three times and coordinate
     literals turned each retune into a puzzle about which number went stale.
  **Two real bugs came out of that round**, both invisible to Act One:
  `pickSpan` started `best` at null with a strict `<`, so the no-y sentinel left
  every candidate at distance Infinity, failed the comparison and returned null
  for a column that plainly had spans — **`groundAt(x)` with one argument returned
  the bottom of the world on any chamber**, which would have broken every shipped
  one-argument call site the moment P·slice loaded one. And the pixel-agreement
  test parked the ship *at* the probe point with the camera centred there, so it
  had been sampling the ship's own cyan and calling it rock; there is now one
  `__doids.samplePixel` that keeps clear of the ship, the HUD and the containment
  field, used by both pixel tests.
  **Both questions this left open were answered by P·slice** (see that item):
  mid-band is right for a momentum pinch, and the floor *was* too landable — it
  gained a structural column to climb over.
  **And P·slice found the chamber was not flyable at all.** The "floor-to-ceiling
  pillar" above covered every open interval in its own columns, so it sealed the
  only route to the well: a flood fill stopped dead at x 4592 for a laden ship, an
  unladen ship and a bare point alike. Every test here passed anyway, because each
  asserted a *local* property — an overhang exists, a pinch exists, a pillar
  exists — and nothing asked the whole-room question.
  The conflict is provable rather than a tuning slip, which is worth writing down
  because it constrains how every one of P·content's ten chambers can be authored:
  **a fully-solid column and a route past it are mutually exclusive.** A span-less
  column means no air at that x, and a route from one side to the other must pass
  through every intermediate x. So a structural column you fly *around* has to be
  flanked by air — the hall is locally taller than the column, which is also how a
  real plant hall carries one. The chamber now has that, the pillar test locates
  the feature by the property that actually defines it (rock reaching the floor,
  with air over the capital), and the whole-room question is asserted in
  `tests/acttwo.spec.js`.
- [ ] **P·design. Brief Design, and get the rack back first.** Runs in parallel
  with P·terrain — it blocks P·slice, because the slice cannot be *judged* until
  the rack reads correctly, and that is a design problem before it is a code
  one. The hand-out is [DESIGN_BRIEF_ACT_TWO.md](DESIGN_BRIEF_ACT_TWO.md),
  written to be self-contained for someone with no repo access. Two things worth
  knowing before briefing anyone: **the game has no in-game art assets** (all
  visuals are procedural canvas drawing, so the deliverable is specified
  direction plus timing numbers, not sprites), and **there is no public web
  build** since O7, so the brief points at running `index.html` locally, the
  demo video and the marketing stills instead. Only two real image files come out
  of it: the twelfth star on `the_full_codex.png` (a **1.0.1** item, independent of
  everything else — see V1) and, later, the two Act Two achievement badges.
- [x] **P·slice. Vertical slice before content.** One chamber, one rack, the
  trunk cut, the tow, THE WELL, the reserve, the vitals transfusion — end to
  end and tuned on a phone, **before a single additional level is authored.**
  If hurry-versus-care doesn't feel good in one room, no amount of level
  design saves it. Gates everything below.
  **The slice chamber must contain an overhang and a pinch point** — a slice
  tuned against tube geometry proves the tether against terrain the real
  chambers won't have, which is the one failure mode the slice exists to
  prevent. Expose the new state through `__doids.get()` from day one so the
  slice is testable headlessly while it is being felt by hand.
  *P·terrain delivered that geometry:* `SLICE_CHAMBER` (`js/acttwo-data.js`) is
  a 9000×2050 working floor with overhangs, an ordinary tight spot, a momentum
  pinch and a structural column, loadable with `__doids.loadChamber("slice")`.
  **Landed.** The loop runs end to end in `js/acttwo-update.js` (new file, the
  Act Two exception): read which trunk feeds the rack → land at its isolator and
  hold to close it → the rack drops to internal reserve and starts dying →
  cradle it → tow it the length of the floor → give it your own vitals when it
  won't make the trip → dock a swinging load into MERCY's swinging bay. 17 tests
  in `tests/acttwo.spec.js`; suite green at 150.
  - **The tether** is PENDULUM_SPEC §4.1's model with one correction found by
    flying it. The ship's 30% share of the constraint is applied as an impulse
    against the **radial closing speed**, not as `err/dt`: the latter makes the
    coupling stiffness proportional to `1/dt`, so the tug's strength depends on
    the framerate — useless for a value being tuned on hardware — and is
    unbounded on a long frame, which is how the first version threw a rack the
    length of the hall. Position on the load, velocity on the hull.
  - **Three controls, no new buttons.** The cut and the cradle are landed holds
    (the shipped `updateBlackbox` grammar, so CELL DOCTRINE applies). FIRE is the
    release and never a shot while towing (§10a.2). **The transfusion is a held
    SHIELD** — every other input is spoken for while hovering over a dying rack,
    and the shield is the one that is *semantically* free, because the field
    would sever the line anyway. The hand that shields you is the hand that gives.
  - **Slams cost the reserve as well as integrity, and that is the design.**
    `reserve` is the resource under pressure, so the drain and rough flying pull
    on ONE needle — which is what makes hurry-versus-care a single allocation
    problem instead of two unrelated meters. `integrity` is the record of what
    your handling cost, never touched by the drain, so GENTLE HANDS (§10a.4)
    means "never slammed" rather than "arrived quickly". Damage is measured on
    the **normal** component of the payload's velocity, not its speed, or every
    fast pass through the momentum pinch would be billed as a slam.
  - **The two open questions are answered, and the answers were "yes" and "no".**
    *Mid-band is right for a momentum pinch:* the derived 77px sits between the
    105px a hanging load needs and the 48px a load trailing at your own level
    needs, and steady-state thrust puts the load at ~72° off vertical (a 57px
    envelope), so it passes under power with ~20px of margin and cannot be crept
    through. *The floor was too landable:* it now has the structural column to
    climb over, and the pinch is on the only route to the well — deliberately, so
    the question cannot be dodged.
  - **Three bugs, all invisible before there was a tether.** `seatPayload`
    forced a *slack* sling taut, which drove the load into the deck on the frame
    you cradled it. The 41s beat was inferred from `staticClock` getting smaller,
    which is wrong exactly when the wrap lands early in a period — there is now
    an explicit `staticBeat` flag. And a released load hung in mid-air, because
    only the *towed* rack was simulated; §4.2's drop damage was unreachable.
  - **Death in a chamber was off-world.** `spawnShip` places the ship relative to
    `level.mx/my`, which a chamber leaves at `-9999`. A life lost dropped the hull
    clean out of the world — the most common thing a player does while a slice is
    being hand-tuned. `respawnInChamber` re-enters at the chamber's own entrance
    with the rack network untouched: a life costs you the flight back, not the room.
  - **Still to tune on hardware**, and the dials are named in one block at the top
    of `js/acttwo-data.js`: `SLING_VISIBLE` (which derives `SLING_L`, and with it
    the momentum band and both authored gaps — a one-number change, never a
    re-author), `RACK_DRAIN`/`RACK_BEAT_BITE`, `GIVE_RATE`/`GIVE_PER_LINE`, and
    `WELL_DOCK_R`/`WELL_DOCK_V`. No test asserts a tuning number, on purpose.
  - **The rig for that pass is ready.** `tests/qa-harness.html` has an Act Two
    section (see [QA_HARNESS.md](QA_HARNESS.md)): load a chamber, warp to the rack
    or the well, close the real feed or a decoy, cradle/release, force a reserve or
    a vitals level, read the live dials, and run the clearable-laden route check on
    the device. **Act Two has no route from the title screen** — that arrives with
    P·persist/P·content, so the harness is the only way in and every Act Two button
    is feature-detected against the build. Its chrome floats over the game and
    hides to a tab, because the old layout shrank the iframe and with it the game.
- [x] **P·feedback. The first on-device round on the slice.** *(Owner, July
  2026 — played on a phone through `tests/qa-harness.html`, which is the only
  route in.)* Twenty notes. Most collapsed into a handful of causes, which is
  the value of the round and the reason they are recorded rather than just fixed.
  - **Act One's sector logic was running in the chamber.** A chamber holds no
    Scions, so the manifest is trivially closed on frame one: `checkSectorClear`
    concluded the sector was clear and flashed `MANIFEST CLOSED — FLY INTO HER
    VENTRAL HANGAR` at a mothership nine thousand pixels above the rock, for the
    whole descent. The HUD read `SCIONS ABOARD 0 · SECTOR 0/0` throughout. One
    `level.isChamber` guard, and a bank tally in place of the sector one.
  - **The hull had no lateral collision at all.** Act One's terrain is a
    heightmap — one floor, one ceiling per column — so `updatePlay` only ever
    tested vertically, and `solidAt` was used for nothing but bullets. Spans
    express pillars, column flanks and §8's painted rock, and the dart flew
    through all three. `shipSolidCollide` adds the test, chamber-only.
  - **And a chamber impact now hurts rather than kills.** Act One's cave-roof
    rule is untouched, but it cannot survive overhangs, a pinch you are asked to
    carry speed through, and a load on a rope. Capped just under a hard landing,
    so no single impact is fatal from full health — an uncapped ramp billed 137
    vitals against a pool of 100, which is the instakill the owner objected to.
  - **The "laser turret" does not exist.** What the owner saw was the
    `junctionTruss` ornament — two rails and an A-frame, a trestle in
    silhouette, hence "the blue thing that looks like a picnic table" — and what
    killed them was the painted rock 200px to its right. An invisible wall that
    kills on contact has no other available explanation, which is worth
    recording: **an untelegraphed hazard gets blamed on the nearest visible
    object.** The truss is redrawn as a junction cabinet. §8's actual tell is
    still P·systems, and it is now load-bearing rather than polish.
  - **Contact damping was dead code.** Both payload integrators recompute
    velocity from displacement — which is what makes the rope swing — and that
    overwrote every friction value `towCollide` set. A dropped rack slid on
    `SLING_DAMP` alone. Applied after the Verlet step now, with the rest deadband
    gated on a contact frame so it cannot eat gravity's per-frame increment.
  - **The somersault was pure pendulum, and the fix is that a rack is BOLTED
    IN.** You cradle from beside the box, so the rope starts near horizontal, and
    a point mass released from horizontal swings down, under you and up the far
    side. A moored rack is not simulated at all; the rope pulls the *hull*
    instead, and sustained thrust parts the mounts (free, per the owner —
    what it costs is a moment of thrust against something that will not move).
    Timing that pull is the one non-obvious bit: stretch cannot measure it, since
    the constraint removes the stretch every frame, and stretch-plus-thrust
    cannot either, since the hull sits in equilibrium and `d` lands either side
    of the rope's length alternately. Measured as "at full extension, within a
    hair, with thrust held".
  - **You land ON the rack to rig the sling.** There was no input at all —
    `updateCradle` accumulated on proximity while landed, so the sling rigged
    itself, hence "how am I meant to connect to rack at the moment?". The cage
    lid is a landable pad, and there is a prompt.
  - **Feed lines run under the deck, and every one ends in a box.** A trunk was
    one straight segment across open air (870px of diagonal here), and a decoy
    ran to `c.x + 240, c.y - 300` — a line to literally nowhere. Trunks are
    polylines now, buried between risers, drawn dimmer where you see them
    through rock. Decoys terminate in boxes of the same size, mounting and beat
    as a real bank: if any of that differed, a decoy would be identifiable by
    looking and §7.1's deduction would be decoration. Landing beside one costs
    **vitals** (owner's call — you are the blood supply, so it comes out of the
    pool a real bank will need), once, floored above zero.
  - **Fuel, and where a run starts.** Thrust burns 5.2/s against a 100 tank, and
    this floor is 9000px flown unladen then hauled back: not achievable in one
    run. Cans are placed along the route, tighter on the laden leg; the resupply
    drone stays the net for a dry hull but launches from **the well**, having
    previously flown in from `mercyPos()` — which a chamber leaves at -9999. The
    chamber is entered at the well too, which is structure rather than a spawn
    point: you arrive where MERCY can reach, fly out unladen, haul back.
  - **That moved the traversability invariant**, and the reason is worth keeping:
    `chamberRoute` seeds its fill at the ship, so with the entrance on the well's
    side of the momentum pinch, "a hanging load cannot reach the well" became
    trivially false. Connectivity is undirected, so it is restated against the
    rack — the same claim from the other end, and the one that survives moving
    the entrance again. `minX` is reported beside `maxX` for the same reason.
  - **A slam now has a reaction:** a muffled cry (noise through a low bandpass —
    a voice with none of its detail, heard through a hull), the shudder `slamT`
    was already tracking with nothing drawing it, and a haptic. **No text, no
    emoji** — owner's call, and the right one: this game reads lives off rhythm.
  - Smaller: the winch no longer draws a second rack over the slung one at the
    well; isolators sit on the deck instead of hovering 28px clear; light
    fittings are lamp housings rather than bare bars (the warm floor ones read as
    Act One landing pads); conduit-run ornaments follow the floor instead of
    hanging in air where the deck drops away; and the flatline banner says what
    happens rather than quoting the design doc at the player.
  - **The plant EMPLACEMENT, built to the owner's brief** (second pass of this
    round): "a slightly bigger, more blocky version of the gun emplacements in
    act one… tougher than those guns, but not an instakill." Same parts, same
    colour, squared housing on a plinth with armour ribs instead of a dome —
    visibly the heavier cousin, which is what tells a player it will take more
    than one round *before* they spend the first finding out. Tougher is HP
    (`EMPLACE_HP`), not a bigger gun, and it is slower and shorter-reaching than
    Act One's: tough must not also mean relentless, since the objection was to
    dying with no way to read it coming. `hp` defaults to 1 everywhere, so Act
    One's turrets still die to one round and none of its balance moves — a parry
    goes through the same HP model, so it stays a great answer without being a
    bypass of the armour. **Placement is deferred** to level design (owner); the
    single authored emplacement in `SLICE_CHAMBER` is provisional, sited only so
    the thing can be flown against on a phone, and nothing else references it.
  - **§8.1's tell, first pass — the deceptions STAY.** Owner: "we do want some
    kind of invisible walls, etc (but maybe not quite so completely impossible to
    spot!)". Nothing was removed: the false floor and the painted rock are still
    authored, still lie, and the worldgen test still requires the two views to
    differ only inside a part that declared a `view`. What is new is **settling
    dust**, and it is one mechanism serving both hazards, which is why it beats a
    marker per hazard: motes fall and come to rest on the first thing that is
    actually solid, tested with `solidAt` — the same predicate collision uses, so
    the dust cannot know anything the physics doesn't. Over a false floor they
    fall straight through the surface you can see; against painted rock they
    settle in mid-air on nothing. Honest in both directions, too: an ordinary
    floor collects dust identically, so the *presence* of motes is never the
    tell — where they stop is. The remaining channels (no grit off a projection,
    no lamp shadow on a lie) stay P·systems; this is the readability floor, set
    at "a careful player can spot a lie before it costs them".
  - **Owner decisions taken at the end of this round (July 2026), all four of
    which unblock work that was waiting on them:**
    1. **A slung rack is INVULNERABLE to enemy fire.** All of it lands on the
       pilot. The consequence is recorded here because it decides how
       emplacements can be sited: while towing you can neither shoot (FIRE
       releases) nor shield (the field would sever the sling), so a gun on the
       laden route is damage you have **no answer to** except to have dealt with
       it beforehand. That is coherent — it routes §10a.2's oath question through
       *your* vitals rather than the bank's, and vitals are also what a
       transfusion spends, so it deepens the single allocation problem instead of
       adding a second one. It does mean an emplacement on the laden leg with no
       cover is unavoidable damage, and placement must be authored knowing it.
    2. **Floor variety is "both, flying first."** Re-author the shape — varied
       clearances, ledges, steps, shelves at different heights, so the ground
       changes the route and the swing — prove it with the flood fill, then dress
       it with materials and ornament. Two passes, in that order.
    3. **A chamber retry resets integrity**, so GENTLE HANDS is **per-attempt** —
       a goal worth chasing rather than a run abandoned after one bad clip, and it
       matches "a life costs you the flight back, not the room". A rack's
       **position** resets with the room too. Both of P·persist's open questions
       are closed by this; see that item.
    4. **Act Two gets a full score ladder**, like Act One's and feeding the same
       hiscore. See P·systems for the one thing it still has to settle.
  - **Still open from this round:** **floor variety**, now briefed by decision 2
    above. A re-author of `SLICE_CHAMBER` under the constraint that
    `__doids.chamberRoute()` must stay passable laden. Eleven tests added; suite
    green at 167.
- [ ] **P·persist. Persistence and save schema.** Promoted out of
  ACT_TWO_SPEC §15 q5 into real scope, and designed *during* P·slice rather
  than after it. Act Two is a second campaign, not a run mode: per-chamber
  checkpointing (spec §11.1) on top of Act One's A1 resume snapshot means a
  schema bump plus a migration that **must not wipe an existing player's save**
  — `doids_run` is a shipped format and the `doids_` prefix stays. Needs the
  E4 iCloud mirror considered in the same pass (`cloud.set`/`cloud.get`), a
  forward-compatible version field, and a test that an Act One 1.0.1 save still
  loads.
  **What P·slice settled, which is what §11.2 said to design it during.** All
  per-chamber state lives on three arrays hanging off `level` — `level.racks`,
  `level.conduits`, `level.wellDock` — deliberately, with nothing hiding in module
  scope: a chamber checkpoint is a shallow copy of those plus the ship pose. The
  only module-scope state is `a2Saved`/`a2Lost` (§7.3's separate loss tracking)
  and the transfusion line, and both are per-attempt rather than persistent.
  A rack's full state is `{ reserve, integrity, cut, towed, delivered, lost, gives,
  everTowed, x, y, moored, mount }`; a conduit's is `{ cut }`; the well's is
  `{ taken }`; and P·feedback added `level.fuelCans` (`{ taken }`), `level.decoys`
  (`{ penalised }`) and `level.turrets` (`{ alive, hp }`) on the same pattern —
  every piece of per-chamber state still hangs off `level`, which is exactly what
  a shallow-copy checkpoint needs.
  **New requirement from the ladder decision (owner, July 2026):** the save must
  carry **run provenance** — was this run begun at the start of Act One? The
  global hiscore counts a run across both acts only if it was, so a chamber
  entered directly must not feed `doids_hi`. One boolean, set at Act One sector 0
  and cleared by any direct entry, and it has to survive the resume snapshot like
  everything else. Act Two also gets its **own** hiscore key alongside it.
  **Both open questions are now answered (owner, July 2026):** a retry **resets
  integrity**, so GENTLE HANDS is per-attempt, and a rack's **position resets with
  the room** rather than being checkpointed. So a chamber checkpoint is the room's
  *progress* — which feeds are cut, which banks are delivered or lost, which cans
  are gone — and never a rack's pose or its accumulated harm. A simpler snapshot
  than this item was originally scoped for.
  The death path is already the right shape to build on: `respawnInChamber`
  (`js/acttwo-update.js`) is called from the `"dead"` case in `update()` beside
  Act One's `if (level.isCave) exitCave()`, which is where chamber checkpointing
  belongs too.
- [ ] **P·systems. The rest of the mechanics**, in the spec's order and only
  after the slice signs off: pulse-reading with the honest-versus-metronomic
  layer, the deception hazards on the **revised** tell (see below), deep
  readers, the well deepening per chamber, the ward's four readability channels
  under `PAL()`/`reducedFlash`, anomaly geology reusing Bundle Z's gravity
  scale, handling machinery and unfinished husks, and Act Two's own score and
  rank ladder. **Specified by the owner, July 2026** — read this before writing
  any of it, because several code comments still assert the opposite and were
  wrong (see "corrections" below).

  **THE LADDER, as decided.**
  1. **Failures cost points.** Act Two is scored like Act One: awards for what
     you achieve, penalties for what you lose. The earlier "Act Two never bills
     the player" line was **an assistant's assumption, not an owner decision**,
     and it does not stand.
  2. **Integrity does NOT scale the delivery award — but every impact on the rack
     costs points, per impact.** Worth being precise, because these sound alike
     and are not: delivering a bank at 60% is worth the same as delivering it at
     100%, so the ladder never prices how much a bank *has* suffered; what it
     charges for is the *event* of hitting them, each time it happens. The
     natural hook is `towContact` (js/acttwo-update.js), which already fires
     exactly once per qualifying impact and already knows the damage — so the
     penalty rides the same threshold as the reserve/integrity cost and inherits
     FIELD MEDIC's wider free band for free.
  3. **The global hiscore tracks both acts — but only for a run begun at the
     start of Act One.** A continuous campaign scores into `doids_hi`; a chamber
     entered directly does not. This needs run provenance that Act Two does not
     currently have (see P·persist below) — a flag set when a run starts at Act
     One sector 0 and cleared by any direct entry.
  4. **Act Two gets its own hiscore and leaderboard.** A third Game Center board
     alongside `hollowoath.score.alltime` and `hollowoath.score.daily`; the owner
     will create it in App Store Connect when build 1.0.1 is pushed. Write the
     submission so a missing board is a silent no-op — the code will ship before
     the board exists.

  5. **A chamber cleared without firing pays the same award as a sector cleared
     without firing.** Act One gives +2000 and the G3 no-harm achievement for
     `level.firedShots === 0`; Act Two mirrors it. This is what stops the
     emplacement paying you to shoot (see the contradiction below) and it is what
     gives §10a.2's oath question a price rather than a sentiment.
  6. **THE PRINCIPLE, which settles the double-billing question and should
     govern every future call on this ladder** (owner, July 2026): *"your score
     is the only permanent record of your success. The others just make your
     game harder."* Vitals, reserve, fuel and time are **in-run difficulty** —
     they shape the attempt you are having and then they are gone. Score is what
     survives it. So a failure that already costs vitals costs points **as well**,
     and that is not charging twice: the two currencies are doing different jobs.
     Misreading a room — cutting a dead line, landing beside a decoy box — is
     therefore scored, and the question this item previously left open is closed.

  **THE TABLE, DECIDED** (owner sign-off, July 2026 — these are the numbers, not
  a proposal). Anchored on Act One's own values rather than invented: sector clear
  +1000, cleared without firing +2000, a lost Scion −250 (−500 if famous), a Scion
  killed by your own hand −1000, turret +250, drone +150.

  | Event | Proposed | Anchored on |
  |---|---|---|
  | Bank delivered to THE WELL | **+1000** | Act One's sector clear |
  | Chamber cleared without firing | **+2000** | Act One's no-harm bonus, rule 5 |
  | GENTLE HANDS — chamber, no slam | **+750** | flat, never integrity-scaled (rule 2) |
  | Each impact on a rack | **−25** | per impact, on `towContact` (rule 2) |
  | Bank lost (flatline) | **−1000** *(owner)* | four Scions' worth — 8–12 people is not one object |
  | Bank lost to your own round (§7.1) | **−1000** | Act One's "killed by your own hand" |
  | Dead line cut | **−100** | a misread, scored per rule 6 |
  | Landing beside a decoy box | **−100** | the same misread, same weight |
  | Emplacement destroyed | **+120** *(owner: yes, but smaller)* | still a test of skill, but bounded by rule 7 |

  7. **THE PACIFIST INVARIANT** (owner, July 2026): *"the combined value of
     shooting guns should never outweigh the pacifist score."* Killing everything
     in a chamber must always total **less** than the no-fire award, or the ladder
     pays better for the thing the oath exists to discourage. Note this is a
     property of a *room*, not of a price: it has to hold for the most heavily
     armed chamber P·content ever authors, so the safe way to build it is to
     **derive the no-fire award from what you passed up** rather than hardcode
     2000 — e.g. `noFire = 2000 + kills_forgone × 1.25`. That is the same
     discipline `momentumGapPx` already uses, and for the same reason: a hardcoded
     number silently stops being true the next time content changes around it.
     At +120 per emplacement a chamber would need seventeen of them to threaten a
     flat 2000, but derived, it can never happen at all.
  8. **ZERO IS THE FLOOR** (owner, July 2026): *"keep zero as the base. You can't
     go lower than zero."* Act Two clamps exactly as Act One already does
     (`score = Math.max(0, score - penalty)`), so the ladder never goes negative.
     **The consequence is accepted, and is recorded here so nobody "fixes" it
     later:** a player already sitting at zero can misread every room in the game
     for free, and a penalty taken early in a run bites less than the same penalty
     taken late. That is the deliberate trade for a score that can always be read
     as an achievement rather than a debt.

  **Implementation note for whoever builds this:** the floor makes penalties
  invisible at zero, so every test of a penalty must seed a score first and assert
  the *difference*. Asserting against 0 proves nothing — see the decoy tripwire in
  `tests/acttwo.spec.js`.

  **Corrections this decision forces.** These are live in code and in the docs,
  and every one of them was an assistant's inference presented as design:
  - `closeTrunk` (js/acttwo-update.js) says a decoy cut is "never score, because
    …billing the player for reading a room wrong is not the pressure this act
    runs on." Not an owner decision. Pending the call above.
  - The `DECOY_VITALS` note (js/acttwo-data.js) says the same thing.
  - `acttwo.spec.js` asserts `score` stays 0 after a decoy cut, which *holds* the
    overturned decision. It passes today only because no ladder exists yet.
  - COPY_DECK.md states "Act Two never bills the player for keeping people
    alive". Narrowed: that is true of the **transfusion** and nothing else.

  **And one contradiction the emplacement introduced (assistant error, July
  2026).** "Act Two touches score nowhere" stopped being true the moment
  P·feedback gave chambers turrets: Act One's shot loop awards **+250 for a
  turret kill**, and it runs in a chamber unchanged. So Act Two already scores
  today, and it scores for **shooting** — which is precisely what §10a.2's oath
  question is meant to make expensive. Act One balances this with a **+2000
  no-harm bonus** for clearing a sector without firing (`level.firedShots === 0`,
  G3); Act Two had no such counterweight, so the incentive pointed against the
  act's own theme. **Resolved by rule 5** — a chamber cleared without firing pays
  the same +2000 — which leaves only whether a kill should still pay its +250 on
  top (see the table). Also: `loadChamber` never resets `score`, so a chamber
  inherits whatever an Act One run had, which rule 3's provenance flag has to
  handle anyway.
  **§8.1's tell has had its first pass** in P·feedback — settling dust, which
  reads both hazards off `solidAt` — so what remains here are the grit and
  lamp-shadow channels layered on that, not the tell from scratch.
  **§8's PAINTED ROCK IS NOW GATED ON THIS ITEM.** Owner, August 2026: "we need
  to give some sort of clue to the invisible walls so they aren't unfair… we
  wouldn't want any on this first level anyway." Chamber one's was removed, so
  the deception layer is currently one-sided — a false floor and no invisible
  wall. The tell is what unblocks putting them back, which makes this item
  content-gating rather than polish.
  **The false floor's silhouette bug is fixed** (it was the same
  `matchSpan` fault as the missing wall outlines — see P·floor's second round):
  the end faces of a drawn-only ledge used to render as full-height vertical
  walls up to the ceiling.
  That is a louder tell than the dust and it is the wrong kind — it gives the
  hazard away by drawing something that is not there, rather than by the world
  failing to respond to you. Worth settling what a projected ledge's edge should
  look like before layering grit and shadow on top of it.
  **§8's tell has changed and the spec is now authoritative:** "a projected
  ledge is perfectly flat and perfectly level" was **false against the code** —
  `flatten()` sets every sample in a span to exactly one height, so every
  landing pad, lift pad and V2 scan shelf in the shipped game is mathematically
  level, and level floors are legitimately everywhere inside a plant. The tell
  is now **"the world doesn't respond to you"**: thruster wash raises grit off
  real rock and nothing off a projection, and your lamp throws no shadow on a
  lie. See ACT_TWO_SPEC §8.
- [ ] **P·scions. Ten new famous minds, one per Act Two system.** The full list
  and benefits are in ACT_TWO_SPEC §9.1 — Laennec, Snow, Harvey, Paré,
  Röntgen, Landsteiner, Morton, Forssmann, Apgar and Saunders. Each is tied to
  a mechanic so no upgrade is flavour-only, and none duplicates a shipped
  benefit (Curie's RADIOSENSE is a compass, Röntgen is imaging; Nightingale's
  LAMP is reach, Apgar is readout). **RADIOGRAPH must stay limited to one sweep
  per chamber or it disables the deception layer entirely.** Note the
  interaction with V1: Mary Seacole is a *1.0.1* addition and the twelfth entry,
  so Act Two's ten start from 13 — check the codex pagination
  (`MINDS_PER_PAGE`, `js/render.js`) still lays out cleanly at 22.
- [x] **P·floor. Floor variety, and the pattern it sets for the other nine.**
  *(Owner, July 2026, from the on-device round: "the floor can't all be flat.
  Need lots more variety for interest" — and, on scoping it: "I think we should
  get this one right so we can cascade those changes across the rest of the
  levels." The owner asked to discuss it separately from the feedback fixes; that
  conversation happened in August 2026 and is recorded below.)*
  **The brief, as decided:** *both, flying first.* Re-author `SLICE_CHAMBER`'s
  shape — varied clearances, ledges, steps, shelves at different heights, so the
  ground changes the route and the swing — prove it, then dress it with materials
  and ornament. Two passes, in that order.
  **The hard constraint:** `__doids.chamberRoute()` must stay passable laden.
  That is the assertion that caught P·terrain's chamber being unflyable, and the
  provable rule it produced still governs — a fully-solid column and a route past
  it are mutually exclusive, since a route must cross every intermediate x, so
  every structural column needs air over its capital.
  **Why it precedes P·content:** whatever this chamber does becomes the pattern
  for the other nine, so authoring content first would mean re-authoring it
  afterwards. Sequenced deliberately.

  **THE CONVERSATION (owner, August 2026) — three decisions, and the first is
  the one that shapes the other nine chambers.**
  1. **What cascades is the MEANS, not the shape.** Asked whether "get this one
     right so we can cascade it" meant a worked example the other chambers copy
     or a kit they compose from, the answer was the kit. So P·floor's real
     deliverable is a **named feature vocabulary** in `js/acttwo-data.js`, and
     the chamber is its first customer rather than its purpose.
  2. **Both surfaces roam.** Not "the deck gets bumpy under a fixed roof" — the
     floor and the ceiling are independent profiles and the clear band between
     them varies along the floor.
  3. **The laden haul asks for altitude AND rhythm**, both, not either. Deliberate
     lifts and drops of a swinging load *and* an alternation of wide stretches you
     can build speed in with tight ones where the load has to be settled first.

  **Landed.** The vocabulary sits between `compileChamber`'s two primitives and
  an authored chamber: `partList`, `hall`/`hallAt`, `gallery`, `bore`, `shaft`,
  `shelf`, `bench`, `column`, `pinch`, `stalactites`, `falseFloor`,
  `paintedRock`. It adds no terrain capability — every helper emits the same
  `room`/`rock` parts by hand-authoring — and what it buys is that a feature is
  declared by name with its materials and its safety margins already right.
  Three rules are enforced **by construction**, each one a bug this project has
  already paid for:
  - `column()` cannot author a sealed column. It opens the bay's ceiling above
    the capital first, and the headroom is **derived from the tow envelope**, so
    neither an unlucky capital nor a change to `SLING_VISIBLE` can close it.
  - `pinch()` emits the pinning pair *and* the mass overhead in one call, at a
    named tier (`"rest"`/`"momentum"`) rather than a number, with zero roughness
    on every boundary.
  - `hall()` interpolates between **stations** rather than stepping between
    them, which is what keeps a climbing floor from breaking a route: the flood
    fill joins two columns only where their spans overlap by the clearance being
    tested, so a passage that is both narrow and rising can read as a wall to
    `chamberRoute` while looking perfectly flyable. Stations spread a 300px
    climb over 400px of floor — 12px a column, which nothing notices.

  The chamber is re-authored from it: a 22-station profile whose deck moves 540px
  (a 280px sump, a 540px climb out of it) and whose clear band runs 260–870px
  against a constant 620px before. Reading west to east — the laden direction —
  it is muster, stoop, sump, neck, gallery, structural bay, climb, creep, pinch,
  domed bay, well head. Every fixture in the chamber — rack, isolators, decoys,
  cans, ornaments, emplacement, lights — is now placed **by x**, taking its y
  from `hallAt`, so moving a station moves the furniture with it.
  Pass two, the dressing, is in the same station list: a station may carry
  `mt`/`mb`, which changes that boundary's material from there eastward. Paving
  ends where the sump begins and where the climb starts, and the seam is visible
  — a milled face takes one quiet octave of noise and raw rock two coarse ones,
  so the deck steps by a few px where the floor stops being finished.

  **Four tests, and they assert the decisions rather than the shape** (the
  chamber has now been re-authored five times and every coordinate literal turned
  a retune into a puzzle about which number went stale): the deck and the roof
  each move and the band varies by more than 2×, with at least two tight and two
  wide stretches; **every gap tighter than a hanging load is one somebody
  declared**; every fixture is in open air and resting on a surface; and
  `column()` cannot seal a room, exercised on four ad-hoc chambers including two
  an author would be wrong to write. Suite 169 → 173.

  **The accidental-pinch guard earned its keep on the first compile.** The
  re-author produced four gaps nobody authored, none of them visible in the
  data: a shelf whose underside starved as the deck rose under it, a plinth
  standing beneath a mezzanine, and a rock hung from a roof that a later room
  lifted above its root — that last left a 40px slot. An accidental pinch is
  worse than a wrong number because it silently re-prices the tow, and an
  unladen-only one is a trolley problem with extra steps (§11.3). The chamber now
  has exactly **one** run of sub-envelope air in 9000px: the declared momentum
  pinch.

  **And flying it found a design error a test could not have.** The first pass
  put the rack-bay mezzanine 80px east of the bank, at exactly the height a
  hanging load rides at, so you clipped the deck of it in the first metre of
  every haul — the sling test failed by draining the rack against it. The
  overhang moved **west** of the bank: you meet it unladen, on the way in, and
  the bay itself is left clear so a fresh load has a thousand pixels to settle
  before the floor asks anything.

  **One real bug fixed on the way, in shipped code.** `snapToSurface` and
  `trunkPath` placed things against the **nearest sampled column** while
  `groundAt`/`solidAt` read the **interpolated** surface between two columns.
  On the hall's ±20px deck that is a couple of px and invisible; on the well
  shaft's steep roughness it put a conduit run 2.5px *under* the floor. `spanAt`
  (js/world.js) now takes an optional `spans` array so code that is still
  building a level can ask the same question collision asks — one code path,
  same predicate, which is the discipline §8.1's dust already follows.

  **One observation handed to P·systems, not fixed here.** The end faces of a
  drawn-only ledge render as full-height vertical walls rising to the ceiling,
  which is a far louder tell than the settling dust and arguably gives §8's
  false floor away for the wrong reason. It is **not** a P·floor regression —
  the same artefact is on `main` at the old chamber's false floor — and the
  deception tells are P·systems' item, so guessing at the intended look here
  would be the same overreach this bundle keeps recording.
  **THE SECOND ON-DEVICE ROUND (owner, August 2026), and it found more than the
  first.** Played on a phone through the QA harness, on the re-authored floor.
  Thirteen notes; the two that mattered most were both cases of the chamber
  being *provably* fine and *actually* unflyable.
  - **"I couldn't get any further west. Everything seemed solid."** It was
    solid, at the altitude they were flying. The gallery mezzanine ended at
    exactly the x where the neck's roof was descending to meet it, so the upper
    corridor tapered into a wedge and closed; the way on was a blind 400px dive
    underneath. Every guard passed, because the corridor overlapped the space
    beyond it by 113px — comfortably more than the 105.2 a hanging load needs.
    **Traversable and findable are different properties and only one had a
    test.** The neck is re-cut as a floor hump instead of a roof plunge (same
    360px band, same tempo beat, roof now continuous), and there is a new guard:
    outside a declared pinch, no transition between adjacent columns may be
    tighter than 1.4× the at-rest tow envelope. Derived, so it moves with the
    sling; above the 113 that failed, below the 172 of the tightest legitimate
    feature in the chamber.
  - **"There's a dodgy thing going on with the outline. Missing for part of the
    wall."** Correct, and it is a shipped bug rather than an authoring slip:
    `matchSpan` never returns null for a non-empty column (it falls back to
    nearest-midpoint, which is what stitches a sloping floor), so where a column
    holds two spans and its neighbour holds one, BOTH answer with that one. The
    rock between them is then drawn — and collided — as if it tapered into
    nothing. `matchSpanMutual` requires the match to be mutual, so the losing
    span terminates in a face. Used by `spanAt` and the tile builder from the
    same call, deliberately: the rock you see and the rock you hit have to end
    in the same place. It also fixes the full-height verticals at a drawn-only
    ledge, which were the same bug from the other side.
  - **Impacts kill the hull again** (`hullImpact`), reversing July's cap. Not a
    change of mind: the July objection was to dying with no way to read it
    coming, and this arrives paired with the two calls that remove the
    unreadable half. **The rack is explicitly not covered** — `towContact` is
    untouched, so clipping a wall kills you and not the people in the box. One
    thing had to be pulled out of the blast radius: setting down on a rack's lid
    was routed through `hullImpact`, which made the most-repeated act in the
    loop lethal. It uses Act One's own hard-landing rule now (35 vitals, 12 with
    GENTLE HANDS, fatal only at zero).
  - **§8's painted rock is out of chamber one** — "we wouldn't want any on this
    first level anyway", pending a tell. There was a 440px undrawn wall on the
    only route west. The helper stays in the vocabulary and the capability keeps
    its test against a purpose-built chamber, so re-adding one is a decision
    rather than a slip. See P·systems for the tell, which is now gating content.
  - **The well is a well.** Its cable was a 1.5px hairline exactly 220px long
    starting in mid-air, and the shaft was a pocket with the hall's rock roof
    over it — so the bay hung from a scratch under a lid MERCY could not
    possibly have lowered it through. The shaft opens to the top of the world
    and the cable is drawn thick, running up out of frame. *Consequence flagged
    rather than hidden: the top of the shaft is still a ceiling, and ceilings
    kill again, so flying all the way up it kills you.*
  - **Fixtures sink instead of floating.** "Items on the landscape need to be
    integrated better, so they either sit on or are sunken into the ground, not
    partially floating." `snapToSurface` was a point sample — fine on a flat
    deck, wrong the moment P·floor gave it a slope. It samples the whole
    footprint now and takes the deepest floor, so an object rests at its lowest
    point and buries into everything higher. Ceilings deliberately do NOT mirror
    it (a buried lamp is no lamp), and a rigid roof fitting must not straddle a
    roof step *or a corner fillet* — a `bore`'s 110px radius bows the roof down
    invisibly, which cost three placements before it was written down.
  - **Lamps are bigger and there are far more of them**, and more furniture:
    three new ornament kinds (`pipeBank`, `crateStack`, `gantry` — the first
    ceiling furniture the set has had) taking the chamber from 13 pieces to 27,
    and from 17 fixtures to 32. Free, because both draw loops are culled to the
    view now; they were per-chamber before, so a denser chamber cost frames
    everywhere in it.
  - **An entry banner**, because arriving in a 9000px room said nothing about
    which way to go. Navigation only — the floor's name, the bank count and the
    direction, all derived — and deliberately silent on *which* bank is real.
  - **Parked at the owner's steer:** the real-versus-decoy readability question
    ("don't overreact to the real/false rack tells — let that sit until I've
    played a bit more"). Recorded because it is real — the decoy's riser is the
    most legible feed line in the chamber and the true one is buried — but not
    acted on.
  Suite 169 → 175.

- [ ] **P·content. The ten chambers**, authored against proven systems, never
  before them. Structure per spec §11.1 (entry → plant 2–5 → deep line 6–8 →
  the mask 9 → her 10), one new element per level per GAME_DESIGN §3. The
  no-trolley-problem pillar is a generation invariant here exactly as V2's scan
  fairness is on the surface: **every chamber must be clearable with everyone
  alive**, and that wants an assertion, not a playtest opinion.
  **The assertion exists now, and it earned its keep immediately.**
  `__doids.chamberRoute(need)` (`js/render.js`) floods the open spans, connecting
  two columns only where their intervals overlap by at least `need` — so the same
  code answers "can a bare ship get through", "can a ship get through with the
  load trailing at its own level" and "…with it hanging" just by passing
  `2·SHIP_R`, `towEnvelope(90).vertical` or `towEnvelope(0).vertical`. Every one of
  the ten chambers gets the same three-tier check, and the laden one is the one
  that matters: a chamber clearable unladen but not with a rack is a trolley
  problem with extra steps. It caught the slice chamber being unflyable on the
  first run (see P·terrain), which is exactly the class of bug a playtest opinion
  finds late and expensively.
  Note what it does *not* yet check, and should before ten chambers exist: that
  every unladen-only gap has a parallel laden route (§11.3), which is a
  per-gap question rather than a whole-room one.
- [ ] **P·guard. Regression gate.** The full smoke suite green, the M1 golden
  heightmap checksum unchanged (P·terrain must not perturb surface generation),
  a new `tests/acttwo.spec.js` for the tether, reserve, transfusion floor and
  chamber checkpointing, and the save-migration test from P·persist. Act One's
  `runLost`, ranks and achievements must keep their exact meaning — Act Two's
  losses are tracked separately (spec §7.3).
- [ ] **P·ship. Release 1.1** — What's-New copy per the E7 trademark
  tiers (generic in-store, named homage on the site), review-refresh
  prompt consideration, and the **£2.99 → £4.99 price move** (owner decision,
  July 2026: launch low, move on Act Two). The act's name comes out of the
  work, so the What's-New line is written last. New Game Center achievements
  (EVERY HOLLOW HEARD, GENTLE HANDS) land here, not in the cancelled 1.2 —
  GAMECENTER_ACHIEVEMENTS.md updated in the same PR.
  *(The in-app rating prompt that used to sit in this bundle as **P·review** has
  shipped already — it moved to Bundle X as X6 once 1.0.1 became the first
  post-launch build, and is live in `js/platform.js` + `app/plugins/rating`.)*

---

## Bundle Q — The deep Hollows (mostly absorbed; ROTATION CHART → 1.0.1)

> **Re-scoped by the July 2026 Act Two design round
> ([ACT_TWO_SPEC.md](ACT_TWO_SPEC.md) §13).** A ten-level underground network
> supersedes Q's three extra Hollows — two separate cave systems with different
> rules would confuse rather than enrich — so **the caves are absorbed into Act
> Two and 1.2 is cancelled.** Two pieces survive:
> - **Laennec + AUSCULTATION move into Act Two**, where they get a better job:
>   the ward is *heard, not seen*, and AUSCULTATION is the upgrade that makes
>   the whole floor ring clear at once. Spending him on finding lift pads was
>   always the weaker use.
> - **The ROTATION CHART** (fly-back to cleared sectors, cached as-left) stays,
>   and moves to **1.0.1** — it answers V1 and no longer needs to wait on the
>   pendulum, since Act Two doesn't touch the surface level cache. **Its unlock
>   is now Mary Seacole, a twelfth famous Scion placed in THE NULLWAVE, behind
>   the finale's existing black-box gate** (owner decision, July 2026) — see V1
>   for the placement, pinning and achievement consequences.
>
> **Nothing in this bundle is open.** Every item below is struck; the section is
> kept for the reasoning trail, per the status key. Don't schedule from it.
>
> The rest of this section is the pre-review record. Read
> HOLLOWS_EXPANSION_SPEC.md for the ROTATION CHART's design; treat its cave
> content as history.

**Why:** The lifts stay hard to find (a virtue, named by the owner) — the
aid is priced instead: René Laennec joins as a twelfth famous Scion hidden
inside a new Hollow, found by his knocking. AUSCULTATION makes unfound
lift pads ring when near (the Radiosense pattern applied to lifts); his
chart unlocks the ROTATION CHART (return travel to cleared sectors,
cached as-left); three new caves with new discoveries (THE WARD, THE
MINT, THE LISTENING POST). Full spec:
[HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md).

**Split by release (owner decision, July 2026).** The owner asked for fly-back
sooner (originally raised as a "1.0.1 fix"; see V1). Rather than break Q's
in-game unlock, Bundle Q is split across two releases:
- ~~**Ships in 1.1 (with Bundle P):** René Laennec + AUSCULTATION + the
  **ROTATION CHART**, sequenced after the pendulum work.~~ → the chart ships in
  **1.0.1** (V1, unlocked by Mary Seacole); Laennec is an Act Two upgrade.
- ~~**Ships in 1.2 ("THE DEEP HOLLOWS"):** the three new caves (THE WARD, THE
  MINT, THE LISTENING POST) and their discoveries.~~ → **no 1.2**; absorbed into
  Act Two's ten chambers.

~~**Priority: the 1.1 core rides with P; the caves are second post-launch
(1.2). Dependencies: P shipped/stable before the ROTATION CHART cache; J, K, I,
M, A all shipped.**~~ **Superseded — pre-review record.** The chart ships in
**1.0.1** ahead of Bundle P (V1), and there is no 1.2. Schedule from V1 and
Bundle P, never from this paragraph.

- ~~**Q·impl. Implement per the spec checklist** — work through
  HOLLOWS_EXPANSION_SPEC.md §9, items Q1–Q10.~~ **Dispositioned, July 2026.**
  The three caves are absorbed by Act Two (P·content); Laennec and AUSCULTATION
  are Act Two upgrades (P·scions); the ROTATION CHART is V1. Nothing is left to
  implement under a Q heading.
- ~~**Q·guard. Regression gate** — the Q5 level cache touches `toBriefing`.~~
  **Moved, not dropped.** The level-cache regression gate rides with V1; the
  "remix/daily must never draw them onto a surface sector" assertion survives
  intact and now applies to **Mary Seacole on the Nullwave** (see V1) rather
  than to Laennec.
- ~~**Q·ship. Release 1.2** — What's-New copy; add EVERY HOLLOW HEARD and
  GENTLE HANDS to the live G3 achievement set.~~ **There is no 1.2.** The two
  achievements move to **P·ship** with 1.1.

---

## Bundle V — 1.0.1 maintenance & narrative (post-approval owner round)

**Why:** Captured while **1.0 is in App Review (July 2026)**, this is the first
point release — the fixes and narrative beats the owner wants in **1.0.1** once
1.0 is approved. It is deliberately a *maintenance + narrative* bundle: no new
subsystem, but several fairness corrections and the payoff of the Solace as a
named sister ship. **Priority: first thing after 1.0 approval. Dependencies:
1.0 shipped; V3/V4/V5 share the Solace reveal, so build them together.**
**V15–V20 were added from a later owner playtest pass (late July 2026)** —
smaller, independent defects (a story beat that reads as a toast, a
Solace-adjacent turret left floating after the bad ending, a missing reveal
on the "answered" ending, an unexplained first resupply, an occasional
landing-spin bug, and a scenery overspill on one level) rather than new
narrative beats; no shared dependency between them or with V1–V14.

> **Tilt is dropped here, on the record.** The gyro/tilt steering path is
> *not* on the forward plan (owner decision, July 2026 — "not really any good
> for this game"). It was pulled from Settings before 1.0; the scaffolding
> stays dormant in `js/input.js` (`tilt` / `enableGyro` / `toggleTilt`,
> `doids_tilt`). Do not resurface it in 1.0.1 without an explicit reversal.
> User-facing docs (`support.html`, `GAME_DESIGN.md` §5, `STORE_LISTING.md`)
> have been scrubbed of the stale Tilt references in this pass.

- [x] **V·pacifism. Act One already pays better for shooting than for restraint.**
  *(Owner, July 2026, raised while settling Act Two's ladder: "this has
  implications for a 1.0.1 check on act one scoring too." It does — the check was
  run and Act One fails it.)*
  The no-harm bonus is a flat **+2000** for `level.firedShots === 0` (G3). Kills
  pay **+250** a turret and **+150** a drone. So the sector tables in
  `js/world.js` already cross over:
  - 8 turrets + 2 drones = **2300** — a shooter beats a pacifist by 300
  - 7 turrets + 2 drones = **2050** — over, on two separate sectors
  - and that is *before* `wideBump`, V10's `vetGuns` veteran escalation, or the
    `crowded` daily modifier's +2 drones, all of which push it further
  So on the back half of the campaign the ladder currently rewards clearing the
  room with the gun, which is the opposite of what the game is about.
  **DECIDED (owner, July 2026): fix by deriving, not by re-pricing.** Make the
  no-harm award a function of what was passed up — the sector's own gun value,
  times a factor above one — so restraint always pays more *and cannot be
  overtaken by a future content change*. Re-pricing kills downward would work
  today and rot the moment Bundle W or a veteran return adds guns. Act Two's
  rule 7 (Bundle P · P·systems) is the same invariant, and **both acts use one
  shared helper** — something of the shape `noFireAward(level)` returning
  `BASE + gunValue(level) * FACTOR`, with `gunValue` summing the same per-target
  prices the kill awards pay. One function, so the invariant cannot hold in one
  act and quietly fail in the other.
  Scoped as a **1.0.1** change: it moves a shipped number, so it is not a 1.0
  hotfix. Zero stays the floor here too (P·systems rule 8).
  **Landed.** `gunValue(lvl)` and `noFireAward(lvl)` in `js/world.js`, beside
  RECIPE so they sit with the table whose numbers they answer. The measured
  crossover, for the record:

  | sector | turrets | drones | gun value | old flat 2000 | derived award |
  |---|---|---|---|---|---|
  | 0–2 | 2–3 | 0 | 500–750 | ok | 1125–1438 |
  | 3 | 6 | 1 | 1650 | ok | 2563 |
  | **4** | 8 | 2 | **2300** | **beaten by 300** | 3375 |
  | **5** | 8 | 2 | **2300** | **beaten by 300** | 3375 |
  | **6** | 9 | 2 | **2550** | **beaten by 550** | 3688 |
  | 7 | 6 | 3 | 1950 | ok — but `crowded` adds 300 | 2938 |

  Counted over the guns the sector GENERATED rather than the ones left standing:
  destroying one means you fired, which forfeits the award anyway — except by
  parry, and that exception is deliberate and untouched. The kill prices are now
  the same named constants `gunValue` sums (`KILL_TURRET`/`KILL_DRONE`), so the
  award and the prices cannot drift apart. Two tests in `worldgen.spec.js` assert
  the *property* over every sector plus a 40-gun level, never the arithmetic.
  **The dials, after the owner brought the base down.** `NOFIRE_BASE` 500,
  `NOFIRE_FACTOR` 1.25. The first pass held BASE at the old flat 2000 so no
  sector could pay less than before, but that roughly doubled a perfect pacifist
  campaign's bonus (16,000 → 31,600) and would have made shipped hiscores easy to
  beat after 1.0.1. At 500 the campaign total is 19,600 — **+23% rather than
  +98%** — and an unarmed room still pays something, which a base of 0 would not.
  The award's *shape* changes with it, and that is the improvement rather than
  the price: a flat bonus paid the same for restraint in a room with two turrets
  as in a room with nine. Sector 0 now pays 1,125 where it paid 2,000, and sector
  6 pays 3,688 — the reward scales with the temptation actually resisted.
  **THE PARRY IS A DELIBERATE EXCEPTION, not a loophole** (owner decision, July
  2026 — recorded here, in `js/world.js` and at the parry site itself, precisely
  because it reads as an oversight and would otherwise be "fixed"). A parried
  kill pays full price and does not set `firedShots`, so a player who reflects
  every round collects the kills *and* the no-harm bonus, and outscores a pure
  pacifist who only dodges. Intended: E3's parry is the game's hardest skill and
  it is *defensive* — you are struck at and you send it back — so it belongs on
  the restraint side of the ledger. Rewarding it most is the game arguing there
  is a way through that is neither firing first nor merely enduring. It does mean
  the bonus has always measured "you did not shoot first" rather than "nobody
  died", so the `noHarm` achievement name overstates it slightly; left alone,
  since it has shipped and renaming a Game Center achievement breaks it.
  **Worth knowing before touching it:** a *parried* kill pays full price and does
  **not** set `firedShots`, so a player who reflects everything already collects
  both the kills and the no-harm bonus. That looks intentional and good — a parry
  is skilled restraint, not violence — so leave it, but note that it means "the
  pacifist score" has always meant *didn't shoot first*, not *no one died*.
- [ ] **V1. Fly back to previous zones (rescue those left behind) — the
  ROTATION CHART, unlocked by Mary Seacole on the Nullwave.** The owner's
  request is return travel to cleared sectors, cached as-left. **Re-decided
  twice:** the July 2026 Act Two round moved Laennec and AUSCULTATION into
  Bundle P, so the chart lost its unlock; the owner's answer (July 2026) is a
  **twelfth famous Scion, placed in THE NULLWAVE** — and the chart stays
  **behind the finale's existing gate**, i.e. it is a deep-completionist
  reward, not a given. Act Two doesn't touch the surface level cache, so
  there's no sequencing risk against Bundle P.

  **Who: MARY SEACOLE (1805–1881).** Refused by the War Office, she paid her
  own passage to the Crimea and went back onto the field again and again for
  wounded men others had left behind. "Rescue those left behind" is her
  biography rather than a metaphor for it, and she answers Nightingale, already
  waiting in sector 2. Placing her in the last and darkest sector — the place
  everyone else abandoned — is the point. *(Fallback if the Nightingale echo is
  unwanted: Nikolai Pirogov, battlefield triage.)*

  **The unlock is persistent, and that is the design, not a workaround.**
  Sector 7 is the last level before the endgame, so the chart does nothing in
  the run you find her in. It keys off `codex`, which already survives across
  runs (`doids_codex`, the same mechanism as the `CANON_FAMOUS_ID` hint gate),
  so every *subsequent* rotation starts with the chart armed — drop back from
  sector 3 to sector 1 for the Scions you left behind. That makes it the
  veteran's tool and stacks with the existing `doids_veteran` gate and the
  "Something's still down there" title tease (V7).

  Implementation notes, all load-bearing:
  - **The Nullwave has no famous slot today.** `genLevel` guards placement with
    `if (n < FINALE_IDX && lvl.oids.length)` (`js/world.js`), so sector 7 needs
    a new path. **It must not consume RNG:** sectors 0–6 assign the role by
    deterministically picking the oid nearest mid-map, no draws — do the same,
    or the finale layout shifts. Terrain is untouched (a role flag, not a
    heightmap change), so the M1 golden checksum is safe.
  - **Pin her, and exclude her from the shuffle.** `buildFamousMap` shuffles all
    of `FAMOUS` and slices `FINALE_IDX` entries for sectors 0–6, so without an
    exclusion REMIX/DAILY can draw her onto a surface sector — exactly what the
    old Q·guard was written to prevent. Needs a test asserting she is only ever
    the Nullwave's famous Scion, in every run mode.
  - **THE FULL CODEX becomes 12 for free.** The threshold is derived —
    `codex.size >= FAMOUS.length` (`js/update.js`) — and the codex counter reads
    `codex.size + "/" + FAMOUS.length`. Nothing in code, tests, COPY_DECK.md or
    STORE_LISTING.md pins the number; the Game Center description
    (*"Recovered every famous mind, across all your rotations"*) is count-free
    by GAMECENTER_ACHIEVEMENTS.md's own copy rule. **Owner decision (July
    2026): she lands in 1.0.1, not in the 1.0 build now in review** — a new
    binary would restart App Review, and completing the codex takes multiple
    REMIX rotations (the campaign awards only 7 of the pool), so effectively
    nobody can reach 11/11 before 1.0.1 ships. Note it in the 1.0.1 What's-New so
    the counter's move to `/12` reads as new content, not a bug.
  - **One asset is now wrong:** `the_full_codex.png` is specified as *"the open
    codex under a constellation of eleven famous minds"* — it needs a twelfth
    star. Regenerable from `assets/gamecenter/achievements/svg/` via
    `generate.py` (headless Chromium at 1024×1024). The achievement functions
    correctly either way, so if editing Game Center metadata mid-review is
    awkward, ship the eleven-star art and swap the image with 1.0.1.

  Code anchors: HOLLOWS_EXPANSION_SPEC.md §Q5 for the chart's cache design; the
  round-trip must reuse the checkpoint serialization (`doids_run`,
  `__doids.go(n)`); `FAMOUS`, `famousIdFor`, `buildFamousMap` in `js/world.js`.
- [x] **V2. Scan-jeopardy fairness for Scions (design pillar: fair, not a
  cheat).** *(Shipped — generation invariant. `scanSpotOK(heights,W,cx)`
  (`js/world.js`) derives, from the scan/creep constants, the band of landable
  touchdowns from which a read finishes before the creeping Scion reaches the
  hatch (beyond ~110px, within `SCION_SCAN_RANGE`, slope < the 0.25 landing max,
  within 70px vertically). A final generation pass widens each scannable Scion's
  own flat pad — deterministically, no RNG, only where the terrain doesn't
  already offer a spot — until the invariant holds, then re-seats ground-anchored
  entities. Measured 13/62 campaign + ~21% of REMIX Scions failing before →
  0/62 and 0/720 after. The creep behaviour (a) is unchanged: Scions already
  approach the ship rather than flee. `__doids.scanSpotFailures()` exposes the
  invariant; smoke: "V2 every scannable Scion has a fair scan-landing spot"
  (campaign + 8 REMIX seeds). Reshapes a few pads, so the M1 golden heightmap
  was intentionally updated (1488047869 → 1837799405; then → 1090254029 when the
  return-lift's flat began being re-asserted last so the pad never sits on a
  slope).)* Today you often can't land far enough from a Scion for a scan to
  complete before it reaches you, which reads as a rigged loss. Two changes:
  (a) a **running** Scion should stop fleeing and start *approaching* the ship;
  (b) generation/tuning must guarantee there is *always* a reachable landing
  spot from which a scan can complete before the approaching Scion arrives —
  though it may be hard, and may be up or down a slope the Scion can climb.
  This is a fairness *invariant*, so add a generation-time assertion (like the
  M1 heightmap checks) that such a spot exists. Code anchors: the Scion scan /
  approach logic (`updateScionScan`, the `scanCandidate` gate and `"wait"` /
  `"run"` states around `js/update.js:1131`), `SCAN_T`, `scanRate()`,
  `slopeAt()` and the walkability the Scion uses to climb.
- [x] **V3. The Solace reveal — a proper beat.** *(Shipped. Landing beside the
  finale source now names it — banner **"AMS SOLACE — MERCY'S LOST SISTER"** +
  `ringHollow()` — and fires a **sonar hull pulse** (`drawBeacon`, gated on
  `beacon.revealed`/`beacon.sonarT`, `SONAR_DUR`): her whole drowned hull sweeps
  into view as an x-ray outline over the terrain, bright near the surface and
  dull deep, clipped to an expanding sweep so it "draws in". It re-pulses on
  every 41-second Static beat (hooked in `updateStaticClock`). Respects
  reduced-flash. Smoke: "V3 landing beside the finale source reveals AMS Solace".
  The answer mechanic itself is reworked with V12 (the V6 wave-parry answer).)*
  The discovery currently lacks
  a moment. Make the **first scan announce it is the top of a sister ship, the
  AMS Solace** (big reveal, not a whisper). On scan completion, trigger a
  **sonar-style pulse that draws the whole hull shape** — including the
  submerged section, which pulses *more dully* than the exposed part — then
  fades back to invisible. **Repeat that pulse on every 41-second Static
  beat.** Code anchors: the scan/reveal system (`updateScan` / the shrine-scan
  path); the Static clock (`updateStaticClock`, `js/update.js`) to hook the
  41-s pulse; a new draw pass in `js/render.js` for the hull outline (exposed
  vs. submerged alpha). Ties into the counterfeit-tell language — a real pulse
  that lives *with* the heartbeat clock. Update GAME_DESIGN.md narrative canon.
- [x] **V4. Solace pre-scan label legibility.** *(Shipped. The pre-scan "THE
  SIGNAL SOURCE — land beside it, or open fire" label in `drawBeacon`
  (`js/render.js`) went from 9px at .7 alpha to a `bodyFontPx(10)` 700-weight
  line in high-contrast `#d9ccff` on a dark backing plate, so it reads over the
  nullwave ridge; respects `bigText` (via `bodyFontPx`) and drops the glow under
  reduced-flash.)* The text above the Solace
  before it's scanned is illegible — fix size and contrast (add a backing
  plate / shadow like other world labels). Code anchor: the label draw in
  `js/render.js` for the pre-scan Solace; check against the `bigText`
  (`bodyFontPx()`) and reduced-flash paths so it stays legible in all modes.
- [x] **V5. Seed the Solace in the story panels (lightly).** *(Shipped. INTRO
  (`js/render.js`): THE MISSION now names MERCY as one of the **second relief
  wave** alongside sisters **AMS VIGIL** and **AMS SUCCOUR**; THE ZONE seeds the
  lost **first wave, the SOLACE among them**. Owner-picked names. Mirrored to
  COPY_DECK.md §2.)* Reference the
  Solace without over-signposting that players *should* expect to meet it:
  establish that the MERCY is one of a **second wave** alongside **AMS X** and
  **AMS Y**, following an **initial wave** that included the **X, the Solace,
  and the Y**. A line or two in the intro / early BRIEFS. Code anchors:
  `BRIEFS` / intro copy in `js/world.js`; **mirror every changed string into
  [COPY_DECK.md](COPY_DECK.md) in the same PR (R10).**
- [x] **V6. Make the "heard" scan playable — a sonic-wave parry.** *(Both halves
  shipped. Finale-answer half: the Solace now casts an answerable pulse
  (`updateBeacon` pushes a `finale` wave every `ANSWER_GAP` while you're within
  `ANSWER_RANGE`); parrying it sets `beacon.heardParry` → `resolveBeacon
  "answered"`, replacing the old land-and-hold (owner decision). A finale miss
  costs −12 vitals + a Static surge. Owner design decisions:
  window 0.09s / 0.18s assisted; introduced at **Avicenna Shoals (sector 5)**;
  **a mid-game miss costs half** the finale penalty (−6 vitals vs −12 + surge).
  From sector 5 on, an active un-catalogued Vector casts a telegraphed violet
  wavefront (`updateWaves`/`drawWaves`, constants `WAVE_*` in `js/update.js`);
  parry it with the shield on the E3 `parryT` window to FLATTEN it — cataloguing
  the Vector (+250, "SIGNAL FLATTENED", oath clean, no shot). The wave resolves
  at a fixed `WAVE_ARRIVE` after casting, so timing is learnable regardless of
  distance; shape-based (expanding ring) so it survives colorblind, reduced-flash
  tones the glow. The `finale` wave flag + `beacon.heardParry` hook are in place
  for the Solace answer (V3/V12), where a miss costs −12 vitals + a surge.
  `__doids.waves()`/`armWave()` expose it; smoke: "V6 parrying a Vector's sonic
  wave …".)* Mirror the
  shield-parry mechanic, but instead of a bullet it's a **visible sonic wave**
  you must parry back to *flatten the corrupting signal*. Code anchors: the
  existing shield/parry code (deflection in `updatePlay` / the shield handling
  in `js/update.js`); render a travelling wavefront in `js/render.js`; resolve
  on a well-timed shield. **Needs a short design pass** (timing window, what
  failure costs, how it reads against the existing parry) before build.
- [x] **V7. Post-completion title & "start a run" framing.** *(Shipped the copy:
  the veteran CTA in `drawTitle` (`js/render.js`) now reads **▼ SOMETHING'S STILL
  DOWN THERE** (owner pick) instead of ▶ START NEW FLIGHT — the downward ▼ teases
  the Hollows — and the label auto-fits the pill so it never overruns a phone.
  Mirrored to COPY_DECK.md. The fuller "shot of a Hollow" title visual is left as
  an optional art follow-up.)* After a first
  completion (`veteran`), the title and the run-start language should
  acknowledge it. Change the visual — e.g. a shot of a **Hollow** to tease
  what's left to find — and change the button copy. **Options for the owner to
  pick from:** *"Is there more?"* · *"Go back down"* · *"Something's still
  down there"* · *"Return to the surface"*. Code anchors: `drawTitle` in
  `js/render.js`, the `veteran` flag, and the REMIX pill it already unlocks.
- [x] **V8. Adapted second-run intro.** *(Shipped. `VET_INTRO` (`js/render.js`)
  — a single panel, "SOMETHING DOESN'T SIT RIGHT", its art an ordinary slice of
  surface with a lift pad sitting faint on a flat shelf (uncalled, so it quietly
  asks "why THIS ground?") — replaces the first-run INTRO on a veteran's
  next fresh run, gated by a new `doids_vetintro` flag (`activeIntro` selects the
  set in `startFreshRun`; `finishIntro` marks the right flag). Shown once, then
  veteran runs launch straight into the tasking; re-shows after RESET PROGRESS.
  `__doids.get()` exposes `vetIntroSeen`/`introLen`; smoke: "V8 a veteran's first
  fresh run shows the one-panel veteran intro, once". Mirrored to COPY_DECK.md.)*
  The veteran (post-completion) run
  opens with a different intro, e.g.: *"Something doesn't feel right. If
  everything came from a corruption of Solace's distress call, we're left with
  some big questions. Why did it corrupt? And why did it crash in the first
  place?"* Code anchors: the intro sequence gated on `veteran`; `doids_intro`;
  COPY_DECK.md.
- [x] **V9. Sound-led level intros.** *(Shipped — one hook, only where the audio
  delivers it. `briefText()` (`js/update.js`) appends "And captain — is that a
  sound coming from under the ground?" on a **lift-bearing surface sector**
  (`level.lift && !isCave`), where the pad rings hollow underfoot (U1) — so it's
  never a promise the audio can't keep (heeding the cut Nightingale line).
  Mirrored to COPY_DECK.md.)* Give subsequent sector intros a similar
  sensory hook — e.g. *"Is there a sound coming from beneath the ground?"* on a
  Hollows-bearing surface sector. Light touch, per-sector. Code anchors:
  `BRIEFS[]` in `js/world.js`; keep in sync with COPY_DECK.md. (Note: an
  earlier "Listen for them in the dark" promise on Nightingale Basin was cut
  for lack of an audio tell — see the parked stereo-beacon idea below; don't
  re-introduce a promise the audio can't yet keep.)
- [x] **V10. Post-win campaign variant.** *(Shipped. `genLevel` (`js/world.js`)
  now detects a veteran campaign return (`veteran && runMode === "campaign" &&
  n < FINALE_IDX`) and: adds +2 turrets (`vetGuns`) and +1–2 saboteurs
  (`vetVectors`, raising the Vector proportion), and decorrelates the placement
  RNG **after** the terrain octaves are generated — so the landscape is the same
  but Scion/Vector/turret positions differ. Strictly veteran-gated: the
  non-veteran first run and the M1 golden heightmap are byte-for-byte unchanged
  (verified 1837799405). The early-sector no-pocket fairness pass and the V2
  scan-spot invariant both still hold under the escalation. REMIX/DAILY already
  re-roll and the finale keeps its authored setup + counterfeit MERCY. Smoke:
  "V10 a veteran campaign return escalates".)* The return (post-completion) run
  should differ from the first: **same landscape, but different Scion/Vector
  placements, more guns, and a higher proportion of Vectors.** This extends the
  existing veteran-return machinery (the finale already spawns the counterfeit
  MERCY only for `veteran`, `js/world.js:829`). Code anchors: `genLevel` in
  `js/world.js` (placement + `RECIPE`), gated on `veteran`; reconcile with the
  existing REMIX rotation (M) so the two return modes don't fight.
- [x] **V11. (Candidate) Decoy MERCY reachability.** *(Resolved (owner, 1.0.1
  round): leave it as a deep secret — no code change. Matches the game's
  existing design pillar of rewarding deep exploration rather than surfacing
  every secret to every player.)* Owner question, July
  2026: the counterfeit MERCY is currently gated behind **`veteran` +
  reaching the secret finale + `blackboxCount >= TRIANGULATE_N`**
  (`js/world.js:829`, `js/update.js:695`), so most players never see it.
  Decide whether 1.0.1 should surface it earlier / more reliably, or leave it as
  a deep secret. Owner decision — logged so it isn't lost.
- [x] **V12. The counterfeit MERCY should be a *surprise*, not a signposted
  quiz (owner playtest, late July 2026).** *(V12a–c all shipped — see the
  parenthetical below; checkbox was stale.)* Today the finale over-explains the
  twin: the veteran warning spells out *"Two ships will answer as MERCY … tell
  them apart by the emblem … count the beats before you dock"* (`js/update.js:671`),
  and the decoy gives itself away by **position** — it spawns at `W*0.45`
  (`js/world.js:830`) while the real mothership sits in its usual spot, so
  location alone is the answer. The reveal should land on *earned* instinct — the
  heartbeat-vs-mechanical read the game has taught since the fuel pods (Y4) and
  the ECG — not a printed key. Three parts:
  - **V12a. De-signpost the copy.** Cut / soften the explicit twin warning
    (`js/update.js:671`) and keep the Solace / second-wave seeding (V5) light, so
    a *second MERCY* is genuinely unexpected. Trust the tells. (This is also what
    clears the Y7 overspill.) Mirror into COPY_DECK.md (R10).
  *(Shipped V12a–c. **V12a** — the explicit twin warning is cut from `briefText()`
  (the old "two ships … count the beats" paragraph is gone; nothing signposts a
  second MERCY). **V12b** — on the veteran finale, `genLevel` gives BOTH MERCYs
  randomised, well-separated positions (`level.mx` and the decoy, ~0.20–0.34·W
  vs ~0.60–0.76·W, side randomised), so location tells you nothing; a
  `drawMercySplit` reveal flickers one ship into two that drift to those spots
  (`mercySplitT`/`MERCY_SPLIT_DUR`), during which docking is inert
  (`updateDecoy`/`updateDocking` gated). Both already render identically (N1's
  shared `mercy*` helpers); the only tell is the emblem beat — real = uneven
  heartbeat, counterfeit = 41s metronome. **V12c** — the read is the beat alone,
  and the reveal/tell respect reduced-flash. Docking the fake springs the
  existing trap; identifying/answering the real is the win. Smoke: "V12 the
  finale spawns two identical MERCYs …".)*
  - **V12b. Identical but for the tell; position uninformative.**
    **Owner-approved (late July 2026): build the full reveal.** A single MERCY
    **flickers, splits into two, both fade out, then reappear in randomised /
    ambiguous locations** —
    visually identical, so *where* they are tells you nothing. The only honest
    difference is the beat: the real one **beats like an uneven heart** (already
    `js/update.js:671`'s "ours beats like a heart: uneven, alive"); the counterfeit
    **ticks on the 41-second Static beat** — the same maker's-mark metronome as
    the Y4 fuel pods. Code anchors: `drawDecoyMercy` (`js/render.js:1838`) +
    `drawMothership`, decoy placement (`js/world.js:830`), `updateDecoy`
    (`js/update.js:2218`), the Static clock (`updateStaticClock`). **Needs a
    design pass:** how random placement can be while both stay reachable
    (reconcile with V11), how the split reads, what a wrong dock costs.
  - **V12c. Fair from the cues alone.** With position no longer a tell, confirm
    the read is fair from the learned beat cue — and that ASSIST / colorblind /
    reduced-flash don't wash the beat out. Ties to V11 (whether the decoy is
    surfaced more widely at all).
- [x] **V·guard. Regression gate.** Smoke suite green; extend `__doids.get()`
  to expose new state (Solace pulse, heard-scan parry, fly-back availability, the
  counterfeit-MERCY reveal V12); add tests for the V2 fairness invariant and V1
  return-travel round-trip. *(Done for everything built this round: `__doids`
  exposes `scanSpotFailures` (V2), `waves()`/`armWave()` (V6), `vetIntroSeen`/
  `introLen` (V8), `answerBeacon()` (V6-finale), and `beacon.revealed/sonarT` +
  `mercySplitT` via `level`. Smoke covers V2 fairness (campaign + REMIX), V6
  mid-game parry, V3 Solace reveal, the V6-finale parry answer (and that holding
  no longer answers), V8 veteran intro, V10 escalation, and V12 twin
  (randomised/separated + trap). M1 golden checksum updated for V2's
  pad-widening. V1 return-travel is a 1.1 item (Bundle Q), not part of 1.0.1.)*
- [x] **V13. The bad ending — destroy the Solace.** *(Shipped. The fleet's
  destroy-on-sight order — the one the CMO refused to sign (`primum non nocere`,
  see BRIEF + LOG 09/10) — is now a real, spectacular choice. FIRE on the signal
  source drops her `beacon.hp` (3 rounds; already wired in the `level.shots`
  loop); the last round runs `resolveBeacon("fire")`, which no longer cuts
  straight to the card. Instead a scripted **`destruct`** state plays out in
  beats (owner steer — timings `SOL_IGNITE`/`SOL_REVEAL`/`SOL_BOOM`/`SOL_END` in
  `js/update.js`): (1) the glow **ignites on her exposed broadcast tower + mast**;
  (2) the red heat then **flows DOWN below the ground line**, drawing out her
  buried hull top-to-bottom via a descending clip front — and the shape reads as
  a **MERCY-class _sister_** (`solaceMercyPath()`: same family as `mercyHullPath`
  — dorsal tower integral to the top edge, mast — but a taller/narrower tower and
  a longer, deeper hull, so related not identical); (3) a held beat to take the
  shape in; (4) she **detonates in a shower of sparks** with a flash + shockwave
  and (5) resolves to a **smoking crater** in the ridge (`drawSolaceDeath` in
  `js/render.js`; `updateDestruct` in `js/update.js`; `drawDarkness` keeps a
  blast-growing light hole open so the reveal reads through the nullwave dark).
  Terrain interaction, so the logic reads true: generation flattens a WIDE ridge
  over her buried hull footprint (`flatten(...,250)`) so she is genuinely buried
  — only the tower breaks the surface, no hull poking over open land — the tower
  TOP is drawn poking out (not just a floating aerial), and the detonation sinks
  a REAL crater into the heightmap (`crushCrater` in `js/world.js` +
  `invalidateTiles`) so the ridge visibly collapses into a hole, not a flat
  scorch. It settles onto
  the reworded **SILENCE BY FIRE** card: "…That was one of ours. AMS SOLACE —
  crew of 214 — silenced, not answered. The SOLACE deserved better." Respects
  reduced-flash (no screen bloom, dimmer glows). Rank stays `SECTOR WARDEN`.
  `__doids.fireSolace()` + smoke "Bad ending: the Solace can be destroyed by
  fire". COPY_DECK updated.)*
- [x] **V13a. Owner playtest follow-ups on the bad ending + logic tightening.**
  *(Shipped.)*
  - **Bad-ending end panel.** `drawWin()` now branches to its own
    `drawFireEnding()` for `endingType === "fire"` instead of reusing MISSION
    COMPLETE — a dark silhouette of the Solace's hull (`solaceMercyPath()`,
    reused from the destruction reveal) under "THERE HAS TO BE A BETTER WAY."
    SECTOR WARDEN still stands; the framing is regret, not triumph.
  - **Variable homecoming line.** The veteran-intro recap's opening line
    ("You brought them home") was a flat claim regardless of outcome. It's now
    built from `lastRunSaved`/`lastRunLost` — a fresh pair snapshotted once via
    `saveLastRunTally()` when `resolveBeacon()` resolves an ending, persisted as
    `doids_lastrun_tally` — so it reads "You brought them all home" only when
    true, otherwise "You brought N home. M didn't make it."
  - **Jenner brief detuned.** `BRIEFS[6]` named the serpent mark/mask outright,
    scooping LOG 12/13's gradual reveal on a first run. Reworded to keep the
    dread without the spoiler; COPY_DECK mirrored.
  - **Signal-wash parry knockback.** `drawWaves()` (`js/render.js`) now sends a
    parried wave back the way it came — travelling ship → source over
    `WAVE_RETURN` (0.4 s) and landing as a burst on the Vector (or the Solace at
    the finale) — instead of only flashing at the ship.
  - **Graceful early-extraction confirm.** `drawConfirm()` eases in (fade +
    slight rise) over ~0.28 s instead of popping up instantly, landing just
    before the existing 0.25 s input debounce opens.
  - **MERCY-spooling banner repositioned.** `banner()` takes an optional
    `yFrac`; the S4 "MANIFEST CLOSED — MERCY IS SPOOLING" call now sits lower
    (0.58) so it clears MERCY and your own ship, both near the top of the
    screen during the hangar approach.
  - **Corrupted vs. counterfeit (the big one).** Before the husks are known
    (`husksKnown()`, `js/world.js` — true once the WORKSHOP shrine, `SHRINES[1]`
    "THEY WERE NEVER RESCUED," has been found; even a veteran doesn't start a
    run knowing it), a disguised unit is framed as **CORRUPTED**, not
    COUNTERFEIT, and the "proven, so it's a clean kill" exception is off: a
    flagged/catalogued unit still boards (rather than sitting inert on the
    ground) and must go through the red isolation bay like any other saboteur
    passenger; destroying one on the ground is malpractice regardless of
    flagged state. Once the husks are known, all of this reverts to the
    original rules (clean kill, may be left on the ground). See `husksKnown()`
    call sites in `js/update.js` (the S5 landed-scan catalogue text + the
    "dying" kill resolution) and the boarding-exemption change in the oid
    update loop.
- [x] **V14. The V2 scan-landing invariant does not hold for every REMIX seed.**
  *(Shipped. `startRemix(seed)` (`js/world.js`) now takes an optional explicit
  seed — `__doids.remix(seed)` — so a failure is reproducible. A brute-force
  sweep (4000 seeds × 7 sectors, then confirmed clean across 30000 seeds ×
  7 sectors) found two real domino effects the original single-pass fix
  never re-checked for: (1) the lift-flat reassert's own scanSpotOK-driven
  repair can carve its replacement shelf on top of a THIRD, unrelated
  Scion's already-fair band; (2) two scannable neighbours ~260px apart
  (pick()'s own minimum) can mutually nick each other's checked BAND even
  though their pads never overlap — the band reaches ~195px out, further
  than either pad's ~122px cap. Fixed with `enforceScanFairness()` (the
  original widen+shelf logic, pulled into a function) called a second time
  after the lift reassert, plus a final verify-as-you-go backstop that tries
  candidate spots inside the actual checked band and confirms each one
  before moving on, rather than predicting a position. M1 golden checksum
  unchanged (1090254029) — the campaign seed was never affected. Smoke:
  "V14 the V2 fairness invariant holds across a broad REMIX seed sweep"
  (fixed known-failing seeds + an in-process 5000-seed sweep).)*
  Found while verifying Bundle DS (July 2026), and **pre-existing — not caused by
  that work**: the V2 fairness guard
  (`worldgen.spec.js:241`, "every scannable Scion has a fair scan-landing spot")
  samples 8 random REMIX seeds × 7 sectors per run and fails roughly **1 run in
  7**, always on the REMIX branch (`remix run #k sector n`), never on the
  deterministic campaign sectors. Measured at 1/6 on the DS branch and 1/8 on an
  unmodified `main` worktree — same assertion, same line, so the rate is the
  test's, not the change's. **The test is telling the truth:** some REMIX seeds
  generate a Scion with no reachable, landable spot from which the scan finishes
  before it creeps to the hatch — a real fairness defect in REMIX, which the
  widened-pad fix at generation doesn't fully cover across the seed space. Two
  things to do, in order: (a) make `__doids.remix()` seedable from the test so a
  failure is *reproducible* instead of a one-shot, then (b) fix generation for the
  seeds it finds. **Do not "fix" this by loosening the assertion** — it is
  currently the only thing catching an unfair REMIX run, and it will keep reddening
  CI at random until (b) lands. Code anchors: `scanSpotFailures()` (the
  `__doids` handle in `js/render.js`), the pad-widening in `genLevel`, and V2 in
  [ROADMAP_ARCHIVE.md](ROADMAP_ARCHIVE.md) for what the invariant was meant to
  guarantee.
  **A sibling flake in `finale.spec.js:57` is already fixed** (July 2026) and is
  worth reading as the pattern: the counterfeit-MERCY scan test parked the oids
  away so none could board mid-scan, but `updateScan()` also sweeps any
  unrevealed fake/hollow prop within 60px, and a lure-tree pays its own +500 on
  top of the twin's +800. Since V13 randomised the twin's spawn, one landed
  inside scan range **~9% of runs** (31/400 and 39/400 generations measured), so
  the score assertion intermittently saw 1300. Fixed in the test by parking the
  scannable scenery too. **The lesson for V2: when a test depends on a
  randomised position, pin or clear everything in range, or give the test a
  seed.** Both flakes were misattributed to unrelated changes before being
  measured — check the failure rate on a clean worktree before believing a diff
  caused it.
- [x] **V15. "The bay is a mouth" needs to land as a beat, not a banner
  (owner note, July 2026).** *(Shipped. A new `"trapcard"` state
  (`updateDecoy`'s trap branch, `js/update.js`) holds a tap-gated panel —
  reusing `drawCardPanel`, kicker `THE THIRD ACT`, title `THE BAY IS A
  MOUTH` — until the player dismisses it; only then does `shipDie()` (and
  the life it costs) run. A new `swallow()` SFX (`js/audio.js`, a lower/
  wetter `hydraulic()`) fires the instant the trap closes, timed to the ship
  visibly getting pulled in, before the panel appears. Copy in COPY_DECK.md
  §10. Smoke: the docking-trap test in `finale.spec.js` now dismisses the
  card before asserting the life loss.)* The decoy's reveal — that the counterfeit
  MERCY's bay has no healing, no fuel, only appetite — is today just the
  standard 4.2s `banner()` (`function banner`, `js/update.js:92`) fired from
  `updateDecoy` when the trap closes (`js/update.js:2426`), and it races the
  death flow: `shipDie()` (`js/update.js:161`) flips `state = "dead"` in that
  same call, so the line barely gets read before the death screen takes over.
  This is a story climax (the CMO's fear made literal), not a passing toast —
  give it its own tap-gated panel, on the model of `showCard`/`drawWin` rather
  than the transient banner, hold it until the player taps to continue, and
  add an unpleasant swallow SFX distinct from the current `staticTick()` +
  `dullThud()` (`js/audio.js:223`, `:234`) — something with a descending pitch
  sweep under noise, in the spirit of `hydraulic()` (`js/audio.js:274`) but
  wetter/worse, timed to when the ship visibly gets pulled in. Code anchors:
  `updateDecoy` (`js/update.js:2410`), `shipDie` (`js/update.js:161`), the
  tap-gated card pattern (`showCard`, `drawWin`/`drawFireEnding` in
  `js/render.js`), `js/audio.js` for the new SFX.
- [x] **V16. Shooting the Solace should take a beside-her turret down with
  her.** *(Shipped. `updateDestruct`'s detonation branch (`js/update.js`)
  now kills/explodes any `level.turrets` entry within the crater radius
  right alongside `crushCrater`, instead of leaving it hanging over the
  hole. Smoke: "V16 shooting the Solace takes a beside-her turret down with
  the crater".)* Firing on the Solace sinks the ridge over her buried hull into a
  real crater (`crushCrater`, `js/world.js:779`, called from `updateDestruct`,
  `js/update.js:2566`) — but any `level.turrets` entry planted near her at
  generation keeps its own static `t.x`/`t.y` set once in `genLevel`, and is
  never checked against the changed heightmap or killed, so it's left
  hanging in mid-air over the hole. Add a check alongside the crater carve
  (or in `updateDestruct`) that kills/explodes any turret within the crater
  radius the same way a direct hit does (`explode`, `js/update.js:1413`),
  instead of leaving it floating. Code anchors: `crushCrater`/
  `invalidateTiles` (`js/world.js:779`; `js/update.js:2566`-`2567`), the
  existing turret hit-test to mirror (`js/update.js:1409`-`1416`).
- [x] **V17. Returning the Solace's pulse should re-trigger the full hull
  reveal.** *(Shipped — one line, `resolveBeacon`'s answered branch now sets
  `b.sonarT = SONAR_DUR`. Smoke: added to the existing answered-ending
  test.)* V3's sonar sweep (`beacon.sonarT = SONAR_DUR`, `SONAR_DUR` at
  `js/update.js:31`) currently fires on the first landing-beside reveal
  (`js/update.js:2460`) and on every 41-second Static beat
  (`js/update.js:80`), but **not** at the moment the player actually answers
  her: `resolveBeacon("answered")` (`js/update.js:2487`, the non-`"fire"`
  branch from `:2507`) only spawns particles and a blip and fades to
  epilogue — it never touches `sonarT`. Add `b.sonarT = SONAR_DUR;` (or a
  bigger, one-off flash variant) to that branch so the whole submerged hull
  lights up the instant her pulse is returned — the payoff moment, not just
  the ambient tell. Code anchor: `resolveBeacon` (`js/update.js:2487`).
- [x] **V18. First field resupply deserves a beat, not just a fuel bar.**
  *(Shipped verbatim, gated on `runRefuels === 0` at the drone-spawn point.
  Copy in COPY_DECK.md §8. Smoke: "V18 the very first field resupply gets a
  one-time acknowledgement banner".)* The
  resupply drone (`updateResupplySignal`, `js/update.js:2124`) launches
  silently the first time a stranded player holds THRUST long enough to
  signal — nothing acknowledges that help exists at all, let alone that it
  comes at a cost. Add a one-time message on the very first drone launch
  (gate on `runRefuels === 0`, before it's incremented at
  `js/update.js:2205`, the same one-shot-flag shape as `doids_vetintro`/V8) —
  something like *"You're not alone. Help is on the way. But there is a
  price."* — landing as the drone launches or arrives. Code anchors: the
  drone-spawn block (`js/update.js:2148`-`2156`), `runRefuels`
  (`js/update.js:2205`), `banner()`/`showCard()` for how to present it;
  mirror the new line into COPY_DECK.md (R10).
- [x] **V19. Occasional weird ship spin on landing (assist mode).** *(Shipped
  exactly as diagnosed — a new `normAngle()` helper (`js/update.js`, the
  existing modulo pattern factored out of `landingEval`'s `tilt`) applied at
  both landing snaps: `s.ang = assist ? normAngle(s.ang) : 0`. Smoke: "V19 a
  long flight's accumulated rotation doesn't survive into a landing spin".)*
  Reported:
  the dart sometimes visibly spins on touchdown, possibly tied to shield use.
  Likely cause: `s.ang` accumulates unbounded while flying — `steer` adds to
  it every tick with no wraparound (`js/update.js:947`) — so after a long or
  hard-turning flight it can sit several full turns past zero (e.g. ~15 rad)
  rather than at its equivalent small angle. A soft/survivable landing with
  **assist on** keeps that raw value (`s.ang = assist ? s.ang : 0`,
  `js/update.js:1041` and `:1068`) and then eases it toward 0 by repeated
  multiplication (`js/update.js:958`-`960`) — which visibly spins through
  every accumulated extra rotation before settling, reading as a wild spin.
  (The shield-bounce branch, `js/update.js:1042`-`1066`, doesn't touch
  `s.ang` at all, which may compound this if the player is holding steer
  through a bounce.) Likely fix: normalize `s.ang` to `(-π, π]` before it
  reaches the landing/assist path — `js/update.js:142` already has the
  modulo pattern to reuse. Code anchors: `js/update.js:947` (accumulation),
  `:958`-`960` (assist ease), `:1041`/`:1068` (landing snap), `:142`
  (existing normalize pattern).
- [x] **V20. Dune scenery overspills unnaturally on one level.** *(Root cause
  found by code comparison, not a live repro: every OTHER wide ground-
  anchored decoration (`drawHedge`, `drawSpire`, `drawRuin`, …) rotates to
  `sc.tilt` right after translating; `drawDune` never did, so its flat base
  held level in screen space regardless of slope — on a sloped patch it
  visibly floats clear of the ground on one side and digs into it on the
  other. Fixed with `ctx.rotate(sc.tilt * 0.4)`, matching `drawHedge`'s
  damping for the same kind of organic mound. Confirmed with a REMIX seed
  whose dune actually sits on a slope (campaign seed 0's Avicenna dunes all
  happen to land on flat ground, so this never reproduced there).)* Owner
  screenshot, July 2026: on one surface sector a hillside/dune reads as
  spilling past its own terrain in a way that looks broken rather than
  windswept. Avicenna's banded dunes are placed once at generation
  (`deco("dune", …)`, `js/world.js:1270`) and drawn at that fixed
  `sc.x`/`sc.y` (`drawDune`, `js/render.js:1191`); the layering note right
  above `SOLID_ALPHA` (`js/render.js:1304`-`1307`) records a *prior* dune bug
  (translucent alpha bleed, fixed by `SOLID_ALPHA`) — this may be a
  recurrence, or a separate positional issue if the underlying heightmap
  shifts after placement (e.g. a nearby pad-widening/`flatten()` pass, V2)
  without re-seating the dune. Needs a repro (which sector/seed) before a
  fix. Code anchors: `deco("dune", …)` (`js/world.js:1270`), `drawDune`
  (`js/render.js:1191`), the ground-anchored-entity reseat V2 already does
  for other scenery (`js/world.js`, `scanSpotOK`/pad-widening section).
- [x] **V21. "A floating gun remained" — resolved, no code change.** *(Owner
  playtest report, July 2026, carried over from the second feedback round; owner
  confirmed sorted after retesting against merged `main`: "Floating gun is
  sorted.") * Two investigations found no cause, and the reason is now clear: V16
  already kills any alive turret within 240px of the beacon x when the Solace
  detonates, and that radius matches `crushCrater`'s own deformation radius
  exactly, so there was nothing to find. The report came from testing an older
  branch — which is what prompted integrating Bundles V, X and Z onto `main` in the
  first place. **Lesson worth keeping: SHA-pin the QA-harness link to the build
  actually under test** (`docs/QA_HARNESS.md` § "Cache gotcha") — a branch-name
  link or a stale Home-Screen page can silently serve an old build and send a
  session hunting a fixed bug.
- [ ] **V·ship. Release 1.0.1.** What's-New copy; confirm no new App Review
  surface (no new data collection, no new entitlements). Update
  [CHANGELOG.md](CHANGELOG.md). *(This bundle's code changes add no new
  entitlements, permissions, or data collection — confirmed while landing
  V11/V14–V20 above; CHANGELOG.md updated in the same PR. The actual
  release (What's-New copy finalized, submitted in App Store Connect)
  remains an owner action, same as O9.)*

## Bundle W — Landscape challenge escalation (optional polish)

> **Downgraded by the July 2026 Act Two design round
> ([ACT_TWO_SPEC.md](ACT_TWO_SPEC.md) §13).** W still improves Act One, but it
> no longer does any pricing work — Act Two carries 1.1 and the £4.99 move on
> its own. Take it when there's room; don't let it gate a release. Note also
> that Act Two's authored underground chambers will exercise `roofAt` and the
> overhang/collision questions W1 raises, so doing W *after* the Act Two
> vertical slice means solving them once.


**Why:** Owner idea (July 2026) for a **1.1** feature update: more landscape
*challenge* as the campaign progresses — **crazy deep / narrow valleys, rocky
outcrops and overhangs you must fly under, and small caves on the surface
levels.** Distinct from the deep Hollows (Bundle Q, the lift-down cave network)
— this is difficulty and texture in the *surface* terrain itself. **Decision
(owner, July 2026): ships in 1.1 alongside Bundle P** (the pendulum), which
already owns the 1.1 label. **Priority: post-launch, with P. Dependencies:
builds on Bundle T (per-sector width/biome identity) and the terrain
generators.**

- [ ] **W1. Progressive surface-terrain challenge.** Scale terrain difficulty
  with sector index: deeper/narrower valleys, overhangs/outcrops that force
  flight *underneath* them, and small surface caves. Code anchors: `genLevel`,
  `roofAt`, `genCave`, `slopeAt` and the per-sector `RECIPE` in `js/world.js`;
  the `wideBump` width scaling (`js/world.js:711`) is the existing per-sector
  difficulty lever to build on. **Must respect the V2 fairness invariant** —
  harder terrain cannot make a scan-landing spot unreachable — and the Bundle T
  biome work. Overhangs interact with collision and the shield's roof-save
  (`updatePlay`), so this needs a design + test pass, not just generation
  tuning. (Related but separate: the parked **destructible scenery** (T4) and
  **weather** (T5) launch-stretch items.)
- [ ] **W·guard. Regression gate.** Full smoke suite plus the M1 heightmap
  checksum stay green; add fairness-invariant assertions for the new terrain
  shapes across every seed the campaign and REMIX/DAILY can produce.


## Suggested sequencing

```
A ──┬──────────────► E ──► F ──► G ──► O
B ──┤ (parallel)     ▲                 ▲
C ──┤                │                 │
D ──┴────────────────┘                 │
      then, in any order alongside E–G:
      H, I, J, K, L   → price floor $2.99
      then M, N       → price point $4.99 at launch
      then the July 2026 feedback round, before O:
      R (fixes — blocks submission)
      S (sound / endgame / saboteurs — owner-requested for launch)
      T1–T3 + T6 (zone identity core — launch)
      T4, T5 (destructible scenery, weather — launch-stretch; slip to 1.1 if needed)
      pulled into the 1.0 launch build (owner decision, late July 2026):
      Y1, Y2 (stability) + X1 (beginner's guide) + X3 (first-play fork → guide)
      after 1.0 approval:
      1.0.1 = X2/X4/X5/X6 (trainee level, guided-pause overlay, hint-card bank,
             StoreKit in-app rating prompt — moved up from 1.1 since 1.0.1 is
             now the first post-launch build)
           + Y3–Y7 (wreck occlusion, counterfeit tell, lift pad, copy fixes)
           + V (Solace reveal; scan fairness; heard-scan parry; V12 fake-MERCY reveal)
           + Z (REMIX variable gravity — after the Z2 fairness re-tune)
           + V1 (ROTATION CHART / fly-back, unlocked by Mary Seacole on the
             Nullwave — the twelfth famous Scion; THE FULL CODEX becomes 12)
      then the feature update (PAID — the price move):
      1.1 = P (Act Two, the descent) at £4.99, phased:
            P·terrain (span terrain + chamber authoring) → P·slice (one chamber,
            on device) → P·persist / P·systems / P·scions → P·content (ten
            chambers) → P·guard → P·ship
      1.2 = CANCELLED (Q's caves absorbed into Act Two; see ACT_TWO_SPEC §13)
      W   = optional polish, no longer load-bearing
```

**Status (July 2026, updated):** A–D and **H–N are all shipped** on the web
build, plus the web-safe slices of E (E3, E7) and F (F1/F2 — no-ops until the
wrapper exists). **The Mac-gated code is now written too**: E1/E2/E4/E5/E6 and
all of G live in `app/` (Capacitor scaffold, config scripts, two local Swift
plugins) and in `index.html` (`cloud` + `gc` facades, wired and smoke-tested);
the owner's bundle ID `com.burners70.hollowoath` and the iOS 16+ floor are
locked. What's left needs hands on the Mac itself: run `app/setup-mac.sh`,
sign in Xcode, create the Game Center records (app/MAC_SETUP.md §5). **The
on-device passes E8 (matrix, §7) and F3 (haptics restraint, §8) are now done
(owner, July 2026), and most of Bundle O has landed** — store listing/metadata
(O2), screenshots (O4), support/privacy URLs (O5), the web-build takedown (O7),
and a TestFlight test submission (O6). Pricing is locked at $2.99 / £2.99 (O1)
and the age-rating questionnaire is done (O3), so **Bundle O is now complete on
the code/docs side** — what's left is the owner's final "submit for review" tap
in App Store Connect. The game already
plays at the $4.99 feature bar.
**The July 2026 owner-playtest feedback round is now bundled as R, S and T**
(above): R is pure defect-fixing and joins the submission-blocking set; S
(sound character, the extraction-hangar endgame, leavable identified
saboteurs, the VECTOR rename (locked), the 1.2 manifest teaser) and the core
of T (progressive sector widths, per-sector biome palettes and ornamentation,
staged nightfall on the Basin) are owner-requested for the launch build. T4
(destructible scenery) and T5 (weather) are launch-stretch with a
pre-approved slip to 1.1. All player-facing copy is now mirrored for owner
review in [COPY_DECK.md](COPY_DECK.md) (R10).
**P is specced, phased and locked; Q is fully dispositioned** (owner rounds,
July 2026). Act Two is the **paid** 1.1 update (£2.99 → £4.99), planned in
[ACT_TWO_SPEC.md](ACT_TWO_SPEC.md) with [PENDULUM_SPEC.md](PENDULUM_SPEC.md) as
the tether-physics reference; **1.2 is cancelled** and Bundle Q's caves are
absorbed into Act Two's ten chambers, leaving
[HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md) as the ROTATION CHART's
design reference only. The July 2026 planning round added: **span terrain**
(the shipped heightmap cannot express the overhangs Act Two's chambers need),
a **replaced deception tell** (the old "perfectly level" rule was false against
`flatten()`), **ten new famous minds** each tied to an Act Two system, and
**Mary Seacole** as V1's ROTATION CHART unlock in 1.0.1.
**Bundle V is the 1.0.1 plan**, captured while 1.0 is in App Review: the
Solace sister-ship reveal (named ship, sonar hull pulse on the 41-s clock),
Scion scan-jeopardy fairness, a playable "heard" sonic-wave parry,
post-completion title/intro/campaign variants, and the record that **tilt is
dropped from the forward plan** (dormant scaffolding only). Fly-back to cleared
sectors (the owner's other "1.0.1" ask) is **back in 1.0.1 where he wanted it**
(July 2026): the **ROTATION CHART**, unlocked by **Mary Seacole** as a twelfth
famous Scion in THE NULLWAVE and left behind the finale's existing black-box
gate — a deep-completionist reward, persistent across runs. **Bundle W**
(landscape challenge) is now optional polish, not part of 1.1. V11 (whether to
surface the decoy MERCY earlier) was resolved: leave it a deep secret.
**The late-July 2026 owner-playtest round adds two more 1.0.1 bundles: X**
(onboarding — an optional beginner's guide, a guided trainee "Level 0", a
first-play "played thrust games?" fork, and a post-death hint-card bank; the top
fix for the "too-steep learning curve" note) **and Y** (release-fix defects: the
disappearing-landscape and blank-screen stability bugs after long iOS
backgrounding, Curie Fields wreck occlusion + angled motherships, the
Avicenna-gated counterfeit tell, and the above-ground lift-pad marker). **Owner
decision (late July 2026): pull the low-risk wins into the 1.0 launch build —
Y1/Y2 (stability), X1 (guide) and X3 (fork) — and keep the heavier subsystems
(X2/X4/X5, Y3–Y7, V + the V12 fake-MERCY reveal) and Z (variable gravity, after
its fairness re-tune) for 1.0.1.**
The support/marketing URL now lives on a **custom domain on GitHub Pages**,
**`hollow-oath.com`** (registered on Cloudflare, July 2026 — see O8). **Done:**
the domain resolves over HTTPS, the in-repo links point at the new root, and
the three App Store Connect URL fields are set. **The E8 device matrix is also
complete** (`app/MAC_SETUP.md` §7) — perf, Game Center and the iCloud
round-trip all verified on device in late July 2026, so each native feature
cited in the O6 App Review notes is backed by a result. What remains before
submission is the owner's own **Submit for Review** tap.

Post-launch candidates (deliberately out of scope here): more famous Scions (M4
grows), second-playthrough modifiers, Android/Google Play via the
same Capacitor shell, a second wave of relics in Q's new caves, the
counterfeit tanker (Glycon's fourth act, seeded by the transfusion line), and
**asynchronous multiplayer** (below).

**Multiplayer (owner idea, late July 2026 — logged; needs a design pass).**
Real-time multiplayer is **out of scope for the current architecture**: the game
is static files with no backend and no netcode (single global scope, Capacitor
`file://` origin), so live co-op / versus would mean standing up a server,
networking and leaving the no-build model — effectively a different project.
**Asynchronous multiplayer is a natural fit**, because runs are already
deterministic per `runSeed` (M1) and Game Center is already planned (G): (a)
**ghost runs** — record a run's path (or input trace) on a shared DAILY / REMIX
seed and replay a friend's ghost alongside you; (b) **head-to-head on the seed**
— the DAILY board (M3 / G) is already async competition; formalise a "beat this
seed + score" challenge you can send a friend; (c) an **async rescue relay** —
your end-state seeds the next player's run. All three lean on G + M with **no
server of our own** (Game Center carries the data). Recommendation: scope (a) +
(b) as a possible **post-1.1** feature; real-time stays parked unless the
no-backend constraint is deliberately reopened.
Formerly-listed candidates now promoted to locked bundles: ~~the pendulum
sling~~ → **Bundle P / Act Two (1.1)**; ~~the deep Hollows / a fourth Hollow~~ →
absorbed into **Act Two's ten chambers** (Bundle Q dispositioned, 1.2 cancelled).
- ~~**the transfusion line**~~ — **shipped (July 2026), ahead of schedule**:
  field refuelling is now an active hover minigame — hold station on the
  drone's fuel line, choose when to detach (CLEAN LINE +250 for a full tank
  with no occlusion), shield forced down while tethered, FIRE means detach,
  the 41-second surge rocks the tether, and the pump goes arrhythmic with a
  contaminant aboard. The counterfeit tanker (Glycon's fourth act) remains a
  future hook. See ROADMAP.md § Future ideas for the design writeup.

**Parked — not scheduled, logged so they aren't lost:**
- **Panel & card restyle — bring the canvas panels up to design system §5.2
  (owner likes the Claude Design mockup, July 2026).** §5.2 has specified
  **8–12px radius** on panels since the doc was written, and the canvas has
  never honoured it: `js/render.js` draws panels with `fillRect`/`strokeRect`
  (72 call sites) because **no rounded-rect helper exists**. So this is mostly
  *conformance*, not new design — the mockup is largely §5.2 as already written.
  Scope, smallest-first:
  1. **A `roundRect(x, y, w, h, r)` path helper.** Hand-roll it with `arcTo`
     (there's already one hand-rolled instance for the pause button in
     `drawHUD`). **Do not use the native `ctx.roundRect()`** — that's Safari
     16.4+, and the app's deployment target is **iOS 16.0**
     (`app/configure-ios.sh`), so it would silently break panels on 16.0–16.3.
  2. Apply it to `drawCardPanel` and the overlay panels, then to `banner()`'s
     renderer. Today a banner is *floating glowing text* with no box at all
     (`js/render.js`, the `bannerMsg` block) — the mockup makes it a bordered
     panel. That is a real visual change, not conformance, and wants an
     owner look on device: a bordered box mid-flight occludes more of the world
     than glowing text does.
  3. The mockup also **left-aligns** card content where `drawCardPanel` centres
     everything, and tints the title with the card's accent where the code uses
     a fixed cold `#f4f8ff`. Both are genuine design decisions for the owner,
     not conformance — the accent tint is the more clearly right of the two
     (§7: "glow colour = fill colour" already pushes that way).
  Constraints: route every colour through `PAL()`/`TOK` (§8) or the guards in
  `tests/settings.spec.js` will fail; keep the R1 pagination fit in
  `drawCardPanel` (the smoke suite asserts the footer stays on screen at
  320-high). **Don't land this in the middle of a TestFlight round** — restyling
  the story cards while testers are reporting on the colourblind swap muddies
  both signals.
- **A Mac desktop build (keyboard/gamepad-first).** Input is already there
  (`keyMap`, `pollPad()`); this is a packaging question with an owner decision
  in front of it — Mac Catalyst on Bundle E's Xcode project (its own store
  listing, price point and review cycle) versus simply promoting the existing
  keyboard-playable build. Catalyst additionally needs the touch-button HUD
  hidden entirely (not just de-emphasised as in H5) and a resizable-window
  layout pass, since the game assumes one fixed landscape viewport sized off
  `env(safe-area-inset-*)`. Full writeup: `ROADMAP.md` § Future ideas.
- **A version stamp on the title screen** (build/date), to make a stale
  Home-Screen install obvious at a glance.
- **Persistent codex / rescue-log gallery across runs** — who you've found,
  kept between runs rather than per-run.

**From the on-device App Store testing round (July 2026):**
- **BIG TEXT, expanded to the in-flight HUD.** Today `bigText`
  (`bodyFontPx()`) only enlarges story/help/legend/codex card body text — the
  in-flight HUD (score, fuel, ECG, the sector tally), banner pop-ups, and the
  Settings panel itself all use flat pixel sizes and don't respond to the
  toggle, which reads as inconsistent (found on-device). Expanding it
  properly means touching the HUD layout this codebase has a history of
  tight-viewport collision bugs in (see the R-bundle fixes above) — do it as
  its own pass with real on-device verification, not folded into a bugfix.
- **Vector light-sabotage.** Owner idea, on-device: a Vector aboard the ship
  could make the headlight beams (see the T6 fix just above) flicker and
  eventually fail entirely, on top of the existing malpractice/contamination
  mechanics — a new sabotage *action* rather than just a tell. Needs its own
  design pass (how it resolves, whether ANTISEPSIS/isolation cures it) before
  it's buildable. **The flicker math already exists** — `drawDarkness()` in
  `js/render.js` has a `NIGHTFALL_GUTTER` constant (currently `false`) gating
  the exact sine-wave guttering formula T6 used for "the lamp gutters on as
  night falls." That effect was cut from nightfall itself (owner decision,
  found on-device: it doubled up confusingly with the ship's own headlight
  beams fading in — see the beamGlow fix, also just above) but the code was
  left in place specifically to be reused here.
- **A procedural mode.** Owner idea, on-device, for a future edition: a mode
  that generates a full run (or endless run) from a fresh seed each time
  rather than the authored campaign or the fixed REMIX/DAILY seed rotation —
  distinct from M1's seed plumbing (which re-rolls existing generators, not
  the campaign structure itself). Logged only; no design spec yet.
- **A stereo-panned proximity beacon for stranded Scions in the dark.** Owner
  idea, on-device: BRIEFS[2] (Nightingale Basin) used to promise "Listen for
  them in the dark," but no audio tell for locating a Scion exists —
  `js/audio.js` has no Scion-proximity sound at all; `heartbeat()` only fires
  once a Scion is already aboard, and the only "find them in the dark" cue is
  visual (`drawDarkness()`'s light-pool punch per waiting Scion). The claim
  was cut from the brief for now (found on-device, this round) rather than
  rushed. The real feature: a soft, `StereoPannerNode`-panned call (panned by
  the Scion's x-offset from the ship, volume/pitch rising on approach) —
  genuinely useful on headphones, and in keeping with the game's existing
  audio-as-diagnostic language (ECG, heartbeat, vitals drone). Needs its own
  tuning pass before it ships: how many Scions call at once, at what range,
  whether it competes with the ambient bed/vitals audio already established.
