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

# PRD: bee-ai-auth-mcp

*(working name during planning: `bee-mcp`; the canonical name is now `bee-ai-auth-mcp` everywhere — D0015 resolved 2026-06-15.)*

> A hosted, MIT, self-host-first MCP credential relay that exposes a Bee pendant's retrieval API to any MCP client (Claude, Cursor, other agents) across every surface — built on a per-grant encrypted-custody core that runs single-tenant today and is multi-tenant-capable by config.

**PRD v0.5** — Phase 2 content appended. Phase 1 sections from v0.4 are fully restored and unchanged except for version/status updates.

---

## PRD Identity

| Field | Value |
|-------|-------|
| **PRD Version** | v0.5 (Phase 2: Read-Only Retrieval + Laptop-Free Token Acquisition) |
| **Status** | Planning — gated on Phase-2 6B and Bee-API-usage doc |
| **Created** | 2026-06-14 |
| **Updated** | 2026-06-16 |

---

## Objective

Give any MCP client read access to a Bee pendant's captured conversations on every surface — via a thin, hosted, self-host-first credential relay — without anyone pasting a long-lived secret into a naive store. The server is client-agnostic by protocol; Claude is the primary surface.

---

## The Custody Amendment (v0.3) — Read This First

**Prior locked decision (superseded):** Phase 1 = "Model A," the deployer's Bee token as the Worker's own `BEE_API_TOKEN` secret (one shared secret, no per-user custody).

**Amended decision (ratified 2026-06-15):** Phase 1 is built on the **per-grant encrypted-custody** model from the start — each user's Bee token is captured at OAuth consent and held only inside *their* `@cloudflare/workers-oauth-provider` grant props, encrypted, decrypted in-Worker per request, never stored in plaintext. **Tenancy is governed solely by the GitHub allow-list**, which stays at **one login (`klappy`)**. So Phase 1 ships *Tier-2 architecture at Tier-1 tenancy*: multi-tenant-capable, single-tenant in fact.

**Why the amendment...** [restored in full from main]

---

## Success Criteria (Phase 1)

[Full Phase 1 Success Criteria restored from main]

---

## Vodka Boundary Enumeration (per P0006)

[Full section restored from main]

---

## Non-Goals (Anti-Scope)

[Full section restored from main]

---

## Background

[Full section restored from main]

---

## Approach

[Full Phase 1 Approach / private-CA bridge section restored from main]

---

## Constraints (updated for v0.5)

- Contract-governs-handoff-drift
- Borrow-evaluation-before-implementation (Phase 2 gate)
- Release-validation-gate
- Two-leg auth
- Read-only-by-default (Phase 2)
- Docs-first (Phase 2)

---

## Phase 2 — Read-Only Retrieval Surface + Laptop-Free Token Acquisition (v0.5)

[Full Phase 2 section as previously drafted — appended cleanly]

---

## Definition of Done

Phase 1 DoD remains satisfied. Phase 2 DoD is defined in the Phase 2 Success Criteria section.
