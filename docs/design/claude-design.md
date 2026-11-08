# Claude Design canvas

The visual design of the site is made in Claude Design (the Design artifact type), and the code follows it.

- Canvas: https://claude.ai/artifact/9amHNi7MBB6o34g5NC7k8Q
- It is private to Daniel until he shares it from the page's Share menu.
- A snapshot of the source files is in `docs/design/canvas/` (see the README there). The live canvas is the source of truth.
- Status on 8 November 2026: drawn, not yet reviewed on screen. The canvas tool advises against rendering unless the owner asks, so the first screen review happens on the built site with Playwright screenshots. The `ui-designer` reviewed the sources against the brand guide (`docs/design/canvas-review-2026-11-08.md`).
- No design system is attached to the account, so the canvas uses the tokens in `brand/brand-guide.md` and `docs/design/tokens.md`.

## Pages and boards

| Canvas page | Board | Frame | What it shows |
|---|---|---|---|
| Home | `Main.dc.html` | 1440 px wide page | The v0 home page on desktop |
| Home | `Mobile.dc.html`, `Mobile-2.dc.html`, `Mobile-3.dc.html` | 390 px wide | The same page at phone width in three slices. They import `Main.dc.html`, so one edit changes both |
| Other pages | `Thanks.dc.html` | 1440 px wide page | Confirmation, `/thanks/` |
| Other pages | `NotFound.dc.html` | 1440 px wide page | The 404 page |
| Other pages | `Privacy.dc.html` | 1440 px wide page | `/privacy/` with a table of contents |
| System | `Foundations.dc.html` | 1440 px wide | Logo and colour roles with contrast ratios |
| System | `Type.dc.html` | 1440 px wide | Three families, the fluid scale and layout values |
| System | `Components.dc.html` | 1440 px wide | Buttons, fields, messages, cards, tags, trace, pad ring and the drawing style |

Not drawn yet: templates for the hidden v1 pages (case study, Data and IP). They wait until v0 is signed off.

## Order of authority

1. `brand/brand-guide.md` for colour, type, logo and devices.
2. `docs/design/tokens.md` for the names and values the code uses.
3. The canvas for layout and component states.
4. `docs/copy/v0-home-copy.md` for every word. If the canvas and the copy differ, the copy wins and the canvas gets fixed.

## Assets stored with the canvas

Logo route 01 Trace: lockup, lockup reversed, symbol, symbol reversed and the icon tile. The source files are in `brand/logo/1-trace/`.

## Rules

- No invented numbers, clients or prices. Missing facts show as [TO CONFIRM].
- No AI or tools wording on the site (Daniel's decision, 8 November 2026).
- The writing rules in `CLAUDE.md` apply to all text on the canvas.
- Changes go to the canvas first and then to code. The frontend developer reads the snapshot and matches it at 390, 768 and 1280 px.
- The site's content security policy forbids inline `style` attributes. The canvas uses them for speed, so the code rebuilds each value as a class on the tokens.
