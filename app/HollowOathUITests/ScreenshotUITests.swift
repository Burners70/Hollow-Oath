// Bundle O4 — UI test for the static App Store screens (title, settings,
// codex), driven directly via `xcodebuild test` (see
// app/capture-static-screenshots.sh) — NOT via fastlane's `snapshot`.
//
// WHY NOT FASTLANE: fastlane's snapshot targets simulators by UUID
// (`-destination id=<uuid>`), which hit an Xcode incompatibility on this
// project ("Supported platforms for the buildables in the current scheme is
// empty" / destination-not-found), even though the exact same scheme built
// and ran fine via a name-based destination
// (`-destination 'platform=iOS Simulator,name=iPhone 17'`), which is what
// Xcode's own Cmd+U effectively uses. So this test writes screenshots
// straight to disk instead of relying on fastlane's XCTAttachment/.xcresult
// pipeline — Simulator processes run natively on the Mac and can write to
// real host paths directly, no extraction step needed.
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

import XCTest

@MainActor
final class ScreenshotUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    // Fixed path, not per-device — app/capture-static-screenshots.sh runs
    // one device at a time and moves this folder's contents out between
    // runs, so there's no need to disambiguate devices from inside the test.
    private let outputDir = "/tmp/hollowoath-snapshot-output"

    private func saveScreenshot(_ name: String, of app: XCUIApplication) {
        let screenshot = app.screenshot()
        try? FileManager.default.createDirectory(
            atPath: outputDir, withIntermediateDirectories: true)
        let path = outputDir + "/" + name + ".png"
        try? screenshot.pngRepresentation.write(to: URL(fileURLWithPath: path))
    }

    func testCaptureStaticScreens() throws {
        let app = XCUIApplication()
        app.launch()

        // Title screen — first paint after boot.
        sleep(2)
        saveScreenshot("01-title", of: app)

        // Settings — Escape from title opens the settings/pause overlay in
        // this build's PAUSABLE set (js/update.js). If title isn't in
        // PAUSABLE, replace this with whatever key/tap actually reaches
        // settings from title.
        app.typeKey(XCUIKeyboardKey.escape, modifierFlags: [])
        sleep(1)
        saveScreenshot("02-settings", of: app)

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
        // saveScreenshot("03-codex", of: app)
    }
}
