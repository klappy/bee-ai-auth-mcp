# Monthly self-service allowance

Implementation contract: kitchen auth ticket, SELF-SERVICE-QUOTA-AMENDMENT-2026-09-10.md v1.1, blob c6f738291310d5070082e3f8170b052f63709f91. This is disabled mechanics, not an announced free plan, price or activation.

## Policy and accounting

Only the literal `SELF_SERVICE_ENABLED=true` opts in. A positive safe-integer `SELF_SERVICE_READ_LIMIT` and nonempty identifier `SELF_SERVICE_POLICY_VERSION` are also mandatory. There is no numeric default. Enabled malformed configuration fails closed. Provider activation requires its own approved amount and configuration action; this PR changes no provider configuration.

Verified email signup dynamically enrolls an account without marking it manually approved. Existing manual approvals are metered too; explicit denials and stale admission epochs remain blocked. Disable restores manual eligibility without deleting accounting or changing decisions. The existing GitHub-only self-host path is unchanged and is not mapped into an email account.

First owner approval of an already-enrolled pending account preserves its grant epoch: existing self-service connections and refresh remain valid. Denial and reapproval still advance the revocation epoch so old grants cannot revive. Owner forms use an independent decision revision; every accepted decision invalidates older opposite-action forms even when the grant epoch does not change. Reloaded forms coexist until an action is accepted. Legacy stored records/nonces without a decision revision use zero until their first accepted action.

One successful `bee_read` invocation costs one unit, including each separately returned page. A question may need several units. Failed reads refund once; OAuth, signup, pairing, `whoami`, `bee_docs`, protocol operations and `bee_usage` do not consume product units. Expensive operations retain the separate runtime/attempt guard. Neither per-account allowance nor free usage implies a total-cost guarantee.

The existing Durable Object resolves the immutable admission account ID and atomically reserves/settles against its calendar UTC month. Current-period limit and policy are snapshotted; configuration changes apply at the next period. No rollover or bonus. Grant rotation, new clients, reinstall, deny/reapprove and toggles do not reset the period. A persistent highest-month marker refuses clock rollback rather than recreating pruned usage.

Reservations have a two-minute operational lease, account/epoch identity and original period/policy/limit. Successful data is released only after settlement and renewed admission validation. A request crossing midnight settles against the old month. Active/terminal reservations expire and cannot revive; periods remain only while current or needed by an unexpired reservation. Duplicate settlement cannot reverse a terminal commit/refund. This operational lease is not a free-trial timer.

`bee_usage` returns only the authenticated account's used, reserved, remaining, limit, policy and exact ISO `renewsAt`. It and reference/protocol operations stay available when the bounded runtime closes. Exhaustion is a tool-level `allowance_exhausted` result with renewal date—not an OAuth failure, logout, disconnection, Access page or paid link.

## Synthetic calibration, not customer behavior

The actual MCP handlers and `beeRead` paging run against synthetic transport in `test/quota-integration.test.ts`; no real Bee requests or private content are used.

| Retrieval scenario | Successful read units |
|---|---:|
| One `/v1/facts` result | 1 |
| Four long synthetic utterances returned in two pages | 2 |
| One failed upstream read | 0 |
| Signup, reference and usage inspection | 0 |

The pager returns a small conversation in one result even when a chunk hint is supplied; chunking becomes applicable to a large result or explicit continuation. This is why raw calls cannot honestly be labeled questions. The fixtures calibrate mechanics only, not a recommended commercial allowance or observed hosting cost.

## Next gates and backout

Independent exact-source review, current CI/Bugbot, reviewed main staging build and deployed-source readback precede any delivery claim. Runtime expiry remains unchanged. Hosted consumer acceptance, a numeric allowance, activation, referral reward amounts/campaign ceiling, paid terms and production promotion remain separate gates. No Stripe or referral implementation in this change.

Future referral credits should be a separate ledger/balance, not mutations of historical monthly usage. This design does not implement or promise those credits. Backout disables dynamic self-service while preserving manual decisions and usage; existing earned entitlements must be respected if introduced later.
