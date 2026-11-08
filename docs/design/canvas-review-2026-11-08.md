# Canvas review, 8 November 2026

Reviewed from source, not rendered, against the brand guide, `tokens.md` and copy 2.1: all ten boards. Lines are in the file named, `Main` unless stated. Widths and line lengths are measured, heights estimated. The page boards import Main's header and footer.

**Clean:** all 23 hex values are on the token list, only the three families appear, no Signal text, one primary Signal fill per viewport, no chamfer on controls, the trace appears once. Every pair passes (lowest text 5.03:1, lowest non-text 4.20:1).

| # | Where | Severity | Finding and exact fix |
|---|---|---|---|
| 1 | `Main` 45, 126, 296, 344 to 348, 416. `Privacy` 27, 55. `Type` 164 | Must fix | Lines run past 65 characters (guide, `Type` 134): up to 71, 89, 71, 83, 96 and 103. At 768 the uncapped lists reach 95 (301 to 307) and 91 (324 to 328). `Type` 164 says "34 to 46 em" and the code has four tokens from it. Fix: `max-width:28em` on running text (longest line 65), one token, reword 164. |
| 2 | `Main` 26 to 31, 428, 440 to 441 | Must fix | At 768 the header needs 765 px and has 707 (it fits from 832). Fix: links from 1280 as `Header.astro` does, `logoH` 28 below 768 and 32 above. |
| 3 | `Main` 75 to 85. `Components` 335 to 341, 348 | Must fix | Labels are 13 units in a scaled SVG: 7 px at 390, 9 px at 1280, 15 px at 768. Fix: remove the `text` nodes and leaders, add an HTML legend in Plex Mono `text-sm`, move line 85 to the caption, reword 348 to "never scale text". |
| 4 | `Main` 51 | Should fix | Copy 2.1 puts the one-person line before the button. It sits after the email link, at y 693 to 735 on a phone, under the fold. Fix: move it above line 46, no rule, margin 16. |
| 5 | `Main` 43, 48 | Should fix | At 390 the eyebrow is 351 px in 350 ("TEAMS" wraps alone). Line 48 is 253 px in a 240 px box (16em), leaving "it." alone at every width. Fix: `text-wrap:balance` on eyebrows, `max-width:18em` on line 48. |
| 6 | `Main` 97. `Type` 167 | Should fix | Wrapping flex stretches the third problem card to 706 px at 768. Fix: grid `repeat(auto-fit, minmax(min(100%, 300px), 1fr))`, as the Data list (323) does. |
| 7 | `Main` 23, 26 to 29, 50, 102, 108, 114, 330, 349, 410 to 412. `NotFound` 26, 29. `Thanks` 34 | Should fix | Targets under 44 px: logo 28 to 32, nav 24, links 24 to 37. Fix: standalone links get `display:inline-flex`, `align-items:center`, `min-height:44px`. `Privacy` 41 to 51 pass. |
| 8 | `Main` 54, 337. `Components` 219 | Should fix | The hairline stops at the chamfer cut. Fix: two-layer frame, tokens.md 5.13. |
| 9 | `Main` 338, 404 to 417. `Privacy` 25 | Should fix | Tags drop under 14 px (13, 12.25 and 13.1). Fix: `text-sm`, padding 4. |
| 10 | `Components` 52 | Should fix | Sending uses `disabled`, which drops keyboard focus. Fix: same look (paper-200, muted, 5.03:1) with `aria-disabled` and `aria-busy`. |
| 11 | `Components`, page boards | Should fix | `Components` covers the form states, status messages, cards, tags and devices. Still missing: secondary focus, pressed, field hover and disabled, a checkbox (`Type` 170 names it), nav states, and every 390 and 768 frame (also for `Thanks`, `NotFound`, `Privacy`). Fix: draw them from tokens.md section 5. |

**Nits**

- Boards disagree: textarea 120 (`Components` 160) against 140 (`Main` 376), focus offset 2 (146) against 3 (48, 97), trace padding 24 (256, 265) against 32 (`Main` 245 to 275), status gap 10 (168 to 187) against 12 (`Thanks` 24).
- Type: `Main` 44 adds Roboto Condensed, the footer logo is fixed at 28 (400), fixed 14 and 15 px sizes (26 to 31, 360 to 415) belong on `text-sm`, index numerals mix 14 px and body size (99, 383).
- Weights: 500 on nav and standalone links (26 to 29, 50, 330) against the guide's 400 and 600 (`Type` 56). Fix: amend the guide, set footer links 500 (410 to 412) and line 386 to 400.
- Off the 4 px base: 6, 10 and 14 px (300, 338, 362 to 376, tag padding). Use 8, 8, 16 and 4.
- Spec boards: 12 to 13 px labels, 56, 28 and 24 px headings, 46 to 60em paragraphs.

## Phone first screen

At 390 (estimated): button ends at y 529, email link 632, one-person line 735, drawing starts 767.

- Move the one-person line above the button (finding 4). It is the only proof on the page. The button then ends near 587.
- Recover 24 px with header padding 12 and hero top padding 32. The button ends near 563.
- Make the button full width below 480 px (350 by 52), then the standard-box line and email link as 44 px rows.
- Set the lead in Ink on phones (15.79:1 against 5.55:1) with `text-wrap:pretty`, which removes the 9 character last line.
- The first scroll lands on the drawing, so fix its labels (finding 3) first.
