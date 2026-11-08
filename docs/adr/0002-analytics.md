# ADR 0002: Analytics for the Normek website

- Status: **Proposed**, 2026-11-08. Nothing runs during the private preview (ADR 0001, A6).
- Deciders: Daniel, with `seo-analytics-specialist`, `security-engineer` and `legal-compliance-advisor` advising
- Revisit when: eight weeks after launch, or when a question needs UTM or event data

## Context

Launch needs one weekly answer: visits, top pages, search queries, inquiries and the source of each inquiry. Constraints:

- Cookieless, no consent banner (not yet confirmed by `legal-compliance-advisor`).
- Strict CSP, no inline script. A beacon is a third-party origin, so it needs this ADR, a CSP change and a `check-dist` allow list update.
- Budget 0 to 25 euros a month for everything.
- Wanted: `form_start` and `form_submit` events. Accepted fallback: a `/thanks/` page view. No confirmation email goes to visitors in v0 (CF-11).
- Engineers often block trackers, so client-side numbers are a floor. The inquiry email is the record.

## Options

| | Cloudflare Web Analytics | Plausible Cloud | Umami self-hosted | None |
|---|---|---|---|---|
| Cost | Free | About 9 a month after a 30 day trial | Free software, our server | Free |
| Device storage | None (Cloudflare's claim) | Reads a localStorage flag | Reads a localStorage flag | None |
| CSP | Two hosts, no hash pinning | Script host, endpoint. Inline init block must move to our file | Our host. Attribute events, no inline code | None |
| Events, UTM | Neither | Both | Both | Neither |
| Data location | Not verified | Germany (vendor) | Our host | None |
| New processor | No | Yes | Yes | No |

## Decision (recommended)

**Cloudflare Web Analytics at launch**, plus attribution carried in the inquiry itself.

1. No new vendor or processor: Cloudflare already hosts the site.
2. Free, cookieless per Cloudflare (no localStorage), and two CSP host entries with no inline code.
3. Web Vitals from real visits, where Google's field data needs traffic we lack.
4. The gaps cost little now. First-party code fills the hidden `source` field from `utm_campaign`, so each inquiry email names its origin. The analytics conversion is a `/thanks/` view.

Rejected: Plausible adds events and UTM but costs money, adds a processor and needs a CSP workaround. Umami is free only as a licence, and its server would eat Daniel's 10 to 15 weekly hours. No analytics is defensible but blind to visits and Web Vitals.

## Consequences

- One `track(name, props)` function in first-party code, a no-op under Cloudflare. Event names follow the UX brief, so a switch touches one file.
- The beacon is a static tag in launch-mode production builds only, its token in Pages' Production variables. Skip Pages' one-click setup, which may reach previews. Honoring Do Not Track or Global Privacy Control needs a first-party loader (dynamic injection untested).
- `security-engineer`: add the two hosts to the launch-mode CSP and the allow list only.
- `legal-compliance-advisor`: confirm no banner is needed. Secondary sources say Danish rules exempt no analytics cookies, so a cookieless tool is the safer fit (unconfirmed), and the localStorage opt-out reads in Plausible and Umami need a ruling. The privacy page names Cloudflare Web Analytics, its data and retention.
- Upgrade trigger: a message test needing per-campaign visits, or funnel questions after eight weeks. Then trial Plausible (about 36 percent of the monthly ceiling).

## Not verified

developers.cloudflare.com, plausible.io and umami.is could not be fetched. Vendor facts come from search summaries and third-party pages.

- Cloudflare: no custom events or UTM (third-party sources, one secondhand quote). Retention and sampling (sources conflict). Data location. Whether one-click setup injects into previews, or the beacon ignores other hostnames. An independent review notes a per-page-load identifier and IP logging.
- Plausible: price, features, UTM and EU hosting (third-party and vendor claims).
- Umami: Cloud region, free-tier site limit, Node and PostgreSQL minimums.
- Consent: no legal text read. EU Digital Omnibus status unknown.

## Next cheapest test

After launch, compare two weeks of Cloudflare visits with Search Console clicks and the inbox. If counts look implausibly low, or UTM data is needed, start the Plausible trial.
