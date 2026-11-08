/**
 * CF-09 of docs/security/threat-model-and-requirements.md section 3: order.
 * Method, origin, type, size, fields, honeypot and validation run before siteverify.
 * Siteverify runs before sendMail().
 *
 * Each case breaks several rules at once. The answer shows which rule is checked first, and the
 * empty call list shows that nothing after it ran.
 */
import { describe, expect, it } from "vitest";
import {
  encode,
  fields,
  json,
  RESEND_URL,
  SITEVERIFY_URL,
  TURNSTILE_PASS,
  readJson,
  until,
  useContactHarness,
  type SendOptions,
} from "./contact-harness";

const h = useContactHarness();

interface Case {
  label: string;
  options: SendOptions;
  status: number;
  body: unknown;
}

const failure = (error: string) => ({ ok: false, error });

const unknownFieldBody = encode([...Object.entries(fields()), ["to", "eve@example.net"]]);

const PRECEDENCE: Case[] = [
  {
    label: "the method wins over the configuration, origin, type and size",
    options: {
      method: "GET",
      origin: null,
      contentType: "application/json",
      headers: { "content-length": "99999" },
      env: { RESEND_API_KEY: undefined },
    },
    status: 405,
    body: failure("method_not_allowed"),
  },
  {
    label: "the configuration wins over the origin, type and size",
    options: {
      origin: null,
      contentType: "application/json",
      headers: { "content-length": "99999" },
      env: { RESEND_API_KEY: undefined },
    },
    status: 500,
    body: failure("config"),
  },
  {
    label: "the origin wins over the type, size, field names and validation",
    options: {
      origin: "https://evil.example",
      contentType: "application/json",
      headers: { "content-length": "99999" },
      body: unknownFieldBody,
    },
    status: 403,
    body: failure("origin_not_allowed"),
  },
  {
    label: "the content type wins over the size and the field names",
    options: {
      contentType: "text/plain",
      headers: { "content-length": "99999" },
      body: unknownFieldBody,
    },
    status: 415,
    body: failure("unsupported_media_type"),
  },
  {
    label: "the declared size wins over the field names",
    options: { headers: { "content-length": "99999" }, body: unknownFieldBody },
    status: 413,
    body: failure("payload_too_large"),
  },
  {
    label: "the counted size wins over an unknown field at the start of the body",
    options: { body: new TextEncoder().encode(`to=eve&website=${"a".repeat(20_000)}`) },
    status: 413,
    body: failure("payload_too_large"),
  },
  {
    label: "the field names win over the honeypot",
    options: {
      body: encode([...Object.entries(fields({ website: "x" })), ["to", "eve@example.net"]]),
    },
    status: 400,
    body: failure("bad_request"),
  },
  {
    label: "the honeypot wins over validation and the missing token",
    options: {
      fields: {
        website: "x",
        name: "",
        email: "nope",
        message: "short",
        "cf-turnstile-response": undefined,
      },
    },
    status: 200,
    body: { ok: true },
  },
  {
    label: "validation wins over the missing token",
    options: { fields: { email: "nope", "cf-turnstile-response": undefined } },
    status: 400,
    body: { ok: false, error: "validation", fields: ["email"] },
  },
  {
    label: "a missing token is answered before Turnstile is asked",
    options: { fields: { "cf-turnstile-response": undefined } },
    status: 403,
    body: failure("turnstile"),
  },
];

describe("CF-09 order of the checks", () => {
  it.each(PRECEDENCE)("$label", async ({ options, status, body }) => {
    const response = await h.send(options);
    expect(response.status).toBe(status);
    expect(await readJson(response)).toEqual(body);
    // Nothing after the deciding check ran: no siteverify and no mail.
    expect(h.calls).toEqual([]);
  });

  it("asks Turnstile only after validation has passed", async () => {
    await h.send({ fields: { email: "nope" } });
    expect(h.siteverifyCalls()).toEqual([]);
    await h.send();
    expect(h.siteverifyCalls()).toHaveLength(1);
  });
});

describe("CF-09 siteverify before sendMail()", () => {
  it("calls Turnstile first and the mail provider second", async () => {
    await h.send();
    expect(h.calls.map((call) => call.url)).toEqual([SITEVERIFY_URL, RESEND_URL]);
  });

  it("does not start the mail while Turnstile is still deciding", async () => {
    let release: (response: Response) => void = () => undefined;
    h.setSiteverify(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    );
    const pending = h.send();

    await until(() => h.siteverifyCalls().length === 1);
    // Give the function every chance to send early.
    await new Promise((resolve) => setImmediate(resolve));
    expect(h.resendCalls()).toEqual([]);

    release(json(TURNSTILE_PASS));
    expect((await pending).status).toBe(200);
    expect(h.resendCalls()).toHaveLength(1);
  });

  it("does not send the mail when Turnstile refuses", async () => {
    h.setSiteverify(() => json({ success: false, "error-codes": ["invalid-input-response"] }));
    expect((await h.send()).status).toBe(403);
    expect(h.calls.map((call) => call.url)).toEqual([SITEVERIFY_URL]);
  });

  it("does not send the mail when Turnstile cannot be reached", async () => {
    h.setSiteverify(() => json(TURNSTILE_PASS, 500));
    expect((await h.send()).status).toBe(503);
    expect(h.calls.map((call) => call.url)).toEqual([SITEVERIFY_URL]);
  });
});
