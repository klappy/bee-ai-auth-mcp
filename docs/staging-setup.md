# Staging environment setup — `bee-ai-auth-mcp-staging`

Purpose: stand up an isolated **staging** Worker so the bridge (the `BeeBridge`
Durable Object + container) can be deployed and the `whoami` wire validated
**before** anything reaches production. The existing `bee-ai-auth-mcp` Worker is
reserved as production and is **not** touched by any step here.

Why staging at all: a *new* Durable Object migration cannot ride a versioned
preview upload — Cloudflare requires a non-versioned `wrangler deploy`, which on a
production target would be prod. Deploying to a separate staging Worker
(`wrangler deploy --env staging`) applies the migration and builds the container
on staging, giving a real, gated place to validate. The `env.staging` block in
`wrangler.jsonc` already declares everything non-inherited (vars, KV, the DO
binding, the container, and a per-env `v1` migration); staging gets its **own**
isolated DO storage and KV.

## Sequencing rule (read first)

Feed staging from the **`feat/bridge-wiring` branch, not `main`.** The production
Worker is still wired to `main`; merging the bridge to `main` now risks that
Worker deploying it. `main`-as-staging and repointing prod to a `production`
branch are the **deferred governance step** — do them only after staging goes
green. Until then, `main` and prod stay clean.

## Operator steps (Cloudflare dashboard / a CF-authenticated shell)

1. **Create the staging KV namespace** (its own, not prod's):
   `wrangler kv namespace create OAUTH_KV --env staging`
   Paste the returned id into `wrangler.jsonc` → `env.staging.kv_namespaces[0].id`
   (replacing `REPLACE_WITH_STAGING_OAUTH_KV_ID`), then commit that one-line change.

2. **GitHub OAuth for staging.** Either add the staging callback to the existing
   OAuth App, or (cleaner) create a separate staging OAuth App. Callback URL:
   `https://bee-ai-auth-mcp-staging.<your-subdomain>.workers.dev/callback`
   Then set the two secrets on the staging env (never commit these):
   `wrangler secret put GITHUB_CLIENT_ID --env staging`
   `wrangler secret put GITHUB_CLIENT_SECRET --env staging`
   (`ALLOWED_GITHUB_LOGIN=klappy` is already in the `env.staging` vars — no secret needed.)

3. **Connect a Workers Builds project for the staging Worker.** Point it at this
   repo with:
   - **Production branch = `feat/bridge-wiring`** (the validation branch).
   - **Deploy command = `npx wrangler deploy --env staging`** (non-versioned, so the
     migration applies and the container builds).
   - Non-production-branch builds: off (or its preview command also `--env staging`)
     — keep it simple; we only want the bridge branch deploying to staging.

4. **Trigger the build** (push to `feat/bridge-wiring`, or re-run the build). It
   runs `wrangler deploy --env staging`, applies the `v1` migration on the staging
   Worker, and builds + pushes the container image.

## Unknown this first deploy resolves

Whether Workers Builds can build `./bridge/Dockerfile` in its environment is
**unproven** — this is the first deploy that attempts it. If the build environment
cannot build container images, that step fails, and the image needs a one-time
`wrangler containers build --push` from a Docker-capable environment before the
deploy can succeed. Watch the build log for the container step.

## Validation (the Definition of Done — fresh context, phone-only)

Against the staging URL, in a separate session (a builder cannot validate its own
build):

- `whoami` returns the operator's Bee identity (the proof the full chain works).
- The bridge's own `GET /v1/me` succeeds (proves private-CA reachability — the one
  thing a stock Worker `fetch` cannot do).
- A second GitHub login (not `klappy`) is denied (single-tenant gate holds).
- No Bee bearer or token appears in the staging Worker **or** bridge logs.
- A stale login-only grant (no Bee token) is rejected, not served.

## After staging is green (deferred governance)

- Branch protection on `main`.
- A protected `production` branch.
- Repoint the production Worker's Workers Builds to build from `production` (so
  `main` becomes staging in the standing model), with deploy command
  `npx wrangler deploy --env production` (add an `env.production` block mirroring
  `env.staging` with prod's own KV / OAuth callback).
- Promotion path: a reviewed PR `main` → `production`.
