import { describe, expect, it } from "vitest";
import {
  hasPlaceholder,
  splitPlaceholders,
  wrapPlaceholdersInHtml,
} from "../../src/lib/placeholders";

describe("splitPlaceholders", () => {
  it("returns the whole text when there is no placeholder", () => {
    expect(splitPlaceholders("No gaps here.")).toEqual([
      { text: "No gaps here.", placeholder: false },
    ]);
  });

  it("splits at every placeholder and keeps the brackets", () => {
    expect(
      splitPlaceholders("I reply within [1 working day, TO CONFIRM] or [TO CONFIRM]."),
    ).toEqual([
      { text: "I reply within ", placeholder: false },
      { text: "[1 working day, TO CONFIRM]", placeholder: true },
      { text: " or ", placeholder: false },
      { text: "[TO CONFIRM]", placeholder: true },
      { text: ".", placeholder: false },
    ]);
  });

  it("treats a [TARGET ...] marker as a placeholder", () => {
    const segments = splitPlaceholders("Aim for [TARGET 2 to 4 weeks] per stage.");
    expect(segments.filter((s) => s.placeholder).map((s) => s.text)).toEqual([
      "[TARGET 2 to 4 weeks]",
    ]);
  });

  it("joins back to the original text", () => {
    const text = "a [x, TO CONFIRM] b [TARGET y] c [not a gap] d";
    expect(
      splitPlaceholders(text)
        .map((s) => s.text)
        .join(""),
    ).toBe(text);
  });

  it("leaves ordinary brackets alone", () => {
    expect(splitPlaceholders("A [note] and [1] here.").every((s) => !s.placeholder)).toBe(true);
  });

  it("does not run two placeholders into one", () => {
    const segments = splitPlaceholders("[TO CONFIRM] and [TO CONFIRM link]");
    expect(segments.filter((s) => s.placeholder)).toHaveLength(2);
  });

  it("returns nothing for empty text", () => {
    expect(splitPlaceholders("")).toEqual([]);
  });
});

describe("hasPlaceholder", () => {
  it("finds a gap and ignores ordinary text", () => {
    expect(hasPlaceholder("Send it [TO CONFIRM]")).toBe(true);
    expect(hasPlaceholder("Send it [soon]")).toBe(false);
    expect(hasPlaceholder("TO CONFIRM without brackets")).toBe(false);
  });
});

describe("wrapPlaceholdersInHtml", () => {
  it("wraps a placeholder in the text of a paragraph", () => {
    expect(wrapPlaceholdersInHtml("<p>I work from [city, TO CONFIRM] today.</p>")).toBe(
      '<p>I work from <span class="tbc">[city, TO CONFIRM]</span> today.</p>',
    );
  });

  it("wraps more than one, also inside other inline elements", () => {
    expect(
      wrapPlaceholdersInHtml("<li><strong>Note</strong> [TO CONFIRM] and <em>[TARGET x]</em></li>"),
    ).toBe(
      '<li><strong>Note</strong> <span class="tbc">[TO CONFIRM]</span> and <em><span class="tbc">[TARGET x]</span></em></li>',
    );
  });

  it("leaves attributes alone", () => {
    const html = '<a href="/x/?q=[TO CONFIRM]" title="[TO CONFIRM]">link</a>';
    expect(wrapPlaceholdersInHtml(html)).toBe(html);
  });

  it("leaves a quoted attribute that holds a greater-than sign alone", () => {
    const html = '<a title="a > b [TO CONFIRM]" href="/">[TO CONFIRM]</a>';
    expect(wrapPlaceholdersInHtml(html)).toBe(
      '<a title="a > b [TO CONFIRM]" href="/"><span class="tbc">[TO CONFIRM]</span></a>',
    );
  });

  it("leaves code and preformatted text alone", () => {
    const html =
      "<p>Use <code>[TO CONFIRM]</code> in code.</p><pre><code>[TO CONFIRM]\n</code></pre>";
    expect(wrapPlaceholdersInHtml(html)).toBe(html);
  });

  it("goes back to wrapping after a code element ends", () => {
    expect(wrapPlaceholdersInHtml("<code>a</code> [TO CONFIRM]")).toBe(
      '<code>a</code> <span class="tbc">[TO CONFIRM]</span>',
    );
  });

  it("leaves comments alone", () => {
    const html = "<!-- [TO CONFIRM] --><p>x</p>";
    expect(wrapPlaceholdersInHtml(html)).toBe(html);
  });

  it("keeps escaped characters escaped", () => {
    expect(wrapPlaceholdersInHtml("<p>[TO CONFIRM, owner&#39;s name] &amp; more</p>")).toBe(
      '<p><span class="tbc">[TO CONFIRM, owner&#39;s name]</span> &amp; more</p>',
    );
  });

  it("changes nothing when there is no placeholder", () => {
    const html = '<h2 id="a">Heading</h2><p>Text with a <a href="/b/">link</a>.</p>';
    expect(wrapPlaceholdersInHtml(html)).toBe(html);
  });

  it("handles an empty string", () => {
    expect(wrapPlaceholdersInHtml("")).toBe("");
  });

  it("keeps the placeholder visible with its brackets, so the launch check still finds it", () => {
    const out = wrapPlaceholdersInHtml("<p>[TO CONFIRM]</p>");
    expect(out).toContain("[TO CONFIRM]");
    expect(hasPlaceholder(out)).toBe(true);
  });
});
