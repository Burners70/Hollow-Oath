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
    let line = "";
    for (const w of para.split(" ")) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}

/* ---------------- story data ---------------- */
const SECTOR_NAMES = ["ASCLEPION", "VESALIUS RIDGE", "NIGHTINGALE BASIN",
                      "SEMMELWEIS DEEP", "CURIE FIELDS", "AVICENNA SHOALS",
                      "JENNER TERRACES", "THE NULLWAVE"];
const FINALE_IDX = SECTOR_NAMES.length - 1;   // 7 — the secret finale
const NBOX = FINALE_IDX;                      // one hidden black box per campaign sector

const BRIEFS = [
  "MERCY to rescue flight.\nRoutine tasking: the convoy scatter left medical units stranded across Asclepion. Land near them, bring them home to the recovery bay.\nThe approach guide turns green when it's safe to set down — watch your ↓ descent and ↔ drift.\nEnd transmission.",
  "Captain — some stranded units on the ridge have stopped answering triage pings. Comms has a name for them now: Vectors. Carriers, not survivors.\nIf a rescue feels wrong — the wave wrong, the heartbeat missing — trust your instincts. The red quarantine bay is open. Do NOT bring contaminated units into the recovery bay.",
  "Dust occlusion across the basin — and night coming down fast. Your lamp is your lifeline, and theirs. Listen for them in the dark.\nAnd captain… the dark out here listens back.",
  "Supply lines are cut; the deep is rationed. Scavenge surface fuel pods where you find them.\nAnd captain — we found tampering in the recovery bay overnight. Watch your passengers. Watch all of them.\nProve a unit false — the salvage teams will take it from there. But prove it.",
  "Radiation cells distort gravity across the fields. Fly wide of the purple rings.\nOne more thing. The Static repeats every 41 seconds. We are close to a bearing — recover the black boxes where you find them.",
  "Captain — the surface scans are lying to us. Refuel points that drain tanks dry. Growths that aren't growths.\nSomebody is seeding counterfeit salvation across the shoals. Real pods flicker like fire; the fakes keep perfect time. Trust nothing that looks too convenient.\nAnd if you won't fire on a lie — land beside it and look at it long enough.",
  "Last leg before the nullwave. The counterfeiter has a mark now — ground crews found the same coiled serpent stamped on every lure and every tampered unit.\nArchive is still matching it. Whoever wears that mask has been rewriting rescue into ruin for a long time. Bring our people home anyway.",
  "Triangulation complete. The source of the Static is below the nullwave ridge.\nOne more thing. Two beacons answer as MERCY on approach. One of them is lying. Count the beats, captain.\nFleet orders: destroy on sight. The chief medical officer refused to sign. Her note is one line — primum non nocere.\nYour call, captain."
];

const FRAGMENTS = [
  "LOG 01 // The convoy scattered after the relay burst. We logged it as a solar flare. Nobody checked the waveform.",
  "LOG 02 // The burst wasn't natural. It repeats. Forty-one seconds. Always forty-one seconds.",
  "LOG 03 // Some stranded units stopped answering triage pings. They still walk. They still wave. But the rhythm is wrong.",
  "LOG 04 // Comms calls it the Static. It doesn't jam a signal. It rewrites the one who answers.",
  "LOG 05 // Quarantine protocol drafted: any unit with an irregular heartbeat goes to the red bay. No exceptions. Not even friends.",
  "LOG 06 // First black box decoded. The Static's waveform matches... us. An old MERCY-class distress call, degraded, looping.",
  "LOG 07 // It's a voice like ours. Every repeat is a copy of a copy. The rescued units corrupt because they answer honestly.",
  "LOG 08 // Triangulation at 60%. The echo has a source, somewhere dark beyond the last ridge, transmitting on our own frequency.",
  "LOG 09 // Fleet drafted destroy-on-sight orders. The CMO refused to sign. She wrote one line: primum non nocere.",
  "LOG 10 // If it can be silenced without being destroyed, we owe it that. It has only ever been repeating a call for help.",
  "LOG 11 // The lures aren't scavenger traps. They're placed. Someone wants rescues to fail — and wants it to look like bad luck.",
  "LOG 12 // Every counterfeit carries the same maker's mark: a coiled serpent wearing a human mask. The archive is afraid of the match it found.",
  "LOG 13 // Match confirmed. GLYCON — the puppet god of Alexander of Abonoteichus, Old Earth, second century. He wrapped a snake in linen and sold false plague cures while the plague spread. His amulets hung over doors where precautions should have been.",
  "LOG 14 // The Static is a wound. Glycon is the hand keeping it open — amplifying the echo, farming the fear, selling the cure that kills. Unmask him. Then answer the wound."
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
    body: "A shrine to a serpent with a human face.\n\nOld Earth archive match: GLYCON — the puppet god of Alexander of Abonoteichus, a second-century charlatan who sold fake plague cures while the plague spread. Hope as bait. Graves as yield.\n\nSomeone out here found his playbook. The Static is a wound; Glycon is the infection that keeps it open — counterfeit rescuers, counterfeit fuel, counterfeit hope.\n\nScratched beneath the idol, in the maker's own hand:\n\"An oath you never test is easy to keep.\"",
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
    story: "He begged surgeons to wash their hands and saved countless mothers — and was ignored for decades.",
    upgrade: "antisepsis", upgradeName: "ANTISEPSIS",
    upgradeDesc: "Land on a grounded unit and hold to read its vitals — catalogue a Vector, or confirm a heartbeat. A proven Vector can be left behind." },
  { name: "MARIE CURIE", era: "1867–1934",
    story: "Twice a Nobel laureate; she drove X-ray units to the front lines herself in the First World War.",
    upgrade: "radiosense", upgradeName: "RADIOSENSE",
    upgradeDesc: "A compass now points toward unrecovered black boxes." },
  { name: "IBN SINA · AVICENNA", era: "980–1037",
    story: "The Persian polymath whose Canon of Medicine taught physicians on three continents for six hundred years — observation, evidence, and honest doubt.",
    upgrade: "canon", upgradeName: "CANON OF TRUTH",
    upgradeDesc: "Counterfeits are unmasked — Glycon's lures and lure-trees are marked for what they are." },
  { name: "EDWARD JENNER", era: "1749–1823",
    story: "He noticed milkmaids who caught cowpox never took smallpox — and turned one careful observation into vaccination, the greatest life-saver medicine has known.",
    upgrade: "inoculation", upgradeName: "INOCULATION",
    upgradeDesc: "Your passengers are immunised — Vectors aboard can no longer kill them." },
  /* the wider pool (Bundle M4) — the campaign carries the canonical seven;
     REMIX and DAILY rotations draw 7 of everyone below as well */
  { name: "ELIZABETH BLACKWELL", era: "1821–1910",
    story: "Rejected by ten medical schools for being a woman, she graduated first in her class anyway — the first woman M.D. in America — and then opened the door for every one who followed.",
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
    story: "Barred from her university by fascist race laws, she built a laboratory in her bedroom and kept working — and discovered nerve growth factor, how living tissue is told to grow.",
    upgrade: "growth", upgradeName: "GROWTH FACTOR",
    upgradeDesc: "Fuel cells grow denser — tank capacity raised to 120." }
];

/* ---------------- world / level ---------------- */
const GRAV = 46, THRUST = 138, ROT = 3.7, SHIP_R = 11;
const WORLD_H = 1500, STEP = 16;
const CAPACITY = 6;

let level, ship, camera, particles, texts, stars;
let resupplyDrone = null;   // the graceful bail-out for a ship stranded at 0 fuel
let liftTransit = null;     // in-progress lift descent/ascent animation
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
let runMode = "campaign";              // "campaign" | "remix" | "daily"
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
let endingType = null;
let clearCards = [], revealCard = null;
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
let assist = true;
try { assist = localStorage.getItem("doids_assist") !== "0"; } catch (e) {}
// haptics is a web no-op (the facade below bridges to the native wrapper
// when Bundle E/F land) — the settings row and persisted flag live now.
let haptics = true;
try { haptics = localStorage.getItem("doids_hapt") !== "0"; } catch (e) {}
let colorblind = false;
try { colorblind = localStorage.getItem("doids_cb") === "1"; } catch (e) {}
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
/* Accessibility: a REDUCED FLASH toggle softens the Static's high-frequency
   strobing — window flicker, the ECG jitter and the HUD label glitch — for
   photosensitive players. Diagnostic meaning stays; only the amplitude drops. */
let reducedFlash = false;
try { reducedFlash = localStorage.getItem("doids_flash") === "1"; } catch (e) {}
/* a visible build stamp so stale Home-Screen caches / TestFlight builds are
   diagnosable at a glance (GAME_DESIGN §10 idea) */
const BUILD_TAG = "v1.0 · b2026-07";
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

/* Bundle E4 — on a native launch, fold the iCloud copy into local state:
   the larger hi-score, the union of the codex/log/shrine sets, veteran if
   either side is, and the cloud run snapshot only when this device has
   none. Fire-and-forget: the title reads all of these live every frame,
   so a merge that lands a beat late simply appears. */
async function syncFromCloud() {
  if (!cloud.native()) return;
  try {
    const [cHi, cCodex, cLogs, cShrines, cVet, cRun] = await Promise.all([
      cloud.get("doids_hi"), cloud.get("doids_codex"), cloud.get("doids_logs"),
      cloud.get("doids_shrines_seen"), cloud.get("doids_veteran"), cloud.get("doids_run")]);
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

function startRemix() {
  goFullscreen();
  if (window.hideA2HS) window.hideA2HS();
  resetRun();
  runMode = "remix";
  runSeed = 1 + Math.floor(Math.random() * 2147483646);
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
let introSeen = false;
try { introSeen = localStorage.getItem("doids_intro") === "1"; } catch (e) {}
function markIntroSeen() {
  introSeen = true;
  try { localStorage.setItem("doids_intro", "1"); } catch (e) {}
}
const ASSIST_CAPTURE = 0.22;
const ASSIST_RATE = 4.5;

function helpRect() {
  return { x: vw - saRight - 14 - 150, y: 12, w: 150, h: 34 };
}
function settingsRect() {
  const h = helpRect();
  return { x: h.x - 198, y: 12, w: 190, h: 34 };
}
function skipRect() {
  return { x: vw - 110 - saRight, y: 12, w: 96, h: 34 };
}
function codexRect() {
  return { x: 14 + saLeft, y: 12, w: 168, h: 34 };
}
function storyRect() {
  const h = helpRect();
  return { x: h.x, y: h.y + 42, w: 150, h: 34 };
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
function dailyRect() {
  const w = Math.min(200, vw * 0.4);
  return { x: veteran ? vw / 2 + 8 : vw / 2 - w / 2, y: vh * 0.87, w, h: 30 };
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

const HELP_CARD = {
  kicker: "FLIGHT MANUAL", title: "HOW TO FLY", subtitle: "",
  body: "Left buttons rotate. THRUST burns fuel. FIRE shoots. SHIELD (hold) raises a force field — it eats fuel, but stops bullets, drones, rough landings and cave ceilings.\n\nLand slow and upright on flat ground near a stranded Scion — it walks over and climbs aboard. The approach guide turns GREEN when touchdown is safe; watch ↓ descent and ↔ drift.\n\nFerry Scions to MERCY's cyan RECOVERY BAY to deliver, refuel and heal. The RED BAY is quarantine — you'll know when you need it.\n\nListen to what boards. Watch how they wave. Watch your own ECG. A full cabin steadies you, a little, between drop-offs.\n\nRescue the right healer and you learn to read a grounded unit's vitals: park on it and hold to confirm a heartbeat, or catalogue a counterfeit and leave it where it lies. Land a step away to rescue at speed.\n\n◈ The zone hides black boxes, log fragments and famous healers — and stranger things. Some ground rings hollow under your struts. Real fuel pods flicker like fire; counterfeits keep perfect time. A counterfeit can be opened by fire — or unmasked without a shot: land beside it and hold still long enough. Explore.\n\n🎮 Gamepads work: stick or d-pad steers, A thrusts, X fires, LB/B shields. Keyboard: arrows + space · X fire · C/⇧/↓ shield. TILT steering can be switched on in SETTINGS.",
  color: "#00e5ff"
};

function groundAt(x) {
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

/* per-sector recipe: each sector introduces one new element.
   scn = decorative scenery counts; fakes = Glycon's counterfeit fuel pods;
   lift marks the sectors whose ground hides a secret lift into the Hollows. */
/* T2/T3 — each sector carries its own biome: a terrain palette (grad/stroke/
   glow, plus a `night` darkness tint and `star` field tint) and its own
   ornamentation counts. The landscape echoes its healer, so the biome IS the
   narrative. Caves keep the Static's violet (CAVE_PAL in render.js). */
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
  // 3 · SEMMELWEIS DEEP — the scrubbed ward; cold antiseptic grey-green
  { oids: 7, turrets: 6, sabs: 2, drones: 1, pods: 3, fakes: 0, anomalies: 0, dark: false,
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

function genLevel(n) {
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
    contamKnown: false, fragmentsHere: [] };

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
  for (let i = 0; i < r.oids + wideBump; i++) {
    const x = pick(280);
    const y = flatten(heights, x, 80);
    lvl.oids.push(newOid(x, y, "normal"));
  }
  // one famous Scion per campaign sector (remix shuffles who waits where)
  if (n < FINALE_IDX && lvl.oids.length) {
    const f = lvl.oids[Math.floor(rng() * lvl.oids.length)];
    f.role = "famous"; f.famousId = famousIdFor(n);
  }
  // saboteurs are extra figures, indistinguishable at a distance
  const nSabs = r.sabs + (dailyMod("sleepers") && r.sabs ? 1 : 0);
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

  for (let i = 0; i < r.turrets + wideBump; i++) {
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
  // the secret lift: a pad of ground that rings hollow, down into the Hollows
  if (r.lift) {
    const x = pick(320);
    const y = flatten(heights, x, 70);
    lvl.lift = { x, y, cave: LIFT_CAVE[n], holdT: 0, armed: true };
  }
  // the finale's beacon — the source of the Static
  if (n === FINALE_IDX) {
    const bx = W - 420;
    const by = flatten(heights, bx, 120);
    lvl.beacon = { x: bx, y: by, hp: 3, silenceT: 0, resolved: false };
    // Bundle N1 — Glycon's third act: a second, identical MERCY parked
    // between spawn and the beacon. One difference only: the real emblem
    // pulses like a pulse; the counterfeit's blinks in perfect mechanical
    // unison with the fake fuel pods. Now distrust the thing you've
    // trusted all game.
    lvl.fakeMercy = { x: W * 0.45, y: 170, dead: false, dockT: 0, scanT: 0 };
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
  for (let i = 0; i < (sc.boulders || 0); i++) {   // VESALIUS — stacked boulders
    const stack = [];
    const k = 2 + Math.floor(rng() * 3);
    let dy = 0;
    for (let b = 0; b < k; b++) {
      const rr = Math.max(4, 10 + rng() * 7 - b * 1.6);
      stack.push({ dx: (rng() - 0.5) * 7, dy, r: rr });
      dy -= rr * 1.25;
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

  stars = [];
  const srng = mulberry32(999 + n + runSeed);
  for (let i = 0; i < 220; i++)
    stars.push({ x: srng() * W, y: srng() * 900, s: srng() * 1.6 + 0.4, tw: srng() * 6 });
  return lvl;
}

/* ---------------- the Hollows: secret caves under the lifts ---------------- */
function roofAt(x) {
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
  ship = {
    x: level.mx, y: level.my + 90, vx: 0, vy: 0, ang: 0,
    fuel: maxFuel(), vitals: maxVitals(), passengers: [], landed: false, dead: false,
    fireCd: 0, dockT: 0, redDockT: 0, beat: 0, escapeT: 0, breachDockT: 0,
    shield: false, signalT: 0
  };
}

/* ---------------- state flow ---------------- */
function resetRun() {
  score = 0; lives = startLives(); runSaved = 0; runLost = 0; runFired = 0;
  firedAtSecret = false; firedAtCombat = false; scannedSecret = false;
  runFragments = 0; blackboxCount = 0; shrines = new Set();
  upgrades = {}; mercyBreach = null; mercyDamaged = false; endingType = null;
  clearCards = []; revealCard = null; confirmCard = null; leftBehindNote = null; surfaceCtx = null;
  checkpoint = null;
  runSeed = 0; runMode = "campaign"; famousMap = null;
  rollDailyMods();
  clearRun();
}

let sectorT = 0;   // sector flight time — the daily STOPWATCH reads it
function toBriefing(n) {
  levelIdx = n;
  surfaceCtx = null;
  level = genLevel(n);
  sectorT = 0;
  setCaveEcho(false);   // S3 — every sector starts on the dry surface
  setBiomeBed(n);       // T3 — the sector's own surface ambience
  spawnShip();
  camera = { x: ship.x, y: ship.y, shake: 0 };
  particles = []; texts = [];
  mercyBreach = null; mercyDamaged = false;
  resupplyDrone = null; liftTransit = null;
  state = "brief"; stateT = 0; briefChars = 0;
  staticClock = 0; staticSurge = 0; staticGlitchT = 0;
  decoyOutcome = null;
  snapshotRun();
  updateDroneFreq();
}

