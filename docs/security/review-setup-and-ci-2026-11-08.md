# Security review: setup guide, CI and repo hardening (2026-11-08)

Owner: `security-engineer`. Baseline: `docs/security/threat-model-and-requirements.md`.

**Tested:** every listed file, two action SHAs against their tags (match), repo visibility by GitHub API (**public**). **Not tested:** live headers, Turnstile, Cloudflare and Resend screens, `functions/`.

## Findings

| ID | Sev | File and line | Issue | Exact fix |
|---|---|---|---|---|
| S1 | High | GitHub repo settings | The repo is public. It exposes the internal AI method Daniel chose not to state, strategy, name risk and this threat model. | Daniel decides now. Default: private plus GitHub Pro (private branch protection needs a paid plan, verify). Treat everything pushed as published. |
| S2 | High | `cloudflare-and-resend-setup.md` 99, 229 | Accounts are created before Simply, the mailbox and GitHub have two-factor (R1, R4). The mailbox resets Cloudflare and Resend. | Add "Part 0": threat model section 6 steps 1, 2 (two-factor only) and 5. Move Part 9 step 1 into it. |
| S3 | High | setup guide 235 | Branch protection as written lets Daniel, as admin, bypass it, and "require a pull request" with one person needs 0 approvals. `main` deploys the live form now, so this cannot wait. | Rule on `main`: require a pull request with 0 approvals, required checks **Checks**, **Lighthouse**, **Secret scan**, branch up to date, block force push and deletion, tick **Do not allow bypassing**. Do it in Part 0. |
| S4 | Medium | `.npmrc` | Cloudflare's build installs with install scripts on, and Pages variables, secrets included, are likely visible to the build (verify at the time). A hijacked package could steal keys. | Add `ignore-scripts=true` to `.npmrc`. CI already proves the build works without scripts. |
| S5 | Medium | `ci.yml` 173 | `npx --yes @lhci/cli@0.15.1` resolves transitive packages outside the lockfile, with scripts on. | Add `@lhci/cli` to devDependencies and run `npx lhci autorun`. |
| S6 | Medium | setup guide Part 5, Part 8 | No step accepts the Resend and Simply data processing agreements (legal row 3), yet testers may submit real data. | Part 5 step 6: accept Resend's DPA. Part 0: accept Simply's DPA. Add both to Part 8. |
| S7 | Medium | setup guide Part 6, threat model 3.1 | Rate limiting is silent. A WAF rule is impossible (zone not on Cloudflare). A Workers rate limiting binding on Pages likely needs a wrangler file, which Part 6 step 1 forbids. | Guide says: create no WAF or rate limiting rule. R7 is accepted for preview (Turnstile plus Resend's 100 a day). `web-architect` decides the binding before launch. |
| S8 | Medium | `public/_headers` 11, guide A7 | Nothing generates `_headers` from `PUBLIC_INDEXABLE`, so A7 step 1 fails `check:dist`. | `frontend-developer`: build step writes `dist/_headers` without the `/*` noindex line plus `https://:project.pages.dev/*` and `https://:version.:project.pages.dev/*` noindex rules. A7 step 3 also curls a commit-hash host. |
| S9 | Low | setup guide 229 to 238 | Steps 5 and 6 are stale (public repo, actions pinned). | Turn on secret scanning, push protection and SHA pinning now. In **Actions, General**: workflow permissions read only, untick "create and approve pull requests", require approval for all outside contributors. |
| S10 | Low | setup guide 126 | Cloudflare builds every branch until Part 3. | Do Part 3 before any push. |
| S11 | Low | ADR 0001 line 173 | A10 says the CSP allows the challenge host for `connect`. Turnstile needs script and frame only, as `_headers` has. | Correct A10. Widen only after a recorded violation. |
| S12 | Low | setup guide 341 | Resend tracking would rewrite links. | A6: open and click tracking off. |
| S13 | Low | `ci.yml` 204 | gitleaks skips `dist/`, missing secrets inlined at build. | Add `gitleaks dir dist` after the build in Checks. |
| S14 | Low | setup guide Part 8 | No Turnstile storage test. | Add legal row 4's browser test after first focus. |
| S15 | Info | `ci.yml` | Sound: read-only permissions, `pull_request` only, no untrusted text in `run`, pinned actions, no secrets for forks or Dependabot, checksum-verified gitleaks, audit gate per A9. | None. |

**Question 2, Lighthouse with `PUBLIC_INDEXABLE`:** safe. No deploy token exists and the build is thrown away.

**Mail records:** the plan is right. With From on `notify.normek.dk`, DKIM `d=notify.normek.dk` aligns even under strict DMARC, and SPF for `send.notify` aligns under relaxed only. Apex records stay untouched, and the A-only wildcard does not interfere. Simply's `p` and `sp` still need reading (threat model 4, check 6).

**Question 3:** `_headers` matches section 2.1 exactly. Functions set their own (section 2.4).

**Question 4, JSON-LD:** CSP governs executed scripts. A `application/ld+json` block is data and needs no hash or `unsafe-inline`. `check-dist.mjs` line 47 may allow it if all hold: type exactly `application/ld+json`, no other attributes, at most one per page and inside `<head>`, the body parses as JSON, and contains no `<`, so `</script>` cannot break out (serialize with `JSON.stringify` and replace `<` with `<`). Content only from `src/config/site.ts`, with a failing fixture per rule.

**Question 5, Turnstile:** needs `script-src https://challenges.cloudflare.com` and `frame-src https://challenges.cloudflare.com`. `connect-src` stays `'self'`. Verify zero CSP console errors after first focus.

## Daniel must know

- Your code repository is public today. Decide whether it should be, before anything else.
- Turn on two-factor at Simply, your mailbox and GitHub before creating Cloudflare and Resend accounts. Your mailbox can reset all of them.
- Keys go only into your password manager and the provider's own page. Never paste one into Claude, a chat, an email or a file.
- If a key ever appears anywhere else, delete it at the provider first, then tell an assistant without repeating it.
- Accept the data processing agreements at Resend and Simply before anyone else tests the form.

## Ready for Daniel to follow?

No, not yet. Yes once S1 is decided, Part 0 (S2, S3, S6) is added, and S4 is merged. Appendix A also needs S8 and the Simply DMARC read.
