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
stamp_date="$(date -u +%Y-%m-%d)"
if command -v shasum >/dev/null 2>&1; then
  stamp_hash="$(cat www/js/*.js www/css/*.css | shasum | cut -c1-7)"
elif command -v sha1sum >/dev/null 2>&1; then
  stamp_hash="$(cat www/js/*.js www/css/*.css | sha1sum | cut -c1-7)"
else
  stamp_hash="nohash"
fi
# -i.bak keeps this portable across BSD sed (macOS build host) and GNU sed.
sed -i.bak "s|const BUILD_TAG = \".*\";|const BUILD_TAG = \"b${stamp_date} · ${stamp_hash}\";|" www/js/world.js
rm -f www/js/world.js.bak

echo "✓ synced web build into app/www/ (BUILD_TAG stamped b${stamp_date} · ${stamp_hash})"
