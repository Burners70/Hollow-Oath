"use strict";
/* =============================================================================
   js/debug.js — the `window.__doids` test/debug handle.

   Lifted out of the bottom of js/render.js (August 2026): it is a TEST SURFACE,
   not drawing, and at ~620 lines it was 12% of the biggest file in the repo —
   so every test-touching change had to page into render.js to reach it.

   Load order matters and is the only reason this can be its own file: it runs
   AFTER render.js (it closes over drawing helpers and module state from every
   file before it) and BEFORE main.js (whose bootstrap must be last). Scripts
   share one global scope, so nothing is imported or exported — see CLAUDE.md.

   Everything here exists for tests/*.spec.js and tests/qa-harness.html. Adding
   a feature? Expose its state on get() first, then assert on the PROPERTY
   rather than on numbers that will go stale.
   ============================================================================= */

window.__doids = {
  get: () => ({ ship, level, state, levelIdx, upgrades, blackboxCount,
    runFragments, runSaved, runLost, runFired, firedAtSecret, firedAtCombat, scannedSecret,
    mercyBreach, mercyDamaged,
    endingType, clearCards, revealCard, score, lives,
    // P·systems — the ladder. `a2Score` is the run's Act Two slice, `hiscore`
    // and `a2Hi` the two records, `fromStart` rule 3's provenance. Exposed
    // because every ladder test asserts a DIFFERENCE (zero is the floor, so an
    // assertion against 0 proves nothing) and needs both numbers to do it.
    hiscore, a2Score, a2Hi, fromStart: runFromStart,
    shrines: [...shrines], inCave: !!(level && level.isCave),
    input: Object.assign({}, input), ctlShown, introSeen,
    // X1/X3 — onboarding introspection for the guard tests
    trained, guideReturn,
    // V8 — veteran-opening introspection
    vetIntroSeen, introLen: activeIntro.length,
    // (owner feedback, July 2026) — the post-completion title flow
    solaceSeen, titleNudge, endingFirstRun,
    guide: { page: GUIDE.page, pages: GUIDE.pages, footY: GUIDE._footY },
    hasSave: !!savedRun, paused: state === "pause",
    sound, music, haptics, assist, tilt, colorblind, easyMode, bigText, reducedFlash,
    resetArmed, settingsRows: SETTINGS_ROWS, buildTag: BUILD_TAG,
    padPresent: pad.present, padConnected: pad.connected, padUse,
    sfxGainValue: sfxGain ? sfxGain.gain.value : null,
    musicGainValue: musicGain ? musicGain.gain.value : null,
    perfFrameMs, perfFps, resupplyDrone, liftTransit, runRefuels,
    staticClock, staticSurge,
    vitalsAudioLevel, cabinMedicRate,   // S2 / S9
    confirmOpen: !!confirmCard,          // S4.5
    logsSeen: [...logsSeen], shrinesSeen: [...shrinesSeen], codexTab, archivePage, mindsPage,
    codexCardOpen: !!codexCard,
    unresolvedHaunt, epilogueChars,
    runSeed, runMode, famousMap, veteran, dailyDone: dailyDoneToday(),
    gravScale, grav: grav(), gravLabel: gravLabel(),   // Z1
    gravTilt, gravSide: gravSide(),   // owner feature — the crosswind
    dailyMods: dailyMods.map(m => m.id), sectorT, maxFuel: maxFuel(),
    rects: { resume: resumeRect(), remix: remixRect(), daily: dailyRect(), start: startRect(),
      help: helpRect(), legend: legendRect(), pauseLegend: pauseLegendRect() },
    decoyOutcome, fakeMercy: level && level.fakeMercy,
    darkAlpha: level && level.darkAlpha, nightFell: level && !!level.nightFell,   // T6
    gcReports: gc.reports.slice(), cloudNative: cloud.native(),
    ratingReports: rating.reports.slice(), runsPlayed, ratingAskMsg,   // X6
    // X2/X4/X5 — onboarding-bundle introspection for the guard tests
    training: runMode === "training", trainingShown: Object.assign({}, trainingShown),
    coach: { active: state === "coach", text: coachText },
    currentHint, codex: [...codex],
    everParried, everScanned, metFake,
    /* ---- Bundle P (P·slice) — Act Two's own state ----
       Exposed from day one, per Bundle P's instruction, so the slice is testable
       headlessly WHILE it is being felt by hand on a phone: every number here is
       a feel value and the suite's job is to prove the machinery, not the tuning.
       null on every Act One level. */
    actTwo: actTwoActive() ? {
      chamberId: level.chamberId,
      saved: a2Saved, lost: a2Lost,
      // P·systems — the floor's own books: whether they are closed, whether the
      // oath held in this room, and what leaving it alone would have paid
      cleared: !!level.cleared, firedShots: level.firedShots,
      noFire: noFireAward(level), gunValue: gunValue(level),
      racks: level.racks.map(r => ({ id: r.id, x: Math.round(r.x), y: Math.round(r.y),
        state: rackStateFor(r), reserve: +r.reserve.toFixed(2),
        integrity: +r.integrity.toFixed(2), cut: r.cut, towed: r.towed,
        delivered: r.delivered, lost: r.lost, gives: r.gives,
        occupants: r.occupants, cradleT: +r.cradleT.toFixed(2),
        /* P·intake — a moved rack must stay a landing pad, or it can never be
           re-cradled. `moored` and `landable` are separate on purpose: the whole
           bug was the two being treated as one thing. */
        moored: !!r.moored, everTowed: !!r.everTowed,
        landable: landableRacks().some(k => k.id === r.id) })),
      // P·intake — the chamber's clock, and FIELD MEDIC's share of it
      pace: rackPace(), chamberPace: level.rackPace,
      // P·intake — the floor's ledger, which is a CARD now and not a banner
      ledger: level.clearLedger || null, ledgerPending: a2LedgerPending,
      conduits: level.conduits.map(c => ({ id: c.id, rack: c.rack, real: c.real,
        x: Math.round(c.x), cut: c.cut, scanT: +c.scanT.toFixed(2),
        // owner: a trunk runs DOWN and along under the deck now, so the suite
        // needs the route, not just its endpoints
        path: (c.path || []).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })) })),
      // owner: every decoy feed ends in a box, and landing beside one costs vitals
      decoys: (level.decoys || []).map(d => ({ id: d.id, conduit: d.conduit,
        x: Math.round(d.x), y: Math.round(d.y), mount: d.mount,
        penalised: d.penalised })),
      towing: towing(),
      tow: level.towedRack ? { x: Math.round(level.towedRack.x),
        y: Math.round(level.towedRack.y),
        vx: Math.round(level.towedRack.vx), vy: Math.round(level.towedRack.vy),
        speed: Math.round(Math.hypot(level.towedRack.vx, level.towedRack.vy)),
        // how far the load has swung off vertical, and therefore which tow tier
        // it currently fits through (§11.3's momentum pinch is exactly this)
        swing: Math.round(level.towedRack.swing || 0),
        envelope: +towEnvelope(level.towedRack.swing || 0).vertical.toFixed(1),
        tell: slingTellState(level.towedRack),
        tension: +(level.towedRack.tension || 0).toFixed(2) } : null,
      give: a2Line ? { rack: a2Line.rack.id, given: +a2Line.given.toFixed(2),
        cap: +a2Line.cap.toFixed(2), stall: !!a2Line.stall } : null,
      giveWanted: giveWanted(),
      // owner: an emplacement is tougher, so the suite needs to see it take hits
      turrets: (level.turrets || []).map(t => ({ x: Math.round(t.x), y: Math.round(t.y),
        heavy: !!t.heavy, hp: t.hp != null ? t.hp : 1, alive: t.alive })),
      // owner: fuel down here is cans plus a drone off the well, so the suite
      // needs to see both the placement and what's left of it
      fuel: (level.fuelCans || []).map(f => ({ id: f.id, x: Math.round(f.x),
        y: Math.round(f.y), taken: f.taken })),
      well: level.wellDock ? { x: Math.round(level.wellDock.x),
        y: Math.round(level.wellDock.y), docking: level.wellDock.docking,
        winchT: +level.wellDock.winchT.toFixed(2), taken: level.wellDock.taken,
        slot: (() => { const s = wellSlotPos(level.wellDock, performance.now() / 1000);
          return { x: Math.round(s.x), y: Math.round(s.y) }; })() } : null
    } : null }),
  go: toBriefing,
  // Y1 — the foreground tile-cache invalidation, plus a peek at the current
  // cache sizes so a test can assert the caches drop and then repaint.
  invalidateTiles,
  tileCacheSizes: () => ({
    terrain: level && level._terrainTiles ? level._terrainTiles.size : 0,
    roof: level && level._roofTiles ? level._roofTiles.size : 0 }),
  // R9 / S5 (owner steer): a Vector is NEVER given away by colour — with or
  // without ANTISEPSIS a saboteur (mech) renders exactly like a true Scion.
  // Identification is the earned SCAN (the "?" over a catalogued unit), not a
  // tint. Exposed so a test can assert the colour parity always holds.
  oidTint: () => PAL().SAFE,
  setStaticClock: v => { staticClock = v; },
  // Y4 — counterfeit-pod opacity, exposed so a guard test can assert the gate:
  // loud strobe only with Avicenna (`canon`), a faint Static-beat dip without.
  fakePodAlpha: (now, known) => fakePodAlpha(now, known),
  // Y3 — the deterministic per-wreck cant (stable frame to frame, RNG-free).
  wreckCant,
  // V6 — sonic-wave introspection + a test hook to arm a wave about to land
  waves: () => (level.waves || []).map(w => ({ t: +w.t.toFixed(2), done: w.done, hit: w.hit,
    finale: w.finale, returnBurst: !!w.returnBurst })),   // V13 — the parry knock-back's landing
  armWave: opts => {
    level.waves = level.waves || [];
    const src = (level.oids || []).find(o => o.role === "saboteur");
    level.waves.push({ src, ox: ship.x - 90, oy: ship.y, t: WAVE_ARRIVE - 0.01,
      done: false, hit: false, finale: !!(opts && opts.finale) });
  },
  // V2 — x of every scannable Scion that LACKS a fair scan-landing spot in the
  // current level (empty array = the fairness invariant holds).
  scanSpotFailures: () => (level.oids || [])
    .filter(o => o.role === "normal" || o.role === "saboteur" || o.role === "famous")
    .filter(o => !scanSpotOK(level.heights, level.W, o.x))
    .map(o => Math.round(o.x)),
  // the Glycon layer (Hollows lifts, shrines, counterfeit MERCY, logs 11–14) is
  // sealed until a run is finished — flip veteran on so a test can reach it
  setVeteran: () => markVeteran(),
  // (owner feedback, July 2026) — the Solace-hull title watermark's gate, so a
  // test can assert it stays hidden until she's actually been met
  setSolaceSeen: () => markSolaceSeen(),
  // V13 — the "husks" reveal gate (WORKSHOP shrine): before it, a disguised
  // unit is CORRUPTED not COUNTERFEIT, and there's no clean kill. Exposed so
  // tests can assert both sides without actually visiting the Hollows.
  husksKnown: () => husksKnown(),
  setHusksKnown: () => { shrinesSeen.add(HUSK_SHRINE_IDX); saveShrinesSeen(); },
  // V13 — the finished run's actual save/loss tally, for the veteran-intro
  // recap's variable opening line
  lastRunTally: () => ({ saved: lastRunSaved, lost: lastRunLost }),
  introCaption: () => resolveCaption(activeIntro[Math.min(introIdx, activeIntro.length - 1)]),
  remix: startRemix,
  daily: startDaily,
  training: startTraining,   // X2
  // M1 regression anchor: seed 0 must always produce today's exact levels
  heightChecksum: () => level.heights.reduce((a, h) => (a * 31 + Math.round(h)) | 0, 0),

  /* ---- P·terrain: span terrain and the chamber grammar ----
     Exposed from day one so the representation is testable headlessly while
     P·slice is being felt by hand (Bundle P's own instruction). */
  // load a compiled chamber as the live level. Terrain only — see genChamber.
  /* Takes an id ("breach"), a chamber NUMBER (1, or "1"), or nothing — which is
     chamber one now that there are three. It used to default to "slice", which
     was right when the slice was the only chamber and is wrong now that it is
     the third: a caller asking for "the chamber" means the first one. Every
     existing call site names "slice" explicitly, so none of them moved. */
  loadChamber: id => {
    const key = id == null || id === "" ? 1 : id;
    const num = Number(key);
    const ch = ACT_TWO_CHAMBERS.find(c => c.id === key)
      || (Number.isFinite(num) ? ACT_TWO_CHAMBERS.find(c => c.n === num) : null);
    if (!ch) return null;
    return __doids.enterChamber(ch);
  },

  /* The same entry, for a chamber that is not on the ladder. §8.1's tell has to
     be provable against a purpose-built room — the authored chambers carry no
     deception at all (the owner pulled both hazards from chamber one after the
     second on-device round, and the ladder puts the next one at chamber four,
     which P·content has not written) — and it must be provable LIVE rather than
     by compiling spans, because the whole tell is runtime behaviour: a beat, a
     recompile and four contact surfaces.

     Takes a chamber object built from the same authoring vocabulary the real
     ones use, so what it proves is the real code path and not a stand-in. */
  enterChamber: ch => {
    if (!ch || !ch.parts) return null;
    level = genChamber(ch);
    resetActTwo(); dustReset();       // P·slice — a fresh chamber attempt, and its own tallies
    /* P·systems rule 3 — THIS IS "a chamber entered directly". Loading a floor
       out of the ladder is not a run begun at Act One sector 0, so it forfeits
       the run's claim on the global hiscore and the all-time board (saveHi).
       Act Two's own record is untouched by that and starts clean here, because
       a direct entry IS a legitimate descent — just not a legitimate campaign.
       When the descent lands (P·persist), chamber-to-chamber progression will
       NOT come through here and must not clear the flag. */
    runFromStart = false; a2Score = 0;
    // owner: you come in at the well, because that is where MERCY can reach.
    // One shared entry point with the death path — see chamberEntryPos.
    const e = chamberEntryPos();
    ship.x = e.x; ship.y = e.y;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = false; ship.dead = false;
    ship.vitals = maxVitals(); ship.fuel = maxFuel();
    camera.x = ship.x; camera.y = ship.y;
    state = "play";
    /* No entry banner. One was added in this round and the owner dropped it
       ("Don't need that message"): the confusion it was written for turned out
       to be the mezzanine dead end and the unstroked faces, both of which are
       fixed, so a caption explaining the room was answering a question the room
       no longer asks. */
    return { id: ch.id, n: ch.n, name: ch.name, brief: ch.brief,
      W: ch.W, H: ch.H, cols: level.spans.length,
      racks: level.racks.length, conduits: level.conduits.length,
      decoys: level.decoys.length, turrets: level.turrets.length,
      well: !!level.wellDock, lies: level.lies.length };
  },
  /* The ladder, for anything that needs to offer a choice of chamber — today
     the QA harness's picker, tomorrow P·content's real progression. Ordered,
     and it reports what each chamber HAS, because that is the ladder: the
     harness shows "1 · THE BREACH · 1 feed, no decoys, no guns" rather than a
     bare id, and a chamber that quietly grew a gun is then visible. */
  a2Ladder: () => ACT_TWO_CHAMBERS.map(c => ({
    id: c.id, n: c.n, name: c.name, brief: c.brief, W: c.W, H: c.H,
    // P·intake — how fast the banks die here; a fourth monotonic column, and the
    // one an author most needs to see beside the elements it buys room for
    pace: c.pace != null ? c.pace : RACK_PACE_DEFAULT,
    racks: (c.racks || []).length, conduits: (c.conduits || []).length,
    decoys: (c.decoys || []).length, turrets: (c.turrets || []).length,
    pinches: partList(c.parts).filter(p => p.pinch).map(p => p.pinch),
    lies: chamberLies(c)
  })),

  /* ---- P·slice drivers. Every feel value in Act Two is tuned on hardware, so
     the suite's job is the machinery: reach a state in one call and assert the
     rules hold. These skip the HOLD, never the rule — a2Cut still routes through
     closeTrunk, so a decoy still alerts him and a real feed still starts the
     dying. */
  a2Cut: id => {
    const c = (level.conduits || []).find(k => k.id === id);
    if (!c || c.cut) return false;
    closeTrunk(c); return true;
  },
  a2Cradle: id => {
    const r = (level.racks || []).find(k => k.id === id);
    if (!r || !r.cut || r.lost || r.delivered || level.towedRack) return false;
    cradleRack(r);
    /* …and parts the moorings, because they are the second HOLD on the same
       action (0.55s of taut pull, see updateMooring) and this driver's contract
       is "reach the state in one call, skipping holds and never rules". Every
       caller means "the load is on the rope and free to move" by cradled. The
       mounts' own behaviour — that a bolted rack does NOT move, and what it
       takes to free it — is asserted through the real path instead. */
    r.moored = false; r.moorT = 0;
    return true;
  },
  a2Release: () => { if (!towing()) return false; releaseRack(); return true; },
  /* The moorings, parted. Skips the HOLD (0.55s of taut pull) and never the
     rule — same contract as a2Cut: the rack ends up seated on the rope exactly
     as updateMooring leaves it, so a test of the tether isn't also a test of
     how long the owner wants the mounts to resist. */
  a2Unmoor: id => {
    const r = (level.racks || []).find(k => k.id === (id || (level.racks[0] || {}).id));
    if (!r || !r.moored) return false;
    r.moored = false; r.moorT = 0;
    if (level.towedRack === r) seatPayload(r);
    return true;
  },
  // put the ship (and, if it is slung, its load) somewhere, so a test can reach
  // the far end of a 9000px floor without flying it
  a2Warp: (x, y, landed) => {
    ship.x = x; ship.y = y; ship.vx = ship.vy = 0; ship.ang = 0;
    ship.landed = !!landed; ship.dead = false;
    /* re-hang the load under the hull's new position rather than leaving it a
       room behind — the same seating the cradle and the lift beats use. NOT a
       rack that is still bolted in, though: a moored rack is part of the
       structure, and dragging it to the hull would quietly unbolt it. */
    if (level.towedRack && !level.towedRack.moored) seatPayload(level.towedRack, true);
    camera.x = x; camera.y = y;
    return true;
  },
  a2SetReserve: (id, v) => {
    const r = (level.racks || []).find(k => k.id === (id || (level.racks[0] || {}).id));
    if (!r) return false;
    r.reserve = v; return true;
  },
  a2Vitals: v => { ship.vitals = v; },
  /* P·intake — the tank, for the on-device rig. The low-fuel resupply call (hold
     SHIELD, landed, in a chamber) is the one fix from that round that cannot be
     reached by flying to a place: it needs a state, and burning 65% of a tank to
     get there by hand is the kind of setup the harness exists to skip. Takes a
     FRACTION rather than a number, because what matters is which side of
     A2_SIGNAL_FRAC you are on and maxFuel() moves with the Levi-Montalcini
     upgrade and the `rationed` daily modifier. */
  a2Fuel: frac => { ship.fuel = clamp(frac, 0, 1) * maxFuel(); return Math.round(ship.fuel); },

  /* ---- the on-device rig's entry points (tests/qa-harness.html) ------------
     Act Two is tuned by hand on a phone, so the tap-driven QA harness needs to
     reach the same places the suite does. These exist rather than having the
     harness read internals through `frame.contentWindow` because **a top-level
     `const` is NOT a property of `window`.** Classic scripts put `let`/`const`
     in the global *lexical* environment, so `contentWindow.SLING_L` is
     `undefined` while `contentWindow.markTrained` (a function declaration) works
     — a trap worth naming, since the harness already uses the second form and
     the first would have failed silently. */
  // every chamber the build knows about, so the rig's picker fills itself in as
  // P·content adds the other nine rather than needing an edit per chamber
  // (the QA harness's existing picker feed — a2Ladder above is the fuller one)
  a2Chambers: () => ACT_TWO_CHAMBERS.map(c => ({ id: c.id, n: c.n, name: c.name })),
  // park the ship where a slung load hangs at the bay's own slot — the dock
  // window is measured on the RACK, so this is the pose that matters
  a2WarpWell: () => {
    const w = level.wellDock;
    if (!w) return false;
    const slot = wellSlotPos(w, performance.now() / 1000);
    ship.x = slot.x; ship.y = slot.y - SLING_L;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = false; ship.dead = false;
    if (level.towedRack) seatPayload(level.towedRack, true);
    camera.x = ship.x; camera.y = ship.y;
    return true;
  },
  // land beside a rack, inside cradle reach
  a2WarpRack: id => {
    const r = (level.racks || []).find(k => k.id === id) || (level.racks || [])[0];
    if (!r) return false;
    ship.x = r.x; ship.y = r.y - 40;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true; ship.dead = false;
    if (level.towedRack) seatPayload(level.towedRack, true);
    camera.x = ship.x; camera.y = ship.y;
    return true;
  },
  /* The feel values, live. The whole point of a device pass is deciding these by
     hand, and the first question on a phone is always "what is it set to right
     now" — which is unanswerable from inside the game otherwise. */
  a2Dials: () => ({
    slingVisible: SLING_VISIBLE, slingL: +SLING_L.toFixed(1),
    shipShare: SLING_SHIP_W, safeV: SLING_SAFE_V, dmgK: SLING_DMG_K,
    reserveMax: RACK_RESERVE_MAX, drain: RACK_DRAIN, beatBite: RACK_BEAT_BITE,
    failingAt: RACK_FAILING_AT,
    /* P·intake — the clock the owner asked to slow, which is a per-chamber scalar
       on both drain terms rather than a change to either of them. `pace` is what
       is actually in force here (FIELD MEDIC included); `chamberPace` is what the
       floor authored. On the dials because this is the number a feel note about
       "too difficult" is now most likely to be about. */
    pace: level && level.isChamber ? rackPace() : null,
    chamberPace: level ? level.rackPace : null,
    giveRate: GIVE_RATE, givePerLine: GIVE_PER_LINE, giveFloor: GIVE_FLOOR,
    wellDockR: WELL_DOCK_R, wellDockV: WELL_DOCK_V,
    cradleT: CRADLE_T, recradleT: RECRADLE_T, trunkCutT: TRUNK_CUT_T,
    // and the geometry they imply, which is what a chamber is authored against
    envelopeAtRest: +towEnvelope(0).vertical.toFixed(1),
    envelopeSwung: +towEnvelope(TOW_SWING_LEVEL).vertical.toFixed(1),
    momentumGap: momentumGapPx(), restGap: restGapPx()
  }),

  /* ---- the traversability invariant -------------------------------------
     GAME_DESIGN's no-trolley-problem pillar says every chamber must be
     clearable with everyone alive, and Bundle P says that "wants an assertion,
     not a playtest opinion." This is the assertion's floor: a flood fill over
     the open spans, connecting two columns only where their intervals overlap
     by at least `need`, so the same code answers "can a bare ship get through"
     and "can a ship get through with a rack hanging under it" just by changing
     the number passed in.

     It exists because P·terrain's chamber could NOT be flown: its structural
     column was solid floor-to-ceiling and sealed the only route to the well, and
     every terrain test passed anyway because each one asserted a local property.
     Nothing was asking the whole-room question. */
  chamberRoute: need => {
    const S = level.spans;
    if (!S) return null;
    const gap = need != null ? need : 2 * SHIP_R + 4;
    const key = (i, j) => i * 16 + j;
    const seen = new Set(), stack = [];
    const push = (i, j) => { if (!seen.has(key(i, j))) stack.push([i, j]); };
    const startI = clamp(Math.round(ship.x / STEP), 0, S.length - 1);
    (S[startI] || []).forEach((sp, j) => { if (sp.bot - sp.top >= gap) push(startI, j); });
    while (stack.length) {
      const [i, j] = stack.pop();
      if (seen.has(key(i, j))) continue;
      seen.add(key(i, j));
      const sp = S[i][j];
      for (const n of [i - 1, i + 1]) {
        if (n < 0 || n >= S.length) continue;
        (S[n] || []).forEach((q, qj) => {
          if (q.bot - q.top < gap) return;
          if (Math.min(q.bot, sp.bot) - Math.max(q.top, sp.top) >= gap) push(n, qj);
        });
      }
    }
    const at = x => {
      const i = clamp(Math.round(x / STEP), 0, S.length - 1);
      return (S[i] || []).some((sp, j) => seen.has(key(i, j)));
    };
    let maxX = 0;
    /* minX as well as maxX: the fill is seeded at the ship, and the ship now
       enters at THE WELL (owner: that is where MERCY can reach), so the run goes
       right-to-left and back. "How far did the fill get" is a minimum in that
       direction — reporting only a maximum silently answered a question about
       the old left-hand entrance. */
    let minX = level.W;
    for (let i = 0; i < S.length; i++) if ((S[i] || []).some((sp, j) => seen.has(key(i, j)))) {
      maxX = i * STEP; minX = Math.min(minX, i * STEP);
    }
    return { gap: +gap.toFixed(1), spansReached: seen.size, maxX, minX,
      fromX: Math.round(ship.x),
      racks: (level.racks || []).map(r => ({ id: r.id, reachable: at(r.x) })),
      conduits: (level.conduits || []).map(c => ({ id: c.id, reachable: at(c.x) })),
      well: level.wellDock ? at(level.wellDock.x) : null };
  },
  // the same stable fingerprint idea as heightChecksum, over spans: a chamber
  // must compile identically every load or the authoring format isn't authoring
  spanChecksum: () => (level.spans || []).reduce((a, col) =>
    col.reduce((b, sp) => (b * 31 + Math.round(sp.top) * 7 + Math.round(sp.bot)) | 0, a), 0),
  spans: x => (level.spans ? (level.spans[clamp(Math.round(x / STEP), 0, level.spans.length - 1)] || [])
    .map(sp => ({ top: Math.round(sp.top), bot: Math.round(sp.bot) })) : null),
  spanCountAt: x => spanCountAt(x),
  // how many columns hold an overhang (2+ spans), and the tightest gap anywhere —
  // the two properties §11.0 says the heightmap could not express
  spanStats: () => {
    const s = level.spans || [];
    let overhangs = 0, solidCols = 0, tightest = Infinity, deepest = 0, shallowest = Infinity;
    for (const col of s) {
      if (col.length >= 2) overhangs++;
      if (!col.length) solidCols++;
      for (const sp of col) {
        tightest = Math.min(tightest, sp.bot - sp.top);
        deepest = Math.max(deepest, sp.bot);
        shallowest = Math.min(shallowest, sp.top);
      }
    }
    return { cols: s.length, overhangs, solidCols, deepest: Math.round(deepest),
      // how much vertical the open route actually uses — a FLOOR of a complex is
      // wide against this, not tall (owner steer, July 2026)
      verticalUsed: Math.round(deepest - (shallowest === Infinity ? 0 : shallowest)),
      tightest: tightest === Infinity ? null : Math.round(tightest) };
  },
  solidAt: (x, y) => solidAt(x, y),
  // §8.1 — the same question asked of what the player can SEE. The two answers
  // agree everywhere the chamber is honest, and their disagreement is the lie.
  drawnAt: (x, y) => drawnAt(x, y),
  roofAtY: (x, y) => roofAt(x, y),

  /* §8 — where the drawn view and the solid view deliberately disagree. Every
     disagreement must be one of the two authored hazards; anything else is the
     two views having drifted apart, which is a bug and is counted separately. */
  deceptions: () => {
    const sol = level.spans, drw = level.spansDrawn || level.spans;
    /* Classify by measuring AIR, not by counting spans. Painted rock usually
       shortens an existing span rather than adding one (its mass runs past the
       hall floor, so no air survives beneath it), which a span-count test misses
       entirely — it read 0 painted rock on a chamber that has some. */
    const openLen = col => (col || []).reduce((a, sp) => a + (sp.bot - sp.top), 0);
    // every difference must fall inside a part that DECLARED a view, or the two
    // views have drifted apart on their own, which is the bug worth catching.
    // `level.chamber` rather than a lookup by id: §8.1's tell has to be provable
    // against a purpose-built chamber, and one of those is not in the ladder —
    // the lookup returned undefined for it and counted every real hazard as
    // undeclared drift.
    const ch = level.chamber || ACT_TWO_CHAMBERS.find(c => c.id === level.chamberId);
    const ranges = ((ch && ch.parts) || []).filter(p => p.view)
      .map(p => [p.x - STEP * 2, p.x + p.w + STEP * 2]);
    const declared = x => ranges.some(r => x >= r[0] && x <= r[1]);
    let falseFloors = 0, paintedRock = 0, undeclaredColumns = 0;
    for (let i = 0; i < sol.length; i++) {
      const a = openLen(sol[i]), b = openLen(drw[i]);
      if (Math.abs(a - b) < 0.01) continue;
      if (!declared(i * STEP)) { undeclaredColumns++; continue; }
      if (b < a) falseFloors++;      // drawn hides real air → a ledge that isn't there
      else paintedRock++;            // drawn shows air over real mass → a painted wall
    }
    return { falseFloors, paintedRock, undeclaredColumns };
  },
  /* §8.1's tell — what the chamber is currently admitting to. `declared` is
     every authored deception, `shown` the ones contact has made permanently
     honest, `flick` whether the Static's beat is showing the truth right now.
     A lie is being told iff it is declared and neither shown nor flickering. */
  lies: () => ({
    declared: (level.lies || []).slice(),
    shown: [...(level.lieShown || [])],
    flick: !!(level.flickT > 0), flickT: +(level.flickT || 0).toFixed(3)
  }),
  /* Put the Static's clock on the edge of a beat, so the next frame fires one.
     Tests must not wait 41 real seconds for a tell that is defined by it, and
     they must not fake `staticBeat` either — that would skip updateStaticClock
     and prove the tell against a signal the game never sends. */
  a2Beat: () => { staticClock = STATIC_PERIOD; return true; },

  // the first column where a ledge is drawn but nothing is solid: the ledge's y,
  // the real ground you actually fall to, and whether the ledge holds you
  falseFloorProbe: () => {
    const sol = level.spans, drw = level.spansDrawn || level.spans;
    const openLen = col => (col || []).reduce((a, sp) => a + (sp.bot - sp.top), 0);
    for (let i = 0; i < sol.length; i++) {
      // LESS air drawn than exists = a ledge drawn across open space
      if (openLen(sol[i]) - openLen(drw[i]) < 1) continue;
      const x = i * STEP;
      /* Find the FALSE boundary specifically: a drawn floor with no solid rock
         under it. Taking drw[i][0].bot instead picks the topmost boundary in the
         column, which on a chamber with a mezzanine is a perfectly real ceiling —
         it reported ledge === ground and the deception as solid. */
      for (const sp of drw[i]) {
        if (solidAt(x, sp.bot + 4)) continue;            // a real floor, keep looking
        return { x: Math.round(x), drawnLedge: Math.round(sp.bot),
          realGround: Math.round(groundAt(x, sp.bot + 4)),
          solidAtLedge: solidAt(x, sp.bot + 4) };
      }
    }
    return null;
  },
  // the first column that is solid where the drawn view shows open space
  paintedRockProbe: () => {
    const sol = level.spans, drw = level.spansDrawn || level.spans;
    const openLen = col => (col || []).reduce((a, sp) => a + (sp.bot - sp.top), 0);
    for (let i = 0; i < sol.length; i++) {
      // MORE air drawn than exists = mass hidden behind a painted face
      if (openLen(drw[i]) - openLen(sol[i]) < 1) continue;
      const x = i * STEP;
      // a y inside the hidden mass: just below the surviving solid span's floor
      const y = (sol[i].length ? sol[i][sol[i].length - 1].bot : 0) + 30;
      const d = pickSpan(drw[i], y);
      return { x: Math.round(x), y: Math.round(y), solid: solidAt(x, y),
        drawnOpen: !!(d && y > d.top && y < d.bot) };
    }
    return null;
  },
  /* Points known to be far from either declared lie, for the pixel-agreement
     test — derived rather than hardcoded so retuning the chamber can't quietly
     aim a probe into a deception and make the test contradict itself. */
  honestProbePoints: () => {
    const sol = level.spans, drw = level.spansDrawn || level.spans;
    const honest = i => {
      const a = sol[i] || [], b = drw[i] || [];
      return a.length === b.length && a.every((sp, k) =>
        Math.abs(sp.top - b[k].top) < 0.01 && Math.abs(sp.bot - b[k].bot) < 0.01);
    };
    /* Stay well clear of the world edges: drawBoundaryField paints a glowing
       dashed containment line at BOUND_X (40) that brightens as the ship nears
       it, so a pixel sampled there is reading the overlay, not the terrain. */
    const EDGE = 240;
    const iLo = Math.max(3, Math.ceil(EDGE / STEP));
    const iHi = Math.min(sol.length - 4, Math.floor((level.W - EDGE) / STEP));
    const clear = i => honest(i - 2) && honest(i - 1) && honest(i) && honest(i + 1) && honest(i + 2);
    const pts = [];
    let rock = null, air = null;
    /* The ROCK reference is a point buried DEEP in the mass — solid, and at least
       DEEP_CLEAR px from every surface in its column. It used to be the middle of
       a fully-solid column run (the old floor-to-ceiling pillar), which broke the
       moment that pillar was re-authored into something you can fly over
       (P·slice): with no span-less run to find, the reference fell back to a
       hardcoded x at y 900, which in this chamber is open hall. Both references
       then sampled AIR, the rock/air distance collapsed, and every probe
       misclassified — a test failing for a reason that had nothing to do with
       what it tests.

       Deep rock is the better anchor anyway, and not only because it always
       exists: it is far from the surface strokes, so it cannot pick up a flank's
       violet rock glow or a milled face's accent, which is the other way this
       reference has gone wrong before. */
    const DEEP_CLEAR = 140;
    for (let i = iLo; i <= iHi; i++) {
      if (!clear(i)) continue;
      const col = sol[i];
      if (!rock) {
        const x = i * STEP;
        for (let y = 200; y < (level.H || WORLD_H) - 60; y += 40) {
          if (!solidAt(x, y)) continue;
          if (col.some(sp => Math.abs(y - sp.top) < DEEP_CLEAR || Math.abs(y - sp.bot) < DEEP_CLEAR)) continue;
          rock = [x, y];
          break;
        }
      }
      if (!air && col.length === 1) air = i * STEP;
    }
    for (let i = iLo; i <= iHi && pts.length < 8; i += 37) {
      if (!clear(i)) continue;
      const col = sol[i];
      const x = i * STEP;
      if (!col.length) { pts.push(["solid column @" + x, x, 900]); continue; }
      const sp = col[0];
      pts.push(["air @" + x, x, (sp.top + sp.bot) / 2]);
      pts.push(["above ceiling @" + x, x, Math.max(30, sp.top - 90)]);
      pts.push(["below floor @" + x, x, sp.bot + 90]);
    }
    const airCol = sol[Math.round(air / STEP)];
    const airSp = airCol[airCol.length - 1];
    return { points: pts, refRock: rock,
      refAir: [air, (airSp.top + airSp.bot) / 2] };
  },
  chamberLights: () => (level.lights || []).length,
  /* Can a rack actually be lifted through this chamber, and where does it need
     momentum? A slung load hangs 90px deep at rest and only 66px when trailing at
     your own level, so a gap classifies into three tiers (towTierForGap,
     js/acttwo-data.js). Reported rather than assumed: the first pass drew a rack
     that could not fit the level it was standing in, and the arithmetic that
     "proved" it used a made-up 24px tether instead of PENDULUM_SPEC's 46. */
  towClearance: (tether) => {
    // NB: not named `level` — that is the global level object (js/world.js:214,
    // a `let` binding, so window.level would be undefined and this would throw)
    const rest = towEnvelope(0, tether), swung = towEnvelope(TOW_SWING_LEVEL, tether);
    const gaps = [];
    for (const col of (level.spans || [])) for (const sp of col) gaps.push(sp.bot - sp.top);
    gaps.sort((a, b) => a - b);
    const tiers = { rest: 0, momentum: 0, unladen: 0 };
    for (const g of gaps) tiers[towTierForGap(g, tether)]++;
    const L = tether != null ? tether : SLING_L;
    return { cage: rest.cage, shipDiameter: 2 * SHIP_R, tether: L,
      // how much cable is actually on screen at rest — the sling has to be SEEN
      // to read as a pendulum at all (PENDULUM_SPEC §4.1's feel note)
      visibleCable: +(L - SLING_SHIP_ANCHOR - rest.cage.h / 2).toFixed(1),
      atRest: +rest.vertical.toFixed(1), atSpeed: +swung.vertical.toFixed(1),
      momentumBand: +(rest.vertical - swung.vertical).toFixed(1),
      tightestGap: gaps.length ? Math.round(gaps[0]) : null,
      medianGap: gaps.length ? Math.round(gaps[Math.floor(gaps.length / 2)]) : null,
      tiers, gapCount: gaps.length,
      // the tightest gap of each tier, so a test can find the authored pinch
      tightestMomentum: (() => {
        const m = gaps.filter(g => towTierForGap(g, tether) === "momentum");
        return m.length ? Math.round(m[0]) : null;
      })() };
  },
  towTier: (gap, tether) => towTierForGap(gap, tether),
  // every part that declared a pinch intent, so authored intent can be checked
  // against the geometry actually compiled rather than trusted
  declaredPinches: () => {
    const ch = ACT_TWO_CHAMBERS.find(c => c.id === level.chamberId);
    return ((ch && ch.parts) || []).filter(p => p.pinch)
      // the authored extent, which is wider than the overhead mass's own part
      .map(p => ({ kind: p.pinch, x: p.pinchX != null ? p.pinchX : p.x,
        w: p.pinchW != null ? p.pinchW : p.w }));
  },
  /* Sample the RENDERED canvas at a world point — the honest way, which took
     two attempts. Centring the camera on the point puts it at screen centre,
     which is exactly where the ship is drawn: the first version of this returned
     the ship's own cyan (113,170,255) and called it rock. So aim the point at a
     quiet third of the screen instead, and park the ship a full screen away.
     Avoids, by construction: the ship and its glow, the top HUD strip, the
     bottom-right touch buttons, the centre banner text, and drawBoundaryField's
     glowing containment line at the world edges. */
  samplePixel: (wx, wy) => {
    const z = zoomLevel(), cw = (vw - saLeft) / z, ch = vh / z;
    const wantSx = (vw - saLeft) * 0.32, wantSy = vh * 0.34;
    camera.x = wx - (wantSx / z - cw / 2);
    camera.y = wy - (wantSy / z - ch / 2);
    camera.shake = 0;
    ship.x = clamp(wx + cw, BOUND_X, level.W - BOUND_X);
    ship.y = wy; ship.vx = ship.vy = 0; ship.ang = 0;
    ship.landed = true; ship.dead = false;
    render(performance.now() / 1000);
    // recompute the transform exactly as worldTransform does, AFTER its clamps
    const cx = clamp(camera.x - cw / 2, 0, Math.max(0, level.W - cw));
    const cy = clamp(camera.y - ch / 2, -100, levelH() - ch);
    const px = ctx.getImageData(Math.round((saLeft + (wx - cx) * z) * dpr),
      Math.round((wy - cy) * z * dpr), 1, 1).data;
    return [px[0], px[1], px[2]];
  },
  launch: () => { if (state === "brief") { briefChars = 1e9; state = "play"; } },
  ground: groundAt,
  /* V·pacifism — the two halves of the invariant, so a test can assert the
     PROPERTY (restraint always outscores shooting) over every sector rather than
     re-deriving the arithmetic and going stale with it. */
  gunValue: lvl => gunValue(lvl || level),
  noFireAward: lvl => noFireAward(lvl || level),
  /* §8.1's tell — the settled motes, so a test can assert the PROPERTY (dust
     rests only on what collision agrees is solid) rather than count particles. */
  dust: () => (a2Dust || []).filter(d => !d.dead)
    .map(d => ({ x: Math.round(d.x), y: Math.round(d.y), settled: !!d.settled })),
  // P·slice (owner feedback) — the predicate the hull's new wall collision uses,
  // so a test can ask "is this point rock?" the same way the game does
  solid: solidAt,
  evalLanding: landingEval,
  landingGuideVisible,   // owner fix: ASSIST off hides the landing-guide visuals
  /* P·intake — WHICH SURFACE the guide resolved to, and the ends of its surface
     bar. The bug it exists for was not a drawing fault: every stroke was correct
     about the wrong floor, so a pixel test would have passed throughout. Rounded,
     because the assertions are about which surface and how level, never about a
     sub-pixel. */
  landingGuide: () => {
    const g = landingGuideGeom();
    return { onPad: g.onPad, drawn: g.drawn,
      surface: Math.round(g.surface), alt: Math.round(g.alt),
      a: { x: Math.round(g.a.x), y: Math.round(g.a.y) },
      b: { x: Math.round(g.b.x), y: Math.round(g.b.y) },
      // the bar's own gradient — the whole "as though there was a wall" symptom
      barRise: Math.round(Math.abs(g.b.y - g.a.y)), barRun: Math.round(Math.abs(g.b.x - g.a.x)) };
  },
  logCardBody: idx => archiveCardFor(idx).body,   // A6 — sentence-broken reveal body
  btnHit: (x, y) => buttonsAt(x, y),              // C1 — touch-button hit test
  give: k => { upgrades[k] = true; },
  strand: () => { ship.x = level.W / 2; ship.y = groundAt(ship.x) - SHIP_R;
    ship.landed = true; ship.vx = ship.vy = 0; ship.fuel = 0; },
  warpLift: () => { const L = level.lift; if (L) { ship.x = L.x; ship.y = L.y - SHIP_R;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true; } },
  warpShrine: () => { const sh = level.shrine; if (sh) { ship.x = sh.x; ship.y = groundAt(sh.x) - SHIP_R;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true; } },
  // V6-finale — force a successful Solace answer (a parried pulse), for tests
  answerBeacon: () => { if (level.beacon && !level.beacon.resolved) { level.beacon.revealed = true; level.beacon.heardParry = true; } },
  // the bad ending — take the destroy-on-sight order and burn the Solace down
  fireSolace: () => { if (level.beacon && !level.beacon.resolved) resolveBeacon("fire"); },
  warpBeacon: () => { const b = level.beacon; if (b) { ship.x = b.x; ship.y = groundAt(b.x) - SHIP_R;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true; } },
  warpScenery: kind => {
    const sc = level.scenery.find(c => !c.dead && (kind === "fake" ? c.fake : c.hollow));
    if (!sc) return false;
    ship.x = sc.x + 30; ship.y = groundAt(sc.x + 30) - SHIP_R;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true;
    return true;
  },
  reset: resetRun
};
