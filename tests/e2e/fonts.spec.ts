/**
 * Late web fonts must not move the page (QA-04). Every font file is held back for two seconds, which is the slow
 * phone case, and the layout shift score is read after the swap. The budget is 0.05 (docs/plan/work-breakdown.md
 * section 6). Without the metric-matched fallback faces the score was 0.146 at 1280 px.
 */
import { expect, test } from "./fixtures";

declare global {
  interface Window {
    __layoutShift: number;
  }
}

const HOLD_MS = 2000;

test.describe("late fonts", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__layoutShift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) window.__layoutShift += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.route("**/fonts/*.woff2", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, HOLD_MS));
      await route.fallback();
    });
  });

  for (const path of ["/", "/privacy/"]) {
    test(`do not shift the layout on ${path}, so the score stays under 0.05`, async ({ page }) => {
      const fontsRequested: string[] = [];
      page.on("request", (request) => {
        if (request.url().endsWith(".woff2")) fontsRequested.push(request.url());
      });
      await page.goto(path, { waitUntil: "commit" });
      // The text is visible before the fonts arrive (font-display: swap), then the swap happens at about two seconds.
      await expect(page.locator("h1")).toBeVisible();
      await page.waitForTimeout(HOLD_MS + 1800);
      expect(
        fontsRequested.length,
        "the fonts must have been asked for and swapped in",
      ).toBeGreaterThanOrEqual(2);
      const loaded = await page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.fonts]
          .filter((face) => face.status === "loaded")
          .map((face) => face.family);
      });
      expect(loaded.join(" ")).toContain("IBM Plex Sans");
      const shift = await page.evaluate(() => window.__layoutShift);
      expect(shift).toBeLessThan(0.05);
    });
  }

  test("the fallback faces are in use while the fonts are held back", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("h1")).toBeVisible();
    const state = await page.evaluate(() => {
      const faces = [...document.fonts].map((face) => ({
        family: face.family.replace(/"/g, ""),
        status: face.status,
      }));
      return {
        faces,
        display: getComputedStyle(document.querySelector("h1") as Element).fontFamily,
        sans: getComputedStyle(document.body).fontFamily,
        mono: getComputedStyle(document.querySelector(".eyebrow") as Element).fontFamily,
      };
    });
    expect(state.display).toMatch(/^"Barlow Semi Condensed", "Barlow Semi Condensed Fallback"/);
    expect(state.sans).toMatch(/^"IBM Plex Sans", "IBM Plex Sans Fallback"/);
    expect(state.mono).toMatch(/^"IBM Plex Mono", "IBM Plex Mono Fallback"/);
    const families = state.faces.map((face) => face.family);
    for (const family of [
      "Barlow Semi Condensed Fallback",
      "IBM Plex Sans Fallback",
      "IBM Plex Mono Fallback",
    ]) {
      expect(families).toContain(family);
    }
  });
});
