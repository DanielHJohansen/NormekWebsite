# Viewing the website from a cloud session

Assistants can load and screenshot the site, so they review what visitors actually see instead of guessing.

## How it works

- Run `node scripts/screenshot.mjs <https-url>`. It opens the page in headless Chromium through the session proxy, saves screenshots at 390, 768 and 1280 px into `qa/screens/` (not committed), and prints the status, title, console errors and visible text.
- Only **HTTPS** works, and only for hosts on the environment's allowed list. The proxy cannot carry plain HTTP, other ports or WebSockets.
- Certificate errors are never bypassed. A site needs a valid certificate to be viewable.

## Hosts allowed today (environment `NormekWebsite`)

`normek.dk`, `www.normek.dk`, `www.simply.com` and `api.simply.com`.

When the hosting project exists, add its preview and production hostnames to the environment (exact names, no wildcards). An assistant can propose the change, and each change needs Daniel's approval.

## Known limits

- **A certificate error means the host is reachable but its certificate is wrong. A refusal when connecting means the host is not on the allowed list.** Keep the two apart when diagnosing.
- On 2026-11-08 `normek.dk` showed a Simply placeholder over plain HTTP (Chrome says "Not secure"). Over HTTPS the server presents a certificate for a different name (curl error 60), so the site cannot be viewed until a certificate for the name is active. Simply offers free Let's Encrypt certificates in the control panel under Website, then HTTPS protection. The domain must point at the Simply web server and `/.well-known/` must not redirect. After go-live the site is on `www.normek.dk` behind the host's own certificate, and the bare domain is a Simply URL forward, where HTTPS is automatic.
- A page that loads assets from other hosts renders unstyled unless those hosts are allowed too. Simply's own site shows this, because its stylesheet comes from `static.simply.com`. Our site self-hosts all assets, so its own hostnames are enough.
- Pages behind a login or an IP restriction cannot be viewed. If previews are protected later, how an assistant gets in is an ADR decision.
- Screenshots show what a headless browser sees. They do not replace a check on real phones.
