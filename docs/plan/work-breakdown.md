# Work breakdown: Normek website, phase 1 (private preview)

Owner: web-architect, 2026-11-08. Stack: ADR 0001 with Amendments.

**Goal:** a complete private preview of the one-page v0 site, `/privacy/` and a 404 page, with hidden v1 templates, on Cloudflare Pages behind `noindex`. Nothing goes live until the name is cleared.

## 1. v0 scope

Home page sections, in order:

1. Header: Trace lockup, anchor links, one call to action.
2. Hero (`#top`): outcome headline and subhead, "Request a feasibility review" button.
3. Problem (`#problem`): when a standard box stops fitting.
4. Offers (`#offers`): the three packages. Prices hidden until confirmed.
5. How we work (`#process`): 4 or 5 steps. No AI wording until Daniel decides.
6. Data and IP (`#data`): only commitments that are true today, link to `/privacy/`.
7. Founder (`#about`): facts of record only, photo [TO CONFIRM].
8. Contact (`#contact`): form (name, email, company, message), the direct address and a response time [TO CONFIRM].
9. Footer: company details [TO CONFIRM], privacy link.

No proof section in v0 (nothing is cleared). `/404` gets a short message and a link home.

## 2. Routes

| Route | v0 | Notes |
|---|---|---|
| `/` | built | one page |
| `/privacy/` | built | |
| `/404.html` | built | |
| `POST /api/contact` | function | Pages Function |
| `/enclosure-design/`, `/how-we-work/`, `/data-and-ip/`, `/work/`, `/work/<slug>/`, `/about/`, `/contact/` | draft | v1 templates |

English at the root, Danish later under `/da/` (Astro i18n, `prefixDefaultLocale: false`, only `en` configured now). Trailing slashes everywhere.

## 3. Content model (`src/content.config.ts`)

- `home` (Markdown, `src/content/home/en/`): one file per section. Fields: `id`, `order`, `kind` (enum mapped to a section component), `heading`, `lead`, `cta`, `items`, `draft`.
- `offers` (YAML): `name`, `duration`, `summary`, `includes`, `price` (number or null), `priceStatus` (`hypothesis` or `confirmed`). A price renders only when confirmed.
- `pages` (Markdown, `src/content/pages/en/`): `title`, `description`, `lang`, `updated`, `draft` (default true).
- `work` (Markdown): `client` (name or `anonymous`), `clearance` (`none`, `pending`, `written`), `claims` (claims-ledger ids), `draft`. The schema fails the build if `draft` is false and clearance is not `written`.
- `src/config/site.ts`: name, email, company details, nav. Missing facts stay `[TO CONFIRM]`.

## 4. Draft handling

- One helper, `isPublished(entry)`, used by every `getStaticPaths`, the nav and the sitemap. Production builds drop drafts, so no HTML, nav link or sitemap entry exists.
- The Pages preview environment sets `SHOW_DRAFTS=true`. Drafts then render with a "Draft" banner, so Daniel can review templates on his phone.
- `scripts/check-dist.mjs` runs on the production build and fails if a draft route, a draft URL in `sitemap.xml` or a link to one exists. In launch mode (`PUBLIC_INDEXABLE=true`) it also fails on `[TO CONFIRM]`, `[TARGET` or a third-party origin outside the allowed list.

## 5. Repo layout

The site lives at the repo root, beside the existing folders.

```
.nvmrc  package.json  package-lock.json  astro.config.mjs  tsconfig.json
eslint.config.js  wrangler.toml  lighthouserc.json
.github/workflows/ci.yml  .github/dependabot.yml
design/tokens.md  design/reference/
functions/api/contact.ts
public/_headers  public/favicon.svg  public/fonts/
src/content.config.ts  src/content/  src/config/
src/styles/tokens.css  src/styles/global.css
src/components/sections/  src/components/ui/  src/layouts/
src/lib/  src/pages/
tests/unit/  tests/e2e/
```

Keeping `brand/logo/source` out: it is not an npm workspace, `tsconfig.json` includes only `src`, `functions` and `tests`, and ESLint, Prettier and lychee ignore `brand/`, `docs/` and `qa/`. The chosen logo SVGs are copied into `src/assets/brand/` once, so the site never runs the generator.

## 6. Budgets

| Budget | Limit |
|---|---|
| First-party JavaScript | 10 KB gzip on `/`, 0 KB on `/privacy/` and 404 |
| CSS | 30 KB gzip |
| Fonts | at most 2 families, self-hosted woff2, 100 KB total, metric-matched fallbacks |
| Hero image | 150 KB, AVIF or WebP with `srcset` |
| Page weight before interaction | 500 KB |
| Largest contentful paint (mobile, simulated 4G) | under 2.0 s |
| Cumulative layout shift | under 0.05 |
| Total blocking time | under 100 ms |
| Lighthouse | 95 or more in all four categories (run on a build with `PUBLIC_INDEXABLE=true`, or SEO fails on `noindex`) |
| Third-party origins | only `challenges.cloudflare.com`, loaded when the form comes into view |
| Headers | strict CSP without `unsafe-inline` for scripts, `frame-ancestors 'none'`, nosniff, strict referrer policy, permissions policy (`security-engineer` sets the exact values) |
| Dependencies | each one justified in the PR, 0 high or critical advisories in production dependencies |

## 7. CI (GitHub Actions, every push and pull request)

1. `npm ci` on the `.nvmrc` Node version.
2. Writing rules: `node scripts/check-writing-rules.mjs`.
3. Lint: ESLint and Prettier.
4. Types: `astro check` and `tsc --noEmit` for `functions/`.
5. Unit tests: Vitest on validation, drafts and the function (mocked Turnstile and mail).
6. Build, then `scripts/check-dist.mjs`.
7. Links: lychee on `dist/`, offline. External links weekly, not blocking.
8. Accessibility: Playwright with axe-core on every built page at 390 and 1280 px. Zero serious or critical issues.
9. Lighthouse CI: mobile preset, 3 runs, assertions from section 6.
10. Secrets: gitleaks over the full history.
11. Screenshots at 390, 768 and 1280 px uploaded as a build artifact for review.

## 8. From Claude Design to code

- The design team delivers `design/tokens.md` with names fixed in advance: `color-ink`, `color-signal`, `color-paper`, `color-steel`, semantic aliases (`bg`, `fg`, `muted`, `accent`, `border`, `focus`), a type scale, a space scale on a 4 px base, radii, shadows and breakpoints at 390, 768 and 1280 px.
- `frontend-developer` writes them once into `src/styles/tokens.css` inside Tailwind's `@theme`, which emits CSS variables. Components use tokens only, never raw hex values.
- Per section the frontend developer receives frames at 390, 768 and 1280 px, form states (focus, error, sending, success, failure), the component list, final copy in `src/content/`, and assets with alt text.
- Contrast is a design constraint now. Measured: Ink on Paper 15.8:1, Ink on Signal 5.5:1, Steel on Paper 4.2:1, white on Signal 3.1:1, Signal on Paper 2.9:1. So buttons use Ink text on Signal, Signal never carries body text on Paper, and Steel is for large text or decoration only.
- Acceptance: Playwright screenshots of the built page at the three widths, side by side with the frames. `ui-designer` signs off when layout, order, token values and type match, there is no horizontal scroll, and focus is visible. No automated pixel diff in phase 1.

## 9. Ordered tasks

| # | Task | Owner | Depends on | Gate |
|---|---|---|---|---|
| 1 | Daniel's one-time setup (section 10) | Daniel, guide by `devops-engineer` | none | Pages project, Turnstile widget and Resend key exist |
| 2 | Sitemap and v0 page brief, form fields and states | `ux-conversion-designer` | none | manager approves |
| 3 | v0 copy and privacy text | `content-copywriter`, `legal-compliance-advisor` | 2 | writing rules pass, `mechanical-domain-expert` fact-check, no unledgered claims |
| 4 | Tokens, frames at 3 widths | manager and `ui-designer` in Claude Design | 2 | tokens use the fixed names, contrast rules met |
| 5 | Contact function threat model and header values | `security-engineer` | none | written review |
| 6 | Scaffold: config, CI, content schemas, drafts, `check-dist`, `_headers` | `frontend-developer` with `devops-engineer` for CI | ADR accepted | CI green on an empty page |
| 7 | Sections, privacy, 404, v1 templates as drafts | `frontend-developer` | 3, 4, 6 | CI green, screenshots match frames |
| 8 | Contact function and `sendMail()` adapter | `frontend-developer` | 1, 5, 6 | unit tests, a real test message received on preview |
| 9 | Allow the preview hostnames in the session environment | manager proposes, Daniel approves | 1 | `scripts/screenshot.mjs` works on preview |
| 10 | Preview gate | `qa-accessibility-engineer` and `security-engineer` | 7, 8, 9 | budgets met, no open high findings |
| 11 | Rendering and indexing check | `seo-analytics-specialist` | 7 | `noindex` present, sitemap correct |

**In parallel:** 1, 2, 5 and 6 start at once. 3 and 4 run side by side after 2. 7 and 8 run side by side. 10 and 11 run side by side.

## 10. What Daniel does once (about 45 minutes)

1. Create a Cloudflare account (free plan) with two-factor authentication.
2. Workers and Pages, Create, Pages, Connect to Git. Install the Cloudflare GitHub app on this repository only. Project name `normek-web` [TO CONFIRM it is free]. Production branch `main`. Build command `npm run build`, output `dist`. Preview branches: custom, include only `preview`.
3. Turnstile: add a widget (Managed mode) for the hostname `normek-web.pages.dev`. Put the site key and secret key in the Pages settings for both environments, the secret as encrypted.
4. Resend: sign up with daniel@normek.dk, turn on two-factor, create an API key with sending access only, and store it as an encrypted Pages secret. Do not paste any key into chat or the repo.
5. Approve the session environment change adding exactly `normek-web.pages.dev` and `preview.normek-web.pages.dev`.

At launch, later: the `www` CNAME and bare-domain forward (ADR 0001), the three Resend records on `notify.normek.dk`, `www.normek.dk` on the Turnstile widget, and ADR 0002 for analytics.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Preview URLs are public, only unlisted | `noindex`, no confidential content, nothing on the site that is not already true |
| Resend sandbox rules or retention differ from what search found | check at sign-up, adapter swap to Scaleway or Postmark |
| Astro 6 or Node version mismatch on the Pages build image | pin `NODE_VERSION`, verify at scaffold |
| Turnstile accessibility or blocked script | direct email address always shown beside the form |
| Copy outruns proof | claims ledger check in gate 10, `[TO CONFIRM]` blocks launch mode |
