/**
 * Field rules of the contact form (CF-07). The server repeats every rule the form applies.
 *
 * Every value is trimmed and normalized to Unicode NFC first. Lengths count Unicode code points.
 * A failure names the field and never carries the value.
 */
import type { FormFields } from "./form";

export type FieldName = "name" | "email" | "company" | "message";

export interface Inquiry {
  readonly name: string;
  readonly email: string;
  readonly company: string;
  readonly message: string;
}

export type Validation =
  | { readonly ok: true; readonly inquiry: Inquiry }
  | { readonly ok: false; readonly fields: readonly FieldName[] };

const NAME_MAX = 100;
const EMAIL_MAX = 254;
const COMPANY_MAX = 120;
const MESSAGE_MIN = 20;
const MESSAGE_MAX = 5000;

/** Letters, digits and these characters, in dot separated parts. What `type="email"` accepts, minus stray dots. */
const LOCAL_PART = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

/**
 * The characters no field may contain (CF-07), as UTF-16 code units. All of them are in the basic
 * plane, so a code unit is the whole character.
 *  - CR, LF and every other control character: they would let a value break out of its line or header.
 *    That is U+0000 to U+001F, DEL and the C1 controls, so U+007F to U+009F. The C1 range holds NEL
 *    (U+0085), which some programs treat as a line break.
 *  - The Unicode line and paragraph separators, U+2028 and U+2029.
 *  - The bidi overrides and isolates, U+202A to U+202E and U+2066 to U+2069. They can reorder or fake
 *    a line when Daniel reads the mail. The plain direction marks U+200E and U+200F stay allowed,
 *    because names in Hebrew or Arabic use them.
 * A message may keep LF and tab.
 */
function isForbidden(code: number): boolean {
  return (
    code <= 0x1f ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x2028 ||
    code === 0x2029 ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069)
  );
}

function hasForbiddenCharacter(value: string, allowTabAndLineFeed: boolean): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (allowTabAndLineFeed && (code === 0x09 || code === 0x0a)) continue;
    if (isForbidden(code)) return true;
  }
  return false;
}

function isText(value: string, min: number, max: number, multiline: boolean): boolean {
  const length = Array.from(value).length;
  return length >= min && length <= max && !hasForbiddenCharacter(value, multiline);
}

/**
 * Exactly one @, no whitespace, a dot in the domain, at most 254 characters (CF-07), plus the
 * shape a browser accepts, so the address is safe to use as the one Reply-To address (CF-10).
 * Domains are ASCII. A visitor with an internationalized domain uses its xn-- form.
 */
export function isValidEmail(value: string): boolean {
  if (value.length === 0 || value.length > EMAIL_MAX) return false;
  if (/\s/u.test(value)) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local = "", domain = ""] = parts;
  if (!LOCAL_PART.test(local)) return false;
  const labels = domain.split(".");
  return labels.length >= 2 && labels.every((label) => DOMAIN_LABEL.test(label));
}

function clean(value: string | undefined, multiline = false): string {
  const text = value ?? "";
  return (multiline ? text.replace(/\r\n/g, "\n") : text).trim().normalize("NFC");
}

export function validateInquiry(fields: FormFields): Validation {
  const inquiry: Inquiry = {
    name: clean(fields.get("name")),
    email: clean(fields.get("email")),
    company: clean(fields.get("company")),
    message: clean(fields.get("message"), true),
  };

  // Listed in the order of the form, which is the order the contract promises.
  const failed: FieldName[] = [];
  if (!isText(inquiry.name, 1, NAME_MAX, false)) failed.push("name");
  // The address shape is ASCII only and already refuses these characters. The explicit check keeps
  // the rule true if the shape is ever loosened.
  if (!isValidEmail(inquiry.email) || hasForbiddenCharacter(inquiry.email, false)) {
    failed.push("email");
  }
  if (!isText(inquiry.company, 0, COMPANY_MAX, false)) failed.push("company");
  if (!isText(inquiry.message, MESSAGE_MIN, MESSAGE_MAX, true)) failed.push("message");

  return failed.length === 0 ? { ok: true, inquiry } : { ok: false, fields: failed };
}
