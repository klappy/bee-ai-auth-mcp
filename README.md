# bee-ai-auth-mcp

> Self-host-first, OAuth-secured MCP server that brings your Bee AI pendant's conversations to any MCP client — Claude, Cursor, and other agents, on every surface. Encrypted per-user token custody, read-only by default. MIT.

**Status: PLANNING.** The spec is finalized (`PRD.md`, v0.1 DRAFT) and execution is gated on the operator's author pass. No product code has been written yet — this repo currently holds the plan, the build handoff, and the decision trail, bootstrapped for clean resumption across context.

## Start here

1. **`RESUME.md`** — fresh-context entry point. Read it first; it bootstraps the operating contract and states the current gate.
2. **`PRD.md`** — the authoritative requirements (lane-root).
3. **`docs/implementation-handoff.md`** — how Phase 1 ports the proven sibling `klappy/git-repo-auth-mcp`.
4. **`odd/ledger/`** — the DOLCHEO encoding journal.
5. **`planning/`** — the exploration corpus behind the decisions.

## What it will be

A thin Cloudflare Worker: `@cloudflare/workers-oauth-provider` handles the user↔relay OAuth leg; the user's Bee credential is held in encrypted per-grant props (self-host) and used read-only against Bee's `/v1/*` API; `@modelcontextprotocol/sdk` + `agents` expose retrieval tools that reach any MCP client (Claude, Cursor, other agents) on every surface. Ships in two postures — Tier 1 (self-host, no central custody) and Tier 2 (hosted, hardened). Built to the security and validation bar of its sibling, `git-repo-auth`.

## License

MIT. See `LICENSE`.

*Working name during planning was `bee-mcp`; renamed to `bee-ai-auth-mcp`. Some internal docs may still reference the old name — same project.*

---

## Build & deploy — Phase 1 (Model A, self-host)

**Status:** Phase-1 spine (auth core + `whoami`). The Bee-client call is gated on the private-CA reachability check — see `docs/phase-1-execution-handoff.md` §4.

**Two-leg auth.** *You ↔ relay* is OAuth (GitHub, identity only — gates who may use your instance). *Relay ↔ Bee* is **your own Bee token, held as a Worker secret** — Model A. This instance custodies no one else's credential. Per-user custody is Tier 2 (not in Phase 1).

**Setup**
1. `npm install`
2. Create the grant store: `wrangler kv namespace create OAUTH_KV` → paste the id into `wrangler.jsonc`.
3. Create a GitHub **OAuth App** (not a GitHub App): callback `https://<your-worker>/callback`. Then:
   - `wrangler secret put GITHUB_CLIENT_ID`
   - `wrangler secret put GITHUB_CLIENT_SECRET`
4. `wrangler secret put BEE_API_TOKEN` — your Bee bearer (from the Bee app).
5. In `wrangler.jsonc` set `ALLOWED_GITHUB_LOGIN` to your GitHub login (the instance denies all logins until set) and `BEE_API_BASE` to Bee's direct API base.
6. `npm run deploy`, then add the Worker URL as a custom connector in your MCP client and run the `whoami` tool.

**Security model (honest).** The Bee bearer never appears in logs, URLs, errors, or tool output. **Revocation:** disconnecting the connector ends the relay's access to *you*, but does **not** revoke the Bee token itself — to fully revoke, rotate the token in the Bee app and re-set the secret. Grant props are encrypted per-grant with the token as key material (workers-oauth-provider), so a storage-only leak reveals only metadata.

**Reachability caveat.** Bee's docs require a private CA for the direct API; standard Workers `fetch` trusts only public CAs. If `whoami` fails to reach Bee, the path is Workers VPC (Origin-CA) or mTLS — confirm Bee's real API cert from a non-proxied environment first.
