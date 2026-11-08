import { describe, expect, it } from "vitest";
import { pageNav, sectionNav } from "../../src/lib/nav";
import {
  RESERVED_SLUGS,
  homePath,
  pagePath,
  splitId,
  workIndexPath,
  workPath,
} from "../../src/lib/routes";
import { escapeXml, renderSitemap, robotsTxt } from "../../src/lib/sitemap";

describe("routes", () => {
  it("splits a collection id into locale and slug", () => {
    expect(splitId("en/privacy")).toEqual({ locale: "en", slug: "privacy" });
    expect(splitId("en/guides/enclosures")).toEqual({ locale: "en", slug: "guides/enclosures" });
  });

  it("refuses an id with no locale folder", () => {
    expect(() => splitId("privacy")).toThrow(/<locale>\/<slug>/);
    expect(() => splitId("")).toThrow();
  });

  it("puts English at the root and every other language under its prefix, with trailing slashes", () => {
    expect(homePath("en")).toBe("/");
    expect(pagePath("en", "privacy")).toBe("/privacy/");
    expect(workIndexPath("en")).toBe("/work/");
    expect(workPath("en", "pb10")).toBe("/work/pb10/");
    expect(homePath("da")).toBe("/da/");
    expect(pagePath("da", "privatliv")).toBe("/da/privatliv/");
    expect(workPath("da", "pb10")).toBe("/da/work/pb10/");
  });

  it("reserves the slugs that other routes own", () => {
    for (const slug of ["404", "api", "work", "sitemap.xml", "robots.txt"]) {
      expect(RESERVED_SLUGS).toContain(slug);
    }
  });
});

describe("header navigation", () => {
  const section = (id: string, order: number, navLabel?: string) => ({
    data: { id, order, navLabel },
  });

  it("lists sections that set navLabel, in section order, as anchors on the home page", () => {
    const links = sectionNav(
      [
        section("files", 50, "Data and IP"),
        section("top", 10),
        section("process", 30, "How we work"),
      ],
      "en",
    );
    expect(links).toEqual([
      { label: "How we work", href: "/#process" },
      { label: "Data and IP", href: "/#files" },
    ]);
  });

  it("has no link for a section that is not in the build", () => {
    // Entries are filtered with isPublished() before they reach this function, so a draft section is absent.
    const links = sectionNav([section("process", 30, "How we work")], "en");
    expect(links.some((link) => link.href.includes("situations"))).toBe(false);
  });

  it("anchors on the language home page for other languages", () => {
    expect(sectionNav([section("process", 30, "Sådan arbejder vi")], "da")).toEqual([
      { label: "Sådan arbejder vi", href: "/da/#process" },
    ]);
  });
});

describe("footer navigation", () => {
  const config = [
    { label: "Privacy", slug: "privacy" },
    { label: "Terms", slug: "terms" },
  ];

  it("links to pages that are in the build", () => {
    expect(pageNav(config, [{ id: "en/privacy" }], "en")).toEqual([
      { label: "Privacy", href: "/privacy/" },
    ]);
  });

  it("drops the link when the page is a draft and so not in the build", () => {
    expect(pageNav(config, [], "en")).toEqual([]);
    expect(pageNav(config, [{ id: "en/terms" }], "en")).toEqual([
      { label: "Terms", href: "/terms/" },
    ]);
  });

  it("does not link to a page that exists only in another language", () => {
    expect(pageNav(config, [{ id: "da/privacy" }], "en")).toEqual([]);
  });
});

describe("sitemap", () => {
  it("writes absolute URLs for exactly the entries it is given", () => {
    const xml = renderSitemap("https://www.normek.dk", [{ path: "/" }, { path: "/privacy/" }]);
    expect(xml).toContain("<loc>https://www.normek.dk/</loc>");
    expect(xml).toContain("<loc>https://www.normek.dk/privacy/</loc>");
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  it("adds lastmod as a plain date when there is one", () => {
    const xml = renderSitemap("https://www.normek.dk", [
      { path: "/privacy/", lastmod: new Date("2026-11-08T13:00:00Z") },
      { path: "/", lastmod: undefined },
    ]);
    expect(xml).toContain("<lastmod>2026-11-08</lastmod>");
    expect(xml.match(/<lastmod>/g)).toHaveLength(1);
  });

  it("escapes characters that are special in XML", () => {
    expect(escapeXml(`a&b<c>"d"'e'`)).toBe("a&amp;b&lt;c&gt;&quot;d&quot;&apos;e&apos;");
    const xml = renderSitemap("https://www.normek.dk", [{ path: "/a&b/" }]);
    expect(xml).toContain("a&amp;b");
  });
});

describe("robots.txt", () => {
  it("keeps every crawler out until launch", () => {
    const text = robotsTxt({ indexable: false, origin: "https://www.normek.dk" });
    expect(text).toBe("User-agent: *\nDisallow: /\n");
    expect(text).not.toMatch(/Allow/);
    expect(text).not.toMatch(/Sitemap/);
  });

  it("opens the site and names the sitemap in launch mode", () => {
    const text = robotsTxt({ indexable: true, origin: "https://www.normek.dk" });
    expect(text).toContain("Allow: /");
    expect(text).not.toMatch(/Disallow: \/\s*$/m);
    expect(text).toContain("Sitemap: https://www.normek.dk/sitemap.xml");
  });
});
