/**
 * Loads Cloudflare Turnstile on first use (ADR 0001 amendment A10) and hands out its token.
 *
 * The script is added the first time a visitor focuses or clicks in the form, never before, so someone who only reads
 * the page never contacts Cloudflare's challenge host. The widget is rendered explicitly with the action "contact"
 * and the appearance "interaction-only" (managed mode, no puzzle for a normal visitor).
 * A token works once. After every answer that is not a success the caller resets the widget and waits for a new one.
 *
 * Two kinds of failure, because the visitor needs a different text for each:
 *  - "unavailable": the check cannot run here. There is no site key (the preview before the Cloudflare setup), the
 *    script is blocked (an extension, a firewall, no network) or the widget will not start. Nothing was checked and
 *    nothing was sent, so the caller says the request was not sent. It fails at once, and the next submit asks again:
 *    the script element is removed when it errors, so a retry loads it again (QA-01 and G9 of the November 2026 gates).
 *  - "blocked": the widget ran and gave no token (it reported an error, or it took too long).
 */

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TokenResult =
  /** A fresh token for the request. */
  | { readonly status: "token"; readonly token: string }
  /** The check cannot run: no site key, the script is blocked or the widget threw when it started. */
  | { readonly status: "unavailable" }
  /** The check ran and gave no token: the widget reported an error or it took too long. */
  | { readonly status: "blocked" };

export interface TurnstileHandle {
  start(): void;
  getToken(timeoutMs?: number): Promise<TokenResult>;
  reset(): void;
}

type Failure = "unavailable" | "blocked";

export function createTurnstile(container: HTMLElement, siteKey: string): TurnstileHandle {
  /** The script element while it loads and after it has loaded. Gone again when it fails, so a retry can ask again. */
  let script: HTMLScriptElement | undefined;
  let widgetId: string | undefined;
  /** True when api.render threw, so the next attempt may call it again. */
  let renderFailed = false;
  let token: string | null = null;
  let failure: Failure | null = null;
  let changed: Array<() => void> = [];

  const announce = (): void => {
    const waiting = changed;
    changed = [];
    for (const wake of waiting) wake();
  };

  const nextChange = (): Promise<void> => new Promise((resolve) => changed.push(resolve));

  function fail(kind: Failure): void {
    token = null;
    failure = kind;
    announce();
  }

  function render(): void {
    const api = window.turnstile;
    if (!api) {
      fail("unavailable");
      return;
    }
    try {
      widgetId = api.render(container, {
        sitekey: siteKey,
        action: "contact",
        appearance: "interaction-only",
        callback: (value: string) => {
          token = value;
          failure = null;
          announce();
        },
        "error-callback": () => fail("blocked"),
        "expired-callback": () => {
          token = null;
        },
        "timeout-callback": () => {
          token = null;
        },
      });
    } catch {
      // A render that throws (a bad site key, a frame the browser refuses) must not leave the visitor on "Sending...".
      renderFailed = true;
      fail("unavailable");
    }
  }

  function start(): void {
    if (script || !siteKey) return;
    const element = document.createElement("script");
    element.src = SCRIPT_URL;
    element.async = true;
    element.defer = true;
    element.addEventListener("load", render);
    element.addEventListener("error", () => {
      // Blocked or unreachable. Forget the element, so that the next attempt loads the script again.
      element.remove();
      if (script === element) script = undefined;
      fail("unavailable");
    });
    script = element;
    document.head.append(element);
  }

  async function getToken(timeoutMs = 15_000): Promise<TokenResult> {
    if (!siteKey) return { status: "unavailable" };
    // A new attempt after "the check cannot run" starts clean: ask for the script again, or start the widget again.
    if (failure === "unavailable") failure = null;
    start();
    if (renderFailed && window.turnstile) {
      renderFailed = false;
      render();
    }
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      if (token) return { status: "token", token };
      if (failure) return { status: failure };
      const left = deadline - Date.now();
      if (left <= 0) return { status: "blocked" };
      await Promise.race([nextChange(), new Promise<void>((resolve) => setTimeout(resolve, left))]);
    }
  }

  function reset(): void {
    token = null;
    failure = null;
    if (widgetId !== undefined) window.turnstile?.reset(widgetId);
  }

  return { start, getToken, reset };
}
