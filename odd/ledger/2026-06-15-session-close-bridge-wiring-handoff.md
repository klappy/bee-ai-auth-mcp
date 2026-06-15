---
uri: klappy://odd/ledger/2026-06-15-session-close-bridge-wiring-handoff
title: "Session close — bridge wiring handoff (NEXT SESSION START HERE)"
kind: journal
epoch: E0014
date: 2026-06-15
tags: ["handoff", "bee-ai-auth-mcp", "containers", "bridge", "multitenancy", "ci"]
---

# Session close — bridge wiring handoff

**Read this, then `RESUME.md`. This is where the next session picks up.** The relay is
live and green; the Bee data path is the next build. The change set below is fully
specified and verified against current docs — it is execution, not exploration.

## Where we are (verified 2026-06-15, observed not asserted)

- **`main` is green.** Observed via the GitHub check-runs API on the latest merge:
  `Typecheck & Unit` → success, `Workers Builds: bee-ai-auth-mcp` → success,
  `Resolve preview URL` + `Smoke vs preview` → **skipped** (correct — they are
  PR-only now). Prod serves the current `main` at `bee.klappy.dev` and
  `bee-ai-auth-mcp.klappy.workers.dev`.
- **D0015 RESOLVED** — `bee-ai-auth-mcp` everywhere (Worker renamed in the CF
  dashboard; `wrangler.jsonc` name restored after CF's config-name auto-PR #3 had
  flipped it to `bee-mcp`). **Watch:** Cloudflare re-opens that auto-PR whenever
  `wrangler.jsonc` name ≠ the deployed Worker name. Keep them equal; do **not**
  merge that auto-PR.
- **Deploy model:** `git push` → Cloudflare Workers Builds auto-deploys (branch =
  preview, `main` = prod). No manual `wrangler`, no CF API token. See
  `docs/ci-cd.md` ("Deployment model — READ FIRST").
- **Workers PAID plan confirmed** → Cloudflare Containers is viable.
- **Cursor Bugbot is installed and WORKS** — it ran and passed on PR #9. Earlier
  "Bugbot isn't running" was near-instant merges giving it no window. Leave PRs
  open until checks complete (`release-validation-gate`).
- **Per-grant custody is live (E0012):** the Bee bearer is captured at `/consent`
  and held only in the user's encrypted grant props. There is **no** `BEE_API_TOKEN`
  Worker secret.

## Decisions recorded this session (DOLCHEO)

- **[D] D0028-faithful — Caddyfile → bound-container internal `:8080`.** The
  Worker↔container leg is internal to Cloudflare, so the bridge needs no public
  ACME cert. Drop the `{$BRIDGE_HOSTNAME}` listener and `https_port 8443`; keep
  **only** the private-CA leg (container → Bee). Why: D0028 chose a *bound* container
  reached by `getContainer().fetch()`; the public-cert listener was leftover from
  the pre-D0028 separate-service design, and an internal call won't match a
  hostname site block (caddy would 404 it). The bridge would deploy and still be
  unreachable without this change.
- **[D] Multitenancy — the per-user Bee API key is a USER WORKFLOW step (`/consent`),
  never a CF infra secret.** The bridge is token-agnostic shared infrastructure;
  each request carries its own user's bearer in `Authorization`, passed through
  (never injected, never logged). This is the standing rule for the website copy
  and any future multi-tenant work.
- **[O] CI green on `main`** (check-runs API). **Bugbot installed + passing.**
  `resolve-preview` fails on **PRs** because it polls
  `<slug>-bee-ai-auth-mcp.klappy.workers.dev/version` and races Cloudflare's branch
  build (the branch preview alias 404s until the build lands). Push-to-`main` is
  unaffected (those jobs skip).
- **[C] Do not merge Cloudflare's config-name auto-PR** — it flips `wrangler.jsonc`
  name to `bee-mcp`, the inverse of D0015.
- **[O-open] The bridge wiring below is NOT done** — it is the next build.

## NEXT BUILD — the bridge wiring change set (one branch)

Verified against current Cloudflare Containers docs (2026): a bound container is a
**Durable Object class**. Wire it, then point `bee.ts` at the binding instead of a URL.

1. **`package.json`** — add dependency `@cloudflare/containers` (≥ 0.2). `npm install`.
2. **`src/bridge.ts`** (new):
   ```ts
   import { Container } from "@cloudflare/containers";
   export class BeeBridge extends Container {
     defaultPort = 8080;   // matches the Caddyfile listener
     sleepAfter = "10m";
   }
   ```
3. **`src/index.ts`** — `export { BeeBridge } from "./bridge";` (the runtime must see
   the DO class for the migration to register).
4. **`src/types.ts`** (`Env`) — remove `BEE_API_BASE`; add
   `BEE_BRIDGE: DurableObjectNamespace<BeeBridge>` (or `DurableObjectNamespace` if
   the generic fights tsc).
5. **`src/bee.ts`** — change `beeGetMe(beeToken, beeApiBase)` to take the container
   stub: `stub.fetch("http://bee-bridge/v1/me", { headers: { authorization:
   ` + "`Bearer ${beeToken}`" + `, accept: "application/json", "user-agent":
   "bee-ai-auth-mcp" } })`. Keep the no-leak error handling exactly; drop the URL
   `.replace(/\/+$/, "")`. The "not configured" guard checks the stub, not a URL.
6. **`src/mcp-api.ts` + `src/bee-auth.ts`** (the two callers) — `import { getContainer }
   from "@cloudflare/containers"`, do `const stub = getContainer(env.BEE_BRIDGE)`,
   and pass `stub` to `beeGetMe`.
7. **`wrangler.jsonc`** (root) — merge the block currently drafted in
   `bridge/wrangler.jsonc`: `containers:[{ class_name:"BeeBridge",
   image:"./bridge/Dockerfile", instance_type:"basic", max_instances:1 }]`,
   `durable_objects.bindings:[{ class_name:"BeeBridge", name:"BEE_BRIDGE" }]`,
   `migrations:[{ tag:"v1", new_sqlite_classes:["BeeBridge"] }]`. **Remove the
   `BEE_API_BASE` var.** (Current `compatibility_date` 2026-06-01 is fine for Containers.)
8. **`bridge/Caddyfile`** — replace the `{$BRIDGE_HOSTNAME} { … }` site with a
   **port** site (matches any Host on the internal leg):
   ```
   :8080 {
     @notapi not path /v1/*
     respond @notapi 404
     reverse_proxy https://{$BEE_UPSTREAM} {
       transport http {
         tls
         tls_trust_pool file /etc/caddy/bee-ca.pem
         tls_server_name {$BEE_SNI}
       }
       header_up Host {$BEE_SNI}
       header_down -Server
     }
   }
   ```
   Drop `https_port 8443` and the ACME block. Keep `admin off`, `http_port 8080`,
   and the JSON access log **without** request headers (never emit `Authorization`).
9. **`bridge/wrangler.jsonc`** — delete it (now merged) or replace its body with a
   one-line pointer to root `wrangler.jsonc`.
10. **`.github/workflows/ci.yml`** — stop the PR flake: bump `resolve-preview`'s poll
    deadline and job `timeout-minutes` (≈ 8–10 min) so it outlasts Cloudflare's branch
    build, OR make `resolve-preview` tolerant of a slow alias. (The PR-only guard
    already landed; this is reliability only.)
11. **Verify locally before pushing** (proven path, node 22):
    `npm ci && npx tsc --noEmit && npx vitest run` → expect typecheck clean + 15 unit
    pass (2 live-smoke skipped). **Do not claim end-to-end works** from this.

### Operator-only inputs (the model cannot fabricate these)

- Bee's real **`$BEE_UPSTREAM`** (host:port, e.g. `api.bee.computer:443`) and
  **`$BEE_SNI`** — from your `bee-cli` config. Set as container env / Worker config.
- The **one-time Workers Builds container build command** so the image builds on
  push (e.g. `wrangler containers build --push` — confirm against current docs).
- A **real Bee bearer** pasted at `/consent`.

### Validation (fresh context, phone-only — a creator can't validate own build)

`whoami` → returns your Bee identity (**the** proof). The bridge's own `GET /v1/me`
= private-CA reachability proof. 2nd GitHub login denied (single-tenant). **No token
in Worker observability OR bridge logs.** Stale login-only grant is guarded.

## Website honesty pass ("make it real") — partially done / remaining

The site's central security claim was the **old Model-A framing** ("your Bee token is
the Worker's own secret"), which contradicts per-grant custody and the multitenancy
rule above. The correct framing: **your Bee token is captured when you connect
(`/consent`) and held only inside your own encrypted grant — it is not a Worker
secret and the shared bridge never stores it.**

- `public/index.html` — hero lede + the relay node "Holds your Bee token as its own
  secret" + the two `og`/`twitter` meta descriptions. **(Corrected this session — verify.)**
- `public/security.html`, `public/under-the-hood.html`, `public/setup.html` — **still
  to do:** sweep for "Worker secret" / "token stays a secret in your deployment"
  language and re-frame to per-grant consent custody. The "gated leg / pending a cert
  check" language is fine (that's the private-CA bridge).

## Pointers

- Spec: `PRD.md` (v0.3). Build contract: `docs/phase-1-build-handoff.md`. CI: `docs/ci-cd.md`.
- Decision trail: this file (E0014) → `odd/ledger/2026-06-15-phase-1-bee-leg-build-pass.md`
  (E0013) → `odd/ledger/2026-06-15-bee-leg-private-ca-and-multitenancy.md` (E0012).
- Reference impl: `klappy/git-repo-auth-mcp`.
- Operating contract: fetch `klappy://canon/bootstrap/model-operating-contract` first.
