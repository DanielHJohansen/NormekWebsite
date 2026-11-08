# Normek website and brand workspace

Working repo for the Normek website, brand and go-to-market. Normek develops AI-native product development solutions, starting with enclosure design for electronics companies. The name is provisional (see `docs/open-questions.md`).

**Status (2026-11-08):** pre-build. Strategy, brand concepts and the expert team are in place. There is no site code yet.

## Start here

1. `docs/open-questions.md`: the decisions we need from Daniel, each with a recommended default.
2. `docs/strategy/2026-11-08-ai-disclosure-and-go-to-market.md`: the marketing consult on whether to advertise AI use, plus the go-to-market plan.
3. `docs/adr/0001-stack-and-hosting.md`: the proposed stack and how it replaces Lovable.
4. `brand/logo/preview.png`: three logo routes.
5. `docs/content-reuse-inventory.md`: what to carry over from the Lovable site.

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
| `docs/` | Open questions, decisions (ADRs), strategy, content inventory, claims ledger |
| `brand/logo/` | Logo routes as SVG, the concept sheet, and the generator in `source/` |
| `scripts/check-writing-rules.mjs` | Checks Markdown for the em dash and the semicolon, which Daniel does not use |
