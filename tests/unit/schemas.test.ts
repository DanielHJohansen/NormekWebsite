import { describe, expect, it } from "vitest";
import { visiblePrice } from "../../src/lib/offers";
import {
  PAGE_LAYOUTS,
  SECTION_KINDS,
  footerSchema,
  formCopySchema,
  homeSectionSchema,
  offerSchema,
  pageSchema,
  workSchema,
} from "../../src/lib/schemas";

const work = {
  title: "Case study",
  summary: "One sentence.",
  client: "anonymous",
};

describe("work: the clearance rule", () => {
  it("fails the build when a case study is published without written clearance", () => {
    for (const clearance of ["none", "pending"] as const) {
      const result = workSchema.safeParse({ ...work, draft: false, clearance });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["clearance"]);
      expect(result.error?.issues[0]?.message).toMatch(/written/);
    }
  });

  it("fails when clearance is missing, because it defaults to none", () => {
    expect(workSchema.safeParse({ ...work, draft: false }).success).toBe(false);
  });

  it("allows a published case study with written clearance", () => {
    expect(workSchema.safeParse({ ...work, draft: false, clearance: "written" }).success).toBe(
      true,
    );
  });

  it("allows a draft at any clearance", () => {
    for (const clearance of ["none", "pending", "written"] as const) {
      expect(workSchema.safeParse({ ...work, draft: true, clearance }).success).toBe(true);
    }
  });

  it("is a draft with no clearance when the front matter says nothing", () => {
    const parsed = workSchema.parse(work);
    expect(parsed.draft).toBe(true);
    expect(parsed.clearance).toBe("none");
    expect(parsed.claims).toEqual([]);
  });

  it("accepts claims ledger ids only", () => {
    expect(workSchema.safeParse({ ...work, claims: ["C-001", "C-014"] }).success).toBe(true);
    expect(workSchema.safeParse({ ...work, claims: ["faster than rivals"] }).success).toBe(false);
  });

  it("rejects an unknown clearance value", () => {
    expect(workSchema.safeParse({ ...work, clearance: "verbal" }).success).toBe(false);
  });
});

describe("pages", () => {
  const page = { title: "Privacy", description: "Text.", layout: "default" };

  it("defaults to a draft in English", () => {
    const parsed = pageSchema.parse(page);
    expect(parsed.draft).toBe(true);
    expect(parsed.lang).toBe("en");
    expect(parsed.noindex).toBe(false);
    expect(parsed.sitemap).toBe(true);
  });

  it("only publishes with an explicit draft: false", () => {
    expect(pageSchema.parse({ ...page, draft: false }).draft).toBe(false);
  });

  it("accepts a date from YAML", () => {
    const parsed = pageSchema.parse({ ...page, updated: new Date("2026-11-08") });
    expect(parsed.updated?.toISOString().slice(0, 10)).toBe("2026-11-08");
  });

  it("rejects a language that is not configured yet", () => {
    expect(pageSchema.safeParse({ ...page, lang: "da" }).success).toBe(false);
  });

  it("knows the four layouts and nothing else", () => {
    expect([...PAGE_LAYOUTS].sort()).toEqual(["default", "legal", "notfound", "thanks"]);
    expect(pageSchema.safeParse({ ...page, layout: "landing" }).success).toBe(false);
    expect(pageSchema.safeParse({ title: "T", description: "D" }).success).toBe(false);
  });

  it("needs the summary and the contents title for the legal layout", () => {
    const legal = {
      ...page,
      layout: "legal",
      heading: "Privacy notice",
      lastUpdated: "Last updated 8 November 2026",
      summaryTitle: "In short",
      summary: ["One point."],
      tocTitle: "On this page",
    };
    expect(pageSchema.safeParse(legal).success).toBe(true);
    expect(pageSchema.safeParse({ ...legal, summary: [] }).success).toBe(false);
    expect(pageSchema.safeParse({ ...legal, tocTitle: undefined }).success).toBe(false);
  });

  it("lets a page stay out of the sitemap and search", () => {
    const parsed = pageSchema.parse({ ...page, noindex: true, sitemap: false });
    expect(parsed.noindex).toBe(true);
    expect(parsed.sitemap).toBe(false);
  });
});

describe("home sections", () => {
  const section = { id: "process", order: 30, kind: "text", heading: "Heading" };

  it("defaults to a draft", () => {
    expect(homeSectionSchema.parse(section).draft).toBe(true);
    expect(homeSectionSchema.parse({ ...section, draft: false }).draft).toBe(false);
  });

  it("has one schema for every kind that has a component", () => {
    const kinds = homeSectionSchema.options.map((option) => option.shape.kind.value);
    expect([...kinds].sort()).toEqual([...SECTION_KINDS].sort());
    expect(homeSectionSchema.safeParse({ ...section, kind: "carousel" }).success).toBe(false);
  });

  it("needs the fields of its kind", () => {
    expect(homeSectionSchema.safeParse({ ...section, kind: "hero" }).success).toBe(false);
    expect(homeSectionSchema.safeParse({ ...section, kind: "problem", cards: [] }).success).toBe(
      false,
    );
    expect(
      homeSectionSchema.safeParse({
        ...section,
        kind: "problem",
        cardLink: "Tell me about this",
        cards: [{ title: "T", text: "Body" }],
      }).success,
    ).toBe(true);
  });

  it("holds exactly three next steps in the contact section", () => {
    const base = { ...section, kind: "contact" };
    const result = homeSectionSchema.safeParse({ ...base, steps: ["a", "b"] });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.join(".") === "steps")).toBe(true);
  });

  it("needs an anchor that is safe in a URL", () => {
    for (const id of ["Process", "1st", "has space", "a/b", "", "with_underscore"]) {
      expect(homeSectionSchema.safeParse({ ...section, id }).success).toBe(false);
    }
    expect(homeSectionSchema.safeParse({ ...section, id: "data-and-ip" }).success).toBe(true);
  });

  it("does not accept an empty heading", () => {
    expect(homeSectionSchema.safeParse({ ...section, heading: "" }).success).toBe(false);
  });
});

describe("the form copy", () => {
  const copy = {
    required: "All fields are required.",
    name: { label: "Name", empty: "Enter your name." },
    email: { label: "Email", empty: "Enter your email.", noAt: "Add an @.", invalid: "Check it." },
    company: { label: "Company", empty: "Enter your company." },
    message: { label: "Message", help: "Help.", tooShort: "Write a little more." },
    honeypot: "Leave this empty",
    summaryTitle: "Fix these fields",
    submit: "Send",
    sending: "Sending...",
    privacy: "Privacy.",
    noscript: "Needs JavaScript.",
    failed: "Not sent.",
    personCheck: "Check failed.",
  };

  it("accepts a complete set of strings", () => {
    expect(formCopySchema.safeParse(copy).success).toBe(true);
  });

  it("fails when a string the script needs is missing", () => {
    expect(formCopySchema.safeParse({ ...copy, sending: undefined }).success).toBe(false);
    expect(formCopySchema.safeParse({ ...copy, email: { label: "Email" } }).success).toBe(false);
  });
});

describe("the footer", () => {
  it("needs facts and links", () => {
    const footer = {
      tagline: "Enclosure design.",
      facts: [{ label: "Company", value: "[TO CONFIRM]" }],
      links: ["{email}"],
      agreement: "Note.",
      copyright: "Copyright.",
    };
    expect(footerSchema.safeParse(footer).success).toBe(true);
    expect(footerSchema.safeParse({ ...footer, facts: [] }).success).toBe(false);
  });
});

describe("offers: a price renders only when confirmed", () => {
  const offer = {
    order: 1,
    name: "Package",
    summary: "Summary.",
    youGet: ["A report."],
    iNeed: ["A board."],
  };

  it("keeps a hypothesis price out of the page", () => {
    const parsed = offerSchema.parse({ ...offer, price: 5000, priceStatus: "hypothesis" });
    expect(parsed.price).toBe(5000);
    expect(visiblePrice(parsed)).toBeNull();
  });

  it("shows a confirmed price", () => {
    const parsed = offerSchema.parse({ ...offer, price: 5000, priceStatus: "confirmed" });
    expect(visiblePrice(parsed)).toBe(5000);
  });

  it("defaults to a hypothesis with no price", () => {
    const parsed = offerSchema.parse(offer);
    expect(parsed.priceStatus).toBe("hypothesis");
    expect(parsed.price).toBeNull();
    expect(visiblePrice(parsed)).toBeNull();
  });

  it("does not allow confirmed without a price", () => {
    expect(offerSchema.safeParse({ ...offer, price: null, priceStatus: "confirmed" }).success).toBe(
      false,
    );
  });

  it("does not allow a negative price", () => {
    expect(offerSchema.safeParse({ ...offer, price: -1 }).success).toBe(false);
  });

  it("holds bullet lists, with at least one item in what you get and what I need", () => {
    expect(offerSchema.safeParse({ ...offer, youGet: [] }).success).toBe(false);
    expect(offerSchema.safeParse({ ...offer, iNeed: [] }).success).toBe(false);
    expect(offerSchema.safeParse({ ...offer, youGet: "A report." }).success).toBe(false);
  });

  it("allows a list of what is not included, but not an empty one", () => {
    expect(offerSchema.safeParse({ ...offer, notIncluded: ["Tooling."] }).success).toBe(true);
    expect(offerSchema.safeParse({ ...offer, notIncluded: [] }).success).toBe(false);
  });
});
