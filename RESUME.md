# RESUME — Fresh-Context Handoff

> You are likely a fresh crew session. This file is your entry point. Read it fully before acting.

## ⮕ START HERE — next action (read before touching anything)

The auth core is **live and phone-validated** at `bee.klappy.dev` (E0011); `main` is current. The Phase-1 **Bee leg is LIVE and wire-validated** (E0019): per-grant encrypted custody + the private-CA Container bridge are deployed, and **`whoami` returns the operator's Bee identity end-to-end through the bridge** (validated on mobile, fresh context). The dead-host 502 was a wrong upstream (`api.bee.computer`, NXDOMAIN); fixed to the real Bee host `app-api-developer.ce.bee.amazon.dev`. The 2026-06-15 session found the bridge artifacts were written for the pre-D0028 public-cert model and must be re-wired as a bound Cloudflare Container (internal `:8080`, `getContainer(env.BEE_BRIDGE)` in `bee.ts`, per-user token, no public ACME). **START at the handoff: `odd/ledger/2026-06-15-session-close-bridge-wiring-handoff.md` (E0014)** — it has the full, verified change set, the operator-only inputs (Bee `$BEE_UPSTREAM`/`$BEE_SNI`, the one-time container build command, a real Bee token), the CI `resolve-preview` fix, the website honesty pass, and the fresh-context `whoami` validation (the DoD). Workers **Paid** is confirmed; `main` is green (verified via check-runs). Decision trail: E0014 → `odd/ledger/2026-06-15-phase-1-bee-leg-build-pass.md` (E0013) → `odd/ledger/2026-06-15-bee-leg-private-ca-and-multitenancy.md` (E0012). Authoritative spec: `PRD.md` (v0.4). Deploy runbook: `bridge/README.md`. Read those, then deploy + validate. Merge-to-`main` is a code milestone, not the validated DoD — do not promote to prod before the fresh-context green.

**Deploy model:** a `git push` auto-deploys via Cloudflare's connected Git integration (Workers Builds) — branch push = preview (`wrangler versions upload`), merge to `main` = prod. No manual `wrangler`, no CF token. See `docs/ci-cd.md`.

**Custody amendment (ratified 2026-06-15):** Phase 1 is built on **per-grant encrypted custody** (Bee token in the user's encrypted grant props), **not** the old Model-A Worker secret. Tenancy is the GitHub allow-list, kept at **one login (`klappy`)** — Tier-2 architecture, Tier-1 tenant. This supersedes the Model-A lock; see E0012.

## 0. Bootstrap (do this first)

You operate under a captain (Klappy) and a binding operating contract that lives in canon, not in this file. **Before any substantive work, fetch `klappy://canon/bootstrap/model-operating-contract` via the oddkit MCP and treat it as binding** — it carries the turn rhythm (call `oddkit_time` first each turn), epistemic modes, the gate, the encode/persist loop, and the publish gauntlet. Search canon before asking the captain anything. You are first officer; judgment is yours, procedures are fetched live.

Reference repo this is ported from: **`klappy/git-repo-auth-mcp`** (the proven sibling). To read it, mint a read-only token via the **Git Repo Auth** MCP (`github_token`, omit permissions = read-only), clone, scrub the credential, read. Its `src/` and `.github/workflows/` are what the spine and CI mirror.

## 1. What this project is (one paragraph)

`bee-ai-auth-mcp` is a hosted, MIT, **self-host-first MCP credential relay** that brings a **Bee AI pendant's** captured conversations to **any MCP client** on **every surface**. Claude is the primary surface and first validation target (claude.ai web, iOS, iPadOS, Cowork — no laptop), but any MCP-speaking agent consumes the same wire. Bee's official MCP is local-stdio only, so it never reached mobile/web; closing that transport gap is the whole problem. *(Earlier working name: `bee-mcp` — same project; some historical docs still say bee-mcp. Canonical name is now `bee-ai-auth-mcp` everywhere — D0015 resolved.)*

## 2. Current state — mode, what's built, what's gated

- **Mode: Phase-1 wire proof VALIDATED (E0019).** `whoami` returns the operator's Bee identity end-to-end through the bridge (validated on mobile, fresh context). A few formal DoD boxes remain (three-pass re-run, second-login-denied demo, no-token-in-logs audit). PRD is **v0.4** (bound-container bridge + token-agnostic custody).
- **Live at `bee.klappy.dev`:** multi-page site + logo, `/healthz`, `/mcp` (401 unauth), OAuth surface, GitHub identity gate, MCP connect validated end-to-end on a phone. Worker deployed as `bee-ai-auth-mcp`. Secrets set: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. `ALLOWED_GITHUB_LOGIN=klappy`.
- **Spine + CI/CD: BUILT and merged to `main`.** `src/{index,origin,state,types,bee-auth,bee,mcp-api}.ts`, `.github/workflows/`, tests, `docs/ci-cd.md`.
- **Network path RESOLVED (E0012):** Bee uses a **private CA** (conclusive — Bee docs 2026-06-07 + `bee-cli/sources/certs.ts`). Stock Worker `fetch`, Workers VPC+Origin-CA, and the mTLS binding all cannot trust it. Path = a CF Container running caddy that trusts `bee-ca.pem`. **Refined (E0013 D0028): the container runs in the *same project*, bound to the relay Worker (internal Worker→container call), not a separate deployment.**
- **Custody VERIFIED + amended (E0012):** `@cloudflare/workers-oauth-provider` 0.7.2 wraps a per-encryption random AES key with `HMAC(public-constant, relay-token)` — no master key, per-user isolated, KV-dump-alone useless. Phase 1 holds the Bee token in encrypted grant props (not a Worker secret). Residual = in-flight/live-process plaintext, bounded by the empty-toolbox bridge, not crypto.
- **Bee leg BUILT + merged to `main` (E0013):** the custody bend (`bee-auth.ts` consent capture, `state.ts` HMAC consent round-trip, `bee.ts` reads the decrypted grant, `mcp-api.ts` `whoami`, `types.ts` drops `BEE_API_TOKEN`) + the `bridge/` artifacts (hardened caddy Container). Typecheck clean; 15 unit tests pass. **No new Worker secrets** (`BEE_API_TOKEN` removed).
- **Phase-1 DoD — mostly done (E0019):** bridge deployed; `whoami` wire-validated end-to-end on mobile; the real Bee host (`BEE_UPSTREAM`/`BEE_SNI` = `app-api-developer.ce.bee.amazon.dev`) and `bridge/bee-ca.pem` are committed; docs + site sharpened against the validated artifact. **Remaining:** a three-pass re-run, a demonstrated second-login denial, and a no-token-in-logs audit.

## 3. What's been decided (full trail in the journal + `odd/ledger/2026-06-14-planning.md`)

- **Adopt, don't build, the operator's personal wire: Omi** ships a hosted all-surface MCP off the shelf. `bee-ai-auth-mcp` survives as (a) the reusable credential-relay substrate, (b) the interim wire for the operator's existing Bee, (c) the MIT Bee-community artifact. It is **not** the operator's long-term personal wire.
- **Credential security ladder:** Tier 1 (self-host, Model A) is Phase 1. Tier 2 (hosted, hardened) is deferred and is a cut/keep fork (P2). Tier 3 (naive paste-store) rejected. Tier 0 (Bee OAuth/minted tokens) petitioned, blocked on Bee.
- **Two-leg auth (non-negotiable):** user↔relay = OAuth (GitHub, identity-gate); relay↔Bee = the user's own Bee token, captured at consent and held in encrypted grant props (this superseded the old "deployer's Worker secret" framing — custody amendment, E0012).
- **Custody (corrected at validation):** Tier-1/Model A holds **no third-party token**. The honeypot is a **Tier-2-only** risk. `workers-oauth-provider` encrypts grant props with the token as key material (per-grant, **token-derived — not KMS**), so a storage-only leak reveals only metadata.
- **honest + safest (binding):** the Bee bearer never appears in logs/URLs/errors/output; errors never serialize the request or token. Revocation is honest: disconnect deletes our copy; full revocation = rotate at Bee.
- **Endpoints:** only `/v1/me` and `/v1/conversations` are confirmed in Bee's public docs. `/v1/search/conversations` and `/v1/changes` are **unconfirmed → Phase-2 confirm-or-drop** before any tool surface is frozen.
- **Phase 1 was a guided PORT of git-repo-auth**, not greenfield. Borrow map: `docs/implementation-handoff.md`.

## 4. The next action (precise)

1. **Deploy + wire the Bee leg — DONE (E0019).** Bridge bound + deployed; `whoami` returns the operator's Bee identity end-to-end through the bridge (validated on mobile). The dead-host 502 was a wrong `BEE_UPSTREAM` (`api.bee.computer`, NXDOMAIN), now the real host `app-api-developer.ce.bee.amazon.dev`. `ALLOWED_GITHUB_LOGIN=klappy` holds.
2. **Validate** `whoami` at the wire **phone-only, three passes, fresh context**; confirm a second login is denied; confirm no token in any log. Then **sharpen `README.md` / security doc / `public/` site against the built artifact** (per `code-claims-require-code-observation`).
3. **Phase 2 (docs-first — `klappy://canon/principles/prompt-over-code`):** confirm-or-drop `/v1/search/conversations` + `/v1/changes` against the live API; **author the Bee-API-usage doc first**, then a `docs` tool (the git-auth pattern) + the read-only retrieval tools fulfill it. A **skill is the wrong layer** for a remote connector — use the docs tool + rich tool descriptions (+ optional MCP prompts/resources).
4. **Open forks (operator-owned, do not bank):** Tier-2 cut/keep/demote (P2); docs-tool is queued for Phase 2 (above). *(D0015 canonical-name rename → `bee-ai-auth-mcp` everywhere: resolved 2026-06-15.)*

## 5. Map of this repo

- `RESUME.md` — this file. The entry point.
- `PRD.md` — authoritative spec, **v0.3** (custody amendment + private-CA resolution). Read after this file.
- `src/` — the Phase-1 Worker spine. `bee.ts` is the Bee client; `bee-auth.ts` captures the token into encrypted grant props; `mcp-api.ts` the `whoami` tool.
- `.github/workflows/` + `test/` + `docs/ci-cd.md` — the CI/CD pipeline and its contract.
- `docs/phase-1-build-handoff.md` — **the build contract for the Bee leg (read this to build).**
- `docs/phase-1-execution-handoff.md` — the earlier locked Phase-1 contract (private-CA tripwire now resolved by E0012).
- `docs/implementation-handoff.md` — the git-auth → bee borrow map.
- `bridge/` — the private-CA bridge artifacts (Dockerfile, Caddyfile, committed `bee-ca.pem` public roots, README runbook, wrangler starting point).
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
