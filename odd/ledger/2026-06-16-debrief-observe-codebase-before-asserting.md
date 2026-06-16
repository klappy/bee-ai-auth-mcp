# 2026-06-16 — bee-ai-auth-mcp: Debrief — Observe the Codebase Before Asserting (DRAFT — encode # for operator to assign)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. A debrief + consolidation entry from a fresh-context exploration turn that re-raised the "run the Bee CLI/MCP on a per-user container" idea and the "docs + api + skill" Phase-2 shape. Observed server_time `2026-06-16T05:13Z` UTC; civil date 2026-06-16 (operator tz observed as −0400/EDT from this repo's git-log commit metadata, not inferred). Continuous chat session; full verbatim detail in the operator's transcripts. **No operator decisions were banked this turn — this records observations, a process learning, and a constraint. D/E numbers are for the operator to assign on accept.**

## Observations

**[O] The re-raised "CLI/MCP on a per-user container" proposal is already subsumed by two prior rulings — no new analysis needed.**
- **D0022 (E0012)** rejects per-user containers by name: they isolate egress (the wrong layer), explode cost/lifecycle, break one-person maintainability, and do not close the in-flight plaintext window while the relay is the shared component. Isolation is cryptographic per-grant.
- The **6B borrow-eval** (`planning/planning-6b.md`) already ran Bee's official CLI/MCP through **Bide → inspected-and-rejected** as the *delivery mechanism* on the **foundational-gap** criterion (local-stdio, HTTP pinned to `127.0.0.1`; never reaches claude.ai / iOS / Cowork). Running it on a container relocates the localhost-only server and forces a bridge to it anyway — recreating the remote-MCP problem, plus a stateful per-user CLI.
- The proposal's stated motivation ("so we don't reverse-engineer the API") is moot: `src/bee.ts` forwards Bee's documented `/v1/*` raw through the private-CA bridge with the user's own token. Nothing is reverse-engineered.

**[O] The operator's QR instinct is sound — and is the already-scoped laptop-free auth path, which needs no container.** Per `docs/connecting-and-getting-your-bee-token.md`: the relay itself can be the Bee app-pairing caller (consent page renders the QR → approve in the Bee app → relay polls, decrypts the tweetnacl-box token in pure JS, binds it into the encrypted grant). Source-read + live-probed. **Sole blocker: the pairing `POST` requires a Bee-registered `app_id`** (probe: invented id → `app_not_found`/404; the CLI's id → `pending`/200). The Worker cannot mint its own. The container path is, in effect, an expensive and ToS-risky way to borrow the CLI's registered `app_id`; the clean path is to obtain our own `app_id`, which also sharpens the Tier-0 petition.

**[O] Token *use* is already laptop-free and validated (E0019); token *acquisition* is the remaining gap.** `whoami` returns the operator's Bee identity through the bridge, green on mobile from a fresh context. The relay-as-pairing-caller is precisely what would make acquisition laptop-free too.

**[O] The "docs + api, raw passthrough, just two tools" shape is half-aligned with the plan.** The `docs` tool (git-auth pattern) is in-plan and seeding it from the proxy/skill docs is right. But the API leg in the repo is **scoped read-only retrieval tools**, not a raw `/v1/*` passthrough: read-only-by-default is a load-bearing line in the git-auth parity matrix, and a raw passthrough would re-expose Bee's write endpoints and bypass confirm-or-drop. The surface is not frozen — `/v1/changes` + `/v1/search/conversations` are docs-confirmed but still owe live-API enumeration (E0012 O-note).

**[O] A skill is the wrong layer for a remote connector (RESUME §4.3), structurally.** A skill (`npx skills add …`) is a *client-side install* — the exact local-install friction the connector exists to remove. The remote-native equivalent of skill knowledge is the docs tool + rich tool descriptions + optional MCP prompts/resources, which travel the wire with zero install. "Full parity with the local MCP" is not the goal; the residual parity gaps (short-lived tokens, upstream-enforced scope, "never touch a credential") trace to one missing Bee primitive and resolve only via Tier-0 — neither docs nor a skill can close them.

## Learnings

**[L] The agent asserted from vendor docs + stale memory and skipped the repo's own record — across three correction cycles before reading the manual.** The first response raised the private-CA "wrinkle," recommended forking the skill, proposed a raw two-tool passthrough, and floated per-user containers — every one already resolved or rejected in `RESUME.md`, `odd/ledger/`, `planning/`, and the PRD. `RESUME.md`'s "START HERE" is the designed fresh-context entry point and already answered the question; it went unread until the third rebuke. The cost was paid in operator attention — the system bottleneck.

**[L] This violated an *existing* canon principle, not a missing one.** `klappy://canon/principles/code-claims-require-code-observation` already binds claims about the built artifact to observation of it. The failure was reading that principle narrowly ("code claims") while spitballing architecture freely; its spirit covers any assertion about what the project is or has already decided.

## Constraints

**[C] Codebase before vendor docs; codebase before memory.** Before raising any architecture concern or proposal on a project with a repo, read its entry point (`RESUME`) and the relevant `odd/ledger/` + PRD first. Vendor docs describe the upstream; they do not describe what *this* project already decided.

**[C] Memory is a lead, not a source.** Provided memory may be stale (here it lagged several encodes behind `main` — it reported a v0.1 bootstrap tree against a v0.4, E0019-validated reality). Reconcile it against the repo before relying on it; a memory note is a pointer to verify, never a fact to assert.

## Milestone (Encode)

**[E00xx — operator to assign] The CLI-on-container question is closed by existing rulings; the laptop-free auth path is the relay-as-pairing-caller, gated solely on a Bee `app_id`; and the agent's observe-before-asserting failure is recorded against existing canon.** No new architecture decision was required — the value of the turn was consolidation + debrief, both grounded in the repo.

## Opens (not banked)

- **[O-open · parallel] Bee `app_id` registration for the relay** — converts the QR pairing-caller from buildable-but-blocked to shippable; sharpens the Tier-0 petition from "please add OAuth" to "you already ship app-pairing — register an `app_id` for this relay." Vendor-dependent.
- **[O-open · Phase 2] Live-API enumeration of `/v1/changes` + `/v1/search/conversations`** before freezing any tool surface (carried from E0012).
- **[O-open · canon] Propose extending `code-claims-require-code-observation`** (or a sibling) to explicitly cover architecture/exploration assertions, not only code claims — pending operator review of this debrief.
