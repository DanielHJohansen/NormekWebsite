/**
 * Content to page: what the files in src/content turn into in the built site. It checks the mapping (the sections
 * and anchors, the header links, the stages, the steps, the form labels) and two decisions that must hold on every
 * page: no AI or tools wording (decision D6 of 8 November 2026) and no price (every price is a hypothesis).
 * The strings themselves belong to the copy file, so most checks count and order things and leave the wording alone.
 */
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { listPages } from "../../scripts/lib/dist.mjs";
import { expect, test } from "./fixtures";

test.describe("the home page", () => {
  test("has the sections of the plan in order, each named by its heading", async ({ page }) => {
    await page.goto("/");
    const sections = await page.evaluate(() =>
      [...document.querySelectorAll("main > section")].map((section) => ({
        id: section.id,
        heading: document.getElementById(section.getAttribute("aria-labelledby") ?? "")?.tagName,
      })),
    );
    expect(sections.map((section) => section.id)).toEqual([
      "top",
      "problem",
      "offers",
      "process",
      "scope",
      "data",
      "about",
      "contact",
    ]);
    expect(sections.map((section) => section.heading)).toEqual([
      "H1",
      "H2",
      "H2",
      "H2",
      "H2",
      "H2",
      "H2",
      "H2",
    ]);
  });

  test("links the header to four sections and the button to the form", async ({ page }) => {
    await page.goto("/");
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('header nav[aria-label="Main"] a')].map((link) => ({
        text: (link.textContent ?? "").trim(),
        href: link.getAttribute("href"),
      })),
    );
    expect(links).toEqual([
      { text: "Enclosure design", href: "/#offers" },
      { text: "How I work", href: "/#process" },
      { text: "Data and files", href: "/#data" },
      { text: "About", href: "/#about" },
      { text: "Request a review", href: "/#contact" },
    ]);
  });

  test("shows three problem cards, each with a link whose name starts with the visible text", async ({
    page,
  }) => {
    await page.goto("/");
    const cards = await page.locator("#problem ul > li").evaluateAll((items) =>
      items.map((item) => {
        const link = item.querySelector("a");
        return {
          title: item.querySelector("h3")?.textContent?.trim() ?? "",
          text: (link?.textContent ?? "").trim(),
          name: link?.getAttribute("aria-label") ?? "",
          href: link?.getAttribute("href"),
        };
      }),
    );
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.title).not.toBe("");
      // The accessible name begins with the visible text (WCAG 2.5.3) and then names the card.
      expect(card.name.startsWith(card.text)).toBe(true);
      expect(card.name.length).toBeGreaterThan(card.text.length);
      expect(card.href).toBe("#contact");
    }
  });

  test("lists the three stages in order, each with what you get and what I need as lists", async ({
    page,
  }) => {
    await page.goto("/");
    const stages = await page.locator("#offers ol > li").evaluateAll((items) =>
      items.map((item) => ({
        stage: item.querySelector("p.eyebrow")?.textContent?.trim(),
        name: item.querySelector("h3")?.textContent?.trim(),
        lists: item.querySelectorAll("ul").length,
        bullets: item.querySelectorAll("ul > li").length,
      })),
    );
    expect(stages.map((stage) => stage.stage)).toEqual(["Stage 1", "Stage 2", "Stage 3"]);
    expect(stages.map((stage) => stage.name)).toEqual([
      "Enclosure feasibility review",
      "Design and prototype",
      "Production package",
    ]);
    // Stage 3 also has a list of what is not included.
    expect(stages.map((stage) => stage.lists)).toEqual([2, 2, 3]);
    for (const stage of stages) expect(stage.bullets).toBeGreaterThanOrEqual(5);
  });

  test("numbers five steps in the process and ends with the hand-off to approved manufacturers", async ({
    page,
  }) => {
    await page.goto("/");
    const steps = await page
      .locator("#process ol > li")
      .evaluateAll((items) =>
        items.map((item) => item.querySelector("strong")?.textContent?.trim() ?? ""),
      );
    expect(steps).toHaveLength(5);
    expect(steps.at(-1)).toBe("Hand off to manufacturers you approve.");
    await expect(page.locator("#process ol")).toHaveAttribute("role", "list");
  });

  test("keeps the scope, data and about content together", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#scope h3")).toHaveText(["I take on", "Not for now"]);
    await expect(page.locator("#scope ul > li")).toHaveCount(7);
    await expect(page.locator("#data ul > li")).toHaveCount(5);
    await expect(page.locator("#about .prose > p")).toHaveCount(5);
  });

  test("has the four fields of the form with their labels, and three next steps", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#contact-form label").filter({ hasNotText: "Website" })).toHaveText([
      "Name",
      "Work email",
      "Company",
      "What do you need?",
    ]);
    await expect(page.locator("#contact ol > li")).toHaveCount(3);
    await expect(page.locator("#contact-form")).toHaveAttribute("action", "/api/contact");
  });

  test("ends with the footer that holds the company facts as tags until they are confirmed", async ({
    page,
  }) => {
    await page.goto("/");
    const facts = await page.locator("footer ul").first().locator("li").count();
    expect(facts).toBe(4);
    await expect(page.locator("footer a[href='/privacy/']")).toHaveCount(1);
    await expect(page.locator("footer .tbc").first()).toBeVisible();
  });

  test("keeps the draft proof section out of the build", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#proof")).toHaveCount(0);
    await expect(page.locator("[data-draft]")).toHaveCount(0);
  });
});

test.describe("lists and the hero image (QA-09, QA-10)", () => {
  test("names each offer list by its label, and says each is a list", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("list", { name: "You get" })).toHaveCount(3);
    await expect(page.getByRole("list", { name: "I need" })).toHaveCount(3);
    await expect(page.getByRole("list", { name: "Not included" })).toHaveCount(1);
    const lists = await page.locator("#offers ul").evaluateAll((items) =>
      items.map((list) => ({
        role: list.getAttribute("role"),
        label: document
          .getElementById(list.getAttribute("aria-labelledby") ?? "")
          ?.textContent?.trim(),
      })),
    );
    expect(lists).toHaveLength(7);
    for (const list of lists) {
      expect(list.role).toBe("list");
      expect(["You get", "I need", "Not included"]).toContain(list.label);
    }
    await expect(page.locator("#offers > div > ol")).toHaveAttribute("role", "list");
  });

  test("keeps the hero alt text near 130 characters, without the legend, and asks for the image first", async ({
    page,
  }) => {
    await page.goto("/");
    const image = page.locator("#top figure img");
    const alt = (await image.getAttribute("alt")) ?? "";
    expect(alt.length).toBeGreaterThanOrEqual(100);
    expect(alt.length).toBeLessThanOrEqual(140);
    // The legend and the caption say the rest, so the alt does not repeat them.
    expect(alt).not.toMatch(/From the top|standoffs|Not a customer project/);
    await expect(image).toHaveAttribute("fetchpriority", "high");
  });
});

test.describe("the message helper and the limit (QA-11)", () => {
  test("says how long a message may be, and the field has that limit", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#contact-message-help")).toContainText("Up to 2,000 characters.");
    await expect(page.locator("#contact-message")).toHaveAttribute("maxlength", "2000");
  });
});

test.describe("link previews (QA-11)", () => {
  const meta = (page: Page, key: string) =>
    page.locator(`meta[property="${key}"], meta[name="${key}"]`).first().getAttribute("content");

  for (const route of ["/", "/privacy/"]) {
    test(`${route} carries Open Graph and Twitter card tags with absolute addresses`, async ({
      page,
    }) => {
      await page.goto(route);
      const title = await page.title();
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(await meta(page, "og:type")).toBe("website");
      expect(await meta(page, "og:site_name")).toBe("Normek");
      expect(await meta(page, "og:title")).toBe(title);
      expect(await meta(page, "og:description")).toBe(description);
      expect(new URL((await meta(page, "og:url")) ?? "").pathname).toBe(route);
      const image = (await meta(page, "og:image")) ?? "";
      expect(image).toMatch(/^https:\/\/[^/]+\/og-default\.png$/);
      expect((await meta(page, "og:image:alt"))?.length ?? 0).toBeGreaterThan(30);
      expect(await meta(page, "og:image:width")).toBe("1200");
      expect(await meta(page, "og:image:height")).toBe("630");
      expect(await meta(page, "twitter:card")).toBe("summary_large_image");
      expect(await meta(page, "twitter:image")).toBe(image);
    });
  }

  test("the card image is in the build, 1200 by 630 and under 300 KB", () => {
    const png = readFileSync("dist/og-default.png");
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    expect(png.length).toBeLessThan(300_000);
  });

  test("the pages nobody shares, the confirmation and the 404 page, carry no preview tags", async ({
    page,
  }) => {
    for (const route of ["/thanks/", "/404.html"]) {
      await page.goto(route);
      await expect(page.locator('meta[property^="og:"], meta[name^="twitter:"]')).toHaveCount(0);
    }
  });
});

for (const built of listPages("dist")) {
  test.describe(`decisions on ${built.route}`, () => {
    const html = readFileSync(built.file, "utf8");

    test("says nothing about AI or tools (D6), in the text, the title and the description", () => {
      const forbidden =
        /\bAI\b|\bA\.I\.|artificial intelligence|machine learning|generative|\bLLM\b|chatgpt|copilot|claude|midjourney|powered by/i;
      const text = html
        .replace(/<script[\s\S]*?<\/script>/g, " ")
        .replace(/<style[\s\S]*?<\/style>/g, " ")
        .replace(/<[^>]+>/g, " ");
      expect(text.match(forbidden)).toBeNull();
      const meta =
        html.match(/<meta[^>]+(?:name|property)="(?:description|og:[a-z]+)"[^>]*>/g) ?? [];
      expect(meta.join(" ").match(forbidden)).toBeNull();
    });

    test("shows no price, because every price is still a hypothesis", () => {
      const text = html.replace(/<[^>]+>/g, " ");
      expect(text.match(/€|\bEUR\b|\bDKK\b|\bkr\.?(?=\s|\d)|\$\s?\d|\bUSD\b/)).toBeNull();
    });

    test("has a title and a description of a useful length", () => {
      expect(html).toMatch(/<title>[^<]{10,}<\/title>/);
      expect(html).toMatch(/<meta name="description" content="[^"]{30,}"/);
    });
  });
}
