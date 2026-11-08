// Renders the concept sheet to brand/logo/preview.png (needs Playwright, preinstalled in cloud sessions).
// Usage: node brand/logo/source/preview.mjs [--name "New Name"] [--out path.png]
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { makeLogos } from "./logos.mjs";
import { FONTS, outlineText, f2 } from "./lib.mjs";
import { INK, SIGNAL, PAPER, STEEL, WHITE } from "./routes.mjs";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = fileURLToPath(new URL("../", import.meta.url));
const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const name = arg("--name", "Normek");
const outPath = arg("--out", `${root}preview.png`);
const logos = makeLogos(name);
const b600 = FONTS.barlow600();
const b500 = FONTS.barlow500();

const W = 1760;
const text = (str, x, y, size, font, fill) => outlineText(font, str, { size, x, y, fill }).svg;
const rect = (x, y, w, h, fill, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const place = ({ body, box }, x, y, w, h) =>
  `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${box.join(" ")}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;

const routes = [
  {
    n: "01", title: "Trace",
    lines: ["A chamfered housing around an N drawn as a", "circuit trace with two via pads. Box plus", "electronics in one mark. Needs an N name."],
    light: logos.r1.lockup(false), dark: logos.r1.lockup(true), icon: logos.r1.favicon(),
  },
  {
    n: "02", title: "Section",
    lines: ["A part cut on the diagonal. Half solid, half", "hatched like an engineering section view.", "Survives a name change."],
    light: logos.r2.lockup(false), dark: logos.r2.lockup(true), icon: logos.r2.favicon(),
  },
  {
    n: "03", title: "Via",
    lines: ["A clean wordmark with one orange letter, the", "O, read as a via pad. Type only, so the", "name carries the identity."],
    light: logos.r3.wordmark(false), dark: logos.r3.wordmark(true), icon: logos.r3.favicon(),
  },
];

let body = rect(0, 0, W, 1330, WHITE);
body += text(`${name} logo concepts`, 40, 84, 52, b600, INK);
body += text("Working name only. Do not register, print or buy a domain until the name is cleared.", 40, 124, 22, b500, STEEL);

routes.forEach((r, i) => {
  const y = 160 + i * 330;
  body += text(r.n, 40, y + 62, 64, b600, SIGNAL);
  body += text(r.title, 40, y + 118, 40, b600, INK);
  r.lines.forEach((l, j) => (body += text(l, 40, y + 160 + j * 26, 18, b500, STEEL)));
  body += rect(380, y, 520, 300, PAPER) + place(r.light, 380 + 50, y + 50, 420, 200);
  body += rect(920, y, 520, 300, INK) + place(r.dark, 920 + 50, y + 50, 420, 200);
  // The second strip imitates a dark browser tab, so the ink icon tile stays visible against it.
  for (const [k, bg] of [[0, PAPER], [1, "#3A3D42"]]) {
    const yy = y + k * 152;
    body += rect(1460, yy, 260, 148, bg);
    [64, 32, 16].reduce((x, s) => {
      body += place(r.icon, x, yy + 74 - s / 2, s, s);
      return x + s + 24;
    }, 1486);
  }
});

// palette strip
const sw = [["Ink", INK, WHITE], ["Signal", SIGNAL, WHITE], ["Paper", PAPER, INK], ["Steel", STEEL, WHITE]];
sw.forEach(([label, hex, fg], i) => {
  const x = 380 + i * 270;
  body += rect(x, 1160, 250, 110, hex) + text(label, x + 20, 1204, 26, b600, fg) + text(hex, x + 20, 1240, 20, b500, fg);
});
body += text("Palette", 40, 1204, 32, b600, INK);
body += text("Orange on white is only 3.1:1.", 40, 1236, 18, b500, STEEL);
body += text("Use it for shapes, never for body text.", 40, 1262, 18, b500, STEEL);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="1330" viewBox="0 0 ${W} 1330">${body}</svg>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: 1330 }, deviceScaleFactor: 2 });
await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
await page.screenshot({ path: outPath });
await browser.close();
console.log("wrote", outPath, f2(W * 2), "px wide");
