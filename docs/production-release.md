# Production release — the githook is the deploy model

Read this before touching production. Canon: `9c7e0ec` ("githook auto-deploy is THE deploy model; stop reframing it manual"), reaffirmed by the owner on 2026-09-13 after a seat rebuilt the deploy as an API orchestration and then asked for a credential the model never needed.

## The whole model, in four lines

1. Feature branch → PR → CI + Bugbot → merge to `main` (staging).
2. `main` → `production` PR (the promotion). Merge it.
3. Cloudflare Workers Builds trigger `40a4940d-5c14-4721-908f-a7c304ae2adf` (branch `production`) runs `npx wrangler deploy --config wrangler.production.jsonc`. Build command is empty; `wrangler.production.jsonc` `build.command` runs `node scripts/gen-version.mjs`. No custom deploy script. No API token. No manual trigger edits.
4. Read production back (checklist below). Not done until read back.

Before merging *any* PR in steps 1–2: wait for CI **and Bugbot** to complete. On promotion PRs the head is `main`, so a Bugbot Autofix pushed during review lands on `main` unreviewed; `.cursor/BUGBOT.md` tells Bugbot to comment-only there, and `main` branch protection (require PR) is the structural backstop.

Nothing else deploys production. If the trigger is not exactly as in step 3, that is the bug — restore it, do not work around it.

## What the config carries (`wrangler.production.jsonc`)

- `main: src/hosted.ts` (hosted entry; embedded assets; approved homepage released at runtime when `SELF_SERVICE_ENABLED=true`).
- `vars`: `ALLOWED_GITHUB_LOGIN`, `SIGNUP_ENABLED`, `ACCESS_TEAM_DOMAIN` (bare hostname), `ACCESS_AUD`, `ADMIN_ACCESS_AUD`, `SELF_SERVICE_ENABLED`, `SELF_SERVICE_READ_LIMIT`, `SELF_SERVICE_POLICY_VERSION`, `BEE_UPSTREAM`, `BEE_SNI`. Access AUDs are public identifiers.
- `containers`: `BeeBridge` built from `./bridge/Dockerfile` by the Build; `max_instances 1`, `instance_type basic`.
- `durable_objects`, `kv_namespaces`, `analytics_engine_datasets` as committed.
- `migrations: []` — v1 (`new_sqlite_classes: BeeBridge`) was applied 2026-08-30. Add a migrations block only for a genuinely new/renamed/deleted class, with a new tag.
- No `assets` block. Public paths are served by `src/embedded-assets.ts`.

Secrets are script secrets, set once by the owner with `wrangler secret put --config wrangler.production.jsonc`, never committed, never in chat: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `CONSENT_SIGNING_SECRET`, `ADMIN_OWNER_EMAIL`. `wrangler deploy` inherits them; verify presence (type `secret_text`) by readback, never values.

Cloudflare Access (Zero Trust) production apps, created 2026-09-13, OTP-only IdP `c47d1caf-ecad-4abc-8c66-17c96c9ff5fd`:
- email signup `7c23d2a0-2361-4ef2-be67-61a578d5dc98` — `/signup*`, `/authorize/email*` — policy everyone.
- owner admin `5d2d344f-b6de-4d39-8c5a-7dd63b5ebe43` — `/admin*` — policy one owner email (private; matches the staging owner policy).

## Readback checklist (from a host that is not the tool sandbox)

Run from a shell. The MCP execute sandbox returns 403/53-byte bodies for `bee.klappy.dev` and `*.workers.dev` — that is its egress block, not the site.

```
curl -s https://bee.klappy.dev/version                      # == promoted commit SHA
curl -sI https://bee.klappy.dev/ | head -1                  # 200, approved page, no "review only" notice
curl -s https://bee.klappy.dev/ | grep -c "renews weekly"   # 1
curl -sI https://bee.klappy.dev/signup | grep -i location   # 302 → klappy.cloudflareaccess.com … kid=<ACCESS_AUD>
curl -sI https://bee.klappy.dev/admin  | grep -i location   # 302 → … kid=<ADMIN_ACCESS_AUD>
curl -s  https://bee.klappy.dev/.well-known/oauth-authorization-server | head -c 80   # JSON
curl -sI -X POST https://bee.klappy.dev/mcp | grep -i www-authenticate               # Bearer realm="OAuth", resource_metadata=…
```
Then, via the API: the active deployment's version bindings list all vars above and the four secrets as `secret_text`; then the owner's own `whoami` through the relay. Record the deployment id, version id, and these results on the kitchen rail.

## Provider traps already paid for (do not rediscover)

- **Never upload a version to the production Worker via the script/version API.** It wipes the script-level `migration_tag`; the next `wrangler deploy` re-sends the applied migration and Cloudflare refuses with 10074 ("class already depended on by existing Durable Objects"). That is how the 2026-09-11 custody upload broke the 2026-09-13 build. Secrets go in with `wrangler secret put`, not with an API version.
- `GET /containers/applications/{id}` keeps projecting the pre-rollout `configuration`/`version` after a completed rollout, and a configuration PATCH returns success without effect. Truth is `/versions` (rollout target) and `/instances` (running image). With the githook, the Build rolls the container itself; you do not need this endpoint.
- Wrangler's "last updated via the script API" warning is the tell that someone bypassed the githook. Treat it as an incident, not noise.
- `previews_enabled` on the workers.dev subdomain re-enables on deploy unless `preview_urls` is set in the config (warning in every Build). Harmless for the custom domain; set explicitly if it matters.
- The homepage served at `/` is decided at runtime by `src/homepage-release.ts` (`SELF_SERVICE_ENABLED=true` → approved page minus the review notice). If production shows the old `public/index.html`, that var is missing.

## What is retired

`scripts/deploy-production.cjs` and `deploy/production-prerequisites.json` (2026-09-11–13) were an API-orchestrated release transaction. They are kept as reviewable source with their tests, but they are not the deploy command, not a gate, and not required. Do not wire them back into the trigger. `docs/production-deployment.md` describes them and is superseded by this file.
