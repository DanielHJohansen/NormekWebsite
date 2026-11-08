/**
 * POST /api/contact. The contact form's endpoint, a Cloudflare Pages Function.
 *
 * This file only connects Pages to the code in functions/_lib/. The contract with the form client
 * is docs/security/contact-api.md, and the 15 rules CF-01 to CF-15 are in
 * docs/security/threat-model-and-requirements.md section 3.
 *
 * Cloudflare does not apply public/_headers to Pages Function responses, so the function sets its
 * own headers (functions/_lib/http.ts).
 */
import type { Env } from "../_lib/env";
import { handleContact } from "../_lib/handle";

export const onRequest = (context: { request: Request; env: Env }): Promise<Response> =>
  handleContact(context.request, context.env);
