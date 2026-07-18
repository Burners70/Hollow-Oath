#!/usr/bin/env bash
# Bundle E1 — copy the web game into the wrapper's webDir.
# The repo root stays the source of truth; NEVER edit app/www by hand.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p www
cp ../index.html ../manifest.webmanifest \
   ../icon-192.png ../icon-512.png ../apple-touch-icon.png www/
echo "✓ synced web build into app/www/"
