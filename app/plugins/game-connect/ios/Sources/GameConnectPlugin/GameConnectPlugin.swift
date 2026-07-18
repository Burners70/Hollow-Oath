import Foundation
import Capacitor
import GameKit

/// Bundle G — Game Center: silent auth on launch, score submission,
/// achievement reporting, and an optional dashboard sheet.
/// Fail-silent by design (G1: never block or interrupt play on Game
/// Center) — every unauthenticated call resolves quietly and drops the
/// report, mirroring the game's fail-silent localStorage style.
@objc(GameConnectPlugin)
public class GameConnectPlugin: CAPPlugin, CAPBridgedPlugin, GKGameCenterControllerDelegate {
    public let identifier = "GameConnectPlugin"
    public let jsName = "GameConnect"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submitScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reportAchievement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showGameCenter", returnType: CAPPluginReturnPromise)
    ]

    @objc func authenticate(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            GKLocalPlayer.local.authenticateHandler = { viewController, _ in
                // present Apple's sign-in sheet only if iOS insists; errors
                // are swallowed — the game never gates on Game Center
                if let vc = viewController {
                    self?.bridge?.viewController?.present(vc, animated: true)
                }
            }
        }
        // resolve immediately: auth continues in the background (G1)
        call.resolve()
    }

    @objc func submitScore(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated,
              let board = call.getString("leaderboardId") else { return call.resolve() }
        let value = call.getInt("value") ?? 0
        GKLeaderboard.submitScore(value, context: 0, player: GKLocalPlayer.local,
                                  leaderboardIDs: [board]) { _ in }
        call.resolve()
    }

    @objc func reportAchievement(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated,
              let id = call.getString("achievementId") else { return call.resolve() }
        let achievement = GKAchievement(identifier: id)
        achievement.percentComplete = 100
        achievement.showsCompletionBanner = true
        GKAchievement.report([achievement]) { _ in }
        call.resolve()
    }

    @objc func showGameCenter(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated else { return call.resolve() }
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return call.resolve() }
            let vc = GKGameCenterViewController(state: .default)
            vc.gameCenterDelegate = self
            self.bridge?.viewController?.present(vc, animated: true)
            call.resolve()
        }
    }

    public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}
