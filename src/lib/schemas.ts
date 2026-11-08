/**
 * Zod schemas for the content collections (docs/plan/work-breakdown.md section 3).
 * They are plain modules with no Astro runtime, so Vitest can test them directly.
 *
 * Draft rule used everywhere: `draft` defaults to true, and only an explicit `draft: false` publishes.
 *
 * Strings can hold a little inline markup (see inline.ts): [label](/path/), **strong**, {email} and
 * [TO CONFIRM] placeholders. Long text goes in the Markdown body of the file instead.
 */
import { z } from "astro/zod";
import { SITE } from "../config/site";

/**
 * Kinds of home page section. Each kind maps to a component in src/components/sections/Section.astro.
 * Add a kind here, its schema below and its component at the same time. The type checker reminds you.
 */
export const SECTION_KINDS = [
  "hero",
  "problem",
  "offers",
  "process",
  "scope",
  "data",
  "about",
  "contact",
  "text",
] as const;

export const CLEARANCE = ["none", "pending", "written"] as const;

export const PRICE_STATUS = ["hypothesis", "confirmed"] as const;

export const PAGE_LAYOUTS = ["default", "legal", "thanks", "notfound"] as const;

const text = z.string().min(1);

// ---------------------------------------------------------------------------------------------
// Home page sections: one Markdown file each in src/content/home/<locale>/.

const sectionBase = {
  /** The anchor, for example "process" for /#process. Also the target of header links. */
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, "Use lowercase letters, digits and hyphens"),
  order: z.number().int().nonnegative(),
  /** Set this to show the section in the header navigation. */
  navLabel: text.optional(),
  /** The small mono label above the heading, for example "01 / Problem". */
  eyebrow: text.optional(),
  heading: text,
  draft: z.boolean().default(true),
};

const heroSection = z.object({
  ...sectionBase,
  kind: z.literal("hero"),
  subhead: text,
  /** The note beside the button. */
  buttonNote: text,
  /** The text of the link under the button. {email} becomes the address. */
  emailLabel: text,
  /** The one-person line. It comes before the button (copy 2.1). */
  byline: text,
  caption: text,
  /** Names the parts of the drawing from the top. The drawing itself carries no text, so it stays readable when scaled. */
  legend: text,
  /** The description of the drawing for people who cannot see it. The caption is not repeated in it. */
  figureAlt: text,
});

const problemSection = z.object({
  ...sectionBase,
  kind: z.literal("problem"),
  /** The link at the bottom of each card. Its accessible name adds the card title. */
  cardLink: text,
  cards: z.array(z.object({ title: text, text })).min(1),
});

const offersSection = z.object({
  ...sectionBase,
  kind: z.literal("offers"),
  /** The paragraph under the heading. The stages come from the offers collection. */
  lead: text,
  labels: z.object({ stage: text, youGet: text, iNeed: text, notIncluded: text }),
});

const processSection = z.object({
  ...sectionBase,
  kind: z.literal("process"),
  /** Each step is a bold lead-in and the rest of the sentence. */
  steps: z.array(z.object({ lead: text, text })).min(1),
});

const scopeSection = z.object({
  ...sectionBase,
  kind: z.literal("scope"),
  takeOnHeading: text,
  takeOn: text,
  notForNowHeading: text,
  notForNow: z.array(text).min(1),
});

const dataSection = z.object({
  ...sectionBase,
  kind: z.literal("data"),
  /** Each item is one inline string that starts with a **bold lead-in**. */
  items: z.array(text).min(1),
  link: text,
});

const aboutSection = z.object({
  ...sectionBase,
  kind: z.literal("about"),
  photoLabel: text,
  /** Each entry is one inline string, for example "{email}". */
  links: z.array(text).min(1),
});

/** The texts of the form, from section 3 of docs/copy/v0-home-copy.md. */
export const formCopySchema = z.object({
  required: text,
  name: z.object({ label: text, empty: text }),
  email: z.object({ label: text, empty: text, noAt: text, invalid: text }),
  company: z.object({ label: text, empty: text }),
  message: z.object({ label: text, help: text, tooShort: text, tooLong: text }),
  honeypot: text,
  summaryTitle: text,
  submit: text,
  sending: text,
  privacy: text,
  /** Shown when JavaScript is off, because the form needs it. */
  noscript: text,
  failed: text,
  personCheck: text,
});

const contactSection = z.object({
  ...sectionBase,
  kind: z.literal("contact"),
  nextStepsHeading: text,
  steps: z.array(text).length(3),
  capacity: text,
  form: formCopySchema,
});

/** A section with a heading and Markdown text only. Used for a future section that stays a draft until it is ready. */
const textSection = z.object({
  ...sectionBase,
  kind: z.literal("text"),
});

export const homeSectionSchema = z.discriminatedUnion("kind", [
  heroSection,
  problemSection,
  offersSection,
  processSection,
  scopeSection,
  dataSection,
  aboutSection,
  contactSection,
  textSection,
]);

// ---------------------------------------------------------------------------------------------
// Pages: one Markdown file each in src/content/pages/<locale>/. The file name becomes the route.

const pageBase = {
  /** The <title>. It is the whole title, with no suffix added. */
  title: text,
  description: text,
  lang: z.enum(SITE.locales).default(SITE.defaultLocale),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(true),
  /** True keeps the page out of search at launch too. Every page is noindex until launch anyway. */
  noindex: z.boolean().default(false),
  /** False keeps the page out of sitemap.xml. */
  sitemap: z.boolean().default(true),
};

export const pageSchema = z.discriminatedUnion("layout", [
  z.object({ ...pageBase, layout: z.literal("default"), heading: text.optional() }),
  /** A long text with a short summary box and a table of contents made from the h2 headings. */
  z.object({
    ...pageBase,
    layout: z.literal("legal"),
    heading: text,
    lastUpdated: text,
    summaryTitle: text,
    summary: z.array(text).min(1),
    tocTitle: text,
  }),
  /** /thanks/. It reads its next steps from the contact section on the home page, so they exist once. */
  z.object({
    ...pageBase,
    layout: z.literal("thanks"),
    heading: text,
    confirmation: text,
    homeLink: text,
  }),
  /** The 404 page. It has no route of its own in the pages collection, src/pages/404.astro renders it. */
  z.object({
    ...pageBase,
    layout: z.literal("notfound"),
    eyebrow: text,
    heading: text,
    lead: text,
    homeLink: text,
    emailLabel: text,
  }),
]);

// ---------------------------------------------------------------------------------------------
// Case studies

/**
 * One file per case study, in src/content/work/<locale>/.
 * Rule: a published case study needs written clearance from the customer or past employer.
 * The build fails otherwise, so work that is not ours to show cannot ship by mistake.
 */
export const workSchema = z
  .object({
    title: text,
    summary: text,
    /** The customer's name, or "anonymous". */
    client: text,
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

// ---------------------------------------------------------------------------------------------
// Offers: one YAML file per stage, in src/content/offers/<locale>/.

export const offerSchema = z
  .object({
    order: z.number().int().nonnegative(),
    name: text,
    summary: text,
    /** Bullet lists. Each item is one inline string. */
    youGet: z.array(text).min(1),
    iNeed: z.array(text).min(1),
    notIncluded: z.array(text).min(1).optional(),
    /** In euros or kroner as decided later. Null means "on request". */
    price: z.number().nonnegative().nullable().default(null),
    /** A price renders only when confirmed. A hypothesis is kept for internal reference. */
    priceStatus: z.enum(PRICE_STATUS).default("hypothesis"),
  })
  .refine((offer) => offer.priceStatus !== "confirmed" || offer.price !== null, {
    path: ["price"],
    message: 'priceStatus "confirmed" needs a price. Use "hypothesis" or give the price.',
  });

// ---------------------------------------------------------------------------------------------
// Site-wide text: src/content/site/<locale>/footer.yaml

export const footerSchema = z.object({
  tagline: text,
  /** Labelled facts such as the legal name. The value is usually a [TO CONFIRM] placeholder. */
  facts: z.array(z.object({ label: text, value: text })).min(1),
  /** Inline strings, for example "{email}" or "[Privacy notice](/privacy/)". */
  links: z.array(text).min(1),
  agreement: text,
  copyright: text,
});

export type HomeSection = z.infer<typeof homeSectionSchema>;
export type SectionOf<K extends HomeSection["kind"]> = Extract<HomeSection, { kind: K }>;
export type PageData = z.infer<typeof pageSchema>;
export type PageOf<L extends PageData["layout"]> = Extract<PageData, { layout: L }>;
export type WorkData = z.infer<typeof workSchema>;
export type OfferData = z.infer<typeof offerSchema>;
export type FooterData = z.infer<typeof footerSchema>;
export type FormCopy = z.infer<typeof formCopySchema>;
