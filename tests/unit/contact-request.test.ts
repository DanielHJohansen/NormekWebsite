/**
 * CF-01 to CF-06 of docs/security/threat-model-and-requirements.md section 3:
 * method, origin, content type, size, fields and honeypot.
 * "Rejected" means no Turnstile call and no mail, so each rejection test checks `h.calls`.
 */
import { describe, expect, it } from "vitest";
import {
  buildRequest,
  encode,
  fields,
  json,
  ORIGIN,
  readJson,
  TURNSTILE_PASS,
  useContactHarness,
} from "./contact-harness";

const h = useContactHarness();

function streamOf(
  bytes: Uint8Array<ArrayBuffer>,
  chunkSize: number,
): ReadableStream<Uint8Array<ArrayBuffer>> {
  let offset = 0;
  return new ReadableStream<Uint8Array<ArrayBuffer>>({
    pull(controller) {
      if (offset >= bytes.byteLength) {
        controller.close();
        return;
      }
      controller.enqueue(bytes.slice(offset, offset + chunkSize));
      offset += chunkSize;
    },
  });
}

/** A form body of exactly `size` bytes whose only content is a filled honeypot. */
function honeypotBody(size: number): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(`website=${"a".repeat(size - "website=".length)}`);
}

describe("CF-01 method", () => {
  it.each(["GET", "HEAD", "PUT", "PATCH", "DELETE", "OPTIONS"])(
    "answers %s with 405, Allow: POST and no Turnstile or mail call",
    async (method) => {
      const response = await h.send({ method });
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("POST");
      expect(await readJson(response)).toEqual({ ok: false, error: "method_not_allowed" });
      expect(h.calls).toEqual([]);
    },
  );

  it("refuses a CORS preflight and grants no cross-origin permission", async () => {
    const response = await h.send({
      method: "OPTIONS",
      headers: {
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
      origin: "https://evil.example",
    });
    expect(response.status).toBe(405);
    expect(
      [...response.headers.keys()].filter((name) => name.startsWith("access-control-")),
    ).toEqual([]);
  });

  it("never sets an Access-Control header, on success or on any failure", async () => {
    const responses = [
      await h.send(),
      await h.send({ fields: { email: "nope" } }),
      await h.send({ origin: "https://evil.example" }),
      await h.send({ method: "GET" }),
      await h.send({ contentType: "application/json" }),
    ];
    for (const response of responses) {
      const names = [...response.headers.keys()];
      expect(names.filter((name) => name.startsWith("access-control-"))).toEqual([]);
    }
  });

  it("accepts a POST", async () => {
    expect((await h.send()).status).toBe(200);
  });
});

describe("CF-02 origin", () => {
  const rejected: [string, string | null][] = [
    ["a missing Origin", null],
    ["the string null", "null"],
    ["an empty Origin", ""],
    ["a lookalike with a suffix", "https://normek-web.pages.dev.evil.example"],
    ["a lookalike with a prefix", "https://evil-normek-web.pages.dev"],
    ["a commit-hash preview host", "https://3f2a9c1e.normek-web.pages.dev"],
    ["the preview alias when only production is allowed", "https://preview.normek-web.pages.dev"],
    ["the wrong scheme", "http://normek-web.pages.dev"],
    ["a trailing slash", "https://normek-web.pages.dev/"],
    ["a path", "https://normek-web.pages.dev/contact"],
    ["a port", "https://normek-web.pages.dev:8443"],
    ["upper case", "https://NORMEK-WEB.pages.dev"],
    ["two origins in one header", `${ORIGIN}, https://evil.example`],
    ["another site", "https://evil.example"],
  ];

  it.each(rejected)("answers 403 for %s and sends nothing", async (_label, origin) => {
    const response = await h.send({ origin });
    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ ok: false, error: "origin_not_allowed" });
    expect(h.calls).toEqual([]);
  });

  it("accepts exactly the origin that is listed", async () => {
    expect((await h.send({ origin: ORIGIN })).status).toBe(200);
  });

  it("accepts every entry of a comma separated list and still refuses the rest", async () => {
    const env = { ALLOWED_ORIGINS: "https://normek-web.pages.dev, https://www.normek.dk" };
    expect((await h.send({ env, origin: "https://www.normek.dk" })).status).toBe(200);
    expect((await h.send({ env, origin: "https://normek-web.pages.dev" })).status).toBe(200);
    const refused = await h.send({ env, origin: "https://normek.dk" });
    expect(refused.status).toBe(403);
  });

  it("keeps preview and production apart", async () => {
    const env = { ALLOWED_ORIGINS: "https://preview.normek-web.pages.dev" };
    h.setSiteverify(() => json({ ...TURNSTILE_PASS, hostname: "preview.normek-web.pages.dev" }));
    expect((await h.send({ env, origin: "https://preview.normek-web.pages.dev" })).status).toBe(
      200,
    );
    expect((await h.send({ env, origin: "https://3f2a9c1e.normek-web.pages.dev" })).status).toBe(
      403,
    );
    expect((await h.send({ env, origin: ORIGIN })).status).toBe(403);
  });
});

describe("CF-03 content type", () => {
  const rejected: [string, string | null][] = [
    ["multipart/form-data", "multipart/form-data; boundary=----x"],
    ["application/json", "application/json"],
    ["text/plain", "text/plain"],
    ["text/plain with a charset", "text/plain;charset=UTF-8"],
    ["no content type", null],
    ["another charset", "application/x-www-form-urlencoded; charset=iso-8859-1"],
    ["another parameter", "application/x-www-form-urlencoded; boundary=x"],
    ["a longer media type", "application/x-www-form-urlencoded-evil"],
    ["a typo in the media type", "application/x-www-form-urlencode"],
  ];

  it.each(rejected)("answers 415 for %s and sends nothing", async (_label, contentType) => {
    const response = await h.send({ contentType });
    expect(response.status).toBe(415);
    expect(await readJson(response)).toEqual({ ok: false, error: "unsupported_media_type" });
    expect(h.calls).toEqual([]);
  });

  it.each([
    "application/x-www-form-urlencoded",
    "application/x-www-form-urlencoded; charset=utf-8",
    "application/x-www-form-urlencoded;charset=UTF-8",
    'Application/X-WWW-Form-Urlencoded; charset="utf-8"',
  ])("accepts %s", async (contentType) => {
    expect((await h.send({ contentType })).status).toBe(200);
  });

  it("is checked before the body is read", async () => {
    const request = buildRequest({
      contentType: "application/json",
      body: streamOf(new TextEncoder().encode("{}"), 1),
    });
    expect((await h.dispatch(request)).status).toBe(415);
    expect(request.bodyUsed).toBe(false);
  });
});

describe("CF-04 size", () => {
  it("refuses a Content-Length above 16384 before the body is read", async () => {
    const request = buildRequest({
      headers: { "content-length": "16385" },
      body: streamOf(honeypotBody(16_385), 1024),
    });
    const response = await h.dispatch(request);
    expect(response.status).toBe(413);
    expect(await readJson(response)).toEqual({ ok: false, error: "payload_too_large" });
    expect(request.bodyUsed).toBe(false);
    expect(h.calls).toEqual([]);
  });

  it("refuses an absurd Content-Length the same way", async () => {
    const response = await h.send({ headers: { "content-length": "99999999999999999999" } });
    expect(response.status).toBe(413);
  });

  it("accepts a Content-Length of exactly 16384", async () => {
    const response = await h.send({
      headers: { "content-length": "16384" },
      body: honeypotBody(16_384),
    });
    expect(response.status).toBe(200);
  });

  it("accepts a body of exactly 16384 bytes that has no Content-Length", async () => {
    const response = await h.send({ body: streamOf(honeypotBody(16_384), 4096) });
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true });
  });

  it("refuses a body of 16385 bytes that has no Content-Length", async () => {
    const response = await h.send({ body: streamOf(honeypotBody(16_385), 4096) });
    expect(response.status).toBe(413);
    expect(await readJson(response)).toEqual({ ok: false, error: "payload_too_large" });
    expect(h.calls).toEqual([]);
  });

  it("counts bytes, not characters", async () => {
    // 3 bytes each in UTF-8, so 5462 of them are 16386 bytes once the field name is added.
    const body = new TextEncoder().encode(`website=${"€".repeat(5462)}`);
    expect(body.byteLength).toBeGreaterThan(16_384);
    const response = await h.send({ body: streamOf(body, 1000) });
    expect(response.status).toBe(413);
  });

  it("stops reading a stream that never ends and cancels it", async () => {
    let pulls = 0;
    let cancelled = false;
    const endless = new ReadableStream<Uint8Array<ArrayBuffer>>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(new Uint8Array(1024).fill(97));
      },
      cancel() {
        cancelled = true;
      },
    });
    const response = await h.send({ body: endless });
    expect(response.status).toBe(413);
    await new Promise((resolve) => setImmediate(resolve));
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThan(40);
  });

  it("does not trust a Content-Length that understates the body", async () => {
    const response = await h.send({
      headers: { "content-length": "10" },
      body: streamOf(honeypotBody(20_000), 2048),
    });
    expect(response.status).toBe(413);
  });

  it("ignores an unreadable Content-Length and still counts the bytes", async () => {
    const response = await h.send({
      headers: { "content-length": "many" },
      body: streamOf(honeypotBody(16_385), 2048),
    });
    expect(response.status).toBe(413);
  });

  it("answers 400 for a body that cannot be read", async () => {
    const broken = new ReadableStream<Uint8Array<ArrayBuffer>>({
      start(controller) {
        controller.error(new Error("connection reset"));
      },
    });
    const response = await h.send({ body: broken });
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ ok: false, error: "bad_request" });
  });
});

describe("CF-05 fields", () => {
  const unknown = [
    "to",
    "cc",
    "bcc",
    "subject",
    "from",
    "reply_to",
    "html",
    "situation",
    "source",
    "page",
    "Name",
    "EMAIL",
    "__proto__",
    "constructor",
    "toString",
    "",
  ];

  it.each(unknown)("answers 400 for the unknown field %j and sends nothing", async (name) => {
    const body = encode([...Object.entries(fields()), [name, "x"]]);
    const response = await h.send({ body });
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ ok: false, error: "bad_request" });
    expect(h.calls).toEqual([]);
  });

  it.each(["name", "email", "company", "message", "website", "cf-turnstile-response"])(
    "answers 400 when %s is repeated",
    async (name) => {
      const body = encode([...Object.entries(fields()), [name, "second"]]);
      const response = await h.send({ body });
      expect(response.status).toBe(400);
      expect(await readJson(response)).toEqual({ ok: false, error: "bad_request" });
      expect(h.calls).toEqual([]);
    },
  );

  it("counts a field name written with percent encoding as that field", async () => {
    const body = `${encode(fields())}&na%6De=Second`;
    const response = await h.send({ body });
    expect(response.status).toBe(400);
  });

  it("answers 400 for bytes that are not UTF-8", async () => {
    const response = await h.send({ body: new Uint8Array([0x6e, 0x61, 0x6d, 0x65, 0x3d, 0xff]) });
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ ok: false, error: "bad_request" });
  });

  it("answers 400 for an empty body, naming the missing fields", async () => {
    const response = await h.send({ body: "" });
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "validation",
      fields: ["name", "email", "message"],
    });
  });

  it("answers a POST with no body at all like an empty one", async () => {
    const request = buildRequest({ body: null });
    expect(request.body).toBeNull();
    const response = await h.dispatch(request);
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: "validation",
      fields: ["name", "email", "message"],
    });
    expect(h.calls).toEqual([]);
  });

  it("accepts all six allowed fields and nothing else", async () => {
    expect((await h.send()).status).toBe(200);
    expect(Object.keys(fields()).sort()).toEqual(
      ["cf-turnstile-response", "company", "email", "message", "name", "website"].sort(),
    );
  });

  it("does not repeat an unknown field name in the answer", async () => {
    const body = encode([...Object.entries(fields()), ["field_SENTINEL_4c1e", "x"]]);
    const response = await h.send({ body });
    expect(await response.text()).not.toContain("SENTINEL");
  });
});

describe("CF-06 honeypot", () => {
  it("answers a filled honeypot with the same status, headers and body as a real success", async () => {
    const real = await h.send();
    const trapped = await h.send({ fields: { website: "https://spam.example" } });
    expect(trapped.status).toBe(200);
    expect(trapped.status).toBe(real.status);
    expect([...trapped.headers]).toEqual([...real.headers]);
    expect(await trapped.text()).toBe(await real.text());
    expect(await readJson(await h.send({ fields: { website: "x" } }))).toEqual({ ok: true });
  });

  it("sends no Turnstile call and no mail for a filled honeypot", async () => {
    await h.send({ fields: { website: "https://spam.example" } });
    expect(h.calls).toEqual([]);
  });

  it("treats a value of only spaces as filled", async () => {
    const response = await h.send({ fields: { website: "   " } });
    expect(response.status).toBe(200);
    expect(h.calls).toEqual([]);
  });

  it("is decided before validation and before Turnstile", async () => {
    const response = await h.send({
      fields: {
        website: "x",
        name: "",
        email: "nope",
        message: "short",
        "cf-turnstile-response": undefined,
      },
    });
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true });
    expect(h.calls).toEqual([]);
  });

  it("lets an empty honeypot through to the normal path", async () => {
    await h.send({ fields: { website: "" } });
    expect(h.mails()).toHaveLength(1);
  });

  it("is decided after the field names, so a trap with an unknown field is a 400", async () => {
    const body = encode([...Object.entries(fields({ website: "x" })), ["to", "eve@example.net"]]);
    expect((await h.send({ body })).status).toBe(400);
  });
});
