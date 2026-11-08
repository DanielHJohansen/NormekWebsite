import { describe, expect, it } from "vitest";
import { bindShortWords, isSafeHref, parseInline, plainText } from "../../src/lib/inline";

describe("parseInline", () => {
  it("returns one text token for plain text", () => {
    expect(parseInline("Plain words.")).toEqual([{ type: "text", text: "Plain words." }]);
  });

  it("parses strong text", () => {
    expect(parseInline("**No file upload.** Describe it in words.")).toEqual([
      { type: "strong", text: "No file upload." },
      { type: "text", text: " Describe it in words." },
    ]);
  });

  it("parses a link", () => {
    expect(parseInline("Read the [privacy notice](/privacy/).")).toEqual([
      { type: "text", text: "Read the " },
      { type: "link", text: "privacy notice", href: "/privacy/" },
      { type: "text", text: "." },
    ]);
  });

  it("parses the address as a link and as plain text", () => {
    expect(parseInline("Mail {email} or say {email-text}")).toEqual([
      { type: "text", text: "Mail " },
      { type: "email", link: true },
      { type: "text", text: " or say " },
      { type: "email", link: false },
    ]);
  });

  it("lets a placeholder win over the link syntax", () => {
    expect(parseInline("LinkedIn [TO CONFIRM link]")).toEqual([
      { type: "text", text: "LinkedIn " },
      { type: "placeholder", text: "[TO CONFIRM link]" },
    ]);
  });

  it("finds a placeholder with a comma and spaces in it", () => {
    const tokens = parseInline("within [1 working day, TO CONFIRM].");
    expect(tokens.find((t) => t.type === "placeholder")).toEqual({
      type: "placeholder",
      text: "[1 working day, TO CONFIRM]",
    });
  });

  it("handles every kind in one string", () => {
    const types = parseInline("**Lead** [a](/b/) {email} [TO CONFIRM] end").map((t) => t.type);
    expect(types).toEqual([
      "strong",
      "text",
      "link",
      "text",
      "email",
      "text",
      "placeholder",
      "text",
    ]);
  });

  it("never produces markup from angle brackets", () => {
    const tokens = parseInline("<script>alert(1)</script> **<b>x</b>**");
    expect(tokens.every((t) => t.type === "text" || t.type === "strong")).toBe(true);
    expect(tokens[0]).toEqual({ type: "text", text: "<script>alert(1)</script> " });
  });

  it("refuses a link that is not safe", () => {
    expect(() => parseInline("[click](javascript:alert(1))")).toThrow(/Unsafe link/);
    expect(() => parseInline("[click](//evil.example/)")).toThrow(/Unsafe link/);
    expect(() => parseInline("[click](data:text/html,x)")).toThrow(/Unsafe link/);
    expect(() => parseInline("[click](http://plain.example/)")).toThrow(/Unsafe link/);
  });
});

describe("isSafeHref", () => {
  it("allows the site, anchors, mail and https", () => {
    for (const href of [
      "/",
      "/privacy/",
      "#contact",
      "/#contact",
      "mailto:a@b.dk",
      "https://x.dk/",
    ]) {
      expect(isSafeHref(href)).toBe(true);
    }
  });

  it("refuses anything else", () => {
    for (const href of [
      "javascript:x",
      "//host/",
      "http://x.dk",
      "data:text/plain,a",
      "ftp://x",
      "vbscript:x",
      "",
    ]) {
      expect(isSafeHref(href)).toBe(false);
    }
  });
});

describe("plainText", () => {
  it("drops the markup and writes the address", () => {
    expect(plainText("Or email {email}", "daniel@normek.dk")).toBe("Or email daniel@normek.dk");
    expect(plainText("**Strong** and [a link](/x/)", "x@y.dk")).toBe("Strong and a link");
  });

  it("keeps a placeholder with its brackets", () => {
    expect(plainText("Soon [TO CONFIRM]", "x@y.dk")).toBe("Soon [TO CONFIRM]");
  });
});

describe("bindShortWords", () => {
  const nbsp = "\u00A0";

  it("binds I and a to the word after them", () => {
    expect(bindShortWords("Your board works. I design the box.")).toBe(
      `Your board works. I${nbsp}design the box.`,
    );
    expect(bindShortWords("I work alone. a box and A box")).toBe(
      `I${nbsp}work alone. a${nbsp}box and A${nbsp}box`,
    );
  });

  it("binds after an opening bracket too", () => {
    expect(bindShortWords("(a box)")).toBe(`(a${nbsp}box)`);
  });

  it("leaves other words alone, also words that end or start with those letters", () => {
    for (const text of ["Ia and", "data box", "Ada is here", "Italy", "mal a", "ai x"]) {
      expect(bindShortWords(text).replace(/\u00A0/g, " ")).toBe(text);
    }
    expect(bindShortWords("data box")).toBe("data box");
    expect(bindShortWords("Ada box")).toBe("Ada box");
  });

  it("does nothing at the end of the text, where there is no next word", () => {
    expect(bindShortWords("Plan a ")).toBe("Plan a ");
    expect(bindShortWords("a")).toBe("a");
  });

  it("changes no word and no letter", () => {
    const text = "I work alone. I am a mechanical engineer. A box.";
    expect(bindShortWords(text).replace(/\u00A0/g, " ")).toBe(text);
  });
});
