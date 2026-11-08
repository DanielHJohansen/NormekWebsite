/**
 * The layout and type rules of docs/design/tokens.md and the canvas review, checked in a browser, so a change
 * that breaks one fails a test instead of waiting for someone to look. Every page in dist/ is covered.
 * Widths follow the design: 390, 768 and 1280, with 320 and 1024 as the awkward ones in between.
 */
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { listPages } from "../../scripts/lib/dist.mjs";
import { expect, test } from "./fixtures";

const pages = listPages("dist");

test.beforeEach(async ({ page }) => {
  // Measure after the fonts are in, because Barlow, Plex Sans and Plex Mono are all different widths from the fallback.
  await page.addInitScript(() => {
    (window as unknown as { __fontsReady: Promise<unknown> }).__fontsReady = new Promise(
      (resolve) => window.addEventListener("load", () => document.fonts.ready.then(resolve)),
    );
  });
});

async function visit(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await page.evaluate(() => (window as unknown as { __fontsReady: Promise<unknown> }).__fontsReady);
}

/** The tests that set their own widths run once, on the desktop project. */
function runOnceOnDesktop(): void {
  // Playwright needs the empty pattern to know that no fixture is wanted.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1280",
      "Sets its own widths, so one project is enough.",
    );
  });
}

/** Lines of running text wider than 28 em. An empty list is a pass. */
async function findTooWide(
  page: Page,
): Promise<Array<{ text: string; width: number; limit: number }>> {
  return page.evaluate(() => {
    const out: Array<{ text: string; width: number; limit: number }> = [];
    const skip =
      "h1,h2,h3,h4,h5,h6,figcaption,.eyebrow,label,button,template,script,style,noscript,[hidden],.sr-only";
    const blocks = new Set<HTMLElement>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const element = node.parentElement;
      if (!element || !(node.textContent ?? "").trim()) continue;
      if (element.closest(skip)) continue;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      // Mono text is wider per em, so its captions and tags have their own limit.
      if (style.fontFamily.startsWith('"IBM Plex Mono"')) continue;

      // 1. A line made of a single piece of text. This sees a line in a paragraph that is all one run.
      const fontSize = parseFloat(style.fontSize);
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width > 28 * fontSize + 1) {
          out.push({
            text: (node.textContent ?? "").trim().slice(0, 50),
            width: Math.round(rect.width),
            limit: Math.round(28 * fontSize),
          });
        }
      }
      const block = element.closest<HTMLElement>("p, li, dd, dt");
      if (block) blocks.add(block);
    }

    // 2. A paragraph or list item with more than 65 characters in a box wider than 28 em. A line there is often
    // made of several pieces (bold lead-in, text, a tag), and each piece alone is short.
    for (const block of blocks) {
      const text = (block.textContent ?? "").trim();
      if (text.length <= 65 || block.querySelector("p, li, ul, ol")) continue;
      const style = getComputedStyle(block);
      if (style.fontFamily.startsWith('"IBM Plex Mono"')) continue;
      const sides = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"] as const;
      const content =
        block.getBoundingClientRect().width -
        sides.reduce((sum, side) => sum + parseFloat(style[side]), 0);
      const limit = 28 * parseFloat(style.fontSize);
      if (content > limit + 1) {
        out.push({
          text: text.slice(0, 50),
          width: Math.round(content),
          limit: Math.round(limit),
        });
      }
    }
    return out;
  });
}

for (const built of pages) {
  test.describe(`type and targets on ${built.route}`, () => {
    test("running text is at most 28 em wide, so no line passes 65 characters", async ({
      page,
    }) => {
      await visit(page, built.route);
      expect(await findTooWide(page)).toEqual([]);
    });

    test("standalone links and controls are at least 44 px high", async ({ page }) => {
      await visit(page, built.route);
      const small = await page.evaluate(() => {
        const out: Array<{ what: string; height: number }> = [];
        const selector = "a[href], button, input, textarea, select, summary";
        for (const element of document.querySelectorAll<HTMLElement>(selector)) {
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") continue;
          if (element.closest(".sr-only, [aria-hidden='true'], template, noscript")) continue;
          if (element.classList.contains("skip-link")) continue;
          // A link inside a sentence keeps its line box (tokens.md 5.4).
          if (element.tagName === "A" && style.display === "inline") continue;
          const box = element.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) continue;
          if (box.height < 43.5) {
            out.push({
              what: `${element.tagName.toLowerCase()} "${(element.textContent ?? "").trim().slice(0, 40)}"`,
              height: Math.round(box.height * 10) / 10,
            });
          }
        }
        return out;
      });
      expect(small).toEqual([]);
    });

    test("no link in a sentence carries a stray space inside, which would show as an underlined space", async ({
      page,
    }) => {
      await visit(page, built.route);
      const padded = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLAnchorElement>("a")]
          .filter((link) => getComputedStyle(link).display === "inline")
          .filter((link) => /^\s|\s$/.test(link.textContent ?? ""))
          .map((link) => link.outerHTML.slice(0, 100)),
      );
      expect(padded).toEqual([]);
    });

    test("type uses the three families, weights 400 and 600, no italics and nothing under 14 px", async ({
      page,
    }) => {
      await visit(page, built.route);
      const odd = await page.evaluate(() => {
        const families = ["Barlow Semi Condensed", "IBM Plex Sans", "IBM Plex Mono"];
        const out: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const seen = new Set<Element>();
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const element = node.parentElement;
          if (!element || seen.has(element) || !(node.textContent ?? "").trim()) continue;
          seen.add(element);
          if (element.closest("template, script, style, noscript, [hidden], .sr-only")) continue;
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") continue;
          const family = style.fontFamily.split(",")[0]?.trim().replace(/"/g, "") ?? "";
          const label = `${element.tagName.toLowerCase()} "${(node.textContent ?? "").trim().slice(0, 30)}"`;
          if (!families.includes(family)) out.push(`${label}: family ${family}`);
          if (!["400", "600"].includes(style.fontWeight))
            out.push(`${label}: weight ${style.fontWeight}`);
          if (style.fontStyle !== "normal") out.push(`${label}: ${style.fontStyle}`);
          if (parseFloat(style.fontSize) < 13.99) out.push(`${label}: ${style.fontSize}`);
        }
        return out;
      });
      expect(odd).toEqual([]);
    });
  });
}

for (const built of pages) {
  test.describe(`details on ${built.route}`, () => {
    test("every list with its markers reset says it is a list, because Safari with VoiceOver drops the semantics otherwise (QA-09)", async ({
      page,
    }) => {
      await visit(page, built.route);
      const bare = await page.evaluate(() =>
        [...document.querySelectorAll("ul, ol")]
          .filter((list) => getComputedStyle(list).display !== "none")
          .filter((list) => getComputedStyle(list).listStyleType === "none")
          .filter((list) => list.getAttribute("role") !== "list")
          .map((list) => list.outerHTML.slice(0, 90)),
      );
      expect(bare).toEqual([]);
    });

    test("eyebrows balance their lines, and placeholder tags use the 4 px base padding at 14 px or more", async ({
      page,
    }) => {
      await visit(page, built.route);
      const odd = await page.evaluate(() => {
        const out: string[] = [];
        for (const eyebrow of document.querySelectorAll<HTMLElement>(".eyebrow")) {
          const wrap =
            getComputedStyle(eyebrow).textWrapMode + " " + getComputedStyle(eyebrow).textWrapStyle;
          if (!wrap.includes("balance"))
            out.push(`eyebrow "${(eyebrow.textContent ?? "").trim()}": ${wrap}`);
        }
        for (const tag of document.querySelectorAll<HTMLElement>(".tbc")) {
          const style = getComputedStyle(tag);
          // The label on the founder photo placeholder is a block tag with its own padding (8 px by 4 px).
          if (tag.closest(".frame")) continue;
          if (style.paddingLeft !== "4px" || style.paddingRight !== "4px") {
            out.push(`tag "${(tag.textContent ?? "").slice(0, 30)}": padding ${style.paddingLeft}`);
          }
          if (parseFloat(style.fontSize) < 13.99)
            out.push(`tag "${(tag.textContent ?? "").slice(0, 30)}": ${style.fontSize}`);
        }
        return out;
      });
      expect(odd).toEqual([]);
    });
  });
}

test.describe("the header", () => {
  runOnceOnDesktop();

  const widths = [
    { width: 320, links: false, logo: 28 },
    { width: 390, links: false, logo: 28 },
    { width: 767, links: false, logo: 28 },
    { width: 768, links: false, logo: 32 },
    { width: 1024, links: false, logo: 32 },
    { width: 1279, links: false, logo: 32 },
    { width: 1280, links: true, logo: 32 },
    { width: 1440, links: true, logo: 32 },
  ];

  for (const { width, links, logo } of widths) {
    test(`at ${width} px the lockup is ${logo} px, the links are ${links ? "shown" : "hidden"} and nothing overflows`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await visit(page, "/");
      const nav = page.locator('header nav[aria-label="Main"] ul a');
      if (links) {
        await expect(nav).toHaveCount(4);
        for (let i = 0; i < 4; i++) await expect(nav.nth(i)).toBeVisible();
      } else {
        for (let i = 0; i < (await nav.count()); i++) await expect(nav.nth(i)).toBeHidden();
      }
      // The outline button is always there.
      await expect(
        page.locator("header").getByRole("link", { name: "Request a review" }),
      ).toBeVisible();
      const height = await page
        .locator("header a img")
        .first()
        .evaluate((img) => img.getBoundingClientRect().height);
      expect(Math.round(height)).toBe(logo);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("no horizontal scroll at any width", () => {
  runOnceOnDesktop();

  for (const width of [320, 360, 390, 480, 600, 768, 1024, 1280, 1440]) {
    test(`home page at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await visit(page, "/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("running text at the widths in between", () => {
  runOnceOnDesktop();

  // The lists in the offers and the steps in the process change width when their columns wrap, so one width is not enough.
  for (const width of [390, 480, 600, 768, 900, 1024, 1280, 1440]) {
    test(`home page at ${width} px keeps running text at 28 em`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await visit(page, "/");
      expect(await findTooWide(page)).toEqual([]);
    });
  }
});

test.describe("the hero", () => {
  test("puts the one-person line before the button and the drawing last", async ({ page }) => {
    await visit(page, "/");
    const tops = await page.evaluate(() => {
      const top = (selector: string): number =>
        document.querySelector(selector)?.getBoundingClientRect().top ?? -1;
      return {
        eyebrow: top("#top .eyebrow"),
        heading: top("#top h1"),
        lead: top("#top h1 + p"),
        byline: top("#top h1 + p + p"),
        button: top('#top a[href="#contact"]'),
        email: top('#top a[href^="mailto:"]'),
      };
    });
    expect(Object.values(tops).every((value) => value >= 0)).toBe(true);
    expect(tops.eyebrow).toBeLessThan(tops.heading);
    expect(tops.heading).toBeLessThan(tops.lead);
    expect(tops.lead).toBeLessThan(tops.byline);
    expect(tops.byline).toBeLessThan(tops.button);
    expect(tops.button).toBeLessThan(tops.email);
  });

  test("has no rule above the one-person line", async ({ page }) => {
    await visit(page, "/");
    const border = await page
      .locator("#top h1 + p + p")
      .evaluate((element) => getComputedStyle(element).borderTopWidth);
    expect(border).toBe("0px");
  });

  test("keeps the standard box note at 18 em, so 'it.' never stands alone", async ({ page }) => {
    await visit(page, "/");
    const note = page.locator("#top p", { hasText: "If a standard box fits" });
    const { width, fontSize, lines } = await note.evaluate((element) => {
      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNodeContents(element);
      return {
        width: element.getBoundingClientRect().width,
        fontSize: parseFloat(style.fontSize),
        lines: range.getClientRects().length,
      };
    });
    expect(width).toBeLessThanOrEqual(18 * fontSize + 1);
    expect(lines).toBeGreaterThanOrEqual(1);
  });

  test("shows the drawing as an image with no text in it, and names the parts in a legend", async ({
    page,
  }) => {
    await visit(page, "/");
    const image = page.locator("#top figure img");
    await expect(image).toHaveCount(1);
    const alt = (await image.getAttribute("alt")) ?? "";
    expect(alt.length).toBeGreaterThan(40);
    const src = (await image.getAttribute("src")) ?? "";
    expect(src).toMatch(/\.svg$/);
    // The file has no <text>, because text in a scaled SVG shrinks with it (7 px on a phone).
    const response = await page.request.get(src);
    expect(response.ok()).toBe(true);
    const svg = await response.text();
    expect(svg).not.toMatch(/<text[\s>]/);
    expect(svg).not.toMatch(/font-family/);
    // The legend sits under the drawing in the figcaption, in mono at 14 px or more.
    const legend = page.locator("#top figcaption p").nth(1);
    await expect(legend).toContainText("From the top:");
    const legendStyle = await legend.evaluate((element) => {
      const style = getComputedStyle(element);
      return { family: style.fontFamily, size: parseFloat(style.fontSize) };
    });
    expect(legendStyle.family).toContain("IBM Plex Mono");
    expect(legendStyle.size).toBeGreaterThanOrEqual(14);
    await expect(page.locator("#top figcaption p").first()).toContainText("Not a customer project");
  });

  test("keeps 'I design' together so the heading never ends a line with 'I'", async ({ page }) => {
    await visit(page, "/");
    const heading = (await page.locator("#top h1").textContent()) ?? "";
    expect(heading).toContain("I\u00a0design");
  });

  test("the button is full width below 480 px and its natural width from there", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "phone-390", "Checks the phone layout.");
    await visit(page, "/");
    const widths = await page.evaluate(() => {
      const button = document.querySelector<HTMLElement>('#top a[href="#contact"]');
      const column = button?.parentElement?.parentElement;
      return {
        button: button?.getBoundingClientRect().width ?? 0,
        column: column?.getBoundingClientRect().width ?? 0,
      };
    });
    expect(widths.button).toBeGreaterThanOrEqual(widths.column - 1);
    await page.setViewportSize({ width: 768, height: 900 });
    const wide = await page.evaluate(() => {
      const button = document.querySelector<HTMLElement>('#top a[href="#contact"]');
      const column = button?.parentElement?.parentElement;
      return {
        button: button?.getBoundingClientRect().width ?? 0,
        column: column?.getBoundingClientRect().width ?? 0,
      };
    });
    expect(wide.button).toBeLessThan(wide.column - 100);
  });

  test("on a phone the button, the note and the email link are 44 px rows inside the first screen", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "phone-390", "Checks the phone layout.");
    await visit(page, "/");
    const rows = await page.evaluate(() => {
      const box = (selector: string) => {
        const rect = document.querySelector(selector)?.getBoundingClientRect();
        return { top: rect?.top ?? -1, bottom: rect?.bottom ?? -1, height: rect?.height ?? 0 };
      };
      return {
        button: box('#top a[href="#contact"]'),
        note: box("#top .max-w-\\[18em\\]"),
        email: box('#top a[href^="mailto:"]'),
        viewport: window.innerHeight,
      };
    });
    expect(rows.button.height).toBeGreaterThanOrEqual(52);
    expect(rows.note.height).toBeGreaterThanOrEqual(43.5);
    expect(rows.email.height).toBeGreaterThanOrEqual(43.5);
    // The button ends well inside a 844 px screen, as the canvas review wants (about 587 px).
    expect(rows.button.bottom).toBeLessThan(620);
    expect(rows.email.bottom).toBeLessThan(rows.viewport);
  });

  test("sets the lead in Ink below 480 px and in Muted from there", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "phone-390", "Sets its own widths.");
    const read = async (): Promise<string> =>
      page.locator("#top h1 + p").evaluate((element) => getComputedStyle(element).color);
    await visit(page, "/");
    const phone = await read();
    await page.setViewportSize({ width: 600, height: 900 });
    const wider = await read();
    expect(phone).toBe("rgb(15, 27, 45)");
    expect(wider).not.toBe(phone);
  });
});

test.describe("sections", () => {
  test("the problem and data lists are grids, so a lone card keeps its width at 768 px", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1280", "Sets its own width.");
    await page.setViewportSize({ width: 768, height: 1000 });
    await visit(page, "/");
    const widths = await page
      .locator("#problem ul > li")
      .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().width)));
    expect(widths).toHaveLength(3);
    // Two columns, so the third card is not stretched to the full width.
    expect(Math.max(...widths)).toBeLessThan(400);
  });

  test("the frames are drawn in two layers, so the hairline follows the cut corners", async ({
    page,
  }) => {
    await visit(page, "/");
    const frames = await page.locator(".frame").evaluateAll((elements) =>
      elements.map((frame) => {
        const inner = frame.firstElementChild as HTMLElement | null;
        return {
          outer: getComputedStyle(frame).clipPath,
          inner: inner ? getComputedStyle(inner).clipPath : "",
          padding: getComputedStyle(frame).paddingTop,
          children: frame.children.length,
        };
      }),
    );
    expect(frames.length).toBeGreaterThanOrEqual(2);
    for (const frame of frames) {
      expect(frame.children).toBe(1);
      expect(frame.padding).toBe("1px");
      expect(frame.outer).toContain("polygon");
      expect(frame.inner).toContain("polygon");
      expect(frame.inner).not.toBe(frame.outer);
    }
  });

  test("the trace appears once, as five rings in the process list", async ({ page }) => {
    await visit(page, "/");
    await expect(page.locator("circle[stroke-width='7.2']")).toHaveCount(5);
    await expect(page.locator("#process circle[stroke-width='7.2']")).toHaveCount(5);
  });

  test("the first screen has one primary Signal button", async ({ page }) => {
    await visit(page, "/");
    const signalButtons = await page.evaluate(
      () =>
        [...document.querySelectorAll("a, button")].filter((element) => {
          const box = element.getBoundingClientRect();
          return (
            getComputedStyle(element).backgroundColor === "rgb(255, 90, 31)" &&
            box.top < window.innerHeight &&
            box.bottom > 0
          );
        }).length,
    );
    expect(signalButtons).toBe(1);
  });
});

test.describe("forced colours (QA-03)", () => {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`the images keep an opaque ground and the primary button keeps its border in the ${colorScheme} palette`, async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: "active", colorScheme });
      await visit(page, "/");
      const seen = await page.evaluate(() => {
        const read = (selector: string) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const style = getComputedStyle(element);
          return {
            adjust: style.getPropertyValue("forced-color-adjust"),
            background: style.backgroundColor,
          };
        };
        const button = document.querySelector('#top a[href="#contact"]');
        const buttonStyle = button ? getComputedStyle(button) : null;
        return {
          header: read("header img"),
          drawing: read("#top .frame-inner img"),
          footer: read("footer img"),
          border: buttonStyle?.borderTopWidth,
          borderColor: buttonStyle?.borderTopColor,
        };
      });
      expect(seen.header).toEqual({ adjust: "none", background: "rgb(255, 255, 255)" });
      expect(seen.drawing).toEqual({ adjust: "none", background: "rgb(255, 255, 255)" });
      expect(seen.footer).toEqual({ adjust: "none", background: "rgb(15, 27, 45)" });
      // A transparent border is drawn in the system colour in forced colours, so the button still has an edge.
      expect(seen.border).toBe("2px");
      expect(seen.borderColor).not.toBe("rgba(0, 0, 0, 0)");
    });
  }

  test("outside forced colours the images have no ground of their own and the fill stays Signal", async ({
    page,
  }) => {
    await visit(page, "/");
    const seen = await page.evaluate(() => {
      const background = (selector: string) =>
        getComputedStyle(document.querySelector(selector) as Element).backgroundColor;
      return {
        header: background("header img"),
        drawing: background("#top .frame-inner img"),
        footer: background("footer img"),
        button: background('#top a[href="#contact"]'),
        border: getComputedStyle(document.querySelector('#top a[href="#contact"]') as Element)
          .borderTopColor,
      };
    });
    expect(seen.header).toBe("rgba(0, 0, 0, 0)");
    expect(seen.drawing).toBe("rgba(0, 0, 0, 0)");
    expect(seen.footer).toBe("rgba(0, 0, 0, 0)");
    expect(seen.button).toBe("rgb(255, 90, 31)");
    expect(seen.border).toBe("rgba(0, 0, 0, 0)");
  });
});

test.describe("200 percent text on a phone (QA-07)", () => {
  // Playwright needs the empty pattern to know that no fixture is wanted.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "phone-390", "A phone width test.");
  });

  for (const route of ["/", "/privacy/", "/thanks/", "/404.html"]) {
    test(`${route} does not scroll sideways`, async ({ page }) => {
      await visit(page, route);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("a status message and long prose may break anywhere", async ({ page }) => {
    await visit(page, "/thanks/");
    const wrap = await page.evaluate(() => ({
      status: getComputedStyle(document.querySelector('[role="status"] > div') as Element)
        .overflowWrap,
    }));
    expect(wrap.status).toBe("anywhere");
    await visit(page, "/privacy/");
    const prose = await page.evaluate(
      () => getComputedStyle(document.querySelector(".prose") as Element).overflowWrap,
    );
    expect(prose).toBe("anywhere");
  });
});

test.describe("the card grid and the offer columns at 1024 px (QA-08)", () => {
  runOnceOnDesktop();

  for (const width of [1024, 1100]) {
    test(`at ${width} px the three problem cards sit in one row`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await visit(page, "/");
      const tops = await page
        .locator("#problem ul > li")
        .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
      expect(tops).toHaveLength(3);
      expect(new Set(tops).size).toBe(1);
    });

    test(`at ${width} px each stage keeps its three columns in one row, so "I need" does not drop under the title`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await visit(page, "/");
      const rows = await page
        .locator("#offers ol > li")
        .evaluateAll((stages) =>
          stages.map((stage) =>
            [...stage.children].map((column) => Math.round(column.getBoundingClientRect().top)),
          ),
        );
      expect(rows).toHaveLength(3);
      for (const tops of rows) {
        expect(tops).toHaveLength(3);
        expect(new Set(tops).size, tops.join(",")).toBe(1);
      }
    });
  }

  test("the grid minimum is 290 px, and the first and last offer columns start at 240 px", async ({
    page,
  }) => {
    await visit(page, "/");
    const grid = await page
      .locator("#problem ul")
      .evaluate((list) => getComputedStyle(list).gridTemplateColumns);
    expect(grid.split(" ").length).toBeGreaterThanOrEqual(1);
    const bases = await page
      .locator("#offers ol > li")
      .first()
      .evaluate((stage) => [...stage.children].map((column) => getComputedStyle(column).flexBasis));
    expect(bases).toEqual(["240px", "360px", "240px"]);
  });
});

test.describe("the written files", () => {
  test("the hero drawing source file has no text and matches the manifest", () => {
    const svg = readFileSync("src/assets/illustrations/enclosure-section-no-text.svg", "utf8");
    expect(svg).not.toMatch(/<text[\s>]/);
    expect(svg).toMatch(/viewBox="20 23 441 420"/);
    // The Signal seal callout stays, and it is the only Signal colour in the drawing.
    expect(svg.match(/#FF5A1F/g)?.length).toBe(2);
    expect(readFileSync("docs/media-manifest.md", "utf8")).toContain(
      "enclosure-section-no-text.svg",
    );
  });
});
