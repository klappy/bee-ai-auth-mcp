# 2026-06-16 — bee-ai-auth-mcp: Phase 2 read surface designed, built, and merged (E0020)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. Continuous chat session. Observed server_time `2026-06-16T21:13Z` UTC; civil date 2026-06-16 (operator tz −0400/EDT, observed from this repo's git-log metadata, not inferred). IDs continue from the observed high-water on `main` (E0019 / D0032). Full verbatim detail lives in the operator's transcripts.

## Decisions

**[D0033] Phase-2 6B accepted** by the operator as-is (`planning/phase2-6b.md`). Clears the implementation gate.

**[D0034] Phase-2 tool surface = `bee_docs` + a single `bee_read` method-split passthrough.** Not per-endpoint tools, not a separate `bee_search`. `bee_read` issues **GET** to any `/v1/*` path and **POST only** to the allow-listed `/v1/search/*` (Bee search is POST but non-mutating). Read-only **by construction** — it never issues a mutating verb. Operator ruling: "err on the side of fewer tools with good docs." `bee_write` (POST/PUT/PATCH/DELETE) is specced and deferred to the write phase.

**[D0035] `app_id` reframed — not a Phase-2 blocker.** A Bee-registered `app_id` is required only by the relay-native, no-CLI pairing variant, and only matters for a **public / multi-tenant** relay. The validated acquisition path is CLI-assisted (user runs `bee login --qr`, pastes the token); it needs no `app_id` from us, and for single-tenant (operator-only) use the question is moot. A **CLI-broker** option (run the real CLI server-side, no registration, not the per-user data-plane container D0022 rejected) is recorded as a registration-free middle. `app_id` registration = Phase-3 vendor ask. (Corrects the earlier "app_id is the blocker" framing in PRD §2.4 + the connect doc.)

**[D0036] Commit attribution.** `oddie@users.noreply.github.com` resolves to a *different, real* GitHub user — our automated commits were crediting a stranger. Future commits use a non-colliding identity (operator to confirm preferred `Name <email>`). `main`'s existing mis-attributed commits are left as-is: rewriting history on a deployed branch is not worth an attribution cosmetic.

## Observations

**[O] Bee's search endpoints are POST, not GET** (`/v1/search/conversations`, `/v1/search/conversations/neural`) — surfaced by grounding the API-usage doc in Bee's live proxy docs (last updated 2026-06-07). This drove D0034's "GET + POST-to-`/v1/search/*` only" rule; a naïve GET-only `bee_read` would have silently dropped search, the most valuable retrieval capability.

**[O] `bee_read` is `whoami` generalized.** The Phase-1 transport (bound private-CA bridge + per-grant `beeToken`, custody E0012/E0014) already does the hard part; the read tool is a small generalization of `beeGetMe` to a caller-supplied path. `bee_docs` serves the project-authored `docs/bee-api-usage.md`, embedded at build via `scripts/gen-bee-docs.mjs` (Workers has no filesystem access to `docs/`).

**[O] Shipped to `main` this session:** PRD v0.5 (Phase 2 spec, docs-first), the `bee_read`/`bee_write` split, the `app_id` reframe, and the Phase-2 read-surface implementation (`bee_docs` + `bee_read`). `tsc --noEmit` clean. Runtime/phone validation still pending.

## Learnings

**[L] Verify the artifact, not the announcement.** A collaborator's self-reported "done"/✅ (the PRD-restore commits) was **twice** false against the file — net-deletive, Phase 1 gutted — while the commit message claimed "net-additive." Running the operator's own acceptance check against the file caught it both times. A claim is a debt; the file is the evidence, the commit message is not.

**[L] Codebase before docs, codebase before memory** (reinforced; first debriefed in `2026-06-16-debrief-observe-codebase-before-asserting.md`). The session's early friction was reasoning on vendor docs + stale memory instead of reading `main`.

**[L] Commit-author email can silently credit a third party.** Identity must be checked against real-account resolution, not assumed (D0036).

## Constraints (going forward)

**[C]** Never commit with an email that resolves to a third-party GitHub account.

**[C]** Treat "done" as unproven until checked against the file/artifact and the captain's acceptance criteria.

**[C]** Links to the operator are clickable markdown, never bare URLs.

## Milestone (Encode)

**[E0020]** Phase 2 read surface: designed → specced (PRD v0.5) → built (`bee_docs` + `bee_read`, typecheck-clean) → merged to `main`, with `app_id` correctly reframed off the Phase-2 critical path. The build sat almost entirely on borrowed/bent Phase-1 infrastructure (per the accepted Phase-2 6B); the only net-new *content* was the API-usage doc.

## Opens (not yet closed)

- **Runtime/phone validation** of `bee_docs` + `bee_read` (release-validation-gate, fresh context): `bee_docs` returns the reference; `bee_read /v1/me` matches `whoami`; `bee_read /v1/conversations` lists; `bee_read /v1/search/conversations` (POST `search`) returns hits. *Compile-checked only — "merged" ≠ "runs."*
- **Phase-1 DoD tail:** three-pass re-run, second-login-denial demo, no-token-in-logs audit.
- **Doc tidy:** `docs/bee-api-usage.md` still labels search-handling "pending operator ruling" → flip to settled (D0034, option 1).
- **`bee_write`** — write phase, deferred.
- **`app_id` registration** — Phase-3 vendor ask (public/multi-tenant only).
- **Commit identity** — operator to confirm the preferred `Name <email>`.
