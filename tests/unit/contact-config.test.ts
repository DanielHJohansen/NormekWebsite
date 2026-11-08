/**
 * CF-15 of docs/security/threat-model-and-requirements.md section 3: configuration.
 * A missing or malformed setting answers 500 and sends nothing. The Turnstile secret rules of
 * CF-08 are in contact-turnstile.test.ts.
 */
import { describe, expect, it } from "vitest";
import type { Env } from "../../functions/_lib/env";
import { onRequest } from "../../functions/api/contact";
import {
  buildRequest,
  CONTACT_TO,
  ORIGIN,
  readJson,
  RESEND_KEY,
  TURNSTILE_SECRET,
  useContactHarness,
} from "./contact-harness";

const h = useContactHarness();

const REQUIRED = ["RESEND_API_KEY", "CONTACT_TO", "ALLOWED_ORIGINS", "TURNSTILE_SECRET_KEY"] as const;

async function expectConfigError(response: Response): Promise<void> {
  expect(response.status).toBe(500);
  expect(await readJson(response)).toEqual({ ok: false, error: "config" });
  expect(h.calls).toEqual([]);
}

describe.each(REQUIRED)("CF-15 %s", (name) => {
  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["only white space", "  \n\t "],
  ])("answers 500 and sends nothing when it is %s", async (_label, value) => {
    await expectConfigError(await h.send({ env: { [name]: value } }));
  });
});

describe("CF-15 the environment as a whole", () => {
  it("answers 500 when there is no environment object", async () => {
    const response = await onRequest({ request: buildRequest(), env: undefined as unknown as Env });
    await expectConfigError(response);
  });

  it("answers 500 when every setting is missing", async () => {
    const response = await onRequest({ request: buildRequest(), env: {} });
    await expectConfigError(response);
  });

  it("accepts a healthy environment", async () => {
    expect((await h.send()).status).toBe(200);
  });
});

describe("CF-15 ALLOWED_ORIGINS", () => {
  it.each([
    ["a wildcard", "*"],
    ["a wildcard host", "https://*.pages.dev"],
    ["no scheme", "normek-web.pages.dev"],
    ["a trailing slash", "https://normek-web.pages.dev/"],
    ["a path", "https://normek-web.pages.dev/contact"],
    ["a query", "https://normek-web.pages.dev?x=1"],
    ["upper case", "HTTPS://NORMEK-WEB.PAGES.DEV"],
    ["credentials", "https://user@normek-web.pages.dev"],
    ["the default port written out", "https://normek-web.pages.dev:443"],
    ["a scheme that is not http or https", "ftp://normek-web.pages.dev"],
    ["the word null", "null"],
    ["only commas", " , ,"],
    ["origins separated by a space", "https://normek-web.pages.dev https://www.normek.dk"],
    ["one good and one bad origin", "https://normek-web.pages.dev,https://www.normek.dk/"],
  ])("answers 500 for %s, because it would silently match nothing", async (_label, value) => {
    await expectConfigError(await h.send({ env: { ALLOWED_ORIGINS: value } }));
  });

  it.each([
    ["two origins", "https://normek-web.pages.dev,https://www.normek.dk"],
    ["spaces around the entries and a trailing comma", ` https://normek-web.pages.dev , https://www.normek.dk ,`],
    ["a repeated entry", "https://normek-web.pages.dev,https://normek-web.pages.dev"],
    ["a port", "https://normek-web.pages.dev,http://localhost:8788"],
  ])("accepts %s", async (_label, value) => {
    expect((await h.send({ env: { ALLOWED_ORIGINS: value } })).status).toBe(200);
  });
});

describe("CF-15 CONTACT_TO", () => {
  it.each([
    ["a name and an address", "Daniel <daniel@normek.dk>"],
    ["no address", "daniel"],
    ["no dot in the domain", "daniel@normek"],
    ["two addresses with a comma", "a@example.com, b@example.com"],
    ["two addresses with a semicolon", "a@example.com;b@example.com"],
    ["an injected header", "daniel@normek.dk\nBcc: eve@example.net"],
  ])("answers 500 for %s", async (_label, value) => {
    await expectConfigError(await h.send({ env: { CONTACT_TO: value } }));
  });
});

describe("CF-15 RESEND_API_KEY", () => {
  it.each([
    ["a space inside", "re_key with space"],
    ["a line break inside", "re_key\nwith-newline"],
    ["a tab inside", "re_key\twith-tab"],
    ["a letter that is not ASCII", "re_nøgle"],
  ])("answers 500 for a key with %s, because it cannot be a header value", async (_label, value) => {
    await expectConfigError(await h.send({ env: { RESEND_API_KEY: value } }));
  });
});

describe("CF-15 pasted values", () => {
  it("are trimmed before use", async () => {
    const response = await h.send({
      env: {
        RESEND_API_KEY: `  ${RESEND_KEY}\n`,
        CONTACT_TO: `\t${CONTACT_TO} `,
        ALLOWED_ORIGINS: ` ${ORIGIN}\n`,
        TURNSTILE_SECRET_KEY: ` ${TURNSTILE_SECRET}\r\n`,
      },
    });
    expect(response.status).toBe(200);
    expect(h.resendCalls()[0]?.init.headers).toEqual({
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    });
    expect(h.mails()[0]?.to).toBe(CONTACT_TO);
    expect(new URLSearchParams(String(h.siteverifyCalls()[0]?.init.body)).get("secret")).toBe(
      TURNSTILE_SECRET,
    );
  });
});
