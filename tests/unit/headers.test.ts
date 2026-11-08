import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  forLocalHttp,
  headersForPath,
  parseHeadersFile,
  patternToRegExp,
} from "../../scripts/lib/headers.mjs";

describe("the real public/_headers", () => {
  const rules = parseHeadersFile(readFileSync("public/_headers", "utf8"));

  it("has one rule for every path and one cache rule for the hashed files", () => {
    expect(rules.map((rule) => rule.pattern)).toEqual(["/*", "/_astro/*"]);
  });

  it("caches hashed files for a year and nothing else (G7)", () => {
    expect(headersForPath(rules, "/_astro/BaseLayout.DBFviziq.css")["Cache-Control"]).toBe(
      "public, max-age=31536000, immutable",
    );
    for (const path of ["/", "/privacy/", "/404.html", "/fonts/a.woff2", "/robots.txt"]) {
      expect(headersForPath(rules, path)["Cache-Control"], path).toBeUndefined();
    }
  });

  it("sends the security headers to pages, assets and the 404 alike", () => {
    for (const path of ["/", "/privacy/", "/404.html", "/_astro/site.css", "/robots.txt"]) {
      const headers = headersForPath(rules, path);
      expect(headers["Content-Security-Policy"]).toContain("default-src 'none'");
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["X-Frame-Options"]).toBe("DENY");
    }
  });

  it("keeps the CSP free of inline and data sources", () => {
    const csp = headersForPath(rules, "/")["Content-Security-Policy"] ?? "";
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|data:|blob:/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("img-src 'self'");
  });
});

describe("parseHeadersFile", () => {
  it("skips comments and blank lines and reads indented header lines", () => {
    const rules = parseHeadersFile("# comment\n\n/a/*\n  X-One: 1\n  X-Two: a: b\n");
    expect(rules).toEqual([
      {
        pattern: "/a/*",
        headers: [
          ["X-One", "1"],
          ["X-Two", "a: b"],
        ],
      },
    ]);
  });

  it("skips rules for full URLs, because a local server has one host", () => {
    const rules = parseHeadersFile(
      "https://x.pages.dev/*\n  X-Robots-Tag: noindex\n/*\n  X-A: 1\n",
    );
    expect(rules.map((rule) => rule.pattern)).toEqual(["/*"]);
  });

  it("refuses a header line that comes before any path", () => {
    expect(() => parseHeadersFile("  X-One: 1\n")).toThrow(/before any path/);
  });
});

describe("matching", () => {
  it("handles splats and placeholders", () => {
    expect(patternToRegExp("/_astro/*").test("/_astro/a.css")).toBe(true);
    expect(patternToRegExp("/_astro/*").test("/other/a.css")).toBe(false);
    expect(patternToRegExp("/:slug/").test("/privacy/")).toBe(true);
    expect(patternToRegExp("/:slug/").test("/a/b/")).toBe(false);
    expect(patternToRegExp("/a.b").test("/axb")).toBe(false);
  });

  it("joins the values of one header from several matching rules", () => {
    const rules = parseHeadersFile("/*\n  X-A: one\n/p/*\n  X-A: two\n");
    expect(headersForPath(rules, "/p/x")).toEqual({ "X-A": "one, two" });
    expect(headersForPath(rules, "/q/x")).toEqual({ "X-A": "one" });
  });
});

describe("forLocalHttp", () => {
  const headers = {
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; upgrade-insecure-requests",
    "Strict-Transport-Security": "max-age=31536000",
    "X-Content-Type-Options": "nosniff",
  };

  it("drops only upgrade-insecure-requests from the CSP and keeps every other directive", () => {
    expect(forLocalHttp(headers)["Content-Security-Policy"]).toBe(
      "default-src 'none'; script-src 'self'",
    );
  });

  it("drops HSTS, which browsers ignore over http, and keeps the rest", () => {
    const out = forLocalHttp(headers);
    expect(out["Strict-Transport-Security"]).toBeUndefined();
    expect(out["X-Content-Type-Options"]).toBe("nosniff");
  });
});
