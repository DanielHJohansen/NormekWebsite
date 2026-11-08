# Fact check: v0 home page copy

Date 2026-11-08. Reviewer: `mechanical-domain-expert`. Web pages could not be opened from this sandbox, so sources marked (s) are search summaries only and unverified. Nothing is wrong outright, but several lines overclaim or leave gaps. Unchanged: the About lines on molding knowledge and early printing.

| Statement | Verdict | Suggested wording | Source |
|---|---|---|---|
| Card 2: breathing box, membrane vent | **Correct with edit.** Physics holds: a rigid airtight box cooling from 60 to 20 °C sees up to 12 kPa negative pressure. But a membrane passes water vapor, so condensation can still form. Corrects packages doc section 5. | "A sealed box breathes. As it cools, the air inside contracts and draws humid air in through the weakest seal. A membrane vent equalizes pressure and blocks liquid water and dust, but passes water vapor, so condensation can still form. I start with the cheapest fix that works." | Ideal gas law (my calculation). Gore FAQ (s, gore.com/resources/faq-gore-protective-vents). |
| Card 3: ten units, hundreds | **Correct with edit.** "Ten" is arbitrary. "Hundreds" holds only with "can": vendor break-evens run from about 200 to 2,000 units, one test found 13,050. | "Printing suits prototypes and small batches. In the hundreds and beyond, casting or molding can cost less per part. Tooling only pays off once volume covers it, and where that point falls depends on the part, so I ask for quotes." | Plastics Today, Formlabs, RSP, Boxumold (s). All vendors. |
| Stage 1: "heat and antenna notes" | **Overclaim.** The repo shows no thermal or radio work. Deliver only a hand estimate of temperature rise (surface area, convection of 2 to 25 W/m²K, sun load), heat path ideas, antenna keep-outs from the module datasheet, and plastic versus metal advice. | "heat path notes (a hand estimate of temperature rise at your power figure, not a simulation) and antenna placement notes (keep-outs and housing material, not tuning or radio tests)" | Engineering judgement. Incropera range (s, pages.mtu.edu/~fmorriso/cm3120). The module datasheet sets the keep-out. |
| Stage 1: materials, cost range, STEP | **Correct with edit.** "Materials" reads as a final choice. Buyers hear "order of magnitude" as plus or minus 20 percent. NIST expands STEP as "Product model data". | "a material shortlist", "a rough unit cost range per volume step, not a quote", "STEP: Standard for the Exchange of Product model data, ISO 10303" | Packages doc 1.1. NIST (s, nist.gov/node/743261). |
| Stage 2 | **Correct with edit.** Drops the packages doc 1.2 exclusions. A print differs from the molded part in material and tolerance, so it checks fit only. | Add "Printed prototypes check fit. They do not prove sealing, strength or heat in the production material." and "native CAD ([format TO CONFIRM])" | Packages doc 1.2. |
| Stage 3 | **Correct with edit.** "First batch support" is undefined, so **cannot verify.** No revision limit, unlike packages doc 1.3. "Review of the first samples" does not say who measures. | "a review of the first samples: the manufacturer's inspection report against my drawing, and a fit check on your board. Up to two revisions after DFM feedback. Later tool changes are quoted." | Packages doc 1.3. |
| Stages 1 to 3, one engineer | **Cannot verify.** Normal scope, hours unlogged. My estimate: stage 1 needs 15 to 30 h, so at 10 to 15 h a week it runs 1 to 3 weeks, not 1. | No change. Publish no duration until the RD-1 build log exists. | Engineering judgement. Ledger C-009, C-010. |
| Take-on list | **Overclaim** for washdown: hot high-pressure jets (IPX9, IP69K) plus cleaning chemicals, and the repo shows no such work. **Correct with edit** for the rest. | "...sealed, outdoor and dusty conditions, designed to an ingress protection (IP) rating (IEC 60529). The rating holds for the assembly with the glands, vent and cable I specify." | IEC 60529. IP69K is ISO 20653 (s). |
| Not-for-now list | **Correct with edit.** A buyer will assume EMC design, CE or UL marking, UV life, flammability compliance, drop survival, supplied glands and thermal design. "Making parts" clashes with printed prototypes. "Mains-powered" is undefined. | "Certification, marking and tests: electromagnetic compatibility (EMC), radio, flammability, UV, thermal, drop and ingress protection tests, and CE marking or UL listing. I design for a rating, and an accredited lab confirms it." "Making production parts. I make printed prototypes only." "Products with 50 V AC or 75 V DC or more [TO CONFIRM]." "Explosive atmospheres, including combustible dust." "Glands, vents and seals: I specify them, you buy them [TO CONFIRM]." | Directive 2014/35/EU Article 1 (s). |
| Pay manufacturers directly, tooling | **Correct with edit.** Common model (engineering judgement), not legal advice. Risks: a molder can withhold a tool in a dispute, tool rework after a drawing error, and the RFQ sends your CAD to 2 to 3 third parties, which the page never says. | "Manufacturers invoice you directly and you own the tooling [TO CONFIRM, lawyer]. You approve the manufacturer list before I send any files." | Harris Sliwoski article (s). A lawyer confirms. |
| Hero caption | **Cannot verify.** No illustration exists yet. Engineers read every detail as a claim. A true section hatches cut faces at a different angle per part and leaves an axially cut screw unhatched. Show standoffs and a grooved seal, no IP label. | "Illustration, not to scale: a circuit board in a two-part housing, shown as a section. Not a customer project." Swap in an RD-1 CAD section later. | ISO 128-44 via GrabCAD summary (s). |

## Must fix before launch

1. Card 2: replace the vent sentence.
2. Stage 1: scope or drop "heat and antenna notes" (C-005).
3. Scope lists: cut "washdown", define the voltage line, name the excluded tests and marks.
4. Stage 3: define first batch support and the revision limit.
5. Card 3 and Stage 2: drop "ten", add "Printed prototypes check fit."

## Questions only Daniel can answer

1. Have you designed or tested for hot high-pressure washdown (IPX9, IP69K)? If not, "washdown" comes out.
2. Will you stand behind a hand heat estimate and antenna placement notes, and who checks the antenna side?
3. Which CAD system and license make the native files? Free or personal licenses often bar paid work.
4. What does first batch support cover, and who pays if a drawing error shows after the tool is cut?
5. Where is your voltage line (24 V DC only, external mains adapter, mains inside), and will you drop-test handhelds?

## Missing claims-ledger rows (proposed, ledger untouched)

- **C-017:** card 3 wording. Evidence: three quotes for one part (print, casting, molder) from RD-1 or RD-2. Target.
- **C-018:** card 2 wording. Evidence: the calculation and saved vent supplier pages. Target. Copy section 6 should say "true after edits".
- **C-019 and C-020:** "A manufacturer's review comes before tooling is ordered" (About), and "Up to two revisions after DFM feedback. Later tool changes are quoted." Evidence: scope template. Target.
- Update C-005 to C-007 and C-015 to the edited wording. C-015's domain check fails for washdown: mark that part "remove".
