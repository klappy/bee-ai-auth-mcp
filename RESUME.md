# RESUME — Fresh-Context Handoff

> You are likely a fresh crew session. This file is your entry point. Read it fully before acting.

## ⮕ START HERE — next action (read before touching anything)

`main` is current (E0020). **Phase 1 — auth core + per-grant encrypted custody + the private-CA Container bridge — is LIVE and phone-validated** at `bee.klappy.dev`: `whoami` returns the operator's Bee identity end-to-end through the bridge (E0019). **Phase 2 — the read surface — is BUILT and merged to `main` (E0020):** two tools, **`bee_docs`** (serves `docs/bee-api-usage.md`) and **`bee_read`** (read-only retrieval — GET any `/v1/*`, POST only to the allow-listed `/v1/search/*`; `/v1/stream` + all mutations refused; 512KB cap). `bee_read` generalizes the validated `whoami` transport (bound bridge + per-grant `beeToken`). It is **typecheck-clean but NOT yet runtime-validated — merged ≠ runs.**

**⮕ NEXT ACTION: run the phone-only, fresh-context validation of the read surface** (release-validation-gate): `bee_docs` returns the reference; `bee_read /v1/me` matches `whoami`; `bee_read /v1/conversations` lists; `bee_read /v1/search/conversations` (POST `search` body) returns hits. Then close the Phase-1 DoD tail (three-pass re-run, second-login-denial demo, no-token-in-logs audit). Latest journal: `odd/ledger/2026-06-16-phase2-read-surface-built-and-merged.md` (E0020). Authoritative spec: `PRD.md` (v0.5). Deploy runbook: `bridge/README.md`. Merge-to-`main` is a code milestone, not the validated DoD — do not promote to prod before the fresh-context green.

**Deploy model:** a `git push` auto-deploys via Cloudflare's connected Git integration (Workers Builds) — branch push = preview (`wrangler versions upload`), merge to `main` = prod. No manual `wrangler`, no CF token. See `docs/ci-cd.md`.

**Custody amendment (ratified 2026-06-15):** Phase 1 is built on **per-grant encrypted custody** (Bee token in the user's encrypted grant props), **not** the old Model-A Worker secret. Tenancy is the GitHub allow-list, kept at **one login (`klappy`)** — Tier-2 architecture, Tier-1 tenant. This supersedes the Model-A lock; see E0012.

## 0. Bootstrap (do this first)

You operate under a captain (Klappy) and a binding operating contract that lives in canon, not in this file. **Before any substantive work, fetch `klappy://canon/bootstrap/model-operating-contract` via the oddkit MCP and treat it as binding** — it carries the turn rhythm (call `oddkit_time` first each turn), epistemic modes, the gate, the encode/persist loop, and the publish gauntlet. Search canon before asking the captain anything. You are first officer; judgment is yours, procedures are fetched live.

Reference repo this is ported from: **`klappy/git-repo-auth-mcp`** (the proven sibling). To read it, mint a read-only token via the **Git Repo Auth** MCP (`github_token`, omit permissions = read-only), clone, scrub the credential, read. Its `src/` and `.github/workflows/` are what the spine and CI mirror.

## 1. What this project is (one paragraph)

`bee-ai-auth-mcp` is a hosted, MIT, **self-host-first MCP credential relay** that brings a **Bee AI pendant's** captured conversations to **any MCP client** on **every surface**. Claude is the primary surface and first validation target (claude.ai web, iOS, iPadOS, Cowork — no laptop), but any MCP-speaking agent consumes the same wire. Bee's official MCP is local-stdio only, so it never reached mobile/web; closing that transport gap is the whole problem. *(Earlier working name: `bee-mcp` — same project; some historical docs still say bee-mcp. Canonical name is now `bee-ai-auth-mcp` everywhere — D0015 resolved.)*

## 2. Current state — mode, what's built, what's gated

- **Mode: Phase-2 read surface BUILT + merged (E0020); runtime/phone validation pending.** Phase-1 wire proof validated (E0019). A few formal Phase-1 DoD boxes remain (three-pass re-run, second-login-denied demo, no-token-in-logs audit). PRD is **v0.5** (Phase 2 read surface specced).
- **Live at `bee.klappy.dev`:** multi-page site + logo, `/healthz`, `/mcp` (401 unauth), OAuth surface, GitHub identity gate, MCP connect validated end-to-end on a phone. Worker deployed as `bee-ai-auth-mcp`. Secrets set: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. `ALLOWED_GITHUB_LOGIN=klappy`.
- **Spine + CI/CD: BUILT and merged to `main`.** `src/{index,origin,state,types,bee-auth,bee,mcp-api}.ts`, `.github/workflows/`, tests, `docs/ci-cd.md`.
- **Network path RESOLVED (E0012):** Bee uses a **private CA** (conclusive — Bee docs 2026-06-07 + `bee-cli/sources/certs.ts`). Stock Worker `fetch`, Workers VPC+Origin-CA, and the mTLS binding all cannot trust it. Path = a CF Container running caddy that trusts `bee-ca.pem`. **Refined (E0013 D0028): the container runs in the *same project*, bound to the relay Worker (internal Worker→container call), not a separate deployment.**
- **Custody VERIFIED + amended (E0012):** `@cloudflare/workers-oauth-provider` 0.7.2 wraps a per-encryption random AES key with `HMAC(public-constant, relay-token)` — no master key, per-user isolated, KV-dump-alone useless. Phase 1 holds the Bee token in encrypted grant props (not a Worker secret). Residual = in-flight/live-process plaintext, bounded by the empty-toolbox bridge, not crypto.
- **Bee leg BUILT + merged to `main` (E0013):** the custody bend (`bee-auth.ts` consent capture, `state.ts` HMAC consent round-trip, `bee.ts` reads the decrypted grant, `mcp-api.ts` `whoami`, `types.ts` drops `BEE_API_TOKEN`) + the `bridge/` artifacts (hardened caddy Container). Typecheck clean; 15 unit tests pass. **No new Worker secrets** (`BEE_API_TOKEN` removed).
- **Phase 2 read surface BUILT + merged to `main` (E0020):** two tools — `bee_docs` (serves `docs/bee-api-usage.md`, embedded via `scripts/gen-bee-docs.mjs`) and `bee_read` (GET any `/v1/*`; POST only to the allow-listed `/v1/search/*` — Bee search is POST but non-mutating; `/v1/stream` + all mutations refused; 512KB cap). Read-only by construction; generalizes the validated `whoami` transport. `tsc --noEmit` clean. **Runtime/phone validation pending — merged ≠ runs.** `bee_write` deferred to the write phase.
- **Phase-1 DoD — mostly done (E0019):** bridge deployed; `whoami` wire-validated end-to-end on mobile; the real Bee host (`BEE_UPSTREAM`/`BEE_SNI` = `app-api-developer.ce.bee.amazon.dev`) and `bridge/bee-ca.pem` are committed; docs + site sharpened against the validated artifact. **Remaining:** a three-pass re-run, a demonstrated second-login denial, and a no-token-in-logs audit.

## 3. What's been decided (full trail in the journal + `odd/ledger/2026-06-14-planning.md`)

- **Adopt, don't build, the operator's personal wire: Omi** ships a hosted all-surface MCP off the shelf. `bee-ai-auth-mcp` survives as (a) the reusable credential-relay substrate, (b) the interim wire for the operator's existing Bee, (c) the MIT Bee-community artifact. It is **not** the operator's long-term personal wire.
- **Credential security ladder:** Tier 1 (self-host, Model A) is Phase 1. Tier 2 (hosted, hardened) is deferred and is a cut/keep fork (P2). Tier 3 (naive paste-store) rejected. Tier 0 (Bee OAuth/minted tokens) petitioned, blocked on Bee.
- **Two-leg auth (non-negotiable):** user↔relay = OAuth (GitHub, identity-gate); relay↔Bee = the user's own Bee token, captured at consent and held in encrypted grant props (this superseded the old "deployer's Worker secret" framing — custody amendment, E0012).
- **Custody (corrected at validation):** Tier-1/Model A holds **no third-party token**. The honeypot is a **Tier-2-only** risk. `workers-oauth-provider` encrypts grant props with the token as key material (per-grant, **token-derived — not KMS**), so a storage-only leak reveals only metadata.
- **honest + safest (binding):** the Bee bearer never appears in logs/URLs/errors/output; errors never serialize the request or token. Revocation is honest: disconnect deletes our copy; full revocation = rotate at Bee.
- **Endpoints / tool surface (resolved E0020):** `bee_read` is a method-keyed passthrough — **no tool surface to freeze.** Bee's read surface (confirmed vs the proxy docs, 2026-06-07): `/v1/me`, `/v1/conversations(/:id)`, `/v1/facts`, `/v1/todos`, `/v1/journals`, `/v1/daily`, `/v1/changes` are **GET**; **search is POST** (`/v1/search/conversations`, `/v1/search/conversations/neural`). One read tool with good docs (D0034); a separate `bee_search` was considered and rejected.
- **Phase 1 was a guided PORT of git-repo-auth**, not greenfield. Borrow map: `docs/implementation-handoff.md`.
- **Phase-2 rulings (E0020):** 6B accepted (D0033); surface = `bee_docs` + a single `bee_read` method-split, "fewer tools, good docs" (D0034); **`app_id` reframed off the critical path (D0035)** — the CLI-assisted paste path (`bee login --qr`, paste the token) needs no `app_id` and is the working acquisition path; a registered `app_id` matters only for the no-CLI relay-native pairing on a *public/multi-tenant* relay (Phase-3 vendor ask; single-tenant moot); CLI-broker noted as a registration-free middle. Commit-attribution fix (D0036): never use an email that credits a third-party GitHub account.

## 4. The next action (precise)

1. **Phase 1 + Phase 2 build — DONE.** Bridge bound + deployed; `whoami` validated end-to-end on mobile (E0019). `bee_docs` + `bee_read` built + merged to `main` (E0020), typecheck-clean.
2. **⮕ Validate the read surface — phone-only, three passes, fresh context** (release-validation-gate): `bee_docs` returns the reference; `bee_read /v1/me` matches `whoami`; `bee_read /v1/conversations` lists; `bee_read /v1/search/conversations` (POST `search`) returns hits. *Compile-checked only so far — merged ≠ runs.*
3. **Close the Phase-1 DoD tail:** a three-pass re-run, a demonstrated second-login denial, and a no-token-in-logs audit.
4. **Doc tidy / deferred:** `bee_write` (write phase); `app_id` registration (Phase-3, public/multi-tenant only — single-tenant moot); confirm the preferred commit `Name <email>`. *(D0015 canonical-name rename → `bee-ai-auth-mcp` everywhere: resolved 2026-06-15.)*

## 5. Map of this repo

- `RESUME.md` — this file. The entry point.
- `PRD.md` — authoritative spec, **v0.5** (Phase 2 read surface specced). Read after this file.
- `src/` — the Worker spine. `bee.ts` is the Bee client (`beeGetMe` + the `beeRead` passthrough); `bee-auth.ts` captures the token into encrypted grant props; `mcp-api.ts` registers `whoami`, `bee_docs`, `bee_read`. `docs/bee-api-usage.md` + `scripts/gen-bee-docs.mjs` feed `bee_docs`.
- `.github/workflows/` + `test/` + `docs/ci-cd.md` — the CI/CD pipeline and its contract.
- `docs/phase-1-build-handoff.md` — **the build contract for the Bee leg (read this to build).**
- `docs/phase-1-execution-handoff.md` — the earlier locked Phase-1 contract (private-CA tripwire now resolved by E0012).
- `docs/implementation-handoff.md` — the git-auth → bee borrow map.
- `bridge/` — the private-CA bridge artifacts (Dockerfile, Caddyfile, committed `bee-ca.pem` public roots, README runbook, wrangler starting point).
- `odd/ledger/2026-06-16-phase2-read-surface-built-and-merged.md` — **E0020: Phase 2 read surface built + merged; the Phase-2 rulings (D0033–D0036).**
- `odd/ledger/2026-06-15-phase-1-bee-leg-build-pass.md` — **E0013: the build pass (custody bend + bridge), what's merged, what the DoD still owes.**
- `odd/ledger/2026-06-15-bee-leg-private-ca-and-multitenancy.md` — **E0012: gate resolution, bridge decision, crypto verification, custody amendment, rejections.**
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
