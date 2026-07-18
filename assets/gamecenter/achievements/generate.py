#!/usr/bin/env python3
"""Generate Hollow Oath Game Center achievement art as SVG.

House style (from index.html / icon-512.png): neon vector strokes on deep
space-navy, palette cyan #00e5ff / green #69f0ae / amber #ffc400 / pink
#ff4081 / purple #b388ff, starfield, glow. Composed for Game Center's
circular crop: all meaning inside r=430 of a 1024x1024 canvas.
"""
import math, os, random

W = 1024
CX = CY = 512
OUT = os.path.join(os.path.dirname(__file__), "svg")
os.makedirs(OUT, exist_ok=True)

CYAN = "#00e5ff"; PALE = "#aef4ff"; GREEN = "#69f0ae"; AMBER = "#ffc400"
GOLD = "#ffd54f"; PINK = "#ff4081"; PURPLE = "#b388ff"; RED = "#ff1744"
ORANGE = "#ff6d00"; INK = "#05060f"


def stars(seed, n=70, avoid_r=340):
    rng = random.Random(seed)
    out = []
    while len(out) < n:
        x = rng.uniform(30, W - 30); y = rng.uniform(30, W - 30)
        d = math.hypot(x - CX, y - CY)
        if d < avoid_r or d > 500:
            continue
        r = rng.choice([1.2, 1.6, 2.0, 2.6])
        o = rng.uniform(0.25, 0.85)
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="#dff8ff" opacity="{o:.2f}"/>')
    return "\n".join(out)


def shell(name, seed, accent, body):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs>
  <radialGradient id="bg" cx="50%" cy="42%" r="75%">
    <stop offset="0%" stop-color="#1b1040"/>
    <stop offset="55%" stop-color="#0c0820"/>
    <stop offset="100%" stop-color="{INK}"/>
  </radialGradient>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="10" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="glowBig" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="22" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<rect width="1024" height="1024" fill="url(#bg)"/>
{stars(seed)}
<circle cx="512" cy="512" r="482" fill="none" stroke="{accent}" stroke-width="4" opacity="0.22"/>
<circle cx="512" cy="512" r="452" fill="none" stroke="{accent}" stroke-width="7" opacity="0.55" filter="url(#glow)"/>
{body}
</svg>'''
    with open(os.path.join(OUT, name + ".svg"), "w") as f:
        f.write(svg)
    print("wrote", name)


def asclepius(x, y0, y1, staff_col, snake_col, sw=16):
    """Rod of Asclepius: vertical staff, single serpent S-weave, small head."""
    h = y1 - y0
    p = (f"M {x} {y0+h*0.10} "
         f"C {x+95} {y0+h*0.16}, {x+95} {y0+h*0.30}, {x} {y0+h*0.38} "
         f"C {x-95} {y0+h*0.46}, {x-95} {y0+h*0.60}, {x} {y0+h*0.68} "
         f"C {x+95} {y0+h*0.76}, {x+95} {y0+h*0.90}, {x} {y0+h*0.96}")
    return f'''<g filter="url(#glow)">
  <line x1="{x}" y1="{y0}" x2="{x}" y2="{y1}" stroke="{staff_col}" stroke-width="{sw-2}" stroke-linecap="round"/>
  <path d="{p}" fill="none" stroke="{snake_col}" stroke-width="{sw}" stroke-linecap="round"/>
  <circle cx="{x+14}" cy="{y0+h*0.085}" r="15" fill="{snake_col}"/>
  <line x1="{x+26}" y1="{y0+h*0.075}" x2="{x+48}" y2="{y0+h*0.055}" stroke="{snake_col}" stroke-width="6" stroke-linecap="round"/>
</g>'''


# ---------------------------------------------------------------- 1. OATH KEEPER
body = f'''
<circle cx="512" cy="512" r="318" fill="none" stroke="{GREEN}" stroke-width="12" filter="url(#glowBig)"/>
{asclepius(512, 300, 730, PALE, GREEN, 17)}
<g stroke="{PALE}" stroke-width="6" stroke-linecap="round" filter="url(#glow)" opacity="0.9">
  <line x1="512" y1="128" x2="512" y2="168"/><line x1="492" y1="148" x2="532" y2="148"/>
</g>'''
shell("oath_keeper", 1, GREEN, body)

# ------------------------------------------------------------- 2. HOLLOW KEEPER
# oath ring cracked (but closed) + amber fissure; the rod stands in a cave
# ring endpoints on r=318 at -70 deg and -30 deg (gap upper right)
crack = "M 621 213 L 662 262 L 628 306 L 706 328 L 787 353"
body = f'''
<g filter="url(#glowBig)">
  <path d="M 621 213 A 318 318 0 1 0 787 353" fill="none" stroke="{PURPLE}" stroke-width="12"/>
</g>
<path d="{crack}" fill="none" stroke="{AMBER}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)"/>
<g fill="{INK}" stroke="{PURPLE}" stroke-width="6" filter="url(#glow)">
  <path d="M 388 232 L 418 232 L 403 306 Z"/>
  <path d="M 472 210 L 506 210 L 489 316 Z"/>
  <path d="M 556 216 L 586 216 L 571 292 Z"/>
</g>
{asclepius(512, 360, 760, PURPLE, AMBER, 16)}'''
shell("hollow_keeper", 2, PURPLE, body)

# ------------------------------------------------------- 3. THE ONE WHO ANSWERED
body = f'''
<polyline points="150,730 250,690 330,724 420,682 512,712 610,676 700,716 800,684 874,714"
  fill="none" stroke="{PURPLE}" stroke-width="9" stroke-linejoin="round" filter="url(#glow)" opacity="0.9"/>
<g filter="url(#glow)">
  <line x1="620" y1="688" x2="620" y2="420" stroke="{CYAN}" stroke-width="12" stroke-linecap="round"/>
  <path d="M 620 420 L 578 500 M 620 420 L 662 500 M 592 470 L 648 470" stroke="{CYAN}" stroke-width="9" fill="none" stroke-linecap="round"/>
  <circle cx="620" cy="392" r="17" fill="{GOLD}"/>
</g>
<g fill="none" stroke="{CYAN}" stroke-width="8" stroke-linecap="round" filter="url(#glow)">
  <path d="M 566 330 A 80 80 0 0 1 674 330" opacity="0.95"/>
  <path d="M 528 276 A 132 132 0 0 1 712 276" opacity="0.65"/>
  <path d="M 492 224 A 184 184 0 0 1 748 224" opacity="0.4"/>
</g>
<g filter="url(#glow)">
  <path d="M 356 682 L 316 590 L 396 590 Z" fill="none" stroke="{PALE}" stroke-width="9" stroke-linejoin="round" transform="rotate(180 356 636)"/>
</g>'''
shell("the_one_who_answered", 3, CYAN, body)

# ------------------------------------------------------------- 4. SECTOR WARDEN
body = f'''
<path d="M 512 176 L 796 268 C 796 520, 720 700, 512 830 C 304 700, 228 520, 228 268 Z"
  fill="none" stroke="{AMBER}" stroke-width="13" stroke-linejoin="round" filter="url(#glowBig)"/>
<path d="M 300 520 L 420 520 L 448 448 L 484 588 L 512 520 L 724 520"
  fill="none" stroke="{RED}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
<g stroke="{ORANGE}" stroke-width="7" stroke-linecap="round" filter="url(#glow)" opacity="0.9">
  <line x1="596" y1="470" x2="620" y2="446"/>
  <line x1="636" y1="486" x2="668" y2="472"/>
  <line x1="640" y1="560" x2="668" y2="574"/>
</g>'''
shell("sector_warden", 4, AMBER, body)

# ----------------------------------------------------------- 5. GLYCON UNMASKED
body = f'''
<g filter="url(#glowBig)">
  <path d="M 430 760 C 300 740, 300 620, 430 600 C 560 580, 600 520, 540 440 C 500 386, 520 320, 580 300"
    fill="none" stroke="{PINK}" stroke-width="18" stroke-linecap="round"/>
  <circle cx="598" cy="286" r="26" fill="{PINK}"/>
  <path d="M 620 274 L 660 252 M 620 274 L 662 282" stroke="{PINK}" stroke-width="7" stroke-linecap="round" fill="none"/>
</g>
<g transform="rotate(24 636 620)" filter="url(#glow)">
  <path d="M 566 520 C 566 480, 706 480, 706 520 C 706 610, 672 668, 636 668 C 600 668, 566 610, 566 520 Z"
    fill="none" stroke="{PURPLE}" stroke-width="10"/>
  <ellipse cx="608" cy="546" rx="16" ry="11" fill="{PURPLE}"/>
  <ellipse cx="664" cy="546" rx="16" ry="11" fill="{PURPLE}"/>
  <path d="M 604 616 Q 636 636 668 616" fill="none" stroke="{PURPLE}" stroke-width="8" stroke-linecap="round"/>
</g>
<g fill="{AMBER}" filter="url(#glow)">
  <path d="M 380 846 L 398 864 L 380 882 L 362 864 Z"/>
  <path d="M 512 862 L 530 880 L 512 898 L 494 880 Z"/>
  <path d="M 644 846 L 662 864 L 644 882 L 626 864 Z"/>
</g>'''
shell("glycon_unmasked", 5, PINK, body)

# ----------------------------------------------------------------- 6. ARCHIVIST
blocks = []
grid = [(4, 306), (4, 418), (4, 530), (2, 642)]
for n, y in grid:
    total = n * 96 + (n - 1) * 20
    x0 = CX - total / 2
    for i in range(n):
        x = x0 + i * 116
        blocks.append(f'<rect x="{x:.0f}" y="{y}" width="96" height="80" rx="12" fill="{AMBER}" opacity="0.92"/>')
body = f'''
<rect x="282" y="216" width="460" height="574" rx="30" fill="none" stroke="{AMBER}" stroke-width="11" filter="url(#glowBig)"/>
<line x1="322" y1="262" x2="558" y2="262" stroke="{GOLD}" stroke-width="9" stroke-linecap="round" filter="url(#glow)"/>
<circle cx="690" cy="262" r="11" fill="{GREEN}" filter="url(#glow)"/>
<g filter="url(#glow)">{''.join(blocks)}</g>'''
shell("archivist", 6, AMBER, body)

# --------------------------------------------------------- 7. SPOTLESS ROTATION
pips = []
for i in range(7):
    a = -90 + i * (360 / 7)
    x = CX + 330 * math.cos(math.radians(a)); y = CY + 330 * math.sin(math.radians(a))
    pips.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="24" fill="{GREEN}"/>')
body = f'''
<circle cx="512" cy="512" r="330" fill="none" stroke="{GREEN}" stroke-width="5" opacity="0.4"/>
<g filter="url(#glowBig)">{''.join(pips)}</g>
<g filter="url(#glow)">
  <circle cx="512" cy="392" r="62" fill="none" stroke="{PALE}" stroke-width="10"/>
  <circle cx="489" cy="386" r="9" fill="{PALE}"/><circle cx="535" cy="386" r="9" fill="{PALE}"/>
  <rect x="428" y="472" width="168" height="196" rx="34" fill="none" stroke="{PALE}" stroke-width="10"/>
  <path d="M 540 512 C 496 526, 496 556, 540 570 C 578 582, 578 606, 540 618" fill="none" stroke="{GREEN}" stroke-width="9" stroke-linecap="round"/>
</g>
<path d="M 700 300 A 284 284 0 0 1 760 620" fill="none" stroke="{GREEN}" stroke-width="7" opacity="0.7" filter="url(#glow)"/>
<path d="M 760 620 l -14 -40 M 760 620 l 36 -20" stroke="{GREEN}" stroke-width="7" stroke-linecap="round" opacity="0.7" filter="url(#glow)"/>'''
shell("spotless_rotation", 7, GREEN, body)

# --------------------------------------------------------- 8. FIRST DO NO HARM
body = f'''
<circle cx="512" cy="512" r="296" fill="none" stroke="{PALE}" stroke-width="9" opacity="0.75" filter="url(#glow)"/>
<path d="M 130 512 L 380 512 L 432 400 L 500 646 L 556 452 L 596 512 L 894 512"
  fill="none" stroke="{GREEN}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" filter="url(#glowBig)"/>
<path d="M 512 292 C 468 306, 468 336, 512 350 C 550 362, 550 386, 512 398"
  fill="none" stroke="{GOLD}" stroke-width="9" stroke-linecap="round" filter="url(#glow)"/>
<g fill="none" stroke="{GREEN}" stroke-width="7" filter="url(#glow)" opacity="0.9">
  <rect x="418" y="708" width="52" height="52" rx="10"/>
  <rect x="486" y="708" width="52" height="52" rx="10"/>
  <rect x="554" y="708" width="52" height="52" rx="10"/>
</g>'''
shell("first_do_no_harm", 8, GREEN, body)

# ------------------------------------------------------------ 9. THE FULL CODEX
cst = []
pts = [(392, 322), (470, 268), (552, 300), (628, 244), (700, 296),
       (338, 396), (438, 386), (516, 356), (594, 372), (672, 384), (742, 372)]
for i in range(len(pts) - 1):
    x1, y1 = pts[i]; x2, y2 = pts[i + 1]
    cst.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{GOLD}" stroke-width="3" opacity="0.45"/>')
for x, y in pts:
    cst.append(f'<circle cx="{x}" cy="{y}" r="9" fill="#fff"/>')
    cst.append(f'<circle cx="{x}" cy="{y}" r="16" fill="none" stroke="{GOLD}" stroke-width="3" opacity="0.6"/>')
body = f'''
<g filter="url(#glow)">{''.join(cst)}</g>
<g filter="url(#glowBig)" fill="none" stroke="{GOLD}" stroke-width="12" stroke-linejoin="round">
  <path d="M 512 500 C 430 452, 330 452, 258 492 L 258 712 C 330 672, 430 672, 512 720 Z"/>
  <path d="M 512 500 C 594 452, 694 452, 766 492 L 766 712 C 694 672, 594 672, 512 720 Z"/>
</g>
<g fill="none" stroke="{GOLD}" stroke-width="6" opacity="0.65" filter="url(#glow)">
  <path d="M 306 536 C 366 508, 428 508, 476 534"/>
  <path d="M 306 594 C 366 566, 428 566, 476 592"/>
  <path d="M 306 652 C 366 624, 428 624, 476 650"/>
  <path d="M 548 534 C 596 508, 658 508, 718 536"/>
  <path d="M 548 592 C 596 566, 658 566, 718 594"/>
  <path d="M 548 650 C 596 624, 658 624, 718 652"/>
</g>'''
shell("the_full_codex", 9, GOLD, body)

print("done")
