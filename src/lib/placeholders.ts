/**
 * A missing fact is written in square brackets with "TO CONFIRM" in it, for example [TO CONFIRM],
 * [1 working day, TO CONFIRM] or [TO CONFIRM link]. A [TARGET ...] marker follows the same rule.
 * The page shows each one as a dashed tag (see .tbc in global.css) and keeps the brackets,
 * so check:dist in launch mode still finds them and blocks the launch while any remain.
 */
import { mapHtmlText } from "./html-text";

/** The pattern as a string, so other patterns can include it. Square brackets inside are not allowed. */
export const PLACEHOLDER_SOURCE = String.raw`\[(?:[^\[\]]*TO CONFIRM[^\[\]]*|TARGET[^\[\]]*)\]`;

export interface Segment {
  readonly text: string;
  readonly placeholder: boolean;
}

/** Splits text at every placeholder. The segments joined together are always the original text. */
export function splitPlaceholders(text: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = new RegExp(PLACEHOLDER_SOURCE, "g");
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    if (start > last) segments.push({ text: text.slice(last, start), placeholder: false });
    segments.push({ text: match[0], placeholder: true });
    last = start + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), placeholder: false });
  return segments;
}

export function hasPlaceholder(text: string): boolean {
  return new RegExp(PLACEHOLDER_SOURCE).test(text);
}

// ---------------------------------------------------------------------------------------------
// Markdown text. Astro 7 renders Markdown with Sätteri, which has no rehype step, and a plugin for it would need
// a new dependency. So the rendered HTML string gets the same dashed tags as the Inline component, in one pass.

/**
 * Wraps every placeholder in the text of an HTML string in <span class="tbc">, the Markdown twin of the Inline
 * component. Attributes, comments, code and preformatted text are left alone. The input is HTML that Astro made
 * from our own Markdown, so its text is already escaped and stays escaped.
 */
export function wrapPlaceholdersInHtml(html: string): string {
  return mapHtmlText(html, (text) =>
    splitPlaceholders(text)
      .map((segment) =>
        segment.placeholder ? `<span class="tbc">${segment.text}</span>` : segment.text,
      )
      .join(""),
  );
}
