# Candidate next hosted validation envelope — 2026-09-10
Status: PROPOSED / NOT ACCEPTED / NOT ACTIVATED. Otto read-only assessment at12:15EDT.
Scope: one20-minute supervised journey on existing isolated Worker and existing private Container, after exact-source independent acceptance and actual reviewed main deployment. No production, no new resource/subscription, no quota activation, no real invitee enrollment. Trusted approved test identities only.

## Fixed proposed run
At execution preflight observe server time T0; write start=T0 and expiry=T0+20minutes only through independently reviewed version-then-explicit-deploy tooling. No periodic renewal. Preserve all identity/grant state and lifetime counters. Maximum2 approved test identities; maximum2 pairing attempts/identity; maximum20 successful Bee read pages total; maximum100 runner-issued HTTP/RPC operations total. One operator-held run, no concurrency/load test, stop on first privacy/security/cleanup failure. These are operator-run limits, not currently installed provider-wide rate limits.

At expiry no new costly request; verify scheduled destruction and provider inactive state. Allow10minutes as cost-estimation tail, not extra test authority. Unexpected continued activity is a failed stop; do not start another test. Cleanup must run before expiry; afterward never restart merely to claim cleanup.

## Existing controls, freshly inspected from product main
- src/validation-window.ts92a8f8b0: maximum2-hour configured window, expires fail closed, lifetime validation request limit10,000.
- src/staging.ts8d2e6bfa: atomic lifetime validation counter; shutdown keyed to current expiry; signup operation limit100,000.
- src/admission.ts7c10193f:100 admission records; DCR60/hour and1,000/day.
- src/bridge.tsb6849da9: shared singleton Container;10-minute idle sleep.
- Provider: max1 instance,0.25vCPU,1GiB memory,4GBdisk, private network/logs off.
Existing10,000 counter is NOT reset or presumed unused. No read-only RPC for current private counter was established.

## Incremental estimate, not total cap
Official Container overage rates, no included allowances deducted:30minutes fully utilized = $0.014004. One128MB DO active30minutes adds $0.00288 duration. Compute subtotal = $0.016884.
One worst-case20-minute build, if a new build were needed, adds up to$0.10. Existing reviewed deploy should be reused; no build is needed merely to begin the window.
Network adds up to$0.05 per GB at current listed regionalrates;100MiB would be about$0.005243, but NO existing hard cumulative egress-byte limit makes100MiB an enforceable assumption.
WorkerCPU, rejected/public traffic, DO/KV operations/storage and historicalusage remain outside this subtotal. A$0.25 operator target for this run is a PROPOSAL, not a provider-enforced upper bound, new spending authority or total-cost guarantee.

## Exact unsatisfied gates
1. Historical cumulative incremental test cost remains unknown. Billing-read denial does not imply budget exhaustion. Established lifetime compute estimate is partial (see validation-cost-assessment-2026-09-10.md).
2. No complete aggregate accounting for historical egress, public/auth traffic CPU, DO/KV storage/operations, and builds.
3. No verified all-traffic or total egress counter/stop covers outsider traffic. Operator synthetic volume cannot bound it.
4. No safe authorized getter established for remaining lifetime validation/operation allowances; do not inspect private grant/identity records to infer them.
5. Exact next source, stop behavior and mutation envelope require fresh independent acceptance.

Disposition: NOT ENOUGH EVIDENCE to certify all incremental/cumulative costs within remaining$5. Do not activate on the compute subtotal alone. Preferred next step is trusted aggregate usage evidence and a reviewable counter/stop mechanism; do not bypass denied billing permission. If owner elects to accept additional financial risk instead, the narrow decision would be an additional$0.25 test allowance for this single20-minute supervised run, explicitly not a hard cap. That is not needed or requested here, and it does not silently reauthorize the settled isolated environment.

Sources observed2026-09-10:
https://developers.cloudflare.com/containers/platform/pricing/
https://developers.cloudflare.com/durable-objects/platform/pricing/
https://developers.cloudflare.com/workers/platform/pricing/
https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/
