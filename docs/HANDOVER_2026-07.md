# Handover — support page, Tilt removal, custom domain & the 1.01/1.1 plan

*July 2026. Snapshot for the next developer picking up Hollow Oath. The forward
plan of record is [APP_STORE_ROADMAP.md](APP_STORE_ROADMAP.md); this doc is the
"where things stand right now and what to do next" summary that goes with the
`claude/support-page-1-01-release-yp9h3n` branch.*

---

## 1. This branch — merge it to publish the support-page fixes

Branch `claude/support-page-1-01-release-yp9h3n` is **docs + `support.html` only**
— no game code. It:

- removed the stale **Tilt** references from `support.html`, `GAME_DESIGN.md`,
  `STORE_LISTING.md` and struck it through in `ROADMAP.md` (Tilt is dropped from
  the plan; see §6);
- removed the GitHub **Issues** link from `support.html` (it exposed the
  `burners70` handle) — support is now **email-only**;
- captured the whole 1.01 fix list as **Bundle V** and the landscape idea as
  **Bundle W** in `APP_STORE_ROADMAP.md`, and recorded the fly-back / version /
  domain decisions (see §3–§4);
- flipped the live-site URLs to the new custom domain (see §2).

**Action:** open a PR → review → **merge to `main`**. Pages deploys from `main`,
so merging publishes the corrected support page at
`https://hollow-oath.com/support.html`. It does **not** touch gameplay or take
the web game down (that is roadmap O7, a separate decision).

## 2. Custom domain — live; one external step remains

`hollow-oath.com` is registered (Cloudflare), DNS-verified, and serving over
**HTTPS (enforced)**. Cloudflare DNS records are **DNS-only / grey cloud** — a
`CNAME` for the apex `@` and for `www`, both → `burners70.github.io`. **Leave
them grey** (proxied/orange cloud blocks GitHub's cert and can cause an HTTPS
redirect loop).

- With an apex domain the site serves at the **root**
  (`https://hollow-oath.com/support.html`), not under `/Hollow-Oath/`. The old
  `burners70.github.io` path still redirects.
- **Action (App Store Connect):** set the three URL fields — **Support**,
  **Marketing**, **Privacy** — to the `hollow-oath.com` URLs listed in
  [STORE_LISTING.md](STORE_LISTING.md).

## 3. Build the 1.01 release → Bundle V (`APP_STORE_ROADMAP.md`)

All game code; every item there carries code anchors and design-pass flags.

- **V2** Scan-jeopardy fairness — a running Scion should stop fleeing and
  **approach**; generation must guarantee a reachable landing spot from which a
  scan completes before it arrives (add it as an invariant/assertion).
- **V3** The **Solace** reveal — announce it as sister ship **AMS Solace**; a
  sonar-style hull pulse on scan completion and on every 41-second beat, the
  submerged part dimmer. *A basic SOLACE reveal already exists in code (commit
  `14cece6`); V3 expands it.*
- **V4** Fix the illegible pre-scan Solace label (size/contrast).
- **V5** Seed the Solace lightly in the story panels (Mercy = second wave with
  AMS X & Y; initial wave included the X, the Solace, the Y).
- **V6** Make the "heard" scan **playable** — a visible sonic wave you parry
  back (mirror the shield parry) to flatten the corrupting signal.
- **V7** Post-completion title + run-start framing (a Hollow teaser; button-copy
  options in the bundle).
- **V8** Adapted second-run intro; **V9** sound-led level intros
  ("Is there a sound coming from beneath the ground?").
- **V10** Post-win campaign variant — same landscape, different Scion/Vector
  placement, more guns, higher Vector proportion.
- **Open owner decision — V11:** whether to surface the **decoy MERCY** earlier.
  Today it needs *a completed run (veteran) + reaching the secret finale +
  enough black boxes to triangulate*, so most players never see it
  (`js/world.js:829`, `js/update.js:695`).

## 4. Feature updates (post-launch — all specced in the roadmap)

- **1.1** = Bundle **P** (the pendulum sling) → then **Q-core** (Laennec +
  AUSCULTATION + the **ROTATION CHART**, i.e. fly-back to cleared sectors,
  sequenced *after* P) + Bundle **W** (landscape challenge). The in-game unlock
  for fly-back is deliberately **kept**.
- **1.2** = Bundle **Q** remaining caves (THE WARD / THE MINT / THE LISTENING
  POST). The split is mirrored in [HOLLOWS_EXPANSION_SPEC.md](HOLLOWS_EXPANSION_SPEC.md).

## 5. House rules (from [CLAUDE.md](../CLAUDE.md))

- **No build step.** Plain ordered `<script>` tags, single global scope, **not**
  ES modules. The game must stay runnable by opening `index.html`.
- Keep the `doids_` localStorage prefix on new keys.
- **`main` = live release** (Pages + the domain). Branch for everything else.
- Run the Playwright smoke suite before any PR:
  `cd tests && npm ci && npx playwright test` (Chromium is pre-installed — don't
  run `playwright install`).
- Any player-facing string change must be mirrored into
  [COPY_DECK.md](COPY_DECK.md) in the same PR.
- `app/sync.sh` mirrors the web files into the Capacitor iOS build — flag
  anything touching `window.Capacitor`.

## 6. Tilt — context so it isn't re-added by mistake

Dropped from the roadmap (owner: "not really any good for this game"). The
gyro/tilt code is left **dormant** in `js/input.js` (`tilt` / `enableGyro` /
`toggleTilt`, `doids_tilt` key) and is not surfaced in Settings. Do **not**
resurface it without an explicit owner reversal. (The `sc.tilt` references in
`render.js` / `update.js` / `world.js` are unrelated scenery/ship rotation —
leave them alone.)
