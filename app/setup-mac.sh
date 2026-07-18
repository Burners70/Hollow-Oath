#!/usr/bin/env bash
# One-shot Mac bootstrap for the Hollow Oath iOS wrapper (Bundle E).
# Prereqs: Xcode 15+, Node 18+, CocoaPods (`brew install cocoapods`).
# Idempotent: re-running refreshes the web copy and re-applies config.
set -euo pipefail
cd "$(dirname "$0")"

echo "— Hollow Oath iOS wrapper setup —"
command -v node >/dev/null || { echo "✗ node not found — install Node 18+ first"; exit 1; }
xcode-select -p >/dev/null 2>&1 || { echo "✗ Xcode command line tools not found — install Xcode first"; exit 1; }
command -v pod >/dev/null || { echo "✗ CocoaPods not found — 'brew install cocoapods' first"; exit 1; }

npm install
./sync.sh

if [ ! -d ios ]; then
  npx cap add ios
fi

./configure-ios.sh
npx cap sync ios

echo
echo "✓ wrapper ready. Next:"
echo "  1. npx cap open ios"
echo "  2. Xcode → App target → Signing & Capabilities → pick your team"
echo "  3. Verify the iCloud (Key-value storage) and Game Center capabilities"
echo "     resolved against the App ID (MAC_SETUP.md step 4)"
echo "  4. Run on a real device — then work through MAC_SETUP.md steps 5-8"
