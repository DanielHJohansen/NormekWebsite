/**
 * Request intake: content type, size, body decoding and field names (CF-03 to CF-05).
 *
 * Nothing here knows what a field means. The rules for the values are in validate.ts.
 */

/** The largest body accepted, in bytes. 16 KB is several times a message at its limit (CF-04). */
export const MAX_BODY_BYTES = 16_384;

export const FORM_FIELDS = [
  "name",
  "email",
  "company",
  "message",
  "website",
  "cf-turnstile-response",
] as const;

export type FormField = (typeof FORM_FIELDS)[number];
export type FormFields = ReadonlyMap<FormField, string>;

const FIELD_NAMES: ReadonlySet<string> = new Set(FORM_FIELDS);

function isFormField(name: string): name is FormField {
  return FIELD_NAMES.has(name);
}

/**
 * CF-03. The media type must be application/x-www-form-urlencoded. The only parameter allowed is
 * charset=utf-8, because the body is decoded as UTF-8 whatever the header says.
 */
export function isFormContentType(header: string | null): boolean {
  if (header === null) return false;
  const [mediaType, ...parameters] = header.split(";");
  if (mediaType?.trim().toLowerCase() !== "application/x-www-form-urlencoded") return false;
  return parameters.every((parameter) => {
    if (parameter.trim() === "") return true;
    const [name = "", ...rest] = parameter.split("=");
    const value = rest
      .join("=")
      .trim()
      .replace(/^"(.*)"$/, "$1");
    return name.trim().toLowerCase() === "charset" && value.toLowerCase() === "utf-8";
  });
}

/**
 * CF-04, first half. A Content-Length above the limit is refused before the body is read.
 * A missing or unreadable header proves nothing, so the byte counter in readBody decides.
 */
export function declaredLengthExceeds(header: string | null, limit: number): boolean {
  const value = header?.trim() ?? "";
  return /^\d+$/.test(value) && Number(value) > limit;
}

export type BodyResult =
  | { readonly kind: "ok"; readonly bytes: Uint8Array }
  | { readonly kind: "too_large" }
  | { readonly kind: "unreadable" };

/**
 * CF-04, second half. Reads the body while counting bytes and stops at the first byte over the
 * limit, whatever the headers claim. The rest of the stream is cancelled, not read.
 */
export async function readBody(request: Request, limit: number): Promise<BodyResult> {
  if (request.body === null) return { kind: "ok", bytes: new Uint8Array(0) };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        void reader.cancel().catch(() => undefined);
        return { kind: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { kind: "unreadable" };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { kind: "ok", bytes };
}

/**
 * CF-05. Decodes the body as strict UTF-8 and reads it as a URL encoded form. Returns null for
 * bytes that are not UTF-8, for a field name that is not allowed (including a different case)
 * and for a field that appears more than once.
 */
export function parseForm(bytes: Uint8Array): FormFields | null {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }

  const fields = new Map<FormField, string>();
  let acceptable = true;
  new URLSearchParams(text).forEach((value, name) => {
    if (!isFormField(name) || fields.has(name)) {
      acceptable = false;
      return;
    }
    fields.set(name, value);
  });
  return acceptable ? fields : null;
}
