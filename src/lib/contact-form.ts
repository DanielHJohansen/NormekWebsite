/**
 * The logic of the contact form, kept free of the DOM so it can be unit tested.
 * The browser code in src/scripts/contact-form.ts only connects it to the page.
 *
 * The rules follow the function's rules CF-07 and CF-14 in docs/security/threat-model-and-requirements.md.
 * The client is a little stricter than the server (company is required here, optional there),
 * and the server repeats every rule, because the client can be bypassed.
 */

export const FIELD_NAMES = ["name", "email", "company", "message"] as const;
export type FieldName = (typeof FIELD_NAMES)[number];

/** Field limits. They are also the maxlength attributes in the markup. */
export const LIMITS: Readonly<Record<FieldName, number>> = {
  name: 100,
  email: 254,
  company: 120,
  message: 2000,
};

export const MIN_MESSAGE_LENGTH = 20;

export type FieldError = "empty" | "no-at" | "invalid" | "too-short";

export type FieldValues = Readonly<Record<FieldName, string>>;

/** Control characters that the function rejects in a single line field, and U+2028 and U+2029. */
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f  ]/g;

/**
 * Cleans a value before it is checked or sent: Unicode NFC, control characters in single line fields
 * replaced by a space, CRLF in the message turned into LF, then trimmed. The function does the same.
 */
export function normalizeValue(field: FieldName, raw: string): string {
  const text = raw.normalize("NFC");
  if (field === "message") {
    // The message may keep line breaks and tabs. Every other control character goes.
    // eslint-disable-next-line no-control-regex
    return text.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f  ]/g, " ").trim();
  }
  return text.replace(CONTROL, " ").trim();
}

function emailError(value: string): FieldError | null {
  if (value === "") return "empty";
  if (!value.includes("@")) return "no-at";
  const parts = value.split("@");
  const [local, domain] = parts;
  const ok =
    parts.length === 2 &&
    value.length <= LIMITS.email &&
    !/\s/.test(value) &&
    local !== undefined &&
    local.length > 0 &&
    domain !== undefined &&
    domain.includes(".") &&
    !domain.startsWith(".") &&
    !domain.endsWith(".");
  return ok ? null : "invalid";
}

/** The error code for one field, or null when the value is fine. */
export function validateField(field: FieldName, raw: string): FieldError | null {
  const value = normalizeValue(field, raw);
  switch (field) {
    case "email":
      return emailError(value);
    case "message":
      return value.length < MIN_MESSAGE_LENGTH ? "too-short" : null;
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
  if (field === "email") return `email.${error === "no-at" || error === "invalid" ? error : "empty"}`;
  if (field === "message") return "message.too-short";
  return `${field}.empty`;
}

/**
 * The error for a field the server rejected. The client usually knows why. When it does not,
 * the server and the client disagree, and the generic "invalid" text is the honest answer.
 */
export function errorForServerField(field: FieldName, raw: string): FieldError {
  const own = validateField(field, raw);
  if (own) return own;
  return field === "email" ? "invalid" : field === "message" ? "too-short" : "empty";
}

/** The request body: application/x-www-form-urlencoded with the fields the function accepts (CF-05). */
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
 * Maps the answer of POST /api/contact (rule CF-14) to what the visitor sees.
 * 200 {"ok":true}, 400 {"ok":false,"error":"validation","fields":[...]}, 403 {"ok":false,"error":"turnstile"}.
 * Anything else, including an answer that is not JSON, is "failed".
 */
export function interpretResponse(status: number, body: unknown): SubmitOutcome {
  if (!isRecord(body)) return { kind: "failed" };
  if (status === 200 && body["ok"] === true) return { kind: "success" };
  if (body["ok"] !== false) return { kind: "failed" };
  if (status === 400 && body["error"] === "validation" && Array.isArray(body["fields"])) {
    const fields = body["fields"].filter((f): f is FieldName =>
      (FIELD_NAMES as readonly unknown[]).includes(f),
    );
    return fields.length > 0 ? { kind: "validation", fields } : { kind: "failed" };
  }
  if (status === 403 && body["error"] === "turnstile") return { kind: "turnstile" };
  return { kind: "failed" };
}
