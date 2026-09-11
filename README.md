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

## Connecting — device-aware pairing at consent

Adding this relay as a custom connector walks you through GitHub sign-in and then a consent screen that pairs directly with your Bee. The screen adapts to the device it renders on:

- **On a phone**, the primary action is a tap-to-approve deep link, **"Open in the Bee app"** — a phone can't usefully scan its own screen — with the QR still available, collapsed behind an "Or scan a QR code" toggle.
- **On desktop**, the QR stays primary, with a fallback link below it for the case where you're reading this screen on a computer but approving from your phone.

Either way: approve in the Bee app, and the relay receives your token encrypted to a single-use key it minted for that page view, validates it through the bridge, and seals it into your encrypted grant. No CLI install, no keychain spelunking, no copy/paste required. Both variants also show a copyable **connect URL** for manual entry into the Bee app's "Enter Bee ID" field, and the raw-token paste box remains further below as the ultimate fallback.

Two things worth knowing:

- **The approval presents as the Bee CLI.** The relay performs the CLI's own pairing handshake server-side, borrowing the CLI's registered `app_id` — fine for a personal self-host, and the honest label for what's actually happening. A relay-registered app id is the gate for any public/multi-tenant deployment (rationale and protocol facts in `src/pairing.ts`).
- **Nothing secret rides in the QR or connect URL.** Both encode only `https://bee.computer/connect#<requestId>`; the token comes back NaCl-boxed to an ephemeral key that never exists at rest anywhere — the consent page carries it between polls only as AES-GCM ciphertext, and the parser accepts the pairing service's completed response whether it puts that token at the top level or nested under `result.encryptedToken`.

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
5. **Deploy through the reviewed branch flow** — feature branches merge into `main` for isolated staging. Production promotion is a separately approved PR from `main` to `production`. See [Source and deployment environments](#source-and-deployment-environments) for the exact commands and configuration gate; routine staging builds reuse the existing Container image.
6. Add the Worker URL as a custom connector in your MCP client, approve the GitHub login, then **paste your Bee token at the consent screen** and run `whoami` (or `bee_docs` / `bee_read`).

**Getting your Bee token.** In the Bee iOS app, unlock Developer Mode (tap the app Version 5x); then on a computer with Node run `npm i -g @beeai/cli && bee login --qr` and approve the scan in your Bee app. Read the token from the macOS Keychain (`security find-generic-password -s bee-cli -a token:prod -w`) or `~/.bee/token-prod`, and paste it at the relay's consent screen. A one-tap in-app QR pairing is planned (pending a Bee-registered app id). See `docs/connecting-and-getting-your-bee-token.md`.

**Security model (honest).** Your Bee token is held only in your encrypted grant props (workers-oauth-provider, token-derived key — no master key); it never appears in logs, URLs, errors, or tool output. **Revocation:** disconnecting deletes the relay's copy of your token; to fully revoke, re-pair / rotate it in the Bee app.

**Tools.** `whoami` (credential smoke check, `GET /v1/me`), plus the Phase-2 read surface: `bee_docs` (serves the Bee API usage reference) and `bee_read` (read-only — GET any `/v1/*`, POST only to the allow-listed `/v1/search/*`; `/v1/stream` and all mutations refused). `bee_write` is deferred to a future write phase. Fewer tools, good docs by design.

## Source and deployment environments

OAuth client authentication negotiation uses a pinned maintained provider.
See [the compatibility repair and migration evidence](docs/oauth-negotiation-repair-2026-09-10.md)
for supported public-client alternatives, synthetic checks and remaining hosted gates.

The staging code includes a [default-disabled monthly allowance](docs/monthly-allowance.md).
It does not activate self-service, choose an allowance, or add billing/referrals.
When separately configured, each successful `bee_read` page consumes one unit;
`bee_usage` reports the account's allowance and exact renewal time without a Bee call.
Exhaustion preserves the OAuth connection. Existing manual signup policy remains
in force while the feature is disabled.

Feature branches merge into `main`, which is staging. Reviewed staging source is
promoted by a separately approved PR from `main` to `production`. A separate
staging branch is only needed if a distinct dev environment is introduced later.

The root `wrangler.jsonc` targets the isolated staging Worker. Trusted main Builds
run `node scripts/deploy-staging.cjs` after install, source-ID generation,
typechecking and tests; `npm run deploy:staging` invokes the same deployment path.
It preserves the existing deployment metadata, storage, secrets and runtime limit.

Production's branch-only Builds command explicitly selects
`wrangler.production.jsonc`. Production promotion still requires its own approval.
See [the deployment contract](docs/ci-cd.md)
for exact commands, validation and the production-release gate.

## Owner-only staging calibration

Optional `OWNER_USAGE_ENABLED=true` observes only the authenticated login matching the trusted `STAGING_OWNER_EMAIL`, with `SIGNUP_ENABLED=true`. All staging calls bypass legacy Analytics Engine identity derivation and emission, even when observation is off. Production retains its existing optional AE behavior.

The existing per-tool wrapper measures `bee_read`, `bee_docs` and `whoami`. One existing BeeBridge Durable Object stores daily fixed-schema counts and summed duration, bridge duration and output bytes. Returned successful read pages, read failures, runtime/quota blocks, docs, identity checks and thrown errors have distinct buckets. No identity, hash, transcript, raw path, query, token or per-call record is stored. The private RPC rechecks owner matching. Emission failures never change the original tool result or thrown error.

Owner-only `bee_observed_usage` reads the aggregate without calling Bee, starting the Container, consuming a commercial read or counting itself. It accepts no identity filters. Every permitted read/write consumes the existing lifetime signup-operation budget, which is never reset. At exhaustion observation is unavailable while Bee results remain unchanged. At most 31 UTC dates are retained, pruned on reads/writes; idle timed deletion is not promised.

This is best-effort calibration, not a billing ledger. Coverage begins only after separately reviewed activation and actual hosted readback; enqueueing work with `waitUntil` is not persistence proof. Heavy owner usage is a useful upper-use observation, not a representative free-user distribution. No numeric allowance, self-service activation, production change or new telemetry service is selected here.


### Existing native catalog compatibility

`bee_docs({ view: "observed_usage" })` exposes the same owner-only aggregate inspection when a client has not refreshed its tool catalog. It uses the authenticated grant identity and the same private RPC, reports the same coverage and retention caveats, and never counts itself or starts Bee. Nonowners and disabled observation receive unavailable without an aggregate or observation write. Unknown views reject. Missing `view` or `view: "reference"` returns the byte-identical canonical API reference with ordinary documentation observation. The standalone `bee_observed_usage` tool remains available to eligible owners in refreshed catalogs.
