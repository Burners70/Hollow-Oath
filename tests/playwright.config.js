// Playwright config for Hollow Oath smoke tests.
// The game is a single self-contained index.html — tests load it via file://,
// no web server needed.
//
// Browser resolution (so `npm test` just works everywhere, no version-hunting):
//   1. PLAYWRIGHT_EXECUTABLE_PATH, if you set it explicitly
//   2. the remote container's pre-installed Chromium
//   3. Playwright's own download (run `npx playwright install chromium` first)
//
// Why (2) exists: the pinned @playwright/test asks for one Chromium revision
// (e.g. 1228) but the Claude Code remote container ships another (e.g. 1194),
// so a bare run fails with "Executable doesn't exist at
// .../chromium_headless_shell-<rev>". That reads like a missing file but it's a
// version mismatch. The container exposes a stable, revision-agnostic symlink
// at /opt/pw-browsers/chromium — prefer it and the pinned revision never matters.
const { defineConfig } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

function preinstalledChromium() {
  const link = "/opt/pw-browsers/chromium";        // stable symlink → current chrome
  if (fs.existsSync(link)) return link;
  try {                                            // fallback: newest chromium-<rev> dir
    const base = "/opt/pw-browsers";
    const dir = fs.readdirSync(base)
      .filter(d => /^chromium-\d+$/.test(d))
      .sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]))
      .pop();
    if (dir) {
      const p = path.join(base, dir, "chrome-linux", "chrome");
      if (fs.existsSync(p)) return p;
    }
  } catch (e) { /* not a pre-install environment — fall through */ }
  return undefined;
}

const exec = process.env.PLAYWRIGHT_EXECUTABLE_PATH || preinstalledChromium();

module.exports = defineConfig({
  testDir: ".",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    headless: true,
    // landscape viewport — the game gates play behind a rotate prompt in portrait
    viewport: { width: 1280, height: 720 },
    launchOptions: exec ? { executablePath: exec } : {},
  },
});
