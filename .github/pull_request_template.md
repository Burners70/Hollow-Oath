<!-- Keep it short. Delete any line that doesn't apply. -->

## What
<!-- One or two sentences: what this PR changes. -->

## Why
<!-- The reason / the roadmap bundle or issue it addresses. -->

## Release impact
<!-- There is no public web build (Bundle O7) — main isn't auto-published
     anywhere. hollow-oath.com serves the marketing/support/privacy shell only,
     from a separate gh-pages branch. Tick one: -->
- [ ] **Docs/tooling only** — does NOT touch `index.html`/`js`/`css`; no game-code change.
- [ ] **Changes the game** — edits `index.html`/`js`/`css`/assets; becomes the source for the *next* TestFlight/App Store build once someone runs the manual release process (`app/MAC_SETUP.md`) — not an instant live release.
- [ ] **Changes the marketing/support/privacy shell** (`about.html`/`support.html`/`privacy.html`) — these live on the separate `gh-pages` branch; merging here does not publish them (see `docs/APP_STORE_ROADMAP.md` Bundle O8).

## Testing
<!-- How you verified. For game changes, run the smoke suite: cd tests && npm ci && npx playwright test -->
- [ ] Smoke tests pass, or N/A (docs only).
