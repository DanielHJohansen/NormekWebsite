#!/usr/bin/env node
// Guards on the built site in dist/. Run it after `npm run build`.
//
//   npm run check:dist                      production build of the private preview (the default)
//   PUBLIC_INDEXABLE=true npm run check:dist   launch mode, stricter (see below)
//   SHOW_DRAFTS=true npm run check:dist        build made for the preview environment, drafts are expected
//
// Sources: docs/plan/work-breakdown.md section 4 (drafts, launch mode) and
// docs/security/threat-model-and-requirements.md section 2 (no inline code, headers).
//
// Always checked
//   - Drafts: no draft route in dist/, no draft URL in sitemap.xml, no link to a draft, no draft marker.
//     Drafts are read from the front matter in src/content. Only an explicit `draft: false` publishes.
//   - Inline code: no <script> without src, no <style> element, no style= attribute, no on*= handler.
//   - Noindex: every page says noindex and robots.txt disallows everything (until PUBLIC_INDEXABLE).
//   - Private pages: /thanks/ and the 404 page stay out of the sitemap, and no page links to /thanks/.
//   - Links: every internal link and asset resolves to a file, and every #fragment to an id.
//   - Resources load only from origins the Content-Security-Policy allows.
//   - Headers: _headers has a CSP without unsafe-inline, unsafe-eval or data:, frame-ancestors 'none',
//     nosniff, a referrer policy and a permissions policy.
// Launch mode adds
//   - No "[TO CONFIRM" or "[TARGET" anywhere in the output.
//   - No absolute URL outside the allowed origins.
//   - No noindex in any page except /thanks/ and the 404 page (they must keep it), robots.txt open,
//     and no catch-all X-Robots-Tag noindex in _headers.
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { listPages, walk } from "./lib/dist.mjs";
import { checkHeadersFile } from "./lib/check-headers.mjs";

/** The site itself. Absolute links to these origins count as internal links. */
export const SITE_ORIGINS = ["https://www.normek.dk", "https://normek.dk"];

/**
 * Third-party origins the built site may mention in launch mode. Add one only with a reason and an ADR
 * (plan section 6: only challenges.cloudflare.com, loaded when the form comes into view).
 */
export const ALLOWED_THIRD_PARTY = ["https://challenges.cloudflare.com"];

/**
 * Pages that stay out of search after launch: the confirmation page after a send and the error page.
 * They keep their noindex tag in launch mode, they are never in sitemap.xml, and no page links to them.
 * The form sends the visitor to /thanks/ from a script. A list here is stricter than reading the content,
 * because a stray `noindex: true` on the home page must not pass as a choice.
 */
export const ALWAYS_NOINDEX_ROUTES = ["/thanks/", "/404.html"];

/** Licence texts quote web addresses that are never requested. They are still checked for placeholders. */
const LICENCE_TEXT = /(^|\/)(OFL|LICENSE|LICENCE|COPYING|NOTICE)[^/]*\.txt$/i;

/** Namespace identifiers. They look like URLs but nothing is ever fetched from them. */
const NAMESPACE_ORIGINS = ["http://www.w3.org", "https://www.w3.org", "http://www.sitemaps.org"];

/**
 * Types of inline <script> that may stay. Empty on purpose: the security requirement is "no <script>
 * without src". JSON-LD (application/ld+json) is not executed, but it is still such an element,
 * so it needs a decision from security-engineer before it is added here.
 */
export const ALLOWED_INLINE_SCRIPT_TYPES = [];

/** Paths served by Pages Functions. They are not files in dist/. */
const FUNCTION_PREFIXES = ["/api/"];

const LAUNCH_BLOCKERS = ["[TO CONFIRM", "[TARGET"];
const TEXT_EXTENSIONS = [
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".svg",
  ".xml",
  ".txt",
  ".json",
  ".webmanifest",
];

/**
 * @typedef {{ rule: string, where: string, message: string }} Problem
 * @typedef {{
 *   distDir?: string,
 *   contentDir?: string,
 *   launch?: boolean,
 *   showDrafts?: boolean,
 *   defaultLocale?: string,
 *   extraOrigins?: string[],
 * }} Options
 */

// ---------------------------------------------------------------------------------------------
// Reading HTML. The pages come from Astro and are regular, so a small tokenizer is enough.

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/**
 * @param {string} html
 * @returns {Array<{ name: string, attrs: Map<string, string> }>}
 */
export function readTags(html) {
  const text = html.replace(/<!--[\s\S]*?-->/g, "");
  const tags = [];
  for (const match of text.matchAll(TAG_RE)) {
    const name = (match[1] ?? "").toLowerCase();
    /** @type {Map<string, string>} */
    const attrs = new Map();
    for (const attr of (match[2] ?? "").matchAll(ATTR_RE)) {
      const key = (attr[1] ?? "").toLowerCase();
      if (key) attrs.set(key, attr[2] ?? attr[3] ?? attr[4] ?? "");
    }
    tags.push({ name, attrs });
  }
  return tags;
}

/** @param {string} value */
function srcsetUrls(value) {
  return value
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0] ?? "")
    .filter(Boolean);
}

/**
 * URLs a tag asks the browser to follow or load.
 * @param {{ name: string, attrs: Map<string, string> }} tag
 * @returns {Array<{ url: string, kind: "link" | "resource" }>}
 */
function urlsOf(tag) {
  const out = [];
  const { name, attrs } = tag;
  const href = attrs.get("href");
  const src = attrs.get("src");
  if (name === "a" || name === "area") {
    if (href !== undefined) out.push({ url: href, kind: /** @type {const} */ ("link") });
  } else if (name === "link") {
    const rel = (attrs.get("rel") ?? "").toLowerCase();
    // canonical and alternate name a page, not a resource the browser loads
    if (href !== undefined && !/\b(canonical|alternate)\b/.test(rel)) {
      out.push({ url: href, kind: /** @type {const} */ ("resource") });
    }
  } else if (
    ["script", "img", "source", "iframe", "audio", "video", "track", "embed"].includes(name)
  ) {
    if (src !== undefined) out.push({ url: src, kind: /** @type {const} */ ("resource") });
  }
  const srcset = attrs.get("srcset");
  if (srcset !== undefined) {
    for (const url of srcsetUrls(srcset))
      out.push({ url, kind: /** @type {const} */ ("resource") });
  }
  const action = attrs.get("action");
  if (name === "form" && action !== undefined)
    out.push({ url: action, kind: /** @type {const} */ ("resource") });
  // A button can send its form somewhere else with formaction. It is checked like the action of a form.
  const formaction = attrs.get("formaction");
  if ((name === "button" || name === "input") && formaction !== undefined)
    out.push({ url: formaction, kind: /** @type {const} */ ("resource") });
  return out;
}

/**
 * Every address a stylesheet asks the browser for: url(...) and @import. Comments are removed first, because the
 * banner Tailwind writes into the file holds a web address that nothing requests.
 * @param {string} css
 * @returns {string[]}
 */
export function cssUrls(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  /** @type {string[]} */
  const out = [];
  for (const match of text.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi)) {
    out.push((match[1] ?? match[2] ?? match[3] ?? "").trim());
  }
  for (const match of text.matchAll(/@import\s+(?:"([^"]*)"|'([^']*)')/gi)) {
    out.push((match[1] ?? match[2] ?? "").trim());
  }
  return out.filter((url) => url !== "" && !url.startsWith("#"));
}

// ---------------------------------------------------------------------------------------------
// Reading the content to find drafts.

/** @param {string} value */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** @param {string} text */
function frontMatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return match?.[1] ?? "";
}

/**
 * Top-level scalar from a front matter block. Indented keys belong to nested objects and are skipped.
 * @param {string} block
 * @param {string} key
 */
function frontMatterValue(block, key) {
  const match = new RegExp(`^${escapeRegExp(key)}:[ \\t]*(.*?)[ \\t]*$`, "m").exec(block);
  if (!match) return undefined;
  return (match[1] ?? "").replace(/\s+#.*$/, "").replace(/^["']|["']$/g, "");
}

/**
 * Entries of the content collections that are not published, and the routes or ids they would produce.
 * @param {string} contentDir
 * @param {string} defaultLocale
 */
export function readContentState(contentDir, defaultLocale = "en") {
  /** @type {Array<{ source: string, route: string }>} */
  const draftRoutes = [];
  /** @type {Array<{ source: string, id: string }>} */
  const draftSections = [];
  /** @type {Array<{ source: string, clearance: string | undefined }>} */
  const publishedWork = [];
  let visibleWorkEntries = 0;

  const prefix = (/** @type {string} */ locale) => (locale === defaultLocale ? "" : `/${locale}`);

  for (const collection of ["pages", "work", "home"]) {
    const root = join(contentDir, collection);
    if (!existsSync(root)) continue;
    for (const file of walk(root).filter((f) => f.endsWith(".md"))) {
      const rel = relative(root, file).split(sep);
      const locale = rel[0] ?? defaultLocale;
      const slug = rel.slice(1).join("/").replace(/\.md$/, "").toLowerCase();
      const block = frontMatter(readFileSync(file, "utf8"));
      const draft = frontMatterValue(block, "draft") !== "false";
      const source = relative(contentDir, file).split(sep).join("/");

      if (collection === "pages" && draft)
        draftRoutes.push({ source, route: `${prefix(locale)}/${slug}/` });
      if (collection === "work") {
        if (draft) draftRoutes.push({ source, route: `${prefix(locale)}/work/${slug}/` });
        else {
          visibleWorkEntries++;
          publishedWork.push({ source, clearance: frontMatterValue(block, "clearance") });
        }
      }
      if (collection === "home" && draft) {
        const id = frontMatterValue(block, "id");
        if (id) draftSections.push({ source, id });
      }
    }
  }
  // With no published case study there is no /work/ index either.
  if (visibleWorkEntries === 0 && existsSync(join(contentDir, "work"))) {
    draftRoutes.push({
      source: "src/content/work (no published entry)",
      route: `${prefix(defaultLocale)}/work/`,
    });
  }
  return { draftRoutes, draftSections, publishedWork };
}

// ---------------------------------------------------------------------------------------------

/** @param {string} value */
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** @param {string} path */
function readText(path) {
  return readFileSync(path, "utf8");
}

/** @param {string} text @param {number} index */
function snippet(text, index) {
  return text
    .slice(Math.max(0, index - 20), index + 60)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Maps a URL path to the file that serves it, or undefined when nothing does.
 * @param {string} distDir
 * @param {string} pathname
 */
function fileFor(distDir, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  const clean = decoded.replace(/^\/+/, "");
  if (clean === "" || clean.endsWith("/")) {
    const file = join(distDir, clean, "index.html");
    return existsSync(file) ? file : undefined;
  }
  const direct = join(distDir, clean);
  return existsSync(direct) && statSync(direct).isFile() ? direct : undefined;
}

/**
 * @param {Options} options
 * @returns {{ problems: Problem[], summary: string[] }}
 */
export function checkDist(options = {}) {
  const distDir = options.distDir ?? "dist";
  const contentDir = options.contentDir ?? "src/content";
  const launch = options.launch ?? false;
  const showDrafts = options.showDrafts ?? false;
  const defaultLocale = options.defaultLocale ?? "en";
  /** @type {Problem[]} */
  const problems = [];
  /** @type {string[]} */
  const summary = [];
  /** @param {string} rule @param {string} where @param {string} message */
  const fail = (rule, where, message) => problems.push({ rule, where, message });

  if (launch && showDrafts) {
    fail(
      "mode",
      "environment",
      "PUBLIC_INDEXABLE=true and SHOW_DRAFTS=true together would publish drafts. Unset one.",
    );
  }
  if (!existsSync(join(distDir, "index.html"))) {
    fail("structure", distDir, "dist/index.html is missing. Run `npm run build` first.");
    return { problems, summary };
  }
  for (const required of ["404.html", "sitemap.xml", "robots.txt", "_headers"]) {
    if (!existsSync(join(distDir, required)))
      fail("structure", `${distDir}/${required}`, "File is missing from the build.");
  }

  const pages = listPages(distDir);
  const files = walk(distDir);
  const rel = (/** @type {string} */ file) => relative(distDir, file).split(sep).join("/");
  const content = readContentState(contentDir, defaultLocale);
  const siteOrigins = [...SITE_ORIGINS, ...(options.extraOrigins ?? [])];

  // ---- headers file --------------------------------------------------------------------------
  // Compared with a fixed description of what may ship (scripts/lib/check-headers.mjs), not with a list of what must
  // not. The launch build writes its own variant (scripts/lib/build-headers.mjs), and launch mode checks that one.
  const headersPath = join(distDir, "_headers");
  if (existsSync(headersPath)) {
    for (const finding of checkHeadersFile(readText(headersPath), { launch })) {
      fail(finding.rule, "_headers", finding.message);
    }
  }

  // ---- every HTML and SVG file: inline code, draft markers, noindex, links -------------------
  /** @type {Array<{ from: string, url: string, kind: "link" | "resource" }>} */
  const references = [];
  /** @type {Map<string, Set<string>>} */
  const idsByRoute = new Map();
  /** @type {Array<{ route: string, sitekey: string | null }>} */
  const contactForms = [];

  for (const file of files.filter((f) => f.endsWith(".html") || f.endsWith(".svg"))) {
    const where = rel(file);
    const isHtml = file.endsWith(".html");
    const text = readText(file);
    const tags = readTags(text);
    const route = isHtml ? (pages.find((p) => p.file === file)?.route ?? `/${where}`) : `/${where}`;

    // A comment in the HTML is a note to whoever opens the source. The build strips them, so one that is left came
    // from a template and may say more than it should (security gate G3).
    if (isHtml && text.includes("<!--"))
      fail(
        "html-comment",
        where,
        `Contains an HTML comment: "${snippet(text, text.indexOf("<!--"))}". Move the note into the front matter of the component.`,
      );

    // Security requirement: Astro must emit no inline code, so the strict CSP needs no hashes.
    for (const tag of tags) {
      if (tag.name === "script" && !tag.attrs.has("src")) {
        const type = (tag.attrs.get("type") ?? "").toLowerCase();
        if (!ALLOWED_INLINE_SCRIPT_TYPES.includes(type)) {
          fail(
            "inline-script",
            where,
            `<script> without src${type ? ` (type="${type}")` : ""}. Move the code into a file.`,
          );
        }
      }
      if (tag.name === "meta" && (tag.attrs.get("http-equiv") ?? "").toLowerCase() === "refresh")
        fail(
          "meta-refresh",
          where,
          '<meta http-equiv="refresh"> sends the visitor on without a click. Remove it.',
        );
      if (isHtml && tag.attrs.has("data-contact-form"))
        contactForms.push({ route, sitekey: tag.attrs.get("data-sitekey") ?? null });
      if (tag.name === "style")
        fail("inline-style", where, "<style> element. Use a stylesheet file or a class.");
      if (tag.attrs.has("style"))
        fail("inline-style", where, `style= attribute on <${tag.name}>. Use a class.`);
      for (const attr of tag.attrs.keys()) {
        if (/^on[a-z]+$/.test(attr))
          fail(
            "inline-handler",
            where,
            `${attr}= handler on <${tag.name}>. Attach it from a script file.`,
          );
        if (attr.startsWith("data-draft") && !showDrafts) {
          fail(
            "draft-marker",
            where,
            `${attr} on <${tag.name}>. A production build must contain no draft content.`,
          );
        }
      }
      for (const { url } of urlsOf(tag)) {
        if (/^\s*javascript:/i.test(url))
          fail("inline-script", where, `javascript: URL on <${tag.name}>.`);
      }
    }
    if (!isHtml) continue;

    // Noindex posture.
    const robots = tags.find(
      (t) => t.name === "meta" && (t.attrs.get("name") ?? "").toLowerCase() === "robots",
    );
    const noindex = /noindex/i.test(robots?.attrs.get("content") ?? "");
    if (!launch && !noindex)
      fail(
        "noindex",
        where,
        'Missing <meta name="robots" content="noindex, nofollow">. Every page is noindex until launch.',
      );
    const staysPrivate = ALWAYS_NOINDEX_ROUTES.includes(route);
    if (launch && noindex && !staysPrivate)
      fail(
        "noindex",
        where,
        "Launch mode, but the page still says noindex. Build with PUBLIC_INDEXABLE=true.",
      );
    if (launch && !noindex && staysPrivate)
      fail(
        "noindex",
        where,
        "This page must keep noindex after launch. It is a confirmation or error page, not content for search.",
      );

    // Ids, for fragment checks.
    idsByRoute.set(
      route,
      new Set(tags.flatMap((t) => (t.attrs.has("id") ? [t.attrs.get("id") ?? ""] : []))),
    );

    for (const tag of tags) {
      for (const { url, kind } of urlsOf(tag)) references.push({ from: route, url, kind });
    }
  }

  // ---- scripts, stylesheets and source maps -------------------------------------------------------
  for (const file of files) {
    const where = rel(file);
    if (file.endsWith(".map")) {
      fail(
        "source-map",
        where,
        "A source map ships the original source next to the build. Do not publish it.",
      );
      continue;
    }
    if (!/\.(css|m?js)$/.test(file)) continue;
    const text = readText(file);
    if (/sourceMappingURL/.test(text))
      fail("source-map", where, "Contains a sourceMappingURL comment. Build without source maps.");
    if (!file.endsWith(".css")) continue;
    // A stylesheet loads only what the CSP allows: files of this site. url() and @import are references like any other.
    for (const url of cssUrls(text)) {
      if (/^(data|blob):/i.test(url))
        fail(
          "css-url",
          where,
          `url(${url.slice(0, 30)}...) is a ${url.split(":")[0]}: address. The CSP allows none, so it would not load.`,
        );
      else references.push({ from: `/${where}`, url, kind: "resource" });
    }
  }

  // ---- launch mode: the contact form needs a real site key -----------------------------------------
  if (launch) {
    const home = contactForms.find((form) => form.route === "/");
    if (!home) {
      fail(
        "launch-sitekey",
        "/",
        "The home page has no contact form (data-contact-form). The site's one way to reach Daniel is missing.",
      );
    } else if (!home.sitekey || home.sitekey.trim() === "") {
      fail(
        "launch-sitekey",
        "/",
        'The form has data-sitekey="". Every submit would say "Your request was not sent". Set PUBLIC_TURNSTILE_SITE_KEY in the Pages settings of both environments, before the build.',
      );
    } else if (/^[123]x0{10,}/.test(home.sitekey)) {
      fail(
        "launch-sitekey",
        "/",
        "The form has one of Cloudflare's dummy test site keys. They belong in tests only. Use the real key of the widget.",
      );
    }
  }

  // ---- drafts ---------------------------------------------------------------------------------
  const sitemapPath = join(distDir, "sitemap.xml");
  const sitemap = existsSync(sitemapPath) ? readText(sitemapPath) : "";
  const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    try {
      return new URL(m[1] ?? "").pathname;
    } catch {
      return m[1] ?? "";
    }
  });
  const draftRouteSet = new Set(content.draftRoutes.map((d) => d.route));
  for (const route of ALWAYS_NOINDEX_ROUTES) {
    if (sitemapPaths.includes(route))
      fail("private-page", "sitemap.xml", `Lists ${route}, which must stay out of search.`);
  }

  if (!showDrafts) {
    for (const draft of content.draftRoutes) {
      if (fileFor(distDir, draft.route))
        fail(
          "draft-route",
          draft.route,
          `A draft route exists in the production output (${draft.source}).`,
        );
      if (sitemapPaths.includes(draft.route))
        fail(
          "draft-sitemap",
          "sitemap.xml",
          `Lists the draft URL ${draft.route} (${draft.source}).`,
        );
    }
    const homeHtml = fileFor(distDir, "/");
    const homeText = homeHtml ? readText(homeHtml) : "";
    const homeIds = idsByRoute.get("/") ?? new Set();
    for (const section of content.draftSections) {
      if (
        homeIds.has(section.id) ||
        new RegExp(`\\bid=["']?${escapeRegExp(section.id)}["'\\s>]`).test(homeText)
      ) {
        fail(
          "draft-section",
          "/",
          `Draft section "${section.id}" is in the production home page (${section.source}).`,
        );
      }
    }
  } else {
    // Preview build: drafts are expected, and every one that was built must be marked as such.
    for (const draft of content.draftRoutes) {
      const file = fileFor(distDir, draft.route);
      if (file && !/data-draft-banner/.test(readText(file))) {
        fail("draft-marker", draft.route, "A draft page is built but has no draft banner.");
      }
    }
  }

  // ---- work clearance, a second line of defence behind the schema ---------------------------
  for (const work of content.publishedWork) {
    if (work.clearance !== "written") {
      fail(
        "work-clearance",
        work.source,
        `A published case study needs clearance: written (found "${work.clearance ?? "none"}").`,
      );
    }
  }

  // ---- links, assets, fragments ---------------------------------------------------------------
  const base = "http://dist.invalid";
  for (const ref of references) {
    const url = ref.url.trim();
    if (url === "" || /^(mailto|tel|sms|data|javascript|blob):/i.test(url)) continue;
    /** @type {URL} */
    let resolved;
    try {
      resolved = new URL(url, `${base}${ref.from}`);
    } catch {
      fail("link", ref.from, `Cannot read URL "${url}".`);
      continue;
    }
    const sameSite = resolved.origin === base || siteOrigins.includes(resolved.origin);
    if (!sameSite) {
      // External. Resources must come from an origin the CSP names. Links are checked in launch mode.
      // The list is fixed here and in the expected CSP. A host that a changed _headers added is not accepted.
      const allowedByCsp = ALLOWED_THIRD_PARTY.includes(resolved.origin);
      if (ref.kind === "resource" && !allowedByCsp) {
        fail(
          "third-party",
          ref.from,
          `Loads ${resolved.origin}, which the Content-Security-Policy does not allow.`,
        );
      }
      continue;
    }
    const pathname = resolved.pathname;
    if (FUNCTION_PREFIXES.some((p) => pathname.startsWith(p))) continue;

    if (ref.kind === "link" && ALWAYS_NOINDEX_ROUTES.includes(pathname) && pathname !== ref.from) {
      fail(
        "private-page",
        ref.from,
        `Links to ${pathname}. The confirmation page is reached by the form script only, so it is not linked.`,
      );
      continue;
    }
    if (draftRouteSet.has(pathname)) {
      // A page may point at itself, for example the skip link #main. That is not a link to a draft.
      if (!showDrafts && pathname !== ref.from)
        fail("draft-link", ref.from, `Links to the draft route ${pathname}.`);
      continue;
    }
    const lastSegment = pathname.split("/").pop() ?? "";
    if (!lastSegment.includes(".") && !pathname.endsWith("/")) {
      fail(
        "link",
        ref.from,
        `${pathname} has no trailing slash. Links end with a slash on this site.`,
      );
      continue;
    }
    const target = fileFor(distDir, pathname);
    if (!target) {
      fail("link", ref.from, `${url} points at ${pathname}, which is not in the build.`);
      continue;
    }
    const fragment = safeDecode(resolved.hash.replace(/^#/, ""));
    if (fragment && fragment.toLowerCase() !== "top" && target.endsWith(".html")) {
      const targetRoute = pages.find((p) => p.file === target)?.route ?? pathname;
      const ids = idsByRoute.get(targetRoute);
      if (!ids?.has(fragment)) {
        const draftSection = content.draftSections.some((s) => s.id === fragment) && !showDrafts;
        fail(
          draftSection ? "draft-link" : "link",
          ref.from,
          `${url} points at #${fragment}, which does not exist on ${targetRoute}${draftSection ? " (a draft section)" : ""}.`,
        );
      }
    }
  }

  // ---- robots.txt, _headers and the launch switch ------------------------------------------
  const robotsPath = join(distDir, "robots.txt");
  if (existsSync(robotsPath)) {
    const robots = readText(robotsPath);
    const disallowsAll = /^\s*Disallow:\s*\/\s*$/im.test(robots);
    if (!launch && !disallowsAll)
      fail(
        "noindex",
        "robots.txt",
        "Must disallow everything until launch (User-agent: * and Disallow: /).",
      );
    if (!launch && /^\s*Allow:\s*\/\s*$/im.test(robots))
      fail("noindex", "robots.txt", "Allows crawling, but the site is not public yet.");
    if (launch && disallowsAll)
      fail("noindex", "robots.txt", "Launch mode, but robots.txt still disallows everything.");
    if (launch && !/^\s*Sitemap:/im.test(robots))
      fail("noindex", "robots.txt", "Launch mode, but robots.txt names no sitemap.");
  }
  // ---- launch mode: placeholders and third-party origins -----------------------------------------
  if (launch) {
    const allowed = new Set([...siteOrigins, ...ALLOWED_THIRD_PARTY, ...NAMESPACE_ORIGINS]);
    for (const file of files) {
      if (!TEXT_EXTENSIONS.some((ext) => file.endsWith(ext))) continue;
      const where = rel(file);
      const text = readText(file);
      for (const marker of LAUNCH_BLOCKERS) {
        const index = text.indexOf(marker);
        if (index !== -1)
          fail(
            "launch-placeholder",
            where,
            `Contains "${marker}": "${snippet(text, index)}". Resolve it before launch.`,
          );
      }
      if (LICENCE_TEXT.test(where)) continue;
      // URLs in /* */ comments are never requested, for example the license line Tailwind writes into the CSS.
      const scanned = /\.(css|m?js)$/.test(file) ? text.replace(/\/\*[\s\S]*?\*\//g, "") : text;
      for (const match of scanned.matchAll(/https?:\/\/[^\s"'<>)\]}\\,;]+/g)) {
        let origin;
        try {
          origin = new URL(match[0]).origin;
        } catch {
          continue;
        }
        if (!allowed.has(origin))
          fail("launch-origin", where, `Mentions ${origin}, which is not in the allowed list.`);
      }
    }
  }

  const mode = launch ? "launch" : showDrafts ? "preview with drafts" : "production";
  summary.push(
    `Mode: ${mode}. ${pages.length} page(s), ${files.length} file(s), ${references.length} reference(s) checked.`,
  );
  if (!showDrafts) {
    summary.push(
      `Draft entries kept out: ${content.draftRoutes.length} route(s), ${content.draftSections.length} home section(s).`,
    );
  }
  return { problems, summary };
}

// ---------------------------------------------------------------------------------------------
// Command line

const isMain =
  Boolean(process.argv[1]) && pathToFileURL(process.argv[1] ?? "").href === import.meta.url;
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (/** @type {string | undefined} */ v) => v === "true" || v === "1";
  /** @param {string} name @param {string} fallback */
  const option = (name, fallback) => {
    const i = args.indexOf(name);
    return i === -1 ? fallback : (args[i + 1] ?? fallback);
  };
  const extra = process.env.SITE_URL ? [new URL(process.env.SITE_URL).origin] : [];
  const { problems, summary } = checkDist({
    distDir: option("--dist", "dist"),
    contentDir: option("--content", "src/content"),
    launch: args.includes("--launch") || flag(process.env.PUBLIC_INDEXABLE),
    showDrafts: flag(process.env.SHOW_DRAFTS),
    extraOrigins: extra,
  });
  for (const line of summary) console.log(line);
  if (problems.length > 0) {
    for (const p of problems) console.log(`FAIL [${p.rule}] ${p.where}: ${p.message}`);
    console.log(`\n${problems.length} problem(s). The build must not be deployed.`);
    process.exit(1);
  }
  console.log("OK: check-dist found no problems.");
}
