/**
 * The supply chain settings that the security gate asked for (G6, review S5): Lighthouse CI comes from the lockfile,
 * not from an unpinned download in CI, and every dependency is an exact version.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};
const lock = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
  packages: Record<string, { version?: string; dev?: boolean }>;
};
const ci = readFileSync(".github/workflows/ci.yml", "utf8");

describe("Lighthouse CI", () => {
  it("is a dev dependency at an exact version", () => {
    expect(pkg.devDependencies["@lhci/cli"]).toBe("0.15.1");
    expect(pkg.dependencies["@lhci/cli"]).toBeUndefined();
  });

  it("is in the lockfile, as a dev dependency, at that version", () => {
    const entry = lock.packages["node_modules/@lhci/cli"];
    expect(entry?.version).toBe("0.15.1");
    expect(entry?.dev).toBe(true);
  });

  it("runs from node_modules in CI, with nothing fetched by npx", () => {
    expect(ci).toContain("npx lhci autorun --config=./lighthouserc.json");
    expect(ci).not.toMatch(/npx\s+--yes/);
    expect(ci).not.toMatch(/@lhci\/cli@/);
  });

  it("still reads the budgets from lighthouserc.json, which exists", () => {
    expect(() => readFileSync("lighthouserc.json", "utf8")).not.toThrow();
  });
});

describe("dependencies", () => {
  it("are exact versions, so the lockfile and package.json agree and nothing floats", () => {
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [name, version] of Object.entries(all)) {
      expect(version, name).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("run no install scripts, here or on Cloudflare's build", () => {
    expect(readFileSync(".npmrc", "utf8")).toMatch(/^ignore-scripts=true$/m);
    expect(ci).toContain("npm ci --ignore-scripts");
  });

  it("keep the production tree free of the Lighthouse tool", () => {
    // The shipped site and the build need none of it. CI audits production dependencies only, at the high level.
    expect(ci).toContain("npm audit --omit=dev --audit-level=high");
    expect(
      Object.keys(pkg.dependencies).some(
        (name) => name.includes("lighthouse") || name.includes("lhci"),
      ),
    ).toBe(false);
  });
});
