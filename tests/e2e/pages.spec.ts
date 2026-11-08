import AxeBuilder from "@axe-core/playwright";
import { listPages } from "../../scripts/lib/dist.mjs";
import { expect, test } from "./fixtures";

// Every page in dist/ is tested, so a new page needs no new test. Run `npm run build` first.
const pages = listPages("dist");

if (pages.length === 0) {
  test("dist/ contains pages", () => {
    throw new Error("dist/ has no pages. Run `npm run build` before `npm run test:a11y`.");
  });
}

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

for (const built of pages) {
  test.describe(`page ${built.route}`, () => {
    test("smoke: status 200, one h1, language and title, no overflow, no console errors", async ({
      page,
      problems,
    }) => {
      const response = await page.goto(built.route);
      // The 404 page is a plain file when asked for by name. Its real status is tested below.
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", /^[a-z]{2}/);
      await expect(page).toHaveTitle(/\S/);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toHaveCount(1);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, "page is wider than the viewport").toBeLessThanOrEqual(0);

      expect(problems).toEqual([]);
    });

    test("accessibility: no serious or critical issues (axe-core)", async ({ page }) => {
      await page.goto(built.route);
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();

      const describe = (violation: (typeof results.violations)[number]) =>
        `${violation.id} (${violation.impact}): ${violation.help}. ` +
        violation.nodes.map((node) => node.target.join(" ")).join(" | ");

      const blocking = results.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
      );
      // Moderate and minor findings are listed in the report, but they do not fail the run.
      for (const violation of results.violations.filter((v) => !blocking.includes(v))) {
        test.info().annotations.push({ type: "axe-note", description: describe(violation) });
      }
      expect(blocking.map(describe)).toEqual([]);
    });
  });
}

test.describe("behaviour", () => {
  test("an unknown address returns 404 with the 404 page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist/");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText("Page not found");
  });

  test("the skip link is the first tab stop, becomes visible and moves focus to main", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(box?.y ?? -1, "the skip link must be on screen when focused").toBeGreaterThanOrEqual(0);
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("keyboard focus is visible on every link and button in the header", async ({ page }) => {
    await page.goto("/");
    // Real Tab presses, so :focus-visible applies the way it does for a visitor. The first stop is the skip link.
    const visibleLinks = await page.locator("header a:visible").count();
    expect(visibleLinks).toBeGreaterThan(0);
    await page.keyboard.press("Tab");

    for (let i = 0; i < visibleLinks; i++) {
      await page.keyboard.press("Tab");
      const stop = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement;
        const style = getComputedStyle(element);
        return {
          inHeader: Boolean(element.closest("header")),
          name:
            (element.textContent ?? "").trim() ||
            element.querySelector("img")?.alt ||
            element.tagName,
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth),
        };
      });
      expect(stop.inHeader, `tab stop ${i + 1} should be in the header`).toBe(true);
      expect(stop.outlineStyle, `outline style on "${stop.name}"`).not.toBe("none");
      expect(stop.outlineWidth, `outline width on "${stop.name}"`).toBeGreaterThanOrEqual(2);
    }
  });

  test("touch targets in the header are at least 24 px, aiming for 44 px", async ({ page }) => {
    await page.goto("/");
    const boxes = await page.locator("header a:visible").evaluateAll((links) =>
      links.map((link) => {
        const { width, height } = link.getBoundingClientRect();
        return { text: (link.textContent ?? "").trim() || "logo", width, height };
      }),
    );
    for (const box of boxes) {
      expect(box.height, `height of "${box.text}"`).toBeGreaterThanOrEqual(24);
      expect(box.width, `width of "${box.text}"`).toBeGreaterThanOrEqual(24);
    }
  });
});
