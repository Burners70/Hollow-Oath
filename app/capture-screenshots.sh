#!/usr/bin/env bash
# Bundle O4 — capture App Store screenshots from the iOS Simulator.
# Run from a Mac with Xcode + the Capacitor build installed (app/MAC_SETUP.md).
# Boots each required simulator size in turn, then walks you through the six
# shot list from docs/STORE_LISTING.md, capturing on Enter.
#
# NOTE: gyro/tilt and haptics don't work in the simulator. If a shot needs
# tilt input to reach, capture that one from a real device instead
# (xcrun simctl io booted screenshot works the same way over a wired device).
set -euo pipefail

OUT_DIR="${1:-$HOME/Desktop/hollow-oath-screenshots}"
mkdir -p "$OUT_DIR"

SHOTS=(
  "title"
  "landing-beside-scion"
  "mercy-docking"
  "dark-sector-lamp"
  "hollows-shrine"
  "ecg-arrhythmia"
)

# Largest current bucket: iPhone 17 Pro Max. Standard bucket: iPhone 17.
# NOTE: these names drift as Apple retires older iPhone simulators from new
# Xcode installs. If `simctl boot` fails with a device-not-found error, run
# `xcrun simctl list devices` and swap in two current names (largest + a
# standard size) instead of assuming these are still valid.
DEVICES=(
  "6.9in:iPhone 17 Pro Max"
  "6.3in:iPhone 17"
)

for entry in "${DEVICES[@]}"; do
  tag="${entry%%:*}"
  device="${entry#*:}"

  echo
  echo "=== $tag ($device) ==="
  xcrun simctl boot "$device" 2>/dev/null || true
  open -a Simulator --args -CurrentDeviceUDID "$(xcrun simctl list devices | grep "$device" | grep -o '[0-9A-F-]\{36\}' | head -1)" || true

  echo "Waiting for the app to launch in the Simulator — press Enter once it's running."
  read -r

  for shot in "${SHOTS[@]}"; do
    dest="$OUT_DIR/${tag}-${shot}.png"
    echo "Navigate to: $shot"
    echo "Press Enter to capture (or 's' + Enter to skip this shot) ..."
    read -r ans
    if [[ "$ans" == "s" ]]; then
      echo "  skipped"
      continue
    fi
    xcrun simctl io booted screenshot "$dest"
    echo "  ✓ saved $dest"
  done

  xcrun simctl shutdown "$device" 2>/dev/null || true
done

echo
echo "Done. Screenshots in $OUT_DIR"
