import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  // Not part of the site code. brand/logo/source is its own package and stays untouched.
  globalIgnores(["dist/", ".astro/", "node_modules/", "brand/", "docs/", "qa/", ".claude/"]),

  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,

  {
    rules: {
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Site code runs at build time in Node and in the visitor's browser.
  {
    files: ["src/**/*.{ts,astro}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Nothing from a visitor may reach a log. Use a fixed event code if logging is ever needed.
      "no-console": "error",
    },
  },

  // Pages Functions run on the Workers runtime.
  {
    files: ["functions/**/*.ts"],
    languageOptions: { globals: { ...globals.serviceworker } },
    rules: { "no-console": "error" },
  },

  // Astro generates the types this file points at, and its docs use this exact reference.
  {
    files: ["src/env.d.ts"],
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },

  // Tooling and tests run in Node. Console output is how scripts report.
  {
    files: ["scripts/**/*.mjs", "tests/**/*.ts", "*.config.{js,mjs,ts}"],
    languageOptions: { globals: { ...globals.node } },
  },
]);
