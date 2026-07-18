import Foundation
import Capacitor

/// Bundle E4 — the ~40-line NSUbiquitousKeyValueStore bridge the roadmap
/// asked for. String keys/values only (the game stores JSON strings).
/// Requires the iCloud "Key-value storage" capability on the App target —
/// see app/MAC_SETUP.md; without it the store silently no-ops, which is
/// acceptable (saves then stay device-local).
@objc(ICloudKVPlugin)
public class ICloudKVPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ICloudKVPlugin"
    public let jsName = "ICloudKV"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise)
    ]

    private let store = NSUbiquitousKeyValueStore.default

    override public func load() {
        // pull the latest cloud copy before the game's launch merge reads it
        store.synchronize()
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { return call.reject("key required") }
        if let value = store.string(forKey: key) {
            call.resolve(["value": value])
        } else {
            call.resolve(["value": NSNull()])
        }
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let value = call.getString("value") else {
            return call.reject("key and value required")
        }
        store.set(value, forKey: key)
        store.synchronize()
        call.resolve()
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { return call.reject("key required") }
        store.removeObject(forKey: key)
        store.synchronize()
        call.resolve()
    }
}
