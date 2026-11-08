# Sitemap and page briefs

Status: draft, 2026-11-08. Author: `ux-conversion-designer`. Sections 3 and 7 are the layout brief for Claude Design. Copy is intent, not final text. Q numbers: `docs/open-questions.md`. C numbers: `docs/claims-ledger.md`. `[TO CONFIRM]` marks a missing fact. `[HOLD]` marks a slot left empty until its blocker clears.

## 1. Goals and primary conversion

The site converts people Daniel already reached through outreach or a partner. It does not create demand. Jobs, in order: pass the five second test, answer what stops a reply (can they do my box, cost and time, can I trust them with files), gather scoping detail, and show which source and situation produce inquiries.

**Primary conversion: one submitted inquiry**, from one button, "Request a feasibility review" (Q14). A tick box, "Start with a 30 minute call", makes the call the next step, not a second button. `daniel@normek.dk` is the plain text fallback, never a button. One action beats two, and a calendar embed needs a third party script and an ADR.

Audiences: P1 founder or CTO of a 5 to 20 person startup, P2 head of engineering at a 50 to 300 person firm, P3 IP-conscious reviewer. Journeys: J1 finished board, no box. J2 prototype failed or too costly. J3 500 to 5,000 units. J4 can I trust you with files and IP.

## 2. Sitemap

v0, private preview:
- `/` Home. Anchors `#situations #process #scope #files #founder #contact` double as outreach deep links.
- `/privacy` Privacy notice with a summary box on top.
- `/thanks` Confirmation, noindex, out of navigation. An extra URL, because the form needs it.
- 404: says what happened, links home, repeats the button and email.

v1 drafts, hidden (unlinked, not in `sitemap.xml`, noindex, normal 404 in production): `/enclosure-design`, `/how-we-work`, `/data-and-ip`, `/work` and `/work/[slug]`, `/about`, `/contact`.

Navigation in v0 and v1: Enclosure design, How we work, Data and IP, About, plus the button. v0 labels are anchors, so v1 changes links, not labels. Mobile: logo and button only, no hamburger. Build sections as reusable components.

## 3. v0 home page, section by section

Where proof is missing, the page shows the founder, the process and the scope, and says nothing it cannot back.

**3.1 Hero**
- Purpose: pass the five second test. Message: Normek designs enclosures for electronics teams with a working board and no mechanical engineer. A named engineer leads.
- Blocks: eyebrow "Enclosure design for electronics teams" (separates us from lookalike names), headline, subhead, button, email link, "Led by Daniel Hessellund Johansen, mechanical engineer". Consult headline candidate: "Your circuit board works. We build the box it ships in." Imply no manufacturing partners yet. Labelled illustration, no stock photo.
- Proof. Have: name, degree.
- CTA: button.

**3.2 Situations**
- Purpose: J1 to J3 find themselves in ten seconds. Message: a standard box stops fitting at three moments.
- Blocks: three cards ("Finished board, no box", "Prototype box failed or costs too much", "From 10 prototypes to 500 to 5,000 units"), each with a symptom and a link to the form that sets hidden `situation`.
- Proof. Have: none. A hypothesis until interviews confirm the segment (Q9).
- CTA: the form.

**3.3 Process**
- Purpose: a visible process and a small first step. Message: three steps, each with a usable result. Written scope before work starts `[TO CONFIRM, Q5]`.
- Blocks: Feasibility Review (standard or custom box, route, rough unit cost range, risks). Prototype Sprint (CAD, one or two prototype rounds, fit check on your board). Production Package (drawings, partner manufacturability review, supplier quotes, first batch support). Duration and price slots `[HOLD]` per card, plus a `[HOLD]` line for the consult's disclosure sentence (Q4, Q10).
- Proof. Have: scopes as a plan. Missing: durations (C-001), prices (Q5, Q8), `mechanical-domain-expert` check.
- CTA: button.

**3.4 Scope**
- Purpose: show expertise, filter wrong leads. Message: we recommend a standard box when it fits.
- Blocks: take on: sealed, outdoor, washdown, DIN rail, handheld housings for sensors, gateways, controllers. Do not take on: simulation-heavy studies (we build and test prototypes), in-house production molding (partners), medical, defense, automotive `[TO CONFIRM, Q9]`. Volume-to-route table (3D printing, urethane casting, CNC, sheet metal, injection molding via partners). Rule: "designed for IP67" means designed. A lab test is named separately.
- Proof. Have: general knowledge. Missing: `mechanical-domain-expert` check.
- CTA: button.

**3.5 Files and IP**
- Purpose: answer J4 and P3 on the same page. Message: you describe the product in words, files follow a mutual non-disclosure agreement (NDA), what we design for you is yours.
- Blocks: three promises, link "Email daniel@normek.dk and ask for the NDA first", `[HOLD]` slot for tools and data handling, "last reviewed" date.
- Proof. Have: no upload only. Missing: NDA and ownership wording (lawyer), tool inventory (Q4), disclosure decision (Q10).
- CTA: button, NDA link.
- Launch gate: not public with the slot empty unless Daniel decides so knowingly. The consult rates silence riskiest.

**3.6 Founder**
- Purpose: at this size trust is personal. Message: a mechanical engineer who built a company and builds prototypes early.
- Blocks: workshop photo (compressed), name, facts of record (B.Eng., Aalborg University, 2017 to 2021. Co-founded SkyGrids, 2022 to 2025, exited by selling his shares), method paragraph (no job-search line), limits line ("Production tooling goes through manufacturing partners"), LinkedIn, email.
- Proof. Have: CV facts, photos. Missing: SkyGrids publicity check (Q3), testimonials (Q16). No simulation claim.
- CTA: button.

**3.7 Inquiry**
- Purpose: convert, cut risk at the point of action. Message: "Tell us about your board. A person replies within `[1 working day, TO CONFIRM]`."
- Blocks: form (section 5), next steps, email fallback, capacity line `[TO CONFIRM, Q7]`.
- Proof. Missing: a reply time Daniel can keep, privacy wording.
- CTA: submit.

**3.8 Footer.** Logo tile, legal name, CVR and address `[TO CONFIRM, Q2]`, email, Privacy notice, LinkedIn. Not public with placeholders.

## 4. v1 page briefs

All DRAFT and hidden until the blocker clears. Each ends with the same button to `/contact` and fires `page_view` and `cta_click`. Events listed are extra.

**Enclosure design.** Blocked by Q5, Q8, Q9, Q12, fact-check. Goal: the money page for search and referrals (J1 to J3, P1, P2). Sections: what we design, deliverables and formats `[TO CONFIRM]`, routes by volume with sourced tolerances, sealing and environment, fixing a failed enclosure (seals, snap fits, heat, cost), packages with "from" prices, sample deliverable, exclusions. Proof needed: a redacted manufacturability review and one measured reference design (neither exists). Event: `sample_view`.

**How we work.** Blocked by Q4, Q5, Q7, Q10. Goal: the process as a specification (P2, P1). Sections: three steps with inputs, outputs and a review gate, human sign-off, which steps use AI tools and which never do `[TO CONFIRM against the real workflow]`, what we need from you (board outline, connectors, mounting holes, environment, volume), change requests, handover, capacity. Proof needed: the measured build log. Show step order, not durations, until logged (C-001, C-002). Event: `section_view` (ai-use).

**Data and IP.** Blocked by Q2, Q4, Q10, lawyer. Goal: due diligence within two clicks of anywhere (P3). Sections: five-line summary, who sees your files (named tools, plan tier, sub-processors, data location), NDA download, ownership, no-AI mode and its price effect, retention and deletion, human sign-off, insurance, last reviewed. Proof needed: every line true on day one: `docs/security/ai-data-handling.md`, vendor terms in writing (C-003), reviewed NDA, insurance quote. Events: `nda_download`, `email_click`.

**Work.** Blocked by Q3, Q12. Goal: proof (P1 to P3), up to three items, then a page each. Case study template: status badge (reference design, pilot, cleared client work), facts row (product, environment, volume, process, material, size, rating as "designed for" or "tested to [lab, report]"), brief, what we designed, what we built and tested (measured results only), what failed, deliverables, hours from the build log. Internal only: clearance record (approver, date, allowed name). Rules: no client name without written permission, every number traced to the build log or ledger, targets labelled. Proof needed: two items. Mimir's Well only if Daniel confirms it is his own. Event: `case_study_view`.

**About.** Blocked by Q2, Q3, Q16. Goal: personal trust (P1, P3). Sections: portrait and bio, facts of record, method, what Daniel does and what partners do, how a project runs, company details, testimonials only with permission and labelled "work done before Normek", LinkedIn. Proof: photos exist, company details and permissions do not. Events: `linkedin_click`, `email_click`.

**Contact.** Blocked by Q2, Q18, a reply time, ADR 0001 accepted, `security-engineer` review. Goal: the inquiry (everyone). Sections: the home form component, reply time, email, LinkedIn, company details. Proof needed: reply time, company details. Events: the form events in section 8.

## 5. Contact form specification

Required fields, with error text:
- Name, 1 to 100 characters. "Enter your name so we know who to reply to."
- Work email, valid address, any domain. "That address looks incomplete. Try name@company.com."
- Company, 1 to 120 characters. "Enter your company name."
- What do you need, 20 to 2,000 characters. "Add a sentence or two on the product and what you need (at least 20 characters)." Helper: "Product, where it is used, board stage. No confidential details yet: files come after an NDA."

Optional, in a closed disclosure "Add details that speed up scoping": product type (sensor or IoT node, gateway or controller, handheld, DIN rail or panel unit, other), year-one volume band (1 to 10 up to more than 5,000), environment (indoor, outdoor, washdown, dusty), ship date band, board size in mm, CAD file or board outline (yes after NDA, no, not sure). Then the tick box "Start with a 30 minute call". Hidden: `situation`, `source` (campaign code), `page`, bot token, honeypot.

Behavior:
- Labels above fields, 16 px text, 44 px targets, `autocomplete`. The disclosure is native, so it works without JavaScript.
- Validate on blur and submit. On failure: error summary on top with links to fields, focus moves to it, values stay. The server repeats every rule.
- Bot protection: Turnstile in managed mode (no puzzle for normal visitors), a honeypot (if filled, show normal success, send nothing), a rate limit. Failure: "We could not confirm you are a person. Try again or email daniel@normek.dk."
- Send failure: "Your request was not sent. Your text is still here. Try again or email daniel@normek.dk."
- Button "Request a feasibility review", disabled while sending. Directly under it: "We use your details only to reply to this request. Processors and retention are in the Privacy notice." (`legal-compliance-advisor` owns the wording.) No pre-ticked boxes, no newsletter.
- No file upload (Q14). Files follow an NDA, by a route `security-engineer` approves.

Next steps, beside the form and on `/thanks`: 1. Daniel replies by email within `[1 working day, TO CONFIRM]`. 2. Optional 30 minute call to scope. A mutual NDA comes first if you want to share files. 3. A written scope and price before work starts `[price model TO CONFIRM, Q5]`.

Confirmation page `/thanks`: "Request received.", the three steps, the email fallback. No personal data in the URL, no upsell. Confirmation email: from `daniel@normek.dk` `[Q18]`, plain text, fixed template (name, company, reply time, next steps), ending "If you did not send this, ignore it." It never echoes the free text, so the form cannot relay text to third parties (`security-engineer` to confirm).

## 6. Trust signals

Exists today (subject to Daniel's checks): a named founder with real photos (compress them), facts of record (B.Eng. Aalborg University, SkyGrids co-founder and exit), the daniel@normek.dk mailbox, the adapted method paragraph, and a visible process and honest scope that we write ourselves.

Missing, with the unblocker: legal name, CVR and address (Q2). Cleared case studies or reference designs with build logs (Q3, Q12). Testimonials with written permission (Q16). Mutual NDA and ownership wording (lawyer). Tool inventory, vendor terms, data page (Q4, C-003). Prices (Q5, Q8). A redacted sample deliverable. Named manufacturing partners (none agreed). Insurance statement. Reply time and capacity commitments (Q7).

Never fake: logo walls, "trusted by", badges, stock people, unlogged numbers.

## 7. Wireframes, home page

The button repeats after process, scope, files and founder. The header sticks on mobile.

```
+------------------------------------+
| [N] Normek      [Request a review] |
+------------------------------------+
| eyebrow, H1, subhead               |
| [ Request a feasibility review ]   |
| or email Daniel. 'Led by' line     |
+------------------------------------+
| SITUATIONS: 3 cards                |
| PROCESS: 3 steps, [ button ]       |
| SCOPE: take on / do not            |
| FILES AND IP: 3 promises, [HOLD]   |
| FOUNDER: photo, name, facts        |
+------------------------------------+
| INQUIRY: 4 fields, > details,      |
| [ ] call first, [ button ],        |
| privacy notice, next steps         |
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
| or email Daniel. 'Led by' line     |  section view)          |
+--------------------------------------------------------------+
| SITUATIONS   [card 1]  [card 2]  [card 3]                    |
| PROCESS      [step 1]  [step 2]  [step 3]  then button       |
| SCOPE        take on | do not take on | volume to route      |
| FILES AND IP [promise 1] [promise 2] [promise 3] [HOLD]      |
| FOUNDER      photo | name, facts, method, limits, links      |
+--------------------------------------------------------------+
| INQUIRY      form, 7 of 12 columns   | next steps, 5 columns |
|              button, privacy notice  | email, capacity line  |
+--------------------------------------------------------------+
| FOOTER       logo | company facts | privacy | LinkedIn       |
+--------------------------------------------------------------+
```

For `ui-designer`: Signal fill with an Ink label gives 5.5:1. White on Signal fails.

## 8. Analytics events

Cookieless. No property holds a name, email, company, free text or field value.

- `cta_click` (`location`, `page`), `situation_click` (`situation`), `section_view` (`section`, half visible).
- `form_start` (first field focused), `form_details_open`, `form_error` (`field`, `code`).
- `form_submit` (server accepts: `situation`, `source`, `call_first`, `page`).
- `email_click`, `linkedin_click` (`location`), `not_found` (`path`).
- v1 adds `nda_download`, `case_study_view` (`slug`), `sample_view`, `checklist_download`.

The key metric is `form_submit` per week by `source`. If the tool lacks custom events, a page view of `/thanks` is the fallback conversion. Outreach links carry `utm_campaign` codes, never names, stored in `source`. `seo-analytics-specialist` picks the tool and final names.

## 9. Test plan and what would change this

Before launch, show the private preview on a phone to five real people from Daniel's network list. Ask what the company does, for whom, whether they would reply, and where they would look for file handling. Pass: 4 of 5 answer the first three correctly and find `#files` within 30 seconds. Simulated reviews are not evidence.

What would change this structure:
- The button becomes "Book a 30 minute call" if most of the first 10 inquiries tick the call box, or interviewees would rather book than write.
- Build `/enclosure-design` early if three prospects ask for detail the home page lacks.
- Split out `/data-and-ip` when two prospects ask, or when the AI line goes live.
- Move the founder up if testers look for "who is this" first.
