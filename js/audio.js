"use strict";
/* ---------------- audio (tiny synth) ---------------- */
let AC = null, thrustNode = null, thrustGain = null, sfxGain = null, musicGain = null;
// S3 — the Hollows echo: a wet send off sfxGain so every one-shot rings in the
// rock while you're underground (dry on the surface, ramped up in caves)
let echoSend = null, echoDelay = null;
let sound = true, music = true;
try { sound = localStorage.getItem("doids_snd") !== "0"; } catch (e) {}
try { music = localStorage.getItem("doids_mus") !== "0"; } catch (e) {}
function initAudio() {
  if (AC) { if (AC.state === "suspended") AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    sfxGain = AC.createGain(); sfxGain.gain.value = sound ? 1 : 0; sfxGain.connect(AC.destination);
    musicGain = AC.createGain(); musicGain.gain.value = music ? 1 : 0; musicGain.connect(AC.destination);
    // S3 — a wet send tapped off sfxGain (post-gain, so the SOUND toggle still
    // silences it): delay 0.28s, regenerating at 0.35 through a 1200 Hz lowpass.
    // Wet returns straight to the destination so the send only taps the dry bus
    // once — no runaway loop — while every blip/boom/heartbeat still rings.
    echoSend = AC.createGain(); echoSend.gain.value = 0;   // dry on the surface
    echoDelay = AC.createDelay(1); echoDelay.delayTime.value = 0.28;
    const echoFb = AC.createGain(); echoFb.gain.value = 0.35;
    const echoLp = AC.createBiquadFilter(); echoLp.type = "lowpass"; echoLp.frequency.value = 1200;
    sfxGain.connect(echoSend); echoSend.connect(echoDelay);
    echoDelay.connect(echoLp); echoLp.connect(echoFb); echoFb.connect(echoDelay);
    echoLp.connect(AC.destination);
    const bufferSize = AC.sampleRate * 0.5;
    const buf = AC.createBuffer(1, bufferSize, AC.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    thrustNode = AC.createBufferSource();
    thrustNode.buffer = buf; thrustNode.loop = true;
    const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320;
    thrustGain = AC.createGain(); thrustGain.gain.value = 0;
    thrustNode.connect(lp); lp.connect(thrustGain); thrustGain.connect(sfxGain);
    thrustNode.start();
    startMusic();
    updateDroneFreq();
  } catch (e) { AC = null; }
}
// per-call jitter so repeats of the same one-shot don't sample identically
const rjit = (v, range) => v * (1 + (Math.random() * 2 - 1) * range);
function blip(freq0, freq1, dur, type, vol) {
  if (!AC) return;
  const f0 = rjit(freq0, 0.03), f1 = rjit(Math.max(freq1, 1), 0.03), d = rjit(dur, 0.05);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(f0, AC.currentTime);
  o.frequency.exponentialRampToValueAtTime(f1, AC.currentTime + d);
  g.gain.setValueAtTime(vol || 0.12, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d);
  o.connect(g); g.connect(sfxGain);
  o.start(); o.stop(AC.currentTime + d + 0.02);
  // quiet upper harmonic layer, independently jittered, for a touch of body
  const o2 = AC.createOscillator(), g2 = AC.createGain();
  o2.type = type || "square";
  o2.frequency.setValueAtTime(rjit(f0 * 2, 0.02), AC.currentTime);
  o2.frequency.exponentialRampToValueAtTime(rjit(f1 * 2, 0.02), AC.currentTime + d);
  g2.gain.setValueAtTime((vol || 0.12) * 0.18, AC.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d);
  o2.connect(g2); g2.connect(sfxGain);
  o2.start(); o2.stop(AC.currentTime + d + 0.02);
}
function boom() {
  if (!AC) return;
  const dur = rjit(0.6, 0.08), sz = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, sz, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / sz);
  const s = AC.createBufferSource(); s.buffer = buf;
  const g = AC.createGain(); g.gain.value = 0.35;
  const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = rjit(900, 0.15);
  s.connect(lp); lp.connect(g); g.connect(sfxGain); s.start();
  // a quiet sub-thump under the noise burst gives repeats a touch more weight
  const o = AC.createOscillator(), og = AC.createGain();
  o.type = "sine"; o.frequency.value = rjit(60, 0.1);
  og.gain.setValueAtTime(0.22, AC.currentTime);
  og.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur * 0.7);
  o.connect(og); og.connect(sfxGain);
  o.start(); o.stop(AC.currentTime + dur * 0.7 + 0.02);
  // S1 — a decaying rubble tail: a second, longer noise source under a lowpass
  // that sweeps down, so the blast settles into falling debris rather than popping
  const tsz = Math.floor(AC.sampleRate * 0.9);
  const tbuf = AC.createBuffer(1, tsz, AC.sampleRate);
  const td = tbuf.getChannelData(0);
  for (let i = 0; i < tsz; i++) td[i] = (Math.random() * 2 - 1) * (1 - i / tsz);
  const ts = AC.createBufferSource(); ts.buffer = tbuf;
  const tlp = AC.createBiquadFilter(); tlp.type = "lowpass";
  tlp.frequency.setValueAtTime(900, AC.currentTime);
  tlp.frequency.exponentialRampToValueAtTime(180, AC.currentTime + 0.9);
  const tg = AC.createGain(); tg.gain.value = 0.1;
  ts.connect(tlp); tlp.connect(tg); tg.connect(sfxGain); ts.start();
}
/* S1 — the shot. The old blip(880,…,"square") was pure 1982; this is a muffled
   energy-dart "thmp": a short bandpassed noise burst over a quiet sine sub-thump
   with a whisper of detuned saw for edge. Kept quiet (≤0.08 peak) — firing is
   malpractice, it should never feel like fun. */
function shotSfx() {
  if (!AC) return;
  const t = AC.currentTime;
  // bandpassed noise burst — the body of the "thmp"
  const dur = rjit(0.12, 0.06), sz = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, sz, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / sz);
  const s = AC.createBufferSource(); s.buffer = buf;
  const bp = AC.createBiquadFilter(); bp.type = "bandpass";
  bp.frequency.value = rjit(1800, 0.06); bp.Q.value = 3;
  const bg = AC.createGain(); bg.gain.value = 0.08;
  s.connect(bp); bp.connect(bg); bg.connect(sfxGain); s.start();
  // sine sub-thump 140→60 — weight under the dart, quieter than boom's
  const o = AC.createOscillator(), og = AC.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(rjit(140, 0.05), t);
  o.frequency.exponentialRampToValueAtTime(rjit(60, 0.05), t + dur);
  og.gain.setValueAtTime(0.06, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.02);
  o.connect(og); og.connect(sfxGain);
  o.start(t); o.stop(t + dur + 0.05);
  // a very low-gain detuned sawtooth blip for edge
  const e = AC.createOscillator(), eg = AC.createGain();
  e.type = "sawtooth"; e.frequency.value = rjit(320, 0.05);
  eg.gain.setValueAtTime(0.02, t);
  eg.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.7);
  e.connect(eg); eg.connect(sfxGain);
  e.start(t); e.stop(t + dur * 0.7 + 0.02);
}
/* S3 — surface ⇄ cave crossfade for the echo wet send. RECIPE-friendly:
   a biome can later pass its own target instead of the fixed 0.35. */
function setCaveEcho(on, wet) {
  if (!echoSend || !AC) return;
  echoSend.gain.setTargetAtTime(on ? (wet || 0.35) : 0, AC.currentTime, 0.4);
}
/* S3 — cave dressing, played through sfxGain so both ring in the echo bus */
function caveDrip() {
  if (!AC) return;
  const t = AC.currentTime;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(rjit(1200, 0.08), t);
  o.frequency.exponentialRampToValueAtTime(rjit(300, 0.08), t + 0.14);
  g.gain.setValueAtTime(0.04, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g); g.connect(sfxGain);
  o.start(t); o.stop(t + 0.2);
}
function caveRumble() {
  if (!AC) return;
  const dur = 0.9, sz = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, sz, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / sz);
  const s = AC.createBufferSource(); s.buffer = buf;
  const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 200;
  const g = AC.createGain(); g.gain.value = 0.05;
  s.connect(lp); lp.connect(g); g.connect(sfxGain); s.start();
}
function heartbeat(vol, noHaptic) { // lub-dub, played when a Scion comes aboard
  // F2: the phone beats too — medium lub, light dub, same timings as the audio
  // (suppressed when it's used purely as a menu cue)
  if (!noHaptic) haptic.pattern([{ delay: 0, style: "medium" }, { delay: 180, style: "light" }]);
  alarmDuckT = 0.45;   // S2 — a real beat always wins over the monitor alarm
  if (!AC) return;
  const V = vol || 1;
  const pulse = (t, f) => {
    const tj = Math.max(0, t + (Math.random() * 2 - 1) * 0.01); // ±10ms so beats don't lock-step
    const fj = rjit(f, 0.03);
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = "sine"; o.frequency.value = fj;
    g.gain.setValueAtTime(0.0001, AC.currentTime + tj);
    g.gain.exponentialRampToValueAtTime(0.4 * V, AC.currentTime + tj + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + tj + 0.16);
    o.connect(g); g.connect(sfxGain);
    o.start(AC.currentTime + tj); o.stop(AC.currentTime + tj + 0.2);
    // quiet overtone gives each beat a touch of body without blurring the lub-dub read
    const o2 = AC.createOscillator(), g2 = AC.createGain();
    o2.type = "sine"; o2.frequency.value = fj * 2;
    g2.gain.setValueAtTime(0.0001, AC.currentTime + tj);
    g2.gain.exponentialRampToValueAtTime(0.08 * V, AC.currentTime + tj + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + tj + 0.14);
    o2.connect(g2); g2.connect(sfxGain);
    o2.start(AC.currentTime + tj); o2.stop(AC.currentTime + tj + 0.18);
  };
  pulse(0, 150); pulse(0.18, 112);
}
function staticTick(vol) { // the Static — a dry burst where a heartbeat should be
  if (!AC) return;
  const dur = rjit(0.12, 0.15), sz = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, sz, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / sz);
  const s = AC.createBufferSource(); s.buffer = buf;
  const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = rjit(900, 0.15); bp.Q.value = 2;
  const g = AC.createGain(); g.gain.value = 0.08 * (vol || 1);
  s.connect(bp); bp.connect(g); g.connect(sfxGain); s.start();
}
function dullThud() { // what boards when there is no heartbeat
  haptic.heavy();   // F2: one heavy impact. No second beat. THAT is the tell.
  alarmDuckT = 0.45;   // S2 — the missing-beat tell must land in the clear
  if (!AC) return;
  const f = rjit(90, 0.04), d = rjit(0.3, 0.08);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = "sine"; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.5, AC.currentTime + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d);
  o.connect(g); g.connect(sfxGain);
  o.start(); o.stop(AC.currentTime + d + 0.05);
}
/* S2 — the cardiac monitor beep. A short, dry blip whose PITCH lifts a little
   and whose level grows as vitals fall; the RATE is driven by the caller, so
   it audibly quickens the closer you are to death. Routed through sfxGain so it
   reads as a diagnostic instrument alongside the ECG, not part of the score. */
function vitalsBeep(urgency) { // urgency 0..1 (0 = healthy-ish, 1 = near death)
  if (!AC) return;
  const t = AC.currentTime;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = "sine"; o.frequency.value = 620 + 180 * urgency;
  const vol = 0.05 + 0.07 * urgency;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  o.connect(g); g.connect(sfxGain);
  o.start(t); o.stop(t + 0.14);
}
function sabHiss() { // S7 — sabotage: a short caustic hiss (noise, highpassed)
  if (!AC) return;
  const dur = 0.3, sz = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, sz, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / sz);
  const s = AC.createBufferSource(); s.buffer = buf;
  const hp = AC.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = rjit(2600, 0.1);
  const g = AC.createGain(); g.gain.value = 0.11;
  s.connect(hp); hp.connect(g); g.connect(sfxGain); s.start();
}
function hydraulic(descending) { // the lift — a filtered hiss under a pitch sweep
  if (!AC) return;
  const dur = 0.5, sz = AC.sampleRate * dur;
  const buf = AC.createBuffer(1, sz, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / sz) * 0.6;
  const s = AC.createBufferSource(); s.buffer = buf;
  const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = rjit(500, 0.12);
  const g = AC.createGain(); g.gain.value = 0.18;
  s.connect(lp); lp.connect(g); g.connect(sfxGain); s.start();
  blip(descending ? 260 : 90, descending ? 70 : 260, 0.55, "sawtooth", 0.1);
}

/* ---------------- generative ambient score ---------------- */
const PENTATONIC = [220.00, 261.63, 293.66, 329.63, 392.00];
let droneOsc1 = null, droneOsc2 = null, droneLfo = null;
let musicNoteT = 0, musicNoteNext = 9 + Math.random() * 6, musicArrhythmiaFlip = false;
// S2 — the score becomes your monitor: a far-away alarm layer below 35% vitals,
// and a level exposed for tests that rises as vitals fall.
let alarmOsc = null, alarmTrem = null, alarmGain = null, alarmDuckT = 0;
let vitalsAudioLevel = 0, vitalsBeepT = 0;
function startMusic() {
  if (!AC || !musicGain) return;
  droneOsc1 = AC.createOscillator(); droneOsc1.type = "sine"; droneOsc1.frequency.value = 55;
  droneOsc2 = AC.createOscillator(); droneOsc2.type = "triangle"; droneOsc2.frequency.value = 55 * 1.01;
  const droneFilter = AC.createBiquadFilter(); droneFilter.type = "lowpass"; droneFilter.frequency.value = 300;
  const droneGain = AC.createGain(); droneGain.gain.value = 0.06;
  droneLfo = AC.createOscillator(); droneLfo.frequency.value = 0.05;
  const lfoGain = AC.createGain(); lfoGain.gain.value = 150;
  droneLfo.connect(lfoGain); lfoGain.connect(droneFilter.frequency);
  droneOsc1.connect(droneFilter); droneOsc2.connect(droneFilter);
  droneFilter.connect(droneGain); droneGain.connect(musicGain);
  droneOsc1.start(); droneOsc2.start(); droneLfo.start();
}
/* S2 — the monitor alarm: a 440 Hz sine amplitude-modulated at 6 Hz, created
   lazily the first time vitals fall far enough to need it, then left running
   with its overall level driven to zero when not wanted. */
function startAlarm() {
  if (!AC || !musicGain || alarmOsc) return;
  alarmOsc = AC.createOscillator(); alarmOsc.type = "sine"; alarmOsc.frequency.value = 440;
  const tremNode = AC.createGain(); tremNode.gain.value = 0.5;   // 6 Hz tremolo, 0..1
  alarmTrem = AC.createOscillator(); alarmTrem.type = "sine"; alarmTrem.frequency.value = 6;
  const tremDepth = AC.createGain(); tremDepth.gain.value = 0.5;
  alarmTrem.connect(tremDepth); tremDepth.connect(tremNode.gain);
  alarmGain = AC.createGain(); alarmGain.gain.value = 0;
  alarmOsc.connect(tremNode); tremNode.connect(alarmGain); alarmGain.connect(musicGain);
  alarmOsc.start(); alarmTrem.start();
}
/* S2 — driven every frame from update(). Sparse motif scaling lives in
   updateMusic; here we ease the drone's breathing to a flutter as vitals fall
   and fade the monitor alarm in below 35%, ducking it whenever a heartbeat or
   dull-thud tell plays so the diagnostic sounds always stay on top. */
function updateVitalsAudio(dt) {
  if (!AC) return;
  if (alarmDuckT > 0) alarmDuckT = Math.max(0, alarmDuckT - dt);
  const live = state === "play" && typeof ship !== "undefined" && ship && !ship.dead;
  const v = live ? clamp(ship.vitals / maxVitals(), 0, 1) : 1;
  vitalsAudioLevel = live ? 1 - v : 0;
  if (droneLfo) droneLfo.frequency.value = 0.05 + (0.22 - 0.05) * (1 - v);
  // the cardiac monitor: below ~55% vitals a beep starts, and its RATE quickens
  // as vitals fall — the "more frantic the closer to death" cue. Skips a beat
  // while a real heartbeat/dull-thud tell is playing so those stay on top.
  if (live && v < 0.55) {
    const urgency = clamp(1 - v / 0.55, 0, 1);
    const interval = 1.5 - 1.15 * urgency;   // ~1.5 s at 55% → ~0.35 s near death
    vitalsBeepT += dt;
    if (vitalsBeepT >= interval) {
      vitalsBeepT = 0;
      if (alarmDuckT <= 0) vitalsBeep(urgency);
    }
  } else vitalsBeepT = 0;
  const wantAlarm = (live && v < 0.35) ? 0.03 * (1 - v / 0.35) : 0;
  if (wantAlarm > 0) startAlarm();
  if (alarmGain) {
    const target = (music && alarmDuckT <= 0) ? wantAlarm : 0;
    alarmGain.gain.value += (target - alarmGain.gain.value) * Math.min(1, dt * 6);
  }
}
function updateDroneFreq() {
  if (!droneOsc1) return;
  const base = (level && level.isFinale) ? 27.5 : 55;
  droneOsc1.frequency.value = base;
  droneOsc2.frequency.value = base * 1.01;
}
function playMotifNote() {
  if (!AC || !musicGain) return;
  const finale = level && level.isFinale;
  const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)] * (finale ? 0.5 : 1);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = "sine"; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.05, AC.currentTime + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + 2.2);
  o.connect(g); g.connect(musicGain);
  o.start(); o.stop(AC.currentTime + 2.3);
}
/* the ambient motif ducks under briefings/cards, and — the same diagnostic
   language as the ECG and the haptic tell — goes arrhythmic on its own
   timing while a contaminant is aboard */
function updateMusic(dt) {
  if (!AC || !musicGain) return;
  const ducked = state === "brief" || state === "reveal" || state === "clear" ||
    state === "ending" || state === "epilogue" || state === "help" || state === "codex" ||
    state === "pause" || state === "settings" || state === "confirm";
  const target = music ? (ducked ? 0.4 : 1) : 0;
  musicGain.gain.value += (target - musicGain.gain.value) * Math.min(1, dt);
  musicNoteT += dt;
  if (musicNoteT >= musicNoteNext) {
    musicNoteT = 0;
    playMotifNote();
    const finale = level && level.isFinale;
    let base = (finale ? 18 : 9) + Math.random() * (finale ? 12 : 6);
    // S2 — the motif thins out when you're healthy and crowds in when you're
    // hurt. A common factor, so the arrhythmia's 0.5/1.7 ratio stays audibly
    // irregular rather than just uniformly faster.
    if (state === "play" && typeof ship !== "undefined" && ship && !ship.dead)
      base *= 0.45 + 0.55 * clamp(ship.vitals / maxVitals(), 0, 1);
    if (state === "play" && (contaminantAboard() || decoySnared())) {
      musicArrhythmiaFlip = !musicArrhythmiaFlip;
      base *= musicArrhythmiaFlip ? 0.5 : 1.7;
    }
    musicNoteNext = base;
  }
}

