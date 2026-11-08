/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /** "true" removes the noindex tag and opens robots.txt. Launch only. */
  readonly PUBLIC_INDEXABLE?: string;
  /** "true" builds and shows draft content with a banner. Private preview only. */
  readonly SHOW_DRAFTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
