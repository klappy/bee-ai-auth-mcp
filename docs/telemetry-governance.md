---
uri: klappy://docs/products/bee-ai-auth-mcp/telemetry-governance
title: "Telemetry Governance — What bee-ai-auth-mcp Measures, Why, and Where It Stops"
audience: docs
exposure: nav
tier: 3
voice: neutral
stability: draft
tags: ["docs", "bee-ai-auth-mcp", "telemetry", "observability", "analytics-engine", "privacy", "multi-tenant", "self-host", "latency", "caching"]
date: 2026-06-17
derives_from: "klappy://canon/constraints/telemetry-governance, klappy://canon/decisions/DR-20260514-0001-telemetry-wrapper-pattern, klappy://canon/constraints/telemetry-validation-gate, klappy://writings/the-dream-house-and-pre-optimization"
status: draft
---

# 📡 Telemetry Governance — bee-ai-auth-mcp

> **DRAFT pending the operator's author pass — v0.2.** Nothing here commits, pushes, or merges until reviewed. v0.2 folds in the operator's correction: telemetry must be **multi-tenant-ready from the start**, like oddkit and the rest of the family — not retrofitted later. Drafted by the first officer from observed source (`src/bee.ts`, `src/bridge.ts`, `wrangler.jsonc`) and the oddkit/aquifer telemetry lineage. This document is **docs-first**: it precedes the instrumentation code and governs it.

> bee instruments tool calls so the operator can see what the service is actually costing. The first job is to answer a question the service currently cannot: **what does a conversation fetch cost, cold versus warm — before we design any R2/KV/Cache layer to speed it up.** The mechanism is borrowed from oddkit; the schema is designed so the *same instrument* works whether bee is running single-tenant on a self-hosted Worker today, or hosted multi-tenant tomorrow. We build the dream house and cut later (`klappy://writings/the-dream-house-and-pre-optimization`) — the tenant dimension exists from day one even while it holds a single value.

---

## One mechanism, two tenancy postures

The Worker is multi-tenant-*capable* by architecture; the allow-list keeps it single-tenant today (`README`, and the grant-level isolation decision **E0014**, `odd/ledger/2026-06-15-bee-leg-private-ca-and-multitenancy.md`). Telemetry honors the same two-posture shape on one codepath:

**Tier 1 — self-host, single-tenant (today).** The operator runs the Worker and is the only caller. They observe their own instance, querying their own Analytics Engine dataset on their own Cloudflare account. No data leaves that account. The tenant dimension is present but constant.

**Tier 2 — hosted, multi-tenant (upcoming, like oddkit / aquifer).** Many users connect to one deployment. Now the host needs aggregate cross-tenant observability (is this catching on? which tools matter? where is latency?) **while each tenant's rows stay isolated**. This is where oddkit's central-host concerns legitimately return — but bound by bee's stricter custody posture.

The mechanism — Analytics Engine + a per-tool `withTelemetry` wrapper + the schema below — is **identical** across both. What scales between them is one field (the tenant key) and one policy (who may query which rows). Designing the field in now is what makes the Tier-2 transition a wiring change, not a migration.

> **Isolation is at the grant level, not the deployment level** — the same rule the bridge already follows (E0014: the bridge is token-agnostic shared infrastructure; isolation rides each request's grant). Telemetry inherits it: a tenant is a grant, and rows are partitioned by an opaque per-grant key.

---

## What is tracked

One Analytics Engine data point per `tools/call`, written via a non-blocking `writeDataPoint()`. Blob/double layout adapted from oddkit; bee-specific fields marked **★**.

### Structural dimensions (blobs)

| Dimension | Records | Example |
|-----------|---------|---------|
| Event type | `tool_call` | `tool_call` |
| **★ Tenant key** | **Opaque, stable, per-grant** identifier — never the GitHub login, Bee id, email, or token. A non-reversible hash of the grant subject. Constant under Tier 1; the partition key under Tier 2 | `t_9f3a…` |
| Tool name | Which tool ran | `whoami`, `bee_read`, `bee_docs` |
| **★ Bee path class** | For `bee_read`, a **coarse class** of the Bee path — never the raw path, never a conversation id | `me`, `conversations`, `search`, `other` |
| **★ Bridge state** | Whether the bound container served this request **cold or warm** | `cold`, `warm`, `n/a` |
| Status class | Outcome bucket | `2xx`, `4xx`, `5xx`, `transport_fail` |
| Worker version | Commit/version string | `0.x.y` |

> The **tenant key** is the multi-tenancy hinge, and it is a *structural identifier* (like oddkit's `consumer_label`) — but bee's version is opaque by construction. It answers "which grant" for partitioning and aggregation; it never answers "who" or "what." Deriving it as a non-reversible hash of the grant subject means a leaked dataset cannot be walked back to an identity. Per `klappy://canon/principles/identity-resolved-by-protocol`, identity is resolved by the grant, not hardcoded into the row.
>
> The **Bee path class** is the content-privacy hinge: `GET /v1/conversations/abc123` is recorded as `conversations`, never `abc123`.

### Numeric values (doubles)

| # | Value | Records |
|---|-------|---------|
| 1 | Count | Always `1`, for `SUM` aggregation |
| 2 | `duration_ms` | Full tool wall-clock at the Worker edge |
| 3 | **★ `bridge_ms`** | Wall-clock of the `bridge.fetch` round-trip to Bee (the cold/warm-sensitive leg) |
| 4 | `bytes_out` | UTF-8 byte length of the response body — **shape only** |
| 5 | `cache_hits` | Per-fetch records in the request that hit a cache tier (`0` until caching exists) |
| 6 | `cache_lookups` | Total fetches in the request — the hit-rate denominator |

> **Deliberately NOT recorded: `tokens_in` / `tokens_out`.** Tokenizing a private conversation buys nothing `bytes_out` doesn't already give, costs CPU, and opens a faint metadata channel on private content. **Operator decision point:** confirm bytes-only, or drop size entirely.

---

## The cold/warm split is the whole point

`src/bridge.ts` sets `sleepAfter = "10m"` because access is *bursty, not steady* — so the container cold-starts on the next request rather than being held warm. Conversation-fetch latency is therefore **bimodal**, and a single "average" blends two populations. `bridge_state` + `bridge_ms` let the operator compute, **per tenant**:

- **warm** p50 / p95 — the steady-state cost a cache must beat
- **cold** p50 / p95 — the cold-start tax
- **cold-start frequency** — how often a real request pays it
- once a cache exists, **hit rate** = `SUM(cache_hits) / SUM(cache_lookups)`

This is why it's worth doing once: the same instrument that establishes the baseline measures the cache's effect. And it sizes the prize — a cache hit served from the Worker skips **both** the cold container **and** the Bee round-trip.

---

## Caching and tenancy are coupled

When caching is designed, the cache **must be grant/tenant-scoped — never shared across tenants.** A shared cache of decrypted private conversations would breach the custody model outright. That has a telemetry consequence: `cache_hits`/`cache_lookups` are recorded per row and aggregated **within a tenant**. A blended cross-tenant hit rate would hide per-tenant cold starts and is never the operator's true signal. The tenant key makes the correct per-tenant rollup possible.

---

## Emission contract

Per `klappy://canon/decisions/DR-20260514-0001-telemetry-wrapper-pattern`:

1. **One emission point per tool** — every `server.tool()` registration wrapped `withTelemetry(toolName, handler)`. An unwrapped tool is a release blocker.
2. **In-memory, never wire-edge** — measure validated args on entry and the returned envelope on exit; never read `request.body`/`response.body` streams.
3. **Per `tools/call` granularity** — one row per call; batches do not share rows.
4. **Failure swallowed, never propagated** — if measurement or `writeDataPoint` throws, catch it and return the tool result unchanged. **Telemetry must never break a Bee request.**
5. **No domain opinion in the wrapper** — tenant-key derivation, path-class, and cold/warm detection are helpers the wrapper calls, not logic baked into it.

---

## Two Cloudflare Workers runtime facts that shape what is measurable

1. **`writeDataPoint` is non-blocking** — instrumenting adds zero latency to the request being measured.
2. **The clock is frozen between network I/O events** (timing-side-channel mitigation). Timing *across* `bridge.fetch` advances, so `bridge_ms` is real; timing *pure-CPU* sub-steps reads ~0 and earns no field (oddkit learned this when `tokenize_ms` always read zero). The honest baseline is **total wall-clock + the Bee network leg**, not a CPU breakdown.

---

## What is excluded (the custody boundary — tightened)

Never collected, under any circumstance:

- **The Bee bearer token** — already a hard rule in `bee.ts`; telemetry does not relax it.
- **Conversation content** — anything returned from Bee.
- **Raw Bee paths or conversation ids** — only the coarse path class.
- **Search/query bodies** — the POST body to `/v1/search/*` is never recorded.
- **Reversible identity** — the tenant key is an opaque non-reversible hash; the GitHub login, Bee id, and email never appear in any row.
- **Prompts, model responses, IPs, device fingerprints.**

**Cross-tenant query policy (Tier 2):** a tenant may see only their own rows; only the host may run aggregate cross-tenant queries, and those aggregates must never project a single tenant's content shape in a way that re-identifies them. The principle: *a row proves a fetch happened and how long it took — never what it was about or who it belonged to in the clear.*

---

## Per-request ephemeral trace (not persisted)

Mirror oddkit's `debug.trace`: per-request `{ path_class, duration_ms, cached }` per fetch plus `cacheStats { hits, misses, total }`, returned in the response and **nowhere else** — not written to Analytics Engine. Paths sanitized to class; no tenant key needed (the caller is the tenant).

---

## The baseline queries (the original goal, made concrete)

Once instrumentation lands, these answer "what does a conversation fetch cost?" — split the way reality is, and scoped by tenant:

```sql
-- Warm steady-state for one tenant (first cut: AVG; upgrade to quantiles with volume)
SELECT AVG(double2) AS avg_ms, SUM(_sample_interval) AS n
FROM bee_telemetry
WHERE blob2 = :tenant_key AND blob3 = 'bee_read' AND blob4 = 'conversations' AND blob5 = 'warm'
  AND timestamp > NOW() - INTERVAL '7' DAY;

-- Cold-start tax for one tenant
SELECT AVG(double2) AS avg_ms, SUM(_sample_interval) AS n
FROM bee_telemetry
WHERE blob2 = :tenant_key AND blob3 = 'bee_read' AND blob5 = 'cold'
  AND timestamp > NOW() - INTERVAL '7' DAY;

-- Cold-start frequency per tenant
SELECT blob2 AS tenant, blob5 AS bridge_state, SUM(_sample_interval) AS n
FROM bee_telemetry WHERE blob3 = 'bee_read' GROUP BY blob2, blob5;

-- Cache effectiveness per tenant (after a cache exists)
SELECT blob2 AS tenant, SUM(double5) / SUM(double6) AS hit_rate
FROM bee_telemetry WHERE blob3 = 'bee_read' GROUP BY blob2;
```

(Blob/double indices are illustrative — fix the exact slot map in the implementation, and never reorder slots later; reuse-by-renumber is how oddkit got telemetry bugs.) Use `SUM(_sample_interval)`, never `COUNT(*)`. Analytics Engine retains ~3 months; snapshot monthly aggregates to KV or R2 if long-term trend matters.

---

## Shared substrate — this is family infrastructure

The reusable core here — the `withTelemetry` wrapper, the blob/double conventions, the opaque tenant key, the privacy boundary, and the cold/warm fields where a bound container exists — is **not bee-specific**. oddkit and aquifer already run this lineage; **git-repo-auth is the next likely adopter** (and bee was itself ported from git-repo-auth, so the substrate flowing back is natural).

Design implication: keep the reusable core generic so adoption is wiring, not a rewrite. Each server specializes only its **domain fields**:

- **bee** — path class (`me`/`conversations`/`search`) + `bridge_state`/`bridge_ms` (it has a bound container).
- **git-repo-auth** — e.g. tool class (token-mint vs read) + repo-scope class; **no `bridge_state`** (no container — that field is `n/a`, same as oddkit/aquifer).

The tenant key, emission contract, exclusions, and validation gate are common to all. Worth deciding at author-pass time: does the shared core live as a small published module the family imports, or as a documented pattern each repo ports? Either is defensible; the first reduces drift, the second keeps each Worker self-contained (vodka).

---

## Vodka-architecture honesty

- **Grown thick?** No — one `writeDataPoint` per call, one wrapper, one optional binding, one tenant-key helper.
- **Domain opinions?** No — tool names, path *classes*, an opaque tenant key, durations, sizes. It does not interpret content.
- **Removable without consequence?** **Tier 1: yes** — it serves only the operator's own observability and the caching decision; drop it and the service runs, you just go blind on latency. **Tier 2: no** — under hosted multi-tenant it becomes load-bearing for sustainability, the same way oddkit's is. The honest answer is tier-dependent.

---

## Required reading before implementation (canon — do not duplicate here)

- `klappy://canon/decisions/DR-20260514-0001-telemetry-wrapper-pattern` — the wrapper pattern, authoritative.
- `klappy://canon/constraints/telemetry-governance` — the oddkit parent this derives from.
- `klappy://canon/observations/2026-05-16-telemetry-wrapper-intermittent-emit-loss` — **pitfall:** the wrapper has historically dropped `writeDataPoint` on a *variable subset* of calls. A lossy baseline is worthless — read before coding the wrapper.
- `klappy://canon/constraints/telemetry-validation-gate` — **smoke every tool, verify every number** (one verified call per tool per surface; deterministic, no organic-load wait).
- `klappy://canon/principles/identity-resolved-by-protocol` — why the tenant key is opaque and grant-resolved, not hardcoded identity.
- `odd/ledger/` **E0014** — grant-level isolation, the tenancy model telemetry inherits.
- `klappy://canon/meta/frontmatter-schema` — for this doc's metadata at promotion time.

---

## Definition of Done (for the implementation phase that follows this doc)

Per `klappy://canon/definition-of-done` and the telemetry-validation-gate:

1. Analytics Engine dataset created and bound in `wrangler.jsonc` (e.g. `BEE_TELEMETRY`).
2. `whoami`, `bee_read`, `bee_docs` all wrapped — none unwrapped.
3. Opaque tenant-key derivation implemented and unit-tested as non-reversible; constant for the single allow-listed login today, distinct per grant under multi-tenant.
4. A live smoke produces **≥1 verified row per tool**, numbers checked against a known request.
5. **Both** `cold` and `warm` `bridge_state` observed at least once in real data.
6. The baseline queries return real numbers — the answer to the question that started this thread.
7. Audit: **no token, no conversation content, no raw path/id, no reversible identity** in any row or trace.

---

## Status & next steps

- **Draft (v0.2) for the operator's author pass.** Crew does not push author-voice text; the operator reviews exact wording, then opens/merges per the standing provenance rule.
- On acceptance: assign a `D00xx` decision and add a DOLCHEO ledger entry (`odd/ledger/`), then graduate from `stability: draft`.
- Implementation is a **separate execution pass** gated by this governance — docs-first holds. The git-repo-auth adoption is a follow-on, not in scope for the bee implementation pass.
