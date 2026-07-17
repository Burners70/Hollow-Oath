// Playwright config for Hollow Oath smoke tests.
// The game is a single self-contained index.html — tests load it via file://,
// no web server needed.
//
// Browser resolution: `npx playwright install chromium` works everywhere.
// In environments with a pre-installed Chromium (e.g. Claude Code remote
// containers, where PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1), point at it instead:
//   PLAYWRIGHT_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm test
const { defineConfig } = require("@playwright/test");

const exec = process.env.PLAYWRIGHT_EXECUTABLE_PATH;

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
