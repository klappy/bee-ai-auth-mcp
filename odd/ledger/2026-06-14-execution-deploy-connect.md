# 2026-06-14 — bee-ai-auth-mcp Execution Session: Deploy + GitHub Connect (E0011)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. This is the decision trail from the execution session that took the Phase-1 spine from "merged but not deployed" to a live, GitHub-authenticated MCP connect validated end-to-end on a phone. Working/deployed Worker name: `bee-mcp`. Decisions continue from D0015. Full verbatim detail in the operator's transcripts.

## Decisions

**[D0016] OAUTH_KV namespace created and bound.** Created Cloudflare KV namespace `bee-ai-auth-mcp-oauth` (`8f260f3c8ab6476dbea2b17926bf38bf`) and committed it to `wrangler.jsonc`, replacing the `REPLACE_WITH_YOUR_OAUTH_KV_ID` placeholder. This placeholder was the sole cause of the failing Workers Builds deploy (error 10042); the fix turned the deploy green.

**[D0017] Deploy command stays default.** Kept `npx wrangler deploy` as the Workers Builds deploy command. `docs/ci-cd.md` recommends injecting `COMMIT_SHA`, but the operator ruled that overkill for the live deploy; `/version` reporting the commit SHA is non-essential and was descoped. (The GitHub Actions `resolve-preview` job still expects it — out of scope for the live deploy and noted for later if CI parity matters.)

**[D0018] GitHub OAuth App as the single-tenant identity gate.** Chose a GitHub **OAuth App** (not a GitHub App) for operator identity. Callback `https://bee.klappy.dev/callback`; `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` set as Worker secrets; `ALLOWED_GITHUB_LOGIN=klappy` committed to `wrangler.jsonc` (a var, so it must live in the file to survive deploys — secrets persist independently).

**[D0019] Public site + logo shipped.** A multi-page static site (`/`, `/under-the-hood`, `/setup`, `/security`, `/roadmap`) on a shared `style.css`, plus a bee logo favicon set (`svg`, `ico`, 16/32/48/180/192/512, `site.webmanifest`, `og-image`). Live at `bee.klappy.dev`; clean sub-page URLs confirmed serving via Cloudflare Assets default html-handling. README "PLANNING / no code" status corrected to "Phase 1 deployed."

## Observations

**[O] The resumption briefing was stale.** PR #2 (`phase-1/ci-cd`) was already merged to `main`, so `main` was current and no re-merge (nor production-branch repoint) was needed — the branch was gone because it had merged.

**[O] The deploy failure was the KV placeholder, not "stale main."** The briefing diagnosed stale main; the live build log showed error 10042 on the `REPLACE_WITH_YOUR_OAUTH_KV_ID` placeholder. Reality outranked the briefing.

**[O] The connect 404 was GitHub's, from an unset `GITHUB_CLIENT_ID`.** Proven by a live `/authorize` probe: the redirect carried `client_id=undefined`, so GitHub 404'd. Setting the secret fixed it — the redirect now carries a real `Ov23li…` client id and the correct `redirect_uri=https://bee.klappy.dev/callback`.

## Learnings

**[L] Two distinct OAuth layers, easily conflated.** `@cloudflare/workers-oauth-provider` is the relay acting as an OAuth **server to MCP clients** — REQUIRED for any remote connector, and the layer that actually fronts and protects the Bee key (Claude only ever holds a relay-scoped token). The **GitHub IdP** is only the operator-identity check inside `/authorize` — OPTIONAL for single-tenant, replaceable by an operator passphrase or Cloudflare Access. GitHub earns its keep again at Tier-2 multi-tenant, where a real IdP is needed to tell many users apart.

## Opens

**[O-open · P2] Drop-GitHub-for-single-tenant.** Decide whether to replace the GitHub IdP with an operator passphrase or Cloudflare Access before any Tier-2 hardening. Deferred this session; GitHub kept because it was already built and minutes from working. Not banked.

## Milestone (Encode)

**[E0011] Phase-1 auth core validated end-to-end on a phone.** Deploy green; GitHub identity gate live; `klappy` allow-list enforced; a live MCP connect from Claude holding a relay-scoped token. Rationale this is the DoD: the three-pass phone-only OAuth dance is the Phase-1 definition of done for the secure front door (per E0010), and the connect exercises DCR → authorize → GitHub → callback → allow-list → token issuance against the real deployment. **The only remaining Phase-1 gap is the Bee leg**, gated on the private-CA reachability check (`BEE_API_BASE` unset; `whoami` unproven). See the next-session handoff.

## State at session end

- Live: `https://bee.klappy.dev` — site, OAuth surface, `/healthz`, `/mcp` (401 unauth), GitHub connect.
- `main` @ `f60ba52`. Worker deployed as `bee-mcp` (name mismatch with config `bee-ai-auth-mcp` — non-fatal, auto-overridden; rename is open fork D0015).
- Secrets set: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. Likely set: `BEE_API_TOKEN` (operator to confirm).
- Unset / gated: `BEE_API_BASE` (vars), and the Bee `whoami` call (private-CA tripwire, `docs/phase-1-execution-handoff.md` §4).
