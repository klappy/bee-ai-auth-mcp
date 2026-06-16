---
title: "Phase-2 read surface — fresh-validator review (companion)"
kind: handoff
audience: docs
date: 2026-06-16
reviewer: "Claude Opus 4.8 — fresh chat session, oddkit/ODD operating contract; did not author the reviewed code"
reviews: "bee-ai-auth-mcp @ main ffe657d (Phase 1 auth core + Phase 2 read surface)"
ledger: "odd/ledger/2026-06-16-phase2-read-surface-fresh-validation.md (E0021)"
---

# Phase-2 Read Surface — Fresh-Validator Review

**Validator:** Claude Opus 4.8, in a fresh chat session under the oddkit/ODD operating contract. I did not author any of the code under review — it was built by prior crew sessions — so this review meets the *fresh-context* requirement of `klappy://canon/constraints/release-validation-gate`. Same model family as the build crew, which the gate explicitly permits; the binding requirement is a context break, satisfied here. (Session ID is not exposed to me.)

**Date:** 2026-06-16 (operator tz EDT; observed server_time `2026-06-16T21:40Z` UTC).

**Subject:** `bee-ai-auth-mcp` at `main` HEAD `ffe657d` — the Phase-1 auth core plus the Phase-2 read surface (`bee_docs` + `bee_read`).

## What I did

Two independent arms, because each catches what the other can't:

- **Live, black-box** — exercised the *deployed* connector the way a client does: `whoami`, `bee_docs`, and `bee_read` across the full documented read surface (`/v1/me`, `/v1/conversations` single + list, `/v1/facts`, `/v1/todos`, `/v1/journals`, `/v1/daily`, `/v1/changes`), both search modes (BM25 and neural), a bad-path probe, and a three-pass `/v1/me` smoke. Real `200` shapes captured for all of it; the bearer never surfaced in any response. (Ledger O1–O11.)
- **Source + build, white-box** — cloned `main` clean, ran `tsc --noEmit` (clean) and the unit suite (15 passed, 2 live-smoke skipped), and audited the load-bearing source: the read-only-by-construction method split in `src/bee.ts`, the per-grant custody and allow-list gate in `src/mcp-api.ts` / `src/bee-auth.ts`, the token-agnostic bound bridge in `src/bridge.ts` / `wrangler.jsonc`, and a grep confirming there is no `console.*` anywhere in `src/` and no `BEE_API_TOKEN`. (Ledger O12–O21.)

Both arms are mapped to the gate's 5-corroboration pattern in the ledger (§D).

## Verdict

**Functionally sound and safe on `main` (ledger D0037).** No code defects; no credential leakage; the read-only guarantee is structural in source and confirmed in behavior; spec-vs-shipped drift is LOW. The Phase-2 read-surface Definition-of-Done is met for every item that is buildable and runtime-verifiable from a validator seat.

This is an **accept-with-named-residuals**, not an unconditional clear. Four things are *not* established by this validation, and the honesty of the report depends on saying so plainly:

1. **Single-tenant denial** is verified in code but not exercised at runtime — I cannot authenticate as a second GitHub user from this seat (ledger H1).
2. **No-token-in-logs** is proven at the application layer (zero `console.*`) but the infra-layer audit — Cloudflare Worker + bridge container logs, with `observability.enabled: true` — is operator-owned (ledger H2).
3. **Prior-art PII** in `planning/` was not audited here (ledger H3).
4. **Validation mechanism:** this is fresh-context relative to the build, but it is *not* the gate's preferred separately-dispatched Managed-Agents validator (that surface isn't available from this seat). For a formal `main → prod` promotion sign-off, that separate dispatch remains the canon-preferred path (ledger C3 / O-open 1).

The one irreducible posture constraint — the in-flight plaintext token window inherent to any forwarding relay — is confirmed as the *only* such residual, with at-rest custody encrypted (ledger C1).

Numbered observations, evidence, and opens are in the companion ledger.
