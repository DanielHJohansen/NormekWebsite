/**
 * A missing fact is written in square brackets with "TO CONFIRM" in it, for example [TO CONFIRM],
 * [1 working day, TO CONFIRM] or [TO CONFIRM link]. A [TARGET ...] marker follows the same rule.
 * The page shows each one as a dashed tag (see .tbc in global.css) and keeps the brackets,
 * so check:dist in launch mode still finds them and blocks the launch while any remain.
 */

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
