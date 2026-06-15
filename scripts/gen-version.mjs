// Writes the commit SHA into src/version.ts so it is baked into the immutable
// Worker bundle of THIS version — per-version by construction, no shared/mutable
// var, nothing to remember at deploy time. Run automatically by wrangler's
// build.command (see wrangler.jsonc) on every `wrangler deploy` / `dev` /
// `versions upload`. Resolution order:
//   1. WORKERS_CI_COMMIT_SHA  — set by Cloudflare Workers Builds
//   2. `git rev-parse HEAD`   — local builds
//   3. "dev"                  — neither available
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

function resolveSha() {
  const fromCI = process.env.WORKERS_CI_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA;
  if (fromCI && fromCI.trim()) return fromCI.trim();
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "dev";
  }
}

const sha = resolveSha();
const out = `// GENERATED at build time by scripts/gen-version.mjs — do not edit by hand.
// Committed default is "dev"; the build overwrites it with the real commit SHA.
export const COMMIT_SHA = ${JSON.stringify(sha)};
`;
writeFileSync(new URL("../src/version.ts", import.meta.url), out);
console.log(`gen-version: src/version.ts COMMIT_SHA=${sha}`);
