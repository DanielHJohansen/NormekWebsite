# ADR 0001: Stack and hosting for the Normek website

- Status: **Accepted with amendments** on 2026-11-08. Daniel told the team to start development, and the manager accepted the proposal on his behalf after the web-architect validated it (see Amendments). Daniel can reverse it, and a reversal needs a new ADR.
- Date: 2026-11-08
- Deciders: Daniel (owner), with `web-architect` advising
- Revisit when: the site needs a CMS for non-developers, user accounts, file uploads or a second language

## Context

Normek needs a fast, credible business-to-business website that turns visits and outreach into inquiries from electronics companies. The constraints:

- Near-zero budget, and no Lovable subscription.
- Claude does most of the work, and the owner is a mechanical engineer.
- Customers' confidential information may later pass through the site.
- Search visibility and link previews matter.

An earlier site exists: danielhjohansen.lovable.app, with source in the `personal-branding` repo. What it is:

- Vite, React 18, TypeScript, shadcn/ui and Tailwind, with react-router running in the browser (a client-rendered single-page app).
- A Supabase edge function for the contact form, and a Supabase client in the browser.
- A recent commit, "Added SSR content for crawlers", which adds static text to `index.html` as a workaround for crawlers.
- A `.env` file tracked in git. It holds only the public Supabase URL and publishable key, but the habit should not carry over.
- 69 MB of uploads including a 39 MB hero video, and two third-party font CDNs (Fontshare and Google Fonts).
- Copy and structure written for a personal portfolio and consulting, not for a company selling one specific service.

## Options

| | A. Edit the Lovable repo | B. Astro and Tailwind on Cloudflare (proposed) | C. Next.js | D. No-code (Webflow, Framer) | E. WordPress |
|---|---|---|---|---|---|
| Time to first page | Fastest | Fast with Claude | Fast | Fast | Slow |
| Search visibility and link previews | Weak by default (client rendered) | Strong (static HTML) | Strong with care | Good | Good |
| Attack surface and upkeep | Medium (backend tied to Lovable and Supabase) | Smallest (static files and one function) | Larger, frequent upgrades | Vendor managed | Largest |
| Running cost | Depends on the Lovable plan and backend | About zero | Free to low | Monthly subscription | Hosting plus maintenance |
| Claude can build and edit it end to end | Yes | Yes | Yes | No (visual tool) | Partly |
| Fit for a company B2B site | Poor (personal portfolio) | Strong | Strong but heavy | Fair | Fair |

## Decision

**Option B.** Build Normek in the new `NormekWebsite` repo with Astro (static output), Tailwind CSS, MDX content collections and strict TypeScript. Host on Cloudflare with a preview URL for every branch. Use one small serverless function for the contact form, protected by Turnstile and server-side validation. Use cookieless analytics. No database and no CMS in v1.

Why not use the Lovable repo as the base:

1. The purpose changed. Almost every headline, section and call to action is rewritten for a company that sells enclosure design, so little code would survive anyway.
2. Client-side rendering is the wrong default for a site that must be found and shared. The last commit on the old site already works around it.
3. The contact form depends on a backend created through Lovable. We should not depend on a subscription we are leaving.
4. Heavy assets and third-party font CDNs cost performance and privacy.

What we do reuse: the content (case studies, photos, and testimonials subject to permission), the structured data approach and the `llms.txt` idea. See `docs/content-reuse-inventory.md`.

## Hosting notes

- Cloudflare's free tier allows commercial use. It includes preview deployments, serverless functions, Turnstile bot checks, cookieless web analytics and email forwarding for aliases. Cloudflare has been steering new projects toward Workers with static assets, so `web-architect` confirms whether to use Pages or Workers when scaffolding.
- Vercel's free Hobby plan is limited to personal, non-commercial use, so it is not suitable for a company. GitHub Pages cannot set custom security headers. Netlify is a fine alternative if Cloudflare is not wanted.

## The domain: normek.dk at Simply.com

Daniel owns normek.dk at simply.com, on a "Basic Suite" product (web hosting plus email). The zone was read through Simply's official connector on 2026-11-08, and the full snapshot is in `docs/ops/dns-snapshot-normek-dk-2026-11-08.md`. In short:

- The domain uses Simply's three nameservers, and **the zone is DNSSEC signed** (one DS key is published at the registry).
- The bare domain, `www` and a wildcard (`*`) all point at one Simply web server.
- Simply's standard mail records are in place: an MX record, an SPF record ending in `-all`, two DKIM keys and DMARC (both delegated to Simply by CNAME), plus mail client discovery records. **No mailboxes and no mail forwards exist yet.** No email depends on the zone today, and there is no business address yet.
- There are no hosted subdomains and no CAA record.

What follows from that:

- Cloudflare Pages serves a bare domain only when the zone is on Cloudflare nameservers. A subdomain such as `www` can use a CNAME record at any DNS provider, pointing at the project's `pages.dev` address. Add the domain in the Pages project before creating the CNAME, otherwise visitors see an error. ([Cloudflare documentation](https://developers.cloudflare.com/pages/platform/custom-domains/))
- Moving DNS away from a DNSSEC signed zone has one trap. If the old DS record is still published when the nameservers change, validating resolvers treat the domain as broken and it stops resolving. The DS record has to be removed first and given time to expire.
- Simply's DNSSEC FAQ says its nameservers sign automatically and that, for domains on other nameservers, a DS record can be added in the control panel. Simply's API and official connector can also add and remove DNSSEC keys at the registry, so each step of a migration can be done with approvals. ([Simply FAQ](https://www.simply.com/en/support/faq/domain/863-dnssec/))

Options, recommended first:

1. **Keep DNS at Simply, point only `www` to Cloudflare, and send the bare domain to `www` (recommended).** At go-live, replace the `www` A record with a CNAME to the Pages address. Send the bare domain to `https://www.normek.dk` with Simply's URL forwarding (DNS administration in the control panel, under URL forwarding). Simply says HTTPS works automatically on forwards set up there, so no certificate and no `.htaccess` file are needed. The forward replaces the bare domain's A record with Simply's forwarding server. The connector has no forwarding tool, so Daniel sets it up in the panel. DNSSEC and Simply's mail records stay untouched, and every change can be reversed in minutes. After setting it up, test that `https://normek.dk` forwards without a certificate warning. The canonical address of the site becomes `www.normek.dk`. ([Simply URL forwarding FAQ](https://www.simply.com/en/support/faq/domain/25-url-forwarding/))
2. **Move DNS to Cloudflare, later and only if needed.** This puts the bare domain on Cloudflare and gives one place for DNS. With no mailboxes yet the risk is lower, but Simply's mail records (including the CNAMEs to Simply's DKIM and DMARC) must be recreated exactly. The order matters. Record every existing DNS record, recreate them in Cloudflare, remove the DS record at Simply and wait for it to expire, switch the nameservers, confirm the site, then add Cloudflare's DS record at Simply. `devops-engineer` writes the exact steps and a rollback.
3. **Host the built site on Simply's web hosting**, which the Basic Suite already includes, by uploading files. We lose branch previews on a phone and would store hosting credentials in GitHub, so it is the least attractive.

Nothing needs to change in DNS yet. A Cloudflare preview URL works without touching the domain, and the name is not cleared.

Reading and changing the zone: use Simply's official AI connector (`https://mcp.simply.com/v2`, browser login), set up as described in `docs/ops/simply-connector.md`. Do not use an API key. Simply's v2 API keys have no documented scopes, and a key can place orders and change nameservers. ([Simply API docs](https://www.simply.com/en/docs/api/))

For `security-engineer`, none urgent: remove the wildcard record at go-live, consider a CAA record, and extend SPF and DKIM if a form service ever sends mail as normek.dk. Turn on two-factor on the Simply account, because it controls the domain. Today the web server shows a Simply placeholder, now over HTTPS with a Let's Encrypt certificate activated on 2026-11-08.

## How this replaces Lovable

| In Lovable | Here |
|---|---|
| Chat to change the site | A Claude Code session on this repo |
| Live preview | A Cloudflare preview URL for each branch, plus screenshots Claude takes and checks itself |
| Publish button | Merge to `main` |
| Visual editing | Describe the change, or edit the Markdown content directly on GitHub, even from a phone |
| Hosting and custom domain | Cloudflare plus the domain registrar |
| Built-in backend | One serverless function |

Cost: about zero, plus the domain and a mailbox. The one-time setup in Cloudflare and at the registrar takes Daniel about 30 minutes, and `devops-engineer` writes the click-by-click guide.

If Daniel gets Lovable credits for the hackathon, treat Lovable as a sketchpad for visual directions only. Lovable generates React and Vite projects, so it cannot edit an Astro repo, and this repo should not be connected to it.

## Consequences

- Good: fast, secure by default, cheap, portable, content as Markdown, easy for Claude to maintain.
- Cost: no drag-and-drop visual editor. Interactive widgets need a small React island.
- Risk: Cloudflare's product naming is moving, so confirm at scaffold time.
- Not decided here: the package manager (default npm), test tooling and CI details. `web-architect` records them when scaffolding starts.

## Amendments (web-architect, 2026-11-08)

The decision stands: Option B. These amendments fill the gaps the original left open and change four details. Facts were checked by web search on 2026-11-08. The Cloudflare and Astro documentation sites were not reachable from the session, so items marked "verify at scaffold" rest on search summaries, not on the primary page.

### A1. Cloudflare Pages, not Workers with static assets

Cloudflare now steers new projects to Workers with static assets and puts new features there. Pages is still supported. For us one fact decides it: a Workers custom domain needs the zone on Cloudflare, and a hostname with an existing CNAME cannot be attached. Pages accepts a CNAME from any DNS provider. Since DNS stays at Simply, **use Pages**. A static site plus one function moves to Workers in about an hour if the DNS ever moves, so the lock-in is small.

Wrong if: Cloudflare announces an end date for Pages, or DNS moves to Cloudflare (then reconsider Workers).

### A2. Deploy through Cloudflare's Git integration

Cloudflare builds from GitHub through its GitHub app, limited to this one repository. No Cloudflare API token is stored in GitHub. GitHub Actions runs the checks only. Preview builds are limited to one branch named `preview`, so the preview hostname stays fixed (`preview.<project>.pages.dev`) and can be put on the session's allowed list once. Assistants screenshot their own work locally with Playwright against `astro preview`. The `main` branch builds the production deployment on `<project>.pages.dev` with no custom domain until the name is cleared.

### A3. Versions and no adapter

- Astro 6 is the current major (released March 2026). It needs Node 22.12 or newer. Pin the exact Node version in `.nvmrc` and in the Pages `NODE_VERSION` setting. Default Node 22 LTS (22.23.4 is installed in cloud sessions). Move to Node 24 once Astro's `engines` field and the Pages build image both list it. Verify at scaffold with `npm view astro version engines`.
- Pure static output with **no Cloudflare adapter**. The contact function lives in `functions/api/contact.ts` as a Pages Function. The Astro 6 Cloudflare adapter had breaking changes, and we do not need server rendering.
- Tailwind CSS v4, with design tokens declared once in CSS (`@theme`), which also makes them CSS variables.

### A4. Markdown first, MDX later

Content collections use Markdown and YAML with Zod schemas. Add `@astrojs/mdx` only when a page needs a component inside prose. No React in v0 or v1.

### A5. Contact form delivery: Resend through a one-file adapter

| Option | DNS at Simply | Cost | Privacy | Verdict |
|---|---|---|---|---|
| **Resend** (HTTP API) | 3 records on a subdomain, apex untouched | Free: 3,000 a month, 100 a day | US company, Ireland sending region, account data in the US | **Recommended** |
| Postmark | 2 records on a subdomain | Free: 100 a month, then paid | US | Fallback |
| Scaleway Transactional Email | SPF, DKIM and MX on the sending domain | Free: 300 a month, then about 0.25 euros per 1,000 | EU company and data | Switch if Daniel wants EU-only processors |
| Form backend (Formspree and similar) | None | Free tiers capped | Third party stores every inquiry | Rejected |
| SMTP to smtp.simply.com from the function | None | Free | Needs the mailbox password as a secret, so a leak exposes all mail | Rejected |
| Cloudflare Email Routing send binding | Needs the zone and MX on Cloudflare | Free | Cloudflare | Not possible with DNS at Simply |

Design:

- The function checks origin, content type and size (16 KB), a honeypot, field lengths and email format, then verifies Turnstile on the server (fail closed). Then it sends one plain-text email to daniel@normek.dk with the visitor as Reply-To. No auto-reply to the visitor, so the form cannot be used to send mail to strangers.
- Private preview: no DNS change. Resend's test sender delivers only to the account owner's address [TO CONFIRM at sign-up].
- At launch: verify the subdomain `notify.normek.dk`. Records: a DKIM TXT at `resend._domainkey.notify`, plus an MX and an SPF TXT at `send.notify`. The apex SPF, MX, DKIM and DMARC records stay untouched, and DKIM on the subdomain aligns with DMARC for normek.dk. Values come from the Resend console, and `security-engineer` reviews them before Daniel approves.
- Failure: on a provider error or a 5 second timeout the function returns an error. The page keeps the visitor's text and shows the direct email address. Logs hold status codes only, never names, addresses or message text. The free daily cap of 100 is also a cost ceiling.
- Form copy asks visitors not to send confidential details before an NDA. The privacy page lists Cloudflare, Resend and Simply as processors (`legal-compliance-advisor` confirms the data processing agreements and Resend's retention).
- The provider sits behind one `sendMail()` adapter, so switching to Scaleway or Postmark is one file and a DNS change.

### A6. Turnstile and analytics

- Turnstile is free with up to 20 widgets and 10 hostnames per widget, and hostnames need not be on Cloudflare. A hostname covers its subdomains, so `<project>.pages.dev` also covers the preview alias. Add `www.normek.dk` at launch. Load the Turnstile script only when the contact form comes into view.
- No analytics during the private preview. At launch, Cloudflare Web Analytics (free and cookieless) needs ADR 0002, because its beacon is a third-party script. Its retention and sampling figures conflict between sources, so verify on Cloudflare's limits page then.

### A7. Indexing and drafts

Every deployment sends `noindex` and a disallow-all `robots.txt` until a `PUBLIC_INDEXABLE` flag is set at launch. Draft pages never reach production output (details in `docs/plan/work-breakdown.md`).

### A8. Tooling decided

npm with `npm ci`, ESLint and Prettier, `astro check`, Vitest, Playwright with axe-core, Lighthouse CI, lychee for links and gitleaks for secrets (both run as binaries, not npm packages). Dependabot for npm and GitHub Actions, with actions pinned by commit hash.

### A9. Astro 7, not Astro 6 (manager, 8 November 2026)

- `npm audit` on the newest Astro 6 release (6.4.8) reports a critical advisory (the `astro` package up to 7.3.1) and a high one in `sharp`, and the 6.x line has no fix. The plan allows no critical or high findings in production dependencies.
- Astro 7.4.7 is clean: `npm audit --omit=dev` finds 0 vulnerabilities, and the whole scaffold builds and passes lint, types, tests, `check:dist` and the accessibility tests on it.
- Astro 7 needs Node 22.23.4 or newer, which `package.json` (`engines`) and `.nvmrc` already say. Set the Pages `NODE_VERSION` variable to `22.23.4`.
- Astro and Tailwind are pinned to exact versions (Astro 7.4.7, Tailwind 4.3.5). Dependabot proposes updates after a 7 day cooldown.
- Everything else in A3 stands: static output, no adapter, the function in `functions/api/contact.ts`.
- Under a coding agent Astro 7 detaches `astro preview` into the background, so the tests start `scripts/preview-server.mjs` instead.
- The dev tooling tree has one moderate advisory (`minimatch`, reached through ESLint and typescript-eslint). It never reaches the site. CI gates on production dependencies at the high level: `npm audit --omit=dev --audit-level=high`.

### A10. Turnstile loads on first use of the form (manager, replaces the loading rule in A6)

The Turnstile script is added when a visitor first focuses or clicks a form field, not when the form scrolls into view. A visitor who only reads the page never contacts Cloudflare's challenge host. The content security policy allows `challenges.cloudflare.com` for script and frame only. `connect-src` stays `'self'`, and widening it needs a recorded violation (security review S11). The privacy notice says the same, and the browser test for local storage runs after first use.

### A11. Three font families (manager)

Barlow Semi Condensed 600, IBM Plex Sans (variable) and IBM Plex Mono 400, as the brand guide sets out. They weigh 83.4 KB as Latin woff2, inside the 100 KB font budget, and are self-hosted in `public/fonts/` with each OFL licence file. If a budget ever fails, drop the mono and set specifications in Plex Sans.

### What would make these amendments wrong

Check first: whether Pages still accepts an external CNAME for `www` (test it on a spare subdomain before launch), and Resend's message retention. If retention conflicts with the data promise, switch the adapter to Scaleway.
