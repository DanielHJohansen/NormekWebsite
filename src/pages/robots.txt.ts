import type { APIRoute } from "astro";
import { FLAGS } from "../lib/flags";
import { robotsTxt } from "../lib/sitemap";

/**
 * Generated at build time instead of kept as public/robots.txt, because a static file cannot follow
 * PUBLIC_INDEXABLE. Default: disallow everything. PUBLIC_INDEXABLE=true opens the site.
 */
export const GET: APIRoute = ({ site }) => {
  if (!site)
    throw new Error("Set `site` in astro.config.mjs. robots.txt needs the absolute sitemap URL.");
  return new Response(robotsTxt({ indexable: FLAGS.indexable, origin: site.href }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
