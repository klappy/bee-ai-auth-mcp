# 2026-06-14 — Session Journal: Validation → Challenge → Phase-1 Gate (E0010)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. Fresh-context review session that took the planning corpus through validation, a frame-level challenge, prior-art research, and the planning→execution gate for Phase 1. Companions: `odd/ledger/2026-06-14-validation.md` (the findings record) and `docs/phase-1-execution-handoff.md` (the execution contract). Working name during planning: `bee-mcp`; repo is `bee-ai-auth-mcp`.

## Decisions

**[D] Phase 1 = Model A (deployer-key self-host), Tier 1 only.** The deployer's Bee token is the Worker's own secret; the relay does not custody other users' tokens in Phase 1. Rationale: the closest prior art (`mcp-limitless`) does exactly this, and it dissolves the credential-capture problem for self-host. *Alternatives:* per-user custody from day one (rejected — that's Tier 2's honeypot); direct-key-as-connection (kept as the Model B on-ramp for non-Claude clients). *Reversibility:* high.

**[D] Gate PASS planning→execution for the Phase-1 *spine*** (scaffold + OAuth + whoami shape + deploy skeleton). The Bee-client slice is gated separately on the private-CA reachability check. Required prereqs 4/4 met once the execution contract was written down.

**[D] Two challenge cuts withdrawn after operator cross-check.** "Reusable substrate → extract instead of build" (cut #1) contradicted `klappy://docs/explorations/credential-relay-as-product` (build reusable regardless; extraction deferred — pattern-first). "Build = weeks" (cut #2) was killed by the git-repo-auth datapoint (shipped with payments in 8–12h; Phase 1 is a port ≈ a day). The full-PRD-doesn't-survive conclusion was overstated; Phase 1/Tier 1 is endorsed.

**[D] `honest` + `safest` ratified as the two binding constraints** over the custody surface (operator). See Constraints.

## Observations

**[O] Bee's documented API surface omits two endpoints the PRD sold.** Per `docs.bee.computer` (Feb 2026): `/v1/me`, `/v1/conversations`(+`/:id`), `/v1/facts`, `/v1/todos`, `/v1/journals`, `/v1/daily`, Bearer auth, private CA required for the direct API. **Absent:** `/v1/search/conversations` (PRD's "BM25+neural") and `/v1/changes`. *Verifiability:* verified against public docs.

**[O] Omi pivot facts hold.** Open-source HW+SW, hosted MCP to any MCP client incl. Claude, ~300K users; ~$89 pre-order (the "$129 live" figure unverified). claude.ai-web/iOS connector compat still the one open Track-A check. *Verifiability:* verified (OSS+MCP); reported (price).

**[O] Cloudflare Workers `fetch` trusts only publicly-trusted CAs.** Trusting a private CA outbound needs Workers VPC (Origin-CA, shipped 2026-02), container HTTPS-interception, or BYO mTLS — not a `--cacert` port of bee-cli. *Verifiability:* verified against CF docs.

**[O] Sandbox cert probe was inconclusive.** Probing Bee hosts from the build container returned `O=Anthropic, CN=Egress Gateway` — the egress proxy terminates TLS and masks Bee's origin cert. The reachability check must run from a non-proxied environment. *Verifiability:* verified (the proxy artifact is the observation).

**[O] `workers-oauth-provider` encrypts grant props with the secret token as key material;** a storage-only leak reveals only metadata. *Source:* cloudflare/workers-oauth-provider README. This narrows the Tier-2 honeypot to runtime/live-token compromise, not a KV dump.

**[O] Closest external analog avoids custody.** `mcp-limitless` runs the upstream key as a Cloudflare secret (deployer-key) + GitHub OAuth as the gate — i.e., bee-mcp's Tier 1. Per-user custody of a pendant bearer is done by no one in the niche. *Source:* GitHub/LobeHub.

## Learnings

**[L] Validation, challenge, and substance-review are three different altitudes, and I cycled them in the wrong order.** I led with strategy/premise (should it exist, which tier), fact-checked inputs, and only reached the engineering substance (auth-capture flow, revocation semantics, token leak, TLS feasibility) after the operator pushed twice. *Mechanism:* premise-challenge is the comfortable altitude; reading the design like an implementer is the load-bearing one. *Applicability:* general — a fresh-context validator should lead with the substance a 3am page would expose. *Evidence:* this session's turn sequence.

**[L] The CF upstream-credential abstraction engages only when the upstream speaks OAuth — so the custody gap IS the Tier-0 gap.** `workers-oauth-provider` + the "MCP server as OAuth client to upstream" pattern (and CF One MCP Portals) handle upstream auth when there's an authorization server to delegate to. Bee has none, so the bespoke hold-the-key is forced. When Bee ships OAuth, the bespoke custody is deleted and dropped onto CF's managed path. *Applicability:* reframes Tier-0 from "nice-to-have" to "the thing that removes the honeypot." *Evidence:* CF Agents/One docs.

**[L] Custody "simplicity" was Tier-1-scoped; the honeypot is Tier-2-only and is runtime-compromise-shaped, not storage-shaped** (given token-derived prop encryption). The PRD prose had softened this relative to its own parity matrix.

## Constraints

**[C] `safest`:** the Bee bearer MUST NOT appear in logs, URLs, error payloads, or any client-visible output; error paths MUST NOT serialize the Bee request/headers or raw upstream response. *Origin:* finding S2 (borrowed git-auth "rich error payloads" are safe with minted tokens, dangerous with a held bearer). *Scope:* permanent, all tiers.

**[C] `honest`:** no security property may be claimed that the system does not deliver — revocation wording, the parity matrix (per-grant token-derived encryption, NOT KMS), and first-run copy MUST state what is true. *Origin:* operator, this session. *Scope:* permanent.

**[C] Revocation honesty:** disconnect deletes the relay's copy of the token; full revocation = the user rotates the bearer at Bee. A helper MUST link to Bee's token page. The borrowed git-auth "revocable by you" wording MUST NOT be imported unchanged. *Origin:* finding #1 (ratified). *Scope:* permanent.

**[C] Private-CA reachability tripwire:** the Bee-client slice MUST NOT be locked until Worker→Bee reachability is confirmed (public cert, or Workers VPC/mTLS). If unreachable by those, REVERT to a planning micro-decision on the network path. *Scope:* until retired.

**[C] Do not freeze the Phase-2 tool surface on unconfirmed endpoints** (`/v1/search/conversations`, `/v1/changes`). Confirm-or-drop via live-API enumeration first. *Origin:* finding 1. *Scope:* until enumeration recorded.

## Opens

**[O-open · P1] Worker→Bee private-CA reachability.** *Closes by:* operator runs the cert-issuer check from a non-proxied environment (or a Workers VPC probe). Gates the Bee-client slice only.

**[O-open · P2] Tier-2 cut/keep/demote.** Unchanged from validation; the hosted honeypot decision, reframed by the CF/Tier-0 learning. *Closes by:* operator decision.

**[O-open · P3] PRD canonical URI.** Updated display name to `bee-ai-auth-mcp`; the lane-root URI change is a D0015 call left to the operator. *Closes by:* operator ruling.

## Handoffs

**[H] Phase-1 spine is in execution.** Next crew action: ground the port against `klappy/git-repo-auth-mcp` source (read-only mint → clone → read), then scaffold → OAuth → whoami → Tier-1 deploy skeleton. *Blocked_by:* nothing (spine). *Owner:* next crew session.

**[H] Reachability check is the operator's parallel task** — it un-gates or reverts the Bee-client slice. *Owner:* operator.

## Encode

**[E] E0010 debrief — my faults this session, no blame, into canon:** (1) asserted "build = weeks" with zero evidence — a textbook `agent-fault-assertion-without-verification`, caught by the operator's 8–12h datapoint; (2) cycled premise-challenge before substance-review; (3) accepted a gate PASS for the wrong transition (exploration→planning) before re-running the correct planning→execution gate. All three are recorded so the next session leads with substance, verifies durations, and checks the gate's `from/to` before trusting its verdict.
