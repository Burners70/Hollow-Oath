"use strict";
/* ================= render ================= */

/* Bundle D2/D3 — perf: ctx.shadowBlur is extremely expensive per-draw-call;
   it may only appear on singletons drawn once per frame (ship, mothership,
   title text), never inside a per-entity or per-particle loop. Two cheap
   substitutes stand in for it:
   - glowSprite/drawGlow: a cached pre-rendered radial-gradient blob,
     drawImage'd under a point/icon instead of blurring it live.
   - glowStroke: a 2-pass stroke (soft wide + crisp normal) for per-entity
     line art (Scions, turrets, drones, lure-trees). */
const glowSpriteCache = new Map();
function glowSprite(color, r) {
  const rr = Math.max(2, Math.round(r));
  const key = color + "|" + rr;
  let c = glowSpriteCache.get(key);
  if (c) return c;
  const size = rr * 2;
  c = document.createElement("canvas");
  c.width = c.height = size;
  const gctx = c.getContext("2d");
  const g = gctx.createRadialGradient(rr, rr, 0, rr, rr, rr);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  gctx.fillStyle = g;
  gctx.fillRect(0, 0, size, size);
  glowSpriteCache.set(key, c);
  return c;
}
function drawGlow(x, y, r, color, alpha) {
  const sp = glowSprite(color, r);
  const rr = sp.width / 2;
  if (alpha !== undefined) { ctx.save(); ctx.globalAlpha *= alpha; }
  ctx.drawImage(sp, x - rr, y - rr);
  if (alpha !== undefined) ctx.restore();
}
/* Call after building a path (beginPath/moveTo/lineTo…) with no ctx.stroke()
   of your own yet — leaves strokeStyle/lineWidth set to the crisp values so
   a caller can keep stroking or filling the same path afterward. */
function glowStroke(color, lineWidth) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha *= 0.25;
  ctx.lineWidth = lineWidth + 3;
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function zoomLevel() {
  return clamp(Math.min((vw - saLeft) / 900, vh / 640), 0.55, 1);
}

function render() {
  const now = performance.now() / 1000;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, vh);
  bg.addColorStop(0, "#05060f"); bg.addColorStop(0.7, "#0a0d22"); bg.addColorStop(1, "#101433");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, vw, vh);

  if (vh > vw) { drawPortraitWarning(now); return; }
  if (state === "brief") { drawBrief(now); return; }
  if (state === "intro") { drawIntroScreen(now); return; }

  if (level) drawWorld(now);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (state === "play" || state === "dead" || state === "reveal" || state === "clear" ||
      state === "pause" || state === "confirm") drawHUD(now);

  if (state === "title") drawTitle(now);
  if (state === "help") drawCardPanel(HELP_CARD, now);
  if (state === "legend") drawHudGuide(now);
  if (state === "codex") drawCodex(now);
  if (state === "reveal" && revealCard) drawCardPanel(revealCard, now);
  if (state === "clear") drawClear(now);
  if (state === "pause") drawPause(now);
  if (state === "confirm") drawConfirm(now);
  if (state === "settings") drawSettings(now);
  if (state === "epilogue") drawEpilogue(now);
  if (state === "ending") drawEnding(now);
  if (state === "gameover") drawGameOver(now);
  if (state === "win") drawWin();

  if (resupplyDrone && (state === "play" || state === "dead")) drawDroneMarker(now);

  if (bannerMsg && (state === "play" || state === "dead")) {
    ctx.textAlign = "center";
    ctx.font = "800 22px 'Helvetica Neue', Arial, sans-serif";
    ctx.shadowColor = bannerMsg.color; ctx.shadowBlur = 18;
    ctx.fillStyle = bannerMsg.color;
    ctx.globalAlpha = clamp(bannerMsg.t, 0, 1);
    bannerMsg.str.split("\n").forEach((l, i) => ctx.fillText(l, vw / 2, vh * 0.26 + i * 28));
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }

  if (liftTransit && liftTransit.fade > 0) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "rgba(3,4,10," + liftTransit.fade.toFixed(2) + ")";
    ctx.fillRect(0, 0, vw, vh);
    // the held beat in the dark: where you're going, and the ride itself
    if (liftTransit.fade > 0.9) {
      const down = liftTransit.dir === "down";
      ctx.textAlign = "center";
      ctx.font = "700 13px Menlo, monospace";
      ctx.fillStyle = "rgba(179,136,255,.85)";
      ctx.shadowColor = "#b388ff"; ctx.shadowBlur = 12;
      ctx.fillText(down ? "▼ DESCENDING — THE HOLLOWS"
                        : "▲ ASCENDING — " + SECTOR_NAMES[levelIdx], vw / 2, vh / 2 - 34);
      ctx.strokeStyle = "rgba(179,136,255,.8)"; ctx.lineWidth = 2; ctx.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        const ph = (now * 0.8 + k / 3) % 1;
        const yy = down ? vh / 2 - 6 + ph * 46 : vh / 2 + 40 - ph * 46;
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        ctx.beginPath();
        if (down) { ctx.moveTo(vw / 2 - 10, yy); ctx.lineTo(vw / 2, yy + 8); ctx.lineTo(vw / 2 + 10, yy); }
        else { ctx.moveTo(vw / 2 - 10, yy + 8); ctx.lineTo(vw / 2, yy); ctx.lineTo(vw / 2 + 10, yy + 8); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
  }
}

function worldTransform() {
  const z = zoomLevel();
  // the visible viewport starts right of the camera lozenge
  const cw = (vw - saLeft) / z, ch = vh / z;
  let cx = clamp(camera.x - cw / 2, 0, Math.max(0, level.W - cw));
  let cy = clamp(camera.y - ch / 2, -100, WORLD_H - ch);
  if (camera.shake > 0) {
    cx += (Math.random() - 0.5) * camera.shake;
    cy += (Math.random() - 0.5) * camera.shake;
  }
  return { z, cx, cy };
}

/* Bundle D4 — terrain and cave-roof geometry is static per level; instead of
   retracing the full heightmap path (with its shadowBlur stroke) every
   frame, render it once per 512px-wide chunk into an offscreen canvas and
   drawImage the chunk back every frame after. Chunks are built lazily as
   the camera reaches them and kept in a small per-level LRU, so a level is
   never rendered at full width/resolution in one shot. */
const TILE_W = 512, TILE_CACHE_CAP = 12;

function tileTouch(map, key, tile) {
  if (map.has(key)) map.delete(key);
  map.set(key, tile);
  if (map.size > TILE_CACHE_CAP) map.delete(map.keys().next().value);
  return tile;
}

/* closeAt: "bottom" for terrain (solid ground below the surface line) or
   "top" for a cave roof (solid rock above the ceiling line). */
function buildHeightTile(x0, x1, arr, padAbove, padBelow, closeAt, gradFrom, gradTo, gradStops, stroke, glow) {
  const ov = STEP * 2;
  const sx0 = Math.max(0, x0 - ov), sx1 = Math.min((arr.length - 1) * STEP, x1 + ov);
  const i0 = Math.max(0, Math.floor(sx0 / STEP)), i1 = Math.min(arr.length - 1, Math.ceil(sx1 / STEP));
  let lo = Infinity, hi = -Infinity;
  for (let i = i0; i <= i1; i++) { const v = arr[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
  const top = lo - padAbove;
  // Terrain (closeAt "bottom") fills to the world floor, not to a fixed pad below
  // the LOCAL surface: a tile of high ground (a plateau, or the raised map edges)
  // otherwise stops its fill above the screen bottom and the sky shows THROUGH the
  // ground at the bottom of the view. +30 puts the closing edge just past the
  // deepest the camera can ever show (cy + ch ≤ WORLD_H). Cave roofs ("top") keep
  // their local band — their gap would be at the top, not the bottom.
  const bottom = closeAt === "bottom" ? WORLD_H + 30 : hi + padBelow;
  const closeY = closeAt === "bottom" ? bottom : top - 20;
  const sc = dpr;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil((x1 - x0) * sc));
  c.height = Math.max(1, Math.ceil((bottom - top) * sc));
  const tctx = c.getContext("2d");
  tctx.setTransform(sc, 0, 0, sc, -x0 * sc, -top * sc);
  tctx.beginPath();
  tctx.moveTo(sx0, closeY);
  for (let i = i0; i <= i1; i++) tctx.lineTo(i * STEP, arr[i]);
  tctx.lineTo(sx1, closeY);
  tctx.closePath();
  const grad = tctx.createLinearGradient(0, gradFrom, 0, gradTo);
  grad.addColorStop(0, gradStops[0]); grad.addColorStop(1, gradStops[1]);
  tctx.fillStyle = grad; tctx.fill();
  tctx.shadowColor = glow || "#7c4dff"; tctx.shadowBlur = 12;
  tctx.strokeStyle = stroke || "#b388ff"; tctx.lineWidth = 2; tctx.stroke();
  return { canvas: c, x0, y0: top, w: x1 - x0, h: bottom - top };
}

function getTiles(lvl, cacheKey, arr, xLo, xHi, padAbove, padBelow, closeAt, gradFrom, gradTo, gradStops, stroke, glow) {
  if (!lvl[cacheKey]) lvl[cacheKey] = new Map();
  const map = lvl[cacheKey];
  const t0 = Math.max(0, Math.floor(xLo / TILE_W)), t1 = Math.floor(clamp(xHi, 0, lvl.W) / TILE_W);
  const out = [];
  for (let ti = t0; ti <= t1; ti++) {
    const x0 = ti * TILE_W, x1 = Math.min(x0 + TILE_W, lvl.W);
    let tile = map.get(ti);
    if (!tile) tile = buildHeightTile(x0, x1, arr, padAbove, padBelow, closeAt, gradFrom, gradTo, gradStops, stroke, glow);
    out.push(tileTouch(map, ti, tile));
  }
  return out;
}

/* T2 — the Hollows keep the Static's violet regardless of which sector's lift
   opened them. Surface biomes come from RECIPE[n].pal. */
const CAVE_PAL = { grad: ["#1b1040", "#0c0820"], stroke: "#b388ff", glow: "#7c4dff",
                   night: [2, 3, 10], star: [200, 220, 255] };
function biomePal() {
  return level.isCave ? CAVE_PAL : ((RECIPE[level.n] && RECIPE[level.n].pal) || CAVE_PAL);
}

/* the zone's containment field — the hard edges updatePlay clamps ship.x/y
   to (see the `clamp(s.x, 40, level.W - 40)` / `s.y < 20` checks) were
   previously invisible walls. Render them as a field that brightens as the
   ship nears it, framed as the interdicted zone's own automated defences. */
const BOUND_X = 40, BOUND_Y = 20, BOUND_GLOW = "#4fd6ff";
function drawBoundaryField(now) {
  const s = ship;
  const pulse = 0.7 + 0.3 * Math.sin(now * 2);
  ctx.setLineDash([4, 10]);
  for (const wx of [BOUND_X, level.W - BOUND_X]) {
    const a = clamp(1 - Math.abs(s.x - wx) / 380, 0.06, 0.6) * pulse;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.moveTo(wx, -250); ctx.lineTo(wx, WORLD_H + 50);
    glowStroke(BOUND_GLOW, 2);
    ctx.restore();
  }
  const ca = clamp(1 - Math.abs((s.y - SHIP_R) - BOUND_Y) / 260, 0.04, 0.45) * pulse;
  ctx.save();
  ctx.globalAlpha = ca;
  ctx.setLineDash([10, 14]);
  ctx.beginPath();
  ctx.moveTo(0, BOUND_Y); ctx.lineTo(level.W, BOUND_Y);
  glowStroke(BOUND_GLOW, 2);
  ctx.restore();
  ctx.setLineDash([]);
}

function drawWorld(now) {
  const { z, cx, cy } = worldTransform();
  ctx.setTransform(dpr * z, 0, 0, dpr * z, (saLeft - cx * z) * dpr, -cy * dpr * z);
  const viewW = (vw - saLeft) / z;

  const pal = biomePal();
  if (!level.isCave) {
    ctx.save();
    ctx.translate(cx * 0.35, cy * 0.35);
    const sr = pal.star;   // T2 — per-biome starfield tint
    for (const st of stars) {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(now * 0.8 + st.tw));
      ctx.fillStyle = "rgba(" + sr[0] + "," + sr[1] + "," + sr[2] + "," + a.toFixed(2) + ")";
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }
    ctx.restore();
  }

  // terrain — cached per 512px chunk (Bundle D4), not retraced every frame;
  // T2 threads the sector's biome palette (grad/stroke/glow) through the cache
  for (const tile of getTiles(level, "_terrainTiles", level.heights, cx, cx + viewW,
      40, 220, "bottom", 700, WORLD_H, pal.grad, pal.stroke, pal.glow))
    ctx.drawImage(tile.canvas, tile.x0, tile.y0, tile.w, tile.h);

  // cave roof, hanging overhead — same tile cache; always the Hollows' violet
  if (level.roof) {
    for (const tile of getTiles(level, "_roofTiles", level.roof, cx, cx + viewW,
        350, 40, "top", 500, 1100, ["#0c0820", "#1b1040"], CAVE_PAL.stroke, CAVE_PAL.glow))
      ctx.drawImage(tile.canvas, tile.x0, tile.y0, tile.w, tile.h);
  }

  drawBoundaryField(now);
  drawScenery(now);

  // anomalies
  for (const a of level.anomalies) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(now * 0.4 + a.spin);
    ctx.setLineDash([10, 14]);
    for (let r = a.r; r > 40; r -= a.r / 3) {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7);
      glowStroke("rgba(179,136,255,.35)", 1);
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  if (!level.isCave) drawMothership(now);
  if (level.fakeMercy) drawDecoyMercy(now);
  drawLift(now);
  if (level.shrine) drawShrine(now);

  // fuel pods — real ones flicker like fire, alive and irregular
  for (const p of level.pods) {
    if (p.taken) continue;
    const flicker = 0.72 + 0.28 * Math.abs(Math.sin(now * 2.7 + (p.ph || 0)) * Math.sin(now * 1.3 + (p.ph || 0) * 2));
    drawGlow(p.x, p.y - 8, 14, "#ffc400", flicker * 0.7);
    ctx.save();
    ctx.translate(p.x, p.y - 8);
    ctx.globalAlpha = flicker;
    ctx.strokeStyle = "#ffc400"; ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(255,196,0,.15)";
    ctx.beginPath(); ctx.rect(-5, -7, 10, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(-3, -10); ctx.moveTo(3, -7); ctx.lineTo(3, -10); ctx.stroke();
    ctx.restore();
  }
  // counterfeits — every lure blinks in perfect, mechanical unison
  for (const p of level.fakePods) {
    if (p.taken) continue;
    const known = upgrades.canon;
    const alpha = Math.sin(now * Math.PI * 2) > 0 ? 1 : 0.38;
    const col = known ? PAL().REVEAL : "#ffc400";
    drawGlow(p.x, p.y - 8, 14, col, alpha * 0.7);
    ctx.save();
    ctx.translate(p.x, p.y - 8);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.fillStyle = known ? "rgba(198,255,0,.15)" : "rgba(255,196,0,.15)";
    ctx.beginPath(); ctx.rect(-5, -7, 10, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(-3, -10); ctx.moveTo(3, -7); ctx.lineTo(3, -10); ctx.stroke();
    if (known) {
      ctx.globalAlpha = 1;
      ctx.font = "700 10px Menlo, monospace"; ctx.textAlign = "center";
      ctx.fillStyle = col;
      ctx.fillText("?", 0, -16);
    }
    ctx.restore();
  }

  // black box: half-buried, blinking faintly when you're near
  const bb = level.blackbox;
  if (bb && !bb.found) {
    const near = Math.hypot(ship.x - bb.x, ship.y - bb.y) < 420;
    const blink = 0.25 + (near ? 0.55 * Math.abs(Math.sin(now * 4)) : 0.08 * Math.abs(Math.sin(now * 1.3)));
    ctx.save();
    ctx.translate(bb.x, bb.y);
    ctx.rotate(0.4);
    ctx.strokeStyle = "rgba(179,136,255," + blink.toFixed(2) + ")";
    ctx.shadowColor = "#b388ff"; ctx.shadowBlur = near ? 14 : 4;
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -6, 16, 10);
    ctx.beginPath(); ctx.arc(0, -10, 2, 0, 7); ctx.stroke();
    ctx.restore();
    if (bb.scanT > 0) {
      ctx.strokeStyle = "#b388ff"; ctx.shadowColor = "#b388ff"; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bb.x, bb.y - 24, 16, -Math.PI / 2, -Math.PI / 2 + (bb.scanT / 1.5) * Math.PI * 2);
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.font = "700 10px Menlo, monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "#b388ff";
      ctx.fillText("SCANNING…", bb.x, bb.y - 48);
    }
  }

  if (level.beacon) drawBeacon(now);

  for (const o of level.oids) {
    if (o.state === "aboard" || o.state === "delivered" || o.state === "lost" ||
        o.state === "contained" || o.state === "escaped") continue;
    drawOid(o, now);
  }

  for (const t of level.turrets) {
    if (!t.alive) continue;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.fillStyle = "#3a0d24";
    ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI, 0); ctx.closePath();
    ctx.fill();
    glowStroke("#ff4081", 2);
    ctx.beginPath();
    ctx.moveTo(Math.cos(t.ang) * 6, -10 + Math.sin(t.ang) * 6);
    ctx.lineTo(Math.cos(t.ang) * 18, -10 + Math.sin(t.ang) * 18);
    glowStroke("#ff4081", 2);
    ctx.restore();
  }

  for (const dr of level.drones) {
    if (!dr.alive) continue;
    ctx.save();
    ctx.translate(dr.x, dr.y);
    ctx.rotate(Math.sin(dr.bob * 2) * 0.2);
    ctx.fillStyle = "rgba(255,64,129,.12)";
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(9, 0); ctx.lineTo(0, 10); ctx.lineTo(-9, 0);
    ctx.closePath(); ctx.fill();
    glowStroke("#ff4081", 2);
    ctx.fillStyle = "#ff8ab3";
    ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 7); ctx.fill();
    ctx.restore();
  }

  for (const b of level.bullets) {
    drawGlow(b.x, b.y, 8, "#ff4081");
    ctx.fillStyle = "#ff8ab3";
    ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, 7); ctx.fill();
  }
  for (const b of level.shots) {
    drawGlow(b.x, b.y, 7, "#00e5ff");
    ctx.fillStyle = "#a7f6ff";
    ctx.beginPath(); ctx.arc(b.x, b.y, 2.5, 0, 7); ctx.fill();
  }

  for (const p of particles) {
    const a = clamp(p.t / p.max, 0, 1);
    drawGlow(p.x, p.y, p.size * 2.2, p.color, a * 0.8);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  if (!ship.dead) {
    // S4 — once the ship is in (or being captured by) the ventral bay, clip it
    // to the opening so its top is swallowed by the hull as it tucks inside —
    // it reads as entering her, not overlapping her. Free flight is unclipped.
    const ext = level.extraction;
    const framed = ext && (ext.done || inHangar());
    if (framed) {
      const h = hangarRect();
      ctx.save();
      ctx.beginPath(); ctx.rect(h.x0, h.top, h.x1 - h.x0, 640); ctx.clip();
      // fully gone before the doors finish shutting, so nothing lingers when the
      // bay fades back to a clean hull
      if (ext.done) ctx.globalAlpha = clamp(1 - ext.beatT / 0.55, 0, 1);
      drawShip(now);
      ctx.restore();
    } else drawShip(now);
  }
  // S4 — the bay doors slide shut over the captured ship before she jumps
  if (level.extraction && level.extraction.done) drawBayDoors(now);
  if (!ship.dead && !ship.landed && state === "play" && !(level.extraction && level.extraction.done)) drawLandingGuide();
  if (resupplyDrone) drawResupplyDrone(now);

  ctx.textAlign = "center";
  ctx.font = "700 13px Menlo, monospace";
  for (const t of texts) {
    ctx.globalAlpha = clamp(t.t, 0, 1);
    ctx.shadowColor = t.color; ctx.shadowBlur = 8;
    ctx.fillStyle = t.color;
    ctx.fillText(t.str, t.x, t.y);
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;

  if (level.dark) drawDarkness(now);
}

/* cached soft-disc sprites for the darkness punches, bucketed by radius so
   the animating lamp/oid lights don't spawn a new canvas every frame */
const darkSpriteCache = new Map();
function darkPunchSprite(rr) {
  const key = Math.max(8, Math.round(rr / 8) * 8);
  let c = darkSpriteCache.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = c.height = key * 2;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(key, key, 0, key, key, key);
  grad.addColorStop(0, "rgba(0,0,0,1)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad; g.fillRect(0, 0, key * 2, key * 2);
  darkSpriteCache.set(key, c);
  return c;
}

/* darkness overlay with punched lights — Nightingale's sector */
function drawDarkness(now) {
  const { z, cx, cy } = worldTransform();
  const toScreen = (wx, wy) => [(saLeft + (wx - cx) * z) * dpr, (wy - cy) * z * dpr];
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.clearRect(0, 0, darkCanvas.width, darkCanvas.height);
  // T2 — the night is tinted by the biome; T6 — the Basin ramps its own alpha
  // as night falls (level.darkAlpha), otherwise full dark at 0.9
  const nb = biomePal().night;
  const da = level.darkAlpha != null ? level.darkAlpha : 0.9;
  dctx.fillStyle = "rgba(" + nb[0] + "," + nb[1] + "," + nb[2] + "," + da.toFixed(3) + ")";
  dctx.fillRect(0, 0, darkCanvas.width, darkCanvas.height);
  dctx.globalCompositeOperation = "destination-out";
  const punch = (wx, wy, r, strength) => {
    const [sx, sy] = toScreen(wx, wy);
    const rr = r * z * dpr;
    // a pre-rendered soft disc (bucketed by radius) drawn at globalAlpha =
    // strength, instead of building a fresh radial gradient every light every
    // frame — up to ~15/frame on Nightingale with Scions + MERCY + boxes
    const sp = darkPunchSprite(rr);
    dctx.globalAlpha = clamp(strength, 0, 1);
    dctx.drawImage(sp, sx - rr, sy - rr, rr * 2, rr * 2);
    dctx.globalAlpha = 1;
  };
  // T6 — the lamp gutters on as night falls (REDUCED FLASH halves the flicker)
  let lampS = 1;
  if (level.nightStaged && level.nightFell && level.darkAlpha < 0.9) {
    const amp = reducedFlash ? 0.15 : 0.3;
    lampS = (1 - amp) + amp * Math.abs(Math.sin(now * 22));
  }
  if (!ship.dead) {
    // T-Hollows / owner steer: underground the reveal reads as light spilling
    // from the ship's three points (nose + engine corners), not one flat disc.
    // Flo's lamp widens each pool; on the surface the single disc is unchanged.
    if (level.isCave) {
      const r = lampRadius() * 0.72;
      for (const [px, py] of shipGlowPoints()) punch(px, py, r, lampS);
    } else {
      punch(ship.x, ship.y, lampRadius(), lampS);
    }
  }
  if (!level.isCave) punch(level.mx, level.my + 40, 260, 0.9);
  if (level.fakeMercy && !level.fakeMercy.dead)   // lit exactly like her (N1)
    punch(level.fakeMercy.x, level.fakeMercy.y + 40, 260, 0.9);
  if (resupplyDrone)   // the transfusion drone carries its own work light
    punch(resupplyDrone.x, resupplyDrone.y + 30, 110, 0.6);
  for (const o of level.oids) {  // stranded Scions carry tiny beacons
    if (o.state === "wait" || o.state === "walk" || o.state === "panic")
      punch(o.x, o.y - 10, 46, 0.55 + 0.3 * Math.abs(Math.sin(now * 2 + o.wave)));
  }
  for (const c of level.scenery)   // T3 — ward-lanterns carve small pools of light
    if (c.type === "lantern" && !c.dead)
      punch(c.x, c.y - c.pole * c.s, 72, 0.4 + 0.15 * Math.abs(Math.sin(now * 3 + c.ph)));
  if (level.beacon && !level.beacon.resolved) punch(level.beacon.x, level.beacon.y - 40, 220, 0.8);
  if (level.blackbox && !level.blackbox.found) punch(level.blackbox.x, level.blackbox.y, 36, 0.4);
  if (level.isCave) {   // the Hollows keep their own faint lights
    punch(level.lift.x, level.lift.y - 20, 120, 0.6);
    if (level.shrine && !level.shrine.found)
      punch(level.shrine.x, level.shrine.y - 30, 150, 0.5 + 0.2 * Math.abs(Math.sin(now * 1.4)));
  }
  dctx.globalCompositeOperation = "source-over";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(darkCanvas, 0, 0);
}

/* the ship's three light points in WORLD space — nose and the two engine
   corners of the hull, rotated by heading. Used by the Hollows lamp reveal
   (drawDarkness) and the visible glow that spills from them (drawShip). */
function shipGlowPoints() {
  const s = ship, c = Math.cos(s.ang), sn = Math.sin(s.ang);
  const local = [[0, -11], [-8, 8], [8, 8]];
  return local.map(([lx, ly]) => [s.x + lx * c - ly * sn, s.y + lx * sn + ly * c]);
}

function drawShip(now) {
  const s = ship;
  // underground, warm cyan pools bloom from each of the ship's three points —
  // Flo's lamp burns them brighter. Drawn under the hull so the reveal reads as
  // light leaving the ship, not a ring around it.
  if (level.isCave && !s.dead) {
    const lamp = upgrades.lamp;
    for (const [px, py] of shipGlowPoints()) {
      drawGlow(px, py, lamp ? 42 : 30, "#00e5ff", lamp ? 0.55 : 0.4);   // halo
      drawGlow(px, py, lamp ? 15 : 11, "#aef4ff", lamp ? 0.75 : 0.55);  // bright core
    }
  }
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.ang);
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 14;
  ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(0,229,255,.12)";
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(9, 9); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.lineTo(-9, 9);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
  if (s.shield) {   // the force field
    const r = SHIP_R + 8 + Math.sin(now * 10) * 1.3;
    ctx.save();
    ctx.strokeStyle = "rgba(105,240,174,.85)";
    ctx.shadowColor = "#69f0ae"; ctx.shadowBlur = 14;
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7); ctx.stroke();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "#69f0ae";
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7); ctx.fill();
    ctx.restore();
  }
  if (s.landed) {
    ctx.shadowColor = "#69f0ae"; ctx.shadowBlur = 10;
    ctx.strokeStyle = "rgba(105,240,174,.7)";
    ctx.beginPath(); ctx.moveTo(s.x - 14, s.y + SHIP_R + 2); ctx.lineTo(s.x + 14, s.y + SHIP_R + 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  // stranded at zero fuel — hold THRUST to call a resupply drone, except in the
  // Hollows where no signal reaches you and THRUST arms the scuttle charge
  if (s.landed && s.fuel <= 0 && !s.dead && !resupplyDrone) {
    ctx.textAlign = "center";
    ctx.font = "700 10px Menlo, monospace";
    if (level.isCave) {
      ctx.fillStyle = "#ff4081"; ctx.shadowColor = "#ff4081"; ctx.shadowBlur = 8;
      ctx.fillText("SIGNAL NOT RECEIVED — THE ROCK SWALLOWS IT", s.x, s.y - 52);
      ctx.fillText("HOLD THRUST TO SCUTTLE", s.x, s.y - 40);
      ctx.shadowBlur = 0;
      if (s.scuttleT > 0) {
        const p = clamp(s.scuttleT / SCUTTLE_HOLD_T, 0, 1);
        ctx.beginPath();
        ctx.arc(s.x, s.y - 68, 11, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
        glowStroke("#ff4081", 2.4);
      }
    } else {
      ctx.fillStyle = "#ffc400"; ctx.shadowColor = "#ffc400"; ctx.shadowBlur = 8;
      ctx.fillText("OUT OF FUEL — HOLD THRUST TO SIGNAL", s.x, s.y - 40);
      ctx.shadowBlur = 0;
      if (s.signalT > 0) {
        const p = clamp(s.signalT / SIGNAL_HOLD_T, 0, 1);
        ctx.strokeStyle = "#ffc400"; ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(s.x, s.y - 56, 11, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
        glowStroke("#ffc400", 2.4);
      }
    }
  }
  // Curie's compass to the nearest unrecovered black box
  if (upgrades.radiosense && level.blackbox && !level.blackbox.found) {
    const dx = level.blackbox.x - s.x, dy = level.blackbox.y - s.y;
    const a = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(a);
    ctx.strokeStyle = "rgba(179,136,255," + (0.4 + 0.4 * Math.abs(Math.sin(now * 3))).toFixed(2) + ")";
    ctx.shadowColor = "#b388ff"; ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 0); ctx.lineTo(34, 0);
    ctx.lineTo(30, -4); ctx.moveTo(34, 0); ctx.lineTo(30, 4);
    ctx.stroke();
    ctx.restore();
  }
}

/* the transfusion drone: descends on signal, then holds station with a fuel
   line out — the whole minigame reads from here (window, flow, occlusion) */
/* an off-screen edge marker for the resupply drone, so you can see where it is
   and follow it out from / home to MERCY */
function drawDroneMarker(now) {
  const rd = resupplyDrone;
  const t = worldTransform();
  const sx = saLeft + t.z * (rd.x - t.cx);
  const sy = t.z * (rd.y - t.cy);
  const m = 30;
  if (sx >= saLeft + m && sx <= vw - m && sy >= m && sy <= vh - m) return;   // visible — no marker
  const ex = clamp(sx, saLeft + m, vw - m), ey = clamp(sy, m, vh - m);
  const ang = Math.atan2(sy - ey, sx - ex);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // A3 — only the pointing chevron tracks the drone around the screen edge.
  const pulse = 0.6 + 0.4 * Math.sin(now * 6);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(ang);
  ctx.fillStyle = "rgba(255,196,0," + pulse.toFixed(2) + ")";
  ctx.shadowColor = "#ffc400"; ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(12, 0); ctx.lineTo(-6, 7); ctx.lineTo(-6, -7); ctx.closePath(); ctx.fill();
  ctx.restore();
  // ...while the status message stays PUT — pinned centred just under the top
  // HUD band with a dark halo — so it's readable in a panic instead of sliding
  // around the edge with the arrow.
  ctx.shadowColor = "rgba(0,0,0,.85)"; ctx.shadowBlur = 3;
  ctx.fillStyle = "rgba(255,196,0,.95)";
  ctx.font = "700 " + bodyFontPx(10) + "px Menlo, monospace"; ctx.textAlign = "center";
  const leg = rd.phase === "in" ? "⛽ INBOUND" : rd.phase === "out" ? "⛽ RETURNING" : "⛽ FUEL LINE";
  ctx.fillText(leg, vw / 2, 78);
  ctx.shadowBlur = 0;
  ctx.restore();
}
function drawResupplyDrone(now) {
  const rd = resupplyDrone;
  const bobY = rd.phase === "line" ? rd.y + Math.sin(now * 1.7) * 3 : rd.y;
  ctx.save();
  ctx.translate(rd.x, bobY);
  ctx.rotate(Math.sin(now * 6) * 0.15);
  ctx.fillStyle = "rgba(255,196,0,.18)";
  ctx.beginPath();
  ctx.moveTo(0, -8); ctx.lineTo(10, 4); ctx.lineTo(0, 10); ctx.lineTo(-10, 4);
  ctx.closePath(); ctx.fill();
  glowStroke("#ffc400", 1.8);
  ctx.restore();
  if (rd.phase === "in") {
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.15 * Math.sin(now * 8);
    ctx.beginPath();
    ctx.moveTo(rd.x, bobY + 9); ctx.lineTo(rd.x, bobY + 70);
    glowStroke("#ffc400", 1.6);
    ctx.restore();
  }
  if (rd.phase !== "line") return;

  const s = ship;
  const P = PAL();
  const cp = capturePoint(rd);
  const d = Math.hypot(s.x - cp.x, s.y - cp.y);
  const wr = xfuseWindowR();
  const connected = rd.everAttached && !s.dead && d < XFUSE_SNAP_R;
  const nearSnap = connected && d >= XFUSE_SNAP_R * 0.72;
  const lineCol = rd.attachedNow ? P.SAFE : nearSnap ? P.DANGER
    : connected ? P.WARN : "rgba(255,196,0,.55)";

  // the line itself — to the ship once caught, to the capture point until then
  const ex = connected ? s.x : cp.x, ey = connected ? s.y - 4 : cp.y;
  const midX = (rd.x + ex) / 2, midY = Math.max(bobY + 9, ey) + 16;   // sag
  ctx.save();
  if (connected && !rd.attachedNow) ctx.setLineDash([4, 5]);   // occluded: stuttering
  ctx.beginPath();
  ctx.moveTo(rd.x, bobY + 9);
  ctx.quadraticCurveTo(midX, midY, ex, ey);
  glowStroke(lineCol, 1.6);
  ctx.setLineDash([]);
  // drips travelling down the line while fuel flows
  if (rd.attachedNow) {
    for (let k = 0; k < 3; k++) {
      const p = (now * 0.9 + k / 3) % 1;
      const q = 1 - p;
      const qx = q * q * rd.x + 2 * q * p * midX + p * p * ex;
      const qy = q * q * (bobY + 9) + 2 * q * p * midY + p * p * ey;
      drawGlow(qx, qy, 5, "#ffc400", 0.8);
      ctx.fillStyle = "#ffd54f";
      ctx.fillRect(qx - 1.2, qy - 1.2, 2.4, 2.4);
    }
  }
  ctx.restore();

  // the capture window — dashed ring, same always-readable language as the
  // landing guide (colour + a ✓/!/✕ glyph)
  ctx.save();
  ctx.setLineDash([5, 7]);
  ctx.globalAlpha = rd.attachedNow ? 0.9 : 0.55 + 0.25 * Math.abs(Math.sin(now * 2));
  ctx.beginPath(); ctx.arc(cp.x, cp.y, wr, 0, 7);
  glowStroke(rd.attachedNow ? P.SAFE : connected ? lineCol : "rgba(255,196,0,.7)", 1.4);
  ctx.setLineDash([]);
  ctx.restore();

  // status line sits above the drone, clear of the ship's landing guide
  ctx.font = "700 10px Menlo, monospace"; ctx.textAlign = "center";
  const ly = bobY - 18;
  if (rd.attachedNow) {
    ctx.fillStyle = P.SAFE;
    ctx.fillText("✓ TRANSFUSING +" + Math.round(rd.given) + " — TAP FIRE TO DETACH", rd.x, ly);
  } else if (nearSnap) {
    ctx.fillStyle = P.DANGER;
    ctx.fillText("✕ LINE AT LIMIT — IT WILL PART", rd.x, ly);
  } else if (connected) {
    ctx.fillStyle = P.WARN;
    ctx.fillText("! LINE OCCLUDED — HOLD STATION", rd.x, ly);
  } else {
    ctx.fillStyle = "rgba(255,196,0,.85)";
    ctx.fillText("TRANSFUSION LINE — HOVER INSIDE THE RING", rd.x, ly);
  }
}

function drawLandingGuide() {
  const s = ship;
  const g = groundAt(s.x);
  const alt = g - (s.y + SHIP_R);
  if (alt <= 0 || alt > 320) return;
  const ev = landingEval();
  const P = PAL();
  const color = ev.soft ? P.SAFE : ev.survivable ? P.WARN : P.DANGER;
  // shape redundancy (H2): the state reads without colour at all
  const glyph = ev.soft ? "✓" : ev.survivable ? "!" : "✕";
  ctx.save();
  ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.globalAlpha = 0.9;
  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(s.x, s.y + 16); ctx.lineTo(s.x, g); ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(s.x - 14, groundAt(s.x - 14));
  ctx.lineTo(s.x + 14, groundAt(s.x + 14));
  ctx.stroke();
  ctx.font = "700 " + bodyFontPx(11) + "px Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = color;
  const vArrow = s.vy >= 0 ? "↓" : "↑";
  ctx.fillText(glyph + " " + vArrow + Math.abs(Math.round(s.vy)) + "  ↔" + Math.abs(Math.round(s.vx)), s.x + 20, s.y - 2);
  if (!ev.soft && ev.reason) {
    ctx.font = "600 " + bodyFontPx(8) + "px Menlo, monospace";
    ctx.fillText(ev.reason, s.x + 20, s.y + 11);
  }
  ctx.restore();
}

/* Shared neon android figure, drawn with feet at the origin.
   Rounded head with blinking eyes, antenna with a bobble, a torso
   wearing the serpent emblem, articulated arms with hands. */
function doidFigure(p) {
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (p.sitting) {
    ctx.moveTo(-1.5, -6); ctx.lineTo(-5, -6); ctx.lineTo(-5, 0);
    ctx.moveTo(1.5, -6); ctx.lineTo(5, -6); ctx.lineTo(5, 0);
  } else {
    ctx.moveTo(-1.5, -6); ctx.lineTo(-3.5 - p.legPh, 0);
    ctx.moveTo(1.5, -6); ctx.lineTo(3.5 + p.legPh, 0);
  }
  ctx.moveTo(-4, -12); ctx.lineTo(p.armL[0], p.armL[1]);
  ctx.moveTo(4, -12); ctx.lineTo(p.armR[0], p.armR[1]);
  glowStroke(p.col, 2);
  ctx.fillStyle = p.col;
  ctx.beginPath(); ctx.arc(p.armL[0], p.armL[1], 1.3, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(p.armR[0], p.armR[1], 1.3, 0, 7); ctx.fill();
  // torso
  ctx.beginPath();
  ctx.moveTo(-4.5, -14); ctx.lineTo(4.5, -14); ctx.lineTo(3.5, -6); ctx.lineTo(-3.5, -6);
  ctx.closePath();
  ctx.fillStyle = p.fill; ctx.fill();
  glowStroke(p.col, 2);
  // the serpent emblem — these are healers
  ctx.save();
  ctx.translate(0, -11.3);
  drawAsclepius(4.6, p.emblemCol, true);
  ctx.restore();
  // head — owner steer: smaller, hooded dome instead of a big baby head, so the
  // figure reads as a suited healer, not a toy
  ctx.beginPath();
  ctx.moveTo(-2.9, -15.5);
  ctx.lineTo(-2.9, -18.6); ctx.arcTo(-2.9, -20.3, -1.3, -20.3, 1.6);
  ctx.lineTo(1.3, -20.3); ctx.arcTo(2.9, -20.3, 2.9, -18.6, 1.6);
  ctx.lineTo(2.9, -15.5);
  ctx.closePath();
  ctx.fillStyle = p.fill; ctx.fill();
  glowStroke(p.col, 2);
  // a single visor slit rather than two cartoon eyes — it dims on "blink"
  ctx.fillStyle = p.col;
  ctx.globalAlpha = p.blink ? 0.35 : 1;
  ctx.fillRect(-2, -18.4, 4, 1.1);
  ctx.globalAlpha = 1;
  // a short antenna with a small swaying tip — subtler than the old bobble
  ctx.beginPath();
  ctx.moveTo(0, -20.3); ctx.lineTo(p.sway * 0.6, -23.2);
  glowStroke(p.col, 2);
  ctx.fillStyle = p.col;
  ctx.beginPath(); ctx.arc(p.sway * 0.6, -23.8, 1.0, 0, 7); ctx.fill();
}

/* Each Scion has a persona — big wavers, two-arm wavers, jumpers,
   pacers, sitters — plus individual size and gait. The saboteur tell
   survives all of them: their motion keeps perfect mechanical time. */
function drawOid(o, now) {
  const mech = o.role === "saboteur";
  const t = now + o.wave * 3;
  const sc = 1.0 * (o.scale || 1);   // owner steer: smaller on the ground, less toy-like
  const osc = f => mech ? Math.sign(Math.sin(t * f)) * 0.85 : Math.sin(t * f);
  const dying = o.state === "dying";
  const panic = o.state === "panic" || (dying && o.deathType === "torched");
  const walking = o.state === "walk";
  const pacing = o.state === "wait" && o.persona === "pace";
  const sitting = o.state === "wait" && o.persona === "sit" && !o.nearShip;
  let hop = 0;
  if (o.state === "wait" && o.persona === "jump") {
    const cyc = 1.7, ph = ((t % cyc) + cyc) % cyc;
    if (ph < 0.45) hop = (mech
      ? (ph < 0.225 ? ph / 0.225 : 1 - (ph - 0.225) / 0.225)
      : Math.sin(ph / 0.45 * Math.PI)) * 7;
  }
  if (panic) hop = Math.abs(Math.sin(t * 14)) * 3;
  const legPh = (walking || pacing || panic) ? Math.sin(t * (panic ? 16 : 10)) * 2.6 : 0;

  // arm pose
  let armL, armR;
  if (dying && o.deathType === "shot") {
    armL = [-1.2, -11]; armR = [1.2, -11];                // clutches the emblem
  } else if (panic || (o.state === "wait" && o.persona === "jump")) {
    const fl = panic ? osc(12) * 2 : 0;
    armL = [-6.5 - fl, -20]; armR = [6.5 + fl, -20];      // arms overhead
  } else if (walking || pacing) {
    armL = [-5 - legPh * 0.7, -7]; armR = [5 + legPh * 0.7, -7];  // stride swing
  } else if (sitting) {
    armL = [-5, -7]; armR = [5, -7];                       // hands on knees
  } else if (o.persona === "wave2" || (o.persona === "sit" && o.nearShip)) {
    armL = [-6, -19 - osc(5) * 3]; armR = [6, -19 + osc(5) * 3];  // "over here!"
  } else {
    armL = [-7, -8]; armR = [6, -19 + osc(5) * 3.5];       // one big wave
  }

  ctx.save();
  ctx.translate(o.x, o.y - hop);
  if (dying && o.deathType === "shot")
    ctx.rotate(-Math.min(1, o.deathT) * Math.PI / 2);      // keels over backward
  ctx.scale(sc, sc);
  // S5 (owner steer, July 2026): a Vector is NEVER given away by colour — the
  // reward for rescuing Semmelweis is the diagnostic SCAN, not a passive tint.
  // Identification is the "?" mark below, earned by cataloguing the unit.
  let tint = "#69f0ae";
  if (dying && o.deathType === "torched") tint = "#ff9e40";
  doidFigure({
    col: tint,
    fill: "rgba(10,30,24,.85)",
    emblemCol: "#ff5d7d",
    legPh, sitting,
    armL, armR,
    blink: mech ? ((t * 2) % 2) < 0.12 : (((t * 0.53) + o.wave) % 3.1) < 0.12,
    sway: mech ? 0 : osc(2.2) * 1.5
  });
  ctx.restore();
  // famous Scions shimmer, if you watch closely — a fine gold sparkle drifting
  // off the whole figure, not fat bubbles rising from the head
  if (o.role === "famous" && Math.random() < 0.05) {
    particles.push({
      x: o.x + (Math.random() - 0.5) * 22,
      y: o.y - 4 - Math.random() * 26,                 // spread up the body
      vx: (Math.random() - 0.5) * 6, vy: -6 - Math.random() * 6,   // a slow lift
      t: 0.6, max: 0.6, color: "#ffe082", size: 0.8 + Math.random() * 0.8 });
  }
  // a permanent "?" over a counterfeit you have CATALOGUED with the S5 scan —
  // the only identification cue, and only after you've earned and used the scan
  if (o.flagged && !dying) {
    ctx.font = "700 10px Menlo, monospace"; ctx.textAlign = "center";
    ctx.fillStyle = PAL().REVEAL;
    ctx.fillText("?", o.x, o.y - hop - 36);
  }
  // S5 — the landed-scan progress ring while you read a unit's vitals
  if (o.oidScanT > 0 && !dying) {
    const p = clamp(o.oidScanT / 4, 0, 1);
    ctx.strokeStyle = "#00e5ff"; ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(o.x, o.y - hop - 30, 12, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

/* ---------------- scenery ---------------- */
function drawScenery(now) {
  for (const sc of level.scenery) {
    if (sc.dead) continue;
    switch (sc.type) {
      case "tree":   drawTree(sc, now); break;
      case "rock":   drawRockScn(sc, now); break;
      case "bld":    drawBuilding(sc, now, false); break;
      case "ruin":   drawBuilding(sc, now, true); break;
      case "wreckM": drawWreckM(sc, now); break;
      case "wreckS": drawWreckS(sc, now); break;
      case "boulder": drawBoulder(sc, now); break;   // T3 biome ornaments
      case "reed":    drawReed(sc, now); break;
      case "lantern": drawLantern(sc, now); break;
      case "spire":   drawSpire(sc, now); break;
      case "dune":    drawDune(sc, now); break;
      case "hedge":   drawHedge(sc, now); break;
    }
    // an in-progress landed scan (Bundle J) — same ring language as the
    // black box and the shrine
    if (sc.scanT > 0) {
      const topY = sc.type === "tree" ? sc.y - 60 * sc.s : sc.y - 34;
      ctx.save();
      ctx.strokeStyle = "#aef4ff"; ctx.shadowColor = "#aef4ff"; ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sc.x, topY, 16, -Math.PI / 2, -Math.PI / 2 + (sc.scanT / SCAN_T) * Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.font = "700 10px Menlo, monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "#aef4ff";
      ctx.fillText("SCANNING… hold position", sc.x, topY - 26);
      ctx.restore();
    }
  }
}

/* ===== T3 biome ornaments ===== */
/* VESALIUS — stacked boulders, the exposed rubble of the ridge */
function drawBoulder(sc, now) {
  ctx.save();
  ctx.translate(sc.x, sc.y);
  ctx.rotate(sc.tilt);
  ctx.scale(sc.s, sc.s);
  // half-buried: clip away everything below the (rotated) ground line so the
  // base sinks INTO the slope instead of being painted over it. +3 keeps a
  // hair of overlap so there's no seam between rock and terrain.
  ctx.beginPath(); ctx.rect(-60, -300, 120, 303); ctx.clip();
  for (const b of sc.stack) {
    ctx.beginPath();
    const vs = b.verts;
    if (vs) {
      ctx.moveTo(b.dx + vs[0][0], b.dy + vs[0][1]);
      for (let i = 1; i < vs.length; i++) ctx.lineTo(b.dx + vs[i][0], b.dy + vs[i][1]);
      ctx.closePath();
    } else {
      ctx.arc(b.dx, b.dy, b.r, 0, 7);   // legacy fallback
    }
    ctx.fillStyle = "#1b0f06"; ctx.fill();
    glowStroke("rgba(224,151,90,.5)", 1.6);
  }
  ctx.restore();
}
/* NIGHTINGALE — reed clusters bending in the basin dark */
function drawReed(sc, now) {
  ctx.save();
  ctx.translate(sc.x, sc.y);
  ctx.lineCap = "round";
  for (const bl of sc.blades) {
    const sway = Math.sin(now * 1.3 + bl.ph) * 3;
    ctx.beginPath();
    ctx.moveTo(bl.dx, 0);
    ctx.quadraticCurveTo(bl.dx + bl.bend * 0.5 + sway, -bl.len * 0.6,
                         bl.dx + bl.bend + sway, -bl.len);
    glowStroke("rgba(131,144,255,.45)", 1.3);
  }
  ctx.restore();
}
/* NIGHTINGALE — ward-lanterns: dim warm lights that matter in the dark
   (they also punch the darkness overlay in drawDarkness) */
function drawLantern(sc, now) {
  const flick = 0.7 + 0.3 * Math.abs(Math.sin(now * 3 + sc.ph));
  const ly = sc.y - sc.pole * sc.s;
  ctx.save();
  ctx.strokeStyle = "rgba(131,144,255,.5)"; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(sc.x, sc.y); ctx.lineTo(sc.x, ly); ctx.stroke();
  ctx.restore();
  drawGlow(sc.x, ly, 14, "#ffcf7a", flick);
  ctx.fillStyle = "rgba(255,207,122," + (0.6 * flick).toFixed(2) + ")";
  ctx.beginPath(); ctx.arc(sc.x, ly, 2.6, 0, 7); ctx.fill();
}
/* CURIE — ice spires with a faint internal glow (radium light in crystal) */
function drawSpire(sc, now) {
  ctx.save();
  ctx.translate(sc.x, sc.y);
  ctx.rotate(sc.tilt);
  ctx.scale(sc.s, sc.s);
  const h = sc.sh, w = sc.sw;
  ctx.beginPath();
  ctx.moveTo(-w, 0); ctx.lineTo(-w * 0.4, -h * 0.55); ctx.lineTo(0, -h);
  ctx.lineTo(w * 0.4, -h * 0.5); ctx.lineTo(w, 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(120,110,200,.16)"; ctx.fill();
  glowStroke("rgba(166,255,156,.5)", 1.6);
  ctx.restore();
  const g = 0.3 + 0.2 * Math.abs(Math.sin(now * 1.2 + sc.ph));
  drawGlow(sc.x, sc.y - sc.sh * 0.5 * sc.s, 10, "#a6ff9c", g);
}
/* AVICENNA — banded dunes and the odd pale salt pan */
function drawDune(sc, now) {
  ctx.save();
  ctx.translate(sc.x, sc.y);
  const w = sc.dw;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.quadraticCurveTo(-w * 0.15, -w * 0.16, 0, -w * 0.2);
  ctx.quadraticCurveTo(w * 0.25, -w * 0.16, w / 2, 0);
  ctx.closePath();
  ctx.fillStyle = "#1c1608"; ctx.fill();
  glowStroke("rgba(230,200,95,.4)", 1.4);
  ctx.save();
  ctx.globalAlpha = 0.3; ctx.strokeStyle = "rgba(230,200,95,.5)"; ctx.lineWidth = 1;
  for (let b = 1; b <= sc.bands; b++) {
    const yy = -w * 0.2 * (b / (sc.bands + 1));
    ctx.beginPath(); ctx.moveTo(-w / 2 + b * 4, yy); ctx.lineTo(w / 2 - b * 4, yy); ctx.stroke();
  }
  ctx.restore();
  if (sc.pan) {
    ctx.fillStyle = "rgba(240,230,190,.14)";
    ctx.beginPath(); ctx.ellipse(0, 2, w * 0.42, 4, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
}
/* JENNER — hedgerows; the pastoral calm that lies */
function drawHedge(sc, now) {
  ctx.save();
  ctx.translate(sc.x, sc.y);
  ctx.rotate(sc.tilt * 0.4);
  const w = sc.hw, sway = Math.sin(now * 0.7 + sc.ph) * 1.2;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  for (let b = 0; b <= sc.bumps; b++) {
    const bx = -w / 2 + (w * b) / sc.bumps;
    ctx.quadraticCurveTo(bx - w / sc.bumps / 2, -16 - (b % 2) * 5 + sway, bx, -12);
  }
  ctx.lineTo(w / 2, 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(20,38,15,.9)"; ctx.fill();
  glowStroke("rgba(168,227,154,.4)", 1.4);
  ctx.restore();
}

/* alien glow-flora. The lure-trees keep perfect mechanical time —
   the same tell the saboteurs carry. */
function drawTree(sc, now) {
  const sway = sc.fake ? Math.sign(Math.sin(now * 1.6 + sc.ph)) * 0.55
                       : Math.sin(now * 0.9 + sc.ph);
  ctx.save();
  ctx.translate(sc.x, sc.y);
  ctx.rotate(sc.tilt);
  ctx.scale(sc.s, sc.s);
  const h = 34;
  ctx.strokeStyle = "rgba(120,200,255,.4)";
  ctx.lineWidth = 2; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(2, -h * 0.55, sway * 2.4, -h);
  ctx.moveTo(0.6, -h * 0.45); ctx.lineTo(8 + sway * 2, -h * 0.7);
  ctx.moveTo(0, -h * 0.6); ctx.lineTo(-7 + sway * 2, -h * 0.85);
  ctx.stroke();
  ctx.fillStyle = "rgba(0,191,165,.1)";
  const puff = (px, py, r) => {
    ctx.beginPath(); ctx.arc(px + sway * 3, py, r, 0, 7);
    ctx.fill();
    glowStroke("rgba(0,191,165,.55)", 1.6);
  };
  puff(sway * 2.4, -h - 6, 8);
  puff(sway * 2.4 - 8, -h + 1, 6);
  puff(sway * 2.4 + 8, -h, 6.5);
  ctx.restore();
  if (sc.fake && upgrades.canon) {
    ctx.font = "700 10px Menlo, monospace"; ctx.textAlign = "center";
    ctx.fillStyle = PAL().REVEAL;
    ctx.fillText("?", sc.x, sc.y - 52 * sc.s);
  }
}

/* rocks are inert — except the one that breathes */
function drawRockScn(sc, now) {
  ctx.save();
  ctx.translate(sc.x, sc.y);
  ctx.rotate(sc.tilt);
  ctx.scale(sc.s, sc.s);
  const breathe = sc.hollow ? 0.16 * Math.sin(now * 1.1 + sc.ph) : 0;
  ctx.strokeStyle = "rgba(150,140,200," + (0.4 + breathe).toFixed(2) + ")";
  ctx.fillStyle = "#141031";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  sc.verts.forEach(([vx, vy], i) => i === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy));
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

/* settlements: intact towers with lit windows, and what's left of them */
function drawBuilding(sc, now, ruined) {
  ctx.save();
  ctx.translate(sc.x, sc.y);
  ctx.rotate(sc.tilt * (ruined ? 1.5 : 0.4));
  const w = sc.w, h = ruined ? sc.h * 0.62 : sc.h;
  ctx.fillStyle = "rgba(8,12,30,.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ruined) {
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2, -h + sc.jag[0]);
    for (let j = 1; j <= 4; j++) ctx.lineTo(-w / 2 + (w * j) / 4, -h + sc.jag[j]);
    ctx.lineTo(w / 2, 0);
  } else ctx.rect(-w / 2, -h, w, h);
  ctx.closePath(); ctx.fill();
  glowStroke(ruined ? "rgba(150,140,200,.35)" : "rgba(0,229,255,.4)", 2);
  // windows
  const cw = w / (sc.cols + 1), ch = h / (sc.rows + 1);
  let idx = 0;
  for (let r = 0; r < sc.rows; r++) for (let c = 0; c < sc.cols; c++, idx++) {
    const lit = ruined ? idx === sc.flick : sc.lit[idx];
    if (!lit) continue;
    let a = ruined ? 0.12 + 0.25 * Math.abs(Math.sin(now * 3.7 + sc.ph)) : 0.5;
    if (!ruined && idx === sc.flick) a = 0.15 + 0.4 * Math.abs(Math.sin(now * 5 + sc.ph));
    // the surge dims every window (I2) — softened under REDUCED FLASH
    if (staticSurge > 0) a *= reducedFlash ? (0.6 + 0.2 * Math.random()) : (0.15 + 0.3 * Math.random());
    const wx = -w / 2 + cw * (c + 0.7), wy = -h + ch * (r + 0.7);
    if (ruined && wy < -h * 0.75) continue;
    ctx.fillStyle = "rgba(255,196,0," + a.toFixed(2) + ")";
    ctx.fillRect(wx, wy, 3.4, 4.6);
  }
  if (!ruined) { // antenna with a slow red blink
    ctx.strokeStyle = "rgba(0,229,255,.4)"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, -h - 12); ctx.stroke();
    if (Math.sin(now * 1.8 + sc.ph) > 0.85) {
      drawGlow(0, -h - 13, 6, "#ff1744");
      ctx.fillStyle = "#ff1744";
      ctx.beginPath(); ctx.arc(0, -h - 13, 1.8, 0, 7); ctx.fill();
    }
  } else { // rubble at the foot
    ctx.strokeStyle = "rgba(150,140,200,.25)";
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 8, 0); ctx.lineTo(-w / 2 - 2, -5); ctx.lineTo(-w / 2 + 5, 0);
    ctx.moveTo(w / 2 - 4, 0); ctx.lineTo(w / 2 + 3, -6); ctx.lineTo(w / 2 + 9, 0);
    ctx.stroke();
  }
  ctx.restore();
}

/* a MERCY-class sister, down and half-dark — her emblem still flickers */
function drawWreckM(sc, now) {
  ctx.save();
  // sink the broken hull into the ridge rather than perching it on the crust:
  // set a ground-line clip (in the ground-aligned frame), then undo the tilt and
  // re-apply the original transform so the hull below the surface is buried while
  // everything above — breach, emblem, hull tag — renders exactly as before.
  ctx.translate(sc.x, sc.y);
  ctx.rotate(sc.tilt);
  ctx.beginPath(); ctx.rect(-200, -500, 400, 506); ctx.clip();
  ctx.rotate(-sc.tilt);
  ctx.translate(0, 4);
  ctx.rotate(sc.tilt + sc.lean * 0.5);
  ctx.scale(sc.s * 0.62, sc.s * 0.62);
  ctx.fillStyle = "rgba(8,12,26,.85)";
  ctx.lineWidth = 2.5;
  mercyHullPath();
  ctx.fill();
  glowStroke("rgba(0,229,255,.3)", 2.5);
  // hull breach, right through where the command tower met the spine
  ctx.beginPath();
  ctx.moveTo(20, -22); ctx.lineTo(34, -4); ctx.lineTo(24, 8); ctx.lineTo(40, 20);
  glowStroke("rgba(150,140,200,.4)", 1.6);
  // the emblem, mostly dead, still on the command tower
  const flick = Math.sin(now * 0.7 + sc.ph) > 0.965 ? 0.55 : 0.12;
  ctx.save();
  ctx.translate(0, -15);
  if (flick > 0.3) { ctx.shadowColor = "#ff1744"; ctx.shadowBlur = 10; }
  drawAsclepius(36, "rgba(255,23,68," + flick + ")");
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.font = "700 10px Menlo, monospace"; ctx.textAlign = "center";
  ctx.fillStyle = "rgba(155,234,249,.3)";
  ctx.fillText("A ␥ S · ␥ ␥ ␥ C ␥", 0, 36);
  ctx.restore();
  if (Math.random() < 0.006) particles.push({
    x: sc.x + 20 * sc.s, y: sc.y - 8, vx: (Math.random() - 0.5) * 20, vy: -30,
    t: 0.4, max: 0.5, color: "#ffc400", size: 1.6 });
}

/* one of ours — a rescue dart that didn't make it. It's the SAME hull the player
   flies (identical path to drawShip), so it's drawn at the ship's own scale, not
   oversized — and half-buried like the boulders rather than perched on the crust. */
function drawWreckS(sc, now) {
  ctx.save();
  ctx.translate(sc.x, sc.y);
  ctx.rotate(sc.tilt);
  // half-buried: clip away everything below the ground line so the wreck sinks
  // INTO the slope. +5 keeps a hair of overlap so there's no seam.
  ctx.beginPath(); ctx.rect(-80, -300, 160, 305); ctx.clip();
  ctx.rotate(2.35 + sc.lean);
  // never bigger than the ship the player flies (sc.s runs 0.8–1.5); a downed
  // dart reads as ship-sized or a touch smaller, collapsed.
  const ws = Math.min(1.0, sc.s);
  ctx.scale(ws, ws);
  ctx.strokeStyle = "rgba(0,229,255,.32)";
  ctx.fillStyle = "rgba(6,10,22,.8)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(9, 9); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.lineTo(-9, 9);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  // scorch trail where it came down
  ctx.strokeStyle = "rgba(30,20,50,.9)"; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sc.x - 34 * sc.s, sc.y + 1); ctx.lineTo(sc.x + 8 * sc.s, sc.y + 2);
  ctx.stroke();
  if (Math.random() < 0.005) particles.push({
    x: sc.x, y: sc.y - 10, vx: (Math.random() - 0.5) * 14, vy: -24,
    t: 0.5, max: 0.6, color: "#ff6d00", size: 1.6 });
}

/* the secret lift. On the surface it is almost nothing: two hairline
   seams, four rivets, a glint every few seconds. In the Hollows it is
   the way home, and glows like it. */
function drawLift(now) {
  const L = level.lift;
  if (!L) return;
  ctx.save();
  ctx.translate(L.x, L.y);
  if (level.isCave) {
    const a = 0.5 + 0.3 * Math.sin(now * 2.2);
    ctx.strokeStyle = "rgba(179,136,255," + a.toFixed(2) + ")";
    ctx.shadowColor = "#b388ff"; ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-46, 2); ctx.lineTo(46, 2); ctx.stroke();
    for (let k = 0; k < 3; k++) {   // chevrons pointing up
      const ph = ((now * 0.7 + k / 3) % 1);
      ctx.globalAlpha = (1 - ph) * 0.7;
      const yy = -8 - ph * 34;
      ctx.beginPath(); ctx.moveTo(-9, yy); ctx.lineTo(0, yy - 7); ctx.lineTo(9, yy); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.font = "600 9px Menlo, monospace"; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(179,136,255,.75)";
    ctx.fillText("RETURN LIFT — land and hold", 0, -52);
  } else {
    const glint = Math.sin(now * 0.43 + L.x) > 0.988 ? 0.4 : 0;
    // C2 — a slow "breathing" so the seam has faint life between the rare
    // glints, and (below) an occasional mote rising from the pad. Motion is
    // what the eye catches; both stay dim so the lift is findable, not blatant.
    const breathe = 0.05 * (0.5 + 0.5 * Math.sin(now * 1.15 + L.x));
    const a = 0.13 + glint + breathe;
    // a subtly thicker plate of ground under the pad — visible if you look,
    // not blatant if you don't
    const thickG = ctx.createLinearGradient(0, 2, 0, 11);
    thickG.addColorStop(0, "rgba(179,136,255," + (0.1 + glint * 0.25 + breathe).toFixed(2) + ")");
    thickG.addColorStop(1, "rgba(179,136,255,0)");
    ctx.fillStyle = thickG;
    ctx.fillRect(-44, 2, 88, 9);
    ctx.strokeStyle = "rgba(179,136,255," + a.toFixed(2) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-44, 1); ctx.lineTo(-44, 4); ctx.moveTo(44, 1); ctx.lineTo(44, 4);
    ctx.moveTo(-44, 2.5); ctx.lineTo(44, 2.5);
    ctx.stroke();
    ctx.fillStyle = "rgba(179,136,255," + (a + 0.06).toFixed(2) + ")";
    for (const rx of [-36, -12, 12, 36]) ctx.fillRect(rx - 1, 0, 2, 2);
    // a rare, dim mote lifting off the seam — world-space, so pushed with
    // absolute coords. ~0.5/s, faint and small: a glance-catcher, not a beacon.
    if (Math.random() < 0.009) particles.push({
      x: L.x + (Math.random() - 0.5) * 74, y: L.y + 1,
      vx: (Math.random() - 0.5) * 3, vy: -7 - Math.random() * 5,
      t: 0.9, max: 1.7, color: "#b388ff", size: 0.8 + Math.random() * 0.6 });
  }
  if (L.holdT > 0) {   // the hold ring, once you've noticed
    ctx.strokeStyle = "#b388ff"; ctx.shadowColor = "#b388ff"; ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -26, 15, -Math.PI / 2, -Math.PI / 2 + (L.holdT / 2.4) * Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/* Glycon's shrine, down in the dark: a serpent coiled around a mask */
/* the true emblem of medicine: a serpent coiled on a staff (rod of
   Asclepius) — mirrors Glycon, the serpent wearing a mask. Draws centered
   at (0,0), sized by h (overall height). `minimal` skips the staff and
   draws just a single S-curve serpent stroke — used at Scion scale, where
   a full staff won't read. */
function drawAsclepius(h, color, minimal) {
  const w = h * 0.55;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineCap = "round";
  if (minimal) {
    ctx.lineWidth = Math.max(0.8, h * 0.16);
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, h * 0.4);
    ctx.bezierCurveTo(-w * 0.9, 0, w * 0.7, 0, w * 0.4, -h * 0.4);
    ctx.stroke();
  } else {
    ctx.lineWidth = Math.max(1.2, h * 0.045);
    ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, h / 2); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, h * 0.06);
    ctx.beginPath();
    ctx.moveTo(-w * 0.25, h * 0.42);
    ctx.bezierCurveTo(-w, h * 0.05, w * 0.85, -h * 0.12, -w * 0.35, -h * 0.32);
    ctx.bezierCurveTo(-w * 0.8, -h * 0.5, w * 0.55, -h * 0.56, 0, -h * 0.58);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -h * 0.58, Math.max(1.2, h * 0.06), 0, 7); ctx.fill();
  }
  ctx.restore();
}

function drawShrine(now) {
  const sh = level.shrine;
  ctx.save();
  ctx.translate(sh.x, sh.y);
  const col = sh.found ? "#69f0ae" : PAL().REVEAL;
  ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  // plinth
  ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-12, -8); ctx.lineTo(12, -8); ctx.lineTo(18, 0); ctx.stroke();
  // the coil
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.bezierCurveTo(-16, -20, 8, -22, 2, -32);
  ctx.bezierCurveTo(-4, -40, 12, -42, 6, -52);
  ctx.stroke();
  // the mask it wears
  ctx.beginPath(); ctx.arc(6, -58, 6, 0, 7); ctx.stroke();
  ctx.fillStyle = col;
  ctx.fillRect(3, -60, 2.2, 1.4); ctx.fillRect(7.6, -60, 2.2, 1.4);
  if (!sh.found) {
    const ph = (now % 2.6) / 2.6;
    for (let k = 0; k < 2; k++) {
      const p = (ph + k / 2) % 1;
      ctx.globalAlpha = (1 - p) * 0.4;
      ctx.beginPath(); ctx.arc(0, -34, 14 + p * 90, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (sh.scanT > 0) {
      ctx.strokeStyle = "#aef4ff"; ctx.shadowColor = "#aef4ff";
      ctx.beginPath();
      ctx.arc(0, -34, 20, -Math.PI / 2, -Math.PI / 2 + (sh.scanT / 2) * Math.PI * 2);
      ctx.stroke();
      ctx.font = "700 13px Menlo, monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "#aef4ff";
      ctx.fillText("READING THE MARKS…", 0, -86);
    } else {
      // no clue text — just an inviting marked patch of ground beside it,
      // within the same 80px landing radius updateShrine actually checks
      const padX = 42, pulse = 0.4 + 0.4 * Math.abs(Math.sin(now * 2));
      ctx.strokeStyle = "rgba(255,196,0," + pulse.toFixed(2) + ")";
      ctx.shadowColor = "#ffc400"; ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padX - 14, -6); ctx.lineTo(padX - 14, 0); ctx.lineTo(padX - 6, 0);
      ctx.moveTo(padX + 14, -6); ctx.lineTo(padX + 14, 0); ctx.lineTo(padX + 6, 0);
      ctx.stroke();
      ctx.globalAlpha = pulse * 0.6;
      ctx.fillStyle = "#ffc400";
      ctx.fillRect(padX - 14, -1.5, 28, 2);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();
}

/* AMS MERCY's silhouette, shared by the mothership, the intro panel, and
   the crashed MERCY-class wreck: a lozenge hull with a dorsal command
   tower (where the emblem sits) instead of the old flat hexagon. Draws
   centred at the local origin; caller fills/strokes. */
function mercyHullPath() {
  ctx.beginPath();
  ctx.moveTo(-145, 0);
  ctx.lineTo(-95, -22); ctx.lineTo(-40, -22);
  ctx.lineTo(-26, -50); ctx.lineTo(26, -50); ctx.lineTo(40, -22);
  ctx.lineTo(95, -22); ctx.lineTo(145, 0);
  ctx.lineTo(95, 20); ctx.lineTo(-95, 20);
  ctx.closePath();
}
/* panel-seam greebles along the hull flanks — cheap surface detail */
function mercyGreebles(color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath();
  for (const gx of [-110, -95, -60, 60, 95, 110]) { ctx.moveTo(gx, -20); ctx.lineTo(gx, 18); }
  ctx.stroke();
}

/* a converging beam in place of a flat dashed rect — `vertical` runs the
   beam top-to-bottom (recovery, hanging under the hull) or left-to-right
   (quarantine, off the side); `pull` reverses the scan-line direction so
   quarantine reads as containing/drawing in rather than dispensing. */
function drawTractorBeam(b, colorRGB, now, vertical, pull) {
  ctx.save();
  ctx.beginPath();
  if (vertical) {
    const midx = (b.x0 + b.x1) / 2, topW = (b.x1 - b.x0) * 0.45;
    ctx.moveTo(midx - topW / 2, b.y0); ctx.lineTo(midx + topW / 2, b.y0);
    ctx.lineTo(b.x1, b.y1); ctx.lineTo(b.x0, b.y1);
  } else {
    const midy = (b.y0 + b.y1) / 2, nearH = (b.y1 - b.y0) * 0.45;
    ctx.moveTo(b.x0, midy - nearH / 2); ctx.lineTo(b.x0, midy + nearH / 2);
    ctx.lineTo(b.x1, b.y1); ctx.lineTo(b.x1, b.y0);
  }
  ctx.closePath();
  const grad = vertical ? ctx.createLinearGradient(0, b.y0, 0, b.y1) : ctx.createLinearGradient(b.x0, 0, b.x1, 0);
  grad.addColorStop(0, "rgba(" + colorRGB + ",.22)");
  grad.addColorStop(1, "rgba(" + colorRGB + ",.03)");
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = "rgba(" + colorRGB + ",.4)"; ctx.lineWidth = 1.2; ctx.stroke();
  for (let i = 0; i < 3; i++) {
    let p = (now * 0.5 + i / 3) % 1;
    if (pull) p = 1 - p;
    ctx.globalAlpha = (1 - Math.abs(p - 0.5) * 2) * 0.6;
    ctx.strokeStyle = "rgba(" + colorRGB + ",.7)";
    ctx.beginPath();
    if (vertical) {
      const y = lerp(b.y0, b.y1, p), w = lerp((b.x1 - b.x0) * 0.45, b.x1 - b.x0, p);
      const midx = (b.x0 + b.x1) / 2;
      ctx.moveTo(midx - w / 2, y); ctx.lineTo(midx + w / 2, y);
    } else {
      const x = lerp(b.x0, b.x1, p), h = lerp((b.y1 - b.y0) * 0.45, b.y1 - b.y0, p);
      const midy = (b.y0 + b.y1) / 2;
      ctx.moveTo(x, midy - h / 2); ctx.lineTo(x, midy + h / 2);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawMothership(now) {
  const { mx, my } = mercyPos();
  // no idle bob: the hull, the bays and the ventral hangar all sit on the exact
  // same mercyPos, so the hangar can never drift out of sync with the hull
  ctx.save();
  ctx.translate(mx, my);
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 18;
  ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 2.5;
  ctx.fillStyle = "rgba(0,40,60,.55)";
  mercyHullPath();
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  mercyGreebles("rgba(0,229,255,.3)");
  drawGlow(-145, 0, 13, "#00e5ff", 0.45 + 0.25 * Math.sin(now * 4));
  drawGlow(145, 0, 13, "#00e5ff", 0.45 + 0.25 * Math.sin(now * 4 + 1.4));
  const pulse = 0.55 + 0.45 * Math.sin(now * 3);
  ctx.save();
  ctx.translate(0, -15);
  ctx.shadowColor = "#ff1744"; ctx.shadowBlur = 16 * pulse + 6;
  drawAsclepius(36, "rgba(255,23,68," + (0.5 + 0.5 * pulse).toFixed(2) + ")");
  ctx.restore();
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 8;
  ctx.fillStyle = "#9beaf9";
  ctx.font = "700 10px Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText("A M S · M E R C Y", 0, 34);
  ctx.restore();

  // extraction: the Static's pulse rings wash over MERCY
  if (level.pulse) {
    const p = level.pulse.t / 1.2;
    ctx.save();
    ctx.strokeStyle = "rgba(179,136,255," + ((1 - p) * 0.7).toFixed(2) + ")";
    ctx.shadowColor = "#b388ff"; ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx, my, 40 + p * 560, 0, 7); ctx.stroke();
    ctx.restore();
  }

  // S4 — once the manifest closes MERCY retracts her bays and opens a ventral
  // hangar: the only way aboard is now to FLY into her and hold the hover.
  // (drawHangar self-manages its transform; the hull's save was already closed.)
  if (level.extraction) {
    if (level.extraction.done && level.extraction.beatT > 0.9) drawJumpStreak(now);
    drawHangar(now, true);
    return;
  }

  const bays = bayRects();
  ctx.save();
  ctx.lineWidth = 1.5;
  // recovery bay: a beam hanging under the hull, dispensing outward
  const medRGB = mercyBreach ? "255,64,129" : "0,229,255";
  drawTractorBeam(bays.med, medRGB, now, true, false);
  // Bay labels: bigger (BIG-TEXT aware) and higher-contrast for mobile. A dark
  // halo lifts them off the hull and terrain; the isolation label uses a lighter,
  // more luminous red — pure #ff1744 was near-invisible against the dark ground.
  ctx.font = "700 " + bodyFontPx(9) + "px Menlo, monospace"; ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,.9)"; ctx.shadowBlur = 4;
  ctx.fillStyle = mercyBreach ? "rgba(255,90,120,.98)" : "rgba(120,240,255,.98)";
  ctx.fillText(mercyBreach ? "LOCKDOWN" : "RECOVERY BAY",
    (bays.med.x0 + bays.med.x1) / 2, bays.med.y1 + 15);
  // quarantine bay: a beam off the starboard side, pulling inward — contained, not delivered
  drawTractorBeam(bays.red, "255,23,68", now, false, true);
  ctx.fillStyle = "rgba(255,110,132,.98)";
  ctx.fillText("RED BAY · ISOLATION AIRLOCK", (bays.red.x0 + bays.red.x1) / 2, bays.red.y1 + 15);
  ctx.shadowBlur = 0;
  ctx.restore();

  // S4.5 — a faint ventral hangar hint once the triage retreat is on offer
  if (level.earlyEligible) drawHangar(now, false);
}

/* S4 — the ventral hangar: an approach-lit slot in MERCY's underside. Drawn in
   whatever world transform the caller is already in (drawMothership / drawWorld),
   exactly like the bay beams, so it stays pinned to her through camera shake.
   `active` is the spooling-to-jump hangar; the dim variant is the S4.5 offer. */
function bayFade() {
  // once the doors are shut she fades the bay away, so she jets off looking like
  // her whole self again (the way she does at mission start)
  const e = level.extraction;
  return (e && e.done) ? clamp(1 - (e.beatT - 0.9) / 0.2, 0, 1) : 1;
}
function drawHangar(now, active) {
  const h = hangarRect();
  const fade = bayFade();
  if (fade <= 0) return;
  ctx.save();
  const col = active ? "255,196,0" : "0,229,255";
  const a = (active ? 1 : 0.4) * fade;
  // the OPENED BAY: a dark recess set into her belly, drawn over the hull fill
  // (drawMothership already laid the hull), so it reads as a large zone opened
  // in the side of the ship — not a box floating below her. Top tucks up inside
  // the hull; base sits flush with her belly line — never hangs below it.
  const top = h.top, bot = h.bot;
  ctx.globalAlpha = (active ? 0.96 : 0.55) * fade;
  ctx.fillStyle = "rgba(3,7,16,1)";
  ctx.fillRect(h.x0, top, h.x1 - h.x0, bot - top);
  // interior back-wall shading lines, so the recess reads as depth, not a hole
  ctx.globalAlpha = (active ? 0.18 : 0.1) * fade;
  ctx.strokeStyle = "rgba(" + col + ",1)"; ctx.lineWidth = 1;
  for (let gx = h.x0 + 16; gx < h.x1 - 8; gx += 16) {
    ctx.beginPath(); ctx.moveTo(gx, top + 3); ctx.lineTo(gx, top + (bot - top) * 0.55); ctx.stroke();
  }
  // the bright bay-door frame
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(" + col + "," + a.toFixed(2) + ")"; ctx.lineWidth = 2.5;
  ctx.shadowColor = "rgba(" + col + ",1)"; ctx.shadowBlur = (active ? 14 : 5) * fade;
  ctx.strokeRect(h.x0, top, h.x1 - h.x0, bot - top);
  ctx.shadowBlur = 0;
  // interior guide chevrons pointing UP into her — the way in
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const ph = (now * 1.2 + i / 3) % 1;
    ctx.globalAlpha = (active ? (0.25 + 0.6 * (1 - ph)) : 0.2) * fade;
    const yy = bot - 8 - ph * (bot - top - 12);
    ctx.beginPath();
    ctx.moveTo(h.cx - 11, yy + 6); ctx.lineTo(h.cx, yy); ctx.lineTo(h.cx + 11, yy + 6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // hover-hold progress ring, inside the bay — gone the instant she captures you
  if (active && level.extraction && level.extraction.hold > 0 && !level.extraction.done) {
    ctx.strokeStyle = "rgba(" + col + ",1)"; ctx.shadowColor = "rgba(" + col + ",1)"; ctx.shadowBlur = 10;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(h.cx, h.cy, 18, -Math.PI / 2,
      -Math.PI / 2 + Math.min(1, level.extraction.hold / 1.2) * Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  if (fade > 0.5) {
    ctx.globalAlpha = fade;
    ctx.font = "600 9px Menlo, monospace"; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(" + col + "," + (active ? 0.9 : 0.5) + ")";
    ctx.fillText(active ? "VENTRAL HANGAR" : "⇧ HANGAR · EARLY EXTRACTION", h.cx, bot + 20);
  }
  ctx.restore();
}

/* S4 — the bay doors sliding shut over the captured ship, just before the jump.
   Drawn AFTER the ship so they occlude it — she closes up, then jets away. */
function drawBayDoors(now) {
  const h = hangarRect();
  const bt = level.extraction.beatT;
  const close = clamp((bt - 0.4) / 0.45, 0, 1);   // shut from ~0.4s to ~0.85s
  const fade = bayFade();
  if (close <= 0 || fade <= 0) return;
  const top = h.top, bot = h.bot, halfW = (h.x1 - h.x0) / 2;
  const dw = halfW * close;   // each door's reach toward centre
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = "rgba(6,18,26,1)";           // hull-dark door panels
  ctx.strokeStyle = "rgba(0,229,255,.9)"; ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  // left door slides right, right door slides left
  ctx.fillRect(h.x0, top, dw, bot - top);
  ctx.fillRect(h.x1 - dw, top, dw, bot - top);
  // bright leading edges meeting at the seam
  ctx.beginPath();
  ctx.moveTo(h.x0 + dw, top); ctx.lineTo(h.x0 + dw, bot);
  ctx.moveTo(h.x1 - dw, top); ctx.lineTo(h.x1 - dw, bot);
  ctx.stroke();
  ctx.restore();
}

/* S4 — the jump: bright vertical light-streaks trailing under MERCY as she
   accelerates off the top of the world, with a one-beat flash at ignition. */
function drawJumpStreak(now) {
  const { mx, my } = mercyPos();
  const bt = level.extraction.beatT;
  ctx.save();
  // ignition flash — a quick brightening in the first ~0.2s of the jump
  const flash = Math.max(0, 1 - (bt - 0.9) / 0.2);
  if (flash > 0) {
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, 260);
    g.addColorStop(0, "rgba(200,245,255," + (0.5 * flash).toFixed(2) + ")");
    g.addColorStop(1, "rgba(200,245,255,0)");
    ctx.fillStyle = g; ctx.fillRect(mx - 260, my - 260, 520, 520);
  }
  ctx.strokeStyle = "rgba(180,240,255,.85)";
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 18; ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const dx = (i - 3) * 28;
    ctx.globalAlpha = 0.45 + 0.55 * Math.random();
    const len = 200 + Math.random() * 160;
    ctx.beginPath();
    ctx.moveTo(mx + dx, my + 20);
    ctx.lineTo(mx + dx, my + 20 + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  ctx.restore();
}

/* Bundle N1 — the counterfeit MERCY. Rendered with the real ship's own
   silhouette, greebles, bay beam and name plate. ONE difference: the real
   emblem pulses organically (0.55 + 0.45·sin) — this one blinks in perfect
   mechanical unison with the fake fuel pods (sin(now·π·2) > 0), the exact
   tell the game has taught since Avicenna Shoals. */
function drawDecoyMercy(now) {
  const f = level.fakeMercy;
  const bob = Math.sin(now * 1.2 + 2.1) * 4;
  ctx.save();
  ctx.translate(f.x, f.y + bob);
  if (f.dead) {
    // powered down for good: dark hull, Glycon's masked serpent flickering
    // where the emblem hung
    ctx.strokeStyle = "rgba(120,130,160,.35)"; ctx.lineWidth = 2.5;
    ctx.fillStyle = "rgba(8,10,20,.8)";
    mercyHullPath(); ctx.fill(); ctx.stroke();
    mercyGreebles("rgba(120,130,160,.15)");
    const flick = Math.sin(now * 2.3) > 0.9 ? 0.55 : 0.14;
    ctx.strokeStyle = "rgba(198,255,0," + flick.toFixed(2) + ")"; ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.bezierCurveTo(-16, 0, 8, -2, 2, -12);
    ctx.bezierCurveTo(-4, -20, 12, -22, 6, -32);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(6, -38, 6, 0, 7); ctx.stroke();
    ctx.fillStyle = "rgba(198,255,0," + flick.toFixed(2) + ")";
    ctx.fillRect(3, -40, 2.2, 1.4); ctx.fillRect(7.6, -40, 2.2, 1.4);
    ctx.font = "700 10px Menlo, monospace"; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(155,234,249,.22)";
    ctx.fillText("A M S · M E R C Y", 0, 34);
    ctx.restore();
    return;
  }
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 18;
  ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 2.5;
  ctx.fillStyle = "rgba(0,40,60,.55)";
  mercyHullPath();
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  mercyGreebles("rgba(0,229,255,.3)");
  drawGlow(-145, 0, 13, "#00e5ff", 0.45 + 0.25 * Math.sin(now * 4));
  drawGlow(145, 0, 13, "#00e5ff", 0.45 + 0.25 * Math.sin(now * 4 + 1.4));
  const alpha = Math.sin(now * Math.PI * 2) > 0 ? 1 : 0.38;   // machine time
  ctx.save();
  ctx.translate(0, -15);
  ctx.shadowColor = "#ff1744"; ctx.shadowBlur = 16 * alpha + 6;
  drawAsclepius(36, "rgba(255,23,68," + alpha.toFixed(2) + ")");
  ctx.restore();
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 8;
  ctx.fillStyle = "#9beaf9";
  ctx.font = "700 10px Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText("A M S · M E R C Y", 0, 34);
  ctx.shadowBlur = 0;
  // Avicenna's Canon of Truth unmasks this counterfeit like every other
  if (upgrades.canon) {
    ctx.font = "700 14px Menlo, monospace";
    ctx.fillStyle = PAL().REVEAL;
    ctx.fillText("?", 0, -60);
  }
  ctx.restore();
  // identical bay furniture — the lie is complete down to the label
  const b = decoyBayRect();
  drawTractorBeam(b, "0,229,255", now, true, false);
  ctx.font = "600 9px Menlo, monospace"; ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0,229,255,.6)";
  ctx.fillText("RECOVERY BAY", (b.x0 + b.x1) / 2, b.y1 + 14);
  // the observed win in progress: counting the beats from the ground
  if (f.scanT > 0) {
    ctx.save();
    ctx.strokeStyle = "#aef4ff"; ctx.shadowColor = "#aef4ff"; ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y - 44, 16, -Math.PI / 2, -Math.PI / 2 + (f.scanT / SCAN_T) * Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = "700 10px Menlo, monospace"; ctx.textAlign = "center";
    ctx.fillStyle = "#aef4ff";
    ctx.fillText("COUNTING THE BEATS…", ship.x, ship.y - 70);
    ctx.restore();
  }
}

function drawBeacon(now) {
  const b = level.beacon;
  ctx.save();
  ctx.translate(b.x, b.y);
  const col = b.resolved ? "#69f0ae" : "#b388ff";
  ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-14, 0); ctx.lineTo(-4, -56); ctx.lineTo(4, -56); ctx.lineTo(14, 0);
  ctx.moveTo(-9, -20); ctx.lineTo(9, -20);
  ctx.moveTo(-6, -40); ctx.lineTo(6, -40);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -62, 4, 0, 7); ctx.stroke();
  const ringA = b.resolved ? (b.fade || 0) : 1;   // rings fade out through the epilogue (L2)
  if (ringA > 0) {
    // the Static: expanding rings every beat
    const ph = (now % 1.6) / 1.6;
    for (let k = 0; k < 3; k++) {
      const p = (ph + k / 3) % 1;
      ctx.globalAlpha = (1 - p) * 0.5 * ringA;
      ctx.beginPath(); ctx.arc(0, -62, 10 + p * 130, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (!b.resolved) {
    if (b.silenceT > 0) {
      ctx.strokeStyle = "#aef4ff"; ctx.shadowColor = "#aef4ff";
      ctx.beginPath();
      ctx.arc(0, -62, 20, -Math.PI / 2, -Math.PI / 2 + (b.silenceT / 5) * Math.PI * 2);
      ctx.stroke();
      ctx.font = "700 11px Menlo, monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "#aef4ff";
      ctx.fillText("ANSWERING… " + Math.round(b.silenceT / 5 * 100) + "%", 0, -104);
    } else {
      ctx.font = "600 9px Menlo, monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "rgba(179,136,255,.7)";
      ctx.fillText("THE SIGNAL SOURCE — land beside it, or open fire", 0, -104);
    }
  }
  ctx.restore();
}

/* ---------------- HUD ---------------- */
function drawHUD(now) {
  const s = ship;
  const topPad = 14;
  const hx = 14 + saLeft;
  // a soft scrim behind the top HUD band so the fuel bar / tally / score
  // stay legible when MERCY's hull or scenery renders straight through them
  // at a high-camera spawn (the first frame a reviewer sees)
  const scrim = ctx.createLinearGradient(0, 0, 0, 62);
  scrim.addColorStop(0, "rgba(3,4,12,.55)");
  scrim.addColorStop(1, "rgba(3,4,12,0)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, vw, 62);
  ctx.font = "700 12px Menlo, monospace";

  // S7 — sabotage vignette: a red pulse at the screen edges so a fuel-line cut
  // or a cabin kill is never something you discover from the score readout.
  // REDUCED FLASH halves it.
  if (sabotageFlash > 0 && (state === "play" || state === "dead")) {
    const a = (sabotageFlash / 0.5) * (reducedFlash ? 0.18 : 0.36);
    const vg = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.32,
                                        vw / 2, vh / 2, Math.max(vw, vh) * 0.72);
    vg.addColorStop(0, "rgba(255,23,68,0)");
    vg.addColorStop(1, "rgba(255,23,68," + a.toFixed(3) + ")");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, vw, vh);
  }

  const bw = Math.min(150, vw * 0.3);
  // the fuel bar flashes red on sabotage — the cut is felt at the gauge, too
  const fuelFlash = sabotageFlash > 0 && Math.sin(now * 34) > 0;
  drawBar(hx, topPad, bw, 10, s.fuel / maxFuel(), fuelFlash ? "#ff4081" : "#ffc400", "FUEL");
  drawECG(vw - bw - 14 - saRight, topPad, bw, 26, s.vitals / maxVitals(), now);

  if (state === "play") {
    // U4 — a second playtester independently missed the pause button, so the R4
    // stroked box is escalated to a filled, higher-contrast pill. pauseRect()
    // already clears the score readout and the FUEL/ECG bars at a 320-high
    // viewport (it sits 6px left of the ECG bar); this is purely a visibility
    // bump — a rounded fill + bright stroke reads as a real button.
    const pr = pauseRect(), rr = 7;
    ctx.save();
    ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(pr.x + rr, pr.y);
    ctx.arcTo(pr.x + pr.w, pr.y, pr.x + pr.w, pr.y + pr.h, rr);
    ctx.arcTo(pr.x + pr.w, pr.y + pr.h, pr.x, pr.y + pr.h, rr);
    ctx.arcTo(pr.x, pr.y + pr.h, pr.x, pr.y, rr);
    ctx.arcTo(pr.x, pr.y, pr.x + pr.w, pr.y, rr);
    ctx.closePath();
    ctx.fillStyle = "rgba(0,120,150,.6)";
    ctx.strokeStyle = "rgba(130,242,255,.95)"; ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#eaffff";
    ctx.font = "700 15px Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("❚❚", pr.x + pr.w / 2, pr.y + pr.h / 2 + 6);
    ctx.restore();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#9beaf9"; ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 6;
  ctx.fillText(String(score).padStart(6, "0"), vw / 2, topPad + 10);
  ctx.font = "600 9px Menlo, monospace";
  ctx.fillStyle = "rgba(155,234,249,.7)";
  let mid = SECTOR_NAMES[levelIdx] + (level.isCave ? " · THE HOLLOWS" : "") +
    "  ·  ♥ " + lives + (assist ? "  ·  ASSIST" : "");
  if (blackboxCount > 0) mid += "  ·  ◈ " + blackboxCount + "/" + NBOX;
  if (dailyMod("stopwatch") && !level.isCave)
    mid += "  ·  ⏱ " + (sectorT < 90 ? Math.ceil(90 - sectorT) : "—");
  // the sector label itself glitches for a beat when the Static fires (I2);
  // REDUCED FLASH keeps the corruption sparse instead of a full scramble
  if (staticGlitchT > 0)
    mid = mid.replace(/[A-Z0-9]/g, c =>
      Math.random() < (reducedFlash ? 0.06 : 0.2) ? "▓▒░#%"[Math.floor(Math.random() * 5)] : c);
  ctx.fillText(mid, vw / 2, topPad + 23);
  ctx.shadowBlur = 0;

  const tl = acctLevel();
  // A Vector is not a Scion to be saved — once you've identified one (contained
  // it in the red bay, or scanned-and-flagged it to leave on the ground) it
  // drops out of the "to save" denominator, so the tally counts genuine
  // survivors, not MERCY's opening headcount: 5/6 with one contained reads 5/5.
  let vectorsKnown = tl.contained;
  for (const o of tl.oids)
    if (o.role === "saboteur" && o.state === "wait" && o.flagged) vectorsKnown++;
  const savable = Math.max(tl.delivered, tl.total - vectorsKnown);
  ctx.textAlign = "left";
  ctx.font = "700 11px Menlo, monospace";
  ctx.fillStyle = "#69f0ae"; ctx.shadowColor = "#69f0ae"; ctx.shadowBlur = 6;
  const rescueLine = "SCIONS ABOARD " + s.passengers.length + "  ·  SAVED " + tl.delivered + "/" + savable;
  ctx.fillText(rescueLine, hx, topPad + 34);
  let tallyOff = ctx.measureText(rescueLine).width;
  if (tl.lost > 0) {
    ctx.fillStyle = "#ff4081"; ctx.shadowColor = "#ff4081";
    const lostStr = "  ·  ✝ LOST " + tl.lost;
    ctx.fillText(lostStr, hx + tallyOff, topPad + 34);
    tallyOff += ctx.measureText(lostStr).width;
  }
  if (tl.contained > 0) {
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.shadowColor = "transparent";
    ctx.fillText("  ·  ⊘ CONTAINED " + tl.contained, hx + tallyOff, topPad + 34);
  }
  ctx.shadowBlur = 0;

  if (mercyBreach) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4081"; ctx.shadowColor = "#ff4081"; ctx.shadowBlur = 10;
    ctx.font = "800 14px Menlo, monospace";
    ctx.fillText("⚠ BREACH — SEAL IN THE RED BAY " + Math.ceil(mercyBreach.t) + "s", vw / 2, topPad + 44);
    ctx.shadowBlur = 0;
  } else if (level.extraction && !level.extraction.done && state === "play" && Math.sin(now * 5) > -0.3) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffc400"; ctx.shadowColor = "#ffc400"; ctx.shadowBlur = 10;
    ctx.font = "800 13px Menlo, monospace";
    ctx.fillText("⚠ EXTRACTION — FLY INTO MERCY'S HANGAR", vw / 2, topPad + 44);
    ctx.shadowBlur = 0;
  } else if (level.contamKnown && contaminantAboard() && Math.sin(now * 6) > 0) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4081"; ctx.shadowColor = "#ff4081"; ctx.shadowBlur = 10;
    ctx.font = "800 13px Menlo, monospace";
    ctx.fillText("⚠ CONTAMINANT ABOARD — SEAL IT IN THE RED BAY", vw / 2, topPad + 44);
    ctx.shadowBlur = 0;
  } else if ((s.fuel < 20 || s.vitals < 30) && Math.sin(now * 8) > 0 && state === "play") {
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4081"; ctx.shadowColor = "#ff4081"; ctx.shadowBlur = 10;
    ctx.font = "800 13px Menlo, monospace";
    ctx.fillText(s.vitals < 30 ? "⚠ VITALS CRITICAL" : "⚠ LOW FUEL", vw / 2, topPad + 44);
    ctx.shadowBlur = 0;
  }

  if (PERF) {
    ctx.textAlign = "right";
    ctx.font = "700 11px Menlo, monospace";
    ctx.fillStyle = perfFrameMs > 20 ? "#ff4081" : "#69f0ae";
    ctx.fillText(perfFrameMs.toFixed(1) + "ms · " + Math.round(perfFps) + " FPS",
      vw - 14 - saRight, topPad + 40);
  }
}

function drawBar(x, y, w, h, frac, color, label) {
  ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.fillRect(x + 1, y + 1, (w - 2) * clamp(frac, 0, 1), h - 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.font = "600 8px Menlo, monospace"; ctx.textAlign = "left";
  ctx.fillText(label, x, y + h + 9);
}

/* Live ECG as the health bar. Beat rate rises as vitals fall;
   a contaminant aboard shows as an arrhythmia — the medical tell. */
function drawECG(x, y, w, h, frac, now) {
  const P = PAL();
  const color = frac > 0.55 ? P.SAFE : frac > 0.3 ? P.WARN : P.DANGER;
  ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  const bpm = lerp(3.4, 1.2, clamp(frac, 0, 1)) + (ship.beat > 0 ? 2 : 0);
  // the counterfeit bay reads on the ECG exactly like a contaminant (N2)
  const arrhythmia = state !== "title" && (contaminantAboard() || decoySnared());
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h); ctx.clip();
  ctx.beginPath();
  const mid = y + h * 0.6;
  for (let px = 0; px <= w; px += 2) {
    const t = (now * 90 - (w - px)) / 90 * bpm;
    let ph = ((t % 1) + 1) % 1;
    // every third beat arrives early when something is wrong aboard
    if (arrhythmia && Math.floor(t) % 3 === 2) ph = (ph * 1.7) % 1;
    let v = 0;
    if (ph < 0.08) v = -0.2;
    else if (ph < 0.14) v = 1.0;
    else if (ph < 0.18) v = -0.45;
    else if (ph < 0.3) v = 0.18;
    v *= (frac > 0 ? 1 : 0);
    let yy = mid - v * h * 0.55;
    // the Static's surge rides the trace itself (Bundle I2)
    if (staticSurge > 0) yy += (Math.random() * 2 - 1) * Math.min(1, staticSurge) * (reducedFlash ? 0.5 : 1.4);
    px === 0 ? ctx.moveTo(x + px, yy) : ctx.lineTo(x + px, yy);
  }
  ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.font = "600 8px Menlo, monospace"; ctx.textAlign = "right";
  ctx.fillText("VITALS " + Math.max(0, Math.round(frac * 100)) + "%", x + w, y + h + 9);
}

/* U3 (annotated) — the HUD guide. Instead of a wall of prose it lays the real
   readouts out where they actually sit on screen and names each one, so a new
   player can map word to widget. No spoilers (the Static clock is learned in
   play, not here); every element is covered, ASSIST included. */
function drawHudGuide(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(5,6,15,.96)";
  ctx.fillRect(0, 0, vw, vh);
  const L = saLeft, R = saRight, cyan = "#00e5ff";
  const head = "#bfefff", dim = "rgba(199,232,255,.62)";
  const bw = Math.min(150, vw * 0.3);
  const F = b => "700 " + bodyFontPx(b) + "px Menlo, monospace";
  const Fd = b => "600 " + bodyFontPx(b) + "px Menlo, monospace";
  // a widget-adjacent label: bright title, dimmer wrapped description
  function lab(x, y, align, title, desc, descW) {
    ctx.textAlign = align;
    ctx.fillStyle = head; ctx.font = F(8);
    ctx.fillText(title, x, y);
    ctx.fillStyle = dim; ctx.font = Fd(8);
    wrapText(desc, descW || 160).slice(0, 3).forEach((ln, i) => ctx.fillText(ln, x, y + 13 + i * 11));
  }

  // ---- header ----
  ctx.textAlign = "center";
  ctx.fillStyle = cyan; ctx.shadowColor = cyan; ctx.shadowBlur = 8; ctx.font = F(11);
  ctx.fillText("◎ HUD GUIDE — what every readout means", vw / 2, 18);
  ctx.shadowBlur = 0;

  // ---- the real top band, drawn where it sits in flight ----
  const topY = 32;
  drawBar(14 + L, topY, bw, 10, 0.62, "#ffc400", "");
  drawECG(vw - bw - 14 - R, topY, bw, 26, 0.86, now);
  const pX = vw - bw - 14 - R - 40;   // pause pill, just left of the ECG
  ctx.fillStyle = "rgba(0,120,150,.6)"; ctx.strokeStyle = "rgba(130,242,255,.95)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.rect(pX, topY - 2, 30, 20); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#eaffff"; ctx.font = F(9); ctx.textAlign = "center"; ctx.fillText("❚❚", pX + 15, topY + 12);
  ctx.fillStyle = "#9beaf9"; ctx.shadowColor = cyan; ctx.shadowBlur = 6; ctx.font = F(11); ctx.textAlign = "center";
  ctx.fillText("004200", vw / 2, topY + 8); ctx.shadowBlur = 0;
  ctx.font = Fd(8); ctx.fillStyle = "rgba(155,234,249,.7)";
  ctx.fillText("VESALIUS RIDGE · ♥3 · ASSIST · ◈2/7", vw / 2, topY + 20);

  // ---- labels for the top band (below the ECG's own VITALS% readout) ----
  const topLabY = topY + 54;
  lab(14 + L, topLabY, "left", "FUEL",
    "Thrust and shield burn it. Run dry and you're grounded until you signal a resupply line.", Math.max(160, bw + 50));
  lab(vw / 2, topLabY, "center", "SCORE LINE",
    "Score · sector name · ♥ lives · ◈ black boxes. ASSIST shows when gentler capture is on (toggle in SETTINGS).", 250);
  lab(vw - 14 - R, topLabY, "right", "VITALS  +  ❚❚ PAUSE",
    "Your pulse as an ECG — it quickens as you fail; a stutter means something wrong is aboard. PAUSE sits just left of it.", Math.max(160, bw + 60));

  // ---- centre: ship + the landing guide, centred in the gap between the top
  //      labels and the bottom controls so it never collides on a short landscape ----
  const bandTop = topLabY + 34, bandBot = vh - 28 - 44;
  const sx = vw / 2, sy = clamp((bandTop + bandBot) / 2 - 12, bandTop + 24, bandBot - 46);
  ctx.save(); ctx.translate(sx, sy);
  ctx.strokeStyle = cyan; ctx.shadowColor = cyan; ctx.shadowBlur = 10; ctx.lineWidth = 2; ctx.fillStyle = "rgba(0,229,255,.12)";
  ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(9, 9); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.lineTo(-9, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "#69f0ae"; ctx.shadowColor = "#69f0ae"; ctx.shadowBlur = 8; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sx - 12, sy + 22); ctx.lineTo(sx + 12, sy + 22); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = "#69f0ae"; ctx.font = F(9); ctx.textAlign = "left"; ctx.fillText("✓ ↓2  ↔1", sx + 20, sy + 2);
  lab(sx, sy + 42, "center", "LANDING GUIDE",
    "Under the ship on approach: ↓ descent · ↔ drift. GREEN = safe to touch down.", 240);

  // ---- bottom controls: clean rows (left = turn, right = act), each labelled
  //      above so nothing overlaps on a short landscape viewport ----
  const by = vh - 28;
  const circ = (cx2, cy2, r, col, txt, fs) => {
    ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = col; ctx.textAlign = "center"; ctx.font = F(fs); ctx.fillText(txt, cx2, cy2 + 3);
  };
  circ(40 + L, by, 15, "rgba(0,229,255,.85)", "↺", 12);
  circ(82 + L, by, 15, "rgba(0,229,255,.85)", "↻", 12);
  lab(24 + L, by - 44, "left", "ROTATE", "Turn the ship left / right.", 170);
  // right cluster as a row, THRUST kept rightmost as in flight
  const sX2 = vw - 132 - R, fX = vw - 86 - R, tX = vw - 40 - R;
  circ(sX2, by, 15, "rgba(105,240,174,.85)", "⛨", 9);
  circ(fX, by, 15, "rgba(255,64,129,.85)", "◉", 9);
  circ(tX, by, 15, "rgba(255,196,0,.85)", "▲", 10);
  lab(vw - 14 - R, by - 44, "right", "SHIELD · FIRE · THRUST",
    "Hold SHIELD (force field) · FIRE costs points · THRUST to fly.", 250);

  // ---- footer ----
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255," + (0.5 + 0.4 * Math.sin(now * 4)).toFixed(2) + ")";
  ctx.font = F(9); ctx.fillText("tap to continue", vw / 2, vh - 8);
}

/* ---------------- screens ---------------- */
function drawTitle(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(5,6,15,.72)";
  ctx.fillRect(0, 0, vw, vh);
  ctx.textAlign = "center";
  const pulse = 0.7 + 0.3 * Math.sin(now * 2);
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 30 * pulse;
  ctx.fillStyle = "#aef4ff";
  // narrow screens shrink the wordmark so it clears the corner pills
  ctx.font = "900 " + Math.min(60, vw * (vw < 640 ? 0.085 : 0.12)) + "px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("Hollow Oath", vw / 2, vh * 0.32);
  ctx.shadowBlur = 10;
  ctx.font = "600 13px Menlo, monospace";
  ctx.fillStyle = "#9beaf9";
  ctx.fillText("a gravity rescue — a love letter to the 16-bit lander classics", vw / 2, vh * 0.4);
  ctx.fillStyle = unresolvedHaunt ? "#b388ff" : "#69f0ae";
  ctx.shadowColor = unresolvedHaunt ? "#b388ff" : "#69f0ae";
  ctx.fillText(unresolvedHaunt ? "the Static answers still — every 41 seconds"
                               : "seven sectors · something is repeating every 41 seconds", vw / 2, vh * 0.47);
  ctx.fillStyle = "#ffc400"; ctx.shadowColor = "#ffc400";
  ctx.fillText("not every Scion you rescue is what it seems", vw / 2, vh * 0.54);
  // R5 — the primary call to action is an explicit pill now (tap-anywhere no
  // longer launches). Drawn as the pulsing focus of the screen.
  const sr = startRect();
  ctx.strokeStyle = "rgba(255,255,255," + (0.55 + 0.35 * Math.sin(now * 2)).toFixed(2) + ")";
  ctx.shadowColor = "#fff"; ctx.shadowBlur = 14; ctx.lineWidth = 2;
  ctx.strokeRect(sr.x, sr.y, sr.w, sr.h);
  ctx.font = "800 16px Menlo, monospace";
  ctx.fillStyle = "#eaf6ff";
  ctx.fillText("▶ START NEW FLIGHT", sr.x + sr.w / 2, sr.y + sr.h / 2 + 6);
  ctx.shadowBlur = 0;

  // build stamp + hi score along the bottom edge, out of the CTA's way
  ctx.textAlign = "right";
  ctx.font = "600 9px Menlo, monospace";
  ctx.fillStyle = "rgba(155,234,249,.3)";
  ctx.fillText(BUILD_TAG, vw - 12 - saRight, vh - 10);
  ctx.textAlign = "left";
  ctx.font = "600 11px Menlo, monospace";
  ctx.fillStyle = "rgba(155,234,249,.55)";
  ctx.fillText("hi score " + hiscore, 12 + saLeft, vh - 10);
  ctx.textAlign = "center";

  // settings pill (sound, music, assist, tilt, ...)
  const r = settingsRect();
  ctx.strokeStyle = "rgba(0,229,255,.7)";
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 10;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.font = "700 12px Menlo, monospace";
  ctx.fillStyle = "#7fe9ff";
  ctx.fillText("⚙ SETTINGS", r.x + r.w / 2, r.y + 22);
  ctx.shadowBlur = 0;

  const hr = helpRect();
  ctx.strokeStyle = "rgba(0,229,255,.7)";
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 10;
  ctx.strokeRect(hr.x, hr.y, hr.w, hr.h);
  ctx.fillStyle = "#7fe9ff";
  ctx.fillText("✦ HOW TO FLY", hr.x + hr.w / 2, hr.y + 22);
  ctx.shadowBlur = 0;

  // story pill — replay the opening narrative
  const str = storyRect();
  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.strokeRect(str.x, str.y, str.w, str.h);
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillText("▸ STORY", str.x + str.w / 2, str.y + 22);

  // U3 — the HUD-legend pill, beside HOW TO FLY
  const lr = legendRect();
  ctx.strokeStyle = "rgba(0,229,255,.7)";
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 10;
  ctx.strokeRect(lr.x, lr.y, lr.w, lr.h);
  ctx.fillStyle = "#7fe9ff";
  ctx.font = "700 12px Menlo, monospace";
  ctx.fillText("◎ HUD GUIDE", lr.x + lr.w / 2, lr.y + 22);
  ctx.shadowBlur = 0;

  // codex pill — minds recovered + the signal archive, across all runs (K3)
  const cr = codexRect();
  const any = codex.size > 0 || logsSeen.size > 0;
  ctx.strokeStyle = any ? "rgba(255,213,79,.75)" : "rgba(255,255,255,.3)";
  ctx.shadowColor = any ? "#ffd54f" : "transparent"; ctx.shadowBlur = any ? 10 : 0;
  ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
  ctx.fillStyle = any ? "#ffd54f" : "rgba(255,255,255,.45)";
  ctx.fillText("⚕ " + codex.size + "/" + FAMOUS.length + " · ◈ " + logsSeen.size + "/" + FRAGMENTS.length,
    cr.x + cr.w / 2, cr.y + 22);
  ctx.shadowBlur = 0;

  if (pad.connected) {
    ctx.font = "600 11px Menlo, monospace";
    ctx.fillStyle = "rgba(105,240,174,.75)";
    ctx.fillText("🎮 controller connected — stick steers · A thrust · X fire · LB/B shield",
      vw / 2, vh * 0.575);
  }

  // resume pill — a run was checkpointed at a sector boundary
  if (savedRun) {
    const rr = resumeRect();
    ctx.strokeStyle = "rgba(255,213,79,.85)"; ctx.shadowColor = "#ffd54f"; ctx.shadowBlur = 12;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rr.x, rr.y, rr.w, rr.h);
    ctx.font = "700 13px Menlo, monospace";
    ctx.fillStyle = "#ffd54f";
    ctx.fillText("▶ RESUME — " + SECTOR_NAMES[savedRun.levelIdx], rr.x + rr.w / 2, rr.y + 22);
    ctx.shadowBlur = 0;
  }

  // remix + daily pills (Bundle M): new rotations for pilots who finished one
  ctx.font = "700 12px Menlo, monospace";
  if (veteran) {
    const xr = remixRect();
    ctx.strokeStyle = "rgba(105,240,174,.7)"; ctx.shadowColor = "#69f0ae"; ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(xr.x, xr.y, xr.w, xr.h);
    ctx.fillStyle = "#69f0ae";
    ctx.fillText("⟳ REMIX ROTATION", xr.x + xr.w / 2, xr.y + 20);
    ctx.shadowBlur = 0;
  }
  const dr2 = dailyRect();
  const doneToday = dailyDoneToday();
  ctx.strokeStyle = doneToday ? "rgba(255,255,255,.3)" : "rgba(255,196,0,.7)";
  ctx.shadowColor = doneToday ? "transparent" : "#ffc400"; ctx.shadowBlur = doneToday ? 0 : 8;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(dr2.x, dr2.y, dr2.w, dr2.h);
  ctx.fillStyle = doneToday ? "rgba(255,255,255,.45)" : "#ffc400";
  ctx.fillText(doneToday ? "☀ DAILY ✓ " + ((loadDaily() || {}).score || 0)
                         : "☀ DAILY FLIGHT", dr2.x + dr2.w / 2, dr2.y + 20);
  ctx.shadowBlur = 0;
}

/* the codex (Bundle K2): two tabs — MINDS (famous Scions recovered across
   every run) and ARCHIVE (every log fragment and shrine card ever read,
   re-readable forever; the Static's story stops evaporating) */
let codexTab = 0, archivePage = 0, mindsPage = 0;
const ARCHIVE_PER_PAGE = 4;
const MINDS_PER_PAGE = 6;
/* R7 — the reveal card opened by tapping a codex entry. Drawn over the codex
   via drawCardPanel; any tap closes it back to the codex, not the title. */
let codexCard = null;
function codexPanelRect() {
  const w = Math.min(640, vw - 36);
  const h = Math.min(vh - 20, 470);
  return { x: (vw - w) / 2, y: Math.max(10, (vh - h) / 2), w, h };
}
function codexTabRect(i) {
  const p = codexPanelRect();
  const w = 132;
  return { x: p.x + p.w / 2 + (i === 0 ? -w - 8 : 8), y: p.y + 32, w, h: 26 };
}
function mindRowH() {
  const p = codexPanelRect();
  return Math.max(34, Math.min(46, (p.h - 130) / MINDS_PER_PAGE));
}
function codexMindRowRect(k) {
  const p = codexPanelRect();
  return { x: p.x + 14, y: p.y + 84 + k * mindRowH(), w: p.w - 28, h: mindRowH() };
}
function codexArchiveSlotRect(k) {
  const p = codexPanelRect();
  const slotH = (p.h - 118) / ARCHIVE_PER_PAGE;
  return { x: p.x + 16, y: p.y + 84 + k * slotH, w: p.w - 32, h: slotH };
}
/* explicit page arrows (R7) — replace ARCHIVE's old left/right half-tap
   paging, which now conflicts with tapping an entry open */
function codexArrowRect(dir) {   // dir: -1 previous, +1 next
  const p = codexPanelRect();
  const w = 40, h = 30, m = 14;
  return { x: dir < 0 ? p.x + m : p.x + p.w - m - w, y: p.y + p.h - h - 6, w, h };
}
function drawCodexArrows() {
  [-1, 1].forEach(d => {
    const r = codexArrowRect(d);
    ctx.strokeStyle = "rgba(255,213,79,.6)"; ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "#ffd54f"; ctx.textAlign = "center";
    ctx.font = "700 16px Menlo, monospace";
    ctx.fillText(d < 0 ? "‹" : "›", r.x + r.w / 2, r.y + r.h / 2 + 6);
  });
}
function archiveCardFor(idx) {
  if (idx < FRAGMENTS.length) {
    return { kicker: "SIGNAL ARCHIVE · LOG " + String(idx + 1).padStart(2, "0"),
      title: "", subtitle: "",
      // one sentence per line for emphasis — break after . ! ? that end a
      // sentence (a space + a capital or quote follows), so "matches... us."
      // and other ellipses stay intact. wrapText still wraps long sentences.
      body: FRAGMENTS[idx].replace(/^LOG \d+ \/\/ /, "")
        .replace(/([.!?]) (?=[A-Z"“'])/g, "$1\n"), color: "#b388ff", page: 0 };
  }
  const c = SHRINES[idx - FRAGMENTS.length];
  return { kicker: c.kicker, title: c.title, subtitle: "", body: c.body, color: c.color, page: 0 };
}
function archiveEntries() {
  const out = [];
  for (let i = 0; i < FRAGMENTS.length; i++) {
    const on = logsSeen.has(i);
    out.push({
      title: "LOG " + String(i + 1).padStart(2, "0"),
      body: on ? FRAGMENTS[i].replace(/^LOG \d+ \/\/ /, "") : "— signal not yet recovered —",
      on, shrine: false
    });
  }
  for (let ci = 0; ci < SHRINES.length; ci++) {
    const on = shrinesSeen.has(ci);
    out.push({
      title: on ? SHRINES[ci].kicker + " — " + SHRINES[ci].title
                : "THE HOLLOWS · " + ["I", "II", "III"][ci],
      body: on ? SHRINES[ci].body.split("\n")[0] : "— not yet descended —",
      on, shrine: true
    });
  }
  // S8 — a 15th, unresolvable entry once the WORKSHOP proves the counterfeits
  // were built, not rescued: the missing originals. The file 1.2 will open.
  if (shrinesSeen.has(1))
    out.push({ title: "MANIFEST DISCREPANCY", body: "— file remains open —", on: false, shrine: true });
  return out;
}
function updateCodex() {
  // a reveal card is open on top of the codex — any tap pages it or closes
  // it back to the codex (never straight to the title)
  if (codexCard) {
    if (input.tap && stateT > 0.2) {
      if ((codexCard.pages || 1) > 1 && (codexCard.page || 0) < codexCard.pages - 1) {
        codexCard.page++; blip(440, 550, 0.06, "sine", 0.06);
      } else { codexCard = null; blip(400, 300, 0.06, "sine", 0.06); }
    }
    input.tap = false;
    return;
  }
  if (input.tap && stateT > 0.35) {
    const p = codexPanelRect();
    const px = input.tapX, py = input.tapY;
    if (inRect(codexTabRect(0), px, py)) {
      codexTab = 0; blip(500, 750, 0.08, "sine", 0.07);
    } else if (inRect(codexTabRect(1), px, py)) {
      codexTab = 1; blip(500, 750, 0.08, "sine", 0.07);
    } else {
      const entries = archiveEntries();
      const pages = codexTab === 0 ? Math.ceil(FAMOUS.length / MINDS_PER_PAGE)
                                   : Math.ceil(entries.length / ARCHIVE_PER_PAGE);
      let handled = false;
      if (pages > 1 && inRect(codexArrowRect(-1), px, py)) {
        if (codexTab === 0) mindsPage = (mindsPage + pages - 1) % pages;
        else archivePage = (archivePage + pages - 1) % pages;
        blip(440, 550, 0.06, "sine", 0.06); handled = true;
      } else if (pages > 1 && inRect(codexArrowRect(1), px, py)) {
        if (codexTab === 0) mindsPage = (mindsPage + 1) % pages;
        else archivePage = (archivePage + 1) % pages;
        blip(440, 550, 0.06, "sine", 0.06); handled = true;
      } else if (codexTab === 0) {
        const start = mindsPage * MINDS_PER_PAGE;
        for (let k = 0; k < MINDS_PER_PAGE; k++) {
          const i = start + k;
          if (i >= FAMOUS.length) break;
          if (codex.has(i) && inRect(codexMindRowRect(k), px, py)) {
            const f = FAMOUS[i];
            codexCard = { kicker: "FROM THE CODEX", title: f.name, subtitle: f.era,
              body: f.story + "\n\n★ " + f.upgradeName + " — " + f.upgradeDesc,
              color: "#ffd54f", page: 0 };
            blip(550, 825, 0.08, "sine", 0.07); handled = true; break;
          }
        }
      } else {
        const start = archivePage * ARCHIVE_PER_PAGE;
        for (let k = 0; k < ARCHIVE_PER_PAGE; k++) {
          const idx = start + k;
          if (idx >= entries.length) break;
          if (entries[idx].on && inRect(codexArchiveSlotRect(k), px, py)) {
            codexCard = archiveCardFor(idx);
            blip(550, 825, 0.08, "sine", 0.07); handled = true; break;
          }
        }
      }
      if (!handled && !inRect(p, px, py)) { state = "title"; stateT = 0.7; }
    }
  }
  input.tap = false;
}
function drawCodex(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(5,6,15,.82)";
  ctx.fillRect(0, 0, vw, vh);
  const p = codexPanelRect();
  ctx.fillStyle = "rgba(8,10,26,.94)";
  ctx.strokeStyle = "#ffd54f"; ctx.shadowColor = "#ffd54f"; ctx.shadowBlur = 16;
  ctx.lineWidth = 2;
  ctx.fillRect(p.x, p.y, p.w, p.h); ctx.strokeRect(p.x, p.y, p.w, p.h);
  ctx.shadowBlur = 4;
  ctx.textAlign = "center";
  ctx.font = "800 15px Menlo, monospace";
  ctx.fillStyle = "#ffd54f";
  ctx.fillText("MEDICAL CODEX", vw / 2, p.y + 22);
  ctx.shadowBlur = 0;
  const tabs = ["⚕ MINDS", "◈ ARCHIVE"];
  for (let i = 0; i < 2; i++) {
    const r = codexTabRect(i), on = codexTab === i;
    ctx.strokeStyle = on ? "rgba(255,213,79,.9)" : "rgba(255,255,255,.25)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.font = "700 11px Menlo, monospace";
    ctx.fillStyle = on ? "#ffd54f" : "rgba(255,255,255,.45)";
    ctx.fillText(tabs[i], r.x + r.w / 2, r.y + 17);
  }
  if (codexTab === 0) drawCodexMinds(p); else drawCodexArchive(p);
  ctx.textAlign = "center";
  ctx.font = "700 11px Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255," + (0.5 + 0.4 * Math.sin(now * 4)).toFixed(2) + ")";
  const entryCount = codexTab === 0 ? codex.size : (logsSeen.size + shrinesSeen.size);
  ctx.fillText(entryCount > 0 ? "tap an entry to read · tap outside to close"
                              : "tap outside to close", vw / 2, p.y + p.h - 10);
  // R7 — a tapped entry opens its reveal card on top of the codex
  if (codexCard) drawCardPanel(codexCard, now);
}
function drawCodexMinds(p) {
  const pages = Math.ceil(FAMOUS.length / MINDS_PER_PAGE);
  mindsPage = clamp(mindsPage, 0, pages - 1);
  ctx.font = "600 10px Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillText("the minds recovered · " + codex.size + "/" + FAMOUS.length +
    (pages > 1 ? " · page " + (mindsPage + 1) + "/" + pages : "") + " · all runs", vw / 2, p.y + 74);
  const rowH = mindRowH();
  const start = mindsPage * MINDS_PER_PAGE;
  for (let k = 0; k < MINDS_PER_PAGE; k++) {
    const i = start + k;
    if (i >= FAMOUS.length) break;
    const ry = p.y + 84 + k * rowH;
    const found = codex.has(i);
    if (k > 0) {
      ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x + 16, ry); ctx.lineTo(p.x + p.w - 16, ry); ctx.stroke();
    }
    iDoid(p.x + 34, ry + rowH * 0.66, Math.min(1.7, rowH / 28), i * 1.3, found, found);
    ctx.textAlign = "left";
    ctx.font = "700 12px Menlo, monospace";
    ctx.fillStyle = found ? "#ffe9a8" : "rgba(255,255,255,.3)";
    ctx.shadowColor = found ? "#ffd54f" : "transparent"; ctx.shadowBlur = found ? 6 : 0;
    // name and era on fixed baselines ≥14px apart, independent of row height
    ctx.fillText(found ? FAMOUS[i].name : "UNIDENTIFIED", p.x + 60, ry + 16);
    ctx.shadowBlur = 0;
    ctx.font = "600 10px Menlo, monospace";
    ctx.fillStyle = found ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.22)";
    ctx.fillText(found ? FAMOUS[i].era : "somewhere out there", p.x + 60, ry + 31);
    ctx.textAlign = "right";
    ctx.font = "700 11px Menlo, monospace";
    ctx.fillStyle = found ? "#69f0ae" : "rgba(255,255,255,.25)";
    ctx.fillText(found ? "★ " + FAMOUS[i].upgradeName : "not yet rescued", p.x + p.w - 18, ry + 22);
  }
  if (pages > 1) drawCodexArrows();
  ctx.textAlign = "center";
}
function drawCodexArchive(p) {
  const entries = archiveEntries();
  const pages = Math.ceil(entries.length / ARCHIVE_PER_PAGE);
  archivePage = clamp(archivePage, 0, pages - 1);
  ctx.font = "600 10px Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillText("the signal record · " + logsSeen.size + "/" + FRAGMENTS.length + " logs · " +
    shrinesSeen.size + "/" + SHRINES.length + " shrines · page " + (archivePage + 1) + "/" + pages,
    vw / 2, p.y + 74);
  if (pages > 1) drawCodexArrows();
  const slotH = (p.h - 118) / ARCHIVE_PER_PAGE;
  const maxLines = Math.max(1, Math.floor((slotH - 22) / 14));
  const items = entries.slice(archivePage * ARCHIVE_PER_PAGE, (archivePage + 1) * ARCHIVE_PER_PAGE);
  items.forEach((en, k) => {
    const ey = p.y + 94 + k * slotH;
    ctx.textAlign = "left";
    ctx.font = "700 11px Menlo, monospace";
    ctx.fillStyle = en.on ? (en.shrine ? "#c9a6ff" : "#ffe9a8") : "rgba(255,255,255,.3)";
    ctx.fillText(en.title, p.x + 22, ey);
    ctx.font = "600 11px Menlo, monospace";
    ctx.fillStyle = en.on ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.28)";
    wrapText(en.body, p.w - 44).slice(0, maxLines)
      .forEach((l, li) => ctx.fillText(l, p.x + 22, ey + 15 + li * 14));
  });
  ctx.textAlign = "center";
}

/* ------- illustrated intro panels ------- */
function iShip(cx, cy, s, tilt, flicker) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt || 0);
  ctx.scale(s, s);
  ctx.globalAlpha *= flicker === undefined ? 1 : flicker;
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 18;
  ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 2.5;
  ctx.fillStyle = "rgba(0,40,60,.55)";
  mercyHullPath();
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  mercyGreebles("rgba(0,229,255,.35)");
  ctx.translate(0, -15);
  ctx.shadowColor = "#ff1744"; ctx.shadowBlur = 14;
  drawAsclepius(36, "#ff2d55");
  ctx.restore();
}
function iDoid(cx, cy, s, phase, gold, armsUp) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  const t = performance.now() / 1000 * 5 + phase;
  const w = Math.sin(t) * 3;
  doidFigure({
    col: gold ? "#ffd54f" : "#69f0ae",
    fill: "rgba(10,30,24,.85)",
    emblemCol: "#ff5d7d",
    legPh: 0, sitting: false,
    armL: armsUp ? [-6, -19 - w] : [-7, -8],
    armR: [6, -19 + w],
    blink: ((t * 0.11 + phase) % 3.1) < 0.12,
    sway: Math.sin(t * 0.44) * 1.5
  });
  ctx.restore();
}
function iStars(px, py, pw, ph, seed) {
  const rng = mulberry32(seed);
  ctx.fillStyle = "rgba(200,220,255,.7)";
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.2 + rng() * 0.6;
    ctx.fillRect(px + rng() * pw, py + rng() * ph, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;
}
function iRidge(px, py, pw, ph, seed) {
  const rng = mulberry32(seed);
  ctx.beginPath();
  ctx.moveTo(px, py + ph);
  let y = ph * 0.72;
  for (let x = 0; x <= pw; x += pw / 14) {
    y = clamp(y + (rng() - 0.5) * ph * 0.3, ph * 0.55, ph * 0.9);
    ctx.lineTo(px + x, py + y);
  }
  ctx.lineTo(px + pw, py + ph);
  ctx.closePath();
  ctx.fillStyle = "#151040"; ctx.fill();
  ctx.shadowColor = "#7c4dff"; ctx.shadowBlur = 10;
  ctx.strokeStyle = "#b388ff"; ctx.lineWidth = 2; ctx.stroke();
  ctx.shadowBlur = 0;
}

const INTRO = [
  { title: "THE MISSION",
    caption: "The hospital ship AMS MERCY runs mercy flights through the outer systems. Her holds carry SCIONS — medical androids, each the inheritance of generations of human and machine endeavour, carrying true medical science forward.",
    draw: (px, py, pw, ph, now) => {
      iStars(px, py, pw, ph, 11);
      iShip(px + pw / 2, py + ph * 0.45, Math.min(1.4, pw / 320), 0,
        1);
      ctx.font = "700 10px Menlo, monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "#9beaf9"; ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 6;
      ctx.fillText("A M S · M E R C Y", px + pw / 2, py + ph * 0.45 + 58);
      ctx.shadowBlur = 0;
    } },
  { title: "THE CARGO",
    caption: "Most are standard units. A few carry something rarer — the complete minds of medicine's giants, preserved and still practising. All of them are needed where MERCY is headed.",
    draw: (px, py, pw, ph, now) => {
      iStars(px, py, pw, ph * 0.5, 22);
      ctx.strokeStyle = "rgba(0,229,255,.4)"; ctx.lineWidth = 1.5;
      ctx.strokeRect(px + pw * 0.1, py + ph * 0.25, pw * 0.8, ph * 0.55);
      const n = 6;
      for (let i = 0; i < n; i++) {
        const gold = i === 4;
        iDoid(px + pw * (0.18 + 0.64 * i / (n - 1)), py + ph * 0.72,
          Math.min(2.2, ph / 110), i * 1.3, gold, gold);
      }
      ctx.font = "600 9px Menlo, monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,229,255,.6)";
      ctx.fillText("WARD 7 · CRYOSTASIS", px + pw / 2, py + ph * 0.2);
    } },
  { title: "THE ZONE",
    caption: "The route crosses an interdicted zone — automated defences, dead relays, no traffic in living memory. Nobody remembers who they were built to keep out.",
    draw: (px, py, pw, ph, now) => {
      iStars(px, py, pw, ph, 33);
      iRidge(px, py, pw, ph, 7);
      const tx = [0.25, 0.62, 0.85];
      for (const f of tx) {
        const gx = px + pw * f, gy = py + ph * 0.74;
        ctx.shadowColor = "#ff4081"; ctx.shadowBlur = 10;
        ctx.strokeStyle = "#ff4081"; ctx.lineWidth = 2;
        ctx.fillStyle = "#3a0d24";
        ctx.beginPath(); ctx.arc(gx, gy, 10, Math.PI, 0); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx + 4, gy - 8); ctx.lineTo(gx + 13, gy - 16); ctx.stroke();
      }
      // drone
      ctx.save();
      ctx.translate(px + pw * 0.45, py + ph * 0.3);
      ctx.strokeStyle = "#ff4081"; ctx.shadowColor = "#ff4081"; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -9); ctx.lineTo(8, 0); ctx.lineTo(0, 9); ctx.lineTo(-8, 0);
      ctx.closePath(); ctx.stroke();
      ctx.restore();
      ctx.shadowBlur = 0;
    } },
  { title: "THE FAILURE",
    caption: "Mid-crossing, every system aboard failed at once. Cause unknown. The recorders kept only one thing: a signal, repeating, every 41 seconds.",
    draw: (px, py, pw, ph, now) => {
      iStars(px, py, pw, ph, 44);
      const flick = 0.45 + 0.55 * Math.abs(Math.sin(now * 7) * Math.sin(now * 2.3));
      iShip(px + pw * 0.38, py + ph * 0.5, Math.min(1.1, pw / 380), -0.1, flick);
      // the Static
      const sx = px + pw * 0.82, sy = py + ph * 0.4;
      ctx.strokeStyle = "#b388ff"; ctx.shadowColor = "#b388ff"; ctx.shadowBlur = 10;
      const phase = (now % 1.4) / 1.4;
      for (let k = 0; k < 3; k++) {
        const p = (phase + k / 3) % 1;
        ctx.globalAlpha = (1 - p) * 0.7;
        ctx.beginPath(); ctx.arc(sx, sy, 8 + p * ph * 0.42, 0, 7); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.font = "700 11px Menlo, monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "#b388ff";
      ctx.fillText("· 41s ·", sx, sy + ph * 0.5);
    } },
  { title: "THE SCATTERING",
    caption: "The Scions evacuated in pods and were thrown across the zone. MERCY flies again — barely. You fly the rescue. Bring them home. And captain… count the heartbeats.",
    draw: (px, py, pw, ph, now) => {
      iStars(px, py, pw, ph, 55);
      iRidge(px, py, pw, ph, 9);
      iShip(px + pw * 0.18, py + ph * 0.22, Math.min(0.7, pw / 520), 0, 1);
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = "rgba(255,196,0,.5)"; ctx.lineWidth = 1.5;
      const drops = [[0.34, 0.62], [0.52, 0.7], [0.7, 0.6], [0.86, 0.68]];
      for (const [fx, fy] of drops) {
        ctx.beginPath();
        ctx.moveTo(px + pw * 0.2, py + ph * 0.24);
        ctx.quadraticCurveTo(px + pw * (fx - 0.1), py + ph * 0.2, px + pw * fx, py + ph * fy);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      drops.forEach(([fx, fy], i) =>
        iDoid(px + pw * fx, py + ph * fy, Math.min(1.6, ph / 150), i * 2.1, false, i % 2 === 0));
    } }
];

function drawIntroScreen(now) {
  const pw = Math.min(660, vw - 36);
  const ph = Math.min(vh * 0.5, 300);
  const px = (vw - pw) / 2, py = vh * 0.09;
  const panel = INTRO[Math.min(introIdx, INTRO.length - 1)];

  ctx.save();
  ctx.strokeStyle = "rgba(0,229,255,.6)"; ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 14;
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
  panel.draw(px, py, pw, ph, now);
  ctx.restore();

  ctx.textAlign = "center";
  ctx.font = "800 16px Menlo, monospace";
  ctx.fillStyle = "#aef4ff"; ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 8;
  ctx.fillText(panel.title, vw / 2, py + ph + 30);
  ctx.shadowBlur = 2;
  const capPx = bodyFontPx(13), capLH = capPx + 6;
  ctx.font = "600 " + capPx + "px Menlo, monospace";
  ctx.fillStyle = "#c9e6f7";
  const lines = wrapText(panel.caption, Math.min(600, vw - 70));
  lines.forEach((l, i) => ctx.fillText(l, vw / 2, py + ph + 52 + i * capLH));
  ctx.shadowBlur = 0;

  // page dots
  for (let i = 0; i < INTRO.length; i++) {
    ctx.fillStyle = i === introIdx ? "#00e5ff" : "rgba(255,255,255,.25)";
    ctx.beginPath();
    ctx.arc(vw / 2 + (i - (INTRO.length - 1) / 2) * 18, py + ph + 58 + lines.length * capLH, 3, 0, 7);
    ctx.fill();
  }
  ctx.font = "700 11px Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255," + (0.5 + 0.4 * Math.sin(now * 4)).toFixed(2) + ")";
  ctx.fillText("tap ▸", vw / 2, py + ph + 76 + lines.length * capLH);

  const sr = skipRect();
  ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 1;
  ctx.strokeRect(sr.x, sr.y, sr.w, sr.h);
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillText("SKIP ▸▸", sr.x + sr.w / 2, sr.y + 22);
}

/* rotate-to-landscape gate */
function drawPortraitWarning(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(3,4,12,.92)";
  ctx.fillRect(0, 0, vw, vh);
  const cx = vw / 2, cy = vh * 0.4;
  // phone glyph animating from portrait to landscape
  const ph = (now % 2.4) / 2.4;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const ang = ph < 0.55 ? ease(clamp(ph / 0.55, 0, 1)) * Math.PI / 2 : Math.PI / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-ang);
  ctx.strokeStyle = "#00e5ff"; ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 16;
  ctx.lineWidth = 3;
  const w = 54, h = 96, r = 10;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + r, -h / 2);
  ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, r);
  ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
  ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r);
  ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r);
  ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, h / 2 - 12); ctx.lineTo(10, h / 2 - 12); ctx.stroke();
  ctx.restore();
  ctx.shadowBlur = 8;
  ctx.textAlign = "center";
  ctx.font = "800 18px Menlo, monospace";
  ctx.fillStyle = "#aef4ff"; ctx.shadowColor = "#00e5ff";
  ctx.fillText("ROTATE TO LANDSCAPE", cx, vh * 0.62);
  ctx.font = "600 12px Menlo, monospace";
  ctx.fillStyle = "rgba(155,234,249,.7)";
  ctx.fillText("Hollow Oath flies wide — turn your phone on its side", cx, vh * 0.68);
  ctx.shadowBlur = 0;
}

function drawBrief(now) {
  ctx.textAlign = "center";
  ctx.font = "600 11px Menlo, monospace";
  ctx.fillStyle = "rgba(0,229,255," + (0.5 + 0.4 * Math.sin(now * 3)).toFixed(2) + ")";
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 8;
  ctx.fillText("— INCOMING TRANSMISSION · AMS MERCY —", vw / 2, vh * 0.16);
  if (runMode !== "campaign") {   // Bundle M: mark the rotation, name the bar
    ctx.font = "700 11px Menlo, monospace";
    ctx.fillStyle = runMode === "remix" ? "#69f0ae" : "#ffc400";
    const prev = runMode === "daily" ? dailyPrevScore() : 0;
    ctx.fillText(runMode === "remix" ? "REMIX ROTATION // seed " + runSeed
      : "DAILY FLIGHT // " + runSeed + (prev > 0 ? " · yesterday-you: " + prev : ""),
      vw / 2, vh * 0.205);
  }
  ctx.font = "800 24px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = "#aef4ff";
  ctx.fillText(SECTOR_NAMES[levelIdx], vw / 2, vh * 0.25);
  ctx.shadowBlur = 4;
  const briefPx = bodyFontPx(14);
  ctx.font = "600 " + briefPx + "px Menlo, monospace";
  ctx.fillStyle = "#c9f3dd";
  const wrapW = Math.min(560, vw - 60);
  // Lay the block against the FULL brief so paragraph spacing and the TAP prompt
  // don't jump around as the text types out. On a short screen, tighten the line
  // height (floored at a readable minimum) so extra paragraphs never run off the
  // bottom — paragraphs are cheap, overflow is not.
  const nAll = wrapText(briefText(), wrapW).length;
  const topY = vh * 0.32, botY = vh * 0.95;
  let briefLH = briefPx + 8;
  if (nAll * briefLH > botY - topY - 34)
    briefLH = Math.max(briefPx + 2, (botY - topY - 34) / nAll);
  const shown = briefText().slice(0, Math.floor(briefChars));
  wrapText(shown, wrapW).forEach((l, i) => ctx.fillText(l, vw / 2, topY + i * briefLH));
  if (briefChars >= briefText().length) {
    ctx.font = "800 15px Menlo, monospace";
    ctx.fillStyle = "rgba(255,255,255," + (0.6 + 0.4 * Math.sin(now * 4)).toFixed(2) + ")";
    ctx.fillText("TAP TO LAUNCH", vw / 2, topY + nAll * briefLH + 30);
  }
  ctx.shadowBlur = 0;
}

/* R1 — split wrapped body lines into screen-fitting pages, preferring to
   break on paragraph boundaries (blank lines) within each page. */
function paginateLines(lines, maxLines) {
  const pages = [];
  let i = 0;
  while (i < lines.length) {
    let end = Math.min(i + maxLines, lines.length);
    if (end < lines.length) {
      // pull the break back to the last paragraph boundary inside the page
      for (let j = end; j > i + 1; j--) {
        if (lines[j - 1] === "") { end = j; break; }
      }
    }
    pages.push(lines.slice(i, end));
    i = end;
    while (lines[i] === "") i++;   // drop the blank separator at a page seam
  }
  return pages.length ? pages : [[]];
}

function drawCardPanel(card, now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(5,6,15,.7)";
  ctx.fillRect(0, 0, vw, vh);
  const w = Math.min(600, vw - 40);
  const bodyPx = bodyFontPx(14), bodyLH = bodyPx + 7;
  ctx.font = "600 " + bodyPx + "px Menlo, monospace";
  const bodyLines = wrapText(card.body, w - 60);
  const titleH = (card.title ? 34 : 0) + (card.subtitle ? 18 : 0);
  // R1 — a long body (the HOW TO FLY card) used to run off the bottom of a
  // landscape phone, hiding the last paragraphs and the tap line. Paginate
  // whenever the full card would exceed the viewport.
  const maxH = vh - 40;
  const fullH = 86 + titleH + bodyLines.length * bodyLH;
  let pageLines = bodyLines, pageCount = 1, page = 0;
  if (fullH > maxH) {
    const maxLines = Math.max(1, Math.floor((maxH - 86 - titleH) / bodyLH));
    const pages = paginateLines(bodyLines, maxLines);
    pageCount = pages.length;
    page = clamp(card.page || 0, 0, pageCount - 1);
    pageLines = pages[page];
  }
  card.pages = pageCount;   // let the tap handlers know whether more remain
  const h = 86 + titleH + pageLines.length * bodyLH;
  const x = (vw - w) / 2, y = Math.max(20, (vh - h) / 2);
  ctx.fillStyle = "rgba(8,10,26,.92)";
  ctx.strokeStyle = card.color; ctx.shadowColor = card.color; ctx.shadowBlur = 18;
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 6;
  ctx.textAlign = "center";
  ctx.font = "700 11px Menlo, monospace";
  ctx.fillStyle = card.color;
  ctx.fillText(card.kicker, vw / 2, y + 26);
  let cy = y + 26;
  if (card.title) {
    cy += 32;
    ctx.font = "900 22px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillStyle = "#f4f8ff";
    ctx.fillText(card.title, vw / 2, cy);
  }
  if (card.subtitle) {
    cy += 18;
    ctx.font = "600 11px Menlo, monospace";
    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.fillText(card.subtitle, vw / 2, cy);
  }
  cy += 28;
  ctx.font = "600 " + bodyPx + "px Menlo, monospace";
  ctx.fillStyle = "#d9e8ff";
  pageLines.forEach((l, i) => ctx.fillText(l, vw / 2, cy + i * bodyLH));
  ctx.font = "700 11px Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255," + (0.5 + 0.4 * Math.sin(now * 4)).toFixed(2) + ")";
  const foot = pageCount > 1
    ? (page + 1) + "/" + pageCount + (page < pageCount - 1 ? " · tap for more" : " · tap to continue")
    : "tap to continue";
  card._footY = y + h - 14;   // exposed for the R1 on-screen-fit smoke test
  ctx.fillText(foot, vw / 2, card._footY);
  ctx.shadowBlur = 0;
}

function tallyLine() {
  return "saved " + runSaved + (runLost > 0 ? "  ·  ✝ lost " + runLost : "");
}

function drawClear(now) {
  if (clearCards.length > 0) { drawCardPanel(clearCards[0], now); return; }
  const hip = (level.firedShots === 0 ? "PRIMUM NON NOCERE — Hippocratic bonus +2000\n" : "") +
    (level.stopwatchBeat ? "⏱ STOPWATCH BEAT +500\n" : "");
  const boxNote = level.blackbox && !level.blackbox.found ? "\n(a signal source went unfound in this sector)" : "";
  drawCenter(SECTOR_NAMES[levelIdx] + " CLEAR",
    hip + "saved " + level.delivered + "/" + level.total +
    (level.lost > 0 ? "  ·  ✝ lost " + level.lost : "") + boxNote +
    "\ntap to continue", "#69f0ae");
}

function drawPause(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(5,6,15,.75)";
  ctx.fillRect(0, 0, vw, vh);
  ctx.textAlign = "center";
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 20;
  ctx.fillStyle = "#aef4ff";
  // R2 — derive the heading position (and size) from the first row so PAUSED
  // can never land inside the RESUME button on a short landscape viewport
  const topRow = pauseRowRect(0);
  const headY = topRow.y - 26;
  ctx.font = "900 " + Math.min(38, vw * 0.08, (topRow.y - 10) * 0.9) +
    "px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("PAUSED", vw / 2, headY);
  ctx.shadowBlur = 0;
  const labels = ["RESUME", "RESTART SECTOR", "SETTINGS", "QUIT TO TITLE"];
  for (let i = 0; i < 4; i++) {
    const r = pauseRowRect(i);
    ctx.strokeStyle = "rgba(0,229,255,.6)"; ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "#7fe9ff";
    ctx.font = "700 14px Menlo, monospace";
    ctx.fillText(labels[i], vw / 2, r.y + r.h / 2 + 5);
    ctx.shadowBlur = 0;
  }
  // U3 — a compact link into the HUD legend
  const lg = pauseLegendRect();
  ctx.fillStyle = "rgba(155,234,249,.7)";
  ctx.font = "600 12px Menlo, monospace";
  ctx.fillText("◎ WHAT YOU'RE LOOKING AT", vw / 2, lg.y + lg.h / 2 + 4);
}

/* S4.5 — the early-extraction confirm: a two-choice card over the frozen world */
function drawConfirm(now) {
  if (!confirmCard) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(5,6,15,.8)";
  ctx.fillRect(0, 0, vw, vh);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,196,0,.75)"; ctx.font = "700 11px Menlo, monospace";
  ctx.fillText(confirmCard.kicker, vw / 2, vh * 0.20);
  ctx.shadowColor = confirmCard.color; ctx.shadowBlur = 16;
  ctx.fillStyle = confirmCard.color;
  ctx.font = "900 " + Math.min(30, vw * 0.06) + "px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(confirmCard.title, vw / 2, vh * 0.27);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#dff8ff"; ctx.font = "600 12px Menlo, monospace";
  // the body already breaks at logical clause boundaries; wrap only guards a
  // stray over-long line on a narrow phone
  const wrapped = wrapText(confirmCard.body, Math.min(600, vw * 0.86));
  wrapped.forEach((l, i) => ctx.fillText(l, vw / 2, vh * 0.33 + i * 18));
  const labels = ["⚠ SIGNAL EARLY EXTRACTION", "RETURN TO THE SECTOR"];
  const cols = ["255,196,0", "0,229,255"];
  for (let i = 0; i < 2; i++) {
    const r = confirmRowRect(i);
    ctx.strokeStyle = "rgba(" + cols[i] + ",.7)"; ctx.shadowColor = "rgba(" + cols[i] + ",1)"; ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = "700 13px Menlo, monospace";
    ctx.fillText(labels[i], r.x + r.w / 2, r.y + r.h / 2 + 5);
    ctx.shadowBlur = 0;
  }
}

/* SOUND/MUSIC/ASSIST/COLORBLIND/FIELD MEDIC/BIG TEXT all take effect now;
   HAPTICS is a no-op on the web build (the haptic facade bridges to the
   native wrapper when Bundle E lands — the flag persists regardless) */
function drawSettings(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(5,6,15,.85)";
  ctx.fillRect(0, 0, vw, vh);
  ctx.textAlign = "center";
  ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 20;
  ctx.fillStyle = "#aef4ff";
  ctx.font = "900 " + Math.min(34, vw * 0.07) + "px 'Helvetica Neue', Arial, sans-serif";
  const topY = settingsRowRect(0).y - 30;
  ctx.fillText("SETTINGS", vw / 2, topY);
  ctx.shadowBlur = 0;
  const rows = [
    ["SOUND", sound], ["MUSIC", music], ["HAPTICS", haptics],
    ["ASSIST", assist], ["TILT", tilt], ["COLORBLIND", colorblind],
    ["FIELD MEDIC", easyMode], ["BIG TEXT", bigText],
    ["REDUCED FLASH", reducedFlash], ["RESET PROGRESS", null]
  ];
  for (let i = 0; i < rows.length; i++) {
    const [label, on] = rows[i];
    const r = settingsRowRect(i);
    const isReset = i === 9;
    const stroke = isReset ? (resetArmed ? "rgba(255,64,129,.9)" : "rgba(255,64,129,.45)")
      : on ? "rgba(105,240,174,.8)" : "rgba(255,255,255,.3)";
    ctx.strokeStyle = stroke;
    ctx.shadowColor = isReset ? (resetArmed ? "#ff4081" : "transparent") : (on ? "#69f0ae" : "transparent");
    ctx.shadowBlur = (isReset ? resetArmed : on) ? 8 : 0;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = isReset ? (resetArmed ? "#ff4081" : "rgba(255,120,150,.7)")
      : on ? "#69f0ae" : "rgba(255,255,255,.5)";
    ctx.font = "700 12px Menlo, monospace";
    const txt = isReset ? (resetArmed ? "TAP AGAIN TO WIPE" : "RESET PROGRESS")
      : label + " · " + (on ? "ON" : "OFF");
    ctx.fillText(txt, r.x + r.w / 2, r.y + r.h / 2 + 5);
    ctx.shadowBlur = 0;
  }
  const footY = settingsRowRect(9).y + settingsRowRect(9).h + 14;
  ctx.font = "600 10px Menlo, monospace";
  ctx.fillStyle = "rgba(255,255,255,.4)";
  ctx.fillText("field medic: gentler, 5 lives, next run · reset wipes scores & codex, keeps settings",
    vw / 2, footY);
  ctx.fillStyle = "rgba(255,255,255,.3)";
  ctx.fillText("Hollow Oath · " + BUILD_TAG + " · no ads, no tracking · tap outside to close",
    vw / 2, footY + 14);
}

function drawGameOver(now) {
  drawCenter("FLATLINE", "GAME OVER — " + tallyLine(), "#ff4081");
  ctx.textAlign = "center";
  if (checkpoint) {
    const cr = continueRect(), nr = { x: cr.x, y: cr.y + cr.h + 14, w: cr.w, h: 40 };
    ctx.strokeStyle = "rgba(105,240,174,.8)"; ctx.shadowColor = "#69f0ae"; ctx.shadowBlur = 10; ctx.lineWidth = 1.5;
    ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
    ctx.fillStyle = "#69f0ae";
    const contLine = "CONTINUE — " + SECTOR_NAMES[checkpoint.levelIdx];
    const contMaxW = cr.w - 16;
    let contSize = 13;
    ctx.font = "700 " + contSize + "px Menlo, monospace";
    while (ctx.measureText(contLine).width > contMaxW && contSize > 9) {
      contSize--;
      ctx.font = "700 " + contSize + "px Menlo, monospace";
    }
    ctx.fillText(contLine, cr.x + cr.w / 2, cr.y + cr.h / 2 - 6);
    ctx.font = "600 11px Menlo, monospace";
    ctx.fillText(startLives() + " LIVES · -25% SCORE", cr.x + cr.w / 2, cr.y + cr.h / 2 + 13);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.4)";
    ctx.strokeRect(nr.x, nr.y, nr.w, nr.h);
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.font = "700 13px Menlo, monospace";
    ctx.fillText("MAIN MENU", nr.x + nr.w / 2, nr.y + nr.h / 2 + 5);
  } else {
    ctx.font = "600 13px Menlo, monospace"; ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.fillText("tap to return to the menu", vw / 2, vh * 0.6);
  }
}

function drawEnding(now) {
  let title, body, color;
  if (endingType === "answered") {
    title = "THE ANSWERED CALL";
    color = "#aef4ff";
    body = "You landed beside it and listened.\n\nThe beacon was AMS SOLACE — MERCY's sister ship, lost with all hands, her distress call looping for years. Every Scion that answered honestly was rewritten by the echo.\n\nYou didn't silence her. You told her she was heard.\n\nThe Static faded like a fever breaking.\n\n+6000" + (runFired === 0 ? "  ·  OATH KEPT +2000" : "");
    if (runFired === 0) body += "\n\nThe oath, kept whole.";
    else if (firedAtSecret && !firedAtCombat) body += "\n\nYou found what he hid. It cost you the oath to do it.";
  } else if (endingType === "fire") {
    title = "SILENCE BY FIRE";
    color = "#ffc400";
    body = "You burned the beacon out of the dark.\n\nThe Static is gone — and so is whatever was calling. MERCY logs the sector clean.\n\nThe silence feels heavier than it should.\n\nQuiet, at a cost. The oath, hollowed.\n\n+3000";
  } else {
    title = "ROTATION COMPLETE";
    color = "#b388ff";
    body = "The tour is over and the rescued are home.\n\nBut on the long ride back, under everything, the Static is still there. Repeating.\n\nLeft hollow. The Static answers still.\n\n◈ Black boxes recovered: " + blackboxCount + "/" + NBOX + " — recover at least 3 to triangulate its source.";
  }
  if (endingType !== "unresolved" && shrines.size >= SHRINES.length) {
    body += "\n\nAnd in the fleet record, appended in your hand: the serpent's mask, catalogued for good. No one will buy his cures again.";
    if (decoyOutcome === "observed")
      body += "\nEven his best lure — the second MERCY — failed the moment you counted her heartbeat.";
  }
  // S8 — once the WORKSHOP is seen (the counterfeits were BUILT, not corrupted),
  // the missing originals become an open question — the itch 1.2 will scratch
  if (shrinesSeen.has(1))
    body += "\n\nAnd one line nobody signs off: if the counterfeits were never our Scions — where are ours? MERCY's manifest still lists the missing.";
  drawCardPanel({ kicker: "— TRANSMISSION ENDS —", title, subtitle: "", body, color }, now);
}

function drawWin() {
  let rank = "FLIGHT SURGEON, MERCY RESCUE DIVISION";
  if (endingType === "answered") {
    // "eyes open": the oath held AND Glycon's lies were still read (Bundle J3)
    if (runFired === 0) rank = "OATH KEEPER — PRIMUM NON NOCERE" + (scannedSecret ? " · EYES OPEN" : "");
    // broke the no-fire oath only to crack open Glycon's secrets, never in combat
    else if (firedAtSecret && !firedAtCombat) rank = "HOLLOW KEEPER";
    else rank = "THE ONE WHO ANSWERED";
  }
  else if (endingType === "fire") rank = "SECTOR WARDEN";
  const spotless = runLost === 0 ? "\nspotless record — no Scion lost" : "";
  const serpent = shrines.size >= SHRINES.length ? "\n☤ the serpent unmasked" : "";
  drawCenter(runLost === 0 && endingType === "answered" ? "A PERFECT ROTATION" : "MISSION COMPLETE",
    "score " + score + "  ·  hi " + hiscore + "\n" + tallyLine() +
    "  ·  ◈ " + blackboxCount + "/" + NBOX + "  ·  logs " + runFragments + "/" + FRAGMENTS.length +
    spotless + serpent +
    "\nrank: " + rank + "\ntap to play again", "#69f0ae");
}

function drawCenter(big, small, color) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(5,6,15,.55)";
  ctx.fillRect(0, 0, vw, vh);
  ctx.textAlign = "center";
  ctx.shadowColor = color; ctx.shadowBlur = 24;
  ctx.fillStyle = color;
  ctx.font = "900 " + Math.min(46, vw * 0.09) + "px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText(big, vw / 2, vh * 0.34);
  ctx.shadowBlur = 8;
  ctx.font = "600 14px Menlo, monospace";
  ctx.fillStyle = "#dff8ff";
  small.split("\n").forEach((l, i) => ctx.fillText(l, vw / 2, vh * 0.44 + i * 22));
  ctx.shadowBlur = 0;
}

/* test/debug handle into module-scoped state */
window.__doids = {
  get: () => ({ ship, level, state, levelIdx, upgrades, blackboxCount,
    runFragments, runSaved, runLost, runFired, firedAtSecret, firedAtCombat, scannedSecret,
    mercyBreach, mercyDamaged,
    endingType, clearCards, revealCard, score, lives,
    shrines: [...shrines], inCave: !!(level && level.isCave),
    input: Object.assign({}, input), ctlShown, introSeen,
    hasSave: !!savedRun, paused: state === "pause",
    sound, music, haptics, assist, tilt, colorblind, easyMode, bigText, reducedFlash,
    resetArmed, settingsRows: SETTINGS_ROWS, buildTag: BUILD_TAG,
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
    dailyMods: dailyMods.map(m => m.id), sectorT, maxFuel: maxFuel(),
    rects: { resume: resumeRect(), remix: remixRect(), daily: dailyRect(), start: startRect(),
      help: helpRect(), legend: legendRect(), pauseLegend: pauseLegendRect() },
    decoyOutcome, fakeMercy: level && level.fakeMercy,
    darkAlpha: level && level.darkAlpha, nightFell: level && !!level.nightFell,   // T6
    gcReports: gc.reports.slice(), cloudNative: cloud.native() }),
  go: toBriefing,
  // R9 / S5 (owner steer): a Vector is NEVER given away by colour — with or
  // without ANTISEPSIS a saboteur (mech) renders exactly like a true Scion.
  // Identification is the earned SCAN (the "?" over a catalogued unit), not a
  // tint. Exposed so a test can assert the colour parity always holds.
  oidTint: () => "#69f0ae",
  setStaticClock: v => { staticClock = v; },
  remix: startRemix,
  daily: startDaily,
  // M1 regression anchor: seed 0 must always produce today's exact levels
  heightChecksum: () => level.heights.reduce((a, h) => (a * 31 + Math.round(h)) | 0, 0),
  launch: () => { if (state === "brief") { briefChars = 1e9; state = "play"; } },
  ground: groundAt,
  evalLanding: landingEval,
  logCardBody: idx => archiveCardFor(idx).body,   // A6 — sentence-broken reveal body
  btnHit: (x, y) => buttonsAt(x, y),              // C1 — touch-button hit test
  give: k => { upgrades[k] = true; },
  strand: () => { ship.x = level.W / 2; ship.y = groundAt(ship.x) - SHIP_R;
    ship.landed = true; ship.vx = ship.vy = 0; ship.fuel = 0; },
  warpLift: () => { const L = level.lift; if (L) { ship.x = L.x; ship.y = L.y - SHIP_R;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true; } },
  warpShrine: () => { const sh = level.shrine; if (sh) { ship.x = sh.x; ship.y = groundAt(sh.x) - SHIP_R;
    ship.vx = ship.vy = 0; ship.ang = 0; ship.landed = true; } },
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

