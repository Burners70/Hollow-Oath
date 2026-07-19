"use strict";
/* Bundle I — the 41-second clock. "Repeating, every 41 seconds" stops being
   lore and becomes observable: from Curie Fields onward (where the briefing
   first names the figure) and everywhere down in the Hollows, the whole
   world flinches on the Static's own period. Diagnostic atmosphere, not a
   hazard — the player's reward for noticing is understanding, not damage. */
const STATIC_PERIOD = 41.0;
let staticClock = 0, staticSurge = 0, staticGlitchT = 0;
let arrhythmiaHapT = 0;   // F2: paces the light arrhythmia tap
let sabotageFlash = 0;    // S7: red-edge vignette pulse when sabotage lands
function updateStaticClock(dt) {
  staticSurge = Math.max(0, staticSurge - dt);
  staticGlitchT = Math.max(0, staticGlitchT - dt);
  if (!(levelIdx >= 4 || level.isCave || dailyMod("surge"))) return;
  staticClock += dt;
  if (staticClock < STATIC_PERIOD) return;
  staticClock -= STATIC_PERIOD;
  staticTick();
  // a "wrong" double-tick, distinct from the heartbeat's lub-dub (F2)
  haptic.pattern([{ delay: 0, style: "light" }, { delay: 40, style: "light" }]);
  staticGlitchT = 0.12;
  // the one place the clock has mechanical teeth: the surge rocks a ship
  // hanging on the transfusion line (line stability, not hull)
  if (tethered() && !ship.landed) {
    ship.vx += (Math.random() < 0.5 ? -1 : 1) * 55;
    camera.shake += 6;
    addText(ship.x, ship.y - 40, "THE SURGE ROCKS THE LINE", "#b388ff");
  }
  if (level.isFinale && level.beacon && !level.beacon.resolved) {
    // the beacon surges on the same phase, but strong — the closer you fly
    // to SOLACE, the harder the world flinches with her (I3)
    const d = Math.hypot(ship.x - level.beacon.x, ship.y - level.beacon.y);
    const near = 1 - clamp(d / 2200, 0, 1);
    staticSurge = 1.2;
    camera.shake += 2 + 4 * near;
  } else {
    staticSurge = 0.6;
  }
}

let bannerMsg = null;
/* R8 — in-flight copy lingers longer for a phone held at arm's length; the
   banner keeps its last-second alpha fade (see render), the float slows. */
function banner(str, color) { bannerMsg = { str, color, t: 4.2 }; }
function addText(x, y, str, color) { texts.push({ x, y, str, color, t: 2.6 }); }

function showCard(card) { revealCard = card; state = "reveal"; stateT = 0; }

function grantFragment(queueForClear) {
  if (runFragments >= FRAGMENTS.length) { score += 500; return null; }
  const idx = runFragments;
  const frag = FRAGMENTS[runFragments++];
  logsSeen.add(idx); saveLogs();   // into the ARCHIVE, permanently (K1)
  if (queueForClear) level.fragmentsHere.push(frag);
  return frag;
}

function explode(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 220;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      t: 0.5 + Math.random() * 0.8, max: 1.3, color, size: 1.5 + Math.random() * 3 });
  }
  camera.shake = Math.min(camera.shake + 14, 26);
  // nearby grounded Scions panic
  if (level) for (const o of level.oids) {
    if ((o.state === "wait" || o.state === "walk") && Math.abs(o.x - x) < 160 && Math.abs(o.y - y) < 160) {
      o.state = "panic"; o.panicT = 1.6 + Math.random();
    }
  }
  boom();
}

function goldBurst(x, y) {
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 120;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
      t: 0.6 + Math.random() * 0.8, max: 1.4, color: "#ffd54f", size: 1.5 + Math.random() * 2.5 });
  }
}

/* ---------------- landing rules ---------------- */
function landingEval() {
  const s = ship;
  const slope = Math.abs(groundAt(s.x + 10) - groundAt(s.x - 10)) / 20;
  const tilt = Math.abs(((s.ang % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
  const upright = tilt < 0.5;
  const tol = easyMode ? 1.3 : 1;           // FIELD MEDIC widens every tolerance
  const vyMax = (upgrades.gentle ? 62 : 52) * tol;
  const vxMax = 38 * tol, slopeMax = 0.25 * tol;
  // only DOWNWARD speed can make a landing hard — rising (vy < 0) is never
  // "too fast" (s.vy < vyMax is trivially true while ascending), so there is no
  // rising-too-fast state and no message for it
  const soft = s.vy < vyMax && Math.abs(s.vx) < vxMax && slope < slopeMax && upright;
  const survivable = s.vy < (upgrades.gentle ? 100 : 85) * tol &&
    Math.abs(s.vx) < 60 * tol && slope < 0.35 * tol && upright;
  let reason = "";
  if (!upright) reason = "LEVEL THE SHIP";
  else if (slope >= slopeMax) reason = "GROUND TOO STEEP";
  else if (s.vy >= vyMax) reason = "DESCENDING TOO FAST";
  else if (Math.abs(s.vx) >= vxMax) reason = "DRIFTING SIDEWAYS";
  return { soft, survivable, reason };
}

function shipDie() {
  if (ship.dead) return;
  ship.dead = true;
  explode(ship.x, ship.y, "#ff4081", 60);
  explode(ship.x, ship.y, "#ffc400", 40);
  if (ship.passengers.length > 0) {
    const n = ship.passengers.length;
    for (const p of ship.passengers) {
      p.state = "lost";
      if (p.role === "famous") {
        addText(ship.x, ship.y - 66, "YOU LOST " + FAMOUS[p.famousId].name, "#ffd54f");
      }
    }
    acctLevel().lost += n; runLost += n;
    const penalty = 250 * n;
    score = Math.max(0, score - penalty);
    addText(ship.x, ship.y - 50,
      n + (n === 1 ? " SCION LOST" : " SCIONS LOST") + "  -" + penalty, "#ff4081");
    explode(ship.x, ship.y - 12, "#69f0ae", 24);
    ship.passengers = [];
  }
  lives--;
  state = "dead"; stateT = 0;
}

/* When every Scion is accounted for (saved, lost, or contained), MERCY
   closes her manifest and spools the jump drive — she has been holding
   the Static off her systems the whole time, and the moment she stops
   stationkeeping to spool, it starts to reach her. The extraction dock
   is the sector's final exam: dock with a drifting mothership while
   the pulses quicken. Checked every play frame so no accounting path
   (delivery, crash, sabotage, quarantine, escape) can be missed. */
/* S5 — you may leave what you can PROVE. A saboteur still on the ground counts
   toward closing the manifest once it is identified: scanned-and-flagged, or
   visibly revealed by ANTISEPSIS. Computed live (not a stored counter) and
   scoped to grounded "wait" units, so it can never double-count a unit that
   later boards, is contained, or is destroyed — those land in their own
   buckets. Sleepers with no tint and no scan stay unprovable: carry them, or
   the manifest stays open. */
function provenLeftBehind() {
  let n = 0;
  for (const o of level.oids)
    if (o.role === "saboteur" && o.state === "wait" && o.flagged) n++;   // scanned = proven
  return n;
}
function checkSectorClear() {
  if (state !== "play" || level.isCave || level.isFinale || level.extraction || mercyBreach) return;
  if (level.delivered + level.lost + level.contained + provenLeftBehind() < level.total) return;
  beginExtraction(false);
}

/* S4 — the last docking is a real docking. MERCY retracts her bays, lifts to
   jump altitude and opens a ventral hangar; the sector closes only when you fly
   INTO her and hold the hover (updateExtraction). `early` is the triage retreat
   (S4.5): the same flight, but with the sector-clear and Hippocratic bonuses
   withheld. */
function beginExtraction(early) {
  level.extraction = { t: 0, pulseT: 0, hold: 0, done: false, beatT: 0, early: !!early };
  banner("MANIFEST CLOSED — MERCY IS SPOOLING TO JUMP\nFLY INTO HER VENTRAL HANGAR BEFORE THE STATIC REACHES HER", "#ffc400");
  blip(660, 220, 0.6, "sawtooth", 0.15);
}

function sectorClearNow() {
  const early = level.extraction && level.extraction.early;
  if (!early) {
    score += 1000;
    if (level.firedShots === 0) { score += 2000; gc.achieve(GC_ACH.noHarm); }   // G3
  }
  if (dailyMod("stopwatch") && sectorT < 90) { score += 500; level.stopwatchBeat = true; }
  bannerMsg = null;
  clearCards = level.fragmentsHere.map(f => ({
    kicker: "LOG FRAGMENT RECOVERED", title: "", body: f, color: "#00e5ff" }));
  state = "clear"; stateT = 0;
  blip(440, 1760, 0.5, "sine", 0.15);
}

/* S4 — the ventral hangar: a slot ~1.6 ship-widths wide in MERCY's underside,
   derived live from her (lifted, drifting) position. Completion is a sustained
   hover here — the skill the transfusion line teaches, now as the sector's
   closing beat, and mechanically nothing like a Scion drop-off. */
const HANGAR_HOLD = 1.2;
function hangarRect() {
  const { mx, my } = mercyPos();
  const halfW = SHIP_R * 7;   // nearly her full underside — a forgiving mouth
  return { x0: mx - halfW, x1: mx + halfW, cx: mx, cy: my + 18 };
}
function inHangar() {
  const h = hangarRect();
  // a generous rectangular pocket under her hull — full-slot wide and a deep
  // vertical band — so gentle station-keeping holds you without frantic thrust
  return !ship.dead && !ship.landed &&
    ship.x > h.x0 && ship.x < h.x1 &&
    ship.y > h.cy - 26 && ship.y < h.cy + 52;
}
function updateExtraction(dt) {
  const e = level.extraction;
  // the "ABOARD" beat: once the hover completes she captures your ship — it
  // glides into her hangar and becomes a near-invisible part of her — then she
  // spools up and jumps away (S4.4). Both handled in render off e.beatT.
  if (e.done) {
    e.beatT += dt;
    const h = hangarRect();   // follows her up as she jumps, so the ship rides along
    ship.vx = 0; ship.vy = 0; ship.landed = false; ship.ang = 0;
    ship.x += (h.cx - ship.x) * Math.min(1, dt * 12);
    ship.y += (h.cy - ship.y) * Math.min(1, dt * 12);
    // ride the camera up with her (it clamps at the top of the world, so she
    // streaks off-screen as she jumps)
    camera.x = lerp(camera.x, ship.x, 1 - Math.pow(0.001, dt));
    camera.y = lerp(camera.y, ship.y - 40, 1 - Math.pow(0.001, dt));
    if (e.beatT >= 1.7) sectorClearNow();
    return;
  }
  e.t += dt;
  // she rises ~140 px toward jump altitude over ~3 s (baked into mercyPos) and
  // drifts as she stationkeeps — gently, so the hangar stays catchable
  level.mxo = Math.sin(e.t * 0.5) * Math.min(34, 6 + e.t * 1.2);
  level.myo = Math.sin(e.t * 1.0) * Math.min(14, 4 + e.t * 0.5);
  // the Static surges in quickening pulses that nudge your ship
  e.pulseT += dt;
  if (e.pulseT >= Math.max(3.2, 6.5 - e.t * 0.09)) {
    e.pulseT = 0;
    level.pulse = { t: 0 };
    staticTick();
    // the "wrong" double-tick — distinct from any heartbeat (F2)
    haptic.pattern([{ delay: 0, style: "light" }, { delay: 40, style: "light" }]);
    const { mx, my } = mercyPos();
    const dx = ship.x - mx, dy = ship.y - my, d = Math.hypot(dx, dy) || 1;
    if (d < 600 && !ship.landed && !ship.dead) {
      const kick = 60 * (1 - d / 600);   // a nudge, not a fling
      ship.vx += dx / d * kick; ship.vy += dy / d * kick;
      camera.shake += 6;
      addText(ship.x, ship.y - 30, "THE STATIC SURGES", "#b388ff");
    }
  }
  if (level.pulse && (level.pulse.t += dt) > 1.2) level.pulse = null;
  // hold the hover inside the hangar for a continuous 1.2 s, in the air. A brief
  // bump only bleeds the hold back (×1.5), it doesn't snap it to zero — so one
  // stray nudge near the end doesn't cost you the whole approach.
  if (inHangar()) {
    if (e.hold === 0) blip(440, 660, 0.1, "sine", 0.08);
    e.hold += dt;
    if (e.hold >= HANGAR_HOLD) {
      e.done = true; e.beatT = 0;
      banner("ABOARD — SECTOR " + SECTOR_NAMES[levelIdx] + " CLOSED", "#69f0ae");
      blip(440, 1760, 0.4, "sine", 0.14);
      haptic.medium();
    }
  } else e.hold = Math.max(0, e.hold - dt * 1.5);
}

/* S4.5 — the triage call. Once at least one Scion is home and half the manifest
   is accounted for, MERCY will answer early: hover in the ventral hangar with an
   empty deliverable cabin and she offers an early extraction — at the cost of
   every Scion still waiting on the ground. Retreat is allowed, but never free. */
function updateEarlyExtraction(dt) {
  if (level.extraction || mercyBreach || level.isFinale || level.isCave || state !== "play") {
    level.earlyHold = 0; level.earlyEligible = false; return;
  }
  const accounted = level.delivered + level.lost + level.contained + provenLeftBehind();
  const deliverableAboard = ship.passengers.filter(p => p.role !== "saboteur").length;
  const eligible = deliverableAboard === 0 && level.delivered >= 1 &&
    accounted >= level.total * 0.5 && accounted < level.total;
  level.earlyEligible = eligible;
  if (!eligible || !inHangar()) { level.earlyHold = 0; return; }
  level.earlyHold = (level.earlyHold || 0) + dt;
  if (level.earlyHold >= 0.8) { level.earlyHold = 0; askEarlyExtraction(); }
}
function askEarlyExtraction() {
  const waiting = level.oids.filter(o =>
    (o.state === "wait" || o.state === "walk" || o.state === "panic") && o.role !== "saboteur");
  const n = waiting.length;
  const names = waiting.filter(o => o.role === "famous").map(o => FAMOUS[o.famousId].name);
  // one clause per line, at logical breaks — no mid-sentence wrapping
  let body = "MERCY can spool now.";
  body += "\nBut " + n + (n === 1 ? " still waits on " : " still wait on ") + SECTOR_NAMES[levelIdx] + ".";
  if (names.length) body += "\n" + (names.length === 1 ? "One of them is " : "Among them: ") + names.join(" and ") + ".";
  body += "\nSignal early and they are logged lost — 250 each.";
  body += "\nNo sector-clear bonus. No oath.";
  body += "\nThe manifest will remember.";
  confirmCard = { kicker: "TRIAGE — FLEE AT A COST", title: "SIGNAL EARLY EXTRACTION?",
    body, color: "#ffc400", waiting };
  state = "confirm"; stateT = 0;
}
function confirmEarlyExtraction() {
  const waiting = confirmCard.waiting;
  let n = 0;
  for (const o of waiting) {
    if (o.state !== "wait" && o.state !== "walk" && o.state !== "panic") continue;
    o.state = "lost";
    level.lost++; runLost++; n++;
    const fam = o.role === "famous";
    score = Math.max(0, score - (fam ? 500 : 250));
    if (fam) addText(level.mx, level.my + 40, FAMOUS[o.famousId].name + " LEFT BEHIND  −500", "#ffd54f");
  }
  leftBehindNote = { n, sector: SECTOR_NAMES[levelIdx] };
  confirmCard = null;
  state = "play"; stateT = 0;
  beginExtraction(true);
}
function updateConfirm() {
  if (input.tap && stateT > 0.25) {
    const yes = confirmRowRect(0), no = confirmRowRect(1);
    if (inRect(yes, input.tapX, input.tapY)) { blip(520, 260, 0.2, "sawtooth", 0.12); confirmEarlyExtraction(); }
    else if (inRect(no, input.tapX, input.tapY)) {
      blip(440, 660, 0.1, "sine", 0.08); confirmCard = null; state = "play"; stateT = 0;
    }
  }
  input.tap = false;
}

function triggerBreach() {
  mercyBreach = { t: easyMode ? 60 : 45 };
  haptic.pattern([{ delay: 0, style: "heavy" }, { delay: 250, style: "heavy" }]);   // klaxon ×2 (F2)
  level.contamKnown = true;
  banner("SECURITY BREACH ABOARD MERCY\nDOCK AT THE RED BAY TO CONTAIN IT", "#ff4081");
  blip(880, 220, 0.6, "sawtooth", 0.2);
}

function resolveBreach(success) {
  mercyBreach = null;
  if (success) {
    score += 750;
    banner("CONTAMINANT CONTAINED  +750\nLOCKDOWN LIFTED", "#69f0ae");
    blip(520, 1040, 0.3, "sine", 0.15);
  } else {
    score = Math.max(0, score - 1000);
    mercyDamaged = true;
    banner("RECOVERY BAY SABOTAGED  -1000\nHEALING OFFLINE THIS SECTOR", "#ff4081");
    blip(300, 60, 0.6, "sawtooth", 0.2);
  }
}

/* ---------------- update ---------------- */
let ctlShown = null;
function updateCtlVisibility() {
  // virtual controls exist only in flight — not on the title, intro,
  // briefings, or story cards
  const want = state === "play" || state === "dead";
  if (want === ctlShown) return;
  ctlShown = want;
  document.body.classList.toggle("noctl", !want);
  if (!want) for (const b of btnEls) {
    input[b.key] = false;
    b.el.classList.remove("down");
  }
}

function update(dt) {
  stateT += dt;
  pollPad();
  updateCtlVisibility();
  updateMusic(dt);
  updateVitalsAudio(dt);   // S2 — the score tracks your vitals every frame
  if (bannerMsg && (bannerMsg.t -= dt) <= 0) bannerMsg = null;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t -= dt; if (p.t <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += GRAV * 0.6 * dt;
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    texts[i].t -= dt; texts[i].y -= 16 * dt;
    if (texts[i].t <= 0) texts.splice(i, 1);
  }
  if (camera) camera.shake = Math.max(0, camera.shake - 60 * dt);
  sabotageFlash = Math.max(0, sabotageFlash - dt);   // S7

  // portrait: hold the game and show the rotate prompt instead
  if (vh > vw) {
    if (thrustGain) thrustGain.gain.value = 0;
    input.tap = false;
    return;
  }

  // thrust noise is a loop tied to whatever updatePlay last set it to; any
  // transition away from "play" (a card, pause, game over, sector clear,
  // the lift transit freeze…) must not leave it running behind the panel.
  // Zeroed here every frame, then updatePlay sets the real value right back
  // if flight is actually still live.
  if (thrustGain) thrustGain.gain.value = 0;

  // the haunted title (Bundle L1): a faint dry tick, every 41 seconds
  if (state === "title" && unresolvedHaunt) {
    titleStaticT += dt;
    if (titleStaticT >= STATIC_PERIOD) { titleStaticT = 0; staticTick(0.4); }
  } else titleStaticT = 0;

  switch (state) {
    case "title": case "gameover": case "win": updateMenu(); return;
    case "intro": updateIntro(dt); return;
    case "help":
      // R1 — page through a paginated help card before it dismisses
      if (input.tap && stateT > 0.4) {
        if ((HELP_CARD.pages || 1) > 1 && (HELP_CARD.page || 0) < HELP_CARD.pages - 1) {
          HELP_CARD.page++; blip(440, 550, 0.06, "sine", 0.06);
        } else { HELP_CARD.page = 0; state = "title"; stateT = 0.7; }
      }
      input.tap = false; return;
    case "codex": updateCodex(); return;
    case "brief": updateBrief(dt); return;
    case "reveal":
      if (input.tap && stateT > 0.4) {
        if (revealCard && (revealCard.pages || 1) > 1 && (revealCard.page || 0) < revealCard.pages - 1) {
          revealCard.page++; blip(440, 550, 0.06, "sine", 0.06);
        } else { revealCard = null; state = "play"; }
      }
      input.tap = false; return;
    case "clear": updateClear(); return;
    case "ending":
      if (input.tap && stateT > 1) {
        state = "win"; stateT = 0;
        reportRunAchievements();   // G3 — before saveHi so the trace reads rank → score
        saveHi(); recordDaily(); clearRun();
      }
      input.tap = false; return;
    case "dead":
      if (stateT > 1.6) {
        if (lives <= 0) {
          checkpoint = savedRun; clearRun();
          state = "gameover"; stateT = 0; saveHi(); recordDaily();
        } else {
          if (level.isCave) exitCave();   // the Hollows spit you back out
          spawnShip(); state = "play"; stateT = 0; checkSectorClear();
        }
      }
      input.tap = false;
      return;
    case "pause": updatePause(); return;
    case "confirm": updateConfirm(); return;
    case "settings": updateSettings(); return;
    case "epilogue": updateEpilogue(dt); return;
    case "play": updatePlay(dt); return;
  }
}

/* Bundle G3 — the rank system IS the achievement list. Reported at the
   ending → win transition, mirroring drawWin's rank branches exactly so
   the on-screen rank and the Game Center record can never disagree. */
function reportRunAchievements() {
  if (endingType === "answered") {
    if (runFired === 0) gc.achieve(GC_ACH.oathKeeper);
    else if (firedAtSecret && !firedAtCombat) gc.achieve(GC_ACH.hollowKeeper);
    else gc.achieve(GC_ACH.oneWhoAnswered);
  } else if (endingType === "fire") gc.achieve(GC_ACH.sectorWarden);
  if (shrines.size >= SHRINES.length) gc.achieve(GC_ACH.glyconUnmasked);
  if (runFragments >= FRAGMENTS.length) gc.achieve(GC_ACH.archivist);
  if (runLost === 0) gc.achieve(GC_ACH.spotless);
}

function saveHi() {
  if (score > hiscore) {
    hiscore = score;
    try { localStorage.setItem("doids_hi", hiscore); } catch (e) {}
    cloud.set("doids_hi", hiscore);   // E4 mirror
  }
  // G2 — the all-time board. FIELD MEDIC runs stay off it (H3: report only
  // when easy mode is off); the daily flight posts to its own board in
  // recordDaily() instead.
  if (!easyMode && runMode !== "daily") gc.score(score, GC_BOARD_ALLTIME);
}

let introIdx = 0;
/* R5 — a fresh run now starts only from the explicit START pill (or Enter /
   gamepad A aimed at it), never from a stray tap on the title. */
function startFreshRun() {
  goFullscreen();
  if (window.hideA2HS) window.hideA2HS();
  resetRun();
  if (introSeen) {
    toBriefing(0);   // veterans launch straight into the tasking
  } else {
    introIdx = 0;
    state = "intro"; stateT = 0;
  }
  blip(330, 660, 0.2, "sine", 0.1);
}

function updateMenu() {
  if (input.tap && stateT > 0.6) {
    if (state === "title" && inRect(settingsRect(), input.tapX, input.tapY)) {
      settingsReturnState = "title"; state = "settings"; stateT = 0;
      blip(440, 660, 0.1, "sine", 0.08);
    } else if (state === "title" && inRect(helpRect(), input.tapX, input.tapY)) {
      state = "help"; stateT = 0; HELP_CARD.page = 0;
      blip(440, 660, 0.1, "sine", 0.08);
    } else if (state === "title" && inRect(codexRect(), input.tapX, input.tapY)) {
      state = "codex"; stateT = 0;
      codexTab = 0; archivePage = 0; mindsPage = 0; codexCard = null;
      blip(550, 825, 0.1, "sine", 0.08);
    } else if (state === "title" && inRect(storyRect(), input.tapX, input.tapY)) {
      // rewatch the opening narrative (it flows into a new run)
      goFullscreen();
      if (window.hideA2HS) window.hideA2HS();
      resetRun();
      introIdx = 0;
      state = "intro"; stateT = 0;
      blip(330, 660, 0.2, "sine", 0.1);
    } else if (state === "title" && savedRun && inRect(resumeRect(), input.tapX, input.tapY)) {
      goFullscreen();
      if (window.hideA2HS) window.hideA2HS();
      restoreRun(savedRun);
      toBriefing(levelIdx);
      blip(330, 660, 0.2, "sine", 0.1);
    } else if (state === "title" && veteran && inRect(remixRect(), input.tapX, input.tapY)) {
      startRemix();
    } else if (state === "title" && inRect(dailyRect(), input.tapX, input.tapY)) {
      startDaily();
    } else if (state === "title" && inRect(startRect(), input.tapX, input.tapY)) {
      startFreshRun();
    } else if (state === "gameover") {
      if (checkpoint && inRect(continueRect(), input.tapX, input.tapY)) {
        const r = checkpoint;
        restoreRun(r);
        score = Math.floor(r.score * 0.75);
        lives = startLives();
        checkpoint = null;
        toBriefing(r.levelIdx);
        blip(330, 660, 0.2, "sine", 0.1);
      } else {
        // every fail path leads home to the menu — and the run survives it:
        // the checkpoint is written back (continue penalty applied) so the
        // title's RESUME pill still offers the rotation.
        if (checkpoint) {
          restoreRun(checkpoint);
          score = Math.floor(checkpoint.score * 0.75);
          lives = startLives();
          snapshotRun();
          checkpoint = null;
        }
        state = "title"; stateT = 0;
        blip(300, 200, 0.12, "sine", 0.08);
      }
    } else if (state === "win") {
      // the win screen keeps tap-anywhere-to-launch; the title does not
      startFreshRun();
    }
    // a title tap that hit no pill now does nothing (R5)
  }
  input.tap = false;
}

let introBeat = 0;
function updateIntro(dt) {
  // a slow heartbeat under the story — except the failure panel,
  // where the Static answers instead
  introBeat += dt;
  const cyc = introIdx === 3 ? 1.4 : 1.5;
  if (introBeat >= cyc) {
    introBeat = 0;
    if (introIdx === 3) staticTick(); else heartbeat(0.55);
  }
  if (input.tap && stateT > 0.35) {
    if (inRect(skipRect(), input.tapX, input.tapY)) { markIntroSeen(); toBriefing(0); }
    else {
      introIdx++; stateT = 0;
      blip(440, 550, 0.08, "sine", 0.07);
      if (introIdx >= INTRO.length) { markIntroSeen(); toBriefing(0); }
    }
  }
  input.tap = false;
}

/* the daily's two modifiers arrive inside the transmission itself — the
   conditions are part of the tasking, not HUD furniture */
function briefText() {
  let t = BRIEFS[levelIdx];
  if (runMode === "daily" && dailyMods.length)
    t = "TODAY'S CONDITIONS — " +
      dailyMods.map(m => m.name + " (" + m.desc + ")").join(" · ") + ".\n" + t;
  // S4.5 — the grim line after a triage retreat, carried into the next briefing
  if (leftBehindNote)
    t += "\nYou left " + leftBehindNote.n + " behind on " + leftBehindNote.sector +
      ". The manifest remembers.";
  return t;
}
function updateBrief(dt) {
  const full = briefText().length;
  briefChars = Math.min(full, briefChars + dt * 55);
  if (input.tap && stateT > 0.5) {
    if (briefChars < full) briefChars = full;
    else { state = "play"; stateT = 0; leftBehindNote = null; banner(SECTOR_NAMES[levelIdx], "#00e5ff"); }
  }
  input.tap = false;
}

function updateClear() {
  if (input.tap && stateT > 0.8) {
    if (clearCards.length > 0) { clearCards.shift(); stateT = Math.max(stateT, 0.81); }
    else if (levelIdx < FINALE_IDX - 1) toBriefing(levelIdx + 1);
    else if (levelIdx === FINALE_IDX - 1) {
      if (blackboxCount >= 3) toBriefing(FINALE_IDX);
      else { endingType = "unresolved"; setHaunt(true); state = "ending"; stateT = 0; }
    } else { state = "ending"; stateT = 0; }
  }
  input.tap = false;
}

function updatePause() {
  if (thrustGain) thrustGain.gain.value = 0;
  if (input.tap && stateT > 0.25) {
    if (inRect(pauseRowRect(0), input.tapX, input.tapY)) { state = "play"; stateT = 0; }
    else if (inRect(pauseRowRect(1), input.tapX, input.tapY)) { toBriefing(levelIdx); }
    else if (inRect(pauseRowRect(2), input.tapX, input.tapY)) {
      settingsReturnState = "pause"; state = "settings"; stateT = 0;
    }
    else if (inRect(pauseRowRect(3), input.tapX, input.tapY)) { snapshotRun(); state = "title"; stateT = 0; }
  }
  input.tap = false;
}

/* wipe run progress, codex and saves — but keep the player's chosen prefs
   (audio/assist/difficulty). Double-tap-to-confirm on the settings row. */
let resetArmed = false;
function resetProgress() {
  const wipe = ["doids_hi", "doids_codex", "doids_run", "doids_logs",
    "doids_shrines_seen", "doids_unres", "doids_veteran", "doids_daily",
    "doids_intro"];
  for (const k of wipe) {
    try { localStorage.removeItem(k); } catch (e) {}
    cloud.remove(k);   // E4 — a wipe means the cloud copy too
  }
  hiscore = 0; codex = new Set(); logsSeen = new Set(); shrinesSeen = new Set();
  savedRun = null; checkpoint = null; veteran = false; introSeen = false;
  unresolvedHaunt = false;
}
let settingsReturnState = "title";
function updateSettings() {
  if (input.tap && stateT > 0.3) {
    let hit = false;
    for (let i = 0; i < SETTINGS_ROWS; i++) {
      if (i === 4) continue;   // TILT is handled synchronously in canvasTap()
      if (inRect(settingsRowRect(i), input.tapX, input.tapY)) {
        hit = true;
        if (i !== 9) resetArmed = false;   // any other tap disarms the wipe
        if (i === 0) {
          sound = !sound;
          try { localStorage.setItem("doids_snd", sound ? "1" : "0"); } catch (e) {}
          if (sfxGain) sfxGain.gain.value = sound ? 1 : 0;
          blip(sound ? 440 : 300, sound ? 660 : 200, 0.12, "sine", 0.1);
        } else if (i === 1) {
          music = !music;
          try { localStorage.setItem("doids_mus", music ? "1" : "0"); } catch (e) {}
          blip(440, 660, 0.1, "sine", 0.08);
        } else if (i === 2) {
          haptics = !haptics;
          try { localStorage.setItem("doids_hapt", haptics ? "1" : "0"); } catch (e) {}
          blip(440, 660, 0.1, "sine", 0.08);
        } else if (i === 3) {
          assist = !assist;
          try { localStorage.setItem("doids_assist", assist ? "1" : "0"); } catch (e) {}
          blip(assist ? 440 : 300, assist ? 660 : 200, 0.12, "sine", 0.1);
        } else if (i === 5) {
          colorblind = !colorblind;
          try { localStorage.setItem("doids_cb", colorblind ? "1" : "0"); } catch (e) {}
          blip(440, 660, 0.1, "sine", 0.08);
        } else if (i === 6) {
          // FIELD MEDIC applies to the NEXT run — a live run keeps the
          // difficulty it launched with (lives/tolerances mid-run would
          // be a silent cheat toggle otherwise)
          easyMode = !easyMode;
          try { localStorage.setItem("doids_easy", easyMode ? "1" : "0"); } catch (e) {}
          blip(easyMode ? 440 : 300, easyMode ? 660 : 200, 0.12, "sine", 0.1);
        } else if (i === 7) {
          bigText = !bigText;
          try { localStorage.setItem("doids_bigtext", bigText ? "1" : "0"); } catch (e) {}
          blip(440, 660, 0.1, "sine", 0.08);
        } else if (i === 8) {
          reducedFlash = !reducedFlash;
          try { localStorage.setItem("doids_flash", reducedFlash ? "1" : "0"); } catch (e) {}
          blip(440, 660, 0.1, "sine", 0.08);
        } else if (i === 9) {
          if (resetArmed) {
            resetProgress(); resetArmed = false;
            blip(200, 80, 0.4, "sawtooth", 0.14);
          } else {
            resetArmed = true;
            blip(300, 200, 0.15, "sine", 0.1);
          }
        }
      }
    }
    if (!hit) { resetArmed = false; state = settingsReturnState || "title"; stateT = 0; }
  }
  input.tap = false;
}

function updatePlay(dt) {
  if (liftTransit) { updateLiftTransit(dt); return; }
  // S4 — during the capture/jump beat the ship is MERCY's, not yours: skip the
  // flight sim (its ceiling clamp would fight the lerp that rides you up with her)
  if (level.extraction && level.extraction.done) { updateExtraction(dt); return; }
  if (input.tap && inRect(pauseRect(), input.tapX, input.tapY)) {
    input.tap = false;
    state = "pause"; stateT = 0;
    return;
  }
  input.tap = false;
  const s = ship;
  const now = performance.now() / 1000;

  let steer = 0;
  if (input.left || pad.left) steer -= 1;
  if (input.right || pad.right) steer += 1;
  if (steer === 0) steer = gyroSteerVal();
  if (steer) s.ang += ROT * dt * steer;

  // landing assist auto-levels the ship — but only on the way DOWN, so it never
  // fights your attitude while you're thrusting up and away
  if (assist && !s.landed && !steer && s.vy > 0) {
    const tilt = ((s.ang % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    if (Math.abs(tilt) < ASSIST_CAPTURE) s.ang = tilt * Math.max(0, 1 - ASSIST_RATE * dt);
  }

  // force field: eats fuel, stops bullets, drones, rough ground and cave roofs
  s.shield = (input.shield || pad.shield) && s.fuel > 0 && !s.dead;
  if (s.shield) s.fuel = Math.max(0, s.fuel - 7 * dt);

  const thrusting = (input.thrust || pad.thrust) && s.fuel > 0;
  if (thrustGain) thrustGain.gain.value = thrusting ? 0.14 : 0;
  if (thrusting) {
    s.vx += Math.sin(s.ang) * THRUST * dt;
    s.vy -= Math.cos(s.ang) * THRUST * dt;
    s.fuel = Math.max(0, s.fuel - 5.2 * dt);
    s.landed = false;
    for (let i = 0; i < 2; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      particles.push({
        x: s.x - Math.sin(s.ang) * 12, y: s.y + Math.cos(s.ang) * 12,
        vx: s.vx - Math.sin(s.ang + spread) * 160, vy: s.vy + Math.cos(s.ang + spread) * 160,
        t: 0.25 + Math.random() * 0.2, max: 0.45,
        color: Math.random() < 0.5 ? "#ffc400" : "#ff6d00", size: 2 + Math.random() * 2
      });
    }
    // friendly fire: hovering your exhaust over someone is malpractice
    const exX = s.x - Math.sin(s.ang) * 16, exY = s.y + Math.cos(s.ang) * 16;
    for (const o of level.oids) {
      if ((o.state === "wait" || o.state === "walk" || o.state === "panic") &&
          Math.abs(o.x - exX) < 26 && o.y - exY > -6 && o.y - exY < 46) {
        o.scorch = (o.scorch || 0) + dt * 2.2;
        if (o.scorch > 0.5) killOid(o, "torched");
      } else if (o.scorch) o.scorch = Math.max(0, o.scorch - dt);
    }
  }

  // gravity anomalies pull the ship toward their centres
  for (const a of level.anomalies) {
    const dx = a.x - s.x, dy = a.y - s.y, d = Math.hypot(dx, dy);
    if (d < a.r && d > 1 && !s.landed) {
      const f = a.str * (1 - d / a.r);
      s.vx += dx / d * f * dt; s.vy += dy / d * f * dt;
    }
  }

  if (!s.landed) {
    s.vy += GRAV * dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
  }

  s.x = clamp(s.x, BOUND_X, level.W - BOUND_X);
  if (s.y < BOUND_Y) { s.y = BOUND_Y; s.vy = Math.max(s.vy, 0); }

  // cave roofs are unforgiving — unless the field is up
  if (level.roof && !s.dead && !s.landed) {
    const rY = roofAt(s.x);
    if (s.y - SHIP_R <= rY) {
      if (s.shield) {
        s.y = rY + SHIP_R + 1;
        s.vy = Math.abs(s.vy) * 0.5 + 20;
        s.fuel = Math.max(0, s.fuel - 4);
        camera.shake += 6;
        blip(240, 420, 0.12, "sine", 0.1);
      } else { shipDie(); return; }
    }
  }

  const g = groundAt(s.x);
  if (!s.landed && s.y + SHIP_R >= g) {
    const { soft, survivable } = landingEval();
    if (soft) {
      s.landed = true; s.y = g - SHIP_R; s.vx = 0; s.vy = 0; s.ang = 0;
    } else if (s.shield) {
      // the force field turns a bad approach into a bounce
      s.y = g - SHIP_R;
      s.vy = -Math.abs(s.vy) * 0.45; s.vx *= 0.65;
      s.fuel = Math.max(0, s.fuel - 4);
      camera.shake += 6;
      haptic.medium();
      addText(s.x, s.y - 30, "SHIELD BOUNCE", "#69f0ae");
      blip(200, 380, 0.15, "sine", 0.12);
    } else if (survivable) {
      s.landed = true; s.y = g - SHIP_R; s.vx = 0; s.vy = 0; s.ang = 0;
      const dmg = upgrades.gentle ? 12 : 35;
      s.vitals -= dmg; camera.shake += 10;
      haptic.heavy();
      addText(s.x, s.y - 30, "HARD LANDING -" + dmg, "#ff4081");
      blip(160, 40, 0.3, "sawtooth", 0.2);
      if (s.vitals <= 0) { shipDie(); return; }
    } else { shipDie(); return; }
  }

  sectorT += dt;
  updateOids(dt, now);
  updateEnemies(dt);
  updateSabotage(dt);
  updateDocking(dt);
  updateBlackbox(dt);
  updatePods();
  updateResupplySignal(dt);
  updateLift(dt);
  updateShrine(dt);
  updateScan(dt);
  updateScionScan(dt);    // S5 — read a grounded unit's vitals; flag the fakes
  updateCabinPulse(dt);   // S1 — a heartbeat chorus for who's aboard
  updateCaveAudio(dt);    // S3 — drips & distant rumble down in the Hollows
  updateStaticClock(dt);
  if (level.isFinale) updateBeacon(dt);
  if (level.fakeMercy) updateDecoy(dt);

  if (mercyBreach) {
    mercyBreach.t -= dt;
    if (mercyBreach.t <= 0) resolveBreach(false);
  }

  if (level.extraction && state === "play") updateExtraction(dt);
  checkSectorClear();
  updateEarlyExtraction(dt);   // S4.5 — the triage retreat

  // Fleming: the hull cultures its own repair while vitals sit below half
  if (upgrades.penicillin && !s.dead && s.vitals > 0 && s.vitals < maxVitals() * 0.5)
    s.vitals = Math.min(maxVitals() * 0.5, s.vitals + 2 * dt);
  updateCabinMedic(dt);   // S9 — a living cabin steadies the hull between drops

  // F2: the arrhythmia reaches the player's hand — a light early tap every
  // few seconds while something wrong rides along (or the bay has you)
  if (contaminantAboard() || decoySnared()) {
    arrhythmiaHapT -= dt;
    if (arrhythmiaHapT <= 0) { arrhythmiaHapT = 3 + Math.random() * 2; haptic.light(); }
  } else arrhythmiaHapT = 0;

  s.beat = Math.max(0, s.beat - dt);
  camera.x = lerp(camera.x, s.x + s.vx * 0.35, 1 - Math.pow(0.001, dt));
  camera.y = lerp(camera.y, s.y + s.vy * 0.2 - 40, 1 - Math.pow(0.001, dt));
}

function updateOids(dt, now) {
  const s = ship;
  for (const o of level.oids) {
    o.wave += dt;
    if (o.state === "dying") {
      o.deathT += dt;
      if (o.deathType === "torched") {
        // staggering about in flames
        o.x += Math.sin(o.deathT * 22) * 44 * dt;
        o.y = groundAt(o.x);
        if (Math.random() < 0.6) particles.push({
          x: o.x + (Math.random() - 0.5) * 8, y: o.y - 12 - Math.random() * 12,
          vx: (Math.random() - 0.5) * 30, vy: -50 - Math.random() * 40,
          t: 0.4, max: 0.5,
          color: Math.random() < 0.5 ? "#ffc400" : "#ff6d00", size: 2.5 });
      }
      if (o.deathT >= 1.3) {
        // a PROVEN counterfeit (catalogued via the S5 scan) is a hollow chassis
        // with no heartbeat — not one of the medics we came for — so destroying
        // it is no malpractice; it's neutralised, off the manifest, no penalty.
        // An UNidentified unit still costs you: you couldn't know it wasn't a
        // living medic, and that risk is the whole tension.
        if (o.role === "saboteur" && o.flagged) {
          o.state = "contained"; level.contained++;
          addText(o.x, o.y - 40, "COUNTERFEIT DESTROYED", PAL().REVEAL);
          explode(o.x, o.y - 8, PAL().REVEAL, 18);
        } else {
          o.state = "lost";
          level.lost++; runLost++;
          const fam = o.role === "famous";
          const pen = fam ? 500 : 250;
          score = Math.max(0, score - pen);
          addText(o.x, o.y - 40,
            (fam ? "YOU KILLED " + FAMOUS[o.famousId].name : "MALPRACTICE") + "  -" + pen,
            fam ? "#ffd54f" : "#ff4081");
          explode(o.x, o.y - 8, o.deathType === "torched" ? "#ff6d00" : "#69f0ae", 18);
        }
      }
      continue;
    }
    if (o.state === "wait") {
      o.nearShip = Math.abs(s.x - o.x) < 240 && Math.abs(s.y - o.y) < 180;
      if (o.persona === "pace") {
        o.x = o.home + Math.sin((now + o.wave * 3) * 0.7) * 26;
        o.y = groundAt(o.x);
      }
    }
    if (o.state === "panic") {
      o.panicT -= dt;
      o.x += Math.sin(now * 7 + o.wave * 9) * 60 * dt;
      o.x = clamp(o.x, o.home - 70, o.home + 70);
      o.y = groundAt(o.x);
      if (o.panicT <= 0) o.state = "wait";
      continue;
    }
    if (o.state === "wait" && s.landed &&
        Math.abs(s.x - o.x) < 150 && Math.abs(groundAt(o.x) - (s.y + SHIP_R)) < 60) {
      // S5 — with ANTISEPSIS earned, parking DIRECTLY on a unit (and holding
      // still) examines it rather than boards it: the landed scan resolves what
      // it is. A verified real Scion then climbs aboard as normal; land a short
      // step away (>66 px) to skip the check and rescue at speed. Without the
      // upgrade there is no examine hold — units board exactly as they always did.
      const examining = upgrades.antisepsis && !o.verified && Math.abs(s.x - o.x) < 66 &&
        Math.abs(s.vx) < 20 && Math.abs(s.vy) < 20;
      if (!examining) o.state = "walk";
    }
    if (o.state === "walk") {
      if (!s.landed) { o.state = "wait"; continue; }
      const speed = o.role === "saboteur" ? 40 : 34; // a touch too eager
      o.x += Math.sign(s.x - o.x) * speed * dt;
      o.y = groundAt(o.x);
      if (Math.abs(s.x - o.x) < 14) {
        if (s.passengers.length >= CAPACITY) {
          addText(s.x, s.y - 34, "SHIP FULL", "#ffc400");
          o.state = "wait"; o.x = s.x + 20 * Math.sign(o.x - s.x || 1);
          continue;
        }
        o.state = "aboard";
        s.passengers.push(o);
        score += 500;
        s.beat = 1;
        if (o.role === "saboteur") {
          dullThud(); // no heartbeat. Listen closely.
          o.sabT = 6 + Math.random() * 3;
          addText(s.x, s.y - 34, "SCION ABOARD +500", "#69f0ae");
        } else {
          heartbeat();
          addText(s.x, s.y - 34, "SCION ABOARD +500", "#69f0ae");
          if (o.carrier) addText(s.x, s.y - 48, "◇ CARRYING DATA", "#00e5ff");
          if (o.role === "famous") {
            goldBurst(s.x, s.y - 10);
            banner("SOMEONE EXTRAORDINARY IS ABOARD…", "#ffd54f");
            blip(660, 1320, 0.3, "sine", 0.12);
          }
        }
      }
    }
  }
}

function updateEnemies(dt) {
  const s = ship;
  for (const t of level.turrets) {
    if (!t.alive) continue;
    const dx = s.x - t.x, dy = s.y - (t.y - 10);
    const d = Math.hypot(dx, dy);
    const target = Math.atan2(dy, dx);
    t.ang += clamp(target - t.ang, -1.6 * dt, 1.6 * dt);
    t.cd -= dt;
    if (d < 500 && t.cd <= 0 && !s.dead) {
      t.cd = 1.5 + Math.random() * 0.9;
      level.bullets.push({ x: t.x + Math.cos(t.ang) * 14, y: t.y - 10 + Math.sin(t.ang) * 14,
        vx: Math.cos(t.ang) * 150, vy: Math.sin(t.ang) * 150, t: 4 });
      blip(300, 90, 0.18, "square", 0.07);
    }
  }

  for (const dr of level.drones) {
    if (!dr.alive) continue;
    dr.bob += dt;
    const dx = s.x - dr.x, dy = s.y - dr.y, d = Math.hypot(dx, dy) || 1;
    if (d < 700) { dr.vx += dx / d * 60 * dt; dr.vy += dy / d * 60 * dt; }
    const sp = Math.hypot(dr.vx, dr.vy);
    if (sp > 95) { dr.vx *= 95 / sp; dr.vy *= 95 / sp; }
    dr.x += dr.vx * dt; dr.y += dr.vy * dt + Math.sin(dr.bob * 3) * 8 * dt;
    dr.y = Math.min(dr.y, groundAt(dr.x) - 26);
    if (level.roof) dr.y = Math.max(dr.y, roofAt(dr.x) + 26);
    if (!s.dead && d < SHIP_R + (s.shield ? 14 : 10)) {
      dr.alive = false;
      explode(dr.x, dr.y, "#ff4081", 24);
      if (s.shield) {
        addText(s.x, s.y - 30, "SHIELD HELD", "#69f0ae");
      } else {
        s.vitals -= 40;
        addText(s.x, s.y - 30, "-40", "#ff4081");
        if (s.vitals <= 0) { shipDie(); return; }
      }
    }
  }

  for (let i = level.bullets.length - 1; i >= 0; i--) {
    const b = level.bullets[i];
    b.t -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.t <= 0 || b.y > groundAt(b.x)) { level.bullets.splice(i, 1); continue; }
    if (!s.dead && Math.hypot(b.x - s.x, b.y - s.y) < SHIP_R + (s.shield ? 10 : 3)) {
      level.bullets.splice(i, 1);
      if (s.shield) {
        explode(b.x, b.y, "#69f0ae", 8);
        blip(500, 900, 0.08, "sine", 0.08);
        continue;
      }
      s.vitals -= 26; camera.shake += 8;
      explode(b.x, b.y, "#ff4081", 10);
      addText(s.x, s.y - 30, "-26", "#ff4081");
      if (s.vitals <= 0) { shipDie(); return; }
    }
  }

  s.fireCd -= dt;
  // while the transfusion line is caught, FIRE means "detach", never "shoot"
  if ((input.fire || pad.fire) && s.fireCd <= 0 && !s.dead && !tethered()) {
    s.fireCd = 0.22;
    acctLevel().firedShots++; runFired++;
    level.shots.push({ x: s.x + Math.sin(s.ang) * 14, y: s.y - Math.cos(s.ang) * 14,
      vx: s.vx + Math.sin(s.ang) * 360, vy: s.vy - Math.cos(s.ang) * 360, t: 1.3 });
    shotSfx();   // S1 — a muffled energy-dart "thmp", not a 1982 "pew"
  }
  for (let i = level.shots.length - 1; i >= 0; i--) {
    const b = level.shots[i];
    b.t -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    let gone = b.t <= 0 || b.y > groundAt(b.x) || (level.roof && b.y < roofAt(b.x));
    for (const t of level.turrets) {
      if (t.alive && Math.hypot(b.x - t.x, b.y - (t.y - 8)) < 18) {
        t.alive = false; gone = true; firedAtCombat = true;
        score += 250;
        explode(t.x, t.y - 8, "#ffc400", 30);
        addText(t.x, t.y - 40, "+250", "#ffc400");
      }
    }
    for (const dr of level.drones) {
      if (dr.alive && Math.hypot(b.x - dr.x, b.y - dr.y) < 16) {
        dr.alive = false; gone = true; firedAtCombat = true;
        score += 150;
        explode(dr.x, dr.y, "#ff4081", 22);
        addText(dr.x, dr.y - 30, "+150", "#ff4081");
      }
    }
    // friendly fire: a stray shot can hit the very Scion you came for
    for (const o of level.oids) {
      if ((o.state === "wait" || o.state === "walk" || o.state === "panic") &&
          Math.hypot(b.x - o.x, b.y - (o.y - 12)) < 12) {
        gone = true;
        killOid(o, "shot");
      }
    }
    // Glycon's secrets crack open under fire
    for (const sc of level.scenery) {
      if (sc.dead) continue;
      if (sc.fake && Math.hypot(b.x - sc.x, b.y - (sc.y - 30 * sc.s)) < 24 * sc.s) {
        gone = true;
        revealSecret(sc, true);
      } else if (sc.hollow && Math.hypot(b.x - sc.x, b.y - (sc.y - 8 * sc.s)) < 16 * sc.s) {
        gone = true;
        revealSecret(sc, true);
      }
    }
    if (level.beacon && !level.beacon.resolved &&
        Math.hypot(b.x - level.beacon.x, b.y - (level.beacon.y - 40)) < 42) {
      gone = true;
      level.beacon.hp--;
      explode(level.beacon.x, level.beacon.y - 40, "#b388ff", 20);
      if (level.beacon.hp <= 0) resolveBeacon("fire");
    }
    // one shot into the counterfeit MERCY's hull powers it down (N3) —
    // it costs the oath the same way any secret opened by fire does
    const fm = level.fakeMercy;
    if (fm && !fm.dead && Math.abs(b.x - fm.x) < 148 && b.y - fm.y > -55 && b.y - fm.y < 25) {
      gone = true; firedAtSecret = true;
      decoyDown(fm);
    }
    if (gone) level.shots.splice(i, 1);
  }
}

function updateSabotage(dt) {
  const s = ship;
  for (const p of s.passengers) {
    if (p.role !== "saboteur" || p.sleeper) continue;
    p.sabT -= dt;
    if (p.sabT > 0) continue;
    p.sabT = 7 + Math.random() * 4;
    acctLevel().contamKnown = true;
    level.contamKnown = true;
    // S7 — sabotage gets a moment: a red-edge pulse, a hiss, a shove to the hand
    sabotageFlash = 0.5;
    haptic.heavy();
    sabHiss();
    // Jenner's gift: immunised passengers can't be killed, only inconvenienced
    if (upgrades.inoculation || Math.random() < 0.55 || s.passengers.length === 1) {
      s.fuel = Math.max(0, s.fuel - (easyMode ? 4.5 : 9));
      addText(s.x, s.y - 34, "FUEL LINE CUT", "#ff4081");
      blip(140, 60, 0.25, "sawtooth", 0.12);
    } else {
      const victims = s.passengers.filter(q => q.role !== "saboteur");
      if (victims.length) {
        const v = victims[Math.floor(Math.random() * victims.length)];
        s.passengers.splice(s.passengers.indexOf(v), 1);
        v.state = "lost";
        acctLevel().lost++; runLost++;
        if (v.role === "famous")
          addText(s.x, s.y - 48, FAMOUS[v.famousId].name + " WAS KILLED", "#ffd54f");
        // S7 — a kill is never discovered from the score readout: a full banner
        banner("A PASSENGER IS DEAD — IT'S IN THE CABIN", PAL().DANGER);
        dullThud();
        checkSectorClear();
      }
    }
  }
}

/* Bundle J2 — one reveal for both paths (fire and the landed scan) so the
   two can never drift apart. `viaFire` decides which oath flag it costs. */
function revealSecret(sc, viaFire) {
  sc.dead = true;
  if (viaFire) firedAtSecret = true; else scannedSecret = true;
  if (sc.fake) {
    score += 500;
    explode(sc.x, sc.y - 24, PAL().REVEAL, 26);
    staticTick();
    addText(sc.x, sc.y - 56,
      (viaFire ? "LURE-TREE DESTROYED" : "LURE-TREE READ FOR WHAT IT IS") +
      " — COUNTERFEIT TRANSMITTER +500", PAL().REVEAL);
  } else {
    score += 400;
    explode(sc.x, sc.y - 8, "#ffc400", 20);
    level.pods.push({ x: sc.x, y: sc.y, taken: false, ph: Math.random() * 7 });
    addText(sc.x, sc.y - 44, "HIDDEN CACHE +400 — someone didn't want this found", "#ffc400");
    blip(400, 1200, 0.3, "sine", 0.12);
  }
}

/* Bundle J1 — the priced pacifist path. A landed scan opens the same
   secrets a snap-shot does, but takes 6 seconds during which you are
   grounded, static, and in every turret's sights: the oath costs risk,
   not access. Same accumulate-while-near pattern as the black box. */
const SCAN_T = 6;
function updateScan(dt) {
  const s = ship;
  let target = null;
  if (s.landed && !s.dead) {
    for (const sc of level.scenery) {
      if (sc.dead || !(sc.fake || sc.hollow)) continue;
      if (Math.abs(s.x - sc.x) < 60 && Math.abs(s.y - sc.y) < 110) { target = sc; break; }
    }
  }
  for (const sc of level.scenery)
    if (sc !== target && sc.scanT) sc.scanT = Math.max(0, sc.scanT - dt * 2);
  if (!target) return;
  target.scanT = (target.scanT || 0) + dt * scanRate();
  if (target.scanT >= SCAN_T) revealSecret(target, false);
}

/* S5 — the landed Scion scan, the diagnostic EARNED by rescuing Semmelweis
   (ANTISEPSIS). Park directly on a waiting unit and hold ~4 s to read its
   vitals: a counterfeit is CATALOGUED (+250, marked with a permanent "?", may
   be left on the ground); a real Scion's heartbeat is VERIFIED (no score) and
   it then boards as normal. Priced in time and exposure. Before you've earned
   it there is no positive identification — only the behavioural tells. */
const SCION_SCAN_T = 4;
function updateScionScan(dt) {
  const s = ship;
  if (!upgrades.antisepsis) return;   // no diagnostic until Semmelweis is aboard
  let target = null;
  if (s.landed && !s.dead && Math.abs(s.vx) < 20 && Math.abs(s.vy) < 20) {
    for (const o of level.oids) {
      if (o.state !== "wait" || o.flagged || o.verified) continue;
      if (Math.abs(s.x - o.x) < 66 && Math.abs(groundAt(o.x) - (s.y + SHIP_R)) < 70) { target = o; break; }
    }
  }
  for (const o of level.oids)
    if (o !== target && o.oidScanT) o.oidScanT = Math.max(0, o.oidScanT - dt * 2);
  if (!target) return;
  target.oidScanT = (target.oidScanT || 0) + dt * scanRate();
  if (target.oidScanT >= SCION_SCAN_T) {
    target.oidScanT = 0;
    if (target.role === "saboteur") {
      target.flagged = true;   // stays on the ground, catalogued; oath untouched (no shot)
      score += 250;
      staticTick();
      addText(target.x, target.y - 44, "CATALOGUED — COUNTERFEIT +250", PAL().REVEAL);
      checkSectorClear();
    } else {
      target.verified = true;
      heartbeat(0.5, true);
      addText(target.x, target.y - 44, "VITALS VERIFIED — A HEARTBEAT", "#69f0ae");
    }
  }
}

function contaminantAboard() {
  return ship.passengers.some(p => p.role === "saboteur" && !p.sleeper);
}

/* S1 — the cabin fills with heartbeats. Every genuine Scion aboard contributes
   one soft pulse on its own ~1.5 s period (a phase offset per index, ±5% rate
   variance) so the chorus reads as a living crew. A saboteur's slot stays
   SILENT — the missing beat is the boarding dull-thud made continuous. At most
   three layers sound at once and the total is capped, so the load-bearing
   boarding tell is never blurred. Runs only in live flight (updatePlay), so it
   naturally falls quiet behind cards, briefings and death. */
function updateCabinPulse(dt) {
  const s = ship;
  if (s.dead || state !== "play") return;
  const riders = s.passengers.filter(p => p.role !== "saboteur");
  const audible = Math.min(3, riders.length);
  if (audible === 0) return;
  const v = 0.22 / audible;
  for (let i = 0; i < riders.length; i++) {
    const p = riders[i];
    if (p.pulseRate === undefined) {
      p.pulseRate = 1.5 * (1 + (Math.random() * 2 - 1) * 0.05);   // ±5%
      p.pulseT = (i / riders.length) * 1.5;                        // spread the chorus
    }
    p.pulseT += dt;
    if (p.pulseT >= p.pulseRate) {
      p.pulseT -= p.pulseRate;
      if (i < audible) heartbeat(v, true);   // no-haptic layer, soft
    }
  }
}

/* S3 — the Hollows have acoustics. A stray drip every 4–9 s and a rare distant
   rumble every 20–40 s, both routed through the echo bus enterCave lit up. */
let caveDripT = 0, caveRumbleT = 0;
function updateCaveAudio(dt) {
  if (!level.isCave || ship.dead || state !== "play") { caveDripT = 0; caveRumbleT = 0; return; }
  if ((caveDripT -= dt) <= 0) { caveDripT = 4 + Math.random() * 5; caveDrip(); }
  if ((caveRumbleT -= dt) <= 0) { caveRumbleT = 20 + Math.random() * 20; caveRumble(); }
}

/* S9 — Scions gently repair the ship while aboard. A slow passive regen driven
   by who is riding: only genuine Scions lend a hand (a hollow counterfeit has
   no medical mind — the same point the WORKSHOP shrine makes, felt not flagged),
   stronger with a famous mind in the cabin, capped at 85% so MERCY's bay stays
   the only way to FINISH a repair. Additive with Fleming; both are dt-scaled. */
const BASE_MEDIC_RATE = 0.5;     // vitals/s per ordinary Scion aboard
const FAMOUS_MEDIC_BONUS = 1.0;  // extra per famous Scion currently riding
let cabinMedicRate = 0;
function updateCabinMedic(dt) {
  const s = ship;
  cabinMedicRate = 0;
  // the already-tense states get no quiet heal (breach, extraction, the decoy's
  // mouth); gate on live flight exactly like updateVitalsAudio
  if (s.dead || state !== "play" || mercyBreach || level.extraction || decoySnared()) return;
  const real = s.passengers.filter(p => p.role !== "saboteur");
  if (!real.length) return;
  const famous = real.filter(p => p.role === "famous").length;
  cabinMedicRate = real.length * BASE_MEDIC_RATE + famous * FAMOUS_MEDIC_BONUS;
  const ceiling = maxVitals() * 0.85;
  if (s.vitals < ceiling) s.vitals = Math.min(ceiling, s.vitals + cabinMedicRate * dt);
}

function killOid(o, how) {
  if (o.state === "dying") return;
  o.state = "dying"; o.deathType = how; o.deathT = 0;
  if (how === "torched") blip(220, 60, 0.5, "sawtooth", 0.15);
  else blip(400, 80, 0.25, "square", 0.12);
}

/* recovery bay (cyan) spans MERCY's underside and heals & delivers;
   the red quarantine bay hangs off her starboard side */
function mercyPos() {
  // S4 — during extraction she lifts ~140 px toward jump altitude over ~3 s;
  // the hangar and every render follow her up. Once your ship is aboard she
  // accelerates off the top of the world (the jump), dragging the hangar (and
  // the captured ship lerping to it) with her.
  const e = level.extraction;
  const lift = e ? Math.min(140, e.t * (140 / 3)) : 0;
  let jump = 0;
  if (e && e.done) { const j = Math.max(0, e.beatT - 0.55); jump = 1500 * j * j; }
  return { mx: level.mx + (level.mxo || 0), my: level.my + (level.myo || 0) - lift - jump };
}
function bayRects() {
  const { mx, my } = mercyPos();
  return {
    // recovery bay hangs under the hull, dead centre
    med: { x0: mx - 100, x1: mx + 100, y0: my + 24, y1: my + 130 },
    // quarantine comes off the starboard side, level with the hull itself —
    // kept apart, not underneath, on purpose
    red: { x0: mx + 172, x1: mx + 260, y0: my - 34, y1: my + 30 }
  };
}
function inBay(b) {
  const s = ship;
  const cap = upgrades.doors ? 95 : 70;   // Blackwell: the doors open wider
  return s.x > b.x0 && s.x < b.x1 && s.y > b.y0 && s.y < b.y1 &&
    Math.abs(s.vx) < cap && Math.abs(s.vy) < cap && !s.dead;
}

function updateDocking(dt) {
  if (level.isCave) return;   // no MERCY down in the Hollows
  // S4 — the moment the manifest closes MERCY retracts her bays: they go inert,
  // the recovery beam is dead, and the only way aboard is the ventral hangar.
  // A ship parked in the bay at that instant simply has the deck rise away.
  if (level.extraction) { ship.dockT = 0; ship.escapeT = 0; ship.redDockT = 0; ship.breachDockT = 0; return; }
  const s = ship;
  const bays = bayRects();

  if (inBay(bays.med)) {
    if (!mercyBreach) {
      s.fuel = Math.min(maxFuel(), s.fuel + 30 * dt);
      if (!mercyDamaged) {
        const rate = upgrades.lamp ? 40 : 24; // Nightingale runs a better ward
        s.vitals = Math.min(maxVitals(), s.vitals + rate * dt);
      }
    }
    s.dockT += dt;
    const deliverable = s.passengers.filter(p => p.role !== "saboteur");
    if (deliverable.length > 0 && s.dockT > 0.35) {
      s.dockT = 0; s.escapeT = 0;
      // famous Scions step out last, for the reveal
      deliverable.sort((a, b) => (a.role === "famous" ? 1 : 0) - (b.role === "famous" ? 1 : 0));
      const p = deliverable[0];
      s.passengers.splice(s.passengers.indexOf(p), 1);
      p.state = "delivered";
      level.delivered++; runSaved++;
      score += 300;
      addText(level.mx, level.my + 40, "DELIVERED +300", "#69f0ae");
      blip(520, 1040, 0.2, "sine", 0.12);
      if (p.carrier) {
        const frag = grantFragment(true);
        if (frag) addText(level.mx, level.my + 56, "LOG FRAGMENT RECOVERED", "#00e5ff");
      }
      if (p.role === "famous") {
        const f = FAMOUS[p.famousId];
        upgrades[f.upgrade] = true;
        codex.add(p.famousId); saveCodex();
        if (codex.size >= FAMOUS.length) gc.achieve(GC_ACH.fullCodex);   // G3 — across runs
        if (f.upgrade === "fabrica") s.vitals = Math.min(maxVitals(), s.vitals + 25);
        score += 1500;
        goldBurst(level.mx, level.my + 40);
        showCard({
          kicker: "RESCUED · +1500", title: f.name, subtitle: f.era,
          body: f.story + "\n\n★ " + f.upgradeName + " — " + f.upgradeDesc,
          color: "#ffd54f"
        });
        return;
      }
      checkSectorClear();
      return;
    }
    // only saboteurs left aboard: given the chance, one slips inside
    if (deliverable.length === 0 && s.passengers.length > 0) {
      s.escapeT += dt;
      if (s.escapeT > 1.2) {
        s.escapeT = 0;
        const sab = s.passengers.find(p => p.role === "saboteur");
        s.passengers.splice(s.passengers.indexOf(sab), 1);
        sab.state = "escaped";
        level.contained++; // off the manifest either way
        triggerBreach();
      }
    }
  } else { s.dockT = 0; s.escapeT = 0; }

  if (inBay(bays.red)) {
    s.redDockT += dt;
    const sab = s.passengers.find(p => p.role === "saboteur");
    if (sab && s.redDockT > 0.35) {
      s.redDockT = 0;
      s.passengers.splice(s.passengers.indexOf(sab), 1);
      sab.state = "contained";
      level.contained++; // accounted for, but not a casualty
      score += 750;
      addText(level.mx, level.my + 40, "CONTAMINANT CONTAINED +750", "#ff4081");
      explode(level.mx + 65, level.my + 60, "#ff4081", 14);
      blip(220, 660, 0.3, "square", 0.12);
      checkSectorClear();
    }
    if (mercyBreach) {
      s.breachDockT += dt;
      if (s.breachDockT > 2) { s.breachDockT = 0; resolveBreach(true); }
    }
  } else { s.breachDockT = 0; s.redDockT = 0; }
}

function updateBlackbox(dt) {
  const bb = level.blackbox;
  if (!bb || bb.found) return;
  const s = ship;
  if (s.landed && Math.abs(s.x - bb.x) < 70) {
    bb.scanT += dt * scanRate();
    if (bb.scanT >= 1.5) {
      bb.found = true;
      blackboxCount++;
      score += 800;
      blip(300, 1200, 0.5, "sine", 0.14);
      const frag = grantFragment(false);
      showCard({
        kicker: "BLACK BOX RECOVERED · SIGNAL " + blackboxCount + "/" + NBOX + " · +800",
        title: "", subtitle: "",
        body: (frag || "The recorder is blank — wiped clean. Someone got here first.") +
          "\n\n" + (blackboxCount >= 3 ? "◈ Triangulation viable. Keep flying."
                                       : "◈ Recover at least 3 of " + NBOX + " to triangulate the source."),
        color: "#b388ff"
      });
    }
  } else bb.scanT = 0;
}

function updatePods() {
  const s = ship;
  for (const p of level.pods) {
    if (p.taken) continue;
    if (Math.hypot(s.x - p.x, s.y - (p.y - 8)) < 30) {
      p.taken = true;
      s.fuel = Math.min(maxFuel(), s.fuel + 35);
      addText(p.x, p.y - 30, "FUEL +35", "#ffc400");
      blip(520, 780, 0.15, "sine", 0.1);
      goldBurst(p.x, p.y - 8);
    }
  }
  // the counterfeits: they drink instead of pour
  for (const p of level.fakePods) {
    if (p.taken) continue;
    if (Math.hypot(s.x - p.x, s.y - (p.y - 8)) < 30) {
      p.taken = true;
      s.fuel = Math.max(0, s.fuel - 18);
      score = Math.max(0, score - 100);
      addText(p.x, p.y - 30, "COUNTERFEIT — SOMEBODY'S LURE  -100", PAL().REVEAL);
      addText(p.x, p.y - 46, "FUEL DRAINED -18", "#ff4081");
      staticTick();
      explode(p.x, p.y - 8, PAL().REVEAL, 14);
    }
  }
}

/* THE TRANSFUSION LINE — field refuelling as an active hover minigame.
   A ship landed at 0 fuel has no way to move again (thrust and shield both
   require fuel>0), so holding THRUST while stranded doubles as the "signal
   for resupply" charge — no new button. But the drone no longer drops fuel
   in your lap: it arrives, mists a small PRIMER onto the tank, unspools a
   fuel line to a hover point overhead, and the rest is on you — hold
   station inside the capture window, in the air, while fuel flows. The one
   thrust skill the rest of the game never asks for: sustained hover with
   nothing to settle onto.
   - Flow is continuous; TAP FIRE to detach cleanly at any moment and keep
     what you took. Full tank with no occlusion: CLEAN LINE +250.
   - Drift outside the window: the line occludes (flow stops, drip
     stutters). Drift past the snap radius: the line parts, -50, the drone
     leaves with the remainder — signal again if you need it.
   - While the line is attached the SHIELD cannot come up (the field would
     sever the umbilical) and FIRE means "detach", so you are slow, soft,
     and honest — exposure is the price, same as the landed scan.
   - The pump speaks the game's diagnostic language: a drip per beat,
     arrhythmic while a contaminant rides along, and the 41-second surge
     physically rocks the tethered ship (see updateStaticClock). */
const SIGNAL_HOLD_T = 1.8;
const XFUSE_RATE = 12, XFUSE_PRIMER = 10, XFUSE_PATIENCE = 30, XFUSE_SNAP_R = 130;
function xfuseWindowR() { return easyMode ? 44 : 34; }   // FIELD MEDIC widens the window
function capturePoint(rd) { return { x: rd.x, y: rd.y + 55 }; }
/* "tethered" = the line has caught the ship at least once and is still out —
   from then until release, FIRE detaches instead of shooting */
function tethered() {
  return !!(resupplyDrone && resupplyDrone.phase === "line" &&
            resupplyDrone.everAttached && !ship.dead);
}
function updateResupplySignal(dt) {
  const s = ship;
  const stranded = s.landed && s.fuel <= 0 && !s.dead;
  if (stranded && !resupplyDrone && (input.thrust || pad.thrust)) {
    s.signalT += dt;
    if (Math.random() < dt * 8) particles.push({
      x: s.x + (Math.random() - 0.5) * 16, y: s.y - 6,
      vx: (Math.random() - 0.5) * 20, vy: -26, t: 0.3, max: 0.4,
      color: "#ffc400", size: 1.6 });
  } else if (!resupplyDrone) {
    s.signalT = Math.max(0, s.signalT - dt * 2.5);
  }
  if (s.signalT >= SIGNAL_HOLD_T && !resupplyDrone) {
    s.signalT = 0;
    resupplyDrone = { x: s.x, y: s.y - 320, hoverY: s.y - 130, phase: "in", t: 0,
      given: 0, occluded: false, attachedNow: false, everAttached: false,
      dripT: 0, dripFlip: false, firePrev: true };
    blip(180, 420, 0.4, "sine", 0.12);
  }
  if (!resupplyDrone) return;
  const rd = resupplyDrone;
  rd.t += dt;
  if (rd.phase === "in") {
    rd.y = lerp(rd.hoverY - 190, rd.hoverY, clamp(rd.t / 1.1, 0, 1));
    if (rd.t >= 1.1) {
      rd.phase = "line"; rd.t = 0;
      if (s.fuel < XFUSE_PRIMER) {   // just enough to reach the line, not to leave
        s.fuel = XFUSE_PRIMER;
        addText(s.x, s.y - 46, "PRIMER MIST — FLY TO THE LINE", "#ffc400");
        goldBurst(s.x, s.y - 20);
      }
      blip(520, 780, 0.2, "sine", 0.1);
    }
  } else if (rd.phase === "line") {
    updateTransfusion(dt, rd);
  } else {   // out
    rd.y -= 260 * dt;
    if (rd.t >= 1.2) resupplyDrone = null;
  }
}
function updateTransfusion(dt, rd) {
  const s = ship;
  const cp = capturePoint(rd);
  const d = Math.hypot(s.x - cp.x, s.y - cp.y);
  const wasAttached = rd.attachedNow;
  rd.attachedNow = !s.dead && !s.landed && d < xfuseWindowR();
  // FIRE = detach, the whole time the line is out and caught (edge-triggered)
  const fire = input.fire || pad.fire;
  if (rd.everAttached && fire && !rd.firePrev) {
    rd.firePrev = fire;
    finishTransfusion(rd, false);
    return;
  }
  rd.firePrev = fire;
  if (rd.attachedNow) {
    rd.everAttached = true;
    s.shield = false;   // the field would sever the umbilical
    if (!wasAttached) { blip(300, 460, 0.12, "sine", 0.09); haptic.light(); }
    if (s.fuel >= maxFuel()) { finishTransfusion(rd, true); return; }
    s.fuel = Math.min(maxFuel(), s.fuel + XFUSE_RATE * dt);
    rd.given += XFUSE_RATE * dt;
    // the drip — and while a contaminant rides along, the pump inherits
    // the arrhythmia (same 0.5/1.7 stutter as the score and the ECG)
    rd.dripT += dt;
    let step = 0.34;
    if (contaminantAboard()) step *= rd.dripFlip ? 0.5 : 1.7;
    if (rd.dripT >= step) {
      rd.dripT = 0; rd.dripFlip = !rd.dripFlip;
      blip(660, 590, 0.05, "sine", 0.045);
      haptic.light();
    }
  } else if (rd.everAttached) {
    if (d >= XFUSE_SNAP_R) {   // wandered too far — the line parts
      score = Math.max(0, score - 50);
      banner("LINE SEVERED — REMAINDER LOST  -50\nSIGNAL AGAIN IF YOU NEED IT", "#ff4081");
      blip(500, 90, 0.3, "sawtooth", 0.14);
      haptic.medium();
      s.fireCd = Math.max(s.fireCd, 0.5);   // a held FIRE shouldn't snap into a shot
      rd.phase = "out"; rd.t = 0;
      return;
    }
    if (d >= xfuseWindowR()) rd.occluded = true;   // stuttering, no flow
  }
  if (rd.t >= XFUSE_PATIENCE) {
    banner("TRANSFUSION WINDOW CLOSED — SIGNAL AGAIN IF NEEDED", "#ffc400");
    rd.phase = "out"; rd.t = 0;
  }
}
function finishTransfusion(rd, full) {
  if (full && !rd.occluded) {
    score += 250;
    addText(ship.x, ship.y - 40, "CLEAN LINE +250", "#69f0ae");
    blip(520, 1040, 0.3, "sine", 0.12);
  } else {
    addText(ship.x, ship.y - 40, "LINE RELEASED — FUEL +" + Math.round(rd.given), "#ffc400");
    blip(420, 300, 0.15, "sine", 0.1);
  }
  haptic.light();
  ship.fireCd = Math.max(ship.fireCd, 0.5);   // the detach tap never becomes a shot
  rd.phase = "out"; rd.t = 0;
}

/* ---- the secret lifts and what waits below ---- */
function updateLift(dt) {
  const L = level.lift;
  if (!L) return;
  if (mercyBreach || level.extraction) { L.holdT = 0; return; }
  const near = ship.landed && !ship.dead &&
    Math.abs(ship.x - L.x) < 46 && Math.abs((ship.y + SHIP_R) - L.y) < 24;
  if (!near) { L.holdT = 0; L.armed = true; return; }
  if (!L.armed) return;   // must lift off the pad once before it cycles again
  L.holdT += dt;
  if (L.holdT > 0.6 && !L.hinted) {
    L.hinted = true;
    addText(L.x, L.y - 44, "THE PAD RINGS HOLLOW…", "#b388ff");
    blip(180, 120, 0.3, "sine", 0.1);
  }
  if (L.holdT >= 2.4 && !liftTransit) {
    startLiftTransit(level.isCave ? "up" : "down", L);
  }
}

/* the lift used to cut straight to the new level; now it plays out a
   continuous descent/ascent across the cut — sink (or rise) out of view on
   the departure screen, fade to black, hold a breath in the dark (travel
   chevrons + destination line), swap levels, then fade in with the same
   motion completing on the arrival screen. `sign` is the one thing that
   differs between directions: +1 sinks (down), -1 rises (up), and every
   phase just walks ship.y by 40 world px in that direction. Motion is
   smoothstepped (no linear jolts), the pad breathes dust while the plate
   moves, and arrival lands with a soft thunk instead of a cut. */
const LIFT_SINK_T = 0.7, LIFT_FADE_T = 0.45, LIFT_HOLD_T = 0.5, LIFT_SETTLE_T = 0.7, LIFT_OFFSET = 40;
const liftEase = p => p * p * (3 - 2 * p);
function liftDust(x, padY) {
  for (const dx of [-44, 44]) {
    particles.push({ x: x + dx + (Math.random() - 0.5) * 10, y: padY,
      vx: (Math.random() - 0.5) * 26 + dx * 0.25, vy: -14 - Math.random() * 30,
      t: 0.4 + Math.random() * 0.3, max: 0.7,
      color: Math.random() < 0.6 ? "#b388ff" : "#8a86a8", size: 1.5 + Math.random() });
  }
}
function startLiftTransit(dir, L) {
  liftTransit = { dir, L, phase: "sink", t: 0, fade: 0, startY: ship.y, swapped: false };
  ship.vx = 0; ship.vy = 0;
  camera.shake += 3;
  haptic.light();
  hydraulic(dir === "down");
}
function updateLiftTransit(dt) {
  const lt = liftTransit;
  const sign = lt.dir === "down" ? 1 : -1;
  lt.t += dt;
  if (lt.phase === "sink") {
    const p = liftEase(clamp(lt.t / LIFT_SINK_T, 0, 1));
    ship.y = lt.startY + sign * p * LIFT_OFFSET;
    if (Math.random() < dt * 22) liftDust(ship.x, lt.startY + SHIP_R + 2);
    if (lt.t >= LIFT_SINK_T) { lt.phase = "black"; lt.t = 0; }
  } else if (lt.phase === "black") {
    lt.fade = liftEase(clamp(lt.t / LIFT_FADE_T, 0, 1));
    if (lt.t >= LIFT_FADE_T) { lt.phase = "hold"; lt.t = 0; lt.fade = 1; }
  } else if (lt.phase === "hold") {
    lt.fade = 1;
    if (!lt.swapped) {
      lt.swapped = true;
      if (lt.dir === "down") enterCave(lt.L); else exitCave();
      lt.restY = ship.y;
      ship.y = lt.restY - sign * LIFT_OFFSET;
      hydraulic(lt.dir === "down");
    }
    if (lt.t >= LIFT_HOLD_T) { lt.phase = "reveal"; lt.t = 0; }
  } else if (lt.phase === "reveal") {
    lt.fade = 1 - liftEase(clamp(lt.t / LIFT_FADE_T, 0, 1));
    if (lt.t >= LIFT_FADE_T) { lt.t = 0; lt.fade = 0; lt.phase = "settle"; }
  } else if (lt.phase === "settle") {
    const p = liftEase(clamp(lt.t / LIFT_SETTLE_T, 0, 1));
    ship.y = (lt.restY - sign * LIFT_OFFSET) + sign * p * LIFT_OFFSET;
    if (Math.random() < dt * 22) liftDust(ship.x, lt.restY + SHIP_R + 2);
    if (lt.t >= LIFT_SETTLE_T) {
      ship.y = lt.restY;
      liftTransit = null;
      // arrival is a beat, not a cut: a soft thunk and a breath of dust
      camera.shake += 4;
      haptic.light();
      blip(140, 90, 0.22, "sine", 0.12);
      for (let i = 0; i < 14; i++) {
        particles.push({ x: ship.x + (Math.random() - 0.5) * 56, y: ship.y + SHIP_R,
          vx: (Math.random() - 0.5) * 70, vy: -18 - Math.random() * 45,
          t: 0.5 + Math.random() * 0.4, max: 0.9,
          color: Math.random() < 0.6 ? "#b388ff" : "#8a86a8", size: 1.6 });
      }
    }
  }
}

function updateShrine(dt) {
  const sh = level.shrine;
  if (!sh || sh.found) return;
  if (ship.landed && Math.abs(ship.x - sh.x) < 80) {
    sh.scanT += dt * scanRate();
    if (sh.scanT >= 2) {
      sh.found = true;
      shrines.add(level.caveIdx);
      shrinesSeen.add(level.caveIdx); saveShrinesSeen();
      score += 1000;
      let extra = "";
      if (shrines.size >= SHRINES.length) {
        score += 3000;
        extra = "\n\n★ GLYCON UNMASKED — the whole counterfeit laid bare. +3000";
      }
      const c = SHRINES[level.caveIdx];
      blip(300, 1200, 0.6, "sine", 0.14);
      staticTick();
      showCard({ kicker: c.kicker + " · SECRET +1000", title: c.title, subtitle: "",
        body: c.body + extra, color: c.color });
    }
  } else sh.scanT = 0;
}

/* ---- Bundle N — the counterfeit MERCY (its own rects and update fn;
   deliberately NOT part of bayRects(), so no docking/extraction logic can
   ever mistake it for the real ship) ---- */
let decoyOutcome = null;   // null | "trapped" | "observed" — feeds the ending epilogue
function decoyBayRect() {
  const f = level.fakeMercy;
  return { x0: f.x - 100, x1: f.x + 100, y0: f.y + 24, y1: f.y + 130 };
}
function decoySnared() {
  if (!level || !level.fakeMercy || level.fakeMercy.dead || !ship || ship.dead) return false;
  const b = decoyBayRect();
  return ship.x > b.x0 && ship.x < b.x1 && ship.y > b.y0 && ship.y < b.y1;
}
function updateDecoy(dt) {
  const f = level.fakeMercy;
  if (f.dead) return;
  const s = ship;
  if (decoySnared()) {
    // N2 — the trap: no heal, no fuel; the bay drinks, and after two
    // seconds it shows its teeth
    f.dockT += dt;
    s.fuel = Math.max(0, s.fuel - 6 * dt);
    if (f.dockT >= 2) {
      f.dead = true; decoyOutcome = "trapped";
      score = Math.max(0, score - 200);
      banner("COUNTERFEIT — THE BAY IS A MOUTH  -200", PAL().REVEAL);
      staticTick(); dullThud();
      explode(f.x, f.y + 40, PAL().REVEAL, 30);
      showCard({ kicker: "THE THIRD ACT · -200", title: "THE BAY IS A MOUTH", subtitle: "",
        body: "No healing. No fuel. A hull with nothing inside but appetite — wearing the one shape you stopped checking.\n\nHe built a better lure this time. He built the thing you trust.",
        color: PAL().REVEAL });
    }
  } else {
    f.dockT = 0;
    // N3 — the observed win: land beneath it and count the beats (the same
    // landed scan as Bundle J), or put a single shot into the hull
    if (s.landed && !s.dead && Math.abs(s.x - f.x) < 100) {
      f.scanT += dt * scanRate();
      if (f.scanT >= SCAN_T) { scannedSecret = true; decoyDown(f); }
    } else f.scanT = Math.max(0, f.scanT - dt * 2);
  }
}
function decoyDown(f) {   // identified WITHOUT docking — Glycon's best lure fails
  f.dead = true; decoyOutcome = "observed";
  score += 800;
  explode(f.x, f.y - 10, PAL().REVEAL, 40);
  staticTick();
  showCard({ kicker: "COUNTERFEIT IDENTIFIED · +800", title: "MACHINE TIME", subtitle: "",
    body: "Her emblem pulses like a pulse. Its emblem keeps perfect time.\n\nYou counted the beats. He never learned a heartbeat.",
    color: "#aef4ff" });
}

function updateBeacon(dt) {
  const b = level.beacon;
  if (!b || b.resolved) return;
  const s = ship;
  if (s.landed && Math.abs(s.x - b.x) < 90) {
    b.silenceT += dt;
    if (b.silenceT >= 5) resolveBeacon("answered");
  } else b.silenceT = Math.max(0, b.silenceT - dt * 2);
}

function resolveBeacon(how) {
  const b = level.beacon;
  b.resolved = true;
  endingType = how;
  setHaunt(false);   // the Static is answered (or silenced) — the title rests
  markVeteran();     // any resolved ending unlocks REMIX ROTATION (M2)
  if (how === "fire") {
    score += 3000;
    explode(b.x, b.y - 40, "#b388ff", 80);
    explode(b.x, b.y - 20, "#ffc400", 50);
    state = "ending"; stateT = 0;
  } else {
    score += 6000;
    if (runFired === 0) score += 2000;
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      particles.push({ x: b.x, y: b.y - 40, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 - 30,
        t: 1 + Math.random(), max: 2, color: "#aef4ff", size: 2 });
    }
    blip(220, 880, 1.2, "sine", 0.15);
    // Bundle L2 — the answered call earns a held breath before the card:
    // the camera goes to her, the rings die down, and she gets a name.
    b.fade = 1;
    state = "epilogue"; stateT = 0; epilogueChars = 0;
  }
}

/* Bundle L2 — six scripted seconds beside AMS SOLACE. The world keeps
   rendering, the camera eases to the beacon, the pulse rings fade out,
   and one line types on. Tap skips; it auto-advances to the ending card. */
const EPILOGUE_LINE = "AMS SOLACE · crew manifest 214 · status: HEARD.";
let epilogueChars = 0;
function updateEpilogue(dt) {
  const b = level.beacon;
  if (b) {
    camera.x = lerp(camera.x, b.x, 1 - Math.pow(0.05, dt));
    camera.y = lerp(camera.y, b.y - 90, 1 - Math.pow(0.05, dt));
    b.fade = Math.max(0, (b.fade || 0) - dt / 3);
  }
  if (stateT > 0.8) epilogueChars = Math.min(EPILOGUE_LINE.length, epilogueChars + dt * 16);
  if ((input.tap && stateT > 0.8) || stateT >= 6.5) { state = "ending"; stateT = 0; }
  input.tap = false;
}
function drawEpilogue(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(3,4,12," + Math.min(0.3, stateT * 0.08).toFixed(2) + ")";
  ctx.fillRect(0, 0, vw, vh);
  const line = EPILOGUE_LINE.slice(0, Math.floor(epilogueChars));
  ctx.textAlign = "center";
  ctx.font = "700 15px Menlo, monospace";
  ctx.fillStyle = "#aef4ff"; ctx.shadowColor = "#aef4ff"; ctx.shadowBlur = 12;
  const caret = epilogueChars > 0 && epilogueChars < EPILOGUE_LINE.length && Math.sin(now * 8) > 0 ? "▌" : "";
  ctx.fillText(line + caret, vw / 2, vh * 0.72);
  ctx.shadowBlur = 0;
}

