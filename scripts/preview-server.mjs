#!/usr/bin/env node
// Serves dist/ in the foreground until it is stopped. Used by Playwright (see playwright.config.ts).
//
// Why not `astro preview`? Astro 7 detaches it into the background when it thinks a coding agent is
// running it. The command then exits at once, and a process manager believes the server has died.
// The programmatic API below always stays in the foreground.
//
// Usage: node scripts/preview-server.mjs [port]
import { preview } from "astro";
import { existsSync } from "node:fs";

if (!existsSync("dist/index.html")) {
  console.error("dist/ is missing. Run `npm run build` first.");
  process.exit(2);
}

const port = Number(process.argv[2] ?? 4321);
const server = await preview({ root: ".", logLevel: "warn", server: { host: "127.0.0.1", port } });
console.log(`Serving dist/ at http://127.0.0.1:${server.port}/`);

const stop = async () => {
  await server.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await server.closed();
