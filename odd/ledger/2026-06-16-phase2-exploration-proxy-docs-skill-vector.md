---
uri: klappy://odd/ledger/2026-06-16-phase2-exploration-proxy-docs-skill-vector
title: "Phase 2 exploration — proxy/docs seeding, minimal tools + skill parity, container-CLI alternative evaluated and parked"
kind: journal
epoch: E0015
date: 2026-06-16
tags: ["phase2", "bee-ai-auth-mcp", "proxy", "docs-tool", "mcp-skill", "container-alternative", "parity", "exploration"]
---

# Phase 2 Exploration Ledger Entry

> Fresh-context entry for next session. Read after RESUME.md. Encodes the captain's 2026-06-16 reflection on architecture alternatives and chosen vector. DOLCHEO structured for traceability.

**Status at encoding**: Phase 1 live & wire-validated on main (whoami end-to-end via bound Container bridge, per-grant custody). Operator chose option 1: encode ledger + draft Phase 2 plan.

## [D] Alternative Architecture Evaluated

Container-per-user running full Bee CLI + local MCP server (inspired by ptxprint-mcp job pattern) + QR code auth flow during connect:
- Pros: Full parity with official local MCP/CLI without reverse-engineering API; one-tap in-app QR possible; no user device CLI install.
- Cons (observed): Fragile & complicated — per-user container lifecycle management, state/CLI version pinning, idle timeouts, resource scaling for persistent MCP sessions, GH OAuth → container command streaming handoff. Adds surface vs current thin proxy + private-CA bridge. Open questions on multi-tenant reuse, auth revocation, mobile parity would delay Phase 1 disproportionately.
- Verdict: Parked for now. Retained as possible hybrid fallback for edge cases where proxy/docs route has gaps.

## [O] Bee Official Surfaces Available

- Proxy docs (https://docs.bee.computer/docs/proxy): Clean local HTTP proxy exposing /v1/* (me, conversations, search/conversations, changes, facts, todos, journals, daily, stream, etc.). Requires prior `bee login`; forwards with bearer. Private CA note present.
- Skill docs: Bee Skill surface for real-time context to agents.
- CLI doubles as local-stdio MCP.

These seed docs without full reverse-engineering.

## [D] Chosen Phase 2 Vector (Prompt-over-Code Aligned)

Build in fashion of klappy/git-repo-auth-mcp:
1. High-quality `bee_docs` tool — seeded with proxy reference + full /v1/* subset + private-CA handling + skill notes. Model reads docs to understand surface.
2. Flexible `bee_api_call` tool (method, path, body/params) — server injects per-grant bearer; model crafts exact usage from docs. Minimal tools (2), rich descriptions. Async/pagination/summary support planned.
3. Explore hosting custom MCP Skill (SKILL.md seeded from same corpus) for hosts that prefer skill surface; test parity vs local CLI.

Goal: Full functional connector parity (read access to conversations etc.) without requiring CLI install on user device. Docs-first per canon.

## [C] Constraints & Open Questions

- No token in logs/observability; custody remains per-grant.
- Mobile surface validation (Claude web/iOS) non-negotiable gate.
- Token/context cost of docs+api vs skill vs full tools — measure in prototype.
- Multi-tenant scaling (Tier 2) deferred; current allow-list single-tenant.
- Skill vs MCP: Complementary or convergence path? Test both.
- Ledger all exploration before code; encode decisions continuously.

## [E-open] Next Actions

- Draft/update Phase 2 section in PRD.md or new planning doc.
- Prototype docs + api tool pair (borrow git-auth pattern).
- Seed and test custom Bee skill.
- Validate against live Bee API (confirm /v1/search/conversations etc.).
- Mobile three-pass whoami + retrieval test.
- Encode further findings in this ledger or new entry.

**Pointers**: PRD.md v0.4, RESUME.md, Bee proxy/skill docs, git-repo-auth-mcp implementation handoff, canon (prompt-over-code, mode discipline).

**Handoff**: This entry + RESUME.md bootstrap next session. Operator attention is bottleneck — keep questions in planning.

---

**Encoded by First Officer per captain directive "1".**
**Time observed: 2026-06-16T05:15Z UTC**
**Canon fetched and mode respected.**