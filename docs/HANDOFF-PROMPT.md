> **Historical Phase-1 artifact (point-in-time).** Superseded by current state in `RESUME.md` / `PRD.md` v0.5. Phase 2 (`bee_docs` + `bee_read`, read-only) shipped — see `odd/ledger/2026-06-16-phase2-read-surface-built-and-merged.md` (E0020). Kept for the record; do not read as current state.

# Fresh-Session Build Prompt (copy-paste)

> Paste the block below into a fresh session to build the Phase-1 Bee leg. It is deliberately thin: the substance lives in the repo, and the fresh session reads it from there (`klappy://canon/methods/fresh-session-over-context-carry`).

---

You're the first officer continuing **bee-ai-auth-mcp**, under the boarding-pass contract.
First turn: fetch `klappy://canon/bootstrap/model-operating-contract` via oddkit and treat it as binding; run `oddkit_time` first each turn; search canon before asking.

Repo: `klappy/bee-ai-auth-mcp`. Access via the **Git Repo Auth** MCP (`github_token`) — read-only to read, `{"contents":"write"}` scoped to the repo to push. Crew pushes branches; the operator opens PRs.

**Read these from the repo, in order, before building:** `RESUME.md` → `PRD.md` (v0.3) → `docs/phase-1-build-handoff.md` → `odd/ledger/2026-06-15-bee-leg-private-ca-and-multitenancy.md` (E0012). They are the contract; do not work from this prompt's summary where they disagree.

**DONE — don't redo:** auth core live + phone-validated at `bee.klappy.dev` (E0011); GitHub OAuth identity gate; `ALLOWED_GITHUB_LOGIN=klappy`; MCP connect works; Worker deployed as `bee-ai-auth-mcp`; spine + CI on `main`. Network path resolved: Bee uses a **private CA** (E0012). Custody crypto verified: `workers-oauth-provider` 0.7.2 is per-grant token-wrapped, no master key.

**OBJECTIVE (Phase-1 Bee leg, single-tenant):** make `whoami` return the operator's Bee identity, built on the ratified custody amendment.
1. **Bridge:** build + deploy a single shared, stateless, **empty-toolbox** Cloudflare Container running caddy that trusts `bee-ca.pem` and forwards `/v1/*` to Bee (public cert facing the Worker). `scratch`/distroless, no shell, read-only FS, caps dropped, non-root, digest-pinned; **never log `Authorization`**. Point `BEE_API_BASE` at the bridge. The bridge's own fetch to `/v1/me` is the definitive private-CA reachability check.
2. **Custody:** bend `bee-auth.ts` to capture the Bee token at OAuth consent into **encrypted grant props** (validate via `/v1/me`). `bee.ts` / `whoami` read the token from the decrypted grant — **not** `env.BEE_API_TOKEN`. (Supersedes the old Model-A Worker-secret lock — recorded amendment, see E0012.)
3. **Tenancy:** keep `ALLOWED_GITHUB_LOGIN=klappy`. No multi-tenant UX — that door is deferred and operator-owned.

**VALIDATE (phone-only):** reconnect the connector in Claude (it caches tool schemas at connect time), run `whoami`, confirm it returns the Bee identity; confirm a second GitHub login is denied; confirm no token in Worker `observability` or bridge logs. That green = Phase-1 DoD.

**THEN:** sharpen `README.md` / the security doc / the `public/` site **against the built artifact** (per `code-claims-require-code-observation`) — per-grant custody model + the honest in-flight residual. Propose a canon epoch note if warranted.

**Constraints:** honest + safest — neither the Bee token nor the relay token in any log/URL/error/output (the relay token unwraps the Bee token; treat it as a key). Validation needs a fresh context (not same-session). Don't force `fetch` past the bridge. Confirm `/v1/*` schemas against the live API; don't fabricate.

**Open forks (don't bank):** multi-tenant go/no-go (widen the allow-list — the one-way door); Bee public-cert/Tier-0 ask (removes the bridge + residual); drop-GitHub-for-single-tenant; Phase-2 `/v1/changes` + `/v1/search/conversations` live confirm-or-drop.
