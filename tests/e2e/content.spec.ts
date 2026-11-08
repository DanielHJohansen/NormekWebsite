/**
 * Content to page: what the files in src/content turn into in the built site. It checks the mapping (the sections
 * and anchors, the header links, the stages, the steps, the form labels) and two decisions that must hold on every
 * page: no AI or tools wording (decision D6 of 8 November 2026) and no price (every price is a hypothesis).
 * The strings themselves belong to the copy file, so most checks count and order things and leave the wording alone.
 */
import { readFileSync } from "node:fs";
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
