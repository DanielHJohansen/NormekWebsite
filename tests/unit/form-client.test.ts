/**
 * The rules of the contact form in the browser (src/lib/contact-form.ts). The server repeats every rule
 * (functions/_lib/validate.ts), so one test here checks that the two agree on addresses.
 */
import { describe, expect, it } from "vitest";
import {
  FIELD_NAMES,
  LIMITS,
  MAX_BODY_BYTES,
  MIN_MESSAGE_LENGTH,
  REQUEST_TIMEOUT_MS,
  encodeBody,
  encodedByteLength,
  errorForServerField,
  fitsBodyLimit,
  interpretResponse,
  messageKey,
  normalizeValue,
  validateAll,
  validateField,
  validateFieldIn,
  type FieldName,
  type FieldValues,
} from "../../src/lib/contact-form";
import type { FormField } from "../../functions/_lib/form";
import { MAX_BODY_BYTES as SERVER_MAX_BODY_BYTES } from "../../functions/_lib/form";
import { isValidEmail, validateInquiry } from "../../functions/_lib/validate";

const goodMessage = "I need a housing for a sensor board with an antenna.";

const good: FieldValues = {
  name: "Ada Lovelace",
  email: "ada@example.dk",
  company: "Analytical Engines ApS",
  message: goodMessage,
};

describe("normalizeValue", () => {
  it("trims and turns the Unicode form into NFC", () => {
    expect(normalizeValue("name", "  Ada  ")).toBe("Ada");
    expect(normalizeValue("name", "e\u0301")).toBe("\u00e9");
    expect(Array.from(normalizeValue("name", "e\u0301"))).toHaveLength(1);
  });

  it("replaces a control character with a space, so a stray tab from a paste does not fail a send", () => {
    expect(normalizeValue("name", "Ada\tLovelace")).toBe("Ada Lovelace");
    expect(normalizeValue("company", "A\u0000B\u0007C\u007fD")).toBe("A B C D");
    expect(normalizeValue("name", "a\u2028b\u2029c")).toBe("a b c");
  });

  it("keeps the line breaks and tabs of a message, and turns CRLF and CR into LF", () => {
    expect(normalizeValue("message", "a\r\nb\rc\td")).toBe("a\nb\nc\td");
  });

  it("still replaces the other control characters in a message", () => {
    expect(normalizeValue("message", "a\u0000b\u001bc\u007fd\u2028e")).toBe("a b c d e");
  });

  it("turns a line break in a single line field into a space", () => {
    expect(normalizeValue("name", "Ada\nLovelace")).toBe("Ada Lovelace");
    expect(normalizeValue("email", "ada@example.dk\r\n")).toBe("ada@example.dk");
  });

  it("does not change an ordinary value", () => {
    expect(normalizeValue("name", "Søren Æbelø")).toBe("Søren Æbelø");
  });
});

/** Characters are built from code points, so the source holds no invisible characters. */
const char = (codePoint: number): string => String.fromCodePoint(codePoint);
const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_unused, index) => from + index);

/** What the function refuses besides the C0 controls (F2 of the security review). */
const C1 = range(0x80, 0x9f);
const BIDI = [...range(0x202a, 0x202e), ...range(0x2066, 0x2069)];

describe("normalizeValue: C1 controls and bidi controls (F2)", () => {
  const FIELDS_WITH_TEXT = ["name", "company"] as const;

  it("replaces every C1 control, DEL and every bidi control with a space in all four fields", () => {
    for (const codePoint of [0x7f, ...C1, ...BIDI]) {
      const hit = char(codePoint);
      const label = "U+" + codePoint.toString(16).toUpperCase();
      for (const field of FIELD_NAMES) {
        const out = normalizeValue(field, "Ab" + hit + "Cd");
        expect(out, field + " " + label).toBe("Ab Cd");
      }
    }
  });

  it("keeps them out of a message too, which only keeps its line breaks and tabs", () => {
    const hits = [0x85, 0x202e, 0x2066].map(char).join("");
    expect(normalizeValue("message", "one\n" + hits + "two\tthree")).toBe("one\n   two\tthree");
  });

  it("leaves a value that is nothing else empty, so the field gets its error", () => {
    const only = [...C1, ...BIDI].map(char).join("");
    for (const field of FIELDS_WITH_TEXT) {
      expect(normalizeValue(field, only)).toBe("");
      expect(validateField(field, only)).toBe("empty");
    }
    expect(validateField("email", only)).toBe("empty");
    expect(validateField("message", only)).toBe("too-short");
  });

  it("makes an address that held one invalid, so it is not sent as it was typed", () => {
    for (const codePoint of [0x85, 0x9f, 0x202e, 0x2066]) {
      expect(validateField("email", "ada" + char(codePoint) + "@example.dk")).toBe("invalid");
      expect(validateField("email", "ada@exam" + char(codePoint) + "ple.dk")).toBe("invalid");
    }
  });

  it("does not let one reach the request body", () => {
    const hits = [0x85, 0x202e, 0x2066, 0x2069].map(char).join("");
    const body = new URLSearchParams(
      encodeBody(
        {
          name: "Ada" + hits,
          email: "ada@example.dk",
          company: hits + "Co",
          message: "x".repeat(20) + hits,
        },
        "",
        "t",
      ),
    );
    for (const field of FIELD_NAMES) {
      const value = body.get(field) ?? "";
      expect(
        Array.from(value).some((c) => BIDI.includes(c.codePointAt(0) ?? 0)),
        field,
      ).toBe(false);
      expect(
        Array.from(value).some((c) => C1.includes(c.codePointAt(0) ?? 0)),
        field,
      ).toBe(false);
    }
  });

  it("keeps the characters the function accepts, such as direction marks, joiners and letters", () => {
    const keep = [
      0x00a0, // no-break space
      0x200c, // zero width non-joiner
      0x200d, // zero width joiner
      0x200e, // left-to-right mark
      0x200f, // right-to-left mark
      0xfeff, // byte order mark
      0x00e6, // ae
      0x05d0, // Hebrew alef
      0x0627, // Arabic alef
      0x6f22, // a Chinese character
      0x1f600, // an emoji
    ];
    for (const codePoint of keep) {
      const hit = char(codePoint);
      for (const field of FIELD_NAMES) {
        expect(
          Array.from(normalizeValue(field, "Ab" + hit + "Cd")),
          "U+" + codePoint.toString(16),
        ).toContain(hit);
      }
    }
  });

  it("never sends the function a character it refuses, for every character in the likely ranges", () => {
    // A sweep over code points: whatever the browser sends, the function must not refuse it for a character.
    const sweep = [
      ...range(0x0000, 0x02ff),
      ...range(0x2000, 0x206f),
      ...range(0xfe00, 0xfe0f),
      ...range(0xfff0, 0xffff),
      0x1f600,
      0xe0001,
    ];
    const mismatches: string[] = [];
    for (const codePoint of sweep) {
      const hit = char(codePoint);
      const values: FieldValues = {
        name: "Ab" + hit + "Cd",
        email: "ada@example.dk",
        company: "Ab" + hit + "Cd",
        message: "x".repeat(20) + hit + "yz",
      };
      const cleaned = Object.fromEntries(
        FIELD_NAMES.map((field) => [field, normalizeValue(field, values[field])]),
      ) as Record<FieldName, string>;
      const answer = validateInquiry(
        new Map<FormField, string>(FIELD_NAMES.map((field) => [field, cleaned[field]])),
      );
      if (answer.ok) continue;
      for (const field of answer.fields) {
        // The function refused a value that the browser's own check let through: the two rules differ.
        if (validateField(field, cleaned[field]) === null) {
          mismatches.push(field + " U+" + codePoint.toString(16).toUpperCase());
        }
      }
    }
    expect(mismatches).toEqual([]);
  });
});

describe("the size of the request (F6)", () => {
  const cjk = char(0x6f22); // three bytes in UTF-8, nine characters once percent encoded
  const withMessage = (message: string): FieldValues => ({ ...good, message });

  it("has the function's limit", () => {
    expect(MAX_BODY_BYTES).toBe(16_384);
    expect(MAX_BODY_BYTES).toBe(SERVER_MAX_BODY_BYTES);
  });

  it("counts bytes, not characters", () => {
    expect(encodedByteLength("abc")).toBe(3);
    expect(encodedByteLength(cjk)).toBe(3);
    expect(encodedByteLength(char(0x1f600))).toBe(4);
    expect(encodedByteLength("")).toBe(0);
  });

  it("encodes each byte of a character outside ASCII as three characters", () => {
    expect(encodeBody(withMessage(cjk.repeat(20)), "", "t")).toContain("%E6%BC%A2".repeat(20));
  });

  it("fits a message at its longest in ASCII, with line breaks too", () => {
    expect(fitsBodyLimit(withMessage("x".repeat(2000)))).toBe(true);
    expect(fitsBodyLimit(withMessage("x\n".repeat(1000)))).toBe(true);
  });

  it("fits 2,000 characters of a script that takes two bytes, such as Danish, Greek or Cyrillic", () => {
    expect(fitsBodyLimit(withMessage(char(0x00f8).repeat(2000)))).toBe(true);
    expect(fitsBodyLimit(withMessage(char(0x0436).repeat(2000)))).toBe(true);
  });

  it("fits as many emoji as the field takes, which is 1,000, because each is two UTF-16 units", () => {
    expect(fitsBodyLimit(withMessage(char(0x1f600).repeat(1000)))).toBe(true);
  });

  it("does not fit a long message in a script that takes three bytes, such as Chinese or Japanese", () => {
    expect(fitsBodyLimit(withMessage(cjk.repeat(2000)))).toBe(false);
    expect(fitsBodyLimit(withMessage(cjk.repeat(1000)))).toBe(true);
  });

  it("stops exactly where the body passes 16,384 bytes, counting a token of 2,048 characters", () => {
    const size = (count: number): number =>
      encodedByteLength(encodeBody(withMessage(cjk.repeat(count)), "", "x".repeat(2048)));
    let count = 1000;
    while (size(count + 1) <= MAX_BODY_BYTES) count += 1;
    expect(size(count)).toBeLessThanOrEqual(MAX_BODY_BYTES);
    expect(size(count + 1)).toBeGreaterThan(MAX_BODY_BYTES);
    expect(fitsBodyLimit(withMessage(cjk.repeat(count)))).toBe(true);
    expect(fitsBodyLimit(withMessage(cjk.repeat(count + 1)))).toBe(false);
  });

  it("counts the token before there is one, so the check can come first", () => {
    const withShortToken = (count: number): number =>
      encodedByteLength(encodeBody(withMessage(cjk.repeat(count)), "", "t"));
    let count = 1000;
    while (withShortToken(count + 1) <= MAX_BODY_BYTES) count += 1;
    // This message fits with a one character token and would not fit with a token of 2,048.
    expect(withShortToken(count)).toBeLessThanOrEqual(MAX_BODY_BYTES);
    expect(fitsBodyLimit(withMessage(cjk.repeat(count)))).toBe(false);
  });

  it("gives the message the error, in the form and not on its own", () => {
    const long = withMessage(cjk.repeat(2000));
    expect(validateFieldIn("message", long)).toBe("too-long");
    expect(validateAll(long)).toEqual({ message: "too-long" });
    // On its own the message is fine. Only the whole request is too big.
    expect(validateField("message", long.message)).toBeNull();
  });

  it("gives another field its own error and never the size error", () => {
    const long = { ...withMessage(cjk.repeat(2000)), name: "" };
    expect(validateFieldIn("name", long)).toBe("empty");
    expect(validateFieldIn("company", long)).toBeNull();
    expect(validateAll(long)).toEqual({ name: "empty", message: "too-long" });
  });

  it("lets a message that is too short keep that error", () => {
    expect(validateAll(withMessage("short"))).toEqual({ message: "too-short" });
  });

  it("passes a good form", () => {
    expect(validateAll(good)).toEqual({});
  });

  it("names the text to show for it", () => {
    expect(messageKey("message", "too-long")).toBe("message.too-long");
    expect(messageKey("message", "too-short")).toBe("message.too-short");
  });
});

describe("validateField: name and company", () => {
  it("needs something", () => {
    for (const field of ["name", "company"] as const) {
      expect(validateField(field, "")).toBe("empty");
      expect(validateField(field, "   \t\n ")).toBe("empty");
      expect(validateField(field, "x")).toBeNull();
    }
  });

  it("counts a value made only of control characters as empty", () => {
    expect(validateField("name", "\u0000\u0001\u0002")).toBe("empty");
  });
});

describe("validateField: email", () => {
  it("reports empty, a missing @ and an invalid address as three different cases", () => {
    expect(validateField("email", "")).toBe("empty");
    expect(validateField("email", "   ")).toBe("empty");
    expect(validateField("email", "ada.example.dk")).toBe("no-at");
    expect(validateField("email", "ada@@example.dk")).toBe("invalid");
    expect(validateField("email", "a@b@example.dk")).toBe("invalid");
  });

  it("accepts ordinary addresses", () => {
    for (const email of [
      "ada@example.dk",
      "ada.lovelace@example.dk",
      "ada+enclosure@sub.example.co.uk",
      "o'brien@example.ie",
      "a@b.c",
      "x_y-z@my-domain.example",
      "1@2.3",
    ]) {
      expect(validateField("email", email), email).toBeNull();
    }
  });

  it("rejects what the server rejects", () => {
    for (const email of [
      "ada@example",
      "ada@.example.dk",
      "ada@example..dk",
      "ada@example.dk.",
      "ada@-example.dk",
      "ada@example-.dk",
      ".ada@example.dk",
      "ada.@example.dk",
      "ad..a@example.dk",
      "a da@example.dk",
      "ada@exa mple.dk",
      "ada@exämple.dk",
      "ädä@example.dk",
      "@example.dk",
      "ada@",
      "<ada>@example.dk",
      "ada@example.dk>",
    ]) {
      expect(validateField("email", email), email).toBe("invalid");
    }
  });

  it("limits the address to 254 characters", () => {
    const local = "a".repeat(64);
    const make = (last: number) =>
      `${local}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(last)}`;
    expect(make(61)).toHaveLength(254);
    expect(validateField("email", make(61))).toBeNull();
    expect(make(62)).toHaveLength(255);
    expect(validateField("email", make(62))).toBe("invalid");
  });

  it("does not let a header injection through", () => {
    // Control characters become spaces before the check, and a space is never valid in an address.
    for (const email of [
      "ada@example.dk\r\nBcc: spy@example.dk",
      "ada@example.dk\nSubject: hi",
      "ada@example.dk%0d%0aBcc:spy@example.dk",
      "ada@example.dk,spy@example.dk",
      "ada@example.dk;spy@example.dk",
    ]) {
      expect(validateField("email", email), JSON.stringify(email)).not.toBeNull();
    }
  });

  it("agrees with the server on every address in the list", () => {
    const vectors = [
      "",
      "ada@example.dk",
      "ada@example",
      "a@b.c",
      "ada@@example.dk",
      "ada.@example.dk",
      ".ada@example.dk",
      "a..b@example.dk",
      "ada@example..dk",
      "ada@-x.dk",
      "ada@x-.dk",
      "ada@x.dk.",
      "ada @example.dk",
      "ada@exämple.dk",
      "ada+x@sub.example.dk",
      "ada@example.dk\r\nBcc: x@y.dk",
      "a".repeat(255),
      `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(63)}.${"e".repeat(58)}`,
    ];
    for (const vector of vectors) {
      const clientOk = validateField("email", vector) === null;
      const serverOk = isValidEmail(normalizeValue("email", vector));
      expect(clientOk, JSON.stringify(vector)).toBe(serverOk);
    }
  });
});

describe("validateField: message", () => {
  it("needs at least 20 characters after trimming", () => {
    expect(MIN_MESSAGE_LENGTH).toBe(20);
    expect(validateField("message", "")).toBe("too-short");
    expect(validateField("message", "x".repeat(19))).toBe("too-short");
    expect(validateField("message", "x".repeat(20))).toBeNull();
    expect(validateField("message", `   ${"x".repeat(19)}   `)).toBe("too-short");
  });

  it("counts characters the way the server does, not UTF-16 units", () => {
    expect(validateField("message", "\u{1F600}".repeat(19))).toBe("too-short");
    expect(validateField("message", "\u{1F600}".repeat(20))).toBeNull();
  });

  it("does not count a combining sequence twice", () => {
    expect(validateField("message", "e\u0301".repeat(19))).toBe("too-short");
  });
});

describe("limits", () => {
  it("are never looser than the server", () => {
    expect(LIMITS.name).toBe(100);
    expect(LIMITS.email).toBe(254);
    expect(LIMITS.company).toBe(120);
    expect(LIMITS.message).toBeLessThanOrEqual(5000);
  });

  it("covers exactly the four fields the function accepts", () => {
    expect([...FIELD_NAMES]).toEqual(["name", "email", "company", "message"]);
  });

  it("gives the request more time than the function needs in the worst case", () => {
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThanOrEqual(15_000);
  });
});

describe("validateAll", () => {
  it("returns nothing for a good form", () => {
    expect(validateAll(good)).toEqual({});
  });

  it("returns the failing fields only, with their codes", () => {
    expect(validateAll({ ...good, name: "", email: "ada", message: "short" })).toEqual({
      name: "empty",
      email: "no-at",
      message: "too-short",
    });
  });

  it("makes company required, which is stricter than the server", () => {
    expect(validateAll({ ...good, company: "" })).toEqual({ company: "empty" });
  });
});

describe("messageKey", () => {
  it("names the text to show for each field and code", () => {
    expect(messageKey("name", "empty")).toBe("name.empty");
    expect(messageKey("company", "empty")).toBe("company.empty");
    expect(messageKey("email", "empty")).toBe("email.empty");
    expect(messageKey("email", "no-at")).toBe("email.no-at");
    expect(messageKey("email", "invalid")).toBe("email.invalid");
    expect(messageKey("message", "too-short")).toBe("message.too-short");
  });

  it("falls back to the plain text of the field for a code that does not fit it", () => {
    expect(messageKey("email", "too-short")).toBe("email.empty");
    expect(messageKey("message", "empty")).toBe("message.too-short");
    expect(messageKey("name", "invalid")).toBe("name.empty");
  });
});

describe("errorForServerField", () => {
  it("uses the client's own reason when it has one", () => {
    expect(errorForServerField("email", "ada")).toBe("no-at");
    expect(errorForServerField("name", "")).toBe("empty");
    expect(errorForServerField("message", "short")).toBe("too-short");
  });

  it("uses the generic text of the field when client and server disagree", () => {
    expect(errorForServerField("email", "ada@example.dk")).toBe("invalid");
    expect(errorForServerField("message", goodMessage)).toBe("too-short");
    expect(errorForServerField("name", "Ada")).toBe("empty");
    expect(errorForServerField("company", "Co")).toBe("empty");
  });
});

describe("encodeBody", () => {
  const parse = (body: string) => new URLSearchParams(body);

  it("sends exactly the six names the function accepts", () => {
    const params = parse(encodeBody(good, "", "token-123"));
    expect([...params.keys()].sort()).toEqual([
      "cf-turnstile-response",
      "company",
      "email",
      "message",
      "name",
      "website",
    ]);
    expect(params.get("cf-turnstile-response")).toBe("token-123");
    expect(params.get("website")).toBe("");
  });

  it("sends each name once", () => {
    const keys = [...parse(encodeBody(good, "", "t")).keys()];
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("sends the cleaned values", () => {
    const params = parse(encodeBody({ ...good, name: "  Ada\t", message: "a\r\nb  " }, "", "t"));
    expect(params.get("name")).toBe("Ada");
    expect(params.get("message")).toBe("a\nb");
  });

  it("encodes characters that are special in a form body", () => {
    const body = encodeBody({ ...good, message: "a&b=c+d%e\næøå \u{1F600}" }, "", "t");
    expect(body).not.toMatch(/[\r\n]/);
    expect(parse(body).get("message")).toBe("a&b=c+d%e\næøå \u{1F600}");
  });

  it("cannot be made to add a field by a value that looks like one", () => {
    const body = encodeBody({ ...good, name: "x&to=spy@example.dk&subject=hi" }, "", "t");
    const params = parse(body);
    expect(params.has("to")).toBe(false);
    expect(params.has("subject")).toBe(false);
    expect(params.get("name")).toBe("x&to=spy@example.dk&subject=hi");
  });

  it("passes the honeypot value through so the function can see it", () => {
    expect(parse(encodeBody(good, "bot filled this", "t")).get("website")).toBe("bot filled this");
  });
});

describe("interpretResponse", () => {
  it("is a success only for status 200 with ok true", () => {
    expect(interpretResponse(200, { ok: true })).toEqual({ kind: "success" });
    expect(interpretResponse(201, { ok: true })).toEqual({ kind: "failed" });
    expect(interpretResponse(500, { ok: true })).toEqual({ kind: "failed" });
  });

  it("maps a validation answer to the failing fields", () => {
    expect(
      interpretResponse(400, { ok: false, error: "validation", fields: ["email", "message"] }),
    ).toEqual({ kind: "validation", fields: ["email", "message"] });
  });

  it("ignores field names it does not know", () => {
    expect(
      interpretResponse(400, {
        ok: false,
        error: "validation",
        fields: ["email", "website", "__proto__", 7, null],
      }),
    ).toEqual({ kind: "validation", fields: ["email"] });
  });

  it("treats a validation answer with no usable field as a failed send", () => {
    expect(interpretResponse(400, { ok: false, error: "validation", fields: [] })).toEqual({
      kind: "failed",
    });
    expect(interpretResponse(400, { ok: false, error: "validation", fields: ["website"] })).toEqual(
      {
        kind: "failed",
      },
    );
    expect(interpretResponse(400, { ok: false, error: "validation" })).toEqual({ kind: "failed" });
    expect(interpretResponse(400, { ok: false, error: "validation", fields: "email" })).toEqual({
      kind: "failed",
    });
  });

  it("maps the person check to its own outcome, whatever the status", () => {
    expect(interpretResponse(403, { ok: false, error: "turnstile" })).toEqual({
      kind: "turnstile",
    });
  });

  it("does not mix up the two 403 answers or the two 500 answers", () => {
    expect(interpretResponse(403, { ok: false, error: "origin_not_allowed" })).toEqual({
      kind: "failed",
    });
    expect(interpretResponse(500, { ok: false, error: "config" })).toEqual({ kind: "failed" });
    expect(interpretResponse(500, { ok: false, error: "internal" })).toEqual({ kind: "failed" });
  });

  it("treats every other error code as a failed send", () => {
    for (const [status, error] of [
      [400, "bad_request"],
      [405, "method_not_allowed"],
      [413, "payload_too_large"],
      [415, "unsupported_media_type"],
      [502, "mail_failed"],
      [503, "turnstile_unavailable"],
    ] as const) {
      expect(interpretResponse(status, { ok: false, error }), error).toEqual({ kind: "failed" });
    }
  });

  it("treats an answer that is not an object as a failed send", () => {
    for (const body of [null, undefined, "ok", 200, true, [], [true]]) {
      expect(interpretResponse(200, body)).toEqual({ kind: "failed" });
    }
  });

  it("treats an object with no ok flag as a failed send", () => {
    expect(interpretResponse(200, {})).toEqual({ kind: "failed" });
    expect(interpretResponse(200, { ok: "true" })).toEqual({ kind: "failed" });
    expect(interpretResponse(200, { ok: 1 })).toEqual({ kind: "failed" });
  });
});
