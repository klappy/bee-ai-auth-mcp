## Narrow identity-only technical acceptance — September10

Reviewed exact control revision NEXT-VALIDATION-CONTROL-REVISION-2026-09-10.md at kitchen92da37d9c0919ae08b1e1923d8676da2f3cc3687, blob520f5f3f88929b07c2b8aca140d0059c9d129e3b, together with root's subsequent explicit identity-only narrowing.

Disposition: CONDITIONAL TECHNICAL ACCEPTANCE for a supervised /v1/me-only run. Not acceptance of the revision's broader proposed streaming implementation or an actual execution envelope.

Scope: two existing approved test identities, their own Bee authorization, minimal profile/identity reads via /v1/me only. Exclude the unverified limited-list query, history, conversation, utterance, search, export and streaming endpoints. No list-size/byte guarantee exists and none is claimed. Fewer calls than the historical20-page proposal are appropriate.

Under the owner's reasonably-shown-to-fit standard, absence of a formal maximum upstream profile size does not itself require a broad response-streaming refactor before this small normal-volume test. The source confirms /v1/me is the existing identity probe; the remaining size uncertainty is a disclosed residual risk, not evidence normal execution is likely to exceed a separately approved one-dollar incremental ceiling. A fresh incremental ceiling is a proposed owner risk decision, not observed approval, and does not establish past cumulative usage.

The existing admission policy continues to block unapproved users. Two identities bounds runner participation, not an unsupported assertion that no other previously approved account can act. Before activation, trusted preflight must assess other admitted/active traffic without exposing identities; if material uncontrolled costly activity is observed, stop and revise the run, not silently widen it. An exclusive new test-session gate is not automatically required absent that evidence.

Conditions remaining: exact accepted deployed source and independently reviewed version/deploy mutation envelope; trusted identity/grant comparisons with only pass/fail/count receipts; current lifetime counter/stop behavior preserved; one observed20-minute window without renewal; minimal pairing attempts; cleanup before expiry; independently verified Container inactive state afterward; abort on wrong-account retrieval, credential/log exposure, failed cleanup or unexpected continued activity. Any required owner interaction stays inside trusted tooling.

This run can prove own-grant identity retrieval and relevant isolation checks only. It cannot close full transcript retrieval, all hosted journey acceptance, public copy, quota activation or production release. No source changes, additional infrastructure, provider writes, spending or runtime activation are authorized by this reviewer.

# Independent next-window proposal review

Disposition: conditional planning acceptance; NOT an execution envelope or spending authorization.
Reviewed proposal blob0f5e14f06553eeffb31d5742f9e6a21cb800d57c. No provider writes or runtime activation.

## Authority versus estimate

Unknown historical cumulative usage is not proof the approved five dollars is exhausted. A separately approved fresh incremental allowance for this one run could resolve the historical remaining-budget ambiguity without claiming a total-cost guarantee. No such approval has been observed. The existing isolated-environment approval must not be asked again.

A one-dollar additional ceiling is a candidate decision, not a recommendation to spend a dollar: normal compute estimate0.016884 for the stated30-minute cost envelope is far below it. Independently read current official Container pricing and confirmed max-instance0.25CPU/1GiB/4GB30-minute component0.014004 using published overage rates, without deducting included usage. The proposal's DO/other-service figures remain its cited estimates, not independently recalculated here. Provider-all-traffic guarantees were never the approved standard; absence of a hard cap alone should not create an impossible gate.

Source: https://developers.cloudflare.com/containers/platform/pricing/

## Exact operational gaps to close

Twenty returned pages is not a byte ceiling. Observed src/bee.ts reads res.text() before512KB truncation, and conversation-detail responses bypass that truncation. The client output cap therefore does not bound upstream transfer or buffering. For this run, choose explicit narrow paths/queries and response expectations; do not budget broad unbounded history exports as small pages. If claiming an enforceable byte ceiling, it must cancel upstream consumption before buffering, not truncate afterward.

Confirm within trusted tooling that the enabled runtime can be exercised only by the intended approved test accounts, or explicitly account for other already-approved users. Identity values must not leave tooling; aggregate counts are sufficient. Runner100-operation limit is an operator constraint, not an ingress rate limit.

Bind the proposed window to actual accepted deployed source and a fresh scalar stop/counter preflight. Preserve lifetime counters. A remaining-counter getter gap is not evidence of available or exhausted capacity. Cleanup must complete before expiry; independently verify scheduled Container stop and fail closed on unexpected continued costly activity. No automatic renewal or second run.

## Narrow decision framing

Once the above run-specific checks and exact mutation/stop envelope pass, an owner decision for one new20-minute supervised validation run with a separately approved incremental allowance could unlock testing. It must expressly acknowledge ordinary shared-provider/public-traffic residual risk rather than pretend to be a provider-enforced cap. Historical total-cost uncertainty alone should not trigger a new monitoring/infrastructure project.

This review does not approve money, secrets, private identity disclosure, new enrollment, production changes, quota amount/activation or an actual run. The precise immediate work is tighten response scope and trusted access/stop preflight, not a generic budget-unknown hold.
