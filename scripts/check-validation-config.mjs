import { readFileSync } from "node:fs";
const config = JSON.parse(readFileSync(new URL("../wrangler.validation.jsonc", import.meta.url), "utf8"));
const id = config.kv_namespaces?.[0]?.id;
if (!/^[a-f0-9]{32}$/.test(id ?? "") || id === "8f260f3c8ab6476dbea2b17926bf38bf") {
  throw new Error("Validation requires a proven newly created isolated KV namespace ID");
}
if (config.name !== "bee-validation-20260909" || config.main !== "src/validation.ts" || config.routes?.length || config.analytics_engine_datasets?.length) {
  throw new Error("Validation target or binding scope differs from the reviewed isolated config");
}
