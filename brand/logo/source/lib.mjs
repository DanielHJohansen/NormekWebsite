// Shared helpers: load fonts, outline text, small geometry utilities.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const opentype = createRequire(here)("opentype.js");

export const f2 = (n) => Number(n.toFixed(2));

export function loadFont(pkg, file) {
  const buf = readFileSync(`${here}node_modules/@fontsource/${pkg}/files/${file}`);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

// Fonts are SIL Open Font License 1.1, so outlining them into a logo is allowed.
export const FONTS = {
  barlow600: () => loadFont("barlow-semi-condensed", "barlow-semi-condensed-latin-600-normal.woff"),
  barlow500: () => loadFont("barlow-semi-condensed", "barlow-semi-condensed-latin-500-normal.woff"),
  sora600: () => loadFont("sora", "sora-latin-600-normal.woff"),
};

export function metrics(font, size) {
  const k = size / font.unitsPerEm;
  const os2 = font.tables.os2;
  return { cap: (os2.sCapHeight || font.ascender * 0.7) * k, xh: (os2.sxHeight || font.ascender * 0.5) * k };
}

// Outline text to path data. One glyph index may get its own fill (the orange O).
export function outlineText(font, text, { size = 100, tracking = 0, x = 0, y = 0, fill = "#000", accentIndex = -1, accentFill = "#f00" } = {}) {
  let cursor = x;
  const base = [];
  let accent = "";
  const glyphs = [...text].map((ch) => font.charToGlyph(ch));
  glyphs.forEach((g, i) => {
    const d = g.getPath(cursor, y, size).toPathData(2);
    if (i === accentIndex) accent = d;
    else base.push(d);
    cursor += (g.advanceWidth * size) / font.unitsPerEm;
    if (i < glyphs.length - 1) cursor += tracking * size;
  });
  const svg = `<path d="${base.join(" ")}" fill="${fill}"/>` + (accent ? `<path d="${accent}" fill="${accentFill}"/>` : "");
  return { svg, width: cursor - x };
}

// Offset a convex polygon inward by d (negative d offsets outward). Mitered corners.
export function insetConvex(pts, d) {
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p[0], 0) / n;
  const cy = pts.reduce((s, p) => s + p[1], 0) / n;
  const lines = pts.map((p, i) => {
    const q = pts[(i + 1) % n];
    let dx = q[0] - p[0];
    let dy = q[1] - p[1];
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    let nx = dy;
    let ny = -dx;
    if (nx * (cx - p[0]) + ny * (cy - p[1]) < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { px: p[0] + nx * d, py: p[1] + ny * d, dx, dy };
  });
  return lines.map((l2, i) => {
    const l1 = lines[(i - 1 + n) % n];
    const det = l1.dx * l2.dy - l1.dy * l2.dx;
    const t = ((l2.px - l1.px) * l2.dy - (l2.py - l1.py) * l2.dx) / det;
    return [l1.px + t * l1.dx, l1.py + t * l1.dy];
  });
}

// Clip an infinite line (point p0, direction d) to a convex polygon. Returns two points or null.
export function clipLine(poly, p0, d) {
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  let t0 = -1e9;
  let t1 = 1e9;
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i];
    const B = poly[(i + 1) % poly.length];
    let nx = B[1] - A[1];
    let ny = -(B[0] - A[0]);
    if (nx * (cx - A[0]) + ny * (cy - A[1]) > 0) {
      nx = -nx;
      ny = -ny;
    }
    const denom = nx * d[0] + ny * d[1];
    const num = nx * (A[0] - p0[0]) + ny * (A[1] - p0[1]);
    if (Math.abs(denom) < 1e-9) {
      if (num < 0) return null;
      continue;
    }
    const t = num / denom;
    if (denom > 0) t1 = Math.min(t1, t);
    else t0 = Math.max(t0, t);
  }
  if (t0 > t1) return null;
  return [
    [p0[0] + t0 * d[0], p0[1] + t0 * d[1]],
    [p0[0] + t1 * d[0], p0[1] + t1 * d[1]],
  ];
}
