/**
 * Shared harness for the contact function tests (tests/unit/contact-*.test.ts).
 *
 * - `fetch` is replaced by a vi.fn. It answers Turnstile and Resend from handlers a test can set
 *   and fails the test on any other address, so nothing here can reach the network.
 * - Every console method is spied on, so a test can prove that nothing personal is logged (CF-13).
 * - After every test the harness checks that each mail sent went to the CONTACT_TO of that
 *   test and to nobody else (CF-11). Because every contact test file uses the harness, the check
 *   covers the whole suite.
 *
 * All secrets and addresses here are fake.
 */
import { inspect } from "node:util";
import { afterEach, beforeEach, expect, vi, type MockInstance } from "vitest";
import type { Env } from "../../functions/_lib/env";
import { onRequest } from "../../functions/api/contact";

export const ORIGIN = "https://normek-web.pages.dev";
export const HOSTNAME = "normek-web.pages.dev";
export const ENDPOINT = `${ORIGIN}/api/contact`;
export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const RESEND_URL = "https://api.resend.com/emails";

export const TURNSTILE_SECRET = "fake-turnstile-secret";
export const RESEND_KEY = "fake-resend-key";
export const CONTACT_TO = "inbox@example.com";

/** The settings of a healthy deployment. A Turnstile secret like this is not a Cloudflare test secret. */
export const ENV: Env = {
  TURNSTILE_SECRET_KEY: TURNSTILE_SECRET,
  RESEND_API_KEY: RESEND_KEY,
  CONTACT_TO,
  ALLOWED_ORIGINS: ORIGIN,
};

/** A request the real form could send. The honeypot is present and empty, as in the real form. */
export const VALID_FIELDS: Readonly<Record<string, string>> = {
  name: "Ada Example",
  email: "ada@example.com",
  company: "Example Electronics AB",
  message:
    "We need an enclosure for a battery powered sensor board, IP54, about 2000 units a year.",
  website: "",
  "cf-turnstile-response": "fake-turnstile-token",
};

export type Fields = Record<string, string | undefined>;

/** VALID_FIELDS with changes. A value of undefined removes the field. */
export function fields(overrides: Fields = {}): Record<string, string> {
  const merged: Fields = { ...VALID_FIELDS, ...overrides };
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(merged)) {
    if (value !== undefined) result[name] = value;
  }
  return result;
}

export function encode(form: Record<string, string> | [string, string][]): string {
  return new URLSearchParams(form).toString();
}

export interface SendOptions {
  method?: string;
  url?: string;
  /** null leaves the Origin header out. */
  origin?: string | null;
  /** null leaves the Content-Type header out. */
  contentType?: string | null;
  /** Merged over VALID_FIELDS. */
  fields?: Fields;
  /** A raw body, used instead of `fields`. null sends the request with no body at all. */
  body?: string | Uint8Array<ArrayBuffer> | ReadableStream<Uint8Array<ArrayBuffer>> | null;
  headers?: Record<string, string>;
  /** Merged over ENV. A value of undefined removes the variable. */
  env?: Partial<Record<keyof Env, string | undefined>>;
}

export function buildRequest(options: SendOptions = {}): Request {
  const method = options.method ?? "POST";
  const headers = new Headers(options.headers);
  const origin = options.origin === undefined ? ORIGIN : options.origin;
  if (origin !== null) headers.set("origin", origin);
  const contentType =
    options.contentType === undefined
      ? "application/x-www-form-urlencoded; charset=utf-8"
      : options.contentType;
  if (contentType !== null) headers.set("content-type", contentType);

  const init: RequestInit & { duplex?: "half" } = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    const body = options.body === undefined ? encode(fields(options.fields)) : options.body;
    if (body === null) {
      // No body at all, so request.body is null.
    } else if (body instanceof ReadableStream) {
      init.body = body;
      init.duplex = "half";
    } else if (typeof body === "string" && contentType === null) {
      // A string body would make the runtime add a text/plain content type.
      init.body = new TextEncoder().encode(body);
    } else {
      init.body = body;
    }
  }
  return new Request(options.url ?? ENDPOINT, init);
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * A redirect answer that carries a body which would pass if anyone read it, so only its status
 * can make the function refuse it. The function never follows a redirect (redirect: "manual").
 */
export function redirectWith(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", location: "https://example.invalid/elsewhere" },
  });
}

/** What Turnstile answers for a real person on the right page. */
export const TURNSTILE_PASS = {
  success: true,
  challenge_ts: "2026-11-08T12:00:00.000Z",
  hostname: HOSTNAME,
  "error-codes": [],
  action: "contact",
};

export interface Outbound {
  readonly url: string;
  readonly init: RequestInit;
}

type Handler = (init: RequestInit) => Response | Promise<Response>;

/** A call that stays open until the function aborts it. */
export const hangUntilAborted: Handler = (init) =>
  new Promise<Response>((_resolve, reject) => {
    init.signal?.addEventListener("abort", () => {
      reject(new DOMException("The operation was aborted.", "AbortError"));
    });
  });

/** A call that never ends and ignores its abort signal, like a broken fetch. */
export const neverAnswers: Handler = () => new Promise<Response>(() => undefined);

export interface SentMail {
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly reply_to: string;
  readonly text: string;
  readonly html?: unknown;
}

/** Every console method, so one that a future change starts using cannot slip past the tests. */
function consoleMethodNames(): string[] {
  const names: string[] = [];
  for (const key of Object.keys(console)) {
    if (
      /^[a-z]/.test(key) &&
      typeof (console as unknown as Record<string, unknown>)[key] === "function"
    ) {
      names.push(key);
    }
  }
  return names;
}

export function useContactHarness() {
  let calls: Outbound[] = [];
  let strangers: string[] = [];
  let contactTos = new Set<string>();
  let siteverify: Handler = () => json(TURNSTILE_PASS);
  let resend: Handler = () => json({ id: "fake-mail-id" });
  let spies: MockInstance[] = [];

  beforeEach(() => {
    calls = [];
    strangers = [];
    contactTos = new Set();
    siteverify = () => json(TURNSTILE_PASS);
    resend = () => json({ id: "fake-mail-id" });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const outbound: Outbound = { url, init: init ?? {} };
        calls.push(outbound);
        if (url === SITEVERIFY_URL) return siteverify(outbound.init);
        if (url === RESEND_URL) return resend(outbound.init);
        strangers.push(url);
        throw new Error("No network in tests");
      }),
    );

    const target = console as unknown as Record<string, (...args: unknown[]) => unknown>;
    spies = consoleMethodNames().map((name) =>
      vi.spyOn(target, name).mockImplementation(() => undefined),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    for (const spy of spies) spy.mockRestore();

    // The function never reached for an address other than Turnstile and Resend.
    expect(strangers).toEqual([]);
    // CF-11, across the whole suite: every mail went to CONTACT_TO, to nobody else.
    for (const call of calls.filter((entry) => entry.url === RESEND_URL)) {
      const mail = JSON.parse(String(call.init.body)) as SentMail;
      expect(contactTos.has(mail.to)).toBe(true);
    }
  });

  const dispatch = (request: Request, env: Env = ENV): Promise<Response> => {
    if (typeof env.CONTACT_TO === "string") contactTos.add(env.CONTACT_TO.trim());
    return onRequest({ request, env });
  };

  return {
    /** Builds a request from the options and sends it to the function. */
    send(options: SendOptions = {}): Promise<Response> {
      return dispatch(buildRequest(options), { ...ENV, ...options.env });
    },
    /** Sends a request the test built itself. */
    dispatch,

    /** Replace what Turnstile or Resend answer. */
    setSiteverify(handler: Handler): void {
      siteverify = handler;
    },
    setResend(handler: Handler): void {
      resend = handler;
    },

    get calls(): readonly Outbound[] {
      return calls;
    },
    siteverifyCalls: (): Outbound[] => calls.filter((call) => call.url === SITEVERIFY_URL),
    resendCalls: (): Outbound[] => calls.filter((call) => call.url === RESEND_URL),
    /** The mails the function handed to Resend, as Resend received them. */
    mails: (): SentMail[] =>
      calls
        .filter((call) => call.url === RESEND_URL)
        .map((call) => JSON.parse(String(call.init.body)) as SentMail),
    /** The arguments of every console call, from any method. */
    consoleCalls: (): unknown[][] => spies.flatMap((spy) => spy.mock.calls as unknown[][]),
    /** Everything written to any console method, one string per call. */
    consoleLines: (): string[] =>
      spies.flatMap((spy) =>
        spy.mock.calls.map((args) =>
          args.map((arg) => (typeof arg === "string" ? arg : inspect(arg))).join(" "),
        ),
      ),
  };
}

export type Harness = ReturnType<typeof useContactHarness>;

/**
 * Waits, by yielding to the event loop, until a condition holds. setImmediate is not one of the
 * timers the tests replace, so this also works while fake timers are on.
 */
export async function until(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 500 && !condition(); attempt += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  expect(condition()).toBe(true);
}

export async function readJson(response: Response): Promise<unknown> {
  return JSON.parse(await response.text());
}
