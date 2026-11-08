import { describe, expect, it } from "vitest";
import { onRequest } from "../../functions/api/contact";

// The real function is task 8 and its rules CF-01 to CF-15 get their own tests then.
// This stub only has to answer 501 and carry the response headers from
// docs/security/threat-model-and-requirements.md section 2.4, because _headers does not apply to functions.
describe("contact function stub", () => {
  it("answers 501 with a JSON body that says why", async () => {
    const response = onRequest();
    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({ ok: false, error: "not_implemented" });
  });

  it("sets its own security headers", () => {
    const { headers } = onRequest();
    expect(headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(headers.get("cache-control")).toBe("no-store");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("content-security-policy")).toBe(
      "default-src 'none'; frame-ancestors 'none'",
    );
    expect(headers.get("referrer-policy")).toBe("no-referrer");
    expect(headers.get("x-robots-tag")).toBe("noindex");
  });

  it("never sends cross-origin permission headers", () => {
    const { headers } = onRequest();
    expect([...headers.keys()].filter((name) => name.startsWith("access-control-"))).toEqual([]);
  });
});
