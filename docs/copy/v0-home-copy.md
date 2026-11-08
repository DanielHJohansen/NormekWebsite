# Normek v0 home page copy

Draft for Daniel, 8 November 2026, by `content-copywriter`. Voice per the brand guide: "I" where Daniel acts, "Normek" for the company, no team voice. `[TO CONFIRM]` marks a missing fact and blocks launch mode.

## 1. Hero headline tests

All pairs sit under the eyebrow "Enclosure design for electronics teams" and end with "Led by Daniel Hessellund Johansen, mechanical engineer."

**A. Candidate 1, amended**
- Headline: Your circuit board works. I design the box it ships in.
- Subhead: Design, printed prototypes and the hand-off to manufacturers, for teams that have the electronics but no mechanical engineer.

**B. Production hand-off, for teams that have a mechanical engineer**
- Headline: I take your enclosure from prototype to production hand-off.
- Subhead: For sensors, gateways and controllers when your own mechanical engineers are busy. Drawings, a request for quote (RFQ) pack and a review of what manufacturers send back.

**C. Problem-led**
- Headline: A standard box fits until it does not.
- Subhead: Sealing, heat, an odd board outline or a jump in volume can end that. I design the enclosure, print a prototype and prepare the manufacturer hand-off. When a standard box fits, I say so.

**Test A first, then B, then C.** A fixes the buyer review's two snags (team voice, "build" for design work) and promises no speed. These preferences are simulated, so run the five person phone test first.

## 2. Home page sections

### Header
Name: Normek. Navigation: Enclosure design (#offers), How I work (#process), Data and files (#data), About (#about). Button: Request a review.

### Hero (#top)
Eyebrow, headline, subhead and "Led by" line: pair A, or the winner. Button: Request a feasibility review. Under it: Or email daniel@normek.dk. Caption: Illustration: a board in a two-part housing, section view. Not a customer project.

### Problem (#problem)
**Three moments a standard box stops fitting**

1. **The board is done and there is no box.** You have a working board and a ship date. The box has to match its connectors, antenna and mounting.
2. **The first box failed or costs too much.** A sealed box breathes: temperature swings pull moist air through weak points unless a membrane vent equalizes pressure. I start with the cheapest fix.
3. **From a few prototypes to hundreds of units.** Printing suits ten units. At hundreds, casting or molding can cost less per part, and tooling only pays off once volume covers it.

Each card links to #contact: Tell me about this

### Offers (#offers)
**Three stages. Use one or all three.**
If a standard box fits, I recommend it. How long a stage takes depends on the project, so a written scope fixes duration and price before work starts [TO CONFIRM]. Files follow a non-disclosure agreement (NDA).

**1. Enclosure feasibility review.** Find out whether a standard box fits.
- You get: a PDF report with the verdict, manufacturing route for your volume, materials, sealing and venting, heat and antenna notes, and each risk with its cheapest fix. Also a computer-aided design (CAD) envelope study, an order-of-magnitude cost range, one 60 minute call and one written revision.
- I need: a 3D model of the board (STEP: Standard for the Exchange of Product data), connector and antenna positions, power dissipation, environment, volumes.

**2. Prototype sprint.** Check the design on your real board.
- You get: native CAD and STEP files with a bill of materials, one or two rounds of 3D printed prototypes, and a fit report with photos and measured dimensions. Two design reviews, one before printing. Extra rounds are quoted.
- I need: a frozen board revision, one or two assembled boards, parts lists, and a reviewer who answers within [2 working days, TO CONFIRM]. Who pays for prototype parts and shipping: [TO CONFIRM].

**3. Production package.** Take the design to manufacturers and compare quotes.
- You get: drawings with material, finish and critical tolerances. A request for quote (RFQ) pack for [2 to 3, TO CONFIRM] manufacturers, comparing unit price, tooling, lead time and tooling ownership. The manufacturers' design for manufacturing (DFM) feedback, with my changes, a review of the first samples, and first batch support [scope TO CONFIRM].
- I need: an accepted prototype, a frozen board, volumes, a target unit price, and someone who can sign for tooling and orders.
- Not included: tooling and part costs (you pay manufacturers directly [TO CONFIRM]), certification, testing, warranty on parts others make.

### How I work (#process)
1. **Describe the product** in the form, in words. No files yet.
2. **Talk, and sign an NDA if you will share files.** A short call if you want one.
3. **Get a written scope.** Deliverables, exclusions, duration and price. Work starts when you accept [TO CONFIRM].
4. **Design and prototype.** I design the enclosure around your board and check the fit on a prototype.
5. **Hand off to manufacturers.** I send drawings and a request for quote, then review what comes back, including their design for manufacturing feedback.

### What I take on, and what I do not (#scope, added)
**I take on** housings for sensors, gateways, controllers, handheld and rail-mounted units, in sealed, outdoor, washdown and dusty conditions, designed to an ingress protection (IP) rating.

**Not for now:**
- Medical, automotive, defense and dual-use products, and equipment for explosive atmospheres.
- Mains-powered or high-voltage products [TO CONFIRM].
- Simulation studies such as finite element analysis, airflow or mold filling. I build prototypes and measure them.
- Certification and test reports. I design for a rating, and an accredited lab confirms it.
- Making parts. Manufacturers make them.

### Data and what you send (#data)
- No file upload. Describe the product in words and keep confidential details out.
- Files follow a mutual NDA, sent on request [TO CONFIRM, wording needs a lawyer]. Email daniel@normek.dk and ask before sending anything.
- The form emails your message to me. Cloudflare hosts this site and runs the Turnstile check that a visitor is a person. Resend delivers the email. Simply.com hosts my mailbox.
- Link: Read the privacy notice

### Who does the work (#about)
Photo: [TO CONFIRM]

I am Daniel Hessellund Johansen, a mechanical engineer with a Bachelor of Engineering (B.Eng.) from Aalborg University, 2017 to 2021. I co-founded SkyGrids (September 2022 to November 2025), an aerospace and deep tech company, and exited by selling my shares.

My portfolio includes enclosure work. Some of it belongs to companies I worked for, so I show it only with their written permission.

I build and test physical prototypes early. A printed part on your real board shows problems a screen does not.

My injection molding knowledge comes from university study, not production work. That is why a manufacturer's review comes before tooling is ordered.

Links: LinkedIn [TO CONFIRM link], daniel@normek.dk

### Contact (#contact)
**Tell me about your board.** Next steps:
1. I reply by email within [1 working day, TO CONFIRM].
2. If useful, a 30 minute call to scope. A mutual NDA comes first for files.
3. A written scope and price before any work starts [TO CONFIRM].

I take on at most [N, TO CONFIRM] projects at a time and say so early if I am full. Or email daniel@normek.dk

### Footer
Text in part 4.

## 3. Contact form microcopy
Four fields only (plan). Optional details, the call tick box and a hidden `situation` field wait for a wider function.
- **Above the fields:** "All fields are required." Set `maxlength` to 100, 254, 120 and 2,000 for name, email, company and message.
- **Name.** Empty: "Enter your name so I know who to reply to."
- **Work email.** Empty: "Enter your work email so I can reply." No @: "The email address needs an @ sign." Otherwise invalid: "That address looks incomplete. Try name@company.com."
- **Company.** Empty: "Enter your company name."
- **What do you need?** Helper: "Product, where it is used, board stage. No confidential details yet: files follow a non-disclosure agreement (NDA)." Under 20 characters: "Add a sentence or two on the product and what you need (at least 20 characters)."
- **Honeypot label:** "Website. Leave this field empty." Hide it from view and screen readers.
- **Error summary:** "Fix these fields to send your request:"
- **Button:** Request a feasibility review. While sending: "Sending..."
- **Under the button:** "I use your details only to reply to this request. Processors and retention are in the privacy notice."
- **Success,** on the page or at /thanks: "Request received. This is your confirmation. I reply from daniel@normek.dk within [1 working day, TO CONFIRM]." /thanks repeats the three next steps. No confirmation email is sent.
- **Send failed,** text kept: "Your request was not sent. Your text is still here. Try again or email daniel@normek.dk."
- **Person check failed:** "The check could not confirm you are a person. Try again or email daniel@normek.dk."
## 4. 404 page and footer
**404.** Title tag: Page not found: Normek. Heading: This page does not exist. Text: The address may be mistyped, or the page has moved. Links: Back to the home page, then the button and email as in the hero.

**Footer.** Normek, enclosure design for electronics teams. Legal name and form: [TO CONFIRM]. Company registration number (CVR): [TO CONFIRM]. Address: [TO CONFIRM]. daniel@normek.dk. Privacy notice. LinkedIn [TO CONFIRM link]. Professional liability insurance: [TO CONFIRM]. Mutual non-disclosure agreement on request, and ownership of what I design for you: [TO CONFIRM, wording needs a lawyer]. © 2026 [TO CONFIRM legal name]

## 5. Title and meta description
- Title: Normek: enclosure design for electronics teams
- Description: Enclosure design for electronics teams with no mechanical engineer. Feasibility review, prototypes and manufacturer hand-off by Daniel Hessellund Johansen.

## 6. Claims and commitments
| Claim or commitment | Status | Evidence needed |
|---|---|---|
| Mechanical engineer, B.Eng., Aalborg University, 2017 to 2021. Co-founded SkyGrids, 2022 to 2025, exited by selling shares | true today | CV, LinkedIn. Daniel's Q3 check first. C-016 |
| Portfolio exists, shown only with permission. Molding knowledge is university level | true today | Reuse inventory, CLAUDE.md |
| Standard box recommended when it fits | [TO CONFIRM] | Daniel confirms the policy. C-004 |
| Contents of all three stages, including heat and antenna notes | target | Daniel accepts. Domain check. No thermal or radio work in the repo yet. C-005 to C-007 |
| You pay manufacturers directly | target | Lawyer. C-008 |
| Duration depends on the project, fixed in the written scope. Sprint "about 1 week" (Daniel) not published | target | Price model (Q5), build log. C-009, C-010 |
| Take-on and not-for-now lists | [TO CONFIRM] | Domain check (Q9), mains decision. C-015 |
| Designed for an IP rating, a lab confirms. Sealing and tooling facts | true today | Domain check |
| Form data path, processors, no upload, no confirmation email. Mutual NDA on request | [TO CONFIRM] | Built function, processor agreements, Resend retention, lawyer wording. C-013, C-014 |
| Reply in 1 working day. At most N projects at a time | [TO CONFIRM] | Daniel can keep them (Q7). C-011, C-012 |
| Footer details, insurance, ownership wording | [TO CONFIRM] | Q2, broker, lawyer |
