# Service packages and reference designs

Date: 2026-11-08. Author: mechanical-domain-expert. Status: proposal for Daniel to confirm, not site copy. [TO CONFIRM] marks open facts, prices, partner names and durations. [verify] marks a general engineering figure that needs a datasheet or quote before publication.

## 1. The three packages

Daniel leads every package and signs off every deliverable. Prices stay [TO CONFIRM].

### 1.1 Enclosure Feasibility Review

Duration: 1 week after complete inputs. Fee credited against the Sprint, as the consult suggests. Both [TO CONFIRM].

- **Customer provides:** STEP model and DXF outline of the assembled board (revision, component heights). Positions of connectors, buttons, LEDs, sensors and antenna. Power dissipation (typical and peak, watts) and temperature range. Environment (indoor or outdoor, dust, water, chemicals, UV, vibration), mounting, units per year at launch and in year three, target enclosure cost.
- **Normek delivers:** a PDF report with the recommendation (catalog box or custom), process route by volume, material shortlist, sealing and venting approach, a hand estimate of passive cooling (not simulation), antenna placement notes and risks with the cheapest fix. A list of board changes that are cheap now and costly later (holes, connector edges, keep-outs, component heights). A CAD envelope study (STEP). A budgetary cost range from published prices, labeled order of magnitude.
- **Reviews:** one 60 minute call, one written revision.
- **Excludes:** final CAD, prototypes, simulation, tests, drawings, binding quotes.
- **Done by:** Daniel alone.

### 1.2 Prototype Sprint

Duration: 2 to 4 weeks after the board is frozen [TO CONFIRM]. Effort hypothesis: 35 to 60 hours, which does not fit two weeks at 10 to 15 hours a week.

- **Customer provides:** everything in 1.1, a frozen board revision (a change mid-sprint changes scope), one or two assembled boards shipped to Daniel, parts lists for connectors, cables, antenna and battery, and a named reviewer who answers within 2 working days [TO CONFIRM].
- **Normek delivers:** native CAD and STEP of enclosure, seals, fasteners and board assembly. A mechanical bill of materials (BOM). One or two rounds of 3D printed prototypes (2 to 5 sets per round [TO CONFIRM], process stated). A fit report: photos, measured critical dimensions against the model, connector, button and LED alignment. Design notes on sealing, thermal path, antenna and production route. Assembly steps.
- **Reviews:** two design reviews (concept before printing, fit report after round 1). Extra rounds are quoted.
- **Excludes:** production drawings and tolerances, molder sign-off, tooling quotes, environmental or compliance tests, styling studies [TO CONFIRM], board redesign, firmware, simulation.
- **Done by:** Daniel for design and fit check. Printing on his printers or at a print service [TO CONFIRM]. Printed parts differ from molded parts in material, surface and tolerance, so results do not transfer to production.

### 1.3 Production Package

Quoted. Duration: 4 to 8 weeks to first samples for printed, cast or machined routes, 8 to 16 weeks with injection molding tooling [verify with partners, TO CONFIRM].

- **Customer provides:** accepted prototype and feedback, frozen board, first-order and annual volume, target unit price, markets, quality requirements (for example supplier ISO 9001), and a named signatory for tooling and purchase orders. The customer owns the tooling and pays partners directly [assumption, to confirm with a lawyer].
- **Normek delivers:** a release package (STEP, native CAD, part drawings with material, finish, critical dimensions and tolerances per ISO 2768 or ISO 20457 [verify], assembly drawing, BOM). A request for quote (RFQ) pack for 2 to 3 partners [TO CONFIRM] with a comparison of unit price at volume breaks, tooling, lead time, minimum order, tooling ownership and Incoterms 2020. The partner's design for manufacturing (DFM) report and the changes made. A sample review: the partner's first article inspection (FAI) report checked against the drawing, plus a fit and seal check on the customer's board. First batch support [scope TO CONFIRM].
- **Reviews:** up to two revisions after partner DFM feedback, one review per tool trial. Later tool changes are quoted.
- **Excludes:** tooling and part costs (paid to partners), certification and testing, supplier audits, process validation, warranty on partner-made parts, simulation, the CE technical file (the product manufacturer's), parts resale until insurance and terms exist (open-questions item 6).
- **Done by:** Daniel for the release package, RFQ, reviews and project management. Partners do DFM review, tooling, production and inspection. Their DFM review is a required gate, because Daniel's injection molding knowledge is university level.

## 2. Not offered for now

- Medical devices (ISO 13485 design controls, IEC 60601-1 safety).
- Explosive atmospheres (ATEX Directive 2014/34/EU, IEC 60079 series).
- Automotive (IATF 16949 quality system, ISO 16750 testing [verify]).
- Defense and dual-use, per the strategy consult.
- Simulation-heavy work such as finite element method (FEM), airflow (CFD) and mold-filling. Daniel builds and measures instead.
- Mains-powered or high-voltage products, until Daniel decides he is comfortable with the safety rules (IEC 62368-1, IEC 61010-1) [TO DECIDE].
- Certification, test reports and finished parts. Accredited labs (ISO/IEC 17025) test, partners produce.

## 3. Who does what, from repo facts only

| Activity | Evidence of Daniel's own work | Partner or lab |
|---|---|---|
| CAD and board fit | B.Eng. mechanical engineer. PB10 and TB150 enclosures are employer work, not cleared. CAD from sketches in days (testimonials, personal work) | None |
| Prototypes | Idea to printable G-code pipeline (own, to confirm). Printer access [TO CONFIRM] | Print service for industrial processes |
| Sealing | Mimir's Well (own, to confirm). TB150 weather sealing (employer). No lab IP test in the repo | Seal suppliers advise. Accredited lab tests |
| Plastic part design | University level only: materials project, part design course. Idunn Herb Holder (own, to confirm) | Molder owns gates, shrinkage, tool. Review required |
| Machined, bent, cast parts | None in the repo [TO CONFIRM] | Machine, sheet metal, foundry partners |
| Tooling, production, FAI | None | Partners make and measure. Daniel reviews |
| Thermal, radio, EMC | None in the repo. Prefers physical measurement | Accredited labs |
| Simulation | Not a specialty | Not offered |

No partner is named in the repo. Every partner entry is a role to fill, so copy must not imply existing relationships.

## 4. Reference designs Normek owns

Rules for both: build from scratch from public board data, with no PB10 or TB150 geometry. Log hours per step. Every measured number becomes a claims-ledger row. Keep third-party board models out of the repo unless the licence allows it.

### RD-1 Sealed outdoor sensor housing

- **Specification:** a common LoRaWAN or cellular development board with a published drawing [TO CONFIRM board and licence], measured on a real sample because drawings and boards disagree. Two-part box, four screws into brass heat-set inserts, face seal in a groove (about 15 to 30 percent squeeze [verify in the seal supplier handbook]), one cable gland rated IP68 [verify], one expanded PTFE (ePTFE) membrane vent, internal antenna, wall and pole ears. Printed prototype. Intended production route: UV-stabilized ASA or PC/ASA injection molding [verify grade].
- **Show:** exploded view, groove section, a sealing-path diagram marking every leak path (lid seal, gland, vent, inserts, printed layer lines), photos of failures, the build log.
- **Measure:** printed dimensions against CAD on 3 to 5 samples. Real squeeze from groove depth and gasket height. Pressure-decay leak test before and after 10 hot and cold cycles. In-house immersion check at IPX7 conditions (1 m, 30 minutes). Temperature rise at a known dissipation (3 thermocouples, still air). Relative signal strength with and without the housing, same positions, 5 repeats. Mass, parts cost, hours.
- **Effort (hypothesis):** 45 to 70 hours over 5 to 7 weeks.
- **Supports:** "designed for IP67 (IEC 60529) with a documented sealing design". The immersion, signal and temperature results, each only if measured.
- **Does not support:** "tested to IP67", "waterproof", "UV stable", "ready for production".

### RD-2 Wall-mounted gateway housing

- **Specification:** a common single-board computer or LoRaWAN gateway board with Ethernet, power and two antenna connectors [TO CONFIRM]. Two-part housing following molding rules: uniform wall about 2 to 3 mm, draft 1 to 2 degrees, ribs about half the wall at the base [all verify with the resin guide]. Two light pipes, reset pin-hole, keyhole wall mount, low and high vents. PC/ABS grade rated UL 94 V-0 at the wall thickness [verify datasheet]. Printed prototype.
- **Show:** exploded view, wall and draft maps from the CAD's geometry analysis (not FEM), a tolerance stack for lid gap and light pipe alignment, timed assembly steps. Ask one molder for a free DFM review and publish it with permission, the cheapest route to "reviewed by a molder".
- **Measure:** temperature rise with and without vents at idle and full load. Hang test at 3 times device weight for 24 hours [target]. Dimensions against CAD. Assembly time over 3 builds. 50 snap-fit cycles (printed snap fits do not predict molded ones).
- **Effort (hypothesis):** 40 to 60 hours over 4 to 6 weeks.
- **Supports:** "designed to injection molding rules" with the measured wall and draft. "UL 94 V-0 material grade specified". In-house temperature rise. After a real review: "reviewed by [molder]".
- **Does not support:** any IP rating (vented), "tooled", "tested to UL", "passes EMC".

Both together take about 85 to 130 hours, which competes with outreach for the same weekly hours.

## 5. Technical statements

| Likely draft | Verdict | Safe wording |
|---|---|---|
| "IP67 enclosure" | vague | "Designed for IP67 (IEC 60529) as a complete assembly with the specified gland and vent. Checked by our own immersion test, not by an accredited laboratory." |
| "Waterproof" | wrong | Use the IP code. IP67 means dust-tight and tolerant of temporary immersion (1 m, 30 minutes). It does not cover water jets (IPX5, IPX6) unless dual-coded. |
| "UL 94 V-0 housing" | wrong | "Molded from a grade rated UL 94 V-0 at [thickness], per the supplier's data." The rating belongs to a material grade at a thickness and color. |
| "Plastic is radio transparent" | vague | "Plastic adds some loss and can detune an antenna. We check the antenna in the final housing." |
| "CE compliant enclosure" | wrong | "Designed to support your CE conformity assessment." The product manufacturer carries CE (EMC Directive 2014/30/EU, Radio Equipment Directive 2014/53/EU). |
| "Ready for injection molding" | unsupported | "Designed to injection molding rules." Add "reviewed by [partner]" only after a real review. |
| "Printing proves the design" | wrong | "Printed prototypes check fit. Material, surface and tolerance differ from molded parts." |
| "Tolerance ±0.05 mm", "-40 to 85 °C" | unsupported | "Set per feature on the drawing, by process." "Material datasheet range, not verified on the assembly." |

Safe as written:
- The IP rating belongs to the whole assembly. The gland, vent, buttons and windows set it, not the shell.
- Sealed boxes breathe. Temperature swings pull moist air through weak points unless a membrane vent equalizes pressure.
- Printing suits roughly 1 to 100 parts and urethane casting small runs. Injection molding pays off when volume covers tooling, between a few hundred and a few thousand parts depending on size [verify with quotes].

Avoid: military-grade, unbreakable, fully sealed, EMC-proof, certified (without a certificate), tested to IP or IK (without a lab report), FEM-validated, production-ready, "our factory", ISO 9001 certified [TO CONFIRM].

## 6. Fact-check checklist and glossary

Mark each statement correct, vague, unsupported or wrong, and give the fix.

1. Which verb is true: designed, modeled, printed, tested in-house, tested by an accredited lab, produced?
2. Who did it: Daniel, a partner or a lab? Partner work never reads as Normek's.
3. Does an IP or UL 94 rating apply to the assembly, the material or a component? Give the standard number.
4. Every number has a source: build log, datasheet, quote or the word "typical". Speed and cost claims need a ledger row.
5. No banned word from section 5. No AI claim until Daniel decides.
6. Captions say render, printed prototype or production part.
7. Does the process fit the stated volume?
8. No client, partner, board or past-employer product named without permission.
9. Abbreviations spelled out on first use. Run the writing-rules script.

**Glossary.** **ATEX** EU explosive atmosphere rules. **BOM** bill of materials. **CE** EU conformity mark placed by the product manufacturer. **CFD** computational fluid dynamics. **DFM** design for manufacturing. **DXF** drawing exchange format. **EMC** electromagnetic compatibility. **ePTFE** expanded polytetrafluoroethylene, a vent membrane. **FAI** first article inspection. **FEM** finite element method. **IEC, ISO** International Electrotechnical Commission, International Organization for Standardization. **IK** impact protection code (IEC 62262). **IP** ingress protection code (IEC 60529). **LoRaWAN** long range wide area network. **PC, ABS, ASA** polycarbonate, acrylonitrile butadiene styrene, acrylonitrile styrene acrylate. **RFQ** request for quote. **STEP** neutral 3D exchange file (ISO 10303). **UL 94** plastics flammability classification.

## 7. Internal only: where AI helps

No marketing claims. Every number from an AI tool is unverified until checked against a datasheet or a measurement.

- **Intake:** turns datasheets and board STEP files into a requirements and keep-out table. Models misread units and table rows.
- **Scripted parametric CAD** for variants. Output can look right and be wrong (inverted draft, wrong units, open surfaces). Run automatic checks (watertight, volume, bounding box, interference, minimum wall), test them with seeded errors, then review in CAD.
- **Clearance scripts** on board and enclosure STEP files. They are only as good as the board model, which may omit parts.
- **DFM geometry checks** for wall, draft and undercuts. They find geometry, not gate position, sink or warp. The molder covers those.
- **Drawings and BOM.** Datums and tolerances stay human decisions. A neat wrong tolerance is worse than none.
- **Quote parsing** into comparison tables. Check price breaks, currencies and Incoterms against the PDFs.

It does not prove a seal (water does), give thermal truth (thermocouples do), judge snap-fit feel or gasket force (hands do), or tell you what the customer left out. Customer files go only to approved tools (open-questions item 4). No speed claim until the build log has the hours (ledger C-001, C-002).

## 8. Open items and hand-offs

- Daniel: CAD tool and printers available. Parts budget for both builds (the 0 to 25 euros a month line does not cover it). Publish STEP files or only renders and drawings. Mains-voltage products in or out.
- `legal-compliance-advisor`: who counts as manufacturer if Normek supplies parts, and tooling ownership. `content-copywriter`: apply section 5 and the checklist. `visual-media-producer`: views from the real CAD, captions that say render or photo.
