import { afterEach, describe, expect, it, vi } from "vitest";
import { isDraft, isVisible } from "../../src/lib/drafts";
import { envFlag, readFlags } from "../../src/lib/flags";

const entry = (draft?: boolean) => ({ data: { draft } });

describe("isDraft", () => {
  it("treats only an explicit draft: false as published", () => {
    expect(isDraft(entry(false))).toBe(false);
    expect(isDraft(entry(true))).toBe(true);
  });

  it("fails safe when the flag is missing", () => {
    expect(isDraft({ data: {} })).toBe(true);
    expect(isDraft(entry(undefined))).toBe(true);
  });
});

describe("isVisible", () => {
  it("drops drafts in production and keeps published entries", () => {
    expect(isVisible(entry(true), false)).toBe(false);
    expect(isVisible(entry(false), false)).toBe(true);
  });

  it("keeps drafts in the private preview", () => {
    expect(isVisible(entry(true), true)).toBe(true);
    expect(isVisible(entry(false), true)).toBe(true);
  });
});

describe("envFlag", () => {
  it("turns on only for the exact strings true and 1", () => {
    expect(envFlag("true")).toBe(true);
    expect(envFlag("1")).toBe(true);
    expect(envFlag(true)).toBe(true);
  });

  it("stays off for anything else, including typos", () => {
    for (const value of [undefined, "", "false", "0", "TRUE", "yes", "ture", " true", null, 1]) {
      expect(envFlag(value)).toBe(false);
    }
  });
});

describe("readFlags", () => {
  it("reads both flags", () => {
    expect(readFlags({ PUBLIC_INDEXABLE: "true", SHOW_DRAFTS: "false" })).toEqual({
      indexable: true,
      showDrafts: false,
    });
    expect(readFlags({ SHOW_DRAFTS: "true" })).toEqual({ indexable: false, showDrafts: true });
    expect(readFlags({})).toEqual({ indexable: false, showDrafts: false });
  });

  it("refuses drafts that are also indexable", () => {
    expect(() => readFlags({ PUBLIC_INDEXABLE: "true", SHOW_DRAFTS: "true" })).toThrow(
      /must not be set together/,
    );
  });
});

// isPublished reads the flags from the environment when the module loads, so each case loads it fresh.
describe("isPublished with the real environment", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("drops drafts when SHOW_DRAFTS is not set (production)", async () => {
    vi.stubEnv("SHOW_DRAFTS", "");
    vi.stubEnv("PUBLIC_INDEXABLE", "");
    vi.resetModules();
    const { isPublished } = await import("../../src/lib/drafts");
    expect(isPublished(entry(true))).toBe(false);
    expect(isPublished(entry(false))).toBe(true);
  });

  it("keeps drafts when SHOW_DRAFTS=true (private preview)", async () => {
    vi.stubEnv("SHOW_DRAFTS", "true");
    vi.stubEnv("PUBLIC_INDEXABLE", "");
    vi.resetModules();
    const { isPublished } = await import("../../src/lib/drafts");
    expect(isPublished(entry(true))).toBe(true);
  });

  it("stops the build when drafts and launch mode are both on", async () => {
    vi.stubEnv("SHOW_DRAFTS", "true");
    vi.stubEnv("PUBLIC_INDEXABLE", "true");
    vi.resetModules();
    await expect(import("../../src/lib/drafts")).rejects.toThrow(/must not be set together/);
  });

  it("is safe to pass straight to getCollection, which may call it with more than one argument", async () => {
    vi.stubEnv("SHOW_DRAFTS", "");
    vi.resetModules();
    const { isPublished } = await import("../../src/lib/drafts");
    const filter = isPublished as (...args: unknown[]) => boolean;
    expect(filter(entry(true), 1, [])).toBe(false);
  });
});
