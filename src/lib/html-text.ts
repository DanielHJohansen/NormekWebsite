/**
 * Small helpers for the HTML that Astro renders from our Markdown. They change the text between the tags and
 * nothing else, so attributes, comments, code and preformatted text stay as they were.
 */

/** A tag or a comment. A quoted attribute value may hold a ">" without ending the tag. */
const MARKUP = /(<!--[\s\S]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>)/;

/** The text inside these is left alone: a bracket or a quote in code is code. */
const VERBATIM = new Set(["code", "pre", "script", "style", "textarea"]);

function tagName(markup: string): { name: string; closing: boolean; selfClosing: boolean } | null {
  const match = /^<(\/?)([A-Za-z][A-Za-z0-9-]*)/.exec(markup);
  if (!match) return null;
  return {
    name: (match[2] ?? "").toLowerCase(),
    closing: match[1] === "/",
    selfClosing: markup.endsWith("/>"),
  };
}

/** Applies a change to every piece of text in an HTML string, outside tags, comments and verbatim elements. */
export function mapHtmlText(html: string, change: (text: string) => string): string {
  let verbatim = 0;
  return html
    .split(MARKUP)
    .map((part, index) => {
      if (index % 2 === 1) {
        const tag = tagName(part);
        if (tag && VERBATIM.has(tag.name) && !tag.selfClosing) {
          verbatim = Math.max(0, verbatim + (tag.closing ? -1 : 1));
        }
        return part;
      }
      return verbatim > 0 || part === "" ? part : change(part);
    })
    .join("");
}

/**
 * Sätteri turns straight quotes and apostrophes in Markdown into curly ones. The copy is written with straight
 * ones, and so is every string that comes from a YAML file, so this puts the written characters back. Without it
 * the site would mix "manufacturer's" in one section with "manufacturer’s" in another.
 */
export function straightenQuotes(text: string): string {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

export function straightenQuotesInHtml(html: string): string {
  return mapHtmlText(html, straightenQuotes);
}
