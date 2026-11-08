# Normek web brand guide

Version 0.1, 2026-11-08, for the private preview and the Claude Design canvas. The name Normek is not cleared, so nothing here is for print or public use. Contrast ratios use the WCAG 2.x formula, rounded down, and two separate programs agreed.

## 1. Logo on the web

**Default: route 01 Trace** (`brand/logo/1-trace/`). It says "enclosure plus electronics" at a glance and its tile survives 16 px (tested). Route 02 Section is the fallback if the name loses its N.

- **Lockup** (`lockup.svg`, `lockup-reversed.svg`): header, footer, link preview. Minimum 24 px symbol height (89 px wide).
- **Symbol** (`symbol.svg`, `symbol-reversed.svg`): where the lockup will not fit. Minimum 24 px high.
- **Icon tile** (`favicon.svg`): favicon, avatar, anything under 24 px. Holds at 16 px.

Tested at 1x: below 24 px the outline symbol turns grey and the pads blur. The tile loses its edge on Ink, so use the reversed symbol there.

- **Clear space:** a quarter of the symbol height on every side, at least 16 px in the header.
- **Header and footer:** lockup at 28 px symbol height below 768 px and 32 px above, reversed on an Ink footer. At 390 px the lockup plus four links did not fit, so links collapse.
- **Reversed:** on Ink and dark sections, standard on light ones. Never on Steel or Signal, where the pads vanish (Signal on Steel is 1.47:1). On photos use a solid Ink or Paper panel (a bare logo vanishes, tested).
- **In code:** swap the ink fills for `currentColor` and keep the pads `#FF5A1F`.
- **Never:** recolour, stretch, rotate, outline, shadow or animate.

**Swappable wordmark.** The name lives in `src/config/site.ts` only, and the logo component, titles, alt text and structured data read it. The symbol carries only the initial N. After a rename run `node brand/logo/source/build.mjs --name "New Name"`, copy the lockups into `src/assets/brand/` and redo rasters showing the name. Route 01 needs a name starting with N, otherwise use route 02. Tokens, type and voice stay.

## 2. Colour

Names follow `docs/plan/work-breakdown.md` section 8, plus eight additions: `surface`, `border-strong`, `link`, `accent-hover`, `on-accent`, `success`, `warning`, `error`.

**Derived steps** keep the base hue and step lightness in OKLCH (a perceptual colour space), solved against the contrast targets. Add one only when a component needs it.

- Ink `#0F1B2D`: ink-800 `#1B2739`, ink-700 `#293547`
- Steel `#6B7686`: steel-300 `#969EA8`, steel-600 `#586374`, steel-700 `#414D5F`
- Paper `#F4F5F2`: paper-200 `#E8EAE9`, paper-300 `#D3D6D8`, white `#FFFFFF`
- Signal `#FF5A1F`: signal-50 `#FFF0EB`, signal-100 `#FFDED4`, signal-400 `#FE835E`, signal-700 `#B43601`, signal-800 `#8A2700`

**Roles.** Targets are 4.5:1 for text and 3:1 for focus rings and control borders. Ratios read light / dark. Every pair passes. The dark column applies to any Ink section, so v0 can use Ink bands with the same tokens.

| Token | Light | Dark | On bg | On surface |
|---|---|---|---|---|
| `bg` | paper `#F4F5F2` | ink `#0F1B2D` | | |
| `surface` | white `#FFFFFF` | ink-800 `#1B2739` | | |
| `border` | paper-300 `#D3D6D8` | ink-700 `#293547` | 1.33 / 1.39 (decorative) | |
| `border-strong` | steel `#6B7686` | steel | 4.20 / 3.75 | 4.60 / 3.26 |
| `fg` | ink | paper | 15.79 / 15.79 | 17.28 / 13.74 |
| `muted` | steel-600 `#586374` | steel-300 `#969EA8` | 5.55 / 6.38 | 6.08 / 5.55 |
| `link` | signal-700 `#B43601` | signal-400 `#FE835E` | 5.53 / 7.09 | 6.05 / 6.17 |
| `accent` | signal `#FF5A1F` | signal | Ink text on it 5.54 | |
| `accent-hover` | signal-400 | signal-400 | Ink text on it 7.09 | |
| `focus` | signal-700 | signal-400 | 5.53 / 7.09 | 6.05 / 6.17 |
| `success` | `#067239` | `#30B264` | 5.52 / 6.31 | 6.04 / 5.50 |
| `warning` | `#805C05` | `#C9940D` | 5.56 / 6.35 | 6.08 / 5.53 |
| `error` | `#B13544` | `#F6747C` | 5.54 / 6.34 | 6.06 / 5.52 |

`on-accent` is always ink. Also: muted on paper-200 5.03, signal-800 on signal-100 7.02. Status messages sit on `surface` with a left rule and an icon, never colour alone.

**Where Signal may and may not be used.** Signal on Paper is 2.84:1 and on white 3.11:1, so it fails as text and is marginal as a graphic. White on Signal is 3.11:1. Steel on Paper is 4.20:1, so Steel is not for small text.

- May: fills and shapes (logo pads, accent bars, the primary button with Ink text), and anything on Ink (5.54:1).
- May not: text on Paper or white (use `link`), white text on Signal, thin marks that carry meaning on Paper, or a state or chart series told apart by Signal alone.
- Limit: one primary Signal fill per view.

## 3. Typography

Plex Sans and Mono were drawn as a pair and sit quietly beside the condensed headings. All three families are under the SIL Open Font License 1.1 (read from the packages), self-hosted in `public/fonts/` with each `OFL.txt`.

- **Display:** Barlow Semi Condensed 600 (`barlow-semi-condensed-latin-600-normal.woff2`, 23.0 KB). Headings, large numerals. Same face as the lockup.
- **Text:** IBM Plex Sans, weight axis (`ibm-plex-sans-latin-wght-normal.woff2`, 45.7 KB). Body, navigation, buttons, forms.
- **Specification:** IBM Plex Mono 400 (`ibm-plex-mono-latin-400-normal.woff2`, 14.7 KB). Measurements, part numbers, table figures, eyebrow labels.

Total 83.4 KB, latin subset, æ ø å in all three (checked). The plan says at most 2 families. If that stands, drop the mono and set specifications in Plex Sans, whose digits are already tabular (checked). The subset lacks ≤ ≥ Ω, so write "up to" instead.

Weights: display 600, text 400 and 600, mono 400. No italics (`font-synthesis: none`). Barlow digits are proportional, so use `tabular-nums`. Use `font-display: swap` and preload the display and text files.

```
Display: "Barlow Semi Condensed", "Arial Narrow", sans-serif
Text: "IBM Plex Sans", system-ui, "Segoe UI", Roboto, Arial, sans-serif
Mono: "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace
```

Fluid scale for 390 to 1280 px viewports (computed sizes verified in Chromium).

| Token | Value | px | Line | Use |
|---|---|---|---|---|
| `--text-sm` | `clamp(0.875rem, 0.8476rem + 0.1124vw, 0.9375rem)` | 14 to 15 | 1.5 | Captions, labels |
| `--text-base` | `clamp(1rem, 0.9452rem + 0.2247vw, 1.125rem)` | 16 to 18 | 1.6 | Body |
| `--text-lg` | `clamp(1.125rem, 1.0428rem + 0.3371vw, 1.3125rem)` | 18 to 21 | 1.5 | Lead |
| `--text-xl` | `clamp(1.375rem, 1.2381rem + 0.5618vw, 1.6875rem)` | 22 to 27 | 1.3 | h3 |
| `--text-2xl` | `clamp(1.6875rem, 1.441rem + 1.0112vw, 2.25rem)` | 27 to 36 | 1.2 | h2 |
| `--text-3xl` | `clamp(2.0625rem, 1.6517rem + 1.6854vw, 3rem)` | 33 to 48 | 1.1 | h1, inner pages |
| `--text-4xl` | `clamp(2.5rem, 1.8427rem + 2.6966vw, 4rem)` | 40 to 64 | 1.05 | Hero h1 |

Body lines: 65 characters at most. Headings: sentence case, `text-wrap: balance`. Eyebrows: Mono, `sm`, uppercase, 0.06em tracking.

## 4. Voice

Plain, precise, quiet. Engineer to engineer. Write "I" where Daniel acts and "Normek" for the company. Never "we" or "senior".

| Do | Do not |
|---|---|
| I design the enclosure around your board and check the fit on a prototype. | Seamless, cutting-edge solutions. |
| Designed for IP67 (ingress protection rating). | IP67 certified. |
| Production parts come from manufacturers I select with you. | Full in-house manufacturing. |
| Prototype in [X] weeks [TARGET]. | Lightning-fast turnaround. |
| The email address needs an @ sign. | Oops, something went wrong! |

- Specifics beat adjectives. Units take a space (2 mm, 85 °C), ranges read "2 to 4 weeks", dates read 8 November 2026.
- Spell out abbreviations on first use, for example design for manufacturing (DFM). Mark gaps `[TO CONFIRM]`.
- No "AI-powered" or similar claim until Daniel decides. Danish copy reads as natural Danish. Follow the `CLAUDE.md` writing rules.

## 5. Imagery and graphic devices

- Show real work: CAD views, prototype photos, drawings, only cleared. With none, use a drawing, not stock.
- One subject on a Paper or Ink ground, natural light, a scale cue such as a ruler. No filters, gradients, stock people, gears or bulbs.
- No AI-generated images in v0. They are not proof and may need labelling (ask `legal-compliance-advisor`).
- Drawings: 1.5 to 2 px Ink lines, 1 px Steel dimension lines, one Signal callout.

**Devices from route 01, all at 45 degrees.** Chamfer: cut the top right and bottom left corners of image frames and one hero panel by 16 to 28 px, never on buttons or inputs. Trace: a 2 px Ink line with 45 degree bends and logo-style pad rings (hole 40 percent of the diameter) for the process steps, once per page.

**Route 02 section hatch:** a drawing convention, not a site pattern. Use it in section drawings to mark cut material (1.5 px Ink lines at 45 degrees, 9 px pitch). As wallpaper it fights the text even at 12 percent (tested), and a second motif dilutes the one idea. If route 02 becomes the logo, promote it.

## 6. Favicon and social files

Source: `1-trace/favicon.svg`, shipped as `public/favicon.svg`. Square variants are a full-bleed Ink square with no transparency (iOS fills it with black, platforms crop to circles) and the mark inside a centred circle of 80 percent of the width (the maskable safe zone).

- `public/favicon.ico`: 16, 32 and 48 px. Link it with `sizes="32x32"` before the SVG so Chrome picks the SVG.
- `apple-touch-icon.png`: 180 × 180, square variant.
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`: web manifest, square variant.
- `og-default.png`: 1200 × 630, lockup on Ink, one preview for all platforms. Target under 300 KB.
- `avatar-400.png`: 400 × 400, square variant.

Set `theme-color` to Paper and Ink. Generate by script from the SVGs so a rename is one command. The private preview needs only the SVG and ICO.

## 7. Do and do not

**Do:** let Ink and Paper carry the page. Take every colour from the tokens. Use the tile under 24 px and a solid panel on photos. Show real work and mark gaps `[TO CONFIRM]`.

**Do not:** set Signal text on Paper or white, white text on Signal, or Steel for small text. Alter the logo. Use gradients, stock photos, AI imagery or hatch wallpaper. Hard-code the name outside `src/config/site.ts`.

## Open items

- **Decisions:** `web-architect` on 3 font families against the plan's 2 (83.4 KB), and `ui-designer` on the eight added token names.
- **Not done:** square icon variants are not drawn, and fallback metrics are not measured.
- **LinkedIn cover size:** [TO CONFIRM], sources disagree (1128 × 191, 1512 × 256, 4200 × 700).
- **Name:** not cleared. Ask a trademark professional before any print or announcement.
