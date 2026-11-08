/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** "true" removes the noindex tag and opens robots.txt. Launch only. */
  readonly PUBLIC_INDEXABLE?: string;
  /** "true" builds and shows draft content with a banner. Private preview only. */
  readonly SHOW_DRAFTS?: string;
  /** The public Turnstile site key, read at build time. Empty in the preview before the Cloudflare setup. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
