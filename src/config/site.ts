/**
 * Site-wide facts and the few strings that belong to the page frame. The name lives here only
 * (brand guide section 1), so a rename is one edit plus new logo files. Anything not known yet stays
 * "[TO CONFIRM]" in the content, and the launch check fails while one remains.
 */

export const TO_CONFIRM = "[TO CONFIRM]";

export const SITE = {
  /** Provisional until the name is cleared (CLAUDE.md, "Name risk"). */
  name: "Normek",
  /** Public mailbox. daniel@normek.dk exists (created 2026-11-08). Whether to add hello@ is open (Q18). */
  email: "daniel@normek.dk",
  defaultLocale: "en",
  locales: ["en"],
  /** Title and meta description of the home page, from section 5 of docs/copy/v0-home-copy.md. */
  homeTitle: "Normek: enclosure design for electronics teams",
  description:
    "Enclosure design for electronics teams with no mechanical engineer. Feasibility review, prototypes and manufacturer hand-off by Daniel Hessellund Johansen.",
  /** Matches --color-paper in src/styles/tokens.css. Used for the browser UI colour only. */
  themeColor: "#F4F5F2",
  /**
   * The one primary action. It points at the contact section on the home page.
   * The header uses the short label so logo and button fit side by side at 390 px.
   */
  cta: {
    label: "Request a feasibility review",
    shortLabel: "Request a review",
    href: "/#contact",
    anchor: "#contact",
  },
  skipLinkLabel: "Skip to main content",
} as const;

export type Site = typeof SITE;
