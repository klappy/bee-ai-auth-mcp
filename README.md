# bee-ai-auth-mcp

> Self-host-first, OAuth-secured MCP server that brings your Bee AI pendant's conversations to any MCP client — Claude, Cursor, and other agents, on every surface. Your Bee token is captured when you connect and held only in your own encrypted grant. Read-only by default. MIT.

**Status: PHASE 2 — read surface merged + fresh-context validated (E0021), accept-with-named-residuals (self-host). Phase 1 live & mobile-validated.** The full path runs end-to-end on Cloudflare Workers and is validated on mobile: GitHub identity gate -> your Bee token captured at a consent step into encrypted per-grant props -> a private-CA Container bridge -> Bee `GET /v1/me`. The `whoami` tool returns your Bee identity over the live connector; **Phase 2 adds the read surface — `bee_docs` + `bee_read` (read-only retrieval) — now merged to `main` and fresh-context validated (E0021), with operator-only residuals remaining.** There is **no `BEE_API_TOKEN` Worker secret** — each user's token lives only in their own encrypted grant. Write tools (`bee_write`) and a hosted multi-tenant option (Phase 3) come later. `RESUME.md` is the fresh-context entry point; `PRD.md` (v0.5, draft) is the spec.

## Start here

1. **`RESUME.md`** — fresh-context entry point. Read it first; it bootstraps the operating contract and states the current state.
2. **`PRD.md`** — the authoritative requirements (v0.5, draft).
3. **`docs/connecting-and-getting-your-bee-token.md`** — how a user obtains the Bee token and connects.
4. **`docs/implementation-handoff.md`** — how Phase 1 ports the proven sibling `klappy/git-repo-auth-mcp`.
5. **`odd/ledger/`** — the DOLCHEO encoding journal.
6. **`planning/`** — the exploration corpus behind the decisions.

## What it is

A thin Cloudflare Worker: `@cloudflare/workers-oauth-provider` handles the user<->relay OAuth leg; your Bee credential is captured at consent and held in encrypted per-grant props (no shared Worker secret), used read-only against Bee's `/v1/*` API through a bound private-CA Container bridge; `@modelcontextprotocol/sdk` + `agents` expose tools reachable by any MCP client (Claude, Cursor, other agents) on every surface. Ships self-host-first (Tier 1); a hardened hosted posture (Tier 2) is deferred. Built to the security and validation bar of its sibling, `git-repo-auth`.

## Connecting — QR pairing at consent

Adding this relay as a custom connector walks you through GitHub sign-in and then a consent screen. That screen pairs directly with your Bee: it shows a QR (and a tappable link if you're already on your phone) — scan, approve in the Bee app, and the relay receives your token encrypted to a single-use key it minted for that page view, validates it through the bridge, and seals it into your encrypted grant. No CLI install, no keychain spelunking, no copy/paste. The paste box remains right below as the fallback.

Two things worth knowing:

- **The approval presents as the Bee CLI.** The relay performs the CLI's own pairing handshake server-side, borrowing the CLI's registered `app_id` — fine for a personal self-host, and the honest label for what's actually happening. A relay-registered app id is the gate for any public/multi-tenant deployment (rationale and protocol facts in `src/pairing.ts`).
- **Nothing secret rides in the QR.** The code encodes only `https://bee.computer/connect#<requestId>`; the token comes back NaCl-boxed to an ephemeral key that never exists at rest anywhere — the consent page carries it between polls only as AES-GCM ciphertext.

## License

MIT. See `LICENSE`.

*Working name during planning was `bee-mcp`; renamed to `bee-ai-auth-mcp`. Some internal docs may still reference the old name — same project.*

---

## Build & deploy — Phase 1 (self-host)

**Status:** Phase 1 live and wire-validated — `whoami` returns the operator's Bee identity end-to-end through the bridge, on a phone. Phase 2 read surface (`bee_docs` + `bee_read`) merged to `main`; runtime phone validation pending.

**Two-leg auth.** *You <-> relay* is OAuth (GitHub, identity only — gates who may use your instance via an allow-list). *Relay <-> Bee* uses **your Bee token, captured at a consent step when you connect and held only in your own encrypted OAuth grant props** — there is no `BEE_API_TOKEN` Worker secret, and this instance custodies no one else's credential. The architecture is multi-tenant-capable; the allow-list keeps it single-tenant.

**The private-CA bridge.** Bee's direct API uses a private CA a stock Worker `fetch` can't trust. The relay reaches Bee through a **Cloudflare Container bound to the Worker** (`BEE_BRIDGE`) running caddy, which trusts `bridge/bee-ca.pem` and re-originates TLS to Bee. The Worker->container hop is internal (no public hostname or cert); only the container->Bee hop is TLS. Requires the Workers **Paid** plan.

**Setup**
1. `git clone https://github.com/klappy/bee-ai-auth-mcp && cd bee-ai-auth-mcp && npm install`
2. Create the grant store: `wrangler kv namespace create OAUTH_KV` -> paste the id into `wrangler.jsonc` under the `OAUTH_KV` binding.
3. Create a GitHub **OAuth App** (not a GitHub App): callback `https://<your-worker>/callback`. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` as Worker secrets.
4. In `wrangler.jsonc` set `ALLOWED_GITHUB_LOGIN` to your GitHub login (the instance denies all logins until set). `BEE_UPSTREAM`/`BEE_SNI` (Bee's real API host), the `BEE_BRIDGE` Container, and `bridge/bee-ca.pem` (Bee's public CA roots) are already committed.
5. **Deploy by pushing** — a push to `main` deploys to prod via Cloudflare Workers Builds (which also builds the bridge container image); a branch push is a preview. No manual `wrangler deploy`.
6. Add the Worker URL as a custom connector in your MCP client, approve the GitHub login, then **paste your Bee token at the consent screen** and run `whoami` (or `bee_docs` / `bee_read`).

**Getting your Bee token.** In the Bee iOS app, unlock Developer Mode (tap the app Version 5x); then on a computer with Node run `npm i -g @beeai/cli && bee login --qr` and approve the scan in your Bee app. Read the token from the macOS Keychain (`security find-generic-password -s bee-cli -a token:prod -w`) or `~/.bee/token-prod`, and paste it at the relay's consent screen. A one-tap in-app QR pairing is planned (pending a Bee-registered app id). See `docs/connecting-and-getting-your-bee-token.md`.

**Security model (honest).** Your Bee token is held only in your encrypted grant props (workers-oauth-provider, token-derived key — no master key); it never appears in logs, URLs, errors, or tool output. **Revocation:** disconnecting deletes the relay's copy of your token; to fully revoke, re-pair / rotate it in the Bee app.

**Tools.** `whoami` (credential smoke check, `GET /v1/me`), plus the Phase-2 read surface: `bee_docs` (serves the Bee API usage reference) and `bee_read` (read-only — GET any `/v1/*`, POST only to the allow-listed `/v1/search/*`; `/v1/stream` and all mutations refused). `bee_write` is deferred to a future write phase. Fewer tools, good docs by design.
