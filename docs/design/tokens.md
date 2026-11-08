# Design tokens and component specs

Version 0.1, 8 November 2026. Written by `ui-designer` for `frontend-developer`. Private preview only: the name Normek is not cleared.

This is the single hand-off for how the site looks. Implement it in `src/styles/tokens.css` (section 2), `src/styles/global.css` and the components. Order of authority (`docs/design/claude-design.md`): the brand guide, then this file for names and values, then the canvas for layout and component states. Where the canvas breaks the guide, the guide wins and `docs/design/canvas-review-2026-11-08.md` lists the fix. Line numbers below cite `Main.dc.html` as it was before copy 2.1 (409 lines). To find an element in the current 452 line file, use its section: header 20 to 35, hero 39 to 91, problem 93 to 118, offers 122 to 228, process 230 to 287, scope 289 to 315, data 319 to 332, about 334 to 352, contact 354 to 390, footer 395 to 421.

Sources: the Claude Design canvas (`Main.dc.html` is the home page and, through its slice prop, the three phone boards, `Foundations.dc.html` is logo and colour), `brand/brand-guide.md` v0.1, `docs/plan/work-breakdown.md` section 8 and `docs/copy/v0-home-copy.md`. Line numbers are from `Main.dc.html` unless a file is named.

Three labels say where a value comes from:

- **Canvas**: the canvas fixes the value. Match it.
- **Proposed**: the canvas is silent or breaks a rule. This is my recommendation. Change it only with a reason.
- **Measured**: taken from the shipped font files or computed, not estimated.

Rules that apply to everything:

1. Components use tokens only. No raw hex, no raw font names, no pixel value that has a token.
2. One primary Signal fill per view.
3. Colour never carries meaning alone. Pair it with text, an icon or a shape.
4. Every target is at least 44 px high. Inline links inside a sentence are the one exception.
5. No motion (section 6).

## 1. Colour

### 1.1 Palette

The four fixed names are `color-ink`, `color-steel`, `color-paper` and `color-signal`. Steps keep the base hue and move lightness in OKLCH (brand guide section 2). Every `--color-*` variable also becomes a Tailwind utility, for example `bg-ink`, `text-steel-600`, `border-paper-300`.

| Token | Hex | Job |
|---|---|---|
| `color-ink` | `#0F1B2D` | Text on light, dark sections, the logo |
| `color-ink-800` | `#1B2739` | Surface on Ink |
| `color-ink-700` | `#293547` | Border on Ink |
| `color-steel` | `#6B7686` | Control borders, dimension lines. Not for small text (4.20:1 on Paper) |
| `color-steel-300` | `#969EA8` | Muted text on Ink |
| `color-steel-600` | `#586374` | Muted text on Paper |
| `color-steel-700` | `#414D5F` | Disabled text on paper-300 (proposed, 5.86:1) |
| `color-paper` | `#F4F5F2` | The page ground |
| `color-paper-200` | `#E8EAE9` | Disabled field fill (proposed). Muted text on it is 5.03:1 |
| `color-paper-300` | `#D3D6D8` | Hairlines |
| `color-white` | `#FFFFFF` | Surfaces on Paper only |
| `color-signal` | `#FF5A1F` | Fills and shapes. Never text on Paper |
| `color-signal-50` | `#FFF0EB` | Reserved, not used in v0 |
| `color-signal-100` | `#FFDED4` | Text selection and the draft banner |
| `color-signal-400` | `#FE835E` | Hover fill, and link and focus on Ink |
| `color-signal-700` | `#B43601` | Link and focus on Paper |
| `color-signal-800` | `#8A2700` | Text on signal-100 (7.02:1) |

### 1.2 Semantic aliases, light and dark

Components use these, not the palette. **Light** is the default. **Dark** applies to any element with the class `theme-ink`, which swaps the variables, so an Ink band needs no other code. There is no automatic dark mode in v0. Ratios are WCAG 2.x, rounded down. I recomputed every one and they match the brand guide.

| Alias | Light | Dark | On bg, light / dark | On surface, light / dark | Job |
|---|---|---|---|---|---|
| `bg` | paper | ink | | | Page ground |
| `surface` | white | ink-800 | | | Cards, fields, status messages |
| `border` | paper-300 | ink-700 | 1.33 / 1.39 | | Hairlines. Decorative, never the only cue |
| `border-strong` | steel | steel | 4.20 / 3.75 | 4.60 / 3.26 | Control borders, dashed tags |
| `fg` | ink | paper | 15.79 / 15.79 | 17.28 / 13.74 | Text |
| `muted` | steel-600 | steel-300 | 5.55 / 6.38 | 6.08 / 5.55 | Secondary text, eyebrows, captions |
| `link` | signal-700 | signal-400 | 5.53 / 7.09 | 6.05 / 6.17 | Text links |
| `accent` | signal | signal | Ink text on it 5.54 | | Fills and shapes only |
| `accent-hover` | signal-400 | signal-400 | Ink text on it 7.09 | | Hover and pressed fill of the primary button |
| `on-accent` | ink | ink | | | Text on Signal fills, always |
| `focus` | signal-700 | signal-400 | 5.53 / 7.09 | 6.05 / 6.17 | Focus ring |
| `success` | `#067239` | `#30B264` | 5.52 / 6.31 | 6.04 / 5.50 | Status |
| `warning` | `#805C05` | `#C9940D` | 5.56 / 6.35 | 6.08 / 5.53 | Status |
| `error` | `#B13544` | `#F6747C` | 5.54 / 6.34 | 6.06 / 5.52 | Status and field errors |

Utility names follow the variables: `bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `text-link`, `bg-accent`, `hover:bg-accent-hover`, `text-on-accent`, `border-border`, `border-border-strong`, `outline-focus`, `text-error`.

### 1.3 Rules

- Signal may be a fill or a shape (logo pads, the primary button, accent bars) and anything on Ink. It may not be text on Paper or white (2.84:1 and 3.11:1, use `link`), white text on Signal (3.11:1, use `on-accent`), a thin mark that carries meaning on Paper, or the only thing that tells two states apart.
- The one Signal callout in the hero drawing is allowed (brand guide section 5). It is not a primary fill.
- Steel is for borders and dimension lines. Small text uses `muted`.
- `border` is decorative at 1.33:1. Anything that identifies a control uses `border-strong` (3:1 or better).
- Status messages sit on `surface` with a left rule, an icon and text. Never colour alone.

## 2. `src/styles/tokens.css`

Paste this over the current file. It keeps every name and value from the current file except where section 7 lists a change. The `@font-face` rules are in section 3 and go in `global.css`.

```css
/*
 * Design tokens. This is the one place where values live.
 * Spec and reasoning: docs/design/tokens.md (ui-designer, 2026-11-08).
 * Values: brand/brand-guide.md v0.1 sections 2 and 3, and the Claude Design canvas.
 * Components use tokens only, never raw hex values.
 * Tailwind v4 turns every @theme variable into a CSS variable, so plain CSS can use var(--color-ink) too.
 */

/* Remove Tailwind's default scales, so only the tokens below exist as utilities. */
@theme {
  --color-*: initial;
  --font-*: initial;
  --font-weight-*: initial;
  --text-*: initial;
  --tracking-*: initial;
  --leading-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --breakpoint-*: initial;
  --container-*: initial;
  --ease-*: initial;
  --animate-*: initial;
}

/* `static` emits every variable, also those only used from plain CSS. */
@theme static {
  /* ---------- Colour: palette ---------- */
  --color-ink: #0f1b2d;
  --color-ink-800: #1b2739;
  --color-ink-700: #293547;

  --color-steel: #6b7686;
  --color-steel-300: #969ea8;
  --color-steel-600: #586374;
  --color-steel-700: #414d5f;

  --color-paper: #f4f5f2;
  --color-paper-200: #e8eae9;
  --color-paper-300: #d3d6d8;
  --color-white: #ffffff;

  --color-signal: #ff5a1f;
  --color-signal-50: #fff0eb;
  --color-signal-100: #ffded4;
  --color-signal-400: #fe835e;
  --color-signal-700: #b43601;
  --color-signal-800: #8a2700;

  /* ---------- Colour: semantic aliases (light, the default) ---------- */
  --color-bg: var(--color-paper);
  --color-surface: var(--color-white);
  --color-border: var(--color-paper-300); /* decorative hairline, 1.33:1 */
  --color-border-strong: var(--color-steel); /* control borders, 4.20:1 on Paper */
  --color-fg: var(--color-ink); /* 15.79:1 on Paper */
  --color-muted: var(--color-steel-600); /* 5.55:1 on Paper */
  --color-link: var(--color-signal-700); /* 5.53:1 on Paper */
  --color-accent: var(--color-signal); /* fills and shapes only */
  --color-accent-hover: var(--color-signal-400);
  --color-on-accent: var(--color-ink); /* always Ink, 5.54:1 on Signal */
  --color-focus: var(--color-signal-700); /* focus ring, 5.53:1 on Paper */
  --color-success: #067239;
  --color-warning: #805c05;
  --color-error: #b13544;

  /* ---------- Typography ---------- */
  --font-display: "Barlow Semi Condensed", "Arial Narrow", sans-serif;
  --font-sans: "IBM Plex Sans", system-ui, "Segoe UI", Roboto, Arial, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace;

  --font-weight-normal: 400;
  --font-weight-semibold: 600;

  /* Eyebrow labels: Mono, sm, uppercase, 0.06em tracking. */
  --tracking-eyebrow: 0.06em;

  /* Fluid scale for 390 to 1280 px viewports. */
  --text-sm: clamp(0.875rem, 0.8476rem + 0.1124vw, 0.9375rem);
  --text-sm--line-height: 1.5;
  --text-base: clamp(1rem, 0.9452rem + 0.2247vw, 1.125rem);
  --text-base--line-height: 1.6;
  --text-lg: clamp(1.125rem, 1.0428rem + 0.3371vw, 1.3125rem);
  --text-lg--line-height: 1.5;
  --text-xl: clamp(1.375rem, 1.2381rem + 0.5618vw, 1.6875rem);
  --text-xl--line-height: 1.3;
  --text-2xl: clamp(1.6875rem, 1.441rem + 1.0112vw, 2.25rem);
  --text-2xl--line-height: 1.2;
  --text-3xl: clamp(2.0625rem, 1.6517rem + 1.6854vw, 3rem);
  --text-3xl--line-height: 1.1;
  --text-4xl: clamp(2.5rem, 1.8427rem + 2.6966vw, 4rem);
  --text-4xl--line-height: 1.05;

  /* ---------- Space: 4 px base ---------- */
  /* p-1 is 4 px, p-4 is 16 px, p-6 is 24 px, p-7 is 28 px, p-12 is 48 px. */
  --spacing: 0.25rem;
  /* Named fluid values, used as px-gutter, py-section, gap-columns and so on. */
  --spacing-gutter: clamp(20px, 4vw, 48px);
  --spacing-section: clamp(56px, 8vw, 96px);
  --spacing-hero-top: clamp(48px, 7vw, 96px);
  --spacing-hero-bottom: clamp(56px, 8vw, 112px);
  --spacing-panel: clamp(20px, 3vw, 36px); /* hero panel and form card padding */
  --spacing-columns: clamp(32px, 5vw, 72px); /* gap between hero, process and about columns */
  --spacing-columns-tight: clamp(32px, 4vw, 56px); /* gap between scope and contact columns */
  --spacing-footer: clamp(40px, 6vw, 64px); /* footer padding above and below */

  /* ---------- Layout widths ---------- */
  --container-page: 75rem; /* 1200 px including the gutters, so content is 1104 px at the cap */
  --container-narrow: 47.5rem; /* the confirmation and not found pages, 760 px */
  --container-measure: 28em; /* 65 characters of Plex Sans, measured on the page copy. Use max-w-measure. Tailwind's max-w-prose is a fixed 65ch and ignores the theme */

  /* ---------- Radius and shadow ---------- */
  --radius-sm: 2px; /* buttons and inputs. Cards and panels are square */
  --shadow-hairline: inset 0 0 0 1px var(--color-border); /* the only shadow */

  /* ---------- Breakpoints: the three design widths ---------- */
  --breakpoint-sm: 390px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1280px;

  /* ---------- Plain variables for component CSS ---------- */
  --target-min: 44px; /* header button, nav links, standalone links, checkbox row */
  --target-input: 48px;
  --target-primary: 52px;
  --focus-width: 3px;
  --focus-offset: 3px;
  --chamfer: 28px; /* route 01 device, 45 degrees */
  --chamfer-inner: calc(var(--chamfer) - 0.59px); /* keeps a 1 px hairline along the cut */
}

/*
 * Ink sections. The dark column of section 1.2 applies to any element with this class.
 * The three status values live here as raw hex because this file is the one place raw values may live.
 */
@layer components {
  .theme-ink {
    color-scheme: dark;
    --color-bg: var(--color-ink);
    --color-surface: var(--color-ink-800);
    --color-border: var(--color-ink-700);
    --color-fg: var(--color-paper);
    --color-muted: var(--color-steel-300);
    --color-link: var(--color-signal-400);
    --color-focus: var(--color-signal-400);
    --color-success: #30b264;
    --color-warning: #c9940d;
    --color-error: #f6747c;
    background-color: var(--color-bg);
    color: var(--color-fg);
  }
}
```

## 3. Type

Plex Sans and Plex Mono were drawn as a pair and sit quietly beside the condensed headings. All three are SIL Open Font License 1.1, self-hosted in `public/fonts/` with each `OFL.txt`. Never load them from a third-party CDN. The files and licence texts are in place in `public/fonts/`, and `src/styles/fonts.css` holds the rules and matches this section.

| Token | Family | File | Size | Weights | Use |
|---|---|---|---|---|---|
| `font-display` | Barlow Semi Condensed | `barlow-semi-condensed-latin-600-normal.woff2` | 22,984 B | 600 | Headings, large numerals. Same face as the lockup |
| `font-sans` | IBM Plex Sans | `ibm-plex-sans-latin-wght-normal.woff2` | 45,712 B | 400 and 600 | Body, navigation, buttons, forms |
| `font-mono` | IBM Plex Mono | `ibm-plex-mono-latin-400-normal.woff2` | 14,708 B | 400 | Eyebrows, index numerals, captions, tags, drawing labels |

Total 83,404 B, latin subset. Measured from the files: the Plex Sans file has a `wght` axis from 100 to 700. æ ø å ° × ’ “ and the en dash are in all three. ≤ ≥ and Ω are in none, so write "up to" and "at least".

```css
/* Reference only. This is already in src/styles/fonts.css, which adds unicode-range */
@font-face {
  font-family: "Barlow Semi Condensed";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/fonts/barlow-semi-condensed-latin-600-normal.woff2") format("woff2");
}
@font-face {
  font-family: "IBM Plex Sans";
  font-style: normal;
  font-weight: 100 700;
  font-display: swap;
  src: url("/fonts/ibm-plex-sans-latin-wght-normal.woff2") format("woff2");
}
@font-face {
  font-family: "IBM Plex Mono";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/ibm-plex-mono-latin-400-normal.woff2") format("woff2");
}
```

Preload only the display and text files, with `type="font/woff2"` and `crossorigin`. The mono face is not preloaded.

### 3.1 Fluid scale

For 390 to 1280 px viewports. The clamp values are the brand guide's. The pixel columns are computed.

| Token | Value | At 390 / 768 / 1280 px | Line | Use |
|---|---|---|---|---|
| `text-sm` | `clamp(0.875rem, 0.8476rem + 0.1124vw, 0.9375rem)` | 14.0 / 14.4 / 15.0 | 1.5 | Captions, labels, nav, eyebrows |
| `text-base` | `clamp(1rem, 0.9452rem + 0.2247vw, 1.125rem)` | 16.0 / 16.8 / 18.0 | 1.6 | Body |
| `text-lg` | `clamp(1.125rem, 1.0428rem + 0.3371vw, 1.3125rem)` | 18.0 / 19.3 / 21.0 | 1.5 | Lead |
| `text-xl` | `clamp(1.375rem, 1.2381rem + 0.5618vw, 1.6875rem)` | 22.0 / 24.1 / 27.0 | 1.3 | h3 |
| `text-2xl` | `clamp(1.6875rem, 1.441rem + 1.0112vw, 2.25rem)` | 27.0 / 30.8 / 36.0 | 1.2 | h2 |
| `text-3xl` | `clamp(2.0625rem, 1.6517rem + 1.6854vw, 3rem)` | 33.0 / 39.4 / 48.0 | 1.1 | h1 on inner pages |
| `text-4xl` | `clamp(2.5rem, 1.8427rem + 2.6966vw, 4rem)` | 40.0 / 50.2 / 64.0 | 1.05 | Hero h1 |

### 3.2 Roles

| Role | Family | Size | Weight | Colour | Canvas line |
|---|---|---|---|---|---|
| Hero h1 | display | 4xl | 600 | `fg` | 44 |
| Section h2 | display | 2xl | 600 | `fg` | 95 |
| Card and row h3 | display | xl | 600 | `fg` | 99 |
| Lead | sans | lg | 400 | `muted` | 45 |
| Body | sans | base | 400 | `fg`, and `muted` inside cards | 18, 100 |
| Label, helper, nav, footer | sans | sm | 600 for labels, 400 elsewhere | `fg` or `muted` | 319, 332 |
| Eyebrow | mono | sm | 400 | `muted` | 43 |
| Index numeral | mono | sm | 400 | `muted` | 98, 201 |
| Figure caption, byline | mono | sm | 400 | `muted` | 50, 87 |
| Button label | sans | base, and sm in the header | 600 | `on-accent` or `fg` | 47, 31 |
| Placeholder tag | mono | sm | 400 | inherits | 125 |

### 3.3 Rules

- Weights are 400 and 600 only. `strong` and `b` are 600, never the browser's 700. No italics. Set `font-synthesis: none` on `body` so a missing style is never faked.
- Eyebrows: Mono, `text-sm`, uppercase, `letter-spacing: var(--tracking-eyebrow)`, `muted`. Add `text-wrap: balance` (proposed), because the hero eyebrow is 351 px wide in a 350 px column at 390 and would leave "TEAMS" alone on a second line.
- Headings: sentence case, `text-wrap: balance`, `font-variant-numeric: tabular-nums` where a heading holds figures. Barlow digits are proportional by default (313 to 522 units wide) and the file has the `tnum` feature (507 units for every digit), so the property works. Plex Sans digits are already tabular (600 units each) and Plex Mono is 600 units per character, so they need nothing.
- Paragraphs: `text-wrap: pretty` (proposed), which avoids one-word last lines such as "engineer." in the hero lead at 390.
- **Measure**: running text is at most 28em wide (`max-w-measure`, from `--container-measure`). Never use `max-w-prose`: Tailwind fixes it at 65ch and ignores the theme. Measured on the page copy in Plex Sans, 28em keeps the longest wrapped line at 65 characters (mean full line 58). The old `65ch` is 39em because Plex Sans zero is 0.6em wide, and it fits up to 86 characters.
- Units take a space (2 mm, 85 °C), ranges read "2 to 4 weeks", dates read 8 November 2026.
- Fallback metrics are still unmeasured (brand guide, open items). Generate metric-matched fallback faces with Capsize or Fontaine once the files are in `public/fonts/`, and keep cumulative layout shift under 0.05.

## 4. Layout

### 4.1 Tokens as `Main.dc.html` uses them

| Token | Value | Where in the canvas |
|---|---|---|
| Container | `max-w-page`, 1200 px with the gutter inside it, centred | 22, 41, 93 and every section |
| Narrow page container | `max-w-narrow`, 760 px (47.5rem), centred, same gutter | `Thanks` 22, `NotFound` 22 |
| Gutter | `px-gutter`, `clamp(20px, 4vw, 48px)` (20 / 30.7 / 48 at 390 / 768 / 1280) | every container |
| Section padding | `py-section`, `clamp(56px, 8vw, 96px)` | 92, 121, 186, 245, 273, 292, 311 |
| Hero padding | top `clamp(48px, 7vw, 96px)`, bottom `clamp(56px, 8vw, 112px)` | 40 |
| Column gap, hero, process, about | `gap-columns`, `clamp(32px, 5vw, 72px)` | 41, 187, 293 |
| Column gap, scope, contact | `gap-columns-tight`, `clamp(32px, 4vw, 56px)` | 249, 315 |
| Card gap | 24 px, `gap-6` | 96, 277 |
| Card padding | 28 px, `p-7`. Inner gap 12 px | 97 |
| Hero panel and form card padding | `clamp(20px, 3vw, 36px)` | 53, 316 |
| Radius | 2 px on buttons and inputs, 0 on cards, panels and tags | 31, 47, 320 |
| Hairline | 1 px `border` | cards, section tops, header bottom |
| Control border | 1 px `border-strong` | 320, tags |
| Rule | 2 px `fg`: secondary button, offer table top, scope headings | 31, 127, 251 |
| Status rule | 4 px left border (Foundations lines 288, 296) | status messages |
| Chamfer | 28 px, top right and bottom left, 45 degrees | 53, 295 |
| Touch targets | primary button 52, header button 44, input 48, anything else 44 | 47, 31, 320 |
| Elevation | none. The only shadow is the 1 px inset hairline | 53 |

Vertical rhythm is on the 4 px base. Steps in use: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 96, 112. The canvas also has 6, 10 and 14 px. Use 8, 8 (or 12) and 16 instead.

Card grids (problem, data) use CSS grid, not wrapping flex: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr))` with a 24 px gap (proposed). Wrapping flex stretches a lone third card to the full width at 768.

### 4.2 Widths

Breakpoints are the three design widths. Tailwind `sm`, `md` and `lg` are 390, 768 and 1280 and nothing else is defined.

| Width | Header | Hero | Cards | Content width |
|---|---|---|---|---|
| 390 | Lockup 28 px, outline button, no links | One column, text then drawing | One column | 350 |
| 768 | Lockup 32 px, outline button, no links | One column | Two per row, third card half width | 706.6 |
| 1280 | Lockup 32 px, four links, outline button | Two columns | Three per row | 1104 |

The desktop board is 1440 wide, so the container caps at 1200 and the margins are 120. Every width must have no horizontal scroll and a visible focus ring. The header links start at 1280 because the full header needs 765 px of content (measured), which only fits from 832 px.

## 5. Components

CSS below uses variables so it can be mapped to utilities freely. Comments mark each value as canvas or proposed. State names: default, hover, focus (`:focus-visible`), pressed (`:active`).

### 5.1 Focus ring

One ring for everything. Not drawn in the canvas. This matches `global.css` today.

```css
:focus-visible {
  outline: var(--focus-width) solid var(--color-focus); /* proposed */
  outline-offset: var(--focus-offset); /* proposed */
}
```

| Ring on | Contrast |
|---|---|
| Paper / white / paper-200 | 5.53 / 6.05 / 5.00 |
| Ink / ink-800 (token swaps to signal-400) | 7.09 / 6.17 |

Never `outline: none`. The 3 px gap keeps the ring off a Signal fill. Focusable content stays at least 8 px inside a chamfer frame, because `clip-path` would cut the ring. The skip link is the first focusable element, hidden until focus, Ink fill with Paper text (exists in `global.css`).

### 5.2 Primary button

Canvas lines 47 and 335. One per view. Label is a verb phrase: "Request a feasibility review".

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--target-primary); /* canvas 52 */
  padding: 0 28px; /* canvas */
  border: 0; /* canvas */
  border-radius: var(--radius-sm); /* canvas 2 */
  font: inherit; /* canvas, so the label is base size */
  font-weight: 600; /* canvas */
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}
.btn-primary { background: var(--color-accent); color: var(--color-on-accent); } /* canvas */
.btn-primary:hover { background: var(--color-accent-hover); } /* proposed */
.btn-primary:active {
  background: var(--color-accent-hover);
  box-shadow: inset 0 0 0 2px var(--color-on-accent); /* proposed */
}
```

| State | Fill | Text | Notes |
|---|---|---|---|
| Default | `accent` | `on-accent` 5.54:1 | |
| Hover | `accent-hover` | `on-accent` 7.09:1 | Instant, no transition |
| Focus | as default | | Ring, section 5.1 |
| Pressed | `accent-hover` | `on-accent` | 2 px inset line in `on-accent` |
| Sending | `paper-200` | `muted` 5.03:1 | Canvas (`Components` 52). Label "Sending...", `aria-disabled="true"`, `aria-busy="true"`, `cursor: progress`, no hover change. Never the `disabled` attribute, so focus is kept |
| Disabled (not in v0) | `paper-200` | `muted` 5.03:1 | As sending, with `cursor: not-allowed` |
| On Ink | as default | | Ring is signal-400 |

### 5.3 Secondary button

Canvas lines 31, 181 and 266. Same box as the primary, with a 2 px border.

```css
.btn-secondary {
  background: transparent; /* canvas */
  color: var(--color-fg); /* canvas */
  border: 2px solid var(--color-fg); /* canvas */
}
.btn-secondary:hover { background: var(--color-fg); color: var(--color-bg); } /* proposed, 15.79:1 */
.btn-secondary:active { box-shadow: inset 0 0 0 2px var(--color-bg); } /* proposed, on top of hover */
.btn-sm { min-height: var(--target-min); padding: 0 20px; font-size: var(--text-sm); } /* canvas 44, 20, 15 px */
```

| State | Fill | Text | Border |
|---|---|---|---|
| Default | none | `fg` | 2 px `fg` |
| Hover | `fg` | `bg` | 2 px `fg` |
| Focus | as default | | Ring |
| Pressed | `fg` | `bg` | 2 px inset line in `bg` |
| Disabled | none | `muted` | 2 px `border-strong` |

The header button is `btn-secondary btn-sm`, label "Request a review". Do not use the primary style in the header, or the first screen carries two Signal fills.

### 5.4 Text link and nav link

Canvas lines 48, 101 and 288.

```css
.link {
  color: var(--color-link); /* canvas */
  font-weight: 400; /* canvas has 500, see section 8 */
  text-decoration: underline; /* canvas */
  text-underline-offset: 3px; /* canvas */
}
.link:hover { text-decoration-thickness: 2px; } /* proposed, matches global.css */
.link-standalone { display: inline-flex; align-items: center; min-height: var(--target-min); } /* proposed */
.nav-link { color: var(--color-fg); font-size: var(--text-sm); text-decoration: none; min-height: var(--target-min); display: inline-flex; align-items: center; }
.nav-link:hover { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 6px; } /* proposed */
```

| State | Spec |
|---|---|
| Default | `link` colour with an underline. The underline is always on |
| Hover | Underline 2 px |
| Focus | Ring |
| Pressed | As hover |
| Visited | No change |
| On Ink | `link` swaps to signal-400 (7.09:1) |

Standalone links (their own line or flex item) get the 44 px target. A link inside a sentence keeps its line box. There is no current-section state in v0, because it would need script.

### 5.5 Text input, textarea and label

Canvas lines 319 to 333.

```css
.field-label { display: block; margin-bottom: 8px; /* canvas 6, off the 4 px base */ font-size: var(--text-sm); font-weight: 600; }
.field-help { margin: 0 0 8px; font-size: var(--text-sm); color: var(--color-muted); } /* canvas */
.field {
  display: block;
  width: 100%;
  box-sizing: border-box;
  min-height: var(--target-input); /* canvas 48 */
  padding: 0 16px; /* canvas 14, off the 4 px base */
  border: 1px solid var(--color-border-strong); /* canvas, 4.60:1 on white */
  border-radius: var(--radius-sm); /* canvas */
  background: var(--color-surface); /* canvas */
  color: var(--color-fg); /* canvas */
  font: inherit; /* canvas, 16 px or more so iOS does not zoom */
}
textarea.field { min-height: 140px; padding: 12px 16px; resize: vertical; } /* canvas 140 and 12 px */
.field:hover { border-color: var(--color-fg); } /* proposed */
.field:focus-visible { border-color: var(--color-fg); } /* proposed, plus the ring */
.field[aria-invalid="true"] {
  border-color: var(--color-error); /* canvas draws a 2 px error border (Components 152) */
  box-shadow: inset 0 0 0 1px var(--color-error); /* 2 px in total, no layout shift */
}
.field:disabled, .field[readonly] {
  background: var(--color-paper-200); /* proposed */
  border-color: var(--color-border-strong);
  color: var(--color-muted);
  cursor: not-allowed;
}
```

| State | Spec |
|---|---|
| Default | 1 px `border-strong`, `surface` fill |
| Hover | Border `fg` |
| Focus | Border `fg` and the ring |
| Filled | No change |
| Invalid | Red border, plus a field error (5.8) so colour is never alone |
| Disabled or read only | `paper-200` fill, border 3.81:1, text 5.03:1 |
| On Ink | Fill ink-800, border steel 3.26:1 |

Label above the control, always visible. No placeholder text and no asterisks, because the line "All fields are required." covers it. Helper text sits between the label and the control and is linked with `aria-describedby`. `autocomplete` is `name`, `email` and `organization`. `maxlength` is 100, 254, 120 and 2,000. The submit control is a `button type="submit"` inside a real `form` with `novalidate`, so the messages are ours.

### 5.6 Checkbox

Not in the v0 form (the optional call tick box waits for a wider function). Native control, so forced colors and zoom just work.

```css
.check { display: flex; align-items: center; gap: 12px; min-height: var(--target-min); } /* proposed */
.check input { width: 24px; height: 24px; margin: 0; accent-color: var(--color-fg); } /* proposed */
```

| State | Spec |
|---|---|
| Unchecked | Native box, `surface` ground |
| Checked | `fg` box with a `bg` tick (inverts on Ink) |
| Hover | None. The whole row is the click target |
| Focus | Ring on the input |
| Error | Field error under the row, linked with `aria-describedby` |
| Disabled | `muted` label, `cursor: not-allowed` |

### 5.7 Form error summary

Not in the canvas. Text from the copy doc. It is an error status message (5.9) holding a heading and a list of links. It sits at the top of the form card, above "All fields are required.".

```html
<div class="status status-error" tabindex="-1" aria-labelledby="err-title">
  <!-- error icon -->
  <div>
    <p id="err-title" class="status-title">Fix these fields to send your request:</p>
    <ul>
      <li><a class="link" href="#f-email">The email address needs an @ sign.</a></li>
    </ul>
  </div>
</div>
```

Validate on submit, not on blur, so nobody is scolded mid-typing. After a failed submit, move focus to the summary. It has `tabindex="-1"` and no `role="alert"`, because moving focus already announces it. Each link goes to its field. Remove the summary when the form is fixed and sent.

### 5.8 Field error

```css
.field-error { display: flex; gap: 8px; align-items: flex-start; margin-top: 8px; font-size: var(--text-sm); color: var(--color-error); } /* canvas, Components 153 */
.field-error svg { flex: none; width: 20px; height: 20px; margin-top: 2px; } /* canvas */
```

An icon (20 px, the error icon of 5.9) then the message from the copy doc, directly under the control. The control gets `aria-invalid="true"`, and its `aria-describedby` lists the helper id and the error id. Error text on white is 6.06:1.

### 5.9 Status messages

`Components` 167 to 189 and `Thanks` 24 draw them, so the canvas values stand. Role: success `role="status"`, failure `role="alert"`, warning `role="status"`.

```css
.status {
  --status: var(--color-fg);
  display: flex; gap: 12px; align-items: flex-start; /* canvas gap is 10, off the 4 px base */
  padding: 24px 28px; /* canvas */
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--status); /* canvas */
  color: var(--color-fg);
}
.status svg { flex: none; width: 20px; height: 20px; margin-top: 3px; color: var(--status); } /* canvas */
.status-title { margin: 0; font-weight: 600; }
.status-success { --status: var(--color-success); }
.status-warning { --status: var(--color-warning); }
.status-error { --status: var(--color-error); }
```

The icons are the canvas's: 20 px, 2 px stroke, in the status colour, `aria-hidden`. Success and error are a circle with a tick or a cross, and warning is a triangle with a bar and a dot, so the glyph differs as well as the colour.

```html
<!-- success: circle with a tick -->
<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8"/><path d="M6 10.5L9 13.5L14 7.5"/></svg>
<!-- warning: triangle with a bar and a dot -->
<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 2.5L18 16.5H2Z"/><path d="M10 8V11.5"/><circle cx="10" cy="14" r="1.1" fill="currentColor" stroke="none"/></svg>
<!-- error: circle with a cross -->
<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8"/><path d="M7 7L13 13M13 7L7 13"/></svg>
```

| Status | Text (from the copy doc) | Rule and icon | Behaviour |
|---|---|---|---|
| Success | "Request received. This is your confirmation. I reply from daniel@normek.dk within [1 working day, TO CONFIRM]." The lead-in "Request received." is `success` at weight 600 | success 6.04:1 | Replaces the form in the same card, focus moves to it |
| Send failed | "Your request was not sent. Your text is still here. Try again or email daniel@normek.dk." | error 6.06:1 | Above the button, the text is kept, the button is active again |
| Person check failed | "The check could not confirm you are a person. Try again or email daniel@normek.dk." | warning 6.08:1 | As send failed. Warning because the visitor can simply try again |
| Validation | The error summary, 5.7 | error | Focus moves to it |

### 5.10 Form states in order

| Step | What shows |
|---|---|
| 1 Default | Four empty fields, "All fields are required.", primary button |
| 2 Focus | Ring on the focused control, border turns `fg` |
| 3 Failed validation | Error summary at the top, field errors, `aria-invalid`, focus on the summary |
| 4 Sending | Button reads "Sending...", `aria-busy` on the form, fields unchanged |
| 5 Success | Success message replaces the form |
| 6 Failure | Failure message above the button, text kept |

The canvas draws step 1 only. Draw the others from this table.

### 5.11 Card

Canvas lines 97 to 102 (light) and 278 (on Ink). Static, so there is no hover state. Only the link inside is interactive.

```css
.card {
  display: flex; flex-direction: column; gap: 12px; /* canvas */
  padding: 28px; /* canvas */
  background: var(--color-surface); /* canvas */
  border: 1px solid var(--color-border); /* canvas, becomes ink-700 on Ink */
}
```

Index numeral (mono, `text-sm`, `muted`), h3 (`text-xl`), body in `muted`, then a standalone link pushed to the bottom with `margin-top: auto`. The link text is "Tell me about this" and its `aria-label` starts with that same text, then the card title. On Ink the card text is `muted` (steel-300 on ink-800, 5.55:1) and the strong lead-in is `fg`. A card on Ink carries its meaning in its content, not in its edge (the border is decorative).

### 5.12 Placeholder tag for `[TO CONFIRM]`

Canvas line 125. Used for every missing fact, and for `[TARGET]` markers. `scripts/check-dist.mjs` fails a launch build while one exists.

```css
.tbc {
  border: 1px dashed var(--color-border-strong); /* canvas, steel */
  padding: 0 4px; /* canvas 6, off the 4 px base */
  font-family: var(--font-mono); /* canvas */
  font-size: var(--text-sm); /* canvas 0.875em, which falls to 12.25 px in small text */
  box-decoration-break: clone;
}
.theme-ink .tbc { border-color: var(--color-muted); } /* canvas steel-300 */
```

It is inline and may wrap, so the long tags fit a 350 px column. It is plain text, so screen readers read it. Never smaller than 14 px.

### 5.13 Chamfer frame

Route 01 device. For image frames and one hero panel, never for buttons or inputs. The page has two: the hero drawing (line 53) and the founder photo (line 295). The canvas clip-path is exact. The hairline needs a second layer, because an inset shadow stops at the cut (proposed fix):

```css
.frame {
  padding: 1px; /* proposed: draws the hairline */
  background: var(--color-border);
  clip-path: polygon(0 0, calc(100% - var(--chamfer)) 0, 100% var(--chamfer), 100% 100%, var(--chamfer) 100%, 0 calc(100% - var(--chamfer))); /* canvas */
}
.frame-inner {
  padding: var(--spacing-panel); /* canvas, hero panel */
  background: var(--color-surface);
  clip-path: polygon(0 0, calc(100% - var(--chamfer-inner)) 0, 100% var(--chamfer-inner), 100% 100%, var(--chamfer-inner) 100%, 0 calc(100% - var(--chamfer-inner))); /* proposed */
}
```

The inner cut is 0.59 px smaller (2 minus the square root of 2), which makes the diagonal line the same 1 px as the straight edges. Chamfer size is 28 px, or 16 px for frames under 200 px wide (proposed, the brand guide allows 16 to 28). The photo frame is 4:5, at most 440 px wide. A real photo fills `frame-inner` with `object-fit: cover` and no padding, and needs alt text.

### 5.14 Process list with trace rings and jogs

Canvas lines 192 to 241. The trace device, **once per page**. A 2 px line with 45 degree jogs and pad rings whose hole is 40 percent of the diameter.

```css
.process { list-style: none; margin: 0; padding: 0; } /* add role="list" for VoiceOver */
.process > li { display: flex; gap: 20px; } /* canvas */
.rail { display: flex; flex-direction: column; align-items: center; width: 24px; flex: none; color: var(--color-fg); }
.rail .seg { flex: 1; width: 2px; min-height: 12px; background: currentColor; } /* canvas */
.step { margin: 0; padding-bottom: 32px; min-width: 0; } /* canvas */
.process > li:last-child .step { padding-bottom: 0; }
.num { display: block; margin-bottom: 4px; font-family: var(--font-mono); font-size: var(--text-sm); letter-spacing: var(--tracking-eyebrow); color: var(--color-muted); }
```

```html
<!-- ring: 24 px outer, hole 9.6 px (40 percent) -->
<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="7.2"/></svg>
<!-- jog: a 45 degree bend out and back -->
<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0V4L20 12V16L12 24" fill="none" stroke="currentColor" stroke-width="2"/></svg>
```

Order inside each step's rail: ring, segment, jog, segment. The last step has the ring only. The rail is `aria-hidden`. Mark the visible numeral `aria-hidden` too, because the `ol` already numbers the steps. Rings are Ink in the canvas. Signal rings are allowed as shapes but would put five Signal marks beside the one primary fill, so keep Ink. The list is static: no hover, focus or pressed state. The "Next steps" list in the contact section is a plain ordered list with mono numerals and no trace.

### 5.15 Drawing figure

Canvas lines 52 to 88: an exploded section view in a chamfer frame with a caption. Style every part from tokens (CSS classes in the inline SVG, never hex attributes).

| Drawing part | Token | Weight |
|---|---|---|
| Part outlines | `fg` | 2 px |
| Cut material hatch | `fg` | 1.5 px, 9 px pitch, 45 degrees |
| Board and component fills | `fg` and `surface` | |
| Dimension and assembly lines | `border-strong` | 1 px, assembly dashed 4 4 |
| The one callout | `accent` | 2 px line, dot of 4 px radius |

Text inside a scaled SVG shrinks with it. At 13 units the labels render at 7 px on a phone and 9 px at 1280, so put labels in an HTML legend in Plex Mono at `text-sm`, and keep only the drawing in the SVG. The figure keeps its `role="img"` and `aria-label`, and the caption "Illustration: a board in a two-part housing, section view. Not a customer project." stays (Mono, `text-sm`, `muted`).

### 5.16 Section heading, offer rows, scope heads

- Section heading (canvas 94, 95): eyebrow "01 / Problem" with a two digit number, margin 12 px below. Then h2 (`text-2xl`, balanced) with 40 px below, or 16 px when an intro paragraph follows. The hero eyebrow has 20 px below.
- Offer rows (canvas 127 to 179): a 2 px `fg` rule on top. Each row has 32 px padding above and below, a 1 px `border` under it, three columns at `flex: 1 1 280px`, `2 1 360px` and `1.4 1 280px`, gap `24px 48px`. Column labels ("Stage 1", "You get", "I need") are mono, `text-sm`, uppercase, `muted`, 8 px above the text. Cap each paragraph at the measure.
- Scope heads (canvas 251, 255): h3 with 12 px padding below, a 2 px `fg` bottom border and 16 px margin below.

### 5.17 Header

Canvas lines 21 to 34, with the script on lines 385 to 398. No sticky behaviour, no menu button in v0.

```css
.site-header { background: var(--color-bg); border-bottom: 1px solid var(--color-border); } /* canvas */
.site-header .bar {
  max-width: var(--container-page); margin: 0 auto;
  padding: 16px var(--spacing-gutter); /* canvas */
  display: flex; align-items: center; justify-content: space-between; gap: 24px; /* canvas */
}
.site-header nav { display: flex; align-items: center; gap: 32px; } /* canvas */
```

| Width | Logo | Links | Button |
|---|---|---|---|
| Below 768 | Lockup, 28 px symbol height | Hidden | `btn-secondary btn-sm` "Request a review" |
| 768 to 1279 | Lockup, 32 px | Hidden | Same |
| 1280 and up | Lockup, 32 px | Enclosure design, How I work, Data and files, About | Same |

The logo link is at least 44 px high. The skip link comes before the header. The canvas switches the links on at 760 and the logo size with them. That fails at 768, so split the two switches as above. On phone the lockup and the one outline button need 291 of the 350 px available (measured).

### 5.18 Footer

Canvas lines 353 to 377. An Ink band, so it has the class `theme-ink`.

- Padding `clamp(40px, 6vw, 64px)` top and bottom, container as elsewhere.
- Three wrapping flex columns (`flex: 1 1` with bases of 260, 260 and 200 px), gap `32px 56px`: reversed lockup (28 px below 768, 32 px above, brand guide section 1) with the tagline in `muted`, the company details each with a `.tbc`, then email, privacy and LinkedIn links.
- Bottom row: 32 px above, 24 px padding, 1 px `border` line. It holds the NDA and ownership note and the copyright, both `muted` at `text-sm`. Cap the note at the measure.
- Links use `link` (signal-400 on Ink, 7.09:1), underlined, as standalone links with the 44 px target. Do not use an 8 px gap to separate stacked links.
- Focus ring is signal-400.

## 6. Motion

None by default. No transitions, no animations, no smooth scrolling, no spinner (a sending state is text). Hover, pressed and focus changes are instant. If motion is ever added, it lives inside `@media (prefers-reduced-motion: no-preference)` and is short and purposeful. The `--ease-*` and `--animate-*` resets in section 2 remove the easing and animation utilities. Do not use `transition-*` either, because it still works without a theme value.

## 7. Differences from the files in `src/styles/` (read again on 8 November 2026 after the 13:05 update)

The developer has applied section 2. `tokens.css` now matches it, with one extra variable, `--spacing-footer`, which is accepted and added to section 2. `fonts.css` matches section 3. I did not edit any of these files. One error of mine is live in the build and needs a fix now.

| Where | Now | Should be |
|---|---|---|
| `--container-prose` and every `max-w-prose` class | Tailwind compiles `max-w-prose` to a fixed `65ch` (about 87 characters of Plex Sans) and ignores the 28em token. The first version of this file told you to use it, which was wrong. Only `.prose` honours the token. `max-w-measure-md` in `TextSection.astro` generates nothing, because that token is gone | Rename the token to `--container-measure`, which generates `max-w-measure`. Point `.prose` in `global.css` at `var(--container-measure)`. Replace every `max-w-prose` and `max-w-measure-md` with `max-w-measure` (seen in `HeroSection`, `OffersSection`, `ScopeSection`, `TextSection`, `Footer`, `404` and the work page). I compiled the renamed token with the repo's Tailwind and it generates the class |

## 8. Decisions

Recorded as decided by the manager on 8 November 2026.

1. **Keep three font families.** Barlow Semi Condensed 600, IBM Plex Sans and IBM Plex Mono total 83,404 B (83.4 KB latin subset), inside the 100 KB font budget with 16.6 KB to spare. The plan's "at most 2 families" line in `docs/plan/work-breakdown.md` section 6 should now read 3 families and 100 KB, which `web-architect` owns. **Fallback:** if a budget fails (fonts over 100 KB, page weight before interaction over 500 KB, largest contentful paint over 2.0 s, or layout shift over 0.05 from fonts), drop the mono face, which saves 14.7 KB. Eyebrows, numerals, captions and tags then use Plex Sans at `text-sm` with the same uppercase and tracking. Plex Sans digits are already tabular, so nothing else changes.
2. **Accept the eight added token names.** Each does a job the six fixed aliases cannot:
   - `surface`: a ground for cards and fields that differs from the page.
   - `border-strong`: control borders at 3:1 or better, where `border` is only 1.33:1.
   - `link`: link text, because `accent` fails as text on Paper.
   - `accent-hover`: the hover fill of the primary button.
   - `on-accent`: text on Signal, always Ink, because white fails.
   - `success`, `warning`, `error`: status colours with a light and a dark value.

### Recommended defaults I set

These follow from the measurements. Push back on any of them.

| Choice | Why |
|---|---|
| Prose measure 28em as `max-w-measure`, not 65ch | Plex Sans is wide, so 65ch gave lines of up to 86 characters against the guide's 65, and the canvas's 34 to 46em is worse at 71 to 103 |
| Header links from 1280, lockup size switch stays at 768 | The full header needs 765 px and overflows by 58 px at 768, and `Header.astro` already does this |
| Weights 400 and 600 only | The guide lists them. The canvas sets links and nav at 500, which the canvas review asks to change |
| Component states follow `Components.dc.html` where it draws them | The order of authority gives the canvas the states. I add pressed, disabled and the checkbox, which it does not draw |
| Chamfer hairline as a second layer | An inset shadow stops at the cut, so the diagonal edge had no line |
| Tag text at `text-sm`, padding 4 px | The `em` size fell to 12.25 px in small text and 6 px is off the 4 px base |
| No motion at all, including smooth scroll | The rule is none by default, and one long scroll to anchors gains nothing from easing |

### Open items

- Fallback face metrics are unmeasured. `frontend-developer` generates them with the font files now in `public/fonts/`.
- The canvas still lacks states and frames, see finding 11 in `docs/design/canvas-review-2026-11-08.md`. The manager republishes it.
