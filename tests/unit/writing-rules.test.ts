/**
 * Daniel's writing rule, as the check applies it. The YAML content files are prose too (QA-11): their text is checked
 * and their comments are not.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { EM_DASH, findProblems, stripCode, yamlProse } from "../../scripts/lib/writing-rules.mjs";

const dash = String.fromCodePoint(0x2014);
const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe("findProblems", () => {
  it("reports an em dash and a semicolon, with the line", () => {
    const found = findProblems(`fine\na ${dash} b\nc; d\ne ${dash}; f`);
    expect(found.map((problem) => [problem.line, problem.what])).toEqual([
      [2, "em dash"],
      [3, "semicolon"],
      [4, "em dash and semicolon"],
    ]);
  });

  it("knows the em dash by its code point", () => {
    expect(EM_DASH).toBe(dash);
    expect(EM_DASH.codePointAt(0)).toBe(0x2014);
  });

  it("lets an en dash and a hyphen through, which the rule does not forbid", () => {
    expect(findProblems("2–4 weeks and a well-known thing")).toEqual([]);
  });
});

describe("stripCode", () => {
  it("blanks fenced and inline code and keeps the line numbers", () => {
    const text = "a\n```js\nx; y\n```\n`z;`\nb;";
    const problems = findProblems(stripCode(text));
    expect(problems.map((problem) => problem.line)).toEqual([6]);
  });
});

describe("yamlProse", () => {
  it("checks the values and not the comments", () => {
    const yaml = [
      "# a note; with a semicolon",
      "name: Enclosure review",
      "summary: One thing; another thing  # a comment; here",
      "items:",
      "  - First item # trailing note",
      `  - Second ${dash} item`,
    ].join("\n");
    const problems = findProblems(yamlProse(yaml));
    expect(problems.map((problem) => [problem.line, problem.what])).toEqual([
      [3, "semicolon"],
      [6, "em dash"],
    ]);
  });

  it("does not take a # inside quotes or a word for a comment", () => {
    const yaml = [
      'quoted: "Use #1; always"',
      "single: 'Item #2; ok'",
      "word: C#; not a comment",
      "url: https://example.com/a#b; c",
    ].join("\n");
    expect(findProblems(yamlProse(yaml)).map((problem) => problem.line)).toEqual([1, 2, 3, 4]);
  });

  it("treats an apostrophe in a word as text, not as the start of a quote", () => {
    const yaml = "text: I don't know; really # comment; skipped";
    const problems = findProblems(yamlProse(yaml));
    expect(problems).toHaveLength(1);
    expect(problems[0]?.what).toBe("semicolon");
  });

  it("keeps every line, so line numbers stay right", () => {
    expect(yamlProse("a\n# b\nc").split("\n")).toHaveLength(3);
  });
});

describe("the check on a folder", () => {
  const run = (files: Record<string, string>) => {
    const root = mkdtempSync(join(tmpdir(), "normek-writing-"));
    folders.push(root);
    for (const [path, text] of Object.entries(files)) {
      const full = join(root, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, text);
    }
    return spawnSync("node", [join(process.cwd(), "scripts/check-writing-rules.mjs"), root], {
      encoding: "utf8",
    });
  };

  it("fails a semicolon in a YAML file under src/content, and names the file and line", () => {
    const result = run({ "src/content/offers/en/1.yaml": "name: A\nsummary: Plan; build\n" });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("1.yaml:2: semicolon");
  });

  it("passes a YAML comment with a semicolon", () => {
    const result = run({
      "src/content/site/en/footer.yaml": "# note; fine\ntagline: Plain text\n",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("1 file(s) checked");
  });

  it("does not read YAML outside src/content, which is code", () => {
    const result = run({ ".github/workflows/ci.yml": "run: a; b\n", "docs/x.yaml": "k: v;\n" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("0 file(s) checked");
  });

  it("still checks Markdown anywhere", () => {
    const result = run({ "docs/a.md": "One; two\n" });
    expect(result.status).toBe(1);
  });

  it("passes the real repository", () => {
    expect(() =>
      execFileSync("node", ["scripts/check-writing-rules.mjs"], { encoding: "utf8" }),
    ).not.toThrow();
  });
});
