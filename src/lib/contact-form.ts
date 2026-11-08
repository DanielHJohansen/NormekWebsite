/**
 * The logic of the contact form, kept free of the DOM so it can be unit tested.
 * The browser code in src/scripts/contact-form.ts only connects it to the page.
 *
 * The rules follow docs/security/contact-api.md sections 1 to 3 (the function's CF-04, CF-07 and CF-14).
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

/** The most the function reads from a request body, in bytes after encoding (CF-04, contact-api.md section 1). */
export const MAX_BODY_BYTES = 16_384;

/**
 * The longest Turnstile token the function accepts. The size check counts a token this long, because the real
 * one only arrives after the person check and the check has to come first (F6 of the security review).
 */
const MAX_TOKEN_LENGTH = 2048;

/** How long the browser waits for the function before it gives up. The function can take about 10 seconds. */
export const REQUEST_TIMEOUT_MS = 20_000;

export type FieldError = "empty" | "no-at" | "invalid" | "too-short" | "too-long";

export type FieldValues = Readonly<Record<FieldName, string>>;

/** Length in Unicode code points, which is how the function counts. */
function length(value: string): number {
  return Array.from(value).length;
}

/**
 * Characters that never go to the function, the same set it refuses (contact-api.md section 2, F2 of the security
 * review): the C0 controls, DEL and the C1 controls (U+0000 to U+001F and U+007F to U+009F), the Unicode line and
 * paragraph separators (U+2028, U+2029) and the bidirectional controls that can reorder or fake a line in a mail
 * client (U+202A to U+202E and U+2066 to U+2069). They become a space, so a stray one from a paste never causes a
 * failed send, and a value that is nothing else is empty and gets the field error.
 * A message keeps its line breaks and tabs (U+000A and U+0009).
 */
/* eslint-disable no-control-regex -- the control characters are the point of these two patterns */
const FORBIDDEN = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g;
const FORBIDDEN_IN_MESSAGE =
  /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g;
/* eslint-enable no-control-regex */

/**
 * Cleans a value before it is checked or sent: Unicode NFC, forbidden characters replaced by a space,
 * CRLF in the message turned into LF, then trimmed. The function applies the same rules and rejects
 * what is left, so a stray tab or a bidi mark from a paste never causes a failed send.
 */
export function normalizeValue(field: FieldName, raw: string): string {
  const text = raw.normalize("NFC");
  if (field === "message") {
    return text.replace(/\r\n?/g, "\n").replace(FORBIDDEN_IN_MESSAGE, " ").trim();
  }
  return text.replace(FORBIDDEN, " ").trim();
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

/**
 * The error for one field, seen in the whole form. The message is also too long when the whole request would not fit
 * the function's limit: a message in a script that takes three bytes a character (2,000 of them, each encoded as nine
 * characters) is over it, and the function would answer 413 with nothing to say about why (F6 of the security review).
 */
export function validateFieldIn(field: FieldName, values: FieldValues): FieldError | null {
  const own = validateField(field, values[field]);
  if (own) return own;
  if (field === "message" && !fitsBodyLimit(values)) return "too-long";
  return null;
}

export function validateAll(values: FieldValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of FIELD_NAMES) {
    const error = validateFieldIn(field, values);
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
  if (field === "message") return error === "too-long" ? "message.too-long" : "message.too-short";
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

/** The size of an encoded body in bytes, which is what the function counts. */
export function encodedByteLength(body: string): number {
  return new TextEncoder().encode(body).length;
}

/**
 * Whether the request fits the function's limit of 16,384 bytes, counting a token of the longest length it accepts.
 * Percent encoding turns each byte of a character outside ASCII into three, so 2,000 characters of Chinese,
 * Japanese or Korean text come to 18,000 on their own.
 */
export function fitsBodyLimit(values: FieldValues, honeypot = ""): boolean {
  const body = encodeBody(values, honeypot, "x".repeat(MAX_TOKEN_LENGTH));
  return encodedByteLength(body) <= MAX_BODY_BYTES;
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
