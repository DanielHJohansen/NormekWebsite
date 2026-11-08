/**
 * Sentinel values for the privacy tests of the contact function (CF-13 logs and CF-14 responses).
 *
 * Every input, every header the function could be tempted to copy, and every secret gets a
 * distinctive marker. The scenarios below drive the function down each of its paths, including the
 * ones where an upstream error message or an exception quotes a marker. A test then looks for the
 * markers in everything the function wrote out, and must find none.
 */
import type { Env } from "../../functions/_lib/env";
import {
  buildRequest,
  ENV,
  encode,
  fields,
  json,
  type Fields,
  type Harness,
  type SendOptions,
} from "./contact-harness";

/**
 * The markers use letters and hyphens only. Mixed letters and digits next to words like key, secret or
 * token look like credentials to the secret scanner in CI (gitleaks, generic-api-key rule).
 */
export const SENTINEL = {
  name: "SENTINEL-name-quartz",
  email: "sentinel-email-quartz@example.com",
  company: "SENTINEL-company-quartz",
  message: "SENTINEL-message-quartz with enough words to pass the length rule",
  /** Under the 20 characters a message needs, so it fails validation. */
  shortMessage: "SENTINEL-short-msg",
  token: "SENTINEL-token-quartz",
  ip: "198.51.100.77",
  agent: "SENTINEL-agent-quartz",
  resendKey: "SENTINEL-resend-key-quartz",
  turnstileSecret: "SENTINEL-turnstile-secret-quartz",
  contactTo: "sentinel-inbox-quartz@example.org",
  origin: "https://sentinel-origin-quartz.example",
  contentType: "application/sentinel-type-quartz",
  fieldName: "sentinel_field_quartz",
  upstream: "SENTINEL-upstream-text-quartz",
} as const;

export const ALL_SENTINELS: readonly string[] = Object.values(SENTINEL);

const sentinelFields: Fields = {
  name: SENTINEL.name,
  email: SENTINEL.email,
  company: SENTINEL.company,
  message: SENTINEL.message,
  "cf-turnstile-response": SENTINEL.token,
};

/** A request that would be accepted, with a sentinel in every input and every secret. */
const base: SendOptions = {
  fields: sentinelFields,
  headers: {
    "cf-connecting-ip": SENTINEL.ip,
    "x-forwarded-for": SENTINEL.ip,
    "user-agent": SENTINEL.agent,
  },
  env: {
    RESEND_API_KEY: SENTINEL.resendKey,
    TURNSTILE_SECRET_KEY: SENTINEL.turnstileSecret,
    CONTACT_TO: SENTINEL.contactTo,
  },
};

/** An environment whose reading throws an error that quotes a sentinel. */
export function throwingEnv(message: string): Env {
  const env: Env = { ...ENV };
  Object.defineProperty(env, "RESEND_API_KEY", {
    enumerable: true,
    get(): string {
      throw new Error(message);
    },
  });
  return env;
}

export type Scenario = (h: Harness) => Promise<Response>;

/** What each scenario writes to the console, as exact lines. No entry means it writes nothing. */
export const EXPECTED_LOG: Readonly<Record<string, readonly string[]>> = {
  "a missing setting": ["contact config_error"],
  "Turnstile answering with an error status": ["contact turnstile_unavailable 500"],
  "a Turnstile network error": ["contact turnstile_unavailable 0"],
  "Turnstile answering with text that is not JSON": ["contact turnstile_unavailable 0"],
  "a provider error": ["contact mail_failed 422"],
  "a provider network error": ["contact mail_failed 0"],
  "an unexpected exception": ["contact unexpected_error"],
};

export const scenarios: Readonly<Record<string, Scenario>> = {
  "an accepted request": (h) => h.send(base),

  "a caught honeypot": (h) =>
    h.send({ ...base, fields: { ...sentinelFields, website: SENTINEL.name } }),

  "a validation error": (h) =>
    h.send({
      ...base,
      fields: { ...sentinelFields, email: SENTINEL.name, message: SENTINEL.shortMessage },
    }),

  "an unknown field": (h) =>
    h.send({
      ...base,
      body: encode({ ...fields(sentinelFields), [SENTINEL.fieldName]: SENTINEL.name }),
    }),

  "a repeated field": (h) =>
    h.send({
      ...base,
      body: encode([...Object.entries(fields(sentinelFields)), ["name", SENTINEL.name]]),
    }),

  "a refused origin": (h) => h.send({ ...base, origin: SENTINEL.origin }),

  "a refused content type": (h) => h.send({ ...base, contentType: SENTINEL.contentType }),

  "a refused method": (h) => h.send({ ...base, method: "PUT" }),

  "a body that is too large": (h) =>
    h.send({ ...base, headers: { ...base.headers, "content-length": "99999" } }),

  "a missing token": (h) =>
    h.send({ ...base, fields: { ...sentinelFields, "cf-turnstile-response": undefined } }),

  "a token Turnstile refuses": (h) => {
    h.setSiteverify(() => json({ success: false, "error-codes": [SENTINEL.upstream] }));
    return h.send(base);
  },

  "Turnstile answering with an error status": (h) => {
    h.setSiteverify(() => new Response(SENTINEL.upstream, { status: 500 }));
    return h.send(base);
  },

  "a Turnstile network error": (h) => {
    h.setSiteverify(() => {
      throw new Error(`failed for ${SENTINEL.email} with ${SENTINEL.token}`);
    });
    return h.send(base);
  },

  "Turnstile answering with text that is not JSON": (h) => {
    h.setSiteverify(() => new Response(`{"success": ${SENTINEL.upstream}`, { status: 200 }));
    return h.send(base);
  },

  "a provider error": (h) => {
    h.setResend(() => json({ message: `${SENTINEL.upstream} for ${SENTINEL.email}` }, 422));
    return h.send(base);
  },

  "a provider network error": (h) => {
    h.setResend(() => {
      throw new Error(`failed for ${SENTINEL.email} with ${SENTINEL.resendKey}`);
    });
    return h.send(base);
  },

  "a missing setting": (h) => h.send({ ...base, env: { ...base.env, RESEND_API_KEY: undefined } }),

  "an unreadable body": (h) =>
    h.send({
      ...base,
      body: new ReadableStream<Uint8Array<ArrayBuffer>>({
        start(controller) {
          controller.error(new Error(`stream broke after ${SENTINEL.message}`));
        },
      }),
    }),

  "an unexpected exception": (h) =>
    h.dispatch(buildRequest(base), throwingEnv(`boom ${SENTINEL.message} ${SENTINEL.resendKey}`)),
};
