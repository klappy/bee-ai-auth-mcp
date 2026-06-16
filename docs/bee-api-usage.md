---
title: "Bee API Usage — the read surface bee_docs serves and bee_read calls"
kind: docs
audience: "AI client (via bee_docs) + maintainer"
status: draft
date: 2026-06-16
observed_server_time: "2026-06-16T20:33Z"
source: "https://docs.bee.computer/docs/proxy (Bee, last updated 2026-06-07) + repo connect-flow findings (docs/connecting-and-getting-your-bee-token.md)"
tags: ["bee-ai-auth-mcp", "phase-2", "bee-api", "bee_read", "bee_docs", "usage", "source-of-truth"]
relates_to: "PRD.md §2 (v0.5); planning/phase2-6b.md"
---

# Bee API Usage

> This is the project-authored source of truth that the **`bee_docs`** tool serves
> to the AI client, and the contract the **`bee_read`** passthrough is built
> against. It is distilled from Bee's own proxy docs plus this repo's verified
> connect-flow findings — it is *not* a copy of Bee's pages. If Bee's API changes,
> update this doc; the passthrough itself stays unchanged.

## How to call Bee from this connector

You do **not** handle hosts, certificates, or tokens. You supply a path; the relay
forwards it to Bee through the private-CA bridge using the user's own bound bearer.

- **`bee_read`** — give it a Bee `/v1/*` path (and querystring). It issues the
  request and returns Bee's JSON. It reaches the **entire read surface**; an
  unknown path simply returns Bee's own status code.
- **`bee_docs`** — returns this document, so you know what paths exist and how to
  shape them.

Method rule for `bee_read` (**PROPOSED — pending operator ruling, see Design
Decision below**): **GET** to any `/v1/*` path, **plus POST allow-listed to
`/v1/search/*` only**. No other method, no body except on the two search paths.
The read-only guarantee is structural — the tool cannot mutate.

## Read surface (verified against Bee proxy docs, 2026-06-07)

| Path | Method | Returns |
|------|--------|---------|
| `/v1/me` | GET | User profile (also the relay's `whoami` smoke check) |
| `/v1/conversations` | GET | List conversations |
| `/v1/conversations/:id` | GET | One conversation |
| `/v1/conversations/:id/related` | GET | Related conversations (developer endpoint) |
| `/v1/facts` · `/v1/facts/:id` | GET | List / get facts |
| `/v1/todos` · `/v1/todos/:id` | GET | List / get todos |
| `/v1/journals` · `/v1/journals/:id` | GET | List / get journals |
| `/v1/daily` · `/v1/daily/:id` | GET | List / get daily summaries |
| `/v1/changes` | GET | Changed entity ids since a cursor (or a default window when omitted) — use for sync |
| `/v1/search/conversations` | **POST** | BM25 keyword search — body `{"query": "...", "limit": 20, "cursor": null}` |
| `/v1/search/conversations/neural` | **POST** | Neural search — body `{"query": "...", "limit": 20}` |

Bee also forwards additional developer GET endpoints the same way (representative,
not exhaustive): `insights`, `locations`, `photos`, `todoSuggestions`, `todayBrief`.
Because the passthrough forwards **any** `/v1/*` path, these work without being
enumerated here — there is no tool surface to freeze.

## Design decision needed: search is POST

Bee's search endpoints use **POST with a JSON body**, even though they are read
operations. A strictly GET-only `bee_read` therefore **cannot search** — which
would drop the most valuable retrieval capability. Options:

1. **`bee_read` = GET any `/v1/*` + POST allow-listed to `/v1/search/*` only.**
   One tool; guarantee becomes "GET anything, or POST only to the search paths
   (which do not mutate)." *(Doc currently written to this option.)*
2. **A separate `bee_search` tool** (POST, restricted to `/v1/search/*`), leaving
   `bee_read` strictly GET.
3. **`bee_read` GET-only, no search** until the write phase.

This is the one open call before `bee_read` is implemented.

## Pagination & cursors

- Search takes `limit` and a `cursor` (BM25); pass the returned cursor back to page.
- `/v1/changes` is cursor-based; omit the cursor for a default window, then page
  forward with the returned cursor. This is the sync primitive.

## Excluded from bee_read

- **`GET /v1/stream`** — Server-Sent Events. It is a GET, but it is a long-lived
  stream, not a request/response, so it is **not** served by the synchronous
  passthrough. (Realtime is a separate future product, not Phase 2.)
- **Mutations** — `POST` / `PUT` / `DELETE` on `/v1/facts` and `/v1/todos`
  (create/update/delete) are **write** operations. They belong to the deferred
  **`bee_write`** tool and are not reachable from `bee_read`.

## Field quirks (relevant once bee_write lands)

- Todos: `alarm_at` is supplied as an **ISO-8601** timestamp on input
  (`"2026-02-11T09:00:00Z"`) but returned as **epoch milliseconds** in responses.

## Transport & auth (handled by the relay, not the client)

- Requests go to Bee's developer API host through the relay's **private-CA bridge**
  (the Worker cannot trust Bee's private CA directly; the bridge re-originates TLS
  trusting `bee-ca.pem`). The client never sees the host or the certificate.
- Auth is the user's own Bee bearer, captured at consent and held in the user's
  encrypted per-grant props — never shown to the client, never logged. There is no
  shared Bee secret.

## Confirmation status

- Endpoints above are **doc-confirmed** against Bee's proxy reference (2026-06-07)
  and, for `/v1/me`, **live-confirmed** (the validated `whoami` path).
- The passthrough reaches any `/v1/*` path at runtime, so endpoints do not need to
  be pre-confirmed to be usable — an unsupported path returns Bee's own error.
- A quick live pass over `conversations`, `changes`, and `search` is worth doing
  when `bee_read` is wired, to capture real response shapes in this doc.

## Sources

- Bee proxy/API reference: https://docs.bee.computer/docs/proxy (last updated 2026-06-07)
- Bee MCP (tool catalog, for parity context): https://docs.bee.computer/docs/mcp
- Repo connect-flow findings: `docs/connecting-and-getting-your-bee-token.md`
