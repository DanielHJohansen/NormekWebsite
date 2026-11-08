# Security review: contact function, 2026-11-08

Owner: `security-engineer`. Scope: `functions/`, the contract, `.dev.vars.example`, `.gitleaksignore`, the contact tests and the form client's request code.

**Tested:** read every file above. `npm test` passes (721 tests, 17 files). Ten mutations in a scratch copy: four survived. One was equivalent (a second status check still guards), the other three are F3 to F5. gitleaks v8.30.1 (the CI version) over the full history of a scratch clone. **Not tested:** a real deployment, real Turnstile or Resend answers, workerd beyond the author's Miniflare run.

## Verdict on CF-01 to CF-15

All 15 hold as written. The config check precedes the origin check (`handle.ts:42`), as the contract documents.

Beyond the rules, these hold too:

- **Injection:** constant subject and sender, `reply_to` is the validated address alone, `text` body only. Visitor text never reaches a header.
- **Unicode:** trim, NFC, code point length and control check all run on the same string.
- **ReDoS:** none. The length gate runs first and the patterns cannot backtrack.
- **Body:** a lying or missing `Content-Length` falls through to the byte counter, which cancels the stream at 16,385 bytes.
- **Fields and origin:** unknown, repeated or recased names give 400. Absent, `null` or lookalike origins give 403.
- **Turnstile:** exact hostname and action, token reuse refused by siteverify (`timeout-or-duplicate`), fail closed on every other answer.
- **Errors, redirects, timeouts:** one catch-all logging a fixed event only. With `manual` a 3xx is a failure and the key never follows it. 5 second abort plus a racing timer.
- **Recipient:** no path sends mail to an address the visitor controls. `to` is only `CONTACT_TO`, checked as one plain address.

**Test secret guard (`env.ts:69`):** sound. Cloudflare routes on Host, so `localhost` never reaches the project, and `X-Forwarded-Host` is never read. Anything not exactly loopback is refused.

**`.gitleaksignore`:** safe and narrow. Without it gitleaks reports one finding (commit `c7b87de`, line 32), the fake marker `SENTINEL-turnstile-secret-71c2`. The entry pins commit, file, rule and line.

## Findings

| ID | Severity | File and line | Issue | Exact fix |
|---|---|---|---|---|
| F1 | Medium | `_lib/handle.ts` (whole flow) | Known risk R7: no rate limit. Each mail costs one solved Turnstile, so a solver service can use the 100 a day Resend cap | Accepted for the preview. Before launch add the rate limiting binding (threat model 3.1) or record acceptance |
| F2 | Low | `_lib/validate.ts:36-43` | Name, email and company accept C1 controls (U+0080 to U+009F, including NEL U+0085) and bidi overrides (U+202A to U+202E, U+2066 to U+2069). No header injection, but they can reorder or fake a line in Daniel's mail client | Also refuse `/[\u0080-\u009f‪-‮⁦-⁩]/` in all four fields. Update CF-07, `contact-api.md` section 2 and the client's `normalizeValue` together, with tests |
| F3 | Low | `tests/unit/contact-mail.test.ts` CF-12, `_lib/mail.ts:47` | Mutation `status < 400` survived: no test sends a 3xx from Resend. Same gap for a 302 from siteverify (`_lib/turnstile.ts:66,78`) | Add cases 301, 302, 307 and 308 with a passing body: expect 502 for Resend and 503 for Turnstile, and no mail |
| F4 | Low | `tests/unit/contact-turnstile.test.ts`, `_lib/fetch-timeout.ts:28` | Mutation moving `read` outside the timer survived: no test feeds a 200 whose body never ends | Siteverify answers 200 with a `ReadableStream` that never closes. With fake timers expect 503 after 5,000 ms |
| F5 | Low | `tests/unit/contact-turnstile.test.ts` "on this machine", `_lib/env.ts:71` | Mutation `endsWith("localhost")` survived | Add refused hosts `evil-localhost`, `localhost.`, `127.0.0.2` and `0.0.0.0` |
| F6 | Low | `src/lib/contact-form.ts:21`, `_lib/form.ts:8` | A 2,000 character message in emoji or CJK script encodes to up to 24,000 bytes and gets 413. The visitor sees only "Send failed" | In `encodeBody` callers, check the encoded byte length before posting and show the message-length error |
| F7 | Info | `_lib/handle.ts:70` | The honeypot answers at once, a real send takes about a second, and the honeypot runs before validation. A bot could learn the trap | Accept |
| F8 | Info | `_lib/handle.ts:42-46` | Any POST learns that configuration is broken (500 `config`) before the origin check | Accept |
| F9 | Info | `_lib/form.ts:110` | Percent-encoded invalid UTF-8 becomes U+FFFD, not 400 as the contract wording suggests | Accept, or say "raw body bytes" in the contract |
| F10 | Info | `_lib/turnstile.ts:86`, `.dev.vars.example` | Test secrets may report a fixed hostname [TO CONFIRM], so a local run could always give 403 | Try once locally. Never loosen the check |

No Critical or High finding.

## Ready to deploy to the preview?

**Yes**, once these conditions hold:

1. Preview variables are set in the Preview environment only: a real `TURNSTILE_SECRET_KEY` and a sending-only `RESEND_API_KEY`, both encrypted.
2. `ALLOWED_ORIGINS` for Preview is exactly the HTTPS preview alias. No `localhost`, no `http`, no production host.
3. `CONTACT_TO` is the address that owns the Resend account, because the test sender delivers only there.
4. The build gets the real `PUBLIC_TURNSTILE_SITE_KEY`, and the Turnstile widget's hostname list holds only the preview host.
5. Function request logs stay off.
6. One live check after deploy:
   - a real submission arrives
   - replaying its token gives 403 `turnstile`
   - `curl -sI` on `/api/contact` shows the section 2.4 headers
   - a commit-hash URL gives 403
7. F1 stays open for launch, not for the preview. F2 to F5 should land before the launch gate.
