# Staging signup and OAuth infrastructure execution

Observed September 10, 2026, America/New_York.

## Delivered

Exact independently tested module `cd22b026173d289777783bac51493fcf1da0fb64f0769c4fd97a51af70636560` deployed first with runtime closed, then Access was changed to any-verified-email signup and owner-only administration. OAuth discovery, public client registration and unauthenticated MCP now reach the application protocol rather than the former validation blanket denial. Actual HTTP receipts are separate from source tests and provider records.

Runtime subsequently activated at 09:18:31 EDT through 11:18:31 EDT using the same module, exact-version inherited secrets and only two changed window bindings. No approval record or lifetime quota was reset. The source denies costly operations after expiry. A shutdown is scheduled on the first accepted costly operation; no alarm creation or actual approved-user operation has been observed in this execution receipt.

Only the exact public test OAuth client created by this HTTP test was removed. Its metadata was verified before deletion, DELETE returned 200 and subsequent GET returned 404. No signup records or other clients were deleted. Private identities and credential values were not placed in these artifacts.

## Execution corrections

Provider writes were paused by overly strict comparison code, not observed security drift:

- Binding object key order differed. Recursive key canonicalization now compares every semantic field.
- `migration_tag` is generated, read-only and omitted until deployment. It is checked after deployment, not treated as a writable upload field.
- Access derives deprecated `self_hosted_domains` from `destinations`. The expected projection now uses the exact intended destination URIs.
- Access updates policy `updated_at` during an application update. Policy preservation compares ID and all writable policy fields, not generated timestamps.
- The immediate runtime deployment GET briefly returned the previous deployment. A subsequent read confirmed the new deployment; no duplicate deployment was made.

The single uploaded candidate was reused through the corrections. No repeated image build, namespace creation, credential rotation, production mutation or subscription purchase occurred. Future envelopes should classify writable configuration, generated projections and transient observations before their first write.

## Cost and remaining proof

The cumulative isolated five-dollar allowance remains unchanged. Current max-one basic Container allocation is 0.25 vCPU, 1 GiB memory and 4 GB disk, with logs disabled and private networking. Two continuous hours at published maximum allocation rates estimate $0.056016 for compute, memory and disk alone, excluding Workers, Durable Objects and egress. This is not a total-cost guarantee. Prior observed activity spans are not an invoice.

Account subscriptions GET returned 403. No alternate billing authorization was attempted. The independently accepted Access boundary relies on documented existing purchased-seat capacity: additional users are blocked at capacity, and no subscription mutation is included. Actual remaining seats are unknown; other applications share that capacity.

Actual email delivery, authenticated signup, owner approval, personal Bee approval and user-grant MCP retrieval remain to be observed. The runtime window is an opportunity to test them, not evidence that they passed.

Sources: https://developers.cloudflare.com/containers/platform/pricing/ and https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/ .
