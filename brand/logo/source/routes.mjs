// Geometry for the three logo routes. Everything is drawn as filled outlines (no strokes),
// so the files are safe for laser engraving, vinyl cutting and CNC marking.
import { f2, insetConvex, clipLine } from "./lib.mjs";

export const INK = "#0F1B2D";
export const SIGNAL = "#FF5A1F";
export const PAPER = "#F4F5F2";
export const STEEL = "#6B7686";
export const WHITE = "#FFFFFF";

const poly = (pts) => "M" + pts.map((p) => `${f2(p[0])} ${f2(p[1])}`).join("L") + "Z";
const ring = (cx, cy, R, r) =>
  `M${f2(cx - R)} ${f2(cy)}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0ZM${f2(cx - r)} ${f2(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

// Letter N as a uniform-width shape with a 45 degree diagonal and flat top and bottom.
// cutTop and cutBottom shorten the right and left stems so they tuck under a via pad.
function nPolygon({ a, b, T, B, w, cutTop = 0, cutBottom = 0 }) {
  const h = w / 2;
  const k = Math.SQRT2 * h;
  const k2 = (1 + Math.SQRT2) * h;
  return [
    [a - h, T], [a + k, T], [b - h, B - k2], [b - h, T + cutTop], [b + h, T + cutTop],
    [b + h, B], [b - k, B], [a + h, T + k2], [a + h, B - cutBottom], [a - h, B - cutBottom],
  ];
}

// ---------- Route 1: TRACE ----------
// A chamfered housing around the letter N drawn as a PCB trace with two via pads.
// The mark has 180 degree rotational symmetry, like the letter N itself.
export function r1Symbol({ housing = INK, trace = INK, via = SIGNAL, S = 40, w = 6, chamfer = 14, R = 7, r = 2.8 } = {}) {
  const c = 48;
  const a = c - S / 2;
  const b = c + S / 2;
  const n = nPolygon({ a, b, T: a, B: b, w, cutTop: R * 0.62, cutBottom: R * 0.62 });
  const o = 10;
  const e = 86;
  const center = [[o, o], [e - chamfer, o], [e, o + chamfer], [e, e], [o + chamfer, e], [o, e - chamfer]];
  const wall = poly(insetConvex(center, -w / 2)) + poly(insetConvex(center, w / 2));
  return `<path d="${wall}" fill="${housing}" fill-rule="evenodd"/>` +
    `<path d="${poly(n)}" fill="${trace}"/>` +
    `<path d="${ring(b, a, R, r)}" fill="${via}" fill-rule="evenodd"/>` +
    `<path d="${ring(a, b, R, r)}" fill="${via}" fill-rule="evenodd"/>`;
}

// Solid tile for small sizes (favicon, avatar). No via pads, heavier N, orange bevels.
export function r1Favicon({ tile = INK, mark = WHITE, accent = SIGNAL } = {}) {
  const S = 40;
  const a = 48 - S / 2;
  const b = 48 + S / 2;
  const n = nPolygon({ a, b, T: a, B: b, w: 11 });
  const ch = 22;
  const o = 4;
  const e = 92;
  const t = [[o, o], [e - ch, o], [e, o + ch], [e, e], [o + ch, e], [o, e - ch]];
  const bw = 8;
  const tr = [[o + (e - ch - o) - bw, o], [e - ch, o], [e, o + ch], [e, e - (e - ch - o) + bw]];
  const bl = tr.map(([x, y]) => [96 - x, 96 - y]);
  return `<path d="${poly(t)}" fill="${tile}"/><path d="${poly(tr)}" fill="${accent}"/><path d="${poly(bl)}" fill="${accent}"/><path d="${poly(n)}" fill="${mark}"/>`;
}

// ---------- Route 2: SECTION ----------
// A chamfered block cut on the diagonal. One half is solid, the other half carries the
// 45 degree hatching engineers use to show a section view. The cutting plane is orange.
function sectionPieces({ ch, g, o, e }) {
  const s = g / Math.SQRT2;
  return {
    upper: [[o + s, o], [e - ch, o], [e, o + ch], [e, e - s]],
    lower: [[o, o + s], [o, e - ch], [o + ch, e], [e - s, e]],
    band: [[o, o], [o + s, o], [e, e - s], [e, e], [e - s, e], [o, o + s]],
  };
}
export function r2Symbol({ solid = INK, hatch = INK, seam = SIGNAL, ch = 22, g = 5, o = 8, e = 88, step = 10, lw = 3.2 } = {}) {
  const { upper, lower, band } = sectionPieces({ ch, g, o, e });
  const centerline = insetConvex(upper, lw / 2);
  const frame = poly(upper) + poly(insetConvex(upper, lw));
  const sums = upper.map((p) => p[0] + p[1]);
  const cmid = (Math.min(...sums) + Math.max(...sums)) / 2;
  let lines = "";
  for (let k = -14; k <= 14; k++) {
    const c = cmid + k * step;
    const seg = clipLine(centerline, [c / 2, c / 2], [1, -1]);
    if (!seg) continue;
    const len = Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]);
    if (len < 9) continue;
    const dx = (seg[1][0] - seg[0][0]) / len;
    const dy = (seg[1][1] - seg[0][1]) / len;
    const nx = (-dy * lw) / 2;
    const ny = (dx * lw) / 2;
    lines += poly([
      [seg[0][0] + nx, seg[0][1] + ny], [seg[1][0] + nx, seg[1][1] + ny],
      [seg[1][0] - nx, seg[1][1] - ny], [seg[0][0] - nx, seg[0][1] - ny],
    ]);
  }
  return `<path d="${poly(band)}" fill="${seam}"/><path d="${poly(lower)}" fill="${solid}"/>` +
    `<path d="${frame}" fill="${hatch}" fill-rule="evenodd"/><path d="${lines}" fill="${hatch}"/>`;
}
// Small-size version: no hatching, just the solid halves and the seam, on an ink tile.
export function r2Favicon({ tile = INK, mark = WHITE, seam = SIGNAL } = {}) {
  const { upper, lower, band } = sectionPieces({ ch: 22, g: 6, o: 8, e: 88 });
  return `<rect width="96" height="96" rx="16" fill="${tile}"/>` +
    `<g transform="translate(14.4 14.4) scale(0.7)"><path d="${poly(band)}" fill="${seam}"/><path d="${poly(upper)}" fill="${mark}"/><path d="${poly(lower)}" fill="${mark}"/></g>`;
}

// ---------- Route 3: VIA (wordmark with an orange O) ----------
// The O is the only orange letter. It reads as a via pad: a ring around a hole.
export function r3Favicon(font, { tile = INK, ring: ringFill = SIGNAL } = {}) {
  const g = font.charToGlyph("O");
  const bb = g.getBoundingBox();
  const size = 100;
  const k = size / font.unitsPerEm;
  const scale = 54 / ((bb.x2 - bb.x1) * k);
  const kk = k * scale;
  const x = 48 - ((bb.x1 + bb.x2) / 2) * kk;
  const y = 48 + ((bb.y1 + bb.y2) / 2) * kk;
  return `<rect width="96" height="96" rx="18" fill="${tile}"/><path d="${g.getPath(x, y, size * scale).toPathData(2)}" fill="${ringFill}"/>`;
}
