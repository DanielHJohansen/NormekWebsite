/**
 * Build flags. See .env.example.
 *
 *   PUBLIC_INDEXABLE=true  launch mode: pages drop the noindex tag and robots.txt opens up.
 *   SHOW_DRAFTS=true       private preview only: drafts are built and shown with a banner.
 *
 * Drafts must never be indexable, so both flags together is an error.
 */

type EnvLike = Readonly<Record<string, unknown>>;

export interface BuildFlags {
  readonly indexable: boolean;
  readonly showDrafts: boolean;
}

/** Only the exact strings "true" and "1" turn a flag on. A typo leaves it off, the safe side. */
export function envFlag(value: unknown): boolean {
  return value === true || value === "true" || value === "1";
}

export function readFlags(env: EnvLike): BuildFlags {
  const indexable = envFlag(env["PUBLIC_INDEXABLE"]);
  const showDrafts = envFlag(env["SHOW_DRAFTS"]);
  if (indexable && showDrafts) {
    throw new Error(
      "PUBLIC_INDEXABLE=true and SHOW_DRAFTS=true must not be set together. Drafts would become indexable.",
    );
  }
  return { indexable, showDrafts };
}

/** Each variable is read by name, because Vite only inlines the names it can see. */
export const FLAGS: BuildFlags = readFlags({
  PUBLIC_INDEXABLE: import.meta.env.PUBLIC_INDEXABLE,
  SHOW_DRAFTS: import.meta.env.SHOW_DRAFTS,
});
