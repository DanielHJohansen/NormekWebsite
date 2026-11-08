// Daniel's writing rule: no em dash and no semicolon in prose. The checks behind scripts/check-writing-rules.mjs.
// Kept in a module so that tests can use them.

/** Built from its code point, so that this file holds no em dash itself. */
export const EM_DASH = String.fromCodePoint(0x2014);

/**
 * Blank out code but keep newlines so reported line numbers stay correct. For Markdown.
 * @param {string} text
 * @returns {string}
 */
export function stripCode(text) {
  /** @param {string} match */
  const blank = (match) => match.replace(/[^\n]/g, " ");
  return text
    .replace(/```[\s\S]*?```/g, blank)
    .replace(/~~~[\s\S]*?~~~/g, blank)
    .replace(/`[^`\n]*`/g, blank);
}

/**
 * The text of a YAML file with its comments blanked out, so that a note to a colleague is not held to the rule but
 * every value is. A # starts a comment at the start of a line or after a space, and not inside a quoted string.
 * Newlines stay, so reported line numbers stay correct.
 * @param {string} text
 * @returns {string}
 */
export function yamlProse(text) {
  return text
    .split("\n")
    .map((line) => {
      /** @type {string | null} */
      let quote = null;
      for (let index = 0; index < line.length; index++) {
        const char = line[index];
        if (quote) {
          if (char === quote) quote = null;
          continue;
        }
        if (char === '"' || char === "'") {
          // An apostrophe inside a plain word (don't) is not a quote. A quote opens at a value or after a space.
          const before = index === 0 ? " " : (line[index - 1] ?? " ");
          if (/[\s:[{,-]/.test(before)) quote = char;
          continue;
        }
        if (char === "#" && (index === 0 || /\s/.test(line[index - 1] ?? ""))) {
          return line.slice(0, index);
        }
      }
      return line;
    })
    .join("\n");
}

/**
 * The lines of a text that break the rule.
 * @param {string} prose text with code and comments already blanked out
 * @returns {Array<{ line: number, what: string, text: string }>}
 */
export function findProblems(prose) {
  /** @type {Array<{ line: number, what: string, text: string }>} */
  const out = [];
  prose.split("\n").forEach((line, index) => {
    const hits = [];
    if (line.includes(EM_DASH)) hits.push("em dash");
    if (line.includes(";")) hits.push("semicolon");
    if (hits.length)
      out.push({ line: index + 1, what: hits.join(" and "), text: line.trim().slice(0, 100) });
  });
  return out;
}
