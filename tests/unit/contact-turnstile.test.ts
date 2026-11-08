/**
 * CF-08 of docs/security/threat-model-and-requirements.md section 3: Turnstile, fail closed.
 * Mail is sent only for an answer that is HTTP 200, valid JSON, success exactly true, an allowed
 * hostname and the action "contact". Every other path ends without mail.
 */
import { describe, expect, it, vi } from "vitest";
import {
  hangUntilAborted,
  HOSTNAME,
  json,
  neverAnswers,
  readJson,
  SITEVERIFY_URL,
  TURNSTILE_PASS,
  TURNSTILE_SECRET,
  until,
  useContactHarness,
} from "./contact-harness";

const h = useContactHarness();

const TOKEN_FIELD = "cf-turnstile-response";

/** A Turnstile answer that is the passing one with changes. */
function answer(changes: Record<string, unknown>, remove: string[] = []): Response {
  const body: Record<string, unknown> = { ...TURNSTILE_PASS, ...changes };
  for (const name of remove) delete body[name];
  return json(body);
}

describe("CF-08 the token", () => {
  it.each([
    ["is missing", undefined],
    ["is empty", ""],
    ["has 2049 characters", "t".repeat(2049)],
  ])("answers 403 without asking Turnstile when the token %s", async (_label, token) => {
    const response = await h.send({ fields: { [TOKEN_FIELD]: token } });
    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ ok: false, error: "turnstile" });
    expect(h.calls).toEqual([]);
  });

  it("asks Turnstile about a token of exactly 2048 characters", async () => {
    const token = "t".repeat(2048);
    const response = await h.send({ fields: { [TOKEN_FIELD]: token } });
    expect(response.status).toBe(200);
    expect(h.siteverifyCalls()).toHaveLength(1);
    expect(new URLSearchParams(String(h.siteverifyCalls()[0]?.init.body)).get("response")).toBe(
      token,
    );
  });
});

describe("CF-08 the question to Turnstile", () => {
  it("posts the secret and the token to siteverify and nothing else", async () => {
    await h.send({
      headers: {
        "cf-connecting-ip": "198.51.100.77",
        "x-forwarded-for": "198.51.100.77",
        "user-agent": "SENTINEL-agent",
      },
    });
    const calls = h.siteverifyCalls();
    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call?.url).toBe(SITEVERIFY_URL);
    expect(call?.init.method).toBe("POST");

    const sent = new URLSearchParams(String(call?.init.body));
    expect([...sent.keys()].sort()).toEqual(["response", "secret"]);
    expect(sent.get("secret")).toBe(TURNSTILE_SECRET);
    expect(sent.get("response")).toBe("fake-turnstile-token");
  });

  it("does not send the visitor's IP address or any request header", async () => {
    await h.send({
      headers: {
        "cf-connecting-ip": "198.51.100.77",
        "x-forwarded-for": "198.51.100.77",
        "user-agent": "SENTINEL-agent",
      },
    });
    const call = h.siteverifyCalls()[0];
    expect(String(call?.init.body)).not.toContain("198.51.100.77");
    expect(String(call?.init.body)).not.toContain("remoteip");
    expect(call?.init.headers).toBeUndefined();
    expect(JSON.stringify(call?.init.headers ?? {})).not.toContain("198.51.100.77");
  });

  it("limits the call with an abort signal and never follows a redirect", async () => {
    await h.send();
    const init = h.siteverifyCalls()[0]?.init;
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    // "manual", because the Workers runtime throws on "error". A redirect is not HTTP 200, so it fails closed.
    expect(init?.redirect).toBe("manual");
  });

  it("asks once per request and never retries", async () => {
    await h.send();
    await h.send();
    expect(h.siteverifyCalls()).toHaveLength(2);
    h.setSiteverify(() => json({ success: false, "error-codes": ["internal-error"] }));
    await h.send();
    expect(h.siteverifyCalls()).toHaveLength(3);
  });

  it("keeps the Turnstile secret away from the mail provider", async () => {
    await h.send();
    const mail = h.resendCalls()[0];
    expect(String(mail?.init.body)).not.toContain(TURNSTILE_SECRET);
    expect(JSON.stringify(mail?.init.headers)).not.toContain(TURNSTILE_SECRET);
  });
});

describe("CF-08 what lets a request through", () => {
  it("sends mail for success, an allowed hostname and the action contact", async () => {
    const response = await h.send();
    expect(response.status).toBe(200);
    expect(h.resendCalls()).toHaveLength(1);
  });

  it("compares the hostname without regard to case", async () => {
    h.setSiteverify(() => answer({ hostname: "NORMEK-WEB.Pages.Dev" }));
    expect((await h.send()).status).toBe(200);
  });

  it("takes the allowed hostnames from ALLOWED_ORIGINS", async () => {
    const env = { ALLOWED_ORIGINS: "https://normek-web.pages.dev,https://www.normek.dk" };
    h.setSiteverify(() => answer({ hostname: "www.normek.dk" }));
    expect((await h.send({ env })).status).toBe(200);

    // The apex is not listed, and neither is the preview alias, so a token from there is refused.
    h.setSiteverify(() => answer({ hostname: "normek.dk" }));
    expect((await h.send({ env })).status).toBe(403);
    h.setSiteverify(() => answer({ hostname: "preview.normek-web.pages.dev" }));
    expect((await h.send({ env })).status).toBe(403);
  });
});

describe("CF-08 a visitor who fails the check", () => {
  const refused: [string, () => Response][] = [
    ["success false", () => json({ success: false, "error-codes": ["invalid-input-response"] })],
    [
      "a token that was used before",
      () => json({ success: false, "error-codes": ["timeout-or-duplicate"] }),
    ],
    [
      "a token Turnstile never saw",
      () => json({ success: false, "error-codes": ["missing-input-response"] }),
    ],
    ["success false and no error codes", () => json({ success: false })],
    [
      "success false and a code that is not known",
      () => json({ success: false, "error-codes": ["new-code"] }),
    ],
    ["a hostname that is not allowed", () => answer({ hostname: "evil.example" })],
    ["a lookalike hostname", () => answer({ hostname: `${HOSTNAME}.evil.example` })],
    ["a hostname with another prefix", () => answer({ hostname: `evil-${HOSTNAME}` })],
    ["no hostname", () => answer({}, ["hostname"])],
    ["a hostname that is not a string", () => answer({ hostname: 5 })],
    ["another action", () => answer({ action: "login" })],
    ["an action in another case", () => answer({ action: "Contact" })],
    ["no action", () => answer({}, ["action"])],
    ["an action that is not a string", () => answer({ action: ["contact"] })],
  ];

  it.each(refused)("answers 403 for %s and sends no mail", async (_label, reply) => {
    h.setSiteverify(reply);
    const response = await h.send();
    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ ok: false, error: "turnstile" });
    expect(h.siteverifyCalls()).toHaveLength(1);
    expect(h.resendCalls()).toEqual([]);
  });
});

describe("CF-08 Turnstile cannot give a usable answer", () => {
  const unusable: [string, () => Response][] = [
    ["HTTP 400 with a passing body", () => json(TURNSTILE_PASS, 400)],
    ["HTTP 401 with a passing body", () => json(TURNSTILE_PASS, 401)],
    ["HTTP 403 with a passing body", () => json(TURNSTILE_PASS, 403)],
    ["HTTP 404 with a passing body", () => json(TURNSTILE_PASS, 404)],
    ["HTTP 429 with a passing body", () => json(TURNSTILE_PASS, 429)],
    ["HTTP 500 with a passing body", () => json(TURNSTILE_PASS, 500)],
    ["HTTP 502 with a passing body", () => json(TURNSTILE_PASS, 502)],
    ["HTTP 503 with a passing body", () => json(TURNSTILE_PASS, 503)],
    ["HTTP 201 with a passing body", () => json(TURNSTILE_PASS, 201)],
    ["HTTP 204 and no body", () => new Response(null, { status: 204 })],
    ["text that is not JSON", () => new Response("not json", { status: 200 })],
    ["an HTML page", () => new Response("<html><body>Error</body></html>", { status: 200 })],
    ["an empty body", () => new Response("", { status: 200 })],
    ["JSON that stops half way", () => new Response('{"success": tr', { status: 200 })],
    ["JSON null", () => new Response("null", { status: 200 })],
    ["a JSON array", () => json([TURNSTILE_PASS])],
    ["a JSON string", () => json("success")],
    ["a JSON number", () => json(1)],
    ["no success field", () => answer({}, ["success"])],
    ["success as the text true", () => answer({ success: "true" })],
    ["success as the number 1", () => answer({ success: 1 })],
    ["success as null", () => answer({ success: null })],
    ["an internal error", () => json({ success: false, "error-codes": ["internal-error"] })],
    ["a rejected secret", () => json({ success: false, "error-codes": ["invalid-input-secret"] })],
    ["a missing secret", () => json({ success: false, "error-codes": ["missing-input-secret"] })],
    ["a malformed request", () => json({ success: false, "error-codes": ["bad-request"] })],
    [
      "a service error among other codes",
      () => json({ success: false, "error-codes": ["invalid-input-response", "internal-error"] }),
    ],
  ];

  it.each(unusable)("answers 503 for %s and sends no mail", async (_label, reply) => {
    h.setSiteverify(reply);
    const response = await h.send();
    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({ ok: false, error: "turnstile_unavailable" });
    expect(h.siteverifyCalls()).toHaveLength(1);
    expect(h.resendCalls()).toEqual([]);
  });

  it("answers 503 when the network call fails", async () => {
    h.setSiteverify(() => {
      throw new TypeError("fetch failed");
    });
    const response = await h.send();
    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({ ok: false, error: "turnstile_unavailable" });
    expect(h.resendCalls()).toEqual([]);
  });

  it("answers 503 when the answer body cannot be read", async () => {
    h.setSiteverify(
      () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new Error("stream broke"));
            },
          }),
          { status: 200 },
        ),
    );
    expect((await h.send()).status).toBe(503);
    expect(h.resendCalls()).toEqual([]);
  });

  it("answers 503 after 5 seconds, aborts the call and sends no mail", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    h.setSiteverify(hangUntilAborted);
    let settled = false;
    const pending = h.send().then((response) => {
      settled = true;
      return response;
    });

    await until(() => h.siteverifyCalls().length === 1);
    await vi.advanceTimersByTimeAsync(4999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    const response = await pending;
    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({ ok: false, error: "turnstile_unavailable" });
    expect(h.siteverifyCalls()[0]?.init.signal?.aborted).toBe(true);
    expect(h.resendCalls()).toEqual([]);
  });

  it("answers 503 after 5 seconds even when fetch ignores its abort signal", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    h.setSiteverify(neverAnswers);
    const pending = h.send();
    await until(() => h.siteverifyCalls().length === 1);
    await vi.advanceTimersByTimeAsync(5000);
    expect((await pending).status).toBe(503);
    expect(h.resendCalls()).toEqual([]);
  });

  it("answers 403 or 503 for every way it can fail, and never sends mail", async () => {
    const replies: (() => Response | Promise<Response>)[] = [
      () => json({ success: false }),
      () => json(TURNSTILE_PASS, 500),
      () => new Response("nope"),
      () => Promise.reject(new TypeError("fetch failed")),
      () => answer({ action: "other" }),
    ];
    for (const reply of replies) {
      h.setSiteverify(reply);
      const response = await h.send();
      expect([403, 503]).toContain(response.status);
    }
    expect(h.resendCalls()).toEqual([]);
  });
});

describe("CF-08 the secret", () => {
  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["only spaces", "   "],
  ])(
    "answers 500 and never skips the check when TURNSTILE_SECRET_KEY is %s",
    async (_label, secret) => {
      const response = await h.send({ env: { TURNSTILE_SECRET_KEY: secret } });
      expect(response.status).toBe(500);
      expect(await readJson(response)).toEqual({ ok: false, error: "config" });
      expect(h.calls).toEqual([]);
    },
  );

  describe("in production", () => {
    it.each([
      "1x0000000000000000000000000000000AA",
      "2x0000000000000000000000000000000AA",
      "3x0000000000000000000000000000000AA",
      "1x0000",
      " 2x0000000000000000000000000000000AA ",
    ])("answers 500 for the Turnstile test secret %j", async (secret) => {
      const response = await h.send({ env: { TURNSTILE_SECRET_KEY: secret } });
      expect(response.status).toBe(500);
      expect(await readJson(response)).toEqual({ ok: false, error: "config" });
      expect(h.calls).toEqual([]);
    });

    it("also refuses a test secret on a preview address", async () => {
      const preview = "https://preview.normek-web.pages.dev";
      const response = await h.send({
        url: `${preview}/api/contact`,
        origin: preview,
        env: {
          ALLOWED_ORIGINS: preview,
          TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
        },
      });
      expect(response.status).toBe(500);
      expect(h.calls).toEqual([]);
    });

    it("also refuses it on a host that only looks like localhost", async () => {
      const lookalike = "http://localhost.evil.example";
      const response = await h.send({
        url: `${lookalike}/api/contact`,
        origin: lookalike,
        env: {
          ALLOWED_ORIGINS: lookalike,
          TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
        },
      });
      expect(response.status).toBe(500);
      expect(h.calls).toEqual([]);
    });

    it("accepts a secret that only contains the test prefix further in", async () => {
      const response = await h.send({ env: { TURNSTILE_SECRET_KEY: "fake-1x0000-secret" } });
      expect(response.status).toBe(200);
    });
  });

  describe("on this machine", () => {
    it.each(["http://localhost:8788", "http://127.0.0.1:8788", "http://[::1]:8788"])(
      "accepts the Turnstile test secret at %s",
      async (local) => {
        const hostname = new URL(local).hostname;
        h.setSiteverify(() => answer({ hostname }));
        const response = await h.send({
          url: `${local}/api/contact`,
          origin: local,
          env: {
            ALLOWED_ORIGINS: local,
            TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          },
        });
        expect(response.status).toBe(200);
        const sent = new URLSearchParams(String(h.siteverifyCalls()[0]?.init.body));
        expect(sent.get("secret")).toBe("1x0000000000000000000000000000000AA");
      },
    );
  });
});
