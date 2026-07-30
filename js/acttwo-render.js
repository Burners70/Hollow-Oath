"use strict";
/* ================================================================
   Bundle P — Act Two (the descent). Render layer.
   docs/ACT_TWO_SPEC.md §4/§5/§6/§7.5/§8, docs/DESIGN_BRIEF_ACT_TWO.md.

   New file, approved exception to "keep new code inside the existing files"
   (see CLAUDE.md, "Bundle P / Act Two gets new files"). Loads after
   js/world.js and js/acttwo-data.js (token/state layer: RACK_STATES,
   RACK_PULSE_PERIOD, rackColor/rackBrightness, PLANT_ZONES/plantPal) and
   before js/update.js/js/render.js, so `ctx`/`dpr`/`vw`/`vh`/`saLeft`/
   `level`/`ship`/`TOK`/`PAL`/`shade`/`mono`/`drawGlow`/`glowStroke` (defined
   later in js/render.js) are consumed here only inside function bodies,
   never at parse time — same load-order discipline as the rest of the
   project (functions are called after every script has loaded).

   Everything below is gated on level fields (level.racks, level.isPlant,
   level.plantOrnaments, level.wellDock, level.towedRack) that no genLevel
   path sets yet — Bundle P's chamber authoring (P·terrain/P·slice/P·content)
   owns building that data; these functions are wired into drawWorld()/
   render() (see the small gated call-sites there) so they draw the instant
   that data exists and are inert no-ops until then. Dock/tow detection (when
   a load "counts" as seated, when towing starts) is game logic, left to that
   work — not guessed at here. */

/* small roundRect path helper, kept local rather than relying on
   CanvasRenderingContext2D.roundRect (Safari 16+ only) — the game targets
   iPhone Safari broadly (see CLAUDE.md). */
function pathRoundRect(x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---- THE RACK (§4/§7.5) — a CAGE, not a panel: sharp frame, dim steel bars
   over lit occupant cells, one glowing status rail on top carrying the actual
   beat. Its glow IS its pulse — no HUD readout, state reads from the room. */
function drawRack(cx, cy, w, h, stateKey, now, opts) {
  opts = opts || {};
  const color = rackColor(stateKey, now);
  let brightness = rackBrightness(stateKey, now, opts.cutT01 != null ? opts.cutT01 : null);
  // §4 open question 1 (Option B, the trunk-ripple pick) — every rack takes a
  // simultaneous bite from the shared reserve on the network's real 41s beat.
  if (opts.networked !== false) brightness = Math.max(0.08, brightness * (1 - networkDipAmount() * 0.35));
  const bw = w * 0.72, bh = h * 0.66, left = cx - bw / 2, top = cy - bh / 2;
  ctx.save();
  // light leaking from inside the cage — a radial wash, not a rounded halo outline
  const glowR = Math.max(bw, bh) * 0.7;
  const grad = ctx.createRadialGradient(cx, cy + 4, 4, cx, cy + 4, glowR);
  grad.addColorStop(0, shade(color, 0.45 * brightness));
  grad.addColorStop(1, shade(color, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(left - glowR * 0.5, top - glowR * 0.5, bw + glowR, bh + glowR);
  // dark cell body, sharp corners
  ctx.fillStyle = TOK.VOID;
  ctx.fillRect(left, top, bw, bh);
  // occupant cells — small lit windows behind the bars
  const n = 10, pad = bw * 0.05, cellW = (bw - pad * 2) / n;
  for (let i = 0; i < n; i++) {
    const px = left + pad + i * cellW + cellW * 0.5;
    ctx.fillStyle = shade(color, 0.14 + brightness * 0.55);
    ctx.fillRect(px - cellW * 0.3, top + bh * 0.16, cellW * 0.6, bh * 0.5);
  }
  // heavy outer frame, sharp corners — industrial holding, not a device
  ctx.strokeStyle = shade(TOK.CYAN_TEXT, .6); ctx.lineWidth = Math.max(2.5, bw * 0.022);
  ctx.strokeRect(left, top, bw, bh);
  // vertical bars over everything — dim steel, deliberately NOT glowing
  const bars = 9;
  ctx.strokeStyle = "rgba(10,12,24,.92)"; ctx.lineWidth = Math.max(3, bw * 0.02);
  for (let i = 1; i < bars; i++) {
    const x = left + (bw / bars) * i;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + bh); ctx.stroke();
  }
  // the status rail — a slim strip along the top, the pulse itself
  ctx.fillStyle = shade(color, 0.3 + brightness * 0.7);
  ctx.shadowColor = color; ctx.shadowBlur = 4 + brightness * 16;
  ctx.fillRect(left + bw * 0.04, top - 6, bw * 0.92, 5);
  ctx.shadowBlur = 0;
  if (opts.label) {
    ctx.fillStyle = shade(TOK.CYAN_TEXT, .8);
    ctx.font = mono(10, 700); ctx.textAlign = "center";
    ctx.fillText(opts.label, cx, cy + bh / 2 + 18);
  }
  ctx.restore();
}

/* ---- conduit real-vs-fake tell (§5 open question 2, Option A — the pick):
   a living line's beat stays a soft round glow (the rack's own disc
   language); a faked line's beat is a rounded-corner square — still clearly
   not a circle, not a harsh cutout either. Same timing on both; the tell is
   silhouette alone, so it survives colourblind mode untouched. `rippleDelayFrac`
   (0..1, optional) layers the §4 Option B network ripple on the same trunk. */
function drawConduitTrunk(x0, y0, x1, y1, real, now, rippleDelayFrac) {
  ctx.save();
  ctx.strokeStyle = shade(TOK.CYAN, .25); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  const phase = (now % RACK_PULSE_PERIOD) / RACK_PULSE_PERIOD;
  const px = lerp(x0, x1, phase), py = lerp(y0, y1, phase);
  ctx.fillStyle = TOK.CYAN; ctx.shadowColor = TOK.CYAN; ctx.shadowBlur = 12;
  if (real) { ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill(); }
  else { ctx.beginPath(); pathRoundRect(px - 5.5, py - 5.5, 11, 11, 4); ctx.fill(); }
  ctx.shadowBlur = 0;
  if (rippleDelayFrac != null) {
    const rt = networkRippleT(rippleDelayFrac);
    if (rt > 0 && rt < 1) drawGlow(lerp(x0, x1, rt), lerp(y0, y1, rt), 9, TOK.CYAN, 0.7 * rt);
  }
  ctx.restore();
}
function drawRacks(now) {
  if (!level.racks) return;
  level.racks.forEach((r, i) => {
    if (r.conduit) {
      const c = r.conduit;
      drawConduitTrunk(c.x0, c.y0, c.x1, c.y1, c.real !== false, now, (i % 4) / 4);
    }
    drawRack(r.x, r.y, r.w || 130, r.h || 170, r.state || "mains", now,
      { cutT01: r.cutT01 != null ? r.cutT01 : null, label: r.label });
  });
}

/* ---- §4 open question 1 (Option B — the pick): a current runs the trunk a
   beat before the shared-reserve dip lands, so it reads as "signal reaching
   the room", not a jump-cut alarm. Rides the REAL STATIC_PERIOD/staticClock
   (js/update.js), not a separate demo clock — the dip itself is simultaneous
   across every rack in the network (docs/ACT_TWO_SPEC.md §7.3), but each
   rack's ripple starts at a slightly different point in the lead window
   (`delayFrac`) so never more than a couple of racks visibly change per
   frame — the flash-cue risk the spec calls out for Option A (sync dip). */
const NETWORK_RIPPLE_LEAD = 0.9;
function networkRippleT(delayFrac) {
  const untilBeat = STATIC_PERIOD - staticClock;
  const leadStart = NETWORK_RIPPLE_LEAD * (1 - (delayFrac || 0) * 0.5);
  if (untilBeat > leadStart || untilBeat < 0) return 0;
  return 1 - untilBeat / leadStart;
}
function networkDipAmount() {
  const sinceBeat = staticClock, untilBeat = STATIC_PERIOD - staticClock;
  const near = Math.min(sinceBeat, untilBeat);
  return near < 0.4 ? 1 - near / 0.4 : 0;
}

/* ---- §6 directional edge bleed — light spilling in from off-camera for a
   critical (failing/gone) off-screen rack, never a HUD arrow. Falloff ~18% of
   screen width; screen space, drawn after drawWorld so the world transform
   doesn't clip it. Picks the nearest off-screen critical rack — a chamber
   with several at once is a further authoring/priority call for engineering. */
function drawRackEdgeBleed(now) {
  const t = worldTransform();
  let best = null, bestDist = Infinity;
  for (const r of level.racks) {
    if (r.state !== "failing" && r.state !== "gone") continue;
    const sx = saLeft + t.z * (r.x - t.cx), sy = t.z * (r.y - t.cy);
    if (sx >= saLeft && sx <= vw && sy >= 0 && sy <= vh) continue;   // onscreen — no bleed
    const d = Math.hypot(sx - clamp(sx, saLeft, vw), sy - clamp(sy, 0, vh));
    if (d < bestDist) { bestDist = d; best = { r, sx }; }
  }
  if (!best) return;
  const brightness = rackBrightness(best.r.state, now, null);
  const color = rackColor(best.r.state, now);
  const bleedW = (vw - saLeft) * 0.18;
  const fromLeft = best.sx < saLeft;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const grad = ctx.createLinearGradient(fromLeft ? saLeft : vw, 0, fromLeft ? saLeft + bleedW : vw - bleedW, 0);
  grad.addColorStop(0, shade(color, 0.55 * brightness));
  grad.addColorStop(1, shade(color, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(fromLeft ? saLeft : vw - bleedW, 0, bleedW, vh);
  ctx.restore();
}

/* ---- §5 plant chamber terrain — now drawn from SPANS (P·terrain).
   The heightmap stand-in this file shipped with in P·design is gone: chamber
   terrain reads level.spans (js/world.js — one array of open {top,bot}
   intervals per column) so overhangs, pinch points and pillars actually draw.
   The palette itself (PLANT_ZONES, js/acttwo-data.js) carried over unchanged,
   which is what it was built to do.

   Tiles, same as Act One. buildHeightTile/getTiles (js/render.js) cache a
   traced heightmap path per 512px chunk rather than re-stroking a blurred path
   every frame (Bundle D4); spans need their own builder because the thing being
   drawn is the COMPLEMENT of the open intervals, but the caching contract is
   identical and tileTouch/TILE_CACHE_CAP/invalidateTiles are reused as-is.

   How a tile is built: fill the whole tile with rock, then punch out one quad
   per column per span — left edge from this column's span, right edge from the
   best-matching span in the next column, which is the same pairing spanAt()
   interpolates collision across, so what you fly through is exactly what you
   see. A tile only covers the vertical BAND its own spans occupy (plus pad);
   above and below that band every column is rock by definition, so the caller
   fills those with flat rects and no tile memory is spent on them. That keeps a
   2400px-deep chamber's tiles the same order of size as Act One's. */
function plantChamberPal() {
  const z = plantPal(level.plantZone);
  return { grad: [z.top, z.bottom], stroke: z.stroke, glow: z.glow };
}

const SPAN_TILE_PAD = 60;

function buildSpanTile(x0, x1, spans, H, pal) {
  const ov = STEP * 2;
  const i0 = Math.max(0, Math.floor((x0 - ov) / STEP));
  const i1 = Math.min(spans.length - 1, Math.ceil((x1 + ov) / STEP));
  let bandTop = Infinity, bandBot = -Infinity;
  for (let i = i0; i <= i1; i++)
    for (const sp of spans[i]) {
      if (sp.top < bandTop) bandTop = sp.top;
      if (sp.bot > bandBot) bandBot = sp.bot;
    }
  const solid = bandTop === Infinity;                 // a tile of pure rock
  const top = solid ? 0 : Math.max(0, bandTop - SPAN_TILE_PAD);
  const bot = solid ? 1 : Math.min(H, bandBot + SPAN_TILE_PAD);
  const sc = dpr;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil((x1 - x0) * sc));
  c.height = Math.max(1, Math.ceil((bot - top) * sc));
  const tctx = c.getContext("2d");
  tctx.setTransform(sc, 0, 0, sc, -x0 * sc, -top * sc);

  const grad = tctx.createLinearGradient(0, top, 0, bot);
  grad.addColorStop(0, pal.grad[0]); grad.addColorStop(1, pal.grad[1]);
  tctx.fillStyle = grad;
  tctx.fillRect(x0 - ov, top, (x1 - x0) + ov * 2, bot - top);

  if (!solid) {
    // punch the open space out of the rock
    tctx.globalCompositeOperation = "destination-out";
    tctx.fillStyle = "#000";
    for (let i = i0; i < i1; i++) {
      const xa = i * STEP, xb = (i + 1) * STEP;
      for (const sp of spans[i]) {
        const m = matchSpan(spans[i + 1], sp) || sp;
        tctx.beginPath();
        tctx.moveTo(xa, sp.top); tctx.lineTo(xb, m.top);
        tctx.lineTo(xb, m.bot);  tctx.lineTo(xa, sp.bot);
        tctx.closePath(); tctx.fill();
      }
    }
    // then edge the rock: floors and ceilings always, and a wall wherever a span
    // has no counterpart to continue into (which is what a pillar's flank is)
    tctx.globalCompositeOperation = "source-over";
    tctx.beginPath();
    for (let i = i0; i < i1; i++) {
      const xa = i * STEP, xb = (i + 1) * STEP;
      for (const sp of spans[i]) {
        const fwd = matchSpan(spans[i + 1], sp), m = fwd || sp;
        tctx.moveTo(xa, sp.top); tctx.lineTo(xb, m.top);
        tctx.moveTo(xa, sp.bot); tctx.lineTo(xb, m.bot);
        if (!fwd) { tctx.moveTo(xb, m.top); tctx.lineTo(xb, m.bot); }
        if (i > i0 && !matchSpan(spans[i - 1], sp)) { tctx.moveTo(xa, sp.top); tctx.lineTo(xa, sp.bot); }
      }
    }
    tctx.shadowColor = pal.glow; tctx.shadowBlur = 12;
    tctx.strokeStyle = pal.stroke; tctx.lineWidth = 2; tctx.stroke();
  }
  return { canvas: c, x0, y0: top, w: x1 - x0, h: bot - top, bandTop: top, bandBot: bot, solid };
}

// same cache contract as getTiles, keyed on level._spanTiles
function getSpanTiles(lvl, xLo, xHi, pal) {
  if (!lvl._spanTiles) lvl._spanTiles = new Map();
  const map = lvl._spanTiles;
  const t0 = Math.max(0, Math.floor(xLo / TILE_W)), t1 = Math.floor(clamp(xHi, 0, lvl.W) / TILE_W);
  const out = [];
  for (let ti = t0; ti <= t1; ti++) {
    const x0 = ti * TILE_W, x1 = Math.min(x0 + TILE_W, lvl.W);
    let tile = map.get(ti);
    if (!tile) tile = buildSpanTile(x0, x1, lvl.spans, lvl.H || WORLD_H, pal);
    out.push(tileTouch(map, ti, tile));
  }
  return out;
}

/* the chamber's rock. Called from drawWorld in place of the heightmap/roof tile
   pair when level.spans is present (js/render.js). */
function drawChamberTerrain(cx, viewW) {
  const pal = plantChamberPal();
  const H = level.H || WORLD_H;
  for (const tile of getSpanTiles(level, cx, cx + viewW, pal)) {
    // rock above and below the tile's band — flat fill, no boundary to stroke
    ctx.fillStyle = pal.grad[0];
    if (tile.bandTop > 0) ctx.fillRect(tile.x0, -260, tile.w, tile.bandTop + 260);
    ctx.fillStyle = pal.grad[1];
    if (tile.bandBot < H) ctx.fillRect(tile.x0, tile.bandBot, tile.w, H + 60 - tile.bandBot);
    if (!tile.solid) ctx.drawImage(tile.canvas, tile.x0, tile.y0, tile.w, tile.h);
    else ctx.fillRect(tile.x0, -260, tile.w, H + 320);
  }
}

/* §5 — the machined tell: short ticks cut into the rock just past a plant's
   surfaces, so a milled face reads differently from raw rock. Drawn INTO the
   rock (below a floor, above a ceiling) over the terrain tile, as the heightmap
   version did. Spans mean an overhang's underside gets them too, not just the
   column's lowest floor. */
function drawMachinedPanelTicks(x0, x1) {
  const spans = level.spans;
  if (!spans) return;
  const i0 = Math.max(0, Math.floor(x0 / STEP)), i1 = Math.min(spans.length - 1, Math.ceil(x1 / STEP));
  const spacing = Math.max(1, Math.round(90 / STEP));
  ctx.save();
  ctx.strokeStyle = shade(TOK.VOID, .5); ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = i0; i <= i1; i += spacing) {
    const x = i * STEP;
    for (const sp of spans[i]) {
      ctx.moveTo(x, sp.bot + 6); ctx.lineTo(x, sp.bot + 24);   // into the floor
      ctx.moveTo(x, sp.top - 6); ctx.lineTo(x, sp.top - 24);   // up into the ceiling
    }
  }
  ctx.stroke();
  ctx.restore();
}

/* ---- §5 ornamentation — decorative first, some becomes solid later; solid/
   filled forms rather than thin wireframes, which read as unfinished at a
   glance. World-space furniture dressing a plant chamber. */
function drawJunctionTruss(x, y, scale, color) {
  const w = 64 * scale, h = 46 * scale;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 2.5 * scale;
  ctx.shadowColor = color; ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y);
  ctx.moveTo(x, y - h); ctx.lineTo(x + w, y - h);
  ctx.moveTo(x, y); ctx.lineTo(x + w * 0.5, y - h); ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}
function drawConduitRunOrnament(x, y, w, now) {
  ctx.save();
  ctx.strokeStyle = shade(TOK.CYAN, .4); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  const phase = (now % RACK_PULSE_PERIOD) / RACK_PULSE_PERIOD;
  drawGlow(x + w * phase, y, 6, TOK.CYAN, 1);
  ctx.restore();
}
function drawRackingFrameOrnament(x, y, w, h, color) {
  ctx.save();
  ctx.strokeStyle = shade(color || TOK.CYAN_TEXT, .6); ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); pathRoundRect(x, y + i * (h / 3), w, h / 3 - 6, 4); ctx.stroke();
  }
  ctx.restore();
}
function drawVentGrateOrnament(x, y, w, h, color) {
  const c = color || TOK.CYAN_TEXT;
  ctx.save();
  ctx.strokeStyle = shade(c, .75); ctx.lineWidth = 1.6;
  ctx.shadowColor = c; ctx.shadowBlur = 4;
  for (let i = 0; i < 6; i++) {
    const gx = x + (w / 6) * i;
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.strokeStyle = shade(c, .4);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
const PLANT_ORNAMENTS = {
  conduitRun: (o, now) => drawConduitRunOrnament(o.x, o.y, o.w || 120, now),
  rackingFrame: o => drawRackingFrameOrnament(o.x, o.y, o.w || 90, o.h || 130, o.color),
  junctionTruss: o => drawJunctionTruss(o.x, o.y, o.scale || 1, o.color || TOK.CYAN_TEXT),
  ventGrate: o => drawVentGrateOrnament(o.x, o.y, o.w || 70, o.h || 90, o.color)
};
function drawPlantOrnaments(now) {
  for (const o of level.plantOrnaments) {
    const fn = PLANT_ORNAMENTS[o.type];
    if (fn) fn(o, now);
  }
}

/* ---- §6 the sling — tether plus rack, readable at speed without obscuring
   terrain. Modeled on the resupply drone's own line (drawResupplyDrone): same
   sag/quadratic-curve language, but the cable itself is cyan-soft chrome
   (TOK.CYAN_TEXT, #9beaf9) rather than white — white is reserved for
   disabled/inactive states elsewhere in the system, and a bright white
   working cable would misread as "off" rather than "under load". Small
   anchor rings mark both attachment points (ship's underside, rack's own top
   rail) so the connection reads as fastened, not floating. This is the
   visual only — the tether's actual physics/damage model is
   docs/PENDULUM_SPEC.md, P·systems work. */
function drawAnchorRing(x, y) {
  ctx.save();
  ctx.strokeStyle = shade(TOK.CYAN_TEXT, .85); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.stroke();
  ctx.fillStyle = shade(TOK.CYAN_TEXT, .9);
  ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill();
  ctx.restore();
}
function drawSlingLine(shipX, shipY, rackX, rackY, tension, now, rackTopOffset) {
  const top = rackTopOffset != null ? rackTopOffset : 45;
  const sag = (1 - clamp(tension, 0, 1)) * 60;
  const shipAnchorY = shipY + 10, rackAnchorY = rackY - top;
  const midX = (shipX + rackX) / 2, midY = (shipAnchorY + rackAnchorY) / 2 + sag;
  ctx.save();
  ctx.strokeStyle = shade(TOK.CYAN_TEXT, 0.45 + tension * 0.5);
  ctx.lineWidth = 1.5 + tension * 1.5;
  ctx.shadowColor = TOK.CYAN_TEXT; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(shipX, shipAnchorY);
  ctx.quadraticCurveTo(midX, midY, rackX, rackAnchorY);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
  drawAnchorRing(shipX, shipAnchorY);
  drawAnchorRing(rackX, rackAnchorY);
}

/* ---- §6 the well — not a gravity well: the mothership's own docking bay,
   lowered on a cable, swaying independently of the player's own tether. The
   ship holds position BELOW the bay with its rack slung underneath exactly as
   in flight (drawSlingLine covers that tether); a winch then reels the tether
   in, lifting the rack past the ship's side — never through the hull — and up
   into the slot. The ship itself never has to fly into the bay. Dock
   detection (when the load "counts" as seated) is game logic, left to
   engineering (docs/ACT_TWO_SPEC.md). `level.wellDock` shape: { x, y, phase,
   winchT (0-1), tension, rackState }. */
function drawWellBay(well, now) {
  const sway = Math.sin(now / 2.6 + (well.phase || 0)) * 18;
  const bx = well.x + sway, by = well.y;
  ctx.save();
  ctx.strokeStyle = shade(TOK.CYAN_TEXT, .35); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(well.x, well.y - 220); ctx.lineTo(bx, by); ctx.stroke();
  ctx.translate(bx, by); ctx.rotate(sway * 0.004);
  ctx.strokeStyle = TOK.GOLD; ctx.lineWidth = 2.5;
  ctx.shadowColor = TOK.GOLD; ctx.shadowBlur = 10;
  ctx.beginPath(); pathRoundRect(-90, -14, 180, 28, 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(90, 0); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = mono(9, 700); ctx.textAlign = "center";
  ctx.fillStyle = shade(TOK.GOLD, .7);
  ctx.fillText("THE WELL — LOWERED FROM MERCY", 0, 30);
  ctx.restore();
  const slot = wellSlotPos(well, now);
  ctx.save();
  ctx.strokeStyle = shade(TOK.GOLD, .4); ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.ellipse(slot.x, slot.y, 50, 12, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function wellSlotPos(well, now) {
  const sway = Math.sin(now / 2.6 + (well.phase || 0)) * 18;
  return { x: well.x + sway, y: well.y + 44 };
}
function wellRackPos(well, shipX, shipY, now) {
  const winchT = clamp(well.winchT || 0, 0, 1);
  const eased = winchT < 0.5 ? 2 * winchT * winchT : 1 - Math.pow(-2 * winchT + 2, 2) / 2;
  const slot = wellSlotPos(well, now);
  const idleX = shipX, idleY = shipY + 66;
  // swings out to the ship's side on the way up, so it never reads as passing through the hull
  const x = lerp(idleX, slot.x, eased) + Math.sin(eased * Math.PI) * 44;
  const y = lerp(idleY, slot.y, eased);
  return { x, y, eased };
}
function drawWellDock(now) {
  const well = level.wellDock;
  drawWellBay(well, now);
  const rackPos = wellRackPos(well, ship.x, ship.y, now);
  drawSlingLine(ship.x, ship.y, rackPos.x, rackPos.y, well.tension != null ? well.tension : 0.6, now, 26);
  drawRack(rackPos.x, rackPos.y, 90, 70, well.rackState || "reserve", now);
  if (rackPos.eased >= 1) {
    ctx.save();
    const g = ctx.createRadialGradient(rackPos.x, rackPos.y, 4, rackPos.x, rackPos.y, 70);
    g.addColorStop(0, shade(PAL().SAFE, .35)); g.addColorStop(1, shade(PAL().SAFE, 0));
    ctx.fillStyle = g; ctx.fillRect(rackPos.x - 90, rackPos.y - 90, 180, 180);
    ctx.restore();
  }
}
/* ================ end js/acttwo-render.js ================ */
