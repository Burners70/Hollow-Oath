"use strict";
/* ---------------- haptics facade (Bundle F1) ----------------
   On the web this is a no-op; inside the Capacitor wrapper (Bundle E) the
   same calls bridge to native impact haptics — the phone becomes the ECG.
   Every call gates on the HAPTICS setting. Patterns are arrays of
   {delay (ms), style: "light"|"medium"|"heavy"}. */
const haptic = (() => {
  const plugin = () => {
    const C = window.Capacitor;
    return (C && C.isNativePlatform && C.isNativePlatform() &&
            C.Plugins && C.Plugins.Haptics) || null;
  };
  const impact = style => {
    if (!haptics) return;
    const H = plugin();
    if (!H) return;
    try { H.impact({ style: String(style).toUpperCase() }); } catch (e) {}
  };
  return {
    light: () => impact("light"),
    medium: () => impact("medium"),
    heavy: () => impact("heavy"),
    pattern: steps => {
      if (!haptics || !plugin()) return;
      for (const st of steps) setTimeout(() => impact(st.style), st.delay);
    }
  };
})();

/* ---------------- iCloud save-sync facade (Bundle E4) ----------------
   Web build: no-op. Native: bridges to the local hollow-icloud-kv plugin
   (app/plugins/icloud-kv — NSUbiquitousKeyValueStore). Persistence writes
   mirror through cloud.set/remove; syncFromCloud() merges on launch. */
const cloud = (() => {
  const plugin = () => {
    const C = window.Capacitor;
    return (C && C.isNativePlatform && C.isNativePlatform() &&
            C.Plugins && C.Plugins.ICloudKV) || null;
  };
  const swallow = p => { if (p && p.catch) p.catch(() => {}); };
  return {
    native: () => !!plugin(),
    set: (key, value) => {
      const P = plugin(); if (!P) return;
      try { swallow(P.set({ key, value: String(value) })); } catch (e) {}
    },
    remove: key => {
      const P = plugin(); if (!P) return;
      try { swallow(P.remove({ key })); } catch (e) {}
    },
    get: async key => {
      const P = plugin(); if (!P) return null;
      try {
        const r = await P.get({ key });
        return r && r.value != null ? String(r.value) : null;
      } catch (e) { return null; }
    }
  };
})();

/* ---------------- Game Center facade (Bundle G4) ----------------
   Web build: records intent in a bounded trace (asserted by the smoke
   suite) and does nothing else. Native: bridges to the local
   hollow-game-connect plugin. Fail-silent everywhere — Game Center never
   blocks or interrupts play (G1). Board/achievement IDs must match the
   App Store Connect records (setup table in app/MAC_SETUP.md). */
const GC_BOARD_ALLTIME = "hollowoath.score.alltime";
const GC_BOARD_DAILY = "hollowoath.score.daily";
const GC_ACH = {
  oathKeeper: "hollowoath.oath_keeper",             // answered, runFired === 0
  hollowKeeper: "hollowoath.hollow_keeper",         // answered, fired only at secrets
  oneWhoAnswered: "hollowoath.the_one_who_answered",// answered, any fire
  sectorWarden: "hollowoath.sector_warden",         // fire ending
  glyconUnmasked: "hollowoath.glycon_unmasked",     // all 3 shrines in one run
  archivist: "hollowoath.archivist",                // all 14 log fragments in one run
  spotless: "hollowoath.spotless_rotation",         // campaign complete, no Scion lost
  noHarm: "hollowoath.first_do_no_harm",            // any sector cleared, 0 shots
  fullCodex: "hollowoath.the_full_codex"            // every famous mind, across runs
};
const gc = (() => {
  const plugin = () => {
    const C = window.Capacitor;
    return (C && C.isNativePlatform && C.isNativePlatform() &&
            C.Plugins && C.Plugins.GameConnect) || null;
  };
  const reports = [];
  const call = (method, args) => {
    reports.push(Object.assign({ method }, args));
    if (reports.length > 60) reports.shift();
    const P = plugin(); if (!P) return;
    try {
      const p = P[method](args);
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  };
  const done = new Set();   // achievements are one-way; report each once per session
  return {
    auth: () => call("authenticate", {}),
    score: (value, leaderboardId) =>
      call("submitScore", { value: Math.max(0, Math.round(value)), leaderboardId }),
    achieve: achievementId => {
      if (!achievementId || done.has(achievementId)) return;
      done.add(achievementId);
      call("reportAchievement", { achievementId });
    },
    reports
  };
})();
gc.auth();   // silent sign-in at launch; auth continues in the background (G1)

