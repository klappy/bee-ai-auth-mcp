---
uri: klappy://docs/products/bee-ai-auth-mcp/PRD
title: "PRD: bee-ai-auth-mcp — A Self-Host-First Credential Relay + Retrieval Wire for the Bee Pendant"
audience: docs
exposure: nav
tier: 3
voice: neutral
stability: draft
tags: ["docs", "prd", "bee-ai-auth-mcp", "mcp", "auth", "credential-relay", "cloudflare-workers"]
date: 2026-06-16
---

# 📋 PRD: bee-ai-auth-mcp

*(working name during planning: `bee-mcp`; the canonical name is now `bee-ai-auth-mcp` everywhere — D0015 resolved 2026-06-15.)*

> A hosted, MIT, self-host-first MCP credential relay that exposes a Bee pendant's retrieval API to any MCP client (Claude, Cursor, other agents) across every surface — built on a per-grant encrypted-custody core that runs single-tenant today and is multi-tenant-capable by config.

**This PRD is a DRAFT pending the operator's author pass.** Nothing here commits until reviewed. Drafted by the first officer from session decisions; v0.3 folds in the 2026-06-15 session (private-CA resolution, the custody amendment, and the verified `workers-oauth-provider` crypto). v0.4 folds in the bound-container resolution (D0028, E0014): the bridge is a Cloudflare Container bound to the Worker, reached by an internal `getContainer().fetch()` call — no public ACME cert, no `BEE_API_BASE` URL — and the custody rule is extended to state the bridge is token-agnostic shared infrastructure.

**v0.5:** appends the Phase 2 section (Read-Only Retrieval + Laptop-Free Token Acquisition) at the end of this document. All Phase 1 content above is unchanged.

---

## PRD Identity

| Field | Value |
|-------|-------|
| **PRD Version** | v0.5 (Phase 2: Read-Only Retrieval + Laptop-Free Token Acquisition, 2026-06-16) |
| **Status** | Draft — Phase 1 wire validated (E0019); Phase 2 (read-only retrieval + laptop-free acquisition) specced, gated on the Phase-2 6B + Bee-API-usage doc; Phase 3 open |
| **Created** | 2026-06-14 |
| **Author** | Klappy (operator) — review pending |
| **Preview Deploy Required** | Yes (hosted Worker; online-evidence requirement applies) |

---

## Objective

Give any MCP client read access to a Bee pendant's captured conversations on every surface — via a thin, hosted, self-host-first credential relay — without anyone pasting a long-lived secret into a naive store. The server is client-agnostic by protocol; Claude is the primary surface and first validation target (claude.ai web, iOS, iPadOS, Cowork — no laptop).

---

## The Custody Amendment (v0.3) — Read This First

**Prior locked decision (superseded):** Phase 1 = "Model A," the deployer's Bee token as the Worker's own `BEE_API_TOKEN` secret (one shared secret, no per-user custody).

**Amended decision (ratified 2026-06-15):** Phase 1 is built on the **per-grant encrypted-custody** model from the start — each user's Bee token is captured at OAuth consent and held only inside *their* `@cloudflare/workers-oauth-provider` grant props, encrypted, decrypted in-Worker per request, never stored in plaintext. **Tenancy is governed solely by the GitHub allow-list**, which stays at **one login (`klappy`)**. So Phase 1 ships *Tier-2 architecture at Tier-1 tenancy*: multi-tenant-capable, single-tenant in fact.

**Why the amendment (recorded per `klappy://canon/principles/contract-governs-handoff-drift`):**
1. It removes the only Model-A → Tier-2 rework seam (where `bee.ts` reads the token from: `env` vs. decrypted grant).
2. It is a *better at-rest posture even solo* — the token is encrypted at rest, not a permanent plaintext Worker secret.
3. "Going multi-tenant" later becomes a deliberate config flip (widen the allow-list) + honest docs, not a rebuild.

**What the amendment does NOT do:** it does not open the multi-tenant door. The irreversible step — accepting a *third party's* token — happens only when the allow-list is widened. That decision remains deferred and operator-owned.

**Bridge custody rule (v0.4, per E0014):** the Bee bearer is **not** infrastructure config. The bridge is **token-agnostic shared infrastructure** — each request carries its own user's bearer in the `Authorization` header, passed through unchanged, **never injected by the bridge, never logged**. There is no `BEE_API_TOKEN` Worker secret and no token baked into the container. This is the rule the public site copy must reflect.

---

## Success Criteria

- [ ] The **user↔relay** leg authenticates by OAuth (claude.ai custom connector), never by pasting a token into the connector.
- [ ] The **relay↔Bee** credential is held in per-grant encrypted props, per-user isolated, decrypted only in-Worker at request time, never logged, never exposed to the model/client.
- [ ] The GitHub allow-list gates tenancy and is set to exactly one login; the instance denies all other logins.
- [ ] `whoami` returns the operator's Bee identity over `/v1/me`, demonstrated on a **mobile** surface over the connector (phone-only, three-pass, fresh-context wire check).
- [ ] The Worker→Bee leg traverses the bound Container bridge (see Approach) because Bee uses a private CA; the bridge passes each request's own bearer through and no secret appears in bridge logs.
- [ ] Published MIT, open-source, with sanitized prior art (no PII).
- [ ] Deployed preview reachable; closure carries independent fresh-context validation per release-validation-gate.

---

## Vodka Boundary Enumeration (per P0006)

**What this server KNOWS:** how to run the user↔relay OAuth flow; the one GitHub login allowed; how to hold a Bee bearer in encrypted per-grant props and attach it to an outbound `/v1/*` call; how to reach Bee through the private-CA bridge; the shape of `GET /v1/me`.

**What this server does NOT know:** the contents of Bee conversations (it is a pass-through, not a store of Bee data); Bee's response schemas beyond what is verified against the live API; any other user's anything (single tenant); how to mint or refresh a Bee token (Bee has no OAuth).

**What this server is NOT:** not a Bee-data store or cache; not a normalization/refinery layer (that is Product B); not a push/streaming wire (that is Product C); not the operator's long-term personal wire (that is Omi); not a multi-tenant service today (the allow-list is one login); not a guarantor against live-process compromise (see Risks — the in-flight plaintext window is irreducible for any forwarding relay).

---

## Non-Goals (Anti-Scope)

- **Not** the operator's long-term personal wire — that is **Omi** (adopted off-the-shelf). This is the reusable substrate, the Bee-community artifact, and interim use of the operator's existing Bee.
- **Not** multi-tenant in Phase 1 — the architecture is capable; the allow-list keeps it single-tenant. Opening it is a deliberate, deferred, operator-owned decision.
- **Not** Product C (push/SSE→AMS streaming) — future phase, same auth core.
- **Not** Product B (the Refinery / encode layer) — separate, device-agnostic build.
- **Not** Tier 3 (naive paste-and-store) — rejected.
- **Not** write/mutation tools in Phase 1–2 — read-only by default.

---

## Background

The only stage of the capture→retrieve pipeline that hurts today is **transport**: the operator hand-relays Bee content into his AI tools (the operator-as-relay anti-pattern; `klappy://canon/principles/agents-need-their-own-wire`). Bee's official MCP is local-stdio only, so it never reaches mobile/web — the all-surface constraint is the whole problem. Because the fix is an MCP server, the wire is **client-agnostic by protocol** — Claude is where the pain is felt first, but any MCP client consumes the same relay.

A session challenge established that **Omi already ships a hosted, all-surface MCP off the shelf**, so for the operator's *personal* long-term need the wire is adopted, not built. This project survives that challenge as (1) the **reusable credential-relay substrate**; (2) the **interim wire** for the operator's existing Bee; (3) the **MIT community artifact** for Bee owners.

---

## Approach

One thin **auth core** + a **pull/MCP retrieval egress**, on Cloudflare Workers, plus a **private-CA bridge**. Borrow the protocol/transport/OAuth plumbing; build only the Bee-specific glue.

- **Borrow:** `@modelcontextprotocol/sdk`, `agents` (`McpAgent`), `@cloudflare/workers-oauth-provider` (verified: per-grant token-wrapped prop encryption — see Risks), the in-house git-repo-auth pattern + shared bearer-token middleware.
- **Bend:** relay from GitHub-token-*minting* → Bee-credential-*holding* (token captured at consent into encrypted grant props); Bee client reaches Bee through the bridge.
- **Build (minimal):** auth core + pull egress + the bridge. Transport/framing/OAuth are borrowed, not handrolled.

**The private-CA bridge (network path, resolved 2026-06-15; wiring refined by D0028/E0014).** Bee's direct API uses a **private CA** (Bee docs, 2026-06-07: "the Bee API uses a private CA (not a public CA)"; `bee-cli/sources/certs.ts` ships the roots). A stock Cloudflare Worker `fetch` trusts only public CAs; Workers VPC + Origin-CA trusts public + Cloudflare Origin CA only; the mTLS Workers binding presents a *client* cert (wrong direction). None trusts Bee's third-party server CA. Per the operator ruling "must run on CF infra, no multi-host split," the path is a **bound Cloudflare Container** — a Durable Object class `BeeBridge` (`defaultPort = 8080`) running a single static caddy with `bee-ca.pem` in its trust pool. The Worker reaches it by an **internal `getContainer(env.BEE_BRIDGE).fetch(...)` call, not a public URL** — so there is **no `BEE_API_BASE` and no public ACME cert**. The container serves plain HTTP on `:8080` for the internal Worker↔container leg and re-originates TLS to Bee, trusting the private CA (`tls_server_name $BEE_SNI`, upstream `$BEE_UPSTREAM`). **The only TLS hop is container→Bee; the Worker↔container leg is internal to Cloudflare.** This requires the Workers **Paid** plan (confirmed). `src/bee.ts` calls the container stub; there is no base-URL variable.

**Bridge hardening (empty toolbox).** `scratch`/distroless image, single static caddy binary, no shell / package manager / debugger / second process, read-only root FS, all Linux capabilities dropped, non-root, image pinned by digest; caddy never logs the `Authorization` header. This eliminates the accidental-log / planted-tool / second-process class. The irreducible residual (the token is plaintext in caddy's memory in flight) is inherent to any forwarding relay and is bounded by minimal surface, not by crypto.

---

## Phases

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| **Phase 1 — Auth core + bridge** | Workers scaffold; user↔relay OAuth; **per-grant encrypted custody** (Bee token captured at consent into grant props); GitHub allow-list at one login; the **private-CA Container bridge**; one validation tool (`whoami` via `/v1/me`); Tier-1 self-host deploy path | Deployed Worker + bridge where the operator authorizes, supplies their Bee token at consent, and `whoami` returns their Bee identity on a mobile surface over the connector |
| **Phase 2 — Retrieval egress** | Read-only MCP tools over `/v1/conversations` (confirmed). `/v1/changes` and `/v1/search/conversations` (BM25 + `/neural`) are **now documented** (Bee docs 2026-06-07) but **not yet confirmed against the live API** → confirm-or-drop before any tool surface is frozen. Async-by-default for long calls; paginated, size-capped, summary-vs-full results; partial-data-with-transparency for scans. Docs-first: author the Bee-API-usage doc, then a `docs` tool + the retrieval tools fulfill it | Bee retrieval usable from claude.ai across surfaces |
| **Phase 3 — Multi-tenant hardening (deferred, operator-gated)** | Widen the allow-list; honest multi-user security + revocation/rotation UX; quota/telemetry. Custody mechanism is already in place from Phase 1; this phase is the *tenancy* decision + UX, not a re-architecture | Hosted multi-tenant option live, opened deliberately |
| **Later (out of this PRD)** | Product C (push→AMS), Product B (Refinery) | — |

---

## Definition of Done (Phase 1)

Per `klappy://canon/definition-of-done` + `klappy://docs/appendices/online-evidence`:

- [ ] Deployed preview reachable online; evidence viewable without running code locally.
- [ ] Live proof that OAuth completes, the Bee token is captured into encrypted grant props, and `whoami` returns the Bee account over the connector on a **mobile** surface (phone-only, three-pass, fresh-context).
- [ ] The Container bridge is deployed bound to the Worker (DO class `BeeBridge`, reached via `getContainer(env.BEE_BRIDGE)`), hardened to the empty-toolbox spec, with no `BEE_API_BASE` URL; a manual check confirms no token in bridge logs.
- [ ] GitHub allow-list set to one login; a second login is denied (demonstrated, not asserted).
- [ ] Load-bearing surface (auth core, custody, Bee client, bridge) passes **independent fresh-context validation** before any prod promotion — same-session smoke does not count.
- [ ] No secret in logs, URLs, errors, or client-visible output — neither the Bee token nor the relay token, in Worker `observability` or the bridge. (Audit what `observability: enabled` captures.)
- [ ] `LICENSE` (MIT) present; README + security doc + public site updated **against the built artifact** to describe the per-grant custody model and the honest residual.
- [ ] Completion report + self-audit attached; release-validation-gate observed at merge.

---

## Constraints

- **Contract-governs-handoff-drift** — the Model-A → per-grant-custody change is a recorded amendment (this PRD + ledger E0012), not a silent drift.
- **Borrow-evaluation-before-implementation** — the 6B is in the planning corpus; `Build = minimal`; `workers-oauth-provider` crypto inspected at 0.7.2 (adopted).
- **Release-validation-gate** — no merge with review in progress; independent fresh-context validation of load-bearing surface.
- **Two-leg auth** — user↔relay = OAuth (always); relay↔Bee = per-grant encrypted custody. Non-negotiable.
- **Honest + safest (binding)** — *safest:* neither the Bee bearer nor the relay token ever appears in logs, URLs, error payloads, or client-visible output; error paths never serialize the request/headers or raw upstream body. *honest:* no security property is claimed that the system does not deliver — in particular, the in-flight/live-process residual is stated plainly, not papered over.
- **Relay-token hygiene (new, load-bearing)** — because the relay token is the key that unwraps the Bee token, it must never be logged anywhere a KV reader could also reach.
- **Revocation honesty** — disconnect deletes the relay's copy; full revocation = the user rotates the bearer at Bee, with a helper link. No short-lived-token claim (Bee has none).
- **Maintainability-one-person** — the bridge is a single shared stateless container; no per-user infrastructure.
- **Pre-publish sanitization gate** — raw 2026-06-12 transcripts (PII) get a sensitivity pass before any public share.

---

## Risks

- **Custody verified, residual named.** `@cloudflare/workers-oauth-provider` 0.7.2 was read at source (`dist/oauth-provider.js`): props are AES-GCM-encrypted with a fresh random key per encryption; that key is wrapped (AES-KW) with `HMAC-SHA256(public-constant, relay-token)`; at rest = ciphertext + token-wrapped key; decryption needs the request's token. Consequences: **no master/KMS key**, **per-user isolation** (A's token can't unwrap B's), **a KV-dump alone is useless**. The fixed all-zero IV is safe only because keys are single-use. **Residual:** a forwarding relay must hold the token in plaintext in memory in-flight (Worker and bridge); a live-process compromise reads it. No at-rest scheme removes this — it is mitigated by minimal surface (empty-toolbox bridge, lean deps), not crypto. The honeypot-at-rest is genuinely defused; "guaranteed secure" is not claimed.
- **Rejected alternatives (recorded).** Encrypting with the user's GitHub primitives (no server-side decryptability / re-conflates identity & custody) and adding a Worker-secret defense-in-depth (narrow value, covered by token-logging hygiene, costs custom crypto) were both evaluated and rejected. See ledger E0012 D0023/D0024.
- **No Bee OAuth (Tier-0 blocked).** Bee mints no short-lived tokens, so every user (incl. the operator) supplies a long-lived bearer. This is the ceiling on the security posture; the only thing that removes the in-flight residual *and* the bridge entirely is Bee offering a public-cert / minted-token endpoint. Parallel ask; vendor-dependent.
- **Bee API drift.** Bee is Amazon-owned (acq. 2025); schemas may change. Thin client; confirm against live API; don't fabricate.
- **Moot-for-operator.** Omi may fully cover the operator's personal need, leaving this valuable only as substrate + community. *Accepted* — declared scope.

---

## Notes

**Irreversibility read:** building the per-grant custody architecture is reversible/low-risk while the allow-list stays at one login (the instance holds only the operator's own token). The one genuinely sticky element is **widening the allow-list to accept third parties' tokens** — entered knowingly, deferred, operator-owned. The bridge and connector are additive; removing them reverts to today's copy-paste.

**Relationship to other tracks:** Omi = adopted long-term wire (Track A). This PRD = the substrate + interim wire. Tier-0/public-cert ask = field-wide (Track C-adjacent). Refinery (Product B) and push→AMS (Product C) = separate. Publish prior art = behind sanitization (Track D).

**Decision trail:** `odd/ledger/2026-06-15-session-close-bridge-wiring-handoff.md` (E0014: bound-container wiring D0028, token-agnostic bridge rule — the basis for v0.4). `odd/ledger/2026-06-15-bee-leg-private-ca-and-multitenancy.md` (E0012: gate resolution, bridge decision, crypto verification, custody amendment, rejections). Prior: `odd/ledger/2026-06-14-*` (validation, planning, deploy-connect). Build contract: `docs/phase-1-build-handoff.md`.

---

## Attempt Policy

**This PRD may be attempted multiple times.** Do not extend a failed attempt; start a new attempt. Each attempt is evaluated independently. Failed attempts inform future attempts or PRD revisions (E0010: failures go to the debrief and become canon).

---

## Phase 2 — Read-Only Retrieval Surface + Laptop-Free Token Acquisition (v0.5)

**Objective**  
Deliver a remote, read-only MCP connector that gives any MCP client (Claude, Cursor, etc.) access to a Bee pendant’s conversations and related entities across every surface with **zero client-side install**, while maintaining the minimal relay surface and read-only-by-default posture established in Phase 1.

**Locked Decisions**  
- Per-user containers running the Bee CLI + local MCP are rejected (see `klappy://canon/constraints/borrow-evaluation-before-implementation` and Phase 1 D0022).  
- Read-only-by-default is deliberate and load-bearing (git-auth parity matrix).  
- A Bee Skill is the wrong layer for a remote connector (`RESUME.md` §4.3). The remote-native equivalent is the docs tool + rich descriptions.  
- Token *use* is already laptop-free and mobile-validated (E0019). Token *acquisition* remains the open gap.  
- All implementation in Phase 2 must satisfy the borrow-evaluation gate.

**Phase 2 Scope (docs-first, minimal)**

### 2.1 Author Bee-API-usage Document (docs-first)
Author a project-owned `Bee-API-usage` document sourced from Bee’s proxy and skill documentation plus live endpoint enumeration. This document becomes the single source of truth.

### 2.2 `bee_docs` Tool
Implement a `bee_docs` tool following the `git-repo-auth-mcp` pattern. The tool serves the project-authored `Bee-API-usage` document (not raw vendor pages).

### 2.3 Read/Write Passthrough Tools (method-split, vodka-thin)
Rather than one tool per endpoint, the read/write surface is two method-keyed passthrough tools over the documented `/v1/*` API — full parity with zero per-endpoint coupling, so a Bee API change cannot break the tool surface.

- **`bee_read`** (this phase) — forwards a caller-supplied `/v1/*` path to Bee through the bridge using **GET only**. No method parameter, no request body; the read-only guarantee is structural — the tool can only issue read primitives (like git's read side). It reaches the entire read surface, and `bee_docs` supplies the path/param knowledge.
- **`bee_write`** (deferred to the write phase) — the same passthrough shape, restricted to the write primitives (`POST` / `PUT` / `PATCH` / `DELETE`). Specced here; not built or exposed in the read phase.

`bee_read` response handling: async-by-default for long calls, paginated and size-capped, summary-vs-full where the upstream supports it. The SSE `/v1/stream` endpoint stays out of the synchronous passthrough, handled separately if/when needed. There is no endpoint allow-list to freeze — an unknown path simply returns the upstream's own status.
### 2.4 Laptop-Free Token Acquisition (QR Pairing Caller)
The relay itself becomes the Bee app-pairing caller:  
- Consent page renders a QR code.  
- User approves in the Bee app.  
- Relay polls, decrypts (tweetnacl box), and binds the token into the user’s encrypted per-grant props.  
- **Blocker**: Requires a Bee-registered `app_id`.  
  - Preferred path: Obtain an official `app_id` from Bee (sharpens the Tier-0 petition).  
  - Demo path (private-proof-only): Borrow the CLI’s public `app_id` — never the shipped public path.

**Gates**  
- **Phase-2 6B borrow-evaluation** must be completed and accepted before any implementation of 2.1–2.3 (`klappy://canon/constraints/borrow-evaluation-before-implementation`).  
- **Release-validation-gate** applies to all code and load-bearing surface changes (fresh-context, different-context validation — not same-session smoke).

**Success Criteria (Phase 2)**  
- `Bee-API-usage` document authored and accepted.  
- Phase-2 6B table completed and accepted.  
- `bee_docs` tool + the `bee_read` GET passthrough live and validated on mobile (three-pass, fresh context).  
- QR pairing flow either unblocked via official `app_id` or clearly documented with next action.  
- Magical first run under 60 seconds on the `app_id` pairing path; not claimed for the pasted-token interim (where the user supplies a bearer manually)
- All changes delivered via feature branch + operator-authored PR.

**Out of Scope (Phase 2)**  
- Activating `bee_write` / any mutating calls — the write tool is specced in §2.3 but built in the write phase, not this one  
- Multi-tenant hardening (Tier 2)  
- Push/SSE streaming (Product C)  
- Refinery / encode layer (Product B)  
- Per-user containers or forking the Bee Skill

**Open Items**  
- Bee `app_id` registration (vendor-dependent)  
- Document the known endpoints (`/v1/me`, `/v1/conversations`, `/v1/search/conversations`, `/v1/changes`) in the Bee-API-usage doc — the passthrough reaches any path at runtime, so no tool-surface freeze is required
- Optional canon proposal to explicitly cover architecture assertions under `klappy://canon/principles/code-claims-require-code-observation`

**Relationship to Previous Versions**  
This section elaborates the Phase 2 row of the Phases table above with the v0.5 design. Phase 1 (auth core + private-CA bridge + per-grant custody) remains unchanged and is considered complete.

---

