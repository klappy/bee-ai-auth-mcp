// Embeds docs/bee-api-usage.md into src/bee-api-usage-doc.ts so bee_docs can serve
// it at runtime (Workers has no filesystem access to docs/). Edit the .md, then
// re-run `node scripts/gen-bee-docs.mjs`. Optionally chain into wrangler build.
import { readFileSync, writeFileSync } from "node:fs";
const md = readFileSync("docs/bee-api-usage.md", "utf8");
const esc = md.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
writeFileSync(
  "src/bee-api-usage-doc.ts",
  "/* AUTO-GENERATED from docs/bee-api-usage.md by scripts/gen-bee-docs.mjs.\n" +
  "   Do not edit by hand — edit the .md and regenerate. bee_docs serves this. */\n" +
  "export const BEE_API_USAGE_DOC = `" + esc + "`;\n"
);
console.log("wrote src/bee-api-usage-doc.ts");
