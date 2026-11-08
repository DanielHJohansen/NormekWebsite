/**
 * dist/_headers is written when the build is done (security gate G2, review S8). A preview build copies
 * public/_headers. A launch build (PUBLIC_INDEXABLE=true) drops the global noindex and adds the pages.dev host rules.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  NOINDEX,
  PAGES_DEV_HOST_RULES,
  buildHeadersFile,
  headersIntegration,
} from "../../scripts/lib/build-headers.mjs";
import { checkHeadersFile } from "../../scripts/lib/check-headers.mjs";
import { readHeadersStrict } from "../../scripts/lib/headers.mjs";

const SOURCE = readFileSync("public/_headers", "utf8");
const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe("buildHeadersFile", () => {
  it("returns the preview file untouched when the build is not indexable", () => {
    expect(buildHeadersFile(SOURCE, { indexable: false })).toBe(SOURCE);
  });

  it("drops the global X-Robots-Tag at launch and changes nothing else in the /* rule", () => {
    const launch = readHeadersStrict(buildHeadersFile(SOURCE, { indexable: true })).rules;
    const preview = readHeadersStrict(SOURCE).rules;
    const catchAll = (rules: typeof preview) => rules.find((rule) => rule.pattern === "/*");
    expect(catchAll(launch)?.headers.map(([name]) => name)).not.toContain("X-Robots-Tag");
    expect(catchAll(launch)?.headers).toEqual(
      (catchAll(preview)?.headers ?? []).filter(([name]) => name !== "X-Robots-Tag"),
    );
  });

  it("adds the two pages.dev host rules with the same noindex value as the preview", () => {
    const rules = readHeadersStrict(buildHeadersFile(SOURCE, { indexable: true })).rules;
    expect(PAGES_DEV_HOST_RULES).toEqual([
      "https://:project.pages.dev/*",
      "https://:version.:project.pages.dev/*",
    ]);
    for (const pattern of PAGES_DEV_HOST_RULES) {
      expect(rules.find((rule) => rule.pattern === pattern)?.headers).toEqual([
        ["X-Robots-Tag", NOINDEX],
      ]);
    }
    expect(NOINDEX).toBe("noindex, nofollow");
  });

  it("keeps the cache rule and every comment line that is not about the robots header", () => {
    const launch = buildHeadersFile(SOURCE, { indexable: true });
    expect(launch).toContain("/_astro/*\n  Cache-Control: public, max-age=31536000, immutable");
    expect(launch).toContain("# Normek security headers.");
  });

  it("ends in one newline and has no line with trailing space", () => {
    const launch = buildHeadersFile(SOURCE, { indexable: true });
    expect(launch.endsWith("\n")).toBe(true);
    expect(launch.endsWith("\n\n")).toBe(false);
    expect(launch).not.toMatch(/ +\n/);
  });

  it("removes X-Robots-Tag only from the /* rule, not from another rule", () => {
    const source =
      "/*\n  X-Robots-Tag: noindex, nofollow\n  A: 1\n/other/*\n  X-Robots-Tag: custom\n";
    const out = buildHeadersFile(source, { indexable: true });
    expect(out).toContain("/other/*\n  X-Robots-Tag: custom");
    expect(out.split("\n").filter((line) => line.includes("noindex, nofollow"))).toHaveLength(2);
  });

  it("writes a launch file that the check accepts, and a preview file that the check accepts", () => {
    expect(checkHeadersFile(buildHeadersFile(SOURCE, { indexable: false }))).toEqual([]);
    expect(
      checkHeadersFile(buildHeadersFile(SOURCE, { indexable: true }), { launch: true }),
    ).toEqual([]);
  });
});

describe("headersIntegration", () => {
  const build = async (indexable: boolean): Promise<string> => {
    const folder = mkdtempSync(join(tmpdir(), "normek-headers-"));
    folders.push(folder);
    const integration = headersIntegration({
      source: pathToFileURL(join(process.cwd(), "public", "_headers")),
      indexable,
    });
    expect(integration.name).toBe("normek-headers");
    const hook = integration.hooks["astro:build:done"];
    expect(hook).toBeTypeOf("function");
    // Astro passes the output folder as a URL.
    await (hook as unknown as (options: { dir: URL }) => Promise<void> | void)({
      dir: pathToFileURL(`${folder}/`),
    });
    return readFileSync(join(folder, "_headers"), "utf8");
  };

  it("writes a byte copy of public/_headers for a preview build", async () => {
    expect(await build(false)).toBe(SOURCE);
  });

  it("writes the launch variant for a launch build", async () => {
    const written = await build(true);
    expect(written).toBe(buildHeadersFile(SOURCE, { indexable: true }));
    expect(checkHeadersFile(written, { launch: true })).toEqual([]);
    expect(written).not.toBe(SOURCE);
  });

  it("is what astro.config.mjs registers, with the real source file and the PUBLIC_INDEXABLE flag", () => {
    const config = readFileSync("astro.config.mjs", "utf8");
    expect(config).toContain("headersIntegration");
    expect(config).toContain('new URL("./public/_headers", import.meta.url)');
    expect(config).toContain("flag(process.env.PUBLIC_INDEXABLE)");
  });
});
