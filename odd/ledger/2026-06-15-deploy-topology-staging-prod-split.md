---
uri: klappy://odd/ledger/2026-06-15-deploy-topology-staging-prod-split
title: "Deploy topology — staging/prod split for the bridge migration (E0016)"
kind: journal
epoch: E0016
date: 2026-06-15
tags: ["bee-ai-auth-mcp", "deploy", "cloudflare", "environments", "durable-objects", "staging", "ci"]
---

# 2026-06-15 — bee-ai-auth-mcp: Deploy Topology — Staging/Prod Split for the Bridge Migration (E0016)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. Continues from E0015
(the bridge-wiring build pass, branch `feat/bridge-wiring`). Triggered by a failed
Cloudflare build: the branch push ran the non-production deploy command
`npx wrangler versions upload`, which rejected the bundle (error 10211) because it
introduces a *new* Durable Object migration. Resolving it surfaced a deploy-topology
decision. Observed server_time at close `2026-06-15T20:23Z` UTC; civil date follows
the observed server UTC day (2026-06-15). Decisions continue from D0029.

## Decisions

**[D0030] Validate the bridge on a separate Wrangler `staging` environment before any
production deploy; reserve the existing Worker as prod; defer branch-protection +
`production`-branch governance until staging is green.** A new DO migration cannot
ride a versioned/preview upload — Cloudflare requires a non-versioned `wrangler deploy`.
To keep that off production, the first migration-bearing deploy targets a separate
Worker `bee-ai-auth-mcp-staging` via `wrangler deploy --env staging`. Operator rulings:
(a) stand up a separate `-staging` env now and keep the current `bee-ai-auth-mcp`
Worker reserved as prod (preserves the D0015 name/URL parity); (b) branch protection on
`main` + a protected `production` branch + the promotion path come *after* staging
validates, not in parallel. Validation-phase sequencing (crew judgment, flagged): feed
staging from the `feat/bridge-wiring` branch, **not** `main` — the prod Worker is still
wired to `main`, so feeding staging from `main` before the governance step risks prod
deploying the unvalidated bridge.

## Observations

**[O · verified against Cloudflare docs] Wrangler environment mechanics.** Bindings and
vars are NOT inherited by environments and must be redeclared per env; each env's DO
binding accesses isolated storage; and a DO migration may be declared per-env, where it
overrides the top-level migration (Cloudflare Durable Objects → Environments). A
third-party wiki claiming migrations cannot appear in `env.*` was wrong. The authored
`env.staging` block redeclares vars, KV (its own namespace, placeholder id), the
`BEE_BRIDGE`/`BeeBridge` DO binding (no `script_name` → isolated staging storage), the
container, and a per-env `v1` migration; `wrangler.jsonc` parses and the top-level (prod)
config is unchanged.

**[O · proven by the CF build log] Prod is currently fail-safe against the bridge by the
migration error itself.** The `feat/bridge-wiring` push made the existing `bee-ai-auth-mcp`
Worker's Workers Builds run `wrangler versions upload` and fail with 10211 — so the
unvalidated bridge cannot reach that Worker via a branch push. Incidental protection, not
the designed gate; the staging split is the designed gate.

**[O · verified against CF config docs] Workers Builds separates the production deploy
command from the non-production/preview deploy command.** Production branch → deploy
command (default `wrangler deploy`); other branches → preview command (default
`wrangler versions upload`, no promotion). Feature branches therefore cannot reach prod by
construction.

## Learnings

**[L · debrief] The versioned-upload preview model is incompatible with *introducing* a DO
migration.** The first migration-bearing deploy must be non-versioned, and to keep it off
prod it must target a separate environment. Earlier this session a model framed an
unvalidated production deploy as "fine for a no-traffic relay" — wrong against canon
(merge-to-main is a code milestone, not the validated DoD; don't promote before the
fresh-context green). Corrected to staging-gated validation. No blame; banked so the
deploy model accounts for migrations going forward.

## Constraints

**[C] Validate before prod (DoD)** — honored by routing the bridge's first live deploy to
`bee-ai-auth-mcp-staging`, never prod.

**[C] Token/secret hygiene** — the staging KV id is an operator fill (placeholder in
config, not a real id); `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` are set per-env via
`wrangler secret put --env staging`, never committed.

## Handoff

**[H] `env.staging` block + `docs/staging-setup.md` on `feat/bridge-wiring`.** Operator
inputs to bring staging up: create the staging KV and paste its id; add the staging
`/callback` to a GitHub OAuth App and set the two client secrets on the staging env;
connect a Workers Builds project for `bee-ai-auth-mcp-staging` to the repo with production
branch `feat/bridge-wiring` and deploy command `wrangler deploy --env staging`. Then
validate `whoami` against the staging URL in a fresh context.

## State at session end

- **Mode:** planning → execution for the staging config; the bridge wire remains unproven.
- **Nothing in production.** The branch carries the wiring + the staging config; no deploy
  has succeeded.

## Opens (not banked)

- **[O-open · deploy] Container build on Workers Builds is unproven** — the first staging
  deploy is the test; fallback is a one-time `wrangler containers build --push` from a
  Docker-capable environment.
- **[O-open · governance, deferred] After staging is green:** branch protection on `main`,
  a protected `production` branch, an `env.production` block (mirroring `env.staging` with
  prod's own KV + OAuth callback), repoint the prod Worker's builds to `production`, and a
  reviewed-PR promotion path `main` → `production`.
- **[O-open · carried] Bridge doc-honesty pass** (`bridge/README.md` + `bridge/Dockerfile`
  still carry pre-wiring `BEE_API_BASE`/`8443`/ACME language); 4 pre-existing high-severity
  npm advisories.
