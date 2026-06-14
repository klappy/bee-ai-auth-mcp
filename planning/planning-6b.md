# Planning — bee-mcp Phase 1: 6B Borrow Evaluation (Product A)

**Date:** 2026-06-14
**Mode:** Planning (entered via gate PASS, exploration → planning, 2/2 prerequisites)
**Binding constraints reviewed:** `klappy://canon/constraints/borrow-evaluation-before-implementation`, `klappy://canon/constraints/release-validation-gate`
**Companions:** `2026-06-14-b-integration-terrain-map.md`, `2026-06-14-b-integration-prior-art-journal.md`
**Status:** Falsifiable. The operator can challenge any row; a failed row invalidates the evaluation.

> ⚠️ **BUILD PREMISE CONTESTED (2026-06-14).** A planning-mode challenge found that **Omi ships a hosted, all-surface MCP off the shelf** (open-source, e2e-encrypted, self-hostable, $89) — i.e. Product A may not need building. See `2026-06-14-challenge-and-device-omi-vs-bee.md`. This 6B and the Tier 1+2 service design stand **only if the operator stays on Bee**; otherwise Product A is retired in favor of adopting Omi's wire and building Product B (the Refinery) device-agnostic. Pending a cheap verify-check of Omi's connector on claude.ai.

---

## Implementation goal (one sentence)
Ship a hosted, multi-surface **remote MCP connector** that authenticates the user, holds their Bee credential server-side, and proxies Bee's `/v1/*` retrieval endpoints as MCP tools — reachable from claude.ai across iOS, iPadOS, macOS, chat, and Cowork. (Pull egress only; push/AMS egress is phase two off the same core.)

## Candidate upstream substrates (2-minute scan, not a survey)
- `@modelcontextprotocol/sdk` — MCP TS reference SDK (protocol authors): transport, framing, capability negotiation, lifecycle.
- `@cloudflare/agents` `McpAgent` — Workers-hosted remote MCP (constraint names it explicitly; org already deploys on Cloudflare).
- `@cloudflare/workers-oauth-provider` — OAuth surface for remote MCP on Workers.
- **In-house:** `git-repo-auth-mcp` (hosted token-relay twin) + shared bearer-token middleware (`klappy://odd/handoffs/2026-05-16-mcp-bearer-token-middleware`).
- **External reference:** `maplehilllabs`/`BurtTheCoder` `mcp-limitless` — CF Workers + OAuth + KV token storage for a pendant API. Same pattern, different device.
- Bee: `@beeai/cli` (reference client for `/v1/*` and the private-CA cert at `bee-cli/sources/certs.ts`). No separate official TS API client noted.
- Cloudflare KV / Durable Objects — per-user credential storage.

## The 6B table

| Step | Verdict | Justification |
|------|---------|---------------|
| **Borrow** | `applied` | `@modelcontextprotocol/sdk` for protocol transport/framing; `@cloudflare/agents` `McpAgent` for Workers-hosted remote MCP; `@cloudflare/workers-oauth-provider` for the OAuth surface; in-house `git-repo-auth-mcp` + shared bearer-token middleware (handoff 2026-05-16) for the credential relay. No JSON-RPC / transport / capability-negotiation handroll. |
| **Bend** | `applied` | Bend the git-repo-auth relay from GitHub-token *minting* to Bee-credential *holding*. Bend the Bee `/v1/*` client to trust Bee's **private CA** (cert from `bee-cli/sources/certs.ts`) — system trust stores are insufficient. |
| **Break** | `observed` | (1) Private CA → stock fetch/clients fail until the cert is injected. (2) Bee token issuance has **no documented OAuth authorization-code flow** (P9b) → relay likely needs a user-supplied `BEE_API_TOKEN` rather than minted OAuth, unlike git-repo-auth's clean GitHub OAuth. |
| **Beget** | `n/a` | No external party is positioned to build a hosted Bee relay for this stack; Bee themselves ship only the *local* MCP. The org carries it. |
| **Bide** | `inspected-and-rejected` (delivery) → `Build = minimal` | Bee's official MCP **inspected**: rejected *as the delivery mechanism* on criterion **foundational gap** — it is local-stdio only (HTTP pinned to `127.0.0.1`), so it does not reach claude.ai / iOS / Cowork, which is the operator's hard constraint. **Adopted as reference** for the tool surface. **Tripwire:** if Bee ships an official *hosted/remote* MCP, re-inspect and adopt (swap our relay out). |
| **Build** | `minimal` | Thin: **auth core** (user auth + per-user Bee credential in KV/DO + private-CA-aware Bee client) + **pull egress** (MCP tools mapping 1:1 to `/v1/search/conversations` [BM25 + neural], `/v1/conversations`, `/v1/me`, `/v1/changes`). Transport/OAuth/framing are all Borrowed. Push/AMS egress is **not** in this Build. |

**Reversibility:** forward = low (the connector is additive; removing it reverts to today's copy-paste). backward = medium (if Bee ships an official hosted MCP, migrating users to it is a connector-swap; data stays in Bee, so cost is low–medium).

---

## The credential leg — security ladder (supersedes the earlier paste-vs-OAuth framing)

git-repo-auth's security comes from GitHub's **App** model (short-lived, scoped, server-minted tokens — no long-lived user secret stored). Bee, per its docs, offers **no published third-party OAuth/app flow** — only `bee login` (gated by iOS Developer Mode) and a self-serve bearer token. So the relay can borrow git-auth's *shape* but not its *posture*. Paste-the-token is the **floor**, not the ceiling. The real ladder for the **relay↔Bee** leg, most to least secure:

- **Tier 0 — Bee OAuth (best; blocked on Bee).** User consents on Bee; relay gets scoped/refreshable tokens; nothing pasted. claude.ai connectors already support OAuth client id/secret. *Not available today.* Action: request from Bee + tripwire.
- **Tier 1 — BYO-deploy (best available today).** User deploys their own Worker instance; their Bee token is *their own* Cloudflare secret; the relay never holds it. No central honeypot; blast radius = one user. Matches `maplehilllabs/mcp-limitless`. Cost: not magical-first-run for non-technical users.
- **Tier 2 — hosted multi-tenant, hardened paste.** TLS-only intake, never logged, **envelope-encrypted at rest** (per-user keys in a KMS/Secrets Store — not plaintext KV), per-user isolation, easy rotation, narrowest Bee scope. Residual inherent risk: a central store of long-lived Bee tokens is a honeypot.
- **Tier 3 — naive paste-and-store.** The floor. Do not ship.

**Two-leg rule:** the **user↔relay** leg MUST be OAuth (the claude.ai custom-connector OAuth) regardless of tier — that secures the operator→relay connection independent of the Bee leg. The weak link is only relay↔Bee, and Tier 1 removes it from central control entirely.

**Operator's call (2026-06-14, decided):** ship **both Tier 1 and Tier 2** as the service — self-host is not sufficient on its own. Tier 2 (hosted) is hardened to **git-repo-auth parity as far as Bee allows** (see the parity matrix below). **Tier 3** rejected. **Tier 0** petitioned in parallel.

## Deferred (not phase 1)
- Push/SSE→AMS egress (Product C) — phase two, same auth core.
- Refinery / encode layer (Product B) — downstream, the durable-value layer.
- Normalization pass (P2) — likely thin, project-keyed; sits behind the core.
- ReMarkable / unified-workflow prior art (P8) — unsurveyed; deferred with the unified vision.

## Ship rules (release-validation-gate, bind at merge/promote — not now)
- No merge while an automated reviewer (e.g. Bugbot) is in progress; findings read + dispositioned or explicitly waived in the PR body.
- No prod promotion of load-bearing surface without **independent fresh-context** validation (different agent, different context — not same-session, not smoke).
- Canon outranks any session ledger/handoff that recommends skipping a step.

## Magical-first-run check (`klappy://canon/principles/magical-first-run`)
Phase-1 success = a non-technical operator adds the connector on claude.ai web once and reaches useful Bee retrieval in under 60s on any surface. Path (a) credential-paste is the friction to minimize; this is the bar Build is measured against.

---

## Distribution & Licensing (operator decision, 2026-06-14)

**Decision (updated 2026-06-14):** ship bee-mcp **MIT, open-source**, with **both Tier 1 (self-host) and Tier 2 (hosted multi-tenant)** as the service — self-host alone is not sufficient. Tier 1: each user runs their own Worker with their own Bee token as their own secret; the project never custodies it. Tier 2: hosted, hardened to git-repo-auth parity as far as Bee allows (see parity matrix). The community self-hosts and refines. Tier 3 rejected; Tier 0 (upstream minted tokens) is a **collective petition**. *(Supersedes the earlier "self-host-first, Tier 2 declined" lean — the operator will not settle for self-host-only.)*

**Canon alignment:** this matches the operator's own settled exploration `klappy://docs/explorations/credential-relay-as-product` (2026-06-09) — *build reusable regardless; self-host-first avoids custody (breach-one-lose-all collides with maintainability-one-person); MIT the on-ramp, not the moat; smallest test = publish the self-host template.* bee-mcp is the same pattern applied to a new upstream.

**License-split seam (watch this):** MIT the **relay/connector (A)** — the commodity keychain — freely. Do **not** reflexively MIT the **refinery (B)** — the encode/governance flight-deck layer, the differentiated asset. B's license folds into the deferred ODD license/strategy decision. *Open the wire; hold the moat's licensing.*

**Pre-publish sanitization gate (blocks the "share" step, not the build):** the terrain map and this journal contain no PII → publishable as the shared prior art. The raw 2026-06-12 brain-dump transcripts contain PII (a home address; personal/business mixing) → **must** pass a sensitivity pass before any public sharing (constraint C3). Publish the *sanitized* use cases, never the raw transcripts. (This is the refinery's job, run on its own origin material.)

**Tier 0 petition (collective, not a build):** file a public RFC/feature request to Bee for an OAuth authorization-code flow issuing short-lived, scoped, minted tokens for third-party relays; coordinate with the Limitless/Omi communities, who share the gap. bee-mcp adoption is the evidence of demand.

**Magical-first-run, reframed:** self-host trades sub-60s first-run for zero custody — an honest, deliberate trade. Tier 0 (upstream minting) is what restores magical-first-run later without reintroducing the honeypot. Until then, the deploy-button + clear docs are the first-run surface to polish.

---

## Where this leaves the plan
- Credential-tier fork: **resolved** (Tier 1 **and** Tier 2 both ship, MIT; Tier 2 hardened to git-repo-auth parity; Tier 3 rejected; Tier 0 petitioned).
- 6B borrow evaluation for A: **present** (§ above) — satisfies the borrow-evaluation gate's planning artifact.
- Remaining pre-**publish** step: the sanitization pass on source material.
- Remaining pre-**execution** step: operator's call to cross the planning → execution gate and scaffold the MIT self-host `bee-mcp` template repo (auth core + pull/MCP egress).

---

## git-repo-auth parity matrix (the target for Tier 2)

git-repo-auth's posture rests on the **GitHub App primitive**, grounded in its own getting-started doc: OAuth install consent, **GitHub enforces scope**, per-call **tokens that die within the hour**, a **one-click uninstall kill switch**, and the headline promise *"you never touch a credential."* Parity for bee-mcp Tier 2, dimension by dimension:

| Dimension | git-repo-auth | bee-mcp (Tier 2) | Parity |
|---|---|---|---|
| User↔service auth | GitHub App OAuth install | claude.ai custom-connector OAuth | **Full** |
| Encryption at rest / per-user isolation | platform-managed | envelope encryption, per-user DO/KV, KMS keys | **Full** |
| Least privilege (read-only default) | read-only token unless write asked | read-only **tool surface** by default | **Full (tool surface)** |
| Quota / telemetry transparency | tier/remaining/reset fields | same pattern | **Full** |
| Substrate | CF Workers + workers-oauth-provider | same | **Full** |
| Self-host option | (n/a) | Tier 1 deploy-button | **Exceeds** |
| Revocation / kill switch | one-click app uninstall | Bee-side token rotation + relay disconnect (a few clicks) | **Partial** |
| **"You never touch a credential"** | App install, no secret handled | **a Bee token must be supplied** (no App to install) | **Gap → Tier 0** |
| **Short-lived minted tokens** | die within the hour | Bee tokens are **long-lived**; relay can only mint short-lived *session* tokens for the user↔relay leg | **Gap → Tier 0** |
| **Upstream-enforced scope** | GitHub enforces | Bee scope = whatever Bee allows (likely all-or-nothing) | **Gap → Tier 0** |

**Reading:** parity is **full on six dimensions, partial on one, with three structural gaps** — and all three gaps trace to the same missing upstream primitive. They *are* the precise content of the Tier 0 petition.

### The honest custody tension
git-repo-auth is safe for one person to host **because it never stores a long-lived user credential** — it holds the App identity and mints ephemeral tokens; the user's secret is a revocable install. A hosted bee-mcp Tier 2 **must store long-lived Bee bearer tokens** (no minting primitive exists), making it a credential honeypot git-repo-auth structurally is not. So *hosted-custody* parity is unreachable until Tier 0, and standing up Tier 2 now takes on the exact liability git-repo-auth was built to avoid — colliding with `maintainability-one-person` and the operator's own open question (`credential-relay-as-product`): is hosting strangers' keys ever acceptable for a one-person system? Mitigations (envelope encryption, per-user isolation, KMS, short rotation, narrowest scope, read-only-by-default) **shrink but do not eliminate** the honeypot.

**Recommendation:** ship Tier 2 hardened, but **gate its scaling beyond early adopters on the Tier 0 petition landing.** Until then, run Tier 2 as a deliberately small, hardened, eyes-open custody.

### Tier 0 petition — now precise
Ask Bee for a **GitHub-App-equivalent**: OAuth install/consent + **scoped, short-lived, minted, revocable** tokens for third-party relays. bee-mcp's hardened Tier 2 and its adoption are the existence proof and the demand evidence. Coordinate the ask with the **Limitless and Omi** communities — identical gap, shared leverage.
