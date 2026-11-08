# Sitemap and page briefs

Status: draft, 2026-11-08. Author: `ux-conversion-designer`. Readers: Daniel, the manager, `ui-designer` (sections 3 and 7 are the layout brief for Claude Design) and `content-copywriter`. Copy shown is intent, not final text. Q numbers are items in `docs/open-questions.md`. `[TO CONFIRM]` marks a missing fact. `[HOLD]` marks a slot that stays empty until its blocker clears.

## 1. Goals and primary conversion

The site does not create demand. It converts people who already heard of Daniel through outreach or a partner (consult, Q3). Its jobs, in order:

1. Pass the five second test: what Normek does, for whom, why believe it, what to do next.
2. Answer what stops a reply: who is this, can they do my box, what does it cost and take, can I trust them with my files.
3. Collect enough scoping detail for a useful reply before any call.
4. Show which source and which situation produce inquiries.

**Primary conversion: one submitted inquiry**, from one button, "Request a feasibility review" (Q14). A tick box in the form, "Start with a 30 minute call", makes the call the next step instead of a second button. `daniel@normek.dk` is the plain text fallback, never a button. One action beats two, and a calendar embed needs a third party script and an ADR. Daniel must supply a reply time he can keep.

Audiences. P1: founder or CTO of a 5 to 20 person electronics startup. P2: head of engineering at a 50 to 300 person industrial electronics firm. P3: IP-conscious reviewer. Journeys. J1: finished board, no box. J2: prototype enclosure failed or costs too much. J3: 500 to 5,000 units and tooling. J4: can I trust you with my files and IP.

## 2. Sitemap

v0, private preview:
- `/` Home, one page. Anchors `#situations #process #scope #files #founder #contact` double as outreach deep links.
- `/privacy` Privacy notice, written by `legal-compliance-advisor`. A plain-language summary box on top (what we collect, why, how long, who processes it). Linked beside the form button and in the footer.
- `/thanks` Confirmation. Noindex, out of navigation. One URL beyond the agreed list, because the form needs it.
- 404. Says what happened, links home, repeats the button and the email. Fires `not_found`.

v1 drafts, hidden (not linked, not in `sitemap.xml`, noindex, a normal 404 in production): `/enclosure-design`, `/how-we-work`, `/data-and-ip`, `/work` with `/work/[slug]`, `/about`, `/contact`.

Navigation is identical in v0 and v1: Enclosure design, How we work, Data and IP, About, plus the button. In v0 these are anchors, so v1 changes links, not labels. Mobile shows logo and button only, no hamburger, and the anchors repeat in the footer. Build each v0 section as a reusable component, because each graduates to a page.

## 3. v0 home page, section by section

**3.1 Hero**
- Job: pass the five second test. Message: Normek designs enclosures for electronics teams that have a working board and no mechanical engineer, and a named engineer leads.
- Blocks: eyebrow "Enclosure design for electronics teams" (also separates us from similar names), headline, one-line subhead, button, email link, "Led by Daniel Hessellund Johansen, mechanical engineer". Headline candidate from the consult: "Your circuit board works. We build the box it ships in." Do not imply existing manufacturing partners (none confirmed). Art is a labelled illustration, never a stock photo.
- Proof. Have: name, degree. Needed: nothing more.
- CTA: the button.

**3.2 Situations** (`#situations`)
- Job: let J1 to J3 find themselves in ten seconds. Message: a standard box stops fitting at three moments.
- Blocks: three cards. "Finished board, no box." "Prototype box failed or costs too much." "From 10 prototypes to 500 to 5,000 units." Each has a symptom in an engineer's words, one line on what we do, and a link to the form that sets the hidden `situation` field.
- Proof. Have: nothing. The copy is a hypothesis until 15 to 20 interviews confirm the segment (Q9).
- CTA: card links go to the same form.

**3.3 Process** (`#process`)
- Job: show a visible process and a small first step. Message: three steps, each with a usable result, and a written scope before work starts `[TO CONFIRM, Q5]`.
- Blocks: Feasibility Review (you give board outline, connectors, environment, volume. You get standard box or custom, manufacturing route, rough unit cost range, risks). Prototype Sprint (CAD, one or two prototype rounds, fit check on your real board). Production Package (drawings, manufacturability review with a partner, supplier quotes, first batch support). Each card has duration and price slots `[HOLD]`. One more `[HOLD]` line for the consult's disclosure sentence (Q4, Q10).
- Proof. Have: the scopes as a plan. Missing: durations (target C-001), prices (hypotheses, Q5 and Q8), `mechanical-domain-expert` check. Render no duration or price yet.
- CTA: the button below the steps.

**3.4 Scope** (`#scope`)
- Job: show expertise and filter wrong leads. Message: what we take on, what we do not, and we recommend a standard box when it fits.
- Blocks: take on (sealed, outdoor, washdown, DIN rail and handheld housings for sensors, gateways, controllers). Do not take on: simulation-heavy studies (we build and test physical prototypes), production molding in-house (partners run production), medical, defense, automotive `[TO CONFIRM, Q9]`. A three-row table, volume to route: a few parts, 3D printing. Small runs, urethane casting, CNC or sheet metal. Volume that pays for tooling, injection molding or die casting through partners. One wording rule: "designed for IP67" means designed, and a lab test is named separately.
- Proof. Have: general engineering knowledge. Missing: `mechanical-domain-expert` verifies every threshold. No Normek numbers.
- CTA: the button.

**3.5 Files and IP** (`#files`)
- Job: answer J4 and P3 on the same page. Message: you describe the product in words, files follow a mutual non-disclosure agreement (NDA), and what we design for you is yours.
- Blocks: three promises. Link "Email daniel@normek.dk and ask for the NDA first". A `[HOLD]` slot for tools and data handling. A "last reviewed" date.
- Proof. Have: only "no upload on this site". Missing: NDA template and ownership wording (lawyer), tool inventory (Q4), disclosure decision (Q10).
- CTA: the button, plus the NDA email link.
- Launch gate: no public launch with the `[HOLD]` slot empty unless Daniel decides so knowingly. The consult rates silence the riskiest option.

**3.6 Founder** (`#founder`)
- Job: at this size trust is personal. Message: a mechanical engineer who built a company and builds prototypes early.
- Blocks: real workshop photo (compressed), name and role, facts of record (B.Eng., Aalborg University, 2017 to 2021. Co-founded SkyGrids, September 2022 to November 2025, exited by selling his shares), the method paragraph without the job-search line, a limits line ("Production tooling goes through manufacturing partners"), LinkedIn, email.
- Proof. Have: CV and LinkedIn facts, photos. Missing: SkyGrids publicity check (Q3), testimonials (Q16), cleared projects. No simulation claim.
- CTA: the button.

**3.7 Inquiry** (`#contact`)
- Job: convert and cut risk at the moment of action. Message: "Tell us about your board. A person replies within [1 working day, TO CONFIRM]."
- Blocks: the form (section 5), what happens next, email fallback, capacity line `[TO CONFIRM, Q7]`.
- Proof. Missing: a reply time Daniel can keep, privacy wording from legal.
- CTA: the submit button.

**3.8 Footer.** Logo tile, legal name, CVR number and address `[TO CONFIRM, Q2]`, email, Privacy notice, LinkedIn, anchors. The preview shows placeholders. Launch gate: none go public.

## 4. v1 page briefs (all DRAFT and hidden until the blocker clears)

Every page ends with the same button, linking to `/contact`, and fires `page_view` and `cta_click`. Only page-specific events are listed.

**Enclosure design.** Blocked by Q5, Q8, Q9, Q12 and the fact-check.
- Goal: the money page for search and referrals. Audience J1 to J3, P1, P2.
- Sections: what we design, deliverables with file formats `[TO CONFIRM]`, routes by volume with sourced typical tolerances, sealing and environment (designed for versus tested to), fixing a failed enclosure (seals, snap fits, heat, tolerance stack, cost drivers), the three packages with "from" prices after three interviews, sample deliverable, what we do not take on, FAQ only with genuine questions.
- Proof needed: a redacted manufacturability review and one measured reference design (neither exists), prices.
- Events: `section_view` (packages), `sample_view`.

**How we work.** Blocked by Q4, Q5, Q7, Q10.
- Goal: the process as a specification, for P2 and P1.
- Sections: three steps, each with your inputs, our outputs and a review gate. Human sign-off. Which steps use AI tools and which never do (geometry, tolerances, sealing, sign-off) `[TO CONFIRM against Daniel's real workflow]`. What we need from you (board outline, connector positions, mounting holes, height limit, environment, volume). Change requests and handover. Capacity.
- Proof needed: the measured build log. Show step order, not durations, until logged (C-001, C-002).
- Events: `section_view` (ai-use), `checklist_download` if the checklist exists.

**Data and IP.** Blocked by Q2, Q4, Q10 and lawyer review.
- Goal: the due-diligence page, reachable in two clicks from anywhere. Audience P3.
- Sections: short version (five lines), who sees your files (named tools, plan tier, sub-processors, data location), NDA before files with download, ownership of deliverables, no-AI mode and its price effect, retention and deletion, human sign-off, insurance `[TO CONFIRM]`, last reviewed date.
- Proof needed: every line true on day one. `docs/security/ai-data-handling.md`, vendor terms in writing (C-003), reviewed NDA, insurance quote.
- Events: `nda_download`, `email_click`.

**Work.** Blocked by Q3, Q12.
- Goal: proof for P1 to P3. An index of up to three items, then a page each.
- Case study template: status badge (reference design, pilot, cleared client work). Facts row (product type, environment, volume, process, material, size, rating as "designed for" or "tested to [lab, report]"). Brief and constraints. What we designed (CAD, section view, exploded view). What we built and tested (photos, setup, measured results only). What failed and what changed. Deliverables handed over. Hours logged and iterations from the build log. What we would change. Internal, never shown: clearance record (who approved, when, which name is allowed).
- Rules: no client name without written permission, every number traces to the build log or claims ledger, targets and simulations are labelled.
- Proof needed: two items (Q12). Mimir's Well only if Daniel confirms it is his own.
- Events: `case_study_view`.

**About.** Blocked by Q2, Q3, Q16.
- Goal: personal trust, for P1 and P3.
- Sections: portrait and short bio, facts of record, method, what Daniel does and what partners do, how a project runs, company details, testimonials only with permission and labelled "work done before Normek", LinkedIn.
- Proof needed: photos exist. Company details and permissions are missing.
- Events: `linkedin_click`, `email_click`.

**Contact.** Blocked by Q2, Q18, a reply time, ADR 0001 acceptance and a `security-engineer` form review.
- Goal: the inquiry. The same form component as the home page.
- Sections: form, what happens next, reply time, email and LinkedIn, company details, privacy notice beside the button.
- Events: the form events in section 8.

## 5. Contact form specification

| Required field | Rule | Error text |
|---|---|---|
| Name | 1 to 100 characters | Enter your name so we know who to reply to. |
| Work email | valid address, any domain | That address looks incomplete. Try name@company.com. |
| Company | 1 to 120 characters | Enter your company name. |
| What do you need | 20 to 2,000 characters | Add a sentence or two on the product and what you need (at least 20 characters). |

Helper text under the last field: "Product, where it is used, board stage. No confidential details yet: files come after an NDA." Set `maxlength` so over-length errors cannot occur.

Optional, inside a closed disclosure "Add details that speed up scoping":
- Product type: sensor or IoT node, gateway or controller, handheld, panel or DIN rail unit, other.
- Expected volume, year one: 1 to 10, 10 to 100, 100 to 500, 500 to 5,000, more than 5,000, not sure.
- Environment: indoor, outdoor, washdown, dusty, not sure.
- Target ship date: within 2 months, 2 to 4 months, 4 to 8 months, later, no date.
- Board size in mm: free text, for example 60 x 40.
- CAD file or board outline: yes (share after NDA), no, not sure.

Then the tick box "Start with a 30 minute call". Hidden fields: `situation`, `source` (campaign code), `page`, bot token, honeypot.

Behavior:
- Labels above fields, never placeholder-only. Text 16 px or larger, targets 44 px or larger, `autocomplete` on name, email, company. The disclosure is native, so it works without JavaScript.
- Validate on blur and on submit, never while typing. On failure: an error summary on top with links to fields, focus moves to it, values stay, each message is tied to its field. The server repeats every rule.
- Bot protection: Turnstile in managed mode (no puzzle for normal visitors), a honeypot (if filled, show the normal success page and send nothing), a rate limit. Failure text: "We could not confirm you are a person. Try again or email daniel@normek.dk."
- Send failure: "Your request was not sent. Your text is still here. Try again or email daniel@normek.dk."
- Button "Request a feasibility review", disabled while sending. Directly under it, in the same group: "We use your details only to reply to this request. Processors and retention are in the Privacy notice." with the link. Wording belongs to `legal-compliance-advisor`. No pre-ticked boxes, no newsletter opt-in.
- No file upload (Q14). Files follow an NDA, by a route `security-engineer` approves.

What happens next, beside the form and on `/thanks`: 1. Daniel reads it and replies by email within `[1 working day, TO CONFIRM]`. 2. Optional 30 minute call to scope. A mutual NDA comes first if you want to share files. 3. A written scope and price before any work starts `[price model TO CONFIRM, Q5]`.

Confirmation page `/thanks`: heading "Request received.", the three steps, a line about the call if ticked, the email fallback. No personal data in the URL, no upsell.

Confirmation email: from `daniel@normek.dk` `[Q18]`, plain text, a fixed template with name, company, reply time and next steps, ending "If you did not send this, ignore it." It never echoes the free text, so the form cannot be used to send text to third parties (`security-engineer` to confirm).

## 6. Trust signals

Exists today (usable in the preview, subject to Daniel's checks):
- A named founder and real photos (in the `personal-branding` repo, over 1 MB each, so compress).
- Facts of record from the CV and LinkedIn: B.Eng. Aalborg University, SkyGrids co-founder and exit.
- A business mailbox, daniel@normek.dk.
- The method paragraph, adapted.
- A visible process and honest scope that we write ourselves, with limits and "we recommend a standard box when it fits".

Missing, with the unblocker:
- Legal name, CVR number, address (Q2).
- Cleared case studies or reference designs with build logs (Q3, Q12).
- Testimonials with written permission, labelled as work before Normek (Q16).
- Mutual NDA and ownership wording (lawyer).
- Tool inventory, vendor terms in writing, data page (Q4, C-003).
- Prices or "from" prices (Q5, Q8).
- A redacted sample deliverable (from reference design 1).
- Named manufacturing partners (none agreed).
- Insurance statement (quote pending).
- Reply time and capacity commitments (Q7).

Never fake: logo walls, "trusted by", badges, stock people, unlogged numbers.

## 7. Wireframes, home page

Same button label after process, scope, files and founder. Header sticks on mobile.

```
+------------------------------------+
| [N] Normek      [Request a review] |
+------------------------------------+
| eyebrow                            |
| H1, three lines                    |
| subhead                            |
| [ Request a feasibility            |
|   review ]                         |
| or email Daniel                    |
| Led by D. H. Johansen              |
+------------------------------------+
| SITUATIONS: 3 cards                |
+------------------------------------+
| PROCESS: 3 steps                   |
| [ button ]                         |
+------------------------------------+
| SCOPE: take on / do not            |
| volume to route                    |
+------------------------------------+
| FILES AND IP                       |
| 3 promises, [HOLD] slot            |
| email for the NDA                  |
+------------------------------------+
| FOUNDER: photo, name, facts        |
+------------------------------------+
| INQUIRY                            |
| name, email, company               |
| need (textarea)                    |
| > optional details                 |
| [ ] call first                     |
| [ button ]                         |
| privacy notice here                |
| next steps 1 2 3                   |
+------------------------------------+
| FOOTER: company facts              |
+------------------------------------+
```

```
+--------------------------------------------------------------+
| [N] Normek   nav (4 anchors)          [Request a review]     |
+--------------------------------------------------------------+
| eyebrow, H1 (2 lines), subhead     | labelled illustration   |
| [ Request a feasibility review ]   | (board in a housing,    |
| or email Daniel. Led by D. H. J.   |  section view)          |
+--------------------------------------------------------------+
| SITUATIONS   [card 1]  [card 2]  [card 3]                    |
+--------------------------------------------------------------+
| PROCESS      [step 1]  [step 2]  [step 3]  then button       |
+--------------------------------------------------------------+
| SCOPE        take on | do not take on | volume to route      |
+--------------------------------------------------------------+
| FILES AND IP [promise 1] [promise 2] [promise 3] [HOLD]      |
+--------------------------------------------------------------+
| FOUNDER      photo | name, facts, method, limits, links      |
+--------------------------------------------------------------+
| INQUIRY      form, 7 of 12 columns   | next steps, 5 columns |
|              button, privacy notice  | email, capacity line  |
+--------------------------------------------------------------+
| FOOTER       logo | company facts | privacy | LinkedIn       |
+--------------------------------------------------------------+
```

Note for `ui-designer`: Signal fill with an Ink label gives 5.5:1. White on Signal fails.

## 8. Analytics events

Cookieless. No property holds a name, email, company, free text or field value.

| Event | Fires when | Properties |
|---|---|---|
| `cta_click` | button clicked | `location`, `page` |
| `situation_click` | situation card clicked | `situation` |
| `section_view` | section half visible | `section` |
| `form_start` | first field focused | `page` |
| `form_details_open` | optional details opened | `page` |
| `form_error` | validation or bot check fails | `field`, `code` |
| `form_submit` | server accepts the request | `situation`, `source`, `call_first`, `page` |
| `email_click` | mailto link clicked | `location` |
| `linkedin_click` | LinkedIn link clicked | `location` |
| `not_found` | 404 shown | `path` |

v1 adds `nda_download`, `case_study_view` (`slug`), `sample_view`, `checklist_download`. The key metric is `form_submit` per week by `source`. If the analytics tool lacks custom events, a page view of `/thanks` is the fallback conversion. Outreach links carry `utm_campaign` codes, never names, stored in `source`. `seo-analytics-specialist` picks the tool and final names.

## 9. Test plan and what would change this

Before launch, show the private preview on a phone to five real people from Daniel's network list. Ask what the company does, for whom, whether they would reply, and where they would look for file handling. Pass: at least 4 of 5 answer the first three correctly and find `#files` within 30 seconds. Simulated reviews from `customer-persona-reviewer` are not evidence.

Evidence that would change this structure:
- Make "Book a 30 minute call" the button if most of the first 10 inquiries tick the call box, or interviewees say they would rather book than write.
- Build `/enclosure-design` early if three prospects ask for details the home page lacks.
- Split out `/data-and-ip` when two prospects ask for it, or when the AI line goes live.
- Move the founder section up if testers look for "who is this" first.
- Add Work when reference design 1 exists, and a page at two items.
- Show "from" prices after three interviews (Q8).
