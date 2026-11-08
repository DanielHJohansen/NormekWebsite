import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Playwright specs in tests/e2e run with `npm run test:a11y`, not here.
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    restoreMocks: true,
    unstubEnvs: true,
  },
});
