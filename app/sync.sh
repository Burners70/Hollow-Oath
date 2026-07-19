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
echo "✓ synced web build into app/www/"
