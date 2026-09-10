# Monthly allowance source debrief — 2026-09-10

Declared product: default-disabled monthly mechanics, not free-plan activation. Source inherited preserved WIP 6b9ed393 from main15d4deb6; all seven local WIP files matched its preservation manifest before edits. Independent design PASS belongs to contract c6f73829, not to this implementation.

Implemented account-owned atomic month snapshots, original-period settlement, rollback high-water protection, usage inspection independent of runtime, dynamic verified enrollment and tool-level exhaustion. No dependency, binding, secret, deployment window, paid-copy or provider change.

Observed synthetic tests exposed a calibration assumption: a small conversation is deliberately not split merely by a chunk hint. Updated the fixture to exercise the real large-result pager rather than changing correct paging behavior. Prevention: route-level calibration asserts actual returned pages and resulting units; see monthly-allowance.md.

Before final cargo, TypeScript and complete synthetic tests are run; CI and independent exact-source review are still required. Existing two live smoke skips are not hosted acceptance. No real account, grant, OTP or Bee content was used. Production and actual consumer gates remain open.

## Approval continuity correction

Required Bugbot found that first owner approval unnecessarily revoked already-enrolled users' grants. Its automatic partial7196e397 preserves the grant epoch on that transition. Independent inspection then reproduced a second issue: an older deny form shared the preserved epoch and remained actionable.

Root authorized a separate replacement branch, preserving the automatic receiver branch and partial. The correction adds independent decisionRevision freshness rather than weakening grant revocation. Every accepted owner action advances the decision revision; nonces retain target, owner, action, grant epoch and decision revision. Old opposite forms now return409. Reload coexistence, legacy nonce migration, current saved MCP access, native refresh after approval, disabled manual behavior, denial and nonrevival after reapproval have synthetic regression coverage.

Lesson bound locally: authorization-grant revocation and UI decision freshness are different clocks. Tests separately assert both boundaries. This replacement supersedes unfinished PR56 only when its own cargo exists; no provider or production action.

## Combined-tree reconciliation

After OAuth PR57 merged to main33c80b8a44385482e346b554f9da357f3b87f5da, this monthly candidate merges that actual main while retaining both histories. Provider0.10.3, OAuth migration tests/evidence and monthly revision tests/docs all remain. README includes both additions. Fresh npm ci, TypeScript clean,227 passed/two existing live skips on the combined source. New exact-head independent review, CI and Bugbot remain required; earlier separate-tree results do not substitute.
