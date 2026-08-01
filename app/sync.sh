#!/usr/bin/env bash
# Bundle E1 — copy the web game into the wrapper's webDir.
# The repo root stays the source of truth; NEVER edit app/www by hand.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p www
cp ../index.html ../manifest.webmanifest \
   ../icon-192.png ../icon-512.png ../apple-touch-icon.png www/
# index.html now loads its code from js/*.js and css/game.css (the no-build
# split) — mirror those dirs into the webDir too, or the wrapped build 404s.
rm -rf www/js www/css
cp -R ../js ../css www/

# Stamp the ACTUAL bundled content into BUILD_TAG (shown bottom-right on the
# title). The web source keeps a static default tag; here we overwrite the tag
# *in the generated copy only* with the sync date plus a short hash of the JS +
# CSS that this build actually contains. That makes a stale wrapper self-evident:
# if a build was archived without re-running this sync, its on-screen tag shows
# an old date/hash instead of matching the current web source — which is exactly
# how the "updated screens missing from the native build" report slipped through.
# This only ever touches www/ (the generated copy), never the repo-root source.
# Is this checkout actually current? A stale tree syncs perfectly happily and
# gets stamped with TODAY'S date, which reads as fresh — that is how a build
# missing an entire bundle reached a device (August 2026: the trainee sector was
# absent because the working tree predated it by a fortnight, while the stamp
# said today). The date records when you synced, never what. Warn at the moment
# the mistake is made, rather than leaving the on-screen tag to be decoded later.
# Never fatal: no network, no upstream and no git at all must all still sync.
if command -v git >/dev/null 2>&1 && git -C .. rev-parse --git-dir >/dev/null 2>&1; then
  git -C .. fetch --quiet 2>/dev/null || true
  upstream="$(git -C .. rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
  if [ -n "${upstream:-}" ]; then
    behind="$(git -C .. rev-list --count "HEAD..${upstream}" 2>/dev/null || echo 0)"
    if [ "${behind:-0}" -gt 0 ]; then
      echo ""
      echo "⚠  WARNING: this checkout is ${behind} commit(s) behind ${upstream}."
      echo "   Syncing now bundles OLD code and stamps it with today's date."
      echo "   Run:  git pull   then re-run this script before archiving."
      echo ""
    fi
  fi
  if [ -n "$(git -C .. status --porcelain -- js css 2>/dev/null || true)" ]; then
    echo "ℹ  note: js/ or css/ has uncommitted changes — they WILL go into this build."
  fi
fi

stamp_date="$(date -u +%Y-%m-%d)"
if command -v shasum >/dev/null 2>&1; then
  stamp_hash="$(cat www/js/*.js www/css/*.css | shasum | cut -c1-7)"
elif command -v sha1sum >/dev/null 2>&1; then
  stamp_hash="$(cat www/js/*.js www/css/*.css | sha1sum | cut -c1-7)"
else
  stamp_hash="nohash"
fi
# -i.bak keeps this portable across BSD sed (macOS build host) and GNU sed.
# HASH FIRST, date second. The title draws this right-aligned (drawTitle,
# js/render.js), so the TAIL is anchored on screen and the HEAD is what runs off
# when the right safe-area inset is under-measured — which is precisely what
# happened on a notched iPhone in landscape: the date was readable and the hash,
# the only part carrying information, was the bit that fell off. Putting the hash
# first means a clipped tag loses the disposable half.
sed -i.bak "s|const BUILD_TAG = \".*\";|const BUILD_TAG = \"${stamp_hash} · b${stamp_date}\";|" www/js/world.js
rm -f www/js/world.js.bak

echo "✓ synced web build into app/www/ (BUILD_TAG stamped ${stamp_hash} · b${stamp_date})"
echo "  → the HASH is what identifies this build. The date only says when you synced."
