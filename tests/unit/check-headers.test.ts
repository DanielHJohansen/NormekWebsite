/**
 * The guard on dist/_headers (security gate G1, S8 and G7). The file is compared with a fixed description, so every
 * way the gate report found to loosen it has a fixture here, and each one must fail.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildHeadersFile } from "../../scripts/lib/build-headers.mjs";
import {
  EXPECTED_CACHE_RULES,
  EXPECTED_CSP,
  EXPECTED_HEADERS,
  checkHeadersFile,
  cspProblems,
  parseCsp,
} from "../../scripts/lib/check-headers.mjs";
import { readHeadersStrict } from "../../scripts/lib/headers.mjs";

const REAL = readFileSync("public/_headers", "utf8");
const LAUNCH_FILE = buildHeadersFile(REAL, { indexable: true });

const messages = (text: string, launch = false) =>
  checkHeadersFile(text, { launch }).map((finding) => finding.message);
const rulesOf = (text: string, launch = false) => [
  ...new Set(checkHeadersFile(text, { launch }).map((finding) => finding.rule)),
];

/** The real file with one line changed, or removed when the replacement is null. */
function edit(text: string, pattern: RegExp, replacement: string | null): string {
  expect(text, "the pattern must match the real file").toMatch(pattern);
  return text.replace(pattern, replacement ?? "").replace(/\n\n+/g, "\n");
}

describe("the real files", () => {
  it("passes in the preview shape", () => {
    expect(checkHeadersFile(REAL)).toEqual([]);
  });

  it("passes in the launch shape the build writes", () => {
    expect(checkHeadersFile(LAUNCH_FILE, { launch: true })).toEqual([]);
  });

  it("does not pass in the other shape", () => {
    expect(checkHeadersFile(REAL, { launch: true }).length).toBeGreaterThan(0);
    expect(checkHeadersFile(LAUNCH_FILE).length).toBeGreaterThan(0);
  });

  it("describes the same policy as the file, directive for directive", () => {
    const csp = /Content-Security-Policy: (.*)/.exec(REAL)?.[1] ?? "";
    const { directives } = parseCsp(csp);
    expect([...directives.keys()].sort()).toEqual(Object.keys(EXPECTED_CSP).sort());
    for (const [name, sources] of directives) {
      expect([...sources].sort(), name).toEqual([...(EXPECTED_CSP[name] ?? [])].sort());
    }
  });

  it("holds the cache rule for hashed files", () => {
    expect(EXPECTED_CACHE_RULES).toEqual({ "/_astro/*": "public, max-age=31536000, immutable" });
    expect(REAL).toContain("/_astro/*\n  Cache-Control: public, max-age=31536000, immutable");
  });
});

describe("a loosened Content-Security-Policy fails (G1)", () => {
  const withCsp = (change: (csp: string) => string) =>
    REAL.replace(
      /(Content-Security-Policy: )(.*)/,
      (_all, label: string, csp: string) => `${label}${change(csp)}`,
    );

  const loosened: Array<[string, (csp: string) => string]> = [
    [
      "an extra host in script-src",
      (csp) => csp.replace("script-src 'self'", "script-src 'self' https://cdn.example"),
    ],
    ["script-src *", (csp) => csp.replace(/script-src [^;]*/, "script-src *")],
    ["script-src https:", (csp) => csp.replace(/script-src [^;]*/, "script-src https:")],
    ["blob: in script-src", (csp) => csp.replace("script-src 'self'", "script-src 'self' blob:")],
    [
      "'unsafe-hashes' in script-src",
      (csp) => csp.replace("script-src 'self'", "script-src 'self' 'unsafe-hashes'"),
    ],
    [
      "'unsafe-inline' in script-src",
      (csp) => csp.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"),
    ],
    [
      "'unsafe-eval' in script-src",
      (csp) => csp.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'"),
    ],
    [
      "Turnstile in connect-src",
      (csp) =>
        csp.replace("connect-src 'self'", "connect-src 'self' https://challenges.cloudflare.com"),
    ],
    [
      "a second host in frame-src",
      (csp) =>
        csp.replace(
          "frame-src https://challenges.cloudflare.com",
          "frame-src https://challenges.cloudflare.com https://www.youtube.com",
        ),
    ],
    [
      "a second frame-ancestors host",
      (csp) => csp.replace("frame-ancestors 'none'", "frame-ancestors 'none' https://evil.example"),
    ],
    [
      "frame-ancestors 'self'",
      (csp) => csp.replace("frame-ancestors 'none'", "frame-ancestors 'self'"),
    ],
    ["default-src removed", (csp) => csp.replace("default-src 'none'; ", "")],
    ["default-src 'self'", (csp) => csp.replace("default-src 'none'", "default-src 'self'")],
    ["base-uri removed", (csp) => csp.replace("base-uri 'none'; ", "")],
    ["object-src removed", (csp) => csp.replace("object-src 'none'; ", "")],
    ["form-action removed", (csp) => csp.replace("form-action 'self'; ", "")],
    [
      "form-action to another host",
      (csp) => csp.replace("form-action 'self'", "form-action 'self' https://evil.example"),
    ],
    [
      "style-src with unsafe-inline",
      (csp) => csp.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'"),
    ],
    ["img-src with data:", (csp) => csp.replace("img-src 'self'", "img-src 'self' data:")],
    [
      "img-src with a host",
      (csp) => csp.replace("img-src 'self'", "img-src 'self' https://images.example"),
    ],
    [
      "font-src with a host",
      (csp) => csp.replace("font-src 'self'", "font-src 'self' https://fonts.gstatic.com"),
    ],
    ["upgrade-insecure-requests removed", (csp) => csp.replace("; upgrade-insecure-requests", "")],
    ["a directive that is not expected", (csp) => `${csp}; worker-src 'self'`],
    ["script-src-elem added", (csp) => `${csp}; script-src-elem *`],
    ["a directive repeated", (csp) => `${csp}; script-src *`],
    ["an empty policy", () => ""],
  ];

  for (const [name, change] of loosened) {
    it(`fails ${name}`, () => {
      const text = withCsp(change);
      expect(messages(text).length, name).toBeGreaterThan(0);
      expect(rulesOf(text), name).toContain("headers");
    });
  }

  it("fails the same changes in the launch shape", () => {
    const text = LAUNCH_FILE.replace("script-src 'self'", "script-src 'self' https://cdn.example");
    expect(rulesOf(text, true)).toContain("headers");
  });

  it("compares sources as a set, so a reordered list is not a change", () => {
    const text = withCsp((csp) =>
      csp.replace(
        "script-src 'self' https://challenges.cloudflare.com",
        "script-src https://challenges.cloudflare.com 'self'",
      ),
    );
    expect(checkHeadersFile(text)).toEqual([]);
  });

  it("names the directive and the values it found", () => {
    const [first] = messages(
      withCsp((csp) => csp.replace("script-src 'self'", "script-src 'self' https://cdn.example")),
    );
    expect(first).toContain("script-src");
    expect(first).toContain("https://cdn.example");
  });
});

describe("another header changed or removed fails (G1)", () => {
  const cases: Array<[string, RegExp, string | null]> = [
    ["Strict-Transport-Security removed", /^\s+Strict-Transport-Security:.*\n/m, null],
    ["Strict-Transport-Security max-age 0", /max-age=31536000; includeSubDomains/, "max-age=0"],
    ["Strict-Transport-Security without subdomains", /; includeSubDomains/, ""],
    ["X-Content-Type-Options removed", /^\s+X-Content-Type-Options:.*\n/m, null],
    [
      "X-Content-Type-Options changed",
      /X-Content-Type-Options: nosniff/,
      "X-Content-Type-Options: sniff",
    ],
    ["X-Frame-Options removed", /^\s+X-Frame-Options:.*\n/m, null],
    ["X-Frame-Options SAMEORIGIN", /X-Frame-Options: DENY/, "X-Frame-Options: SAMEORIGIN"],
    ["Referrer-Policy unsafe-url", /Referrer-Policy: same-origin/, "Referrer-Policy: unsafe-url"],
    ["Referrer-Policy removed", /^\s+Referrer-Policy:.*\n/m, null],
    ["Permissions-Policy removed", /^\s+Permissions-Policy:.*\n/m, null],
    ["Permissions-Policy loosened", /camera=\(\)/, "camera=*"],
    ["Cross-Origin-Opener-Policy removed", /^\s+Cross-Origin-Opener-Policy:.*\n/m, null],
    [
      "Cross-Origin-Opener-Policy unsafe-none",
      /Cross-Origin-Opener-Policy: same-origin/,
      "Cross-Origin-Opener-Policy: unsafe-none",
    ],
    ["Cross-Origin-Resource-Policy removed", /^\s+Cross-Origin-Resource-Policy:.*\n/m, null],
    [
      "Cross-Origin-Resource-Policy cross-origin",
      /Cross-Origin-Resource-Policy: same-origin/,
      "Cross-Origin-Resource-Policy: cross-origin",
    ],
  ];
  for (const [name, pattern, replacement] of cases) {
    it(`fails ${name}`, () => {
      const text = edit(REAL, pattern, replacement);
      expect(rulesOf(text), name).toEqual(["headers"]);
    });
  }

  it("fails an extra header on every page, such as a CORS header", () => {
    const text = REAL.replace("  X-Robots-Tag", "  Access-Control-Allow-Origin: *\n  X-Robots-Tag");
    expect(messages(text).join(" ")).toContain("access-control-allow-origin");
  });

  it("fails a Cache-Control on every page, which only the hashed files may have", () => {
    const text = REAL.replace(
      "  X-Robots-Tag",
      "  Cache-Control: public, max-age=31536000\n  X-Robots-Tag",
    );
    expect(rulesOf(text)).toEqual(["headers"]);
  });

  it("fails a header set twice, because Cloudflare would join the values", () => {
    const text = REAL.replace(
      "  X-Content-Type-Options: nosniff",
      "  X-Content-Type-Options: nosniff\n  X-Content-Type-Options: nosniff",
    );
    expect(messages(text).join(" ")).toContain("2 times");
  });

  it("fails a second Content-Security-Policy line", () => {
    const text = REAL.replace(
      "  Strict-Transport-Security",
      "  Content-Security-Policy: default-src *\n  Strict-Transport-Security",
    );
    expect(messages(text).join(" ")).toContain("content-security-policy 2 times");
  });

  it("compares header names without regard to case", () => {
    const text = REAL.replace("X-Content-Type-Options: nosniff", "x-content-type-options: nosniff");
    expect(checkHeadersFile(text)).toEqual([]);
  });
});

describe("X-Robots-Tag until launch (G1)", () => {
  it("must be noindex, nofollow in the preview shape", () => {
    for (const [name, pattern, replacement] of [
      ["removed", /^\s+X-Robots-Tag:.*\n/m, null],
      ["all", /X-Robots-Tag: noindex, nofollow/, "X-Robots-Tag: all"],
      ["noindex only", /X-Robots-Tag: noindex, nofollow/, "X-Robots-Tag: noindex"],
    ] as const) {
      const text = edit(REAL, pattern, replacement);
      expect(rulesOf(text), name).toEqual(["noindex"]);
    }
  });

  it("must not be on every page in the launch shape", () => {
    const text = LAUNCH_FILE.replace(
      "  Cross-Origin-Resource-Policy: same-origin",
      "  Cross-Origin-Resource-Policy: same-origin\n  X-Robots-Tag: noindex, nofollow",
    );
    expect(rulesOf(text, true)).toEqual(["noindex"]);
  });

  it("needs both pages.dev host rules in the launch shape, exactly once", () => {
    const one = LAUNCH_FILE.replace(
      /https:\/\/:version\.:project\.pages\.dev\/\*\n {2}X-Robots-Tag: noindex, nofollow\n/,
      "",
    );
    expect(rulesOf(one, true)).toEqual(["noindex"]);
    const twice = `${LAUNCH_FILE}https://:project.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\n`;
    expect(messages(twice, true).join(" ")).toContain("Found 2");
  });

  it("lets a host rule set only X-Robots-Tag with the exact value", () => {
    const text = LAUNCH_FILE.replace(
      /(https:\/\/:project\.pages\.dev\/\*\n {2}X-Robots-Tag: noindex, nofollow)/,
      "$1\n  Content-Security-Policy: default-src *",
    );
    expect(rulesOf(text, true)).toContain("headers");
    const weak = LAUNCH_FILE.replace(
      /(https:\/\/:project\.pages\.dev\/\*\n {2}X-Robots-Tag: )noindex, nofollow/,
      "$1none",
    );
    expect(rulesOf(weak, true)).toContain("headers");
  });

  it("does not accept a host rule in the preview shape, where the global noindex does the work", () => {
    expect(
      rulesOf(`${REAL}https://:project.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\n`),
    ).toEqual(["headers"]);
  });
});

describe("other rules fail unless they only set the cache header (G1)", () => {
  it("fails a /privacy/* rule that detaches the CSP", () => {
    const text = `${REAL}/privacy/*\n  ! Content-Security-Policy\n`;
    expect(messages(text).join(" ")).toContain("detaches Content-Security-Policy");
  });

  it("fails a detach line anywhere, also in the catch-all", () => {
    const text = REAL.replace("  X-Robots-Tag", "  ! X-Frame-Options\n  X-Robots-Tag");
    expect(messages(text).join(" ")).toContain("detaches X-Frame-Options");
  });

  it("fails a /privacy/* rule that sets its own CSP", () => {
    const text = `${REAL}/privacy/*\n  Content-Security-Policy: default-src *\n`;
    expect(rulesOf(text)).toEqual(["headers"]);
  });

  it("fails any rule for another path, even with a harmless header", () => {
    for (const pattern of ["/privacy/*", "/api/*", "/*.js", "/fonts/*", "/_astro/*.js"]) {
      const text = `${REAL}${pattern}\n  Cache-Control: no-store\n`;
      expect(messages(text).join(" "), pattern).toContain(`The rule ${pattern} is not expected`);
    }
  });

  it("fails a /_astro/* rule with another value, another header or a second header", () => {
    const base = "/_astro/*\n  Cache-Control: public, max-age=31536000, immutable";
    expect(rulesOf(REAL.replace(base, "/_astro/*\n  Cache-Control: no-store"))).toEqual([
      "headers",
    ]);
    expect(rulesOf(REAL.replace(base, "/_astro/*\n  X-Frame-Options: ALLOWALL"))).toEqual([
      "headers",
    ]);
    expect(rulesOf(REAL.replace(base, `${base}\n  Access-Control-Allow-Origin: *`))).toEqual([
      "headers",
    ]);
  });

  it("fails when the /_astro/* rule is missing", () => {
    const text = REAL.replace(/# Every file[^\n]*\n\/_astro\/\*\n {2}Cache-Control:[^\n]*\n/, "");
    expect(messages(text).join(" ")).toContain("The rule /_astro/* is missing");
  });

  it("fails a second /* rule and a missing /* rule", () => {
    expect(messages(`${REAL}/*\n  X-Robots-Tag: none\n`).join(" ")).toContain(
      "exactly one /* rule",
    );
    expect(
      messages("/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n").join(" "),
    ).toContain("exactly one /* rule");
  });
});

describe("lines that make no sense fail instead of being skipped", () => {
  it("fails a header line before any path, and a line that is not Name: value", () => {
    expect(messages(`  X-One: 1\n${REAL}`).join(" ")).toContain("before any path rule");
    expect(
      messages(REAL.replace("  X-Frame-Options: DENY", "  X-Frame-Options DENY")).join(" "),
    ).toContain('is not "Name: value"');
  });

  it("fails an empty file", () => {
    expect(checkHeadersFile("").length).toBeGreaterThan(0);
  });
});

describe("parseCsp and cspProblems", () => {
  it("reads directives and sources, and reports a repeat", () => {
    const { directives, repeated } = parseCsp(
      "default-src 'none'; script-src 'self' https://a.example; script-src *;  ",
    );
    expect(directives.get("script-src")).toEqual(["'self'", "https://a.example"]);
    expect(repeated).toEqual(["script-src"]);
  });

  it("passes the expected policy rebuilt from the description", () => {
    const text = Object.entries(EXPECTED_CSP)
      .map(([name, sources]) => [name, ...sources].join(" "))
      .join("; ");
    expect(cspProblems(text)).toEqual([]);
  });

  it("describes every other header the file sends", () => {
    for (const [name, value] of Object.entries(EXPECTED_HEADERS)) {
      expect(REAL.toLowerCase(), name).toContain(`${name}: ${value}`.toLowerCase());
    }
  });
});

describe("readHeadersStrict", () => {
  it("keeps host rules and detach lines, which the local reader skips", () => {
    const { rules, problems } = readHeadersStrict(
      "# c\nhttps://x.pages.dev/*\n  X-Robots-Tag: noindex\n/a/*\n  ! X-Frame-Options\n  X-One: a: b\n",
    );
    expect(problems).toEqual([]);
    expect(rules.map((rule) => rule.pattern)).toEqual(["https://x.pages.dev/*", "/a/*"]);
    expect(rules[1]).toMatchObject({ detach: ["X-Frame-Options"], headers: [["X-One", "a: b"]] });
  });

  it("reads Windows line endings", () => {
    expect(readHeadersStrict("/*\r\n  A: 1\r\n").rules[0]?.headers).toEqual([["A", "1"]]);
  });
});
