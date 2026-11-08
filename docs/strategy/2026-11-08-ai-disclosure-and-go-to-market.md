# AI disclosure and go-to-market for Normek

Date: 2026-11-08. Author: marketing-strategist (assistant). Status: recommendation for Daniel's decision. Nothing here is final site copy.

Assumptions used throughout (not facts of record): Daniel has 10 to 15 hours a week, the budget is tens of euros a month, the site is English-first, Denmark and the Nordics are home with EU reach, and "Normek" is a provisional name.

## Executive summary

**Q1 verdict: choose option B, outcome-first with AI disclosed as the method.**
1. Lead every headline with the buyer's outcome (a working, manufacturable enclosure, sooner and at a fixed price). Never lead with "AI".
2. Say plainly, one click down, that a named engineer uses AI tools inside a documented process and signs off every deliverable.
3. Publish a data-handling page and put the same promises in the contract. The disclosure is only honest if those commitments are already true on day one.
4. Hiding AI (option C) is the riskiest choice, not the safest. Customer NDAs increasingly contain AI clauses, and being discovered later costs more trust than disclosing now.

**Top five moves for Q2**
1. Beachhead: Danish and southern Swedish electronics firms and hardware startups (roughly 5 to 50 people) shipping low-volume industrial and IoT devices, where an off-the-shelf box no longer fits. Not defense, medical or automotive yet.
2. Sell fixed-price packages, not hours, starting with a one-week "Enclosure Feasibility Review". Fixed prices let AI efficiency become margin and defuse "why pay human rates for machine work".
3. Create proof before the website: two public reference designs with a measured build log, plus two or three discounted pilot projects traded for written case-study rights.
4. Distribution through people first: Daniel's own network, then referral partnerships with electronics design houses and contract manufacturers who get asked "can you do the box?".
5. Validate the segment with 15 to 20 problem interviews in the first 30 days before any build spend. The segment is plausible but unproven.

## Q1. Should Normek market its heavy AI use?

### What buyers actually fear

Likely fears, ranked by my judgment (medium confidence): files leaking into model training, geometry that looks right but is wrong, ownership of the result, paying consultancy rates for machine work, and a one-person supplier vanishing mid-project.

Evidence is thin for engineering services. Forrester's 2025 survey found 19% of business buyers less confident because AI gave inaccurate results, and buyers moving to evidence-backed validation (Digital Commerce 360, 2025-10-28). A legal-sector survey reports 85% of clients expect AI disclosure (secondhand, low relevance). I found no survey of hardware buyers. **Treat the IP fear as a hypothesis to test in interviews.**

### The three options compared

| | A. AI-forward | B. Outcome-first, AI as method | C. Quiet unless asked |
|---|---|---|---|
| Differentiation | High at first, but "AI-native" is becoming common | Speed, fixed price and process, AI as the explanation | Looks like everyone else |
| IP fear | Triggered instantly | Answered on a dedicated page | Triggered later, at NDA review |
| Pricing pressure | High: "so it should be cheap" | Neutral with fixed packages | Neutral |
| Legal exposure | Highest (AI-washing) | Moderate, via claims ledger | Contract breach risk |
| Fit with evidence today | Poor, no measured results | Good, claims grow with proof | Wastes the advantage |

**Choice: B.** Engineers buy outcomes and proof. AI explains the outcome, it is not the outcome. A is premature with no measured numbers, and AI-washing enforcement continues: the FTC's Operation AI Comply has run since September 2024, including business-to-business cases (Holland and Knight, 2026-08-18). Danish marketing law also expects documented claims (how its business-to-business rules apply needs the legal advisor's check). C fails because NDAs now often contain clauses such as "Recipient shall not input Confidential Information into any generative AI or machine learning system except as expressly approved in writing" (Law Insider sample clause, commentary from Carta and KJK, 2026-03-12). Silence plus such a clause is a breach waiting to happen.

### Where each layer of disclosure appears

| Layer | What it says |
|---|---|
| Homepage headline | Outcome and segment only. No "AI". |
| Homepage, one line under the process strip | "A senior engineer leads every project. AI tools speed up the routine work under written data rules." Link to how-we-work. |
| How-we-work page | Which steps use AI (for example requirements capture, documentation, design-rule checklists, CAD scripting, supplier quote preparation [TO CONFIRM against Daniel's actual workflow]), which steps are always human (geometry decisions, tolerances, sealing, sign-off), and the review gate. |
| Trust and data-handling page | Named tools and their plan tier, "not used for training" status, retention, data location, sub-processors, no consumer accounts, a no-AI option, deletion at project end, a downloadable mutual NDA. |
| Contract (statement of work and NDA) | AI-tool clause listing approved tools, opt-out right, IP assignment, human sign-off, confidentiality survival. |

### Sample language for testing (test candidates, not final copy)

1. Headline: "Your circuit board works. We build the box it ships in." Subhead: "Enclosure design, prototypes and manufacturing partners for electronics teams without in-house mechanical engineers."
2. Headline: "From board to enclosure prototype in [X] weeks [TARGET, needs claims-ledger evidence]." Subhead: "Fixed-price mechanical design, led by a named engineer."
3. Headline: "The mechanical engineer your electronics team is missing." Subhead: "Design, prototype and production hand-off for sensors, gateways and controllers."

Test with real interviewees, not only `customer-persona-reviewer`.

**Avoid:** "AI-powered", "AI-designed", "AI engineer", "autonomous design", "10x faster", "instant", "fully automated", "secure" without specifics, "GDPR certified" (unless Normek actually holds an approved certification), "your data never leaves" unless literally true, and any speed or cost number that is not in the claims ledger.

### Objection script: "Will my files end up in a model?"

> "No, and I can show you why rather than ask you to trust me. I only use business-tier AI services whose terms say customer inputs are not used for training. I never put customer files into free or personal accounts. Here is the list of tools and their terms on our data page. If your project needs it, I run it in no-AI mode at the same price and timeline we agree up front. Your NDA can name the approved tools, and everything I design for you is assigned to you in the contract. I sign off every drawing myself. Would it help if I sent our standard NDA with that clause already in it?"

Keep "same price" only if Daniel accepts that cost. Otherwise state the no-AI surcharge openly.

### What must be TRUE before the disclosure goes live

| Commitment | Daniel can do it | Needs lawyer or vendor confirmation |
|---|---|---|
| Inventory of every AI tool touching customer data, with plan tier | Yes | |
| Business or API tiers only, with no-training terms (Anthropic and OpenAI say so, per secondary sources) | Set up accounts | Confirm current terms and data processing agreements, record the date |
| No customer files in consumer tools. Separate work accounts | Yes | |
| A working no-AI mode per project | Yes | |
| Logged human sign-off on every deliverable | Yes | |
| File deletion or return at project end | Yes | |
| IP assignment to the customer | | Lawyer |
| AI clause in Normek's NDA and terms | Draft intent | Lawyer, via `legal-compliance-advisor` |
| Cloud CAD and its built-in AI features | Check settings | Vendor confirmation |
| Professional liability insurance | | Broker quote |

**IP note.** The US Copyright Office (2025-01-29) holds that prompts alone do not create authorship, but AI-assisted works with enough human contribution stay protectable. USPTO guidance (2025-11-28) treats AI as a tool and only humans as inventors. The EU also requires human authorship, and AI-assisted technical design is unsettled there. So Normek should assign "all rights it holds", document human design decisions, and not warrant that everything is copyrightable. A lawyer words this.

**EU AI Act.** Article 50 transparency duties apply from 2026-08-02, mainly to chatbots and synthetic media. They matter only if the site adds a chatbot or AI-generated images.

### Segment differences

| Segment | AI sensitivity | Recommendation |
|---|---|---|
| Defense and dual-use | Very high (export control, cloud bans) | Exclude |
| Medical devices | High (ISO 13485 design controls, tool validation) | Exclude |
| Automotive | High (TISAX assessments, long qualification) | Exclude |
| IP-heavy startups | Medium to high on chain of title | Serve with no-AI option and strong assignment |
| Industrial IoT and sensors | Lowest likely, care about time, cost, sealing | Beachhead |

### Tripwires that would flip the recommendation

- Toward A: 3 or more of the first 15 interviewees call AI use a plus unprompted, and two measured speed or cost results are in the claims ledger.
- Toward C for a segment: a third or more of buyers refuse to send files to any supplier using AI, even on business-tier terms.
- Pause AI claims: a vendor will not confirm no-training terms in writing.
- Reprice the no-AI option: more than a quarter of projects choose it.

## Q2. Marketing strategy and market penetration

### Is the segment real? Challenge the assumption

The segment exists, but its default answers are cheap: a standard box from Fibox, Phoenix Mecano or Danish Bernic A/S with machined holes, the contract manufacturer, or a Fiverr or CAD Crowd freelancer. **They pay a consultancy only when the standard box fails**: sealing, heat, odd board shapes, a product that must look finished, or the jump from 10 prototypes to 500 units. Normek must find companies at that moment.

Sizing is weak. Directories put Denmark at roughly 1,120 companies under electronics manufacturing industry codes, 71% with 1 to 9 employees (InfobelPRO, undated), about 76 funded hardware startups (Seedtable, accessed 2026-11-08) and 28 contract electronics manufacturers (Evertiq, 2025-03-27). Definitions differ, but the relevant Danish pool is hundreds, not thousands. That is enough for 6 to 10 projects a year [ASSUMPTION] but too small to waste. Sweden is larger (74 contract manufacturers, same ranking).

**Cheap test:** list 150 Nordic companies from the register and startup directories, and mark each: ships a device, no mechanical engineer on LinkedIn, new product or funding in 12 months. Run 15 to 20 problem interviews. The segment is confirmed if at least 30% describe an enclosure need in the next six months and name a budget owner. If fewer than 15% do, widen to "electronics design houses as the customer" (see partnerships).

### Positioning statement

For Nordic electronics teams that build sensors, gateways and controllers without an in-house mechanical engineer, Normek is the mechanical partner that turns a working board into a manufacturable enclosure at a fixed price. Unlike freelancers it owns the result through to the manufacturing partner, and unlike large consultancies it is fast and priced by package, because a senior engineer works inside a disciplined, AI-assisted process.

### Competitor and substitute map

| Alternative | Strength | Weakness for this buyer | Normek's angle |
|---|---|---|---|
| Product development consultancies (for example Promwad) | Full teams, track record | Costly, small jobs low priority | Small fixed packages, fast start |
| Freelancers (Fiverr, CAD Crowd) | Cheap | Variable quality, no follow-through, unknown data handling | Named engineer, data terms, partners |
| Manufacturing platforms (Protolabs, Xometry, Fictiv) | Fast parts, manufacturability feedback | Review designs, do not create them | Deliver the design they quote |
| Contract manufacturers adding box build | One supplier | Mechanical design often basic | Partner and referral source |
| Enclosure makers with customization (Fibox, Bernic, Protocase) | Proven, cheap at volume | Catalog-bound | Recommend them when they fit |
| In-house hire | Control | Full salary for occasional need [TO CONFIRM] | Pay per project |

### Offer packaging and pricing

Price by package, never by hour. Hourly billing hands AI efficiency back to the customer and invites the "machine work" objection. Prices below are hypotheses to test, not decisions.

1. **Enclosure Feasibility Review** (one week, test DKK 5,000 to 10,000): standard box or custom, manufacturing route, rough unit cost, risks. Fee credited against item 2.
2. **Prototype Sprint** (2 to 4 weeks, test DKK 30,000 to 60,000): CAD, one or two prototype rounds, fit check with the real board.
3. **Production Package** (quoted): drawings, manufacturability review with a partner, supplier quotes, first batch support.
4. **Later:** delivered product, with margin through partners.

### Creating proof with no clients

- **Two reference designs**, for example a sealed enclosure for a common LoRaWAN or cellular sensor board, and a wall-mounted gateway housing. Publish CAD screenshots, prototype photos and the build log. Say "designed for IP67", never "tested to IP67", unless lab-tested.
- **Build log with measured hours** per step. These numbers become the first claims-ledger entries and decide whether option A ever becomes viable.
- **Two or three pilot projects** at 30 to 50% off, in exchange for written case-study permission, a named quote and a reference call.
- **Past work** (PB10, TB150, Mimir's Well, foam inserts) only after written clearance per `docs/content-reuse-inventory.md`.
- **Founder credibility:** SkyGrids co-founder and exit, Aalborg University mechanical engineer. Do not stretch it into production experience.

### Channels ranked by expected return per hour

| Rank | Channel | Why |
|---|---|---|
| 1 | Daniel's network (colleagues, SkyGrids, Aalborg alumni) | Highest trust, fastest first conversation |
| 2 | Electronics design houses and contract manufacturers as referral partners | They hear "who can do the box?" often. Referral fee [TO DECIDE] |
| 3 | Personal outreach to the 150-company list | Measurable, needs no website |
| 4 | Weekly LinkedIn build log | Compounds proof for 1 to 3 |
| 5 | Incubators and hardware hubs (for example DTU Skylab [TO CONFIRM]) | Concentrated startups |
| 6 | Free "enclosure-ready board" checklist | Useful once traffic exists |
| 7 | Trade events | Costly in hours |
| 8 | Directories and SEO | Slow, weakened by the name collision |

**Name effect:** a search for "Normek" may surface NORMEK A/S (Viborg) or Normec Group (certification, same pronunciation). That weakens branded search and word-of-mouth and may confuse compliance-minded buyers. Until cleared, run outreach under Daniel's own name and spend nothing on branded SEO or print.

### 30/60/90 day plan

Funnel assumption to test: 100 personal messages lead to 15 replies, 8 calls, 3 quotes and 1 project. Every number below is a target.

**Days 1 to 30: validate.** Week 1: vendor terms confirmed in writing, business-tier accounts, data commitments drafted, first 50 list entries. Week 2: 25 network messages, 5 interviews, start reference design 1. Week 3: 25 cold messages, 5 more interviews, test the headline pairs verbally. Week 4: list at 150, score the segment test, first build-log post. Targets: 50 messages, 10 to 15 interviews, segment go or no-go.

**Days 31 to 60: first offers.** Weekly: 20 messages, 1 build-log post, 1 partner conversation. Pitch the feasibility review with its price. Targets: 80 messages, 4 partner talks, 3 reviews quoted, 2 pilots signed, reference design 1 published.

**Days 61 to 90: deliver and prove.** Deliver pilots and log measured hours in the claims ledger. Targets: 1 case study, 1 active referral partner, 1 full-price quote, reference design 2, name cleared, website brief approved.

### KPIs

Reply rate, interviews, share with a six-month enclosure need, quotes, win rate, average project value, measured hours per package versus estimate, referrals per partner, and Daniel's hours per won project.

## Q3. Settle before building the website

1. **Name cleared** (register, trademark, domain).
2. **Beachhead confirmed** by interviews. It sets headline, examples and imagery.
3. **Option B accepted** with every commitment above in place.
4. **Price display.** Recommendation: show "from" prices. It filters leads and few rivals do it.
5. **Proof inventory** on launch day: reference designs, pilots, cleared past work.
6. **Languages**: English only, or plus natural Danish.
7. **File intake**: recommendation is no file upload in v1, files only after an NDA.

**What the website must do.** It converts people who already heard of Daniel through outreach or a partner. It does not create demand. Primary conversion: book a 30-minute call or request a feasibility review via a short form. Proof: reference designs with build logs, pilot case studies, founder profile. Trust signals: named engineer with photo, company registration number and address, the data-handling page, a downloadable NDA, the IP assignment statement, the human sign-off step, and honest scope ("we recommend a standard box when it fits"). Keep v1 to seven pages: home, services, how we work, data and IP, work, about, contact.

## Risks and assumptions

| Item | Type | Confidence |
|---|---|---|
| IP fear is the main barrier to disclosure | Assumption | Low to medium |
| Segment pays when standard boxes fail | Assumption | Medium |
| Danish pool is hundreds of companies | Directory data | Low to medium |
| Business-tier AI terms exclude training | Secondary sources | Medium, confirm |
| AI-assisted designs can be fully assigned | Legal | Low, lawyer needed |
| Production injection molding in-house | Fact check | Not true, use partners |
| 10 to 15 hours a week is enough | Assumption | Medium, tight after day 60 |
| Package prices | Hypothesis | Low |
| Name collision harms trust and search | Desk research | Medium |

## Sources

- US Copyright Office, Copyright and Artificial Intelligence Part 2: Copyrightability, 2025-01-29. https://copyright.gov/newsnet/2025/1060.html
- Mayer Brown, USPTO revised inventorship guidance for AI-assisted inventions, 2025-12-02. https://www.mayerbrown.com/de/insights/publications/2025/12/united-states-patent-and-trademark-office-issues-revised-guidance-on-inventorship-for-ai-assisted-inventions
- Holland and Knight, Operation AI Comply two years later, 2026-08-18. https://www.hklaw.com/en/insights/publications/2026/08/operation-ai-comply-2-years-later-continued-enforcement
- Cooley, EU AI Act transparency obligations take effect 2 August 2026, 2026-08-03. https://www.cooley.com/news/insight/2026/2026-08-03-eu-ai-act-transparency-obligations-take-effect-2-august-2026
- Digital Commerce 360 on Forrester Buyers' Journey Survey, 2025-10-28. https://www.digitalcommerce360.com/2025/10/28/forrester-b2b-buyers-demand-proof-not-promises/
- Responsive, buyer intelligence report, 2025-10-15. https://www.responsive.io/news/buyer-intelligence-2025
- Law Insider, generative AI tools clause samples, accessed 2026-11-08. https://www.lawinsider.com/clause/generative-ai-tools/_1
- Carta, AI clauses in NDAs, undated, accessed 2026-11-08. https://carta.com/blog/ai-clauses-nda/
- KJK, AI and M and A NDAs, 2026-03-12. https://kjk.com/2026/03/12/ai-and-ma-ndas-managing-artificial-intelligence-risks-in-confidentiality-agreements/
- Dan Cumberland Labs, Calibrating disclosure (cites law-firm client survey), accessed 2026-11-08. https://dancumberlandlabs.com/blog/calibrating-disclosure-when-clients-want-to-know-and-when-they-don-t/
- Evertiq, Nordic EMS market top 10, 2025-03-27. https://evertiq.com/news/2025-03-27-breaking-down-the-nordic-ems-market--a-top-10-list
- InfobelPRO, electronics companies in Denmark, accessed 2026-11-08. https://www.infobelpro.com/companies/denmark/electronics
- Seedtable, hardware startups in Denmark, accessed 2026-11-08. https://www.seedtable.com/hardware-startups-denmark
- Bernic A/S and Phoenix Mecano custom enclosures, via search, accessed 2026-11-08. https://www.phoenix-mecano.com/en-uk/enclosure-solutions/custom-designed-enclosures/
- Promwad enclosure design services, 2025. https://promwad.com/services/industrial-design/enclosures
- CAD Crowd electronic enclosure design, accessed 2026-11-08. https://www.cadcrowd.com/engineering/electronic-enclosures-design
- Anthropic data retention (secondary source, verify against primary terms), accessed 2026-11-08. https://char.com/blog/anthropic-data-retention-policy

Evidence gaps: no survey of hardware or engineering-services buyers on supplier AI use, no verified Nordic count of device makers without mechanical staff, and Danish business-to-business marketing law was not confirmed against the statute.

## Questions for Daniel

1. Which AI tools do you actually use today, on which plans, and does any customer file ever touch a free or personal account?
2. Will you offer a no-AI mode, and at the same price or with a surcharge?
3. Can you list 30 people in your network who build or buy electronic devices? That list decides how fast days 1 to 30 go.
4. Are you willing to show package prices publicly?
5. Which past enclosure items can you get written clearance for, and from whom?
6. What is your hard ceiling on weekly hours for the next 90 days?
