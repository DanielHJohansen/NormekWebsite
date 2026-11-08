/**
 * Loads Cloudflare Turnstile on first use (ADR 0001 amendment A10) and hands out its token.
 *
 * The script is added the first time a visitor focuses or clicks in the form, never before, so someone who only reads
 * the page never contacts Cloudflare's challenge host. The widget is rendered explicitly with the action "contact"
 * and the appearance "interaction-only" (managed mode, no puzzle for a normal visitor).
 * A token works once. After every answer that is not a success the caller resets the widget and waits for a new one.
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
  /** There is no site key (the preview before the Cloudflare setup), so there is nothing to wait for. */
  | { readonly status: "unavailable" }
  /** The check did not run or did not finish: the script was blocked, the widget reported an error or it took too long. */
  | { readonly status: "blocked" };

export interface TurnstileHandle {
  start(): void;
  getToken(timeoutMs?: number): Promise<TokenResult>;
  reset(): void;
}

export function createTurnstile(container: HTMLElement, siteKey: string): TurnstileHandle {
  let started = false;
  let widgetId: string | undefined;
  let token: string | null = null;
  let failed = false;
  let changed: Array<() => void> = [];

  const announce = (): void => {
    const waiting = changed;
    changed = [];
    for (const wake of waiting) wake();
  };

  const nextChange = (): Promise<void> => new Promise((resolve) => changed.push(resolve));

  function render(): void {
    const api = window.turnstile;
    if (!api) {
      failed = true;
      announce();
      return;
    }
    widgetId = api.render(container, {
      sitekey: siteKey,
      action: "contact",
      appearance: "interaction-only",
      callback: (value: string) => {
        token = value;
        failed = false;
        announce();
      },
      "error-callback": () => {
        token = null;
        failed = true;
        announce();
      },
      "expired-callback": () => {
        token = null;
      },
      "timeout-callback": () => {
        token = null;
      },
    });
  }

  function start(): void {
    if (started || !siteKey) return;
    started = true;
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", render);
    script.addEventListener("error", () => {
      failed = true;
      announce();
    });
    document.head.append(script);
  }

  async function getToken(timeoutMs = 15_000): Promise<TokenResult> {
    if (!siteKey) return { status: "unavailable" };
    start();
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      if (token) return { status: "token", token };
      if (failed) return { status: "blocked" };
      const left = deadline - Date.now();
      if (left <= 0) return { status: "blocked" };
      await Promise.race([nextChange(), new Promise<void>((resolve) => setTimeout(resolve, left))]);
    }
  }

  function reset(): void {
    token = null;
    failed = false;
    if (widgetId !== undefined) window.turnstile?.reset(widgetId);
  }

  return { start, getToken, reset };
}
