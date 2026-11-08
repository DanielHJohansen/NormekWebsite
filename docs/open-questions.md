# Open questions and decisions before we build

Status: 2026-11-08. Every item has a recommended default, so the quickest reply is "go with the defaults" or a short answer by number. Items marked **BLOCKER** stop spending and build work until they are settled.

Evidence and reasoning live in `docs/strategy/2026-11-08-ai-disclosure-and-go-to-market.md` (the marketing consult) and `docs/adr/0001-stack-and-hosting.md` (the stack).

## 0. Blockers

### 1. The name (BLOCKER)

Desk research on 2026-11-08 used third-party listings. It has not been verified at the official registers.

- **NORMEK A/S**, Viborg, CVR 29423431, registered 2006, plumbing and sheet-metal industry code. If it is still active, the Danish Business Authority may refuse a confusingly similar name such as "Normek ApS".
- **Normek Oy**, Finland, steel structures and facades. Bought by Donges Group in 2019 and merged into NORDEC. The brand may be dormant, but trademarks and the normek.fi domain may remain.
- **Normec Group**, Netherlands, a large testing, inspection and certification group. Pronounced the same as Normek, and active in the compliance world our customers live in.

What you do (about an hour):

1. Search "normek" on datacvr.virk.dk and see whether NORMEK A/S is active.
2. Search NORMEK and NORMEC in EUIPO TMview and the Danish Patent and Trademark Office database. Relevant classes: 6, 7, 9, 37, 40 and 42.
3. normek.dk is already yours at Simply.com, so that part is done. Check normek.com and normek.eu only if you want them.
4. Decide: keep the name, or rename.

Default: pause further domain purchases, print and public announcements, and run outreach under your own name. If the name fails, ask `brand-identity-designer` for five candidates that keep the Nordic and mechanical idea, start with N (so logo route 01 survives) and are screened against the same registers. Logo route 02 survives any rename.

### 2. Legal entity and company details (BLOCKER for launch)

Is Normek registered? In which form (an ApS, or a sole proprietorship with a secondary name)? What are the CVR number, address and public email? Danish websites that offer services normally must show these (confirm with the Danish Business Authority), and the legal pages and contracts need them.

Default: pilots and outreach under your own name or an existing entity. Register the company after the name is cleared. Check the form and VAT with an accountant.

### 3. Past employer clearance (BLOCKER for using old work)

Do your SkyGrids share sale, your SkyGrids role or your earlier jobs carry confidentiality, IP, non-compete or non-solicit clauses? May you show PB10, TB150, the Nordic Wing mechanism or the Danfoss rig, and under which names?

Default: treat every past-employer item as not cleared, use only your own projects, and describe client work anonymously until written permission exists. Inventory: `docs/content-reuse-inventory.md`.

### 4. The real AI workflow and data handling (BLOCKER for any AI claim)

Which AI tools do you use today, on which plans? Has any customer file ever touched a free or personal account? Can you run a project in a no-AI mode? Which steps does AI really speed up, and by how much (measured, not guessed)?

Default: write the inventory in `docs/security/ai-data-handling.md` with `security-engineer`, move to business-tier accounts, get vendor terms in writing, and log hours on your first reference design so the numbers are real.

## 1. Business definition

| # | Decision | Why it matters | Recommended default |
|---|---|---|---|
| 5 | First offers | The site must sell something specific | Enclosure Feasibility Review (one week), Prototype Sprint (2 to 4 weeks), Production Package (quoted). The consult's prices (DKK 5,000 to 10,000 and DKK 30,000 to 60,000) are hypotheses to test in interviews |
| 6 | Delivery and liability | Delivering finished parts may make you responsible as the manufacturer | Design plus supplier management first. Add parts resale with a stated handling margin only after insurance and terms exist |
| 7 | Capacity | Over-promising kills trust | At most two active projects, and a site line saying how many projects you take per quarter |
| 8 | Price visibility | It filters leads and few rivals do it | Show "from" prices after the first three interviews |

## 2. Market and message

| # | Decision | Recommended default |
|---|---|---|
| 9 | Beachhead | Danish and southern Swedish electronics firms and hardware startups of about 5 to 50 people, with low-volume industrial or IoT devices, at the point where a standard box stops fitting. Exclude defense, medical and automotive for now. Confirm with 15 to 20 interviews (confirmed if 30 percent or more have an enclosure need within six months) |
| 10 | AI disclosure | Option B from the consult: outcome-first, with AI disclosed as the method on a how-we-work page, a data and IP page and a contract clause. Go live only once the commitments in item 4 are true |
| 11 | Language and geography | English only at launch, Denmark and the Nordics first with EU reach. Danish later if inquiries ask for it |
| 12 | Proof | Two public reference designs with a measured build log, plus two or three discounted pilots traded for case-study rights |

## 3. Website

| # | Decision | Recommended default |
|---|---|---|
| 13 | Stack and hosting | Astro, Tailwind and Cloudflare (ADR 0001). Please approve or challenge |
| 14 | Primary conversion | Book a 30 minute call, or request a feasibility review through a short form. No file upload in v1 |
| 15 | v1 pages | Home, Enclosure design, How we work, Data and IP, Work, About, Contact, plus legal pages |
| 16 | Founder and testimonials | Show you prominently, since trust at this size is personal. The three testimonials on your personal site praise your personal work, so each person must agree to reuse and the label must say so |
| 17 | Logo | Pick a route from `brand/logo/preview.png`. Recommendation: 01 Trace |
| 18 | Domain and email | normek.dk is already at Simply.com. Keep the registration there and decide where DNS lives (ADR 0001). Tell me which Simply products are active (domain only, DNS, web hosting, mailboxes) and whether anything is live on the domain. Add `.com` or `.eu` only after the name is cleared. Set up a `hello@` and a `daniel@` address, with SPF, DKIM and DMARC records |

## 4. Resources and goals

| # | Decision | Recommended default |
|---|---|---|
| 19 | Budget | About 0 to 25 euros a month, plus the domain and a mailbox |
| 20 | Weekly hours | State a hard ceiling for the next 90 days. The consult assumed 10 to 15 hours a week |
| 21 | Success measures | Day 30: segment go or no-go. Day 60: two pilots signed. Day 90: one case study, one referral partner, name cleared |

## 5. Real-world setup (only you can do these)

- [ ] Name checks (item 1).
- [ ] Accounts with two-factor authentication: Simply.com (registrar and DNS), Cloudflare, a business mailbox, Google Search Console.
- [ ] Tell me which Simply.com products are active and whether anything is live on normek.dk.
- [ ] Business-tier AI accounts and vendor terms confirmed in writing.
- [ ] Professional liability insurance quote.
- [ ] One lawyer review: mutual NDA, services agreement, IP assignment and AI clause.
- [ ] Accountant: entity form and VAT.
- [ ] A list of 30 people in your network who build or buy electronic devices.

## 6. Recommended order of work

1. **Week 1**: name checks, AI inventory, past-employer clearance, the network list, and pick a logo route.
2. **Weeks 1 to 4**: 15 to 20 interviews, start reference design 1 with a build log, first outreach.
3. **As soon as the name is cleared**: a one-page v0 site with the problem, how you work, the data and IP promise, your profile and the contact form. That is about a day or two of work, and it supports outreach without a long build.
4. **After two proof items exist**: grow it into the seven-page v1.
