# Phase 1 — Execution Contract (planning → execution gate)

**Date:** 2026-06-14 · **Mode:** planning → execution · **Scope:** Phase 1 (auth core + `whoami`), Model A / Tier 1 only.

> Per `klappy://canon/constraints/mode-transitions-require-encoded-handoff`: a mode transition needs a durable artifact or it is mode collapse with extra steps. This is that artifact. `oddkit_gate` (planning → execution) returned **NOT_READY (0/4)** because the refined plan lived only in conversation; this document locks the four prerequisites so the next gate run reads them.

---

## 1. Decisions — LOCKED

- **Model A (deployer-key self-host), Tier 1 only.** The deployer's Bee token is the Worker's own secret (`wrangler secret` / Secrets Store). The relay does **not** collect or custody other users' Bee tokens in Phase 1. This is the proven `mcp-limitless` pattern; it dissolves the credential-capture problem entirely for self-host.
- **Borrow, don't build:** port `klappy/git-repo-auth-mcp` — `index.ts` / `state.ts` / `wrangler.jsonc` / deps ~verbatim; user↔relay OAuth via `@cloudflare/workers-oauth-provider`; MCP surface via `agents` (`McpAgent`) + `@modelcontextprotocol/sdk`. Replace `@octokit/auth-app` with a thin Bee fetch client.
- **One tool:** `whoami` over `GET /v1/me` (the only Bee endpoint confirmed against live docs).
- **Ratified this session:** revocation copy is honest (for self-host, "revoke" = deployer rotates their own token at Bee; link to Bee's token page); custody encryption is **per-grant, token-derived** (workers-oauth-provider), not KMS — state it as such.

**Deferred — explicitly OUT of Phase 1:** per-user custody / Tier 2; `/v1/search/conversations` and `/v1/changes` (unconfirmed in Bee's docs → Phase 2 confirm-or-drop); Phase 3 hardening; the Omi connector verify-check (parallel track, non-blocking).

## 2. Definition of Done (Phase 1)

- Deployed Tier-1 preview reachable online; evidence viewable without running code locally.
- `whoami` returns the Bee account **over the connector on a mobile surface** (the all-surface claim demonstrated, not asserted), via the phone-only manual-OAuth-dance wire check.
- Load-bearing surface (auth core, Bee client) passes **independent fresh-context validation** before any prod promotion (`klappy://canon/principles/verification-requires-fresh-context`); same-session smoke does not count.
- **No secret in logs, URLs, errors, or client-visible output** — the Bee client's error path never serializes the request/headers or raw upstream response (constraint #2, "safest").
- MIT `LICENSE` + README documenting the self-host path and the deployer-key custody model **honestly** (constraint #2, "honest").
- Completion report + self-audit attached; release-validation-gate observed at merge (no merge with reviewer in progress).

## 3. Irreversibility — assessed: LOW

Phase 1 holds **no third party's credentials** — the only secret is the deployer's own Bee token, rotatable at Bee. The connector is additive; removing it reverts to today's copy-paste. The one genuinely sticky element (Tier-2 custody of *others'* tokens) is deferred out of Phase 1. No one-way doors here.

## 4. Constraints — satisfiable, with one open feasibility item

Satisfied: borrow-evaluation (6B present); release-validation-gate (in DoD); two-leg auth (OAuth on user↔relay + deployer-key on relay↔Bee); honest+safest (#2); magical-first-run (self-host trades sub-60s honestly — not a Phase-1 gate).

**OPEN — `private-CA reachability` (first execution task + tripwire):** standard Cloudflare Workers `fetch` trusts only publicly-trusted CAs; Bee's docs require a private CA (`bee-ca.pem`) for the direct API. A sandbox cert probe was inconclusive (the egress proxy masked Bee's origin cert). **Before the Bee client is locked**, confirm Worker→Bee reachability from a non-proxied environment: does Bee's real `$BEE_API_BASE` present a public cert, or is Workers VPC (Origin-CA, shipped 2026-02) / mTLS required? **If unreachable by any of those, REVERT to a planning micro-decision on the network path** (Workers VPC vs a tunnel vs pushing Tier-0/public-cert on Bee). This splits Phase 1:
- **Spine (Bee-independent) — build now:** scaffold port, OAuth wiring, MCP/`whoami` tool shape, Tier-1 deploy skeleton, README.
- **Bee-client slice — gated on the reachability result.**

## 5. Execution order

1. **Reachability spike** (operator from phone/laptop, or a Workers VPC probe) — retires §4's open item.
2. Mint read-only token (Git Repo Auth), clone `klappy/git-repo-auth-mcp`, read source (scrub token after).
3. Port scaffold: `index.ts` / `state.ts` / `wrangler.jsonc` / `package.json` (drop octokit + Stripe vars).
4. Wire user↔relay OAuth (workers-oauth-provider); `whoami` tool registered via `McpAgent`.
5. Bee fetch client (**gated on step 1**) + deployer-key secret intake.
6. Tier-1 deploy path + honest README/security model.
7. DoD validation: phone-only wire check, three-pass, fresh-context validator.

**Provenance:** crew pushes branches, operator opens PRs (Bugbot author-match). Release-validation-gate binds at merge, not now.
