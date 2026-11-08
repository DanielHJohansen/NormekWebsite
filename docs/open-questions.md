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

### 4. The real AI workflow and data handling (needed before any AI claim or customer file)

Which AI tools do you use today, on which plans? Has any customer file ever touched a free or personal account? Can you run a project in a no-AI mode? Which steps does AI really speed up, and by how much (measured, not guessed)?

Default: write the inventory in `docs/security/ai-data-handling.md` with `security-engineer`, move to business-tier accounts, get vendor terms in writing, and log hours on your first reference design so the numbers are real.

Status on 2026-11-08: Daniel does not want to feature tools for now, so this no longer blocks the site. It still matters before the first customer file arrives, and before any AI claim is made.

## 1. Business definition

| # | Decision | Why it matters | Recommended default |
|---|---|---|---|
| 5 | First offers | The site must sell something specific | Enclosure Feasibility Review (15 to 30 hours by the fact check, so 1 to 3 weeks at 10 to 15 hours a week, a target until a build log confirms it), Prototype Sprint (about 1 week, depends on the project, per Daniel on 2026-11-08, a target until a build log confirms it), Production Package (quoted). The consult's prices (DKK 5,000 to 10,000 and DKK 30,000 to 60,000) are hypotheses to test in interviews |
| 6 | Delivery and liability | Delivering finished parts may make you responsible as the manufacturer | Design plus supplier management first. Add parts resale with a stated handling margin only after insurance and terms exist |
| 7 | Capacity | Over-promising kills trust | At most two active projects, and a site line saying how many projects you take per quarter |
| 8 | Price visibility | It filters leads and few rivals do it | Show "from" prices after the first three interviews |

## 2. Market and message

| # | Decision | Recommended default |
|---|---|---|
| 9 | Beachhead | Danish and southern Swedish electronics firms and hardware startups of about 5 to 50 people, with low-volume industrial or IoT devices, at the point where a standard box stops fitting. Exclude defense, medical and automotive for now. Confirm with 15 to 20 interviews (confirmed if 30 percent or more have an enclosure need within six months) |
| 10 | AI disclosure | Option B from the consult: outcome-first, with AI disclosed as the method on a how-we-work page, a data and IP page and a contract clause. Go live only once the commitments in item 4 are true. **Daniel's position on 2026-11-08:** for now customers care about the result, not his tools, so v0 says nothing about tools or AI. Two rules stay: never put customer files into free or personal AI accounts, and answer honestly if an NDA or a customer asks |
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
| 18 | Domain and email | normek.dk is at Simply.com (Basic Suite) with DNSSEC on. Simply's mail records are in place but no mailboxes exist yet (read through the connector on 2026-11-08, snapshot in `docs/ops/`). Recommended: keep DNS at Simply, point `www` to Cloudflare at go-live and redirect the bare domain to `www` (ADR 0001). Nothing changes in DNS until the name is cleared. Add `.com` or `.eu` only after that. The mailbox daniel@normek.dk exists (created 2026-11-08). Decide whether to add `hello@` |

## 4. Resources and goals

| # | Decision | Recommended default |
|---|---|---|
| 19 | Budget | About 0 to 25 euros a month, plus the domain and a mailbox |
| 20 | Weekly hours | State a hard ceiling for the next 90 days. The consult assumed 10 to 15 hours a week |
| 21 | Success measures | Day 30: segment go or no-go. Day 60: two pilots signed. Day 90: one case study, one referral partner, name cleared |

## 5. Real-world setup (only you can do these)

- [ ] Name checks (item 1).
- [ ] Accounts with two-factor authentication: Simply.com (registrar and DNS), Cloudflare, a business mailbox, Google Search Console.
- [x] Simply.com connector added (2026-11-08).
- [ ] Turn on two-factor on the Simply.com account, which controls the domain and its DNS.
- [x] normek.dk shows a Simply placeholder (checked 2026-11-08).
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

## 7. Decided while building the v0 preview (8 November 2026)

The manager (the main assistant) took these so the build is not blocked. Challenge any of them and the team changes course.

| # | Decision | Where it lives |
|---|---|---|
| D1 | The home page text and anchors come from `docs/copy/v0-home-copy.md`: Problem, Offers, Process, Scope, Data, About, Contact | Copy, canvas |
| D2 | Hero headline test A goes first. The five person phone test decides between A, B and C. Simulated reviews are not evidence | Copy section 1 |
| D3 | The v0 form has four required fields, a honeypot and Turnstile, loaded when the visitor first uses the form. No optional details, no call tick box, no upload, no confirmation email. The hidden `situation` and `source` fields wait for the analytics decision (ADR 0002) | Copy section 3, security CF rules |
| D4 | Keep three font families (83.4 KB, inside the 100 KB font budget). If a budget fails, drop the mono and set specifications in Plex Sans | `docs/design/tokens.md` |
| D5 | Accept the eight added colour token names: surface, border-strong, link, accent-hover, on-accent, success, warning, error | `docs/design/tokens.md` |
| D6 | No AI or tools wording on the site, in meta tags, Open Graph, JSON-LD or `llms.txt`. A build test enforces it | SEO plan |
| D7 | GitHub Actions are pinned to full commit SHAs, read from the upstream tags with `git ls-remote` | `.github/workflows/ci.yml` |
| D8 | The Claude Design canvas has three pages: Home (desktop and phone), Other pages (confirmation, 404, privacy) and System (logo, colour, type, layout, components) | `docs/design/claude-design.md` |

## 8. Questions that came back from the specialists

Each has a default, so "go with the defaults" works.

| # | Question | Default |
|---|---|---|
| 22 | What reply time can you keep, and how many projects can you run at once? (claims C-011 and C-012) | 1 working day, at most 2 projects |
| 23 | Does the Feasibility Review also cover a failed existing enclosure? | Yes, the review then starts from the failed part |
| 24 | May the site publish the "Not for now" list (medical, automotive, defense and dual-use, explosive atmospheres, simulation, certification)? Are mains-powered products in or out? | Publish the list. Mains-powered stays [TO CONFIRM] until you decide |
| 25 | Who pays for prototype parts and shipping, and do customers pay manufacturers directly for tooling? | The customer pays prototype material at cost and pays manufacturers directly. A lawyer confirms the wording |
| 26 | Is Mimir's Well your own work? | Treat it as not cleared until you say so |
| 27 | Which inquiry retention period will you really keep? | 12 months after the last message |
| 28 | Analytics at launch: Cloudflare Web Analytics (free, no new processor) or Plausible (about 9 euros a month, adds events)? | Cloudflare Web Analytics, ADR 0002 (proposed) |
| 29 | Bare domain at go-live: set an unframed 301 forward from normek.dk to the www address at Simply. A framed forward breaks the page | Do it at go-live, with the Simply connector |
| 30 | Your LinkedIn address, and a portrait or workshop photo for the About section | Provide both. Without them the section shows a labelled gap |
| 31 | Accept the Cloudflare, Resend and Simply data processing agreements before any tester submits the form | Do it during the setup in `docs/ops/cloudflare-and-resend-setup.md` |
| 32 | Publish a fixed price and a fixed duration for the feasibility review alone? The simulated buyer would reply more readily (`docs/strategy/persona-review-2026-11-08-copy.md`) | Decide after the first three interviews, as item 8 says. Until then the page shows no price |
| 33 | One real, labelled photo of your own prototype work, and whether an independent molding or tooling engineer could give a second opinion | Provide the photo. Say "no independent check" until a person exists |
| 34 | Which CAD system do you deliver in, in which city do you work, who prints your prototypes, and who covers a project if you are ill? | Name each in plain words, or the page cuts the sentence |
| 35 | The public contact address. The mailbox daniel@normek.dk can reset your other accounts, and the site prints it about 30 times, so scrapers will find it (security gate G5) | Show a forward such as hello@normek.dk on the site and keep daniel@normek.dk private. Say yes and I create the forward through the Simply connector, with your approval. Keep recovery addresses for Cloudflare, GitHub and Resend outside normek.dk |
