# B Integration — Terrain Map & Synthesis Ledger

**Date:** 2026-06-14
**Mode:** Exploration (Double Diamond — Diamond 1, converging Discover → Define)
**Source:** Three voice-dump sessions, 2026-06-12 (B AI Integration; Second-brain transcription; Unified AI workflow)
**Status:** Insight stabilized, no commitment. This is a Diamond-1 convergence artifact, not a plan.
**Repo note:** No `bee-mcp` repo exists yet on GitHub. The `*-mcp` naming pattern is established (aquifer-mcp, ptxprint-mcp, transcode-mcp, appbuilder-mcp, translation-helps-mcp, git-repo-auth-mcp).

---

## 1. DOLCHEO Encodings

### Decisions
- **D1 — Sequence.** Build the retrieval/search B-API MCP connector for Claude *first*, modeled on the existing GitHub connector's OAuth token pattern. Streaming is phase two, and likely a different surface (Cloudflare pipeline + AMS) rather than the same MCP server. *(strong)*

### Observations (closed)
- **O1.** Copying and pasting B transcripts is one of the last remaining manual rituals in an otherwise heavily-augmented workflow. GitHub read/write, Cloudflare deploys, and Stripe are integrated; the human acting as a message bus between capture and AI is the lone holdout. *(strong)*
- **O2.** B's native organization is too flat — conversations indexed by date and occasionally by meeting, with no topical or project structure. *(strong)*

### Learnings
- **L1 — Operator-as-relay is the smell.** Any time the human is the message bus copying context between systems, that is a ritual with a smell. Data flow has always been automatable; the human-as-relay is the anti-pattern. This is the same problem ODD already named for agent-to-agent communication — the human cannot be the wire. (See `klappy://canon/principles/agents-need-their-own-wire`.) *(strong)*

### Constraints
- **C1 — Build only what hurts.** The real-time streaming future is deferred; the copy-paste present is the active wound. Building streaming first would violate the operator's own architectural principle. *(adequate — make explicit: nothing past the wire ships until the wire ships)*
- **C2 — Security-first, opt-in.** Mirror the GitHub MCP connector's token model: the MCP server manages tokens on behalf of the OAuth-authenticated user, errs toward least access, widens scope only on explicit opt-in. *(adequate)*
- **C3 — Personal/business boundary.** The B is used for both private brain-dumps and professional meetings. Transcripts cannot all route to the same destination by default; the system needs organization plus a promotion step. Reality of usage, not an assumption. *(adequate)*
- **C4 — Wearable + pipelines, not phone + stacks.** Prefer a dedicated wearable with a visible recording indicator over the phone (social transparency). Build pipelines that feed existing stacks; do not reinvent stacks. *(adequate)*

### Opens
- **P1.** Two distinct-but-related products surfaced: (1) a retrieval/archive MCP that eliminates copy-paste, and (2) a real-time streaming integration where B joins agent conversations via AMS/TinCan. Are these one product with two modes, or two products sharing an auth substrate?
- **P2.** B's transcription is weaker than iOS/Whisper/ChatGPT — misspells names, acronyms, custom vocab. Where does the normalization pass live — connector, pipeline, or downstream service?
- **P3.** Desired retrieval outputs: conversations auto-organized and correlated to a Claude project or mapped GitHub repo; compressed memory encodings, not full transcripts; sensitivity passes before write; storage split R2/GitHub by sensitivity. What is the correlation key between a B conversation and a project?
- **P4.** Downstream product: a source-agnostic transcription-ingestion + knowledge-extraction service. Multi-pass — extract, then "epistemic surface extraction" for hidden relationships/conflicts/tensions. B is "door number one," not the dependency.
- **P5.** Unified capture-to-action vision: voice + whiteboard photos + ReMarkable→Claude sync + calendar/task automation feeding one system. Verbal routing ("join TinCan room [ID]") needs a routing layer.
- **P6.** Risk: Apple Intelligence, if it delivers, could obsolete parts of the unified-workflow vision. Which parts are durable regardless, and which are bets against Apple shipping?

---

## 2. First-Principles Reduction

Strip the three sessions to irreducibles. B is not the thing — B is a *capture device*. The workflow it sits in is a pipeline of seven stages:

1. **Capture** — verbal thought → text. *(B does this today.)*
2. **Transport** — text → somewhere AI can act on it. *(MANUAL. This is the wound — the human is the wire.)*
3. **Normalize** — fix transcription errors, project vocab. *(gap)*
4. **Organize** — route to the right project; personal vs business. *(gap)*
5. **Encode** — compress to durable memory, not raw transcript. *(gap)*
6. **Retrieve** — search past conversations. *(desired)*
7. **Act** — generate artifacts, react in real time. *(the dream)*

**The reduction:** Only stage 2 hurts today. Everything else is either already handled (stage 1) or a capability layered on top (stages 3–7). The flat organization, the transcription errors, the streaming dream, the second brain — all real, none of them the wound. The wound is that *the operator is the transport layer between his own mouth and his own AI.*

That reduction is the same one ODD already made about agents (L1 / `agents-need-their-own-wire`). This isn't a new problem. It's the relay anti-pattern wearing a transcription costume.

---

## 3. The Terrain — Full Problem Space (the dream house, before cutting)

Per the Dream House Principle, draw the whole thing before cutting. Three products live here, and the sessions blur them. First principles separate them by *physics*, not by feature:

| | **A. The Wire** | **B. The Refinery** | **C. The Live Wire** |
|---|---|---|---|
| What | B data → retrievable in Claude | Multi-pass knowledge extraction | B joins agent convos in real time |
| Kills | Copy-paste (the wound) | Flat organization, lost insight | Turn-by-turn latency |
| Physics | Synchronous, request/response | Async, batch pipeline | Streaming, web-socket, routed |
| Surface | MCP connector | Cloudflare pipeline + KB | AMS / TinCan + routing layer |
| Source | B-specific | Source-agnostic (B, Zoom, any) | B-specific |
| Session | 1 (primary) | 2 | 1 + 3 |
| Maps to | Stages 2, 6 | Stages 3, 4, 5 | Stage 7 |

**The dependency order the terrain reveals:** A → B, with C parallel/later.
- **B consumes what A retrieves.** The refinery can't refine what it can't reach. A is upstream of B.
- **C is a different river entirely** — streaming physics, a routing layer, AMS. The captain already cut it ("build only what hurts"). It stays on the bank.

---

## 4. The Single Cut

If only one thing ships, it is **A — The Wire**: an authenticated B-API MCP connector that makes B conversations searchable and retrievable inside Claude, killing copy-paste.

Two findings sharpen the cut:

- **A is the shared substrate.** B and C both need exactly what A needs first: authenticated programmatic access to B's data. This answers **P1** from the terrain's side — it reads less like "one product vs two" and more like *one auth substrate, multiple consumers.* Build the substrate once; let the refinery and the live wire draw from it. The GitHub connector / credential-relay pattern (`klappy://docs/explorations/credential-relay-as-product`) is the reference.
- **Normalization wants to live near the source.** On **P2**: all three consumers need clean text. If the normalization pass lives in or right behind the connector (A), B and C inherit it free. If it lives downstream, each consumer re-solves it. Terrain says push it toward the source — observation, not instruction.

On **P6** (Apple risk): the durable bets are A and B — they're about *your specific data in your specific stack*, which Apple won't touch. The exposed bet is the generic smart-assistant layer in session 3. The wire is Apple-proof.

---

## 5. Forks the Terrain Can't Resolve (convergence questions for the captain)

These are genuine — canon doesn't answer them, and they change the shape of A:

1. **Does B's API actually expose what the wire needs?** The whole cut assumes B has an authenticated search/retrieval endpoint usable by a third-party MCP. That's a claim, not a verified fact. Diamond 2 cannot open until it's confirmed.
2. **Correlation key (P3).** What ties a B conversation to a project — a verbal tag spoken into the recording? A post-hoc classifier pass? A manual promotion step (which C3 already implies you want)? This is the single biggest design fork in A.
3. **Retrieve raw or retrieve refined?** Does the *first* version of A hand back transcripts (thin, fast, ships sooner) or compressed encodings (richer, but that's arguably product B leaking into A)? The thin cut is more honest to "build only what hurts."

---

## 6. Gates Ahead (not now — flagged for Diamond 2)

- **Borrow-evaluation gate** (`klappy://canon/constraints/borrow-evaluation-before-implementation`): B API, AMS, the connector pattern are all upstream substrates. Before *any* implementation, the six-row 6B evaluation is binding. The constraint exists because the same handroll has happened six times across six MCP servers — don't be the seventh.
- **Release-validation gate** (`klappy://canon/constraints/release-validation-gate`): applies before merging any PR to an oddkit-pattern MCP server.
- **Magical first-run** (`klappy://canon/principles/magical-first-run`): if A ships as an installable connector, a non-technical operator must reach useful retrieval in under sixty seconds.

---

## 7. Driftwood
- `klappy://docs/synthesis-ledger` surfaced in search but returns NOT_FOUND on `get` — a moved or dead URI. Flagged, not chased. The Double Diamond mapping carried the format instead.
