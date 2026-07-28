# Hollow Oath — Press Kit

Everything needed to write about or feature Hollow Oath: the facts, the
pitch, ready-to-use boilerplate, and where the actual image/video assets
live in this repo. This is the *external-facing* companion to
[STORE_LISTING.md](STORE_LISTING.md) (App Store Connect metadata) and
[COPY_DECK.md](COPY_DECK.md) (in-game text) — read those for the
source-of-truth copy this kit quotes from.

---

## Quick facts

| | |
|---|---|
| **Title** | Hollow Oath |
| **Formerly** | "DOIDS" (renamed pre-launch — see [CHANGELOG.md](CHANGELOG.md)) |
| **Platform** | iOS (iPhone), landscape-only, iOS 16+ |
| **Status** | Pre-launch — in TestFlight, no ship date set yet |
| **Price** | $2.99 planned at launch (see STORE_LISTING.md §O1) |
| **Business model** | Complete game. No IAP, no ads, no data collected. |
| **Genre** | 2D gravity-thrust rescue / arcade lander, story-driven |
| **Website** | https://hollow-oath.com/ |
| **Support** | hollowoath.support@gmail.com |
| **Developer / public credit** | *(open — decide how you want to be credited publicly; the iOS bundle ID is `com.burners70.hollowoath` but the `burners70` handle is deliberately kept off anything players see, per STORE_LISTING.md §O5)* |

## One-line pitch

**Fight gravity. And deception.**

## Elevator pitch

> Something calls every 41 seconds. It has been calling since AMS MERCY went
> dark over the outer systems, and the medics who answer it stop being
> entirely themselves.
>
> You fly the rescue dart. Thrust against gravity, land soft beside the
> stranded, and get them home before the Static reaches them. Some of what
> you find on the ground wants to be found. Not all of it should be trusted.

Hollow Oath is a 2D gravity-thrust rescue game: fly a small dart over hostile
terrain, land gently near stranded medical androids, and ferry them back to
the mothership — while the game quietly teaches you to distrust what you
rescue, and later, what you see on the ground.

*(Verbatim from the App Store description draft — STORE_LISTING.md §O2.)*

## Key features

- **Real gravity, real consequence.** No auto-land, no aim-assist crutch —
  just thrust, weight, and a landing you have to earn.
- **A heartbeat you can feel.** Haptics tuned to the game's own pulse, not
  generic buzzes — hull health is a live ECG trace.
- **Seven sectors, three hidden Hollows.** Optional caves reward the curious
  and the careful with a second layer of story.
- **Two endings, one oath.** *Primum non nocere* — first, do no harm — is
  scored, not just quoted.
- **Remix mode & a daily seed** for runs that don't play the same way twice.
- **Complete game.** No IAP, no ads, no data collected. Pay once, keep it.

## The world, in brief (non-spoiler)

Something has been calling from the outer systems since the hospital ship
AMS MERCY went dark. You fly the rescue dart sent to answer it — landing
beside stranded medical androids ("Scions") and ferrying them home before a
41-second countdown, the Static, catches up with them. Not everything you
rescue is what it appears to be, and the game increasingly asks you to
notice the difference. The title's two halves — a promise kept, and
something built empty and dressed to be carried home — meet at the ending.
(Full canon: [GAME_DESIGN.md](GAME_DESIGN.md); the rename/narrative
rationale: [HOLLOW_OATH_BRIEF.md](HOLLOW_OATH_BRIEF.md).)

## Lineage — what inspired it

> If you grew up steering a lander through cramped 16-bit caves, fighting
> gravity one careful thrust at a time — trying not to crash, trying not to
> lose the cargo you came for — this is built in that lineage, with its own
> story, its own world, and a reason to care who you're actually rescuing.

Hollow Oath is a spiritual successor to *Oids* (FTL Games, Atari ST, 1987),
*Thrust*, and *Gravitar*. All code, art, story and names are original; this
is an unaffiliated fan homage to a genre, not a remake of any of them.

## Achievements (Game Center)

Nine launch achievements; two are hidden until earned (marked below). Full
detail and artwork notes: [GAMECENTER_ACHIEVEMENTS.md](GAMECENTER_ACHIEVEMENTS.md).

| Name | Hidden | Earned for |
|---|---|---|
| OATH KEEPER | No | Completed the game without firing a shot. |
| HOLLOW KEEPER | Yes | Answered the call — every shot spent on secrets, never in anger. |
| THE ONE WHO ANSWERED | No | Reached the beacon and answered the call. |
| SECTOR WARDEN | No | Silenced the Static by fire. |
| GLYCON UNMASKED | Yes | Unmasked the puppet god — all three shrines found in a single rotation. |
| ARCHIVIST | No | Recovered all 14 log fragments in a single run. |
| SPOTLESS ROTATION | No | Completed the campaign without losing a single Scion. |
| FIRST DO NO HARM | No | Cleared a sector without firing a shot. |
| THE FULL CODEX | No | Recovered every famous mind, across all your rotations. |

## Boilerplate ("About Hollow Oath")

> Hollow Oath is a 2D gravity-rescue game for iPhone: thrust a small dart
> through hostile terrain, land gently beside the stranded, and get them
> home before the Static reaches them — before some of what you rescue stops
> being entirely itself. Built in the lineage of 16-bit gravity-lander
> classics like *Oids*, *Thrust* and *Gravitar*, with its own original story,
> art and world. A complete game: no ads, no in-app purchases, no data
> collected. $2.99 on the App Store.

## Assets available in this repo

| What | Where |
|---|---|
| App icon (512×512) | `icon-512.png` (repo root) |
| App icon (192×192) | `icon-192.png` (repo root) |
| Apple touch icon | `apple-touch-icon.png` (repo root) |
| Screenshots — iPhone 17 (8 shots) | `assets/marketing/Screenshots/iPhone-17/` |
| Screenshots — iPhone 17 Pro Max (8 shots) | `assets/marketing/Screenshots/iPhone-17-Pro-Max/` |
| Achievement art (9 PNGs + SVG sources) | `assets/gamecenter/achievements/` |
| Demo video | `assets/marketing/Video/demo-preview.mp4` |

The 8 screenshots (same content, shot at both device sizes) are: title
screen, log scan & Scion, MERCY docking, dark-sector lamp, a Hollows shrine,
contaminant-aboard warning, "someone extraordinary is aboard" reveal, and
the transfusion/refuel moment. The 5-shot subset used on the marketing site
(`about.html`) is title, "someone extraordinary," MERCY docking, log scan,
and the shrine.

The demo video (`assets/marketing/Video/demo-preview.mp4`) is separate from
the O4 App Store preview video requirement in STORE_LISTING.md — that one
still needs a real-device capture per the checklist there; this file is the
press-kit copy.

---

## Using this with a claude.ai Project

Drop this file's contents, plus the icon and however many screenshots you
want, straight into the Project's knowledge (or attach them to the chat) —
that gives the Project the same facts and real art this kit is built from,
without re-typing anything.
