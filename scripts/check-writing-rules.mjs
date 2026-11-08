#!/usr/bin/env node
// Daniel's writing rule: no em dash and no semicolon in prose.
// Scans Markdown and MDX files, with fenced code blocks and inline code skipped, and the YAML content files under
// src/content (the text, not the comments: the offers and the footer are prose too).
// Usage: node scripts/check-writing-rules.mjs [file-or-folder ...]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, sep } from "node:path";
import { findProblems, stripCode, yamlProse } from "./lib/writing-rules.mjs";

const args = process.argv.slice(2);
const targets = args.length
  ? args
  : ["CLAUDE.md", "README.md", "docs", ".claude", "brand", "src/content"];
const skipDirs = new Set(["node_modules", ".git", "dist", "dist-simply", ".astro", "qa"]);
const markdown = new Set([".md", ".mdx"]);
const yaml = new Set([".yaml", ".yml"]);

/** YAML elsewhere (workflows, configuration) is code. Only the content under src/content is prose. */
const isContentYaml = (/** @type {string} */ path) =>
  yaml.has(extname(path)) && path.split(sep).join("/").includes("src/content/");

/** @param {string} path @param {string[]} out */
function walk(path, out) {
  let st;
  try {
    st = statSync(path);
  } catch {
    return;
  }
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) {
      if (!skipDirs.has(name)) walk(join(path, name), out);
    }
  } else if (markdown.has(extname(path)) || isContentYaml(path)) {
    out.push(path);
  }
}

/** @type {string[]} */
const files = [];
for (const target of targets) walk(target, files);

let problems = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const prose = isContentYaml(file) ? yamlProse(text) : stripCode(text);
  for (const problem of findProblems(prose)) {
    problems++;
    console.log(`${file}:${problem.line}: ${problem.what}: ${problem.text}`);
  }
}

if (problems) {
  console.log(
    `\n${problems} line(s) break the writing rules. Rewrite with a period, comma, colon or parentheses.`,
  );
  process.exit(1);
}
console.log(`OK: ${files.length} file(s) checked, no em dash or semicolon in prose.`);
