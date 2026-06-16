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

*(working name during planning: bee-mcp ; the canonical name is now bee-ai-auth-mcp everywhere.)*

> A hosted, MIT, self-host-first MCP credential relay that exposes a Bee pendant's retrieval API to any MCP client (Claude, Cursor, other agents) across every surface — built on a per-grant encrypted-custody core that runs single-tenant today and is multi-tenant-capable by config.

**This PRD is now at v0.5.** Phase 2 (Read-Only Retrieval + Laptop-Free Acquisition) has been added. Phase 1 remains complete and unchanged.

---

## PRD Identity

| Field | Value |
|-------|-------|
| **PRD Version** | **v0.5** (Phase 2: Read-Only Retrieval + Laptop-Free Token Acquisition) |
| **Status** | Planning — gated on Phase-2 6B and Bee-API-usage doc |
| **Created** | 2026-06-14 |
| **Updated** | 2026-06-16 |
| **Author** | Klappy (operator) + First Officer consolidation |

---

## Objective

Give any MCP client read access to a Bee pendant's captured conversations on every surface — via a thin, hosted, self-host-first credential relay — without anyone pasting a long-lived secret into a naive store. The server is client-agnostic by protocol; Claude is the primary surface.

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

### 2.3 Scoped Read-Only Retrieval Tools
Implement retrieval tools **only** for confirmed read endpoints. `/v1/conversations` is already confirmed (Bee public docs) and is the primary conversation retrieval surface; `/v1/changes` and `/v1/search/conversations` are unconfirmed and subject to live enumeration (confirm-or-drop) before they are added.  
- No write/mutation endpoints are exposed.  
- Async, pagination, and summary modes are supported where the upstream provides them.  
- Confirm-or-drop discipline is enforced before any tool surface is frozen.

### 2.4 Laptop-Free Token Acquisition (QR Pairing Caller)
The relay itself becomes the Bee app-pairing caller:  
- Consent page renders a QR code.  
- User approves in the Bee app.  
- Relay polls, decrypts (tweetnacl box), and binds the token into the user’s encrypted per-grant props.  
- **Blocker**: Requires a Bee-registered `app_id`.  
  - Preferred path: Obtain an official `app_id` from Bee (sharpens the Tier-0 petition).  
  - Demo path (private-proof-only): Borrow the CLI’s public `app_id` — never the shipped public path.

**Gates**  
- **Phase-2 6B borrow-evaluation** must be completed and accepted before any implementation of 2.1–2.4 (`klappy://canon/constraints/borrow-evaluation-before-implementation`).  
- **Release-validation-gate** applies to all code and load-bearing surface changes (fresh-context, different-context validation — not same-session smoke).

**Success Criteria (Phase 2)**  
- `Bee-API-usage` document authored and accepted.  
- Phase-2 6B table completed and accepted.  
- `bee_docs` tool + scoped read-only retrieval tools live and validated on mobile (three-pass, fresh context).  
- QR pairing flow either unblocked via official `app_id` or clearly documented with next action.  
- Magical first run under 60 seconds where applicable.  
- All changes delivered via feature branch + operator-authored PR.

**Out of Scope (Phase 2)**  
- Write/mutation tools  
- Multi-tenant hardening (Tier 2)  
- Push/SSE streaming (Product C)  
- Refinery / encode layer (Product B)  
- Per-user containers or forking the Bee Skill

**Open Items**  
- Bee `app_id` registration (vendor-dependent)  
- Live-API enumeration of `/v1/changes` + `/v1/search/conversations`  
- Optional canon proposal to explicitly cover architecture assertions under `klappy://canon/principles/code-claims-require-code-observation`

**Relationship to Previous Versions**  
This section supersedes the Phase 2 placeholder in v0.4. Phase 1 (auth core + private-CA bridge + per-grant custody) remains unchanged and is considered complete.

---

## Previous Phases (unchanged)

### Phase 1 — Auth core + bridge (v0.4)
[Existing Phase 1 content remains here unchanged]

---

## Constraints (updated for v0.5)

- **Contract-governs-handoff-drift** — the Model-A → per-grant-custody change is a recorded amendment.  
- **Borrow-evaluation-before-implementation** — the 6B is required before Phase 2 implementation.  
- **Release-validation-gate** — applies to all code changes.  
- **Two-leg auth** — user↔relay = OAuth; relay↔Bee = per-grant encrypted custody.  
- **Read-only-by-default** — deliberate for Phase 2.  
- **Docs-first** — author `Bee-API-usage` doc before building the `bee_docs` tool.

---

## Definition of Done (updated)

Phase 2 DoD is defined in the Success Criteria section above. Phase 1 DoD remains satisfied.
