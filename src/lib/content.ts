/**
 * Reads the content collections. Every read goes through isPublished(), so a draft is either
 * absent (production) or marked (private preview). Pages must not call getCollection() directly.
 */
import { getCollection, getEntry } from "astro:content";
import { SITE } from "../config/site";
import { isPublished } from "./drafts";
import { splitId } from "./routes";

const sameLocale = (locale: string) => (entry: { id: string }) =>
  splitId(entry.id).locale === locale;

export async function getHomeSections(locale: string = SITE.defaultLocale) {
  const entries = await getCollection("home", (e) => isPublished(e) && sameLocale(locale)(e));
  return entries.sort((a, b) => a.data.order - b.data.order);
}

export async function getPages(locale: string = SITE.defaultLocale) {
  return getCollection("pages", (e) => isPublished(e) && sameLocale(locale)(e));
}

export async function getWork(locale: string = SITE.defaultLocale) {
  return getCollection("work", (e) => isPublished(e) && sameLocale(locale)(e));
}

export async function getOffers(locale: string = SITE.defaultLocale) {
  const entries = await getCollection("offers", sameLocale(locale));
  return entries.sort((a, b) => a.data.order - b.data.order);
}

/** The footer text. It is part of every page, so a missing file stops the build. */
export async function getFooter(locale: string = SITE.defaultLocale) {
  const entry = await getEntry("site", `${locale}/footer`);
  if (!entry) throw new Error(`Missing src/content/site/${locale}/footer.yaml`);
  return entry.data;
}
