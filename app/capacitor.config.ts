import type { CapacitorConfig } from '@capacitor/cli';

// appId is PERMANENT once the app first ships — owner-confirmed July 2026
// (APP_STORE_ROADMAP.md, Bundle E1). Do not change it.
const config: CapacitorConfig = {
  appId: 'com.burners70.hollowoath',
  appName: 'Hollow Oath',
  webDir: 'www',
  // black behind the webview (E2) — matches the game's own background
  backgroundColor: '#000000'
  // NOTE (E2): the webview's contentInsetAdjustmentBehavior is deliberately
  // left at Capacitor's default — the game handles safe-area insets itself
  // via env(safe-area-inset-*).
};

export default config;
