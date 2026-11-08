# ADR 0001: Stack and hosting for the Normek website

- Status: **Proposed**, waiting for Daniel's approval
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

Daniel owns normek.dk, registered and hosted at simply.com. This is what the Simply DNS panel showed on 2026-11-08, from a phone screenshot that was cut off after the `www` row:

- The domain uses Simply's nameservers and is administered through Simply.
- **The zone is DNSSEC signed.**
- There are A records for the bare domain, a wildcard (`*`) and `www`, which appear to point at Simply's own hosting addresses.
- There is an MX record that appears to point at Simply's mail servers, and an SPF record. So email probably runs on this domain today and must not break.

What follows from that:

- Cloudflare Pages serves a bare domain only when the zone is on Cloudflare nameservers. A subdomain such as `www` can use a CNAME record at any DNS provider, pointing at the project's `pages.dev` address. Add the domain in the Pages project before creating the CNAME, otherwise visitors see an error. ([Cloudflare documentation](https://developers.cloudflare.com/pages/platform/custom-domains/))
- Moving DNS away from a DNSSEC signed zone has one trap. If the old DS record is still published when the nameservers change, validating resolvers treat the domain as broken and it stops resolving. The DS record has to be removed first and given time to expire.
- Simply's DNSSEC FAQ says its nameservers sign automatically and that, for domains on other nameservers, a DS record can be added in the control panel. It does not say how to disable DNSSEC, so check the domain's DNSSEC settings or ask Simply support. ([Simply FAQ](https://www.simply.com/en/support/faq/domain/863-dnssec/))

Options, recommended first:

1. **Keep DNS at Simply, point only `www` to Cloudflare, and forward the bare domain to `www` (recommended).** At go-live, replace the `www` A record with a CNAME to the Pages address, and use Simply's URL forwarding (or an `.htaccess` redirect if a hosting plan is active) to send normek.dk to `https://www.normek.dk`. DNSSEC and email stay untouched, and the change can be reversed in minutes. To test before go-live: whether the forwarding works over HTTPS without a certificate warning. The canonical address of the site becomes `www.normek.dk`. ([Simply URL forwarding FAQ](https://www.simply.com/en/support/faq/domain/304/))
2. **Move DNS to Cloudflare, later and only if needed.** This puts the bare domain on Cloudflare and gives one place for DNS. The order matters. Record every existing DNS record, recreate them in Cloudflare and test mail, remove the DS record at Simply and wait for it to expire, switch the nameservers, confirm the site and email, then add Cloudflare's DS record at Simply. `devops-engineer` writes the exact steps and a rollback.
3. **Host the built site on Simply's web hosting** by uploading files. We lose branch previews on a phone and would store hosting credentials in GitHub, so it is the least attractive.

Nothing needs to change in DNS yet. A Cloudflare preview URL works without touching the domain, and the name is not cleared.

To review with `security-engineer`: the wildcard A record makes every subdomain resolve, and we need to confirm that DKIM and DMARC records exist. Still open: the records below `www`, what is live on the domain today, and which mailboxes exist.

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
