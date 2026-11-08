// Minimal reader for the Cloudflare Pages `_headers` file format.
// Tests and screenshots use it to load pages under the same headers as production,
// above all the Content-Security-Policy, so a policy violation shows up as a console error.
//
// Supported: comment lines, path rules that start with "/", "*" splats and ":placeholder" segments.
// Rules for full URLs (https://host/...) are skipped, because a local server has one host.

/**
 * @typedef {{ pattern: string, headers: Array<[string, string]> }} HeaderRule
 */

/**
 * @param {string} text
 * @returns {HeaderRule[]}
 */
export function parseHeadersFile(text) {
  /** @type {HeaderRule[]} */
  const rules = [];
  /** @type {HeaderRule | undefined} */
  let current;
  for (const raw of text.split(/\r?\n/)) {
    if (raw.trim() === "" || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      current = { pattern: raw.trim(), headers: [] };
      rules.push(current);
      continue;
    }
    if (!current) throw new Error(`_headers: header line before any path rule: ${raw.trim()}`);
    const line = raw.trim();
    const colon = line.indexOf(":");
    if (colon === -1) {
      // The "! Name" detach syntax and other forms are not needed locally.
      continue;
    }
    current.headers.push([line.slice(0, colon).trim(), line.slice(colon + 1).trim()]);
  }
  return rules.filter((rule) => rule.pattern.startsWith("/"));
}

/**
 * @param {string} pattern
 * @returns {RegExp}
 */
export function patternToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "(.*)")
    .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, "([^/]+)");
  return new RegExp(`^${escaped}$`);
}

/**
 * Headers that apply to a path. Values for the same name in several matching rules are joined with ", ".
 * @param {HeaderRule[]} rules
 * @param {string} pathname
 * @returns {Record<string, string>}
 */
export function headersForPath(rules, pathname) {
  /** @type {Record<string, string>} */
  const merged = {};
  for (const rule of rules) {
    if (!patternToRegExp(rule.pattern).test(pathname)) continue;
    for (const [name, value] of rule.headers) {
      merged[name] = name in merged ? `${merged[name]}, ${value}` : value;
    }
  }
  return merged;
}

/**
 * Headers for a page served from plain http://localhost.
 * `upgrade-insecure-requests` is dropped, because it would turn every local request into https.
 * Every other directive is kept exactly as shipped.
 * @param {Record<string, string>} headers
 * @returns {Record<string, string>}
 */
export function forLocalHttp(headers) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === "content-security-policy") {
      out[name] = value
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part !== "" && part !== "upgrade-insecure-requests")
        .join("; ");
    } else if (name.toLowerCase() === "strict-transport-security") {
      // Browsers ignore it over http. Leaving it out keeps the local response honest.
    } else {
      out[name] = value;
    }
  }
  return out;
}

/**
 * @typedef {{ pattern: string, headers: Array<[string, string]>, detach: string[], line: number }} StrictRule
 */

/**
 * Reads every rule of a `_headers` file for the check that guards it: host rules (https://...) are kept, the
 * `! Name` detach lines are kept as such, and a line that makes no sense is reported instead of skipped or thrown.
 * parseHeadersFile above is for pages served locally. This one is for deciding whether the file may ship.
 * @param {string} text
 * @returns {{ rules: StrictRule[], problems: string[] }}
 */
export function readHeadersStrict(text) {
  /** @type {StrictRule[]} */
  const rules = [];
  /** @type {string[]} */
  const problems = [];
  /** @type {StrictRule | undefined} */
  let current;
  text.split(/\r?\n/).forEach((raw, index) => {
    const trimmed = raw.trim();
    const line = index + 1;
    if (trimmed === "" || trimmed.startsWith("#")) return;
    if (!/^\s/.test(raw)) {
      current = { pattern: trimmed, headers: [], detach: [], line };
      rules.push(current);
      return;
    }
    if (!current) {
      problems.push(`Line ${line}: a header line before any path rule.`);
      return;
    }
    if (trimmed.startsWith("!")) {
      current.detach.push(trimmed.slice(1).trim());
      return;
    }
    const colon = trimmed.indexOf(":");
    if (colon <= 0) {
      problems.push(`Line ${line}: "${trimmed.slice(0, 60)}" is not "Name: value".`);
      return;
    }
    current.headers.push([trimmed.slice(0, colon).trim(), trimmed.slice(colon + 1).trim()]);
  });
  return { rules, problems };
}
