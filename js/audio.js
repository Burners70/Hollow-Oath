"use strict";
/* ---------------- audio (tiny synth) ---------------- */
let AC = null, thrustNode = null, thrustGain = null, sfxGain = null, musicGain = null;
let sound = true, music = true;
try { sound = localStorage.getItem("doids_snd") !== "0"; } catch (e) {}
try { music = localStorage.getItem("doids_mus") !== "0"; } catch (e) {}
function initAudio() {
  if (AC) { if (AC.state === "suspended") AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    sfxGain = AC.createGain(); sfxGain.gain.value = sound ? 1 : 0; sfxGain.connect(AC.destination);
    musicGain = AC.createGain(); musicGain.gain.value = music ? 1 : 0; musicGain.connect(AC.destination);
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
}
function heartbeat(vol, noHaptic) { // lub-dub, played when a Scion comes aboard
  // F2: the phone beats too — medium lub, light dub, same timings as the audio
  // (suppressed when it's used purely as a menu cue)
  if (!noHaptic) haptic.pattern([{ delay: 0, style: "medium" }, { delay: 180, style: "light" }]);
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
let droneOsc1 = null, droneOsc2 = null;
let musicNoteT = 0, musicNoteNext = 9 + Math.random() * 6, musicArrhythmiaFlip = false;
function startMusic() {
  if (!AC || !musicGain) return;
  droneOsc1 = AC.createOscillator(); droneOsc1.type = "sine"; droneOsc1.frequency.value = 55;
  droneOsc2 = AC.createOscillator(); droneOsc2.type = "triangle"; droneOsc2.frequency.value = 55 * 1.01;
  const droneFilter = AC.createBiquadFilter(); droneFilter.type = "lowpass"; droneFilter.frequency.value = 300;
  const droneGain = AC.createGain(); droneGain.gain.value = 0.06;
  const lfo = AC.createOscillator(); lfo.frequency.value = 0.05;
  const lfoGain = AC.createGain(); lfoGain.gain.value = 150;
  lfo.connect(lfoGain); lfoGain.connect(droneFilter.frequency);
  droneOsc1.connect(droneFilter); droneOsc2.connect(droneFilter);
  droneFilter.connect(droneGain); droneGain.connect(musicGain);
  droneOsc1.start(); droneOsc2.start(); lfo.start();
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
    state === "pause" || state === "settings";
  const target = music ? (ducked ? 0.4 : 1) : 0;
  musicGain.gain.value += (target - musicGain.gain.value) * Math.min(1, dt);
  musicNoteT += dt;
  if (musicNoteT >= musicNoteNext) {
    musicNoteT = 0;
    playMotifNote();
    const finale = level && level.isFinale;
    let base = (finale ? 18 : 9) + Math.random() * (finale ? 12 : 6);
    if (state === "play" && (contaminantAboard() || decoySnared())) {
      musicArrhythmiaFlip = !musicArrhythmiaFlip;
      base *= musicArrhythmiaFlip ? 0.5 : 1.7;
    }
    musicNoteNext = base;
  }
}

