#!/usr/bin/env node
// Replaces every <text> element in an SVG with an outlined <path>, so the file draws the same
// without the font. Use it for the image copy of a diagram (<img>, social cards, print), where
// the page's web fonts are not available. The live-text copy stays the one to inline in a page.
//
// Usage: node scripts/outline-svg-text.mjs <in.svg> <out.svg> --font <font.woff|ttf|otf> [--decimals 2]
//
// Each <text> must use plain double-quoted attributes: x, y, font-size, fill and, optionally,
// font-family and text-anchor (start, middle or end). Anything else on the element (transform, dx,
// dy, letter-spacing, style, a child <tspan>) stops the script, because the outline would no longer
// match the live text. The first family in font-family must match the font file.
//
// opentype.js is taken from brand/logo/source/node_modules (run `npm install` there once).
// It reads .woff, .ttf and .otf, not .woff2. The website's own package.json is not touched.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function usage(message) {
  if (message) console.error(`${message}\n`);
  console.error(
    "Usage: node scripts/outline-svg-text.mjs <in.svg> <out.svg> --font <font.woff|ttf|otf> [--decimals 2]",
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const positional = [];
let fontPath;
let decimals = 2;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--font") fontPath = args[++i];
  else if (args[i] === "--decimals") decimals = Number(args[++i]);
  else positional.push(args[i]);
}
if (positional.length !== 2 || !fontPath) usage();
if (!Number.isInteger(decimals) || decimals < 0 || decimals > 4) {
  usage("--decimals must be a whole number from 0 to 4.");
}
const [inPath, outPath] = positional;

let opentype;
try {
  opentype = createRequire(resolve(root, "brand/logo/source/package.json"))("opentype.js");
} catch {
  throw new Error("opentype.js was not found. Run `npm install` in brand/logo/source first.");
}

const fontFile = readFileSync(fontPath);
let font;
try {
  font = opentype.parse(
    fontFile.buffer.slice(fontFile.byteOffset, fontFile.byteOffset + fontFile.byteLength),
  );
} catch (error) {
  throw new Error(`Cannot read ${fontPath} (${error.message}). Use a .woff, .ttf or .otf file.`, {
    cause: error,
  });
}
const fontFamily = font.names.fontFamily?.en;
const scalePerEm = 1 / font.unitsPerEm;

const ALLOWED = new Set(["x", "y", "font-family", "font-size", "fill", "text-anchor"]);
const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };

/** Reads name="value" pairs. Anything left over (single quotes, bare words) is an error. */
function parseAttributes(source) {
  const attrs = new Map();
  const rest = source.replace(/([A-Za-z][\w:-]*)\s*=\s*"([^"]*)"/g, (_, name, value) => {
    attrs.set(name, value);
    return "";
  });
  if (rest.trim()) throw new Error(`Cannot read the attributes of <text${source}>.`);
  for (const name of attrs.keys()) {
    if (!ALLOWED.has(name)) {
      throw new Error(`<text> has a "${name}" attribute, which the outline cannot reproduce.`);
    }
  }
  return attrs;
}

/** Plain text only. Whitespace collapses the way SVG does by default. */
function readText(content) {
  if (content.includes("<")) throw new Error("<text> has a child element, such as <tspan>.");
  const text = content.replace(/&(amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity]);
  if (text.includes("&")) throw new Error(`Unsupported character reference in "${content}".`);
  return text.replace(/\s+/g, " ").trim();
}

const round = (value) => Number(value.toFixed(decimals));

/** Shortest text for a number: no leading zero (".5"), no "-0". */
const short = (value) => String(round(value)).replace(/^(-?)0\./, "$1.");

/** Joins numbers with a space only where the parser needs one. */
function join(values) {
  let text = "";
  for (const value of values.map(short)) {
    const needsSpace =
      text &&
      !value.startsWith("-") &&
      !(value.startsWith(".") && /\./.test(text.split(/[\s-]/).pop() ?? ""));
    text += (needsSpace ? " " : "") + value;
  }
  return text;
}

/**
 * Compact path data: relative commands, H and V for straight horizontal and vertical lines, no
 * zero-length lines (TrueType outlines repeat the current point), and no repeated command letters.
 * Positions are rounded first and the deltas taken from the rounded positions, so rounding cannot
 * drift along a glyph.
 */
function pathData(commands) {
  let text = "";
  let letter = "";
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  const put = (next, values) => {
    text += (next === letter ? " " : next) + join(values);
    letter = next;
  };
  for (const c of commands) {
    if (c.type === "Z") {
      text += "z";
      letter = "z";
      cx = startX;
      cy = startY;
      continue;
    }
    const x = round(c.x);
    const y = round(c.y);
    if (c.type === "M") {
      text += `M${join([x, y])}`;
      letter = "M";
      cx = startX = x;
      cy = startY = y;
    } else if (c.type === "L") {
      if (x === cx && y === cy) continue;
      if (y === cy) put("h", [x - cx]);
      else if (x === cx) put("v", [y - cy]);
      else put("l", [x - cx, y - cy]);
      cx = x;
      cy = y;
    } else if (c.type === "Q") {
      put("q", [round(c.x1) - cx, round(c.y1) - cy, x - cx, y - cy]);
      cx = x;
      cy = y;
    } else if (c.type === "C") {
      put("c", [
        round(c.x1) - cx,
        round(c.y1) - cy,
        round(c.x2) - cx,
        round(c.y2) - cy,
        x - cx,
        y - cy,
      ]);
      cx = x;
      cy = y;
    }
  }
  return text;
}

let glyphCount = 0;

function outline(attrSource, content) {
  const attrs = parseAttributes(attrSource);
  const size = Number(attrs.get("font-size"));
  const x = Number(attrs.get("x"));
  const y = Number(attrs.get("y"));
  const fill = attrs.get("fill");
  if (![size, x, y].every(Number.isFinite) || !fill) {
    throw new Error(`<text${attrSource}> needs numeric x, y and font-size and a fill.`);
  }
  const family = (attrs.get("font-family") ?? "").split(",")[0].replace(/["']/g, "").trim();
  if (family && fontFamily && family !== fontFamily) {
    throw new Error(`<text> asks for "${family}" but the font file is "${fontFamily}".`);
  }

  const text = readText(content);
  const glyphs = [...text].map((ch) => {
    const glyph = font.charToGlyph(ch);
    if (glyph.index === 0) throw new Error(`The font has no glyph for "${ch}" in "${text}".`);
    return glyph;
  });
  const total = glyphs.reduce((sum, g) => sum + g.advanceWidth * scalePerEm * size, 0);
  const anchor = attrs.get("text-anchor") ?? "start";
  let cursor = anchor === "middle" ? x - total / 2 : anchor === "end" ? x - total : x;

  const parts = [];
  for (const glyph of glyphs) {
    const commands = glyph.getPath(cursor, y, size).commands;
    if (commands.length) parts.push(pathData(commands));
    cursor += glyph.advanceWidth * scalePerEm * size;
  }
  glyphCount += parts.length;
  // A comment keeps the words findable in the outlined file. "--" is not allowed inside one.
  return `<!-- ${text.replaceAll("--", "- -")} -->\n<path d="${parts.join("")}" fill="${fill}"/>`;
}

const source = readFileSync(inPath, "utf8");
let count = 0;
const result = source.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/g, (_, attrSource, content) => {
  count++;
  return outline(attrSource, content);
});
if (!count) throw new Error(`${inPath} has no <text> element.`);
if (/<text\b/.test(result)) throw new Error("A <text> element was left behind.");

writeFileSync(outPath, result);
console.log(
  `${outPath}: ${count} text element(s), ${glyphCount} glyph outline(s), ${Buffer.byteLength(result)} bytes (${fontFamily}, ${decimals} decimals)`,
);
