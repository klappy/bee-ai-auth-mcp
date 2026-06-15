# Phase 1 — Build Handoff (fresh-session contract)

**Date:** 2026-06-15 · **Mode:** planning → execution (build) · **Scope:** Phase 1 — auth core + per-grant custody + private-CA bridge + `whoami`, single-tenant.

> Read this from the repo, not from a prior session's memory (`klappy://canon/methods/fresh-session-over-context-carry`, `klappy://canon/principles/code-claims-require-code-observation`). It is the build contract. Authoritative spec: `PRD.md` (v0.3). Decision trail: `odd/ledger/2026-06-15-bee-leg-private-ca-and-multitenancy.md` (E0012). Borrow map: `docs/implementation-handoff.md`. This file locks the build steps, DoD, and constraints so the planning→execution gate reads them.

---

## 0. Board first

Operate under the captain (Klappy) and the binding contract in canon. **First substantive turn:** fetch `klappy://canon/bootstrap/model-operating-contract` and treat it as binding; run `oddkit_time` first each turn; search canon before asking. You are first officer; judgment is yours, procedures are fetched live. Reference impl to port from: `klappy/git-repo-auth-mcp` (mint a read-only `github_token`, clone, scrub the credential, read `src/` + `.github/workflows/`).

## 1. What is already true (do not redo)

- **Live at `bee.klappy.dev`:** multi-page site + logo, `/healthz`, `/mcp` (401 unauth), the OAuth surface, GitHub identity gate, MCP connect validated end-to-end on a phone (E0011). Worker deployed as `bee-mcp`. Secrets set: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. `ALLOWED_GITHUB_LOGIN=klappy`.
- **Network path resolved (E0012):** Bee uses a **private CA** (conclusive, Bee docs 2026-06-07 + `bee-cli/sources/certs.ts`). Stock Worker `fetch` / Workers VPC+Origin-CA / mTLS binding all cannot trust it. Path = a **single shared, stateless Cloudflare Container** running caddy that trusts `bee-ca.pem` and is fronted to the Worker with a public cert.
- **Crypto verified (E0012):** `@cloudflare/workers-oauth-provider` 0.7.2 encrypts grant props with a per-encryption random AES-GCM key wrapped by `HMAC-SHA256(public-constant, relay-token)` — no master key, per-user isolated, KV-dump-alone useless. Custody rides on this; do not handroll.

## 2. Locked decisions (from E0012 + the v0.3 amendment)

1. **Custody = per-grant encrypted props, not a Worker secret.** Capture the Bee token at OAuth consent (`bee-auth.ts` bend) → validate via `GET /v1/me` → `completeAuthorization` binding the token into encrypted grant props. `src/bee.ts` reads the Bee token from the decrypted grant at request time, **not** from `env.BEE_API_TOKEN`. (This supersedes the old Model-A "Worker secret" lock — recorded amendment, not drift.)
2. **Tenancy = the allow-list, kept at one login.** `ALLOWED_GITHUB_LOGIN=klappy`. The instance denies all other logins. Multi-tenant is a later, deliberate config-widen — **not** in this build.
3. **Bridge = one shared, stateless, empty-toolbox Container (caddy).** `scratch`/distroless, single static caddy binary, no shell/pkg-mgr/debugger/second process, read-only root FS, all caps dropped, non-root, digest-pinned. caddy `reverse_proxy` to Bee's real host with `tls_trust_pool file bee-ca.pem` and the upstream `Host` set so Bee's cert validates. caddy **never logs `Authorization`**. `BEE_API_BASE` → the bridge hostname. `src/bee.ts` forwarding logic unchanged.
4. **One tool: `whoami`** over `GET /v1/me`.
5. **Rejected (do not add):** encrypting with the user's GitHub primitives; a Worker-secret defense-in-depth layer. (E0012 D0023/D0024.)

## 3. Build steps

1. **Bridge first** (it unblocks `whoami`): build the empty-toolbox caddy Container, deploy on CF, confirm it reaches Bee (the Container's own fetch is the definitive private-CA reachability check — it either reaches `/v1/me` or fails at TLS). Set `BEE_API_BASE` to the bridge; confirm no `Authorization` in bridge logs.
2. **Custody bend:** `bee-auth.ts` captures the Bee token at consent into encrypted grant props (validate via `/v1/me`). `src/bee.ts` / the `whoami` tool read the token from the decrypted grant, not `env`.
3. **Keep the allow-list at one login.** No multi-tenant UX.
4. **Wire-validate** (see DoD).
5. **Sharpen docs against the built artifact** (this is part of this build's DoD, deferred here on purpose per `code-claims-require-code-observation`): update `README.md`, the security doc, and the `public/` site to describe the per-grant custody model + the honest in-flight residual; propose a canon epoch note if warranted. Do **not** write these against the design — write them against what was built.

## 4. Definition of Done

The Phase-1 DoD in `PRD.md` is authoritative. In short: deployed + bridge hardened + `whoami` returns the operator's Bee identity on a **mobile** surface (phone-only, three-pass, fresh-context); allow-list denies a second login (demonstrated); no token in any log (audit `observability: enabled`); independent fresh-context validation of the load-bearing surface; docs/site sharpened against the artifact; release-validation-gate observed at merge.

## 5. Constraints (binding)

- **Honest + safest:** neither the Bee token nor the relay token in logs/URLs/errors/output, Worker or bridge. The relay token unwraps the Bee token — treat it as a key.
- **Validation requires a context break** — not same-session self-review.
- **Provenance:** crew pushes branches; the operator opens PRs. One-line config may be pushed direct with operator OK.
- **Borrow before build;** confirm `/v1/*` schemas against the live API; don't fabricate.

## 6. Open forks (operator-owned; do not bank)

- Multi-tenant go/no-go (widen the allow-list) — deferred; the one-way door.
- Bee public-cert / short-lived-token (Tier-0) ask — removes the bridge + the residual; vendor-dependent.
- Drop-GitHub-for-single-tenant (passphrase / CF Access) — carried from E0011.
- Canonical-URI rename `bee-mcp` → `bee-ai-auth-mcp` (D0015).
- Phase-2 `/v1/changes` + `/v1/search/conversations`: docs-confirmed (2026-06-07), live confirm-or-drop still owed.
