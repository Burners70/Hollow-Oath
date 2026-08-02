"use strict";
/* ---------------- helpers ---------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;

function wrapText(str, maxW) {
  const out = [];
  for (const para of str.split("\n")) {
    const paraLines = [];
    let line = "";
    for (const w of para.split(" ")) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { paraLines.push(line); line = w; }
      else line = test;
    }
    paraLines.push(line);
    // orphan guard: a single word stranded alone on the final line reads as a
    // layout mistake — pull the previous line's last word down onto it
    // instead, as long as that previous line has one to spare
    if (paraLines.length > 1 && paraLines[paraLines.length - 1].indexOf(" ") === -1) {
      const prev = paraLines[paraLines.length - 2];
      const prevWords = prev.split(" ");
      if (prevWords.length > 1) {
        paraLines[paraLines.length - 2] = prevWords.slice(0, -1).join(" ");
        paraLines[paraLines.length - 1] = prevWords[prevWords.length - 1] + " " + paraLines[paraLines.length - 1];
      }
    }
    out.push(...paraLines);
  }
  return out;
}

/* ---------------- story data ---------------- */
const SECTOR_NAMES = ["ASCLEPION", "VESALIUS RIDGE", "NIGHTINGALE BASIN",
                      "SEMMELWEIS DEEP", "CURIE FIELDS", "AVICENNA SHOALS",
                      "JENNER TERRACES", "THE NULLWAVE"];
const FINALE_IDX = SECTOR_NAMES.length - 1;   // 7 — the secret finale
// V13 (owner steer) — the finale twin's arrival is a staged theatrical beat,
// not a simple cross-fade: (1) hold on a single, perfectly ordinary-looking
// MERCY at the spawn point, nothing else visible; (2) a purple signal pulse,
// then it flickers OUT of existence; (3) a beat of nothing, a second pulse,
// then the two real (randomised, separated) MERCYs flicker IN; (4) the
// illusion is gone — only the two remain, stable but for the emblem tell.
// All phase math in render.js reads level.mercySplitT as elapsed-time-
// REMAINING (as before V13), so every existing "still resolving, stay inert"
// gate elsewhere (bays, decoy) keeps working unchanged.
const TWIN_HOLD = 1.3;               // 1 — sits as ordinary MERCY; first pulse fires exactly here
const TWIN_PULSE1 = TWIN_HOLD;
const TWIN_OUT = TWIN_HOLD + 1.0;    // 2 — the illusion finishes flickering out by here
const TWIN_PULSE2 = TWIN_OUT + 0.3;  // a beat of nothing, then the second pulse
const TWIN_IN = TWIN_PULSE2 + 1.2;   // 3 — the real two are fully resolved (solid) by here
const MERCY_SPLIT_DUR = TWIN_IN;     // 4 — total sequence length
const NBOX = FINALE_IDX;                      // one hidden black box per campaign sector
// Owner steer: three boxes was too easy a bar for the secret finale. Real
// triangulation needs most of the recorders — ~80% of them (6 of 7). Missing
// more than one leaves the bearing too loose to lock and the finale never opens.
const TRIANGULATE_N = Math.ceil(NBOX * 0.8);  // 6 of 7

// Owner steer: paragraphs, not run-on copy — beats are separated by a blank
// line (\n\n) so important sentences stand on their own, but no line break ever
// splits a single sentence. drawBrief wraps each paragraph to the panel width.
const BRIEFS = [
  "MERCY to rescue flight.\n\nRoutine tasking: the convoy scatter left medical units stranded across Asclepion. Land near them, bring them home to the recovery bay.\n\nThe approach guide turns green when it's safe to set down — watch your ↓ descent and ↔ drift.\n\nEnd transmission.",
  "Captain… some stranded units on the ridge have stopped answering triage pings. Comms has a name for them now: Vectors.\n\nCarriers, not survivors.\n\nIf a rescue feels wrong — the wave wrong, the heartbeat missing — trust your instincts.\n\nThe red isolation airlock is open: if one gets loose aboard, seal it in there. Do NOT bring contaminated units into the recovery bay.",
  "Dust occlusion across the basin, and night coming down fast. Your lamp is your lifeline, and theirs.\n\nAnd captain… the dark out here listens back.",
  "Supply lines to the deep are cut — no fresh fuel from the fleet. Our resupply drone runs on scavenged reserves now: it comes slower, and it can spare far less. Scavenge surface fuel pods where you find them.\n\nAnd it's worse than rationing. Leave an unscreened unit standing among the survivors and the sickness jumps between them — the ward breeds its own carriers. Screen your rescues, or lift the bad ones out before they spread it.\n\nProve a unit false — the salvage teams will take it from there. But prove it.",
  "Radiation cells distort gravity across the fields. Fly wide of the purple rings.\n\nOne more thing. The Static repeats every 41 seconds, and every black box you recover tightens the bearing. The projection keeps landing on the same dead patch of sky — a silence the old charts marked THE NULLWAVE, where no signal has ever come back.\n\nRecover the recorders and we'll know for certain what's down there.",
  "Captain… the surface scans are lying to us. Refuel points that drain tanks dry. Growths that aren't growths.\n\nSomebody is seeding counterfeit salvation across the shoals. Real pods flicker like fire; the fakes keep perfect time.\n\nTrust nothing that looks too convenient.\n\nAnd if you won't fire on a lie — land beside it and look at it long enough.",
  "Last leg before the nullwave. Ground crews are matching patterns across every lure and every tampered unit out here — too many to be coincidence.\n\nWhoever's behind this has been at it a long time, and hasn't finished. Bring our people home anyway.",
  "Triangulation complete. The source of the Static is below the nullwave ridge.\n\nFleet orders: destroy on sight. The chief medical officer refused to sign. Her note is one line — primum non nocere.\n\nYour call, captain."
];

const FRAGMENTS = [
  "LOG 01 // The convoy scattered after the relay burst. We logged it as a solar flare. Nobody checked the waveform.",
  "LOG 02 // The burst wasn't natural. It repeats. Forty-one seconds. Always forty-one seconds.",
  "LOG 03 // Some stranded units stopped answering triage pings. They still walk. They still wave. But the rhythm is wrong.",
  "LOG 04 // Comms calls it the Static. It doesn't jam a signal. It rewrites the one who answers.",
  "LOG 05 // Quarantine protocol drafted: any unit with an irregular heartbeat goes to the red bay. No exceptions.\n\nNot even friends.",
  "LOG 06 // First black box decoded. The Static's waveform matches... us. An old MERCY-class distress call, degraded, looping.",
  "LOG 07 // It's a voice like ours. Every repeat is a copy of a copy. The rescued units corrupt because they answer honestly.",
  "LOG 08 // Triangulation at 60%. The echo has a source, somewhere dark beyond the last ridge, transmitting on our own frequency.",
  "LOG 09 // Fleet drafted destroy-on-sight orders. The CMO refused to sign. She wrote one line: primum non nocere.",
  "LOG 10 // If it can be silenced without being destroyed, we owe it that. It has only ever been repeating a call for help.",
  "LOG 11 // The lures aren't scavenger traps. They're placed. Someone wants rescues to fail, and wants it to look like bad luck.",
  "LOG 12 // Every counterfeit carries the same maker's mark: a coiled serpent wearing a human mask. The archive is afraid of the match it found.",
  "LOG 13 // Match confirmed. GLYCON — the puppet god of Alexander of Abonoteichus, Old Earth, second century. He wrapped a snake in linen and sold false plague cures while the plague spread. His amulets hung over doors where precautions should have been.",
  "LOG 14 // The Static is a wound. Glycon is the hand keeping it open: amplifying the echo, farming the fear, selling the cure that kills.\n\nUnmask him. Then answer the wound."
];

/* the caves under the lifts — three shrines, three revelations */
const SHRINES = [
  { kicker: "THE HOLLOWS · RELAY",
    title: "IT ISN'T AN ECHO",
    body: "A transmitter, hand-built into the rock. Not wreckage. Not corrosion.\n\nSomething down here is BOOSTING the Static — aiming it along the rescue lanes, keeping the wound open on purpose.\n\nScratched into the casing: a coiled serpent wearing a human mask.",
    color: "#b388ff" },
  { kicker: "THE HOLLOWS · WORKSHOP",
    title: "THEY WERE NEVER RESCUED",
    body: "Racks of half-finished Scions. Dull chests. No hearts to tick.\n\nThe Vectors were never rescued units. Not corrupted. Hollow. Built empty, and dressed to be carried home in good faith.\n\nThe same serpent mark on every chassis.",
    color: "#b388ff" },
  { kicker: "THE HOLLOWS · SHRINE",
    title: "GLYCON",
    body: "A shrine to a serpent with a human face.\n\nOld Earth archive match: GLYCON — the puppet god of Alexander of Abonoteichus, a second-century charlatan who sold fake plague cures while the plague spread. Hope as bait.\n\nGraves as yield.\n\nSomeone out here found his playbook. The Static is a wound; Glycon is the infection that keeps it open — counterfeit rescuers, counterfeit fuel, counterfeit hope.\n\nScratched beneath the idol, in the maker's own hand:\n\n\"An oath you never test is easy to keep.\"",
    color: "#ff5ce1" }
];

const FAMOUS = [
  { name: "HIPPOCRATES OF KOS", era: "c. 460–370 BC",
    story: "The physician of Kos, whose oath still binds medicine twenty-four centuries on: first, do no harm.",
    upgrade: "gentle", upgradeName: "GENTLE TOUCH",
    upgradeDesc: "Hard landings now do far less damage to your hull." },
  { name: "ANDREAS VESALIUS", era: "1514–1564",
    story: "He looked inside the body for himself and rewrote anatomy — his Fabrica corrected a thousand years of guesswork.",
    upgrade: "fabrica", upgradeName: "FABRICA HULL",
    upgradeDesc: "Maximum vitals raised to 125." },
  { name: "FLORENCE NIGHTINGALE", era: "1820–1910",
    story: "The Lady with the Lamp — she proved with statistics that sanitation saves more soldiers than surgery.",
    upgrade: "lamp", upgradeName: "THE LAMP",
    upgradeDesc: "Your light reaches much further in the dark." },
  { name: "IGNAZ SEMMELWEIS", era: "1818–1865",
    story: "He begged surgeons to wash their hands and saved countless mothers. He was ignored for decades.",
    upgrade: "antisepsis", upgradeName: "ANTISEPSIS",
    upgradeDesc: "Land on a grounded unit and hold to read its vitals — catalogue a Vector, or confirm a heartbeat. A proven Vector can be left behind." },
  { name: "MARIE CURIE", era: "1867–1934",
    story: "Twice a Nobel laureate; she drove X-ray units to the front lines herself in the First World War.",
    upgrade: "radiosense", upgradeName: "RADIOSENSE",
    upgradeDesc: "A compass now points toward unrecovered black boxes." },
  { name: "IBN SINA · AVICENNA", era: "980–1037",
    story: "The Persian polymath whose Canon of Medicine taught physicians on three continents for six hundred years — observation, evidence, and honest doubt.",
    upgrade: "canon", upgradeName: "CANON OF TRUTH",
    upgradeDesc: "Counterfeits are unmasked — the counterfeiter's lures and lure-trees are marked for what they are." },
  { name: "EDWARD JENNER", era: "1749–1823",
    story: "He noticed milkmaids who'd had cowpox never caught smallpox, and turned one careful observation into vaccination, the greatest life-saver medicine has known.",
    upgrade: "inoculation", upgradeName: "INOCULATION",
    upgradeDesc: "Your passengers are immunised — Vectors aboard can no longer kill them." },
  /* the wider pool (Bundle M4) — the campaign carries the canonical seven;
     REMIX and DAILY rotations draw 7 of everyone below as well */
  { name: "ELIZABETH BLACKWELL", era: "1821–1910",
    story: "Rejected by ten medical schools for being a woman, she graduated first in her class anyway: the first woman M.D. in America. Then she opened the door for every one who followed.",
    upgrade: "doors", upgradeName: "OPEN DOORS",
    upgradeDesc: "MERCY's bay doors open wider — dock at approach speeds that would once have waved you off." },
  { name: "RUDOLF VIRCHOW", era: "1821–1902",
    story: "The father of cellular pathology — omnis cellula e cellula — who insisted every disease begins somewhere specific, and that medicine's job is to look until it finds where.",
    upgrade: "pathology", upgradeName: "CELL DOCTRINE",
    upgradeDesc: "Diagnosis comes faster — black boxes, shrines and counterfeit scans complete in two-thirds the time." },
  { name: "ALEXANDER FLEMING", era: "1881–1955",
    story: "He came back from holiday to a spoiled culture plate and, instead of binning it, looked closer: the mould was killing the bacteria. Penicillin began as a noticed accident.",
    upgrade: "penicillin", upgradeName: "PENICILLIN",
    upgradeDesc: "Your hull cultures its own repair — vitals slowly self-heal while below half." },
  { name: "RITA LEVI-MONTALCINI", era: "1909–2012",
    story: "Barred from her university by fascist race laws, she built a laboratory in her bedroom and kept working, and discovered nerve growth factor, how living tissue is told to grow.",
    upgrade: "growth", upgradeName: "GROWTH FACTOR",
    upgradeDesc: "Fuel cells grow denser — tank capacity raised to 120." }
];

/* ---------------- world / level ---------------- */
const GRAV = 46, THRUST = 138, ROT = 3.7, SHIP_R = 11;
const WORLD_H = 1500, STEP = 16;
const CAPACITY = 6;
// Z1 — REMIX/DAILY replay variety: a per-SECTOR gravity scale, ~0.4x-2.2x
// (owner steer, July 2026 — the original ~0.7x-1.4x roll read as barely
// different from 1x; widened, and re-rolled every sector instead of once
// per run so a whole REMIX run doesn't sit at one barely-noticed value).
// Deterministic from (runSeed, sector index) so the same seed always rolls
// the same sequence of sectors. Campaign (seed 0) always stays exactly 1 —
// the authored feel and the M1 golden heightmap are untouched. Every gravity
// reference in physics code reads grav(), never the bare GRAV constant.
let gravScale = 1;
// owner feature (July 2026) — a per-sector "crosswind": a constant sideways
// pull alongside the usual downward one. gravTilt is -1..1 (- pulls left,
// + pulls right); the downward pull (grav()) is untouched by it entirely —
// "down" stays down, terrain/landing/HUD orientation don't change, you're
// just also being shoved sideways. TILT_STRENGTH caps how strong that shove
// can get, relative to this sector's own (scaled) gravity.
let gravTilt = 0;
const TILT_STRENGTH = 0.5;
function grav() { return GRAV * gravScale; }
function gravSide() { return GRAV * gravScale * gravTilt * TILT_STRENGTH; }
function rollGravity(n) {
  if (runSeed === 0) { gravScale = 1; gravTilt = 0; return; }   // campaign: untouched
  const rng = mulberry32((runSeed ^ 0x5a17e5) + n * 7919);
  gravScale = 0.4 + rng() * 1.8;
  gravTilt = rng() * 2 - 1;
}
// Z1 — named in the briefing prefix so the roll is a KNOWN condition, not a
// silent difficulty modifier; "" for a near-1x roll (rare, but not every
// seed lands far from center — no label reads as no news, not a bug).
// Owner steer: graded further at the extremes now that the range is wider,
// plus a crosswind direction call-out (owner feature) when gravTilt is
// meaningful — the player has to know this before they're airborne, not
// discover it as a surprise.
function gravLabel() {
  let lbl = "";
  if (gravScale >= 1.7) lbl = "crushing gravity";
  else if (gravScale >= 1.05) lbl = "heavy world";
  else if (gravScale <= 0.5) lbl = "near-weightless";
  else if (gravScale <= 0.95) lbl = "thin gravity";
  // kept short (not "crosswind from the left") — this shares a line with the
  // mode/seed header and the HUD's own score line; both are tight for space
  if (Math.abs(gravTilt) > 0.15) {
    const wind = (gravTilt > 0 ? "→" : "←") + " wind";
    lbl = lbl ? lbl + " · " + wind : wind;
  }
  return lbl;
}

let level, ship, camera, particles, texts, stars;
let resupplyDrone = null;   // the graceful bail-out for a ship stranded at 0 fuel
let runRefuels = 0;         // U2 — field resupplies used this run; each fill carries less
let liftTransit = null;     // in-progress lift descent/ascent animation
// X2a — progress through the guided-pause script: trainingT paces the
// time-fallback conditions, trainingHeldT tracks cumulative THRUST-held
// time (the "drift" card's gate), trainingShown is the one-shot guard per
// card id (see TRAINING_CARDS, js/update.js)
let trainingT = 0, trainingHeldT = 0, trainingShown = {};
let state = "title", stateT = 0, score = 0, lives = 3, levelIdx = 0;
let runSaved = 0, runLost = 0, runFired = 0;
// why a no-fire run ended: firedAtSecret = shot a lure-tree / hollow rock
// (secret-hunting); firedAtCombat = shot a turret / drone. Used to award the
// HOLLOW KEEPER rank (answered ending, oath broken only to reach the truth).
let firedAtSecret = false, firedAtCombat = false;
// Bundle J — a secret opened by a landed scan instead of a shot. The oath
// stays whole; the rank line names it ("eyes open").
let scannedSecret = false;
let runFragments = 0, blackboxCount = 0;
/* Bundle M1 — run seed plumbing. Seed 0 is the authored campaign (today's
   exact levels, regression-tested); a non-zero seed re-rolls every
   generator AND shuffles which famous mind waits in which sector. */
let runSeed = 0;                       // 0 = authored campaign
let runMode = "campaign";              // "campaign" | "remix" | "daily" | "training"
let famousMap = null;                  // null = canonical famousId === sector
function famousIdFor(n) { return famousMap ? famousMap[n] : n; }
function buildFamousMap(seed) {
  const rng = mulberry32(seed ^ 0x5f356495);
  const pool = FAMOUS.map((_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  return pool.slice(0, FINALE_IDX);    // 7 sectors draw 7 of the wider pool
}
let shrines = new Set();   // Hollows shrines found this run
let upgrades = {};
let mercyBreach = null, mercyDamaged = false;
let pendingBreach = null;   // a sleeper has slipped into MERCY; the alarm is armed but delayed
let endingType = null;
let endingFirstRun = false;   // was the Glycon layer still sealed this run? (drives the replay tease)
let clearCards = [], revealCard = null;
let trapCard = null;   // V15 — the decoy-trap reveal, held until dismissed
let confirmCard = null;            // S4 — a two-choice confirm (early extraction)
let leftBehindNote = null;         // S4 — grim next-briefing line after a triage retreat
let briefChars = 0;
let checkpoint = null;   // captured run-start snapshot, offered as CONTINUE on game over
let savedRun = null;     // resume-from-title snapshot (doids_run), kept in sync with localStorage
/* a snapshot from a corrupt write, an older schema, or (once E4 lands) a
   foreign device must never restore into NaN state or a "RESUME — undefined"
   pill — validate the shape before trusting it */
function validRun(r) {
  return !!r && r.v === 1 &&
    Number.isInteger(r.levelIdx) && r.levelIdx >= 0 && r.levelIdx <= FINALE_IDX &&
    typeof r.score === "number" && Number.isFinite(r.score) &&
    Number.isInteger(r.lives);
}
try {
  const raw = localStorage.getItem("doids_run");
  const parsed = raw ? JSON.parse(raw) : null;
  savedRun = validRun(parsed) ? parsed : null;
  if (raw && !savedRun) localStorage.removeItem("doids_run");
} catch (e) { savedRun = null; }
function snapshotRun() {
  savedRun = {
    v: 1, levelIdx, score, lives, runSaved, runLost, runFired, firedAtSecret, firedAtCombat,
    scannedSecret, runFragments, blackboxCount, shrines: [...shrines], upgrades,
    runSeed, runMode, famousMap
  };
  try { localStorage.setItem("doids_run", JSON.stringify(savedRun)); } catch (e) {}
  cloud.set("doids_run", JSON.stringify(savedRun));   // E4 mirror
}
function clearRun() {
  savedRun = null;
  try { localStorage.removeItem("doids_run"); } catch (e) {}
  cloud.remove("doids_run");   // E4 mirror
}
function restoreRun(r) {
  levelIdx = r.levelIdx; score = r.score; lives = r.lives;
  runSaved = r.runSaved; runLost = r.runLost; runFired = r.runFired;
  firedAtSecret = r.firedAtSecret; firedAtCombat = r.firedAtCombat;
  scannedSecret = r.scannedSecret || false;
  runFragments = r.runFragments; blackboxCount = r.blackboxCount;
  shrines = new Set(r.shrines); upgrades = r.upgrades || {};
  runSeed = r.runSeed || 0; runMode = r.runMode || "campaign"; famousMap = r.famousMap || null;
  rollDailyMods();
  mercyBreach = null; mercyDamaged = false; endingType = null;
  clearCards = []; revealCard = null; surfaceCtx = null;
}
let hiscore = 0;
try { hiscore = +localStorage.getItem("doids_hi") || 0; } catch (e) {}
// X6 (owner refinement) — completed runs (any ending), so the review prompt
// can fire on a "you've played enough to have an opinion" milestone, not
// only on a clean ending or a new hiscore.
let runsPlayed = 0;
try { runsPlayed = +localStorage.getItem("doids_plays") || 0; } catch (e) {}
let codex = new Set();
try { codex = new Set(JSON.parse(localStorage.getItem("doids_codex") || "[]")); } catch (e) {}
function saveCodex() {
  try { localStorage.setItem("doids_codex", JSON.stringify([...codex])); } catch (e) {}
  cloud.set("doids_codex", JSON.stringify([...codex]));   // E4 mirror
}
/* Bundle K1 — the Static's story is re-readable: every log fragment and
   shrine card ever recovered persists across runs, into the codex ARCHIVE */
let logsSeen = new Set();
try { logsSeen = new Set(JSON.parse(localStorage.getItem("doids_logs") || "[]")); } catch (e) {}
function saveLogs() {
  try { localStorage.setItem("doids_logs", JSON.stringify([...logsSeen])); } catch (e) {}
  cloud.set("doids_logs", JSON.stringify([...logsSeen]));   // E4 mirror
}
let shrinesSeen = new Set();
try { shrinesSeen = new Set(JSON.parse(localStorage.getItem("doids_shrines_seen") || "[]")); } catch (e) {}
function saveShrinesSeen() {
  try { localStorage.setItem("doids_shrines_seen", JSON.stringify([...shrinesSeen])); } catch (e) {}
  cloud.set("doids_shrines_seen", JSON.stringify([...shrinesSeen]));   // E4 mirror
}
// V13 — the "husks" reveal: the WORKSHOP shrine (cave 1, under Semmelweis's
// lift) shows the Vectors are hollow, never-rescued chassis. Until it's been
// seen, even a veteran doesn't know that yet — every disguised unit reads as
// a CORRUPTED person who might still be saved, not a proven fake, so killing
// one is still malpractice and the only clean outcome is the isolation bay.
const HUSK_SHRINE_IDX = 1;   // SHRINES[1] — "THEY WERE NEVER RESCUED"
function husksKnown() { return shrinesSeen.has(HUSK_SHRINE_IDX); }
let assist = true;
try { assist = localStorage.getItem("doids_assist") !== "0"; } catch (e) {}
// haptics is a web no-op (the facade below bridges to the native wrapper
// when Bundle E/F land) — the settings row and persisted flag live now.
let haptics = true;
try { haptics = localStorage.getItem("doids_hapt") !== "0"; } catch (e) {}
let colorblind = false;
try { colorblind = localStorage.getItem("doids_cb") === "1"; } catch (e) {}
/* Bundle DS2 — mirror the setting onto <body> so css/game.css can swap the
   on-screen flight controls too. CSS can't read PALETTES, so this class is the
   only bridge; without it the buttons were the one surface the colourblind
   toggle could never reach. Safe to call at parse time — the scripts load at
   the end of <body>, so document.body already exists. */
function applyColorblindClass() {
  if (document.body) document.body.classList.toggle("cb", colorblind);
}
applyColorblindClass();
/* Bundle H1 — the four SEMANTIC colours (safe / warning / danger / the
   counterfeit-reveal mark). Colorblind mode swaps only these four meanings
   to a blue/orange/white/magenta set — the rest of the game keeps its skin.
   Used by the landing guide, the ECG ramp, the antisepsis tint and the
   canon "?" counterfeit marks. */
const PALETTES = {
  normal: { SAFE: "#69f0ae", WARN: "#ffc400", DANGER: "#ff4081", REVEAL: "#ff5ce1" },
  cb:     { SAFE: "#40c4ff", WARN: "#ffab40", DANGER: "#ffffff", REVEAL: "#ff6bff" }
};
function PAL() { return colorblind ? PALETTES.cb : PALETTES.normal; }
/* Bundle DS4 — the token layer. Every colour the UI draws with comes from
   here or from PAL() above; a hex literal at the call site is the bug the
   July 2026 audit found. The split is the point: PALETTES holds the four
   *meanings* (safe / warn / danger / reveal) and swaps for colourblind mode,
   TOK holds the game's fixed skin and never swaps. If a new element encodes
   state, it belongs in PAL(); if it's chrome or flavour, it belongs here.
   Values are the ones docs/DESIGN_SYSTEM_STARTER.md documents — change them
   there and here together. */
const TOK = {
  // base / void (§2.1)
  VOID: "#05060f", VOID_MID: "#0a0d22", VOID_HIGH: "#101433",
  // the cyan ramp — the default accent (§2.2)
  CYAN: "#00e5ff", CYAN_INK: "#aef4ff", CYAN_TEXT: "#9beaf9",
  CYAN_SOFT: "#7fe9ff", CYAN_BRIGHT: "#eaffff", CYAN_PALE: "#bfeefb",
  // narrative / rare accents (§2.4)
  VIOLET: "#b388ff", VIOLET_DEEP: "#7c4dff", VIOLET_SOFT: "#c9a6ff",
  GOLD: "#ffd54f", GOLD_WARM: "#ffe9a8",
  /* the ember family — fire, torching, MERCY's detonation. EMBER_CORE shares
     its value with the WARN *meaning* by coincidence of art, not by intent:
     a flame's hot core is amber and a fuel warning is amber. They are split so
     colourblind mode swaps the warning and leaves the fire looking like fire. */
  EMBER: "#ff6d00", EMBER_LIT: "#ff9e40", EMBER_MID: "#ffae40",
  EMBER_CORE: "#ffc400", EMBER_WHITE: "#fff3d6",
  ALERT: "#ff1744",
  /* DS3 — the selection cursor, promoted from an undocumented literal. It sits
     outside the cyan/violet/amber family deliberately, so it reads *over* cyan
     chrome. It does NOT swap in colourblind mode and doesn't need to: the
     cursor is already a stroked box around the selected row, so the state
     reads by shape without colour at all (the H2 redundancy rule). */
  FOCUS: "#eaff6b", FOCUS_INK: "#f7ffd0",
  /* E3 — a parried round, now flying home as yours. Same values as FOCUS, but
     a *different meaning*, so the two can diverge without one breaking the
     other (the audit found the single literal doing both jobs). It stays put
     under colourblind mode on purpose: hostile fire swaps to the cb DANGER
     white, so parried-vs-hostile reads by hue AND luminance for every CVD
     type — which the old yellow-green-vs-pink pairing did not. */
  PARRIED: "#eaff6b", PARRIED_INK: "#f7ffd0",
  /* Bundle N — the counterfeit MERCY's sickly serpent sign. Narrative flavour,
     not a state colour: it must NOT swap, because the whole point is that the
     fake looks wrong in a way you learn to recognise. */
  COUNTERFEIT_NEON: "#c6ff00"
};
/* DS1 — a token at partial alpha. Hand-written `rgba(105,240,174,.7)` literals
   were the other half of the palette-swap leak the audit found: the stroke
   stayed green while the fill beside it swapped, so colourblind mode produced
   two-tone controls nobody designed. Always build a translucent semantic
   colour with this, never by typing the channel numbers.
   Named `shade` because `alpha` is already a local in drawFakePods(). */
const _shadeMemo = {};
function shade(hex, a) {
  const k = hex + a;
  let v = _shadeMemo[k];
  if (v === undefined) {
    const n = parseInt(hex.slice(1), 16);
    v = _shadeMemo[k] = "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  return v;
}
/* Bundle H3 — FIELD MEDIC mode: gentler tolerances, more lives, longer
   breach timer. "For pilots who want the story." */
let easyMode = false;
try { easyMode = localStorage.getItem("doids_easy") === "1"; } catch (e) {}
function startLives() { return easyMode ? 5 : 3; }
/* Bundle H4 — larger body text on cards, briefings and intro captions */
let bigText = false;
try { bigText = localStorage.getItem("doids_bigtext") === "1"; } catch (e) {}
/* R8 — card/brief body copy gets a +1 base bump for arm's-length phone
   reading; the BIG TEXT accessibility toggle still stacks its +2 on top. */
function bodyFontPx(base) { return base + 1 + (bigText ? 2 : 0); }
/* Bundle DS4/DS5 — the two type roles from the design system §3, as helpers,
   so new UI can't quietly introduce a third family or a size off the scale.
   MONO is the instrument-panel voice, DISPLAY the wordmark/headline face.
   `mono()` takes a fixed pixel size (HUD chrome that must not reflow);
   `body()` routes through bodyFontPx so BIG TEXT reaches it. Prefer body(). */
const MONO_STACK = "Menlo, monospace";
const DISPLAY_STACK = "'Helvetica Neue', Arial, sans-serif";
function mono(px, weight) { return (weight || 700) + " " + px + "px " + MONO_STACK; }
function body(base, weight) { return (weight || 700) + " " + bodyFontPx(base) + "px " + MONO_STACK; }
function display(px, weight) { return (weight || 800) + " " + px + "px " + DISPLAY_STACK; }
/* Accessibility: a REDUCED FLASH toggle softens the Static's high-frequency
   strobing — window flicker, the ECG jitter and the HUD label glitch — for
   photosensitive players. Diagnostic meaning stays; only the amplitude drops. */
let reducedFlash = false;
try { reducedFlash = localStorage.getItem("doids_flash") === "1"; } catch (e) {}
/* a visible build stamp so stale Home-Screen caches / TestFlight builds are
   diagnosable at a glance (GAME_DESIGN §10 idea). This literal is the value the
   *web* build shows; `app/sync.sh` overwrites it in the generated app/www copy
   with the sync date + a content hash of the bundled JS/CSS, so a native wrapper
   archived without re-syncing shows a stale tag instead of matching the source. */
const BUILD_TAG = "v1.0 · web";
/* Bundle L1 — an unresolved ending follows the player home: the title
   screen ticks faintly on the Static's own period until a run resolves it */
let unresolvedHaunt = false;
try { unresolvedHaunt = localStorage.getItem("doids_unres") === "1"; } catch (e) {}
function setHaunt(on) {
  unresolvedHaunt = on;
  try {
    if (on) localStorage.setItem("doids_unres", "1");
    else localStorage.removeItem("doids_unres");
  } catch (e) {}
}
let titleStaticT = 0;
/* Bundle M2/M3 — REMIX ROTATION unlocks once any run resolves the beacon;
   the DAILY FLIGHT is one seeded attempt per UTC day for everyone */
let veteran = false;
try { veteran = localStorage.getItem("doids_veteran") === "1"; } catch (e) {}
function markVeteran() {
  veteran = true;
  try { localStorage.setItem("doids_veteran", "1"); } catch (e) {}
  cloud.set("doids_veteran", "1");   // E4 mirror
}
/* (owner feedback, July 2026) — has this pilot actually MET the Solace? Set only
   by resolveBeacon (answered or fire), i.e. only once she's been found and dealt
   with. Deliberately NOT set by the "unresolved" ending: that one fires when the
   blackbox count never reached TRIANGULATE_N, so the player never entered the
   finale sector and never saw her — and this repo's rule is that a secret gives
   nothing away until it's actually been examined (same reason the pre-reveal
   "THE SIGNAL SOURCE" label came off the beacon). Gates her hull on the title. */
let solaceSeen = false;
try { solaceSeen = localStorage.getItem("doids_solace") === "1"; } catch (e) {}
function markSolaceSeen() {
  solaceSeen = true;
  try { localStorage.setItem("doids_solace", "1"); } catch (e) {}
  cloud.set("doids_solace", "1");   // E4 mirror
}
/* (owner feedback, July 2026) — transient, not persisted: a REPEAT completion
   (a run that was already a veteran run) now lands back on the title instead of
   launching straight into another full campaign, and the title carries a one-off
   nudge toward the rotations. Cleared by resetRun, so it shows until the player
   actually starts something. */
let titleNudge = false;
// V13 — the veteran-intro recap ("SOMETHING DOESN'T SIT RIGHT") needs to know
// whether the finished campaign actually brought everyone home, so its line
// isn't a blanket claim when it often wasn't. Snapshotted once, at the ending
// that finishes a run (see resolveBeacon), before the next run resets the tally.
let lastRunSaved = 0, lastRunLost = 0;
try {
  const lr = JSON.parse(localStorage.getItem("doids_lastrun_tally") || "null");
  if (lr) { lastRunSaved = lr.saved || 0; lastRunLost = lr.lost || 0; }
} catch (e) {}
function saveLastRunTally() {
  const rec = { saved: runSaved, lost: runLost };
  try { localStorage.setItem("doids_lastrun_tally", JSON.stringify(rec)); } catch (e) {}
  cloud.set("doids_lastrun_tally", JSON.stringify(rec));
  lastRunSaved = runSaved; lastRunLost = runLost;
}

/* Bundle E4 — on a native launch, fold the iCloud copy into local state:
   the larger hi-score, the union of the codex/log/shrine sets, veteran if
   either side is, and the cloud run snapshot only when this device has
   none. Fire-and-forget: the title reads all of these live every frame,
   so a merge that lands a beat late simply appears. */
async function syncFromCloud() {
  if (!cloud.native()) return;
  try {
    const [cHi, cCodex, cLogs, cShrines, cVet, cRun, cSol] = await Promise.all([
      cloud.get("doids_hi"), cloud.get("doids_codex"), cloud.get("doids_logs"),
      cloud.get("doids_shrines_seen"), cloud.get("doids_veteran"), cloud.get("doids_run"),
      cloud.get("doids_solace")]);
    if (cHi && +cHi > hiscore) {
      hiscore = +cHi;
      try { localStorage.setItem("doids_hi", hiscore); } catch (e) {}
    } else if (hiscore > 0) cloud.set("doids_hi", hiscore);
    const union = (set, raw, save) => {
      if (!raw) return;
      try {
        const before = set.size;
        for (const v of JSON.parse(raw)) set.add(v);
        if (set.size > before) save();   // save() pushes the union back up too
      } catch (e) {}
    };
    union(codex, cCodex, saveCodex);
    union(logsSeen, cLogs, saveLogs);
    union(shrinesSeen, cShrines, saveShrinesSeen);
    if (cVet === "1" && !veteran) markVeteran();
    if (cSol === "1" && !solaceSeen) markSolaceSeen();
    if (cRun && !savedRun) {
      try {
        const parsed = JSON.parse(cRun);
        if (validRun(parsed)) {
          savedRun = parsed;
          try { localStorage.setItem("doids_run", cRun); } catch (e) {}
        }
      } catch (e) {}
    }
  } catch (e) {}
}
syncFromCloud();
function utcDateNum() {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}
function loadDaily() {
  try { return JSON.parse(localStorage.getItem("doids_daily") || "null"); } catch (e) { return null; }
}
function dailyDoneToday() {
  const rec = loadDaily();
  return !!(rec && rec.done && rec.date === utcDateNum());
}
/* the last recorded daily that ISN'T today — "yesterday-you", the bar to beat */
function dailyPrevScore() {
  const rec = loadDaily();
  return rec && rec.date !== utcDateNum() ? rec.score || 0 : 0;
}
function recordDaily() {
  if (runMode !== "daily") return;
  try {
    const rec = loadDaily();
    if (rec && rec.date === utcDateNum()) {
      rec.score = Math.max(rec.score || 0, score);
      localStorage.setItem("doids_daily", JSON.stringify(rec));
      // G2/M3 — the daily board; FIELD MEDIC runs stay off the boards (H3)
      if (!easyMode) gc.score(rec.score, GC_BOARD_DAILY);
    }
  } catch (e) {}
}
/* The daily flight carries teeth beyond a fresh seed: two modifiers drawn
   deterministically from the day's number — the same two for every pilot on
   Earth, so the daily is a shared *condition*, not just a shared map. */
const DAILY_MODS = [
  { id: "rationed",  name: "RATIONED TANK",     desc: "fuel cells run at 70% capacity" },
  { id: "surge",     name: "SURGE FRONT",       desc: "the 41-second clock runs in every sector" },
  { id: "crowded",   name: "CROWDED SKY",       desc: "two extra hunter drones per sector" },
  { id: "sleepers",  name: "SLEEPER CELL",      desc: "every Vector is a sleeper — listen closely" },
  { id: "dark",      name: "BLACKOUT ROTATION", desc: "every sector is dark; fly by lamp" },
  { id: "stopwatch", name: "STOPWATCH",         desc: "clear each sector under 90s for +500" }
];
let dailyMods = [];
function rollDailyMods() {
  if (runMode !== "daily") { dailyMods = []; return; }
  const rng = mulberry32(runSeed ^ 0x9e3779b9);
  const pool = DAILY_MODS.slice();
  dailyMods = [];
  for (let k = 0; k < 2; k++)
    dailyMods.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
}
const dailyMod = id => dailyMods.some(m => m.id === id);

// V14 — an optional explicit seed makes a failing REMIX generation (and, since
// Z1, its gravity roll) reproducible from a test instead of a one-shot
// Math.random() roll.
function startRemix(seed) {
  goFullscreen();
  if (window.hideA2HS) window.hideA2HS();
  resetRun();
  runMode = "remix";
  runSeed = seed != null ? seed : 1 + Math.floor(Math.random() * 2147483646);
  famousMap = buildFamousMap(runSeed);
  toBriefing(0);
  blip(330, 660, 0.2, "sine", 0.1);
}
function startDaily() {
  if (dailyDoneToday()) { blip(220, 160, 0.15, "sine", 0.08); return; }
  goFullscreen();
  if (window.hideA2HS) window.hideA2HS();
  resetRun();
  runMode = "daily";
  runSeed = utcDateNum();
  famousMap = buildFamousMap(runSeed);
  rollDailyMods();
  // the attempt is spent the moment it launches — no re-rolling a bad start
  try { localStorage.setItem("doids_daily", JSON.stringify({ date: utcDateNum(), score: 0, done: true })); } catch (e) {}
  toBriefing(0);
  blip(330, 660, 0.2, "sine", 0.1);
}
/* X2 — the trainee sector. Bypasses toBriefing()/the "brief" state entirely
   (its bespoke level has no BRIEFS/SECTOR_NAMES entry to read) and goes
   straight to flight — X2a's guided-pause sequence (updateTrainingScript,
   js/update.js) is the de facto intro. Never writes a hiscore or a
   resumable snapshot (see the runMode === "training" gates elsewhere). */
function startTraining() {
  goFullscreen();
  if (window.hideA2HS) window.hideA2HS();
  resetRun();
  runMode = "training";
  levelIdx = -1;
  surfaceCtx = null;
  level = genTrainingLevel();
  trainingT = 0; trainingHeldT = 0; trainingShown = {};
  spawnShip();
  state = "play"; stateT = 0;
  blip(330, 660, 0.2, "sine", 0.1);
}
let introSeen = false;
try { introSeen = localStorage.getItem("doids_intro") === "1"; } catch (e) {}
// V8 — the veteran (post-completion) opening intro, shown once
let vetIntroSeen = false;
try { vetIntroSeen = localStorage.getItem("doids_vetintro") === "1"; } catch (e) {}
function markVetIntroSeen() {
  vetIntroSeen = true;
  try { localStorage.setItem("doids_vetintro", "1"); } catch (e) {}
}
function markIntroSeen() {
  introSeen = true;
  try { localStorage.setItem("doids_intro", "1"); } catch (e) {}
}
/* X5 — discovery gates for the post-death hint-card bank: three moments the
   game doesn't already track persistently (a parry landed, a scan finished,
   a counterfeit pod was taken). "Found a lift" and "met Avicenna" reuse
   existing persistent state (veteran + shrinesSeen, and codex) instead. */
let everParried = false, everScanned = false, metFake = false;
try {
  everParried = localStorage.getItem("doids_everparried") === "1";
  everScanned = localStorage.getItem("doids_everscanned") === "1";
  metFake = localStorage.getItem("doids_metfake") === "1";
} catch (e) {}
function markEverParried() {
  if (everParried) return;
  everParried = true;
  try { localStorage.setItem("doids_everparried", "1"); } catch (e) {}
}
function markEverScanned() {
  if (everScanned) return;
  everScanned = true;
  try { localStorage.setItem("doids_everscanned", "1"); } catch (e) {}
}
function markMetFake() {
  if (metFake) return;
  metFake = true;
  try { localStorage.setItem("doids_metfake", "1"); } catch (e) {}
}

/* X5 — the post-death hint-card bank. One card shown per death, rotating
   with no repeats until the bank is exhausted (`hintSeen` clears and starts
   a fresh cycle). Discovery-gated cards only enter the pool once the player
   has met the system they describe — "found a lift" and "met Avicenna" reuse
   existing persistent state rather than new flags. Owner-reviewed copy;
   mirrored in COPY_DECK.md §3. */
// owner note (July 2026): reworded as lines an in-game training officer could
// actually say — attributable, spoken register, not a manual excerpt. Draft
// copy, not final; quoted + attributed at render time (drawGameOver).
const HINTS_ALWAYS = [
  "Thrust is momentum, not a throttle. To stop, thrust the other way.",
  "Raise SHIELD right before you hit rock. It'll save the ship — but it drinks fuel fast.",
  "Fuel's scarce out here. Once a pod's gone, it's gone.",
  "You don't have to fight. Any Scion can come home without a shot fired.",
  "A long fall needs a long burn to arrest. Start slowing early, not late.",
  "When you only need a nudge, tap. Don't hold.",
  "There's more than one way to put a gun down. Shooting it isn't the only one."
];
const CANON_FAMOUS_ID = FAMOUS.findIndex(f => f.upgrade === "canon");
const HINTS_GATED = [
  { gate: () => everParried, text: "A shield raised at just the right moment turns a shot back on whoever sent it." },
  { gate: () => everScanned, text: "Land beside a thing and read it. It'll tell you what firing never will." },
  { gate: () => metFake, text: "Not every fuel pod's a friend. The honest ones flicker like fire — the fakes keep to the Static's beat." },
  { gate: () => veteran && shrinesSeen.size > 0, text: "The ground rings hollow in places. There's a way down, if you're listening." },
  { gate: () => codex.has(CANON_FAMOUS_ID), text: "Your CANON OF TRUTH marks the fakes now. Trust the mark." }
];
let hintSeen = new Set();
let currentHint = "";
function pickHint() {
  const pool = HINTS_ALWAYS.concat(HINTS_GATED.filter(h => h.gate()).map(h => h.text));
  if (hintSeen.size >= pool.length) hintSeen.clear();
  const candidates = pool.filter(t => !hintSeen.has(t));
  const from = candidates.length ? candidates : pool;
  currentHint = from[Math.floor(Math.random() * from.length)];
  hintSeen.add(currentHint);
  return currentHint;
}
/* X3 — the first-play fork. `trained` records that the player has answered the
   one-time "played thrust games before?" prompt (Yes → straight in; No → the
   HOW TO FLY guide first). Once answered it never shows again; RESET PROGRESS
   clears it so it can be run again from Settings. */
let trained = false;
try { trained = localStorage.getItem("doids_trained") === "1"; } catch (e) {}
function markTrained() {
  trained = true;
  try { localStorage.setItem("doids_trained", "1"); } catch (e) {}
}
const ASSIST_RATE = 4.5;

/* Title pills sit in two tidy, equal-width columns instead of a right-heavy
   cluster (the old layout stacked 4 pills top-right against 1 top-left).
   LEFT = the browse/lore screens (CODEX, STORY); RIGHT = config + how-to-play
   (SETTINGS, HOW TO FLY, HUD GUIDE), each column stacked top-down on one rhythm. */
const TITLE_PILL_W = 170, TITLE_PILL_H = 34, TITLE_PILL_STEP = 42;
function codexRect() {   // LEFT column, top
  return { x: 14 + saLeft, y: 12, w: TITLE_PILL_W, h: TITLE_PILL_H };
}
function storyRect() {   // LEFT column, under CODEX
  const c = codexRect();
  return { x: c.x, y: c.y + TITLE_PILL_STEP, w: c.w, h: TITLE_PILL_H };
}
function settingsRect() {   // RIGHT column, top
  return { x: vw - saRight - 14 - TITLE_PILL_W, y: 12, w: TITLE_PILL_W, h: TITLE_PILL_H };
}
function helpRect() {   // RIGHT column, under SETTINGS — HOW TO FLY
  const s = settingsRect();
  return { x: s.x, y: s.y + TITLE_PILL_STEP, w: s.w, h: TITLE_PILL_H };
}
/* U3 — the HUD-legend pill, stacked under HOW TO FLY in the right-hand column */
function legendRect() {   // RIGHT column, under HOW TO FLY — HUD GUIDE
  const s = settingsRect();
  return { x: s.x, y: s.y + 2 * TITLE_PILL_STEP, w: s.w, h: TITLE_PILL_H };
}
function skipRect() {
  return { x: vw - 110 - saRight, y: 12, w: 96, h: 34 };
}
/* Owner steer: the three reference screens (HOW TO FLY, HUD GUIDE, REPLAY STORY)
   collapse under one HELP pill to declutter the title. This is their submenu. */
// X2 — a 4th row (TRAINEE SECTOR) joins the three reference screens
function helpMenuRowRect(i) {
  const w = Math.min(300, vw * 0.7), h = 44, gap = 14;
  const total = h * 4 + gap * 3;
  const y0 = vh / 2 - total / 2 + 10;
  return { x: vw / 2 - w / 2, y: y0 + i * (h + gap), w, h };
}
/* the three lower title pills are laid out from one place so they can
   never collide (on phone-height viewports they used to overlap — and the
   old remix/daily-first hit order could burn the daily attempt on a tap
   meant for RESUME). DAILY centres itself while REMIX is still locked. */
/* R5 — the explicit primary CTA. Tap-anywhere no longer launches a run; only
   this pill (or Enter / gamepad A aimed at it) does. When a run can be
   resumed, START drops below the RESUME pill so the two read as a stack —
   resume-first for a checkpointed run, start-new below it. */
function startRect() {
  const w = Math.min(300, vw * 0.6), h = 40;
  const y = savedRun ? vh * 0.60 + 44 : vh * 0.63;
  return { x: vw / 2 - w / 2, y, w, h };
}
function resumeRect() {
  const w = Math.min(300, vw * 0.6), h = 34;
  return { x: vw / 2 - w / 2, y: startRect().y - h - 10, w, h };
}
function remixRect() {
  const w = Math.min(200, vw * 0.4);
  return { x: vw / 2 - w - 8, y: vh * 0.87, w, h: 30 };
}
// owner decision (found on-device, daily playtest): DAILY is gated behind
// veteran like REMIX, not shown pre-completion — the daily seed re-rolls
// every generator including mechanics that only otherwise appear in later
// sectors (Glycon counterfeits, Vectors, the Hollows), so a first-time
// player hitting it cold skips the story that introduces them.
function dailyRect() {
  const w = Math.min(200, vw * 0.4);
  return { x: vw / 2 + 8, y: vh * 0.87, w, h: 30 };
}
// keyboard/controller nav on the title (see js/input.js) — a flat cycle
// order, not a true 2D grid, since the title's pills aren't laid out on one
// consistent axis (a centred CTA stack, a right-hand column, a left pill,
// a bottom row). Good enough to make every pill reachable; not meant to be
// spatially perfect.
function titleNavItems() {
  const items = [];
  if (savedRun) items.push(resumeRect());
  items.push(startRect());
  items.push(settingsRect());
  items.push(helpRect());
  items.push(codexRect());
  if (veteran) items.push(remixRect());
  if (veteran) items.push(dailyRect());
  return items;
}
function continueRect() {
  const w = Math.min(300, vw * 0.72);
  return { x: vw / 2 - w / 2, y: vh * 0.56, w, h: 54 };
}
/* R4 — a real button, not a hairline under the score. HIG-minimum tap
   target (48×30), moved clear of the score readout to just left of the ECG
   bar, drawn at a legible stroke/glyph in drawHUD. */
function pauseRect() {
  const bw = Math.min(150, vw * 0.3);
  return { x: vw - bw - 14 - saRight - 54, y: 12, w: 48, h: 30 };
}
function pauseRowRect(i) {
  const w = Math.min(260, vw * 0.6), h = 40, gap = 14;
  const totalH = h * 4 + gap * 3;
  const y0 = vh / 2 - totalH / 2;
  return { x: vw / 2 - w / 2, y: y0 + i * (h + gap), w, h };
}
/* U3 — a compact link under the four pause rows into the HUD legend. Kept as a
   secondary strip (not a fifth full row) so the pause stack still fits a
   320-high landscape viewport without the heading clipping. */
function pauseLegendRect() {
  const w = Math.min(260, vw * 0.6), h = 26;
  const last = pauseRowRect(3);
  return { x: vw / 2 - w / 2, y: Math.min(last.y + last.h + 12, vh - h - 8), w, h };
}
/* two-column grid so all ten rows fit even a 320-high landscape viewport
   (the old single column of 8 already clipped its hints at vh ≤ 375, and
   REDUCED FLASH + RESET PROGRESS would have run right off the screen). */
const SETTINGS_ROWS = 10;
function settingsRowRect(i) {
  const cols = 2, rows = Math.ceil(SETTINGS_ROWS / cols);
  const cw = Math.min(240, vw * 0.42), h = 30, gapX = 12, gapY = 7;
  const totalW = cw * cols + gapX, totalH = h * rows + gapY * (rows - 1);
  const x0 = vw / 2 - totalW / 2, y0 = vh / 2 - totalH / 2 + 14;
  const col = i % cols, row = (i - col) / cols;
  return { x: x0 + col * (cw + gapX), y: y0 + row * (h + gapY), w: cw, h };
}
/* S4 — the early-extraction confirm has two rows: SIGNAL (0) and RETURN (1) */
function confirmRowRect(i) {
  const w = Math.min(300, vw * 0.7), h = 42, gap = 14;
  const y0 = vh * 0.66;
  return { x: vw / 2 - w / 2, y: y0 + i * (h + gap), w, h };
}
const inRect = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/* X3 — the two answer buttons on the first-play fork ("played thrust games
   before?"). Row 0 = YES (straight in), row 1 = NO (open the guide first).
   Sized and centred to clear a 320-high landscape phone. */
function forkRowRect(i) {
  const w = Math.min(320, vw * 0.72), h = 44, gap = 14;
  const y0 = vh * 0.56;
  return { x: vw / 2 - w / 2, y: y0 + i * (h + gap), w, h };
}

/* X1 — the beginner's guide: an illustrated, paged HOW TO FLY. Each page pairs
   a labelled diagram (drawn in render.js drawGuide — a ship + the real on-screen
   buttons) with one short caption, so a new player *sees* the ship and the
   controls doing the thing rather than reading a wall of text. Reached from the
   title HELP submenu and from the X3 first-play "No" branch. Reachable any time.
   `GUIDE` holds the shared paging state (mirrors the card-panel contract: .page,
   .pages, ._footY). Copy mirrored in docs/COPY_DECK.md (R10). */
const GUIDE = { page: 0, pages: 1, _footY: 0, color: "#00e5ff" };
const GUIDE_PAGES = [
  { art: "rotate", title: "TURN",
    caption: "The two left buttons turn the ship. ↺ spins it left, ↻ spins it right. Thrust always pushes the way the nose points — so aim first, then burn." },
  { art: "thrust", title: "THRUST",
    caption: "Hold THRUST to fire the engine. It's momentum, not a throttle: the longer you hold, the faster and further you drift. For a small nudge, tap, don't hold." },
  { art: "counter", title: "SLOW DOWN",
    caption: "There are no brakes. To slow, turn to face the way you're moving and thrust against it. A long fall needs a long burn to arrest — start slowing early." },
  { art: "shield", title: "SHIELD",
    caption: "Hold SHIELD the instant before you hit rock, a drone or a shot. It saves the ship, but it drinks fuel. Raise it late, drop it the moment you're clear." },
  { art: "fuel", title: "FUEL",
    caption: "THRUST and SHIELD both burn FUEL — the yellow bar, top-left. Run dry and you're stranded. Land by a Scion or reach MERCY's bay to top up." },
  { art: "fire", title: "FIRE",
    caption: "FIRE shoots, but firing is malpractice and costs your rank. Every Scion can come home without a shot; keep FIRE for when there's truly no other way." },
  { art: "land", title: "LAND & RESCUE",
    caption: "Set down slow and upright on flat ground beside a stranded Scion and it climbs aboard. The approach guide turns GREEN when it's safe — watch ↓ descent and ↔ drift — then ferry them to MERCY's cyan bay." },
  { art: "controls", title: "OTHER CONTROLS",
    caption: "🎮 Gamepad: stick or d-pad steers, A thrusts, X fires, LB/B shields.  ⌨ Keyboard: arrows steer, SPACE thrusts, X fires, C / ⇧ / ↓ shields." }
];

/* U3 — the HOW TO FLY guide teaches the controls but never names the on-screen readouts.
   The HUD guide (render.js drawHudGuide) is now an ANNOTATED layout, not prose:
   it draws each real readout where it sits and names it, so a new player can map
   word to widget. This object just holds the paging/tap state the guide shares
   with the card-panel tap handler; the guide is reached from the title (beside
   HOW TO FLY) and from the PAUSE screen. */
const LEGEND_CARD = { page: 0 };

/* ===== Bundle P (P·terrain) — columns of spans ==========================
   Act One terrain is a heightmap: level.heights[], one floor per column every
   STEP px, plus at most one parallel ceiling (level.roof, genCave). That model
   cannot express an overhang — see docs/ACT_TWO_SPEC.md §11.0 for why, and for
   the owner decision to generalise rather than move to polygon terrain.

   An Act Two chamber carries level.spans instead: one entry per column, each
   an array of OPEN (flyable) intervals { top, bot } ordered top to bottom,
   with solid rock above `top` and below `bot`. It is a strict superset of the
   heightmap —

     a surface column   ≡  [{ top: -Infinity, bot: heights[i] }]
     an Act One cave    ≡  [{ top: roof[i],   bot: heights[i] }]

   — so nothing about the shipped representation had to change. Two or more
   spans in one column IS an overhang; a short span is a pinch point; a column
   with no span at all is solid rock (a pillar). What spans still cannot express
   is a true re-entrant hook, which §11.0 accepts.

   Collision stays an O(1) column lookup plus a walk of that column's spans
   (one or two in practice). groundAt/roofAt keep their shape and take an
   OPTIONAL second argument, the y that says which span you mean. Every shipped
   call site passes x alone and takes the heightmap path completely unchanged —
   that is what keeps Act One's generation, the landing maths and the M1 golden
   checksum untouched by this bundle. Authored chambers are enclosed, so the
   compiler never actually emits an infinite `top`; the equivalence above is
   there to show the model is a superset, not to describe emitted data. */

// the span in `col` that y falls inside; failing that, the one whose interval y
// is nearest to — so a query from inside rock still resolves to the surface it
// is about to hit, the way a heightmap always had exactly one answer.
function pickSpan(col, y) {
  if (!col || !col.length) return null;
  /* `best` starts at a real span and the comparison is <=, so a non-empty column
     can NEVER come back null. It used to start null with a strict <, which meant
     an infinite or very distant y left every candidate at distance Infinity,
     failed `d < bestD` every time, and returned null for a column that plainly
     had spans in it — silently turning groundAt(x) into "the bottom of the
     world" on any chamber. Act One never saw it (heightmap path), which is
     exactly why it needed finding before P·slice. */
  let best = col[0], bestD = Infinity;
  for (const sp of col) {
    if (y > sp.top && y < sp.bot) return sp;
    const d = y <= sp.top ? sp.top - y : y - sp.bot;
    if (d <= bestD) { bestD = d; best = sp; }
  }
  return best;
}

// the span in the neighbouring column that best lines up with `ref`: most
// vertical overlap, falling back to nearest midpoint when nothing overlaps.
// This is what stitches per-column spans into continuous floors and ceilings.
function matchSpan(col, ref) {
  if (!col || !col.length) return null;
  let best = null, bestScore = -Infinity;
  for (const sp of col) {
    const ov = Math.min(sp.bot, ref.bot) - Math.max(sp.top, ref.top);
    const score = ov > 0 ? ov : -Math.abs((sp.top + sp.bot) / 2 - (ref.top + ref.bot) / 2);
    if (score > bestScore) { bestScore = score; best = sp; }
  }
  return best;
}

/* The neighbour span that is genuinely the SAME surface continuing — a MUTUAL
   best match. `matchSpan` on its own always answers with something (nearest
   midpoint when nothing overlaps), which is exactly what stitches a sloping
   floor across columns and must not change. But where a column holds two spans
   and its neighbour holds one, BOTH of them answer with that one, and the rock
   between them — a mezzanine's tip, a shelf running out — is then drawn and
   collided as if it tapered into nothing. Owner, August 2026, flying the slice:
   the corridor above the gallery mezzanine closed into a wedge with no edge
   drawn on it, and read as "everything is solid" when the way on was a dive
   underneath. Requiring the match to be mutual gives the losing span a clean
   TERMINATION, which is what the end of a shelf actually is.

   Used by `spanAt` and by the terrain tile builder, deliberately the same call
   in both: the rock you see and the rock you hit have to end in the same place.
   `dir` is +1 or -1. */
function matchSpanMutual(spans, i, sp, dir) {
  const nxt = spans[i + dir];
  if (!nxt || !nxt.length) return null;
  const m = matchSpan(nxt, sp);
  if (!m) return null;
  return matchSpan(spans[i], m) === sp ? m : null;
}

/* the open span at (x, y), interpolated between the two bracketing columns so
   floors and ceilings slope smoothly exactly as the heightmap's lerp does.
   y omitted means "the lowest span in the column" — the heightmap's one answer.
   Returns null only where the column is solid rock through and through. */
/* `spans` is optional and defaults to the live level's. It exists so code that
   is still BUILDING a level — snapToSurface, trunkPath (js/acttwo-data.js) —
   can ask this exact question before `level.spans` is assigned. That matters
   more than it sounds: placing a fixture against the nearest sampled column
   while collision reads the interpolated surface puts it a fraction of a
   column's slope out, which is invisible on the hall's ±20px deck and put a
   conduit run 2.5px under the floor of the well shaft, where the slope is
   steep. Same predicate, same answer, one code path. */
function spanAt(x, y, spans) {
  const s = spans || level.spans;
  if (!s) return null;
  const i = clamp(Math.floor(x / STEP), 0, s.length - 2);
  const t = clamp(x / STEP - i, 0, 1);
  const col = s[i];
  if (!col || !col.length) return null;                 // solid rock, floor to roof
  // y omitted means "the lowest span here" — the heightmap's one answer. Said
  // outright rather than by passing a sentinel into pickSpan and hoping.
  const a = y == null ? col[col.length - 1] : pickSpan(col, y);
  if (!a) return null;
  /* WHICH neighbour span to interpolate toward. When a y is given it is the one
     that y is in — NOT the one with the most overlap, which is what matchSpan
     answers and what this used to use.

     The difference only shows up where the span count changes, i.e. at the end
     of every shelf and overhang, and there it was fatal. West of the gallery
     mezzanine one column holds [605..1208] and the next holds [584..802] and
     [920..1258]. matchSpan pairs the single span with the LOWER neighbour,
     because 288px of overlap beats 197 — so a hull flying the upper corridor at
     y 741 got an interpolated span of [762..1233], was reported as inside rock,
     and (once impacts started killing) died against nothing at all. That is the
     "I can't get any further west, everything seems solid" the owner hit twice:
     it was never the level, it was this.

     With no y — the heightmap's one-answer path — there is no "span you are in"
     to ask about, so it keeps matchSpanMutual and its clean termination. */
  const b = (y == null ? matchSpanMutual(s, i, a, 1)
                       : pickSpan(s[i + 1], y) || matchSpanMutual(s, i, a, 1)) || a;
  // continuation holds its own height to the column edge and then stops
  // materials come from the span you are actually in, not interpolated: a face is
  // either milled or it is raw rock, and a half-milled surface means nothing.
  // Carried here so P·systems can ask what it just touched (§8.1's tell needs it:
  // thruster wash raises grit off rock and nothing off a projection).
  return { top: lerp(a.top, b.top, t), bot: lerp(a.bot, b.bot, t), mt: a.mt, mb: a.mb };
}

/* is (x, y) inside rock? The tether and the "every chamber is clearable"
   invariant both want this, and it is the one question a heightmap could only
   answer one axis at a time. The heightmap branch uses the same strict
   comparisons the shipped projectile test used (updateShots, js/update.js), so
   substituting solidAt there is exactly equivalent rather than merely close. */
function solidAt(x, y) {
  if (!level.spans) return y > groundAt(x) || (!!level.roof && y < roofAt(x));
  const sp = spanAt(x, y);
  return !sp || y <= sp.top || y >= sp.bot;
}

// a chamber may be deeper than Act One's world box; everything else defaults to it
function levelH() { return (level && level.H) || WORLD_H; }

function groundAt(x, y) {
  if (level.spans) { const sp = spanAt(x, y); return sp ? sp.bot : levelH(); }
  const h = level.heights;
  const i = clamp(Math.floor(x / STEP), 0, h.length - 2);
  const t = clamp(x / STEP - i, 0, 1);
  return lerp(h[i], h[i + 1], t);
}

function flatten(heights, cx, halfW) {
  const i0 = Math.max(1, Math.floor((cx - halfW) / STEP));
  const i1 = Math.min(heights.length - 2, Math.ceil((cx + halfW) / STEP));
  const y = heights[Math.floor(cx / STEP)];
  for (let i = i0; i <= i1; i++) heights[i] = y;
  if (i0 > 1) heights[i0 - 1] = (heights[i0 - 2] + y) / 2;
  if (i1 < heights.length - 2) heights[i1 + 1] = (heights[i1 + 2] + y) / 2;
  return y;
}

function groundOf(heights, x) {
  const i = clamp(Math.floor(x / STEP), 0, heights.length - 2);
  return lerp(heights[i], heights[i + 1], clamp(x / STEP - i, 0, 1));
}

// like flatten, but to a GIVEN height (a landing shelf level with a Scion,
// rather than to whatever height sat at cx) — used by the V2 fairness pass.
function flattenTo(heights, cx, halfW, y) {
  const i0 = Math.max(1, Math.floor((cx - halfW) / STEP));
  const i1 = Math.min(heights.length - 2, Math.ceil((cx + halfW) / STEP));
  for (let i = i0; i <= i1; i++) heights[i] = y;
  if (i0 > 1) heights[i0 - 1] = (heights[i0 - 2] + y) / 2;
  if (i1 < heights.length - 2) heights[i1 + 1] = (heights[i1 + 2] + y) / 2;
}

/* (owner steer) — the Solace fire-death sinks a real CRATER into the heightmap:
   the mass that made up her hull is gone, so the ridge collapses into a bowl.
   Deepens the terrain across ±rad around cx (a cos² bowl, deepest at centre),
   only ever pushing DOWN (max), leaving raised lips at the rim. The caller
   invalidates the terrain tile cache so the sunken profile actually re-renders. */
function crushCrater(heights, cx, rad, depth) {
  const base = groundOf(heights, cx);
  const i0 = Math.max(1, Math.floor((cx - rad) / STEP));
  const i1 = Math.min(heights.length - 2, Math.ceil((cx + rad) / STEP));
  for (let i = i0; i <= i1; i++) {
    const dx = (i * STEP - cx) / rad;               // -1..1 across the crater
    if (Math.abs(dx) >= 1) continue;
    const bowl = Math.cos(dx * Math.PI / 2);        // 1 at centre → 0 at rim
    const lip = Math.abs(dx) > 0.8 ? -8 * Math.sin((Math.abs(dx) - 0.8) / 0.2 * Math.PI) : 0;
    heights[i] = base + depth * bowl * bowl + lip;  // down in the middle, a small raised rim
  }
  return base;
}

/* V2 — scan-jeopardy fairness. Is there a landable spot from which a landed scan
   of the Scion at cx COMPLETES before the Scion creeps to the hatch and boards
   unread? The band is derived from the scan/creep constants (updateScionScan):
   the read takes SCION_SCAN_T seconds at the base rate, over which the Scion
   closes SCAN_CREEP·that px toward the hatch (~15px), so the touchdown must be
   beyond ~110px yet within the SCION_SCAN_RANGE read radius — on ground shallow
   enough to land (slope < the 0.25 landing max) and within 70px vertically so
   the read can even start. Only the touchdown must be shallow; the Scion's
   approach may be up or down a slope it walks. */
function scanSpotOK(heights, W, cx) {
  const g = x => groundOf(heights, x);
  const LO = 15 + SCAN_CREEP * SCION_SCAN_T + 7;   // ~110 — read finishes before the hatch
  const HI = SCION_SCAN_RANGE - 5;                 // ~195 — still inside the read radius
  const gy0 = g(cx);
  for (const side of [-1, 1])
    for (let d = LO; d <= HI; d += 3) {
      const x = cx + side * d;
      if (x < 40 || x > W - 40) continue;
      if (Math.abs(g(x + 10) - g(x - 10)) / 20 < 0.25 && Math.abs(g(x) - gy0) < 70) return true;
    }
  return false;
}

/* per-sector recipe: each sector introduces one new element.
   scn = decorative scenery counts; fakes = Glycon's counterfeit fuel pods;
   lift marks the sectors whose ground hides a secret lift into the Hollows. */
/* T2/T3 — each sector carries its own biome: a terrain palette (grad/stroke/
   glow, plus a `night` darkness tint and `star` field tint) and its own
   ornamentation counts. The landscape echoes its healer, so the biome IS the
   narrative. Caves keep the Static's violet (CAVE_PAL in render.js). */
/* ===== V·pacifism — restraint must always outscore shooting ===============
   Owner decision, July 2026, raised while settling Act Two's ladder: "the
   combined value of shooting guns should never outweigh the pacifist score."
   The check was run against the shipped numbers and **Act One failed it.**

   The no-harm bonus was a flat +2000 for `level.firedShots === 0` (G3), while
   kills pay 250 a turret and 150 a drone. The RECIPE table below already crosses
   over on the back half of the campaign:

     8 turrets + 2 drones = 2300   a shooter beat a pacifist by 300
     7 turrets + 2 drones = 2050   over the line on two more sectors

   — and that is *before* `wideBump`, V10's veteran gun escalation, or the
   `crowded` daily modifier's two extra drones. So the ladder was paying better
   for clearing the room with the gun, which is the opposite of what the game is
   about.

   FIXED BY DERIVING, NOT BY RE-PRICING (owner). The award is a function of what
   you passed up — the sector's own gun value, times a factor above one — so
   restraint always pays more AND cannot be overtaken by a future content change.
   Dropping the kill prices instead would balance today's table and rot the
   moment Bundle W or a veteran return adds guns. Same discipline as
   `momentumGapPx` in js/acttwo-data.js, for the same reason.

   Counted over the guns the sector GENERATED, not the ones still standing,
   because destroying a gun means you fired and that forfeits the award anyway.

   THE PARRY IS A DELIBERATE EXCEPTION, not a loophole (owner decision, July
   2026 — recorded because it looks like an oversight and will be "fixed" by
   someone otherwise). A parried kill pays full price and does NOT set
   `firedShots`, so a player who reflects every round collects the kills AND the
   no-harm bonus, and is scored better than a pure pacifist who dodges. That is
   intended. E3's parry is the game's hardest skill and it is *defensive* — you
   are struck at and you send it back — so it belongs on the restraint side of
   the ledger, not the violence side. Rewarding it most is the game arguing that
   there is a way through that is neither firing first nor merely enduring.
   It does mean the no-harm bonus has always measured *you did not shoot first*
   rather than *nobody died*, and the name (`noHarm`, G3) overstates it slightly.
   Left as is: the achievement has shipped, and renaming it would break it.

   One helper, shared with Act Two (rule 7 of P·systems' ladder), so the
   invariant cannot hold in one act and quietly fail in the other. */
const KILL_TURRET = 250, KILL_DRONE = 150;
/* BASE is a FLOOR for a room with nothing in it to resist, not the body of the
   award — the body is the premium on what you passed up. Held at the old flat
   2000 in the first pass, which held the invariant but roughly doubled a perfect
   pacifist campaign's bonus (16,000 → 31,600) and made shipped hiscores easy to
   beat; the owner asked for it down. At 500 the campaign total is 19,600 (+23%
   rather than +98%), and an unarmed sector still pays something.

   The shape changes with it, and that is the improvement rather than the cost: a
   flat bonus paid the same for restraint in a room with two turrets as in a room
   with nine. Derived, the award scales with the temptation actually resisted —
   sector 0 pays 1,125 where it used to pay 2,000, and sector 6 pays 3,688. */
const NOFIRE_BASE = 500, NOFIRE_FACTOR = 1.25;

// what every gun in this level is worth if you shoot it — the thing a pacifist
// declines. Uses array length, not `alive`: it is the sector's complement.
function gunValue(lvl) {
  const L = lvl || level;
  if (!L) return 0;
  return (L.turrets ? L.turrets.length * KILL_TURRET : 0) +
    (L.drones ? L.drones.length * KILL_DRONE : 0);
}
// and what clearing it without firing is worth. Strictly greater than gunValue
// for any complement, because FACTOR > 1 and BASE > 0 — that is the invariant.
function noFireAward(lvl) {
  return Math.round(NOFIRE_BASE + gunValue(lvl) * NOFIRE_FACTOR);
}

const RECIPE = [
  // 0 · ASCLEPION — temple calm, soft teal-greens; the tutorial breathes
  { oids: 3, turrets: 2, sabs: 0, drones: 0, pods: 0, fakes: 0, anomalies: 0, dark: false,
    lift: false, scn: { trees: 9, rocks: 5, bld: 2, ruin: 0, wreck: 0 },
    pal: { grad: ["#0d2926", "#05130f"], stroke: "#5fe3c8", glow: "#1f8f7a",
           night: [2, 9, 8], star: [180, 230, 215] } },
  // 1 · VESALIUS RIDGE — anatomy; rust reds / ochre, the exposed muscle of land
  { oids: 5, turrets: 4, sabs: 1, drones: 0, pods: 1, fakes: 0, anomalies: 0, dark: false,
    lift: true,  scn: { trees: 7, rocks: 6, bld: 1, ruin: 1, wreck: 1, boulders: 4 },
    pal: { grad: ["#2a1509", "#160a04"], stroke: "#e0975a", glow: "#8f4a1f",
           night: [9, 4, 2], star: [235, 205, 180] } },
  // 2 · NIGHTINGALE BASIN — her sector is the dark one; deep indigo
  { oids: 6, turrets: 4, sabs: 1, drones: 0, pods: 2, fakes: 0, anomalies: 0, dark: true,
    lift: false, scn: { trees: 5, rocks: 6, bld: 0, ruin: 2, wreck: 1, reeds: 5, lanterns: 3 },
    pal: { grad: ["#141240", "#080622"], stroke: "#8390ff", glow: "#3b3f9f",
           night: [4, 4, 14], star: [200, 210, 255] } },
  // 3 · SEMMELWEIS DEEP — the scrubbed ward; cold antiseptic grey-green.
  // Its signature: unscreened contagion spreads (see updateContagion) — an
  // unscanned Vector left standing taints the survivor beside it.
  { oids: 7, turrets: 6, sabs: 2, drones: 1, pods: 3, fakes: 0, anomalies: 0, dark: false,
    contagion: true,
    lift: true,  scn: { trees: 4, rocks: 7, bld: 0, ruin: 2, wreck: 1 },
    pal: { grad: ["#16241f", "#0a120e"], stroke: "#8fd6b8", glow: "#3f7a5f",
           night: [3, 8, 7], star: [205, 225, 215] } },
  // 4 · CURIE FIELDS — radium glow; luminous violet-green (anomaly violet kept)
  { oids: 8, turrets: 7, sabs: 2, drones: 2, pods: 4, fakes: 0, anomalies: 3, dark: false,
    lift: false, scn: { trees: 3, rocks: 8, bld: 0, ruin: 3, wreck: 2, spires: 5 },
    pal: { grad: ["#1a1442", "#0b0820"], stroke: "#a6ff9c", glow: "#6a4dcf",
           night: [5, 3, 13], star: [205, 235, 205] } },
  // 5 · AVICENNA SHOALS — the Persian crossing; sand / amber
  { oids: 8, turrets: 7, sabs: 2, drones: 2, pods: 3, fakes: 3, anomalies: 2, dark: false,
    lift: true,  scn: { trees: 6, rocks: 6, bld: 0, ruin: 2, wreck: 1, dunes: 4 },
    pal: { grad: ["#2a2109", "#161004"], stroke: "#e6c85f", glow: "#8f6a1f",
           night: [10, 7, 3], star: [240, 225, 180] } },
  // 6 · JENNER TERRACES — cowpox country, the calm that lies; pale pastoral green
  { oids: 9, turrets: 8, sabs: 3, drones: 2, pods: 4, fakes: 3, anomalies: 2, dark: false,
    lift: false, scn: { trees: 2, rocks: 7, bld: 0, ruin: 4, wreck: 2, hedges: 4 },
    pal: { grad: ["#15260f", "#0a1607"], stroke: "#a8e39a", glow: "#4a8f3a",
           night: [4, 9, 4], star: [210, 235, 200] } },
  // 7 · THE NULLWAVE — the Static's home; near-black violet, as it always was
  { oids: 2, turrets: 6, sabs: 0, drones: 3, pods: 3, fakes: 2, anomalies: 2, dark: true,
    lift: false, scn: { trees: 0, rocks: 8, bld: 0, ruin: 3, wreck: 3 },
    pal: { grad: ["#1b1040", "#0c0820"], stroke: "#b388ff", glow: "#7c4dff",
           night: [2, 3, 10], star: [200, 220, 255] } }
];
const LIFT_CAVE = { 1: 0, 3: 1, 5: 2 };  // which sector's lift opens which cave

/* V12/V13 (owner steer) — roll which side of the finale twin is real, where
   both ships sit, and (re)arm the split-reveal. Pulled out of genLevel so a
   life lost inside the Nullwave can call it again (see shipDie's respawn path
   in js/update.js): otherwise dying leaves the assignment — and the fact
   you've already watched the split resolve — exactly as it was, so respawning
   would hand the answer back for free. `rngFn` is the level's seeded rng at
   initial generation (keeps genLevel deterministic/reproducible); a later
   in-play re-roll after death uses Math.random, since it isn't world
   generation and has no reproducibility contract. */
function rollMercyTwin(lvl, rngFn) {
  const W = lvl.W;
  const a = W * (0.20 + rngFn() * 0.14);   // ~0.20–0.34
  const b = W * (0.60 + rngFn() * 0.16);   // ~0.60–0.76  (≥ ~0.26·W apart)
  const realLeft = rngFn() < 0.5;
  lvl.mx = realLeft ? a : b; lvl.my = 170;
  // V13 (owner steer) — three rounds to bring her down (not one), so a stray
  // shot meant for a turret/drone can't accidentally reveal her, and the
  // heftier hull reads as a real target, not a lure that pops on contact.
  lvl.fakeMercy = { x: realLeft ? b : a, y: 170, dead: false, dockT: 0, scanT: 0, hp: 3 };
  lvl.mercySplitT = MERCY_SPLIT_DUR;   // the split-into-two reveal, replayed on every roll
}

/* X2 — the trainee sector ("Level 0"): a bespoke, always-identical layout —
   gentle wide terrain, one Scion, one optional turret placed far from the
   Scion (avoidable — it introduces the threat, it doesn't punish). Used only
   by startTraining(). It never reads RECIPE/BRIEFS/SECTOR_NAMES (training
   skips the "brief" state entirely, going straight to "play") and never ends
   on its own or writes a hiscore (see the runMode === "training" gates on
   checkSectorClear/updateEarlyExtraction/updateStaticClock/saveHi in
   js/update.js). `n: 0` is set only so biomePal() picks up Asclepion's calm
   teal-green — thematically apt for a teaching sector, and RECIPE[n] is read
   nowhere else for a generated level. */
function genTrainingLevel() {
  const W = 3000;
  const rng = mulberry32(0x54726169);   // fixed seed — training is always the same
  const count = Math.floor(W / STEP) + 2;
  const octave = (wl, amp) => {
    const pts = [];
    for (let i = 0; i <= Math.ceil(W / wl) + 1; i++) pts.push((rng() * 2 - 1) * amp);
    return x => {
      const p = x / wl, i = Math.floor(p), t = p - i;
      return lerp(pts[i], pts[i + 1], (1 - Math.cos(t * Math.PI)) / 2);
    };
  };
  // half the campaign's roughness at n=0 — "gentle wide terrain"
  const o1 = octave(420, 95), o2 = octave(150, 32), o3 = octave(60, 10);
  const heights = [];
  for (let i = 0; i < count; i++) {
    const x = i * STEP;
    heights.push(clamp(1100 + o1(x) + o2(x) + o3(x), 900, 1300));
  }
  for (let i = 0; i < 4; i++) { heights[i] = 600; heights[count - 1 - i] = 600; }

  const lvl = { n: 0, W, heights, oids: [], turrets: [], bullets: [], shots: [],
    drones: [], pods: [], fakePods: [], anomalies: [], scenery: [],
    blackbox: null, beacon: null, lift: null, shrine: null, roof: null,
    mx: 280, my: 170, mxo: 0, myo: 0, delivered: 0, lost: 0, contained: 0,
    total: 2, firedShots: 0, extraction: null, pulse: null, isCave: false,
    dark: false, isFinale: false, contamKnown: false, contagion: false,
    contagSeen: false, fragmentsHere: [], training: true,
    journeys: 0, journeyOpen: false };

  const sx = W * 0.55, sy = flatten(heights, sx, 80);
  lvl.oids.push({ x: sx, y: sy, home: sx, state: "wait", wave: rng() * 6,
    role: "normal", sleeper: false, famousId: -1, carrier: false, panicT: 0,
    sabT: 0, persona: "sit", scale: 1, gait: 34, nearShip: false });

  // one optional, avoidable turret — well clear of the Scion and off the
  // direct MERCY↔Scion line
  const tx = W * 0.82, ty = flatten(heights, tx, 40);
  lvl.turrets.push({ x: tx, y: ty, cd: 1 + rng() * 2, alive: true, ang: -Math.PI / 2 });

  // a second Scion further out, past the turret — owner note (July 2026):
  // gives the trainee sector somewhere to fly to once the FIRE/rescue cards
  // land, and a reason to keep flying in X2b's free-play afterward.
  const sx2 = W * 0.93, sy2 = flatten(heights, sx2, 80);
  lvl.oids.push({ x: sx2, y: sy2, home: sx2, state: "wait", wave: rng() * 6,
    role: "normal", sleeper: false, famousId: -1, carrier: false, panicT: 0,
    sabT: 0, persona: "sit", scale: 1, gait: 34, nearShip: false });

  // fuel pods so X2b's free-play can't strand a new pilot
  for (const px of [W * 0.35, W * 0.68, W * 0.88]) {
    lvl.pods.push({ x: px, y: flatten(heights, px, 30), taken: false, ph: rng() * 7 });
  }

  stars = [];
  const srng = mulberry32(0x54726169 ^ 999);
  for (let i = 0; i < 220; i++)
    stars.push({ x: srng() * W, y: srng() * 900, s: srng() * 1.6 + 0.4, tw: srng() * 6 });
  return lvl;
}

function genLevel(n) {
  if (runMode === "training") return genTrainingLevel();
  const r = RECIPE[n];
  // T1 — progressive widths: sectors grow with n so the maps feel like places.
  // Sector 0 is the smallest (the teaching sector); the finale keeps 4400 —
  // it is dense and dark by design, not wide.
  const W = n === FINALE_IDX ? 4400 : 2200 + n * 550;
  const rng = mulberry32(1013 * (n + 3) + 77 + runSeed);
  const count = Math.floor(W / STEP) + 2;

  const octave = (wl, amp) => {
    const pts = [];
    for (let i = 0; i <= Math.ceil(W / wl) + 1; i++) pts.push((rng() * 2 - 1) * amp);
    return x => {
      const p = x / wl, i = Math.floor(p), t = p - i;
      return lerp(pts[i], pts[i + 1], (1 - Math.cos(t * Math.PI)) / 2);
    };
  };
  const rough = 1 + Math.min(n, 5) * 0.12;
  const o1 = octave(420, 190 * rough), o2 = octave(150, 65 * rough), o3 = octave(60, 20);
  const heights = [];
  for (let i = 0; i < count; i++) {
    const x = i * STEP;
    heights.push(clamp(1100 + o1(x) + o2(x) + o3(x), 760, 1380));
  }
  for (let i = 0; i < 4; i++) { heights[i] = 600; heights[count - 1 - i] = 600; }

  const lvl = { n, W, heights, oids: [], turrets: [], bullets: [], shots: [],
    drones: [], pods: [], fakePods: [], anomalies: [], scenery: [],
    blackbox: null, beacon: null, lift: null, shrine: null, roof: null,
    mx: 280, my: 170, mxo: 0, myo: 0, delivered: 0, lost: 0, contained: 0,
    total: 0, firedShots: 0, extraction: null, pulse: null, isCave: false,
    dark: r.dark || dailyMod("dark"), isFinale: n === FINALE_IDX,
    contamKnown: false, contagion: !!r.contagion, contagSeen: false, fragmentsHere: [],
    journeys: 0, journeyOpen: false };   // minimum-journeys bonus tracking

  // T6 — the Basin stages its own nightfall: it opens at dusk and the dark
  // comes down over the first ~20s (or at first boarding, whichever is first).
  // Every other dark level (finale, a BLACKOUT rotation) stays full-dark from
  // the first frame — darkAlpha left undefined means drawDarkness uses 0.9.
  if (n === 2) {
    lvl.nightStaged = true;
    lvl.nightFell = false;
    lvl.nightT = 0;
    lvl.nightRamp = 0;
    lvl.darkAlpha = 0.4;   // dusk
  }

  const spots = [];
  const pick = minDist => {
    for (let tries = 0; tries < 80; tries++) {
      const x = 600 + rng() * (W - 900);
      if (spots.every(s => Math.abs(s - x) > minDist)) { spots.push(x); return x; }
    }
    return 600 + rng() * (W - 900);
  };

  const PERSONAS = ["wave1", "wave2", "jump", "pace", "sit"];
  const newOid = (x, y, role) => ({ x, y, home: x, state: "wait", wave: rng() * 6,
    role, sleeper: false, famousId: -1, carrier: false, panicT: 0, sabT: 0,
    persona: PERSONAS[Math.floor(rng() * PERSONAS.length)],
    scale: 0.95 + rng() * 0.3, gait: 30 + rng() * 12, nearShip: false });
  // T1 — the wide campaign sectors (4–6) get +1 Scion and +1 turret each, so
  // the extra room reads as denser wilderness, not emptier ground.
  const wideBump = (n >= 4 && n < FINALE_IDX) ? 1 : 0;
  // V10 — the veteran campaign RETURN is not a re-run of the first: same
  // landscape (the terrain octaves above are untouched), but MORE GUNS, a HIGHER
  // PROPORTION OF VECTORS, and — by decorrelating the placement RNG here, after
  // the terrain is fixed — DIFFERENT Scion/Vector/turret positions. Gated to a
  // veteran campaign run on the scored sectors: REMIX/DAILY already re-roll, and
  // the finale keeps its authored setup + the counterfeit MERCY (N1). The
  // non-veteran first run (and the M1 golden heightmap) is byte-for-byte as
  // before — none of this fires unless `veteran`.
  const vetReturn = veteran && runMode === "campaign" && n < FINALE_IDX;
  const vetGuns = vetReturn ? 2 : 0;
  const vetVectors = vetReturn && n >= 1 ? (n >= 3 ? 2 : 1) : 0;
  if (vetReturn) { rng(); rng(); rng(); }   // shift the stream → a different layout
  for (let i = 0; i < r.oids + wideBump; i++) {
    const x = pick(280);
    const y = flatten(heights, x, 80);
    lvl.oids.push(newOid(x, y, "normal"));
  }
  // one famous Scion per campaign sector (remix shuffles who waits where).
  // Owner steer ("move Flo to halfway so you feel the benefit"): place the
  // famous mind near the MIDDLE of the map, not at a random edge, so its
  // permanent upgrade is earned early enough to matter for the rest of the run.
  if (n < FINALE_IDX && lvl.oids.length) {
    rng();   // preserve the RNG sequence — this slot used to pick the famous index
    const mid = W * 0.5;
    let f = lvl.oids[0];
    for (const o of lvl.oids)
      if (Math.abs(o.x - mid) < Math.abs(f.x - mid)) f = o;
    f.role = "famous"; f.famousId = famousIdFor(n);
  }
  // saboteurs are extra figures, indistinguishable at a distance
  // (V10 raises the Vector proportion on a veteran return via vetVectors)
  const nSabs = r.sabs + (dailyMod("sleepers") && r.sabs ? 1 : 0) + vetVectors;
  for (let i = 0; i < nSabs; i++) {
    const x = pick(260);
    const y = flatten(heights, x, 70);
    const sab = newOid(x, y, "saboteur");
    sab.sleeper = dailyMod("sleepers") ||
      (n >= 2 && rng() < (n === 6 ? 0.75 : 0.5)); // the terraces crawl with sleepers
    lvl.oids.push(sab);
  }
  // two of the ordinary Scions carry log fragments
  const normals = lvl.oids.filter(o => o.role === "normal");
  for (let i = 0; i < Math.min(2, normals.length); i++) {
    normals[Math.floor(rng() * normals.length)].carrier = true;
  }
  lvl.total = lvl.oids.length;

  for (let i = 0; i < r.turrets + wideBump + vetGuns; i++) {   // V10 — more guns on a veteran return
    const x = pick(220);
    const y = flatten(heights, x, 40);
    lvl.turrets.push({ x, y, cd: 1 + rng() * 2, alive: true, ang: -Math.PI / 2 });
  }
  // Early-sector fairness pass: no Scion may wait inside interlocking turret
  // cover. A rescue that can't be flown without firing (or a shield the
  // player hasn't learned yet) breaks the oath's own teaching — save it for
  // the later sectors. Any extra turrets crowding a Scion get re-sited.
  if (n <= 2) {
    const COVER_R = 380, MAX_COVER = 1;
    const coverers = (o, skip) => lvl.turrets.filter(t =>
      t !== skip && Math.hypot(t.x - o.x, t.y - o.y) < COVER_R);
    for (const o of lvl.oids) {
      let guard = 0;
      while (coverers(o).length > MAX_COVER && guard++ < 12) {
        const t = coverers(o)[0];
        // a fair new spot: never lands on top of anyone, and only enters an
        // oid's reach if that oid currently has no other turret covering it
        let nx = t.x, ok = false;
        for (let tries = 0; tries < 60 && !ok; tries++) {
          nx = 600 + rng() * (W - 900);
          ok = lvl.oids.every(q =>
            Math.abs(q.x - nx) > COVER_R + 40 ||
            (Math.abs(q.x - nx) > 120 && coverers(q, t).length === 0));
        }
        if (ok) { t.x = nx; t.y = flatten(heights, nx, 40); }
        else lvl.turrets.splice(lvl.turrets.indexOf(t), 1);   // retire it — never ship the pocket
      }
    }
  }
  for (let i = 0; i < r.drones + (dailyMod("crowded") ? 2 : 0); i++) {
    lvl.drones.push({ x: 900 + rng() * (W - 1200), y: 400 + rng() * 250,
      vx: 0, vy: 0, alive: true, bob: rng() * 6 });
  }
  // T1 — fuel must scale with distance: +1 pod per full 800px of width above
  // 3000, so wider remix/daily maps stay survivable (the transfusion drone is
  // the everywhere-backstop for the rest).
  const extraPods = Math.max(0, Math.floor((W - 3000) / 800));
  for (let i = 0; i < r.pods + extraPods; i++) {
    const x = pick(200);
    lvl.pods.push({ x, y: flatten(heights, x, 30), taken: false, ph: rng() * 7 });
  }
  // Glycon's lures: counterfeit fuel pods that drain the tank instead.
  // The tell — they all blink in perfect, mechanical unison.
  for (let i = 0; i < r.fakes; i++) {
    const x = pick(200);
    lvl.fakePods.push({ x, y: flatten(heights, x, 30), taken: false });
  }
  for (let i = 0; i < r.anomalies; i++) {
    lvl.anomalies.push({ x: 800 + rng() * (W - 1400), y: 500 + rng() * 350,
      r: 200 + rng() * 90, str: 80 + rng() * 40, spin: rng() * 6 });
  }
  // one hidden black box per campaign sector
  if (n < FINALE_IDX) {
    const x = pick(300);
    lvl.blackbox = { x, y: flatten(heights, x, 50), found: false, scanT: 0 };
  }
  // the secret lift: a pad of ground that rings hollow, down into the Hollows.
  // Owner steer: the whole Glycon layer (the Hollows, the shrines, the maker's
  // mark) stays sealed on a FIRST run — a first playthrough tells only the clean
  // wound/echo story. It opens once a run has been finished (veteran). This both
  // keeps the first read uncluttered and gives the game a second, deeper pass.
  if (r.lift) {
    // keep the pad's ground-flatten (and its RNG draw) unconditionally so the
    // authored campaign terrain is byte-identical whether or not the Hollows are
    // unlocked; only the usable lift itself is gated to a veteran return pass.
    const x = pick(320);
    const y = flatten(heights, x, 70);
    // Y5 — always record the pad position (even pre-veteran, when the usable
    // lift below is null) so drawLift can mark it on the surface on EVERY run:
    // subtle, findable-if-you-look, not a beacon.
    lvl.liftPad = { x, y };
    if (veteran) lvl.lift = { x, y, cave: LIFT_CAVE[n], holdT: 0, armed: true };
  }
  // the finale's beacon — the source of the Static
  if (n === FINALE_IDX) {
    const bx = W - 420;
    // flatten a WIDE ridge over her whole buried hull footprint (the fire-death
    // reveal draws a ~±200px MERCY-class hull; ±250 covers it with margin) so she
    // is genuinely buried — only the command tower breaks the surface — and the
    // reveal never shows hull poking out over open land. by is the surface level.
    const by = flatten(heights, bx, 250);
    lvl.beacon = { x: bx, y: by, hp: 3, silenceT: 0, resolved: false, groundY: by };
    // Bundle N1 — Glycon's third act: a second, identical MERCY. One difference
    // only: the real emblem pulses like a heart; the counterfeit's ticks in
    // perfect mechanical time, like the fake fuel. Now distrust the thing you've
    // trusted all game. Gated with the rest of the Glycon layer: a first
    // playthrough meets only the true beacon; the counterfeit MERCY waits for
    // the veteran return pass (see the lift gate above).
    // V12 — location must tell you NOTHING: instead of the real MERCY at her
    // usual home and the decoy parked mid-map, both ships take randomised,
    // reachable positions (well separated), and which side is real varies. The
    // only honest read is the beat. Everything downstream (bays, delivery,
    // epilogue) reads level.mx live, so moving her is safe.
    // V13 (owner steer) — deliberately Math.random, NOT the level's seeded
    // rng: campaign mode always regenerates the finale at the same seed
    // (runSeed 0), so rolling this with `rng` made which side is real
    // perfectly deterministic — always the same result on every campaign
    // veteran run (bug report: "fake mercy has always been on the left").
    // This roll isn't part of the terrain-generation contract (unlike
    // everything else `rng` drives here) and isn't checksummed by M1, so it
    // can safely vary run to run the same way the life-loss re-roll already does.
    if (veteran) rollMercyTwin(lvl, Math.random);
  }

  // V2 — scan-jeopardy fairness invariant: every scannable Scion must have a
  // landable spot in the scan-distance band (see scanSpotOK). Where the terrain
  // doesn't offer one, widen the Scion's own flat pad until it does —
  // deterministic, no RNG, so only the heightmap changes and only where needed
  // (a Scion in a clearing you can always back off from, never a rigged loss).
  // Run as a final pass over the settled terrain, iterated a few times so it
  // holds even where widening one pad nicks a neighbour's band.
  // Cap the widen at 122: Scions are placed ≥260px apart (pick() minDist), so a
  // ±122 pad can never overlap a neighbour's — which keeps this convergent (no
  // two pads fight across passes). ±122 still reaches past the band's ~110px
  // lower edge, so the pad itself always yields a valid touchdown.
  const scannableOid = o => o.role === "normal" || o.role === "saboteur" || o.role === "famous";
  const PAD_CAP = 122;
  // V14 — pulled into a function so it can run a SECOND time, after the
  // lift-flat reassert below: that block's own scanSpotOK-driven repair
  // (flattenTo for whichever Scion the lift's re-flatten disturbed) was found
  // to occasionally carve its replacement shelf on top of a THIRD, unrelated
  // Scion's already-fair band elsewhere in the level — a domino this pass
  // never re-checked for. Idempotent (a no-op once every Scion is already
  // fair), so calling it twice is free on every seed where nothing dominoes.
  function enforceScanFairness() {
    for (let pass = 0; pass < 3; pass++) {
      let changed = false;
      for (const o of lvl.oids) {
        if (!scannableOid(o)) continue;
        let hw = 80;
        while (hw < PAD_CAP && !scanSpotOK(heights, W, o.x)) {
          hw = Math.min(hw + 14, PAD_CAP); flatten(heights, o.x, hw); changed = true;
        }
      }
      if (!changed) break;
    }
    // Last resort for the rare crowded map where pick() had to place two
    // Scions closer than 260 and their pads still can't both hold: carve a
    // small landing shelf at the Scion's own height, on the side away from
    // its nearest scannable neighbour (so two such shelves point apart and
    // never collide).
    for (const o of lvl.oids) {
      if (!scannableOid(o) || scanSpotOK(heights, W, o.x)) continue;
      let nearest = Infinity, dir = 1;
      for (const q of lvl.oids)
        if (q !== o && scannableOid(q) && Math.abs(q.x - o.x) < nearest) {
          nearest = Math.abs(q.x - o.x); dir = q.x >= o.x ? -1 : 1;
        }
      const sx = clamp(o.x + dir * 140, 60, W - 60);
      flattenTo(heights, sx, 26, groundOf(heights, o.x));
    }
  }
  enforceScanFairness();
  // re-seat ground-anchored entities in case a widened pad moved the ground
  // under them (turrets are re-seated with the scenery pass below)
  for (const o of lvl.oids) o.y = groundOf(heights, o.x);
  for (const p of lvl.pods) p.y = groundOf(heights, p.x);
  for (const p of lvl.fakePods) p.y = groundOf(heights, p.x);
  if (lvl.blackbox) lvl.blackbox.y = groundOf(heights, lvl.blackbox.x);
  if (lvl.beacon) lvl.beacon.y = groundOf(heights, lvl.beacon.x);
  // the return-lift MUST end on a genuine FLAT — you land and hold on it, and its
  // surface marker has to sit on that flat, not halfway up a slope. A crowded
  // (esp. veteran) map can make pick() give up and drop the lift beside a Scion
  // whose V2 pad-widen then re-slopes the lift's ground; the old code only
  // re-SEATED the marker onto that slope. Re-assert the flat HERE, last of all,
  // so nothing downstream can tilt it. Seeds where the lift was already flat are
  // unchanged (±64 ⊂ the gen-time ±70 flat), so the M1 golden heightmap holds.
  if (lvl.liftPad) {
    const lx = lvl.liftPad.x;
    const gs = [-64, -32, 0, 32, 64].map(d => groundOf(heights, lx + d));
    // only re-flatten when the lift's ground is actually uneven (a later pass
    // tilted it). Leaving already-flat lifts untouched keeps the RNG-free
    // heightmap byte-identical on those seeds — so the M1 golden anchor holds.
    if (Math.max(...gs) - Math.min(...gs) > 4) {
      const ly = flatten(heights, lx, 64);
      lvl.liftPad.y = ly;
      if (lvl.lift) lvl.lift.y = ly;
      for (const o of lvl.oids) o.y = groundOf(heights, o.x);   // a Scion the re-flatten nudged
      // the lift flatten can overwrite a neighbouring Scion's V2 scan pad — re-carve
      // a shelf for any Scion that now lacks one, on the side AWAY from the lift so
      // it can't tilt the lift back (keeps the V2 fairness invariant intact).
      for (const o of lvl.oids) {
        if (!scannableOid(o) || scanSpotOK(heights, W, o.x)) continue;
        const dir = o.x >= lx ? 1 : -1;
        const sx = clamp(o.x + dir * 150, 60, W - 60);
        flattenTo(heights, sx, 30, groundOf(heights, o.x));
        o.y = groundOf(heights, o.x);
      }
    } else {
      lvl.liftPad.y = groundOf(heights, lx);
      if (lvl.lift) lvl.lift.y = groundOf(heights, lx);
    }
  }
  // V14 — the final word: re-verify the whole invariant once more now that
  // nothing else downstream can move the heightmap (scenery never calls
  // flatten). Catches the domino case above and any other interaction between
  // the passes above it, regardless of which one caused it.
  enforceScanFairness();
  // V14 — the rare residual: two scannable neighbours ~260px apart (pick()'s
  // own minimum) can nick each other's checked BAND even though their pads
  // never overlap (the band reaches out to ~195px, further than either pad's
  // ~122px cap) — an oscillation the 3-pass loop above can converge out of
  // for either one alone, but not for a mutual back-and-forth between two. No
  // more geometry: carve a shelf at the first still-untried distance inside
  // the actual checked band and CONFIRM it worked before moving on, instead
  // of predicting a position and hoping. Vanishingly rare to even reach this
  // point (measured 1/28000 generated sectors before this pass existed).
  for (const o of lvl.oids) {
    if (!scannableOid(o) || scanSpotOK(heights, W, o.x)) continue;
    const LO = 15 + SCAN_CREEP * SCION_SCAN_T + 7, HI = SCION_SCAN_RANGE - 5;
    for (const side of [-1, 1]) {
      for (let d = LO; d <= HI; d += 3) {
        const x = o.x + side * d;
        if (x < 70 || x > W - 70) continue;
        flattenTo(heights, x, 30, groundOf(heights, o.x));
        if (scanSpotOK(heights, W, o.x)) break;
      }
      if (scanSpotOK(heights, W, o.x)) break;
    }
  }

  // ---- scenery: trees, rocks, buildings & ruins, crashed ships ----
  const gy = x => {
    const i = clamp(Math.floor(x / STEP), 0, heights.length - 2);
    const t = clamp(x / STEP - i, 0, 1);
    return lerp(heights[i], heights[i + 1], t);
  };
  const slopeAt = x => (gy(x + 10) - gy(x - 10)) / 20;
  const scnSpot = (flatTries) => { // buildings/wrecks prefer flatter ground
    let x = 320 + rng() * (W - 640);
    for (let k = 0; k < (flatTries || 0); k++) {
      if (Math.abs(slopeAt(x)) < 0.14) break;
      x = 320 + rng() * (W - 640);
    }
    return x;
  };
  const deco = (type, flatTries, extra) => {
    const x = scnSpot(flatTries);
    lvl.scenery.push(Object.assign({ type, x, y: gy(x),
      tilt: Math.atan(slopeAt(x)) * 0.7, s: 0.8 + rng() * 0.7, ph: rng() * 7 }, extra));
  };
  const sc = r.scn;
  for (let i = 0; i < sc.trees; i++) deco("tree", 0);
  for (let i = 0; i < sc.rocks; i++) {
    const verts = [];
    const k = 5 + Math.floor(rng() * 3), rad = 7 + rng() * 9;
    for (let v = 0; v < k; v++) {
      const a = (v / k) * Math.PI * 2;
      const rr = rad * (0.65 + rng() * 0.5);
      verts.push([Math.cos(a) * rr, -rad * 0.6 + Math.sin(a) * rr * 0.62]);
    }
    deco("rock", 0, { verts });
  }
  const mkWindows = (w, h) => {
    const cols = Math.max(2, Math.floor(w / 14)), rows = Math.max(2, Math.floor(h / 16));
    const lit = [];
    for (let i = 0; i < cols * rows; i++) lit.push(rng() < 0.45);
    return { cols, rows, lit, flick: Math.floor(rng() * cols * rows) };
  };
  for (let i = 0; i < sc.bld; i++) {
    const w = 38 + rng() * 28, h = 58 + rng() * 66;
    deco("bld", 10, Object.assign({ w, h }, mkWindows(w, h)));
  }
  for (let i = 0; i < sc.ruin; i++) {
    const w = 40 + rng() * 30, h = 44 + rng() * 50;
    const jag = [];
    for (let j = 0; j <= 4; j++) jag.push(rng() * h * 0.45);
    deco("ruin", 6, Object.assign({ w, h, jag }, mkWindows(w, h * 0.6)));
  }
  for (let i = 0; i < sc.wreck; i++)
    deco(rng() < 0.5 ? "wreckM" : "wreckS", 6, { lean: (rng() - 0.5) * 0.7 });
  // T3 — biome ornamentation. Decorative-first (collision is T4); each type is
  // authored per-sector in RECIPE[].scn so a landscape reads as its own place.
  for (let i = 0; i < (sc.boulders || 0); i++) {   // VESALIUS — angular half-buried rubble
    const stack = [];
    const k = 1 + Math.floor(rng() * 3);   // 1–3 chunks: lone boulders through low cairns
    let dy = 0;
    for (let b = 0; b < k; b++) {
      const rr = Math.max(5, 13 + rng() * 8 - b * 2.2);
      // an irregular chunk, not a sphere — jittered vertices like the rocks
      const kv = 6 + Math.floor(rng() * 3), verts = [];
      for (let v = 0; v < kv; v++) {
        const a = (v / kv) * Math.PI * 2 + (rng() - 0.5) * 0.35;
        const vr = rr * (0.72 + rng() * 0.5);
        verts.push([Math.cos(a) * vr, Math.sin(a) * vr * 0.82]);
      }
      stack.push({ dx: (rng() - 0.5) * 6, dy, r: rr, verts });
      dy -= rr * 1.4;   // seat each chunk higher, less overlap than the old snowman
    }
    deco("boulder", 2, { stack });
  }
  for (let i = 0; i < (sc.reeds || 0); i++) {      // NIGHTINGALE — reed clusters
    const blades = [];
    const k = 4 + Math.floor(rng() * 4);
    for (let b = 0; b < k; b++)
      blades.push({ dx: (rng() - 0.5) * 18, len: 14 + rng() * 18,
        bend: (rng() - 0.5) * 7, ph: rng() * 7 });
    deco("reed", 1, { blades });
  }
  for (let i = 0; i < (sc.lanterns || 0); i++)     // NIGHTINGALE — ward-lanterns
    deco("lantern", 4, { pole: 22 + rng() * 14 });
  for (let i = 0; i < (sc.spires || 0); i++)       // CURIE — glowing ice spires
    deco("spire", 3, { sh: 42 + rng() * 46, sw: 7 + rng() * 8 });
  for (let i = 0; i < (sc.dunes || 0); i++)        // AVICENNA — banded dunes / salt pans
    deco("dune", 5, { dw: 64 + rng() * 74, bands: 3 + Math.floor(rng() * 3), pan: rng() < 0.5 });
  for (let i = 0; i < (sc.hedges || 0); i++)       // JENNER — hedgerows
    deco("hedge", 5, { hw: 46 + rng() * 52, bumps: 4 + Math.floor(rng() * 4) });
  // where Glycon seeds lures he also plants a lure-tree: a transmitter
  // disguised as flora, swaying in perfect mechanical time. In the
  // nullwave it is the only tree standing at all.
  if (r.fakes > 0) deco("tree", 0, { fake: true, s: 1 + rng() * 0.3 });
  // and somewhere, someone hid a real cache from the serpent: one rock
  // breathes faintly. Crack it open.
  if (r.fakes > 0) {
    const verts = [];
    for (let v = 0; v < 6; v++) {
      const a = (v / 6) * Math.PI * 2;
      verts.push([Math.cos(a) * 11, -7 + Math.sin(a) * 7]);
    }
    deco("rock", 0, { verts, hollow: true, s: 1.1 });
  }

  // Re-seat turrets on the FINAL heightmap. A turret pad is flattened early, but a
  // later nearby flatten (a fuel pod / black box / lift that pick() placed close on
  // a crowded map) can re-shape the ground under it and leave the dome below the
  // crust — owner report: a turret sunk under Jenner's terraces. gy() reads the
  // finished heights, so this puts every turret back exactly on the surface.
  for (const t of lvl.turrets) t.y = gy(t.x);

  stars = [];
  const srng = mulberry32(999 + n + runSeed);
  for (let i = 0; i < 220; i++)
    stars.push({ x: srng() * W, y: srng() * 900, s: srng() * 1.6 + 0.4, tw: srng() * 6 });
  return lvl;
}

/* ---------------- the Hollows: secret caves under the lifts ---------------- */
function roofAt(x, y) {
  // P·terrain — a chamber's ceiling is whichever span you are in, not a single
  // parallel array. Act One caves keep the exact one-argument path they shipped.
  if (level.spans) { const sp = spanAt(x, y); return sp ? sp.top : levelH(); }
  const h = level.roof;
  const i = clamp(Math.floor(x / STEP), 0, h.length - 2);
  const t = clamp(x / STEP - i, 0, 1);
  return lerp(h[i], h[i + 1], t);
}

function genCave(ci) {
  const W = 1800;
  const rng = mulberry32(5077 + ci * 131 + runSeed);
  const count = Math.floor(W / STEP) + 2;
  const octave = (wl, amp) => {
    const pts = [];
    for (let i = 0; i <= Math.ceil(W / wl) + 1; i++) pts.push((rng() * 2 - 1) * amp);
    return x => {
      const p = x / wl, i = Math.floor(p), t = p - i;
      return lerp(pts[i], pts[i + 1], (1 - Math.cos(t * Math.PI)) / 2);
    };
  };
  const f1 = octave(260, 90), f2 = octave(90, 34);
  const r1 = octave(300, 80), r2 = octave(70, 26);
  const heights = [], roof = [];
  for (let i = 0; i < count; i++) {
    const x = i * STEP;
    heights.push(clamp(1250 + f1(x) + f2(x), 1150, 1380));
    roof.push(clamp(930 + r1(x) + r2(x), 820, 1090));
  }
  for (let i = 0; i < count; i++) roof[i] = Math.min(roof[i], heights[i] - 175);

  const lvl = { n: levelIdx, W, heights, roof, oids: [], turrets: [], bullets: [], shots: [],
    drones: [], pods: [], fakePods: [], anomalies: [], scenery: [],
    blackbox: null, beacon: null, mx: -9999, my: -9999, mxo: 0, myo: 0,
    delivered: 0, lost: 0, contained: 0, total: 0, firedShots: 0,
    extraction: null, pulse: null, dark: true, isFinale: false, isCave: true,
    caveIdx: ci, contamKnown: false, fragmentsHere: [],
    lift: { x: 220, y: 0, cave: ci, holdT: 0, armed: false },
    shrine: null };

  lvl.lift.y = flatten(heights, lvl.lift.x, 60);
  const sx = W - 260;
  const sy = flatten(heights, sx, 80);
  if (!shrines.has(ci)) lvl.shrine = { x: sx, y: sy, found: false, scanT: 0 };

  for (let i = 0; i < 3; i++) {
    const x = 500 + rng() * (W - 900);
    lvl.pods.push({ x, y: flatten(heights, x, 30), taken: false, ph: rng() * 7 });
  }
  if (ci >= 1) lvl.drones.push({ x: W * 0.55, y: 1150, vx: 0, vy: 0, alive: true, bob: rng() * 6 });
  for (let i = 0; i < 5; i++) {
    const verts = [];
    const k = 5 + Math.floor(rng() * 3), rad = 6 + rng() * 8;
    for (let v = 0; v < k; v++) {
      const a = (v / k) * Math.PI * 2;
      verts.push([Math.cos(a) * rad * (0.65 + rng() * 0.5), -rad * 0.55 + Math.sin(a) * rad * 0.55]);
    }
    const x = 300 + rng() * (W - 600);
    const i0 = clamp(Math.floor(x / STEP), 0, heights.length - 2);
    lvl.scenery.push({ type: "rock", x, y: heights[i0], tilt: 0, s: 0.8 + rng() * 0.6, ph: rng() * 7, verts });
  }
  return lvl;
}

let surfaceCtx = null;   // where we came from, while inside a cave
function acctLevel() {   // sector accounting always lands on the surface level
  return level && level.isCave && surfaceCtx ? surfaceCtx.level : level;
}

function enterCave(L) {
  L.holdT = 0; L.armed = false;
  resupplyDrone = null;   // no signal follows you down — never leave one mid-flight in the rock
  ship.scuttleT = 0;
  surfaceCtx = { level, x: ship.x, y: ship.y };
  level = genCave(L.cave);
  ship.x = level.lift.x; ship.y = groundAt(level.lift.x) - SHIP_R;
  ship.vx = 0; ship.vy = 0; ship.ang = 0; ship.landed = true;
  camera.x = ship.x; camera.y = ship.y; camera.shake = 14;
  banner("SECRET LIFT — DESCENDING INTO THE HOLLOWS", "#b388ff");
  blip(220, 70, 0.9, "sawtooth", 0.16);
  staticTick();
  setCaveEcho(true);   // S3 — every sound now rings in the rock
  setBiomeBed(-1);     // T3 — the Hollows have no surface bed
}

function exitCave() {
  if (!surfaceCtx) return;
  level = surfaceCtx.level;
  ship.x = surfaceCtx.x;
  // Land ON the pad, not in it: surfaceCtx.y was captured mid-lift-transit,
  // after the descent animation had already sunk the ship ~40px into the
  // pad, so restoring it verbatim left the ship embedded below ground on
  // the way back up (it then "snapped" to the surface on the first thrust).
  // Recompute from the restored surface heightmap instead.
  ship.y = groundAt(ship.x) - SHIP_R;
  ship.vx = 0; ship.vy = 0; ship.ang = 0; ship.landed = true;
  if (level.lift) { level.lift.holdT = 0; level.lift.armed = false; }
  camera.x = ship.x; camera.y = ship.y; camera.shake = 10;
  surfaceCtx = null;
  banner("SURFACE — " + SECTOR_NAMES[levelIdx], "#00e5ff");
  blip(160, 520, 0.6, "sine", 0.12);
  setCaveEcho(false);   // S3 — back to the dry surface
  setBiomeBed(levelIdx);   // T3 — the sector's ambience returns
}

function maxVitals() { return upgrades.fabrica ? 125 : 100; }
function maxFuel() {                                                // Levi-Montalcini
  const base = upgrades.growth ? 120 : 100;
  return dailyMod("rationed") ? Math.round(base * 0.7) : base;
}
function scanRate() { return upgrades.pathology ? 1.5 : 1; }        // Virchow
function lampRadius() {
  // the lamp itself falters while the Static surges (Bundle I2)
  return (upgrades.lamp ? 400 : 230) * (staticSurge > 0 ? 0.92 : 1);
}

function spawnShip() {
  // V13 (owner steer) — with the finale twin, arriving right next to the real
  // MERCY would give the answer away by proximity alone before the split
  // reveal even means anything. Spawn exactly midway between the two ships
  // instead, so position carries no tell either way (see rollMercyTwin).
  const sx = level.fakeMercy ? (level.mx + level.fakeMercy.x) / 2 : level.mx;
  ship = {
    x: sx, y: level.my + 90, vx: 0, vy: 0, ang: 0,
    fuel: maxFuel(), vitals: maxVitals(), passengers: [], landed: false, dead: false,
    fireCd: 0, dockT: 0, redDockT: 0, beat: 0, escapeT: 0, breachDockT: 0,
    shield: false, parryT: 0, signalT: 0, scuttleT: 0,
    // eased 0..1 progress for the headlight beams (js/render.js drawShip):
    // beamGlow fades the beams in/out on dark-zone entry/exit instead of
    // popping instantly; lampGlow fades UP from "no lamp" to "Flo's LAMP"
    // proportions the moment the upgrade is picked up, rather than snapping.
    // lampGlow starts already-lit on a fresh spawn if the upgrade was earned
    // in an earlier sector — only the actual moment of acquiring it fades.
    beamGlow: 0, lampGlow: upgrades.lamp ? 1 : 0
  };
}

/* ---------------- state flow ---------------- */
function resetRun() {
  score = 0; lives = startLives(); runSaved = 0; runLost = 0; runFired = 0;
  firedAtSecret = false; firedAtCombat = false; scannedSecret = false;
  runFragments = 0; blackboxCount = 0; shrines = new Set();
  upgrades = {}; mercyBreach = null; mercyDamaged = false; endingType = null;
  clearCards = []; revealCard = null; trapCard = null; confirmCard = null; leftBehindNote = null; surfaceCtx = null;
  checkpoint = null; ratingAskMsg = null;   // X6 — don't leak a prior run's ask onto the next
  runSeed = 0; runMode = "campaign"; famousMap = null;
  // Z1 — campaign always plays at 1x, regardless of the last roll. gravTilt has
  // to be cleared here too: it was left set, and while a campaign run is saved by
  // rollGravity()'s runSeed === 0 early return, TRAINING never calls it at all
  // (startTraining builds its level directly instead of going through
  // toBriefing), so the trainee sector inherited whatever crosswind the last
  // REMIX/DAILY run rolled — teaching "hold THRUST and see it work" while an
  // unexplained sideways shove pushed the ship off course.
  gravScale = 1; gravTilt = 0;
  runRefuels = 0;   // U2 — the diminishing field-resupply allowance resets each run
  titleNudge = false;   // the post-completion rotation nudge is spent once a run starts
  rollDailyMods();
  clearRun();
}

let sectorT = 0;   // sector flight time — the daily STOPWATCH reads it
function toBriefing(n) {
  levelIdx = n;
  surfaceCtx = null;
  rollGravity(n);   // Z1 — re-rolled every sector, not just once per run
  level = genLevel(n);
  sectorT = 0;
  setCaveEcho(false);   // S3 — every sector starts on the dry surface
  setBiomeBed(n);       // T3 — the sector's own surface ambience
  spawnShip();
  camera = { x: ship.x, y: ship.y, shake: 0 };
  particles = []; texts = [];
  mercyBreach = null; mercyDamaged = false; pendingBreach = null;
  resupplyDrone = null; liftTransit = null;
  state = "brief"; stateT = 0; briefChars = 0;
  staticClock = 0; staticSurge = 0; staticGlitchT = 0;
  decoyOutcome = null;
  snapshotRun();
  updateDroneFreq();
}

