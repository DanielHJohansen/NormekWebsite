# Launch checklist

Status on 8 November 2026. Nothing here is done unless ticked. The private preview comes first. The public launch needs every item. Owners: D is Daniel, A is an assistant. Evidence is in the reports named in each row.

## 1. Before anyone outside sees the preview

- [ ] **D** Make the GitHub repository private (security review S1). It is public today.
- [ ] **D** Two-factor at Simply, your mailbox and GitHub, before any new account (setup guide Part 0).
- [ ] **D** Follow the rest of `docs/ops/cloudflare-and-resend-setup.md`: Cloudflare Pages project, Turnstile widget, Resend, the keys in the Pages settings only, the data processing agreements.
- [ ] **D** Decide the public mailbox address (`docs/open-questions.md` item 35).
- [ ] **A** After setup: allow the two preview hostnames in the session environment, then run one real send. Check that the email arrives, `/thanks/` shows, replaying the token gives 403, and `curl -sI` shows the headers from the threat model.
- [ ] **A** One submit with the real Turnstile widget, with zero CSP errors in the console.
- [ ] **D** A 10 minute screen reader pass: empty submit, a failed person check, the offers lists, the hero image, the thank-you heading (QA report).
- [ ] Testers are invited only. The preview still shows `[TO CONFIRM]` tags.

## 2. Before the site is public

**Name and company**
- [ ] The name is cleared at CVR, EUIPO TMview and the Danish Patent and Trademark Office, and a trademark professional has looked (item 1).
- [ ] Legal form, CVR number, address and insurance are known and in the footer (items 2 and 27).

**Words and facts**
- [ ] Every `[TO CONFIRM]` is filled or its sentence is cut. `PUBLIC_INDEXABLE=true npm run build` then `npm run check:dist` must pass. It fails today on 57 of them.
- [ ] Every claim has a row in `docs/claims-ledger.md` with evidence, or it is removed. Targets stay labelled as targets.
- [ ] Daniel signs the heat and antenna notes, the voltage line, the CAD system, the city, who prints, who covers if he is ill, the reply time and the project cap (items 22 to 26, 34).
- [ ] The five person phone test on headlines A, B and C is done with real people.
- [ ] A real photo and the LinkedIn link are in place (item 30).

**Legal**
- [ ] A Danish lawyer reviews the privacy notice, the NDA and ownership wording, and the terms (`docs/legal/`).
- [ ] The browser storage test of Turnstile after first focus is done and the notice says what it found.
- [ ] Retention is decided and followed (item 27).

**Security**
- [ ] Branch protection on `main` (needs GitHub Pro on a private repo), secret scanning and push protection are on.
- [ ] A rate limit decision for the form is recorded (function review F1, `web-architect`).
- [ ] The live header check and the real widget check pass on the production host.
- [ ] The Dependabot pull requests are reviewed.

**Quality**
- [ ] WebKit and Firefox are tested, on a real iPhone and an Android phone.
- [ ] Lighthouse on the live host meets the budgets. Link previews are tested in LinkedIn, Slack and WhatsApp (the Cross-Origin-Resource-Policy header may hide the card image).

**Search and measurement**
- [ ] The analytics choice is made (item 28, ADR 0002). Search Console is set up with one DNS TXT record.
- [ ] `PUBLIC_INDEXABLE`, `CF_PAGES_BRANCH=main` and `SITE_URL` on the www address are set together. The catch-all noindex line is gone from the generated `_headers`.
- [ ] JSON-LD (Organization, Person, WebSite) is switched on under the conditions in the security review.

**Domain and mail**
- [ ] `www` CNAME to Pages and an unframed 301 forward from the bare domain, both through the Simply connector with your approval (item 29).
- [ ] The three Resend records on `notify.normek.dk`, SPF, DKIM and DMARC read and tested, and a real inquiry lands in your inbox.

## 3. After launch

- [ ] `sales-enablement-advisor` sets up the reply templates, the NDA flow and the scoping questions when the first inquiry arrives.
- [ ] Review `form_submit` per week by source once analytics runs, and the key page briefs in `docs/ux/page-briefs.md` section 9.
