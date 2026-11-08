# Pre-launch quality gate: v0 preview, 8 November 2026

By `qa-accessibility-engineer`. Severity is for the private preview. No open P0 or P1.

## What I tested

Production build, `dist/` served by `scripts/preview-server.mjs` (stopped afterwards). Chromium 153, Playwright 1.63, `public/_headers` applied. Four pages at 320, 390, 768, 1024, 1280 and 1920 px, screenshots read at each.

Accessibility (axe with all tags, contrast sweep, keyboard walk, zoom, text spacing, 200 percent font size, reduced motion, forced colours). Form (about 50 mocked scenarios: 1,800 character CJK message, 16 server answers, Turnstile blocked). Lighthouse 13.6.0 and `vnu-jar`, installed with npm in a scratch directory outside the repo, on this build and on a `PUBLIC_INDEXABLE=true` copy. Also robots, sitemap, canonical, console, CSP, no JavaScript, cookies. Evidence: `qa/prelaunch/` (gitignored).

## What I could not test

WebKit and Firefox (downloads blocked, Chromium only). Real screen readers. The real Turnstile widget under the CSP, the real function and mail, Cloudflare Pages behaviour (`astro preview` answers paths without a trailing slash differently). Real phones, autofill extensions, hardware High Contrast.

## Passed

- No horizontal scroll. Zoom and text spacing clean. axe: 0 violations at AA and best practice. Contrast at least 5.53:1.
- Skip link first, no traps, visible focus on Paper, Ink and Signal. No motion, console errors, CSP violations or cookies.
- No third party request until the form is touched, then one (`challenges.cloudflare.com`). noindex in meta, header and `robots.txt`. Sitemap lists `/` and `/privacy/` only. Drafts return 404.
- Every server answer keeps the text and shows the right notice. The summary takes focus, sending keeps it.
- Lighthouse launch build: 100 in all four, LCP 1.66 s, CLS 0, TBT 0. Gzip: home 105 KiB in 10 requests, others 96 KiB. JavaScript 3.1, CSS 6.2, fonts 82 KiB. Inside budget.
- No em dash, semicolon or hype word in rendered text. HTML valid.

## Findings

| ID | Sev | Where | Issue | Exact fix |
|---|---|---|---|---|
| QA-01 | P2 | `src/scripts/turnstile.ts` | Script blocked (extension, firewall, this sandbox): the first submit fails in 0.1 s, every retry then sits on "Sending..." for 15 s, because `reset()` clears `failed` and nothing requests the script again. | In the script `error` handler set `started = false` and call `script.remove()`. |
| QA-02 | P2 | `ContactForm.astro` lines 122, 123 | `#contact-notice` and `#contact-warning` are `display:none` while empty (`empty:hidden`), so absent from the accessibility tree. The person check warning (`role="status"`) is unlikely to be announced. | Use `empty:sr-only`. Checked: layout unchanged, both enter the tree. Confirm with NVDA. |
| QA-03 | P2 | Forced colours | Logos and hero drawing are `<img>` SVGs with fixed colours and vanish on the forced background (dark palette: header logo, drawing. Light: footer logo). Primary buttons have `border: 0` and read as plain bold text. | `Button.astro` primary: `border-2 border-transparent`. `global.css`: in `@media (forced-colors: active)` set `forced-color-adjust: none` plus an opaque background on `header img` and `.frame-inner img` (`--color-white`) and on `footer img` (`--color-ink`). Verified in both palettes. |
| QA-04 | P2 | `fonts.css`, `tokens.css` | No metric-matched fallback fonts (open in tokens.md). Lighthouse CLS is 0, but with fonts 2 s late CLS is 0.146 at 1280 px and 0.027 at 390 px. | Add fallback `@font-face` rules with `size-adjust` and overrides (Capsize or Fontaine), listed second in `--font-display` and `--font-sans`. |
| QA-05 | P2 | `scripts/check-dist.mjs` | The build has `data-sitekey=""`: every submit says "Your request was not sent" and posts nothing. Launch mode does not catch it. | Fail launch mode on an empty `data-sitekey`. Set `PUBLIC_TURNSTILE_SITE_KEY` in both Pages environments (build time). |
| QA-06 | P2 | `.gitignore` line 19 | `qa/` also ignores `docs/qa/`, so this report and the planned `prelaunch-checklist.md` cannot be committed. | Change line 19 to `/qa/`. |
| QA-07 | P3 | `Status.astro`, `.prose` | At 200 percent text on a 390 px phone long strings overflow: failure and person check notices 54 px, `/thanks/` 24 px, `/privacy/` 7 px. | `[overflow-wrap:anywhere]` on the `Status` text and `.prose`. |
| QA-08 | P3 | `ProblemSection.astro`, `OffersSection.astro` | At 1024 px the problem cards break 2 + 1 (need 948 px, have 942). From 768 to about 1100 px "I need" drops under the stage title. | Grid `minmax(min(100%,290px),1fr)`. First and last offer columns `basis-60`. Verified. |
| QA-09 | P3 | Lists | Lists with `list-style: none` and no `role="list"` (offers, cards, data, footer) can lose list semantics in Safari VoiceOver (untested). "You get" and "I need" labels are not tied to their lists. | Add `role="list"` and `aria-labelledby` pointing at the label. |
| QA-10 | P3 | `HeroSection.astro` | The alt text matches the drawing but runs 282 characters and repeats the legend. The image is the mobile LCP element (1.66 s of 2.0 s), no priority hint. | Trim the alt to about 130 characters. Add `fetchpriority="high"`. |
| QA-11 | P3 | Housekeeping | Pasting 3,080 characters silently keeps 2,000. No Open Graph or Twitter tags, and `og-default.png` plus three icon PNGs ship unreferenced. `check-writing-rules.mjs` skips YAML. tokens.md 5.7 says validate on submit, the UX brief and code say blur. `work-breakdown.md` says 2 font families, 3 ship. | Say "up to 2,000 characters" in the helper. OG tags before launch (P1 then). Scan YAML. Align the docs. |

## Ready for the private preview? Yes, with conditions

1. Daniel completes the one-time setup and sets `PUBLIC_TURNSTILE_SITE_KEY` before the build. Until then no inquiry can be sent.
2. One real send from the preview: real widget under the CSP, the email, `/thanks/`.
3. Fix QA-01 to QA-03 before anyone else uses the form.

Launch blockers outside this gate: 57 `[TO CONFIRM]` lines (`check:dist` fails in launch mode), the catch-all `X-Robots-Tag`, QA-05, Open Graph, name clearance. `docs/qa/prelaunch-checklist.md` does not exist yet.

Screen reader pass for Daniel (10 minutes): empty submit, a failed person check (is the warning spoken?), the offers lists, the hero image, the `/thanks/` heading.
