# Independent review — protected homepage preview

Observed September 11, 2026, 09:05 EDT. Reviewer /root/auggie_bee_telemetry_copy/reviewer did not author source, merge, or mutate provider configuration.

## Disposition

**PASS for the bounded protected review artifact at PR62 head 6b252fb34137ce600e5327603f36d29570d10fcd**, subject to successful required current-head Bugbot and actual staging deployment readback. This is not a full homepage, visual, onboarding, public-copy or production PASS.

Changed-draft browser rendering remains unobserved. Making the protected preview available is appropriate to obtain the owner's visual and exact-copy review; it does not silently waive that review. Retain this distinction in delivery.

## Independent source and execution evidence

- Read all six changed-file patches, complete preview source, current staging entry, production entry and Access verifier, plus homepage ticket blob35937e7b580b12cb72809cc09b1ade1110eeb616 and meal checkpoint bloba69a35ffa666818166b6c68860cce1c28bb3b8f8.
- Access verification executes before draft selection or asset access. The existing verifier checks signed JWT, issuer, audience and nonempty email; an identity header alone is insufficient. POST is refused; GET and HEAD require verification. Existing signup-enabled gate remains.
- Home aliases /preview, /preview/, /preview/index and /preview/index.html reach the draft. Preview routing occurs independently of Container runtime expiry and does not require a new runtime window.
- Successful responses carry private, no-store, no-referrer and noindex/noarchive headers. Local HTML asset references remain in /preview/. Staging origin substitutes the MCP URL. Conditional ETags are removed. Non-home asset routing is preserved.
- Public asset map, public/index.html, stylesheet and production entry are outside the diff. Only the staging entry imports the new module. No provider, quota, billing, referral, runtime or production settings change is present.
- Prominent draft notice says immediate free access and paid upgrades are not enabled. Copy describes intended monthly renewal without numeric free/paid usage or unlimited, trial, lifetime, referral or knowledge-base promises. Settled $5/month and $24/year remain. Paid signup is explicitly not open.
- Exact draft text travels in docs/hosted-homepage-draft-2026-09-11.md; source order and debrief accompany behavior. Custody language distinguishes hosted access from AI chat retention; it does not claim disconnect revokes upstream Bee credentials.
- Independently executed the six focused Vitest tests at09:04:34 EDT in an isolated scratch test harness, fetching exact Git source and test. Source Git blob7783ea350e2d4f62b160054a1eb3ce89683f777e and test blob11c7c20374a452a24a52f8aed32d9f353b00c76e were locally hash-verified. Result: 1 file, 6 tests passed. Imported Access/assets/private-page seams were mocked, so these tests prove handler logic, not real Access, Cloudflare or browser behavior.
- Independently fetched workflow runs for exact head: CI34601603940 completed success, run180. Required Bugbot remains separate and is not inferred from this Actions result.
- Initial shared scratch test files differed from current Git and were not counted as exact-head proof. A first local invocation used incorrect paths; it was corrected. The final exact-file run above is the counted evidence.

## Bounded findings and limits

Ticket amendment originally named drafts/hosted-homepage.html, while actual implementation embeds the draft in src/hosted-homepage-preview.ts. Auggie was asked to align the declared artifact path and reported that correction underway; no additional source file is needed.

The cook reported Chromium CDN timeouts and no changed-draft render. This reviewer did not obtain independent visual screenshots or repeat old unchanged clipboard evidence. Existing layout reuse lowers change risk but does not establish mobile/desktop visual acceptance.

No live provider deployment, request, Container state, authenticated preview rendering, private account data or new grant was observed by this source review. The final deployment receipt must identify exact merged source and preserve expired runtime, disabled quotas and unchanged production.

Boarding recipe, STACK, identity, current HYGIENE and validation rules were read. Source/state reads were initially batched before the full line-check sequence was completed; record that sequencing lapse rather than claiming perfect hygiene. Captain journal and shared checkpoint remain their assigned writers' responsibility.

## Subsequent coordination receipts

Auggie reported authenticated exact-head check-runs GET200: Typecheck & Unit103270034960 SUCCESS; production-source103270036571 SKIPPED; Cursor Bugbot103272185511 in_progress. These individual check statuses are attributed to Auggie's observation; this reviewer independently observed the Actions workflow success above. No merge until Bugbot completes successfully.

Auggie reported the ticket artifact path corrected at kitchen commit531f608f, blobbf4175fc. The source review needs no code change for that alignment.
