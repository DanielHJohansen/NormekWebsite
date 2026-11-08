/**
 * The fallback faces and the font stacks (QA-04), and the rule that tokens.css is the block of tokens.md section 2.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const fonts = readFileSync("src/styles/fonts.css", "utf8");
const tokens = readFileSync("src/styles/tokens.css", "utf8");
const doc = readFileSync("docs/design/tokens.md", "utf8");

/** The @font-face rules by family. */
function faces(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const body = match[1] ?? "";
    const family = /font-family:\s*"([^"]+)"/.exec(body)?.[1];
    if (family) out[family] = body;
  }
  return out;
}

describe("the fallback faces", () => {
  const all = faces(fonts);
  const fallbacks = [
    "Barlow Semi Condensed Fallback",
    "IBM Plex Sans Fallback",
    "IBM Plex Mono Fallback",
  ];

  it("exist for each of the three families", () => {
    for (const family of fallbacks) expect(all[family], family).toBeDefined();
  });

  it("give size-adjust and all three vertical overrides, as percentages", () => {
    for (const family of fallbacks) {
      const body = all[family] ?? "";
      for (const property of [
        "size-adjust",
        "ascent-override",
        "descent-override",
        "line-gap-override",
      ]) {
        expect(body, `${family} ${property}`).toMatch(
          new RegExp(`${property}:\\s*\\d+(\\.\\d+)?%;`),
        );
      }
    }
  });

  it("use system fonts only, never a file or an address", () => {
    for (const family of fallbacks) {
      const src = /src:\s*([^;]+);/.exec(all[family] ?? "")?.[1] ?? "";
      expect(src, family).toMatch(/^local\("[^"]+"\)(, local\("[^"]+"\))*$/);
    }
  });

  it("match Arial for the two sans faces and Courier New for the mono face", () => {
    expect(all["Barlow Semi Condensed Fallback"]).toContain('local("Arial")');
    expect(all["IBM Plex Sans Fallback"]).toContain('local("Arial")');
    expect(all["IBM Plex Mono Fallback"]).toContain('local("Courier New")');
  });

  it("have numbers in a believable range, so a typo cannot slip in", () => {
    const value = (family: string, property: string) =>
      parseFloat(new RegExp(`${property}:\\s*([\\d.]+)%`).exec(all[family] ?? "")?.[1] ?? "NaN");
    // Barlow Semi Condensed is narrower than Arial. Plex Sans and Plex Mono are about as wide as Arial and Courier New.
    expect(value("Barlow Semi Condensed Fallback", "size-adjust")).toBeGreaterThan(80);
    expect(value("Barlow Semi Condensed Fallback", "size-adjust")).toBeLessThan(95);
    expect(value("IBM Plex Sans Fallback", "size-adjust")).toBeGreaterThan(95);
    expect(value("IBM Plex Sans Fallback", "size-adjust")).toBeLessThan(106);
    expect(value("IBM Plex Mono Fallback", "size-adjust")).toBeGreaterThan(97);
    expect(value("IBM Plex Mono Fallback", "size-adjust")).toBeLessThan(103);
    for (const family of fallbacks) {
      expect(value(family, "ascent-override"), family).toBeGreaterThan(80);
      expect(value(family, "ascent-override"), family).toBeLessThan(125);
      expect(value(family, "descent-override"), family).toBeGreaterThan(10);
      expect(value(family, "descent-override"), family).toBeLessThan(35);
    }
  });

  it("explain how the numbers were derived, in a comment next to them", () => {
    expect(fonts).toMatch(/fontkit/);
    expect(fonts).toMatch(/Capsize formula/);
    expect(fonts).toMatch(/Liberation Sans/);
  });
});

describe("the font stacks", () => {
  const stack = (name: string) => new RegExp(`--font-${name}:\\s*([^;]+);`).exec(tokens)?.[1] ?? "";

  it("list the fallback face second, right after the web font", () => {
    expect(stack("display")).toMatch(
      /^"Barlow Semi Condensed", "Barlow Semi Condensed Fallback", /,
    );
    expect(stack("sans")).toMatch(/^"IBM Plex Sans", "IBM Plex Sans Fallback", /);
    expect(stack("mono")).toMatch(/^"IBM Plex Mono", "IBM Plex Mono Fallback", /);
  });

  it("end in a generic family, so a machine with no local font still shows text", () => {
    expect(stack("display")).toMatch(/sans-serif$/);
    expect(stack("sans")).toMatch(/sans-serif$/);
    expect(stack("mono")).toMatch(/monospace$/);
  });

  it("keep font-display: swap on the web fonts", () => {
    const all = faces(fonts);
    for (const family of ["Barlow Semi Condensed", "IBM Plex Sans", "IBM Plex Mono"]) {
      expect(all[family], family).toMatch(/font-display:\s*swap/);
    }
  });
});

describe("tokens.css and tokens.md", () => {
  it("tokens.css is the block of tokens.md section 2, character for character", () => {
    const block =
      /## 2\. `src\/styles\/tokens\.css`[\s\S]*?```css\n([\s\S]*?)\n```/.exec(doc)?.[1] ?? "";
    expect(block.trim().length).toBeGreaterThan(1000);
    expect(tokens.trim()).toBe(block.trim());
  });
});
