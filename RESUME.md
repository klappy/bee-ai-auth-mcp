# RESUME — Fresh-Context Handoff

> You are likely a fresh crew session. This file is your entry point. Read it fully before acting.

## ⮕ START HERE — branch situation (read before touching anything)

As of **2026-06-14**, the entire session's work — code, CI, plan, journal, handoff — sits on **one branch: `phase-1/ci-cd`** (the name predates the consolidation; it is now the complete Phase-1 deliverable). Nothing is merged yet (crew pushes branches; the operator opens PRs).

- **If you are reading this on `main` and §2 below still says "spine built, CI built" but the repo has no `src/` or `.github/` — `main` is STALE.** The truth is on `phase-1/ci-cd`. Check out that branch (or its PR) and read its RESUME.
- **Operator action to make `main` correct:** merge the PR from **`phase-1/ci-cd`** into `main`, then delete the superseded branches below.
- **Superseded branches — close/ignore, do not start from them:**
  - `phase-1/scaffold` — the Worker code; a strict subset of `phase-1/ci-cd`.
  - `session/2026-06-14-validation-to-execution` — the plan/journal/handoff docs; now folded into `phase-1/ci-cd`.
  - `validation/2026-06-14-prd-findings` and `phase-1/execution-handoff` — earliest fragments; subsumed.

One branch to land it all: **`phase-1/ci-cd`**. Everything else is history.

## 0. Bootstrap (do this first)

You operate under a captain (Klappy) and a binding operating contract that lives in canon, not in this file. **Before any substantive work, fetch `klappy://canon/bootstrap/model-operating-contract` via the oddkit MCP and treat it as binding** — it carries the turn rhythm (call `oddkit_time` first each turn), epistemic modes, the gate, the encode/persist loop, and the publish gauntlet. Search canon before asking the captain anything. You are first officer; judgment is yours, procedures are fetched live.

Reference repo this is ported from: **`klappy/git-repo-auth-mcp`** (the proven sibling). To read it, mint a read-only token via the **Git Repo Auth** MCP (`github_token`, omit permissions = read-only), clone, scrub the credential, read. Its `src/` and `.github/workflows/` are what the spine and CI mirror.

## 1. What this project is (one paragraph)

`bee-ai-auth-mcp` is a hosted, MIT, **self-host-first MCP credential relay** that brings a **Bee AI pendant's** captured conversations to **any MCP client** on **every surface**. Claude is the primary surface and first validation target (claude.ai web, iOS, iPadOS, Cowork — no laptop), but any MCP-speaking agent consumes the same wire. Bee's official MCP is local-stdio only, so it never reached mobile/web; closing that transport gap is the whole problem. *(Earlier working name: `bee-mcp` — same project; some internal docs still say bee-mcp. Canonical-URI rename is an open D0015 call for the operator.)*

## 2. Current state — mode, what's built, what's gated

- **Mode: EXECUTION (Phase-1).** The `oddkit` planning→execution gate **PASSED 4/4 on 2026-06-14** for the Bee-independent spine. PRD is **v0.2** (post-validation).
- **Spine: BUILT.** `src/{index,origin,state,types,bee-auth,bee,mcp-api}.ts` + `wrangler.jsonc` / `package.json` / `tsconfig.json` / `public/` / README. **Typechecks clean (`tsc --noEmit`, 0 errors)** against the real substrate. Compile-time only — no live deploy yet.
- **CI/CD: BUILT.** `.github/workflows/{ci,live-check}.yml` + `test/{state,origin,smoke.live}.test.ts` + `vitest.config.ts`, contract in `docs/ci-cd.md`. Verified locally: **11 unit tests pass; smoke skips without a target.**
- **Phase 1 = Model A (deployer-key self-host), Tier 1 only.** The deployer's Bee token is the Worker's own secret — no per-user custody (that's Tier 2, deferred).
- **GATED — the Bee-client slice:** the `whoami` call works only if Bee's real API presents a **publicly-trusted cert**; standard Workers `fetch` won't trust a private CA. The reachability check (operator, non-proxied env) decides; if private-CA, the path is Workers VPC (Origin-CA) / mTLS. The spine carries no other open unknown.
- **DoD remaining (needs operator's CF + Bee creds):** live deploy + a phone-only `whoami` wire check; connect the repo to Cloudflare Git integration so branch previews deploy; set the `PROD_BASE_URL` repo variable when prod exists.

## 3. What's been decided (full trail in the journal + `odd/ledger/2026-06-14-planning.md`)

- **Adopt, don't build, the operator's personal wire: Omi** ships a hosted all-surface MCP off the shelf. `bee-ai-auth-mcp` survives as (a) the reusable credential-relay substrate, (b) the interim wire for the operator's existing Bee, (c) the MIT Bee-community artifact. It is **not** the operator's long-term personal wire.
- **Credential security ladder:** Tier 1 (self-host, Model A) is Phase 1. Tier 2 (hosted, hardened) is deferred and is a cut/keep fork (P2). Tier 3 (naive paste-store) rejected. Tier 0 (Bee OAuth/minted tokens) petitioned, blocked on Bee.
- **Two-leg auth (non-negotiable):** user↔relay = OAuth (GitHub, identity-gate in Model A); relay↔Bee = the deployer's own token as a Worker secret.
- **Custody (corrected at validation):** Tier-1/Model A holds **no third-party token**. The honeypot is a **Tier-2-only** risk. `workers-oauth-provider` encrypts grant props with the token as key material (per-grant, **token-derived — not KMS**), so a storage-only leak reveals only metadata.
- **honest + safest (binding):** the Bee bearer never appears in logs/URLs/errors/output; errors never serialize the request or token. Revocation is honest: disconnect deletes our copy; full revocation = rotate at Bee.
- **Endpoints:** only `/v1/me` and `/v1/conversations` are confirmed in Bee's public docs. `/v1/search/conversations` and `/v1/changes` are **unconfirmed → Phase-2 confirm-or-drop** before any tool surface is frozen.
- **Phase 1 was a guided PORT of git-repo-auth**, not greenfield. Borrow map: `docs/implementation-handoff.md`.

## 4. The next action (precise)

1. **Operator:** (a) merge the `phase-1/ci-cd` PR; delete the superseded branches. (b) Run the **private-CA reachability check** from a non-proxied environment — `openssl s_client` against Bee's real API host, inspect the cert issuer. Public CA → the Bee-client slice un-gates; private → Workers VPC/mTLS or a network-path decision.
2. **Crew (the DoD, needs operator's CF + Bee creds):** connect Cloudflare Git integration, deploy, set the three secrets (`GITHUB_CLIENT_ID/SECRET`, `BEE_API_TOKEN`) + `ALLOWED_GITHUB_LOGIN` + `BEE_API_BASE`, then validate `whoami` at the wire **phone-only, three passes, fresh context**.
3. **Phase 2 (docs-first — `klappy://canon/principles/prompt-over-code`):** confirm-or-drop `/v1/search/conversations` + `/v1/changes` against the live API; **author the Bee-API-usage doc first**, then a `docs` tool (the git-auth pattern) + the read-only retrieval tools fulfill it. A **skill is the wrong layer** for a remote connector — use the docs tool + rich tool descriptions (+ optional MCP prompts/resources).
4. **Open forks (operator-owned, do not bank):** Tier-2 cut/keep/demote (P2); canonical-URI rename `bee-mcp` → `bee-ai-auth-mcp` (D0015, P3); docs-tool is queued for Phase 2 (above).

## 5. Map of this repo

- `RESUME.md` — this file. The entry point.
- `PRD.md` — authoritative spec, **v0.2**. Read after this file.
- `src/` — the Phase-1 Worker spine (Model A). `bee.ts` holds the private-CA seam; `mcp-api.ts` the `whoami` tool.
- `.github/workflows/` + `test/` + `docs/ci-cd.md` — the CI/CD pipeline and its contract.
- `docs/phase-1-execution-handoff.md` — the locked Phase-1 execution contract (DoD, constraints, irreversibility).
- `docs/implementation-handoff.md` — the git-auth → bee borrow map + post-validation amendments.
- `odd/ledger/2026-06-14-session-validation-to-execution.md` — the session journal (DOLCHEO: validation → challenge → build → CI → consolidation, with the E0010 debrief).
- `odd/ledger/2026-06-14-validation.md` — the fresh-context validation findings.
- `odd/ledger/2026-06-14-planning.md` — the planning-session journal.
- `planning/` — the exploration corpus (terrain map, prior-art journal, 6B borrow-eval, Omi-vs-Bee challenge). Provenance.
- Full verbatim session detail lives in the operator's transcripts, not in this repo.

## 6. Parallel tracks (don't serialize)

- **A** — adopt/verify Omi (confirm its hosted MCP registers as a claude.ai custom connector on web + iOS).
- **B** — Product B, the Refinery (device-agnostic encode layer) — separate exploration, not plan-ready.
- **C** — Tier-0 petition (ask Bee/Omi/Limitless for OAuth + short-lived minted tokens).
- **D** — publish sanitized prior art (raw 2026-06-12 transcripts carry PII — sanitize before any public share).
