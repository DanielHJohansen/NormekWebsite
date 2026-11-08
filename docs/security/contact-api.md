# Contact API contract: `POST /api/contact`

Owner: `frontend-developer`, 2026-11-08. This is the contract between the contact function (`functions/api/contact.ts` and `functions/_lib/`) and the form client in `src/`. The rules behind it are CF-01 to CF-15 in `docs/security/threat-model-and-requirements.md` section 3. If a status or a code changes, this file changes first and the person building the form client is told.

**Tested:** by unit tests only (`tests/unit/contact-*.test.ts`, no network, `fetch` mocked). Nothing was run against a real Cloudflare, Turnstile or Resend account.

## 1. What the client sends

- `POST /api/contact` on the same origin as the page. The browser adds the `Origin` header itself.
- `Content-Type: application/x-www-form-urlencoded`, with or without `; charset=utf-8`. Build the body with `new URLSearchParams(...)`. Do not post a `FormData` object, because that is `multipart/form-data` and gets 415.
- At most 16,384 bytes after encoding.
- Only these field names, each at most once, all lower case: `name`, `email`, `company`, `message`, `website`, `cf-turnstile-response`. Any other name (for example `situation`, `source`, `to`, `subject`) gets 400 `bad_request`. The Turnstile widget adds `cf-turnstile-response` by itself.
- Render the Turnstile widget with the action `contact` (`data-action="contact"`). The function rejects a token minted for any other action.
- `website` is the honeypot. It must stay empty for people. Give it `autocomplete="off"` and `tabindex="-1"`. A browser that autofills it makes a real visitor look like a bot, and that visitor sees success while nothing is sent.

## 2. Field rules

Applied after trimming and Unicode normalization form C (NFC). Length counts Unicode code points. The form's own `maxlength` counts UTF-16 code units, so it is never looser than these limits.

| Field | Rule |
|---|---|
| `name` | 1 to 100 characters. No control characters |
| `email` | At most 254 characters. Exactly one `@`, no spaces, a dot in the domain. Local part from letters, digits and ``.!#$%&'*+/=?^_`{\|}~-`` with no leading, trailing or doubled dot. Domain labels from ASCII letters, digits and hyphens. This is what `type="email"` accepts, minus the cases above |
| `company` | 0 to 120 characters, so it may be empty. No control characters |
| `message` | 20 to 5,000 characters. Line breaks and tabs are allowed, CRLF counts as one line break. No other control characters |
| `website` | Must be empty |
| `cf-turnstile-response` | 1 to 2,048 characters |

Control characters are U+0000 to U+001F, U+007F, U+2028 and U+2029. In `message` only LF and tab are exempt.

## 3. Responses

Every response is JSON with the headers in section 4. Branch on `error`, never on the status alone, because 403 and 500 each carry two meanings.

| Status | Body | Meaning | Rule |
|---|---|---|---|
| 200 | `{"ok":true}` | Mail handed to the provider. A filled honeypot gets the same status, headers and body | CF-06 |
| 400 | `{"ok":false,"error":"validation","fields":["email"]}` | `fields` lists the failing fields of `name`, `email`, `company`, `message`, in that order, never their values | CF-07 |
| 400 | `{"ok":false,"error":"bad_request"}` | Unknown or repeated field, or a body that is not valid UTF-8. A client bug | CF-05 |
| 403 | `{"ok":false,"error":"turnstile"}` | The person check failed: token missing, too long, rejected, expired, already used, wrong hostname or wrong action | CF-08 |
| 403 | `{"ok":false,"error":"origin_not_allowed"}` | `Origin` is missing or not listed in `ALLOWED_ORIGINS`. Typical cause: the page was opened on a commit-hash preview address | CF-02 |
| 405 | `{"ok":false,"error":"method_not_allowed"}` | Not a POST. Carries `Allow: POST` | CF-01 |
| 413 | `{"ok":false,"error":"payload_too_large"}` | Body above 16,384 bytes | CF-04 |
| 415 | `{"ok":false,"error":"unsupported_media_type"}` | Not `application/x-www-form-urlencoded` | CF-03 |
| 500 | `{"ok":false,"error":"config"}` | A required variable is missing or malformed, or a Turnstile test secret is set on a host that is not localhost | CF-15, CF-08 |
| 500 | `{"ok":false,"error":"internal"}` | An unexpected exception. Nothing was sent | CF-13 |
| 502 | `{"ok":false,"error":"mail_failed"}` | The mail provider answered with an error, was unreachable or took longer than 5 seconds. No retry | CF-12 |
| 503 | `{"ok":false,"error":"turnstile_unavailable"}` | Turnstile could not be asked: it was unreachable, timed out after 5 seconds, answered with an error status, sent unreadable JSON or reported an internal or secret error. Nothing was sent | CF-08 |

`fields` appears only with `validation`. No response ever echoes a submitted value, the token, a secret or `CONTACT_TO`.

### What the client should do

| `error` | Show (copy brief, `docs/copy/v0-home-copy.md` section 3) | Widget |
|---|---|---|
| `validation` | The error summary and the field errors for `fields`. The client validates first, so this means the client and server rules differ | Keep |
| `turnstile` | "Person check failed" text | Reset |
| `turnstile_unavailable`, `mail_failed`, `config`, `internal`, `bad_request`, `unsupported_media_type`, `payload_too_large`, `origin_not_allowed`, `method_not_allowed` | "Send failed" text with the email fallback. Keep what the visitor typed | Reset |
| Anything else, a non-JSON body, a network error or a timeout | The same "Send failed" text | Reset |

A Turnstile token works once. The function spends it on every request that gets past validation, even when the mail then fails. So call `turnstile.reset()` after every response that is not 200, and wait for a fresh token before the next try.

The function can take about 10 seconds in the worst case (one call to Turnstile and one to the mail provider, each cut off at 5 seconds). Give the client request at least 15 seconds before it gives up.

There is no HTML or redirect response. A plain form post without script cannot pass the person check, so the path without script is the email link.

## 4. Response headers

Set by the function on every response, because `public/_headers` does not apply to Pages Functions (threat model section 2.4):

```
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
Referrer-Policy: no-referrer
X-Robots-Tag: noindex
```

A 405 adds `Allow: POST`. No response carries `Access-Control-*` headers, so the browser blocks every cross-origin read. An `OPTIONS` preflight gets 405.

## 5. Order of checks

The first failing check decides the response, and nothing after it runs:

1. Method (405)
2. Configuration (500)
3. `Origin` (403)
4. Content type (415)
5. Size, first from `Content-Length` before the body is read, then by counting bytes (413)
6. Body decoding and field names (400 `bad_request`)
7. Honeypot (200)
8. Field rules (400 `validation`)
9. Turnstile token present, then asked (403, 503)
10. One mail to `CONTACT_TO` (502)

## 6. Configuration

Names match `docs/ops/cloudflare-and-resend-setup.md`. A missing or empty value makes every POST return 500 `config` and send nothing.

| Variable | Kind | Format |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Secret | The widget's secret key. A test secret (starts with `1x0000`, `2x0000` or `3x0000`) is accepted only when the request is served from `localhost`, `127.0.0.1` or `[::1]` |
| `RESEND_API_KEY` | Secret | A sending-only key |
| `CONTACT_TO` | Text | One plain email address. The only recipient of any mail |
| `ALLOWED_ORIGINS` | Text | Comma separated list of origins, for example `https://normek-web.pages.dev,https://www.normek.dk`. Scheme and host only (port if not default), lower case, no path, no trailing slash, no wildcard. A malformed entry is a `config` error. The hostnames of these origins are also the hostnames Turnstile may report |

`PUBLIC_TURNSTILE_SITE_KEY` is read at build time by the page, not by the function.

For local runs copy `.dev.vars.example` to `.dev.vars` (gitignored). It uses Cloudflare's public test secret and fake values.

## 7. Not done by the function

- **Rate limiting.** The function is stateless, keeps no counter and never returns 429. The only caps today are Turnstile and the provider's 100 mails a day. See threat model section 3.1 and risk R7.
- **Auto-reply.** No mail ever goes to the visitor. The visitor's address is only the `Reply-To` of the mail to `CONTACT_TO`.
- **Logging of personal data.** The function logs at most a fixed event name and a status number, and only on a failure. Request logs in the Cloudflare dashboard stay off.
- **Sender address.** The constant `MAIL_FROM` in `functions/_lib/inquiry.ts` is Resend's test sender for the preview. At launch it changes to an address on `notify.normek.dk`.
