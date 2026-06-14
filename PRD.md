---
uri: klappy://docs/products/bee-mcp/PRD
title: "PRD: bee-mcp — A Self-Host-First Credential Relay + Retrieval Wire for the Bee Pendant"
audience: docs
exposure: nav
tier: 3
voice: neutral
stability: draft
tags: ["docs", "prd", "bee-mcp", "mcp", "auth", "credential-relay", "cloudflare-workers"]
date: 2026-06-14
---

# 📋 PRD: bee-mcp

> A hosted, MIT, self-host-first MCP credential relay that exposes a Bee pendant's retrieval API to any MCP client (Claude, Cursor, other agents) across every surface — hardened toward git-repo-auth parity as far as Bee's API allows.

**This PRD is a DRAFT pending the operator's author pass.** Nothing here commits until reviewed. Drafted by the first officer from session decisions (2026-06-14); consolidates the terrain map, prior-art journal, 6B planning doc, and the Omi challenge into one authoritative spec.

---

## PRD Identity

| Field | Value |
|-------|-------|
| **PRD Version** | v0.1 |
| **Status** | Draft (awaiting author pass) |
| **Created** | 2026-06-14 |
| **Author** | Klappy (operator) — review pending |
| **Preview Deploy Required** | Yes (hosted Worker; online-evidence requirement applies) |

---

## Objective

Give any MCP client read access to a Bee pendant's captured conversations on every surface — via a thin, hosted, self-host-first credential relay — without the operator ever pasting a long-lived secret into a naive store. The server is client-agnostic by protocol; Claude is the primary surface and first validation target (claude.ai web, iOS, iPadOS, Cowork, no laptop).

---

## Success Criteria

- [ ] A user adds the connector on claude.ai once and reaches useful Bee retrieval on mobile in under 60s (magical-first-run bar).
- [ ] The **user↔relay** leg authenticates by OAuth (claude.ai custom-connector), never by pasting a token into the connector.
- [ ] The **relay↔Bee** credential is held server-side, envelope-encrypted, per-user isolated; never logged, never exposed to the model/client.
- [ ] Retrieval tools work over Bee `/v1/*` (`/me`, `/conversations`, `/search/conversations`, `/changes`) with read-only-by-default scope.
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
| **Phase 1 — Auth core** | Workers scaffold; user↔relay OAuth; per-user envelope-encrypted Bee-token custody; private-CA-aware Bee client; one validation tool (`whoami` via `/v1/me`); Tier 1 self-host deploy path | Deployed Worker where a user authenticates, supplies a Bee token once (encrypted at rest), and a `whoami` tool confirms the credential works on mobile |
| **Phase 2 — Retrieval egress** | Read-only MCP tools over `/v1/conversations`, `/v1/search/conversations` (BM25 + neural), `/v1/changes`; async-by-default for any long call; partial-data-with-transparency for scans | Bee retrieval usable from claude.ai across surfaces |
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

---

## Risks

- **Custody honeypot (Tier 2).** Hosted bee-mcp must store long-lived Bee tokens (no minting primitive) — a honeypot git-repo-auth structurally is not. Mitigations (envelope encryption, isolation, rotation, narrow scope) shrink, don't eliminate. *Mitigation:* gate scaling on Tier 0; default users to Tier 1.
- **Private-CA fragility.** Bee uses a private CA; the client must inject Bee's cert. Cert rotation upstream can break the client. *Mitigation:* isolate cert handling; document; tripwire.
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

**Implementation grounding (added 2026-06-14):** A read of the `git-repo-auth-mcp` repo + its ledger produced a companion build map — `bee-mcp-implementation-handoff.md`. Two findings touch this PRD: (1) **Phase 1 is largely a port, not a greenfield build** — `index.ts`/`state.ts` borrow near-verbatim; only `types.ts` (GrantProps), `mcp-api.ts` (tools), and the auth handler bend. (2) **Custody is simpler than the security ladder assumed for Tier 1:** the Bee token rides inside `@cloudflare/workers-oauth-provider`'s already-encrypted per-grant props (revocation = disconnect), so no separate envelope store is needed for self-host — the same pattern git-auth's own B1 roadmap charts. KMS-layered encryption + the Tier-0 gate remain the Tier 2 hardening. The DoD should adopt git-auth's proven three-pass, fresh-context, wire-level validation (runnable from phone — no laptop).

---

## Attempt Policy

**This PRD may be attempted multiple times.**

- Do not extend a failed attempt; start a new attempt folder.
- Each attempt is evaluated independently against this PRD.
- Failed attempts inform future attempts or PRD revisions (E0010: failures go to the debrief and become canon).
- Attempts are sealed when CLOSED or ABANDONED.
