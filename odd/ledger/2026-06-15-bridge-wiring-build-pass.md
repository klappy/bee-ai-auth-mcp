---
uri: klappy://odd/ledger/2026-06-15-bridge-wiring-build-pass
title: "Bridge wiring build pass — BeeBridge bound Container (E0015)"
kind: journal
epoch: E0015
date: 2026-06-15
tags: ["bee-ai-auth-mcp", "containers", "bridge", "wrangler", "ci", "build-pass"]
---

# 2026-06-15 — bee-ai-auth-mcp: Bridge Wiring Build Pass — BeeBridge Bound Container (E0015)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. Continues the trail
from E0014 (the bridge-wiring handoff that authored the 11-step change set and
banked decisions through D0028). This is the execution that *did* the wiring:
the relay now reaches Bee's private-CA API through a bound Cloudflare Container
(`BeeBridge`) over an internal `getContainer(env.BEE_BRIDGE).fetch(...)`, with
`BEE_API_BASE` removed. Shipped to branch `feat/bridge-wiring` (commit
`360df54`), pushed — **not merged**: crew pushes the branch, the operator opens
and merges the PR (Bugbot author-match). Observed server_time at close
`2026-06-15T19:41:11Z` UTC; civil date follows the observed server UTC day
(2026-06-15), consistent with E0013/E0014 — not independently observed in the
operator's local zone. Decisions continue from D0028. Milestone E0015. Full
verbatim detail in the operator's transcripts.

## Decisions

**[D0029] CI preview-poll budget raised to ~9 min / job timeout to 12 min, tied
to the container image build — and `docs/ci-cd.md` touched to keep its cited
figure honest (flagged for operator review).** E0014 step 10 specified a
reliability bump of `~8–10 min`; the execution-time choice was poll
`DEADLINE 300s → 540s` (~9 min) with `resolve-preview` `timeout-minutes 10 → 12`
so the loop's explicit "build never went live" failure still fires before
GitHub's hard kill (the invariant the existing comment already protected). The
*reason* is new this session and is recorded in the `ci.yml` comment: adding the
bound `BeeBridge` Container means Workers Builds now builds a Docker image before
deploy, materially slower than the old plain-Worker upload, so the old 5-min
estimate was too tight. Scope coupling worth a ruling: the `ci.yml` poll comment
cross-references `docs/ci-cd.md`, whose line 30 stated the same `~5 min` figure,
so one sentence of that operational doc was updated to `~9 min` rather than left
as a stale, now-false reference. E0014 had scoped doc edits narrowly (Caddyfile
comment + `bridge/wrangler.jsonc`); this is the one deliberate extension —
surfaced here, visible in the PR diff, not silent.

## Observations

**[O · proven by build commands] Post-build local gate is green; the wire is
unproven.** Clean room on node 22: `npm ci` clean (package.json/lock in sync
after adding `@cloudflare/containers`), `tsc --noEmit` exit 0, `vitest run` = 15
passed / 2 skipped (the live-smoke pair, correctly skipped with no deployed
preview or Bee bearer). This proves the static + unit surface only. `whoami` over
the bridge to Bee was never exercised — that is the DoD's job and needs deploy +
fresh context.

**[O · established at session start] The baseline was green BEFORE any edit, so
any red is the crew's.** On `main` HEAD the same three commands were clean
(`tsc` clean, 15 passed / 2 skipped) before the change set was applied. Stated so
the post-build green is attributable, not coincidental.

**[O · verified from node_modules, not trusted from the handoff] The installed
`@cloudflare/containers` is `0.3.7`, and its real API was read from the shipped
`.d.ts`.** Exports `Container`, `getContainer`, `getRandom`, `loadBalance`,
`switchPort`. `getContainer<T>(binding, name = "cf-singleton-container")` returns
a `DurableObjectStub<T>`; `class Container extends DurableObject` carries
`defaultPort` and `sleepAfter`. The handoff said `≥ 0.2`; the observed install is
newer and the documented `defaultPort = 8080` literal and the single-instance
default name both held. Typing decision (faithful to E0014): `beeGetMe`'s param is
a bare `DurableObjectStub` (decoupled), and `Env.BEE_BRIDGE` carries the
`DurableObjectNamespace<BeeBridge>` generic.

**[O] Both `wrangler.jsonc` files parse as JSONC and the merged root block is the
E0014 shape.** Root carries `name: bee-ai-auth-mcp` (parity intact),
`containers` (`BeeBridge`, `./bridge/Dockerfile`, `basic`, `max_instances 1`),
`durable_objects.bindings` (`BeeBridge → BEE_BRIDGE`), `migrations`
(`tag v1`, `new_sqlite_classes ["BeeBridge"]`), and `vars` reduced to just
`ALLOWED_GITHUB_LOGIN: klappy` (`BEE_API_BASE` removed). `v1` confirmed the first
migration by `grep` (no prior migrations block). `bridge/wrangler.jsonc` is a
`{}` tombstone pointing at the root.

**[O] No secret leaked in the commit or the push.** The staged diff held no token
literals — every `bearer` match was custody comment prose. The write token was
used inline in the push URL only, redacted in command output, cleared from the
shell, and never written to git config; `origin` remained the public HTTPS URL
throughout.

## Learnings

**[L · debrief] A GitHub App push that modifies `.github/workflows/**` needs
`workflows:write`, not just `contents:write`.** The first push (contents-only
token, the scope the E0014 handoff's token pattern named) was rejected:
"refusing to allow a GitHub App to create or update workflow `.github/workflows/ci.yml`
without `workflows` permission." Re-minting `{"contents":"write","workflows":"write"}`
succeeded. Banked so any future push whose change set touches CI workflow files
mints the combined scope up front — saves a wasted push and a quota unit. The
App's installation grant does include `workflows` (the mint returned it).

**[L · debrief] The shell is `dash`; a single exit code nearly produced a false
"pushed."** `${PIPESTATUS[0]}` is unavailable, and `${PIPESTATUS:-$?}` after a
`git push … | sed` grabbed the assignment's status (0) on a push GitHub had
*rejected* — the truthful signal was the "remote rejected" / "failed to push some
refs" text in the captured output. Reading the output, not the lone exit code, is
what caught it. Reinforces the canon: observe before asserting; integrity over a
false "done." Pattern fix already in use this session — capture output to a var,
inspect the text, and read `$?` immediately (not through a pipe).

## Constraints

**[C] Token/bearer never logged or persisted** — honored: two short-lived tokens
minted (read earlier; then `contents+workflows:write` for the push), used inline
only, redacted, var-cleared, never in git config; both self-expire (≤ `20:39Z`).
`origin` stayed public.

**[C] The bridge stays token-agnostic; no `BEE_API_TOKEN` Worker secret** —
honored in code: `beeGetMe` passes the caller's own bearer straight through to
`http://bee-bridge/v1/me`; nothing injects or stores a token in `BeeBridge`
(empty class); the Caddyfile keeps JSON access logs with no request headers and
strips `Server`. No-leak error handling (status + generic text) preserved.

**[C] Deploy frame respected** — no manual `wrangler`/CF-token step invented;
deploy remains githook-driven (push → Workers Builds). The `ci.yml` change is
reliability-only and assumes that same model.

**[C] Crew pushed; the operator opens/merges** — the branch was pushed and the
work stopped there. The PR was **not** opened and **not** self-merged, preserving
Bugbot's author-match (the E0014 provenance convention).

## Handoff

**[H] E0014 bridge wiring is on `feat/bridge-wiring` (commit `360df54`), pushed,
awaiting the operator's PR.** Files: `package.json` + lock (`@cloudflare/containers`);
`src/bridge.ts` (new — `BeeBridge`); `src/index.ts` (re-export); `src/types.ts`
(`BEE_BRIDGE` binding); `src/bee.ts` (stub-based `beeGetMe`); `src/mcp-api.ts` +
`src/bee-auth.ts` (`getContainer(env.BEE_BRIDGE)`); `wrangler.jsonc` (containers +
DO + `v1` migration, `BEE_API_BASE` removed); `bridge/Caddyfile` (internal `:8080`
TLS re-origination, public `:8443`/ACME dropped); `bridge/wrangler.jsonc`
(tombstone); `.github/workflows/ci.yml` + `docs/ci-cd.md` (poll budget). Local
gate green; wire unproven.

## State at session end

- **Mode:** execution complete for the build pass; validation pending
  (fresh-context, operator, phone-only).
- **Pushed, not merged:** `feat/bridge-wiring @ 360df54`. No new Worker secrets.
  Worker auto-deploys via the CF Git integration once a build runs.
- **Not yet done (DoD):** deploy the bridge → its own `GET /v1/me` proves
  private-CA reachability; `whoami` returns the operator's Bee identity (the
  proof); a second GitHub login is denied (single-tenant); no token in Worker
  observability **or** bridge logs; a stale login-only grant stays guarded.
  Merge-to-`main` is a code milestone, not the validated DoD — no prod promotion
  before the fresh-context green.

## Opens (not banked)

- **[O-open · operator] Open the PR for `feat/bridge-wiring`** — crew does not
  open PRs (Bugbot author-match). Leave it open until Bugbot's check completes.
- **[O-open · operator inputs, needed only at deploy/validation]**
  `BEE_UPSTREAM` (host:port, e.g. `api.bee.computer:443`) and `BEE_SNI` from the
  operator's bee-cli config; the one-time Workers Builds container build command
  (E0014 suggested `wrangler containers build --push` — confirm against current
  CF docs, do not assume); a real Bee bearer pasted at `/consent`.
- **[O-open · DoD] Runtime wire validation** — deploy + phone-only, three-pass,
  fresh-context `whoami`; the gate before "done."
- **[O-open · carry-forward, out of E0014 scope] Bridge doc-honesty pass** —
  `bridge/README.md` still carries pre-wiring `BEE_API_BASE`/`BRIDGE_HOSTNAME`
  language and `bridge/Dockerfile` keeps a vestigial `EXPOSE … 8443` + an "ACME"
  comment. E0014 deliberately scoped doc edits to the Caddyfile comment +
  `bridge/wrangler.jsonc`; a focused pass against the built artifact is owed.
- **[O-open · security] 4 pre-existing high-severity npm advisories** —
  `npm audit fix --force` is breaking; not run. Review separately.
- **[O-open · review] The `docs/ci-cd.md` one-sentence figure edit** (D0029,
  coupled to the CI budget change) — confirm it is acceptable for crew to touch
  that operational-doc copy as a correctness fix, or revert it.
- **[O-open · deploy guard, carried] Do NOT merge Cloudflare's config-name
  auto-PR** — it would flip `wrangler.jsonc` `name` `bee-ai-auth-mcp → bee-mcp`,
  the inverse of the D0015 reconciliation. Keep `name` == the deployed Worker
  name.
