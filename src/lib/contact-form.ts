/**
 * The logic of the contact form, kept free of the DOM so it can be unit tested.
 * The browser code in src/scripts/contact-form.ts only connects it to the page.
 *
 * The rules follow docs/security/contact-api.md sections 2 and 3 (the function's CF-07 and CF-14).
 * The client is a little stricter than the server (company is required here, optional there),
 * and the server repeats every rule, because the client can be bypassed.
 */

export const FIELD_NAMES = ["name", "email", "company", "message"] as const;
export type FieldName = (typeof FIELD_NAMES)[number];

/**
 * Field limits. They are also the maxlength attributes in the markup. A maxlength counts UTF-16 code units
 * and the server counts code points, so the markup is never looser than the server.
 */
export const LIMITS: Readonly<Record<FieldName, number>> = {
  name: 100,
  email: 254,
  company: 120,
  message: 2000,
};

export const MIN_MESSAGE_LENGTH = 20;

/** How long the browser waits for the function before it gives up. The function can take about 10 seconds. */
export const REQUEST_TIMEOUT_MS = 20_000;

export type FieldError = "empty" | "no-at" | "invalid" | "too-short";

export type FieldValues = Readonly<Record<FieldName, string>>;

/** Length in Unicode code points, which is how the function counts. */
function length(value: string): number {
  return Array.from(value).length;
}

/**
 * Cleans a value before it is checked or sent: Unicode NFC, control characters replaced by a space,
 * CRLF in the message turned into LF, then trimmed. The function applies the same rules and rejects
 * what is left, so a stray tab from a paste never causes a failed send.
 * In the message only line breaks and tabs stay (U+000A and U+0009).
 */
export function normalizeValue(field: FieldName, raw: string): string {
  const text = raw.normalize("NFC");
  if (field === "message") {
    return (
      text
        .replace(/\r\n?/g, "\n")
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000b-\u001f\u007f\u2028\u2029]/g, " ")
        .trim()
    );
  }
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, " ").trim();
}

/** What the browser's own email input accepts, with a dot required in the domain. */
const LOCAL_PART = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

function emailError(value: string): FieldError | null {
  if (value === "") return "empty";
  if (!value.includes("@")) return "no-at";
  const parts = value.split("@");
  if (parts.length !== 2) return "invalid";
  const [local = "", domain = ""] = parts;
  const ok =
    length(value) <= LIMITS.email &&
    LOCAL_PART.test(local) &&
    !local.startsWith(".") &&
    !local.endsWith(".") &&
    !local.includes("..") &&
    domain.includes(".") &&
    domain.split(".").every((label) => DOMAIN_LABEL.test(label));
  return ok ? null : "invalid";
}

/** The error code for one field, or null when the value is fine. */
export function validateField(field: FieldName, raw: string): FieldError | null {
  const value = normalizeValue(field, raw);
  switch (field) {
    case "email":
      return emailError(value);
    case "message":
      return length(value) < MIN_MESSAGE_LENGTH ? "too-short" : null;
    default:
      return value === "" ? "empty" : null;
  }
}

export type FieldErrors = Partial<Record<FieldName, FieldError>>;

export function validateAll(values: FieldValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of FIELD_NAMES) {
    const error = validateField(field, values[field]);
    if (error) errors[field] = error;
  }
  return errors;
}

/**
 * The key of the message to show, for example "email.no-at". The texts live in the content
 * (src/content/home/en/08-contact.md), and the markup carries them to the script.
 */
export function messageKey(field: FieldName, error: FieldError): string {
  // A field only has the codes that make sense for it. Anything else falls back to the plain "empty" text.
  if (field === "email")
    return `email.${error === "no-at" || error === "invalid" ? error : "empty"}`;
  if (field === "message") return "message.too-short";
  return `${field}.empty`;
}

/**
 * The error for a field the server rejected. The client usually knows why. When it does not,
 * the server and the client disagree, and the generic text for that field is the honest answer.
 */
export function errorForServerField(field: FieldName, raw: string): FieldError {
  const own = validateField(field, raw);
  if (own) return own;
  return field === "email" ? "invalid" : field === "message" ? "too-short" : "empty";
}

/** The request body: application/x-www-form-urlencoded with exactly the fields the function accepts. */
export function encodeBody(values: FieldValues, honeypot: string, turnstileToken: string): string {
  const body = new URLSearchParams();
  for (const field of FIELD_NAMES) body.set(field, normalizeValue(field, values[field]));
  body.set("website", honeypot);
  body.set("cf-turnstile-response", turnstileToken);
  return body.toString();
}

export type SubmitOutcome =
  | { readonly kind: "success" }
  | { readonly kind: "validation"; readonly fields: FieldName[] }
  | { readonly kind: "turnstile" }
  | { readonly kind: "failed" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Maps the answer of POST /api/contact to what the visitor sees (docs/security/contact-api.md section 3).
 * It branches on `error`, never on the status alone, because 403 and 500 each carry two meanings.
 *   200 {"ok":true}                                        success
 *   {"ok":false,"error":"validation","fields":[...]}       the error summary and the field errors
 *   {"ok":false,"error":"turnstile"}                       the person check failed
 *   anything else, also an answer that is not JSON         the send failed
 */
export function interpretResponse(status: number, body: unknown): SubmitOutcome {
  if (!isRecord(body)) return { kind: "failed" };
  if (body["ok"] === true) return status === 200 ? { kind: "success" } : { kind: "failed" };
  if (body["ok"] !== false) return { kind: "failed" };
  if (body["error"] === "validation" && Array.isArray(body["fields"])) {
    const fields = body["fields"].filter((f): f is FieldName =>
      (FIELD_NAMES as readonly unknown[]).includes(f),
    );
    return fields.length > 0 ? { kind: "validation", fields } : { kind: "failed" };
  }
  if (body["error"] === "turnstile") return { kind: "turnstile" };
  return { kind: "failed" };
}
