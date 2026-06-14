---
uri: klappy://docs/products/bee-mcp/PRD
title: "PRD: bee-ai-auth-mcp — A Self-Host-First Credential Relay + Retrieval Wire for the Bee Pendant"
audience: docs
exposure: nav
tier: 3
voice: neutral
stability: draft
tags: ["docs", "prd", "bee-mcp", "mcp", "auth", "credential-relay", "cloudflare-workers"]
date: 2026-06-14
---

# 📋 PRD: bee-ai-auth-mcp

*(working name during planning: `bee-mcp`. Canonical URI rename is a D0015 call — left to the operator.)*

> A hosted, MIT, self-host-first MCP credential relay that exposes a Bee pendant's retrieval API to any MCP client (Claude, Cursor, other agents) across every surface — hardened toward git-repo-auth parity as far as Bee's API allows.

**This PRD is a DRAFT pending the operator's author pass.** Nothing here commits until reviewed. Drafted by the first officer from session decisions (2026-06-14); consolidates the terrain map, prior-art journal, 6B planning doc, and the Omi challenge into one authoritative spec.

---

## PRD Identity

| Field | Value |
|-------|-------|
| **PRD Version** | v0.2 (post-validation 2026-06-14) |
| **Status** | Draft — Phase 1 (Model A / Tier 1) **gated to execution: spine** 2026-06-14; Bee-client slice + Phases 2–3 open |
| **Created** | 2026-06-14 |
| **Author** | Klappy (operator) — review pending |
| **Preview Deploy Required** | Yes (hosted Worker; online-evidence requirement applies) |

---

## Objective

Give any MCP client read access to a Bee pendant's captured conversations on every surface — via a thin, hosted, self-host-first credential relay — without the operator ever pasting a long-lived secret into a naive store. The server is client-agnostic by protocol; Claude is the primary surface and first validation target (claude.ai web, iOS, iPadOS, Cowork, no laptop).

---

## Success Criteria

- [ ] Magical-first-run (<60s) is the bar for the **hosted/OAuth tier**; the Phase-1 **self-host** posture trades sub-60s for zero custody, by design — not a Phase-1 gate (per the 6B; Tier 0 restores it later).
- [ ] The **user↔relay** leg authenticates by OAuth (claude.ai custom-connector), never by pasting a token into the connector.
- [ ] The **relay↔Bee** credential is held server-side, envelope-encrypted, per-user isolated; never logged, never exposed to the model/client.
- [ ] Retrieval tools work over **confirmed** Bee `/v1/*` endpoints (`/me`, `/conversations`, read-only by default). `/search/conversations` and `/changes` are **not present in Bee's public docs** → Phase-2 confirm-or-drop against the live API before any tool surface is frozen.
- [ ] Ships in **both** postures: Tier 1 (self-host, deploy-your-own Worker) and Tier 2 (hosted multi-tenant, hardened toward git-repo-auth parity).
- [ ] Published MIT, open-source, with sanitized prior art (no PII).
- [ ] Deployed preview reachable; closure carries independent fresh-context validation per release-validation-gate.

---

## Non-Goals (Anti-Scope)

- **Not** the operator's long-term personal wire — that is **Omi** (adopted off-the-shelf). bee-mcp is the reusable substrate, the Bee-community artifact, and interim use of the operator's existing Bee.
- **Not** Product C (push/SSE→AMS streaming) — future phase, same auth core.
- **Not** Product B (the Refinery / encode layer) — separate, device-agnostic build.
- **Not** Tier 3 (naive paste-and-store) — rejected.
- **Not** Tier 2 scaling beyond early adopters before the Tier 0 petition lands (custody risk).
- **Not** heavy normalization — any normalization is thin and project-keyed, behind the core.
- **Not** write/mutation tools in Phase 1–2 — read-only by default.

---

## Background

The only stage of the capture→retrieve pipeline that hurts today is **transport**: the operator hand-relays Bee content into his AI tools (Claude today) (the operator-as-relay anti-pattern; `klappy://canon/principles/agents-need-their-own-wire`). Bee's official MCP is local-stdio only, so it never reaches mobile/web — the all-surface constraint is the whole problem. And because the fix is an MCP server, the wire is **client-agnostic by protocol** — Claude is where the operator feels the pain first, but Cursor and any other MCP client consume the same relay (the sibling `git-repo-auth` is consumed the same way; *We Were the Wire*: "no opinion above transport").

A session challenge established that **Omi already ships a hosted, all-surface MCP off the shelf**, so for the operator's *personal* need the wire is adopted, not built. bee-mcp survives that challenge as three things that remain valuable regardless: (1) the **reusable credential-relay substrate** the operator already settled to build (`klappy://docs/explorations/credential-relay-as-product`: "build reusable regardless; self-host-first avoids custody; MIT the on-ramp, not the moat"); (2) the **interim wire** for the operator's existing Bee while Omi ships; (3) the **MIT community artifact** for Bee owners. This PRD scopes exactly that.

---

## Approach

One thin **auth core** + a **pull/MCP retrieval egress**, on Cloudflare Workers. Borrow the protocol/transport/OAuth plumbing; build only the Bee-specific glue. Two-leg auth: OAuth on user↔relay, encrypted custody on relay↔Bee. Ship Tier 1 (self-host) and Tier 2 (hosted, hardened) from one codebase. Full 6B borrow evaluation is in the companion planning doc (`2026-06-14-bee-mcp-planning-6b.md`); summary verdict:

- **Borrow:** `@modelcontextprotocol/sdk`, `@cloudflare/agents` (`McpAgent`), `@cloudflare/workers-oauth-provider`, in-house git-repo-auth pattern + shared bearer-token middleware.
- **Bend:** relay from GitHub-token-minting → Bee-credential-holding; Bee client to trust Bee's private CA.
- **Build (minimal):** auth core + pull egress only. Transport/framing/OAuth are borrowed, not handrolled.

---

## Phases

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| **Phase 1 — Auth core** | Workers scaffold; user↔relay OAuth; **Model A: deployer-key self-host** — the deployer's Bee token is the Worker's own secret (NOT per-user custody; that is Tier 2); private-CA-aware Bee client **gated on the reachability tripwire** (below); one validation tool (`whoami` via `/v1/me`); Tier 1 self-host deploy path | Deployed Worker where the deployer sets their Bee token as a secret and a `whoami` tool confirms the credential works on mobile over the connector |
| **Phase 2 — Retrieval egress** | Read-only MCP tools over `/v1/conversations` (confirmed); **`/v1/search/conversations` and `/v1/changes` are unconfirmed in Bee's docs — confirm-or-drop against the live API first**; async-by-default for any long call; **paginated, size-capped, summary-vs-full** results (no raw transcript dumps that flood context); partial-data-with-transparency for scans | Bee retrieval usable from claude.ai across surfaces |
| **Phase 3 — Tier 2 hardening** | Hosted multi-tenant posture to git-repo-auth parity: KMS-backed envelope keys, per-user isolation, rotation/revocation, quota/telemetry; early-adopter-bounded | Hosted option live, custody hardened, scaling gated on Tier 0 |
| **Later (out of this PRD)** | Product C (push→AMS), Product B (Refinery) | — |

---

## Definition of Done

Per `klappy://canon/definition-of-done` + `klappy://docs/appendices/online-evidence`:

- [ ] Deployed preview reachable online; evidence viewable without running code locally.
- [ ] Phase 1: live smoke proof that OAuth completes, a token is stored encrypted, and `whoami` returns the Bee account over the connector on a **mobile** surface (the all-surface claim, demonstrated not asserted).
- [ ] Load-bearing surface (auth core, credential store) passes **independent fresh-context validation** (separate agent/context — not same-session, not smoke alone) before any prod promotion.
- [ ] No automated reviewer left in-progress at merge; findings dispositioned or waived in the PR with reasons.
- [ ] `LICENSE` (MIT) present; README documents the Tier 1 self-host path and the two-leg auth model.
- [ ] No secret in logs, URLs, or client-visible output; verified.
- [ ] Completion report + self-audit attached.

---

## Constraints

Each MUST-rule and how this PRD satisfies it:

- **Borrow-evaluation-before-implementation** — satisfied: the 6B table exists in the planning doc; `Build = minimal`.
- **Release-validation-gate** — satisfied by the DoD: no merge with review in progress; independent fresh-context validation of load-bearing surface; canon outranks any handoff that says skip.
- **Two-leg auth rule** — user↔relay = OAuth (always); relay↔Bee = encrypted custody. Non-negotiable.
- **Magical-first-run** (`klappy://canon/principles/magical-first-run`) — the <60s bar is a success criterion; the deploy-button + clear docs are the surface to polish.
- **Async-by-default** (`klappy://canon/principles/async-by-default-for-long-running-tools`) — Phase 2 retrieval tools return identifiers / never block; partial-data-with-transparency for scans.
- **Maintainability-one-person** — Tier 2 custody scaling gated on the Tier 0 petition; until then Tier 2 stays a small, hardened, eyes-open custody.
- **Pre-publish sanitization gate** — the raw 2026-06-12 transcripts (PII: home address, personal/business mix) get a sensitivity pass before any public share; publish the sanitized journal only.
- **Honest + safest (binding, all tiers)** — *safest:* the Bee bearer never appears in logs, URLs, error payloads, or client-visible output; error paths never serialize the Bee request/headers or raw upstream response. *honest:* no security property is claimed that the system does not deliver (revocation wording, the parity matrix, first-run copy).
- **Revocation honesty** — disconnect deletes the relay's copy of the token; full revocation = the user rotates the bearer at Bee, and a helper links there. The borrowed git-auth "revocable by you" wording is not imported unchanged.

---

## Risks

- **Custody honeypot (Tier 2 only).** **Tier 1 / Model A holds no third-party tokens** — the only secret is the deployer's own Bee key as a Worker secret. The honeypot is a **Tier-2-only** risk: hosted bee-mcp would store others' long-lived Bee tokens (no minting primitive). Note: `workers-oauth-provider` encrypts grant props with the secret token as key material, so a storage-only leak reveals only metadata — the residual exposure is **runtime/live-token compromise** (see the error-payload constraint), not a KV dump. The matrix's encryption is **per-grant token-derived, not KMS** — state it as such. *Mitigation:* keep Phase 1 = Tier 1; gate any Tier-2 scaling on Tier 0.
- **Private-CA reachability (Phase-1 critical-path tripwire).** Bee's docs require a private CA for the direct API, and **standard Workers `fetch` trusts only publicly-trusted CAs** (verified) — so this is a Break, not a one-line bend. Trusting a private CA outbound needs Workers VPC (Origin-CA), container HTTPS-interception, or BYO mTLS. *Mitigation:* the Bee-client slice is gated on a reachability check from a non-proxied environment (the sandbox egress proxy masks the origin cert); if unreachable by those paths, REVERT to a planning micro-decision on the network path.
- **Bee API drift.** Bee is Amazon-owned (acq. July 2025); the API and privacy posture may change, and exact `/v1/*` response schemas are unconfirmed from docs. *Mitigation:* thin client; confirm schemas against live API in Phase 1; don't fabricate.
- **No Bee OAuth (Tier 0 blocked).** Best-tier security depends on Bee shipping minted tokens. *Mitigation:* the precise petition; bee-mcp adoption as demand evidence.
- **Moot-for-operator.** Omi may fully cover the operator's personal need, leaving bee-mcp valuable only as substrate + community. *Accepted* — that is the declared scope.

---

## Notes

**Irreversibility / reversibility read (for the gate):**
- Forward = **low** — the connector is additive; removing it reverts to today's copy-paste.
- Backward = **medium** — the auth-core substrate is reusable (MIT) even if Bee is abandoned; migrating users off a hosted Tier 2 would be a connector swap.
- The one genuinely sticky element is **Tier 2 custody** (holding others' long-lived Bee tokens) — entered knowingly, bounded by the Tier-0 gate. Everything else is cheaply reversible.

**Relationship to other tracks:** Omi = adopted wire (Track A). bee-mcp = this PRD. Tier 0 petition = field-wide ask (Track C). Refinery (Product B) = separate device-agnostic exploration (Track B). Publish prior art = behind sanitization (Track D).

**Device-agnostic future:** the auth-core substrate could later front other pendants (incl. Omi or a future Bee hosted MCP); not in scope now, but the design should not hard-couple to Bee specifics beyond the client layer.

**Implementation grounding (added 2026-06-14):** A read of the `git-repo-auth-mcp` repo + its ledger produced a companion build map — `bee-mcp-implementation-handoff.md`. Two findings touch this PRD: (1) **Phase 1 is largely a port, not a greenfield build** — `index.ts`/`state.ts` borrow near-verbatim; only `types.ts` (GrantProps), `mcp-api.ts` (tools), and the auth handler bend. (2) **Phase 1 ships as Model A (deployer-key self-host):** the deployer's Bee token is the Worker's own secret — no per-user custody, no central store. Per-user custody (the encrypted-grant-props pattern, which is per-grant **token-derived** encryption, not KMS) is **Tier 2**, and its honeypot is gated on Tier 0. The DoD adopts git-auth's proven three-pass, fresh-context, wire-level validation (runnable from phone — no laptop).

**Post-validation amendments (v0.2, 2026-06-14):** This PRD was taken through fresh-context validation, a frame-level challenge, prior-art research, and the planning→execution gate. Full trail: `odd/ledger/2026-06-14-validation.md` (findings), `odd/ledger/2026-06-14-session-validation-to-execution.md` (session journal), `docs/phase-1-execution-handoff.md` (the locked Phase-1 execution contract). Net changes folded above: Phase 1 = Model A self-host (not per-user custody); `/search/conversations` + `/changes` flagged unconfirmed (confirm-or-drop in Phase 2); private-CA reachability is a verified Phase-1 tripwire; `honest`+`safest` and revocation-honesty are binding constraints; the Tier-2 honeypot framing corrected to match the 6B matrix; `<60s` scoped to the hosted/OAuth tier. Open for the operator: the Tier-2 cut/keep decision (reframed — CF abstracts the upstream leg only when the upstream has OAuth, so the custody gap *is* the Tier-0 ask) and the canonical-URI rename (D0015).

---

## Attempt Policy

**This PRD may be attempted multiple times.**

- Do not extend a failed attempt; start a new attempt folder.
- Each attempt is evaluated independently against this PRD.
- Failed attempts inform future attempts or PRD revisions (E0010: failures go to the debrief and become canon).
- Attempts are sealed when CLOSED or ABANDONED.
