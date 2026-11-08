import { defineConfig } from "@playwright/test";

/**
 * Accessibility and smoke tests on the built site. Run `npm run build` first.
 * `npm run test:a11y` serves dist/ itself, or reuses a server that is already running on port 4321.
 * Chromium comes preinstalled in cloud sessions. In CI install it once with `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: "tests/e2e",
  // qa/ is gitignored, like the screenshots.
  outputDir: "qa/test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: 0,
  reporter: process.env["CI"] ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4321",
  },
  webServer: {
    // Not `npm run preview`: Astro 7 can detach that into the background, see scripts/preview-server.mjs.
    command: "node scripts/preview-server.mjs 4321",
    url: "http://127.0.0.1:4321/",
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
  },
  // Every page is scanned at a phone width and a desktop width.
  projects: [
    { name: "phone-390", use: { viewport: { width: 390, height: 844 } } },
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 800 } } },
  ],
});
