## Corrected replacement acceptance — 2026-09-10 12:15 EDT

Disposition: PASS — scoped source acceptance restored for PR58 exact head3cb3a26003fc3fb9f2507303c864b256465649ca only. Earlier blocked heads and findings remain historical below.

Independently fetched and byte-compared all15 changed files against the frozen clean review directory bee-monthly-repair-86o6LG; all match remote. Core quota/MCP/staging/signup/type blobs preserve the previously reviewed implementation. Separate decisionRevision now invalidates prior owner-action nonces without unnecessarily rotating active grant epoch. Missing revision fields default to zero for existing records/nonces; every accepted owner action advances decision freshness. Denial/reapproval still rotates grant epoch.

Independent exact-source executable probe now returns {approve:true, staleDeny:false, status:approved, epoch:0, decisionRevision:1}. The original stale deny reproducer is closed. Actual admin-handler regression observes303 approval,409 old denial, saved MCP grant200 after approval and flag-off, then403 after denial and after reapproval. Native provider regression issues token before first self-service approval and successfully refreshes afterward; subsequent denial and reapproval reject stale refresh. Reload coexistence, legacy nonce shape, repeated status, owner/target/status/expiry/replay cases remain covered.

Independently executed clean TypeScript and full suite: exit0, 218 passed/two existing live-smoke skips (24 files passed/one skipped). No real users, provider writes or authoring by reviewer.

Current-head CI/Bugbot and staging readback still required. OAuth PR57 is independent; whichever branch lands second requires combined-tree regression and updated-head acceptance. No quota activation, runtime extension, hosted consumer acceptance or production promotion is implied.

## AutoFix delta review — 2026-09-10

Disposition: ITERATE — head7196e397e0973e3566177334c5cf696562f9bdd6 remains unsuitable for merge.

Fetched exact admission.ts blob19d97f6a1ecbf61b647b04c7572e405119286616 and new admission regression. AutoFix preserves grant epoch for enrolled pending-to-approved, correcting the original disconnect. However, decision nonces still bind only the unchanged epoch.

Independent executable probe bundled the exact remote source in memory with synthetic state: enroll; render both approve/deny nonces; approve; submit the old deny nonce. Observed {approve:true, epochAfterApprove:0, staleDeny:true, status:denied, epoch:1}. Expected stale deny rejection. Prior admin stale/opposite-action defense is therefore regressed.

Required bounded correction: invalidate prior decision-page actions independently of grant epoch when status changes, while preserving reload coexistence, exact target/status/owner binding, expiry and replay defenses. Add regression for enrolled pending approval followed by stale deny; retain approval continuity and denial/reapproval grant invalidation tests. Reviewer did not edit source or mutate provider resources.

## Superseding finding — 2026-09-10 12:04 EDT

Disposition: ITERATE — prior source PASS withdrawn for merge pending correction and fresh review.

Independent triage confirms Bugbot comment3981039676 against head18eacfc2. Executed actual admissionTransition with synthetic in-memory state: enroll creates pending selfServiceEnrolled=true epoch0; owner approval succeeds and advances epoch to1. Existing grants retain epoch0; native token refresh and MCP admission require exact epoch. Thus approving an already permitted self-service account disconnects it.

Required correction: privilege-preserving approval must preserve working self-service grant validity; denial must still invalidate immediately, and reapproval must never revive pre-denial grants. Preserve existing stale/opposite admin-form rejection: current nonces also bind this epoch, so separating authorization validity from decision revision may require narrow nonce-state handling. Regression must cover approval continuity, denial/reapproval invalidation and stale opposite forms. No new product feature is requested.

The prior214-test success remains an observed result, but lacked this case. Automatic external receiver bc-f1cc00f5-6f0a-40f6-9745-011b038cff40 was reported by Auggie; reviewer did not dispatch it or observe its implementation. No source edits or provider writes performed.

## Final-head acceptance — 2026-09-10 11:56:42 EDT

PASS rebound to exact head 18eacfc2f5e582b029db60bb4209ff28727a2b03. Independently fetched both changed tests at old and new immutable heads: only two test titles and one two-line comment changed, correcting the evidence-precision notes below. No behavior/assertion changes. Final test blobs: quota-integration4433bfbb8f5edec0d47a7bddcf82236e534466ac and staging-signup1f8e02640303a86e8c533f9ee61fd64b5f23634d.

Independently reran TypeScript and complete suite in the updated clean snapshot at 11:56 EDT: exit0, 214 passed/two existing live-smoke skips. All scope limits and remaining external gates below remain unchanged. This amendment supersedes the earlier head binding, not its observed review history.

# Independent monthly quota source review

Disposition: PASS — scoped source and synthetic test acceptance.
Observed: 2026-09-10T15:55:14.290Z (11:55:14 EDT).
Reviewer: independent reviewer under Auggie monthly finish; no source authoring.
Product PR56: https://github.com/klappy/bee-ai-auth-mcp/pull/56
Exact head: e09cc31edb9af60f3b8e08615921fee3a4db1827.
Contract: v1.1, blob c6f738291310d5070082e3f8170b052f63709f91.

## Evidence

All fourteen changed cargo files were independently fetched at the immutable head and compared byte-for-byte with the local review files; every comparison matched. Read the complete quota transition implementation, admission/enrollment changes, staging DO transaction and token callback, actual MCP handler wiring, signup views, source order, docs/debrief and new/modified tests.

Independently ran npm run typecheck and npm test in the working source: exit0, 214 passed, two existing live-smoke skips. Repeated both commands in the cook-provided clean snapshot bee-monthly-clean-w8InW9: exit0, 24 test files passed/one skipped, 214 tests passed/two skipped. Clean snapshot provenance (all135 tracked blobs matching this head) is the cook's separately reported receipt; this reviewer independently verified all changed files and executed the clean suite, not the entire135-file remote tree.

No blocking source findings:
- Atomic DO transactions resolve stable server-owned admission IDs and separate account usage from grants.
- Snapshotted monthly limits survive policy changes and toggles; highest-month marker prevents rollback recreation.
- Original-period reservation settlement handles renewal; terminal commit/refund cannot reverse, expired reservations cannot release data, and admission/epoch is rechecked.
- Successful read/page charging and failed-read refunds wrap the actual Bee read path.
- Enabled signup preserves manual pending status while deriving eligibility, and disabled rollback restores manual decisions.
- Usage/docs bypass the operational runtime guard while expensive tools retain it.
- Exhaustion returns an application result with renewal time, not an OAuth or grant mutation.
- No provider config, default allowance, dependencies, billing, referrals or production deployment changes occur in this diff.

## Evidence precision and residual gates

Two nonblocking test-description limitations: the native-refresh test proves token refresh consults admission only, but does not itself create exhausted quota state; the last-credit test reuses a bridge object despite mentioning recreation in its title. The separate quota transition/route tests cover exhaustion and stable account storage. Do not upgrade these tests into restart/hosted claims.

MCP SDK dispatch and transport are mocked in the route integration fixture, while actual handlers, Bee paging and DO transaction methods execute against synthetic transport/storage. The native OAuth-provider tests execute actual provider PKCE/token/refresh logic with synthetic upstream approval. This is not a hosted end-to-end or actual ChatGPT installation verdict.

Current-head CI and required Bugbot must independently finish before merge. Staging build and deployed-version/provider readback remain after merge. Feature activation, numeric allowance, runtime extension, referral budget/rewards, public copy and production promotion remain separately gated. No real identities, credentials or Bee content were used; no provider writes or source edits performed by reviewer.
