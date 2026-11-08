/**
 * Configuration of the contact function (CF-15, and the Turnstile secret rules of CF-08).
 *
 * The names are the ones in docs/ops/cloudflare-and-resend-setup.md. The two secrets are set as
 * encrypted values, the other two as plain text. A missing or empty value is a configuration error,
 * never a reason to skip a check.
 */
import { isValidEmail } from "./validate";

export interface Env {
  readonly TURNSTILE_SECRET_KEY?: string | undefined;
  readonly RESEND_API_KEY?: string | undefined;
  readonly CONTACT_TO?: string | undefined;
  /** Comma separated origins, for example `https://normek-web.pages.dev,https://www.normek.dk`. */
  readonly ALLOWED_ORIGINS?: string | undefined;
}

export interface Config {
  readonly turnstileSecret: string;
  readonly resendApiKey: string;
  /** The only recipient of any mail (CF-10, CF-11). */
  readonly contactTo: string;
  readonly allowedOrigins: ReadonlySet<string>;
  /** The hostnames of the allowed origins. Turnstile must report one of them (CF-08). */
  readonly allowedHostnames: ReadonlySet<string>;
}

/** Cloudflare's published Turnstile test secrets start like this. They accept or refuse every token. */
const TURNSTILE_TEST_SECRET = /^[123]x0000/;

/** A header value without spaces or control characters, because the key goes into Authorization. */
const HEADER_SAFE = /^[\x21-\x7e]+$/;

/**
 * Letters, digits, hyphens and dots, or a bracketed IPv6 address. The URL parser also accepts a
 * host like `*.pages.dev`, which can never equal a real Origin header, so it is refused here.
 */
const PLAIN_HOSTNAME = /^(?:[a-z0-9-]+(?:\.[a-z0-9-]+)*|\[[0-9a-f:]+\])$/;

function read(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Only a bare origin: scheme, host and a non-default port. Anything else is a typo worth a loud failure. */
function parseOrigins(value: string): string[] | null {
  const origins: string[] = [];
  for (const part of value.split(",")) {
    const entry = part.trim();
    if (entry === "") continue;
    let url: URL;
    try {
      url = new URL(entry);
    } catch {
      return null;
    }
    const isBareOrigin =
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.origin === entry &&
      PLAIN_HOSTNAME.test(url.hostname);
    if (!isBareOrigin) return null;
    origins.push(entry);
  }
  return origins.length > 0 ? origins : null;
}

/** True when the request is served from this machine (wrangler pages dev). */
export function isLoopbackUrl(requestUrl: string): boolean {
  const { hostname } = new URL(requestUrl);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/**
 * @param allowTestSecrets Only true on a loopback host. Every other host, production and preview
 *   alike, refuses a Turnstile test secret, because it would let any token through.
 * @returns The settings, or null when something is missing or malformed.
 */
export function loadConfig(env: Env | undefined, allowTestSecrets: boolean): Config | null {
  const turnstileSecret = read(env?.TURNSTILE_SECRET_KEY);
  const resendApiKey = read(env?.RESEND_API_KEY);
  const contactTo = read(env?.CONTACT_TO);
  const originList = read(env?.ALLOWED_ORIGINS);
  if (turnstileSecret === null || resendApiKey === null || contactTo === null) return null;
  if (originList === null) return null;

  if (!allowTestSecrets && TURNSTILE_TEST_SECRET.test(turnstileSecret)) return null;
  if (!HEADER_SAFE.test(resendApiKey)) return null;
  if (!isValidEmail(contactTo)) return null;
  const origins = parseOrigins(originList);
  if (origins === null) return null;

  return {
    turnstileSecret,
    resendApiKey,
    contactTo,
    allowedOrigins: new Set(origins),
    allowedHostnames: new Set(origins.map((origin) => new URL(origin).hostname)),
  };
}
