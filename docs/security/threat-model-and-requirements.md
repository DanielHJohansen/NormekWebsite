# Threat model and security requirements: v0 preview

Owner: `security-engineer`, 2026-11-08. Task 5 in `docs/plan/work-breakdown.md`, and the baseline for the launch gate.

**Tested:** nothing live. Nothing is deployed, and DNS lookups were blocked from this session, so the DMARC policy behind Simply's CNAME is unread. Cloudflare, Resend and Turnstile behaviour is from documentation as I know it, so "verify" items need one real check.

## 1. Threat model

| Component | Main threats | Key controls |
|---|---|---|
| Static site | XSS through content or a compromised script, clickjacking, preview indexed or shared | Strict CSP (section 2), no inline script, `noindex` everywhere, nothing confidential in content |
| `/api/contact` | Spam and mail bombing of Daniel, using the form to mail strangers, header injection, personal data in logs, quota exhaustion, Turnstile bypass | Section 3 |
| GitHub repo and CI | Malicious npm package or install script, compromised Action, secret committed, direct push to `main` | Lockfile and `npm ci`, actions pinned by hash, `permissions: contents: read`, gitleaks, branch protection on `main`, Cloudflare app limited to this repo |
| Simply account | Takeover gives domain, DNS, DNSSEC, nameservers and the mailbox. Mailbox access resets every other account | Two-factor first (section 6), recovery address outside normek.dk |
| Cloudflare account | Takeover swaps the site | Two-factor, one member, audit log |
| Resend account | Sends as `notify.normek.dk`, reads inquiry copies | Two-factor, sending-only key |
| Simply connector | A prompt injection (web page, inquiry, tool output) steers an assistant to change DNS or nameservers | Write tools on "ask", nameserver and DNSSEC tools off, one change at a time, revoke when idle |
| AI tooling | Customer material sent to tools without no-training or retention terms, secrets pasted into chat, injection through other connectors (Gmail, GitHub, Slack) | `docs/security/ai-data-handling.md`, never paste secrets, assistants never read inquiries in v0 |

## 2. Headers for `public/_headers`

The CSP needs no hashes if Astro emits no inline code. Set `build.inlineStylesheets: 'never'` and `vite.build.assetsInlineLimit: 0` in `astro.config.mjs`. Never use `define:vars`, `is:inline` or `style=""` attributes. `check-dist.mjs` fails on any `<script>` without `src`, any `<style>` element, `style=` attribute or `on*=` handler. Setting `element.style` from JavaScript is fine.

### 2.1 File content (paste as is)

```
# Normek security headers. Source: docs/security/threat-model-and-requirements.md
/*
  Content-Security-Policy: default-src 'none'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; form-action 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: same-origin
  Permissions-Policy: accelerometer=(), browsing-topics=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), hid=(), magnetometer=(), microphone=(), midi=(), payment=(), serial=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  X-Robots-Tag: noindex, nofollow
```

Notes:

- One CSP for all routes. Loading Turnstile only when the form is in view is done in JavaScript. A tighter CSP without Turnstile on `/privacy/` and the 404 needs Cloudflare's `! Header` detach syntax: optional, verify with `curl -sI` first.
- No `Cross-Origin-Embedder-Policy`: `require-corp` would block the Turnstile frame.
- `Referrer-Policy: same-origin` keeps the preview hostname private. If Turnstile reports a domain error, use `strict-origin-when-cross-origin`.
- Do not add `data:` or `'unsafe-inline'` to make a warning go away. Report the violation to `security-engineer`.

### 2.2 Preview and launch

Now every deployment gets `noindex` from the `/*` rule. At launch, generate `_headers` from `PUBLIC_INDEXABLE`: drop that line from `/*` and keep it on the `pages.dev` hosts only (host rules with placeholders, verify at launch):

```
https://normek-web.pages.dev/*
  X-Robots-Tag: noindex, nofollow

https://:alias.normek-web.pages.dev/*
  X-Robots-Tag: noindex, nofollow
```

### 2.3 HSTS and preload

`.dev` is already preloaded, so HSTS adds nothing on `pages.dev`. At launch it protects `www.normek.dk`. **Preload is not safe yet**: Simply's URL forwarder serves the apex and we cannot set the header there, `autoconfig` and the wildcard point at servers we do not control, and removal takes months. Preload only once the apex is ours, every subdomain serves valid HTTPS and the name is cleared.

### 2.4 Function responses

`_headers` does not apply to responses from Pages Functions. The function sets its own:

```
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
Referrer-Policy: no-referrer
X-Robots-Tag: noindex
```

## 3. Contact function requirements

Each line is a unit test. "Rejected" means no siteverify and no `sendMail()` call. Limits are defaults until the form brief sets them.

1. **CF-01 Method.** Only `POST`. Anything else returns 405 with `Allow: POST`. No response ever carries `Access-Control-Allow-*`.
2. **CF-02 Origin.** `Origin` must equal an entry in `ALLOWED_ORIGINS` exactly (scheme and host, no trailing slash). Missing, `null`, a lookalike (`https://normek-web.pages.dev.evil.example`) or a commit-hash preview host returns 403, rejected.
3. **CF-03 Content type.** Media type `application/x-www-form-urlencoded` (a `charset=utf-8` parameter allowed). `multipart/form-data`, `application/json`, `text/plain` or none returns 415, rejected.
4. **CF-04 Size.** `Content-Length` above 16,384 returns 413 before the body is read. A body without `Content-Length` is read with a byte counter and returns 413 at 16,385 bytes.
5. **CF-05 Fields.** Allowed: `name`, `email`, `company`, `message`, `website` (honeypot), `cf-turnstile-response`. An unknown field (for example `to`, `cc`, `subject`) or a repeated field returns 400, rejected.
6. **CF-06 Honeypot.** A non-empty `website` returns 200 with a body identical to a real success, rejected.
7. **CF-07 Validation.** After trim and Unicode NFC: `name` 1 to 100 characters, `email` at most 254 with exactly one `@`, no whitespace and a dot in the domain, `company` 0 to 120, `message` 20 to 5,000. `name`, `email` and `company` with CR, LF, U+0000 to U+001F, U+007F to U+009F, U+2028, U+2029, U+202A to U+202E or U+2066 to U+2069 (bidi overrides and isolates) return 400. `message` allows LF and tab only, CRLF is normalized to LF. The 400 body lists field names, never values.
8. **CF-08 Turnstile, fail closed.** Missing token or a token over 2,048 characters returns 403 without a siteverify call. Mail is sent only when siteverify returns HTTP 200, valid JSON, `success === true`, `hostname` in the allowed list and `action === "contact"`. Non-200, invalid JSON, network error, a 5 second timeout or `success: false` returns 403 or 503, no mail. A missing `TURNSTILE_SECRET_KEY` returns 500, it never skips the check. In production, a Turnstile test secret (starts with `1x0000`, `2x0000` or `3x0000`) returns 500.
9. **CF-09 Order.** Method, origin, type, size, fields, honeypot and validation run before siteverify. Siteverify runs before `sendMail()`.
10. **CF-10 Mail content.** One `sendMail()` call per accepted request. `to` is `CONTACT_TO` from the environment. `from` is a constant (`@notify.normek.dk` at launch, Resend's test sender in preview). `subject` is a constant with no user input. `reply_to` is the validated email alone, with no display name built by string joining. Body is `text` only, with no `html` field.
11. **CF-11 No auto-reply.** Across the whole suite, every `sendMail()` call has `to === CONTACT_TO`. No code path sends to the visitor.
12. **CF-12 Mail failure.** Provider non-2xx, network error or a 5 second timeout returns 502 with a generic code. No retry loop.
13. **CF-13 No personal data in logs.** With every `console` method spied, no output contains any submitted value, the token, the IP address or a secret. Allowed: a fixed event code and a status number. Exceptions are caught and never logged with the request body.
14. **CF-14 Responses.** Body is `{"ok":true}` or `{"ok":false,"error":"<code>","fields":[...]}`. No input or secret is echoed (test with sentinel values). Headers as in section 2.4.
15. **CF-15 Config.** A missing `RESEND_API_KEY`, `CONTACT_TO` or `ALLOWED_ORIGINS` returns 500 and sends nothing.

### 3.1 Rate limiting on the free tier

| Option | Works with DNS at Simply | Cost | Notes |
|---|---|---|---|
| Turnstile plus Resend's 100 a day cap | Yes | 0 | v0 baseline. An attacker can still use up the day's cap |
| Workers rate limiting binding, keyed on a hash of `CF-Connecting-IP`, for example 5 per minute, then 429 | Pages Functions support [TO CONFIRM] | 0 | Approximate, per location. Recommended before launch if supported |
| KV counter with a 1 hour expiry | Yes | 0 within free limits (writes per day [TO CONFIRM]) | Eventually consistent, so leaky. The write limit can itself be exhausted |
| Durable Object counter | Yes | 0 on free plan [TO CONFIRM] | Exact, needs a separate Worker |
| WAF rate limiting rules | No, needs the zone on Cloudflare | 0 for one rule | Not available while DNS stays at Simply |
| Workers Paid | Yes | 5 US dollars a month | Only if the free daily request limit for Functions is reached |

A hashed IP is personal data: keep it at most 1 hour and list it on the privacy page.

## 4. Resend records on `notify.normek.dk` (launch)

Expected from ADR A5: DKIM TXT at `resend._domainkey.notify`, MX and SPF TXT at `send.notify`. Exact values come from the Resend console [TO CONFIRM].

Checks before Daniel approves, each read back through the connector and by a DNS lookup:

1. The names resolve as `resend._domainkey.notify.normek.dk` and `send.notify.normek.dk`, not `...normek.dk.normek.dk`.
2. The DKIM TXT value, joined across its 255-character strings, matches the console exactly.
3. The apex still has exactly one SPF record, `v=spf1 include:spf.simply.com -all`, unchanged. Amazon SES is never added to the apex.
4. Nothing is added at `_dmarc`, `simplycom1._domainkey`, `simplycom2._domainkey` or the apex MX. A TXT next to the `_dmarc` CNAME is invalid DNS.
5. No CNAME at `notify` itself.
6. Read the delegated DMARC policy (`_dmarc.normek.dk` resolves to Simply's record). If it uses `adkim=s` or `aspf=s`, mail must come from `@notify.normek.dk`, never `@normek.dk`. Note `p` and `sp`: under `quarantine` or `reject` a mistake hides inquiries.
7. DNSSEC still validates after the change (DNSViz or a validating resolver, no errors).
8. A test inquiry arrives at daniel@normek.dk with `dkim=pass header.d=notify.normek.dk` and `dmarc=pass` in `Authentication-Results`.

What breaks mail: a second apex SPF record (both then fail), replacing the `_dmarc` CNAME, deleting a Simply DKIM CNAME, or a DNSSEC break during a nameserver move.

## 5. Secrets

| Secret | Lives in | Never in |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Cloudflare Pages, encrypted, Production and Preview | Repo, chat, CI |
| `RESEND_API_KEY` | Pages, encrypted. One key per environment, sending access only, limited to the domain once verified | Repo, chat, CI, laptops |
| `CONTACT_TO`, `ALLOWED_ORIGINS`, Turnstile site key | Plain Pages variables (not secret) | |
| Simply access | OAuth connector only | Any Simply API key, ever |
| GitHub Actions | Default `GITHUB_TOKEN`, read only | No deploy or Cloudflare token |
| Recovery codes, mailbox password | Password manager and paper offline | Repo, chat, cloud notes |

Local development uses Turnstile test keys and a no-op mail adapter. `.gitignore` covers `.dev.vars`, `.env*` and `.wrangler/`.

**Rotation:** create a new key, update the Pages secret in both environments, redeploy, send a test inquiry, delete the old key, then check the provider's log for sends you did not make. Turnstile: use the widget's rotate option, then the same steps.

**Detection:** gitleaks in CI over full history and as a pre-commit hook, GitHub secret scanning and push protection (on a private personal repo [TO CONFIRM]), Resend's sent log, Cloudflare's audit log. On exposure, rotate first. Scan history before the repo is ever made public.

## 6. Account hardening for Daniel (in order)

1. **Simply.com:** two-factor on, recovery codes offline, recovery email outside normek.dk, check login logs and Connected apps, turn on registrar lock if offered [TO CONFIRM].
2. **GitHub:** passkey or authenticator two-factor, recovery codes offline, branch protection on `main` (required checks, no direct push, no force push), review installed apps (only Cloudflare, on this repo).
3. **Cloudflare:** authenticator or security key, no other members, only the Pages project and Turnstile widget.
4. **Resend:** two-factor, one sending-only key per environment, no team members.
5. **Mailbox daniel@normek.dk:** long unique password, two-factor if Simply offers it [TO CONFIRM]. It can reset the other accounts.
6. **Claude account:** two-factor (its connectors reach Simply and GitHub), write tools on "ask".

## 7. Risks for the preview stage

| ID | Severity | Risk | Fix | Owner | Verify |
|---|---|---|---|---|---|
| R1 | High | Simply account without two-factor (status [TO CONFIRM]) | Section 6, step 1 | Daniel | Simply security settings |
| R2 | High | Turnstile check skipped or fails open | CF-08 | `frontend-developer` | Unit tests |
| R3 | High | Function usable as an open mail relay | CF-05, CF-10, CF-11 | `frontend-developer` | Unit tests |
| R4 | High | GitHub without two-factor or `main` unprotected | Section 6, step 2 | Daniel, `devops-engineer` | Settings, Branches |
| R5 | Medium | Inline script or style forces `unsafe-inline` | Section 2 build settings, `check-dist` | `frontend-developer` | `curl -sI` plus zero CSP errors in the console on `/` |
| R6 | Medium | Personal data in logs | CF-13 | `frontend-developer` | Unit tests, Workers logs off |
| R7 | Medium | Mail bombing within 100 a day | Section 3.1 | `frontend-developer` | 429 test |
| R8 | Medium | Unpinned Actions or install scripts | ADR A8 | `devops-engineer` | Review `ci.yml` |
| R9 | Medium | Prompt injection through the Simply connector | Connector rules | Daniel | Connector permissions page |
| R10 | Low | Preview indexed | `X-Robots-Tag`, `robots.txt` | `frontend-developer` | `curl -sI` |
| R11 | Low | No CAA record, wildcard record | Add CAA for Let's Encrypt and the CAs Cloudflare uses [TO CONFIRM], drop the wildcard at go-live | `devops-engineer` | Zone read |
| R12 | Info | Processors missing from privacy page | List Cloudflare, Resend, Simply | `legal-compliance-advisor` | Privacy page |

**Launch gate:** no open Critical or High. R1 to R4 must be closed, the section 4 checks passed, `ai-data-handling.md` filled or no AI-handling claim made on the site, and the name cleared.
