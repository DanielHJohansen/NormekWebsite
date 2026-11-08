# Media manifest

Owner: `visual-media-producer`. Status on 8 November 2026: private preview. The name Normek is not cleared, so nothing here is for print, ads or a public announcement.

This file lists every picture, icon and drawing that ships with the site, or is a source for one, with where it came from and what it may be used for. A file with no row here does not go on the site. Add or change the row in the same change that adds or replaces the file.

## 1. Rules

1. **Real work only.** Show real CAD views, prototype photos and drawings of work that is cleared. With none, use a drawing, not a picture of something else (brand guide, section 5).
2. **No stock.** No stock photos, no stock people, no gears, no light bulbs.
3. **No AI-generated imagery in v0.** This means pictures made by an image model, such as photos, renders and mood images. They are not proof and may need labelling (`docs/legal/site-legal-requirements.md`, row 8). Every picture in sections 2.1 and 2.2 is vector artwork or a bitmap drawn from it, and none came from an image model. A vector drawing written as code is allowed only when it is listed here, labelled "Illustration" and never shown as a real prototype. Whether the hero drawing counts is question 1 in section 6.
4. **A scale cue in every picture of a physical part.** A ruler in a photo, a dimension line or the words "not to scale" in a drawing.
5. **Paper or Ink ground.** One subject on a Paper or Ink ground, natural light, no filters, no gradients. A drawing sits on white or Paper. Nothing goes on top of a photo without a solid panel.
6. **Say what it is.** A caption says photo, render, printed prototype, production part or illustration. A render is never presented as a photograph of a real prototype.
7. **Cleared or not at all.** No customer or past employer geometry, photos or drawings without written permission recorded in section 5.2. A person who can be recognised in a photo has to agree too.
8. **Clean before publishing.** Strip location data (EXIF) and compress. Export AVIF and WebP with a JPEG fallback. The hero image budget is 150 KB.
9. **Tokens only.** Colours come from the brand guide, line weights from its section 5: 1.5 to 2 px Ink lines, 1 px Steel dimension lines, one Signal callout. Hatching marks cut material in a section drawing and is never wallpaper.
10. **No inline styles in SVG.** The content security policy blocks `<style>` and `style=` when an SVG is inlined into a page. Use presentation attributes.
11. **Alt text says what is shown.** Plain words, no claim the picture cannot support, no em dash and no semicolon.
12. **No video in v0.** Later: short, silent, compressed, loaded on demand and captioned. The 39 MB video from the personal site is not carried over.

## 2. Assets

Status words. **Preview**: fine for the noindex private preview. **Name hold**: shows the provisional name or its initial, so no print and no announcement until the name is cleared (`docs/open-questions.md`, item 1). **Review**: a named reviewer must look before launch. Sizes are bytes on disk, measured on 8 November 2026.

### 2.1 Logo, icons and social image

| Path | Purpose | Dimensions | Size | Source file | Made by | Licence or clearance | Alt text | Status |
|---|---|---|---|---|---|---|---|---|
| `src/assets/brand/lockup.svg` | Header logo on light grounds | viewBox 303.9 × 82 | 5,643 B | `brand/logo/1-trace/lockup.svg` | Claude (brand session) with `brand/logo/source/build.mjs`, commit 5d9f028. Copied by the site build session | Normek original. Wordmark outlined from Barlow Semi Condensed 600 (SIL Open Font License 1.1). Name not cleared | Site name from `src/config/site.ts` | Preview, name hold |
| `src/assets/brand/lockup-reversed.svg` | Footer logo on Ink | viewBox 303.9 × 82 | 5,665 B | `brand/logo/1-trace/lockup-reversed.svg` | As above | As above | Site name from `src/config/site.ts` | Preview, name hold |
| `src/assets/brand/symbol.svg` | Where the lockup will not fit, light grounds | viewBox 82 × 82 | 657 B | `brand/logo/1-trace/symbol.svg` | As above | Normek original, initial N only. Name not cleared | Site name from `src/config/site.ts` | Preview, name hold |
| `src/assets/brand/symbol-reversed.svg` | Where the lockup will not fit, on Ink | viewBox 82 × 82 | 679 B | `brand/logo/1-trace/symbol-reversed.svg` | As above | As above | Site name from `src/config/site.ts` | Preview, name hold |
| `src/assets/brand/favicon.svg` | Icon tile copy kept with the other logo files. Nothing references it now, because `Seo.astro` links `public/favicon.svg` | viewBox 96 × 96 | 408 B | `brand/logo/1-trace/favicon.svg` | As above | As above | None. Browser chrome, not page content | Preview, name hold |
| `brand/logo/1-trace/favicon-square.svg` | Source of the four square icons: full-bleed Ink and the reversed symbol at 0.65 scale inside the 80 percent safe-zone circle | viewBox 96 × 96 | 766 B | `brand/logo/1-trace/symbol-reversed.svg`, paths copied unchanged | `visual-media-producer` (Claude), written by `scripts/build-brand-assets.mjs --write-square` | As the symbol | None. Source file | Preview, name hold |
| `public/favicon.svg` | Stable `/favicon.svg` address for the SVG tab icon | viewBox 96 × 96 | 408 B | `brand/logo/1-trace/favicon.svg`, byte copy | `scripts/build-brand-assets.mjs` | As the symbol | None. Browser chrome | Preview, name hold |
| `public/favicon.ico` | Tab icon for browsers that ask for `/favicon.ico` | 16, 32 and 48 px frames, PNG inside ICO | 1,896 B | `brand/logo/1-trace/favicon.svg`, drawn at each size | `scripts/build-brand-assets.mjs` | As the symbol | None. Browser chrome | Preview, name hold |
| `public/apple-touch-icon.png` | Home screen icon on iOS. Opaque, RGB, no alpha | 180 × 180 | 2,290 B | `favicon-square.svg` | `scripts/build-brand-assets.mjs` | As the symbol | None. Not page content | Preview, name hold |
| `public/icon-192.png` | Web manifest icon | 192 × 192 | 2,172 B | `favicon-square.svg` | `scripts/build-brand-assets.mjs` | As the symbol | None. Not page content | Preview, name hold |
| `public/icon-512.png` | Web manifest icon | 512 × 512 | 6,138 B | `favicon-square.svg` | `scripts/build-brand-assets.mjs` | As the symbol | None. Not page content | Preview, name hold |
| `public/icon-maskable-512.png` | Web manifest icon with purpose `maskable`. Same art as `icon-512.png`, kept as its own file so the manifest can name the purpose | 512 × 512 | 6,138 B | `favicon-square.svg` | `scripts/build-brand-assets.mjs` | As the symbol | None. Not page content | Preview, name hold |
| `public/og-default.png` | Link preview card for every page (Open Graph, OG). Reversed lockup centred on Ink | 1,200 × 630 | 14,878 B (limit 300,000 B) | `brand/logo/1-trace/lockup-reversed.svg` | `scripts/build-brand-assets.mjs` | Normek original. The card shows the name, so name not cleared | "Normek logo on a dark blue background. A chamfered square outline holds the letter N with two orange pads, beside the name." For `og:image:alt` | Preview, name hold |

Wiring. `Seo.astro` now links the three tab and home screen icons from `public/`, with the ICO before the SVG so Chrome picks the SVG, as the brand guide (section 6) asks:

```html
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

Still to do (`frontend-developer`), checked on 8 November 2026: `og:image` is not set yet. It must be an absolute address and carry `og:image:alt`. No web manifest file exists, so the 192, 512 and maskable icons are not linked. The private preview needs only the SVG and the ICO.

The SEO plan (`docs/seo/seo-and-analytics-plan.md`) warns that the site-wide `Cross-Origin-Resource-Policy: same-origin` header may hide the card image from some clients. Test LinkedIn, Slack, WhatsApp and Teams once the preview can be reached.

### 2.2 Hero illustration

| Path | Purpose | Dimensions | Size | Source file | Made by | Licence or clearance | Alt text | Status |
|---|---|---|---|---|---|---|---|---|
| `src/assets/illustrations/enclosure-section.svg` | **For inlining.** The hero drawing with live text in IBM Plex Mono. Inline it once per page, because its ids are fixed | viewBox 560 × 440 | 3,599 B (about 1.1 KB gzip) | `docs/design/canvas/Main.dc.html`, lines 54 to 85 | Drawn in the Claude Design canvas (an AI design tool, written as vector code), then redrawn by `visual-media-producer` (Claude) | Normek original and generic. No customer or past employer content. Brand colours only | Inline: the file's own `<title>` and `<desc>`. Add no second `aria-label`. Caption below | Preview, review |
| `src/assets/illustrations/enclosure-section-outlined.svg` | **For images.** The same drawing with the letters turned into outlines, so it looks the same in an `<img>`, a social card or a PDF | viewBox 560 × 440 | 16,228 B (about 2.9 KB gzip) | `enclosure-section.svg`, through `scripts/outline-svg-text.mjs` | As above | As above, plus IBM Plex Mono 400 outlines (SIL Open Font License 1.1, text in `public/fonts/OFL-ibm-plex-mono.txt`) | Not in use on the page since the no-text variant below replaced it. Keep it for a social card or a PDF, where the labels are wanted. If used: "Section drawing of a two-part housing. The lid is lifted off, with a round seal in a groove in its lip. A circuit board with three components rests on two posts in the base. Labels name the seal, lid, board and base." Caption below | Preview, review |
| `src/assets/illustrations/enclosure-section-no-text.svg` | **In use on the hero.** The same drawing with no text: the three labels and their leaders and the dimension label are removed, and the seal callout and the dimension line stay. The viewBox is cropped to the drawing so it sits in the middle of its frame. The parts are named in an HTML legend under the figure, in Plex Mono at `text-sm`, because text inside a scaled SVG shrinks with it (7 px at 390 px, review finding 3). Show it as an `<img>`: it has no text, so no font is needed | viewBox 441 × 420 (cropped from 560 × 440) | 1,917 B (about 0.6 KB gzip) | `enclosure-section.svg`, edited by hand: `<text>` nodes, three leader lines and the label removed, viewBox changed | `frontend-developer` (Claude), on the review fix in `docs/design/canvas-review-2026-11-08.md` | As above. Normek original and generic. Brand colours only | `figureAlt` in `src/content/home/en/01-hero.md`. The legend is the `legend` field in the same file. Caption below | Preview, review |

**Required caption** next to either file: "Illustration, not to scale: a circuit board in a two-part housing, shown as a section. Not a customer project." This is the caption in `docs/copy/v0-home-copy.md` (version 2.1). If a page shows another one, the copy file wins.

**Which variant.** The hero uses `enclosure-section-no-text.svg` as an `<img>`, with the parts named in the legend. For anything that needs the labels inside the drawing, inline `enclosure-section.svg` when you can. It is small, and its labels stay real text in the IBM Plex Mono that the page already loads. Use `enclosure-section-outlined.svg` in an `<img>`, because an SVG shown as an image cannot use the page's web fonts and its labels would fall back to a system font. Measured at 4 times size against the web-font rendering, the outlined file differs in 39 of 3.9 million pixels and the live-text file used as an image in 16,250.

**Where it may sit.** Only on a white or Paper ground. The colours are fixed brand colours, so the drawing does not follow a dark theme and there is no dark variant yet. Do not show a labelled variant narrower than about 360 px, where the labels fall under 11.5 px. The no-text variant has no such limit.

**What changed from the canvas drawing.**

Brand guide fixes:

1. The hatch now draws at the specified 1.5 px. In the canvas drawing the line sat on the edge of its pattern tile and half of it was clipped, so it drew at 0.75 px (measured). The pitch stays 9 px.
2. Labels are 18 units instead of 13. They now render at about 13 px in the hero at desktop width and about 10 px on a phone, against 9 and 7 px before, so they come closer to the 14 px label size of the guide. Each baseline moved to keep its label centred on its leader. The font stack is the guide's mono stack.
3. A title, a description and unique ids replace the `aria-label` and the `style` attribute.

Drawing notes from the technical fact check (`docs/copy/fact-check-v0-home.md`, row "Hero caption"):

4. The lid is hatched at 45 degrees and the base and its posts at the mirrored 135 degrees, so adjacent parts read as different parts. Both stay at 45 degrees to the axes, so the brand rule holds.
5. The board rests on the two posts. Posts and base are one outline with no line between them, because they are one part.
6. The seal is a solid round section sitting in a groove in the lid lip. Thin sections are drawn solid, as the board already was.
7. No ingress protection (IP) label or rating anywhere.

Changes those notes forced:

8. Both parts have a lip 8 units thicker on the inside, so the groove has room to show. The outer width and the dimension line are unchanged, and the opening (308 units) is still wider than the board (300).
9. The dashed assembly lines moved from beside the posts to the centre of each groove, so they show where the lid lands. The board is no longer in their path.
10. The "board" label sits inside the drawing with a short leader, because a leader from the right would cross the base wall.
11. The seal callout leader is at exactly 45 degrees.

Unchanged: the viewBox, the outer silhouette, the colours, the line weights, the label wording, the single Signal callout and the dimension line.

**What the drawing does not show**, so a reviewer does not read it as a claim: it is not to scale (the lips, groove and seal are exaggerated to read at about 400 px wide), it has no screws, heat-set inserts, draft angles, fillets or cable entries, the seal is drawn uncompressed, the board has no fixing to the posts, and no rating or test is stated.

**Review owed.** No review of this drawing by `mechanical-domain-expert` is on record. The fact check of 8 November said no illustration existed yet, so ask for a look before launch.

### 2.3 Fonts (licence trail)

Fonts are not media, but each one has a licence to keep. The site build session added these. Total 83,404 B for three families, against the plan's two (an open item in the brand guide).

| Path | Purpose | Dimensions | Size | Source file | Made by | Licence or clearance | Alt text | Status |
|---|---|---|---|---|---|---|---|---|
| `public/fonts/barlow-semi-condensed-latin-600-normal.woff2` | Display type, and the face of the lockup | Latin subset, weight 600 | 22,984 B | `@fontsource` packages 5.3.0 on npm (see `src/styles/fonts.css`) | Barlow Project Authors, packaged by Fontsource | SIL Open Font License 1.1. Text in `public/fonts/OFL-barlow-semi-condensed.txt` | None | Preview |
| `public/fonts/ibm-plex-sans-latin-wght-normal.woff2` | Text type | Latin subset, weight axis | 45,712 B | As above | IBM Corp., packaged by Fontsource | SIL Open Font License 1.1. Text in `public/fonts/OFL-ibm-plex-sans.txt` | None | Preview |
| `public/fonts/ibm-plex-mono-latin-400-normal.woff2` | Specification type, and the labels in the hero drawing | Latin subset, weight 400 | 14,708 B | As above | IBM Corp., packaged by Fontsource | SIL Open Font License 1.1. Text in `public/fonts/OFL-ibm-plex-mono.txt` | None | Preview |

## 3. Making and remaking the files

```
node scripts/build-brand-assets.mjs
```

Builds the seven files in `public/`. It needs Chromium for Playwright (`npx playwright install chromium`, once). It checks as it goes: each square icon is opaque and Ink in every corner with nothing outside the safe zone, the ICO reads back, and the OG card is centred and under 300,000 bytes. The output was identical in three builds (SHA-256 compared).

```
node scripts/build-brand-assets.mjs --write-square
```

Only after `symbol-reversed.svg` changes. It rewrites `brand/logo/1-trace/favicon-square.svg`. The normal run stops if that file no longer matches the symbol, so the icons cannot drift from the logo.

```
node scripts/outline-svg-text.mjs src/assets/illustrations/enclosure-section.svg src/assets/illustrations/enclosure-section-outlined.svg --font <path>/ibm-plex-mono-latin-400-normal.woff --decimals 1
```

Rebuilds the outlined file. Run it after any label change. The no-text file is not generated. It was made by hand from `enclosure-section.svg`, so a change to the drawing itself (not the labels) has to be made in both files. The font file is the WOFF in the `@fontsource/ibm-plex-mono` 5.3.0 npm package (`files/ibm-plex-mono-latin-400-normal.woff`), the same font data as the WOFF2 in `public/fonts/`. The tool reads WOFF, TTF and OTF but not WOFF2. It takes opentype.js from `brand/logo/source/node_modules`, so run `npm install` there once. No dependency was added to the site's `package.json`.

After a rename: run `node brand/logo/source/build.mjs --name "New Name"`, copy the lockups into `src/assets/brand/`, then run the build script again. `og-default.png` shows the name, so it must be redone. The hero drawing carries no name and stays.

## 4. Budgets

| Item | Budget | Now |
|---|---|---|
| Hero drawing, inlined | Under 6 KB | 3.6 KB (about 1.1 KB gzip) |
| Hero drawing, as an image | No separate limit. The hero image budget is 150 KB | 1.9 KB for the no-text variant (about 0.6 KB gzip), 16.2 KB for the outlined one |
| Open Graph image | PNG, 1,200 × 630, under 300 KB | 14.9 KB |
| Hero photo or render, when there is one | 150 KB, AVIF or WebP with `srcset` | None yet |
| Page weight before interaction | 500 KB | Checked in the preview gate |
| Fonts | 100 KB and two families (plan, section 6) | 83.4 KB and three families |
| 3D model, when there is one | About 3 MB each, lazy loaded, with a poster image | None |
| Video | None in v0 | None |

## 5. Pending

### 5.1 Photos of Daniel

| Item | Where it is | What is missing | Status |
|---|---|---|---|
| Portrait of Daniel | The `Pictures of Daniel/` set in the `personal-branding` repo (`public/lovable-uploads/`). Not copied here | Which photo Daniel picks. Who took it, and permission from the photographer. A compressed copy with location data stripped. Alt text | [TO CONFIRM] |
| Workshop photos | `daniel-in-workshop.jpg` in the same folder. The founder section brief asks for one compressed workshop photo (`docs/ux/page-briefs.md`) | The same list. Also that nothing in the background belongs to a past employer or a customer, and that nobody else can be recognised without agreeing | [TO CONFIRM] |

Direction for any new photo of a physical prototype: neutral backdrop, soft side light, a scale reference such as a ruler, consistent crops, a high resolution original, location data stripped before publishing.

### 5.2 Work that needs written clearance before use

Source: `docs/content-reuse-inventory.md`. Nothing below is cleared. When permission arrives, write the date and who gave it in the "Permission on file" cell and keep the document itself outside this repo, since the repo could become public. Past employer questions are open question 3 in `docs/open-questions.md`.

| Item | Clearance per the inventory | Permission on file | What to get in writing | Status |
|---|---|---|---|---|
| Mimir's Well (lead case study) | Own, [TO CONFIRM] | None | Daniel confirms the project was his alone and lists the images he wants to use. Nobody else, such as a university or a co-author, may hold rights in them | Not confirmed |
| TB150 Wireless Power | Employer (SkyGrids) | None | Written permission from SkyGrids for named images. The terms of the share sale may decide who can give it | Blocked |
| PB10 Wireless Power | Employer (SkyGrids) | None | As TB150 | Blocked |
| AI-Assisted 3D Modelling Pipeline | Own, [TO CONFIRM] | None | Daniel's confirmation. The "weeks into days" claim needs a row in `docs/claims-ledger.md` before any image of it is used. v0 makes no AI statement | Hold |
| Idunn Herb Holder | Own, [TO CONFIRM] | None | Daniel's confirmation | Not confirmed |
| Custom Foam Packaging | Unknown | None | Find out who it was for, then ask them | Unknown |
| Quick-Release Mechanism | Unknown | None | As above | Unknown |
| Retract mechanism for Nordic Wing | Employer (Nordic Wing) | None | Written permission from Nordic Wing. Anonymising a picture of the mechanism may not be enough | Blocked, skip for now |
| Laser Communication Gimbal | Employer (SkyGrids) | None | Written permission from SkyGrids | Hold |
| Danfoss ICM150 test rig | Employer (Danfoss) | None | Written permission from Danfoss. Low relevance | Skip |
| Structural FEA, hydraulic wood splitter, optical simulation, CUAV laser concept, robot cell testing, laser cut fabrics, ceramic 3D printing | Mixed or unknown | None | Do not promote. Simulation is not a specialty | Skip |
| Three testimonials | Not images, but they need permission too | None | Written permission from each person to reuse the quote on a company site, labelled "work done before Normek" (`docs/open-questions.md`, item 16). A name is personal data | Blocked |

Project photos are used only for case studies that are cleared. The `back-in-denmark*.mp4` files (39 MB, 9 MB and 5 MB) are not carried over at all.

### 5.3 Planned, not started

- **Views of reference design RD-1** (sealed outdoor sensor housing): exploded view, groove section, a sealing-path diagram, photos of failures and the build log. Normek owns RD-1 and builds it from public board data with no PB10 or TB150 geometry, so it is the safest portfolio (`docs/services/packages-and-reference-designs.md`). A CAD section of RD-1 replaces the hero illustration once it exists. RD-2 (wall-mounted gateway housing) follows the same plan. Captions say render, printed prototype or production part.
- **Process diagram** (brief, concept, prototype, production) as a reusable SVG.
- **`avatar-400.png`** (brand guide, section 6): not generated and not needed for the private preview. Add it to the script when wanted.
- **LinkedIn cover:** size [TO CONFIRM], because sources disagree (1128 × 191, 1512 × 256 and 4200 × 700).
- **A descriptor on the OG card.** The SEO plan (section 4) expects the mark, the name and a descriptor. The brand guide specifies the lockup alone, so that is what is built. A descriptor needs wording from `content-copywriter` and a small change to the script.

## 6. Questions for Daniel

1. **Does the hero drawing count under the "no AI-generated imagery in v0" rule?** It was drawn as vector code in the Claude Design canvas and redrawn here. An image model did not produce it, and it is labelled "Illustration". Recommended default: allowed, listed here and labelled. Ask `legal-compliance-advisor` to confirm before launch, since `docs/legal/site-legal-requirements.md` (row 8) raises Article 50 of the EU AI Act. If it is not allowed, replace it with a hand-made drawing or the RD-1 CAD section.
2. **Which portrait and which workshop photo, and who took them?** Recommended default: one compressed workshop photo for the founder section.
3. **Should the OG card carry a descriptor line, or only the lockup?** Recommended default: the lockup alone until the descriptor wording is final.
