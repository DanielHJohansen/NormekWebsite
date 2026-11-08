import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ALLOWED_INLINE_SCRIPT_TYPES,
  ALWAYS_NOINDEX_ROUTES,
  checkDist,
  readTags,
} from "../../scripts/check-dist.mjs";

// The real headers file, so these tests also fail if public/_headers drifts from the checker's rules.
const REAL_HEADERS = readFileSync("public/_headers", "utf8");

type Overrides = Record<string, string | null>;

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

interface PageOptions {
  body?: string;
  head?: string;
  robots?: string | null;
}

/** A page in the shape the real build produces. */
function html({ body = "", head = "", robots = "noindex, nofollow" }: PageOptions = {}): string {
  const robotsTag = robots === null ? "" : `<meta name="robots" content="${robots}">`;
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Page</title>${robotsTag}` +
    `<link rel="stylesheet" href="/_astro/site.css">${head}</head>` +
    `<body><a href="#main">Skip</a><header><a href="/">Home</a><a href="/#contact">Contact</a></header>` +
    `<main id="main"><h1>Page</h1><section id="contact"><h2>Contact</h2></section>${body}</main>` +
    `<footer><a href="/privacy/">Privacy</a></footer></body></html>`
  );
}

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>';

const sitemap = (...paths: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
  paths.map((p) => `<url><loc>https://www.normek.dk${p}</loc></url>`).join("") +
  `</urlset>`;

const front = (lines: string[]) => `---\n${lines.join("\n")}\n---\n\nBody.\n`;

/** A small but complete production build plus its content, and a way to change it. */
function baseFiles(): Overrides {
  return {
    "dist/index.html": html(),
    "dist/404.html": html(),
    "dist/privacy/index.html": html(),
    "dist/_astro/site.css": "a{color:red}",
    "dist/_astro/logo.svg": SVG,
    "dist/sitemap.xml": sitemap("/", "/privacy/"),
    "dist/robots.txt": "User-agent: *\nDisallow: /\n",
    "dist/_headers": REAL_HEADERS,
    "content/home/en/01-hero.md": front(["id: top", "order: 10", "kind: hero", "draft: false"]),
    "content/home/en/02-situations.md": front([
      "id: situations",
      "order: 20",
      "kind: text",
      "draft: true",
    ]),
    "content/pages/en/privacy.md": front(["title: Privacy", "draft: false"]),
    "content/pages/en/enclosure-design.md": front(["title: Enclosure design", "draft: true"]),
    "content/work/en/example.md": front(["title: Example", "clearance: none", "draft: true"]),
  };
}

function makeSite(overrides: Overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "normek-check-"));
  roots.push(root);
  const files = { ...baseFiles(), ...overrides };
  for (const [path, text] of Object.entries(files)) {
    if (text === null) continue;
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
  }
  return { distDir: join(root, "dist"), contentDir: join(root, "content") };
}

type Options = Parameters<typeof checkDist>[0];
const run = (overrides: Overrides = {}, options: Options = {}) =>
  checkDist({ ...makeSite(overrides), ...options });
const rules = (result: ReturnType<typeof checkDist>) =>
  [...new Set(result.problems.map((p) => p.rule))].sort();

/**
 * The launch flip: pages drop noindex, robots opens, and _headers loses the catch-all noindex.
 * The 404 page keeps its noindex tag, as /thanks/ does.
 */
const LAUNCH: Overrides = {
  "dist/index.html": html({ robots: null }),
  "dist/404.html": html(),
  "dist/privacy/index.html": html({ robots: null }),
  "dist/robots.txt": "User-agent: *\nAllow: /\n\nSitemap: https://www.normek.dk/sitemap.xml\n",
  "dist/_headers": REAL_HEADERS.replace(/^\s*X-Robots-Tag:.*\n?/m, ""),
};

describe("a clean production build", () => {
  it("has no problems", () => {
    const result = run();
    expect(result.problems).toEqual([]);
    expect(result.summary[0]).toMatch(/Mode: production\. 3 page\(s\)/);
  });

  it("the real public/_headers passes the header rules", () => {
    expect(run().problems.filter((p) => p.rule === "headers")).toEqual([]);
  });
});

describe("structure", () => {
  it("fails with a clear message when dist is empty", () => {
    const result = run({ "dist/index.html": null });
    expect(rules(result)).toEqual(["structure"]);
    expect(result.problems[0]?.message).toMatch(/npm run build/);
  });

  it("fails when a required file is missing", () => {
    for (const file of ["404.html", "sitemap.xml", "robots.txt", "_headers"]) {
      expect(rules(run({ [`dist/${file}`]: null }))).toContain("structure");
    }
  });
});

describe("drafts stay out of production", () => {
  it("fails when a draft page was built", () => {
    const result = run({ "dist/enclosure-design/index.html": html() });
    expect(rules(result)).toContain("draft-route");
    expect(result.problems.find((p) => p.rule === "draft-route")?.where).toBe("/enclosure-design/");
  });

  it("fails when sitemap.xml lists a draft URL", () => {
    const result = run({ "dist/sitemap.xml": sitemap("/", "/privacy/", "/enclosure-design/") });
    expect(rules(result)).toEqual(["draft-sitemap"]);
  });

  it("fails when any page links to a draft", () => {
    const result = run({
      "dist/index.html": html({ body: '<a href="/enclosure-design/">More</a>' }),
    });
    expect(rules(result)).toEqual(["draft-link"]);
  });

  it("catches an absolute link to a draft on the canonical origin", () => {
    const body = '<a href="https://www.normek.dk/enclosure-design/">More</a>';
    expect(rules(run({ "dist/index.html": html({ body }) }))).toEqual(["draft-link"]);
  });

  it("catches a link to a draft route even without the trailing slash", () => {
    const body = '<a href="/enclosure-design">More</a>';
    expect(rules(run({ "dist/index.html": html({ body }) }))).toContain("link");
  });

  it("fails when a draft home section is in the page, and when a link points at its anchor", () => {
    const section = run({
      "dist/index.html": html({ body: '<section id="situations"><h2>S</h2></section>' }),
    });
    expect(rules(section)).toEqual(["draft-section"]);
    const link = run({ "dist/index.html": html({ body: '<a href="#situations">S</a>' }) });
    expect(rules(link)).toEqual(["draft-link"]);
    const navLink = run({ "dist/index.html": html({ body: '<a href="/#situations">S</a>' }) });
    expect(rules(navLink)).toEqual(["draft-link"]);
  });

  it("fails on any draft marker in the output", () => {
    for (const marker of ["data-draft", "data-draft-banner", "data-draft-badge"]) {
      const result = run({ "dist/index.html": html({ body: `<p ${marker}="true">Draft</p>` }) });
      expect(rules(result)).toContain("draft-marker");
    }
  });

  it("has no /work/ index while no case study is published", () => {
    const result = run({ "dist/work/index.html": html() });
    expect(rules(result)).toEqual(["draft-route"]);
    expect(result.problems[0]?.where).toBe("/work/");
  });

  it("allows /work/ once a case study is published with written clearance", () => {
    const published = front(["title: Example", "clearance: written", "draft: false"]);
    const result = run({
      "content/work/en/example.md": published,
      "dist/work/index.html": html(),
      "dist/work/example/index.html": html(),
      "dist/sitemap.xml": sitemap("/", "/privacy/", "/work/", "/work/example/"),
    });
    expect(result.problems).toEqual([]);
  });

  it("fails a published case study without written clearance, whatever the schema says", () => {
    const pending = front(["title: Example", "clearance: pending", "draft: false"]);
    expect(
      rules(run({ "content/work/en/example.md": pending, "dist/work/index.html": html() })),
    ).toContain("work-clearance");
  });

  it("treats a missing or odd draft flag as a draft", () => {
    for (const lines of [["title: P"], ["title: P", "draft: yes"], ["title: P", "draft:"]]) {
      const result = run({ "content/pages/en/privacy.md": front(lines) });
      expect(rules(result)).toContain("draft-route");
    }
  });

  it("does not mistake a nested key for the draft flag", () => {
    const text = front(["title: P", "draft: true", "items:", "  - draft: false"]);
    expect(rules(run({ "content/pages/en/privacy.md": text }))).toContain("draft-route");
  });

  it("maps a page in another language under its prefix", () => {
    const result = run({
      "content/pages/da/privatliv.md": front(["title: Privatliv", "draft: true"]),
      "dist/da/privatliv/index.html": html(),
    });
    expect(result.problems.find((p) => p.rule === "draft-route")?.where).toBe("/da/privatliv/");
  });
});

describe("the private preview with drafts shown", () => {
  const withDrafts: Overrides = {
    "dist/enclosure-design/index.html": html({ body: "<p data-draft-banner>Draft</p>" }),
    "dist/sitemap.xml": sitemap("/", "/privacy/", "/enclosure-design/"),
  };

  it("expects drafts, as long as each one carries the banner", () => {
    expect(run(withDrafts, { showDrafts: true }).problems).toEqual([]);
  });

  it("fails a draft page that has no banner", () => {
    const result = run(
      { ...withDrafts, "dist/enclosure-design/index.html": html() },
      { showDrafts: true },
    );
    expect(rules(result)).toEqual(["draft-marker"]);
  });

  it("is refused together with launch mode", () => {
    expect(rules(run(LAUNCH, { showDrafts: true, launch: true }))).toContain("mode");
  });
});

describe("no inline code in the output (security requirement)", () => {
  const cases: Array<[string, string, string]> = [
    ["a script without src", "<script>alert(1)</script>", "inline-script"],
    ["an uppercase script tag", "<SCRIPT>alert(1)</SCRIPT>", "inline-script"],
    [
      "a module script without src",
      '<script type="module">import "/x.js"</script>',
      "inline-script",
    ],
    [
      "JSON-LD, until security-engineer allows it",
      '<script type="application/ld+json">{}</script>',
      "inline-script",
    ],
    ["a javascript: link", '<a href="javascript:void(0)">x</a>', "inline-script"],
    ["a style element", "<style>a{color:red}</style>", "inline-style"],
    ["a style element in an inline svg", "<svg><style>a{}</style></svg>", "inline-style"],
    ["a style attribute", '<p style="color:red">x</p>', "inline-style"],
    ["a single quoted style attribute", "<p STYLE='color:red'>x</p>", "inline-style"],
    ["an unquoted style attribute", "<p style=color:red>x</p>", "inline-style"],
    ["an onclick handler", '<button onclick="go()">x</button>', "inline-handler"],
    ["a mixed case handler", '<button onClick="go()">x</button>', "inline-handler"],
    ["an uppercase handler", '<body ONLOAD="go()"></body>', "inline-handler"],
    ["an unquoted handler", "<button onclick=go()>x</button>", "inline-handler"],
    [
      "a handler after a > inside another attribute",
      '<a title="a>b" onclick="go()" href="/">x</a>',
      "inline-handler",
    ],
    [
      "a handler on its own line",
      '<div\n  class="x"\n  onmouseover="go()">x</div>',
      "inline-handler",
    ],
    [
      "an error handler on an image",
      '<img src="/_astro/logo.svg" alt="" onerror="go()">',
      "inline-handler",
    ],
  ];

  it.each(cases)("fails on %s", (_name, body, rule) => {
    const result = run({ "dist/index.html": html({ body }) });
    expect(rules(result)).toContain(rule);
  });

  it("allows an external script file and a stylesheet link", () => {
    const result = run({
      "dist/_astro/app.js": "console.log(1)",
      "dist/index.html": html({ head: '<script type="module" src="/_astro/app.js"></script>' }),
    });
    expect(result.problems).toEqual([]);
  });

  it("ignores code inside an HTML comment, which the browser never runs", () => {
    const result = run({ "dist/index.html": html({ body: "<!-- <script>alert(1)</script> -->" }) });
    expect(result.problems).toEqual([]);
  });

  it("also checks SVG files", () => {
    const script = run({
      "dist/_astro/logo.svg": '<svg xmlns="http://www.w3.org/2000/svg"><script>x()</script></svg>',
    });
    expect(rules(script)).toContain("inline-script");
    const handler = run({
      "dist/_astro/logo.svg": '<svg xmlns="http://www.w3.org/2000/svg" onload="x()"></svg>',
    });
    expect(rules(handler)).toContain("inline-handler");
    const style = run({
      "dist/_astro/logo.svg": '<svg xmlns="http://www.w3.org/2000/svg"><style>a{}</style></svg>',
    });
    expect(rules(style)).toContain("inline-style");
  });

  it("keeps the list of allowed inline script types empty", () => {
    expect(ALLOWED_INLINE_SCRIPT_TYPES).toEqual([]);
  });
});

describe("noindex until launch", () => {
  it("fails a page without the robots meta tag", () => {
    expect(rules(run({ "dist/privacy/index.html": html({ robots: null }) }))).toEqual(["noindex"]);
  });

  it("fails a robots meta tag that does not say noindex", () => {
    expect(rules(run({ "dist/privacy/index.html": html({ robots: "index, follow" }) }))).toEqual([
      "noindex",
    ]);
  });

  it("fails when robots.txt allows crawling or does not disallow everything", () => {
    expect(rules(run({ "dist/robots.txt": "User-agent: *\nAllow: /\n" }))).toEqual(["noindex"]);
    expect(rules(run({ "dist/robots.txt": "User-agent: *\nDisallow: /private/\n" }))).toEqual([
      "noindex",
    ]);
  });
});

describe("links and assets", () => {
  it("fails a link to a page that is not in the build", () => {
    const result = run({ "dist/index.html": html({ body: '<a href="/missing/">x</a>' }) });
    expect(rules(result)).toEqual(["link"]);
  });

  it("fails an internal link without a trailing slash", () => {
    const result = run({ "dist/index.html": html({ body: '<a href="/privacy">x</a>' }) });
    expect(rules(result)).toEqual(["link"]);
  });

  it("fails a fragment that no element has", () => {
    const result = run({
      "dist/index.html": html({ body: '<a href="/#nowhere">x</a><a href="#also-nowhere">y</a>' }),
    });
    expect(result.problems.filter((p) => p.rule === "link")).toHaveLength(2);
  });

  it("accepts #top and fragments that exist", () => {
    const result = run({
      "dist/index.html": html({
        body: '<a href="#top">x</a><a href="/#contact">y</a><a href="#main">z</a>',
      }),
    });
    expect(result.problems).toEqual([]);
  });

  it("fails an asset that is not in the build, also inside srcset", () => {
    const missing = run({
      "dist/index.html": html({ body: '<img src="/_astro/gone.png" alt="">' }),
    });
    expect(rules(missing)).toEqual(["link"]);
    const srcset = run({
      "dist/index.html": html({
        body: '<img srcset="/_astro/logo.svg 1x, /_astro/gone.svg 2x" alt="">',
      }),
    });
    expect(srcset.problems.filter((p) => p.rule === "link")).toHaveLength(1);
  });

  it("leaves the contact endpoint, mail links and the canonical link alone", () => {
    const body =
      '<form action="/api/contact" method="post"></form><a href="mailto:a@b.dk">m</a><a href="tel:+4500000000">t</a>';
    const head = '<link rel="canonical" href="https://www.normek.dk/">';
    expect(run({ "dist/index.html": html({ body, head }) }).problems).toEqual([]);
  });

  it("checks an absolute link to the site's own origin like an internal link", () => {
    const ok = run({
      "dist/index.html": html({ body: '<a href="https://www.normek.dk/privacy/">p</a>' }),
    });
    expect(ok.problems).toEqual([]);
    const broken = run({
      "dist/index.html": html({ body: '<a href="https://www.normek.dk/nope/">p</a>' }),
    });
    expect(rules(broken)).toEqual(["link"]);
  });

  it("fails a resource from an origin the CSP does not allow", () => {
    const head = '<script src="https://cdn.example.com/lib.js"></script>';
    expect(rules(run({ "dist/index.html": html({ head }) }))).toEqual(["third-party"]);
    const image = run({
      "dist/index.html": html({ body: '<img src="https://images.example.com/a.png" alt="">' }),
    });
    expect(rules(image)).toEqual(["third-party"]);
  });

  it("allows the Turnstile script, because the CSP names it, and plain links to other sites", () => {
    const head =
      '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async></script>';
    const body = '<a href="https://www.linkedin.com/in/someone/">LinkedIn</a>';
    expect(run({ "dist/index.html": html({ head, body }) }).problems).toEqual([]);
  });
});

describe("_headers", () => {
  const withCsp = (csp: string) =>
    REAL_HEADERS.replace(/Content-Security-Policy:.*/, `Content-Security-Policy: ${csp}`);

  it("fails a CSP with unsafe-inline, unsafe-eval or data:", () => {
    for (const bad of ["'unsafe-inline'", "'unsafe-eval'", "data:"]) {
      const csp = `default-src 'none'; img-src 'self' ${bad}; frame-ancestors 'none'`;
      expect(rules(run({ "dist/_headers": withCsp(csp) }))).toEqual(["headers"]);
    }
  });

  it("fails a CSP without frame-ancestors none", () => {
    expect(rules(run({ "dist/_headers": withCsp("default-src 'none'") }))).toEqual(["headers"]);
  });

  it("fails when the CSP, nosniff, referrer policy or permissions policy is missing", () => {
    for (const name of [
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
    ]) {
      const text = REAL_HEADERS.split("\n")
        .filter((line) => !line.trim().startsWith(`${name}:`))
        .join("\n");
      expect(rules(run({ "dist/_headers": text }))).toContain("headers");
    }
  });
});

describe("launch mode (PUBLIC_INDEXABLE=true)", () => {
  const launch = (overrides: Overrides = {}) => run({ ...LAUNCH, ...overrides }, { launch: true });

  it("passes a clean build that has been flipped for launch", () => {
    expect(launch().problems).toEqual([]);
  });

  it("fails on [TO CONFIRM] anywhere in the output", () => {
    const result = launch({
      "dist/index.html": html({ robots: null, body: "<p>Price: [TO CONFIRM]</p>" }),
    });
    expect(rules(result)).toEqual(["launch-placeholder"]);
  });

  it("fails on [TARGET markers", () => {
    const result = launch({
      "dist/privacy/index.html": html({ robots: null, body: "<p>[TARGET: 2 weeks]</p>" }),
    });
    expect(rules(result)).toEqual(["launch-placeholder"]);
  });

  it("fails on an origin that is not on the allowed list, in a link or in the CSS", () => {
    const anchor = launch({
      "dist/index.html": html({ robots: null, body: '<a href="https://example.com/x/">x</a>' }),
    });
    expect(rules(anchor)).toEqual(["launch-origin"]);
    const css = launch({
      "dist/_astro/site.css": "@font-face{src:url(https://fonts.example.org/a.woff2)}",
    });
    expect(rules(css)).toEqual(
      ["launch-origin", "third-party"].filter((r) => rules(css).includes(r)),
    );
    expect(rules(css)).toContain("launch-origin");
  });

  it("allows the site itself, Turnstile and XML namespaces", () => {
    const head = '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>';
    const body =
      '<a href="https://www.normek.dk/privacy/">p</a><svg xmlns="http://www.w3.org/2000/svg"></svg>';
    expect(launch({ "dist/index.html": html({ robots: null, head, body }) }).problems).toEqual([]);
  });

  it("ignores a URL in a CSS comment, like the license line Tailwind writes", () => {
    const css = "/*! tailwindcss v4.3.5 | MIT License | https://tailwindcss.com */a{color:red}";
    expect(launch({ "dist/_astro/site.css": css }).problems).toEqual([]);
  });

  it("fails when a page still says noindex", () => {
    expect(rules(launch({ "dist/privacy/index.html": html() }))).toEqual(["noindex"]);
  });

  it("fails when robots.txt still disallows everything or names no sitemap", () => {
    expect(rules(launch({ "dist/robots.txt": "User-agent: *\nDisallow: /\n" }))).toEqual([
      "noindex",
    ]);
    expect(rules(launch({ "dist/robots.txt": "User-agent: *\nAllow: /\n" }))).toEqual(["noindex"]);
  });

  it("fails when _headers still sends noindex for every path", () => {
    const result = launch({ "dist/_headers": REAL_HEADERS });
    expect(rules(result)).toEqual(["noindex"]);
    expect(result.problems[0]?.where).toBe("_headers");
  });

  it("does not read the web addresses inside licence texts", () => {
    const licence = "See http://scripts.sil.org/OFL and https://github.com/x/y for details.";
    expect(launch({ "dist/fonts/OFL-barlow.txt": licence }).problems).toEqual([]);
  });

  it("still looks for placeholders in a licence text", () => {
    const result = launch({ "dist/fonts/OFL-barlow.txt": "Copyright [TO CONFIRM]" });
    expect(rules(result)).toEqual(["launch-placeholder"]);
  });

  it("still reads the web addresses in other text files", () => {
    expect(rules(launch({ "dist/notes.txt": "see https://example.com/" }))).toEqual([
      "launch-origin",
    ]);
  });

  it("allows noindex on host rules, which is how the pages.dev hosts keep it at launch", () => {
    const hostRules = `${LAUNCH["dist/_headers"]}\nhttps://normek-web.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\n`;
    expect(launch({ "dist/_headers": hostRules }).problems).toEqual([]);
  });
});

describe("pages that stay out of search", () => {
  const thanks = (robots: string | null = "noindex, nofollow") => ({
    "dist/thanks/index.html": html({ robots }),
  });
  const launch = (overrides: Overrides = {}) => run({ ...LAUNCH, ...overrides }, { launch: true });

  it("lists exactly the confirmation page and the error page", () => {
    expect([...ALWAYS_NOINDEX_ROUTES]).toEqual(["/thanks/", "/404.html"]);
  });

  it("passes a production build that has a thanks page", () => {
    expect(run(thanks()).problems).toEqual([]);
  });

  it("keeps noindex on /thanks/ and the 404 page at launch, and passes", () => {
    expect(launch(thanks()).problems).toEqual([]);
  });

  it("fails at launch when /thanks/ lost its noindex tag", () => {
    const result = launch(thanks(null));
    expect(rules(result)).toEqual(["noindex"]);
    expect(result.problems[0]?.where).toBe("thanks/index.html");
    expect(result.problems[0]?.message).toMatch(/must keep noindex/);
  });

  it("fails at launch when the 404 page lost its noindex tag", () => {
    const result = launch({ "dist/404.html": html({ robots: null }) });
    expect(rules(result)).toEqual(["noindex"]);
    expect(result.problems[0]?.where).toBe("404.html");
  });

  it("still fails at launch for any other page that says noindex", () => {
    expect(rules(launch({ ...thanks(), "dist/privacy/index.html": html() }))).toEqual(["noindex"]);
  });

  it("fails when the sitemap lists /thanks/", () => {
    const result = run({
      ...thanks(),
      "dist/sitemap.xml": sitemap("/", "/privacy/", "/thanks/"),
    });
    expect(rules(result)).toEqual(["private-page"]);
    expect(result.problems[0]?.where).toBe("sitemap.xml");
  });

  it("fails when a page links to /thanks/, in production and at launch", () => {
    const body = '<a href="/thanks/">Done</a>';
    expect(rules(run({ ...thanks(), "dist/index.html": html({ body }) }))).toEqual([
      "private-page",
    ]);
    expect(rules(launch({ ...thanks(), "dist/index.html": html({ robots: null, body }) }))).toEqual(
      ["private-page"],
    );
  });

  it("catches an absolute link to /thanks/ on the canonical origin", () => {
    const body = '<a href="https://www.normek.dk/thanks/">Done</a>';
    expect(rules(run({ ...thanks(), "dist/index.html": html({ body }) }))).toEqual([
      "private-page",
    ]);
  });

  it("does not count the form's data attribute or its action as a link", () => {
    const body =
      '<form method="post" action="/api/contact" data-thanks="/thanks/"><button>Send</button></form>';
    expect(run({ ...thanks(), "dist/index.html": html({ body }) }).problems).toEqual([]);
  });
});

describe("readTags", () => {
  it("reads names and attributes in any case and quoting", () => {
    const tags = readTags(`<A HREF="/x/" Class='a b' data-x=1 hidden>`);
    expect(tags).toHaveLength(1);
    expect(tags[0]?.name).toBe("a");
    expect(tags[0]?.attrs.get("href")).toBe("/x/");
    expect(tags[0]?.attrs.get("class")).toBe("a b");
    expect(tags[0]?.attrs.get("data-x")).toBe("1");
    expect(tags[0]?.attrs.get("hidden")).toBe("");
  });

  it("keeps a > inside a quoted value from ending the tag", () => {
    const tags = readTags(`<a title="1>2" onclick="x()">`);
    expect(tags[0]?.attrs.has("onclick")).toBe(true);
  });

  it("skips comments", () => {
    expect(readTags("<!-- <a href='/x/'> --><b>")).toHaveLength(1);
  });
});
