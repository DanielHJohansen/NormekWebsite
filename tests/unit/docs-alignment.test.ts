/**
 * Documents that had drifted from the code (QA-11), and the notes that must not reach a tester (G4).
 * Each one says what the code does today, so a change to the code or the text shows up here.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("tokens.md section 5.7 and the form validation", () => {
  const tokens = read("docs/design/tokens.md");
  const section = tokens.slice(
    tokens.indexOf("### 5.7 Form error summary"),
    tokens.indexOf("### 5.8 Field error"),
  );

  it("says fields are checked when the visitor leaves them and again on submit", () => {
    expect(section).toContain("when the visitor leaves it, and every field on submit");
    expect(section).not.toContain("not on blur");
  });

  it("names the exception that the code makes, focus going straight to the button", () => {
    expect(section).toContain("straight from a field to the submit button");
    expect(read("src/scripts/contact-form.ts")).toContain("relatedTarget === submit");
  });

  it("matches what the script does with a field that shows an error", () => {
    expect(section).toContain("checked again as the visitor types");
    expect(read("src/scripts/contact-form.ts")).toMatch(/addEventListener\("input"/);
  });
});

describe("work-breakdown.md and the fonts", () => {
  const plan = read("docs/plan/work-breakdown.md");
  const row = plan.split("\n").find((line) => line.startsWith("| Fonts |")) ?? "";

  it("budgets three families, as ADR 0001 A11 decided", () => {
    expect(row).toContain("3 families");
    expect(row).not.toContain("at most 2 families");
    expect(row).toContain("A11");
    expect(read("docs/adr/0001-stack-and-hosting.md")).toContain("### A11. Three font families");
  });

  it("names the three families that ship", () => {
    for (const name of ["Barlow Semi Condensed", "IBM Plex Sans", "IBM Plex Mono"])
      expect(row).toContain(name);
    expect(read("src/styles/fonts.css")).toContain('font-family: "IBM Plex Mono"');
  });
});

describe("the message helper and the copy file", () => {
  it("say the same words about the limit", () => {
    expect(read("src/content/home/en/08-contact.md")).toContain("Up to 2,000 characters.");
    expect(read("docs/copy/v0-home-copy.md")).toContain("Up to 2,000 characters.");
  });

  it("match the limit of the field", () => {
    expect(read("src/lib/contact-form.ts")).toMatch(/message: 2000/);
  });
});

describe("placeholders that a tester can see (G4)", () => {
  it("carry no internal notes in the privacy notice", () => {
    const privacy = read("src/content/pages/en/privacy.md");
    for (const note of [
      "Daniel must follow it",
      "incl. campaign code",
      "by browser test, including local",
    ]) {
      expect(privacy, note).not.toContain(note);
    }
    expect(privacy).toContain(
      "**What you type:** name, work email address, company and message [TO CONFIRM].",
    );
    expect(privacy).toContain("**Inquiries in my mailbox:** [TO CONFIRM] after the last message");
  });

  it("are a plain [TO CONFIRM] on the draft page and in the case study template", () => {
    for (const path of [
      "src/content/pages/en/enclosure-design.md",
      "src/content/work/en/example-case-study.md",
    ]) {
      const body = read(path).split(/^---$/m)[2]?.trim();
      expect(body, path).toBe("[TO CONFIRM]");
    }
  });

  it("do not point a tester at an internal document", () => {
    for (const path of [
      "src/content/pages/en/enclosure-design.md",
      "src/content/work/en/example-case-study.md",
      "src/content/pages/en/privacy.md",
    ]) {
      expect(read(path), path).not.toMatch(/docs\/ux|claims ledger|page-briefs/);
    }
  });
});
