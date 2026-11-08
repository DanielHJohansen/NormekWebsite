// Writes dist/_headers from public/_headers, once per build (review S8, gate G2).
//
// Cloudflare Pages reads _headers from the build output. public/_headers is the preview's file, and it names
// X-Robots-Tag: noindex for every path. At launch (PUBLIC_INDEXABLE=true) www.normek.dk must not send that header,
// and the *.pages.dev addresses still must, so that no copy of the site is indexed under another name. The
// project address and every commit-hash or branch address are matched by the two host rules below (patterns from
// Cloudflare's Pages documentation, "Headers", and Appendix A of docs/ops/cloudflare-and-resend-setup.md).
//
//   PUBLIC_INDEXABLE unset:  dist/_headers is a byte copy of public/_headers.
//   PUBLIC_INDEXABLE=true:   the X-Robots-Tag line of the /* rule is dropped, and the two host rules are added.
//
// scripts/lib/check-headers.mjs knows both shapes, and check-dist validates the one that was built.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** The value that keeps a page out of search. The same one the preview sends. */
export const NOINDEX = "noindex, nofollow";

/** The hosts Cloudflare gives a Pages project, as _headers host patterns. */
export const PAGES_DEV_HOST_RULES = [
  "https://:project.pages.dev/*",
  "https://:version.:project.pages.dev/*",
];

/**
 * @param {string} source the text of public/_headers
 * @param {{ indexable: boolean }} options
 * @returns {string}
 */
export function buildHeadersFile(source, { indexable }) {
  if (!indexable) return source;
  /** Only the X-Robots-Tag line inside the catch-all rule goes. */
  let inCatchAll = false;
  const kept = source.split("\n").filter((line) => {
    if (line.trim() === "" || line.trim().startsWith("#")) return true;
    if (!/^\s/.test(line)) {
      inCatchAll = line.trim() === "/*";
      return true;
    }
    return !(inCatchAll && /^\s*x-robots-tag\s*:/i.test(line));
  });
  const body = kept.join("\n").replace(/\s+$/, "\n");
  const hostRules = PAGES_DEV_HOST_RULES.map(
    (pattern) => `${pattern}\n  X-Robots-Tag: ${NOINDEX}\n`,
  ).join("");
  return (
    `${body}\n` +
    "# Launch build (PUBLIC_INDEXABLE=true): the project and preview addresses on pages.dev stay out of search.\n" +
    hostRules
  );
}

/**
 * An Astro integration that writes dist/_headers when the build is done.
 * @param {{ source: URL, indexable: boolean }} options
 * @returns {import("astro").AstroIntegration}
 */
export function headersIntegration({ source, indexable }) {
  return {
    name: "normek-headers",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const target = fileURLToPath(new URL("_headers", dir));
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, buildHeadersFile(readFileSync(source, "utf8"), { indexable }));
      },
    },
  };
}
