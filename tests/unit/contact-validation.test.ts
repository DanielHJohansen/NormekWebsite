/**
 * CF-07 of docs/security/threat-model-and-requirements.md section 3: field rules.
 * After trim and Unicode NFC. Both edges of every limit. Control characters. A 400 names the fields
 * and never carries a value. A rejected request sends nothing.
 */
import { describe, expect, it } from "vitest";
import { encode, type Fields, readJson, useContactHarness } from "./contact-harness";

const h = useContactHarness();

interface Result {
  status: number;
  body: unknown;
  /** How many calls to Turnstile or Resend this one submission caused. */
  outbound: number;
}

/** Sends a request with these field values and returns what the client would see. */
async function submit(overrides: Fields): Promise<Result> {
  const before = h.calls.length;
  const response = await h.send({ fields: overrides });
  return {
    status: response.status,
    body: await readJson(response),
    outbound: h.calls.length - before,
  };
}

/** A rejected request is answered with the failing fields and causes no Turnstile call and no mail. */
function expectRejected(result: Result, failing: string[]): void {
  expect(result.status).toBe(400);
  expect(result.body).toEqual({ ok: false, error: "validation", fields: failing });
  expect(result.outbound).toBe(0);
}

function expectAccepted(result: Result): void {
  expect(result.status).toBe(200);
  expect(result.body).toEqual({ ok: true });
}

/** The mail of the most recent accepted submission. */
const lastMail = () => h.mails().at(-1);

/** CR, LF, the rest of U+0000 to U+001F, DEL and the two Unicode line separators. */
const CONTROLS: [string, string][] = [
  ["NUL", "\u0000"],
  ["SOH", "\u0001"],
  ["TAB", "\u0009"],
  ["LF", "\u000a"],
  ["VT", "\u000b"],
  ["FF", "\u000c"],
  ["CR", "\u000d"],
  ["ESC", "\u001b"],
  ["US", "\u001f"],
  ["DEL", "\u007f"],
  ["line separator", " "],
  ["paragraph separator", " "],
];

describe("CF-07 name", () => {
  it.each([
    ["is missing", undefined],
    ["is empty", ""],
    ["is only spaces", "     "],
    ["is only a no-break space and an ideographic space", " 　"],
    ["has 101 characters", "n".repeat(101)],
  ])("rejects a name that %s", async (_label, name) => {
    expectRejected(await submit({ name }), ["name"]);
  });

  it.each([
    ["1 character", "A"],
    ["100 characters", "n".repeat(100)],
    ["accented and non-Latin letters", "Søren Ørsted-Åberg 李雷"],
  ])("accepts a name of %s", async (_label, name) => {
    expectAccepted(await submit({ name }));
    expect(lastMail()?.text).toContain(`Name: ${name}\n`);
  });

  it.each(CONTROLS)("rejects %s inside a name", async (_label, control) => {
    expectRejected(await submit({ name: `Ada${control}Example` }), ["name"]);
  });

  it("rejects a line break followed by a header-like line", async () => {
    expectRejected(await submit({ name: "Ada\r\nBcc: eve@example.net" }), ["name"]);
  });

  it("trims surrounding white space, including a trailing line break, before it checks", async () => {
    expectAccepted(await submit({ name: "  \tAda Example\r\n" }));
    expect(lastMail()?.text).toContain("Name: Ada Example\n");
  });

  it("normalizes to NFC before it counts and before it sends", async () => {
    const decomposed = "é".repeat(100);
    expect(decomposed.length).toBe(200);
    expectAccepted(await submit({ name: decomposed }));
    expect(lastMail()?.text).toContain(`Name: ${"é".repeat(100)}\n`);
  });

  it("rejects 101 characters even when they are written in the decomposed form", async () => {
    expectRejected(await submit({ name: "é".repeat(101) }), ["name"]);
  });

  it("counts a character outside the basic plane once", async () => {
    expectAccepted(await submit({ name: "\u{1F4A1}".repeat(100) }));
    expectRejected(await submit({ name: "\u{1F4A1}".repeat(101) }), ["name"]);
  });
});

describe("CF-07 email", () => {
  const rejected = [
    "",
    "ada",
    "ada@",
    "@example.com",
    "ada@example",
    "ada@@example.com",
    "a@b@example.com",
    // Two @ where the first domain would be valid on its own.
    "a@b.co@c.de",
    "ada@example.com@evil.example",
    "ada @example.com",
    "ada@exa mple.com",
    "ada@example.com extra",
    "ada@example.c om",
    "ada@example..com",
    "ada@.example.com",
    "ada@example.com.",
    ".ada@example.com",
    "ada.@example.com",
    "ada..lovelace@example.com",
    "Ada <ada@example.com>",
    "<ada@example.com>",
    "ada@example.com>",
    "ada@example.com,eve@example.net",
    "ada@example.com;eve@example.net",
    '"ada"@example.com',
    "ada(comment)@example.com",
    "ada:lovelace@example.com",
    "ada\\@example.com",
    "ada@[127.0.0.1]",
    "ada@-example.com",
    "ada@example-.com",
    "adå@example.com",
    "ada@exämple.com",
    `${"a".repeat(64)}@${"b".repeat(63)}.${"b".repeat(63)}.${"b".repeat(62)}`,
    "ada@" + "b".repeat(64) + ".com",
  ];

  it("is missing", async () => {
    expectRejected(await submit({ email: undefined }), ["email"]);
  });

  it.each(rejected)("rejects %j", async (email) => {
    expectRejected(await submit({ email }), ["email"]);
  });

  it.each(CONTROLS)("rejects %s inside an address", async (_label, control) => {
    expectRejected(await submit({ email: `ada${control}@example.com` }), ["email"]);
  });

  it("rejects an address followed by an injected header", async () => {
    expectRejected(await submit({ email: "ada@example.com\r\nBcc: eve@example.net" }), ["email"]);
    expectRejected(await submit({ email: "ada@example.com\nSubject: hacked" }), ["email"]);
  });

  it.each([
    "ada@example.com",
    "Ada.Lovelace+tag@sub.example.co.uk",
    "o'brien@example.com",
    "first_last@example.dk",
    "a@b.co",
    "ada@xn--smr-yra.dk",
    "ADA@EXAMPLE.COM",
  ])("accepts %s", async (email) => {
    expectAccepted(await submit({ email }));
    expect(lastMail()?.reply_to).toBe(email);
  });

  it("accepts 254 characters and rejects 255", async () => {
    const at254 = `${"a".repeat(64)}@${"b".repeat(63)}.${"b".repeat(63)}.${"b".repeat(61)}`;
    expect(at254).toHaveLength(254);
    expectAccepted(await submit({ email: at254 }));
    const at255 = `${"a".repeat(64)}@${"b".repeat(63)}.${"b".repeat(63)}.${"b".repeat(62)}`;
    expect(at255).toHaveLength(255);
    expectRejected(await submit({ email: at255 }), ["email"]);
  });

  it("trims surrounding white space", async () => {
    expectAccepted(await submit({ email: "  ada@example.com\n" }));
    expect(lastMail()?.reply_to).toBe("ada@example.com");
  });
});

describe("CF-07 company", () => {
  it.each([
    ["is missing", undefined],
    ["is empty", ""],
    ["is only spaces", "   "],
  ])("accepts a company that %s and says so in the mail", async (_label, company) => {
    expectAccepted(await submit({ company }));
    expect(lastMail()?.text).toContain("Company: (not given)\n");
  });

  it.each([
    ["1 character", "A"],
    ["120 characters", "c".repeat(120)],
  ])("accepts a company of %s", async (_label, company) => {
    expectAccepted(await submit({ company }));
    expect(lastMail()?.text).toContain(`Company: ${company}\n`);
  });

  it("rejects 121 characters", async () => {
    expectRejected(await submit({ company: "c".repeat(121) }), ["company"]);
  });

  it.each(CONTROLS)("rejects %s inside a company", async (_label, control) => {
    expectRejected(await submit({ company: `Example${control}AB` }), ["company"]);
  });
});

describe("CF-07 message", () => {
  const sentence = "x".repeat(20);

  it("is missing", async () => {
    expectRejected(await submit({ message: undefined }), ["message"]);
  });

  it.each([
    ["is empty", ""],
    ["has 19 characters", "x".repeat(19)],
    ["has 19 characters and trailing spaces", `${"x".repeat(19)}${" ".repeat(30)}`],
    ["has 19 characters and trailing line breaks", `${"x".repeat(19)}\r\n\r\n`],
    ["has 5001 characters", "x".repeat(5001)],
  ])("rejects a message that %s", async (_label, message) => {
    expectRejected(await submit({ message }), ["message"]);
  });

  it.each([
    ["20 characters", sentence],
    ["5000 characters", "x".repeat(5000)],
    ["20 characters between spaces", `   ${sentence}   `],
  ])("accepts a message of %s", async (_label, message) => {
    expectAccepted(await submit({ message }));
    expect(lastMail()?.text.endsWith(`Message:\n${message.trim()}`)).toBe(true);
  });

  it("counts a character outside the basic plane once", async () => {
    expectRejected(await submit({ message: "\u{1F4A1}".repeat(19) }), ["message"]);
    expectAccepted(await submit({ message: "\u{1F4A1}".repeat(20) }));
  });

  it("allows line feeds and tabs", async () => {
    const message = "First line of the request.\n\tSecond line, indented.\n\nFourth line.";
    expectAccepted(await submit({ message }));
    expect(lastMail()?.text.endsWith(`Message:\n${message}`)).toBe(true);
  });

  it("turns CRLF into LF, as a browser submits line breaks", async () => {
    expectAccepted(
      await submit({ message: "First line of text.\r\nSecond line of text.\r\nThird." }),
    );
    const text = lastMail()?.text ?? "";
    expect(text.endsWith("First line of text.\nSecond line of text.\nThird.")).toBe(true);
    expect(text).not.toContain("\r");
  });

  it("counts the length after CRLF has become LF", async () => {
    // 900 lines of 6 characters on the wire (5400), 5 after normalization (4499 once trimmed).
    expectAccepted(await submit({ message: "aaaa\r\n".repeat(900) }));
  });

  it("rejects a lone carriage return", async () => {
    expectRejected(await submit({ message: "First line of text.\rSecond line of text." }), [
      "message",
    ]);
  });

  it.each(CONTROLS.filter(([label]) => label !== "TAB" && label !== "LF"))(
    "rejects %s inside a message",
    async (_label, control) => {
      expectRejected(await submit({ message: `First part of text.${control}Second part.` }), [
        "message",
      ]);
    },
  );
});

describe("CF-07 the 400 body", () => {
  it("lists every failing field in the order of the form, whatever order they were sent in", async () => {
    const bad = {
      name: "",
      email: "nope",
      company: "c".repeat(121),
      message: "short",
      website: "",
      "cf-turnstile-response": "fake-turnstile-token",
    };
    const reversed = encode(Object.entries(bad).reverse());
    const response = await h.send({ body: reversed });
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "validation",
      fields: ["name", "email", "company", "message"],
    });
  });

  it("names only the failing fields", async () => {
    expectRejected(await submit({ email: "nope" }), ["email"]);
    expectRejected(await submit({ name: "", message: "short" }), ["name", "message"]);
  });

  it("never carries a submitted value", async () => {
    const response = await h.send({
      fields: {
        name: `SENTINEL-name-${"n".repeat(101)}`,
        email: "SENTINEL-email-without-at-sign",
        company: `SENTINEL-company-${"c".repeat(121)}`,
        message: "SENTINEL-message",
        "cf-turnstile-response": "SENTINEL-token",
      },
    });
    const text = await response.text();
    expect(response.status).toBe(400);
    expect(text).not.toContain("SENTINEL");
    expect(JSON.parse(text)).toEqual({
      ok: false,
      error: "validation",
      fields: ["name", "email", "company", "message"],
    });
  });

  it("is answered before Turnstile is asked, even when the token is fine", async () => {
    expectRejected(
      await submit({ email: "nope", "cf-turnstile-response": "fake-turnstile-token" }),
      ["email"],
    );
    expect(h.siteverifyCalls()).toEqual([]);
  });
});
