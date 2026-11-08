#!/usr/bin/env node
// Loads pages in headless Chromium through the session proxy, saves screenshots at phone,
// tablet and desktop widths, and prints status, title, console problems and the visible text.
// Usage: node scripts/screenshot.mjs <https-url> [<https-url> ...] [--out qa/screens] [--widths 390,768,1280] [--full]
// Only HTTPS hosts on the environment's allowed list can be reached. Certificate errors are never ignored.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const { chromium } = createRequire(import.meta.url)("playwright");

const args = process.argv.slice(2);
const urls = [];
let out = "qa/screens";
let widths = [390, 768, 1280];
let full = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out") out = args[++i];
  else if (args[i] === "--widths") widths = args[++i].split(",").map(Number);
  else if (args[i] === "--full") full = true;
  else urls.push(args[i]);
}
if (!urls.length) {
  console.error("Usage: node scripts/screenshot.mjs <https-url> [...] [--out dir] [--widths 390,768,1280] [--full]");
  process.exit(2);
}
mkdirSync(out, { recursive: true });

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch(proxy ? { proxy: { server: proxy } } : {});
let failures = 0;

for (const url of urls) {
  const slug = url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60);
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const problems = [];
    page.on("console", (m) => {
      if (m.type() === "error") problems.push(`console: ${m.text().slice(0, 160)}`);
    });
    page.on("requestfailed", (r) => problems.push(`failed: ${r.url().slice(0, 100)} ${r.failure()?.errorText ?? ""}`));
    try {
      const res = await page.goto(url, { waitUntil: "load", timeout: 45000 });
      await page.waitForTimeout(500);
      const file = `${out}/${slug}-${width}.png`;
      await page.screenshot({ path: file, fullPage: full });
      console.log(`${url} @${width}: status ${res?.status()} title "${await page.title()}" -> ${file}`);
      if (width === widths[widths.length - 1]) {
        const text = (await page.innerText("body")).replace(/\s+/g, " ").trim().slice(0, 600);
        console.log(`  text: ${text}`);
      }
    } catch (e) {
      failures++;
      console.log(`${url} @${width}: FAILED ${String(e.message).split("\n")[0]}`);
    }
    for (const p of problems.slice(0, 5)) console.log(`  ${p}`);
    await page.close();
  }
}
await browser.close();
process.exit(failures ? 1 : 0);
