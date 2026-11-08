// Writes the logo SVG files into brand/logo/<route>/.
// Usage: node brand/logo/source/build.mjs [--name "New Name"]
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { makeLogos } from "./logos.mjs";
import { f2 } from "./lib.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const flag = process.argv.indexOf("--name");
const name = flag > -1 ? process.argv[flag + 1] : "Normek";
const logos = makeLogos(name);

function svg({ body, box }, title, scale = 4) {
  const [x, y, w, h] = box;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(x)} ${f2(y)} ${f2(w)} ${f2(h)}" width="${f2(w * scale)}" height="${f2(h * scale)}" role="img">\n<title>${title}</title>\n${body}\n</svg>\n`;
}

const label = (what) => `${name} ${what}`;
const files = {
  "1-trace/symbol.svg": [logos.r1.symbol(false), label("symbol")],
  "1-trace/symbol-reversed.svg": [logos.r1.symbol(true), label("symbol, for dark backgrounds")],
  "1-trace/lockup.svg": [logos.r1.lockup(false), label("logo")],
  "1-trace/lockup-reversed.svg": [logos.r1.lockup(true), label("logo, for dark backgrounds")],
  "1-trace/favicon.svg": [logos.r1.favicon(), label("icon")],
  "2-section/symbol.svg": [logos.r2.symbol(false), label("symbol")],
  "2-section/symbol-reversed.svg": [logos.r2.symbol(true), label("symbol, for dark backgrounds")],
  "2-section/lockup.svg": [logos.r2.lockup(false), label("logo")],
  "2-section/lockup-reversed.svg": [logos.r2.lockup(true), label("logo, for dark backgrounds")],
  "2-section/favicon.svg": [logos.r2.favicon(), label("icon")],
  "3-via/wordmark.svg": [logos.r3.wordmark(false), label("logo")],
  "3-via/wordmark-reversed.svg": [logos.r3.wordmark(true), label("logo, for dark backgrounds")],
  "3-via/favicon.svg": [logos.r3.favicon(), label("icon")],
};

for (const [path, [item, title]] of Object.entries(files)) {
  const full = `${root}${path}`;
  mkdirSync(full.slice(0, full.lastIndexOf("/")), { recursive: true });
  const text = svg(item, title);
  writeFileSync(full, text);
  console.log(`${path.padEnd(34)} ${text.length} bytes`);
}
