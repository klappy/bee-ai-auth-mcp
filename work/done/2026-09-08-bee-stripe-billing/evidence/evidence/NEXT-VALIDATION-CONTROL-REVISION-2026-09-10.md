# Next validation control revision — 2026-09-10 12:25 EDT
Status: PROPOSED / NOT IMPLEMENTED / NOT ACTIVATED. Supersedes the insufficient100MiB scenario in NEXT-VALIDATION-WINDOW-PROPOSAL-2026-09-10.md.

## Latest scope constraint
No broad response-streaming refactor is added to PR58 or authorized by this note. The control options below document the gap only. The smallest candidate journey is /v1/me plus one separately verified limited list query per test identity; no whole-conversation, utterance history, search, export or stream. /v1/me is a confirmed supported endpoint, but its current account shape is explicitly unknown in source and res.json() is unbounded. A limit1 query without a verified upstream limit contract is not a byte ceiling. Therefore no known-small response-size contract has been established; preserve that precise uncertainty rather than invent100MiB bounds. No additional implementation dispatched.

## Concrete gap
Current beeRead reads res.text() before its512KB output truncation; beeGetMe similarly reads res.json(). A20-page runner limit bounds neither buffered bytes nor transferred bytes. Selecting a small limit parameter is useful defense but not proof the upstream honors it. Client-side curl/MCP response caps cannot retroactively stop server-side buffering.

## Smallest defensible next control
Separate staging-only source change, not a new Container/image/provider service:
1. Wrap the Container fetch supplied to both beeRead and beeGetMe for the validation run. Start a30-second abort/deadline before fetch; read response incrementally, count bytes BEFORE concatenation/JSON decoding, cancel reader and abort on first chunk exceeding1MiB or timeout. Reject oversized Content-Length early, but enforce actual stream bytes even when header absent/false. Preserve cancellation on error and client disconnect. Oversize/timeout returns sanitized application failure, no body/token/log leakage.
2. Keep the30-second limit through body consumption, not just headers. This must cover profile validation as well as normal Bee reads. Do not assume one oversized incoming chunk can be allocated safely without a bridge-side bound; explicitly test real runtime chunking and cap retained buffers. Known remaining transport buffers mean this is not a provider hard egress cap.
3. Trusted runner uses two already-approved test identities, never creates a real invitee. Run20minutes, at most20 read/profile calls total and100 runnerHTTP/RPC operations total. Start with /v1/me; selected list queries request limit1; never unbounded detail/search/export/stream. Test identity/grant material stays wholly trusted. These are RUNNER limits, not broad service admission policy.
4. Identity scope: when requirement is exclusive server-side admission to the run, use a reviewed staging test-session gate matching server-resolved immutable admissionIDs before costly calls, not email aliases or client-suppliedID. Existing approval list alone does not establish that only the two test identities can run. No such test-session gate exists or is authorized for deployment by this document.
5. Preserve existing lifetime counters and20-minute runtime expiry with scheduled Container destruction. Cleanup before expiry; read back provider inactive state afterward. Stop immediately on wrong identity/data, byte/deadline breach, failed cleanup, unexpected Container allocation/activity, logging exposure, or inability to verify termination. Do not restart for cleanup after expiry.

## Verification before any window
Synthetic tests: oversized Content-Length; chunked/lying length; first oversized chunk; never-ending stream; deadline after headers; early client abort; non-2xxbody cancellation; both beeRead/beeGetMe covered; sanitized errors; quota reservation refund; existing large-record pagination regression. Independent exact-source review and normal featurePR→main build, followed by provider readback. Production remains untouched.

## Money decision versus engineering gates
For20minutes plus10-minute tail the prior fixed-allocation compute estimate is$0.016884.20calls at1MiB retained-response ceiling is20MiB retained data, NOT an exact network-total guarantee. Full cancellation behavior and transport overhead need observed validation; do not relabel this an egress hardcap.
The owner criterion is reasonably shown to fit the existing cumulative$5 approval, not an impossible guarantee against arbitrary outside attacks. Normal planned run appears inexpensive; historicaltotal remains unknown. Aggregate analytics schema discovery found no applicable endpoint exposed, and billingpermission was denied; no circumvention performed.
Additional$1 or$0.25 are UNAPPROVED proposals, not actions. Additional spending approval would address financial-risk authority only; it would not implement byte/identity controls, validate source, or permit private-data exposure. Finish the bounded controls/review first, then present at most one remaining exact financial decision if existing-cost evidence still cannot support the settled allowance.

No source/provider mutation performed for this proposal.
