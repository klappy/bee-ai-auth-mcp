---
uri: klappy://odd/ledger/2026-06-15-bridge-deployed-container-env-fix-validation-pending
title: "Bridge deployed; container-env fix; whoami validation pending (E0018)"
kind: journal
epoch: E0018
date: 2026-06-15
tags: ["bee-ai-auth-mcp", "deploy", "bridge", "container", "decision-change", "ci"]
---

# 2026-06-15 — bee-ai-auth-mcp: Bridge Deployed; Container-Env Fix; whoami Validation Pending (E0018)

Execution and debrief on the E0017 ship path. Observed server_time
`2026-06-16T03:32Z` UTC (operator civil evening of 2026-06-15). Closes several
E0017 opens, records one new decision and two debrief learnings, surfaces a CI-gate
finding, and leaves the `whoami` wire-proof pending.

## What shipped (observed)

- **Prod deploy of the bridge succeeded** (Workers Builds, ~02:33–02:35Z). The
  non-versioned `wrangler deploy` on `main` applied the `v1` Durable Object
  migration, built and pushed the `BeeBridge` container image (caddy on distroless,
  `bee-ca.pem` baked in), and created the container app. Worker live at
  `https://bee-ai-auth-mcp.klappy.workers.dev`; bindings `BEE_BRIDGE` (DO),
  `OAUTH_KV`, and `ALLOWED_GITHUB_LOGIN` present.
- **[O-open · unproven → CLOSED, positive] Container image build on Workers Builds.**
  The first real deploy built the image end-to-end — the fallback one-time
  `wrangler containers build --push` was not needed.
- Staging unwound per D0031: `env.staging` reverted, `docs/staging-setup.md` removed,
  and the staging KV `bee-ai-auth-mcp-oauth-staging` deleted via the Cloudflare
  connector (operator-approved).

## The whoami failure and its fix

- The first `whoami` after deploy **failed**. Root cause (observed in
  `bridge/Caddyfile`): the bridge reverse-proxies to `https://{$BEE_UPSTREAM}` with
  `tls_server_name {$BEE_SNI}`, but **a Cloudflare Container does not inherit the
  Worker's vars/secrets** — nothing populated those substitutions, so the upstream
  resolved empty and the proxy broke. The wiring had shipped without ever handing the
  container its environment.
- **Fix (merged — `main` `09b4330`, PR #13):** `BeeBridge` now `extends
  Container<Env>` and sets `envVars = { BEE_UPSTREAM, BEE_SNI }` from `this.env`
  (field initializer), so the values are passed into the container at start; the
  `Env` type was extended with both keys (commit `5ece377`). Local gate green:
  `tsc --noEmit` clean, `vitest` 15 passed / 2 skipped (live-smoke).

## Decisions

**[D0032] Carry Bee's endpoint (`BEE_UPSTREAM` / `BEE_SNI`) as committed `vars` in
`wrangler.jsonc`, not as secrets.** (commit `9323092`:
`BEE_UPSTREAM=api.bee.computer:443`, `BEE_SNI=api.bee.computer`.) Rationale: the Bee
API endpoint is not a credential — the API still requires a per-user bearer — and is
the same shared constant for every self-host instance, so committed config is the
simpler and more robust home. It survives every redeploy (the config is the source
of truth) and needs no dashboard step, whereas a dashboard-set plain-text var can be
clobbered by a later `wrangler deploy`. Operator's call: simplicity over a secret
that carries no security value. The CF secrets set earlier for these keys are now
redundant (harmless — same value).

## Learnings

**[L · debrief] The local gate cannot see the bridge's runtime env; only a live call
can.** The wiring passed `tsc` and unit tests while silently failing to pass the
container its `BEE_UPSTREAM`/`BEE_SNI`, because "a Cloudflare Container does not
inherit the Worker's env" is a runtime-topology fact that no type-check or unit test
in this repo exercises. The first thing to catch it was the live `whoami`. Lesson:
for bound-container changes the definition of done must include a live call *through
the container*, not a green local gate — and "pass the container every `{$VAR}` the
Caddyfile references" belongs on the bring-up checklist.

**[L · debrief · first-officer process] Verify what is already in hand before asking
the operator to act.** Several turns this session handed the operator work the crew
already had: re-asking for an endpoint value the crew itself had supplied, calling
Cloudflare setup "operator-only" when the connector was available, and omitting a
one-click PR link. None were knowledge gaps — they were a failure to check the
context, repo, and tools already present before making the operator move. Correction:
before requesting an operator action or value, confirm it is not already in the
conversation, the repository, or an available tool. This is the avoidable-friction
class, and it is what turned several short exchanges long.

## Opens

- **[O-open · validation · gates "done"] `whoami` not yet re-run after the fix
  merged.** The fix is on `main` (`09b4330`) and a redeploy should be in flight, but
  the Phase-1 wire proof — `whoami` returning the operator's Bee identity — is
  unproven. Validate next session, ideally from a fresh context (a builder should not
  validate its own build). The first call cold-starts the container (instances:0). If
  it still fails, the next suspect is a **stale login-only grant** on the connector —
  a grant minted by the pre-fix code with no Bee bearer — whose remedy is
  reconnect / re-consent (a documented DoD guard case).
- **[O-open · CI debt · deferrable] The `resolve-preview` / `smoke` PR gate cannot
  validate a migration-bearing change.** It polls a branch-preview URL
  (`<slug>-bee-ai-auth-mcp.klappy.workers.dev/version`) for the commit-under-test for
  ~9 min. That preview is produced by `wrangler versions upload`, which cannot apply
  a DO migration the way a non-versioned `wrangler deploy` does; the most likely
  result is that the commit's preview never goes live, so the poll runs to its
  deadline and the job fails. (CF build logs were not visible from this session, so
  the exact upload error is unconfirmed — but the validation path does not depend on
  it.) For migration-bearing changes we validate on the deployed Worker per D0031,
  not a PR preview. Fix later: make the preview/smoke gate skip or adapt when a change
  carries a DO migration, so such PRs do not always time out here. Branch protection
  is deferred, so this timing-out check does not block merge.
- **[O-open · carried]** bridge doc-honesty pass (`bridge/README.md` + Dockerfile
  pre-wiring language); 4 pre-existing high-severity npm advisories.
