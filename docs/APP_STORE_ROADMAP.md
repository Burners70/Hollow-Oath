# Hollow Oath — App Store Roadmap

*The prioritised plan for **open** work on Hollow Oath, a paid iOS App Store
title. Work through the bundles in order; check items off (`[ ]` → `[x]`) as they
land, and add a line to [CHANGELOG.md](CHANGELOG.md) per bundle. When every item
in a bundle is checked, move the whole section to
[ROADMAP_ARCHIVE.md](ROADMAP_ARCHIVE.md) and leave a row in the shipped table
below — that's what keeps this file cheap to read.*

**This file holds only what is still open.** The 21 fully shipped bundles (A–N,
R, S, U, QA, Y, DS, X) live in [ROADMAP_ARCHIVE.md](ROADMAP_ARCHIVE.md) with their
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

### Versioning (1.0 vs 1.01 vs 1.1)

Two numbers, moving at different times. The **version string** players see
(`1.0`, `1.01`, `1.1`, …) changes only when a build is **released to the
public**; the **build number** increments on every upload to App Store Connect.
So:

- **Still 1.0** — anything that lands *before 1.0 is approved and live.* You
  upload a **new build of 1.0** (build 2, 3, …); the version string stays `1.0`
  and launch-day players get the fixes in their very first download. Re-uploading
  a build while in review restarts the review, but it does **not** need a version
  bump.
- **Becomes 1.01** — anything that lands *after 1.0 is live.* Existing players
  already hold 1.0, so changing what they have needs a new **version** (1.01),
  submitted and reviewed as an update.

The line is drawn by *"has 1.0 shipped to real users yet?"* — **not** by "have we
touched code?" That's why the sequencing calls below (pull a stability fix into
1.0, or hold it for 1.01) are real choices, not automatic ones.

### Open work at a glance

Every unchecked item in this file, by bundle. Counts are `[ ]` items in that
bundle's section — grep the bundle heading to jump there.

| # | Bundle | Open | Release | What's left |
|---|--------|------|---------|-------------|
| O | Store listing & submission | 1 | 1.0 | O9 — swap the "coming soon" CTA for a real App Store link (**launch-day, after approval**; lands on `gh-pages`) |
| T | Zone identity | 2 | launch-stretch → 1.1 | T4 destructible scenery, T5 weather — both pre-approved to slip |
| V | 1.01 maintenance & narrative | 11 | 1.01 | V1 fly-back (resolved → 1.1 with P), V11 decoy-MERCY reachability *(owner decision open)*, V12 fake-MERCY surprise, **V14 flaky-for-a-reason REMIX fairness gap**, **V15–V20 owner-playtest defects (bay-is-a-mouth beat, Solace-adjacent turret, Solace-answer reveal, first-resupply beat, landing spin, dune overspill)**, V·ship |
| Z | REMIX variable gravity | 3 | 1.01 | Z1 modifier, Z2 fairness re-tune *(gates Z1)*, Z·guard |
| P | The pendulum sling | 3 | **1.1** | Whole bundle — spec is [PENDULUM_SPEC.md](PENDULUM_SPEC.md) |
| W | Landscape challenge escalation | 2 | 1.1 (with P) | W1 progressive terrain difficulty, W·guard |
| Q | The deep Hollows | 3 | 1.1 core + 1.2 caves | Whole bundle — spec is [HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md) |

**One owner decision is open:** V11 — whether to surface the decoy MERCY earlier
(today it needs a completed run + the secret finale + enough black boxes, so most
players never see it).

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
| Y | 1.01 release-fix defects | Stability + render/telegraphing fixes |
| DS | Design-system conformance | Token layer; colourblind mode made real (**1.0**) |
| X | Onboarding & new-player experience | Trainee sector, guided pauses, hint bank, in-app rating (**1.01**) |

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

## Bundle P — The pendulum sling (update 1.1)

**Why:** The Oids/Thrust pendulum homage, decoupled from Scion pickup (owner
direction, July 2026): each Hollow hides one towable relic of Glycon's
(THE FIRST CALL, THE LAST HEART, THE MASK), slung beneath the ship on real
pendulum physics and carried out through roof and darkness to MERCY —
patient transport as a flight skill. **Locked (owner decision, July 2026):
ships as the free 1.1 content update, "1.1 — THE PENDULUM", not in the
launch build.** Full spec, rationale and draft copy:
[PENDULUM_SPEC.md](PENDULUM_SPEC.md). **Priority: first post-launch.
Dependencies: all shipped (I, J, K, H, D, F1); the P10 feel pass needs the
E wrapper on a real device.**

- [ ] **P·impl. Implement per the spec checklist** — work through
  PENDULUM_SPEC.md §7, items P1–P9, checking off there (one source of
  truth; don't mirror the list here).
- [ ] **P·feel. P10 device feel pass** — `SLING_L`, damping, the 30% tug;
  the three handling characters must feel different before they feel
  hard. Do alongside F3.
- [ ] **P·ship. Release 1.1** — What's-New copy per the E7 trademark
  tiers (generic in-store, named homage on the site), review-refresh
  prompt consideration, and the $2.99 → $4.99 price move case if launch
  priced low (O1).

---

## Bundle Q — The deep Hollows (update 1.2)

**Why:** The lifts stay hard to find (a virtue, named by the owner) — the
aid is priced instead: René Laennec joins as a twelfth famous Scion hidden
inside a new Hollow, found by his knocking. AUSCULTATION makes unfound
lift pads ring when near (the Radiosense pattern applied to lifts); his
chart unlocks the ROTATION CHART (return travel to cleared sectors,
cached as-left); three new caves with new discoveries (THE WARD, THE
MINT, THE LISTENING POST). Full spec:
[HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md).

**Split by release (owner decision, July 2026).** The owner asked for fly-back
sooner (originally raised as a "1.01 fix"; see V1). Rather than break Q's
in-game unlock, Bundle Q is split across two releases:
- **Ships in 1.1 (with Bundle P):** René Laennec + AUSCULTATION + the
  **ROTATION CHART** (fly-back to cleared sectors, cached as-left) — sequenced
  *after* the pendulum work so the level cache lands on a settled base.
- **Ships in 1.2 ("THE DEEP HOLLOWS"):** the three new caves (THE WARD, THE
  MINT, THE LISTENING POST) and their discoveries.

**Priority: the 1.1 core rides with P; the caves are second post-launch (1.2).
Dependencies: P shipped/stable before the ROTATION CHART cache (still true even
within 1.1); J, K, I, M, A all shipped.**

- [ ] **Q·impl. Implement per the spec checklist** — work through
  HOLLOWS_EXPANSION_SPEC.md §9, items Q1–Q10, checking off there. **Tag each
  item to its release per the split above (Laennec/AUSCULTATION/ROTATION CHART
  core → 1.1; the three caves → 1.2) when scheduling.**
- [ ] **Q·guard. Regression gate** — the Q5 level cache touches
  `toBriefing`; the full smoke suite plus the M1 heightmap checksum must
  stay green, and remix/daily must never draw Laennec onto a surface
  sector (Q10 assertions).
- [ ] **Q·ship. Release 1.2** — What's-New copy, same trademark tiers;
  add EVERY HOLLOW HEARD and GENTLE HANDS (P) to the live G3 achievement
  set if Game Center shipped.

---

## Bundle V — 1.01 maintenance & narrative (post-approval owner round)

**Why:** Captured while **1.0 is in App Review (July 2026)**, this is the first
point release — the fixes and narrative beats the owner wants in **1.01** once
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
> `doids_tilt`). Do not resurface it in 1.01 without an explicit reversal.
> User-facing docs (`support.html`, `GAME_DESIGN.md` §5, `STORE_LISTING.md`)
> have been scrubbed of the stale Tilt references in this pass.

- [ ] **V1. Fly back to previous zones (rescue those left behind) — RESOLVED
  to 1.1, tracked under Bundle Q.** The owner's request is the **ROTATION
  CHART**: return travel to cleared sectors (cached as-left), **unlocked
  in-game** by rescuing René Laennec (AUSCULTATION). **Decision (owner, July
  2026): keep the in-game unlock, and split Bundle Q so this core ships in
  1.1** — sequenced *after* the pendulum (P) so the level cache lands on a
  settled base — while Q's three new caves stay in 1.2. Not a 1.01 item; listed
  here only because it was raised as a "1.01 fix". See Bundle Q's split note.
  Code anchors: HOLLOWS_EXPANSION_SPEC.md §Q5; the round-trip must reuse the
  checkpoint serialization (`doids_run`, `__doids.go(n)`).
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
- [ ] **V11. (Candidate) Decoy MERCY reachability.** Owner question, July
  2026: the counterfeit MERCY is currently gated behind **`veteran` +
  reaching the secret finale + `blackboxCount >= TRIANGULATE_N`**
  (`js/world.js:829`, `js/update.js:695`), so most players never see it.
  Decide whether 1.01 should surface it earlier / more reliably, or leave it as
  a deep secret. Owner decision — logged so it isn't lost.
- [ ] **V12. The counterfeit MERCY should be a *surprise*, not a signposted
  quiz (owner playtest, late July 2026).** Today the finale over-explains the
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
  pad-widening. V1 return-travel is a 1.1 item (Bundle Q), not part of 1.01.)*
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
- [ ] **V14. The V2 scan-landing invariant does not hold for every REMIX seed.**
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
- [ ] **V15. "The bay is a mouth" needs to land as a beat, not a banner
  (owner note, July 2026).** The decoy's reveal — that the counterfeit
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
- [ ] **V16. Shooting the Solace should take a beside-her turret down with
  her.** Firing on the Solace sinks the ridge over her buried hull into a
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
- [ ] **V17. Returning the Solace's pulse should re-trigger the full hull
  reveal.** V3's sonar sweep (`beacon.sonarT = SONAR_DUR`, `SONAR_DUR` at
  `js/update.js:31`) currently fires on the first landing-beside reveal
  (`js/update.js:2460`) and on every 41-second Static beat
  (`js/update.js:80`), but **not** at the moment the player actually answers
  her: `resolveBeacon("answered")` (`js/update.js:2487`, the non-`"fire"`
  branch from `:2507`) only spawns particles and a blip and fades to
  epilogue — it never touches `sonarT`. Add `b.sonarT = SONAR_DUR;` (or a
  bigger, one-off flash variant) to that branch so the whole submerged hull
  lights up the instant her pulse is returned — the payoff moment, not just
  the ambient tell. Code anchor: `resolveBeacon` (`js/update.js:2487`).
- [ ] **V18. First field resupply deserves a beat, not just a fuel bar.** The
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
- [ ] **V19. Occasional weird ship spin on landing (assist mode).** Reported:
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
- [ ] **V20. Dune scenery overspills unnaturally on one level.** Owner
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
- [ ] **V·ship. Release 1.01.** What's-New copy; confirm no new App Review
  surface (no new data collection, no new entitlements). Update
  [CHANGELOG.md](CHANGELOG.md).

## Bundle W — Landscape challenge escalation (update 1.1, with P)

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

## Bundle Z — REMIX replay modifiers: variable gravity (post-launch feature)

**Why:** Owner idea (late July 2026) — add **variable gravity to REMIX** for
replay variety. Gravity is a single global (`GRAV = 46`, `js/world.js:149`), so a
per-run scale is cheap to *apply*; the real work is **fairness tuning**, not
plumbing. **Priority: pulled forward to 1.01 (owner decision, late July 2026; was
1.1). The Z2 fairness re-tune gates it — this is *not* a lean-1.0 "low-risk win,"
so it rides 1.01, not the launch binary, unless the re-tune proves trivial.
Dependencies: Bundle M (REMIX/DAILY seed plumbing — shipped).**

- [ ] **Z1. Variable-gravity modifier.** Scale `GRAV` by a per-run factor drawn
  from `runSeed` (e.g. ~0.7×–1.4×), **REMIX / DAILY only — never seed 0**, so the
  M1 golden heightmap and the authored campaign feel stay untouched. Surface it
  in the briefing prefix ("REMIX ROTATION // heavy world" / "thin gravity"). Code
  anchors: `GRAV` (`js/world.js:149`) → a scaled read; the remix/daily plumbing
  (Bundle M, `doids_daily`); the briefing prefix in `BRIEFS`.
- [ ] **Z2. Fairness re-tune under changed gravity.** Gravity touches more than
  the ship — safe-landing descent thresholds, fuel economy, oid fall
  (`js/update.js:1048`), particles (`:433`), the resupply-drone airframe
  (`:1909`). Landing-safe speed and the ASSIST bands must scale with `GRAV` or
  heavy runs are unfair. **Design + playtest pass**, plus a smoke assertion that a
  landing safe at 1× stays classifiable across the whole gravity range. Respects
  the V2 scan-landing fairness invariant.
- [ ] **Z·guard. Regression gate.** M1 checksum + full smoke green (**seed 0
  unaffected**); add coverage for the gravity-scale bounds and the landing-safety
  re-tune.

---

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
      1.01 = X2/X4/X5/X6 (trainee level, guided-pause overlay, hint-card bank,
             StoreKit in-app rating prompt — moved up from 1.1 since 1.01 is
             now the first post-launch build)
           + Y3–Y7 (wreck occlusion, counterfeit tell, lift pad, copy fixes)
           + V (Solace reveal; scan fairness; heard-scan parry; V12 fake-MERCY reveal)
           + Z (REMIX variable gravity — after the Z2 fairness re-tune)
      then the feature updates (all free):
      1.1 = P (THE PENDULUM) → then Q-core (Laennec + ROTATION CHART / fly-back) + W (landscape challenge)
      1.2 = Q-caves (THE DEEP HOLLOWS: Ward / Mint / Listening Post)
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
**P and Q are specced and locked** (owner decision, July 2026) as the free
1.1 and 1.2 post-launch updates — see their bundle sections above and
[PENDULUM_SPEC.md](PENDULUM_SPEC.md) /
[HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md).
**Bundle V is the 1.01 plan**, captured while 1.0 is in App Review: the
Solace sister-ship reveal (named ship, sonar hull pulse on the 41-s clock),
Scion scan-jeopardy fairness, a playable "heard" sonic-wave parry,
post-completion title/intro/campaign variants, and the record that **tilt is
dropped from the forward plan** (dormant scaffolding only). Fly-back to cleared
sectors (the owner's other "1.01" ask) was **resolved to 1.1**: keep Bundle Q's
in-game Laennec unlock and split its **ROTATION CHART** core forward to ship
with Bundle P (after the pendulum), leaving Q's three caves in 1.2. **Bundle W**
(landscape challenge) also **ships in 1.1 with P** (owner decision). One owner
decision remains open — whether to surface the decoy MERCY earlier (V11).
**The late-July 2026 owner-playtest round adds two more 1.01 bundles: X**
(onboarding — an optional beginner's guide, a guided trainee "Level 0", a
first-play "played thrust games?" fork, and a post-death hint-card bank; the top
fix for the "too-steep learning curve" note) **and Y** (release-fix defects: the
disappearing-landscape and blank-screen stability bugs after long iOS
backgrounding, Curie Fields wreck occlusion + angled motherships, the
Avicenna-gated counterfeit tell, and the above-ground lift-pad marker). **Owner
decision (late July 2026): pull the low-risk wins into the 1.0 launch build —
Y1/Y2 (stability), X1 (guide) and X3 (fork) — and keep the heavier subsystems
(X2/X4/X5, Y3–Y7, V + the V12 fake-MERCY reveal) and Z (variable gravity, after
its fairness re-tune) for 1.01.**
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
(b) as a possible **1.2+** feature; real-time stays parked unless the
no-backend constraint is deliberately reopened.
Formerly-listed candidates now promoted to locked bundles: ~~the pendulum
sling~~ → **Bundle P (1.1)**; ~~the deep Hollows / a fourth Hollow~~ →
**Bundle Q (1.2)**.
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
