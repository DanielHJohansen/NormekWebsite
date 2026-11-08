import { describe, expect, it } from "vitest";
import { visiblePrice } from "../../src/lib/offers";
import { homeSectionSchema, offerSchema, pageSchema, workSchema } from "../../src/lib/schemas";

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
  it("defaults to a draft in English", () => {
    const parsed = pageSchema.parse({ title: "Privacy", description: "Text." });
    expect(parsed.draft).toBe(true);
    expect(parsed.lang).toBe("en");
  });

  it("only publishes with an explicit draft: false", () => {
    expect(pageSchema.parse({ title: "Privacy", description: "Text.", draft: false }).draft).toBe(
      false,
    );
  });

  it("accepts a date from YAML", () => {
    const parsed = pageSchema.parse({
      title: "T",
      description: "D",
      updated: new Date("2026-11-08"),
    });
    expect(parsed.updated?.toISOString().slice(0, 10)).toBe("2026-11-08");
  });

  it("rejects a language that is not configured yet", () => {
    expect(pageSchema.safeParse({ title: "T", description: "D", lang: "da" }).success).toBe(false);
  });
});

describe("home sections", () => {
  const section = { id: "process", order: 30, kind: "text", heading: "Heading" };

  it("defaults to a draft with no items", () => {
    const parsed = homeSectionSchema.parse(section);
    expect(parsed.draft).toBe(true);
    expect(parsed.items).toEqual([]);
  });

  it("only accepts kinds that have a component", () => {
    expect(homeSectionSchema.safeParse({ ...section, kind: "carousel" }).success).toBe(false);
    for (const kind of ["hero", "text", "contact"]) {
      expect(homeSectionSchema.safeParse({ ...section, kind }).success).toBe(true);
    }
  });

  it("needs an anchor that is safe in a URL", () => {
    for (const id of ["Process", "1st", "has space", "a/b", "", "with_underscore"]) {
      expect(homeSectionSchema.safeParse({ ...section, id }).success).toBe(false);
    }
    expect(homeSectionSchema.safeParse({ ...section, id: "data-and-ip" }).success).toBe(true);
  });
});

describe("offers: a price renders only when confirmed", () => {
  const offer = { name: "Package", duration: "1 week", summary: "Summary." };

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
});
