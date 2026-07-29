import Foundation
import Capacitor
import StoreKit
import UIKit

/// Bundle X6 — a minimal bridge to Apple's native in-app review prompt.
/// Apple's own OS-level throttling (roughly once/year/user) governs whether
/// the prompt actually appears, so the game can call this freely at any
/// high-signal moment (a clean ending, a new high score) with no extra
/// throttling logic on the JS side. Always resolves immediately; the
/// prompt itself (if shown) never blocks or interrupts play.
@objc(RatingPlugin)
public class RatingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RatingPlugin"
    public let jsName = "Rating"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestReview", returnType: CAPPluginReturnPromise)
    ]

    @objc func requestReview(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let scene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                SKStoreReviewController.requestReview(in: scene)
            }
            call.resolve()
        }
    }
}
