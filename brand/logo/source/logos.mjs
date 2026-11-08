// Composes symbols, wordmarks and lockups. Each item is { body, box } where box is the viewBox.
import { FONTS, metrics, outlineText } from "./lib.mjs";
import { INK, SIGNAL, WHITE, r1Symbol, r1Favicon, r2Symbol, r2Favicon, r3Favicon } from "./routes.mjs";

export function makeLogos(name = "Normek") {
  const barlow = FONTS.barlow600();
  const sora = FONTS.sora600();
  const upper = name.toUpperCase();
  const lower = name.toLowerCase();
  const GAP = 24;
  const ink = (rev) => (rev ? WHITE : INK);

  const r1 = {
    symbol: (rev = false) => ({ body: r1Symbol({ housing: ink(rev), trace: ink(rev) }), box: [7, 7, 82, 82] }),
    lockup: (rev = false) => {
      const size = 50;
      const m = metrics(barlow, size);
      const x0 = 89 + GAP;
      const t = outlineText(barlow, upper, { size, tracking: 0.12, x: x0, y: 48 + m.cap / 2, fill: ink(rev) });
      return { body: r1Symbol({ housing: ink(rev), trace: ink(rev) }) + t.svg, box: [7, 7, x0 + t.width - 7, 82] };
    },
    favicon: () => ({ body: r1Favicon(), box: [0, 0, 96, 96] }),
  };

  const r2 = {
    symbol: (rev = false) => ({ body: r2Symbol({ solid: ink(rev), hatch: ink(rev) }), box: [8, 8, 80, 80] }),
    lockup: (rev = false) => {
      const size = 58;
      const m = metrics(barlow, size);
      const x0 = 88 + GAP;
      const t = outlineText(barlow, lower, { size, tracking: 0.02, x: x0, y: 48 + m.xh / 2, fill: ink(rev) });
      return { body: r2Symbol({ solid: ink(rev), hatch: ink(rev) }) + t.svg, box: [8, 8, x0 + t.width - 8, 80] };
    },
    favicon: () => ({ body: r2Favicon(), box: [0, 0, 96, 96] }),
  };

  const r3 = {
    wordmark: (rev = false) => {
      const size = 100;
      const m = metrics(sora, size);
      const t = outlineText(sora, upper, {
        size, tracking: 0.1, x: 0, y: 0, fill: ink(rev), accentIndex: upper.indexOf("O"), accentFill: SIGNAL,
      });
      return { body: t.svg, box: [-2, -m.cap - 2, t.width + 4, m.cap + 4] };
    },
    favicon: () => ({ body: r3Favicon(sora), box: [0, 0, 96, 96] }),
  };

  return { r1, r2, r3 };
}
