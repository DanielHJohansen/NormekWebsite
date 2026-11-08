/**
 * The rules of the contact form in the browser (src/lib/contact-form.ts). The server repeats every rule
 * (functions/_lib/validate.ts), so one test here checks that the two agree on addresses.
 */
import { describe, expect, it } from "vitest";
import {
  FIELD_NAMES,
  LIMITS,
  MIN_MESSAGE_LENGTH,
  REQUEST_TIMEOUT_MS,
  encodeBody,
  errorForServerField,
  interpretResponse,
  messageKey,
  normalizeValue,
  validateAll,
  validateField,
  type FieldValues,
} from "../../src/lib/contact-form";
import { isValidEmail } from "../../functions/_lib/validate";

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
    expect(normalizeValue("name", "é")).toBe("é");
    expect(Array.from(normalizeValue("name", "é"))).toHaveLength(1);
  });

  it("replaces a control character with a space, so a stray tab from a paste does not fail a send", () => {
    expect(normalizeValue("name", "Ada\tLovelace")).toBe("Ada Lovelace");
    expect(normalizeValue("company", "A\u0000B\u0007C\u007fD")).toBe("A B C D");
    expect(normalizeValue("name", "a b c")).toBe("a b c");
  });

  it("keeps the line breaks and tabs of a message, and turns CRLF and CR into LF", () => {
    expect(normalizeValue("message", "a\r\nb\rc\td")).toBe("a\nb\nc\td");
  });

  it("still replaces the other control characters in a message", () => {
    expect(normalizeValue("message", "a\u0000b\u001bc\u007fd e")).toBe("a b c d e");
  });

  it("turns a line break in a single line field into a space", () => {
    expect(normalizeValue("name", "Ada\nLovelace")).toBe("Ada Lovelace");
    expect(normalizeValue("email", "ada@example.dk\r\n")).toBe("ada@example.dk");
  });

  it("does not change an ordinary value", () => {
    expect(normalizeValue("name", "Søren Æbelø")).toBe("Søren Æbelø");
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
    expect(validateField("message", "é".repeat(19))).toBe("too-short");
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
