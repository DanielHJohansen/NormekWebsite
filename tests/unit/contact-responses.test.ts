/**
 * CF-14 of docs/security/threat-model-and-requirements.md section 3: responses.
 * The body is {"ok":true} or {"ok":false,"error":"<code>","fields":[...]}. No input or secret is
 * echoed (sentinel test). The headers are those of section 2.4. The statuses and codes agree with
 * the contract in docs/security/contact-api.md, which the form client is built against.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ERROR_STATUS, type ErrorCode } from "../../functions/_lib/http";
import { buildRequest, encode, fields, json, readJson, useContactHarness } from "./contact-harness";
import { ALL_SENTINELS, scenarios, throwingEnv } from "./contact-sentinels";

const h = useContactHarness();

/** One live request for every code the function can answer with. A new code fails to compile until it has one. */
const LIVE: Record<ErrorCode, () => Promise<Response>> = {
  validation: () => h.send({ fields: { email: "nope" } }),
  bad_request: () => h.send({ body: encode([...Object.entries(fields()), ["to", "eve@example.net"]]) }),
  turnstile: () => h.send({ fields: { "cf-turnstile-response": undefined } }),
  origin_not_allowed: () => h.send({ origin: "https://evil.example" }),
  method_not_allowed: () => h.send({ method: "GET" }),
  payload_too_large: () => h.send({ headers: { "content-length": "16385" } }),
  unsupported_media_type: () => h.send({ contentType: "application/json" }),
  config: () => h.send({ env: { RESEND_API_KEY: undefined } }),
  internal: () => h.dispatch(buildRequest(), throwingEnv("boom")),
  mail_failed: () => {
    h.setResend(() => json({}, 500));
    return h.send();
  },
  turnstile_unavailable: () => {
    h.setSiteverify(() => json({}, 500));
    return h.send();
  },
};

const HEADERS: Readonly<Record<string, string>> = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex",
};

const CODES = Object.keys(ERROR_STATUS) as ErrorCode[];

describe("CF-14 the body", () => {
  it('is exactly {"ok":true} for a success', async () => {
    const response = await h.send();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('{"ok":true}');
  });

  it.each(CODES)("is {ok:false, error:%s} with the status the contract gives it", async (code) => {
    const response = await LIVE[code]();
    expect(response.status).toBe(ERROR_STATUS[code]);
    const body = (await readJson(response)) as Record<string, unknown>;
    expect(body["ok"]).toBe(false);
    expect(body["error"]).toBe(code);
    // Only a validation error lists fields.
    expect(Object.keys(body).sort()).toEqual(code === "validation" ? ["error", "fields", "ok"] : ["error", "ok"]);
  });

  it("names a failing field and nothing else in a validation error", async () => {
    const response = await LIVE.validation();
    expect(await response.text()).toBe('{"ok":false,"error":"validation","fields":["email"]}');
  });

  it("has one of the documented shapes in every scenario", async () => {
    for (const [name, run] of Object.entries(scenarios)) {
      const response = await run(h);
      const body = (await readJson(response)) as Record<string, unknown>;
      const allowedKeys = body["error"] === "validation" ? ["error", "fields", "ok"] : ["error", "ok"];
      if (body["ok"] === true) {
        expect(Object.keys(body), name).toEqual(["ok"]);
        expect(response.status, name).toBe(200);
      } else {
        expect(Object.keys(body).sort(), name).toEqual(allowedKeys);
        expect(CODES, name).toContain(body["error"]);
        expect(response.status, name).toBe(ERROR_STATUS[body["error"] as ErrorCode]);
      }
    }
  });
});

describe("CF-14 headers", () => {
  /** Section 2.4 of the threat model, and the headers the first version of this function already set. */
  it("sets the headers of section 2.4 on a success", async () => {
    const response = await h.send();
    expect(Object.fromEntries(response.headers)).toEqual(HEADERS);
  });

  it.each(CODES)("sets the same headers on a %s answer", async (code) => {
    const response = await LIVE[code]();
    const expected = code === "method_not_allowed" ? { ...HEADERS, allow: "POST" } : HEADERS;
    expect(Object.fromEntries(response.headers)).toEqual(expected);
  });

  it("sets the same headers on a caught honeypot", async () => {
    const response = await h.send({ fields: { website: "x" } });
    expect(Object.fromEntries(response.headers)).toEqual(HEADERS);
  });

  it("states each header value on its own, as the section 2.4 list does", async () => {
    const { headers } = await h.send();
    expect(headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(headers.get("cache-control")).toBe("no-store");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("content-security-policy")).toBe("default-src 'none'; frame-ancestors 'none'");
    expect(headers.get("referrer-policy")).toBe("no-referrer");
    expect(headers.get("x-robots-tag")).toBe("noindex");
  });

  it("never sends cross-origin permission headers", async () => {
    for (const code of CODES) {
      const { headers } = await LIVE[code]();
      expect([...headers.keys()].filter((name) => name.startsWith("access-control-"))).toEqual([]);
    }
  });
});

describe("CF-14 nothing is echoed", () => {
  it.each(Object.entries(scenarios))(
    "answers %s without any submitted value, token, address or secret in the body or headers",
    async (_name, run) => {
      const response = await run(h);
      const everything = [
        await response.text(),
        ...[...response.headers].flat(),
      ].join("\n");
      for (const sentinel of ALL_SENTINELS) expect(everything).not.toContain(sentinel);
    },
  );

  it("does not even repeat the markers that make the request invalid", async () => {
    const response = await scenarios["a validation error"]?.(h);
    expect(await response?.text()).toBe('{"ok":false,"error":"validation","fields":["email","message"]}');
  });
});

describe("CF-14 the contract in docs/security/contact-api.md", () => {
  const doc = readFileSync("docs/security/contact-api.md", "utf8");
  const section = (from: string, to: string): string => {
    const start = doc.indexOf(from);
    const end = doc.indexOf(to);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    return doc.slice(start, end);
  };

  const rows = [...section("## 3. Responses", "## 4. Response headers").matchAll(/^\| (\d{3}) \| `(\{[^`]*\})` \|/gm)].map(
    (match) => ({ status: Number(match[1]), body: JSON.parse(match[2] ?? "null") as Record<string, unknown> }),
  );

  it("documents the success answer", () => {
    expect(rows.filter((row) => row.status === 200).map((row) => row.body)).toEqual([{ ok: true }]);
  });

  it("documents exactly the codes and statuses the function answers with", () => {
    const documented = rows
      .filter((row) => row.status !== 200)
      .map((row) => `${row.status} ${String(row.body["error"])}`)
      .sort();
    const implemented = Object.entries(ERROR_STATUS)
      .map(([code, status]) => `${status} ${code}`)
      .sort();
    expect(documented).toEqual(implemented);
  });

  it("documents the field list of a validation error", () => {
    const validation = rows.find((row) => row.body["error"] === "validation");
    expect(Array.isArray(validation?.body["fields"])).toBe(true);
    expect(rows.filter((row) => "fields" in row.body)).toHaveLength(1);
  });

  it("documents the response headers the function sets", () => {
    const block = section("## 4. Response headers", "## 5. Order of checks").match(/```\n([\s\S]*?)```/);
    const documented: Record<string, string> = {};
    for (const line of (block?.[1] ?? "").split("\n")) {
      const at = line.indexOf(": ");
      if (at > 0) documented[line.slice(0, at).toLowerCase()] = line.slice(at + 2);
    }
    expect(documented).toEqual(HEADERS);
  });
});
