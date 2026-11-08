/**
 * CF-13 of docs/security/threat-model-and-requirements.md section 3: no personal data in logs.
 *
 * Every console method is spied on. Each scenario in contact-sentinels.ts drives the function
 * down one path with a marker in every input and secret, including the paths where an upstream
 * error or an exception quotes a marker. The only output allowed is a fixed event name and a
 * status number.
 */
import { describe, expect, it } from "vitest";
import { useContactHarness } from "./contact-harness";
import { ALL_SENTINELS, EXPECTED_LOG, scenarios } from "./contact-sentinels";

const h = useContactHarness();

/** "contact", one of four fixed event names, and at most one status number. */
const ALLOWED_LINE =
  /^contact (config_error|turnstile_unavailable|mail_failed|unexpected_error)( \d{1,3})?$/;

describe.each(Object.entries(scenarios))("CF-13 %s", (name, run) => {
  it("writes no submitted value, token, address or secret to any console method", async () => {
    await run(h);
    const output = h.consoleLines().join("\n");
    for (const sentinel of ALL_SENTINELS) expect(output).not.toContain(sentinel);
  });

  it("writes only a fixed event name and a status number, and exactly the lines expected", async () => {
    await run(h);
    for (const line of h.consoleLines()) expect(line).toMatch(ALLOWED_LINE);
    expect(h.consoleLines()).toEqual(EXPECTED_LOG[name] ?? []);
  });

  it("logs each event as one plain string, never an object or an error", async () => {
    await run(h);
    for (const args of h.consoleCalls()) {
      expect(args).toHaveLength(1);
      expect(typeof args[0]).toBe("string");
    }
  });
});

describe("CF-13 the spy itself", () => {
  it("sees every console method, so the checks above can fail", () => {
    console.log("control-log");
    console.info("control-info");
    console.warn("control-warn");
    console.error("control-error");
    console.debug("control-debug");
    expect([...h.consoleLines()].sort()).toEqual([
      "control-debug",
      "control-error",
      "control-info",
      "control-log",
      "control-warn",
    ]);
  });

  it("would catch a marker, because the scenarios do contain markers", async () => {
    await scenarios["an accepted request"]?.(h);
    const sent = JSON.stringify(h.calls.map((call) => String(call.init.body)));
    // The markers really are in the outbound mail, so an empty console is a result and not luck.
    expect(sent).toContain("SENTINEL-name-71c2");
    expect(sent).toContain("sentinel-email-71c2@example.com");
  });
});
