# SEO and analytics plan

Owner: `seo-analytics-specialist`, 2026-11-08. Task 11 in `docs/plan/work-breakdown.md`. Tool choice: `docs/adr/0002-analytics.md`. Nothing here promises a ranking.

**Verified:** inline JSON-LD raises no violation under the CSP in the security requirements (local Chrome test). **Not verified:** every other fact comes from documentation seen through a search tool, since vendor and Google doc sites were not fetchable. No keyword tool was available, so every query is a hypothesis. Per Daniel's decision, no title, description, Open Graph text, JSON-LD value or `llms.txt` line mentions AI or tools.

## 1. Titles, descriptions, headings

- Title: brand plus descriptor inside 60 characters. Description: 70 to 155 characters saying what, for whom and the action, with no speed, price or tool claim. One `h1`. `content-copywriter` owns final text.
- `/`: `Normek | Enclosure design for electronics teams` (the hero eyebrow repeats it). `/privacy/`: `Privacy notice | Normek enclosure design`. `/thanks/` and the 404 follow the pattern and are `noindex`.
- v1 candidates: `Custom electronics enclosure design | Normek` and `Request an enclosure feasibility review | Normek`. The rest get plain descriptive titles.
- Build test: titles and descriptions unique and in range, and no match for `\bAI\b`, `AI-`, `machine learning`, `LLM`, `GPT`, `Claude` or `\btools?\b` in titles, descriptions, Open Graph text, JSON-LD or `llms.txt`.

## 2. One host, one URL

- `SITE_URL` is the single origin for canonical, `og:*`, sitemap, `robots.txt` and JSON-LD: `https://www.normek.dk` in production, the preview alias in preview. Canonicals are absolute, end in a slash and carry no query or hash.
- The bare domain is a Simply URL forward. Simply does not document its redirect type, framing or path handling. Daniel picks a permanent redirect without a frame if offered, and we run `curl -sIL`. Until it passes, outreach uses the full `www` address, because UTM tags may be lost.
- `*.pages.dev` hosts (project, `preview` alias, hash hosts) serve the same files. Host rules in `_headers` keep them `noindex` (patterns from Cloudflare's docs: `https://:project.pages.dev/*`, `https://:version.:project.pages.dev/*`), and each copy names the `www` canonical.
- Drop the wildcard `*` A record at go-live (R11). Without `404.html`, Pages answers unknown paths with `index.html` and status 200, so the 404 file matters for SEO.

## 3. Indexing flow

| Output | Flag off (every preview) | Flag on (production build) |
|---|---|---|
| Meta robots | `noindex, nofollow` | none, except `/thanks/` and 404 |
| `X-Robots-Tag` | `/*` noindex, nofollow | removed from `/*`, kept on `pages.dev` hosts and `/thanks/*` |
| `robots.txt` | `Disallow: /` | `Allow: /`, `Disallow: /api/`, `Sitemap:` line |
| `sitemap.xml`, `llms.txt` | not generated | from `isPublished()` pages, never `/thanks/` or 404 |

Indexing needs `PUBLIC_INDEXABLE` equal to `true`. On Cloudflare (`CF_PAGES=1`) the build also needs `CF_PAGES_BRANCH=main` and `SITE_URL` equal to the `www` origin, otherwise it fails (Turnstile keys go into both environments, so a slip is plausible). The sitemap is a small endpoint with `lastmod` only from a real `updated` date. Later slug changes get a 301 in `public/_redirects`.

## 4. Social card

`og:type` is website (article on guides). `og:title`, `og:description` and `og:url` equal the title, description and canonical. `og:site_name` is Normek. `og:image` is an absolute 1200 x 630 PNG under 300 KB (WhatsApp guidance, secondary source) with `og:image:alt`. `twitter:card` is `summary_large_image`. The card shows the mark, `Normek` and the descriptor, with no claim. Refresh LinkedIn's cache with Post Inspector (the preview's disallow-all `robots.txt` may block it, not verified).

## 5. Structured data

Inline JSON-LD in the head, generated from `src/config/site.ts`. `check-dist.mjs` must allow `<script type="application/ld+json">` and still fail every other inline script.

```json
{"@context":"https://schema.org","@graph":[
{"@type":"Organization","@id":"https://www.normek.dk/#org","name":"Normek",
 "url":"https://www.normek.dk/","description":"<hero subhead>",
 "email":"daniel@normek.dk","founder":{"@id":"https://www.normek.dk/#daniel"}},
{"@type":"Person","@id":"https://www.normek.dk/#daniel","name":"Daniel Hessellund Johansen",
 "jobTitle":"Founder and mechanical engineer"},
{"@type":"WebSite","url":"https://www.normek.dk/","name":"Normek",
 "alternateName":"Normek enclosure design"}]}
```

- Omit, never placeholder: no `address`, `legalName`, `vatID`, `telephone`, `foundingDate`, `areaServed`, `logo` or `sameAs` until Daniel supplies them (Q2, Q9, logo, LinkedIn). A unit test rejects those keys plus `review` and `aggregateRating`. `ProfessionalService` is a LocalBusiness type that Google's local guidance pairs with an address, so it waits for Q2.
- v1: `Service` on `/enclosure-design/` (offers only with confirmed prices), `Article` and `BreadcrumbList` on guides and cases, real dates only. Values match visible text.
- No `FAQPage`: Google reportedly ended FAQ rich results in May 2026 (secondary sources).

## 6. Search intent map (hypotheses)

Sources: the persona's examples, engineer vocabulary and one web search on 2026-11-08 (US-only tool) that showed consultancies, freelance marketplaces, enclosure makers and print shops.

| Queries to test | Intent | Page |
|---|---|---|
| custom electronics enclosure design, enclosure design for PCB | Commercial | `/enclosure-design/` |
| IP67 enclosure design service | Commercial | Same page and sealed-sensor case. Wording stays "designed for IP67" |
| injection molded enclosure design | Mixed | Gateway case and guide, partner review stated |
| design for manufacturing enclosure checklist | Informational | Guide plus checklist download |
| prototype enclosure 3D printing service | Print shops | Inside the Prototype Sprint only |
| `kabinet til elektronik`, `konstruktion af kabinet`, `kapslingsklasse IP67`, `sprøjtestøbt kabinet` | Local | `/da/` later, with `hreflang` |

Guides sit under a proposed `/guides/` and double as outreach links. Sealed outdoor sensor housing: sealing path checklist, whether you need a pressure vent, what printed layer lines do to sealing. Wall-mounted gateway housing: molded housing checklist, passive cooling by hand, what a print cannot tell you. Figures need `mechanical-domain-expert` and the claims ledger. Test "molding" against "moulding".

Cheapest test: a clean-browser SERP check in English and Danish before writing, then Search Console after four weeks.

## 7. Branded search and the name collision

- The brand never stands alone in a title, card, profile or `WebSite` name. It sits beside "enclosure design", set once in `site.ts`.
- Before launch, record page one for `normek`, `normek enclosure`, `normek.dk`, `normec` and `Daniel Hessellund Johansen`. Repeat at launch plus 4 and 8 weeks.
- Outreach runs under Daniel's name, the more unique string. The About page, his LinkedIn website field and a company page [TO CONFIRM] carry the same facts.
- Watch `normek`, `normec`, `normek oy`, `normek a/s` and `normek viborg` in Search Console. Impressions without clicks mean confusion.

## 8. Search Console and Bing, on launch day

Both wait for launch, since DNS stays untouched until the name clears. Meta tag and HTML file methods fit the CSP (data, not script) and serve as the fallback: a URL-prefix property `https://www.normek.dk/` with the token in the layout head or `public/`. DNS is better because the Domain property also covers the bare domain and subdomains.

1. Daniel signs in with a Google account that has two-factor, adds a Domain property `normek.dk` and copies its TXT value.
2. Add one TXT record at `@` through the Simply connector under `docs/ops/simply-connector.md`: read the zone, show before and after, Daniel approves, read back. SPF stays untouched. Never remove the TXT.
3. Submit `https://www.normek.dk/sitemap.xml`. Run the URL Inspection live test on `/` and `/privacy/`, then request indexing once for `/`. Expect indexable, with `www` as Google's canonical.
4. Bing Webmaster Tools: import the site from Search Console and confirm the sitemap arrived. Fallback: meta tag or `BingSiteAuth.xml` in `public/`.

## 9. llms.txt (optional)

About twelve lines from `site.ts`: name, tagline, the three packages in plain words, page links, email, founder. No AI, tools, address, location or prices. Google reportedly ignores it and other vendors have not confirmed use (secondary sources), so skipping costs nothing. Better value: identical facts in the About section, JSON-LD and a LinkedIn company page.

## 10. Measurement hooks

UTM: `utm_source` is the channel (`linkedin`, `email`, `partner`), `utm_medium` is `outreach`, `utm_campaign` is a batch code like `2026w47a`. First-party code copies them into the hidden `source` field without storage, falling back to the referrer hostname. Conversion is a `/thanks/` view, since CF-11 sends visitors no confirmation email. Check it against the inbox, which is the record (honeypot hits show the same page, CF-06). Ask "how did you find us" on the first call. Browse the live site with a tracker blocker so team visits stay out. Weekly table: visits, top pages, queries, `/thanks/` views, inquiries, source of each.

## 11. QA gate checks

| Check | Pass |
|---|---|
| Preview: `curl -sI` on `/`, `/privacy/`, `/thanks/`, an asset | `x-robots-tag: noindex, nofollow` |
| Preview: head, `robots.txt`, `/sitemap.xml`, unknown path | meta `noindex`, `Disallow: /`, sitemap 404, unknown path 404 with our page |
| JavaScript off | copy, labels, one `h1`, title, canonical, Open Graph, JSON-LD present |
| `/privacy`, `/index.html`, `http://` | at most one redirect to canonical |
| Launch build: `grep` dist for `noindex` | only `/thanks/` and 404 |
| `www` vs `pages.dev` project, alias, hash hosts | `www` 200 without `x-robots-tag`, others `noindex` |
| `sitemap.xml` | `www` URLs only, all 200, none redirected or `noindex` |
| Bare domain, `http` and `https` | one 301 to `www`, no certificate warning |
| JSON-LD and Open Graph | parses, matches text, no forbidden key, image 200 under 300 KB, zero CSP errors |
| A v1 page leaving draft | unique title and description, JSON-LD, two inbound links, in sitemap |
| Lighthouse, launch build | SEO 100 |

## 12. Open items for others

- `security-engineer`, `frontend-developer`: CF-05 allows six fields. Hidden `source`, `situation` and `page` (UX brief) need adding with strict patterns, or inquiry attribution is lost.
- `security-engineer`: site-wide `Cross-Origin-Resource-Policy: same-origin` may hide the card image in some clients. Test LinkedIn, Slack, WhatsApp and Teams.
- `legal-compliance-advisor`: confirm no banner is needed (ADR 0002).
- `ux-conversion-designer`, `web-architect`: approve `/guides/`.
- Daniel: Simply forward type, Danish terms, company LinkedIn page.
