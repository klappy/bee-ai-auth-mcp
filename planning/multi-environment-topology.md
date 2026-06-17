---
title: "Multi-environment topology — dev / staging / production (target; queued)"
kind: planning
audience: "maintainer + crew"
status: "queued — deferred, not yet built"
date: 2026-06-16
observed_server_time: "2026-06-17T03:11Z UTC"
tags: ["bee-ai-auth-mcp", "operations", "environments", "promotion", "cloudflare-workers", "phase-3", "multi-tenancy", "queued"]
relates_to: "PRD.md (Phase 3 / Tier 2 hardening); the `production` branch (created at e9c77f8); klappy://canon/constraints/release-validation-gate"
---

# Multi-environment topology — dev / staging / production

> **Status: queued / deferred.** This is the target operations topology, captured so a
> fresh session inherits the plan instead of re-deriving it. It is a *direction*, not a
> ratified decision — promote it to a PRD Phase-3 requirement when it's scheduled. Today
> the chain is just `main → production` (two environments); **staging slots in between
> later with no rework.**

## The model

Same codebase across every environment. The environment's identity does **not** live in
the source — it lives in **which Cloudflare setup watches which branch.** Each deployment
treats its own branch as "production" for its own concern; at the project level we know
which CF service is actually dev, staging, and prod.

Promotion is a linear, PR-gated chain:

```
feature branch ──PR──▶ main (dev) ──PR──▶ staging ──PR──▶ production (prod)
```

Each hop is a `main → staging` / `staging → production` pull request — the same gate
ritual already established for `main → production`, just two hops instead of one.

## Topology

One Cloudflare Worker service **per environment**, each with its Workers-Builds
production branch pinned to its own branch:

| Environment | Branch | CF service (illustrative) | Hostname |
|-------------|--------|---------------------------|----------|
| dev | `main` | `bee-ai-auth-mcp-dev` | `dev.bee.klappy.dev` |
| staging | `staging` | `bee-ai-auth-mcp-staging` | `staging.bee.klappy.dev` |
| production | `production` | `bee-ai-auth-mcp` | `bee.klappy.dev` |

(Exact CF wiring — separate services vs. `wrangler` environments — to be confirmed in the
dashboard when this is dequeued; the binding requirement is "one production-branch mapping
per environment.")

## Per-environment config — the irreducible difference

Everything else is identical code. The only things that legitimately differ per env:

- **Hostname / route** — `dev.` / `staging.` / `bee.klappy.dev`.
- **Three GitHub OAuth apps** — one per hostname. OAuth Apps take a single callback URL,
  so this is three apps, each with its own client id + secret (not one app shared).
- **Separate OAuth-state storage** — per-env **KV namespace + Durable Object namespace**,
  so grants/tokens from dev/staging/prod never share state or bleed across environments.
- **Per-env bridge Container** — each service runs its own private-CA bridge instance.
- **Secrets vs. vars** — secrets (OAuth client secret, the OAuth-provider encryption key)
  go in **CF secrets (encrypted)**, never plaintext; non-secret per-env config
  (`BEE_UPSTREAM`, `BEE_SNI`, hostname) goes in dashboard env vars.
- **`ALLOWED_GITHUB_LOGIN`** — stays `klappy` in every env (single operator).
- **Bee tokens** — per-grant and per-environment; a user connects (pastes a token) once
  per deployment. Not shared across envs.

## Why the middle hop earns its keep: migrations

The Durable Object migrations apply on every deploy. Promoting through **staging** means a
DO/schema migration runs against real-but-disposable state and can be **watched** before it
ever touches production. That observability — catching a bad migration in staging, not prod
— is the entire reason for the middle environment, and it's what multi-tenant
stability / SLA / uptime guarantees require.

## Division of labor when dequeued

- **Operator-only:** create the CF Worker services, the three GitHub OAuth apps, the KV +
  DO namespaces, the secrets, and the DNS/hostnames; map each service's production branch;
  apply branch protection to `staging` (same shape as `main`/`production`).
- **Crew-doable:** wire the `wrangler` bindings + per-env config once the namespace IDs and
  secrets exist; author the per-env var set; keep the promotion docs current.

## Setup checklist (for when this is dequeued)

1. Create the `staging` branch (off `main`) and protect it (require PR + status checks).
2. Stand up the staging CF Worker service; set its production branch to `staging`.
3. Create the staging GitHub OAuth app + callback URL; add the dev app too if not present.
4. Create per-env KV + DO namespaces; hand crew the IDs to wire `wrangler` bindings.
5. Set per-env secrets (CF secrets) and non-secret vars (dashboard).
6. Point hostnames/routes at the right services.
7. Do a `main → staging` promotion PR; watch the migrations; then `staging → production`.
8. Update RESUME + the public roadmap to show the three-env chain (per the DoD sync gate).
