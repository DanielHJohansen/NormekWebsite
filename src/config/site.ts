/**
 * Site-wide facts. The name lives here only (brand guide section 1), so a rename is one edit plus
 * new logo files. Anything not known yet stays "[TO CONFIRM]". The launch check fails while one remains.
 */

export const TO_CONFIRM = "[TO CONFIRM]";

export const SITE = {
  /** Provisional until the name is cleared (CLAUDE.md, "Name risk"). */
  name: "Normek",
  /** Public mailbox. daniel@normek.dk exists (created 2026-11-08). Whether to add hello@ is open (Q18). */
  email: "daniel@normek.dk",
  defaultLocale: "en",
  locales: ["en"],
  /** Title and description of the home page, and the fallback description. Real text comes from the copywriter. */
  homeTitle: `${TO_CONFIRM} Home page title`,
  description: `${TO_CONFIRM} Meta description for the home page.`,
  /** Matches --color-paper in src/styles/tokens.css. Used for the browser UI colour only. */
  themeColor: "#F4F5F2",
  /**
   * The one primary action. It points at the contact section on the home page.
   * The header uses the short label so logo and button fit side by side at 390 px.
   */
  cta: { label: "Request a feasibility review", shortLabel: "Request a review", href: "/#contact" },
  /** Shown in the footer. Danish websites that offer services normally must show these (open question 2). */
  company: {
    legalName: TO_CONFIRM,
    legalForm: TO_CONFIRM,
    cvr: TO_CONFIRM,
    address: TO_CONFIRM,
  },
  /**
   * Footer links that point at a page in the `pages` collection. A link whose page is a draft
   * is dropped from the build, so a production footer never links to a missing page.
   */
  footerPages: [{ label: "Privacy", slug: "privacy" }],
} as const;

export type Site = typeof SITE;
