# Hollow Oath — App Store Listing Draft (Bundle O)

*Working draft for O1 (pricing), O2 (metadata/copy), O5 (privacy & support).
O3/O4/O6 need a device/App Store Connect and are summarized at the bottom
as a prep checklist, not drafted here.*

---

## O1 — Pricing

**Recommendation: $2.99 at launch.**

The roadmap's own gate was "$4.99 defensible once M (remix/daily) and N
(counterfeit MERCY) are in" — and per the Status line, **H–N are all shipped**.
So the $4.99 case is now unlocked on paper. Here's the honest case against
jumping to it anyway:

- **Per-run length is short.** Seven sectors, three optional Hollows, one of
  two endings — a clean run is a single sitting, not a multi-hour campaign.
  Remix mode and the daily seed add *replay reason*, not *content volume*.
  Reviewers and buyers read "hours of content" into anything above $3.99;
  this game will disappoint that expectation at $4.99 even though it's well
  made.
- **No IAP, no ads, no live-service loop.** That's a real strength (say so
  in the description), but it also means there's no way to walk price up
  post-launch the way a freemium title would — the sticker price is the
  entire monetization story, forever, for this version.
- **You have zero review history.** A $2.99 debut with strong reviews gives
  you room to raise the price later (a Q update — the deep Hollows — is a
  legitimate, honest reason for a price bump: "1.2 adds new content"). Coming
  down from $4.99 after weak reviews is much harder than going up from $2.99
  after good ones.
- **$2.99 matches the positioning you already want to use**: "complete game,
  no data collected, no IAP, no ads." That's a premium-indie pitch better
  served by an impulse-buy price than a $4.99 ask, which invites more
  scrutiny of length/value before purchase.

**When $4.99 becomes the right call:** after Bundle Q (deep Hollows) ships as
1.1/1.2, or after you have enough reviews/ratings that "short but excellent"
is a visible signal on the page (a 4.7★ with reviews saying "wish it were
longer" sells a $4.99 sequel-price better than a 0-review listing does).

**No IAP, no ads** either way — that's a genuine differentiator worth
protecting; don't let a future "just add a tip jar" conversation erode it
without a real reason.

---

## O2 — Metadata & copy

### Name
**Hollow Oath**

### Subtitle (≤30 chars)
Two options, both under the limit:

- `A gravity rescue, with a heartbeat` (34 — **too long, cut to:**)
- **`A rescue flight with a heartbeat`** (33 — still over; use:)
- **`Fly gentle. Trust nothing.`** (26 chars) — leads with the mechanic *and*
  the theme in one line.
- Alt: **`Land soft. Trust less.`** (22 chars) — shorter, punchier.

Recommendation: **`Fly gentle. Trust nothing.`**

### Description — opening (decided: moody/literary)

> Something calls every 41 seconds. It has been calling since AMS MERCY went
> dark over the outer systems, and the medics who answer it stop being
> entirely themselves.
>
> You fly the rescue dart. Thrust against gravity, land soft beside the
> stranded, and get them home before the Static reaches them first. Some of
> what you find on the ground wants to be found. Not all of it should be
> trusted.

**Body copy (follows the opening above):**

> Hollow Oath is a 2D gravity-thrust rescue game: fly a small dart over
> hand-seeded terrain, land gently near stranded medical androids, and
> ferry them back to the mothership — while the game quietly teaches you
> to distrust what you rescue, and later, what you see on the ground.
>
> - **Real gravity, real consequence.** No auto-land, no aim-assist crutch —
>   just thrust, weight, and a landing you have to earn.
> - **A heartbeat you can feel.** Haptics tuned to the game's own pulse, not
>   generic buzzes.
> - **Seven sectors, three hidden Hollows.** Optional caves reward the
>   curious and the careful with a second layer of story.
> - **Two endings, one oath.** *Primum non nocere* — first, do no harm — is
>   scored, not just quoted.
> - **Remix mode & a daily seed** for runs that don't play the same way twice.
> - **Complete game.** No IAP, no ads, no data collected. Pay once, keep it.

**Nostalgia paragraph (generic terms only — no trademarked titles):**

> If you grew up steering a lander through cramped 16-bit caves, fighting
> gravity one careful thrust at a time — trying not to crash, trying not to
> lose the cargo you came for — this is built in that lineage, with its own
> story, its own world, and a reason to care who you're actually rescuing.

### Keywords
`lander, gravity, thrust, rescue, retro, arcade, 16-bit, cave, story, sci-fi,
physics, space, pilot`

(All generic genre/mechanic terms. No third-party game names — those live
only on the store-linked homepage/README per O2's Apple 2.3.7 note.)

---

## O5 — Privacy policy & support

Drafted as a standalone page: **`privacy.html`** (see repo root), meant to be
linked from App Store Connect's Privacy Policy URL field and hosted on the
existing GitHub Pages site at
`https://burners70.github.io/Hollow-Oath/privacy.html`.

**Support contact:** point App Store Connect's support URL at the same page's
support section, or a GitHub Issues link if you'd rather route support there —
flag which one you want; `privacy.html` currently offers both as options and
needs one picked before submission.

---

## O3/O4/O6 — Prep checklist (not drafted here; needs device/App Store Connect)

- **O3 Age rating questionnaire.** Expect **9+** (infrequent mild fantasy
  violence — the player can shoot medics as a malpractice mechanic). Answer
  the violence questions honestly; keep the *description's* framing on
  consequence, not carnage, so the rating and the copy agree.
- **O4 Screenshots & preview video.** Need 6.7" and 6.1" landscape sets: title
  screen, a landing beside a waving Scion, MERCY docking, a dark-sector lamp
  shot, a Hollows shrine, the ECG-arrhythmia moment. Plus a 15–30s preview
  video of one full rescue loop.
  Two capture paths, split by whether the shot depends on procedural terrain:
  - **Fully automated (static screens — title, settings, codex):**
    `app/fastlane/Snapfile` + `app/HollowOathUITests/ScreenshotUITests.swift`
    drive fastlane `snapshot` across both device sizes with no manual steps
    per run, once a UI Test target is added in Xcode (one-time; see comments
    in both files). Not yet run against a live simulator — treat the
    navigation/timing in the test as a first pass to calibrate.
  - **Manual (in-flight/procedural shots — landing, docking, dark-sector,
    Hollows shrine, ECG):** `app/capture-screenshots.sh` walks through this
    subset interactively (boots both sizes, prompts you to navigate,
    captures on Enter). These aren't reproducible under automation without
    a fixed run seed to guarantee the same terrain/scene each time.

  Gyro/tilt and haptics don't work in the simulator either way — if a shot
  needs tilt input to reach, grab that one from a real device instead
  (`xcrun simctl io booted screenshot` works the same way over a wired
  device). The preview video still needs a real device/QuickTime screen
  recording.
- **O6 Submission dry run.** TestFlight internal build → full compatibility
  matrix (Bundle E8) → external TestFlight round (5–10 players, watch where
  they die/quit) → submit. Budget one rejection cycle — 4.2 ("Minimum
  Functionality") is the likeliest challenge; the response is the
  native-features list (haptics, Game Center, iCloud sync).
