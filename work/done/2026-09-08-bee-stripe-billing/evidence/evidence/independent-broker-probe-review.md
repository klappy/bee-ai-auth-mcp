# Independent real hosted broker lifecycle review

Reviewer `/root/auggie_resume/review_hosted`, separate from implementation author Otto. Final independent cleanup observation: 2026-09-09T17:33:47.255Z. Reviewer made no implementation or provider mutations.

## Disposition

ACCEPTED narrowly: actual real broker start/pending/resume/clear behavior across two opaque directories, rejected invalid ID, replay denial, and current cleanup. Not accepted or tested: user identity, Bee approval, completed token capture, own-grant retrieval, cross-user grant isolation, public onboarding, production promotion or Stripe.

The independent review read the actual safe runtime receipt. HTTP 200 returned status complete and all nine boolean checks true:

- `brokerStartPending`: both real broker starts returned pending.
- `distinctPairings`: the two parsed connection URLs differed; neither URL was returned to the model.
- `resumePending`: the first broker resumed pending without user approval.
- `clearAConfirmed`: clearing the first directory returned cleared and resuming it returned expired.
- `separateStatePreserved`: the second directory remained pending after the first was cleared.
- `clearBConfirmed`: clearing the second directory returned cleared and resuming it returned expired.
- `invalidIdDenied`: the invalid ID was rejected.
- `brokerCleanup`: final clearing of both directories succeeded.
- `destroyed`: final Container destroy succeeded.

Missing secret, wrong secret, authenticated GET, homepage GET and MCP POST returned 503 without redirect before the runtime action. Replay returned 503, status closed. Local custody cleanup reported true; the reviewer independently confirmed ephemeral key and ciphertext files absent.

Tested activation version `73bbc28f-ee85-42eb-a02a-004209aa42a3`, deployment `420db926-5791-4f9a-a4cc-11c78d80af17`, window 2026-09-09T17:31:50.421Z to 17:36:50.421Z. The fixed image remains digest `5f732c594b2c5dbb1b06de2ff2ec81bfb45ca075eb6dcb9f71ea6c839ac09306` in the already accepted private registry application.

## Source and envelope

Exact source SHA256 `cf2b490e3b163e58cdf6f264762f722eda92725e0ebb89d7c49858da19cbdb13`, 2,631,150 bytes. The narrow splice replaced only the previous help-test body and used a separate durable one-attempt marker. It retained secret-only POST, at-most-five-minute window, transactional reservation, persisted pre-start destroy schedule, deadline wrappers, final destroy, disabled general validation, and boolean/fixed-stage-only return. It used two cryptographically random opaque broker IDs, not real user identities. Connection URLs, tokens and raw errors stayed in trusted Worker memory; none was exposed in the receipt.

Reviewer independently executed the actual inserted block against controlled success, start-failure, state-contamination and cleanup-failure cases: all four passed their expected disposition, and sensitive URL/error sentinels did not escape. These are local block tests, not substitutes for the actual hosted receipt above.

Both the closed source upload and tested/cleaned version modules were independently checked by provider GET against the exact source hash. The accepted encrypted custody, fixed verified-TLS destination, no-redirect transport, pre-runtime negative assertions and safe error reporting remained unchanged.

## Current cleanup

Independent provider GETs observed active version `e91629ff-2aca-462a-9a01-d682856f5ccd` at 100 percent, deployment `45d587aa-082c-49d2-a0fc-c7275bd87588`. Current/latest settings contain no secret binding and no VALIDATION_PROBE_* binding; general dates are empty. Subdomain and previews are disabled. Worker observability, logs, traces and Logpush are disabled; inactive defaults remain as previously recorded.

The complete instance listing has one logical record `96cbd5709a7efb3ef2dde4eaf1adb22236bff9314cb007491a8bad1fc32084f1`, state inactive, updated 2026-09-09T17:32:49Z, with the exact accepted image and no continuation token. No active/running/provisioning/stopping instance was observed. Historical immutable probe versions are retained; no history-erasure claim is made.

## Remaining privacy/admission gate

The general service remains closed. The two-directory probe is evidence of broker state separation only, not authenticated user/grant separation. Before a human-approval journey, establish private per-request admission without exposing homepage/setup copy, use an explicitly approved test identity through trusted credential entry, and retain separate OTP, denied-email, real Bee approval, own-grant/MCP and cross-user negative evidence. No new identity or public publication is inferred from this review.
