# Independent owner usage review — 2026-09-11

Reviewer: /root/auggie_bee_resume/reviewer, independent of telemetry source author and provider operator.

## Draft envelope review

Reviewed proposedNaturalUsageEnvelope version 1.0.0 in telemetry-provider-2026-09-11.json blob a98d6e32cf8c76d6500069d712c8283f41677333 against OWNER-USAGE-AMENDMENT-2026-09-11.md blob 192af26e3d887a18a0e1bf5077da0880aa2ee114. Baseline source 2f5e2727798cd8cac1a90ba98a2b813458f49897; this is not acceptance of an eventual telemetry head, configuration candidate or deployed runtime.

Disposition: bounded draft is plausible under original isolated $5 approval, pending exact source and candidate acceptance. No complete historical invoice or new dollar approval is requested. The stated two-hour plus ten-minute-tail compute estimate and preserved lifetime safeguards support proceeding to exact review; they are not a provider cap or total-cost guarantee.

Required corrections before activation:
- Configuration flag must match the actual source contract: OWNER_USAGE_ENABLED, not draft OWNER_TELEMETRY_ENABLED.
- Observe actual owner-only bee_observed_usage tool availability after activation/catalog refresh. A deployed new registration is not proof the current native connection exposes it.
- Read back persisted aggregates after caught waitUntil work completes. An enqueued write, tests or successful Bee response is not persistence evidence.
- Keep existing other-approved admission distinct from owner-only instrumentation. The draft leaves other approved traffic admitted, so the runtime itself is not owner-exclusive. Existing lifetime safeguards and unexpected-traffic halt remain applicable.

Privacy and operational shape accepted in principle: authenticated trusted-owner matching; no client-selected identity; no raw events, content, identifiers or credentials in aggregates; fixed bounded metrics; 31 UTC date buckets with on-read/write pruning rather than guaranteed idle deletion; no production change or raw logging; independent of commercial quota; no synthetic usage load; explicit expiry retained until scheduled destruction; actual shutdown observation required. No continuing monitoring or new runtime window exists from this review.

Source-specific review remains pending, including result/error preservation, production behavior, RPC authorization, finite bounded aggregates, transactional operation-budget accounting, waitUntil lifetime and persistence. Deployment and consumer acceptance remain separately pending.

## PR63 exact source review

Reviewed all ten changed files at 1052eb6becdff2db10b946a93b8cb60ca8afec02 against base 9036cd7cc9ead507ebd5bf6b687ab7e77637d742 and the accepted owner amendment. Disposition: source/privacy PASS; required Bugbot still in progress at observation. No merge, flag activation or measurement claimed.

Owner identity comes from authenticated grant properties and is matched against the trusted owner binding before registration and again inside the private RPC. Inputs cannot select another identity. Source skips legacy HMAC derivation and AE emission for staging even with observation off. Existing production AE behavior remains. Telemetry failure preserves returned object identity and thrown errors; caught RPC work is attached to ExecutionContext.waitUntil. Fixed fields strip identities/content/unrecognized metadata, numeric accumulation is finite and capped, valid date keys prune to current plus preceding 30 UTC dates. Existing singleton storage transactions account each permitted observation/read against the 100,000 lifetime operation budget without resetting it. The uninstrumented inspection tool neither calls Bee nor consumes a commercial read. Docs explicitly state best-effort coverage and idle-retention limits.

The new test file exercises source RPC and MCP registration boundaries using mocks, including concurrent transaction simulation, unauthorized identity attempts, no staging HMAC/AE, production behavior, UTF8 bytes, result/error preservation and telemetry failure isolation. These are meaningful source tests, not actual hosted persistence or cross-user-grant proof. Cook reports TypeScript and 30 focused tests; reviewer does not relabel them a full local native suite.

Current-head authenticated check-runs: Typecheck & Unit 103411370836 SUCCESS; Production promotion source 103411372216 expected SKIPPED; Cursor Bugbot 103411817996 IN_PROGRESS. Reviewer marked the existing draft PR ready via native GitHub capability at 20:29:12Z solely to trigger configured review; readback retained exact head and draft=false. No new Cursor implementation worker or merge.

The amended two-phase envelope avoids a catalog dependency cycle: first exact-reviewed flag-only activation preserving expired runtime, then observe owner-only catalog and actual aggregate readback; only afterward consider the separately reviewed bounded natural-use runtime. Source permission to instrument does not establish a usage sample, numeric quota, billing or production authority.

## Completed PR63 source gates

Observed 2026-09-11T20:35:47Z (16:35:47 EDT): required Cursor Bugbot 103411817996 completed SUCCESS at 20:35:23Z. Typecheck & Unit 103411370836 SUCCESS and expected production-source 103411372216 SKIPPED remain current. Independent fresh PR metadata confirms exact head 1052eb6becdff2db10b946a93b8cb60ca8afec02, base 9036cd7cc9ead507ebd5bf6b687ab7e77637d742, ready, mergeable and still unmerged at observation. Review threads empty. Disposition: exact-source PASS and applicable checks complete; Auggie may merge. Provider deployment, flag activation and actual telemetry persistence remain separately unproven.

## Phase A actual candidate acceptance

Independent authenticated provider reads verified PR63 deployed source module bb679cf9c53f93cd473f1160c4752d39a50241cd8abb392d191576c7e02bada9, 2,623,046 bytes, embedded main 7f9e51f0, version caf3ec77-b5ac-4ee4-91e5-71ea21d87418/deployment 27d2afb8-9191-4a40-8410-c2cd69279261 at 100%.

Actual upload-only candidate 691200c9-5064-4f74-8cd8-1cfecc80e636 independently compared with active caf3ec77: modules identical; compatibility, main module, exports, usage model, containers, assets, placement, limits and cache options unchanged; existing bindings identical after removing the sole added plain-text OWNER_USAGE_ENABLED=true. Both old expired timestamps remain byte-identical. Active deployment still caf3ec77 at 100% during candidate review.

The absent candidate migration_tag was investigated rather than silently ignored. Live provider OpenAPI describes it as read-only, set when deployed and omitted for an undeployed version. Active tag is v1; candidate omission is expected. Require v1 again after explicit deployment. No migration was requested; exports/namespace bindings remain unchanged.

Disposition: PASS for this exact flag-only candidate to explicit isolated deployment, retaining expired runtime. Otto was notified before deployment. Actual effective readback, native catalog refresh and persisted aggregate remain pending; no active natural-use runtime or usage sample is claimed.

## Phase A deployed acceptance

After Otto's explicit deployment, independent authenticated GETs confirm deployment e625405b-8a9b-4c47-b58f-d681336addcf serves accepted version 691200c9-5064-4f74-8cd8-1cfecc80e636 at 100%. Migration tag is v1 as required. Effective OWNER_USAGE_ENABLED=true with unchanged expired 11:34:18.386Z/11:54:18.386Z timestamps. Container state is inactive. Effective Worker observability/logs/traces disabled, logpush false; production deployment 614b5e3b-5581-4821-8daf-d19289c45ba9 unchanged. Five Access application targets retain the Bee protected preview/signup/admin and protocol scopes plus unrelated kitchen/tincan selectors; no hostname collision or scope weakening observed.

Disposition: deployed Phase A PASS. Root may inspect actual owner-native catalog and aggregate readback without opening Bee runtime. No natural-use measurement or completed persistence proof is inferred. No Phase B runtime is active from these records.

## Existing-catalog compatibility source review

Actual native catalog lacks the new standalone inspection tool and provides no refresh operation, as observed by root. Bounded compatibility repair PR64 exact head 31af2f60d97913bc4a8a9206e0318581f7afe30d, base 7f9e51f024b44b7a9b96b104e7f44bf3bcd67be1, independently reviewed across all six changed files. Source disposition: PASS; required current-head CI/Bugbot remain pending.

Existing bee_docs adds optional strict enum view=reference|observed_usage. Missing/reference returns the same canonical constant through ordinary docs observation. Inspection shares readOwnerUsage with standalone tool and thus trusted-owner/flag and private-RPC checks; caller arguments never select identity. Inspection, including denied inspection, bypasses the measurement wrapper and does not call Bee or the Container. Unknown view rejects. New focused tests cover exact default/reference equality, owner inspection, no self-count, no runtime/Container call, nonowner/disabled denial and unknown view. README, governance, order and debrief travel together. No provider or runtime change from this source.

Reviewer marked existing PR64 ready through native GitHub capability with same exact head read back, solely to obtain configured checks. Native compatibility and persisted aggregate proof remain pending actual deployment/consumer call. Accepted future functional sequence is aggregate baseline, one canonical default docs call, aggregate docs count +1 with successful reads unchanged, then another inspection showing no self-count. Async waitUntil completion may require a bounded readback retry. This proves instrument function, not natural heavy usage.

## PR64 completed checks

Observed 2026-09-11T20:53:55Z (16:53:55 EDT): Cursor Bugbot 103417228261 completed SUCCESS at 20:51:26Z; Typecheck & Unit 103417101313 SUCCESS at 20:48:22Z; production-source 103417102205 expected SKIPPED. Fresh PR head remains 31af2f60d97913bc4a8a9206e0318581f7afe30d, ready, mergeable and unmerged at observation; review threads empty. Independent source PASS and applicable checks complete. Auggie may merge; actual deployed artifact and native persistence validation remain pending.

## Staging build failure and bounded probe-test correction

PR64 staging Builds failed before deployment on the pre-existing bridge-image-probe missing-image unit test. Its ambient Docker process calls had no child deadline. Unchanged script blob 947794cf55c5e4cef92a371d68fc6675165737a9 and test 1b224f9f790d2e8d3410b644e06d1aca2ef8ef96 were independently inspected. Cook's six-second synthetic Docker delay reproduces the timeout mechanism, not the unobserved exact provider-daemon cause. PR64 source/check PASS does not imply successful deployment.

PR65 exact de5b1588aa95a7ce7697543ca3b289355daf4b37 independently reviewed across test/order/debrief. Source disposition PASS. Temporary PATH fixtures control Docker/sudo and assert exact unavailable/missing-image exit 2, exact messages and no container run; no-image case asserts exit 1 without Docker. Child execution has a two-second deadline, timeout rethrows rather than becoming a pass/skip, temporary files are removed in finally. Actual real-image probe and package command remain unchanged. These deterministic unit checks do not claim real image acceptance. No broader code/config scope or global timeout increase.

Reviewer marked existing PR65 ready and read back same exact head. Observed 21:00:28Z: Typecheck & Unit 103420397688 SUCCESS at 21:00:16Z; production-source 103420398866 expected SKIPPED; Bugbot 103420521082 IN_PROGRESS. No merge or deployment claimed.

Review delivery learning: PR64 Bugbot finished 20:51:26Z but was observed 20:53:55Z. The roughly 2.5-minute polling interval added avoidable latency when it was the sole gate; subsequent active critical-check observations use roughly 30–60 seconds, without changing governance or inventing after-session monitoring.

## PR65 completed checks

Observed 2026-09-11T21:06:03Z: Bugbot 103420521082 SUCCESS, completed 21:05:09Z; Typecheck & Unit 103420397688 SUCCESS; production-source 103420398866 expected SKIPPED. Fresh exact head de5b1588aa95a7ce7697543ca3b289355daf4b37 unchanged, ready, mergeable and unmerged; review threads empty. Source PASS and all applicable gates complete. Auggie may merge the on-path deterministic unit-test repair. Actual subsequent staging build/deployment and native aggregate proof remain required.

## Compatibility actually deployed after PR65 repair

Independent provider artifact GET confirms active version 827fa8d8-78d6-4cda-bb4a-3e4910b72647/deployment 5320ba3d-a6d1-4616-a819-2572622301a0 at 100%. SHA256 3263edcc87792892e29ca5bedeb8b6b15de81b0c6f75fe7a88002a4af52ddeb3, 2,623,501 bytes, embeds exact main 2993b9c158a9214736253d375060d91df1deaf31. Full bindings independently equal previous accepted flag-enabled 691200c9 version, retaining OWNER_USAGE_ENABLED=true and expired runtime timestamps. Migration remains v1, Container inactive, production deployment 614b5e3b-5581-4821-8daf-d19289c45ba9 unchanged. Otto reports actual build 11ee2ccf SUCCESS at 21:08:16.774Z; reviewer independently verified resulting artifact, not merely build status.

Disposition: actual compatibility deployment PASS. Root may run accepted native inspection/default-docs/inspection sequence. No open Bee runtime, organic usage baseline, numeric free policy or production promotion inferred.

## Actual native functional persistence acceptance

Root reports actual native consumer observations at 2026-09-11T21:09:56.870Z: bee_docs observed_usage returned ok=true, best_effort_not_billing, owner_staging and empty days. One default bee_docs returned one text block, exactly the 8,074-character canonical blob d8164e1679e7d766bc2d80d1c048bde21fa2aee7. Subsequent observed_usage returned September 11 docs.count=1 and read_success=0. Repeated inspection retained docs.count=1 and read_success=0. All calls isError=false; no private Bee read.

Independent disposition on these root-observed safe results: functional consumer/persistence PASS. The existing native tool accepted the selector; the default reference remained exact; one ordinary docs observation persisted; inspection did not count itself. Initial whole-JSON equality differed only in property ordering; fixed-field numeric equality is the applicable semantic comparison. This is a controlled instrument check, not a natural-use sample, heavy-user baseline, monetary total, approved quota or complete onboarding acceptance. Runtime remains expired; post-call Container readback is separately owed by Otto.

## Final post-consumer disposition

Read current owner-usage-pr65-provider-receipt-2026-09-11.json blob d0bd3c4655b15aa8b43d886634fc4841de8e67dc, commit 1415fdf7. Its post_consumer observation 2026-09-11T21:10:44.555Z discharges the earlier owed post-call check: accepted version 827fa8d8/deployment 5320ba3d remains active at 100%, owner flag true, original runtime expired, Container inactive, Worker logging disabled and production unchanged. Root's actual native semantic aggregate comparison and exact reference result are recorded there.

Bounded review complete: protected homepage staging deployment and owner-only instrumentation/compatibility/persistence accepted within the scopes above. Human-rendered draft/public-copy review, organic owner usage calibration, numeric quota, cross-user granted-state acceptance and production release remain separate. Phase B natural-use window was not activated. Reviewer stands down after this persisted readback; no background review or monitoring is claimed.
