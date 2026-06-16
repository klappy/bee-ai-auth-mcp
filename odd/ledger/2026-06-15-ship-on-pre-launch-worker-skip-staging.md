---
uri: klappy://odd/ledger/2026-06-15-ship-on-pre-launch-worker-skip-staging
title: "Skip separate staging; validate the bridge on the pre-launch Worker (E0017)"
kind: journal
epoch: E0017
date: 2026-06-15
tags: ["bee-ai-auth-mcp", "deploy", "staging", "decision-change"]
---

# 2026-06-15 — bee-ai-auth-mcp: Skip Separate Staging; Validate on the Pre-launch Worker (E0017)

Short course-correction on top of E0016. Observed server_time `2026-06-16T02:22Z`
UTC (operator civil evening of 2026-06-15). Continues decisions from D0030.

## Decisions

**[D0031 — supersedes the separate-staging part of D0030] The existing
`bee-ai-auth-mcp` Worker is pre-launch (operator-confirmed: not live, nothing
points at it), so it IS the validation target. Skip standing up a separate
`bee-ai-auth-mcp-staging` Worker tonight; deploy the bridge to the existing Worker
via a non-versioned `wrangler deploy` on `main`, and validate `whoami` there.**
Rationale: with nothing depending on the Worker, deploy-then-validate on it is
sound — it is effectively staging until launch — and avoids duplicating all
per-Worker setup (secrets, OAuth callback, KV, Builds) that the operator already
did. The separate staging Worker, a protected `production` branch, branch
protection, and the promotion path are **deferred to launch**, when the
duplication is actually warranted (and a separate prod target is created then).
The DoD is unchanged — `whoami` returning the operator's Bee identity still gates
"done"; only the target moved (the pre-launch Worker, not a separate staging one).

## Observations / unwind

- Reverted the `env.staging` block from `wrangler.jsonc` (top level already carries
  the `BeeBridge` DO binding, container, and `v1` migration — that is what deploys
  to the existing Worker). Config parses; top level intact.
- Removed `docs/staging-setup.md` (described the separate-staging path we are not
  taking; revisit at launch).
- The staging KV `bee-ai-auth-mcp-oauth-staging` (`8a69b6a6f7fe4793a2b18e2f21bf8c7d`,
  created via the Cloudflare connector in E0016) is left in place — its delete needs
  operator approval and it is an empty, harmless namespace. Delete at leisure.

## Learnings

**[L · debrief] Settle decision-relevant facts before designing.** A separate
staging environment was designed and partly built before confirming the one fact
that made it unnecessary — whether the existing Worker was live. Ask the
cheap disqualifying question first; architecture second. This is what turned a
short task into a long one.

## Opens (unchanged + ship path)

- **[O-open · operator, to ship tonight]** (1) Confirm the `main`/production-branch
  deploy command is `npx wrangler deploy` (default; switch it if it is
  `versions upload`, which cannot apply the migration). (2) Merge `feat/bridge-wiring`
  → `main`. The build then applies `v1` + builds the container on the existing
  Worker; validate `whoami`.
- **[O-open · unproven] Container image build on Workers Builds** — this first real
  deploy is the test; fallback is a one-time `wrangler containers build --push`.
- **[O-open · deferred to launch]** separate staging Worker, protected `production`
  branch, branch protection, promotion PR `main` → `production`.
- **[O-open · carried]** bridge doc-honesty pass (`bridge/README.md` + Dockerfile
  pre-wiring language); 4 pre-existing high-severity npm advisories.
