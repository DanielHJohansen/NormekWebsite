/**
 * Navigation is derived from content, so a link can never point at something that is not in the build.
 * These functions take entries that are already filtered with isPublished().
 */
import { homePath, pagePath, splitId } from "./routes";

export interface NavLink {
  readonly label: string;
  readonly href: string;
}

interface SectionLike {
  readonly data: {
    readonly id: string;
    readonly order: number;
    readonly navLabel?: string | undefined;
  };
}

/** Header links: one per home section that sets `navLabel`, in section order. */
export function sectionNav(sections: readonly SectionLike[], locale: string): NavLink[] {
  return [...sections]
    .sort((a, b) => a.data.order - b.data.order)
    .flatMap((section) =>
      section.data.navLabel
        ? [{ label: section.data.navLabel, href: `${homePath(locale)}#${section.data.id}` }]
        : [],
    );
}

interface FooterConfig {
  readonly label: string;
  readonly slug: string;
}

/** Footer links to pages. A page that is not part of the build gets no link. */
export function pageNav(
  config: readonly FooterConfig[],
  pages: readonly { readonly id: string }[],
  locale: string,
): NavLink[] {
  const slugs = new Set(
    pages
      .map((page) => splitId(page.id))
      .filter((id) => id.locale === locale)
      .map((id) => id.slug),
  );
  return config
    .filter((link) => slugs.has(link.slug))
    .map((link) => ({ label: link.label, href: pagePath(locale, link.slug) }));
}
