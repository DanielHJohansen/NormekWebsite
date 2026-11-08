/**
 * Route helpers. English lives at the root. Danish is added later under /da/ without moving
 * the English routes (Astro i18n with prefixDefaultLocale: false). Trailing slashes everywhere.
 */
import { SITE } from "../config/site";

/** Slugs a page in the `pages` collection may not use, because a route already owns them. */
export const RESERVED_SLUGS: readonly string[] = [
  "404",
  "api",
  "work",
  "sitemap.xml",
  "robots.txt",
  ...SITE.locales.filter((locale) => locale !== SITE.defaultLocale),
];

/** Collection ids look like "en/privacy": the folder is the locale and the rest is the slug. */
export function splitId(id: string): { locale: string; slug: string } {
  const [locale, ...rest] = id.split("/");
  if (!locale || rest.length === 0) {
    throw new Error(`Content id "${id}" must look like "<locale>/<slug>".`);
  }
  return { locale, slug: rest.join("/") };
}

function prefix(locale: string): string {
  return locale === SITE.defaultLocale ? "" : `/${locale}`;
}

export function pagePath(locale: string, slug: string): string {
  return `${prefix(locale)}/${slug}/`;
}

export function workIndexPath(locale: string): string {
  return `${prefix(locale)}/work/`;
}

export function workPath(locale: string, slug: string): string {
  return `${prefix(locale)}/work/${slug}/`;
}

export function homePath(locale: string): string {
  return `${prefix(locale)}/`;
}
