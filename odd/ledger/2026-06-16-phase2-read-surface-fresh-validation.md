---
title: "2026-06-16 — Phase-2 read surface: fresh-context validation (E0021)"
kind: ledger
audience: docs
date: 2026-06-16
reviewer: "Claude Opus 4.8 — fresh chat session under the oddkit/ODD operating contract; did NOT author the code under review (built by prior crew sessions). Same model family as the build crew, which klappy://canon/constraints/release-validation-gate explicitly permits; the binding requirement is a fresh context, which is satisfied. Session ID not exposed to the model."
reviews: "bee-ai-auth-mcp @ main ffe657d64c22516697d0761526c65e313f85c2e8 — Phase 1 auth core + Phase 2 read surface (bee_docs + bee_read)"
tags: ["bee-ai-auth-mcp", "validation", "fresh-validator-ledger", "release-validation-gate", "phase-2", "read-surface", "five-corroboration"]
relates_to: "klappy://canon/constraints/release-validation-gate; PRD.md v0.5; odd/ledger/2026-06-16-phase2-read-surface-built-and-merged.md (E0020)"
---

# 2026-06-16 — bee-ai-auth-mcp: Phase-2 read surface, fresh-context validation (E0021)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. This is a **fresh-validator ledger** under `klappy://canon/constraints/release-validation-gate` ("Validator Deliverable Convention"). Validator: **Claude Opus 4.8**, a fresh chat session that did not write the code under review. Observed server_time `2026-06-16T21:40Z` UTC (oddkit envelope); civil date **2026-06-16**, operator tz −0400/EDT (observed, not inferred). Subject: `main` at HEAD `ffe657d` ("docs: sync orientation surfaces to Phase 2 (bee_docs + bee_read built + merged)"). IDs continue from the observed high-water on `main` (E0020 / D0036).

> **Independence note (read first).** This validation satisfies the *fresh-context* requirement of the release-validation-gate (different session, different context window, did not author the reviewed code) and is *model-family-permissive* per the gate. It is **not** the gate's preferred Rule-2 mechanism — a separately-dispatched read-only Managed-Agents validator — because that dispatch surface is not available from this seat. For a formal `main → prod` promotion sign-off, a separate-dispatch validator remains the canon-preferred path (see C3 / O-open 1). What follows is an honest evaluation *of* the validation, including its own limits.

---

## Decisions

**[D0037] VERDICT — Phase-2 read surface is FUNCTIONALLY SOUND and SAFE on `main`.** The shipped `bee_docs` + `bee_read` surface and the underlying Phase-1 auth/custody/bridge posture were exercised two ways — live black-box through the deployed connector, and white-box from a clean clone (typecheck + unit tests + source audit). No code defects were found; no credential leakage was found; the read-only guarantee is structural in source and confirmed in behavior. The Phase-2 read-surface Definition-of-Done is **met for every item that is buildable and runtime-verifiable from a validator seat.** The unmet items are all **operator-only** (single-tenant denial demo, infra-layer log audit, prior-art PII pass) plus **one canon-preferred follow-up** (separate-dispatch validator for a prod-promotion gate). This is an accept-with-named-residuals, not an unconditional all-clear.

---

## Observations Closed (per-criterion, with evidence)

Legend: **PASS** = established by this validation · **PARTIAL** = established at one layer, residual at another · **OPERATOR-ONLY** = cannot be exercised from a validator seat · **DEFERRED** = out of Phase-2 scope by the PRD.

### A. Live wire (black-box, via the Bee MCP connector — the deployed all-surface path)

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| O1 | `whoami` end-to-end | **PASS** | `200`; `connected_as: klappy`, `bee.id 11128` (Chris Klapp). Full chain GitHub-gate → encrypted grant → bridge → Bee `/v1/me`. |
| O2 | `bee_docs` serves the reference | **PASS** | Returns the project-authored Bee-API-usage doc (dated 2026-06-16, tracks PRD §2 v0.5). |
| O3 | `bee_read` GET `/v1/me` matches `whoami` | **PASS** | `200`, identical identity payload — generic GET passthrough live. |
| O4 | `bee_read` GET single resource | **PASS** | `/v1/conversations/8639606` → `200`, full conversation object. |
| O5 | `bee_read` GET list + pagination | **PASS** | `/v1/conversations?limit=2` → `200`, `limit` honored, `next_cursor` present. |
| O6 | Read-surface breadth | **PASS** | `/v1/facts`, `/v1/todos`, `/v1/journals`, `/v1/daily`, `/v1/changes` each → `200` with well-formed bodies. (`/v1/todos` returns `alarm_at` as epoch-ms, matching the documented field quirk.) Personal content inspected for **shape only**; not transcribed (privacy). |
| O7 | Search — BM25 POST path | **PASS** | `/v1/search/conversations` → `200`, `search_mode: bm25`, ranked hits, `next_cursor`. |
| O8 | Search — neural POST path | **PASS** | `/v1/search/conversations/neural` → `200`; distinct response shape (`link`, `locations`, start/stop, AI summaries; no score/snippet/cursor). |
| O9 | Graceful upstream-error passthrough | **PASS** | `/v1/__validation_probe_does_not_exist` → `404` surfaced as a clean `bee_read_failed` error — no crash, no leak. |
| O10 | Independent smoke ×3 | **PASS** | Three consecutive `bee_read /v1/me` → three identical `200`s (also satisfies the Phase-1 three-pass `whoami` DoD item via the same path). |
| O11 | No credential in any response | **PASS** | Across all ~14 live calls, the Bee bearer never appeared in a returned body or error. |

### B. Source + build (white-box, clean clone @ `ffe657d`)

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| O12 | Bytes-on-main | **PASS** | HEAD `ffe657d`; `bee_docs`/`bee_read` present in `src/`; ledger E0020 records the merge. |
| O13 | Typecheck | **PASS** | `npx tsc --noEmit` → exit 0. |
| O14 | Unit tests | **PASS** | `npx vitest run` → **15 passed, 2 skipped** (the 2 skipped are `test/smoke.live.test.ts`, correctly gated off without live env). |
| O15 | Read-only **by construction** | **PASS** | `src/bee.ts`: `beeRead` issues `GET` to any `/v1/*`, `POST` only to a hardcoded `BEE_SEARCH_PATHS` set (`/v1/search/conversations`, `/v1/search/conversations/neural`); `/v1/stream` refused; `..` traversal rejected; 512 KB response cap. No mutating verb path exists anywhere in the module. |
| O16 | No secret logging | **PASS** | Grep: **zero `console.*` calls anywhere in `src/`** — there is no application logging surface to leak a token through. No log call carries `authorization`/`bearer`/`beeToken`/`secret`. |
| O17 | No secret in errors | **PASS** | `src/bee.ts` error branches return `status` + a generic message only — never the token, headers, request, or raw upstream body. |
| O18 | Per-grant encrypted custody | **PASS** | `src/mcp-api.ts` reads `props.beeToken` from the decrypted grant per request, never from `env`; `src/bee-auth.ts` `/consent` validates the pasted token via `beeGetMe`, then binds `{login, beeToken}` into encrypted props via `OAUTH_PROVIDER.completeAuthorization`. No `BEE_API_TOKEN` exists (grep: only in comments affirming its absence). |
| O19 | GitHub allow-list gate | **PARTIAL** | Code path verified: `isAllowed(login, env)` against `ALLOWED_GITHUB_LOGIN` (`klappy`), 403 on miss in `/callback`, **defense-in-depth re-check** at `/consent`. Runtime denial of a *second, different* GitHub login was **not exercised** (cannot authenticate as another GitHub user from this seat) — see OPERATOR-ONLY P1. |
| O20 | Private-CA bridge topology | **PASS** | `src/bridge.ts` `BeeBridge extends Container` (port 8080, token-agnostic, passes `BEE_UPSTREAM`/`BEE_SNI`); `wrangler.jsonc` binds `BEE_BRIDGE`, single shared instance (`max_instances: 1`), DO migration `v1`. Real upstream `app-api-developer.ce.bee.amazon.dev:443`. Reachability proven by every successful live call (O1–O10). |
| O21 | Version/SHA provenance | **PASS** | `wrangler.jsonc` `build.command` bakes `COMMIT_SHA` into `src/version.ts`; `/version` serves it (`src/bee-auth.ts`) so a deploy is pinnable to a commit. (Mechanism source-verified; live `/version` fetch not performed — host not in scope of provided URLs.) |

### C. Spec-vs-shipped drift (PRD v0.5 → reality)

| # | PRD criterion | Result | Note |
|---|---------------|--------|------|
| O22 | user↔relay OAuth, never token-in-connector | **PASS** | GitHub OAuth flow in `src/bee-auth.ts`; the only pasted secret is the Bee token at the server-rendered `/consent`, never in the connector. |
| O23 | relay↔Bee creds encrypted per-grant, never logged/exposed | **PASS** | O16–O18, O11. |
| O24 | `bee_docs` + `bee_read` GET passthrough live, validated three-pass fresh-context | **PASS** (mobile nuance) | O2–O10. Three-pass fresh-context done via the live connector (the all-surface transport); executed from *this session*, not physically from the operator's phone. The phone-surface demonstration is the prior Phase-1 validation (chat *Testing the MCP connector live*). |
| O25 | QR pairing unblocked or documented w/ next action | **PASS** | Documented: D0035 reframes `app_id` as a Phase-3 vendor ask; the `/consent` form documents the CLI acquisition path. |
| O26 | <60s magical first run | **DEFERRED** | Explicitly not-claimed for the pasted-token interim per the PRD; `app_id` pairing path not built. No regression. |
| O27 | Published MIT, sanitized prior art (no PII) | **PARTIAL** | `LICENSE` (MIT) present. Prior-art PII sanitization of `planning/` (the 2026-06-12 brain-dump carries PII) **not audited in this pass** — OPERATOR-ONLY P3. |
| O28 | Deployed preview reachable; closure carries independent fresh-context validation | **PASS (this doc)** | Reachability proven (O1–O10, O12). This ledger + its companion review *are* the fresh-context validation record — with the independence caveat in the header and C3. |

**Drift verdict:** LOW. Shipped behavior matches the PRD's enumerated Phase-2 criteria. All gaps are honestly attributable to (a) operator-only checks, (b) explicitly deferred scope, or (c) the validation-mechanism caveat — not to undisclosed divergence.

### D. Mapping to the gate's 5-corroboration pattern

1. **Spec-vs-shipped diff drift** → §C (O22–O28). LOW drift.
2. **Bytes-on-main verification** → O12 (HEAD `ffe657d`).
3. **Live curl of new shapes** → §A (O1–O11), real `200` shapes captured for the whole read surface incl. both search modes.
4. **Canon retrievability + content** → `model-operating-contract` and `release-validation-gate` fetched live via oddkit this session; this report is structured against the latter.
5. **Independent smoke ×3** → O10 (three identical `/v1/me` passes).

---

## Learnings

**[L] The read tool is `whoami` generalized, and it shows.** Because Phase 1 already solved the hard transport (per-grant bearer + private-CA bridge), the Phase-2 surface inherited a validated security spine; the live sweep found no new failure modes the auth core hadn't already closed. Reinforces E0020's [O].

**[L] "No logging" is a stronger guarantee than "careful logging."** The cleanest evidence for the no-token-in-logs claim was the *absence* of any `console.*` in `src/` — there is simply no app-layer path to leak through. A grep for the absence beat any amount of reading log statements for correctness.

**[L] BM25 is the sharp instrument for known-topic retrieval; neural is for fuzzy semantics.** Validating both search modes showed neural returning semantic neighbours (and explicit non-matches) where a keyword query was precise. Capture both shapes in `bee_docs`.

---

## Constraints (accepted as platform/posture constraints)

**[C1] In-flight plaintext token window — PERMANENT (until upstream change).** Any forwarding relay holds the user's bearer in plaintext in memory for the duration of a request. This is irreducible without short-lived/OAuth-minted tokens from Bee. The PRD's "Vodka Boundary" already names it; this validation confirms it is the *only* such residual and that at-rest custody is encrypted. Revisit trigger: Bee ships short-lived tokens (Tier-0 petition).

**[C2] `bee_read` 512 KB response cap — PERMANENT (by design).** Large list/daily responses are capped with a pagination hint rather than streamed. Correct for protecting client context; noted so future readers don't mistake a capped body for a truncated upstream.

**[C3] This validation is orchestrator-run, not separate-dispatch — v+1 REVISIT CANDIDATE.** Fresh-context-relative-to-build ✓; separately-dispatched read-only Managed-Agents validator ✗ (surface unavailable from this seat). Sufficient for a confidence read and for closing runtime-verifiable DoD; for a formal `main → prod` promotion gate, dispatch a separate validator (Sonnet 4.6 default) per Rule 2.

---

## Handoff (operator-only residuals to close the DoD fully)

**[H1 / OPERATOR-ONLY P1] Demonstrate single-tenant denial at runtime.** Code path is verified (O19); attempt a connect from a second, non-allow-listed GitHub login and confirm the `403` "Not authorized" screen. Cannot be done from a validator seat.

**[H2 / OPERATOR-ONLY P2] Infra-layer no-token-in-logs audit.** App layer is clean (O16). `wrangler.jsonc` has `observability.enabled: true`; confirm Cloudflare Worker request logs and the bridge container logs do **not** capture `Authorization` headers. Infra-console check, operator-owned.

**[H3 / OPERATOR-ONLY P3] Prior-art PII pass.** Audit `planning/` (esp. anything derived from the 2026-06-12 brain-dump) for home address / personal-business PII before any public emphasis, per the project's own C3.

**[H4] Optional: fold a `/version` live check into CI evidence.** The SHA-baking mechanism is source-verified (O21); a CI step curling `/version` == HEAD SHA would make deploy-pinning a recorded artifact.

---

## Opens (numbered for back-reference)

- **O-open 1** — Separate-dispatch validator for the next prod-promotion gate (C3). Is Managed Agents wired for this repo, or is the fresh-chat-session pattern (this ledger) the accepted equivalent for a single-operator project? Operator ruling requested when a prod promotion is next on the table.
- **O-open 2** — Should `bee_docs` be updated to (a) record the real response shapes captured here (incl. the neural-vs-BM25 shape difference) and (b) drop the now-resolved "Design decision needed: search is POST" section, since `bee_read` shipped Option 1? (Confirmed resolved by O7/O15.)
- **O-open 3** — `bee_write` validation harness — out of scope here; flag for the write phase so mutations get their own gate.

---

## Milestone (Encode)

Fresh-context validation of the Phase-2 read surface complete. Verdict **D0037: functionally sound, safe on `main`, DoD met for all validator-verifiable items**, with four operator-only / canon-preferred residuals (H1–H4) and three opens. Companion prose review at `docs/phase2-read-surface-fresh-validator-review.md`. Crew pushes this branch; operator opens/merges the PR.
