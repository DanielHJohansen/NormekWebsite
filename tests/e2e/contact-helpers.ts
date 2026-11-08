/**
 * Helpers for the contact form tests. Nothing here talks to Cloudflare or to a mail provider:
 *  - the Turnstile script is replaced by a small fake that hands out tokens,
 *  - POST /api/contact is answered by the test,
 *  - the site key is set from the test, because the build has none (PUBLIC_TURNSTILE_SITE_KEY is empty).
 * The key below is Cloudflare's public dummy key for tests. It is never used outside this folder.
 */
import type { Page, Route } from "@playwright/test";

export const DUMMY_SITE_KEY = "1x00000000000000000000AA";

const TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js*";

/** What the fake widget saw, read back by the tests. */
export interface TurnstileCalls {
  renders: Array<{ sitekey: string; action: string; appearance: string }>;
  resets: number;
  tokens: string[];
}

const FAKE_TURNSTILE = `
(() => {
  const calls = { renders: [], resets: 0, tokens: [] };
  window.__turnstile = calls;
  let options = null;
  let seq = 0;
  const issue = () => {
    const token = 'TEST-TOKEN-' + (++seq);
    calls.tokens.push(token);
    setTimeout(() => options && options.callback(token), 5);
  };
  window.turnstile = {
    render(container, opts) {
      options = opts;
      calls.renders.push({ sitekey: opts.sitekey, action: opts.action, appearance: opts.appearance });
      issue();
      return 'widget-1';
    },
    reset() { calls.resets += 1; issue(); },
    remove() {},
  };
  window.__turnstileError = () => options && options['error-callback']();
})();
`;

/** Gives the form a site key before its script reads it. Without this the form has none, as in the preview. */
export async function useSiteKey(page: Page, key: string = DUMMY_SITE_KEY): Promise<void> {
  await page.addInitScript((siteKey) => {
    const apply = (): void => {
      document.querySelector("[data-contact-form]")?.setAttribute("data-sitekey", siteKey);
    };
    apply();
    new MutationObserver(apply).observe(document, { childList: true, subtree: true });
  }, key);
}

/** Serves the fake widget, or makes the script fail to load. Returns the addresses asked for. */
export async function mockTurnstile(
  page: Page,
  mode: "works" | "blocked" = "works",
): Promise<string[]> {
  const requested: string[] = [];
  await page.route(TURNSTILE_URL, async (route) => {
    requested.push(route.request().url());
    if (mode === "blocked") return route.abort("blockedbyclient");
    return route.fulfill({ contentType: "application/javascript", body: FAKE_TURNSTILE });
  });
  return requested;
}

export const turnstileCalls = (page: Page): Promise<TurnstileCalls | undefined> =>
  page.evaluate(() => (window as unknown as { __turnstile?: TurnstileCalls }).__turnstile);

/** One request the form sent to the function. */
export interface Sent {
  method: string;
  contentType: string;
  fields: URLSearchParams;
}

export type Answer =
  { status: number; json: unknown } | { status: number; text: string } | "network-error" | "hang";

/**
 * Answers POST /api/contact with what the test says. The answer can depend on the request,
 * for example to fail once and then succeed.
 */
export async function mockContact(
  page: Page,
  answer: Answer | ((sent: Sent, index: number) => Answer),
): Promise<Sent[]> {
  const sent: Sent[] = [];
  await page.route("**/api/contact", async (route: Route) => {
    const request = route.request();
    const entry: Sent = {
      method: request.method(),
      contentType: request.headers()["content-type"] ?? "",
      fields: new URLSearchParams(request.postData() ?? ""),
    };
    sent.push(entry);
    const chosen = typeof answer === "function" ? answer(entry, sent.length - 1) : answer;
    if (chosen === "network-error") return route.abort("connectionfailed");
    if (chosen === "hang") return; // Never answered. The test releases the page by closing it.
    if ("json" in chosen) {
      return route.fulfill({ status: chosen.status, json: chosen.json });
    }
    return route.fulfill({ status: chosen.status, contentType: "text/html", body: chosen.text });
  });
  return sent;
}

export const VALID = {
  name: "Ada Lovelace",
  email: "ada@example.dk",
  company: "Analytical Engines ApS",
  message: "We need an enclosure for a battery powered sensor board with an antenna.",
} as const;

export async function fillForm(page: Page, values: Partial<typeof VALID> = VALID): Promise<void> {
  for (const [field, value] of Object.entries(values)) {
    await page.locator(`#contact-${field}`).fill(value);
  }
}

/** The text the script shows for a message key or a notice, read from the inert templates in the markup. */
export async function copyOf(page: Page, key: string): Promise<string> {
  return page.evaluate((wanted) => {
    const messages = document.querySelector<HTMLTemplateElement>("template[data-messages]");
    const notice = document.querySelector<HTMLTemplateElement>(`template[data-notice="${wanted}"]`);
    const element =
      messages?.content.querySelector(`[data-message="${wanted}"]`) ?? notice?.content ?? null;
    return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
  }, key);
}
