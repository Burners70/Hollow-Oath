# Hollow Oath — Tester Kit

Intro copy + survey script for the friends-and-family TestFlight round.
Last updated: July 2026.

Contains three things:

1. **TestFlight "What to Test" note** — the short bit Apple shows inside TestFlight
2. **Welcome message** — the fuller note you send by email/text with the invite
3. **Google Form script** — every question, paste-ready, with setup notes

**A note on approach:** the whole kit is built to protect blind play. The single
most valuable thing this round gives you is watching real people meet the game
cold. So the intro deliberately tells them almost nothing about how it works — no
control tutorial, no explanation of the Static clock, no hint that the Hollows
exist. If we explain those, we can't find out whether they're learnable on their
own, which is half your roadmap.

---

## 1. TestFlight "What to Test" note

*(Keep this short. It appears inside TestFlight and sets expectations without
coaching. Under Apple's character limit with room to spare.)*

> Thanks for testing Hollow Oath.
>
> Please just play it like a real game you'd downloaded yourself. Don't read
> anything about it first, and don't worry about doing it "right" — there's no
> wrong way.
>
> One sitting is enough (a run takes a few minutes), but play more if you want to.
> I'm mostly interested in where it grabs you and where it loses you.
>
> When you've had a go — even if you gave up partway — please fill in the short
> survey: https://tinyurl.com/HollowOath
>
> If it crashes or freezes, note what phone you're on and roughly what was
> happening, and put it in the survey. Cheers.

---

## 2. Welcome message (email or text with the invite)

*(Warmer, fuller. Send alongside the TestFlight invite. Still no gameplay
coaching. The informal register is deliberate — these are friends.)*

> Hi,
>
> Thanks for agreeing to be a guinea pig. This is Hollow Oath — a little iPhone
> game I've been building. It's a gravity-and-thrust rescue game: you fly a ship,
> the physics do the rest. That's honestly all you need to know, and I'd rather
> you went in cold than read a manual.
>
> What I'm asking:
>
> - Play it like something you'd downloaded yourself. No script, no homework.
> - One sitting is plenty. A run only takes a few minutes. Play again if you're
>   enjoying it, but no pressure.
> - It's fine — genuinely useful, actually — if you get stuck, confused, or bored
>   and give up. That's exactly the stuff I need to know about. Don't push through
>   to be polite.
> - When you're done (or done-for-now), fill in the survey. It's about ten
>   minutes: https://tinyurl.com/HollowOath
>
> How to get it: you'll get a separate TestFlight invite from Apple. Install the
> free TestFlight app first if you don't have it, then tap the invite.
>
> Don't tell me how it went in person or over text before you've done the survey,
> if you can help it — I'll only bias you, and I want your honest cold read. Say
> anything you like after.
>
> Really appreciate it. Any problems installing, shout.
>
> Cheers, D

---

## 3. Google Form script

Forms won't import a file, so build the form by hand from the script below. It's
ordered and typed so it's a fast copy-paste job.

### Setup notes (do these first)

- **Two sections.** Form settings → make it two sections (Forms calls them
  "sections", shown as separate pages). Section 1 = the quick per-run capture.
  Section 2 = the main survey.
- At the end of Section 1, set the section-navigation to "Continue to next
  section" but add the instruction text (below) telling people they can stop after
  Section 1 if they've only just quit mid-run and want to come back later. This is
  what lets one form serve both the quitters and the finishers.
- **Turn OFF "required" on almost everything.** A required field is a reason to
  abandon the form. Only Q1 and Q2 should be required. Everything else optional —
  partial data from a quitter is worth more than a blank.
- **Collect email: off.** Anonymous gets you honesty. If you need to know who's
  who, add the optional name question at the very end (included below).
- **"Limit to 1 response": OFF** — you want people to be able to submit after each
  run if they play several times.

### SECTION 1 — "After any run (30 seconds)"

*Section description to paste in:*

> Fill this bit in after any go on the game — even a short one, even if you gave
> up. If you're planning to play more later, you can stop after this page and come
> back. If you're done for good, carry on to the next page for a few more
> questions.

**Q1. How far did you get this run?** *(Required. Multiple choice.)*

- I couldn't really get going / gave up in the first minute or two
- Got the hang of flying but quit early on
- Made it partway through
- Got most of the way
- Finished — reached an ending
- Not sure how far I got

**Q2. Did you finish, or stop early?** *(Required. Multiple choice.)*

- Finished it
- Stopped early — I was stuck
- Stopped early — I was confused about what to do
- Stopped early — I got bored
- Stopped early — it was too hard
- Stopped early — something else (tell me below)
- Still playing / plan to come back

**Q3. If you stopped early — what was happening right before you put it down?**
*(Paragraph. Optional.)*
The single most useful thing you can tell me. Where were you, what were you trying
to do, what made you stop?

### SECTION 2 — "The main bit (about 10 minutes)"

*Section description to paste in:*

> Only fill this in once you've properly had a go and you're done playing (for now
> or for good). No right answers — say what you actually thought.

#### Controls & first few minutes

**Q4. In the first few minutes, how did controlling the ship feel?** *(Linear
scale, 1–5. Label 1 "Fighting it the whole time", label 5 "Clicked almost straight
away".)*

**Q5. Landing specifically — how did that feel?** *(Multiple choice.)*

- Never really got the hang of it
- Frustrating at first, then it clicked
- Fiddly but fine
- Felt good almost straight away
- Don't think I ever had to land / not sure

**Q6. Was there a moment it "clicked" — where flying started to feel natural?
Roughly when?** *(Paragraph. Optional.)*

#### The clock

*(Do NOT name the Static in the question — see if they noticed it themselves.)*

**Q7. Did you notice any kind of countdown, timer, or building threat while
playing?** *(Multiple choice.)*

- Yes, and I understood what it meant
- Yes, but I wasn't sure what it was for
- I noticed something but ignored it
- No, didn't notice anything like that
- Not sure

**Q8. If you noticed it — what did you think it was, or what did it make you do?**
*(Paragraph. Optional.)*

#### Trust — the rescued Scions & counterfeits

*(Again, don't over-explain.)*

**Q9. As you played, did you find yourself trusting or doubting the things you
rescued or picked up?** *(Multiple choice.)*

- I trusted everything, didn't think about it
- I started to suspect some things weren't what they seemed
- I felt suspicious but couldn't tell what was real
- It felt random / I couldn't work out the logic
- Didn't notice this being a thing at all

**Q10. Did working out what was real vs. fake feel fair, or arbitrary?** *(Linear
scale, 1–5. Label 1 "Totally arbitrary/guesswork", label 5 "Fair — there were
signs if you looked".)*

**Q11. Anything about the rescued characters or the fakes you want to say?**
*(Paragraph. Optional.)*

#### Hidden areas

*(This question itself will reveal them to people — put it late, and phrase to
catch unprompted discovery.)*

**Q12. Did you come across any hidden or optional areas — places off the main
path?** *(Multiple choice.)*

- Yes, found one or more on my own
- Yes, but only by accident
- I sensed there was something I was missing
- No, didn't find anything like that
- Didn't realise there were any

**Q13. If you found any — how did you find them, and was it satisfying?**
*(Paragraph. Optional.)*

#### Ending

**Q14. Did you reach an ending?** *(Multiple choice.)*

- Yes
- No
- Not sure if what I got was "an ending"

**Q15. If yes — which ending did it feel like you got?** *(Paragraph. Optional.)*
Describe it in your own words rather than picking from a list — I want to know how
it read to you.

**Q16. Did the ending feel earned — like it was a result of how you'd played?**
*(Linear scale, 1–5. Label 1 "Came out of nowhere", label 5 "Absolutely, felt like
mine".)*

#### Overall friction

**Q17. Where, if anywhere, did you get bored, lost, or frustrated?** *(Paragraph.
Optional.)*

**Q18. Was there a point you nearly stopped but carried on? What pulled you back?**
*(Paragraph. Optional.)*

**Q19. In one line — how would you describe this game to a mate?** *(Short answer.
Optional.)*

**Q20. Would you play it again?** *(Multiple choice.)*

- Definitely
- Maybe, if there was more to it
- Probably not
- No

#### Bugs & device (conditional — see setup note)

**Q21. Did it crash, freeze, or stutter at any point?** *(Multiple choice. Set this
question to branch: "Yes" → go to Q22; "No" → skip to Q24.)*

- Yes
- No
- Not sure

**Q22. What phone are you on, and what iOS version?** *(Short answer.)*
Settings → General → About shows both if you're not sure (Model Name and Software
Version).

**Q23. What was happening when it went wrong?** *(Paragraph.)*

#### Wrap-up

**Q24. Anything else at all?** *(Paragraph. Optional.)*

**Q25. Your name (optional).** *(Short answer.)*
Only if you're happy for me to know it was you — totally fine to leave blank.

### Post-build check

Once it's built, do one test submission yourself on your phone to confirm:

- Section 1 alone can be submitted (for the quitters)
- The Q21 → Q22 bug branch works
- Nothing except Q1 and Q2 blocks submission
