# Cloudflare, Turnstile and Resend: one-time setup

Owner: `devops-engineer`, for Daniel. Written 2026-11-08 and updated the same day after the security review. Plan reference: `docs/plan/work-breakdown.md` section 10 and ADR 0001. Security requirements followed: `docs/security/threat-model-and-requirements.md` sections 4 to 6 and `docs/security/review-setup-and-ci-2026-11-08.md`.

Review status: `security-engineer` reviewed the first version. Findings S2, S3, S6, S7, S9, S10, S12, S13 and S14 are applied below. S5 and S8 are done in the code (see "Open items" at the end). The review says Daniel can follow this guide once the repository question is decided (Part 0, step 0.1) and S4 is in place (`.npmrc` has `ignore-scripts=true`, so it is). Appendix A also needs a read of Simply's DMARC policy first.

## What this gets you

- A private preview of the website at `https://preview.normek-web.pages.dev`.
- A bot check for the contact form (Turnstile) and a mail service for the form (Resend).
- Permission for assistants to open the two preview addresses and take screenshots.

## What it does not do

- It changes no DNS, no email and nothing else at Simply except the safety settings in Part 0. normek.dk stays exactly as it is.
- Nothing is announced. Every deployment tells search engines to stay away (`noindex`). But the addresses have no password, so anyone who guesses one can open it. Never put confidential material on the site.

Time: about 20 minutes for Part 0 and about 45 minutes for Parts 1 to 8. Cost: 0 kr a month for the preview. Before the live launch, branch protection on a private repository needs GitHub Pro, about 4 USD a month (verify at the time). The other services have free plans (verify at the time). None of them needs a card. If a screen asks for a card, stop and ask.

Name warning: the name Normek is not cleared yet (see `CLAUDE.md`). The project name appears in the web address and probably cannot be renamed later (verify at the time). If the company name changes, we create a new project (about 15 minutes) and delete this one.

## Read this first

**Rules for secrets**

- Never paste any of these into chat, into a file in the repo, or into a GitHub issue:
  - the Resend API keys (they start with `re_`)
  - the Turnstile secret key
  - any password, recovery code or two-factor setup code
  - any Cloudflare, GitHub or Simply token or API key
- Type or paste secrets only on the provider's own page (Cloudflare or Resend). Keep a copy in your password manager.
- Keep recovery codes in the password manager and on paper kept offline. Never in cloud notes.
- Safe to share with an assistant: the project name, the web addresses, the Turnstile site key (public by design), and DNS record names and values (they are published to the whole internet).
- If a secret leaks, rotate it using the table in "If a secret leaks" near the end, then tell the assistant that it happened. Delete the key at the provider first.

**Other accounts**

Part 0 covers Simply, the mailbox and GitHub (threat model section 6, steps 1, 2 and 5). Part 1 covers Cloudflare and Part 5 covers Resend. Your Claude account (two-factor, write tools on "ask") is step 6 in section 6 of the threat model.

**How sure are the menu names?**

The Cloudflare, Resend, GitHub and Astro documentation sites could not be opened from the session that wrote this guide. Their menu names come from search summaries of the vendor documentation and from memory. Cloudflare changes its menus often. Simply's menu names come from Simply's own help articles, read through the official connector on 2026-11-08. Where a step says "(verify at the time)", the detail is weakly confirmed. If a screen looks different from this guide, trust the screen. If you are not sure, stop and ask an assistant.

**What you need**

- Your phone with an authenticator app (or a security key) for two-factor. Not text messages.
- Your Simply login and access to the mailbox `daniel@normek.dk`. Confirmation emails arrive there.
- Your GitHub login (you own `DanielHJohansen/NormekWebsite`).
- A password manager.

## The settings in one place

| Setting | Value |
|---|---|
| Project name | `normek-web` [TO CONFIRM it is free. Cloudflare tells you in Part 2] |
| Repository | `DanielHJohansen/NormekWebsite`, and no other repository |
| Production branch | `main` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | empty |
| Preview branches | Custom, include only `preview` |
| Addresses assistants may open | `normek-web.pages.dev` and `preview.normek-web.pages.dev` |

Variables (set in Part 6):

| Name | Type | Production | Preview |
|---|---|---|---|
| `NODE_VERSION` | Text | `22.23.4` | `22.23.4` |
| `PUBLIC_TURNSTILE_SITE_KEY` | Text | the Turnstile site key | the Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Secret (encrypted) | the Turnstile secret key | the Turnstile secret key |
| `RESEND_API_KEY` | Secret (encrypted) | the Resend production key | the Resend preview key |
| `CONTACT_TO` | Text | `daniel@normek.dk` | `daniel@normek.dk` |
| `ALLOWED_ORIGINS` | Text | `https://normek-web.pages.dev` | `https://preview.normek-web.pages.dev` |
| `SHOW_DRAFTS` | Text | not set | `true` |
| `PUBLIC_INDEXABLE` | none | not set | not set |

Notes on the table:

- `NODE_VERSION` must equal the number inside `.nvmrc` in the repo. Today that is `22.23.4`. Astro 7 needs Node 22.23.4 or newer (ADR 0001 amendment A9), and `.npmrc` makes the install refuse an older one. If `.nvmrc` changes, change this too.
- `ALLOWED_ORIGINS` lists the addresses the contact form accepts requests from. Scheme and host only, no trailing slash. A commit-hash preview address is rejected on purpose, so always use the `preview.` address.
- `PUBLIC_INDEXABLE` stays unset everywhere until launch day (Appendix A). `SHOW_DRAFTS` is only ever set on Preview.
- `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO` and `ALLOWED_ORIGINS` are the names in the security requirements. `PUBLIC_TURNSTILE_SITE_KEY` is the name proposed here. [TO CONFIRM with `frontend-developer`: all names must match the code, and how more than one origin is written in `ALLOWED_ORIGINS` once launch needs a second one.]

## Order of work

| Part | What | Minutes |
|---|---|---|
| 0 | Lock the doors first: repository, Simply, mailbox, GitHub | 20 (step 0.6 later, 5 more) |
| 1 | Cloudflare account and two-factor | 6 |
| 2 | Create the Pages project and connect GitHub | 10 |
| 3 | Limit previews to the `preview` branch (right after Part 2) | 4 |
| 4 | Turnstile widget | 6 |
| 5 | Resend account, two API keys and the agreement | 8 |
| 6 | Put the settings into the Pages project | 6 |
| 7 | Let assistants open the preview addresses | 2 |
| 8 | Final check | 3 |
| 9 | More GitHub safety switches (before launch) | 8 |

## Part 0. Lock the doors first (about 20 minutes)

Do this before you create the Cloudflare and Resend accounts. Simply controls the domain, and your mailbox can reset the password of every other account, so those come first. This part follows the threat model section 6 (steps 1, 2 and 5) and the review findings S1, S2, S3 and S6.

### 0.1 Decide about the code repository (about 2 minutes)

The repository `DanielHJohansen/NormekWebsite` is public today. Anyone can read the strategy notes, the name research, the threat model and the open security findings in it. Treat everything already pushed as published. Recommended: make it private. This guide is written for a private repository.

1. Open `https://github.com/DanielHJohansen/NormekWebsite`, then **Settings**, then **General**. Scroll to the **Danger Zone**, click **Change repository visibility**, then **Make private**, and confirm (verify at the time).
   - You should see: a **Private** label next to the repository name.

What private costs (verify at the time):

- Branch protection on a private repository needs GitHub Pro, about 4 USD a month. You need it before the live launch, not for the preview (step 0.6).
- GitHub Actions: private repositories on the Free plan get 2,000 minutes a month. One push uses roughly 10 minutes (an estimate, not measured yet). Public repositories do not count minutes.

If you keep it public: everything you push is published, so nothing confidential may go in (customer files, quotes, NDAs, drawings, any key). Branch protection, secret scanning and push protection are free on a public repository. Read what you push. Everything else in this guide stays the same.

Undo: the same page, **Make public**. Copies made while it was public stay out there.

### 0.2 Simply: two-factor and a tidy account (about 8 minutes)

1. Log in at `https://www.simply.com/controlpanel/`. Click your username at the top right, then **User profile**. Under **Security** click the button that turns on two-factor. Use an authenticator app. Keep the recovery codes on paper, offline. (This path is from Simply's help article on account sharing.)
   - You should see: a confirmation, and the next login asks for a 6 digit code.
2. On the same page, look at the email address of your Simply login (verify at the time where it shows). It must not be an address at `normek.dk`. The mailbox is hosted at Simply, so a lock-out would send the reset email into the account you cannot open. Use a private address that has its own two-factor.
3. In the left menu click **Account**, then **Account administration**. Under **Users** only you should be listed. Remove anyone else.
4. Open **Connected apps** in the control panel (verify at the time where). Only the Claude connector should be there (see `docs/ops/simply-connector.md`). Revoke anything else.
5. If the control panel shows login history, look for logins you do not know (verify at the time). If the domain settings offer a domain lock or transfer lock, turn it on. If they do not, skip it.

Check: log out and in again. Simply asks for a code.

Undo: switch two-factor off on the same page. Keep the recovery codes until you are sure.

### 0.3 Simply: data processing agreement (about 3 minutes)

The messages from the contact form land in your mailbox at Simply, so Simply processes personal data for you. Sign the data processing agreement before anyone but you submits the form (`docs/legal/site-legal-requirements.md`, row 3).

1. In the Simply control panel, find the data processing agreement for your account and sign it. Simply says the agreement is signed in the control panel for each account (verify at the time which menu). The text is on `https://www.simply.com/compliance/`.
2. Download a copy and keep it in your password manager or a private folder. Not in the repo.

Check: the control panel shows the agreement as signed.

Undo: none, it is a contract. Ask `legal-compliance-advisor` before you cancel it.

### 0.4 The mailbox daniel@normek.dk (about 3 minutes)

This mailbox receives the reset emails for Cloudflare, Resend and GitHub, so whoever opens it can take over all three. Simply says mail logins cannot use two-factor, because the mail protocols do not support it. The protection is a long random password and TLS in every mail app.

1. In the Simply control panel pick the product for normek.dk, click **E-mail**, click the gear icon next to the mailbox, then **Password**. Set a long random password from your password manager.
2. In every mail app, phone included, choose TLS or STARTTLS and update the saved password.
3. In the same gear menu open **E-mail logs** and look for connections you do not recognise.

Check: the mail apps still receive mail with the new password.

Undo: set a new password the same way.

### 0.5 GitHub: two-factor (about 5 minutes)

1. Click your GitHub profile picture, then **Settings**, then **Password and authentication** (verify at the time). Turn on two-factor with a passkey or an authenticator app. Keep the recovery codes on paper, offline.
   - You should see: a message that two-factor is enabled.

Check: sign out and sign in again. GitHub asks for the second step.

Undo: switch it off on the same page. Do not, unless you are locked out.

### 0.6 Protect `main` (before the live launch, not needed for the preview)

The branch `main` is what Cloudflare publishes. The rule below means nothing reaches it without passing the checks, and not even you can skip them by mistake (review S3).

Cost: on a private repository this needs GitHub Pro, about 4 USD a month (verify at the time). On a public repository it is free. Do it before the live launch. The check names only appear in the list after CI has run once.

1. Open the repository **Settings**, then **Branches**, then **Add branch protection rule** (verify at the time. The newer **Rules**, then **Rulesets** screen has the same options). Branch name pattern: `main`.
2. Tick these:
   - **Require a pull request before merging**, with 0 required approvals. You are the only person, so leave any approvals box unticked.
   - **Require status checks to pass before merging**, and **Require branches to be up to date before merging**. Add the checks **Checks**, **Lighthouse** and **Secret scan**.
   - **Do not allow bypassing the above settings**. In a ruleset, leave the bypass list empty.
3. Leave **Allow force pushes** and **Allow deletions** unticked. In a ruleset tick **Block force pushes** and **Restrict deletions**.
4. Click **Create**.

From then on a change reaches `main` only as a pull request that passed the checks, and you click merge on GitHub. That is the brake.

Check: **Settings**, then **Branches** lists the rule for `main`.

Undo: delete the rule on the same page.

## Part 1. Cloudflare account and two-factor (about 6 minutes)

1. Open `https://dash.cloudflare.com/sign-up`. Sign up with `daniel@normek.dk` and a long unique password from your password manager.
   - You should see: a message asking you to verify your email.
2. Open the confirmation email in the `daniel@normek.dk` mailbox and click the link.
   - You should see: the Cloudflare dashboard. It may offer **Add a domain**. Do not click it. Adding normek.dk would start a move of DNS away from Simply, and we are not doing that.
3. Turn on two-factor. Click your profile icon at the top right, then **My Profile**, then **Authentication**, then **Two-Factor Authentication** (verify at the time). Choose an authenticator app or a security key, scan the code, enter the 6 digit number, and store the recovery codes in your password manager and on paper.
   - You should see: a message that two-factor is enabled.
4. If a screen offers a paid plan, choose **Free**. Do not invite any other member to the account.

Check: sign out and sign in again. Cloudflare asks for a 6 digit code.

Undo: the account is free and empty. To start over, delete it from **My Profile** (verify at the time).

## Part 2. Create the Pages project and connect GitHub (about 10 minutes)

Part 2 and Part 3 are one sitting. From the moment the project exists until Part 3 is done, Cloudflare builds and publishes every branch that anyone pushes to GitHub (review S10). Tell the assistants not to push anything until you say Part 3 is finished.

1. In the left menu click **Workers & Pages**, then **Create**, then the **Pages** tab, then **Connect to Git** (verify at the time). If the Create screen only shows Workers, look near the bottom for a link that says **Looking to deploy Pages? Get started**.
   - You should see: a choice of Git providers.
2. Click **GitHub**. A GitHub window opens. Choose the account `DanielHJohansen`. Under repository access choose **Only select repositories**, pick `NormekWebsite`, and nothing else. Click **Install & Authorize**. GitHub may ask for your password or passkey.
   - You should see: Cloudflare again, with `NormekWebsite` in the repository list.
3. Select `NormekWebsite` and click **Begin setup**.
4. Fill in the form with the values from "The settings in one place":
   - Project name: `normek-web`. If Cloudflare says the name is taken, stop. Tell an assistant before choosing another one, because the name appears in Parts 4, 6 and 7 and in the addresses.
   - Production branch: `main`.
   - Framework preset: **Astro**. Cloudflare fills in the build command and output directory. Check that they read `npm run build` and `dist`.
   - Root directory: leave empty.
5. Open **Environment variables (advanced)** and add one variable: name `NODE_VERSION`, value `22.23.4`. First open `.nvmrc` in the repo on GitHub and check that it still says the same number. If `.nvmrc` does not exist, skip this variable for now and add it in Part 6.
6. Click **Save and Deploy**.
   - You should see: a build log. The first build on `main` may show **Failed**, for example because the site code is not on `main` yet. That is expected and harmless. Nothing is announced.

Check: in GitHub, open your profile **Settings**, then **Applications**, then **Installed GitHub Apps** (verify at the time). The Cloudflare app is listed and has access to 1 repository.

Undo: in the Cloudflare project, open **Settings**, scroll down and delete the project. To remove GitHub access, open the same GitHub page as in the check and uninstall the Cloudflare app.

## Part 3. Limit previews to the `preview` branch (about 4 minutes)

Do this right after Part 2 and before anything is pushed to GitHub. Until it is done, every branch gets built (review S10).

1. Open the project, then **Settings**, then **Builds**, then **Branch control** (verify at the time. An older name is **Builds & deployments**).
2. Under **Preview branch** choose **Custom branches**. In **Include** type `preview`. Leave **Exclude** empty. Save.
   - You should see: `preview` as the only entry.
3. Keep **Automatic production branch deployments** on, so `main` builds.
4. Leave any **Access policy** or **Enable access policy** switch in the project settings off (verify at the time). It would put a login in front of the preview, and then assistants cannot take screenshots (see `docs/ops/viewing-the-site.md`).
5. Create the `preview` branch on GitHub. Open `https://github.com/DanielHJohansen/NormekWebsite`, click the branch menu at the top left, type `preview`, and click **Create branch: preview from main**.
6. Tell the assistants they may push again.

How previews work from now on: only commits pushed to the branch `preview` get a preview site. Other branches are not built on Cloudflare (GitHub still checks them). An assistant moves the latest work into `preview` when you ask to see it. The `main` branch builds the production address `https://normek-web.pages.dev`. It is also `noindex`, and it will not show draft pages. The `preview` address shows draft pages with a "Draft" banner, so you can review templates on your phone.

Check: after the first successful build on `preview`, the project's **Deployments** tab lists a **Preview** deployment, and `https://preview.normek-web.pages.dev` opens on your phone. Until a build succeeds, you may see a Cloudflare "nothing here" page. That is fine. Also check that pushing some other branch creates no deployment.

Undo: set **Preview branch** back to **All non-Production branches**, or **None** to stop preview builds. Delete the `preview` branch on GitHub if you do not want it.

## Part 4. Turnstile widget (about 6 minutes)

Turnstile is Cloudflare's bot check for the contact form. It is free. The bot check loads when a visitor first clicks or focuses a form field, not when the page opens (ADR 0001 amendment A10). So you will not see it until you click into the form.

1. In the Cloudflare left menu click **Turnstile**, then **Add widget** (verify at the time).
2. Widget name: `normek-web`.
3. Hostname management: add `normek-web.pages.dev` and nothing else. A hostname also covers its subdomains, so `preview.normek-web.pages.dev` works too (verify at the time, the preview test in Part 8 proves it). `www.normek.dk` is added at launch.
4. Widget mode: **Managed**. Pre-clearance: leave off.
5. Click **Create**.
   - You should see: a **Site key** and a **Secret key**.
6. Copy both into your password manager now, labelled clearly. The site key is public. The secret key is secret, so never put it in chat or in the repo.

Check: the widget is listed under **Turnstile** with the hostname `normek-web.pages.dev`. A real test happens when the form exists, because the form sends a test message from the preview.

Undo: open the widget, then **Settings**. **Rotate Secret Key** gives a new secret. The old one keeps working for about 2 hours (verify at the time). Or delete the widget, then create a new one and repeat Part 6.

## Part 5. Resend account, two API keys and the agreement (about 8 minutes)

Resend sends the contact form message to your mailbox. It is free for up to 3,000 emails a month and 100 a day (verify at sign-up).

1. Open `https://resend.com/signup`. Sign up with `daniel@normek.dk` and confirm the email.
   - Why this address: Resend's free test sender may only deliver to the address that owns the account (verify at sign-up). That is also the inbox that should receive the website messages.
2. Turn on two-factor. Look in your profile or account settings for **Two-factor authentication** (verify at the time). If Resend does not offer it, use a long unique password from your password manager and tell an assistant. Do not invite any team member.
3. In the left menu click **API Keys**, then **Create API Key**. Make two keys, one at a time:
   - First key, name `normek-web-preview`.
   - Second key, name `normek-web-production`.
   - For each: permission **Sending access**. Do not choose **Full access**. Domain: **All domains** (or whatever is the only option, because no domain is verified yet). Click **Add**.
   - You should see: a key that starts with `re_`. It is shown once.
4. Copy each key into your password manager at once, labelled preview or production. Then go to Part 6 and paste each into its own Cloudflare environment. If you lose a key, delete it and create a new one.
   - Why two keys: if one leaks you delete only that one, and the other environment keeps working. The security requirements ask for one key per environment.
5. Look at two facts and tell an assistant in plain words (no keys). `legal-compliance-advisor` needs them for the privacy page. First, does Resend say the test sender only delivers to your own address? Second, how long does Resend keep the content of sent emails (look under settings, logs or the emails page for a retention line)?
6. Accept Resend's data processing agreement. Find it in Resend's account settings or its legal documents (verify at the time) and accept or sign it. Keep a copy in your password manager or a private folder, not in the repo. `docs/legal/site-legal-requirements.md` row 3 says to do this before anyone but you submits the form.

Check: **API Keys** lists both keys with the permission **Sending access**, and Resend shows the agreement as accepted, or you hold the signed copy.

Undo: on the **API Keys** page open the menu on a key's row and delete it. The account itself can be deleted in settings (verify at the time).

## Part 6. Put the settings into the Pages project (about 6 minutes)

1. Open **Workers & Pages**, then the project `normek-web`, then **Settings**, then **Variables and Secrets** (verify at the time. An older name is **Environment variables**).
   - If the page says the variables are managed by a configuration file (wrangler), stop and tell an assistant. Do not work around it.
2. Choose the **Production** environment. Add the variables from the "Production" column of the table in "The settings in one place". `NODE_VERSION` may already be there from Part 2, so check its value instead of adding it twice. For `TURNSTILE_SECRET_KEY` and `RESEND_API_KEY` choose the type **Secret** (or tick **Encrypt**), so the value becomes write-only. `RESEND_API_KEY` here is the **production** key.
3. Choose the **Preview** environment. Add the variables from the "Preview" column, including `SHOW_DRAFTS` with the value `true`. `RESEND_API_KEY` here is the **preview** key.
4. Do not add `PUBLIC_INDEXABLE` anywhere.
5. Leave request logs and observability for Functions off, which is the default (verify at the time). The security requirements say no personal data in logs.
6. Create no firewall (WAF) rule and no rate limiting rule in Cloudflare (review S7). The domain is not on Cloudflare, so a WAF rule cannot work. For the preview, risk R7 (someone filling your inbox with form messages) is accepted. The only brakes are Turnstile and Resend's limit of 100 emails a day. `web-architect` decides the rate limit binding before launch (Appendix A).
7. Rebuild so the build sees the variables. Open the project's **Deployments** tab, open the latest deployment, and click **Retry deployment** (verify at the time). Variable changes probably apply only to new deployments.

Check:

- Production lists 6 variables and Preview lists 7 (the extra one is `SHOW_DRAFTS`).
- The two secrets show as hidden or encrypted in both environments.
- `PUBLIC_INDEXABLE` appears nowhere.

Undo: delete a variable with its bin icon, or replace a secret with a new value. To make the site stop showing drafts on preview, delete `SHOW_DRAFTS` from Preview and redeploy.

## Part 7. Let assistants open the preview addresses (about 2 minutes)

Assistants can only open web addresses on the session's allowed list. An assistant will ask to add two.

1. When Claude shows an approval prompt about the network of the session environment (named `NormekWebsite`), read it. It must add exactly these two names and nothing else:
   - `normek-web.pages.dev`
   - `preview.normek-web.pages.dev`
2. If the prompt lists anything else, such as a wildcard like `*.pages.dev`, another host, or unrestricted network access, choose **No** and tell the assistant. Otherwise approve.

Check: ask an assistant to run `node scripts/screenshot.mjs https://preview.normek-web.pages.dev/`. A page and a screenshot mean it works. A refusal when connecting means the host is not on the list yet. A certificate error means the host is reachable but its certificate is wrong. Keep those two apart.

Undo: open the environment settings in Claude and remove the two hosts (verify at the time), or ask an assistant to propose the removal.

## Part 8. Final check (about 3 minutes)

Tick each line. Ask an assistant to check the last four.

- [ ] Part 0 is done: two-factor at Simply and GitHub, a new long mailbox password, and the repository is private (or you decided on purpose to keep it public).
- [ ] Both data processing agreements are accepted and you hold copies: Simply's (step 0.3) and Resend's (Part 5, step 6).
- [ ] Cloudflare: two-factor is on, and you are the only member. The Pages project `normek-web` exists with production branch `main`.
- [ ] Cloudflare: **Branch control** shows only `preview` for preview branches.
- [ ] GitHub: the Cloudflare app has access to 1 repository.
- [ ] Pages variables match the table in "The settings in one place".
- [ ] Turnstile: the widget exists with the hostname `normek-web.pages.dev`.
- [ ] Resend: the keys `normek-web-preview` and `normek-web-production` exist with **Sending access** only.
- [ ] Assistants can open both preview addresses (Part 7).
- [ ] Nothing changed at Simply. An assistant reads the zone through the connector and compares it with `docs/ops/dns-snapshot-normek-dk-2026-11-08.md`. It should be identical.
- [ ] Search engines are kept out. An assistant opens the preview page and `/robots.txt` and confirms `noindex` and a disallow-all rule. This works once the site code is deployed.
- [ ] Turnstile storage test, done by an assistant once the form is on the preview. In a fresh private window open `https://preview.normek-web.pages.dev/`. List the cookies, local storage and session storage for the site and for `challenges.cloudflare.com` before touching the form. Then click into the first form field, wait for the bot check to appear, and list them again. Also confirm the browser console shows no Content Security Policy errors. Hand both lists to `legal-compliance-advisor` (`docs/legal/site-legal-requirements.md` row 4). The privacy page cannot say "no cookies" until this is done.

## Part 9. More GitHub safety switches (about 8 minutes, before launch)

The security review (risk R4 and findings S3 and S9) wants these done before launch. They cost nothing. The branch rule for `main` is Part 0, step 0.6.

1. Installed apps. Open your profile **Settings**, then **Applications**, then **Installed GitHub Apps**. Only the Cloudflare app should be there, with access to this one repository.
2. Dependabot alerts and security updates. In the repository open **Settings**, then **Code security** (verify at the time), and turn on **Dependabot alerts** and **Dependabot security updates**. Dependabot version updates start by themselves, weekly, once `.github/dependabot.yml` is on `main`. They wait 7 days after a release before proposing it (ADR 0001 amendment A9).
3. Secret scanning and push protection. Turn both on in the same place. They are free on a public repository. On a private repository GitHub may sell them as a paid add-on (verify at the time). If so, skip them. The CI secret scan covers the history and the built site.
4. Pinned actions. The GitHub Actions in `.github/workflows/ci.yml` are already pinned to full commit hashes (done on 2026-11-08), so switch the policy on now. Open **Settings**, then **Actions**, then **General**, and tick **Require actions to be pinned to a full-length commit SHA** (verify at the time).
5. Actions settings, on the same page:
   - **Workflow permissions**: choose **Read repository contents and packages permissions**.
   - Untick **Allow GitHub Actions to create and approve pull requests**.
   - For pull requests from forks and outside collaborators, choose the option that requires approval for all outside contributors (verify the wording at the time).
   - Save.

Undo: untick the switch or change the setting back.

## If a secret leaks

| Secret | What to do |
|---|---|
| A Resend API key | In Resend, **API Keys**: delete that key at once. Create a new one with the same name, replace `RESEND_API_KEY` in that Pages environment, retry the deployment, and send a test message. Then look at Resend's sent log for messages you did not send |
| Turnstile secret key | In Turnstile, open the widget, **Settings**, **Rotate Secret Key**. Replace `TURNSTILE_SECRET_KEY` in both Pages environments and retry both deployments |
| Cloudflare password or two-factor | Change the password, reset two-factor, and review active sessions and the audit log in **My Profile** (verify at the time) |
| The mailbox password | Set a new long random password (step 0.4), then change the passwords of Cloudflare, Resend and GitHub, because the mailbox can reset all of them |

Then tell the assistant that it happened, without repeating the secret. If a secret ever lands in the repo, the secret scan in CI fails. Delete the key at the provider first, then ask an assistant to clean up.

A routine rotation with no leak is gentler. Section 5 of the threat model says: create the new key first, update the Pages secret in both environments, redeploy, send a test message, then delete the old key.

## If something looks different

| What you see | What it means |
|---|---|
| The first build fails with "missing script: build" or no `package.json` | The site code is not on that branch yet. Expected until the scaffold is merged |
| A build fails complaining about the Node version | `NODE_VERSION` does not match `.nvmrc`. Astro 7 needs 22.23.4 or newer. Fix the variable and retry the deployment |
| Cloudflare builds a branch that is not `preview` | Part 3 is not done or not saved. Fix it, then delete the unwanted deployments |
| The preview address shows a Cloudflare "nothing here" page | No build has succeeded on the `preview` branch yet |
| The variables page is locked or mentions a wrangler file | Stop and tell an assistant |
| The form shows no bot check | It loads on first click into a field (amendment A10). If it still does not appear after a click, the widget hostname is missing (Part 4) or `PUBLIC_TURNSTILE_SITE_KEY` was set after the last build. Retry the deployment |
| The console says "Invalid sitekey" | The widget hostname is missing (Part 4) |
| The form is refused with a 403 on a preview | You opened a commit-hash address. Use `https://preview.normek-web.pages.dev`, or check `ALLOWED_ORIGINS` |
| The form fails with a 500 | A required variable is missing (`RESEND_API_KEY`, `CONTACT_TO`, `ALLOWED_ORIGINS` or `TURNSTILE_SECRET_KEY`). Check Part 6 |
| An assistant cannot open a preview address | The host is not on the allowed list (Part 7) |

## Open items

Not done yet. Each one changes `package.json`, the build or a decision, so it waits for the right person.

1. Lighthouse tool in the lockfile (review S5). Done on 8 November 2026 by `frontend-developer`: `@lhci/cli` 0.15.1 is a dev dependency, its packages are in the lockfile, and CI runs `npx lhci autorun --config=./lighthouserc.json` with nothing fetched. The full `npm audit` now lists advisories in that tool's packages (dev only). `npm audit --omit=dev`, which CI gates on, stays at 0.
2. Headers at launch (review S8). Done on 8 November 2026 by `frontend-developer`: the build writes `dist/_headers` (`scripts/lib/build-headers.mjs`). Without `PUBLIC_INDEXABLE` it is a copy of `public/_headers`. With `PUBLIC_INDEXABLE=true` it drops the global `noindex` line and adds `noindex` rules for `https://:project.pages.dev/*` and `https://:version.:project.pages.dev/*`. `npm run check:dist` validates the variant that was built.
3. Simply's DMARC policy is unread (threat model section 4, check 6). It is needed before A6. Owner: an assistant, through the connector or a DNS lookup.

---

# Appendix A. Launch day (NOT FOR NOW)

Do not do any of this until Daniel says go. These steps make the site public on `www.normek.dk`.

## Before you start (all must be true)

1. The name is cleared: CVR (datacvr.virk.dk), EUIPO TMview, the Danish Patent and Trademark Office, and a trademark professional's view. See "Name risk" in `CLAUDE.md`.
2. The preview gate has passed (`qa-accessibility-engineer` and `security-engineer`), `legal-compliance-advisor` has signed off, and no `[TO CONFIRM]` is left in the site.
3. The security launch gate is met: risks R1 to R4 are closed and the section 4 checks have passed (`docs/security/threat-model-and-requirements.md` section 7).
4. `security-engineer` has reviewed every DNS record below with its exact value, in writing.
5. Branch protection on `main` is on (Part 0, step 0.6), and GitHub Pro is paid if the repository is private.
6. `web-architect` decides the rate limit binding for the contact function (threat model section 3.1). Until then the only brakes are Turnstile and Resend's daily limit.
7. The three open items above are closed.

## Rules for every DNS change (from `docs/ops/simply-connector.md`)

- Only normek.dk. Use Simply's official connector. Never create or share a Simply API key.
- Read the whole zone first and save a snapshot in `docs/ops/`.
- One change at a time. The assistant states the record before and after. Daniel approves. The assistant applies it and reads it back.
- Do not touch the existing MX, SPF, DKIM or DMARC records at normek.dk, the nameservers or the DNSSEC keys. The new Resend records below are on a subdomain and need `security-engineer`'s written review.
- Lower the TTL of a record before changing it. Keep the old record ready to restore.
- DNSSEC stays on. Simply signs new records automatically (verify at the time).

## A1. Add the custom domain in Pages first (about 5 minutes)

1. Open the project `normek-web`, then **Custom domains**, then **Set up a custom domain**. Enter `www.normek.dk` and continue.
   - You should see: Cloudflare names the target for the CNAME record (expected: `normek-web.pages.dev`) and waits for DNS. The status stays pending until A4 is done.
2. Do this before the DNS change. A CNAME without the domain added in Pages gives visitors an error.

Undo: remove the custom domain from the project.

## A2. Allow the new address in the form settings (about 3 minutes)

Do this before the site goes live, so the form works on day one.

1. Pages, Production environment: change `ALLOWED_ORIGINS` so it also allows `https://www.normek.dk` (format [TO CONFIRM with `frontend-developer`]). Keep `https://normek-web.pages.dev` only if the security review wants it. Retry the deployment.
2. Turnstile: open the widget, then **Settings**, then hostname management, and add `www.normek.dk`.

Undo: put the old values back.

## A3. Lower the TTL on `www` (about 2 minutes, then wait an hour)

Today `www` is an A record to `185.20.205.55` with TTL 3600. Ask the assistant to change only the TTL to 300 through the connector, and wait at least one hour before A4, so old answers expire.

Undo: set the TTL back to 3600.

## A4. Replace the `www` A record with a CNAME (about 5 minutes)

1. Delete the A record `www`. A CNAME cannot sit next to another record with the same name. The wildcard `*` A record keeps answering for `www` during the swap, so there is no gap.
2. Add a CNAME: name `www`, target exactly what Cloudflare showed in A1 (expected `normek-web.pages.dev`), TTL 300. If Simply's form asks for a trailing dot, add one.
3. The assistant reads the zone back.

Check:

- `dig +short www.normek.dk CNAME` returns `normek-web.pages.dev.`
- In Pages, **Custom domains** shows `www.normek.dk` as **Active** (the certificate can take a few minutes to an hour, verify at the time).
- `https://www.normek.dk` opens the site with no certificate warning.

Undo: delete the CNAME `www` and add back the A record `www` to `185.20.205.55` with TTL 3600 (record values are in `docs/ops/dns-snapshot-normek-dk-2026-11-08.md`).

## A5. Send the bare domain to `www` (Daniel, in the Simply panel, about 5 minutes)

The connector has no forwarding tool, so Daniel does this one himself.

1. Log in at Simply. Open the product for normek.dk, then the DNS administration, then **URL forwarding** (verify at the time).
2. Add a forward from `normek.dk` to `https://www.normek.dk`. Choose a permanent redirect if offered. Simply says HTTPS works on these forwards without any extra step (verify at the time). Setting it up replaces the bare domain's A record with Simply's forwarding server.

Check: open `https://normek.dk` in a private browser window. It lands on `https://www.normek.dk/` with no certificate warning. An assistant can confirm with `curl -sI https://normek.dk`, which should show a redirect with `location: https://www.normek.dk/`.

Undo: delete the forward in the panel. If the panel removed the A record for `@`, add it back: `@` to `185.20.205.55`, TTL 3600.

## A6. Resend sending domain on a subdomain (about 15 minutes plus waiting)

The plan is to verify `notify.normek.dk` in Resend, so the records at normek.dk itself stay untouched.

1. In Resend open **Domains**, then **Add Domain**. Enter `notify.normek.dk`. Choose the Ireland region (verify at the time).
2. Resend then shows three records. Per ADR 0001 they are:
   - a DKIM record, type TXT, name `resend._domainkey.notify`
   - an MX record, name `send.notify`
   - an SPF record, type TXT, name `send.notify`

   The exact names, the MX target and priority, and all values come from the Resend console and must be copied from there. They are public DNS data, so it is fine to hand them to an assistant. Some forms want the name with `.normek.dk` added, and some want it left off.
3. Skip any extra record Resend suggests, such as a DMARC record. At normek.dk `_dmarc` is a CNAME to Simply, and a TXT record next to it is invalid DNS. Also never put a CNAME at `notify` itself.
4. Read Simply's DMARC policy first, the one behind the `_dmarc` CNAME (open item 3). If it uses strict alignment (`adkim=s` or `aspf=s`), mail must come from an address at `notify.normek.dk`, never at `normek.dk`. Note the `p` and `sp` values too. Under `quarantine` or `reject` a mistake hides inquiries.
5. `security-engineer` reviews the three records in writing, using the eight checks in `docs/security/threat-model-and-requirements.md` section 4. The key ones: the names resolve as `resend._domainkey.notify.normek.dk` and `send.notify.normek.dk` (not `...normek.dk.normek.dk`), the long DKIM value matches the console exactly, and the apex still has exactly one SPF record, unchanged.
6. The assistant adds the records through the connector, one at a time, with Daniel's approval for each, and reads each back.
7. In Resend click **Verify DNS Records**. This can take minutes to a few hours.
8. Turn off **Open tracking** and **Click tracking** for this domain (verify at the time where the switches are). Click tracking would rewrite the links in the message (review S12).
9. Limit the production API key to the verified domain `notify.normek.dk` (edit the key, or create a new one and swap it into Pages). Retry the deployment.

Check:

- `dig +short TXT resend._domainkey.notify.normek.dk`
- `dig +short MX send.notify.normek.dk`
- `dig +short TXT send.notify.normek.dk`
- Resend shows the domain as **Verified**.
- DNSSEC still validates (DNSViz or a validating resolver shows no errors).
- Send one test message from the form. In the received message open the source (in Gmail: three dots, then **Show original**). It should show `dkim=pass header.d=notify.normek.dk` and `dmarc=pass`, and SPF should say PASS.

Undo: delete the three records and the domain in Resend. The apex records were never touched.

Afterwards an assistant changes the sender address in the contact function to an address on `notify.normek.dk` [TO CONFIRM which address].

## A7. Turn the site on for search engines (when Daniel says go)

1. First an assistant runs `PUBLIC_INDEXABLE=true npm run build` and then `npm run check:dist` on `main`. It must pass. Launch mode rejects any leftover `[TO CONFIRM]`, and an empty or test Turnstile site key (`PUBLIC_TURNSTILE_SITE_KEY` has to be set in the Production environment before the build).
2. In Pages, add `PUBLIC_INDEXABLE` with the value `true` on the **Production** environment only, never on Preview. Retry the production deployment.
3. Check the headers with `curl -sI`. `https://normek-web.pages.dev` must still send `X-Robots-Tag: noindex`. So must a commit-hash address from the **Deployments** tab, such as `https://<hash>.normek-web.pages.dev`. `https://www.normek.dk` must not send it.

Undo: delete `PUBLIC_INDEXABLE` from Production and retry the deployment. Then ask for removal of any indexed pages in Search Console.

## A8. After launch

1. Analytics: none until ADR 0002 is accepted.
2. Cleanup from the security review (risk R11). Each is its own approved DNS change after the site works:
   - Remove the wildcard `*` A record. First read the zone and confirm that no hostname relies on it. Undo: add `*` as an A record to `185.20.205.55` again.
   - Add a CAA record. The list of certificate authorities [TO CONFIRM] must include the ones Cloudflare uses for Pages certificates and the one Simply's URL forwarder uses for the bare domain. A wrong CAA record stops certificates from being issued or renewed, so `security-engineer` signs off the exact list first. Undo: delete the CAA record.
