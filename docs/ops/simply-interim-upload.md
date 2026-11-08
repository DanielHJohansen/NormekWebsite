# Interim upload to Simply.com: the site on normek.dk today

Owner: `devops-engineer`, 2026-11-08. Status: **interim, not for launch.** The planned host is Cloudflare Pages (`docs/ops/cloudflare-and-resend-setup.md`). That project does not exist yet, so normek.dk still shows Simply's default page. This package puts the v0 site on the web hosting Daniel already has at Simply, so it can be seen at `https://normek.dk` and `https://www.normek.dk` in about 10 minutes. Delete it when the Pages project is live.

An assistant cannot upload it. The cloud session reaches Simply only over HTTPS, and FTP and SSH are closed. So Daniel uploads, with the FTP password that only he can see.

## What is different from the real site

| | Real site (Cloudflare Pages) | This package (Simply) |
|---|---|---|
| Pages, design, fonts | The same | The same |
| Contact form | Sends mail through Turnstile and Resend | **Not switched on.** A send answers "Your request was not sent", and the text under the button says to email instead |
| Security headers | `public/_headers` | Two `.htaccess` files with the same headers, without the HSTS header (a browser keeps it for a year, so it waits for the real host) |
| Privacy page | The full notice | A short true notice. The long one describes Cloudflare and Resend, which this host does not use |
| Search engines | `noindex` | `noindex` in the page, in the header and in `robots.txt`. The same |
| Third parties | One request, to Cloudflare, when the form is first touched | None. The form never loads the check without a site key |

Still on the pages: 55 dashed `[TO CONFIRM]` tags across the four pages, 31 of them on the home page and the rest mostly in the footer that every page repeats. Nothing in the text points to an internal note.

Tested on 2026-11-08: the package behind a local Apache 2.4 with `AllowOverride All`. All headers present, `/privacy` redirects to `/privacy/`, the 404 page, the font and SVG types, a year of caching on `/_astro/`, no console error, no CSP violation, one host contacted, the form answers "not sent". **Not tested: Simply's own server.** The `.htaccess` directives sit inside `IfModule` blocks, so a missing module does not break the site. A wrong directive would, which is why step 6 and the rollback exist.

## Decide first

1. **Anyone who types normek.dk can open it.** Nothing links to the domain yet, and search engines are asked to stay away, but there is no password. Never put confidential material on it. If you prefer a private preview, do not upload. Use the quick start in the Cloudflare guide instead, or ask for a password in front of this site (needs a password hash you make yourself, and an assistant then cannot take screenshots without it).
2. **The name is not cleared** (`CLAUDE.md`, "Name risk"). Putting the site on a domain you already own announces nothing and costs nothing. Do not print or buy anything because of it.

## Upload with FileZilla (Windows or Mac, free)

1. **Get the files.** Either unzip `normek-simply-package.zip` from the chat, or build it: `npm ci`, `npm run build`, `npm run package:simply`. Both give the folder `dist-simply/` with 28 files. It includes two files named `.htaccess`.
2. **Find the FTP password.** Simply control panel, your web hosting normek.dk, **Login details**. Reveal the FTP password with your Simply code. Keep it to yourself. Do not paste it into the chat, and an assistant never needs it.
3. **Connect.** Install FileZilla and open Site Manager, then New site:
   - Protocol: FTP. Host: `ftp.simply.com`. Port: 21.
   - Encryption: **Require explicit FTP over TLS**.
   - Logon type: Normal. User: `normek.dk`. Password: the one from step 2.
   - Tab Transfer Settings: limit the number of connections to 3 (Simply allows 8 per user in total).
   - Connect. FileZilla may show the server certificate once. It should name `ftp.simply.com` and a public issuer. If the name differs or FileZilla warns about a mismatch, stop and ask an assistant. Never click through a certificate warning.
4. **Back up what is there.** In the right pane open `public_html`. Select everything in it and drag it to a new folder on your PC, for example `simply-original`. Then check for a start file that would win over ours. Simply reads `index.php`, `index.phtml`, `index.shtml`, `index.htm` and then `index.html`, in that order. The page that shows today is a plain static file, so it is probably `index.html`, which ours replaces, or `index.htm`, which would hide ours. If you see one of the first four, rename it by adding `-old` to its name. The copy you just saved is the way back.
5. **Upload.** Open `dist-simply` in the left pane. Select everything inside it: the files `index.html`, `404.html`, `robots.txt` and the rest, the folders `_astro`, `fonts`, `privacy`, `thanks`, and both `.htaccess` files. Drag the selection into `public_html` on the right. It is 28 files and about 330 KB, so it takes seconds.
6. **Check the two `.htaccess` files are there.** In FileZilla choose Server, then Force showing hidden files. You should see `.htaccess` in `public_html` and in `public_html/_astro`.
7. **Look at it.** Open `https://normek.dk`, `https://www.normek.dk`, `https://normek.dk/privacy/` and a wrong address such as `https://normek.dk/nope`. Press Ctrl+F5 if the Simply page still shows.

Then tell an assistant "uploaded". It checks the headers with `curl`, takes screenshots at 390, 768 and 1280 px, and reads Simply's error log through the connector (`get-website-logs`, type `error`), so nobody has to guess why a page looks wrong.

## If something is wrong

- **Error 500 or a blank page:** delete both `.htaccess` files in FileZilla (the one in `public_html` and the one in `public_html/_astro`). The site then loads without the headers. Tell an assistant, which reads the error log and fixes the file.
- **The Simply page is still there after Ctrl+F5:** a start file that wins over `index.html` is still in `public_html`. See step 4.
- **Styles or fonts missing:** the folders `_astro` and `fonts` did not upload. Upload them again.
- **Back to how it was:** delete what you uploaded (`index.html`, `404.html`, `robots.txt`, `sitemap.xml`, the icons, the folders `_astro`, `fonts`, `privacy`, `thanks`, both `.htaccess` files), then upload the contents of `simply-original` again.

## Updating the interim site

After a change to the site, `npm run build` and `npm run package:simply`, then upload the changed files again. The packager refuses a build that is open to search engines, and it stops with an error when the text it replaces has changed, so it never ships a sentence that names Cloudflare or Resend. `tests/unit/simply-package.test.ts` covers it.

## When the real host is live

This package changes no DNS and no email. When the Pages project is live, point `www.normek.dk` at it with the DNS steps in the appendix of `docs/ops/cloudflare-and-resend-setup.md`, and send the bare domain to `www` with Simply's URL forwarding. From then on the files in `public_html` are no longer served and can be deleted.

## For assistants

- Never ask for, store or repeat the FTP password. Never create an SSH key for this.
- To test the `.htaccess` files without Simply, run Apache 2.4 locally with `AllowOverride All` and `mod_headers`, `mod_mime`, `mod_dir`, and serve a copy of `dist-simply/` from a folder the web server user can read. Drop `upgrade-insecure-requests` from the test copy only, because over plain http it turns every local request into https.
- Simply's web server answers as Apache with a valid certificate for both names (checked 2026-11-08). The start file order is `index.php`, `index.phtml`, `index.shtml`, `index.htm`, `index.html`.
