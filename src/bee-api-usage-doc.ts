/* AUTO-GENERATED from docs/bee-api-usage.md by scripts/gen-bee-docs.mjs.
   Do not edit by hand — edit the .md and regenerate. bee_docs serves this. */
export const BEE_API_USAGE_DOC = `---
title: "Bee API Usage — the read surface bee_docs serves and bee_read calls"
kind: docs
audience: "AI client (via bee_docs) + maintainer"
status: current
date: 2026-06-16
observed_server_time: "2026-06-16T20:33Z"
source: "https://docs.bee.computer/docs/proxy (Bee, last updated 2026-06-07) + repo connect-flow findings (docs/connecting-and-getting-your-bee-token.md)"
tags: ["bee-ai-auth-mcp", "phase-2", "bee-api", "bee_read", "bee_docs", "usage", "source-of-truth"]
relates_to: "PRD.md §2 (v0.5); planning/phase2-6b.md"
---

# Bee API Usage

> This is the project-authored source of truth that the **\`bee_docs\`** tool serves
> to the AI client, and the contract the **\`bee_read\`** passthrough is built
> against. It is distilled from Bee's own proxy docs plus this repo's verified
> connect-flow findings — it is *not* a copy of Bee's pages. If Bee's API changes,
> update this doc; the passthrough itself stays unchanged.

## How to call Bee from this connector

You do **not** handle hosts, certificates, or tokens. You supply a path; the relay
forwards it to Bee through the private-CA bridge using the user's own bound bearer.

- **\`bee_read\`** — give it a Bee \`/v1/*\` path (and querystring). It issues the
  request and returns Bee's JSON. It reaches the **entire read surface**; an
  unknown path simply returns Bee's own status code.
- **\`bee_docs\`** — returns this document, so you know what paths exist and how to
  shape them.

Method rule for \`bee_read\` (**settled — D0034, option 1; implemented E0020**): **GET** to any \`/v1/*\` path, **plus POST allow-listed to
\`/v1/search/*\` only**. No other method, no body except on the two search paths.
The read-only guarantee is structural — the tool cannot mutate.

## Read surface (verified against Bee proxy docs, 2026-06-07)

| Path | Method | Returns |
|------|--------|---------|
| \`/v1/me\` | GET | User profile (also the relay's \`whoami\` smoke check) |
| \`/v1/conversations\` | GET | List conversations |
| \`/v1/conversations/:id\` | GET | One conversation |
| \`/v1/conversations/:id/related\` | GET | Related conversations (developer endpoint) |
| \`/v1/facts\` · \`/v1/facts/:id\` | GET | List / get facts |
| \`/v1/todos\` · \`/v1/todos/:id\` | GET | List / get todos |
| \`/v1/journals\` · \`/v1/journals/:id\` | GET | List / get journals |
| \`/v1/daily\` · \`/v1/daily/:id\` | GET | List / get daily summaries |
| \`/v1/changes\` | GET | Changed entity ids since a cursor (or a default window when omitted) — use for sync |
| \`/v1/search/conversations\` | **POST** | BM25 keyword search — body \`{"query": "...", "limit": 20, "cursor": null}\` |
| \`/v1/search/conversations/neural\` | **POST** | Neural search — body \`{"query": "...", "limit": 20}\` |

Bee also forwards additional developer GET endpoints the same way (representative,
not exhaustive): \`insights\`, \`locations\`, \`photos\`, \`todoSuggestions\`, \`todayBrief\`.
Because the passthrough forwards **any** \`/v1/*\` path, these work without being
enumerated here — there is no tool surface to freeze.

## Why search is POST (settled — D0034, option 1)

Bee's search endpoints use **POST with a JSON body**, even though they are read operations. A strictly GET-only \`bee_read\` could not search — the most valuable retrieval capability — so the rule allows it: \`bee_read\` issues **GET** to any \`/v1/*\`, and **POST only** to the allow-listed \`/v1/search/*\`. The read-only guarantee stays structural: POST is permitted to the search paths alone, which do not mutate. **Implemented and merged (E0020).** A separate \`bee_search\` tool was considered and rejected — search is still a read, so it stays in \`bee_read\`: fewer tools, good docs.

## Pagination & cursors

- Search takes \`limit\` and a \`cursor\` (BM25); pass the returned cursor back to page.
- \`/v1/changes\` is cursor-based; omit the cursor for a default window, then page
  forward with the returned cursor. This is the sync primitive.

### Conversation utterance paging (relay-only)

Bee's \`GET /v1/conversations/:id\` returns the **entire** conversation in one
response. Bee has **no utterance pager** on this surface — query params such as
\`omit\`, \`since\`, \`limit\`, \`exclude\`, and \`include_summary\` are ignored, and
utterance subpaths (\`/transcriptions/:id\`, \`/transcript\`, \`/utterances\`, etc.)
return 404. The MCP harness, however, truncates tool results around **~40k
characters**, which can cut off mid-utterance on long conversations.

\`bee_read\` therefore pages **in the relay** after Bee returns:

1. Fetch the conversation from Bee as today (unchanged upstream API).
2. If the serialized tool result would exceed a safe cap (~28KB, headroom under
   the ~40k view limit), return one **page of utterances** plus paging metadata.
3. Walk the full utterance list by passing \`since\` (or \`cursor\`, same meaning)
   with the previous page's \`next_cursor\` (utterance id, exclusive).
4. Optionally pass \`chunk\` as a soft max utterances per page; serialized size
   is the hard limit.

**Relay-only \`bee_read\` parameters** (Bee ignores these):

| Param | Meaning |
|-------|---------|
| \`since\` | Utterance id — return utterances **strictly after** this id |
| \`cursor\` | Alias for \`since\` |
| \`chunk\` | Soft max utterances per page |

**Paging metadata** (on the conversation \`body\` when paging applies):

\`\`\`json
"utterance_paging": {
  "paged": true,
  "since": null,
  "next_cursor": "3260382100",
  "utterances_in_page": 45,
  "utterances_total": 182,
  "summary_omitted": true
}
\`\`\`

- \`next_cursor\` — pass as \`since\` on the next \`bee_read\` call with the same
  \`path\` to continue. \`null\` when no more utterances remain.
- On paged calls the giant \`summary\` is omitted (stubbed) so utterances fit.
- The 512KB absolute read cap remains as a backstop for non-conversation reads.

**Example** — conversation \`10189141\` with 182 utterances:

\`\`\`
bee_read({ path: "/v1/conversations/10189141" })
→ first page + utterance_paging.next_cursor

bee_read({ path: "/v1/conversations/10189141", since: "<next_cursor>" })
→ next page; repeat until next_cursor is null
\`\`\`

Reassemble by concatenating \`transcriptions[].utterances\` across pages in order.
Do **not** invent utterances beyond what Bee returned.

## Excluded from bee_read

- **\`GET /v1/stream\`** — Server-Sent Events. It is a GET, but it is a long-lived
  stream, not a request/response, so it is **not** served by the synchronous
  passthrough. (Realtime is a separate future product, not Phase 2.)
- **Mutations** — \`POST\` / \`PUT\` / \`DELETE\` on \`/v1/facts\` and \`/v1/todos\`
  (create/update/delete) are **write** operations. They belong to the deferred
  **\`bee_write\`** tool and are not reachable from \`bee_read\`.

## Field quirks (relevant once bee_write lands)

- Todos: \`alarm_at\` is supplied as an **ISO-8601** timestamp on input
  (\`"2026-02-11T09:00:00Z"\`) but returned as **epoch milliseconds** in responses.

## Transport & auth (handled by the relay, not the client)

- Requests go to Bee's developer API host through the relay's **private-CA bridge**
  (the Worker cannot trust Bee's private CA directly; the bridge re-originates TLS
  trusting \`bee-ca.pem\`). The client never sees the host or the certificate.
- Auth is the user's own Bee bearer, captured at consent and held in the user's
  encrypted per-grant props — never shown to the client, never logged. There is no
  shared Bee secret.

## Confirmation status

- Endpoints above are **doc-confirmed** against Bee's proxy reference (2026-06-07)
  and, for \`/v1/me\`, **live-confirmed** (the validated \`whoami\` path).
- The passthrough reaches any \`/v1/*\` path at runtime, so endpoints do not need to
  be pre-confirmed to be usable — an unsupported path returns Bee's own error.
- A quick live pass over \`conversations\`, \`changes\`, and \`search\` is worth doing
  when \`bee_read\` is wired, to capture real response shapes in this doc.

## Sources

- Bee proxy/API reference: https://docs.bee.computer/docs/proxy (last updated 2026-06-07)
- Bee MCP (tool catalog, for parity context): https://docs.bee.computer/docs/mcp
- Repo connect-flow findings: \`docs/connecting-and-getting-your-bee-token.md\`
`;
