# RESUME — Fresh-Context Handoff

> You are likely a fresh crew session. This file is your entry point. Read it fully before acting.

## 0. Bootstrap (do this first)

You operate under a captain (Klappy) and a binding operating contract that lives in canon, not in this file. **Before any substantive work, fetch `klappy://canon/bootstrap/model-operating-contract` via the oddkit MCP and treat it as binding** — it carries the turn rhythm (call `oddkit_time` first each turn), epistemic modes, the gate, the encode/persist loop, and the publish gauntlet. Search canon before asking the captain anything. You are first officer; judgment is yours, procedures are fetched live.

Reference repo you are porting from: **`klappy/git-repo-auth-mcp`** (the proven sibling). To read it, mint a read-only token via the **Git Repo Auth** MCP (`github_token`, omit permissions = read-only), clone, scrub the credential, read. Its `odd/ledger/` is worth your time.

## 1. What this project is (one paragraph)

`bee-ai-auth-mcp` is a hosted, MIT, **self-host-first MCP credential relay** that brings a **Bee AI pendant's** captured conversations to **any MCP client** on **every surface** — client-agnostic by protocol. Claude is the primary surface and first validation target (claude.ai web, iOS, iPadOS, Cowork, no laptop), but Cursor and any other MCP-speaking agent consume the same wire. The only thing that hurt in the capture→retrieve pipeline was **transport** — the operator hand-relaying Bee content into his AI tools. Bee's official MCP is local-stdio only, so it never reached mobile/web; that gap is the whole problem. *(Earlier working name: `bee-mcp` — same project; some internal docs still say bee-mcp.)*

## 2. Current state — mode and gate

- **Mode: EXECUTION (Phase-1 spine).** The `oddkit` planning→execution gate **PASSED 4/4 on 2026-06-14** for the Bee-independent spine, after the refined plan was written down (`docs/phase-1-execution-handoff.md`). PRD is v0.2 (post-validation).
- **Phase 1 = Model A (deployer-key self-host), Tier 1 only.** The deployer's Bee token is the Worker's own secret — no per-user custody (that's Tier 2, deferred).
- **The Bee-client slice is gated** on the private-CA reachability check (a Worker reaching Bee's private-CA API). Spine (scaffold, OAuth, whoami shape, deploy skeleton) carries no open unknown and is in execution.
- Persistence/handoff/governance work is always allowed; per-user-custody/Tier-2 code is out of scope until the Tier-2 decision + Tier-0.

## 3. What's been decided (full trail in `odd/ledger/2026-06-14-planning.md`)

- **Adopt, don't build, the wire for the operator personally: Omi** ships a hosted all-surface MCP off the shelf. `bee-ai-auth-mcp` survives as (a) the reusable credential-relay substrate, (b) the interim wire for the operator's existing Bee, (c) the MIT Bee-community artifact. It is explicitly **not** the operator's long-term personal wire.
- **Credential security ladder:** ship Tier 1 (self-host) + Tier 2 (hosted, hardened to git-auth parity). Tier 3 (naive paste-store) rejected. Tier 0 (Bee-issued minted/OAuth tokens) petitioned but blocked on Bee.
- **Two-leg auth (non-negotiable):** user↔relay = OAuth; relay↔Bee = encrypted token custody.
- **Custody model (key finding):** the Bee token rides inside `@cloudflare/workers-oauth-provider`'s already-encrypted per-grant props — no separate envelope store for Tier 1; revocation = disconnect. This is the exact pattern git-auth's own B1 roadmap charts. KMS-layered encryption + the Tier-0 gate are the Tier 2 hardening; the hosted honeypot is the one item that can't reach git-auth parity until Bee ships minting.
- **Phase 1 is a guided PORT of git-repo-auth**, not a greenfield build. See `docs/implementation-handoff.md` for the file-by-file borrow map.

## 4. The next action (precise)

1. **Operator (parallel, only you can):** run the private-CA reachability check from a non-proxied environment — `openssl s_client` against Bee's real API host, inspect the cert issuer. Public CA → the Bee-client slice un-gates; private/self-signed → we need Workers VPC/mTLS or revert to a network-path decision.
2. **Crew (in execution, spine):** ground the port — mint a read-only token (Git Repo Auth), clone `klappy/git-repo-auth-mcp`, read source (scrub after); then scaffold (`index.ts`/`state.ts`/`wrangler.jsonc`/deps, drop octokit + Stripe vars), wire user↔relay OAuth (`workers-oauth-provider`), register the `whoami` tool shape via `McpAgent`, stand up the Tier-1 deploy skeleton + honest README.
3. **Crew (Bee-client slice, gated on step 1):** deployer-key secret intake + the Bee fetch client over `/v1/me`; never serialize the Bee request in errors.
4. Validate at the wire, phone-only, three passes, fresh context. Crew pushes branches; operator opens PRs.

## 5. Map of this repo

- `PRD.md` — authoritative spec (lane-root, per D0015). **Start here after this file.**
- `docs/implementation-handoff.md` — the git-auth → bee-ai-auth-mcp borrow map + ship-process learnings.
- `odd/ledger/2026-06-14-planning.md` — the DOLCHEO encoding journal for the planning session.
- `planning/` — the exploration corpus (terrain map, prior-art journal, 6B borrow-eval, Omi-vs-Bee challenge). Provenance; the PRD consolidates their conclusions.
- Full session detail (verbatim) lives in the operator's transcripts (`bee-mcp-exploration-planning`, `bee-mcp-omi-planning`), not in this repo.

## 6. Parallel tracks (don't serialize)

- **A** — adopt/verify Omi (confirm its hosted MCP registers as a claude.ai custom connector on web + iOS).
- **B** — Product B, the Refinery (device-agnostic encode layer) — separate exploration, not plan-ready.
- **C** — Tier-0 petition (field-wide: ask Bee/Omi/Limitless for OAuth + short-lived minted tokens).
- **D** — publish sanitized prior art (raw 2026-06-12 transcripts carry PII — sanitize before any public share).
