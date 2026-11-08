import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";
import { forLocalHttp, headersForPath, parseHeadersFile } from "../../scripts/lib/headers.mjs";

const headerRules = parseHeadersFile(readFileSync("public/_headers", "utf8"));

interface Fixtures {
  /** Console errors and uncaught exceptions seen while the test ran. */
  problems: string[];
}

/**
 * Every response gets the headers from public/_headers, as it will on Cloudflare Pages.
 * That makes a Content-Security-Policy violation show up as a console error here,
 * instead of as a broken page after deployment.
 */
export const test = base.extend<Fixtures>({
  context: async ({ context }, use) => {
    await context.route("**/*", async (route) => {
      // Redirects are passed on untouched, so the browser follows them itself.
      const response = await route.fetch({ maxRedirects: 0 });
      const { pathname } = new URL(route.request().url());
      await route.fulfill({
        response,
        headers: { ...response.headers(), ...forLocalHttp(headersForPath(headerRules, pathname)) },
      });
    });
    await use(context);
  },

  problems: async ({ page }, use) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(`console error: ${message.text()}`);
    });
    page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
    page.on("requestfailed", (request) => problems.push(`request failed: ${request.url()}`));
    await use(problems);
  },
});

export { expect };

export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/**
 * Scans the page as it is now with axe-core. Serious and critical findings are returned as lines of text
 * (an empty list is a pass). Moderate and minor findings go into the report as annotations and never fail a run.
 */
export async function blockingAxeFindings(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const describe = (violation: (typeof results.violations)[number]) =>
    `${violation.id} (${violation.impact}): ${violation.help}. ` +
    violation.nodes.map((node) => node.target.join(" ")).join(" | ");
  const blocking = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  for (const violation of results.violations.filter((v) => !blocking.includes(v))) {
    base.info().annotations.push({ type: "axe-note", description: describe(violation) });
  }
  return blocking.map(describe);
}
