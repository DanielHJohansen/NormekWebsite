/**
 * The interim package for Simply.com (scripts/build-simply-package.mjs). The host runs Apache, so the headers of
 * public/_headers become .htaccess files, and the text that names Cloudflare, Turnstile and Resend is replaced.
 * A wrong .htaccess turns the whole site into an error page, so the tests pin its shape. They also fail when the
 * content changes under the replaced sentences, so the script is fixed here and not on the day Daniel uploads.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  DATA_BULLET,
  FORM_HELPER,
  PackageError,
  SKIPPED_HEADERS,
  astroHtaccess,
  buildSimplyPackage,
  isNoindexBuild,
  patchHome,
  patchPrivacy,
  replaceOnce,
  rootHtaccess,
  siteEmail,
} from "../../scripts/build-simply-package.mjs";
import { buildHeadersFile } from "../../scripts/lib/build-headers.mjs";
import { parseHeadersFile } from "../../scripts/lib/headers.mjs";

const SOURCE = readFileSync("public/_headers", "utf8");
const RULES = parseHeadersFile(SOURCE);
const NBSP = " ";
const EMAIL = "daniel@normek.dk";

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

function lines(htaccess: string): string[] {
  return htaccess
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
}

/** The home page as the build renders it: no-break spaces after one letter words, the email in a mailto link. */
function homeHtml(): string {
  const bullet = DATA_BULLET.replace(
    "that a visitor is a person",
    `that a${NBSP}visitor is a${NBSP}person`,
  );
  const helper = FORM_HELPER.replace("I use", `I${NBSP}use`);
  return `<main> <li>${bullet}</li> <p class="text-sm"> ${helper} </p> <a class="link" href="mailto:${EMAIL}">${EMAIL}</a> </main>`;
}

function privacyHtml(): string {
  return `<main> <section> <div> <h1 class="mb-4 text-3xl"> Privacy notice </h1> <p>Last updated</p> <div class="flex"> <p>Cloudflare and Resend process your data.</p> </div> </div> </section> </main>`;
}

function fakeDist(headers = SOURCE): string {
  const root = mkdtempSync(join(tmpdir(), "normek-simply-"));
  folders.push(root);
  const dist = join(root, "dist");
  const files: Record<string, string> = {
    "index.html": homeHtml(),
    "privacy/index.html": privacyHtml(),
    "404.html": "<main>Not found</main>",
    "_astro/site.abc123.css": "body{}",
    _headers: headers,
  };
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dist, name)), { recursive: true });
    writeFileSync(join(dist, name), text);
  }
  return dist;
}

describe("rootHtaccess", () => {
  const text = rootHtaccess(RULES);

  it("sends every header of the catch-all rule except the transport security header", () => {
    const everything = RULES.find((rule) => rule.pattern === "/*");
    expect(everything).toBeDefined();
    for (const [name, value] of everything?.headers ?? []) {
      const line = `Header always set ${name} "${value}"`;
      if (SKIPPED_HEADERS.has(name.toLowerCase())) expect(text).not.toContain(name);
      else expect(text, `missing ${name}`).toContain(line);
    }
    expect(text).not.toMatch(/strict-transport-security/i);
  });

  it("keeps the content security policy and the noindex header, which the preview depends on", () => {
    expect(text).toContain(`Header always set Content-Security-Policy "default-src 'none'; `);
    expect(text).toContain(`Header always set X-Robots-Tag "noindex, nofollow"`);
  });

  it("uses only directives a shared host is expected to allow, and every one of them inside an IfModule", () => {
    let depth = 0;
    for (const line of lines(text)) {
      if (/^<IfModule mod_[a-z_]+\.c>$/.test(line)) {
        depth += 1;
      } else if (line === "</IfModule>") {
        depth -= 1;
        expect(depth).toBeGreaterThanOrEqual(0);
      } else if (line.startsWith("ErrorDocument ")) {
        expect(line).toBe("ErrorDocument 404 /404.html");
        expect(depth, "ErrorDocument is a core directive").toBe(0);
      } else {
        expect(line, `unexpected directive: ${line}`).toMatch(/^(Header always set|AddType) /);
        expect(depth, `outside an IfModule: ${line}`).toBe(1);
      }
    }
    expect(depth).toBe(0);
  });

  it("serves the fonts, the SVG images and the manifest with the right types", () => {
    expect(text).toContain("AddType font/woff2 .woff2");
    expect(text).toContain("AddType image/svg+xml .svg");
    expect(text).toContain("AddType application/manifest+json .webmanifest");
  });

  it("has no line break inside a value, which Apache would read as a second directive", () => {
    for (const [name, value] of RULES.flatMap((rule) => rule.headers)) {
      expect(`${name}${value}`).not.toMatch(/[\r\n]/);
    }
  });

  it("refuses a headers file without a catch-all rule", () => {
    expect(() => rootHtaccess(parseHeadersFile("/_astro/*\n  Cache-Control: x\n"))).toThrow(
      /no \/\* rule/,
    );
  });

  it("refuses a value that Apache would expand (a percent sign), and escapes quotes", () => {
    const withPercent = parseHeadersFile("/*\n  X-Test: 100%\n");
    expect(() => rootHtaccess(withPercent)).toThrow(/percent/);
    const withQuote = parseHeadersFile('/*\n  X-Test: say "hi" \\ now\n');
    expect(rootHtaccess(withQuote)).toContain(
      String.raw`Header always set X-Test "say \"hi\" \\ now"`,
    );
  });
});

describe("astroHtaccess", () => {
  it("caches the hashed files for a year", () => {
    const text = astroHtaccess(RULES);
    expect(lines(text)).toEqual([
      "<IfModule mod_headers.c>",
      'Header set Cache-Control "public, max-age=31536000, immutable"',
      "</IfModule>",
    ]);
  });

  it("refuses a headers file without the cache rule", () => {
    expect(() => astroHtaccess(parseHeadersFile("/*\n  X-Test: 1\n"))).toThrow(/cache rule/);
  });
});

describe("isNoindexBuild", () => {
  it("accepts the preview headers", () => {
    expect(isNoindexBuild(RULES)).toBe(true);
  });

  it("rejects the launch headers, where the catch-all noindex is gone", () => {
    const launch = buildHeadersFile(SOURCE, { indexable: true });
    expect(isNoindexBuild(parseHeadersFile(launch))).toBe(false);
  });

  it("rejects a file with no rule at all", () => {
    expect(isNoindexBuild([])).toBe(false);
  });
});

describe("replaceOnce", () => {
  it("matches an ordinary space or a no-break space wherever the text has a space", () => {
    expect(replaceOnce("a b", "a b", "x", "t")).toBe("x");
    expect(replaceOnce(`a${NBSP}b`, "a b", "x", "t")).toBe("x");
  });

  it("fails when the text is missing or appears twice", () => {
    expect(() => replaceOnce("nothing here", "a b", "x", "the page")).toThrow(
      /exactly one match in the page, found 0/,
    );
    expect(() => replaceOnce("a b and a b", "a b", "x", "the page")).toThrow(/found 2/);
  });

  it("puts the new text in as it is, with no replacement patterns", () => {
    expect(replaceOnce("a b", "a b", "$& $1", "t")).toBe("$& $1");
  });

  it("matches text with regular expression characters literally", () => {
    expect(replaceOnce("price (1+1)? yes", "(1+1)?", "two", "t")).toBe("price two yes");
  });
});

describe("siteEmail", () => {
  it("reads the address from the first mailto link", () => {
    expect(siteEmail(homeHtml())).toBe(EMAIL);
    expect(siteEmail('<a href="mailto:hello@normek.dk?subject=x">hello@normek.dk</a>')).toBe(
      "hello@normek.dk",
    );
  });

  it("fails when there is no link, or the address could break out of the markup", () => {
    expect(() => siteEmail("<p>no link</p>")).toThrow(/mailto/);
    expect(() => siteEmail('<a href="mailto:a<b>@x.dk">x</a>')).toThrow(/mailto/);
  });
});

describe("patchHome", () => {
  it("says the form is off and no longer names the services behind it", () => {
    const html = patchHome(homeHtml(), EMAIL);
    expect(html).toContain("The contact form is not switched on yet.");
    expect(html).toContain(
      `The form is not switched on yet. Please email <a class="link" href="mailto:${EMAIL}">${EMAIL}</a> instead.`,
    );
    expect(html).not.toMatch(/cloudflare|turnstile|resend/i);
    expect(html).not.toContain("Processors and retention");
  });

  it("fails when the page text changed, so the script is fixed before anything is uploaded", () => {
    expect(() =>
      patchHome(homeHtml().replace("Resend delivers", "Postmark delivers"), EMAIL),
    ).toThrow(/data bullet/);
    expect(() =>
      patchHome(homeHtml().replace("Processors and retention", "Retention"), EMAIL),
    ).toThrow(/form helper/);
  });
});

describe("patchPrivacy", () => {
  it("replaces the body with the short notice and keeps the heading and the end of the page", () => {
    const html = patchPrivacy(privacyHtml(), EMAIL);
    expect(html).toContain("Privacy notice </h1>");
    expect(html).toContain("This is a preview of the site.");
    expect(html).toContain(`href="mailto:${EMAIL}"`);
    expect(html).not.toMatch(/cloudflare|resend|last updated/i);
    expect(html.endsWith("</div> </section> </main>")).toBe(true);
    // The tags stay balanced: the notice opens one div and closes it.
    const opened = html.match(/<div\b/g)?.length ?? 0;
    const closed = html.match(/<\/div>/g)?.length ?? 0;
    expect(opened).toBe(closed);
  });

  it("fails when the page has another structure", () => {
    expect(() => patchPrivacy("<main><h1>Privacy</h1></main>", EMAIL)).toThrow(/structure/);
    expect(() => patchPrivacy("</div> </section> </main> <h1>x</h1>", EMAIL)).toThrow(/structure/);
  });
});

describe("buildSimplyPackage", () => {
  it("writes a copy of the build with the headers as .htaccess files and the interim text", () => {
    const dist = fakeDist();
    const out = join(dirname(dist), "out");
    expect(buildSimplyPackage({ distDir: dist, outDir: out })).toEqual({ outDir: out });

    expect(existsSync(join(out, "_headers"))).toBe(false);
    expect(readFileSync(join(out, ".htaccess"), "utf8")).toBe(rootHtaccess(RULES));
    expect(readFileSync(join(out, "_astro", ".htaccess"), "utf8")).toBe(astroHtaccess(RULES));
    expect(readFileSync(join(out, "_astro", "site.abc123.css"), "utf8")).toBe("body{}");
    expect(readFileSync(join(out, "404.html"), "utf8")).toBe("<main>Not found</main>");
    expect(readFileSync(join(out, "index.html"), "utf8")).toContain(
      "The contact form is not switched on yet.",
    );
    expect(readFileSync(join(out, "privacy", "index.html"), "utf8")).toContain("This is a preview");
  });

  it("leaves the build itself as it was", () => {
    const dist = fakeDist();
    buildSimplyPackage({ distDir: dist, outDir: join(dirname(dist), "out") });
    expect(existsSync(join(dist, "_headers"))).toBe(true);
    expect(existsSync(join(dist, ".htaccess"))).toBe(false);
    expect(readFileSync(join(dist, "index.html"), "utf8")).toBe(homeHtml());
  });

  it("replaces an earlier package instead of mixing with it", () => {
    const dist = fakeDist();
    const out = join(dirname(dist), "out");
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "old-file.html"), "old");
    buildSimplyPackage({ distDir: dist, outDir: out });
    expect(existsSync(join(out, "old-file.html"))).toBe(false);
  });

  it("refuses a build that is open to search engines", () => {
    const dist = fakeDist(buildHeadersFile(SOURCE, { indexable: true }));
    const out = join(dirname(dist), "out");
    expect(() => buildSimplyPackage({ distDir: dist, outDir: out })).toThrow(PackageError);
    expect(() => buildSimplyPackage({ distDir: dist, outDir: out })).toThrow(
      /open to search engines/,
    );
    expect(existsSync(out)).toBe(false);
  });

  it("asks for a build when there is none", () => {
    const empty = mkdtempSync(join(tmpdir(), "normek-simply-"));
    folders.push(empty);
    expect(() =>
      buildSimplyPackage({ distDir: join(empty, "dist"), outDir: join(empty, "out") }),
    ).toThrow(/npm run build/);
  });
});

describe("the content under the replaced sentences", () => {
  it("still says what the script replaces", () => {
    const data = readFileSync("src/content/home/en/06-data.md", "utf8");
    expect(data).toContain(
      "**The form emails your message to me.** Cloudflare hosts this site and runs the Turnstile check that a visitor is a person. Resend delivers the email. Simply.com hosts my mailbox.",
    );
    const contact = readFileSync("src/content/home/en/08-contact.md", "utf8");
    expect(contact).toContain(
      "I use your details only to reply to this request. Processors and retention are in the [privacy notice](/privacy/).",
    );
  });
});
