/**
 * A rehype plugin that wraps every placeholder in Markdown text in <span class="placeholder">.
 * It is the Markdown twin of the Inline component, so a gap looks the same wherever it is written.
 * Code blocks and inline code are left alone.
 */
import { splitPlaceholders } from "./placeholders";

export interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const SKIP = new Set(["code", "pre", "script", "style"]);

function transform(node: HastNode): void {
  if (!node.children) return;
  if (node.type === "element" && node.tagName && SKIP.has(node.tagName)) return;

  const next: HastNode[] = [];
  for (const child of node.children) {
    if (child.type === "text" && typeof child.value === "string") {
      const segments = splitPlaceholders(child.value);
      if (segments.some((segment) => segment.placeholder)) {
        for (const segment of segments) {
          next.push(
            segment.placeholder
              ? {
                  type: "element",
                  tagName: "span",
                  properties: { className: ["placeholder"] },
                  children: [{ type: "text", value: segment.text }],
                }
              : { type: "text", value: segment.text },
          );
        }
        continue;
      }
    } else {
      transform(child);
    }
    next.push(child);
  }
  node.children = next;
}

export function rehypePlaceholders() {
  return (tree: HastNode): void => {
    transform(tree);
  };
}
