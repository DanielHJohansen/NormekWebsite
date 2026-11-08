/**
 * Responses of POST /api/contact.
 *
 * The status of every failure is fixed here, next to its code. The table in
 * docs/security/contact-api.md mirrors it and a unit test compares the two.
 *
 * public/_headers does not apply to Pages Function responses, so every response gets its headers
 * here (docs/security/threat-model-and-requirements.md section 2.4). No Access-Control-* header is
 * ever set (CF-01), so browsers block every cross-origin read.
 */
import type { FieldName } from "./validate";

export const ERROR_STATUS = {
  validation: 400,
  bad_request: 400,
  turnstile: 403,
  origin_not_allowed: 403,
  method_not_allowed: 405,
  payload_too_large: 413,
  unsupported_media_type: 415,
  config: 500,
  internal: 500,
  mail_failed: 502,
  turnstile_unavailable: 503,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export const RESPONSE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex",
} as const;

function respond(status: number, body: object, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...RESPONSE_HEADERS, ...extraHeaders },
  });
}

/** A real success and a caught honeypot both end here, so their responses cannot differ (CF-06). */
export function success(): Response {
  return respond(200, { ok: true });
}

/**
 * A failure. The body holds the code and, for a validation error only, the names of the failing
 * fields. It never holds a submitted value, a secret or an upstream message (CF-14).
 */
export function failure(code: ErrorCode, fields?: readonly FieldName[]): Response {
  const body =
    fields === undefined ? { ok: false, error: code } : { ok: false, error: code, fields };
  return respond(ERROR_STATUS[code], body, code === "method_not_allowed" ? { Allow: "POST" } : {});
}
