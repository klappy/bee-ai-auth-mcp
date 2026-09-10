# Monthly allowance source debrief — 2026-09-10

Declared product: default-disabled monthly mechanics, not free-plan activation. Source inherited preserved WIP 6b9ed393 from main15d4deb6; all seven local WIP files matched its preservation manifest before edits. Independent design PASS belongs to contract c6f73829, not to this implementation.

Implemented account-owned atomic month snapshots, original-period settlement, rollback high-water protection, usage inspection independent of runtime, dynamic verified enrollment and tool-level exhaustion. No dependency, binding, secret, deployment window, paid-copy or provider change.

Observed synthetic tests exposed a calibration assumption: a small conversation is deliberately not split merely by a chunk hint. Updated the fixture to exercise the real large-result pager rather than changing correct paging behavior. Prevention: route-level calibration asserts actual returned pages and resulting units; see monthly-allowance.md.

Before final cargo, TypeScript and complete synthetic tests are run; CI and independent exact-source review are still required. Existing two live smoke skips are not hosted acceptance. No real account, grant, OTP or Bee content was used. Production and actual consumer gates remain open.
