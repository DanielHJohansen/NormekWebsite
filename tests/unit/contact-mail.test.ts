/**
 * CF-10, CF-11 and CF-12 of docs/security/threat-model-and-requirements.md section 3:
 * what the mail contains, who it goes to, and what happens when the provider fails.
 *
 * The harness (contact-harness.ts) also checks after every test in the whole suite that each mail
 * went to the CONTACT_TO of that test. The tests here check the same thing on purpose.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  CONTACT_TO,
  fields,
  hangUntilAborted,
  json,
  neverAnswers,
  ORIGIN,
  readJson,
  redirectWith,
  RESEND_KEY,
  RESEND_URL,
  SITEVERIFY_URL,
  until,
  useContactHarness,
  type SentMail,
} from "./contact-harness";

const h = useContactHarness();

/** The only mail of a test that accepted exactly one request. */
function onlyMail(): SentMail {
  const mails = h.mails();
  expect(mails).toHaveLength(1);
  return mails[0] as SentMail;
}

describe("CF-10 the mail", () => {
  it("is one request to Resend per accepted request, with the key as a bearer token", async () => {
    expect((await h.send()).status).toBe(200);
    expect(h.resendCalls()).toHaveLength(1);

    const call = h.resendCalls()[0];
    expect(call?.url).toBe("https://api.resend.com/emails");
    expect(call?.init.method).toBe("POST");
    expect(call?.init.headers).toEqual({
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    });
    expect(call?.init.signal).toBeInstanceOf(AbortSignal);
    // "manual", because the Workers runtime throws on "error". A redirect is a non-2xx answer, so it fails.
    expect(call?.init.redirect).toBe("manual");
  });

  it("holds exactly from, to, reply_to, subject and text, and no html", async () => {
    await h.send();
    const mail = onlyMail();
    expect(Object.keys(mail).sort()).toEqual(["from", "reply_to", "subject", "text", "to"]);
    expect("html" in mail).toBe(false);
    expect(typeof mail.text).toBe("string");
  });

  it("goes to CONTACT_TO from the environment", async () => {
    await h.send();
    expect(onlyMail().to).toBe(CONTACT_TO);
  });

  it("has a sender and a subject that no visitor input can change", async () => {
    const second = {
      name: "Bo Other",
      email: "bo@other.example",
      company: "Other Co",
      message: "A different request about a different product, long enough to pass.",
    };
    await h.send();
    await h.send({ fields: second });
    const [first, other] = h.mails();
    expect(first?.from).toBe(other?.from);
    expect(first?.subject).toBe(other?.subject);
    expect(first?.from).toMatch(/^Normek website <[^<>@\s]+@(resend\.dev|notify\.normek\.dk)>$/);
    expect(first?.subject.length).toBeGreaterThan(0);

    // Neither line holds any value a visitor typed, from either request.
    const typed = [...Object.values(fields()), ...Object.values(second)].filter(
      (value) => value !== "" && value !== "fake-turnstile-token",
    );
    for (const mail of h.mails()) {
      for (const value of typed) {
        expect(mail.from).not.toContain(value);
        expect(mail.subject).not.toContain(value);
      }
    }
  });

  it("sets reply_to to the validated address alone, with no name around it", async () => {
    await h.send({
      fields: { name: "Ada, Countess <of@lovelace.example>", email: "  Ada.L+tag@Example.com \n" },
    });
    const mail = onlyMail();
    expect(mail.reply_to).toBe("Ada.L+tag@Example.com");
    expect(typeof mail.reply_to).toBe("string");
    expect(mail.reply_to).not.toMatch(/[<>,;"\s]/);
  });

  it("puts the visitor's details in plain text, with the message last", async () => {
    const message = "Line one of the request.\n\tLine two, indented.\nLine three.";
    await h.send({ fields: { message } });
    const { text } = onlyMail();
    expect(text).toBe(
      [
        "New inquiry from the Normek website contact form.",
        "",
        "Name: Ada Example",
        "Email: ada@example.com",
        "Company: Example Electronics AB",
        `Sent from: ${ORIGIN}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    );
  });

  it("keeps hostile text inside the text body and out of the structure", async () => {
    await h.send({
      fields: {
        name: 'Eve","bcc":"eve@example.net","to":"eve@example.net',
        company: "<script>alert(1)</script> & Co",
        message:
          'Please read.\nBcc: eve@example.net\nSubject: hacked\n","cc":["eve@example.net"],"html":"<b>x</b>',
      },
    });
    const mail = onlyMail();
    expect(Object.keys(mail).sort()).toEqual(["from", "reply_to", "subject", "text", "to"]);
    expect(mail.to).toBe(CONTACT_TO);
    expect(mail.subject).not.toContain("hacked");
    expect(mail.text).toContain('Name: Eve","bcc":"eve@example.net","to":"eve@example.net\n');
    expect(mail.text).toContain("Bcc: eve@example.net");
  });

  it("names the page the form was sent from, which is an allowed origin", async () => {
    await h.send();
    expect(onlyMail().text).toContain(`Sent from: ${ORIGIN}\n`);
  });

  it("holds nothing about the visitor's network or the secrets", async () => {
    await h.send({
      headers: { "cf-connecting-ip": "198.51.100.77", "x-forwarded-for": "198.51.100.77" },
    });
    const call = h.resendCalls()[0];
    expect(String(call?.init.body)).not.toContain("198.51.100.77");
    expect(String(call?.init.body)).not.toContain(RESEND_KEY);
    expect(String(call?.init.body)).not.toContain("fake-turnstile-secret");
    expect(String(call?.init.body)).not.toContain("fake-turnstile-token");
  });

  it("is sent after the person check and not before", async () => {
    await h.send();
    expect(h.calls.map((call) => call.url)).toEqual([
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      "https://api.resend.com/emails",
    ]);
  });
});

describe("CF-11 no auto-reply", () => {
  it("sends to CONTACT_TO from the environment, whatever the visitor typed", async () => {
    const env = { CONTACT_TO: "owner@example.org" };
    await h.send({ env, fields: { email: "visitor@example.com" } });
    const mail = onlyMail();
    expect(mail.to).toBe("owner@example.org");
    expect(mail.to).not.toBe("visitor@example.com");
    expect(mail.reply_to).toBe("visitor@example.com");
  });

  it("sends exactly one mail and none to the visitor", async () => {
    await h.send({ fields: { email: "visitor@example.com" } });
    expect(h.resendCalls()).toHaveLength(1);
    const body = String(h.resendCalls()[0]?.init.body);
    const recipients = JSON.parse(body) as Record<string, unknown>;
    expect(recipients["to"]).toBe(CONTACT_TO);
    expect("cc" in recipients).toBe(false);
    expect("bcc" in recipients).toBe(false);
  });

  it("every sendMail() call equals CONTACT_TO, for any address a visitor can give", async () => {
    const addresses = [
      "ada@example.com",
      "eve@example.net",
      "  padded@example.com  ",
      "UPPER@EXAMPLE.COM",
      "plus+tag@example.com",
      "dotted.name@sub.example.co.uk",
      // The visitor gives the owner's own address.
      CONTACT_TO,
      // An address that ends the way the owner's address does.
      `x${CONTACT_TO}`,
      "x@inbox.example.com",
    ];
    for (const email of addresses) {
      expect((await h.send({ fields: { email } })).status).toBe(200);
    }
    const mails = h.mails();
    expect(mails).toHaveLength(addresses.length);
    for (const mail of mails) expect(mail.to).toBe(CONTACT_TO);
  });

  it("sends nothing to anyone when the request is turned away", async () => {
    await h.send({ origin: "https://evil.example" });
    await h.send({ fields: { email: "nope" } });
    await h.send({ fields: { website: "x" } });
    expect(h.resendCalls()).toEqual([]);
  });

  it("has exactly one place in the code that calls sendMail()", () => {
    const files = readdirSync("functions", { recursive: true, encoding: "utf8" }).filter((file) =>
      file.endsWith(".ts"),
    );
    expect(files.length).toBeGreaterThan(5);

    const callSites: string[] = [];
    for (const file of files) {
      const lines = readFileSync(`functions/${file}`, "utf8").split("\n");
      lines.forEach((line, index) => {
        const isComment = /^\s*(\*|\/\/|\/\*)/.test(line);
        const isDefinition = /\bfunction sendMail\(/.test(line);
        if (/\bsendMail\(/.test(line) && !isComment && !isDefinition) {
          callSites.push(`${file}:${index + 1}`);
        }
      });
    }
    // A second call site, for example an auto-reply, must be argued against CF-11 first.
    expect(callSites.map((site) => site.split(":")[0])).toEqual(["_lib/handle.ts"]);
  });
});

describe("CF-12 mail failure", () => {
  it.each([400, 401, 403, 404, 422, 429, 500, 502, 503])(
    "answers 502 with a generic code when Resend answers %i, and does not retry",
    async (status) => {
      h.setResend(() =>
        json({ name: "validation_error", message: "SENTINEL provider text" }, status),
      );
      const response = await h.send();
      expect(response.status).toBe(502);
      expect(await readJson(response)).toEqual({ ok: false, error: "mail_failed" });
      expect(h.resendCalls()).toHaveLength(1);
    },
  );

  it.each([301, 302, 307, 308])(
    "answers 502 when Resend answers with a redirect (HTTP %i) that carries a passing body",
    async (status) => {
      h.setResend(() => redirectWith({ id: "fake-mail-id" }, status));
      const response = await h.send();
      expect(response.status).toBe(502);
      expect(await readJson(response)).toEqual({ ok: false, error: "mail_failed" });
      // One attempt, and the location it names is not followed.
      expect(h.calls.map((call) => call.url)).toEqual([SITEVERIFY_URL, RESEND_URL]);
    },
  );

  it.each([200, 201, 202])("counts HTTP %i as sent", async (status) => {
    h.setResend(() => json({ id: "fake-mail-id" }, status));
    const response = await h.send();
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true });
  });

  it("answers 502 when Resend cannot be reached, and does not retry", async () => {
    h.setResend(() => {
      throw new TypeError("fetch failed");
    });
    const response = await h.send();
    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({ ok: false, error: "mail_failed" });
    expect(h.resendCalls()).toHaveLength(1);
  });

  it("answers 502 after 5 seconds, aborts the call and does not retry", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    h.setResend(hangUntilAborted);
    let settled = false;
    const pending = h.send().then((response) => {
      settled = true;
      return response;
    });

    await until(() => h.resendCalls().length === 1);
    await vi.advanceTimersByTimeAsync(4999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    const response = await pending;
    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({ ok: false, error: "mail_failed" });
    expect(h.resendCalls()[0]?.init.signal?.aborted).toBe(true);

    // No retry later either.
    await vi.advanceTimersByTimeAsync(120_000);
    expect(h.resendCalls()).toHaveLength(1);
  });

  it("answers 502 after 5 seconds even when fetch ignores its abort signal", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    h.setResend(neverAnswers);
    const pending = h.send();
    await until(() => h.resendCalls().length === 1);
    await vi.advanceTimersByTimeAsync(5000);
    expect((await pending).status).toBe(502);
    expect(h.resendCalls()).toHaveLength(1);
  });

  it("answers 502 after 5 seconds when the provider's answer body cannot be dropped", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    // The answer is a 200, but cancelling its body never finishes.
    h.setResend(
      () =>
        new Response(
          new ReadableStream<Uint8Array>({ cancel: () => new Promise<void>(() => undefined) }),
          {
            status: 200,
          },
        ),
    );
    let settled = false;
    const pending = h.send().then((response) => {
      settled = true;
      return response;
    });

    await until(() => h.resendCalls().length === 1);
    await vi.advanceTimersByTimeAsync(4999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    const response = await pending;
    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({ ok: false, error: "mail_failed" });
    expect(h.resendCalls()).toHaveLength(1);
  });

  it("shows the visitor nothing of what the provider said", async () => {
    h.setResend(() =>
      json(
        { statusCode: 422, name: "validation_error", message: "SENTINEL-reply-to is invalid" },
        422,
      ),
    );
    const response = await h.send({ fields: { email: "sentinel-visitor@example.com" } });
    const text = await response.text();
    expect(text).toBe('{"ok":false,"error":"mail_failed"}');
    expect(text).not.toContain("SENTINEL");
  });

  it("is only reached after the person check passed", async () => {
    h.setSiteverify(() => json({ success: false }));
    h.setResend(() => {
      throw new Error("must not be called");
    });
    expect((await h.send()).status).toBe(403);
    expect(h.calls.some((call) => call.url === RESEND_URL)).toBe(false);
  });
});
