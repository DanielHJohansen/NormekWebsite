#!/usr/bin/env node
// Daniel's writing rule: no em dash and no semicolon in prose.
// Scans Markdown and MDX files. Fenced code blocks and inline code are skipped.
// Usage: node scripts/check-writing-rules.mjs [file-or-folder ...]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const EM_DASH = "—";
const args = process.argv.slice(2);
const targets = args.length
  ? args
  : ["CLAUDE.md", "README.md", "docs", ".claude", "brand", "src/content"];
const skipDirs = new Set(["node_modules", ".git", "dist", ".astro", "qa"]);
const exts = new Set([".md", ".mdx"]);

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
  } else if (exts.has(extname(path))) {
    out.push(path);
  }
}

// Blank out code but keep newlines so reported line numbers stay correct.
function stripCode(text) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return text
    .replace(/```[\s\S]*?```/g, blank)
    .replace(/~~~[\s\S]*?~~~/g, blank)
    .replace(/`[^`\n]*`/g, blank);
}

const files = [];
for (const t of targets) walk(t, files);

let problems = 0;
for (const file of files) {
  const lines = stripCode(readFileSync(file, "utf8")).split("\n");
  lines.forEach((line, i) => {
    const hits = [];
    if (line.includes(EM_DASH)) hits.push("em dash");
    if (line.includes(";")) hits.push("semicolon");
    if (hits.length) {
      problems++;
      console.log(`${file}:${i + 1}: ${hits.join(" and ")}: ${line.trim().slice(0, 100)}`);
    }
  });
}

if (problems) {
  console.log(`\n${problems} line(s) break the writing rules. Rewrite with a period, comma, colon or parentheses.`);
  process.exit(1);
}
console.log(`OK: ${files.length} file(s) checked, no em dash or semicolon in prose.`);
