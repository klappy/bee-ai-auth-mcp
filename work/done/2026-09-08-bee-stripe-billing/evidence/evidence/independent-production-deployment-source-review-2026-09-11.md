# Independent production deployment source review — September 11, 2026

Reviewer: /root/auggie_bee_ship/release_reviewer; no implementation or provider mutation authoring.

## Initial disposition

PR68 headb19c58e22b66d44cf7ff602f0ddb66c37aadfbbe: COOK LONGER. Three bounded findings in the submitted script:

1. Candidate migration_tag is checked only after deployment. Requirev1 during candidate verification before any explicit deployment.
2. A deployment POST can take effect and then fail at the transport/response layer. The current false deployed flag then falsely reports source_deployed:false. Mark mutation outcome unknown once attempted, reconcile through a direct deployment GET, and preserve unknown if that GET is unavailable. Never claim nondeployment from a thrown POST alone.
3. ownerPolicyMatched:true plus policy ID and single-email shape does not detect an owner selector changed before the build starts. Initial/final snapshots catch only later changes. Compare the production admin selector to the freshly shape-validated accepted owner source policy entirely inside trusted runtime, or equivalent immutable trusted acceptance binding. Do not expose or hash private identity in output/manifest.

Other reviewed boundaries are appropriate: accepted:false manifest, no arbitrary quota, source stamp and ancestor guard, active accepted configuration, inherited secret references, exact metadata clone, narrow Access paths/OTP, Worker-first canonical assets and conditional removal of only the obsolete notice, safe error categories, and independent public byte readback. Actual authenticated provider GET confirms the Container allocation/network field shapes used by validatePrivacy. Actual candidate/provider acceptance remains distinct from source review.

Nineteen focused tests are the cook's current return, not independent acceptance of the three missing negatives. Required corrections should add concrete regression coverage; no new provider experiment or production call is required.

## R1 provider-shape correction

The unconditional demand for candidate migration_tag=v1 is narrowed: prior actual undeployed provider versions omit this read-only field. Requiring it unconditionally would reject valid candidates. Required predeployment lineage validation instead rejects any contrary present tag and permits absence only with documented/observed provider omission, unchanged DO namespace/class/SQLite export/Container linkage and no migration mutation payload. Actual deployed version must still reportv1. This corrects the review requirement; it does not waive lineage verification or accept an unseen candidate.

## Corrected exact-source acceptance

Exact-source PASS atPR68 head9ba4badc5161cfbc4c5a1cb95021d01f5940157a. Fresh PR GET confirms final head; all six local source/test/docs/manifest blobs match remote. Script3e1a9622e4195924dc439c1860b445b164c8ff9d, tests6971c6a8b47b8b0457d883f2b62ea2781f318ca8, manifestbef359ed6db600865138ef88341b317aecf105f1. Independent focused suite25tests passed at17:58:21America/New_York.

R1 resolved with predeployment lineage checks, rejection of contrary migration tags and supported undeployed omission; postdeploymentv1 remains mandatory. R2 resolved: deployment attempt startsunknown, failed response triggers independent GET reconciliation and unavailable reconciliation remainsunknown. R3 resolved: current production owner selector must match freshly shape-validated accepted source owner policy inside trusted process; private values never enter receipts. Regression tests cover each negative, including changed lineage with omitted tag, response lost after actual deployment, unavailable reconciliation and owner change before upload.

Manifest remainsaccepted:false; no actual prerequisite acceptance, production mutation or release is implied by this source PASS. Full current-head CI/Bugbot and later actual candidate/provider acceptance remain gates. Phase A custody comparison failure is a separate provider outcome, not overridden by these synthetic tests.

## Fresh provider evidence supersedes source PASS

The prior9ba4badc source PASS is withdrawn for merge after actual Phase A evidence: assets.config alone was not retained in an uploaded version, and legacy script/settings reflects latest candidate bindings rather than necessarily deployed bindings. COOK LONGER pending bounded amendment/source correction. This is fresh contrary evidence, not a new commercial gate.

Corrective design is acceptable: use deployment-selected immutable version for active bindings/module truth; treat legacy settings only as diagnostics. Intentionally omit external assets configuration, assert absence in candidate and deployed version, and serve all known static files through existing generated embeddedAssets. Current active binding set contains no ASSETS/typeassets binding, so none is removed. Reviewed hosted entry routes known files first and otherwise falls through to BeeAuthHandler's404, with no ASSETS reference; protocol/auth route exclusions remain. Exact all-static HTTP byte checks still required after deployment. Await exact landed amendment and corrected source for acceptance; no provider mutation requested.

Exact corrected source amendment ACCEPTED after direct read: DEPLOYMENT-SOURCE-FIRE-2026-09-11.md blob3002b4e4f4af2dabc719fae7639337c0fb7b0099. This authorizes bounded source iteration only; corrected source and actual provider candidates remain to review.

## Provider-informed corrected source PASS

Exact-source PASS atPR68 head1c1eb3e8921f50d4321871c3f2cbec0e923ff532, based on integratedmain71d376416c8e8adcf5e4b5e513a1e2d8a9064478. Fresh PR metadata and all seven owned file blobs matched local reviewed content. Script20306df16006a421486e6e1e7dfbbe6553466b6d, tests9ab52f3ee82bb5a41cb15fc6f103e6ec5fc35e23, production configd70af96fd570d4c0cd7472f4e89f2575a09fc159. Independent29focusedtests passed at18:04:42America/New_York.

Actual provider-observed findings resolved: active metadata/bindings now come from deployment-selected immutable version, with before/after upload checks; legacy settings contributes only a diagnostic comparison. External assets metadata is intentionally omitted and rejected if returned in candidate/deployed version; production config no longer selects an external collection. Existing embedded handler owns known routes and404 fallback; complete16asset generation test verifies canonical bytes/MIME-map preservation and conditional notice removal. No ASSETS dependency introduced. R1 lineage, R2 ambiguous-outcome reconciliation and R3 private owner continuity remain intact.

No remaining source finding. Cook's integrated full-suite return296passed/two hosted skips and TypeScript clean is not relabeled independent hosted acceptance. Current-head CI/Bugbot, actual staging build and later accepted production prerequisites remain separate. Manifestaccepted:false still prevents execution; this PASS does not promote production or waive custody candidate's preserved full-metadataFAIL.


## Combined transaction contract — independent acceptance, September 11

ACCEPTED for bounded source implementation: DEPLOYMENT-SOURCE-FIRE-2026-09-11.md blob fff0712d9f49a9f47d8dba4f1d98816c14f8013f and Otto envelope Release-order correction blob 1a86b6427d6c9ebb01715571d269530719c8f7ca. Fresh provider evidence supersedes the earlier PR68 transition assumptions and source readiness: do not merge or execute that prior transition unchanged. Old source lacks embedded assets and broker RPCs; an old-module/new-config deployment would lose its external assets. No such intermediate is permitted.

One reviewed hosted-source, embedded-assets and desired-configuration candidate is the accepted remedy. Pin the real active deployment/version; preserve its storage/grants and unrelated full writable metadata. Inherit GitHub secrets explicitly from that active version and only the two named new secrets from independently accepted custody version d9d07844-8be5-4437-a89a-d94b2d7b7ac4. Compare exact desired additions and unchanged baseline, not equality to the old eight bindings. Preserve redaction=false. Use the provider-supported version configuration mechanism for Worker logging/traces off, verify returned candidate fields, and refuse deployment if that state cannot be demonstrated. Secret GET establishes presence/type only; trusted submitted selectors establish inheritance provenance.

Container immutable-image compatibility, full configuration preservation and logging-off remain separately reviewed prerequisites before new Worker traffic. Old active Worker logs-on is allowed during preparation; it does not justify activating a broken intermediate. Before explicit deployment, reject active/source/ingress drift and require accepted hosted, policy, Access and Container prerequisites. Final actual candidate acceptance remains separate from this source contract. No provider writes are authorized by this disposition.

Quota-free progress remains local generation, tests and validation with manifest accepted:false; no numeric default or new deployment mode is inferred. Bounded credential-free exact-SHA shallow-history recovery is accepted if it preserves checkout HEAD and verifies reviewed-main ancestry. Fold the observed ACCESS_TEAM_DOMAIN scheme defect into this repair: hostname-only configuration must match verifyAccessJwt's consumer contract, with regression coverage and preservation of the actual remote Autofix changes. Fresh exact-head independent review and CI/Bugbot are required after implementation.


### Logging mechanism reopened — independent schema correction

Independent Cloudflare schema inspection confirms Versions POST metadata does not support observability or logpush. The preceding requirement to apply/verify logging-off as version configuration is withdrawn as unsupported; the overall combined source/configuration remedy remains, but that logging mechanism is not accepted for implementation or mutation. Script settings PATCH does support multipart settings.observability and logpush. Await the exact separately reviewed logging-only amendment: fresh full observability clone, preserve redact_query_string=false and unrelated fields, disable only approved logging fields, then read back actual deployment-selected source/assets/bindings and script logging with no unintended deployment effects. Candidate upload must verify script-level logging-off, not claim nonexistent version-level logging proof. No provider write performed by reviewer.


### Supported script-level logging prerequisite — ACCEPTED bounded contract

Independently read Otto envelope blob 4e3a0bd4a189bbb484d284cee28be483620bf845, Logging schema correction section, and verified Cloudflare OpenAPI GET/PATCH /accounts/{account_id}/workers/scripts/{script_name}/script-settings. PATCH accepts JSON logpush, observability, tags and tail_consumers only; no module/bindings/asset fields. This exact narrow endpoint supersedes the previously considered legacy multipart settings alternative.

ACCEPTED bounded logging prerequisite plan: fresh complete settings and actual active-artifact/ingress/Container snapshots; clone all observability; change only enabled, logs.enabled, logs.persist, logs.invocation_logs, traces.enabled and traces.persist to false. Preserve redaction=false, all rates and other nested fields; PATCH only the cloned observability object. GET and compare the exact intended change and preservation. Read back actual deployment-selected source/version/assets/bindings/deployments; stop on unexpected effects. This accepts the plan, not a claim of observed mutation success. No source or binding upload accompanies this operation.

Source implementation must omit unsupported version observability/logpush fields and require separately accepted effective script-level logging-off before upload, before explicit deployment and after deployment. Combined reviewed source/configuration candidate remains required; no old-module configuration intermediate. Container/image and Access prerequisites remain separate. Reviewer performed schema/Git reads only; no provider mutation. Exact revised source and actual operation readbacks still require independent review.


### Logging-only operation — explicit execution-envelope acceptance

Under root's now-explicit authorization for this operation only, ACCEPTED FOR EXECUTION by Otto: envelope blob 4e3a0bd4a189bbb484d284cee28be483620bf845 logging-only JSON /script-settings PATCH, with fresh complete observability clone and exactly the six previously specified false booleans. All preserved fields including redaction=false, rates, tags, tails and logpush must compare unchanged. Before writing, capture actual deployment-selected module/assets/bindings/version and ingress/Container baseline; after writing, GET effective script settings and all those active surfaces, halt on unexpected changes and report uncertain outcomes without retrying blindly. No source/binding upload, secret operation, Access change, Container rollout or deployment is accepted here. Disabling persisted logs does not depend on numeric quota or hosted grant acceptance. This is operation-envelope acceptance before execution, not a success claim; independent fresh actual readback remains required afterward.

Also independently read and ACCEPTED corrected source prerequisite supplement blob 9250ab9e93638e3ab76a643a4f86d9c522b2455b (commit398ef0488d62954b9a4d770f208c19164878c38b). It accurately separates script-level logging from version configuration and preserves the combined transaction and before/after checks. This source acceptance itself does not authorize other provider mutations.


### Actual logging operation — effective-disabled acceptance, exact-shape FAIL retained

Read actual Otto receipt envelope blob82d2ef0708d5ff8bbefd4f055652fc5fced7d4f9. Exactly one PATCH at2026-09-11T22:23:58.590Z returned200; the exact requested six-boolean comparison FAILED because script-settings returned observability:null and Worker GET retained true nested persist/invocation settings. That failure remains; no retry/repair write is required or accepted here.

Independent authenticated GET at22:24:30.665Z confirms actual Worker resource observability.enabled=false, logs.enabled=false, traces.enabled=false, redact_query_string=false, rates1, logpush=false, no tail consumers or export destinations. Script-settings null is corroborative normalization only, never standalone evidence of disabled logging. Cloudflare's official Workers Logs documentation states observability must be enabled to write Workers Logs (https://developers.cloudflare.com/workers/observability/logs/workers-logs/); API field descriptions explicitly identify the enable switches (https://developers.cloudflare.com/api/resources/workers/). On those documented enable-gate semantics and observed false switches, ACCEPTED narrowly: effective Worker logs/traces disabled. This does not claim nested persist/invocation=false, deletion of historical logs, or completion of Container privacy gates.

Independent22:24:57.262Z deployment-selected version GET confirms unchanged old module2416571bytes/SHA256bbf09a90855e387a91f95d7da4e95d78daeb3fae835cb14d6995e17fe68dfa00, external assets present, eight bindings and no new secrets. Active deployment614b5e3b-5581-4821-8daf-d19289c45ba9/version1a7996dd-1cc0-4046-9e39-56d0aaea4bc8 remains100%. Otto's full before/after active-version, ingress/domain, Container and instance comparisons were unchanged; these comparisons are attributed to the operation receipt rather than invented independent pre-PATCH snapshots.

Accepted source predicate at preupload/predeploy/postdeploy: authenticated Worker resource GET must explicitly report observability.enabled===false, observability.logs.enabled===false, observability.traces.enabled===false, redact_query_string===false, logpush===false, with no tail consumers or log/trace destinations. Missing/unknown enable fields fail closed. Preserve observed rates and unrelated fields against accepted baseline. Script-settings may be null for observability only with the authoritative Worker checks passing; never accept null alone or require retained nested persist/invocation booleans false. Include regression fixtures for this exact normalization, enable-field drift, missing evidence and configured export sinks. No further provider mutation authorized.


## PR68 final combined-source correction — exact-head source PASS

Fresh GitHub PR GET and seven remote/local blob comparisons pin source PASS to d9749cc5f1b909702a389fa57302f18a0638d166. Script345892899d17305f64a7f28756896d67a5351af7; testsf2aaa1ab54fe1cc168d95328e6e7b8cdb9033df7; manifest7b43facab960cc784573e3f886cd5a5f7cef3d80; docs10bb1c3a00f7f8eedbca26095c29d6717403cae0; debriefcdad35fb3354b3b6870f7424f264de9ad9516e81; orderd038c99221f002310e373f0c4b2bd5d8d66d3f27; production configd70af96fd570d4c0cd7472f4e89f2575a09fc159. Independently ran45focusedtests PASS at18:28:00America/New_York. Cook's TypeScript clean/full312passed/two skips remains attributed local return, not hosted acceptance.

Reviewed corrected combined desired configuration/source upload and exact active/custody inheritance selectors; no old-module configuration intermediate, secret values or unsupported version logging fields. Seven nonsecret additions are exact and derived from accepted manifest, which remains accepted:false with unset monthly policy. Actual active/custody preservation fields including urls were independently read-only compared equal. Normalized effective Worker logging checks match the accepted three-gate contract; null alone, missing/enabled flags and export sinks reject. Homepage transformation/static byte preservation, migration lineage, owner identity continuity and uncertain deployment reconciliation remain. The real JWT-verifier regression proves hostname-only binding; bounded fixed-public-URL ancestry recovery preserves checkout HEAD. No remaining blocking source finding.

This source PASS supersedes earlier transition-source dispositions, without erasing their findings or provider FAIL receipts. Current-head CI/Bugbot and actual staging remain separate gates. Production candidate/prerequisite review, numeric policy, hosted evidence and promotion are not inferred from this source acceptance. Reviewer made no provider mutation.


## Production Build command-only wiring — conditional execution-envelope ACCEPTED

Independently read Otto envelope blob7ada172c8702fdb16fb0a2151bc474b68d7fe608 (commit75b3c9b365742c0b962172809398703609a36510) and verified live trigger PATCH schema and distinct build-start POST. ACCEPTED FOR EXECUTION only after actual PR68 merge with required exact-head checks and immutable merged-source verification that deploy/production-prerequisites.json remains accepted:false. Until then no write. Existing production trigger40a4940d-5c14-4721-908f-a7c304ae2adf only.

Clone all present writable trigger fields from fresh GET, replacing only build_command with `npm ci && node scripts/gen-version.mjs && npm run typecheck && npm test` and deploy_command with `node scripts/deploy-production.cjs`. The live schema/envelope enumerates ten writable fields (not eleven in a dispatch shorthand); use the exact named schema fields. Preserve production-only branch selection, paths, token identifier, repository/Worker identity, caching and every other field; modified_on alone may advance as audit metadata. No token value retrieval, manual run/retry, branch push, source deployment, Access/Container mutation or release activation.

Require complete paginated production build inventory quiescent before PATCH, unchanged afterward, plus latest-build comparison; never infer quiescence from the first20 of179 historical records. Snapshot/read back actual active source/version/assets/bindings, deployments, effective logging, ingress, Container/instances and staging trigger/configuration unchanged. Independently progressing staging build is outside this mutation. On failed/uncertain PATCH, read back and report observed outcome without blind retry. This acceptance approves the bounded command preparation under the stated merge gate; no actual operation success or future production promotion is claimed. Independent actual readback remains required after Otto executes.


### PR68 source acceptance reopened — computed version URLs

Required Bugbot finding3993920694 on d9749cc5 identified urls copied into writable metadata. Independent exact JSON /workers/workers/{worker_id}/versions POST schema confirms urls has readOnly:true and describes per-version routable URLs. The preceding observation that active/custody URLs were equal never proved writable input; source PASS is reopened for this bounded finding before merge. Remove urls from writable payload and custody/candidate configuration equality, while retaining actual active-artifact drift comparisons. All other nine FIELDS are present in this exact POST schema without readOnly flags: cache_options, compatibility_date, compatibility_flags, containers, limits, main_module, package_dependencies, placement, usage_model. Require focused regression against the schema's computed-field distinction and fresh exact-head acceptance. No provider mutation or merge accepted meanwhile.
