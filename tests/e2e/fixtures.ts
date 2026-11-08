import { readFileSync } from "node:fs";
import { test as base, expect } from "@playwright/test";
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
