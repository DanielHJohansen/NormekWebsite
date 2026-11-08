# Normek website and brand workspace

Working repo for the Normek website, brand and go-to-market. Normek develops AI-native product development solutions, starting with enclosure design for electronics companies. The name is provisional (see `docs/open-questions.md`).

**Status (2026-11-08):** the v0 preview site is built (Astro 7 static, a Pages Function for the contact form, tests and CI). The design lives in a Claude Design canvas. Nothing is deployed yet: Daniel's one-time setup comes first (`docs/ops/cloudflare-and-resend-setup.md`). A stop-gap exists for the web hosting at Simply, so the site can show on normek.dk before the Cloudflare project is live (`docs/ops/simply-interim-upload.md`). It waits for Daniel's upload. The name is not cleared and placeholders marked `[TO CONFIRM]` are still on the page.

## Start here

1. `docs/open-questions.md`: the decisions we need from Daniel, each with a recommended default, and the decisions already taken.
2. `docs/ops/cloudflare-and-resend-setup.md`: Daniel's setup, about 45 minutes, starting with two-factor and a private repo.
   `docs/ops/simply-interim-upload.md`: the 10 minute stop-gap that puts the site on normek.dk through the Simply hosting.
3. `docs/design/claude-design.md`: the design canvas, its boards and the order of authority for design.
4. `docs/copy/v0-home-copy.md`: every word on the home page, with the fact check and buyer review beside it.
5. `docs/plan/work-breakdown.md` and `docs/adr/`: the build plan and the decisions behind the stack.
6. `docs/security/`: the threat model, the contact API contract and the security reviews.
7. `docs/launch-checklist.md`: everything that must be true before the preview is shared and before the site goes public.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install exact versions (install scripts are off) |
| `npm run dev` | Local dev server |
| `npm run build` | Static build into `dist/` |
| `npm run check` | Astro and TypeScript checks, also for `functions/` |
| `npm test` | Unit tests |
| `npm run test:a11y` | Playwright with axe on every page |
| `npm run check:dist` | Checks the built site: noindex, no inline code, links, placeholders (add `--launch` for the launch gate) |
| `npm run check:writing` | The em dash and semicolon rule for Markdown |
| `npm run package:simply` | After a build: write `dist-simply/` for the Simply hosting (headers as `.htaccess`, interim text). Refuses an indexable build |
| `node scripts/build-brand-assets.mjs` | Regenerates the favicons, icons and social image from the logo SVGs |

## How we work without Lovable

Work happens in Claude Code sessions on this repo, using the Claude subscription at no extra cost. Each change goes to a branch on GitHub. A free Cloudflare preview URL per branch lets Daniel review on a phone or PC (set up once, about 30 minutes). Merging to `main` publishes. Claude takes screenshots of its own work at phone, tablet and desktop widths before calling it done.

## The expert team

Sixteen specialist agents live in `.claude/agents/`. The main assistant calls them. Ask in plain words, for example:

- "Ask the marketing strategist whether we should show prices on the site."
- "Have the security engineer review the contact form design."
- "Get the customer persona reviewer to react to this headline."

In Claude Code the agents run as named subagents. In Cowork, say "load `.claude/agents/<name>.md` and follow it". The roster and the usual order of work are in `CLAUDE.md`.

## Repo map

| Path | What |
|---|---|
| `CLAUDE.md` | Rules and context every assistant reads first |
| `.claude/agents/` | The 16 specialist personas |
| `src/` | The Astro site: pages, components, content collections (`src/content/`), styles and tokens |
| `functions/` | The contact form's Pages Function (`/api/contact`) |
| `public/` | Fonts, favicons, icons, the social image and `_headers` |
| `tests/` | Unit tests (Vitest) and end to end tests (Playwright with axe) |
| `scripts/` | Checks, preview server, screenshots and the brand asset build |
| `.github/` | CI workflow and Dependabot |
| `docs/` | Decisions, copy, design, legal, media, ops, plan, security, SEO, strategy, UX, claims ledger |
| `docs/design/canvas/` | Snapshot of the Claude Design canvas sources |
| `brand/` | The web brand guide and the logo routes with their generator |
