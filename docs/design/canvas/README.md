# Canvas source snapshot

A copy of the Claude Design canvas files as of 8 November 2026. The live canvas is the source of truth: https://claude.ai/artifact/9amHNi7MBB6o34g5NC7k8Q (private to Daniel until he shares it).

These files are not buildable on their own. They are HTML with `{{holes}}`, `<sc-if>` and `<dc-import>` tags and inline styles, written for the canvas runtime. Read them to see exact values, then rebuild each piece with classes and the tokens in `src/styles/tokens.css`. The site's content security policy forbids inline `style` attributes, so never copy them over.

| File | Board | What it shows |
|---|---|---|
| `Main.dc.html` | Home, desktop | The whole v0 home page. It also feeds the phone boards through a `slice` prop (`a`, `b`, `c`, `header`, `footer`) |
| `Mobile.dc.html`, `Mobile-2.dc.html`, `Mobile-3.dc.html` | Home, phone 1 to 3 | The same page at 390 px, in three slices |
| `Thanks.dc.html` | Confirmation | `/thanks/` |
| `NotFound.dc.html` | Not found | The 404 page |
| `Privacy.dc.html` | Privacy | `/privacy/` with a table of contents |
| `Foundations.dc.html` | System | Logo and colour roles |
| `Type.dc.html` | System | Type families, fluid scale and layout values |
| `Components.dc.html` | System | Buttons, fields, messages, cards, tags and devices |
| `canvas.json` | Index | Pages, board positions and sizes |

Text comes from `docs/copy/v0-home-copy.md`, not from these files. If the two differ, the copy file wins and the canvas gets fixed.
