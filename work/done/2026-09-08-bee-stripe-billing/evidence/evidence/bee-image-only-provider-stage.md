# Exact isolated image-build stage — review candidate

Local Otto, 2026-09-09; supplements frozen e97489b10faeddc4c4ea4968be5e84f475ff884d6acf604cb033a5d49c9bfbb5. No mutation executed. This stage builds the real CLI image only; it does not deploy a Worker or start a Container.

Authority reconciliation: current user explicitly directs isolated validation and says “prefer version-then-explicit-deploy mechanisms when supported”, “inspect settings/deployments after writes”, and “never experiment with these operations against production”. Root has asked independent review of this specific isolated API interpretation against older generic HYGIENE 10a. Do not treat our interpretation as a PASS; no new owner approval is sought for already authorized isolated resources.

## Why this path

Observed production Builds triggers cover all repository branches. No source push to bee-ai-auth-mcp and no production trigger edit. Existing source commit ea68e53edb8e684c779b89fcbbf5c9496b7200b5 already contains Dockerfile and broker plus pinned upstream Bee CLI e67032d59bdfdc7f3bc73dd67683328c3e0d58b2. Actual source and image digest must both be retained. No local docker or podman is installed. Cloudflare API schema supports manually building an exact commit on a NEW trigger, using the existing authorized repository connection and stored credential reference without revealing credentials.

## Exact bounded operations proposed

1. Recheck name absent and Access collision. Create ONLY undeployed `bee-validation-20260909` Worker identity via previously specified B0 new Worker API, disabled subdomain/previews/logging, redaction true. Readback must show no deployment or external references. No KV, Access application, secret or Container in this image-only stage.
2. POST `/accounts/{account_id}/builds/triggers` body below. New trigger tied only to newly returned Worker ID. Existing trigger IDs are never write targets. `branch_excludes:["*"]` disables automatic branch builds; manual exact commit invocation follows. If provider does not support this combination, stop without broadening automatic triggers.

```json
{
  "external_script_id":"<new-isolated-worker-id>",
  "build_token_uuid":"1979b205-1194-42e1-94e4-8c263da46168",
  "repo_connection_uuid":"e3df0ddb-fec7-4fb3-aa51-01bcf084320c",
  "trigger_name":"bee-validation-image-only",
  "build_command":"test \"$(git rev-parse HEAD)\" = ea68e53edb8e684c779b89fcbbf5c9496b7200b5 && npm ci && node -e 'require(\"node:fs\").writeFileSync(\"wrangler.image-validation.jsonc\",JSON.stringify({name:\"bee-validation-20260909\",compatibility_date:\"2026-06-01\",observability:{enabled:false}}))'",
  "deploy_command":"npx wrangler containers build ./bridge --tag bee-validation-20260909:ea68e53edb8e --push --config wrangler.image-validation.jsonc",
  "root_directory":"/",
  "branch_includes":[],
  "branch_excludes":["*"],
  "path_includes":["*"],
  "path_excludes":[],
  "build_caching_enabled":false
}
```

The build command creates only a temporary provider-build config, not a Git commit. Minimal config has the isolated name and no bindings/routes/assets/production resource references. Image-only command never invokes `deploy`, `versions upload` or `secret put`. The credential UUID is an existing stored reference associated with this repository, not a secret value; provider failure must stop rather than broaden its permissions. No new token or subscription.

3. Read back new trigger only; require exact target, repo connection, commands, exclusions and no env configuration. If creation unexpectedly starts a build, cancel it and halt before further operations. POST `/builds/triggers/{new_trigger_uuid}/builds` exact body `{"commit_hash":"ea68e53edb8e684c779b89fcbbf5c9496b7200b5"}`. Do not send `seed_repo`, branch, or mutation-capable repository provisioning fields.
4. Read sanitized new build state only: build ID, state, exact commit equality, duration; never output author identity or raw logs/environment. Limit to one attempt, 20 minutes provider timeout (official maximum), budget $0.10 build minutes at worst published overage, $0.90 allowance for image storage/network uncertainty. Abort before $1 total estimated stage expense or unsupported charged service; no new paid plan. This leaves at least $4 of the settled $5 allowance for later stages. No running Container resources arise here.
5. Build success is not image acceptance. Record pushed image digest extracted inside trusted tooling from exact final push receipt; output only image URI/digest, source SHA and sanitized status. Do not output all digest lines from dependency/base-image logs as if they identify the pushed image. If exact pushed digest cannot be determined, preserve tag only as unaccepted evidence and stop before attaching a Container. Validate real CLI image in later isolated runtime, not production.
6. Delete new trigger after this single build finishes (or cancel only its own build before deletion on failure), read back absence. Keep successful image/new undeployed Worker only if next accepted stage is immediately executable; otherwise remove this stage's resources using exact owned IDs and record image-retention state honestly. Worker deletion does not prove registry image deletion.

## Unresolved outside this stage

- Actual Cloudflare Builds Docker availability and stored credential permission suitability are tested by the one bounded build; no advance assertion.
- Registry image deletion API/retention charge still needs a supported receipt before claiming full teardown. The $1 estimate is not a provider cap.
- Local guarded Worker bundle can use POST `/workers/workers/{id}/versions` JSON modules with base64 code, bindings/migrations and annotations, then separate isolated deployment API; this is not yet reviewed/executed. Static asset upload uses a scoped upload JWT and requires a trusted supported transport; do not invent it.
- Test identity-to-admission custody, actual email/Bee approval, optional GitHub regression, Container logs/Worker redaction readbacks, hosted negatives and production release remain later gates. No blanket readiness PASS.

Evidence: live Cloudflare schemas for `/builds/triggers` and `/builds/triggers/{trigger_uuid}/builds` (commit_hash explicitly supported); official command evidence https://github.com/cloudflare/workers-sdk/issues/12991 ; official Builds API https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/ ; official pricing https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/ . The local source cook must confirm the locked Wrangler command help before acceptance; no latest-version substitution.
