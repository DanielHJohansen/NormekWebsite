// The guard on dist/_headers (security gate G1, S8 and G7).
//
// The file is compared with a fixed description of what may ship, not with a list of things that must not. A list of
// bad directives misses the next one. This does not: any value that is not the expected one fails, and so does any
// header, directive or rule that is not on the list.
//
// Two shapes are allowed, and check-dist names the one it expects:
//   preview (the default)  the /* rule carries X-Robots-Tag: noindex, nofollow
//   launch                 the /* rule has no X-Robots-Tag, and two host rules keep pages.dev out of search
// Both shapes carry the same Content-Security-Policy and the same other headers. The cache rule for /_astro/* is in both.
import { NOINDEX, PAGES_DEV_HOST_RULES } from "./build-headers.mjs";
import { readHeadersStrict } from "./headers.mjs";

/**
 * The Content-Security-Policy, directive by directive (docs/security/threat-model-and-requirements.md section 2.1).
 * Turnstile is named in script-src and frame-src only. Nothing else may carry a host.
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const EXPECTED_CSP = {
  "default-src": ["'none'"],
  "script-src": ["'self'", "https://challenges.cloudflare.com"],
  "frame-src": ["https://challenges.cloudflare.com"],
  "style-src": ["'self'"],
  "img-src": ["'self'"],
  "font-src": ["'self'"],
  "connect-src": ["'self'"],
  "manifest-src": ["'self'"],
  "form-action": ["'self'"],
  "base-uri": ["'none'"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
};

/**
 * Every other header of the /* rule, by exact value. Names are compared in lower case.
 * @type {Readonly<Record<string, string>>}
 */
export const EXPECTED_HEADERS = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "same-origin",
  "permissions-policy":
    "accelerometer=(), browsing-topics=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), hid=(), magnetometer=(), microphone=(), midi=(), payment=(), serial=(), usb=()",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
};

/**
 * The only other path rules, and the only header they may set. The build gives every file in /_astro/ a hash in its
 * name, so it never changes under its address and may be cached for a year. HTML keeps the default.
 * @type {Readonly<Record<string, string>>}
 */
export const EXPECTED_CACHE_RULES = {
  "/_astro/*": "public, max-age=31536000, immutable",
};

export { NOINDEX, PAGES_DEV_HOST_RULES };

/**
 * @param {string} value
 * @returns {{ directives: Map<string, string[]>, repeated: string[] }}
 */
export function parseCsp(value) {
  /** @type {Map<string, string[]>} */
  const directives = new Map();
  /** @type {string[]} */
  const repeated = [];
  for (const part of value.split(";")) {
    const [first, ...sources] = part.trim().split(/\s+/);
    if (!first) continue;
    const name = first.toLowerCase();
    // A browser keeps the first of two equal directives and ignores the second, so a repeat is never harmless to read.
    if (directives.has(name)) repeated.push(name);
    else directives.set(name, sources);
  }
  return { directives, repeated };
}

/**
 * What is wrong with a Content-Security-Policy value. An empty list is a pass.
 * @param {string} value
 * @returns {string[]}
 */
export function cspProblems(value) {
  const { directives, repeated } = parseCsp(value);
  /** @type {string[]} */
  const out = [];
  for (const name of repeated) out.push(`The CSP repeats the directive ${name}.`);
  for (const [name, expected] of Object.entries(EXPECTED_CSP)) {
    const found = directives.get(name);
    if (!found) {
      out.push(`The CSP has no ${name} directive. Expected: ${[name, ...expected].join(" ")}.`);
      continue;
    }
    const wanted = [...expected].sort().join(" ");
    const got = [...found].sort().join(" ");
    if (wanted !== got) {
      out.push(
        `The CSP ${name} is "${found.join(" ")}", expected "${expected.join(" ")}". Report the violation instead of loosening the policy.`,
      );
    }
  }
  for (const name of directives.keys()) {
    if (!(name in EXPECTED_CSP)) out.push(`The CSP has a directive that is not expected: ${name}.`);
  }
  return out;
}

/**
 * Everything wrong with a _headers file, as { rule, message }. The rule is "headers", or "noindex" for the finding
 * about X-Robots-Tag, so that check-dist reports it with the other noindex findings. An empty list is a pass.
 * @param {string} text the file as built
 * @param {{ launch?: boolean }} [options] launch: the shape the launch build writes
 * @returns {Array<{ rule: string, message: string }>}
 */
export function checkHeadersFile(text, { launch = false } = {}) {
  /** @type {Array<{ rule: string, message: string }>} */
  const found = [];
  /** @param {string} message @param {string} [rule] */
  const add = (message, rule = "headers") => {
    found.push({ rule, message });
  };

  const { rules, problems } = readHeadersStrict(text);
  for (const problem of problems) add(problem);

  // A detach line removes a header that an earlier rule set. Nothing may do that, whatever the path.
  for (const rule of rules) {
    for (const name of rule.detach) {
      add(`The rule ${rule.pattern} detaches ${name} with "!". No rule may remove a header.`);
    }
  }

  const catchAll = rules.filter((rule) => rule.pattern === "/*");
  if (catchAll.length !== 1) add(`There must be exactly one /* rule. Found ${catchAll.length}.`);
  const root = catchAll[0];
  if (root) {
    /** @type {Map<string, string[]>} */
    const byName = new Map();
    for (const [name, value] of root.headers) {
      const key = name.toLowerCase();
      byName.set(key, [...(byName.get(key) ?? []), value]);
    }
    for (const [key, values] of byName) {
      if (values.length > 1) add(`/* sets ${key} ${values.length} times.`);
    }

    const csp = byName.get("content-security-policy")?.[0];
    if (csp === undefined) add("/* sets no Content-Security-Policy.");
    else for (const message of cspProblems(csp)) add(message);

    for (const [key, wanted] of Object.entries(EXPECTED_HEADERS)) {
      const got = byName.get(key)?.[0];
      if (got === undefined) add(`/* sets no ${key}. Expected "${wanted}".`);
      else if (got !== wanted) add(`/* sets ${key}: "${got}", expected "${wanted}".`);
    }

    const robots = byName.get("x-robots-tag")?.[0];
    if (launch) {
      if (robots !== undefined) {
        add(
          `Launch mode, but /* still sends X-Robots-Tag: ${robots}. The build must write the launch variant (scripts/lib/build-headers.mjs, PUBLIC_INDEXABLE=true).`,
          "noindex",
        );
      }
    } else if (robots !== NOINDEX) {
      add(
        `/* must send X-Robots-Tag: ${NOINDEX} until launch. Found ${robots === undefined ? "none" : `"${robots}"`}.`,
        "noindex",
      );
    }

    const known = new Set([
      "content-security-policy",
      "x-robots-tag",
      ...Object.keys(EXPECTED_HEADERS),
    ]);
    for (const key of byName.keys()) {
      if (!known.has(key)) add(`/* sets a header that is not expected: ${key}.`);
    }
  }

  // The other rules: the cache rule for hashed files, and at launch the two host rules. Nothing else.
  /** @param {{ headers: Array<[string, string]> }} rule */
  const lines = (rule) => rule.headers.map(([name, value]) => `${name.toLowerCase()}: ${value}`);
  for (const rule of rules) {
    if (rule.pattern === "/*") continue;
    const cache = EXPECTED_CACHE_RULES[rule.pattern];
    if (cache !== undefined) {
      const got = lines(rule);
      if (got.length !== 1 || got[0] !== `cache-control: ${cache}`) {
        add(
          `The rule ${rule.pattern} may set only Cache-Control: ${cache}. Found: ${got.join(", ") || "nothing"}.`,
        );
      }
      continue;
    }
    if (launch && PAGES_DEV_HOST_RULES.includes(rule.pattern)) {
      const got = lines(rule);
      if (got.length !== 1 || got[0] !== `x-robots-tag: ${NOINDEX}`) {
        add(
          `The host rule ${rule.pattern} may set only X-Robots-Tag: ${NOINDEX}. Found: ${got.join(", ") || "nothing"}.`,
        );
      }
      continue;
    }
    add(
      `The rule ${rule.pattern} is not expected. Only /*, ${Object.keys(EXPECTED_CACHE_RULES).join(", ")}${launch ? " and the two pages.dev host rules" : ""} are allowed, and a path rule may set only Cache-Control.`,
    );
  }
  for (const [pattern, cache] of Object.entries(EXPECTED_CACHE_RULES)) {
    if (!rules.some((rule) => rule.pattern === pattern)) {
      add(`The rule ${pattern} is missing. Hashed files need Cache-Control: ${cache}.`);
    }
  }
  if (launch) {
    for (const pattern of PAGES_DEV_HOST_RULES) {
      const count = rules.filter((rule) => rule.pattern === pattern).length;
      if (count !== 1) {
        add(
          `The launch build needs the host rule ${pattern} once, to keep pages.dev out of search. Found ${count}.`,
          "noindex",
        );
      }
    }
  }
  return found;
}
