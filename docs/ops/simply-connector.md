# Simply.com connector: setup and rules of use

Simply.com publishes an official AI connector (an MCP server) at `https://mcp.simply.com/v2`. It signs in through the browser with OAuth, so there is no API key to create or store. Access can be revoked at any time in the Simply control panel under Connected apps.

Status: connected and read-tested on 2026-11-08, with no changes made.

## Why the connector and not an API key

I read Simply's public API specification on 2026-11-08. An API key (created under Account, API keys) has no documented scopes. Whoever holds one can change DNS records, change nameservers, add or remove DNSSEC keys, create mail accounts and place orders, which are charged at once if a card is on file. The connector keeps the key out of our hands, can be revoked in one click, and sends purchases to an order link that Daniel completes on the website.

**Never create, request or store a Simply API key for this project.**

## One-time setup (about 5 minutes, Daniel)

1. In Claude on the web or desktop, go to Settings, Connectors, Add custom connector. Use the name Simply.com and the address `https://mcp.simply.com/v2`.
2. Connect, then log in to Simply in the browser and approve. If the consent screen offers a read-only choice, take it for the first session.
3. Open the connector's tool permissions at claude.ai/customize/connectors. Allow the tools that only read. Set every tool that changes something (adding, updating or deleting DNS records, mail accounts and mail forwards, setting nameservers, adding or removing DNSSEC keys) to ask first. Keep the nameserver and DNSSEC tools off until we need them.
4. Start a new Claude Code session on this repo. Connectors are read when a session starts.

## Rules of use for assistants

- **Only normek.dk.** The connector can see every product on Daniel's Simply account. List products only to find the handle, and never read, list or change anything on another product.
- **Read first.** Before any change, list the full zone and save a snapshot in `docs/ops/` (records only, no secrets).
- **One change at a time.** State the exact record before and after, wait for Daniel's approval, apply it, then read it back.
- **Protected records.** Do not touch MX, SPF, DKIM or DMARC records, nameservers or DNSSEC keys without a written plan reviewed by `security-engineer`.
- **Rollback.** Lower the TTL of a record before changing it, and keep the old record ready to restore.
- **Mail.** Do not create mail accounts or forwards unless Daniel asks. Never ask for or store a mail password.
- **Cleanup.** Revoke the connector in the Simply control panel when it is no longer needed.

## Planned first change (at go-live, after the name is cleared)

1. Read the zone and save the snapshot.
2. Lower the TTL on the `www` record.
3. Add the domain in the hosting project first, then replace the `www` A record with a CNAME to the host's address.
4. Send the bare domain to `www` with Simply's URL forwarding in the control panel (DNS, then URL forwarding). The connector has no forwarding tool, so Daniel sets it up. Simply says HTTPS works automatically on these forwards. Test that `https://normek.dk` forwards without a certificate warning.
5. Read the records back, check the site, and keep the old record as the rollback.
