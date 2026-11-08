# Content reuse inventory

Source: the `personal-branding` repo (danielhjohansen.lovable.app). That site is a personal portfolio. Normek sells enclosure design to electronics companies, so everything below is re-angled, not pasted. Clearance for past-employer work is unknown for every item until Daniel answers (see `docs/open-questions.md`, item 3). Paths are relative to that repo.

## Case studies (`src/components/Portfolio.tsx`)

Relevance is to the enclosure customer. In the Clearance column, **Own** means it appears to be Daniel's own project and is still to be confirmed. **Employer** means it was done for a past employer, so written permission is needed.

| Project | What it shows | Relevance | Clearance | Plan |
|---|---|---|---|---|
| Mimir's Well | Concept to tested prototype of a soundproof smartphone chamber: sealing, materials, acoustic tests, industrial design | High | Own [TO CONFIRM] | Lead case study |
| TB150 Wireless Power | Rugged drone box and vehicle mount: shock, vibration, weather sealing, operator access | High | Employer (SkyGrids) | Clear first, then re-angle as an enclosure story |
| PB10 Wireless Power | Compact housing for a remote industrial IoT sensor with wireless power: alignment and thermal limits | High | Employer (SkyGrids) | Clear first, then re-angle |
| AI-Assisted 3D Modelling Pipeline | Idea to printable G-code with AI in the loop | High for the AI story, off topic for enclosures | Own [TO CONFIRM] | Use as a how-we-work example only after the "weeks into days" claim is measured and in the claims ledger |
| Idunn Herb Holder | Consumer product from sketch to manufacturable design: wall thickness, draft, assembly | Medium | Own [TO CONFIRM] | Design for manufacturing example |
| Custom Foam Packaging | Laser-cut inserts for transporting precision equipment | Medium | Unknown | Small proof item |
| Quick-Release Mechanism | Field coupling that fails safe | Medium | Unknown | Detail for a latch or closure page |
| Retract mechanism for Nordic Wing | Precision mechanism in a tight envelope, field tested | Medium | Employer (Nordic Wing) | Anonymize or skip until cleared |
| Laser Communication Gimbal | Two-axis precision prototype | Low to medium | Employer (SkyGrids) | Hold |
| Danfoss ICM150 test rig | High-impact test equipment with FEM | Low | Employer (Danfoss) | Skip |
| Structural FEA, Hydraulic Wood Splitter, Optical Simulation, CUAV Laser Concept, Robot Cell Testing, Laser Cut Fabrics, Ceramic 3D Printing | Other engineering work | Low | Mixed or unknown | Skip for now. Do not promote simulation, it is not a specialty |

## Testimonials (`src/components/Testimonials.tsx`)

Three quotes from Julie Bloch Lauridsen, Jacob Bluhm Pedersen and Alexander Kirkegaard (Akademisk Gesjæft). They praise Daniel's personal work: CAD drawings from sketches in days, machine setup, and a custom screw mechanism delivered on budget. They are not Normek client proof. Ask each person for permission to reuse them on a company site, and label them as work done by Daniel before Normek. Danish marketing law expects testimonials to be genuine and permitted.

## Photos and media (`public/lovable-uploads/`)

- Keep: `daniel-in-workshop.jpg` and the `Pictures of Daniel/` set for the About page. The files are over 1 MB each, so compress them first.
- Project photos for the cleared case studies only.
- Do not carry over: the `back-in-denmark*.mp4` files (39 MB, 9 MB and 5 MB versions of a personal video). They are off topic and far too heavy.

## Copy worth adapting

- The method paragraph in the About section (build physical prototypes early, test rigorously, compress cycles) becomes the "how we work" process. Drop the line about full-time roles, which signals a job search.
- "Rapid prototyping" and "technical de-risking" from the value props are on message. Drop "interim technical leadership" (a different offer) and avoid leaning on FEM.
- The structured data and `llms.txt` ideas carry over as an Organization or ProfessionalService description.

## Do not carry over

- The Supabase client and the edge function for the contact form (replaced by a serverless function, see ADR 0001).
- The `.env` tracked in git, the Fontshare and Google Fonts CDN imports, the shadcn component set and the blue visual identity.
- The personal email and the personal footer line. The company footer needs the company name, address, email and CVR number.
