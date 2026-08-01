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
  /* THE SHUDDER (owner feedback) — the visual half of what a slam costs, beside
     the muffled cry and the haptic. `slamT` was already being set and decayed by
     towContact and nothing ever drew it, so the hit had no visible reaction at
     all. A short, high-frequency judder that dies with the timer: the box
     absorbing an impact, not a screen effect. Kept as motion under REDUCED
     FLASH, which exists for flashing rather than movement (see rackEnvelope). */
  const slam = clamp(opts.slam || 0, 0, 1);
  if (slam > 0) {
    const a = slam * slam * 4;
    cx += Math.sin(now * 96) * a;
    cy += Math.sin(now * 71 + 1.7) * a * 0.7;
  }
  const color = rackColor(stateKey, now);
  let brightness = rackBrightness(stateKey, now, opts.cutT01 != null ? opts.cutT01 : null);
  // §4 open question 1 (Option B, the trunk-ripple pick) — every rack takes a
  // simultaneous bite from the shared reserve on the network's real 41s beat.
  if (opts.networked !== false) brightness = Math.max(0.08, brightness * (1 - networkDipAmount() * 0.35));
  const bw = w * RACK_CAGE_W, bh = h * RACK_CAGE_H, left = cx - bw / 2, top = cy - bh / 2;
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
  /* occupant cells — small lit windows behind the bars. The count is the rack's
     actual occupancy (§6.1, eight to twelve) rather than a hardcoded ten, so
     shrinking a rack thins the bank instead of grinding ten cells into slivers:
     at the reduced RACK_SIZE, ten fixed cells came out 3.6px wide. */
  const n = opts.occupants || RACK_OCCUPANTS_DEFAULT;
  const pad = bw * 0.05, cellW = (bw - pad * 2) / n;
  for (let i = 0; i < n; i++) {
    const px = left + pad + i * cellW + cellW * 0.5;
    ctx.fillStyle = shade(color, 0.14 + brightness * 0.55);
    ctx.fillRect(px - cellW * 0.3, top + bh * 0.16, cellW * 0.6, bh * 0.5);
  }
  // heavy outer frame, sharp corners — industrial holding, not a device
  ctx.strokeStyle = shade(TOK.CYAN_TEXT, .6); ctx.lineWidth = Math.max(2.5, bw * 0.022);
  ctx.strokeRect(left, top, bw, bh);
  /* vertical bars over everything — dim steel, deliberately NOT glowing. The
     count follows the width (one per ~18px) rather than a fixed nine: nine bars
     across the reduced cage left 7px of gap and read as a picket fence, hiding
     the occupants the bars are supposed to be seen through. */
  const bars = clamp(Math.round(bw / 18), 4, 9);
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

/* The decoy boxes (owner feedback) — drawn by the SAME function as a real bank,
   at the same size, on the same beat. That is the requirement, not a shortcut:
   if a decoy were drawn even slightly differently it would be identifiable by
   looking, and §7.1's whole deduction (read the pulse, find the real feed) would
   be decoration. It is always in the `reserve` state, because a box on his
   network is neither on the plant's mains nor dying — and `networked: false` so
   it does not dip with the racks that genuinely share the tap. */
function drawDecoys(now) {
  if (!level.decoys) return;
  for (const d of level.decoys) {
    drawRack(d.x, d.y, RACK_SIZE.w, RACK_SIZE.h, "reserve", now,
      { label: d.label, occupants: d.occupants, networked: false });
    drawRackMounts(d);
  }
}

/* ---- conduit real-vs-fake tell (§5 open question 2, Option A — the pick):
   a living line's beat stays a soft round glow (the rack's own disc
   language); a faked line's beat is a rounded-corner square — still clearly
   not a circle, not a harsh cutout either. Same timing on both; the tell is
   silhouette alone, so it survives colourblind mode untouched. `rippleDelayFrac`
   (0..1, optional) layers the §4 Option B network ripple on the same trunk. */
/* The run itself, as a path. `trunkPath` (js/acttwo-data.js) routes it down into
   the deck, along under the floor and back up at the far end — see the note there
   for why a single straight segment across open air was wrong on three counts.
   Buried sections are drawn dimmer, because you are seeing them THROUGH rock:
   that is what makes it read as a service run rather than a wire in the air. */
function trunkPts(c) {
  return c.path && c.path.length > 1 ? c.path
    : [{ x: c.x, y: c.y0 }, { x: c.x1, y: c.y1 }];   // pre-path chambers, if any
}
function strokeTrunkPath(c) {
  const pts = trunkPts(c);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}
// where along the whole run a fraction 0..1 falls, and whether it is underground
function trunkPointAt(c, f) {
  const pts = trunkPts(c);
  let total = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(d); total += d;
  }
  let want = clamp(f, 0, 1) * total;
  for (let i = 0; i < seg.length; i++) {
    if (want > seg[i] && i < seg.length - 1) { want -= seg[i]; continue; }
    const t = seg[i] > 0 ? want / seg[i] : 0;
    return { x: lerp(pts[i].x, pts[i + 1].x, t), y: lerp(pts[i].y, pts[i + 1].y, t),
      buried: i > 0 && i < seg.length - 1 };
  }
  return { x: pts[0].x, y: pts[0].y, buried: false };
}
function drawConduitTrunk(c, real, now, rippleDelayFrac) {
  ctx.save();
  ctx.strokeStyle = shade(TOK.CYAN, .25); ctx.lineWidth = 3;
  strokeTrunkPath(c);
  const phase = (now % RACK_PULSE_PERIOD) / RACK_PULSE_PERIOD;
  const p = trunkPointAt(c, phase);
  // the beat dims where the run passes under the deck — the same current, seen
  // through rock, which is exactly what tells you the line is buried
  const a = p.buried ? 0.45 : 1;
  ctx.globalAlpha = a;
  ctx.fillStyle = TOK.CYAN; ctx.shadowColor = TOK.CYAN; ctx.shadowBlur = 12 * a;
  if (real) { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.fill(); }
  else { ctx.beginPath(); pathRoundRect(p.x - 5.5, p.y - 5.5, 11, 11, 4); ctx.fill(); }
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  if (rippleDelayFrac != null) {
    const rt = networkRippleT(rippleDelayFrac);
    if (rt > 0 && rt < 1) {
      const q = trunkPointAt(c, rt);
      drawGlow(q.x, q.y, 9, TOK.CYAN, 0.7 * rt * (q.buried ? 0.45 : 1));
    }
  }
  ctx.restore();
}
function drawRacks(now) {
  if (!level.racks) return;
  level.racks.forEach(r => {
    // the slung one is drawn with its sling instead, over everything else; a
    // delivered one is aboard MERCY and must not still be sitting in the room
    if (r.towed || r.delivered) return;
    drawRack(r.x, r.y, r.w || RACK_SIZE.w, r.h || RACK_SIZE.h, r.state || "mains", now,
      { cutT01: r.cutT01 != null ? r.cutT01 : null, label: r.label,
        occupants: r.occupants, slam: r.slamT });
    // P·slice — the reserve's own trace, on the box rather than in a HUD strip
    // (§7.5 explicitly refuses a strip of ECGs along the top of the screen)
    if (r.cut && !r.delivered) drawRackECG(r, now);
    if (r.moored) drawRackMounts(r);
    if (r.cradleT > 0) drawHoldRing(r.x, r.y - r.h * 0.5 - 26, r.cradleT,
      r.everTowed ? RECRADLE_T : CRADLE_T, "CRADLING…", PAL().SAFE);
    /* Owner feedback: there was no way to know how to connect, because there was
       no act to perform — the sling rigged itself on proximity. Landing on the
       box is the act now, so it has to be ASKED for. Only once the feed is cut,
       because a plugged-in rack cannot be moved and prompting for it would teach
       the sequence backwards. */
    else if (r.cut && !r.lost && !level.towedRack && ship.landedOn !== r.id)
      drawRackPrompt(r, now);
  });
}

/* ---- the moorings (owner feedback) — a rack is BOLTED to the structure ------
   Drawn as real fixings rather than a highlight: two brackets into the surface it
   is mounted on, and a strain reading while you are pulling against them. It has
   to be legible as "this is attached", or the moment where thrust does nothing
   looks like the tether being broken again. */
function drawRackMounts(r) {
  const cage = { w: (r.w || RACK_SIZE.w) * RACK_CAGE_W, h: (r.h || RACK_SIZE.h) * RACK_CAGE_H };
  const strain = clamp((r.moorT || 0) / MOOR_BREAK_T, 0, 1);
  // yielding mounts colour toward the warning as they go, so the break is earned
  const col = strain > 0.02 ? shade(PAL().WARN, .45 + strain * .55) : shade(TOK.CYAN_TEXT, .5);
  ctx.save();
  ctx.strokeStyle = col; ctx.lineWidth = 2 + strain * 1.6;
  if (strain > 0.02) { ctx.shadowColor = PAL().WARN; ctx.shadowBlur = 8 * strain; }
  if (r.mount === "wall") {
    // a bracket off the rock on each side, at the cage's shoulders
    for (const side of [-1, 1]) {
      const x = r.x + side * cage.w / 2;
      ctx.beginPath();
      ctx.moveTo(x, r.y - cage.h * 0.3); ctx.lineTo(x + side * 11, r.y - cage.h * 0.3);
      ctx.moveTo(x, r.y + cage.h * 0.3); ctx.lineTo(x + side * 11, r.y + cage.h * 0.3);
      ctx.stroke();
    }
  } else {
    // feet into the deck, splayed the way a bolted-down frame's are
    for (const side of [-1, 1]) {
      const x = r.x + side * cage.w * 0.36;
      ctx.beginPath();
      ctx.moveTo(x, r.y + cage.h / 2 - 1);
      ctx.lineTo(x + side * 7, r.y + cage.h / 2 + 10);
      ctx.moveTo(x + side * 7 - 6, r.y + cage.h / 2 + 10);
      ctx.lineTo(x + side * 7 + 6, r.y + cage.h / 2 + 10);
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

/* What to do with the box you are looking at. Deliberately the shipped hint
   register (short, imperative, no button glyph — the game has never drawn one). */
function drawRackPrompt(r, now) {
  const cage = (r.h || RACK_SIZE.h) * RACK_CAGE_H;
  const a = 0.5 + 0.3 * Math.sin(now * 2.4);
  ctx.save();
  ctx.font = mono(9, 700); ctx.textAlign = "center";
  ctx.fillStyle = shade(PAL().SAFE, a);
  ctx.fillText("LAND ON IT TO RIG THE SLING", r.x, r.y - cage / 2 - 40);
  ctx.restore();
}

/* ---- §7.3/§4.4 the reserve's trace — "not faster as it fails, but WEAKER: the
   same trace, going flat." So the rate is fixed (RACK_PULSE_PERIOD governs the
   glow; this trace runs on the same clock) and only the AMPLITUDE collapses.
   The game's one health language reused, deliberately small and in the world:
   §7.5 rules out a HUD ward, and PENDULUM_SPEC §4.4 wants it "shown only when
   towing or after first damage, to keep the dark caves clean" — here, once the
   feed is cut, which is the moment it starts to matter.
   Under REDUCED FLASH the trace still moves (motion is not the problem the
   setting exists for) but the spike is rounded off rather than sharp. */
function drawRackECG(r, now) {
  const frac = clamp(r.reserve / RACK_RESERVE_MAX, 0, 1);
  const w = 56, h = 15;
  const x = r.x - w / 2, y = r.y - r.h * 0.5 - 16;
  const color = rackColor(rackStateFor(r), now);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.beginPath();
  const mid = y + h * 0.62;
  for (let px = 0; px <= w; px += 2) {
    const t = (now - (w - px) / 90) / RACK_PULSE_PERIOD;
    const ph = ((t % 1) + 1) % 1;
    let v = 0;
    if (ph < 0.07) v = -0.18;
    else if (ph < 0.13) v = 1.0;
    else if (ph < 0.17) v = -0.4;
    else if (ph < 0.28) v = 0.16;
    // the flatlining: amplitude, never rate. A gone rack draws a dead flat line.
    v *= r.lost ? 0 : (0.18 + 0.82 * frac);
    if (reducedFlash) v *= 0.8;
    const yy = mid - v * h * 0.5;
    px === 0 ? ctx.moveTo(x + px, yy) : ctx.lineTo(x + px, yy);
  }
  ctx.strokeStyle = color; ctx.shadowColor = color;
  ctx.shadowBlur = 6; ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.shadowBlur = 0;
}
/* the shipped hold-to-act progress ring (updateBlackbox's, verbatim in shape) —
   one helper because P·slice has three of them: the trunk cut, the cradle and
   (as a countdown) the well's winch. */
function drawHoldRing(x, y, t, need, label, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 16, -Math.PI / 2, -Math.PI / 2 + clamp(t / need, 0, 1) * Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = mono(10); ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(label, x, y - 24);
  ctx.restore();
}

/* ---- §7.1 the trunks, and the isolators that close them ------------------
   Several conduits run through a chamber; one is the rack's. The trunk is drawn
   as a line from its ISOLATOR (a floor-mounted breaker you land beside) to
   whatever it feeds, so in the teaching chambers it is traceable by eye —
   §7.1's own sequencing, "placed-and-visible for the first chamber or two…
   found-by-pulse everywhere after."

   drawConduitTrunk already carries the silhouette tell (a round beat on a
   living line, a rounded square on a faked one), and it is switched on here, so
   the decoys read as his the moment a player learns to look. The
   honest-versus-metronomic layer on top of it is P·systems. */
function drawConduits(now) {
  if (!level.conduits) return;
  level.conduits.forEach((c, i) => {
    if (c.cut) {
      // a closed feed: the line goes dark and slack, with the break visible
      ctx.save();
      ctx.strokeStyle = shade(TOK.CYAN, .12); ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 9]);
      strokeTrunkPath(c);
      ctx.restore();
    } else {
      drawConduitTrunk(c, c.real, now, (i % 4) / 4);
    }
    drawIsolator(c, now);
    if (c.scanT > 0) drawHoldRing(c.x, c.y - 40, c.scanT, TRUNK_CUT_T, "CLOSING…", PAL().WARN);
  });
}

// the breaker itself — a squat floor-standing box with a throw handle, so the
// thing you land beside is visibly a thing you operate rather than a hotspot
function drawIsolator(c, now) {
  const live = !c.cut;
  const col = c.cut ? shade(TOK.CYAN_TEXT, .3) : TOK.CYAN;
  ctx.save();
  ctx.fillStyle = TOK.VOID;
  ctx.fillRect(c.x - 12, c.y - 22, 24, 22);
  ctx.strokeStyle = col; ctx.lineWidth = 1.8;
  if (live) { ctx.shadowColor = col; ctx.shadowBlur = 6; }
  ctx.strokeRect(c.x - 12, c.y - 22, 24, 22);
  // the handle: up while live, thrown down once the feed is closed
  ctx.beginPath();
  ctx.moveTo(c.x, c.y - 11);
  ctx.lineTo(c.x + (c.cut ? 8 : 0), c.y - (c.cut ? 4 : 20));
  ctx.stroke();
  ctx.shadowBlur = 0;
  // named, because a chamber has several and "which one did I already try" is a
  // question the player should never have to hold in their head
  if (c.label) {
    ctx.font = mono(9, 700); ctx.textAlign = "center";
    ctx.fillStyle = shade(c.cut ? TOK.CYAN_TEXT : TOK.CYAN, c.cut ? .35 : .7);
    ctx.fillText(c.cut ? c.label + " · CLOSED" : c.label, c.x, c.y + 12);
  }
  ctx.restore();
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

/* The chamber's MASS is raw rock, and it reuses the Hollows' own dark violet
   (TOK.VOID_MID/VOID_HIGH over VIOLET) rather than the zone's steel — the steel
   is reserved for the paved band behind a machined face, so "rock overhead,
   mechanical underfoot" reads from the fill and not only from the stroke. One
   world-anchored gradient, shared by the tiles and by the flat fills above and
   below each tile's band, so all three agree at every boundary. */
function spanRockGradient(c2d, H) {
  const g = c2d.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, ROCK_PAL.top); g.addColorStop(1, ROCK_PAL.bottom);
  return g;
}

// MACH_BAND is how deep the paving goes — thick enough to read as fitted plate
// at flight speed, thin enough that the rock behind it still dominates the mass
const MACH_BAND = 46;
function spanMachGradient(c2d, H, pal) {
  const g = c2d.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.grad[0]); g.addColorStop(1, pal.grad[1]);
  return g;
}

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

  // The gradient is anchored to the WORLD (0..H), never to this tile's band.
  // Anchoring it to the band puts a hard vertical seam at every tile boundary
  // where the band changes — Act One dodges the same trap by passing fixed
  // gradFrom/gradTo stops into buildHeightTile rather than the tile's own extent.
  tctx.fillStyle = spanRockGradient(tctx, H);
  tctx.fillRect(x0 - ov, top, (x1 - x0) + ov * 2, bot - top);

  if (!solid) {
    /* A machined face has been PAVED: a band of steel fitted into the rock
       behind it (owner steer — rock overhead, mechanical underfoot, so the
       facility reads as installed in a cave rather than as a tiled box). Laid
       down before the punch so the band can't spill into open space. */
    tctx.fillStyle = spanMachGradient(tctx, H, pal);
    for (let i = i0; i < i1; i++) {
      const xa = i * STEP, xb = (i + 1) * STEP;
      for (const sp of spans[i]) {
        const m = matchSpan(spans[i + 1], sp) || sp;
        if (sp.mb === "mach") {
          tctx.beginPath();
          tctx.moveTo(xa, sp.bot); tctx.lineTo(xb, m.bot);
          tctx.lineTo(xb, m.bot + MACH_BAND); tctx.lineTo(xa, sp.bot + MACH_BAND);
          tctx.closePath(); tctx.fill();
        }
        if (sp.mt === "mach") {
          tctx.beginPath();
          tctx.moveTo(xa, sp.top); tctx.lineTo(xb, m.top);
          tctx.lineTo(xb, m.top - MACH_BAND); tctx.lineTo(xa, sp.top - MACH_BAND);
          tctx.closePath(); tctx.fill();
        }
      }
    }

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

    /* Then edge the rock — floors and ceilings always, plus a wall wherever a
       span has no counterpart to continue into (which is what a pillar's flank
       is). Two passes, because the whole point of the material split is that a
       cut face and a raw one do not look alike: milled edges are crisp and take
       the zone's accent, raw rock is softer, violet and carries the Hollows'
       glow, which also ties Act Two's stone to Act One's. */
    tctx.globalCompositeOperation = "source-over";
    for (const mat of ["rock", "mach"]) {
      tctx.beginPath();
      let any = false;
      for (let i = i0; i < i1; i++) {
        const xa = i * STEP, xb = (i + 1) * STEP;
        for (const sp of spans[i]) {
          const fwd = matchSpan(spans[i + 1], sp), m = fwd || sp;
          if (sp.mt === mat) { tctx.moveTo(xa, sp.top); tctx.lineTo(xb, m.top); any = true; }
          if (sp.mb === mat) { tctx.moveTo(xa, sp.bot); tctx.lineTo(xb, m.bot); any = true; }
          // a flank belongs to the rock pass: a wall is where the mass is cut
          if (mat === "rock") {
            if (!fwd) { tctx.moveTo(xb, m.top); tctx.lineTo(xb, m.bot); any = true; }
            if (i > i0 && !matchSpan(spans[i - 1], sp)) {
              tctx.moveTo(xa, sp.top); tctx.lineTo(xa, sp.bot); any = true;
            }
          }
        }
      }
      if (!any) continue;
      if (mat === "mach") {
        tctx.shadowColor = pal.glow; tctx.shadowBlur = 8;
        tctx.strokeStyle = pal.stroke; tctx.lineWidth = 2;
      } else {
        tctx.shadowColor = TOK.VIOLET_DEEP; tctx.shadowBlur = 14;
        tctx.strokeStyle = TOK.VIOLET; tctx.lineWidth = 2.4;
      }
      tctx.stroke();
    }
  }
  return { canvas: c, x0, y0: top, w: x1 - x0, h: bot - top, bandTop: top, bandBot: bot, solid };
}

// same cache contract as getTiles, keyed on level._spanTiles
function getSpanTiles(lvl, xLo, xHi, pal) {
  if (!lvl._spanTiles) lvl._spanTiles = new Map();
  const map = lvl._spanTiles;
  const t0 = Math.max(0, Math.floor(xLo / TILE_W)), t1 = Math.floor(clamp(xHi, 0, lvl.W) / TILE_W);
  // drawn, not solid: §8's false floor is a ledge that renders and isn't there,
  // and its painted rock is an outcrop that collides and never renders. On an
  // honest chamber these are the same array (genChamber).
  const spans = lvl.spansDrawn || lvl.spans;
  const out = [];
  for (let ti = t0; ti <= t1; ti++) {
    const x0 = ti * TILE_W, x1 = Math.min(x0 + TILE_W, lvl.W);
    let tile = map.get(ti);
    if (!tile) tile = buildSpanTile(x0, x1, spans, lvl.H || WORLD_H, pal);
    out.push(tileTouch(map, ti, tile));
  }
  return out;
}

/* ---- the chamber's light sources (§9.2 — a plant is LIT, and lit by
   something). Additive pools over the terrain: cheap, cache-friendly (the tiles
   stay untouched, so no relighting invalidates them) and it does the job the
   owner asked of it twice over — the room gets brighter, and each fixture is a
   point of interest on a floor that is otherwise evenly surfaced.

   Ambient is lifted alongside them on purpose. Lights alone over a dark fill
   give pools in blackness, which reads as a cave with lamps in it, not as a
   maintained facility — the opposite of what §9.2 wants ("a bright, clean,
   orderly room full of people being read is worse than a dark cave").

   Two flavours, and it is not decoration: cool cyan fixtures are his, warm gold
   ones are the failing original plant they were bolted into. Under REDUCED
   FLASH the flicker goes away entirely rather than merely slowing — a fixture
   that stutters is exactly the cue that setting exists to remove. */
const LIGHT_AMBIENT = 0.10;
/* A fixture, drawn as plant hardware rather than a highlight. Ceiling fittings
   hang from a short stem under a cowl that throws the light down; floor fittings
   are uplighters on a squat base with an angled head. Both silhouettes are
   deliberately NOT a plain horizontal bar — see the note at the call site. */
function drawLightFitting(L, tint) {
  const ceil = L.snap === "ceil";
  ctx.save();
  ctx.strokeStyle = shade(tint, .55); ctx.lineWidth = 2;
  ctx.fillStyle = shade(TOK.VOID, .95);
  if (ceil) {
    ctx.beginPath(); ctx.moveTo(L.x, L.y - 12); ctx.lineTo(L.x, L.y - 3); ctx.stroke();
    ctx.beginPath();                       // the cowl: wider at the bottom
    ctx.moveTo(L.x - 7, L.y - 3); ctx.lineTo(L.x + 7, L.y - 3);
    ctx.lineTo(L.x + 12, L.y + 4); ctx.lineTo(L.x - 12, L.y + 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(tint, .9);       // the lamp behind it
    ctx.fillRect(L.x - 9, L.y + 3, 18, 3);
  } else {
    ctx.beginPath();                       // base
    ctx.moveTo(L.x - 10, L.y + 5); ctx.lineTo(L.x + 10, L.y + 5);
    ctx.lineTo(L.x + 6, L.y - 4); ctx.lineTo(L.x - 6, L.y - 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(tint, .9);       // head, aimed up and away
    ctx.beginPath();
    ctx.moveTo(L.x - 6, L.y - 4); ctx.lineTo(L.x + 6, L.y - 4);
    ctx.lineTo(L.x + 9, L.y - 11); ctx.lineTo(L.x - 3, L.y - 11);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawChamberLights(now) {
  const lights = level.lights;
  if (!lights || !lights.length) return;
  const H = level.H || WORLD_H;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  // a flat ambient lift across the whole chamber, so the room has a floor level
  // of brightness rather than only the pools
  ctx.globalAlpha = LIGHT_AMBIENT;
  ctx.fillStyle = shade(TOK.CYAN_PALE, .5);
  ctx.fillRect(0, -260, level.W, H + 320);
  for (let i = 0; i < lights.length; i++) {
    const L = lights[i];
    // a slow, shallow breath, out of phase per fixture so the hall never pulses
    // as one object; dead steady when reduced flash is on
    const flick = reducedFlash ? 1 : 0.93 + 0.07 * Math.sin(now * 1.7 + i * 2.1);
    const r = L.r || 340;
    const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, r);
    const tint = L.warm ? TOK.GOLD_WARM : TOK.CYAN_PALE;
    g.addColorStop(0, shade(tint, .40 * flick));
    g.addColorStop(0.45, shade(tint, .13 * flick));
    g.addColorStop(1, shade(tint, 0));
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(L.x - r, L.y - r, r * 2, r * 2);
    /* The fitting itself. It used to be a bare 26x5 bar, which is what the owner
       saw as an "odd artefact" — and the warm floor-mounted ones read as a yellow
       LANDING PAD, because a short horizontal gold bar on a deck is exactly what
       Act One's pads look like. A lamp has to look like a lamp: a housing with a
       cowl, oriented by what it is bolted to. */
    ctx.globalCompositeOperation = "source-over";
    drawLightFitting(L, tint);
    ctx.globalCompositeOperation = "lighter";
  }
  ctx.restore();
}

/* the chamber's rock. Called from drawWorld in place of the heightmap/roof tile
   pair when level.spans is present (js/render.js). */
function drawChamberTerrain(cx, viewW) {
  const pal = plantChamberPal();
  const H = level.H || WORLD_H;
  // the same world-anchored gradient the tiles fill with, so the rock outside a
  // tile's band is continuous with the rock inside it — no seam at any boundary
  ctx.fillStyle = spanRockGradient(ctx, H);
  for (const tile of getSpanTiles(level, cx, cx + viewW, pal)) {
    if (tile.solid) { ctx.fillRect(tile.x0, -260, tile.w, H + 320); continue; }
    // rock above and below the band: solid by definition, so nothing to stroke
    if (tile.bandTop > 0) ctx.fillRect(tile.x0, -260, tile.w, tile.bandTop + 260);
    if (tile.bandBot < H) ctx.fillRect(tile.x0, tile.bandBot, tile.w, H + 60 - tile.bandBot);
    ctx.drawImage(tile.canvas, tile.x0, tile.y0, tile.w, tile.h);
  }
}

/* §5 — the machined tell: short ticks cut into the rock just past a plant's
   surfaces, so a milled face reads differently from raw rock. Drawn INTO the
   rock (below a floor, above a ceiling) over the terrain tile, as the heightmap
   version did. Spans mean an overhang's underside gets them too, not just the
   column's lowest floor. */
function drawMachinedPanelTicks(x0, x1) {
  const spans = level.spansDrawn || level.spans;   // ticks belong to what you SEE
  if (!spans) return;
  const i0 = Math.max(0, Math.floor(x0 / STEP)), i1 = Math.min(spans.length - 1, Math.ceil(x1 / STEP));
  const spacing = Math.max(1, Math.round(90 / STEP));
  ctx.save();
  ctx.strokeStyle = shade(TOK.VOID, .5); ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = i0; i <= i1; i += spacing) {
    const x = i * STEP;
    for (const sp of spans[i]) {
      // only a MILLED face is ticked — raw rock has no panel joints to show
      if (sp.mb === "mach") { ctx.moveTo(x, sp.bot + 8); ctx.lineTo(x, sp.bot + 30); }
      if (sp.mt === "mach") { ctx.moveTo(x, sp.top - 8); ctx.lineTo(x, sp.top - 30); }
    }
  }
  ctx.stroke();
  ctx.restore();
}

/* ---- §5 ornamentation — decorative first, some becomes solid later; solid/
   filled forms rather than thin wireframes, which read as unfinished at a
   glance. World-space furniture dressing a plant chamber. */
/* Owner feedback: this is the "blue thing that looks like a picnic table", and it
   was being read as a gun that shoots you — two horizontal rails with an A-frame
   between them is a trestle in silhouette, and the eye fills in the rest. It has
   never had any code that can fire; what killed the owner near it was §8's
   painted rock 200px to its right.

   Redrawn as what it is: a junction cabinet, boxy and solid, with cable stubs
   leaving it at the bottom. A closed box with conduits entering it cannot be
   mistaken for something with a barrel. */
function drawJunctionTruss(x, y, scale, color) {
  const w = 46 * scale, h = 40 * scale;
  ctx.save();
  ctx.fillStyle = TOK.VOID;
  ctx.strokeStyle = color; ctx.lineWidth = 2.2 * scale;
  ctx.shadowColor = color; ctx.shadowBlur = 5;
  ctx.fillRect(x, y - h, w, h);
  ctx.strokeRect(x, y - h, w, h);
  ctx.shadowBlur = 0;
  // a door seam and two latches, so it reads as something openable
  ctx.strokeStyle = shade(color, .45); ctx.lineWidth = 1.4 * scale;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y - h + 3); ctx.lineTo(x + w * 0.5, y - 3);
  ctx.moveTo(x + w * 0.5 - 5, y - h * 0.62); ctx.lineTo(x + w * 0.5 + 5, y - h * 0.62);
  ctx.moveTo(x + w * 0.5 - 5, y - h * 0.38); ctx.lineTo(x + w * 0.5 + 5, y - h * 0.38);
  ctx.stroke();
  // cable stubs into the deck
  ctx.strokeStyle = shade(color, .6); ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.22, y); ctx.lineTo(x + w * 0.22, y + 7 * scale);
  ctx.moveTo(x + w * 0.78, y); ctx.lineTo(x + w * 0.78, y + 7 * scale);
  ctx.stroke();
  ctx.restore();
}
/* Owner feedback ("some odd artefacts like this line above the dart") — a conduit
   run FOLLOWS THE FLOOR. It was one straight horizontal line snapped only at its
   left-hand end, so over a hall with 22px of roughness, a ramp, or the drop into
   the shaft, the right-hand end hung in mid-air: a perfectly straight line across
   open space, which is unreadable as anything. Sampled along its length instead,
   the same fix trunkPath makes for the same reason. */
function drawConduitRunOrnament(x, y, w, now) {
  const at = px => {
    if (!level.spans) return y;
    const col = level.spans[clamp(Math.round(px / STEP), 0, level.spans.length - 1)] || [];
    const sp = pickSpan(col, y);
    return sp ? sp.bot - 4 : y;
  };
  const step = 48, pts = [];
  for (let px = x; px < x + w; px += step) pts.push({ x: px, y: at(px) });
  pts.push({ x: x + w, y: at(x + w) });
  ctx.save();
  ctx.strokeStyle = shade(TOK.CYAN, .4); ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  const phase = (now % RACK_PULSE_PERIOD) / RACK_PULSE_PERIOD;
  const gi = clamp(Math.floor(phase * (pts.length - 1)), 0, pts.length - 1);
  drawGlow(pts[gi].x, pts[gi].y, 6, TOK.CYAN, 1);
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

/* ---- §8.1 THE DECEPTION TELL, first pass (owner feedback, July 2026) --------
   "We do want some kind of invisible walls, etc (but maybe not quite so
   completely impossible to spot!)" — so the deceptions stay and gain a tell.
   Both of them are still authored and still lie: SLICE_CHAMBER carries a false
   floor (drawn, not solid) and painted rock (solid, never drawn), and the
   worldgen test still requires the two views to differ ONLY inside a part that
   declared a `view`.

   ONE mechanism gives both tells, which is why it is worth doing this way rather
   than bolting a marker onto each hazard: settling DUST. Motes drift down and
   come to rest on the first thing that is actually solid — tested with `solidAt`,
   the same predicate collision uses, so the dust cannot know anything the physics
   doesn't. Then:

     a FALSE FLOOR    motes fall straight THROUGH the surface you can see
     PAINTED ROCK     motes come to rest on nothing, in mid-air

   Both read as wrong without being labelled, which is what §8.1 asks for — it is
   information, not an arrow. And it is honest in the other direction too: an
   ordinary floor collects dust exactly the same way, so the presence of motes is
   never itself a tell. You have to notice where they stop.

   §8.1's other channels — no grit off a projection when you scrape it, no lamp
   shadow on a lie — remain P·systems. This is the readability floor, not the
   finished feature: enough that a careful player can spot a lie before it costs
   them, which is the bar the owner set. */
const DUST_N = 90;             // motes alive at once across the visible band
const DUST_FALL = 26;          // px/s — slow enough to watch one land
let a2Dust = null;

function dustReset() { a2Dust = null; }
function updateChamberDust(now, viewX0, viewX1) {
  if (!level.spans) { a2Dust = null; return; }
  if (!a2Dust) a2Dust = [];
  const H = level.H || WORLD_H;
  // recycle anything that has drifted out of the visible band, so the pool
  // follows the camera down a 9000px floor without growing
  for (const d of a2Dust) if (d.x < viewX0 - 80 || d.x > viewX1 + 80) d.dead = true;
  while (a2Dust.length < DUST_N) a2Dust.push({ dead: true });
  for (const d of a2Dust) {
    if (d.dead) {
      d.x = viewX0 + Math.random() * (viewX1 - viewX0);
      d.y = Math.random() * H * 0.5;
      d.settled = false; d.dead = false; d.t = 0;
      d.drift = (Math.random() - 0.5) * 7;
      d.a = 0.25 + Math.random() * 0.4;
      continue;
    }
    d.t += 1 / 60;
    if (d.settled) {
      // rest a while, then fall again from the top — a hazard has to keep
      // telling on itself, because the player is not looking when it first lands
      if (d.t > 5 + d.a * 6) d.dead = true;
      continue;
    }
    d.y += DUST_FALL * (1 / 60);
    d.x += d.drift * (1 / 60);
    /* The whole tell, in one predicate. Dust settles on what is SOLID, not on
       what is drawn — so it passes through a false floor and stacks up on a face
       that was never painted in. */
    if (solidAt(d.x, d.y)) { d.settled = true; d.y -= 1; d.t = 0; }
    else if (d.y > H) d.dead = true;
  }
}
function drawChamberDust() {
  if (!a2Dust) return;
  ctx.save();
  for (const d of a2Dust) {
    if (d.dead) continue;
    // settled motes are brighter: a resting mote is the one carrying information
    ctx.fillStyle = shade(TOK.CYAN_PALE, d.settled ? d.a * 0.9 : d.a * 0.45);
    ctx.fillRect(d.x, d.y, d.settled ? 1.6 : 1.2, d.settled ? 1.6 : 1.2);
  }
  ctx.restore();
}

/* ---- fuel cans (owner feedback, July 2026) --------------------------------
   A jerrican: squat body, a shoulder chamfer and a cap, plus a slow breathing
   glow so it is findable across a dark 9000px floor without a HUD marker. Drawn
   solid rather than as a wireframe, the same call the ornaments made — a thin
   outline at this size reads as unfinished. Gold, because fuel is the one thing
   down here that is neither his network (cyan) nor a life (green). */
function drawFuelCan(f, now) {
  const w = 20, h = 26, x = f.x, y = f.y;
  const pulse = 0.72 + 0.28 * Math.sin(now * 1.7 + f.x * 0.01);
  ctx.save();
  drawGlow(x, y, 22, TOK.GOLD, 0.32 * pulse);
  ctx.fillStyle = TOK.VOID;
  ctx.strokeStyle = TOK.GOLD; ctx.lineWidth = 2;
  ctx.shadowColor = TOK.GOLD; ctx.shadowBlur = 7 * pulse;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2 + 5);
  ctx.lineTo(x - w / 2 + 5, y - h / 2);      // chamfered shoulder
  ctx.lineTo(x + w / 2 - 5, y - h / 2);
  ctx.lineTo(x + w / 2, y - h / 2 + 5);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.lineTo(x - w / 2, y + h / 2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  // the cap, and a band across the body so it doesn't read as a plain box
  ctx.beginPath();
  ctx.moveTo(x - 3, y - h / 2 - 3); ctx.lineTo(x + 3, y - h / 2 - 3);
  ctx.moveTo(x - w / 2 + 3, y + 2); ctx.lineTo(x + w / 2 - 3, y + 2);
  ctx.stroke();
  ctx.restore();
}
function drawFuelCans(now) {
  if (!level.fuelCans) return;
  for (const f of level.fuelCans) if (!f.taken) drawFuelCan(f, now);
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
  /* Where the cable meets the rack: its own top rail. Defaulted to the real cage
     half-height rather than the old magic 45, which was fitted to the first
     pass's 112px cage — against the final 48px cage it put the rack's anchor
     ABOVE the ship's, so the cable was drawn ~9px long and pointing upwards.
     That is the "cable looks very short" the owner spotted. */
  const top = rackTopOffset != null ? rackTopOffset : RACK_SIZE.h * RACK_CAGE_H / 2;
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

/* ---- §4.4 always readable: the swing tell -------------------------------
   A glyph at the tether's midpoint, because that is where the player's eye
   already is when a load is swinging. Three states, and they carry SHAPE as
   well as colour per the H2 redundancy rule, so the tell survives colourblind
   mode with the colour channel removed entirely:

     ✓  docile      — the load is following you
     !  swinging    — fast enough that a contact would now cost integrity
     ✕  about to hurt — swinging fast AND close to rock

   The threshold is the damage threshold itself (SLING_SAFE_V, widened by FIELD
   MEDIC exactly as the damage is), so the warning cannot drift out of step with
   what actually costs. */
function slingTellState(r) {
  const safe = easyMode ? SLING_SAFE_V * 1.3 : SLING_SAFE_V;
  const v = Math.hypot(r.vx || 0, r.vy || 0);
  if (v <= safe * 0.75) return "ok";
  const cage = { w: RACK_SIZE.w * RACK_CAGE_W, h: RACK_SIZE.h * RACK_CAGE_H };
  const ahead = 0.16;   // where the load will be in a sixth of a second
  const nx = r.x + (r.vx || 0) * ahead, ny = r.y + (r.vy || 0) * ahead;
  const close = solidAt(nx, ny + cage.h / 2) || solidAt(nx, ny - cage.h / 2) ||
    solidAt(nx + cage.w / 2, ny) || solidAt(nx - cage.w / 2, ny);
  return close && v > safe ? "hurt" : "warn";
}
function drawSlingTell(shipX, shipY, r) {
  const st = slingTellState(r);
  const glyph = st === "hurt" ? "✕" : st === "warn" ? "!" : "✓";
  const color = st === "hurt" ? PAL().DANGER : st === "warn" ? PAL().WARN : PAL().SAFE;
  // docile is the resting state and must not nag: it draws faint, the warnings bright
  const alpha = st === "ok" ? 0.32 : 0.95;
  const mx = (shipX + r.x) / 2, my = (shipY + SLING_SHIP_ANCHOR + r.y) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = mono(13, 700); ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  if (st !== "ok") { ctx.shadowColor = color; ctx.shadowBlur = 8; }
  ctx.fillText(glyph, mx + 13, my);
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}

/* the slung load, its cable, its tell and its trace — one call, drawn over the
   world so a swinging rack is never lost behind terrain it is about to hit. */
function drawTowedRack(now) {
  const r = level.towedRack;
  drawSlingLine(ship.x, ship.y, r.x, r.y, r.tension != null ? r.tension : .55, now);
  drawRack(r.x, r.y, r.w || RACK_SIZE.w, r.h || RACK_SIZE.h, rackStateFor(r), now,
    { occupants: r.occupants, slam: r.slamT });
  drawRackECG(r, now);
  drawSlingTell(ship.x, ship.y, r);
}

/* ---- §7.4 the transfusion line, inverted. Act One's resupply line runs FROM
   the drone INTO you; this one runs from you into the box. Same visual language
   as drawSlingLine (a sagging cyan cable) turned the other way up, with the
   travelling bead running DOWN it — the direction of flow is the whole point of
   the inversion and it should be readable without a word of text. Stalls (the
   line stretched but not parted) drop to a dashed line with no bead: stretched,
   no flow, exactly as Act One's occluded state reads. */
function drawGiveLine(line, now) {
  const r = line.rack;
  const x0 = ship.x, y0 = ship.y + SLING_SHIP_ANCHOR;
  const x1 = r.x, y1 = r.y - RACK_SIZE.h * RACK_CAGE_H / 2 - 4;
  const col = PAL().DANGER;   // it is blood, and it is yours
  ctx.save();
  ctx.strokeStyle = shade(col, line.stall ? .3 : .8);
  ctx.lineWidth = 2;
  if (line.stall) ctx.setLineDash([4, 7]);
  ctx.shadowColor = col; ctx.shadowBlur = line.stall ? 2 : 9;
  const midX = (x0 + x1) / 2 + 16, midY = (y0 + y1) / 2 + 14;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(midX, midY, x1, y1);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
  if (line.stall) return;
  // the bead, travelling from you toward them
  const p = (now * 1.6) % 1;
  const bx = lerp(lerp(x0, midX, p), lerp(midX, x1, p), p);
  const by = lerp(lerp(y0, midY, p), lerp(midY, y1, p), p);
  drawGlow(bx, by, 5, col, .9);
  drawAnchorRing(x0, y0);
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
  // idle is where the load actually hangs: SLING_L below the hull, not the magic
  // 66 this shipped with (which predated the derived sling and left the winch
  // starting from a point the rack was never at)
  const idleX = shipX, idleY = shipY + SLING_L;
  // swings out to the ship's side on the way up, so it never reads as passing through the hull
  const x = lerp(idleX, slot.x, eased) + Math.sin(eased * Math.PI) * 44;
  const y = lerp(idleY, slot.y, eased);
  return { x, y, eased };
}
function drawWellDock(now) {
  const well = level.wellDock;
  drawWellBay(well, now);
  /* The winch beat is drawn only while a load is actually being seated. It used
     to draw unconditionally, which put a phantom rack under the ship any time a
     level carried a well — invisible while nothing set level.wellDock, and
     wrong the moment P·slice did. */
  if (!well.docking) return;
  const rackPos = wellRackPos(well, ship.x, ship.y, now);
  drawSlingLine(ship.x, ship.y, rackPos.x, rackPos.y, well.tension != null ? well.tension : 0.6, now);
  drawRack(rackPos.x, rackPos.y, RACK_SIZE.w, RACK_SIZE.h,
    well.rackState || "reserve", now, { occupants: well.occupants });
  if (rackPos.eased >= 1) {
    ctx.save();
    const g = ctx.createRadialGradient(rackPos.x, rackPos.y, 4, rackPos.x, rackPos.y, 70);
    g.addColorStop(0, shade(PAL().SAFE, .35)); g.addColorStop(1, shade(PAL().SAFE, 0));
    ctx.fillStyle = g; ctx.fillRect(rackPos.x - 90, rackPos.y - 90, 180, 180);
    ctx.restore();
  }
}
/* ================ end js/acttwo-render.js ================ */
