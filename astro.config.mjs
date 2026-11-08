// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Build flags. See .env.example.
//   PUBLIC_INDEXABLE=true  launch mode: no noindex meta tag, permissive robots.txt.
//   SHOW_DRAFTS=true       private preview only: draft pages and sections render with a banner.
// Drafts visible and indexable at the same time would publish unfinished pages to search engines,
// so that combination stops the build.
/** @param {string | undefined} value */
const flag = (value) => value === "true" || value === "1";
if (flag(process.env.PUBLIC_INDEXABLE) && flag(process.env.SHOW_DRAFTS)) {
  throw new Error(
    "PUBLIC_INDEXABLE=true and SHOW_DRAFTS=true must not be set together. Drafts would become indexable.",
  );
}

// Canonical origin once the name is cleared (ADR 0001: the site lives on www, the bare domain forwards).
// Only used for absolute URLs in the sitemap and canonical links. Override with SITE_URL if needed.
const site = process.env.SITE_URL ?? "https://www.normek.dk";

export default defineConfig({
  site,
  // Pure static output. No adapter: the contact form is a Pages Function in functions/ (ADR 0001, A3).
  output: "static",
  trailingSlash: "always",
  compressHTML: true,
  build: {
    format: "directory",
    // Security requirement (docs/security/threat-model-and-requirements.md, section 2):
    // Astro must emit no inline code, so the strict CSP in public/_headers needs no hashes.
    // 'never' keeps every stylesheet an external file. assetsInlineLimit below keeps assets out of data: URIs.
    inlineStylesheets: "never",
  },
  // English only for now. Danish is added later under /da/ without moving the English routes.
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // 0 means nothing is inlined as a data: URI (the CSP allows img-src 'self' only).
      assetsInlineLimit: 0,
    },
  },
});
