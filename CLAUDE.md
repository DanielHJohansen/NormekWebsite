# CLAUDE.md

Working guide for assistants (Claude Code on the web, terminal and Cowork) in this repo. Read it fully before doing any work.

## What this repo is

The website, brand and go-to-market workspace for **Normek**, a new company founded by Daniel Hessellund Johansen (Denmark). Daniel decides. Assistants recommend, draft and build.

- Status: pre-build. Strategy, brand and the expert team come first. There is no site code yet.
- Name: **provisional**. See "Name risk" below. Do not buy domains, print anything or announce the brand until the name is cleared.
- Open decisions live in `docs/open-questions.md`. Read it before proposing work.
- Logo concepts are in `brand/logo/` (route 01 Trace is the working recommendation, nothing is final).

## The company

Normek develops AI-native solutions for product development. The first offer is mechanical design of enclosures and housings for electronics.

- Target customers: electronics companies that are strong in PCBs, firmware and electronics but have no mechanical engineering in-house.
- Offer: design the enclosure, prototype it, work with manufacturing partners for the mechanical components, and deliver the finished product. It starts as design consulting and grows into full product delivery.
- Outwardly Normek looks like a premium engineering consultancy. Inwardly it uses AI tools heavily to work faster and cheaper than competitors.
- Whether and how loudly to say "AI" in marketing is Daniel's decision. The consult in `docs/strategy/2026-11-08-ai-disclosure-and-go-to-market.md` recommends outcome-first messaging with AI disclosed as the method. Until Daniel decides, do not put "AI-powered" or similar claims in public copy.
- The website is aimed first at the enclosure customer. Wider mechanical product development comes later.

## Founder facts and limits (do not overclaim)

Facts of record come from Daniel's CV and LinkedIn. Never invent experience.

- Mechanical engineer (B.Eng., Aalborg University, 2017 to 2021). Serial founder. Co-founded SkyGrids (September 2022 to November 2025, aerospace and deep tech) and exited by selling his shares.
- Enclosure and electronics packaging work exists in his portfolio (wireless power units PB10 and TB150, the Mimir's Well acoustic chamber, custom foam inserts). Several items were done for past employers and need clearance before reuse. See `docs/content-reuse-inventory.md`.
- Injection molding knowledge is university level (a materials project and a part design course). It is not production-scale part design. Do not claim more. Production work goes through manufacturing partners.
- Finite element analysis (FEM) and simulation are not his specialty. He prefers building and testing physical prototypes. Do not sell simulation-heavy services, and do not copy the "FEM analysis" service claim from his personal site without his approval.
- His personal site (danielhjohansen.lovable.app, source in the `personal-branding` repo) is a separate personal brand. Leave it alone.

## Writing rules (from Daniel)

- Never use the em dash or the semicolon in anything drafted for Daniel: site copy, docs, emails, posts and these agent files. Rewrite with a period, comma, colon or parentheses. They read as AI tells to him and to the people reading his material. Check every draft with `node scripts/check-writing-rules.mjs` before calling it done. Code files are exempt from the semicolon rule.
- Prefer "2 to 4 weeks" over an en dash in ranges.
- Spell out jargon abbreviations in public copy on first use, for example "design for manufacturing (DFM)". Internal notes may abbreviate.
- Plain, concrete, engineer to engineer. Specifics beat adjectives. No hype words such as cutting-edge, seamless, unlock or revolutionary.
- English is the default site language. Danish copy must read as natural Danish, not translated English.

## Truth rules (this site sells trust)

- Never invent clients, results, numbers, certifications, partners, testimonials or quotes. Write `[TO CONFIRM]` where a fact is missing.
- Every performance or comparison claim ("faster", "cheaper", "in X weeks") needs a row in `docs/claims-ledger.md` with evidence before it ships. Targets are labeled as targets.
- Say exactly what was done. "Designed for IP67" is not "tested to IP67 by an accredited lab".
- Work for past employers and customers is not ours to publish without written permission. Track clearance per item.
- Simulated feedback (for example from `customer-persona-reviewer`) is not market evidence. Real customer conversations are.

## Name risk (unresolved)

Desk research on 2026-11-08 used third-party sources and is not verified against official registers. It found:

- A **NORMEK A/S** in Viborg, Denmark (CVR 29423431, registered 2006, plumbing and sheet-metal industry code). The Danish company register may refuse "Normek ApS" if the names are too alike.
- **Normek Oy**, a Finnish steel structure and facade company, bought by Donges Group in 2019 and merged into NORDEC. The brand may be dormant, but trademarks may remain.
- **Normec Group** (Netherlands), a large testing, inspection and certification group. It is pronounced the same as Normek and operates close to the compliance world our customers live in.

Daniel already owns **normek.dk** (registered and hosted at simply.com), so the `.dk` domain is covered. That does not clear the company register or trademarks. Before any further spend: check CVR (datacvr.virk.dk), EUIPO TMview and the Danish Patent and Trademark Office, then get a trademark professional's view. Do not buy more domains or print anything until the name is cleared. Keep the logo symbol separate from the wordmark so a name change is cheap.

## Confidentiality and secrets

- No secrets in the repo, ever: no tokens, API keys, passwords or private keys. Use environment variables and the hosting platform's secret store. If one appears, stop, tell Daniel and rotate it.
- Assume this repo could become public. Keep customer or third-party confidential material (CAD, drawings, NDAs, quotes) out of it.

## Stack (ADR 0001, accepted with amendments on 2026-11-08)

Astro 6 with static output, Tailwind CSS 4 and Markdown or YAML content collections in strict TypeScript, hosted on Cloudflare Pages through Cloudflare's Git integration. One Pages Function handles the contact form (Turnstile, server-side validation, mail sent through Resend behind a one-file adapter). There is no database, no CMS and no analytics during the private preview, and every deployment is `noindex` until launch. Reasoning, alternatives and amendments are in `docs/adr/0001-stack-and-hosting.md`, and the build plan is `docs/plan/work-breakdown.md`. Follow the plan, and do not deviate from the ADR without a new ADR.

DNS for normek.dk stays at simply.com for now (the zone is DNSSEC signed, Simply's mail records are in place and no mailboxes exist yet), and the ADR explains how the site connects to it. Read or change DNS only through Simply's official connector as described in `docs/ops/simply-connector.md`, and never create or store a Simply API key.

## The expert team (`.claude/agents/`)

The main assistant is the orchestrator. Subagents cannot launch other subagents, so the main assistant calls them, gives each a self-contained brief and runs independent specialists in parallel in one message. In Cowork, where named agents are unavailable, read the persona file and follow it.

| Group | Agent | Call it for |
|---|---|---|
| Strategy and brand | `marketing-strategist` | Positioning, segments, go-to-market, channels, pricing, the AI-disclosure question |
| | `brand-identity-designer` | Name checks, logo, palette, typography, brand voice |
| | `content-copywriter` | All site copy, case studies, emails, posts, AI-tell review |
| | `customer-persona-reviewer` | Blunt buyer-side review of messaging and pages (read only) |
| | `sales-enablement-advisor` | Inquiry replies, qualification, scoping, NDAs, quotes, pricing models |
| Experience and visuals | `ux-conversion-designer` | Sitemap, user journeys, page briefs, forms, trust signals |
| | `ui-designer` | Design system, layout, components, critique of screenshots |
| | `visual-media-producer` | CAD to web renders, 3D viewers, diagrams, photo direction |
| Build and run | `web-architect` | Stack, structure, ADRs, performance budgets, work breakdown |
| | `frontend-developer` | Implementation, accessibility in code, tests |
| | `devops-engineer` | Domain, DNS, email, hosting, CI/CD, monitoring, setup guides |
| Trust and quality | `security-engineer` | Threat model, headers, forms, dependencies, launch security gate |
| | `legal-compliance-advisor` | GDPR, cookies, company details, AI and IP wording, marketing law, trademarks (not a lawyer) |
| | `qa-accessibility-engineer` | Accessibility, performance, cross-browser, pre-launch checklist |
| Growth and domain | `seo-analytics-specialist` | Search visibility, structured data, privacy-friendly analytics |
| | `mechanical-domain-expert` | Technical fact-checking, service scope, reference designs |

Typical sequence:

1. Before design: `marketing-strategist`, then `customer-persona-reviewer` on the message, then `ux-conversion-designer` for the sitemap and page briefs.
2. Design: `brand-identity-designer` and `ui-designer` define tokens, `content-copywriter` writes, `mechanical-domain-expert` fact-checks, `visual-media-producer` makes assets.
3. Build: `web-architect` plans, then `frontend-developer` and `devops-engineer` work.
4. Gate before merging to the production branch: `qa-accessibility-engineer` and `security-engineer` in parallel.
5. Before launch: `legal-compliance-advisor`, `seo-analytics-specialist`, `customer-persona-reviewer` and a claims-ledger check.
6. After the first inquiry arrives: `sales-enablement-advisor`.

## How we work

- Develop on the branch the session designates. Never push to `main` without Daniel's say-so. Never force-push. Do not open a pull request unless asked.
- Small, atomic commits. Commit only the files you intend to change. Pull before and push right after.
- Look at your work. Render pages with Playwright (preinstalled in cloud sessions) and review screenshots at 390, 768 and 1280 px before calling UI work done.
- To view a page, run `node scripts/screenshot.mjs <https-url>` (details in `docs/ops/viewing-the-site.md`). Only HTTPS and hosts on the environment's allowed list work. Never bypass certificate errors.
- Prefer boring technology. Justify every dependency. No third-party scripts without an ADR in `docs/adr/`.
- Decisions that change scope, cost, brand or legal exposure go to Daniel as a short question with a recommended default.
