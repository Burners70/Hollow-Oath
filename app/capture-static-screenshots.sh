#!/usr/bin/env bash
# Bundle O4 — capture the static App Store screenshots (title, settings,
# codex) fully automatically, no manual navigation.
#
# This calls `xcodebuild test` directly with a NAME-based simulator
# destination, bypassing fastlane's `snapshot` — fastlane targets simulators
# by UUID, which hit an Xcode incompatibility on this project
# ("Supported platforms for the buildables in the current scheme is empty").
# Name-based destinations (what Xcode's own Cmd+U effectively uses) work
# fine. See app/HollowOathUITests/ScreenshotUITests.swift for why the test
# itself writes PNGs straight to disk instead of going through fastlane's
# attachment/.xcresult pipeline.
set -euo pipefail
cd "$(dirname "$0")"

OUT_DIR="${1:-$HOME/Desktop/hollow-oath-screenshots}"
mkdir -p "$OUT_DIR"

# Same drift caveat as capture-screenshots.sh: these names are whatever's
# installed in Xcode's current simulator runtime. If `xcodebuild` errors
# with a destination-not-found message, run `xcrun simctl list devices`
# and swap in two current names.
DEVICES=(
  "iPhone 17 Pro Max"
  "iPhone 17"
)

TEST_OUTPUT_DIR="/tmp/hollowoath-snapshot-output"

for DEVICE in "${DEVICES[@]}"; do
  SAFE_NAME=$(echo "$DEVICE" | tr ' ' '-')
  echo
  echo "=== Building & testing on $DEVICE ==="
  rm -rf "$TEST_OUTPUT_DIR"

  xcodebuild test \
    -workspace ./ios/App/App.xcworkspace \
    -scheme HollowOathUITests \
    -destination "platform=iOS Simulator,name=$DEVICE"

  DEVICE_OUT="$OUT_DIR/$SAFE_NAME"
  mkdir -p "$DEVICE_OUT"
  if [ -d "$TEST_OUTPUT_DIR" ] && [ -n "$(ls -A "$TEST_OUTPUT_DIR" 2>/dev/null)" ]; then
    mv "$TEST_OUTPUT_DIR"/*.png "$DEVICE_OUT"/
    echo "✓ saved $(ls "$DEVICE_OUT" | wc -l | tr -d ' ') screenshot(s) to $DEVICE_OUT"
  else
    echo "⚠ no screenshots found for $DEVICE — check the test actually ran/passed above"
  fi
done

echo
echo "Done. Screenshots in $OUT_DIR"
