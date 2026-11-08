import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  footerSchema,
  homeSectionSchema,
  offerSchema,
  pageSchema,
  workSchema,
} from "./lib/schemas";

/*
 * Every collection has one folder per locale (en/ now, da/ later).
 * `draft` defaults to true in the schemas, so nothing publishes without an explicit `draft: false`.
 */

const home = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/home" }),
  schema: homeSectionSchema,
});

const offers = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/offers" }),
  schema: offerSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: pageSchema,
});

const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: workSchema,
});

const site = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/site" }),
  schema: footerSchema,
});

export const collections = { home, offers, pages, work, site };
