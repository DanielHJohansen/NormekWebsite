import type { APIRoute } from "astro";
import { SITE } from "../config/site";
import { getPages, getWork } from "../lib/content";
import { homePath, pagePath, splitId, workIndexPath, workPath } from "../lib/routes";
import { renderSitemap, type SitemapEntry } from "../lib/sitemap";

/**
 * Lists the home page, the published pages and the published case studies.
 * Every read goes through isPublished(), so a production build has no draft URL in here.
 * The 404 page and the form endpoint are not pages to index.
 */
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("Set `site` in astro.config.mjs. The sitemap needs absolute URLs.");
  const locale = SITE.defaultLocale;
  const [allPages, work] = await Promise.all([getPages(locale), getWork(locale)]);
  // /thanks/ and the 404 page are not pages to index, so they never get a sitemap line.
  const pages = allPages.filter(
    (page) => page.data.sitemap && !page.data.noindex && page.data.layout !== "notfound",
  );

  const entries: SitemapEntry[] = [
    { path: homePath(locale) },
    ...pages.map((page) => ({
      path: pagePath(locale, splitId(page.id).slug),
      lastmod: page.data.updated,
    })),
    ...(work.length > 0 ? [{ path: workIndexPath(locale) }] : []),
    ...work.map((item) => ({
      path: workPath(locale, splitId(item.id).slug),
      lastmod: item.data.updated,
    })),
  ];

  return new Response(renderSitemap(site.href, entries), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
