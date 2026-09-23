# Independent production-entry review — September 11, 2026

Reviewer: /root/auggie_bee_ship/release_reviewer. Independent of source and provider authors. Clock observed 2026-09-11T21:33:17.199Z (17:33:17 America/New_York).

## Contract acceptance

ACCEPTED for bounded source fire: PRODUCTION-ENTRY-AMENDMENT-2026-09-11.md blob 8a8e56c242ba60250b2aaa39993ea8fac5f267d8. This is design acceptance only, not source, provider, release or whole-ticket acceptance.

Direct reads of main2993b9c158a9214736253d375060d91df1deaf31 index.ts, staging.ts, admission.ts, bee-auth.ts, mcp-api.ts and types.ts confirm the production composition gap. The legacy production entry lacks hardened signup/admission/quota wiring. Staging has the wiring but also expiry and GitHub rejection.

The revised contract incorporates independent findings: explicitly separate environment from SIGNUP_ENABLED throughout runtime, identity, MCP, refresh and telemetry; preserve allowed GitHub consent/MCP/refresh and existing grants; preserve staging expiry/lifetime controls; retain the 100-record and DCR60/hour1000/day bounds. Storage keys, class identity, bindings and grants remain unchanged. Owner observations stay staging-only; production telemetry privacy guards remain. Quota activation stays disabled pending approved numeric policy. Public monthly-free claims cannot precede enabled behavior.

Required exact-source acceptance remains: tests and code inspection of both entries, GitHub compatibility, email admission/denial/epoch, quota disabled/invalid/enabled, DCR/PKCE/discovery, staging-only runtime and owner telemetry, unchanged storage, and no private logs. Current-head CI and Bugbot remain gates. Real hosted isolation/cleanup evidence is not replaced by these tests.

## Provider envelope preparation

Read bee-production-ship-envelope-2026-09-11.md blob ce57a7f51546dcb7328ff82af6997c6a1c62dbfe. Appropriate as read-only preparation; NOT ACCEPTED for mutations. It deliberately lacks pinned final source/image, exact candidate and production deploy mechanism. Existing production KV/DO/Container reuse, isolated Access audiences, browser-only protection, grant preservation and complete metadata readback are correct boundaries. Fresh candidate and mutation-order review remains required before writes.

## Review hygiene

Fetched live boarding, STACK, product AGENTS, kitchen charter/rulings/lanes/hygiene/validate-plate, current task and checkpoint, and canonical legibility. Initial concurrent reads preceded completion of ordered line check; this is disclosed, not a perfect-hygiene claim. Auggie/EA own captain journal and rail state. No source/config authoring or provider mutation was performed by this reviewer.

## Amended provider preparation review

Reviewed envelope f0a4cb938fb9e5aed8d620913ce63475716c79a3. Preparatory design acceptable; no generic money, ship or copy approval is owed. The concrete numeric monthly allowance remains a commercial decision; private second-identity consent is needed when that hosted test is reached. Existing same-capacity production and the owner's ship direction are the authority context. The cost estimate is explicitly not a cap or guarantee; no additional approval is inferred or demanded from it.

Crew-owned execution details remain before actual mutation acceptance: pin accepted source and immutable image; instantiate safe transition ordering so the new CLI cannot execute with logs enabled or incompatible entry; pin all production Access paths/audiences for custom-domain and alternate-host ingress; present the reviewed Git-triggered preservation/version-upload/deploy/readback mechanism and rollback. These were already required by the envelope, not newly imposed requirements. Preserve unrelated resolved Access selectors. Do not mistake this preparation acceptance for accepted actual candidate or deployment.

## Deployment-source supplement acceptance

ACCEPTED for bounded deployment-script source implementation: envelope supplement blob7d5db70aa0a839ae76699b61c9cab957f9cb78b7, specifically deploy-production.cjs, explicit Worker-first canonical assets, required preflight/preservation/version-upload/readback/explicit-deploy/failure phases and documented prerequisites. The script verifies Container prerequisites; it does not roll out the Container. This source fire therefore need not wait for the provider-only correction below. Exact source tests/review/CI/Bugbot and actual provider candidate acceptance remain outstanding.

Provider-only finding R1: rollout step B must not assume omitted target_configuration fields are preserved. Require a GET of complete current configuration, clone supported writable fields, change only image and logs.enabled, POST rollout and compare preserved env/network/entrypoint/allocation fields; alternatively establish explicit documented provider merge semantics before relying on a partial object. This finding blocks that rollout execution, not source-only script authoring. Privacy-first ordering and explicit compatibility checks are otherwise suitable. No provider mutation has been accepted or performed by this reviewer.

## Rollout preservation correction

Preparatory rollout plan ACCEPTED at envelope correction24ff7a2277c50a8b512ef2a558fc76da7c529026, retained in current3d3be093030505fa20e32891460ca96d4e71d99e. R1 is resolved: full supported writable configuration clone, absent/present semantics, explicit basic allocation mapping, only image/logs delta, unresolved fields fail before write and complete post-rollout comparison. This accepts the plan; actual source/configuration candidate and provider effects remain unaccepted until observed.

## Trusted owner-identity reuse

Preparatory design accepted: reuse the same owner's identity from the existing staging owner-only Access policy entirely within trusted tooling, validating exactly one allow policy with one nonempty email selector and no additional require/exclude selectors. Otto reports safe provenance policyfb785d29-4812-436d-9d19-1476593d6203 in app8fc54e03 at21:46:45Z. No private value is needed in model context or from the user. Populate a distinct production ADMIN_OWNER_EMAIL secret; do not reuse staging audiences or copy grants/state. Revalidate policy shape before generating the candidate and emit only safe provenance and booleans. Envelope wording must distinguish separate binding/custody from the legitimate same human identity. This does not authorize a provider write or accept an unseen candidate.

## PR67 first exact-source review

Head dc799b2b99db02564449e93d9db64a172dfb616d: COOK LONGER for one bounded finding R2. Shared signup.ts returns /preview/ instruction links to production users, but production intentionally has no preview handler, producing404. Production approved/admin text also incorrectly describes staging and its bounded runtime expiry. Use environment-specific production homepage instructions and truthful production text while preserving staging behavior. No new design or commercial wording requested.

No further finding in explicit entry/DO environment discrimination, preserved GitHub consent/MCP/refresh allowlist, email epoch admission, unchanged transactional storage keys and bounds, staging-only owner observation, production admin audience/identity separation, or known-static route exclusion. TypeScript and independent focused production-entry/staging-access/admin-form/native-MCP tests passed:16tests,4files at17:50:08America/New_York. Nine key local code/test blobs were matched to exact remote head. Existing complete-suite cook return remains263passed/two hosted skips; reviewer did not relabel synthetic tests as real hosted acceptance. Exact corrected source and current-head CI/Bugbot remain required.

## PR67 corrected exact-source acceptance

Exact-source PASS at0b1805131ee401aec2812764b89ad195d7e50a28. Fresh PR metadata confirms this head; direct comparison againstdc799b2 shows only four repair files. All four local blobs match exact remote: signupeb57124d, regression7e2c37f3, production docs2a25737f, debriefd8f7365a. R2 resolved: production instruction links go to root; staging retains /preview/; staging-window wording is conditional, production descriptions are factual. No remaining source finding.

Independent signup suite22tests passed at17:51:52America/New_York, including new pending/approved/denied/enrolled and admin output regressions. Prior independent TypeScript and16focused entry/auth tests remain applicable; cook reports updated full267passed/two live skips. Current-head CI/Bugbot and actual deployed source readback remain separate gates. This source acceptance does not activate quota, production logging/image changes, public copy or real hosted cross-user/cleanup acceptance.

## Phase A custody-only operation acceptance

ACCEPTED exact proposed operation in envelope4f61b376a60b57887299b84c2fa7fed1fc683e9c, within root-authorized safe preparation. Independently inspected live version-create schema: deploy query controls100percent deployment, and inherit binding supports explicit version_id without an active-version restriction. The custody candidate is therefore useful for later explicit inheritance, not a dead secret store.

Permitted operation is one deploy=false version upload of exact old production module/full writable metadata, inheriting existing secrets and adding only trusted-generated CONSENT_SIGNING_SECRET plus trusted-resolved same-owner ADMIN_OWNER_EMAIL. Baseline production deployment/version, complete owner-policy shape/provenance and all active surfaces must be freshly verified; no Access, source deployment, Container rollout, logging, ingress, quota or runtime change is part of this phase. Safe rejection halts rather than experiments with metadata or deployment.

Actual returned candidate must prove identical module/metadata/nonsecret bindings and secret presence; every active surface must remain unchanged. Secret values cannot be read back and no value/fingerprint is accepted in evidence. This is operation acceptance before execution, not a receipt that upload or preservation has succeeded. Later full configuration construction explicitly inherits from the custody version, is separately accepted/activated/read back, and only then may the source Build inherit its accepted active configuration. Final manifest remains unaccepted until its real gates pass.

## Actual Phase A residue — narrow custody acceptance

Independent authenticated GETs at2026-09-11T22:00:35.859Z returned200 for old version, candidate and deployments. Active deployment remains614b5e3b-5581-4821-8daf-d19289c45ba9, version1a7996dd-1cc0-4046-9e39-56d0aaea4bc8 at100percent. Candidate d9d07844-8be5-4437-a89a-d94b2d7b7ac4 has identical module bytes2,416,571 and SHA256bbf09a90855e387a91f95d7da4e95d78daeb3fae835cb14d6995e17fe68dfa00; all eight old normalized bindings match; only ADMIN_OWNER_EMAIL and CONSENT_SIGNING_SECRET secret_text bindings are added. Old active version retains assets and lacks these new bindings; candidate assets are absent.

Full metadata preservation FAIL remains. Narrow custody-only residue ACCEPTED as a future explicit inheritance source for exactly those two secret names. Never deploy this candidate or use its metadata as a configuration base. Future builder must take metadata from the actual deployment-selected version and inherit these two names by explicit custody version_id only. Secret value equality is not claimed from write-only APIs. No further provider write or activation is authorized by this acceptance; source/provider gates remain. This salvage avoids duplicating secrets while preserving the failed result honestly.

## PR67 actual staging source acceptance

Independent authenticated provider GETs at2026-09-11T22:03:36.139Z all returned200. Staging active deploymentac05ead2-107c-4308-bd58-584df80321f3/versiond473a11e-2162-4ec7-8ec2-919107c70938 at100percent; downloaded module2,624,849bytes SHA25682ecac08c2c8cf467c3e0833a5768d33e77f5a7ea2afcc5685a51291daadb2c4 embeds exactmain71d376416c8e8adcf5e4b5e513a1e2d8a9064478 and forced staging discriminator. Migrationv1, signup/owner-observationtrue, no self-service activation; original11:34:18.386Z start/11:54:18.386Z expiry retained. Worker logs/traces disabled/logpushfalse; Container inactive/private/max1, same immutable image, logs disabled.

Production actual deployment614b5e3b/version1a7996dd remains100percent with unchanged module SHA256bbf09a90855e387a91f95d7da4e95d78daeb3fae835cb14d6995e17fe68dfa00. Active truth was read from deployment-selected immutable version, not legacy latest-candidate settings. Bounded staging source delivery ACCEPTED. Root may verify native public documentation/owner aggregate continuity without a private Bee call or runtime activation. No full hosted production acceptance is implied.

## PR67 native continuity disposition

Scoped consumer continuity PASS. Root directly observed at2026-09-11T22:04:48.671Z: existing native owner report docs1, canonical8074-character documentation response, next report docs2; delta1/read_success0, all non-error. Reviewed provider envelope3a177d86d0947ac234b5b5426d0cf39b452e0e50 confirms post-call GET22:08:00.648Z preserved deploymentac05ead2/versiond473a11e100percent and inactive Container with unchanged11:55:35Z status. This follows this reviewer's independent deployed artifact acceptance above; consumer calls themselves were root-observed, not repeated by reviewer.

This proves existing native documentation and owner aggregate continuity after PR67; it does not establish heavy usage, a monthly allowance, private retrieval, cross-user isolation, granted cleanup or production acceptance. No private call or runtime activation is needed to accept this bounded result. Production transition ordering remains separately unaccepted; PR68 source acceptance cannot authorize an unsafe intermediate old-module/new-configuration deployment.
