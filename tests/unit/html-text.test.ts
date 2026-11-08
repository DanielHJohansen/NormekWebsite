import { describe, expect, it } from "vitest";
import { mapHtmlText, straightenQuotes, straightenQuotesInHtml } from "../../src/lib/html-text";

describe("mapHtmlText", () => {
  const upper = (text: string) => text.toUpperCase();

  it("changes the text and nothing else", () => {
    expect(mapHtmlText('<p class="a" title="t">one <b>two</b></p>', upper)).toBe(
      '<p class="a" title="t">ONE <b>TWO</b></p>',
    );
  });

  it("leaves comments, code, pre, script, style and textarea alone", () => {
    const html =
      "<!-- c --><p>a <code>b</code></p><pre>c</pre><script>d</script><style>e</style><textarea>f</textarea><p>g</p>";
    expect(mapHtmlText(html, upper)).toBe(
      "<!-- c --><p>A <code>b</code></p><pre>c</pre><script>d</script><style>e</style><textarea>f</textarea><p>G</p>",
    );
  });

  it("copes with a greater-than sign in a quoted attribute", () => {
    expect(mapHtmlText('<a title="a > b" href="/">x</a>', upper)).toBe(
      '<a title="a > b" href="/">X</a>',
    );
  });

  it("does not skip text after a self-closing tag or a stray closing tag", () => {
    expect(mapHtmlText("<br/>a</code>b", upper)).toBe("<br/>A</code>B");
  });

  it("does not call the change for an empty piece", () => {
    const seen: string[] = [];
    mapHtmlText("<p></p><p>x</p>", (text) => {
      seen.push(text);
      return text;
    });
    expect(seen).toEqual(["x"]);
  });
});

describe("straightenQuotes", () => {
  it("puts straight quotes and apostrophes back", () => {
    expect(straightenQuotes("manufacturer’s ‘a’ “b”")).toBe("manufacturer's 'a' \"b\"");
  });

  it("touches nothing else, and leaves dashes alone so the writing rules still show", () => {
    expect(straightenQuotes("2 to 4 weeks – x — y …")).toBe("2 to 4 weeks – x — y …");
  });
});

describe("straightenQuotesInHtml", () => {
  it("changes text but not attributes or code", () => {
    const html = '<p title="it’s">it’s <code>it’s</code></p>';
    expect(straightenQuotesInHtml(html)).toBe('<p title="it’s">it\'s <code>it’s</code></p>');
  });
});
