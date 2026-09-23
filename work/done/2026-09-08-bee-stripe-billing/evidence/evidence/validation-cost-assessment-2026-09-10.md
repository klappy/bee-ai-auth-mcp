# Read-only validation cost assessment — 2026-09-10 11:51 EDT

## Conclusion
The owner-approved cumulative $5 ceiling is not the engineering runtime deadline. Expiry at 11:18:31 EDT does not prove money exhausted. Existing approval remains settled.

Known allocation supports a small compute estimate, but currently observed evidence does not establish a complete cumulative upper bound below $5. A further window must receive an independently accepted envelope; no provider mutation or window extension was performed in this assessment.

## Observed provider facts
- Application a0362707-1337-4517-9f84-49b53ecfdfa9 created 2026-09-09T17:20:09.553999872Z.
- Readback 2026-09-10T15:51:14.112Z: max_instances1, 0.25vCPU, 1024MiB, 4000MB disk, private network, logs disabled.
- Single returned instance inactive; status updated 2026-09-10T15:19:24Z.
- Existing runtime expiry unchanged2026-09-10T15:18:31.966Z.
- Billing usage GET previously denied with Cloudflare error10000 Authentication error. No retry with alternate credentials and no claim that denial means overspend.

## Conservative component calculation
Official overage rates, ignoring all included allowances: CPU $0.000020/vCPU-second; memory $0.0000025/GiB-second; disk $0.00000007/GB-second.
At current basic allocation, full CPU utilization costs $0.028008/hour. Continuous running for the entire 22.517933-hour application lifetime would cost $0.630683 for these three components. A further two hours would add $0.056016 in these components, or $0.060684 including a ten-minute idle tail.
This is conditional on the observed allocation/max_instances having held throughout. Current settings plus prior receipts support it but are not a complete immutable historical configuration audit. Actual inactive intervals can only lower this component estimate.

Source: https://developers.cloudflare.com/containers/platform/pricing/ (observed2026-09-10).

## Other components and missing evidence
- Container egress is additional, up to $0.05/GB at listed regions before included allowances. No observed cumulative bytes or enforced byte ceiling.
- Workers requests/CPU and Durable Object operations/storage/duration are additional. Code's lifetime validation request counter does not cap every public/auth request, rejected request, storage operation or network byte.
- One continuously active 128MB Durable Object over that same interval would add approximately $0.129704 at $12.50/millionGB-seconds. This is a scenario, not a bound on all objects.
- Builds cost $0.005/minute over included allocation; one build's documented20-minute timeout implies at most $0.10 overage per build. Complete relevant historical build-minute accounting was not established.
- Shared plan allowances are deliberately not subtracted; their remaining availability is unknown.
- No new subscription was authorized or created.

Sources:
https://developers.cloudflare.com/workers/platform/pricing/
https://developers.cloudflare.com/durable-objects/platform/pricing/
https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/

## Bounded next step
A further short validation window looks inexpensive on compute alone, but this is not sufficient to assert total cumulative spend fits. Close the aggregate historical traffic/egress/build/storage accounting gaps using normally authorized sanitized telemetry or a trusted billing receipt, and review a proposed window with preserved lifetime attempt counters and explicit stop/readback. Do not re-ask the already-approved isolated environment; do not interpret a partial estimate as a provider cap, new budget or authority to extend now.
