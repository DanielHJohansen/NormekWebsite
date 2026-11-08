/**
 * Turnstile server side check (CF-08). It fails closed: the only way to "passed" is an answer that
 * is HTTP 200, valid JSON, `success` exactly true, a hostname from ALLOWED_ORIGINS and the action
 * `contact`. Everything else is "rejected" (the visitor failed) or "unavailable" (we could not ask).
 *
 * The visitor's IP address is not sent. `remoteip` is optional and Cloudflare derives what it needs.
 */
import { timedFetch } from "./fetch-timeout";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The widget must be rendered with this action (docs/security/contact-api.md section 1). */
export const TURNSTILE_ACTION = "contact";

/**
 * Error codes that say our side is at fault or Cloudflare had a problem, not the visitor.
 * They become 503, so the page shows "send failed" and not "person check failed".
 */
const SERVICE_SIDE_ERRORS: ReadonlySet<string> = new Set([
  "missing-input-secret",
  "invalid-input-secret",
  "bad-request",
  "internal-error",
]);

/**
 * "rejected" means the visitor failed the check (403). "unavailable" means we could not get a
 * valid verdict (503), and its status is the HTTP status of the answer, or 0 when there was none.
 */
export type TurnstileResult =
  | { readonly kind: "passed" }
  | { readonly kind: "rejected" }
  | { readonly kind: "unavailable"; readonly status: number };

interface SiteverifyAnswer {
  readonly success?: unknown;
  readonly hostname?: unknown;
  readonly action?: unknown;
  readonly "error-codes"?: unknown;
}

interface RawAnswer {
  readonly status: number;
  readonly json: unknown;
}

function unavailable(status: number): TurnstileResult {
  return { kind: "unavailable", status };
}

export async function verifyTurnstile(
  secret: string,
  token: string,
  allowedHostnames: ReadonlySet<string>,
): Promise<TurnstileResult> {
  let answer: RawAnswer;
  try {
    answer = await timedFetch(
      SITEVERIFY_URL,
      { method: "POST", body: new URLSearchParams({ secret, response: token }), redirect: "error" },
      async (response) => {
        if (response.status !== 200) {
          await response.body?.cancel().catch(() => undefined);
          return { status: response.status, json: undefined };
        }
        return { status: response.status, json: (await response.json()) as unknown };
      },
    );
  } catch {
    // Network error, timeout, or a body that is not JSON.
    return unavailable(0);
  }

  if (answer.status !== 200) return unavailable(answer.status);
  if (typeof answer.json !== "object" || answer.json === null || Array.isArray(answer.json)) {
    return unavailable(answer.status);
  }
  const body = answer.json as SiteverifyAnswer;

  if (body.success === true) {
    const hostname = typeof body.hostname === "string" ? body.hostname.toLowerCase() : "";
    return body.action === TURNSTILE_ACTION && allowedHostnames.has(hostname)
      ? { kind: "passed" }
      : { kind: "rejected" };
  }

  if (body.success === false) {
    const codes = body["error-codes"];
    const serviceSide =
      Array.isArray(codes) &&
      codes.some((code) => typeof code === "string" && SERVICE_SIDE_ERRORS.has(code));
    return serviceSide ? unavailable(answer.status) : { kind: "rejected" };
  }

  // No usable verdict.
  return unavailable(answer.status);
}
