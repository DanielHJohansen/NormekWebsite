// Helpers for reading the built site in dist/.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * All files below a folder, as absolute paths.
 * @param {string} dir
 * @returns {string[]}
 */
export function walk(dir) {
  /** @type {string[]} */
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out.sort();
}

/**
 * URL path of a built HTML file. dist/privacy/index.html is /privacy/, dist/404.html is /404.html.
 * @param {string} distDir
 * @param {string} file
 * @returns {string}
 */
export function routeOfHtml(distDir, file) {
  const rel = relative(distDir, file).split(sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel}`;
}

/**
 * Every built page.
 * @param {string} distDir
 * @returns {Array<{ file: string, route: string, slug: string }>}
 */
export function listPages(distDir) {
  return walk(distDir)
    .filter((file) => file.endsWith(".html"))
    .map((file) => {
      const route = routeOfHtml(distDir, file);
      const slug =
        route === "/"
          ? "home"
          : route
              .replace(/\.html$/, "")
              .replace(/^\/|\/$/g, "")
              .replace(/\//g, "-");
      return { file, route, slug };
    });
}
