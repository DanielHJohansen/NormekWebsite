#!/usr/bin/env node
// Builds the favicon, app icons and social image in public/ from the Trace logo SVGs in
// brand/logo/1-trace/. The rules come from brand/brand-guide.md section 6.
//
//   node scripts/build-brand-assets.mjs                  build
//   node scripts/build-brand-assets.mjs --write-square   rewrite favicon-square.svg first
//
// Reads    brand/logo/1-trace/favicon.svg, favicon-square.svg, lockup-reversed.svg and
//          symbol-reversed.svg (the last one only to check that favicon-square.svg matches it)
// Writes   public/favicon.svg             copy of favicon.svg
//          public/favicon.ico             16, 32 and 48 px frames, PNG inside ICO
//          public/apple-touch-icon.png    180 x 180, square icon
//          public/icon-192.png            192 x 192, square icon
//          public/icon-512.png            512 x 512, square icon
//          public/icon-maskable-512.png   512 x 512, same art, listed with purpose "maskable"
//          public/og-default.png          1200 x 630, reversed lockup on Ink, under 300 KB
//
// The square icon is a full-bleed Ink square with no transparency and the reversed symbol inside
// a centred circle of 80 percent of the width, the maskable safe zone. favicon-square.svg is
// derived from symbol-reversed.svg and the logo paths are copied unchanged. The script stops
// when the file no longer matches, and --write-square rewrites it.
//
// Pictures are drawn by headless Chromium (Playwright) straight from the vector files at each
// size, so nothing is scaled down from a bigger bitmap. Every PNG is then decoded and written
// again by the small encoder below: no alpha channel where the picture is opaque, no metadata
// except an sRGB tag, fixed compression. The same input gives the same bytes on the same
// Chromium and Node version.
//
// After a rename: node brand/logo/source/build.mjs --name "New Name", copy the lockups into
// src/assets/brand/, then run this script again (og-default.png shows the name).
import { createRequire } from "node:module";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync, inflateSync } from "node:zlib";

const root = fileURLToPath(new URL("..", import.meta.url));
const logoDir = join(root, "brand/logo/1-trace");
const publicDir = join(root, "public");
const rel = (path) => path.slice(root.length);

const INK = "#0F1B2D";
const INK_RGB = [0x0f, 0x1b, 0x2d];

// Square icon geometry, on the same 96 unit grid as favicon.svg.
const SQUARE_BOX = 96;
const CENTRE = SQUARE_BOX / 2;
const SAFE_RADIUS = 0.4 * SQUARE_BOX; // circle of 80 percent of the width
const MARK_SCALE = 0.65; // puts the symbol's two outer corners at 98 percent of the safe radius

const OG = { width: 1200, height: 630, symbolHeight: 200, maxBytes: 300_000 };

// ---------------------------------------------------------------------------------------------
// The square icon

function squareSvg(symbolSvg) {
  const box = /viewBox="([^"]+)"/.exec(symbolSvg)?.[1]?.trim().split(/\s+/).map(Number);
  const name = /<title>(.*?) symbol/.exec(symbolSvg)?.[1];
  const paths = symbolSvg.match(/<path [^>]*\/>/g);
  if (box?.length !== 4 || !name || paths?.length !== 4) {
    throw new Error(
      "symbol-reversed.svg is not the Trace symbol (expected a viewBox, a title and four paths).",
    );
  }
  const [x, y, w, h] = box;
  if (x + w / 2 !== CENTRE || y + h / 2 !== CENTRE) {
    throw new Error(`The symbol is not centred on ${CENTRE}, ${CENTRE}. Set a new offset here.`);
  }
  const reach = Math.hypot(w / 2, h / 2) * MARK_SCALE;
  if (reach > SAFE_RADIUS) {
    throw new Error(`The symbol reaches ${reach.toFixed(2)} but the safe zone is ${SAFE_RADIUS}.`);
  }
  const offset = Number((CENTRE * (1 - MARK_SCALE)).toFixed(3));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SQUARE_BOX} ${SQUARE_BOX}" width="384" height="384" role="img">`,
    `<title>${name} icon, square</title>`,
    `<rect width="${SQUARE_BOX}" height="${SQUARE_BOX}" fill="${INK}"/>`,
    `<g transform="translate(${offset} ${offset}) scale(${MARK_SCALE})">`,
    ...paths,
    "</g>",
    "</svg>",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------------------------
// PNG, reading Chromium's output and writing ours. 8 bit RGB or RGBA, no interlace.

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Prediction for byte x of a row under PNG filter type 0 to 4. */
function predict(filter, left, up, upLeft) {
  if (filter === 0) return 0;
  if (filter === 1) return left;
  if (filter === 2) return up;
  if (filter === 3) return (left + up) >> 1;
  if (filter === 4) return paeth(left, up, upLeft);
  throw new Error(`Unknown PNG filter type ${filter}.`);
}

function decodePng(png) {
  if (!png.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("Chromium did not return a PNG.");
  const idat = [];
  let header;
  for (let pos = 8; pos < png.length;) {
    const length = png.readUInt32BE(pos);
    const type = png.toString("latin1", pos + 4, pos + 8);
    const data = png.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") header = data;
    if (type === "IDAT") idat.push(data);
    pos += 12 + length;
  }
  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const [depth, colourType, , , interlace] = header.subarray(8, 13);
  if (depth !== 8 || interlace !== 0 || (colourType !== 2 && colourType !== 6)) {
    throw new Error(`Unsupported PNG (depth ${depth}, colour type ${colourType}, ${interlace}).`);
  }
  const channels = colourType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const rgba = Buffer.alloc(width * height * 4, 255);
  let prev = Buffer.alloc(stride);
  let line = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const filter = raw[start];
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? line[x - channels] : 0;
      const upLeft = x >= channels ? prev[x - channels] : 0;
      line[x] = (raw[start + 1 + x] + predict(filter, left, prev[x], upLeft)) & 0xff;
    }
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < channels; c++) rgba[(y * width + x) * 4 + c] = line[x * channels + c];
    }
    [prev, line] = [line, prev];
  }
  return { width, height, rgba };
}

function pngChunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const chunk = Buffer.alloc(body.length + 8);
  chunk.writeUInt32BE(data.length, 0);
  body.copy(chunk, 4);
  chunk.writeUInt32BE(crc32(body), body.length + 4);
  return chunk;
}

/** Writes RGB when alpha is false (the picture must then be fully opaque) or RGBA when true. */
function encodePng({ width, height, rgba }, { alpha }) {
  const channels = alpha ? 4 : 3;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  const row = Buffer.alloc(stride);
  const prev = Buffer.alloc(stride);
  const candidates = Array.from({ length: 5 }, () => Buffer.alloc(stride));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < channels; c++) row[x * channels + c] = rgba[(y * width + x) * 4 + c];
    }
    // Pick the filter with the smallest sum of absolute values, the usual heuristic.
    let best = 0;
    let bestScore = Infinity;
    for (let filter = 0; filter < 5; filter++) {
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const left = x >= channels ? row[x - channels] : 0;
        const upLeft = x >= channels ? prev[x - channels] : 0;
        const value = (row[x] - predict(filter, left, prev[x], upLeft)) & 0xff;
        candidates[filter][x] = value;
        score += value < 128 ? value : 256 - value;
      }
      if (score < bestScore) [best, bestScore] = [filter, score];
    }
    raw[y * (stride + 1)] = best;
    candidates[best].copy(raw, y * (stride + 1) + 1);
    row.copy(prev);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = alpha ? 6 : 2; // colour type: RGBA or RGB
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("sRGB", Buffer.from([0])),
    pngChunk("IDAT", deflateSync(raw, { level: 9, memLevel: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function isOpaque({ rgba }) {
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] !== 255) return false;
  return true;
}

function pixel({ width, rgba }, x, y) {
  const i = (y * width + x) * 4;
  return [rgba[i], rgba[i + 1], rgba[i + 2]];
}

const isInk = (rgb) => rgb.every((value, i) => value === INK_RGB[i]);

/** Bounding box of everything that is not Ink, or null when the picture is all Ink. */
function markBounds(image) {
  const { width, height } = image;
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isInk(pixel(image, x, y))) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX < 0 ? null : { minX, maxX, minY, maxY };
}

// ---------------------------------------------------------------------------------------------
// ICO: a directory of PNG frames. The container bytes are written here, there is no library.

function buildIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length + 16 * frames.length;
  const entries = frames.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size; // width, 0 would mean 256
    entry[1] = size; // height
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...frames.map((frame) => frame.png)]);
}

/** Reads the directory back and checks it against the frames that went in. */
function checkIco(ico, frames) {
  if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1) throw new Error("Bad ICO header.");
  if (ico.readUInt16LE(4) !== frames.length) throw new Error("Wrong frame count in the ICO.");
  frames.forEach(({ size, png }, i) => {
    const at = 6 + 16 * i;
    const length = ico.readUInt32LE(at + 8);
    const offset = ico.readUInt32LE(at + 12);
    const frame = ico.subarray(offset, offset + length);
    const image = decodePng(frame);
    if (ico[at] !== size || image.width !== size || image.height !== size || !frame.equals(png)) {
      throw new Error(`ICO frame ${i} does not match ${size} x ${size}.`);
    }
  });
}

// ---------------------------------------------------------------------------------------------
// Chromium

function loadChromium() {
  const require = createRequire(import.meta.url);
  for (const name of ["playwright", "playwright-core", "@playwright/test"]) {
    try {
      return require(name).chromium;
    } catch {
      // try the next package
    }
  }
  throw new Error(
    "Playwright is not installed. Run `npm ci`, then `npx playwright install chromium`.",
  );
}

/**
 * Draws an SVG into a page of width x height pixels at device scale 1 and returns the PNG.
 * The image box can be smaller than the page, centred, on an optional solid background.
 */
async function rasterise(page, { svg, width, height, box = { width, height }, background }) {
  const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>` +
      `html,body{margin:0;padding:0;background:${background ?? "transparent"}}` +
      `body{width:${width}px;height:${height}px;display:flex;align-items:center;` +
      `justify-content:center;overflow:hidden}` +
      `img{display:block;width:${box.width}px;height:${box.height}px}` +
      `</style><img alt="" src="${uri}">`,
  );
  return page.screenshot({
    type: "png",
    omitBackground: background === undefined,
    clip: { x: 0, y: 0, width, height },
  });
}

// ---------------------------------------------------------------------------------------------
// Checks on the finished pictures

/** Opaque, Ink in the corners, and nothing but Ink outside the maskable safe zone. */
function checkSquareIcon(image, size, file) {
  if (image.width !== size || image.height !== size) throw new Error(`${file} is not ${size} px.`);
  if (!isOpaque(image)) throw new Error(`${file} has transparent pixels.`);
  const corners = [
    [0, 0],
    [size - 1, 0],
    [0, size - 1],
    [size - 1, size - 1],
  ];
  if (!corners.every(([x, y]) => isInk(pixel(image, x, y)))) {
    throw new Error(`${file} is not Ink in every corner.`);
  }
  const radius = (SAFE_RADIUS / SQUARE_BOX) * size;
  let markPixels = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isInk(pixel(image, x, y))) continue;
      markPixels++;
      if (Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) > radius) {
        throw new Error(`${file} has mark pixels outside the safe zone at ${x}, ${y}.`);
      }
    }
  }
  if (markPixels < size * size * 0.02) throw new Error(`${file} looks empty.`);
}

// ---------------------------------------------------------------------------------------------

async function main() {
  const writeSquare = process.argv.includes("--write-square");
  const read = (name) => readFileSync(join(logoDir, name), "utf8");

  // 1. The square icon source must be the reversed symbol, unchanged, on Ink.
  const squarePath = join(logoDir, "favicon-square.svg");
  const squareText = squareSvg(read("symbol-reversed.svg"));
  if (writeSquare) {
    writeFileSync(squarePath, squareText);
  } else if (!existsSync(squarePath) || readFileSync(squarePath, "utf8") !== squareText) {
    throw new Error(
      `${rel(squarePath)} is missing or no longer matches symbol-reversed.svg.\n` +
        "Run: node scripts/build-brand-assets.mjs --write-square",
    );
  }

  const faviconText = read("favicon.svg");
  const lockupText = read("lockup-reversed.svg");
  const lockupBox = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/.exec(lockupText);
  if (!lockupBox) throw new Error("lockup-reversed.svg has no viewBox.");
  const lockupRatio = Number(lockupBox[1]) / Number(lockupBox[2]);

  mkdirSync(publicDir, { recursive: true });
  const written = [];
  const write = (name, data, note) => {
    const path = join(publicDir, name);
    writeFileSync(path, data);
    written.push({ file: rel(path), bytes: statSync(path).size, note });
  };

  // 2. Draw and write the files.
  const browser = await loadChromium().launch({
    args: ["--force-color-profile=srgb", "--hide-scrollbars"],
  });
  try {
    const page = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage();
    const draw = async (options) => decodePng(await rasterise(page, options));

    // favicon.svg and favicon.ico (transparent corners, the tile has chamfered edges)
    copyFileSync(join(logoDir, "favicon.svg"), join(publicDir, "favicon.svg"));
    written.push({
      file: "public/favicon.svg",
      bytes: statSync(join(publicDir, "favicon.svg")).size,
      note: "copy of favicon.svg",
    });
    const frames = [];
    for (const size of [16, 32, 48]) {
      const image = await draw({ svg: faviconText, width: size, height: size });
      frames.push({ size, png: encodePng(image, { alpha: true }) });
    }
    const ico = buildIco(frames);
    checkIco(ico, frames);
    write("favicon.ico", ico, "frames 16, 32, 48 px, PNG inside ICO");

    // square icons (opaque RGB)
    for (const [name, size] of [
      ["apple-touch-icon.png", 180],
      ["icon-192.png", 192],
      ["icon-512.png", 512],
      ["icon-maskable-512.png", 512],
    ]) {
      const image = await draw({ svg: squareText, width: size, height: size });
      checkSquareIcon(image, size, name);
      write(name, encodePng(image, { alpha: false }), `${size} x ${size}, RGB, no alpha`);
    }

    // social image: reversed lockup, centred on Ink
    const symbolBox = { width: OG.symbolHeight * lockupRatio, height: OG.symbolHeight };
    const og = await draw({
      svg: lockupText,
      width: OG.width,
      height: OG.height,
      box: symbolBox,
      background: INK,
    });
    const bounds = markBounds(og);
    if (!isOpaque(og) || !isInk(pixel(og, 0, 0)) || !bounds) {
      throw new Error("og-default.png is not an opaque Ink card with a lockup on it.");
    }
    const offX = Math.abs(bounds.minX - (OG.width - 1 - bounds.maxX));
    const offY = Math.abs(bounds.minY - (OG.height - 1 - bounds.maxY));
    if (offX > 2 || offY > 2) throw new Error(`The lockup is off centre by ${offX}, ${offY} px.`);
    const ogPng = encodePng(og, { alpha: false });
    if (ogPng.length >= OG.maxBytes) {
      throw new Error(`og-default.png is ${ogPng.length} bytes, the limit is ${OG.maxBytes}.`);
    }
    write("og-default.png", ogPng, `${OG.width} x ${OG.height}, RGB, limit ${OG.maxBytes} bytes`);
  } finally {
    await browser.close();
  }

  // 3. Report.
  const squareNote = writeSquare ? "rewritten" : "checked against symbol-reversed.svg";
  console.log(`${rel(squarePath)}  ${squareText.length} bytes  (${squareNote})`);
  for (const { file, bytes, note } of written) {
    console.log(`${file.padEnd(30)} ${String(bytes).padStart(6)} bytes  ${note}`);
  }
}

main().catch((error) => {
  console.error(`build-brand-assets: ${error.message}`);
  process.exit(1);
});
