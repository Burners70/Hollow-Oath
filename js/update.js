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
const PARRY_WINDOW = 0.18; // E3: FIELD MEDIC parry window (forgiving)
const PARRY_WINDOW_STRICT = 0.09; // E3: the default, stricter window — a real timing test
const STRUGGLE_GAP = 4.5;  // E1: seconds between a retrieved Vector's fights for the controls
const STRUGGLE_YAW = 5.2;  // E1: how hard it wrenches the ship's rotation during a fight
const RESTRAIN_HOLD = 1.1; // E1: release steering this long to restrain it — a longer hold (owner steer)
// The breach on MERCY reveals a few beats AFTER a sleeper slips inside, by which
// time you've usually undocked and flown on — so the alarm lands when you're
// away from the bay and have to race back (owner steer).
const BREACH_REVEAL_DELAY = 3.5;
// While a Vector is loose on MERCY (before you retrieve it) it hurls the rescued
// Scions back out of her bay. You may be nowhere near — hence the warning. Catch
// them mid-fall. (Vectors aboard YOUR ship no longer throw; they cut fuel lines.)
const MERCY_THROW_FIRST = 2.2, MERCY_THROW_GAP = 6;
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
  // Owner steer: a first playthrough tells only the wound/echo story — logs
  // 1–10. The Glycon logs (11–14, which name the serpent, the workshop and the
  // maker) stay sealed until a run has been finished (veteran), so the deeper
  // truth is a second-pass reward, not a first-run muddle. Extra recoveries
  // still pay out in score.
  const cap = veteran ? FRAGMENTS.length : 10;
  if (runFragments >= cap) { score += 500; return null; }
  const idx = runFragments;
  const frag = FRAGMENTS[runFragments++];
  logsSeen.add(idx); saveLogs();   // into the ARCHIVE, permanently (K1)
  if (queueForClear) level.fragmentsHere.push(frag);
  return frag;
}

function explode(x, y, color, n, silent) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 220;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      t: 0.5 + Math.random() * 0.8, max: 1.3, color, size: 1.5 + Math.random() * 3 });
  }
  camera.shake = Math.min(camera.shake + (silent ? 4 : 14), 26);
  // nearby grounded Scions panic
  if (level) for (const o of level.oids) {
    if ((o.state === "wait" || o.state === "walk") && Math.abs(o.x - x) < 160 && Math.abs(o.y - y) < 160) {
      o.state = "panic"; o.panicT = 1.6 + Math.random();
    }
  }
  // `silent` lets the caller supply its own cue (a shield absorb, a gate slam)
  // instead of the generic explosion boom.
  if (!silent) boom();
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
  haptic.heavy();
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
  if (state !== "play" || level.isCave || level.isFinale || level.extraction || mercyBreach || pendingBreach) return;
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
  const halfW = 62;   // a wide bay across her belly (her underside is ~190 wide)
  // the recess sits INSIDE her belly: top tucks up into the hull, base flush
  // with her belly line (my + 20) — it never hangs below the bottom of the hull
  const top = my - 18, bot = my + 20;
  return { x0: mx - halfW, x1: mx + halfW, cx: mx, cy: (top + bot) / 2, top, bot };
}
function inHangar() {
  const h = hangarRect();
  // a generous band centred on the opened bay so you're clearly tucked up into
  // her hull — gentle station-keeping holds it without frantic thrust
  return !ship.dead && !ship.landed &&
    ship.x > h.x0 + 4 && ship.x < h.x1 - 4 &&
    ship.y > h.top - 6 && ship.y < h.bot + 8;
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
    if (e.beatT >= 1.9) sectorClearNow();   // capture → doors shut → jet away
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
      // B2 — MERCY spools up and jumps out: a rising engine surge/whoosh that
      // builds into the jump streak. A heavy haptic marks the departure (B4).
      departureSurge();
      haptic.heavy();
    }
  } else e.hold = Math.max(0, e.hold - dt * 1.5);
}

/* S4.5 — the triage call. Once at least one Scion is home and half the manifest
   is accounted for, MERCY will answer early: hover in the ventral hangar with an
   empty deliverable cabin and she offers an early extraction — at the cost of
   every Scion still waiting on the ground. Retreat is allowed, but never free. */
function updateEarlyExtraction(dt) {
  if (level.extraction || mercyBreach || pendingBreach || level.isFinale || level.isCave || state !== "play") {
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
  if (names.length) body += "\nOne of them is someone extraordinary.";   // felt, never named — you left before knowing
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
    // a famous mind left behind costs more, but you leave before you ever learn
    // who — no name, only the weight of it
    if (fam) addText(level.mx, level.my + 40, "SOMEONE EXTRAORDINARY, LEFT BEHIND  −500", "#ffd54f");
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

function triggerBreach(infected) {
  // E1 — the breach is now a two-dock recovery: RETRIEVE it back onto your ship
  // at the recovery bay, then ferry it (it fights you) to the red isolation bay.
  // retrieved gates the seal; ph/fightT/struggle drive the control-fight jeopardy.
  mercyBreach = { t: easyMode ? 60 : 45, retrieved: false, wasInfected: !!infected,
                  ph: 0, fightT: STRUGGLE_GAP, struggle: false, calmT: 0 };
  haptic.pattern([{ delay: 0, style: "heavy" }, { delay: 250, style: "heavy" }]);   // klaxon ×2 (F2)
  level.contamKnown = true;
  banner("UNSCREENED UNIT LOOSE ON MERCY\nDOCK THE RECOVERY BAY TO RETRIEVE IT, THEN THE RED BAY", "#ff4081");
  blip(880, 220, 0.6, "sawtooth", 0.2);
}

function resolveBreach(success) {
  mercyBreach = null;
  if (success) {
    score += 750;
    banner("CONTAMINANT SEALED IN ISOLATION  +750\nLOCKDOWN LIFTED", "#69f0ae");
    blip(520, 1040, 0.3, "sine", 0.15);
  } else {
    score = Math.max(0, score - 1000);
    mercyDamaged = true;
    banner("RECOVERY BAY SABOTAGED  -1000\nHEALING OFFLINE THIS SECTOR", "#ff4081");
    blip(300, 60, 0.6, "sawtooth", 0.2);
  }
}

/* E1 — once a breached Vector is retrieved aboard for transport, it periodically
   fights for the controls: an erratic left/right yaw wrenches the ship. The only
   way to restrain it is to LET GO of steering for a moment, then it settles until
   the next bout. Runs only while breached + retrieved (see updatePlay). */
function updateVectorStruggle(dt) {
  const b = mercyBreach, s = ship;
  if (!b || !b.retrieved || s.dead || state !== "play") return;
  b.ph += dt;
  const steering = input.left || input.right || pad.left || pad.right;
  if (!b.struggle) {
    b.fightT -= dt;
    if (b.fightT <= 0) {
      b.struggle = true; b.calmT = 0;
      banner("IT'S FIGHTING FOR THE CONTROLS — LET GO TO RESTRAIN IT", PAL().DANGER);
      sabotageFlash = 0.6; haptic.heavy(); sabHiss();
    }
  } else {
    // the Vector wrenches the stick — an erratic yaw that fights your hand
    s.ang += (Math.sin(b.ph * 13) * 0.7 + (Math.random() - 0.5) * 0.7) * STRUGGLE_YAW * dt;
    if (steering) {
      b.calmT = 0;   // fighting back for the stick only prolongs the struggle
    } else {
      b.calmT += dt;
      if (b.calmT >= RESTRAIN_HOLD) {
        b.struggle = false;
        b.fightT = STRUGGLE_GAP + Math.random() * 3;
        addText(s.x, s.y - 34, "RESTRAINED", "#69f0ae");
        haptic.light();
      }
    }
  }
}

/* ---------------- update ---------------- */
let ctlShown = null;
function updateCtlVisibility() {
  // virtual controls exist only in flight — not on the title, intro,
  // briefings, or story cards — and hide the instant a gamepad is active
  const want = (state === "play" || state === "dead") && !pad.connected;
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
    case "legend":
      // U3 — page through the HUD legend, then return where it was opened from
      if (input.tap && stateT > 0.4) {
        if ((LEGEND_CARD.pages || 1) > 1 && (LEGEND_CARD.page || 0) < LEGEND_CARD.pages - 1) {
          LEGEND_CARD.page++; blip(440, 550, 0.06, "sine", 0.06);
        } else { LEGEND_CARD.page = 0; state = legendReturnState || "title"; stateT = 0.4; }
      }
      input.tap = false; return;
    case "helpmenu": updateHelpMenu(); return;
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
      // the three reference screens now live under one HELP submenu (declutter)
      state = "helpmenu"; stateT = 0;
      blip(440, 660, 0.1, "sine", 0.08);
    } else if (state === "title" && inRect(codexRect(), input.tapX, input.tapY)) {
      state = "codex"; stateT = 0;
      codexTab = 0; archivePage = 0; mindsPage = 0; codexCard = null;
      blip(550, 825, 0.1, "sine", 0.08);
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

/* the HELP submenu — the three reference screens, one tap away from the title */
function updateHelpMenu() {
  if (input.tap && stateT > 0.25) {
    if (inRect(helpMenuRowRect(0), input.tapX, input.tapY)) {
      state = "help"; stateT = 0; HELP_CARD.page = 0; blip(440, 660, 0.1, "sine", 0.08);
    } else if (inRect(helpMenuRowRect(1), input.tapX, input.tapY)) {
      state = "legend"; stateT = 0; LEGEND_CARD.page = 0; legendReturnState = "title";
      blip(440, 660, 0.1, "sine", 0.08);
    } else if (inRect(helpMenuRowRect(2), input.tapX, input.tapY)) {
      // replay the opening narrative (it flows into a new run)
      goFullscreen();
      if (window.hideA2HS) window.hideA2HS();
      resetRun();
      introIdx = 0; state = "intro"; stateT = 0;
      blip(330, 660, 0.2, "sine", 0.1);
    } else {
      state = "title"; stateT = 0.5;   // tap outside → back to the title
    }
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
  // The counterfeit MERCY only exists on a veteran return pass, so its warning
  // (and the "count the beats" tell that tells the two ships apart) belongs in
  // the finale briefing only then — a first run meets one true MERCY and never
  // hears this. Spelled out so "count the beats" is never a mystery: ours beats
  // like a heart, his keeps a machine's perfect time.
  if (levelIdx === FINALE_IDX && level && level.fakeMercy)
    t += "\n\nOne more thing, and it matters. Two ships will answer as MERCY on approach. One is ours. One is his — a hull built to wear the shape you stopped checking.\n\nTell them apart by the emblem. OURS beats like a heart: uneven, alive. HIS blinks in perfect mechanical time, like the counterfeit fuel. Count the beats before you dock.";
  if (runMode === "daily" && dailyMods.length)
    t = "TODAY'S CONDITIONS — " +
      dailyMods.map(m => m.name + " (" + m.desc + ")").join(" · ") + ".\n\n" + t;
  // S4.5 — the grim line after a triage retreat, carried into the next briefing
  if (leftBehindNote)
    t += "\n\nYou left " + leftBehindNote.n + " behind on " + leftBehindNote.sector +
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
      if (blackboxCount >= TRIANGULATE_N) toBriefing(FINALE_IDX);
      else { endingType = "unresolved"; setHaunt(true); state = "ending"; stateT = 0; }
    } else { state = "ending"; stateT = 0; }
  }
  input.tap = false;
}

/* Owner steer: pausing on a text/story screen (a card, a briefing, the ending)
   must return you to THAT screen, on the same page — not drop you into flight or
   skip ahead. Pause remembers where it came from and its progress, and resume
   restores both. Backgrounding the app while reading now pauses too, so you never
   lose your place. */
let pauseReturnState = "play", pauseReturnT = 0;
const PAUSABLE = new Set(["play", "reveal", "clear", "brief", "ending", "epilogue", "confirm"]);
function enterPause() {
  if (!PAUSABLE.has(state)) return;
  if (state === "play") snapshotRun();
  pauseReturnState = state; pauseReturnT = stateT;
  state = "pause"; stateT = 0;
}
function leavePause() { state = pauseReturnState || "play"; stateT = pauseReturnT || 0; }

function updatePause() {
  if (thrustGain) thrustGain.gain.value = 0;
  if (input.tap && stateT > 0.25) {
    if (inRect(pauseRowRect(0), input.tapX, input.tapY)) { leavePause(); }
    else if (inRect(pauseRowRect(1), input.tapX, input.tapY)) { toBriefing(levelIdx); }
    else if (inRect(pauseRowRect(2), input.tapX, input.tapY)) {
      settingsReturnState = "pause"; state = "settings"; stateT = 0;
    }
    else if (inRect(pauseRowRect(3), input.tapX, input.tapY)) { snapshotRun(); state = "title"; stateT = 0; }
    else if (inRect(pauseLegendRect(), input.tapX, input.tapY)) {
      state = "legend"; stateT = 0; LEGEND_CARD.page = 0; legendReturnState = "pause";
      blip(440, 660, 0.1, "sine", 0.08);
    }
  }
  input.tap = false;
}
let legendReturnState = "title";

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
      if (inRect(settingsRowRect(i), input.tapX, input.tapY)) {
        hit = true;
        if (i !== 8) resetArmed = false;   // any other tap disarms the wipe
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
        } else if (i === 4) {
          colorblind = !colorblind;
          try { localStorage.setItem("doids_cb", colorblind ? "1" : "0"); } catch (e) {}
          blip(440, 660, 0.1, "sine", 0.08);
        } else if (i === 5) {
          // FIELD MEDIC applies to the NEXT run — a live run keeps the
          // difficulty it launched with (lives/tolerances mid-run would
          // be a silent cheat toggle otherwise)
          easyMode = !easyMode;
          try { localStorage.setItem("doids_easy", easyMode ? "1" : "0"); } catch (e) {}
          blip(easyMode ? 440 : 300, easyMode ? 660 : 200, 0.12, "sine", 0.1);
        } else if (i === 6) {
          bigText = !bigText;
          try { localStorage.setItem("doids_bigtext", bigText ? "1" : "0"); } catch (e) {}
          blip(440, 660, 0.1, "sine", 0.08);
        } else if (i === 7) {
          reducedFlash = !reducedFlash;
          try { localStorage.setItem("doids_flash", reducedFlash ? "1" : "0"); } catch (e) {}
          blip(440, 660, 0.1, "sine", 0.08);
        } else if (i === 8) {
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
    enterPause();
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
  // fights your attitude while you're thrusting up and away. Owner steer: a
  // legal-but-tilted touchdown used to rest on a strut/corner; as the ship
  // settles (near the ground, descending) assist now rights the WHOLE permitted
  // landing angle, so on assist you always come down level.
  if (assist && !s.landed && !steer && s.vy > 0) {
    const tilt = ((s.ang % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    const nearGround = (groundAt(s.x) - (s.y + SHIP_R)) < 90;
    const cap = nearGround ? 0.5 : ASSIST_CAPTURE;   // 0.5 = the upright landing limit
    if (Math.abs(tilt) < cap) s.ang = tilt * Math.max(0, 1 - ASSIST_RATE * dt);
  }

  // force field: eats fuel, stops bullets, drones, rough ground and cave roofs.
  // Not while the transfusion line is out — the field would sever it, and (owner
  // steer) you shouldn't be able to parry mid-refuel.
  const refuelling = !!(resupplyDrone && resupplyDrone.phase === "line");
  const wantShield = (input.shield || pad.shield) && s.fuel > 0 && !s.dead && !refuelling;
  // E3 — the parry: for a brief window right after the field snaps up, a bullet
  // caught in it is REFLECTED, not just absorbed. Timed on the rising edge.
  // Owner steer: the window is tight (skill), and only FIELD MEDIC keeps the
  // forgiving one. Never armed while refuelling.
  if (wantShield && !s.shield && !refuelling) s.parryT = easyMode ? PARRY_WINDOW : PARRY_WINDOW_STRICT;
  s.shield = wantShield;
  if (s.parryT > 0) s.parryT = Math.max(0, s.parryT - dt);
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
  updateNightfall(dt);    // T6 — dusk → full dark on the Basin
  updateOids(dt, now);
  updateEnemies(dt);
  updateSabotage(dt);
  updateMercyThrow(dt);   // E2 — a breached MERCY hurls the rescued back out
  updateDocking(dt);
  updateBlackbox(dt);
  updatePods();
  updateResupplySignal(dt);
  updateLift(dt);
  updateShrine(dt);
  updateScan(dt);
  updateScionScan(dt);    // S5 — read a grounded unit's vitals; flag the fakes
  updateContagion(dt);    // Semmelweis Deep — unscreened contagion spreads
  updateCabinPulse(dt);   // S1 — a heartbeat chorus for who's aboard
  updateCaveAudio(dt);    // S3 — drips & distant rumble down in the Hollows
  updateStaticClock(dt);
  if (level.isFinale) updateBeacon(dt);
  if (level.fakeMercy) updateDecoy(dt);

  // a sleeper that slipped into MERCY reveals itself a few beats later — after
  // you've had time to undock and fly on, so the alarm lands away from the bay
  if (pendingBreach && !mercyBreach) {
    pendingBreach.t -= dt;
    if (pendingBreach.t <= 0) {
      const inf = pendingBreach.infected; pendingBreach = null;
      triggerBreach(inf);
    }
  }

  if (mercyBreach) {
    // the "loose on MERCY" clock only runs until you retrieve it; once it's in
    // your custody the pressure is the control-fight, not the timer (E1).
    if (!mercyBreach.retrieved) {
      mercyBreach.t -= dt;
      if (mercyBreach.t <= 0) resolveBreach(false);
    } else {
      updateVectorStruggle(dt);
    }
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
    if (o.state === "thrown") {
      // E2 — a Scion hurled from the cabin, falling. Fly into them to catch and
      // re-board; if they hit the ground they're lost (Field Medic: they survive).
      o.vy += GRAV * 1.2 * dt;
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (o.throwLock > 0) o.throwLock -= dt;
      if ((o.throwLock || 0) <= 0 && !s.dead && s.passengers.length < CAPACITY &&
          Math.hypot(o.x - s.x, o.y - s.y) < SHIP_R + 18) {
        o.state = "aboard"; s.passengers.push(o);
        heartbeat(); haptic.medium();
        addText(s.x, s.y - 40, "CAUGHT — SCION SAFE", "#69f0ae");
        continue;
      }
      const g = groundAt(o.x);
      if (o.y >= g) {
        o.y = g; o.vx = 0; o.vy = 0;
        if (easyMode) {   // Field Medic: they survive the drop, back on the ground
          o.state = "wait"; o.panicT = 1.4;
          addText(o.x, o.y - 40, "SURVIVED THE FALL", "#69f0ae");
          heartbeat(0.5, true);
        } else {
          o.state = "lost"; acctLevel().lost++; runLost++;
          const fam = o.role === "famous";
          score = Math.max(0, score - (fam ? 500 : 250));
          addText(o.x, o.y - 40,
            (fam ? FAMOUS[o.famousId].name + " LOST" : "SCION LOST") + " — HIT THE GROUND",
            fam ? "#ffd54f" : "#ff4081");
          explode(o.x, o.y - 8, "#ff4081", 14);
          checkSectorClear();
        }
      }
      continue;
    }
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
      // S5 / owner steer: with ANTISEPSIS earned, a grounded unit within scan
      // range is READ rather than boarded — it stays "wait" while updateScionScan
      // runs the diagnostic and creeps it slowly toward you. Once verified it
      // climbs aboard; a catalogued (flagged) counterfeit is left where it lies
      // and never boards. Without the upgrade there's no read — units board as
      // they always did.
      const scanCandidate = upgrades.antisepsis && !o.verified && !o.flagged &&
        Math.abs(s.x - o.x) < SCION_SCAN_RANGE && Math.abs(s.vx) < 20 && Math.abs(s.vy) < 20;
      if (!scanCandidate && !o.flagged) o.state = "walk";
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
          // warn the moment the cabin fills, so a full ship is known before you
          // fly to the next Scion and bump them off the hull (owner steer)
          if (s.passengers.length >= CAPACITY)
            banner("CABIN FULL — RETURN TO MERCY TO DELIVER", "#ffc400");
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
      if (s.shield) {
        // B1 — the field SOAKS the hit: a green spark + an absorption whumpf,
        // not the explosion boom. Haptic so it reads with sound off (B4).
        explode(dr.x, dr.y, "#69f0ae", 18, true);
        shieldAbsorb(); haptic.medium();
        addText(s.x, s.y - 30, "SHIELD HELD", "#69f0ae");
      } else {
        explode(dr.x, dr.y, "#ff4081", 24);
        s.vitals -= 40;
        haptic.heavy();
        addText(s.x, s.y - 30, "-40", "#ff4081");
        if (s.vitals <= 0) { shipDie(); return; }
      }
    }
  }

  for (let i = level.bullets.length - 1; i >= 0; i--) {
    const b = level.bullets[i];
    b.t -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.t <= 0 || b.y > groundAt(b.x)) { level.bullets.splice(i, 1); continue; }
    // E3 — a reflected bullet is now friendly: it hunts the turret/drone that
    // fired it and ignores the ship. (Reflecting isn't firing your own weapon,
    // so it never counts as malpractice / breaks the oath.)
    if (b.reflected) {
      let gone = false;
      for (const t of level.turrets) {
        if (t.alive && Math.hypot(b.x - t.x, b.y - (t.y - 8)) < 18) {
          t.alive = false; gone = true; score += 250;
          explode(t.x, t.y - 8, "#ffc400", 30); addText(t.x, t.y - 40, "REFLECTED +250", "#eaff6b");
        }
      }
      for (const dr of level.drones) {
        if (dr.alive && Math.hypot(b.x - dr.x, b.y - dr.y) < 16) {
          dr.alive = false; gone = true; score += 150;
          explode(dr.x, dr.y, "#ff4081", 22); addText(dr.x, dr.y - 30, "REFLECTED +150", "#eaff6b");
        }
      }
      if (gone) level.bullets.splice(i, 1);
      continue;
    }
    if (!s.dead && Math.hypot(b.x - s.x, b.y - s.y) < SHIP_R + (s.shield ? 10 : 3)) {
      if (s.shield && s.parryT > 0) {
        // E3 — PARRY: caught in the shield's opening window. Fling it back the
        // way it came (a touch faster) as a friendly projectile.
        b.reflected = true;
        b.vx = -b.vx * 1.3; b.vy = -b.vy * 1.3;
        b.t = Math.max(b.t, 1.3);
        explode(b.x, b.y, "#eaff6b", 6, true);
        shieldParry(); haptic.heavy();
        camera.shake += 4;
        addText(s.x, s.y - 30, "PARRY!", "#eaff6b");
        continue;
      }
      level.bullets.splice(i, 1);
      if (s.shield) {
        // B1 — bullet soaked by the field: green spark + absorption whumpf
        // (no explosion boom), and a light haptic for sound-off play (B4).
        explode(b.x, b.y, "#69f0ae", 8, true);
        shieldAbsorb(); haptic.light();
        continue;
      }
      s.vitals -= 26; camera.shake += 8;
      explode(b.x, b.y, "#ff4081", 10);
      haptic.medium();
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
    // Owner steer: a Vector riding YOUR hull no longer hurls passengers out —
    // that now happens on the MERCY (updateMercyThrow), where the rescued are
    // stored and where a throw is worth a warning because you may be far away.
    // Aboard your ship it bites the fuel line instead.
    s.fuel = Math.max(0, s.fuel - (easyMode ? 4.5 : 9));
    addText(s.x, s.y - 34, "FUEL LINE CUT", "#ff4081");
    blip(140, 60, 0.25, "sawtooth", 0.12);
  }
}

/* E2 (relocated) — the throw now happens on the MERCY. While a Vector is loose
   in her bay (breached, not yet retrieved) it periodically hurls a RESCUED Scion
   back out of the bay. The player may be anywhere in the sector, so it fires a
   loud warning; the Scion falls from MERCY's belly and can be caught mid-air by
   flying into it (as before). If it hits the ground it's lost. Jenner's
   INOCULATION protects the rescued, so a breach can't cost you them. */
function updateMercyThrow(dt) {
  const b = mercyBreach, s = ship;
  if (!b || b.retrieved || s.dead || state !== "play" || level.isCave) return;
  if (upgrades.inoculation) return;              // immunised — the loose one can't reach them
  b.throwT = (b.throwT == null) ? MERCY_THROW_FIRST : b.throwT - dt;
  if (b.throwT > 0) return;
  b.throwT = MERCY_THROW_GAP;
  // a rescued Scion already safe in MERCY — pick one to hurl back out
  const pool = level.oids.filter(o => o.state === "delivered" && o.role !== "saboteur");
  if (!pool.length) return;                      // nothing rescued to throw yet
  const o = pool[Math.floor(Math.random() * pool.length)];
  const m = mercyPos();
  o.state = "thrown";
  const side = Math.random() < 0.5 ? -1 : 1;
  o.x = m.mx + side * 30; o.y = m.my + 60;       // out of her ventral bay
  o.vx = side * (45 + Math.random() * 35);
  o.vy = 15 + Math.random() * 20;                // tossed down and out
  o.throwLock = 0.35;
  o.panicT = 0;
  // they're no longer safe — take them back off the manifest until re-caught
  level.delivered = Math.max(0, level.delivered - 1);
  runSaved = Math.max(0, runSaved - 1);
  sabotageFlash = Math.max(sabotageFlash, 0.5);
  banner("VECTOR ON MERCY — A RESCUED SCION IS THROWN FROM THE BAY\nFLY BACK AND CATCH THEM", PAL().DANGER);
  haptic.heavy(); dullThud(); staticTick();
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
const SCION_SCAN_RANGE = 200;   // land anywhere within this to begin reading a grounded unit
const SCAN_CREEP = 22;          // px/s it drifts toward you while read — far edge ≈ 8s > the 4s read
function updateScionScan(dt) {
  const s = ship;
  if (!upgrades.antisepsis) return;   // no diagnostic until Semmelweis is aboard
  // read the NEAREST unresolved grounded unit within range while you sit still
  let target = null, bd = SCION_SCAN_RANGE;
  if (s.landed && !s.dead && Math.abs(s.vx) < 20 && Math.abs(s.vy) < 20) {
    for (const o of level.oids) {
      if (o.state !== "wait" || o.flagged || o.verified) continue;
      const dx = Math.abs(s.x - o.x);
      if (dx < bd && Math.abs(groundAt(o.x) - (s.y + SHIP_R)) < 70) { bd = dx; target = o; }
    }
  }
  for (const o of level.oids)
    if (o !== target && o.oidScanT) o.oidScanT = Math.max(0, o.oidScanT - dt * 2);
  if (!target) return;
  target.oidScanT = (target.oidScanT || 0) + dt * scanRate();
  // it creeps toward the ship as it's read — a real Scion eager to be lifted, a
  // Vector closing on the hatch. Land too near and it reaches you before the read
  // finishes and boards UNREAD; keep a step back to finish the read with room to go.
  if (Math.abs(s.x - target.x) > 15) {
    target.x += Math.sign(s.x - target.x) * SCAN_CREEP * dt;
    target.y = groundAt(target.x);
  } else if (target.oidScanT < SCION_SCAN_T) {
    target.state = "walk"; target.oidScanT = 0;   // reached the hatch first — boards on trust
    return;
  }
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

/* SEMMELWEIS DEEP — the theme made mechanical (owner steer: "contamination
   spreads"). In the scrubbed ward an unscreened Vector left standing among the
   survivors taints the nearest un-scanned one, turning it into a hidden Vector.
   Dawdle and the ward breeds carriers; scanning a unit clean (verified) locks
   it safe, and lifting the Vector out stops it seeding. Gated to the sector
   that carries `contagion` in its RECIPE, and never taints the last survivor,
   a famous Scion, a log-carrier, or a unit you've already proven. */
const CONTAGION_R = 210, CONTAGION_T = 10;
function updateContagion(dt) {
  if (!level.contagion || ship.dead || state !== "play") return;
  if (level.extraction || mercyBreach) return;
  const grounded = o => o.state === "wait";
  const susceptible = level.oids.filter(o =>
    o.role === "normal" && !o.carrier && !o.verified && !o.flagged && grounded(o));
  if (susceptible.length <= 1) return;   // leave at least one clean survivor
  for (const src of level.oids) {
    if (src.role !== "saboteur" || !grounded(src)) continue;
    let best = null, bd = CONTAGION_R;
    for (const v of susceptible) {
      const d = Math.hypot(v.x - src.x, v.y - src.y);
      if (d < bd) { bd = d; best = v; }
    }
    if (!best) { src.contagT = 0; continue; }
    src.contagT = (src.contagT || 0) + dt;
    if (Math.random() < dt * 2)   // a sickly mote drifting toward the victim
      particles.push({ x: src.x + (Math.random() - 0.5) * 10, y: src.y - 12,
        vx: (best.x - src.x) * 0.35, vy: -6 - Math.random() * 6,
        t: 0.7, max: 0.7, color: "#6f9f7f", size: 1 });
    if (src.contagT >= CONTAGION_T) {
      src.contagT = -4;   // a cooldown before this carrier can seed again
      // E4 — `infected` marks a Scion turned by the ward (curable), distinct from
      // a BORN Vector (even a born sleeper). Only the infected can be cured.
      best.role = "saboteur"; best.sleeper = true; best.infected = true; best.contagT = 0;
      staticTick();
      for (let k = 0; k < 10; k++)
        particles.push({ x: best.x, y: best.y - 12,
          vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 30,
          t: 0.6, max: 0.6, color: "#4f7f5f", size: 1.4 });
      if (!level.contagSeen) {
        level.contagSeen = true;
        addText(best.x, best.y - 46, "THE WARD ISN'T CLEAN…", "#8fd6b8");
      }
    }
  }
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

/* T6 — night comes down on Nightingale Basin. The sector opens at dusk
   (darkAlpha 0.4) and, at 20s or the first Scion aboard (whichever is first),
   the dark falls to full (0.9) over 6s with a banner, a low drone swell and
   the lamp guttering on. The finale and BLACKOUT rotations skip all this and
   sit at full dark — they never set nightStaged. */
function updateNightfall(dt) {
  const L = level;
  if (!L.nightStaged) return;
  if (!L.nightFell) {
    L.nightT += dt;
    if (L.nightT >= 20 || ship.passengers.length > 0) {
      L.nightFell = true;
      L.nightRamp = 0;
      banner("NIGHT COMES DOWN ON THE BASIN", "#8390ff");
      nightfallSwell();
    }
    return;
  }
  if (L.darkAlpha < 0.9) {
    L.nightRamp += dt;
    L.darkAlpha = lerp(0.4, 0.9, clamp(L.nightRamp / 6, 0, 1));
  }
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
  if (e && e.done) { const j = Math.max(0, e.beatT - 0.9); jump = 1700 * j * j; }   // jets off once the doors are shut
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
    // E1 — a breached Vector is retrieved back aboard here for transport to the
    // red isolation bay (the two bays share no internal access). No heal/deliver
    // while you're doing it.
    if (mercyBreach && !mercyBreach.retrieved) {
      s.dockT += dt;
      if (s.dockT > 0.5) {
        s.dockT = 0;
        mercyBreach.retrieved = true;
        mercyBreach.fightT = STRUGGLE_GAP;
        banner("VECTOR RETRIEVED — CARRY IT TO THE RED ISOLATION BAY\nIT WILL FIGHT YOU — LET GO OF THE CONTROLS TO RESTRAIN IT", "#ffc400");
        blip(520, 300, 0.25, "square", 0.12); haptic.medium();
      }
      return;
    }
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
      haptic.medium();   // B4 — confirm a successful drop-off with sound off
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
        // it slips in quietly — the alarm comes a few beats later (owner steer),
        // by which time you've usually undocked and flown off
        pendingBreach = { infected: sab.infected, t: BREACH_REVEAL_DELAY };
      }
    }
  } else { s.dockT = 0; s.escapeT = 0; }

  if (inBay(bays.red)) {
    s.redDockT += dt;
    const sab = s.passengers.find(p => p.role === "saboteur");
    if (sab && s.redDockT > 0.35) {
      s.redDockT = 0;
      s.passengers.splice(s.passengers.indexOf(sab), 1);
      score += 750;
      if (sab.infected) {
        // E4 — an infected Scion, not a born Vector: isolation TREATS and cures
        // it, so it counts as a rescue rather than a sealed contaminant.
        sab.state = "delivered"; level.delivered++; runSaved++;
        addText(level.mx, level.my + 40, "INFECTED SCION CURED +750", "#69f0ae");
        explode(level.mx + 65, level.my + 60, "#69f0ae", 16, true);
        gateSlam(); heartbeat(); haptic.medium();
      } else {
        sab.state = "contained";
        level.contained++; // accounted for, but not a casualty
        addText(level.mx, level.my + 40, "CONTAMINANT SEALED +750", "#ff4081");
        // B3 — the isolation airlock: heavy metal gates slam shut. Silent spark
        // (gateSlam carries the impact) + a heavy haptic for sound-off play (B4).
        explode(level.mx + 65, level.my + 60, "#ff4081", 14, true);
        gateSlam(); haptic.heavy();
      }
      checkSectorClear();
    }
    if (mercyBreach && mercyBreach.retrieved) {
      s.breachDockT += dt;
      if (s.breachDockT > 2) {
        s.breachDockT = 0;
        if (mercyBreach.wasInfected) {
          // E4 — the retrieved unit was an infected Scion: cure it. Reclassify
          // from contained (counted at the breach) to a genuine save.
          level.contained = Math.max(0, level.contained - 1); level.delivered++; runSaved++;
          score += 750; mercyBreach = null;
          banner("INFECTED SCION CURED IN ISOLATION  +750\nRETURNED TO THE MANIFEST", "#69f0ae");
          blip(520, 1040, 0.3, "sine", 0.15); heartbeat(); haptic.medium();
        } else {
          resolveBreach(true); gateSlam(); haptic.heavy();
        }
      }
    } else s.breachDockT = 0;   // nothing to seal until it's been retrieved (E1)
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
      // the moment the bearing locks — its own beat, naming the source so the
      // NULLWAVE is never a term the finale drops on you unannounced
      const justTriangulated = blackboxCount === TRIANGULATE_N;
      const tail = blackboxCount >= TRIANGULATE_N
        ? "◈ Bearing locked. The source is THE NULLWAVE."
        : "◈ Recover " + TRIANGULATE_N + " of " + NBOX + " to triangulate the source. (" +
          blackboxCount + "/" + TRIANGULATE_N + ")";
      showCard({
        kicker: justTriangulated
          ? "TRIANGULATION COMPLETE · " + blackboxCount + "/" + NBOX + " · +800"
          : "BLACK BOX RECOVERED · SIGNAL " + blackboxCount + "/" + NBOX + " · +800",
        title: justTriangulated ? "THE SOURCE HAS A NAME" : "", subtitle: "",
        body: (justTriangulated
          ? "The recorders agree. Every echo bends toward one dead patch of sky — the silence the old charts call THE NULLWAVE. Whatever answers on our own frequency is down there.\n\n"
          : (frag || "The recorder is blank — wiped clean. Someone got here first.") + "\n\n") + tail,
        color: "#b388ff"
      });
      if (justTriangulated) { banner("TRIANGULATION COMPLETE — THE SOURCE IS THE NULLWAVE", "#b388ff"); staticTick(); }
    }
  } else bb.scanT = 0;
}

function updatePods() {
  const s = ship;
  for (const p of level.pods) {
    if (p.taken) continue;
    if (Math.hypot(s.x - p.x, s.y - (p.y - 8)) < 30) {
      // don't waste a pod on a full tank — warn instead, and leave it for later
      if (s.fuel >= maxFuel() - 0.5) {
        if (!p.fullWarn) { p.fullWarn = true; addText(p.x, p.y - 30, "TANK FULL", "#ffc400"); }
        continue;
      }
      p.fullWarn = false;
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
/* U-Hollows — MERCY's resupply signal never reaches the Hollows; the rock
   swallows it. A ship stranded at zero fuel underground has one way out:
   scuttle it. Holding THRUST this long fires the charge, and death handling
   (which spits the wreck back to the surface) breaks the soft-lock. */
const SCUTTLE_HOLD_T = 2.4;
function scuttleShip() {
  addText(ship.x, ship.y - 46, "CHARGES SET — ABANDONING SHIP", "#ff4081");
  banner("SCUTTLED IN THE HOLLOWS", "#ff4081");
  blip(220, 40, 0.8, "sawtooth", 0.2);
  haptic.pattern([{ delay: 0, style: "heavy" }, { delay: 180, style: "heavy" }]);
  shipDie();   // the wreck is spat back to the surface on respawn (see updateDead)
}
const XFUSE_RATE = 12, XFUSE_PRIMER = 10, XFUSE_PATIENCE = 30, XFUSE_SNAP_R = 130;
/* U2 — field refuelling is a priced, diminishing lifeline, not a reward.
   XFUSE_COST is points charged per unit of fuel the line delivers; XFUSE_FLOOR
   is the smallest tank the drone will ever leave you with (≥ primer + enough to
   limp to the next pad) so the crutch, even the RATIONED TANK daily mod plus
   this penalty, can never soft-lock a run. Each resupply caps lower than the
   last: maxFuel × 0.9^refuels, floored at XFUSE_FLOOR. */
const XFUSE_COST = 4, XFUSE_FLOOR = 35;
// Owner steer: on SEMMELWEIS DEEP the supply lines are cut — the drone still
// answers (a stranded ship must never be un-rescuable) but on scavenged reserves:
// it comes slower, fills slower, and leaves you with less. Never below the floor.
function supplyCut() { return !!(level && level.contagion); }
function xfuseCap() {
  const base = Math.round(maxFuel() * Math.pow(0.9, runRefuels) * (supplyCut() ? 0.7 : 1));
  return Math.max(XFUSE_FLOOR, base);
}
function xfuseRate() { return XFUSE_RATE * (supplyCut() ? 0.55 : 1); }
function signalHoldT() { return SIGNAL_HOLD_T * (supplyCut() ? 1.6 : 1); }
function xfuseWindowR() { return easyMode ? 44 : 34; }   // FIELD MEDIC widens the window
function capturePoint(rd) { return { x: rd.x, y: rd.y + 55 }; }
/* the resupply drone is a light airframe — the same gravity/radiation rings that
   drag the ship shove it too, so a fuel line strung across a ring won't sit still
   (owner steer). A swirl plus a pull, scaled down from the ship's, so it wanders
   the hover point rather than flinging the drone away. */
function driftDroneInRings(rd, dt) {
  if (!level.anomalies) return;
  for (const a of level.anomalies) {
    const dx = rd.x - a.x, dy = rd.y - a.y, d = Math.hypot(dx, dy);
    if (d < a.r && d > 1) {
      const f = a.str * (1 - d / a.r) * 0.5;
      rd.x += (-dy / d * f + dx / d * f * 0.25) * dt;
      rd.y += ( dx / d * f + dy / d * f * 0.25) * dt;
    }
  }
}
/* the resupply drone flies a real errand — out from MERCY and back to dock —
   so the wait is honest and you can follow it home if you like */
const DRONE_SPEED = 430;
function droneFlyTo(rd, tx, ty, dt) {
  const dx = tx - rd.x, dy = ty - rd.y, d = Math.hypot(dx, dy);
  const step = DRONE_SPEED * dt;
  if (d <= step) { rd.x = tx; rd.y = ty; return true; }
  rd.x += dx / d * step; rd.y += dy / d * step;
  return false;
}
/* "tethered" = the line has caught the ship at least once and is still out —
   from then until release, FIRE detaches instead of shooting */
function tethered() {
  return !!(resupplyDrone && resupplyDrone.phase === "line" &&
            resupplyDrone.everAttached && !ship.dead);
}
function updateResupplySignal(dt) {
  const s = ship;
  const stranded = s.landed && s.fuel <= 0 && !s.dead;
  // In the Hollows there is no drone to call — SIGNAL NOT RECEIVED. Holding
  // THRUST while stranded arms the scuttle charge instead (the only way out).
  if (level.isCave) {
    if (stranded && (input.thrust || pad.thrust)) {
      s.scuttleT = (s.scuttleT || 0) + dt;
      if (s.scuttleT >= SCUTTLE_HOLD_T) { s.scuttleT = 0; scuttleShip(); }
    } else {
      s.scuttleT = Math.max(0, (s.scuttleT || 0) - dt * 2.5);
    }
    return;
  }
  s.scuttleT = 0;
  if (stranded && !resupplyDrone && (input.thrust || pad.thrust)) {
    s.signalT += dt;
    if (Math.random() < dt * 8) particles.push({
      x: s.x + (Math.random() - 0.5) * 16, y: s.y - 6,
      vx: (Math.random() - 0.5) * 20, vy: -26, t: 0.3, max: 0.4,
      color: "#ffc400", size: 1.6 });
  } else if (!resupplyDrone) {
    s.signalT = Math.max(0, s.signalT - dt * 2.5);
  }
  if (s.signalT >= signalHoldT() && !resupplyDrone) {
    s.signalT = 0;
    // launched FROM MERCY's recovery bay, bound for a hover point above you
    const m = mercyPos();
    resupplyDrone = { x: m.mx, y: m.my + 40, hoverX: s.x, hoverY: s.y - 130, phase: "in", t: 0,
      given: 0, occluded: false, attachedNow: false, everAttached: false,
      dripT: 0, dripFlip: false, firePrev: true };
    blip(180, 420, 0.4, "sine", 0.12);
  }
  if (!resupplyDrone) return;
  const rd = resupplyDrone;
  rd.t += dt;
  driftDroneInRings(rd, dt);   // the rings shove the drone and its fuel line about
  if (rd.phase === "in") {
    // fly out from MERCY to the hover point above you (the wait is the distance)
    if (droneFlyTo(rd, rd.hoverX, rd.hoverY, dt)) {
      rd.phase = "line"; rd.t = 0;
      // U2 — this fill's ceiling, set once the line is out: less each time, but
      // never below the floor that keeps a stranded ship able to leave
      rd.cap = xfuseCap();
      rd.charged = 0;
      if (s.fuel < XFUSE_PRIMER) {   // just enough to reach the line, not to leave
        s.fuel = XFUSE_PRIMER;
        addText(s.x, s.y - 46, "PRIMER MIST — FLY TO THE LINE", "#ffc400");
        goldBurst(s.x, s.y - 20);
      }
      blip(520, 780, 0.2, "sine", 0.1);
    }
  } else if (rd.phase === "line") {
    updateTransfusion(dt, rd);
  } else {   // out — fly home and dock back into MERCY (follow it if you like)
    const m = mercyPos();
    if (droneFlyTo(rd, m.mx, m.my + 34, dt)) {
      resupplyDrone = null;
      blip(300, 620, 0.2, "sine", 0.09);   // docked
    }
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
    // U2 — the first time the line catches, this counts as one field resupply
    // (so the NEXT one carries less). Counted here, not at signal, so a window
    // that closes before you fly to the line never burns an allowance.
    if (!rd.everAttached) {
      runRefuels++;
      if (supplyCut()) addText(s.x, s.y - 46, "SCAVENGED RESERVES — SLOW, THIN FLOW", "#8fd6b8");
    }
    rd.everAttached = true;
    s.shield = false;   // the field would sever the umbilical
    if (!wasAttached) { blip(300, 460, 0.12, "sine", 0.09); haptic.light(); }
    if (s.fuel >= rd.cap) { finishTransfusion(rd, true); return; }
    // fill to THIS fill's ceiling — and charge the tally for every unit taken
    const before = s.fuel;
    s.fuel = Math.min(rd.cap, s.fuel + xfuseRate() * dt);
    const delivered = s.fuel - before;
    rd.given += delivered;
    const prevCost = Math.floor(rd.charged);
    rd.charged += delivered * XFUSE_COST;
    const dCost = Math.floor(rd.charged) - prevCost;
    if (dCost > 0) score = Math.max(0, score - dCost);
    // the drip — and while a contaminant rides along, the pump inherits
    // the arrhythmia (same 0.5/1.7 stutter as the score and the ECG)
    rd.dripT += dt;
    let step = 0.34;
    if (contaminantAboard()) step *= rd.dripFlip ? 0.5 : 1.7;
    if (rd.dripT >= step) {
      rd.dripT = 0; rd.dripFlip = !rd.dripFlip;
      blip(660, 590, 0.05, "sine", 0.045);
      haptic.light();
      // U2 — the running toll: points visibly draining as the tank climbs.
      // Sit it out to the side, opposite the drone, so the rising floater never
      // covers the drone, its fuel line or the transfusion status line.
      if (rd.charged >= 1) {
        const side = rd.x >= s.x ? -1 : 1;
        addText(s.x + side * 66, s.y - 6, "-" + Math.round(rd.charged), "#ff4081");
      }
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
  // U2 — the line is no longer a reward. The tally has already drained by
  // XFUSE_COST per unit during the fill; releasing just reports the toll.
  const toll = Math.round(rd.charged || 0);
  if (full && !rd.occluded) {
    addText(ship.x, ship.y - 40, "TANK TOPPED — RESUPPLY COST -" + toll, "#ffc400");
    blip(520, 1040, 0.3, "sine", 0.12);
  } else {
    addText(ship.x, ship.y - 40, "LINE RELEASED — FUEL +" + Math.round(rd.given) +
      "  ·  -" + toll, "#ffc400");
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
  if (!near) { L.holdT = 0; L.armed = true; L.rung = false; return; }
  // U1 — a distinct hollow ring the moment the ship first settles on the plate,
  // with its "…RINGS HOLLOW" cue firing on the same beat (owner steer: the pad
  // should ring AS you land, not a half-second later). Guarded so it fires once
  // per touchdown and re-arms when the ship lifts off the pad (near went false).
  if (!L.rung) {
    L.rung = true;
    ringHollow();
    addText(L.x, L.y - 44, "THE PAD RINGS HOLLOW…", "#b388ff");
    blip(180, 120, 0.3, "sine", 0.1);
  }
  if (!L.armed) return;   // must lift off the pad once before it cycles again
  L.holdT += dt;
  if (L.holdT > 0.6 && !L.hinted) {
    L.hinted = true;
    addText(L.x, L.y - 60, "HOLD TO DESCEND", "#b388ff");
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
    // Owner steer / the science of "being heard": answering isn't just landing
    // nearby — you transmit her OWN looping distress heartbeat back to her, in
    // time, so the signal finally receives the acknowledgement it has spent years
    // asking for and can stop repeating. Reframed in copy + a visible pulse that
    // spills from the ship to the beacon on each beat.
    if (b.silenceT <= 0) banner("HOLD — TRANSMITTING SOLACE'S OWN HEARTBEAT BACK TO HER", "#aef4ff");
    b.silenceT += dt;
    b.ackT = (b.ackT || 0) + dt;
    if (b.ackT >= 1.5) {
      b.ackT = 0; heartbeat(0.4, true);
      const dx = b.x - s.x, dy = (b.y - 40) - s.y, d = Math.hypot(dx, dy) || 1;
      for (let i = 0; i < 8; i++)
        particles.push({ x: s.x, y: s.y - 6,
          vx: dx / d * 120 + (Math.random() - 0.5) * 20,
          vy: dy / d * 120 + (Math.random() - 0.5) * 20,
          t: d / 120, max: d / 120, color: "#aef4ff", size: 2 });
    }
    if (b.silenceT >= 5) resolveBeacon("answered");
  } else { b.silenceT = Math.max(0, b.silenceT - dt * 2); b.ackT = 0; }
}

function resolveBeacon(how) {
  const b = level.beacon;
  b.resolved = true;
  endingType = how;
  endingFirstRun = !veteran;   // capture BEFORE markVeteran — did this run have the Glycon layer sealed?
  setHaunt(false);   // the Static is answered (or silenced) — the title rests
  markVeteran();     // any resolved ending unlocks REMIX ROTATION (M2) + the Hollows layer
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

