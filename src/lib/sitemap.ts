/**
 * Sitemap and robots.txt as plain functions. The endpoints in src/pages call them with entries
 * that are already filtered with isPublished(), so drafts never get a sitemap line.
 */

export interface SitemapEntry {
  readonly path: string;
  readonly lastmod?: Date | undefined;
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderSitemap(origin: string, entries: readonly SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const loc = escapeXml(new URL(entry.path, origin).href);
      const lastmod = entry.lastmod
        ? `<lastmod>${entry.lastmod.toISOString().slice(0, 10)}</lastmod>`
        : "";
      return `  <url><loc>${loc}</loc>${lastmod}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Until launch every crawler is told to stay out. PUBLIC_INDEXABLE=true opens the site. */
export function robotsTxt(options: { indexable: boolean; origin: string }): string {
  if (!options.indexable) {
    return "User-agent: *\nDisallow: /\n";
  }
  const sitemap = new URL("/sitemap.xml", options.origin).href;
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
}
