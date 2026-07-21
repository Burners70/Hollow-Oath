// Bundle O4 — fastlane snapshot UI test for the static screens.
//
// SETUP (one time, on the Mac, needs Xcode — see app/fastlane/Snapfile):
//   1. `bundle exec fastlane snapshot init` from app/ generates SnapshotHelper.swift.
//   2. In Xcode, add a "UI Testing Bundle" target named HollowOathUITests and
//      add this file + the generated SnapshotHelper.swift to it.
//   3. Run `bundle exec fastlane snapshot` from app/.
//
// SCOPE: only the screens that don't depend on procedurally-seeded terrain —
// title, settings, codex. Landing/docking/dark-sector/Hollows-shrine/ECG shots
// stay manual via app/capture-screenshots.sh; there's no fixed run seed yet
// that would make those reproducible under automation.
//
// NAVIGATION: the game is a single canvas (js/input.js) with no accessibility
// tree, so this drives it via the same keyboard shortcuts a player has —
// Enter to confirm, Escape to open/close settings — rather than coordinate
// taps, which would need per-simulator-size calibration. If a key stops
// working here, check it still matches keyMap / the Enter and Escape
// handlers in js/input.js — that file is the source of truth, this test
// just rides along.
//
// CALIBRATION NOTE: this file has not been run against a live simulator
// (no Xcode/GUI access in the environment that wrote it). Treat the wait
// times below as starting points — watch the first run and adjust.

import XCTest

final class ScreenshotUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testCaptureStaticScreens() throws {
        let app = XCUIApplication()
        setupSnapshot(app)
        app.launch()

        // Title screen — first paint after boot.
        sleep(2)
        snapshot("01-title")

        // Settings — Escape from title opens the settings/pause overlay in
        // this build's PAUSABLE set (js/update.js). If title isn't in
        // PAUSABLE, replace this with whatever key/tap actually reaches
        // settings from title.
        app.typeKey(XCUIKeyboardKey.escape, modifierFlags: [])
        sleep(1)
        snapshot("02-settings")

        // Back out of settings, then into the codex from the title screen.
        app.typeKey(XCUIKeyboardKey.escape, modifierFlags: [])
        sleep(1)
        // TODO: codex is opened from a title-screen button tap, not a key —
        // js/input.js has no keyboard shortcut for it. Once calibrated,
        // either add one behind a debug flag or tap startRect()-adjacent
        // coordinates here (see app/capture-screenshots.sh for the manual
        // equivalent).
        // app.tap(at: <codex button coordinates>)
        // sleep(1)
        // snapshot("03-codex")
    }
}
