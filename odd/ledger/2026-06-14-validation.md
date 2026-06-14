# 2026-06-14 — bee-ai-auth-mcp Validation Session: Findings Journal (E0010)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. **Mode: Validation**, run in a **fresh context** separate from the planning session that produced `PRD.md` + `docs/implementation-handoff.md` (per `klappy://canon/principles/verification-requires-fresh-context` — the creator cannot be its own critic). Reviewer: first officer. Working name during planning was `bee-mcp`.

**Disposition (whole session): ITERATE.** Methodology is clean — mode discipline held, no product code written in planning, the gate genuinely waits on the operator, the port thesis is sound borrow-discipline. But the PRD is **not ready to approve as written**: it asserts unconfirmed external facts and softens its one structural risk. Not ACCEPT (PRD needs edits before gate PASS); not PIVOT (the plan's spine survives). **Six of seven findings are operator decision-forks; this record does NOT bank them** — it leaves them Open for the author pass.

---

## Observations

**[O] Bee's documented API surface does not contain two endpoints the PRD sells.** Per Bee's public docs (`docs.bee.computer/docs/proxy`, Feb 2026): `/v1/me`, `/v1/conversations` (+`/:id`), `/v1/facts`, `/v1/todos`, `/v1/journals`, `/v1/daily`, over `Authorization: Bearer` with a required private CA cert. **Not present:** `/v1/search/conversations` (PRD claims "BM25 + neural") and `/v1/changes`. The PRD Success Criteria + Phase 2 name both as if confirmed; the "BM25 + neural" descriptor reads imported (possibly conflated with Omi's vector backend or the archived `i-am-bee/bee-api`, a different "Bee"). *Source:* docs.bee.computer, direct read. *Verifiability:* verified against public docs (live-API enumeration still owed).

**[O] The Omi pivot's central facts hold.** Omi (BasedHardware) is genuinely open hardware + software, ships a hosted MCP server exposing data to any MCP client incl. Claude, ~300K users. *Source:* omi.me/products, omi.me/blogs/integrations/mcp-claude-cursor, github.com/BasedHardware/omi (Feb–May 2026). Price: sources show **~$89 pre-order**; the challenge doc's "$129 live" is unverified (minor). The one true gap — does Omi's key-based hosted MCP register as a claude.ai **web/iOS** custom connector *without* a local proxy — remains unconfirmed. *Verifiability:* verified (open-source + MCP); reported (price); inferred-open (claude.ai-surface compat).

**[O] Confirmed-good in the plan.** Private-CA + Bearer client model is correct, not fabricated. `/v1/me` and `/v1/conversations` exist → Phase 1 `whoami` is buildable. Dependency set + the "borrow git-auth skeleton, bend three files" thesis are exactly the anti-handroll the borrow constraint wants. *Source:* docs.bee.computer + the handoff read of git-repo-auth.

## Learnings

**[L] "Custody is simpler than the ladder assumed" is Tier-1-scoped, and the PRD prose lets it leak to Tier 2.** Riding the Bee token in `workers-oauth-provider`'s encrypted grant props is genuinely elegant for **self-host** (user's own Worker/KV, blast radius = 1). For **hosted Tier 2** it is the *same central store of every user's long-lived token*; provider encryption does not change the blast radius. The pattern got simpler to *implement*; it did not get *safer*. *Mechanism:* honeypot risk scales with how many long-lived credentials sit behind one key, not with how they're serialized. *Evidence:* the 6B parity matrix already states this ("a honeypot git-repo-auth structurally is not") — the PRD's "Implementation grounding" note + ledger headline undercut their own matrix. *Applicability:* this project; general for any minting-less relay.

**[L] The Omi pivot may have hollowed the three-phase scope, and the PRD half-admits it** (the "Moot-for-operator" risk, marked *Accepted*). Of the three surviving justifications: "reusable substrate" → the substrate is git-repo-auth, which already exists (bee-mcp is an *application*); "interim wire while Omi ships" → value decays to ~0 when Omi arrives, likely before Phases 1–3 finish; "MIT community artifact" → that is the **Tier 1 template = Phase 1 only**. Two of three point at Phase-1 self-host shipped fast. *Applicability:* this project.

## Constraints (PROPOSED — not binding until operator ratifies)

**[C] (proposed) The Phase-2 tool surface must not be frozen on unconfirmed endpoints.** A Phase-0 live-API enumeration must confirm or drop `/v1/search/conversations` and `/v1/changes` before any retrieval-tool schema is committed. *Origin:* Observation above. *Scope:* until live-API enumeration is recorded.

## Opens (the decision-forks — operator's to close at the author pass)

**[O-open · P1] Phantom endpoints.** PRD asserts Bee endpoints not in public docs. *Closes by:* a live-API enumeration (cheap; Phase 0) + Success-Criteria rewrite to confirmed endpoints only. Holder: crew (check) → operator (accept edit).

**[O-open · P1] Tier 2 — cut, keep, or demote?** The hosted honeypot serves *strangers'* tokens for a product the non-goals say is *not* the operator's wire, gated on a Tier-0 petition with no ETA. The "ship both" decision predates the Omi pivot that reframed scope. *Closes by:* operator decision. Strongest case on the table = cut Tier 2 from this PRD (or demote to "build iff Tier 0 lands").

**[O-open · P1] Custody-risk framing.** PRD prose softens the Tier-2 honeypot relative to its own matrix. *Closes by:* PRD edit separating "Tier 1 implementation simplicity" from "Tier 2 custody risk." Holder: crew edit → operator accept.

**[O-open · P2] Three-phase scope vs the pivot.** Does full Phase 1–3 scope survive its own Omi reframe, or is the honest cut Phase 1 (Tier 1) fast? *Closes by:* operator decision.

**[O-open · P2] Sequencing inversion.** The decisive Omi claude.ai-connector verify-check (minutes) should be a **gate input**, not parallel Track A — per Theory of Constraints, run the work-saving check first. *Closes by:* reordering RESUME §4 next-actions.

**[O-open · P2] `<60s` magical-first-run.** Listed as a Phase-1 success criterion the paste/self-host posture cannot meet — the 6B already says Tier 0 is what restores it. *Closes by:* scoping the claim to the tier that can meet it, or dropping it as a Phase-1 gate.

**[O-open · P3] Identity drift.** Repo is `bee-ai-auth-mcp`; PRD title + frontmatter URI (`klappy://docs/products/bee-mcp/PRD`) + several docs still say `bee-mcp`. *Closes by:* find/replace + a lane-root URI decision (D0015). Cheap.

## Handoffs

**[H] Operator: the author pass now also dispositions these seven findings.** Accept / waive each; the six P1–P3 Opens are yours to resolve. *Blocked_by:* nothing — ready for review. *Owner:* operator.

**[H] Crew (on disposition): run the Phase-0 live Bee-API enumeration before any tool-surface freeze**, then apply accepted PRD edits, then re-run the planning→execution gate. *Blocked_by:* operator author pass. *Owner:* next crew session.

## Encode

**[E] This validation was encoded via `oddkit_encode`** (fresh context, governance source = knowledge_base) and persisted to this file. Quality note: the encode pass confirmed the DOLCHEO field schemas; entries above were hand-authored per type rather than taken from the tool's single-blob output.
