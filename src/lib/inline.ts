/**
 * A very small inline markup for the strings in YAML front matter, where Markdown is not available.
 *
 *   [label](/path/)       a link. Only /, #, mailto: and https: addresses are allowed.
 *   **text**              strong
 *   {email}               a mailto link with the address from src/config/site.ts
 *   {email-text}          the same address as plain text, for "I reply from ..."
 *   [... TO CONFIRM ...]  a placeholder (see placeholders.ts)
 *
 * The parser returns tokens, and the Inline component turns them into elements. Nothing here builds HTML
 * from a string, so a content mistake cannot inject markup.
 */
import { PLACEHOLDER_SOURCE } from "./placeholders";

export type InlineToken =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "placeholder"; readonly text: string }
  | { readonly type: "strong"; readonly text: string }
  | { readonly type: "link"; readonly text: string; readonly href: string }
  | { readonly type: "email"; readonly link: boolean };

/** Links may point inside the site, at a mail address or at an https page. Nothing else, so no javascript: URLs. */
export function isSafeHref(href: string): boolean {
  return /^(\/(?!\/)|#|mailto:|https:\/\/)/.test(href);
}

// Order matters: a placeholder such as [TO CONFIRM link] must win over the link syntax.
const PATTERN = new RegExp(
  [
    `(${PLACEHOLDER_SOURCE})`,
    String.raw`\[([^\[\]]+)\]\(([^)\s]+)\)`,
    String.raw`\*\*([^*]+)\*\*`,
    String.raw`(\{email(?:-text)?\})`,
  ].join("|"),
  "g",
);

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of text.matchAll(PATTERN)) {
    const start = match.index;
    if (start > last) tokens.push({ type: "text", text: text.slice(last, start) });
    const [whole, placeholder, linkText, linkHref, strong, email] = match;
    if (placeholder !== undefined) {
      tokens.push({ type: "placeholder", text: placeholder });
    } else if (linkText !== undefined && linkHref !== undefined) {
      if (!isSafeHref(linkHref)) {
        throw new Error(`Unsafe link address "${linkHref}" in: ${text}`);
      }
      tokens.push({ type: "link", text: linkText, href: linkHref });
    } else if (strong !== undefined) {
      tokens.push({ type: "strong", text: strong });
    } else if (email !== undefined) {
      tokens.push({ type: "email", link: email === "{email}" });
    }
    last = start + whole.length;
  }
  if (last < text.length) tokens.push({ type: "text", text: text.slice(last) });
  return tokens;
}

/** The text without markup, for labels and attributes. {email} becomes the address. */
export function plainText(text: string, email: string): string {
  return parseInline(text)
    .map((token) => (token.type === "email" ? email : token.text))
    .join("");
}

/**
 * Binds a one letter word to the word after it with a no-break space, so a line never ends with "I" or "a"
 * (the hero heading broke as "...works. I" and "design the box..." at 768 px). English only for now.
 * It changes what the page shows and never the words, so the content files keep their plain spaces.
 */
export function bindShortWords(text: string): string {
  return text.replace(/(^|[\s(])([IAa]) (?=\S)/g, "$1$2\u00A0");
}
