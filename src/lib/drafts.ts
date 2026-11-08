/**
 * Draft handling. One rule, used by every getStaticPaths, the navigation and the sitemap.
 *
 * Production builds drop drafts, so no HTML file, link or sitemap entry exists for them.
 * The private preview sets SHOW_DRAFTS=true, then drafts are built and shown with a banner.
 */
import { FLAGS } from "./flags";

export interface Draftable {
  readonly data: { readonly draft?: boolean | undefined };
}

/** Fail safe: anything that is not an explicit `draft: false` counts as a draft. */
export function isDraft(entry: Draftable): boolean {
  return entry.data.draft !== false;
}

/** Pure form of the rule, so tests can pass the flag in. */
export function isVisible(entry: Draftable, showDrafts: boolean): boolean {
  return !isDraft(entry) || showDrafts;
}

/**
 * True when the entry is part of this build. In production that means "not a draft".
 * In the preview with SHOW_DRAFTS=true drafts are included, and the layout marks them.
 *
 * Takes one argument on purpose, so it is safe to pass straight to getCollection().
 */
export function isPublished(entry: Draftable): boolean {
  return isVisible(entry, FLAGS.showDrafts);
}
