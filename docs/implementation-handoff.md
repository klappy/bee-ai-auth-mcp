> **Historical Phase-1 artifact (point-in-time).** Superseded by current state in `RESUME.md` / `PRD.md` v0.5. Phase 2 (`bee_docs` + `bee_read`, read-only) shipped — see `odd/ledger/2026-06-16-phase2-read-surface-built-and-merged.md` (E0020). Kept for the record; do not read as current state.

# bee-mcp Implementation Handoff — Porting git-repo-auth, Grounded in Its Repo + Ledger

**Date:** 2026-06-14
**Source:** read of `klappy/git-repo-auth-mcp` @ main (source + `odd/ledger/`) via a read-only minted token (scrubbed after).
**Companion to:** `bee-mcp-PRD-v0.1.md`. This is the "how to build it" to the PRD's "what and why."
**Posture:** bee-mcp Phase 1 is a **guided port** of a proven repo, not a greenfield scaffold. Borrow the skeleton; bend three files.

---

## 1. The architecture, confirmed in code

git-repo-auth is a Cloudflare Worker where `@cloudflare/workers-oauth-provider` wraps everything: it owns `/authorize`, `/token`, `/register`, gates `/mcp`, and delivers **decrypted per-grant `props`** to the API handler on every call. The MCP surface is `agents` (`createMcpHandler`) + `@modelcontextprotocol/sdk` (`McpServer.registerTool`). Token work uses `@octokit/auth-app`.

**The load-bearing sentence (src/index.ts):** *"No GitHub tokens are ever stored. The only state is the provider's own hashed OAuth grants and a 10-minute pending record."* Its safety = it stores a **reference** (`installationId`) and mints per call. That is the one thing bee-mcp cannot copy.

## 2. Borrow map — git-auth file → bee-mcp file

| git-auth file | Role | bee-mcp action |
|---|---|---|
| `src/index.ts` | OAuthProvider wrapper + origin gate on `/mcp` | **Borrow ~verbatim.** Change `name`, `scopesSupported: ["bee_read"]`. Keep origin gating (directory requirement). |
| `src/state.ts` | base64url round-trip of OAuth `state` | **Borrow verbatim.** Pure utility. |
| `src/types.ts` | `Env` + `GrantProps` | **Bend.** `GrantProps` changes from `{login, installationId, accountLabel}` → `{login, beeToken, beeAccountLabel}`. **This is the custody divergence, located in one type.** |
| `src/mcp-api.ts` | gated `/mcp`; `registerTool` surface; quota bracket; `docs` + `admin_stats` tools | **Bend.** Replace the `github_token` minting tool with `whoami` (Phase 1) then retrieval tools (Phase 2). Keep: `createMcpHandler`, zod `inputSchema`, annotation blocks, `ctx.waitUntil` for accounting/telemetry, rich JSON error payloads, the `docs` tool, operator-gated `admin_stats`. |
| `src/github-auth.ts` | defaultHandler: `/authorize`→GitHub→`/callback`→list installs→bind grant | **Bend → `bee-auth.ts`.** `/authorize` → relay consent → **capture the user's Bee token (the single supply point)** → validate via `GET /v1/me` → `completeAuthorization` binding the grant with the token in (encrypted) props. git-auth's "user token used for two GETs then discarded" becomes "Bee token validated, then held in the encrypted grant." |
| `src/keys.ts` | PKCS#1→PKCS#8 normalize; "paste-as-is, phone-friendly" | **Bend.** Becomes Bee-token intake: accept the paste as-is, trim, validate shape. Keep the phone-friendly ethos (magical-first-run). |
| `@octokit/auth-app` (dep) | App minting | **Replace** with a thin `bee.ts` client: `fetch` over `/v1/*` with `Authorization: Bearer`, **private-CA trust** (Bee's cert), no minting. |
| `src/quota.ts`,`billing.ts`,`stats.ts`,`provenance.ts`,`install.ts`,`origin.ts`,`docs.ts`,`pages.ts` | quota transparency, Stripe metering, operator stats, install UX | **Mirror in Phase 3** (Tier 2 parity). Identified by role; port when hardening. |
| `wrangler.jsonc` | `nodejs_compat`, Text rule bundling `**/*.md`, `observability`, `assets: ./public`, `OAUTH_KV` | **Borrow structure.** Drop `GH_APP_*` / Stripe vars for Phase 1. Keep the governance-md Text rule + `OAUTH_KV`. |
| `package.json` | deps | **Borrow exact, minus octokit.** See §3. |
| `governance/` + `odd/ledger/` + `journal/` + `public/*.html` + `test/smoke.live.test.ts` + `.github/workflows/{ci,live-check}.yml` | governance bundling, encoding journal, onboarding pages, live validation, CI | **Mirror the skeleton.** This is the repo's "operating system"; adopt it wholesale. |

## 3. Dependencies (confirmed versions, port directly)

```
@cloudflare/workers-oauth-provider ^0.7.2   ← user↔relay OAuth, hashed grants in KV, DCR + PKCE
@modelcontextprotocol/sdk          ^1.29.0   ← McpServer / tool registration
agents                             ^0.15.0   ← createMcpHandler (MCP transport on Workers)
zod                                ^4.4.3    ← tool input schemas
— drop @octokit/auth-app; add a thin Bee fetch client instead —
dev: wrangler ^4.99, vitest ^4.1.8, typescript ^6, @cloudflare/workers-types
```

## 4. The custody model — the one real divergence, and it's already charted

git-auth stores no secret. bee-mcp must hold the Bee token. **Phase 1 model: store the Bee token inside the OAuthProvider's encrypted grant props.** The provider already encrypts grants in `OAUTH_KV` and decrypts to `ctx.props` per call — so no separate envelope store is needed for Tier 1. Revocation = the user disconnects the connector.

**This is not improvised.** git-auth's own backlog item **B1** (ledger, 2026-06-11) plans to store "one encrypted refresh credential per grant **inside the already-encrypted per-grant props**," amending its promise to *"no repository tokens stored; one encrypted refresh credential per grant, revocable by you."* bee-mcp's custody model is that exact pattern. Reuse the wording for bee-mcp's privacy policy / security model.

- **Tier 1 (self-host):** grant-props storage is sufficient; the token lives in the user's own Worker's KV. No central honeypot.
- **Tier 2 (hosted):** layer KMS-backed encryption on top + per-user isolation; **gate scaling on the Tier 0 petition** (PRD risk). The honeypot is the one item that does not reach git-auth parity until Bee ships minting.

## 5. Ship/validation process — lifted from the ledger (the journal of encodings)

git-auth shipped to the Anthropic connector directory using a method bee-mcp should inherit:

- **[L] Phone-only validation, no laptop.** The "manual OAuth dance" is an MCP-Inspector substitute: DCR-register a throwaway client → PKCE → operator authorizes in their own browser (credentials never touch chat) → paste the redirect back → raw `initialize`/`tools/list`/`tools/call` → revoke the grant. Done twice from iPad. **Directly serves your no-laptop constraint** — bee-mcp validates the same way.
- **[L] "Client view is never evidence about the wire."** Confirm tool annotations/`tools/list` at protocol level, not from any client's rendering.
- **[O] The connector layer caches tool schemas from connect time** — reconnect to refresh; the validation runbook connects fresh.
- **Three-pass validation** before any ship: (1) requirements conformance, (2) reviewer simulation across all four surfaces, (3) adversarial read — at least one pass by a **fresh-context** validator (`verification-requires-fresh-context`). This is bee-mcp's DoD for Phase 1+.
- **[O] Provenance breaks tooling:** Cursor Bugbot author-matches the PR creator, so bot-authored PRs never trigger review. **Interim convention:** crew pushes branches, operator opens PRs. Adopt for bee-mcp until/unless user-attributed minting exists.
- **[D] Reviewer walks the real first-run path** — don't pre-arrange around onboarding; the zero-setup flow and free tier *are* the demo. bee-mcp's magical-first-run is the thing under test, not something to stage around.
- **[H] The graduation intent:** git-auth's submission run was meant to become a reusable skill so "the next app goes idea → submitted-with-payments-live in one day." **bee-mcp is that next app** — it should consume the directory-submission gauntlet git-auth established, not re-derive it.

## 6. Net effect on the PRD

- **Phase 1 shrinks:** much of the auth core is a port, not a build. Risk drops.
- **Custody is precise:** Bee token in encrypted grant props (Tier 1); KMS + Tier-0 gate (Tier 2). Update the PRD's Approach/Risks to name grant-props storage.
- **DoD gains teeth:** adopt the three-pass + fresh-context + wire-level validation, runnable from phone.
- **Open items unchanged:** confirm Bee `/v1/*` schemas + private-CA handling against the live API during the port (don't fabricate); the Omi connector-compat check is still its own track.

---

## Encoded this session (DOLCHEO ledger)

- **[L]** Custody is simpler than the ladder assumed: the Bee token rides in `workers-oauth-provider`'s already-encrypted per-grant props (revocation = disconnect); no separate envelope store for Tier 1 — the exact pattern git-auth's B1 roadmap charts. KMS + Tier-0 gate remain the Tier 2 hardening.
- **[D]** Phase 1 is a guided port of git-repo-auth: borrow `index.ts`/`state.ts`/`wrangler.jsonc`/deps ~verbatim; bend `types.ts` (GrantProps), `mcp-api.ts` (tools), `github-auth.ts`→`bee-auth.ts`; replace `@octokit/auth-app` with a private-CA Bee client; mirror the governance/ledger/public/test/CI skeleton.
- **[L]** The ship method is reusable and laptop-free: three-pass validation (requirements / four-surface reviewer sim / adversarial) with a fresh-context validator, confirmed at the wire (client view ≠ wire; reconnect to refresh cached schemas); the manual OAuth dance is a phone-only Inspector substitute. Adopt as Phase 1 DoD.
- **[O]** Provenance breaks tooling: Bugbot author-matches the PR creator, so bot PRs never review. Interim convention: crew pushes branches, operator opens PRs.

---

## Post-validation amendments (2026-06-14)

A fresh-context validation + challenge pass refined this handoff. Trail: `odd/ledger/2026-06-14-validation.md`, `odd/ledger/2026-06-14-session-validation-to-execution.md`, `docs/phase-1-execution-handoff.md` (the locked Phase-1 contract). Net changes to the borrow map above:

- **Phase 1 is Model A (deployer-key self-host), not per-user custody.** The deployer's Bee token is the Worker's own secret (`wrangler secret`). This matches the closest prior art (`mcp-limitless`) and dissolves the credential-capture problem for self-host. The `bee-auth.ts` "capture the user's token mid-OAuth" flow described in §2 is a **Tier-2** concern, deferred. Per-grant prop encryption is **token-derived, not KMS** (correcting §4's framing).
- **Private CA is a Break, not a Bend (verified).** Standard Workers `fetch` trusts only publicly-trusted CAs; bee-cli's `--cacert` does not port. The Bee client is **gated on a reachability check** from a non-proxied environment; if Bee's direct API isn't publicly trusted, the path is Workers VPC (Origin-CA) / mTLS, or revert. Do not lock the Bee client before this is retired.
- **The borrowed "rich JSON error payloads" are a token-leak vector here.** git-auth could afford them because it minted ephemeral tokens; bee-mcp holds a long-lived bearer. The error path **must never serialize the Bee request/headers or raw upstream response**. Binding constraint (`safest`).
- **Revocation:** disconnect deletes the relay's copy; full revocation = rotate at Bee. Do not import git-auth's "revocable by you" wording unchanged (`honest`).
- **Endpoints:** only `/v1/me` and `/v1/conversations` are confirmed in Bee's public docs; `/v1/search/conversations` and `/v1/changes` are unconfirmed → Phase-2 confirm-or-drop.
