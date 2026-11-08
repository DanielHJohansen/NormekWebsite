/**
 * Zod schemas for the content collections (docs/plan/work-breakdown.md section 3).
 * They are plain modules with no Astro runtime, so Vitest can test them directly.
 *
 * Draft rule used everywhere: `draft` defaults to true, and only an explicit `draft: false` publishes.
 */
import { z } from "astro/zod";
import { SITE } from "../config/site";

/**
 * Kinds of home page section. Each kind maps to a component in src/components/sections/index.ts.
 * Add a kind here and a component there at the same time.
 */
export const SECTION_KINDS = ["hero", "text", "contact"] as const;

export const CLEARANCE = ["none", "pending", "written"] as const;

export const PRICE_STATUS = ["hypothesis", "confirmed"] as const;

const cta = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const item = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

/** One file per home page section, in src/content/home/<locale>/. */
export const homeSectionSchema = z.object({
  /** The anchor, for example "process" for /#process. Also the target of header links. */
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, "Use lowercase letters, digits and hyphens"),
  order: z.number().int().nonnegative(),
  kind: z.enum(SECTION_KINDS),
  /** Set this to show the section in the header navigation. */
  navLabel: z.string().min(1).optional(),
  eyebrow: z.string().min(1).optional(),
  heading: z.string().min(1),
  lead: z.string().min(1).optional(),
  cta: cta.optional(),
  items: z.array(item).default([]),
  draft: z.boolean().default(true),
});

/** One file per page, in src/content/pages/<locale>/. The file name becomes the route. */
export const pageSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  lang: z.enum(SITE.locales).default(SITE.defaultLocale),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(true),
});

/**
 * One file per case study, in src/content/work/<locale>/.
 * Rule: a published case study needs written clearance from the customer or past employer.
 * The build fails otherwise, so work that is not ours to show cannot ship by mistake.
 */
export const workSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    /** The customer's name, or "anonymous". */
    client: z.string().min(1),
    clearance: z.enum(CLEARANCE).default("none"),
    /** Ids of rows in docs/claims-ledger.md, for example C-001. */
    claims: z
      .array(z.string().regex(/^C-\d{3,}$/, "Use a claims ledger id such as C-001"))
      .default([]),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(true),
  })
  .refine((work) => work.draft || work.clearance === "written", {
    path: ["clearance"],
    message:
      'A published case study (draft: false) needs clearance: "written". Keep draft: true until the customer or past employer has agreed in writing.',
  });

/** One YAML file per package, in src/content/offers/<locale>/. */
export const offerSchema = z
  .object({
    name: z.string().min(1),
    duration: z.string().min(1),
    summary: z.string().min(1),
    includes: z.array(z.string().min(1)).default([]),
    /** In euros or kroner as decided later. Null means "on request". */
    price: z.number().nonnegative().nullable().default(null),
    /** A price renders only when confirmed. A hypothesis is kept for internal reference. */
    priceStatus: z.enum(PRICE_STATUS).default("hypothesis"),
    order: z.number().int().nonnegative().default(100),
  })
  .refine((offer) => offer.priceStatus !== "confirmed" || offer.price !== null, {
    path: ["price"],
    message: 'priceStatus "confirmed" needs a price. Use "hypothesis" or give the price.',
  });

export type HomeSection = z.infer<typeof homeSectionSchema>;
export type PageData = z.infer<typeof pageSchema>;
export type WorkData = z.infer<typeof workSchema>;
export type OfferData = z.infer<typeof offerSchema>;
