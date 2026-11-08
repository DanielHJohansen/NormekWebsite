#!/usr/bin/env node
// Screenshots of the built site (dist/) at phone, tablet and desktop widths.
// Run `npm run build` first. Output goes to qa/screens/, which is gitignored.
//
// Usage: npm run screenshots [-- --out qa/screens] [--widths 390,768,1280] [--viewport-only]
//
// The pages load under the headers from public/_headers (the Content-Security-Policy above all),
// so a blocked style or script shows up here the same way it would in production.
// The remote helper scripts/screenshot.mjs does the same for a deployed https URL.

/* global document -- used inside tab.evaluate(), which runs in the browser */
import { chromium } from "@playwright/test";
import { preview } from "astro";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { forLocalHttp, headersForPath, parseHeadersFile } from "./lib/headers.mjs";
import { listPages } from "./lib/dist.mjs";

const args = process.argv.slice(2);
let outDir = "qa/screens";
let widths = [390, 768, 1280];
let fullPage = true;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out") outDir = args[++i] ?? outDir;
  else if (args[i] === "--widths") widths = (args[++i] ?? "").split(",").map(Number);
  else if (args[i] === "--viewport-only") fullPage = false;
}

const distDir = "dist";
if (!existsSync(join(distDir, "index.html"))) {
  console.error("dist/ is missing. Run `npm run build` first.");
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const PORT = 4321;
const origin = `http://127.0.0.1:${PORT}`;

async function isUp() {
  try {
    const res = await fetch(`${origin}/`, { redirect: "manual" });
    return res.status > 0;
  } catch {
    return false;
  }
}

// Reuse a preview server that is already running, otherwise start one for this run.
const server = (await isUp())
  ? undefined
  : await preview({ root: ".", logLevel: "silent", server: { host: "127.0.0.1", port: PORT } });

const headerRules = existsSync("public/_headers")
  ? parseHeadersFile(readFileSync("public/_headers", "utf8"))
  : [];

const browser = await chromium.launch();
let problems = 0;

try {
  for (const page of listPages(distDir)) {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route("**/*", async (route) => {
        const response = await route.fetch({ maxRedirects: 0 });
        const { pathname } = new URL(route.request().url());
        await route.fulfill({
          response,
          headers: {
            ...response.headers(),
            ...forLocalHttp(headersForPath(headerRules, pathname)),
          },
        });
      });
      const tab = await context.newPage();
      const notes = [];
      tab.on("console", (message) => {
        if (message.type() === "error")
          notes.push(`console error: ${message.text().slice(0, 200)}`);
      });
      tab.on("pageerror", (error) => notes.push(`page error: ${error.message.slice(0, 200)}`));

      const response = await tab.goto(`${origin}${page.route}`, { waitUntil: "load" });
      const status = response?.status() ?? 0;
      const expected = page.route === "/404.html" ? [200, 404] : [200];
      if (!expected.includes(status)) notes.push(`unexpected status ${status}`);

      const overflow = await tab.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 0)
        notes.push(`horizontal scroll: page is ${overflow}px wider than the viewport`);

      const file = join(outDir, `dist-${page.slug}-${width}.png`);
      await tab.screenshot({ path: file, fullPage });
      console.log(`${page.route} @${width}: status ${status} -> ${file}`);
      for (const note of notes) {
        problems++;
        console.log(`  PROBLEM ${note}`);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  await server?.stop();
}

if (problems > 0) {
  console.error(`\n${problems} problem(s) found while taking screenshots.`);
  process.exit(1);
}
console.log("\nDone. Look at the images before calling UI work finished.");
