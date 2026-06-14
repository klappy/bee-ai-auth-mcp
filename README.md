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
