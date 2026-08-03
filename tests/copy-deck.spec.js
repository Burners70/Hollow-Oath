// Hollow Oath — copy-deck drift guard.
//
// docs/COPY_DECK.md mirrors every player-facing string for owner review, and the
// house rule is that a PR changing copy updates the deck in the same PR (see
// APP_STORE_ROADMAP.md — "How to work on this"). Nothing enforced that, so the
// deck quietly rotted: four banner rows still described pre-E1/E2/S4 wording
// that no longer existed in the code. This test makes that failure loud.
//
// It checks the deck AGAINST the code, in the direction that catches rot: every
// banner-style string the deck quotes in backticks must still appear in `js/`.
// It deliberately does not attempt the reverse (every string in the code must be
// in the deck) — the deck summarises some surfaces rather than listing them, so
// that direction would be noise, not signal.
//
// If this fails, the fix is normally to update the deck (or, if copy was
// deliberately retired, move the quote into HISTORICAL below with a reason).
// Don't loosen the extractor to make it pass.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DECK = path.join(ROOT, "docs", "COPY_DECK.md");

// Copy the deck quotes but the game no longer contains — retired wording kept in
// the deck as a record. Each entry needs a reason.
const HISTORICAL = new Map([
  ["PASSENGER KILLED BY VECTOR", "S7 promoted it to the 'A PASSENGER IS DEAD' banner; the deck records the old floating text"],
  ["THEY DON'T COME BACK. THIS FLOOR STARTS OVER.", "P·intake dropped the second sentence: the chamber checkpoint is P·persist's and has not landed, so nothing restarts. The deck records the old second line and why it went"],
]);

// Deck notation that isn't a literal string: section titles, templates, and
// enumerations written for the reader rather than quoted from the code.
const NOTATION = new Set([
  "THE HEADS-UP DISPLAY",   // §7 heading, not a string in the game
  "USE CONTROLLER · ON",    // written `ON|OFF` — a toggle's two states
  "THE HOLLOWS · I/II/III", // shorthand for the three cave titles
]);

function jsSource() {
  const dir = path.join(ROOT, "js");
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".js"))
    .map(f => fs.readFileSync(path.join(dir, f), "utf8"))
    .join("\n")
    .replace(/\s+/g, " ");            // banners embed \n; compare on one line
}

// Pull the banner-style quotes out of the deck: backticked spans, split on the
// deck's ` / ` two-line separator, then split again at placeholders (`<n>`,
// `<SECTOR NAME>`) because the code assembles those by concatenation — each
// literal segment either exists in the source verbatim or the deck has drifted.
// A segment is kept only if it's substantial and ALL CAPS, i.e. a banner or a
// pill rather than prose or an identifier. Trailing score deltas (`+750`,
// `-200`) are dropped for the same reason as placeholders: the code computes
// them, the deck writes them inline for the reader.
function deckBanners(deck) {
  const found = new Set();
  for (const m of deck.matchAll(/`([^`\n]+)`/g)) {
    for (const part of m[1].split(/ \/ |\|/)) {
      for (const seg of part.split(/<[^>]*>/)) {
        const frag = seg
          .replace(/\s+/g, " ")
          .replace(/\s*[+\-−]\s*\d+\s*$/, "")   // trailing score delta
          .trim()
          .replace(/^[·—\-/]+|[·—\-/]+$/g, "")
          .trim();
        const letters = frag.replace(/[^A-Za-z]/g, "");
        if (frag.length < 14 || letters.length < 10) continue;
        if (letters !== letters.toUpperCase()) continue;
        found.add(frag);
      }
    }
  }
  return [...found];
}

test("COPY_DECK.md has not drifted from the strings in js/", () => {
  const deck = fs.readFileSync(DECK, "utf8");
  const src = jsSource();
  const banners = deckBanners(deck);

  // Guard the guard: if the extractor stops finding quotes (deck reformatted,
  // regex broken), fail here rather than silently passing on an empty list.
  expect(banners.length, "banner-style quotes found in COPY_DECK.md").toBeGreaterThan(40);

  const missing = banners.filter(b =>
    !src.includes(b) && !HISTORICAL.has(b) && !NOTATION.has(b));

  expect(missing, "deck quotes with no match in js/ — update the deck (or add to HISTORICAL with a reason)").toEqual([]);
});

test("the deck's HISTORICAL and NOTATION exemptions stay honest", () => {
  const src = jsSource();
  // A string listed as retired that reappears in the code means the list is
  // stale: drop the entry so the string is genuinely guarded again.
  const revived = [...HISTORICAL.keys()].filter(s => src.includes(s));
  expect(revived, "listed as retired but present in js/ — remove from HISTORICAL").toEqual([]);

  // Every exemption must still be one the extractor actually produces. If the
  // deck stopped quoting it, the exemption is dead weight — delete it, so the
  // skip lists can't quietly grow into a way of ignoring real drift.
  const banners = new Set(deckBanners(fs.readFileSync(DECK, "utf8")));
  const unused = [...HISTORICAL.keys(), ...NOTATION].filter(s => !banners.has(s));
  expect(unused, "exemption the deck no longer quotes — remove it").toEqual([]);
});
