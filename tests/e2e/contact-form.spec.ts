/**
 * The contact form in a real browser, with the network mocked (see contact-helpers.ts).
 * It covers what a visitor and a screen reader meet: validation, the error summary, the sending state,
 * success, every kind of failure, the honeypot, Turnstile on first use, and the page without JavaScript.
 * The function itself is tested in tests/unit/contact-*.test.ts. Nothing here reaches Cloudflare or a mail provider.
 */
import type { Locator, Page } from "@playwright/test";
import { blockingAxeFindings, expect, test } from "./fixtures";
import {
  DUMMY_SITE_KEY,
  VALID,
  copyOf,
  fillForm,
  mockContact,
  mockTurnstile,
  turnstileCalls,
  useSiteKey,
} from "./contact-helpers";

interface Form {
  form: Locator;
  submit: Locator;
  summary: Locator;
  alertRegion: Locator;
  statusRegion: Locator;
  field: (name: string) => Locator;
  error: (name: string) => Locator;
  /** The addresses the page asked the Turnstile host for. The fake answers them, so nothing leaves the machine. */
  requested: string[];
}

interface OpenOptions {
  /** False leaves the form without a site key, as in the preview before the Cloudflare setup. */
  siteKey?: boolean;
  /** "blocked" makes the Turnstile script fail to load, "render-throws" gives a widget whose render throws. */
  turnstile?: "works" | "blocked" | "render-throws";
}

/**
 * Opens the home page and waits until the script has enabled the button. Turnstile is always the fake one,
 * so no test reaches Cloudflare, and a test that forgets about it cannot hang on a real request.
 */
async function open(page: Page, options: OpenOptions = {}): Promise<Form> {
  const requested = await mockTurnstile(page, options.turnstile ?? "works");
  if (options.siteKey ?? true) await useSiteKey(page);
  await page.goto("/");
  const form = page.locator("#contact-form");
  const submit = page.locator("#contact-submit");
  await expect(submit).toBeEnabled();
  return {
    form,
    submit,
    summary: page.locator("#contact-summary"),
    alertRegion: page.locator("#contact-notice"),
    statusRegion: page.locator("#contact-warning"),
    field: (name) => page.locator(`#contact-${name}`),
    error: (name) => page.locator(`#contact-${name}-error`),
    requested,
  };
}

const FIELDS = ["name", "email", "company", "message"] as const;

test.describe("validation", () => {
  test("a field is checked when the visitor leaves it, with an icon, text and aria attributes", async ({
    page,
  }) => {
    const f = await open(page);
    await f.field("name").focus();
    await f.field("email").focus();

    await expect(f.error("name")).toBeVisible();
    await expect(f.error("name")).toContainText(await copyOf(page, "name.empty"));
    await expect(f.error("name").locator("svg")).toHaveCount(1);
    await expect(f.field("name")).toHaveAttribute("aria-invalid", "true");
    await expect(f.field("name")).toHaveAttribute("aria-describedby", "contact-name-error");
    // The field that was not left yet has no error.
    await expect(f.error("email")).toBeHidden();
    await expect(f.field("email")).not.toHaveAttribute("aria-invalid", /.*/);
  });

  test("an error goes away as soon as the value is fine, while the visitor types", async ({
    page,
  }) => {
    const f = await open(page);
    await f.field("name").focus();
    await f.field("email").focus();
    await expect(f.error("name")).toBeVisible();

    await f.field("name").pressSequentially("A");
    await expect(f.error("name")).toBeHidden();
    await expect(f.field("name")).not.toHaveAttribute("aria-invalid", /.*/);
    await expect(f.field("name")).not.toHaveAttribute("aria-describedby", /.*/);
  });

  test("an email gets the text that fits its mistake", async ({ page }) => {
    const f = await open(page);
    const email = f.field("email");
    await email.fill("ada.example.dk");
    await f.field("company").focus();
    await expect(f.error("email")).toContainText(await copyOf(page, "email.no-at"));

    await email.fill("ada@example");
    await expect(f.error("email")).toContainText(await copyOf(page, "email.invalid"));

    await email.fill("ada@example.dk");
    await expect(f.error("email")).toBeHidden();
  });

  test("the message needs 20 characters", async ({ page }) => {
    const f = await open(page);
    await f.field("message").fill("too short");
    await f.field("name").focus();
    await expect(f.error("message")).toContainText(await copyOf(page, "message.too-short"));
    // The helper text stays in the description beside the error.
    await expect(f.field("message")).toHaveAttribute(
      "aria-describedby",
      "contact-message-help contact-message-error",
    );
    await f.field("message").fill("x".repeat(20));
    await expect(f.error("message")).toBeHidden();
    await expect(f.field("message")).toHaveAttribute("aria-describedby", "contact-message-help");
  });

  test("a message that is too long for the request is stopped before it is sent (F6)", async ({
    page,
  }) => {
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    const f = await open(page);
    const cjk = String.fromCodePoint(0x6f22);
    await fillForm(page, { ...VALID, message: cjk.repeat(1800) });

    // On leaving the field, with the text from the content and no request.
    await f.field("name").focus();
    await expect(f.error("message")).toContainText(await copyOf(page, "message.too-long"));
    await expect(f.field("message")).toHaveAttribute("aria-invalid", "true");

    // On submit it joins the summary, takes focus there and still sends nothing.
    await f.submit.click();
    await expect(f.summary).toBeFocused();
    await expect(f.summary.locator("a")).toHaveCount(1);
    await expect(f.summary).toContainText(await copyOf(page, "message.too-long"));
    expect(sent).toEqual([]);
    await expect(f.field("message")).toHaveValue(cjk.repeat(1800));

    // A shorter message clears the error as the visitor edits, and then the form sends.
    await f.field("message").fill(cjk.repeat(1000));
    await expect(f.error("message")).toBeHidden();
    await expect(f.summary).toBeHidden();
  });

  test("a message that fits in two byte letters at the full 2,000 is not stopped", async ({
    page,
  }) => {
    const f = await open(page);
    await fillForm(page, { ...VALID, message: String.fromCodePoint(0x00f8).repeat(2000) });
    await f.field("name").focus();
    await expect(f.error("message")).toBeHidden();
  });

  test("the size error goes when another field gets shorter and the message fits again (F6)", async ({
    page,
  }) => {
    const f = await open(page);
    const cjk = String.fromCodePoint(0x6f22);
    // At the edge: 1,560 characters fit with the name "Ada" (16,191 bytes) and not with 30 more in the name (16,458).
    await fillForm(page, { ...VALID, name: cjk.repeat(30), message: cjk.repeat(1560) });
    await f.field("name").focus();
    await expect(f.error("message")).toContainText(await copyOf(page, "message.too-long"));

    await f.field("name").fill("Ada");
    await expect(f.error("message")).toBeHidden();
    await expect(f.field("message")).not.toHaveAttribute("aria-invalid", /.*/);
  });

  test("going straight from the last field to the button does not show an error before the submit", async ({
    page,
  }) => {
    const f = await open(page);
    await f.field("message").focus();
    await page.keyboard.press("Tab");
    await expect(f.submit).toBeFocused();
    await expect(f.error("message")).toBeHidden();
    await page.keyboard.press("Enter");
    await expect(f.error("message")).toBeVisible();
  });
});

test.describe("a failed submit", () => {
  test("shows the error summary, moves focus to it and sends nothing", async ({ page }) => {
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    const f = await open(page);

    await f.submit.click();
    await expect(f.summary).toBeVisible();
    await expect(f.summary).toBeFocused();
    await expect(f.summary).toContainText(await copyOf(page, "name.empty"));
    // One link per failing field, in form order, and a text on every field.
    await expect(f.summary.locator("a")).toHaveCount(4);
    for (const field of FIELDS) {
      await expect(f.error(field)).toBeVisible();
      await expect(f.field(field)).toHaveAttribute("aria-invalid", "true");
    }
    expect(sent).toEqual([]);
    // The button is usable again, and the page is not busy.
    await expect(f.submit).not.toHaveAttribute("aria-disabled", /.*/);
    await expect(f.form).not.toHaveAttribute("aria-busy", /.*/);
  });

  test("the Enter key in a field submits the form the same way", async ({ page }) => {
    const f = await open(page);
    await f.field("name").press("Enter");
    await expect(f.summary).toBeFocused();
  });

  test("each link in the summary moves focus to its field", async ({ page }) => {
    const f = await open(page);
    await f.submit.click();
    const links = f.summary.locator("a");
    await links.nth(1).click();
    await expect(f.field("email")).toBeFocused();
    // The address bar does not change, because the link only moves focus.
    expect(new URL(page.url()).hash).toBe("");
  });

  test("keeps what the visitor typed", async ({ page }) => {
    const f = await open(page);
    await fillForm(page, { name: VALID.name, company: VALID.company });
    await f.submit.click();
    await expect(f.summary).toBeVisible();
    await expect(f.field("name")).toHaveValue(VALID.name);
    await expect(f.field("company")).toHaveValue(VALID.company);
    await expect(f.summary.locator("a")).toHaveCount(2);
  });

  test("goes away when every field is fine", async ({ page }) => {
    const f = await open(page);
    await f.submit.click();
    await expect(f.summary).toBeVisible();
    await fillForm(page);
    await expect(f.summary).toBeHidden();
  });

  test("has no serious accessibility findings", async ({ page }) => {
    const f = await open(page);
    await f.submit.click();
    await expect(f.summary).toBeFocused();
    expect(await blockingAxeFindings(page)).toEqual([]);
  });
});

test.describe("sending", () => {
  test("shows the sending state without the disabled attribute, so focus stays on the button", async ({
    page,
  }) => {
    const sent = await mockContact(page, "hang");
    const f = await open(page);
    await fillForm(page);

    await f.submit.click();
    await expect.poll(() => sent.length).toBe(1);

    await expect(f.submit).toHaveText(await copyOf(page, "button.sending"));
    await expect(f.submit).toHaveAttribute("aria-disabled", "true");
    await expect(f.submit).not.toHaveAttribute("disabled", /.*/);
    await expect(f.form).toHaveAttribute("aria-busy", "true");
    await expect(f.submit).toBeFocused();
    // The fields are unchanged.
    await expect(f.field("message")).toHaveValue(VALID.message);
  });

  test("a second click or Enter while sending sends nothing more", async ({ page }) => {
    const sent = await mockContact(page, "hang");
    const f = await open(page);
    await fillForm(page);

    await f.submit.click();
    await expect.poll(() => sent.length).toBe(1);
    // Playwright waits for an aria-disabled button to become enabled, so the second click is forced.
    await f.submit.click({ force: true });
    await f.field("name").press("Enter");
    await page.waitForTimeout(300);
    expect(sent).toHaveLength(1);
  });

  test("has no serious accessibility findings while sending", async ({ page }) => {
    const sent = await mockContact(page, "hang");
    const f = await open(page);
    await fillForm(page);
    await f.submit.click();
    await expect.poll(() => sent.length).toBe(1);
    expect(await blockingAxeFindings(page)).toEqual([]);
  });
});

test.describe("success", () => {
  test("posts exactly the fields the function accepts and goes to /thanks/", async ({
    page,
    problems,
  }) => {
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    const f = await open(page);
    await fillForm(page, { ...VALID, name: "  Ada Lovelace \t" });

    await f.submit.click();
    await page.waitForURL("**/thanks/");

    expect(sent).toHaveLength(1);
    const [request] = sent;
    expect(request?.method).toBe("POST");
    expect(request?.contentType).toMatch(/^application\/x-www-form-urlencoded/);
    expect([...(request?.fields.keys() ?? [])].sort()).toEqual([
      "cf-turnstile-response",
      "company",
      "email",
      "message",
      "name",
      "website",
    ]);
    expect(request?.fields.get("name")).toBe("Ada Lovelace");
    expect(request?.fields.get("email")).toBe(VALID.email);
    expect(request?.fields.get("website")).toBe("");
    expect(request?.fields.get("cf-turnstile-response")).toBe("TEST-TOKEN-1");

    await expect(page.locator("h1")).toHaveText("Request received.");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    // The address carries no personal data.
    expect(new URL(page.url()).search).toBe("");
    expect(new URL(page.url()).hash).toBe("");
    expect(problems).toEqual([]);
  });
});

test.describe("characters the function refuses (F2)", () => {
  test("C1 controls and bidi controls never reach the request, and the send still works", async ({
    page,
  }) => {
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    const f = await open(page);
    const nel = String.fromCodePoint(0x85);
    const rlo = String.fromCodePoint(0x202e);
    const lri = String.fromCodePoint(0x2066);
    await fillForm(page, {
      name: "Ada" + rlo + "Lovelace",
      email: VALID.email,
      company: "Analytical" + nel + "Engines",
      message: VALID.message + lri + " and a second line.",
    });

    await f.submit.click();
    await page.waitForURL("**/thanks/");
    const fields = sent[0]?.fields;
    expect(fields?.get("name")).toBe("Ada Lovelace");
    expect(fields?.get("company")).toBe("Analytical Engines");
    for (const [name, value] of fields ?? []) {
      expect(/[\u0080-\u009f\u202a-\u202e\u2066-\u2069]/.test(value), name).toBe(false);
    }
  });

  test("an address that holds one is refused by the form, as the function would refuse it", async ({
    page,
  }) => {
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    const f = await open(page);
    await fillForm(page, { ...VALID, email: "ada" + String.fromCodePoint(0x202e) + "@example.dk" });
    await f.submit.click();
    await expect(f.summary).toBeFocused();
    await expect(f.field("email")).toHaveAttribute("aria-invalid", "true");
    expect(sent).toEqual([]);
  });
});

test.describe("when the function says no", () => {
  test("a validation answer marks the fields it names and keeps the widget's token", async ({
    page,
  }) => {
    // The browser checks first, so this is the case where its rules and the function's rules differ.
    await mockContact(page, {
      status: 400,
      json: { ok: false, error: "validation", fields: ["email"] },
    });
    const f = await open(page);
    await fillForm(page);

    await f.submit.click();
    await expect(f.summary).toBeVisible();
    await expect(f.summary).toBeFocused();
    await expect(f.field("email")).toHaveAttribute("aria-invalid", "true");
    await expect(f.error("email")).toContainText(await copyOf(page, "email.invalid"));
    await expect(f.field("name")).not.toHaveAttribute("aria-invalid", /.*/);
    await expect(f.submit).not.toHaveAttribute("aria-disabled", /.*/);
    await expect(f.field("message")).toHaveValue(VALID.message);
    const calls = await turnstileCalls(page);
    expect(calls?.resets).toBe(0);
  });

  test("a failed person check shows a warning, keeps the text and asks the widget for a new token", async ({
    page,
  }) => {
    const sent = await mockContact(page, (_request, index) =>
      index === 0
        ? { status: 403, json: { ok: false, error: "turnstile" } }
        : { status: 200, json: { ok: true } },
    );
    const f = await open(page);
    await fillForm(page);

    await f.submit.click();
    await expect(f.statusRegion).toContainText(await copyOf(page, "person-check"));
    await expect(f.statusRegion).toHaveAttribute("role", "status");
    await expect(f.alertRegion).toBeEmpty();
    await expect(f.field("message")).toHaveValue(VALID.message);
    await expect(f.submit).not.toHaveAttribute("aria-disabled", /.*/);
    expect((await turnstileCalls(page))?.resets).toBe(1);

    // A token works once, so the second try carries the fresh one.
    await f.submit.click();
    await page.waitForURL("**/thanks/");
    expect(sent.map((request) => request.fields.get("cf-turnstile-response"))).toEqual([
      "TEST-TOKEN-1",
      "TEST-TOKEN-2",
    ]);
  });

  const failures = [
    ["a 500 internal error", { status: 500, json: { ok: false, error: "internal" } }],
    ["a 500 config error", { status: 500, json: { ok: false, error: "config" } }],
    ["a 502 mail failure", { status: 502, json: { ok: false, error: "mail_failed" } }],
    [
      "a 503 Turnstile outage",
      { status: 503, json: { ok: false, error: "turnstile_unavailable" } },
    ],
    ["a 403 origin refusal", { status: 403, json: { ok: false, error: "origin_not_allowed" } }],
    ["a 413 body too large", { status: 413, json: { ok: false, error: "payload_too_large" } }],
    [
      "a 415 media type refusal",
      { status: 415, json: { ok: false, error: "unsupported_media_type" } },
    ],
    ["a 405 method refusal", { status: 405, json: { ok: false, error: "method_not_allowed" } }],
    ["a 400 bad request", { status: 400, json: { ok: false, error: "bad_request" } }],
    ["a body that is not JSON", { status: 200, text: "<html>Oops</html>" }],
    ["a 200 that is not a success", { status: 200, json: { ok: false, error: "internal" } }],
    ["a network error", "network-error"],
  ] as const;

  for (const [name, answer] of failures) {
    test(`${name} shows the send failed text, keeps the text and resets the widget`, async ({
      page,
    }) => {
      await mockContact(page, answer);
      const f = await open(page);
      await fillForm(page);

      await f.submit.click();
      await expect(f.alertRegion).toContainText(await copyOf(page, "failed"));
      await expect(f.alertRegion).toHaveAttribute("role", "alert");
      await expect(f.statusRegion).toBeEmpty();
      await expect(f.field("name")).toHaveValue(VALID.name);
      await expect(f.field("message")).toHaveValue(VALID.message);
      await expect(f.submit).not.toHaveAttribute("aria-disabled", /.*/);
      await expect(f.form).not.toHaveAttribute("aria-busy", /.*/);
      expect(page.url()).not.toContain("/thanks/");
      expect((await turnstileCalls(page))?.resets).toBe(1);
    });
  }

  test("the send failed text names the email address as the way around", async ({ page }) => {
    await mockContact(page, { status: 500, json: { ok: false, error: "internal" } });
    const f = await open(page);
    await fillForm(page);
    await f.submit.click();
    await expect(f.alertRegion.getByRole("link", { name: "daniel@normek.dk" })).toBeVisible();
  });

  test("a new submit clears the old notice", async ({ page }) => {
    await mockContact(page, (_request, index) =>
      index === 0
        ? { status: 500, json: { ok: false, error: "internal" } }
        : { status: 403, json: { ok: false, error: "turnstile" } },
    );
    const f = await open(page);
    await fillForm(page);
    await f.submit.click();
    await expect(f.alertRegion).not.toBeEmpty();
    await f.submit.click();
    await expect(f.statusRegion).not.toBeEmpty();
    await expect(f.alertRegion).toBeEmpty();
  });

  test("the notices have no serious accessibility findings", async ({ page }) => {
    await mockContact(page, (_request, index) =>
      index === 0
        ? { status: 500, json: { ok: false, error: "internal" } }
        : { status: 403, json: { ok: false, error: "turnstile" } },
    );
    const f = await open(page);
    await fillForm(page);
    await f.submit.click();
    await expect(f.alertRegion).not.toBeEmpty();
    expect(await blockingAxeFindings(page)).toEqual([]);
    await f.submit.click();
    await expect(f.statusRegion).not.toBeEmpty();
    expect(await blockingAxeFindings(page)).toEqual([]);
  });
});

test.describe("the person check", () => {
  test("the widget script loads on first use of the form, once, with the right options", async ({
    page,
  }) => {
    const f = await open(page);
    const requested = f.requested;
    await page.waitForTimeout(400);
    expect(requested, "Cloudflare must not be contacted before the form is used").toEqual([]);

    await f.field("name").focus();
    await expect.poll(() => requested.length).toBe(1);
    expect(requested[0]).toContain("render=explicit");
    await expect.poll(async () => (await turnstileCalls(page))?.renders.length).toBe(1);
    expect((await turnstileCalls(page))?.renders[0]).toEqual({
      sitekey: DUMMY_SITE_KEY,
      action: "contact",
      appearance: "interaction-only",
    });

    // More use of the form loads nothing more.
    await f.field("email").focus();
    await f.field("message").click();
    await page.waitForTimeout(300);
    expect(requested).toHaveLength(1);
  });

  test("a click in the form starts it too", async ({ page }) => {
    const f = await open(page);
    const requested = f.requested;
    await f.field("company").click();
    await expect.poll(() => requested.length).toBe(1);
  });

  test("a script that cannot load fails at once on every submit with the send failed text, and is asked for again each time (QA-01)", async ({
    page,
  }) => {
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    const f = await open(page, { turnstile: "blocked" });
    await fillForm(page);

    for (let attempt = 1; attempt <= 4; attempt++) {
      const before = Date.now();
      await f.submit.click();
      // The old behaviour was a quick failure on the first submit and 15 seconds on "Sending..." after that.
      await expect(f.alertRegion).toContainText(await copyOf(page, "failed"), { timeout: 3000 });
      expect(Date.now() - before, "attempt " + attempt).toBeLessThan(3500);
      await expect(f.submit).not.toHaveAttribute("aria-disabled", /.*/);
      await expect(f.form).not.toHaveAttribute("aria-busy", /.*/);
      await expect(f.statusRegion).toBeEmpty();
      await expect(f.field("message")).toHaveValue(VALID.message);
    }
    expect(sent, "nothing is sent without a token").toEqual([]);
    // The first use of the form asked for the script, and every submit asked again.
    expect(f.requested.length).toBeGreaterThanOrEqual(5);
    // A failed script leaves no element behind, so a retry is a fresh request and the head does not fill up.
    await expect(page.locator('script[src*="challenges.cloudflare.com"]')).toHaveCount(0);
  });

  test("a widget that throws when it starts fails at once on every submit too (G9)", async ({
    page,
  }) => {
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    const f = await open(page, { turnstile: "render-throws" });
    await fillForm(page);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __turnstileRenders: number }).__turnstileRenders,
        ),
      )
      .toBe(1);

    for (let attempt = 1; attempt <= 3; attempt++) {
      const before = Date.now();
      await f.submit.click();
      await expect(f.alertRegion).toContainText(await copyOf(page, "failed"), { timeout: 3000 });
      expect(Date.now() - before, "attempt " + attempt).toBeLessThan(3500);
      await expect(f.submit).not.toHaveAttribute("aria-disabled", /.*/);
    }
    // Each submit tried to start the widget again, and the script was loaded once.
    const renders = await page.evaluate(
      () => (window as unknown as { __turnstileRenders: number }).__turnstileRenders,
    );
    expect(renders).toBeGreaterThanOrEqual(4);
    expect(f.requested).toHaveLength(1);
    expect(sent).toEqual([]);
  });

  test("a script that was blocked and then is allowed works on the next submit", async ({
    page,
  }) => {
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    let allowed = false;
    await useSiteKey(page);
    await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js*", (route) =>
      allowed
        ? route.fulfill({
            contentType: "application/javascript",
            body: "window.turnstile={render(c,o){setTimeout(()=>o.callback('LATE-TOKEN'),5);return 'w'},reset(){},remove(){}};",
          })
        : route.abort("blockedbyclient"),
    );
    await page.goto("/");
    const submit = page.locator("#contact-submit");
    await expect(submit).toBeEnabled();
    await fillForm(page);
    await submit.click();
    await expect(page.locator("#contact-notice")).toContainText(await copyOf(page, "failed"));

    allowed = true;
    await submit.click();
    await page.waitForURL("**/thanks/");
    expect(sent[0]?.fields.get("cf-turnstile-response")).toBe("LATE-TOKEN");
  });

  test("a widget error shows the person check warning on submit", async ({ page }) => {
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    const f = await open(page);
    await fillForm(page);
    await expect.poll(async () => (await turnstileCalls(page))?.renders.length).toBe(1);
    await page.evaluate(() =>
      (window as unknown as { __turnstileError: () => void }).__turnstileError(),
    );
    await f.submit.click();
    await expect(f.statusRegion).toContainText(await copyOf(page, "person-check"));
    expect(sent).toEqual([]);
  });

  test("with no site key the form renders, and a submit shows the send failed text and sends nothing", async ({
    page,
  }) => {
    // This is the private preview before the Cloudflare setup: the build has no PUBLIC_TURNSTILE_SITE_KEY.
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    const f = await open(page, { siteKey: false });
    await expect(f.form).toHaveAttribute("data-sitekey", "");
    await fillForm(page);

    await f.submit.click();
    await expect(f.alertRegion).toContainText(await copyOf(page, "failed"));
    await expect(f.field("message")).toHaveValue(VALID.message);
    await expect(f.submit).not.toHaveAttribute("aria-disabled", /.*/);
    expect(sent).toEqual([]);
    expect(f.requested, "no site key, so the script is never asked for").toEqual([]);
  });
});

test.describe("the notice regions (QA-02)", () => {
  test("are in the accessibility tree before any text is put in them, so a notice is announced", async ({
    page,
  }) => {
    const f = await open(page);
    // Playwright leaves out what the accessibility tree leaves out, so display:none would give a count of 0.
    await expect(page.getByRole("alert")).toHaveCount(1);
    await expect(page.getByRole("status")).toHaveCount(1);
    for (const region of [f.alertRegion, f.statusRegion]) {
      await expect(region).toBeEmpty();
      const look = await region.evaluate((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return {
          display: style.display,
          visibility: style.visibility,
          position: style.position,
          width: box.width,
          height: box.height,
        };
      });
      expect(look.display).not.toBe("none");
      expect(look.visibility).toBe("visible");
      // Out of sight and out of the flow: one pixel, absolutely placed.
      expect(look.position).toBe("absolute");
      expect(look.width).toBeLessThanOrEqual(1);
      expect(look.height).toBeLessThanOrEqual(1);
    }
  });

  test("take no room while empty, so the layout is the one the design has", async ({ page }) => {
    await open(page);
    // Message block, then the empty person check container, then the button, in a column with a 20 px gap.
    // The two regions are out of the flow, so they add no gap of their own: 20 + 0 + 20.
    const distance = await page.evaluate(() => {
      const block = document
        .querySelector("#contact-message")
        ?.parentElement?.getBoundingClientRect();
      const button = document.querySelector("#contact-submit")?.getBoundingClientRect();
      return block && button ? Math.round(button.top - block.bottom) : -1;
    });
    expect(distance).toBe(40);
  });

  test("show their text, with the role of the notice, when it arrives", async ({ page }) => {
    await mockContact(page, { status: 500, json: { ok: false, error: "internal" } });
    const f = await open(page);
    await fillForm(page);
    await f.submit.click();
    await expect(f.alertRegion).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(await copyOf(page, "failed"));
    const box = await f.alertRegion.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(20);
  });
});

test.describe("the notices at 200 percent text on a phone (QA-07)", () => {
  const answers = [
    ["the send failed notice", { status: 500, json: { ok: false, error: "internal" } }],
    ["the person check notice", { status: 403, json: { ok: false, error: "turnstile" } }],
  ] as const;

  for (const [name, answer] of answers) {
    test(`${name} does not push the page wider`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "phone-390", "A phone width test.");
      await mockContact(page, answer);
      const f = await open(page);
      await fillForm(page);
      await f.submit.click();
      await expect(page.locator("#contact-notice > *, #contact-warning > *").first()).toBeVisible();
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("the error summary does not push the page wider either", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "phone-390", "A phone width test.");
    const f = await open(page);
    await f.submit.click();
    await expect(f.summary).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("the honeypot", () => {
  test("is out of sight, out of the accessibility tree and out of the tab order", async ({
    page,
  }) => {
    const f = await open(page);
    const trap = page.locator("#contact-website");
    await expect(trap).toHaveAttribute("tabindex", "-1");
    await expect(trap).toHaveAttribute("autocomplete", "off");
    await expect(trap.locator("xpath=ancestor::div[@aria-hidden='true'][1]")).toHaveCount(1);
    const box = await trap.locator("xpath=ancestor::div[@aria-hidden='true'][1]").boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual(1);
    expect(box?.height ?? 0).toBeLessThanOrEqual(1);
    // A screen reader does not find it by its label.
    const label = (await page.locator('label[for="contact-website"]').textContent())?.trim() ?? "";
    expect(label).not.toBe("");
    await expect(page.getByRole("textbox", { name: label })).toHaveCount(0);

    // Tabbing through the whole form never lands on it.
    await f.field("name").focus();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement?.id)).not.toBe("contact-website");
    }
  });

  test("an empty honeypot is posted, and so is a filled one for the function to catch", async ({
    page,
  }) => {
    const sent = await mockContact(page, { status: 200, json: { ok: true } });
    const f = await open(page);
    await fillForm(page);
    await page.locator("#contact-website").evaluate((input: HTMLInputElement) => {
      input.value = "bot";
    });
    await f.submit.click();
    await page.waitForURL("**/thanks/");
    expect(sent[0]?.fields.get("website")).toBe("bot");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the form says it needs JavaScript, names the email address and has a disabled button", async ({
    page,
  }) => {
    await page.goto("/");
    // A browser with scripts off reads the <noscript> content as markup. This browser still holds it as text,
    // so the test reads the element, and the screenshot check in the QA notes shows how it looks.
    const notice = await page.locator("#contact-form > noscript").innerHTML();
    expect(notice).toContain("The form needs JavaScript.");
    expect(notice).toContain('href="mailto:daniel@normek.dk"');
    // The button cannot start a native submit that the function would answer with JSON.
    await expect(page.locator("#contact-submit")).toBeDisabled();
    await page.locator("#contact-submit").click({ force: true });
    expect(new URL(page.url()).pathname).toBe("/");
  });
});

test.describe("the page around the form", () => {
  test("has no serious accessibility findings with the form filled in", async ({ page }) => {
    const f = await open(page);
    await fillForm(page);
    await expect(f.field("name")).toHaveValue(VALID.name);
    expect(await blockingAxeFindings(page)).toEqual([]);
  });
});
