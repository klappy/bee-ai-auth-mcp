# Prior-Art Journal — B / Transcription-Pendant Integration

**Date:** 2026-06-14
**Mode:** Exploration (Double Diamond — Diamond 1, solution-space prior-art divergence)
**Companion to:** `2026-06-14-b-integration-terrain-map.md`
**Adapter discipline:** `klappy://canon/principles/consistency-same-pattern-every-time`
**Borrow gate (binding before any build):** `klappy://canon/constraints/borrow-evaluation-before-implementation`
**Sources:** all observations verified from web sources this session (bee.computer official docs, Feb–Jun 2026; github.com/BasedHardware/omi; limitless.ai/developers + awesome-limitless; Fireflies / Improvado / Hjarni / MemPalace coverage, 2025–2026).

---

## 0. Headline

The field moved faster than the sessions assumed. **Retrieval MCP for transcripts is now a commodity** — Bee ships an official one; so do Limitless, Omi, and every major meeting tool. A from-scratch Bee retrieval connector would be the *seventh handroll* the borrow gate exists to prevent. The honest remaining build is everything Bee's official product does **not** do: a **hosted multi-user OAuth relay**, a **normalization pass**, and the **encode/refine layer** — and that last layer is where the market locates the real value and where ODD/oddkit is uniquely positioned.

---

## 1. The Landscape (four tiers)

### Tier 1 — The source device: Bee (bee.computer)
Official developer surface, actively maintained (docs updated Feb–Jun 2026), GitHub org `bee-computer`:
- **CLI** `@beeai/cli` — `bee login`, `bee now`, `bee search --query … [--neural]`, `bee facts/todos/conversations`, `bee sync` → local markdown.
- **Local HTTP API** via `bee proxy`.
- **Official MCP server** — `bee mcp connect claude` (one-click Desktop install), `claude-code`, `codex`. Tool catalog covers search (keyword + semantic, `since`/`until` bounds), conversations (list/get/**transcript**/related), facts CRUD, daily summaries, voice notes, todos CRUD + suggestions, insights, locations, photos.
- **Realtime stream** `bee stream` — `new-utterance` (speaker-labeled, `conversation_uuid`-scoped), `new-conversation`, summaries, todo, `journal-text`. At-most-once. **Built-in webhooks** (`--webhook-endpoint` + Handlebars `--webhook-body`).

**The boundary that matters:** the official MCP is **local, single-user**. stdio uses your stored `bee login`; HTTP binds to `127.0.0.1` only and rejects non-localhost. There is no hosted, multi-user, OAuth-relayed surface. *That gap is the build.*

### Tier 2 — The open-source platform: Omi (BasedHardware, ex-Friend)
~9.5K GitHub stars, 300K+ users, open hardware + software. Backend REST API (memories, conversations, action items), **hosted MCP**, Python/Swift/RN SDKs, webhooks, audio-streaming pipeline, BLE protocol, **custom vocabulary/jargon** (= your P2 normalization, already solved upstream), app marketplace. Ships a **third-party-wearable adapter layer** that already ingests Plaud, Limitless, and custom hardware at the BLE level — Omi is itself an adapter platform. Best open reference for the full capture→memory→MCP→action architecture.

### Tier 3 — The closest-pattern ecosystem: Limitless
Official **hosted MCP** (Claude → Settings → Connectors, API key from desktop/web app), plus the richest community list (`panguin6010/awesome-limitless`):
- `199-mcp/mcp-limitless` — meeting detection, action-item extraction, natural-time queries, speaker analytics, full API parity.
- **`maplehilllabs` / `BurtTheCoder` `mcp-limitless`** — hosted **GitHub-OAuth, Cloudflare-Workers** MCP connector, **KV-namespace OAuth token storage**, Claude.ai custom connector, hybrid semantic+keyword search. **This is the git-repo-auth-mcp hosted-relay architecture already realized for a pendant.** Borrow-and-adapt reference, not a from-scratch target.
- Obsidian sync plugin, Raycast extension, a RAG "context server" (lifelogs → indexed markdown over REST), ingestion-to-action tools.

### Tier 4 — Downstream / second-brain (product B's prior art)
- Every major meeting tool shipped a **read-only retrieval MCP** in ~6 months: **Otter, Fireflies, Granola, Read.ai, Circleback, tl;dv**. Blueprint: wrap API, expose search + get. (Fireflies' is representative: `get_transcripts`, `get_transcript_details`, `search_transcripts`, `generate_summary`.)
- **Improvado** (Fireflies MCP) markets the **normalization/governance** layer explicitly — rate limits, auth, schema normalization, governance behind the scenes.
- **MemPalace** (Apr 2026) — 19 MCP tools spanning **writes, knowledge-graph mutation, agent-diary writes, auto-dedup**. The read-WRITE pattern. (Benchmarks were inflated; the architecture is the signal.)
- **Hjarni** — markdown KB + built-in MCP; thesis: *Claude needs reusable context — decisions, tradeoffs, owners, reasons — not another transcript.* Structurally identical to your refinery and to ODD's encode discipline.

---

## 2. Borrow-Evaluation Seed (not the binding gate — a head start on it)

| Component | Prior art | Working verdict | Reversibility |
|---|---|---|---|
| Local personal retrieval | Bee official MCP (`bee mcp connect`) | **adopt** — do not rebuild | trivial — it's their CLI |
| Stream → pipeline bridge | `bee stream --webhook-endpoint` | **adopt** for phase-two feed | trivial — config flag |
| Hosted multi-user OAuth relay | `maplehilllabs/mcp-limitless` (CF Workers + GitHub OAuth + KV) | **borrow-and-adapt** reference; our `git-repo-auth-mcp` is the in-house twin | moderate — auth model is the risk |
| Normalization / vocab | Omi custom-vocab; Improvado schema-normalization | **study**, likely build thin (project-keyed) | low |
| Encode / refine layer | MemPalace (write tools), Hjarni (KB+MCP), **oddkit itself** | **build** — this is the differentiated layer; oddkit already is it | n/a — core IP |
| Source-agnostic ingestion | Omi 3P-wearable adapter layer | **study**; validates "B is door number one" | low |

The full six-row 6B evaluation with named criteria and tripwires is owed at the Diamond-2 gate, not here.

---

## 3. Terrain Implication (updates the companion map)

- **Product A shrinks.** Personal retrieval is `bee mcp connect`. A's real scope = the hosted OAuth relay (git-repo-auth pattern) so non-technical operators skip the CLI — gated by whether Bee issues per-user API tokens (open below).
- **Product B is the prize.** The refinery / encode layer is where Hjarni, MemPalace, and ODD all point. It is the layer to *own*, not borrow.
- **Product C has a ready bridge.** `bee stream --webhook` → AMS. The routing layer ("join TinCan room") sits on top of `new-utterance`.
- **A stays raw** (your call this turn): refinement and stacking are B's responsibility, not A's.
- **Correlation is its own governed sub-product** (your call this turn): spoken tag + classifier + manual promotion, driven by an instructed model with its own docs, tooling, and governance.

---

## 4. DOLCHEO Encodings (governance: knowledge_base)

### Decisions
- **D2 — A retrieves raw.** A stays thin (authenticated access + raw retrieval). Compression, cross-referencing, and organization are the higher layers' responsibility. Corrects the raw/refined fork toward raw-only in A. *(5/5)*
- **D3 — Correlation is an agent-shaped sub-product.** Personal/business routing, project-tagging, and promotion are "all of the above" (spoken tag + classifier + manual promotion), handled by an instructed model with its own docs, tooling, and governance — not a feature of A. *(5/5)*
- **D4 — Adapters follow the git-repo-auth-mcp pattern.** A hosted token/credential relay holding per-user auth server-side, exposing a remote MCP surface, so non-technical operators need no local install. *(5/5)*

### Observations (verified prior art)
- **O3.** Bee ships a full official developer surface — CLI, local `bee proxy` HTTP API, official MCP with a broad tool catalog (search incl. neural, conversations/transcripts, facts, todos, summaries, voice notes, insights, locations, photos). *(strong)*
- **O4.** Bee's official MCP is local/single-user — stdio off stored login, HTTP bound to `127.0.0.1`, non-localhost rejected. Not a hosted multi-user surface; that's the gap. *(strong)*
- **O5.** `bee stream` emits speaker-labeled `new-utterance` (conversation-scoped) + `journal-text` etc., at-most-once, with built-in `--webhook-endpoint` forwarding. Ready bridge into a pipeline/AMS. *(strong)*
- **O6.** Omi (BasedHardware, ex-Friend) — leading open-source pendant platform (~9.5K stars, 300K+ users): open REST API, hosted MCP, SDKs, webhooks, audio-streaming, BLE, custom vocab, app marketplace, and a 3P-wearable adapter layer ingesting Plaud/Limitless/custom hardware. *(strong)*
- **O7.** Limitless — official hosted MCP + richest community ecosystem (`awesome-limitless`): 199-mcp analytics server, Obsidian sync, RAG context server, ingestion-to-action tools. *(strong)*
- **O8.** `maplehilllabs`/`BurtTheCoder` `mcp-limitless` — hosted GitHub-OAuth, Cloudflare-Workers MCP with KV OAuth token storage, Claude.ai custom connector. The git-repo-auth hosted-relay pattern already realized for a pendant. *(strong)*
- **O9.** Every major meeting tool (Otter, Fireflies, Granola, Read.ai, Circleback, tl;dv) shipped a read-only retrieval MCP in ~6 months. Retrieval MCP is commodity. *(strong)*
- **O10.** Differentiation sits above retrieval: hosted OAuth relay; normalization/governance (Improvado); and the read-WRITE/encode layer (MemPalace's 19 tools incl. KG mutation; Hjarni's "reusable context, not transcripts"). *(strong)*

### Learnings
- **L2 — The field converged; the retrieval connector is a commodity.** Bee already ships it. A from-scratch Bee retrieval MCP = the seventh handroll the borrow gate prevents. The honest build = hosted relay + normalization + encode layer. *(strong)*
- **L3 — The compressed-memory intuition is validated and is home turf.** "Compressed encodings, not transcripts" = Hjarni = MemPalace = ODD's encode discipline. The refinery is the layer to own. *(strong)*

### Constraints
- **C5 — Borrow-evaluation binding before build.** Working verdicts: Bee MCP adopt (local retrieval); `bee stream`+webhook adopt (stream bridge); Limitless hosted-OAuth CF MCP borrow-and-adapt (hosted relay); Omi adapter + Hjarni/MemPalace study (encode layer). *(adequate — make explicit at the gate: nothing builds until each row has a named verdict + tripwire)*

### Opens
- **P7.** Bee hosted-relay viability unconfirmed. Official MCP is login-based/local; community `beemcp` uses `BEE_API_TOKEN`. Whether Bee issues per-user API tokens suitable for a hosted multi-user relay needs `docs.bee.computer/docs/proxy` (and the API/auth docs) — not yet read.
- **P8.** ReMarkable / whiteboard-photo / calendar prior art (session 3 unified vision) not surveyed. Deferred with the unified vision; it's downstream of the wound.

---

## 5. Driftwood / notes
- Disambiguation kept-rock: "Bee" collides with IBM's **BeeAI agent framework** (`i-am-bee`, now archived/LF-donated), Beebdroid (BBC Micro emulator), and Oracle Beehive. The captain's "B" = `bee.computer` pendant only. Discard the others on sight.
- Community `OkGoDoIt/beemcp` (unofficial, `BEE_API_TOKEN`, `uvx beemcp`) predates / parallels Bee's official MCP — worth a glance for the token path relevant to P7.

---

## 6. Addendum — P7 Close + Reframe Pressure-Test (2026-06-14)

### P7 closed (via `docs.bee.computer/docs/proxy`)
Bee exposes a **direct token-authenticated HTTP API**: `Authorization: Bearer $BEE_TOKEN` → `/v1/*`. Full surface: `/v1/me`, **`/v1/changes`** (cursor delta-sync — good for incremental refinery ingestion), facts/todos CRUD, journals, conversations, daily, **search** (`POST /v1/search/conversations` BM25 + `/neural`), **streaming** (`GET /v1/stream` SSE, `?types=`). The `bee proxy` command itself is local-only and *unauthenticated* (`127.0.0.1`, `/v1/*` passthrough) — explicitly not for public exposure. The **direct API is the path for a hosted relay.**

- **Verdict:** hosted relay is **viable in principle** on Bearer tokens.
- **Wrinkle (C):** Bee uses a **private CA**. A relay must trust Bee's cert explicitly (CLI ships it at `bee-cli/sources/certs.ts`); system trust stores are insufficient. Named friction, not a blocker.

### New opens
- **P9 — token issuance undocumented.** Docs show how to *use* a Bearer token, not how a user *obtains* one via an OAuth authorization-code flow. Official MCP is login-based; community `beemcp` uses a pasted `BEE_API_TOKEN`. So a hosted relay is likely **token-paste today, not clean git-repo-auth-style minting**. Impact: lower magical-first-run for A until/unless Bee ships OAuth.
- **P10 — DECISIVE known-unknown: surface reach.** Does Bee's official MCP reach the **claude.ai remote-connector** surface (web/mobile), or only **Claude Desktop / Code / Codex** via local stdio? Docs show only the local desktop clients. The captain works in claude.ai chat (where he ships remote connectors like git-repo-auth). **This one fact sets product A's entire scope.**

### Reframe pressure-test verdict
Claim tested: *"the wound is solved off-the-shelf by `bee mcp connect`, so build the refinery (B), not the wire (A)."*
- **Half-true, over-stated.** Holds for the captain's desktop/technical use (verifiably ends copy-paste) and correctly names B as the differentiated, ODD-home-turf layer.
- **Over-generalizes from n=1:** conflates the captain (technical, desktop) with the product audience (non-technical, magical-first-run), and assumes surface parity that is unverified (P10).
- **Resolution:** B is the durable value **regardless**; A's scope is **contingent on P10**. If the official MCP reaches claude.ai → A ≈ `bee mcp connect`, refinery is the real build. If not → the hosted relay (A) is the only thing reaching the captain's real surface and remains the wound-closer.

### Canon kept-rock
`klappy://docs/oddkit/release-notes/2026-05-12-epoch-9-substrate-becomes-the-wire` — operator-as-wire is the recognized-unhealthy default; the substrate carries the wire. *Removing the relay is blessed; the only live question is build-vs-adopt, not whether.* Inherits `klappy://canon/principles/magical-first-run` (non-technical reach in <60s) as the bank that makes A's relay case real.

### Next move
Verify P10 — whether Bee's official MCP is installable as a claude.ai remote connector. Cheapest decisive test in the whole exploration; it converges Diamond 1.

---

## 7. Diamond-1 Convergence (2026-06-14) — the cut is locked

### Decisive constraint (operator)
The solution must work on **all devices (iOS, iPadOS, macOS)** and **all Claude surfaces (chat, Cowork, Code, Desktop)**. No local laptop/CLI workflow. This **disqualifies local-stdio MCP** (`bee mcp connect`, `claude_desktop_config.json`) as delivery.

### P10 closed (verified, support.claude.com, current)
Custom **remote** MCP connectors work across **every** Claude client — claude.ai web, **mobile iOS/Android**, macOS Desktop, and Cowork. Server runs in **Anthropic's cloud**; must be public-internet reachable (allowlist Anthropic IPs). Added once on claude.ai web, then live on every surface (you can't add a new server from mobile). OAuth client id/secret supported in advanced settings. **Local stdio MCP is explicitly unavailable in claude.ai and Cowork.**

### The locked cut
**Product A = a hosted remote MCP connector** on the `git-repo-auth-mcp` pattern. Anthropic's cloud calls it over the public internet → it reaches iOS, iPadOS, macOS, chat, Cowork, and Code uniformly. It:
- wraps Bee's Bearer-token `/v1/*` API,
- trusts Bee's private CA server-side,
- performs its own user authentication and holds the Bee credential server-side.

Borrow-and-adapt reference: `maplehilllabs/BurtTheCoder mcp-limitless` (CF Workers + OAuth + KV). In-house twin: `git-repo-auth-mcp`. Bee's official local MCP is **reference-only** for the tool surface, disqualified as delivery.

**The reframe "build B not A" is closed.** A is mandatory — it is the all-surface wound-closer, not a product nicety. B (refinery) remains the durable value, downstream. C (live wire) rides `/v1/stream` SSE or `bee stream --webhook` → AMS, phase two.

### Retraction (E0010 debrief, no blame)
Earlier framing "the wound is already solved off-the-shelf by `bee mcp connect`" was desktop-biased and is **retracted**. The decisive variable was never whether retrieval is commodity — it was whether delivery is local or hosted. Verifying surface reach (P10) before sequencing the build is the move that caught it.

### Remaining open before build
- **P9b** — how a user supplies their Bee credential to the relay (pasted `BEE_API_TOKEN` today vs. Bee OAuth if/when it ships; whether per-user Bee tokens are issuable at all for non-self users). A magical-first-run *quality* question, not a viability blocker.

### Gate status
Diamond 1 (Discover → Define) is **converged**. Crossing to Diamond 2 (planning) is the operator's gate — it triggers the borrow-evaluation (`klappy://canon/constraints/borrow-evaluation-before-implementation`) and release-validation (`klappy://canon/constraints/release-validation-gate`) constraints.

---

## 8. Architecture Refinement — One Auth Core, Two Transports (operator challenge, 2026-06-14)

**Operator challenge:** can A and C both be one thin hosted auth-relay MCP that just auths and proxies Bee's APIs?

**Verdict — mostly yes, with one seam.** Right at the load-bearing layer: auth is one thing (both `/v1/*` retrieval and `/v1/stream` sit behind the same Bee Bearer token), and A is a thin proxy whose novelty is the *hosted relay*, not the proxying. In-house precedent: the shared ~30-line bearer-token middleware across `oddkit`/`aquifer`/`truthkit` (`klappy://odd/handoffs/2026-05-16-mcp-bearer-token-middleware`).

**The seam is transport/consumer, not auth.** MCP is **pull** (turn-based tool calls). C is **push** ("respond as I speak"), and its stated consumer (session 1) is **AMS/TinCan** — subscribed agents — not the claude.ai MCP client. A thin MCP tool can *poll* (`get_new_utterances(since=cursor)`) but cannot make turn-based Claude reactive to a live feed.

**Resolved shape — one thin auth core, two egress transports:**
- **Auth core** — holds the single Bee credential, does user auth, trusts Bee's private CA, reuses the shared bearer-token middleware. Built once.
- **Egress 1 — pull / MCP retrieval connector (A)** → proxies `/v1/*` to claude.ai across all surfaces. Ships first (the all-surface wound-closer).
- **Egress 2 — push / SSE→AMS forwarder (C)** → subscribes `/v1/stream`, forwards utterances into an AMS conversation. Phase two, same core.

One codebase, one auth, two transports — not one uniform MCP surface, because MCP is the wrong pipe for C's push-to-AMS.

**Closes P1.** "One product with two modes vs two products sharing auth" → neither: **one shared auth substrate, two egress transports, two consumers** (claude.ai MCP client for pull; AMS-subscribed agents for push).

*Humility flag:* "MCP can't carry C" is really "turn-based chat can't be reactive that way, and C's consumer is AMS regardless" — the argument rests on the consumer surface, not on MCP transport minutiae (which are evolving).
