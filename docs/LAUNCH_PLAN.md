# Hollow Oath: Launch Marketing Plan (Low/No-Cost)

*This sits alongside `PRESS_KIT.md` and `APP_STORE_ROADMAP.md`. It covers
the marketing layer only, not the shipping checklist, which is already
handled in Bundle O. Budget: up to £50. Time: 3-5 hours/week.*

## Where things actually stand

Reading the repo docs rather than guessing: Bundle O is essentially done.
Pricing is locked at $2.99/£2.99, the App Store Connect metadata is entered
(name, subtitle, description, and a keyword set that deliberately avoids
"Oids"/"Thrust"/"Gravitar" in the metadata field itself, per Apple guideline
2.3.7 on trademarks - the named homage lives on the website and README
instead, which is what search engines index). Screenshots and preview video
are captured and uploaded, privacy/support pages are live, age rating is
done, and the app is in App Store review with no fixed date yet. The old
free web build has been correctly taken down so it doesn't compete with the
paid app. None of that needs anything from me.

**One thing from your own roadmap worth flagging here because it's easy to
lose in a review queue wait:** `APP_STORE_ROADMAP.md` O9 is still open - the
"Coming soon" CTA on the marketing site is a dead `<span>`, not a link. It
needs to become a real link to the App Store product page the day the app
goes live, or the site keeps saying "coming soon" after it isn't. Small job,
easy to forget in the excitement of launch day.

## What this plan adds

Everything below is the marketing layer that sits on top of an already
well-prepared submission: who hears about it, when, and for how much.

### Phase 0: Now, while still in review

- [ ] **Submit the App Store Connect Featuring Nomination.** This is free,
  and Apple wants 2 weeks to 3 months' lead time, so it's worth doing before
  a launch date exists, using a date range rather than a fixed day. Nominate
  as "App Launch," and lean on exactly the things Apple's editorial team is
  known to weight: visual craft (the neon-glow HUD is genuinely distinctive),
  a strong personal story (solo-built, real gravity physics, no IAP/ads), and
  a clear identity. No guarantee of a feature, but zero cost to try, and it
  can't help retroactively once the game's already been out a while.
- [ ] **Check the in-app rating prompt exists.** If `requestReview()`
  (StoreKit) isn't already wired in somewhere sensible - after a clean
  ending, a new high score - that's the cheapest possible source of organic
  ratings once the app is live. Worth a quick look before submission closes
  the door on this build.
- [ ] **Draft the press/community list and pitch email** (see below) so it's
  ready to send the moment the app goes live, not written from scratch that
  day.
- [ ] **Set up an Apple Ads (Apple Search Ads) Basic account now.** No
  minimum spend, no commitment, and new accounts often get a starter credit.
  Set it up but don't switch spending on until launch day.

### Phase 1: Launch week

- [ ] **Flip the marketing site CTA** (O9, above) the moment the app is live.
- [ ] **Send the press kit** to the outlets and communities below, with the
  App Store link and a promo code each. Note: recipients who redeem a promo
  code can't leave an App Store rating themselves, so this drives written
  coverage, not star ratings - budget separately for the rating side via the
  in-app prompt and your own network buying it outright.
- [ ] **Post it yourself** to the communities where self-posting is normal
  and welcomed (listed below) rather than waiting only on press pickup.
- [ ] **Turn on Apple Ads Basic** at a small daily budget (see budget table).
  No minimum commitment, pause any time.
- [ ] **Post a launch clip** - the rescue loop, the ECG heartbeat detail, one
  of the "someone extraordinary is aboard" reveals - to whatever social you
  use personally. The haptic/ECG hook is unusual enough to be worth a short
  video on its own.

### Phase 2: First 4-6 weeks

- [ ] **Follow up once** with any press contact who didn't respond in week
  one. Once, not repeatedly.
- [ ] **Watch Apple Ads performance** and adjust the daily budget or pause it
  if cost-per-install looks poor - there's no penalty for turning it off.
- [ ] **Use the 1.1 (pendulum) and later 1.2 (Hollows expansion) updates as
  second and third press/featuring moments.** A free content update is a
  legitimate, low-cost reason to pitch press and re-nominate for featuring a
  second time, rather than one launch-day shot and then silence.

## Audience sequencing: lead with the people who'll actually get it first

Your own TestFlight round found the learning curve is the loudest complaint
from players who've never played a thrust/gravity game, and the fix for that
(Bundle X onboarding) is deliberately staged for 1.01, not 1.0. That's a real
signal for marketing sequencing, not just a design note: the 1.0 build will
land best with people who already have Thrust/Gravitar/Lunar Lander muscle
memory, and less well with a cold general audience who bounce off the
controls before the game gets good. Practically, that means:

- Weight outreach in launch week toward the retro-lander-literate audience
  (below), where the reaction to "gravity, real physics, no aim-assist" is
  "finally" rather than "why won't it do what I want."
- Hold off scaling any paid acquisition beyond the small Apple Ads test until
  1.01 ships, rather than spending harder into an audience likely to bounce
  off the same learning curve your testers hit.

## Press and community targets

**Retro/lander-literate (primary, launch week):**
- AtariAge forums - long-running Atari/ST community, a natural home for a
  stated Oids/Thrust/Gravitar successor.
- Retro Gamer (magazine/site) - worth a pitch given the explicit lineage.
- r/iOSGaming, r/AppStore - active subreddits for new iOS releases.

**Self-post communities (do these yourself, don't wait for press):**
- TouchArcade's own forums are still active for developer self-posts as of
  2026 (its formal editorial reviews are a less certain bet after its 2024
  restructuring, so treat that as a maybe, not a plan). A "New game" thread
  there costs nothing but time.
- TIGSource forums - devlog-style post works even without a playable web
  demo, since you can talk about the build and link straight to the App
  Store.

**Free listing/launch platforms:**
- Product Hunt - free, and a same-day launch post costs only the time to
  write it.
- The App Store Connect Featuring Nomination above.

I've deliberately left off anywhere I couldn't verify still operates the way
it used to (mobile game journalism has had a rough few years) - better to
have a shorter list you can act on than a longer one with dead ends.

## Budget: up to £50

| Item | Spend | Notes |
|---|---|---|
| Apple Ads Basic, launch week | ~£35-45 | No minimum; start around £4-5/day for 7-10 days, pause any time. New accounts often get a starter credit on top. |
| Buffer | ~£5-15 | Keep spare rather than pre-allocating - useful if a small paid newsletter placement looks worthwhile once you see what press responds. |

Nothing else costs money: the press kit, screenshots, video, and site are
already built; promo codes and the Featuring Nomination are free; the
communities above cost time, not cash.

## Time: 3-5 hours/week

- **Pre-launch:** ~2 hours on the Featuring Nomination, ~1 hour confirming
  the review prompt, ~2 hours building the press/community list and drafting
  the pitch once (reusable for all recipients with light customisation).
- **Launch week:** ~1 hour sending press kits and promo codes, ~1 hour on
  self-posts, ~30 minutes turning on Apple Ads, ~1 hour on the launch clip.
- **Ongoing:** ~1 hour/week checking Ads performance and any press replies;
  this drops close to zero between launch and the 1.1 update.

## Still useful to have from you

- Confirmation of the actual launch date once App Review clears, so the
  Featuring Nomination window and Ads start date can be set precisely rather
  than left open-ended.
- Whether you'd like the actual press pitch email and social launch copy
  drafted next - I can do both once you're ready, in the voice the press kit
  already sets.

## Sources

Facts used above that change over time and were checked rather than assumed:
- [Apple: promoting your apps](https://developer.apple.com/app-store/promote/) - promo code limits (100 per version per platform) and that redeemed copies can't be rated.
- [Apple: request and manage promo codes](https://developer.apple.com/help/app-store-connect/offer-promo-codes/request-and-manage-promo-codes) - promo code mechanics and the no-rating restriction.
- [Apple: nominate your app for featuring](https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/) - the nomination process itself.
- [ShyftUp: how to get featured on the App Store](https://www.shyftup.com/blog/how-to-get-featured-on-the-app-store/) - the 2-week-to-3-month lead time guidance.
- [Sonar: Apple Search Ads for indie developers](https://trysonar.app/blog/apple-search-ads-guide) and [MB Adv: what are Apple Ads](https://www.mbadv.agency/apple-ads/what-are-apple-ads-apple-search-ads) - Basic tier has no minimum spend, $1/day floor, $100 new-account credit.
