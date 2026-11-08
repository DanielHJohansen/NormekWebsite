/**
 * POST /api/contact. STUB: answers 501 for every request until task 8 builds the real function.
 *
 * The 15 rules CF-01 to CF-15 in docs/security/threat-model-and-requirements.md section 3 are not
 * implemented here. This file only fixes the shape of the response and its headers.
 *
 * Cloudflare does not apply public/_headers to Pages Function responses, so the function sets
 * its own headers (same document, section 2.4).
 */

const RESPONSE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex",
};

export const onRequest = (): Response =>
  new Response(JSON.stringify({ ok: false, error: "not_implemented" }), {
    status: 501,
    headers: RESPONSE_HEADERS,
  });
