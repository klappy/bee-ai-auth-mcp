# Bee production ship envelope — September 11, 2026

Current source-contract amendment: see **Worker-owned embedded assets correction** below. It supersedes the earlier run_worker_first metadata selection after actual API evidence. Phase A preservation FAIL remains historical fact; no dependent provider writes are authorized by this amendment.

Status: preparation only; not independently accepted; no provider mutation performed.
Owner: Otto /root/auggie_bee_ship/otto, bounded infrastructure/security return to Auggie.
Observed 2026-09-11T21:29:55.897Z (17:29:55 America/New_York).
Authority: Klappy reviewed the protected homepage and said “good enough to ship!” this turn. Copy/visual approval and ship direction are settled subject to applicable technical acceptance. This document does not invent quota amounts, billing activation, private identities or additional financial commitments.

## Fresh observations

Cloudflare OpenAPI search and authenticated GETs succeeded with HTTP 200. Exposure, authentication and provider read access are proven; this is not a mutation receipt.

| Surface | Actual current value |
|---|---|
| Account | b03e6ea242724c05eb97eb732cceb21d |
| Production Worker/tag | bee-ai-auth-mcp / 27b750389ea04ed1af1a6c50dc0e5e37 |
| Production deployment/version | 614b5e3b-5581-4821-8daf-d19289c45ba9 / 1a7996dd-1cc0-4046-9e39-56d0aaea4bc8 at 100% |
| Production custom domain | bee.klappy.dev, domain d1949a5b447e9deff5652e7be227fd10d787957a |
| Production OAuth KV | 8f260f3c8ab6476dbea2b17926bf38bf |
| Production BeeBridge DO | 22228994536c4bb3808aa281c53e9727 |
| Production Container | a0318e64-bcdf-4095-bbcc-3400033b3290, bee-ai-auth-mcp-beebridge |
| Production image | registry.cloudflare.com/b03e6ea242724c05eb97eb732cceb21d/bee-ai-auth-mcp-beebridge:1a7996dd |
| Production allocation | max_instances 1; 0.25 vCPU; 1024 MiB; 4000 MB disk; private network |
| Production logs | Worker enabled, persisted invocation logs; redact_query_string=false; traces disabled; logpush=false. Container logs enabled |
| Production binding presence | GitHub client ID/secret present as secret bindings; consent signing secret absent; Access and signup configuration absent |
| Staging version/deployment | 827fa8d8-78d6-4cda-bb4a-3e4910b72647 / 5320ba3d-a6d1-4616-a819-2572622301a0 |
| Staging flags/window | SIGNUP_ENABLED=true, OWNER_USAGE_ENABLED=true; expiry 2026-09-11T11:54:18.386Z; no self-service quota flags |
| Production build trigger | 40a4940d-5c14-4721-908f-a7c304ae2adf; branch production only; npx wrangler deploy --config wrangler.production.jsonc |
| Staging build trigger | ef89722b-f048-4889-894f-be7a841d682c; main only; npm ci + version + typecheck + tests; scripts/deploy-staging.cjs |

Container existence is confirmed by a second narrowly filtered read. An early crew message incorrectly inferred only staging existed from truncated output; corrected immediately. No production replacement resource is needed.

All five Access apps were read. Three are staging-only: 5ae63959-05d5-45a7-a9bd-237c271245c0 (email/signup/preview), 8fc54e03-24c8-4c02-9376-7c639a3ca94e (admin), f5c6bb74-2b83-441a-a316-08de4c68743a (protocol bypass). None currently targets bee.klappy.dev or bee-ai-auth-mcp.workers.dev. Unrelated app 157ccc32-1cd7-4c7b-a23e-0a70cf3921e6 targets kitchen rail and review workers; its worker selectors are not Bee protection. Tincan 975f893c-b9a6-47c3-800b-99803a2c8959 targets *-tincan.klappy.workers.dev. Preserve both unrelated applications.

## Source gap that must close before promotion

Current main 2993b9c158a9214736253d375060d91df1deaf31 cannot deliver the reviewed experience through the current production config. wrangler.production.jsonc blob 68a9d9027b5993d2b0e058e0121479b211e82aa6 selects src/index.ts. That entry exports the base bridge and does not route signup or implement admission/quota RPCs. Those live in src/staging.ts blob d9ebc933b98604172b0d3d1aeb21dc809d908db9, whose validation expiry and GitHub 404 are unsuitable for production.

Required bounded source work: a production hosted entry and shared admission/quota implementation; retain staging expiry/budgets in staging; preserve existing GitHub grants and OAuth refresh without forcing email admission epochs on them; enable both production login doors. Keep default-disabled self-service until an approved positive monthly limit and policy version exist. Preserve separate storage and all current grants. Do not copy staging grant state or owner telemetry into production. Public copy must describe actual enabled behavior at release.

Tests and fresh review must cover old GitHub grants/refresh, new email enrollment and deny/revoke, quota disabled/invalid/enabled policies, hardened registration/PKCE, unauthenticated OAuth discovery and MCP challenge, and staging-only expiry. This is a source requirement, not a request to reapprove the product goal.

## Concrete provider transition, gated before execution

1. Re-read production settings, current version/modules, deployments, Container configuration, domain and all Access targets. Pin exact source head and accepted immutable CLI image. Halt on drift, unexpected live split or unresolved applicable selectors.
2. Reuse production Worker, KV, DO, Container, custom domain and existing GitHub secret bindings. Do not create another subscription, duplicate production storage, replace grants or rotate existing OAuth credentials.
3. Create production-specific Access email OTP coverage only on browser identity routes needed by the accepted hosted entry: /signup and descendants, /authorize/email and descendants. Do not wrap homepage, /mcp, /.well-known, /register, /token, /authorize, /authorize/github, /callback, /consent or /pairing in an Access interstitial. Production administrative routes use separate ADMIN_ACCESS_AUD and trusted ADMIN_OWNER_EMAIL bindings, with a separate owner-only app and audience; never reuse staging audiences or bind the production admin to staging's binding names. The same human owner may be resolved from the existing trusted owner-only Access policy without exposing the identity; production receives a distinct ADMIN_OWNER_EMAIL secret binding. Review both production custom-domain and workers.dev alternate-host ingress. Admission/deny is enforced by the application after verified email, not an email-account-provider requirement.
4. Generate a new production consent-signing secret entirely within the trusted authorized runtime; inherit existing GitHub secret bindings. No secret values or private identities in model context, Git, journal or review. Source contract already specifies that in-flight minute-lived consent/pairing state restarts on this signing-key transition; existing token-wrapped grants are preserved. For the private production owner binding, freshly validate the existing staging admin policy shape inside trusted tooling and derive the same already-authorized human owner from its sole email selector; create a distinct production ADMIN_OWNER_EMAIL secret without returning the value to the model or chat. This preparation has not generated or installed secrets.
5. Set production Access issuer/audiences and hosted signup configuration from created resources. SELF_SERVICE_ENABLED and numeric monthly policy remain disabled until the actual approved allowance is recorded. No arbitrary default, inferred trial, Stripe object or recurring charge.
6. Configure private runtime logging before first real-CLI execution: proposed release configuration disables production Worker invocation/persisted logs/traces and Container logs, preserving unrelated settings. Production redact_query_string is a separately held field: leave false unless specifically accepted later; never treat isolated approval as its authorization. Clone complete observability settings before any accepted narrow mutation and compare after. No log deletion is proposed.
7. Preserve max1 basic allocation and private network. Update the existing production Container to the independently accepted real-CLI immutable image, with logs off. OpenAPI confirms image/config changes use an application rollout, not the limited PATCH configuration object (which only exposes authorized_keys). Treat rollout as deployment-adjacent: coordinate with source deployment, inspect actual rollout and current instance image/state, halt on unexpected allocation or traffic.
8. Source promotion is the existing main→production PR55 after feature→main staging acceptance. The repository push is the deploy trigger. Make the production build use a reviewed preservation/readback mechanism or validate wrangler's exact effects beforehand; current command alone does not prove preservation. Prefer version upload deploy=false then candidate verification then explicit deployment inside the Git-triggered build. Preserve full metadata and bindings, inherit secrets, verify KV/DO linkage and migration tag, and record module hash/version/source. No seat wrangler deploy.
9. After each material provider write, perform direct readback. Verify public /version, exact approved homepage assets/copy, JSON OAuth metadata, proper unauthenticated MCP challenge, no Access interstitial on protocol endpoints, correct browser identity protection and private logging configuration. Actual authenticated consumer acceptance remains distinct from these public checks.
10. Keep a reviewed rollback commit/config for the previous production version and image while preserving all stored grants. No automatic destructive rollback, storage deletion or signing-key erasure. Observe a failure before invoking the bounded rollback path.

## Actual unresolved choices and evidence

The next human commercial choice is the numeric recurring monthly free allowance; the existing docs-call counter proof is not a usage baseline. Source preparation and review proceed without inventing it. No new generic ship/copy approval is owed.

The original up-to-$5 approval remains scoped to isolated validation. Production reuses its existing paid account and unchanged max1 allocation; no new resource or subscription purchase is proposed, and no generic new-money approval is justified merely by shipping. The bounded release-validation estimate below makes expected incremental consumption concrete. It is not a total-bill guarantee or a provider-enforced spend cap. Do not invent a $1 charge, import isolated expiry into production, or require full-invoice reconciliation before ordinary authorized release work.

Controlled second-account grant isolation and active-grant cleanup still need real hosted evidence before whole hosted-service acceptance; owner allowed that work later/in parallel, not as a blocker on independent source/config preparation. Do not claim those tests passed or destroy the working owner grant to simulate them.

## Review disposition and receipts

This envelope is DRAFT / NOT ACCEPTED. No provider writes, source deploy, new runtime window, secret creation, production release or billing activation occurred in this bounded preparation.

Read-only receipts: Cloudflare execute GET inventories/settings/deployments/Access/apps/Container apps at 21:27:52Z, 21:28:10Z, narrowed 21:28:42Z, domains 21:29:18Z and trigger/settings 21:29:55Z. All listed material reads HTTP200 success. Only non-secret presence and safe identifiers retained here.

Boarding reads included live RECIPE, constraints, STACK, HYGIENE, KITCHEN/RULINGS/LANES/cook, Otto card/legibility, current charter/checkpoint, auth ticket and matching journal tail. Ordering was imperfect: provider read preceded completion of kitchen line check; disclosed rather than marked fully compliant. Auggie owns the whole-rail reconciliation and captain journal via EA.


## Bounded consumption proposal — fresh pricing, 21:33 UTC

Recommendation: validate the first accepted production promotion during one active session lasting at most two hours, with at most 100 deliberate Bee retrievals and 10 deliberate pairing attempts, at most 1,000 total controlled HTTP requests including discovery/polling, and the existing ten-minute idle tail. Stop generating test traffic once evidence passes or a material unexpected resource/traffic effect appears. This is an operator test bound, not a new per-user free allowance or public request cap. Preserve max_instances=1, basic allocation and sleepAfter=10m. Do not install a production time-bomb to make an estimate exact. Do not claim after-session monitoring.

Fresh official [Containers pricing](https://developers.cloudflare.com/containers/platform/pricing/) states CPU $0.000020/vCPU-second, memory $0.0000025/GiB-second, disk $0.00000007/GB-second; CPU is active usage while RAM/disk are allocated while running. For the observed 0.25 vCPU, 1 GiB, 4 GB instance, counting CPU fully busy throughout gives $0.028008/hour. Ignoring included credits makes this conservative. Egress is at most $0.05/GB across published regions.

[Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) adds $12.50/million GB-seconds and $0.15/million requests. Conservatively counting one 128 MB object continuously active adds $0.00576/hour. Two hours plus ten minutes is therefore $0.073164 for Container and that DO compute. A full 24 hours at these maxima is $0.810432; this is a compute envelope, not all account charges.

[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) lists $0.30/million requests and $0.02/million CPU milliseconds after included usage. The observed production version has no explicit limits object; the published default CPU limit is 30 seconds. Even charging all 1,000 controlled requests at that full default is $0.6003. This is deliberately much more pessimistic than ordinary relay work and is not a newly configured limit.

A planning allowance of 1 GB Container egress adds at most $0.05, plus $0.05 contingency for small KV/DO storage/request activity: approximately $0.78 for the described deliberately pessimistic release exercise before included usage. The 1 GB and storage contingency are estimates, not enforced bounds. The application 512 KB response-display truncation occurs after reading upstream data, so it is NOT a network egress limiter and must never be cited as one. No private payload sampling is required for this estimate.

These calculations neither create a $0.78/$1 approval request nor establish a new budget. Existing same-capacity operation and the user's ship direction are the authority context; the coordinator should only surface an actual additional commitment if the accepted release requires one. Uncontrolled concurrent traffic, repeated release exercises, pathological downstream payloads and ongoing ordinary production usage are outside this small exercise estimate. Read actual provider aggregate resource/traffic counters at release if exposed; absence of a complete invoice is not itself a blocker. Source/runtime/privacy and numeric-policy acceptance are the current concrete gates.

Additional authenticated GET at 2026-09-11T21:33:53.772Z confirmed current production version migration_tag=v1 and BeeBridge container linkage; no explicit limits object was returned. No mutation performed.

Fresh selector resolution at 2026-09-11T21:34:52.729Z: worker tag d4de52630387490b9be77fa431462ae5 resolves klappy-kitchen-rail; 6f462dbf91bf44dfb01f0afa1a6c5e08 resolves klappy-kitchen-rail-hud-review. Both are unrelated to Bee. The production source cook will use ADMIN_ACCESS_AUD / ADMIN_OWNER_EMAIL for admin, preserving staging names and behavior; bindings remain uncreated.


## Deployment-source supplement — concrete selected mechanism

Selected design for the bounded deployment cook: add `scripts/deploy-production.cjs`, derived from `scripts/deploy-staging.cjs`, and update the production config/docs in the same reviewed PR. This is the exact chosen mechanism, not an open choice between asset systems. Homepage PR66 corrected head 267c7fd202414315bd3ce49872dbd3300bd4bf2b has unchanged approved asset tree f5b4509a4f915a7354a5bed45a9cc3e6939600ed.

### Source and asset selection

- Bundle `src/hosted.ts` with the same esbuild options/static node:path shim as the accepted staging deploy script. Retain one canonical approved HTML source and its existing generated embedded-asset pipeline; no duplicate homepage literal.
- Set candidate `assets.config.run_worker_first=true`, preserving the other current asset configuration fields (`html_handling=auto-trailing-slash`, `not_found_handling=none`). The hosted entry handles root and supported static asset paths via the updated `embeddedAssets` map before OAuth fallthrough; unknown paths receive its established 404. All deployed old external static assets are superseded at routing by this explicit Worker-first handler, not silently relied on.
- HEAD, CSS, manifest, icon paths and content types must match the generated asset contract. `/signup`, `/admin`, OAuth metadata and protocol paths never fall into the asset responder. Private preview remains staging-only. No asset-upload JWT or public credential appears in source.
- Exact source SHA is the reviewed main after homepage/runtime/deployment PR integration, stamped by `scripts/gen-version.mjs`. The script reads its own generated version and fails if it does not match the Git-triggered production commit. It does not reuse the historic 2993b9c1 as a release candidate.

### Production Build trigger

Existing trigger `40a4940d-5c14-4721-908f-a7c304ae2adf` stays branch-includes [production], excludes [], root /. Proposed exact build command:

`npm ci && node scripts/gen-version.mjs && npm run typecheck && npm test`

Exact deploy command:

`node scripts/deploy-production.cjs`

Staging trigger and `scripts/deploy-staging.cjs` remain untouched. No manual build launch substitutes for the existing main→production PR merge. Build config change is separate, reversible provider configuration, read back before promotion. Do not put secret values in build logs/command arguments.

### Script phases and invariant checks

1. **Preflight without writes.** Require `WORKERS_CI_BRANCH=production`, expected account, production Worker/tag, single 100% current deployment and full current version/modules. Require production KV 8f260f3c8ab6476dbea2b17926bf38bf, DO 22228994536c4bb3808aa281c53e9727 and migration_tag v1. Require both existing GitHub secrets present and unchanged allow-list semantics. Require accepted production Access app IDs/audiences/issuer, independent admin bindings, dedicated signing secret, approved numeric monthly-policy tuple, and exact existing Container app a0318e64-bcdf-4095-bbcc-3400033b3290. No script-created secret or invented monthly value.
2. **Preservation inputs.** Clone existing full writable version metadata as in staging: assets, cache_options, compatibility date/flags, containers, limits, main_module, package_dependencies, placement, usage_model; preserve all bindings, with `inherit` references for secret bindings. Apply only reviewed hosted source, Worker-first assets configuration, and explicit approved hosted bindings. Existing GH secrets/KV/DO/grants are neither copied to another store nor rewritten. Preserve migration v1; do not issue a new migration merely to export the same class.
3. **Required provider prerequisites before source deploy.** Production Worker logs/traces disabled with logpush false; production Container app has accepted immutable image, private network, max1/basic and logs disabled; production preview URLs disabled but ordinary workers.dev URL preserved. The deployment script only verifies these conditions; it does not perform infrastructure rollouts or hide provider mutations within its preflight. If not met, fail before version upload. This separates reviewed technical preparation from the source deploy transaction.
4. **Upload candidate.** POST `/accounts/{account}/workers/workers/27b750389ea04ed1af1a6c50dc0e5e37/versions?deploy=false`. Embed the new single module and compatible exported BeeBridge SQLite Container linkage as in the tested staging uploader. Record safe candidate ID and module SHA256; do not log metadata bodies or secret inheritance payloads.
5. **Read candidate before deployment.** GET the exact candidate with modules. Check module bytes/hash/source stamp, all writable metadata, exact normalized bindings, asset-routing delta, exports/Container linkage. GET live settings and deployment again; abort on drift or any unexpected deployment side effect. An upload alone is not release proof.
6. **Explicit deployment inside Git-triggered build.** POST `/accounts/{account}/workers/scripts/bee-ai-auth-mcp/deployments` with one candidate at100%, strategy percentage and safe source annotation. No manual seat deployment.
7. **Material readback.** GET actual active deployment/version/modules/settings, Worker observability, subdomain, Container application and instances, custom domain, and staging deployment. Verify exact active source/hash, migration v1, preserved storage/secrets, Worker-first assets, logging/privacy, image/allocation and staging unchanged. Fetch only public-safe /version, homepage/assets, OAuth metadata and unauthenticated MCP challenge; never log OAuth/private response bodies. Emit a safe machine-readable receipt with booleans and non-secret identifiers.
8. **Failure handling.** Print phase, candidate ID if created, safe HTTP/error category and no payload. Fail the build. Do not auto-rollback or delete state. A source-deployed/readback-failed case is explicitly distinguished from pre-upload failure.

### Provider prerequisite transition order

The exact image selected is the already tested immutable staging CLI image, reused without rebuild:

`registry.cloudflare.com/b03e6ea242724c05eb97eb732cceb21d/bee-validation-20260909-455501a57e820ab6c3eb927b699d02cb@sha256:5f732c594b2c5dbb1b06de2ff2ec81bfb45ca075eb6dcb9f71ea6c839ac09306`

Do not infer a new tag is equivalent. Existing production Container is currently inactive on the old1a7996dd image, observed via HTTP200 instance read at approximately21:39:36Z.

A. Freshly read/clone complete production observability; change only enabled/logs.enabled/traces.enabled to false, keeping logpush false and preserving redact_query_string=false and all other fields. Read back settings/Worker/deployment. No query-redaction change or historical log deletion.

B. GET the full current production Container application configuration immediately before the write. Snapshot it inside trusted tooling. Clone every writable target_configuration field advertised by the live rollout schema (authorized_keys, command, entrypoint, environment_variables, image, instance_type, observability), retaining absent-versus-present semantics. Change only image and observability.logs.enabled=false in that clone. Map the observed basic allocation explicitly to instance_type=basic; preserve observed environment/command/entrypoint/key values without printing them. Preserve the application-level max_instances and network settings outside the rollout target, and compare them after. Create a rollout on the **existing** production Container application through POST `/containers/applications/a0318e64-bcdf-4095-bbcc-3400033b3290/rollouts`, strategy rolling, kind full_auto, step_percentage100, with target_configuration set to that complete writable clone, not a partial image/logs object. No unspecified merge semantics are assumed. If current configuration contains a meaningful field not represented by the rollout schema, resolve its documented preservation/translation before proceeding; do not silently drop it. OpenAPI explicitly distinguishes this from PATCH configuration (authorized_keys only). Verify returned rollout, then GET application and every affected instance until their actual configuration is consistent or the bounded observation fails. Compare all preserved fields against the snapshot: max_instances, allocation, network, environment_variables, command, entrypoint, authorized_keys, plus all unmodified observability fields. Permit only the exact image and logs.enabled deltas. An omitted field that disappears or changes is a failed preservation check. Only then is the source-deploy prerequisite met. A target config alone is not an observed running-image receipt.

C. Both the old Worker entry and the accepted new image must be compatible for private /v1 forwarding during this intermediate state; current hosted staging already uses that image for real /v1/me retrieval. No CLI pairing test is launched by the rollout itself. If compatibility cannot be established by source/image evidence, halt before rollout and revise ordering rather than experiment on production. A new Worker entry is never deployed while Container/Worker logs are enabled.

D. Production Access/admin/signing configuration is prepared using a separate reviewed version-only configuration candidate, with secrets generated/held in trusted tooling and existing secrets inherited. No legacy secret API is used casually: any API creating a version or deployment is treated as deployment-adjacent and checked. The final source build consumes only independently accepted prerequisites. Exact generated app IDs/audiences and configuration candidate ID enter an amendment before their dependent activation; absent values are not fabricated here.

E. Merge the accepted main→production PR only after all above prerequisites and the actual monthly-policy decision are satisfied. Observe the actual Git build and all readbacks before announcing release.

### Complete selected Access and ingress map

Fresh GET21:39:22Z shows production workers.dev enabled **and previews enabled**. Selected change: keep existing ordinary `bee-ai-auth-mcp.klappy.workers.dev` compatibility but set previews_enabled=false. No wildcard preview Worker can bypass the new browser protection. This is production-scoped only.

Use one production email OTP app covering these exact destinations on **both** `bee.klappy.dev` and `bee-ai-auth-mcp.klappy.workers.dev`:

- /signup
- /signup/*
- /authorize/email
- /authorize/email/*

Its audience binds only `ACCESS_AUD`; issuer `https://klappy.cloudflareaccess.com`. Policy accepts verified email OTP without restricting email-provider/account type. Explicit denied/revoked user decisions remain application-enforced.

Use a separate production owner-admin app covering /admin and /admin/* on both hosts. Its distinct audience binds `ADMIN_ACCESS_AUD`; owner identity remains private in trusted `ADMIN_OWNER_EMAIL` custody. Unauthenticated/wrong-app audience must fail server-side even if edge configuration drifts.

Homepage/static assets, /mcp, /.well-known and descendants, /register, /token, /authorize, /authorize/github, /callback, /consent and /pairing descendants remain outside both apps. No extra broad protocol bypass is needed with these narrow apps and the observed absence of account-wide Bee coverage; re-read all applicable targets before activation. Do not weaken kitchen/tincan apps.

### Rollback shape

Prepare a Git rollback commit/PR restoring prior source selection and old production image reference without changing KV/DO/secret/grant storage. Retain privacy protections (logs remain off, redaction unchanged). A rollback must not automatically re-enable logging merely because old config did. Existing production custom domain/normal workers.dev remain. No second subscription, state deletion, migration reversal or secret erasure. The precise failure determines whether source-only rollback suffices or the Container image also needs a reviewed rollout; no automatic destructive recovery.


## PR66 staging source readback — 21:44:21 UTC

The approved homepage source preparation merged to main d18828e94ee6c3ab6bad5b331ecb4d882d9567c7 and completed existing staging Build cf55b054-8bbd-4c8a-9f65-f5ecb8c665b2 successfully at 2026-09-11T21:43:50.162Z. Direct provider GET at21:44:21.387Z confirmed deployment4a1c6efe-3f7f-4215-b6e8-efde7f1f24d3, version34e9ccc5-5d3b-4d59-9b41-7a1debe5f62a at100%, migrationv1, moduleSHA256 b4a798cf52c0f26fb1fd49fcc536b6df363abdf8fa005d57b8baf3fdf1046b09,2,623,540bytes and exactmain source stamp. This is staging source delivery, not production publication.

SIGNUP_ENABLED=true and OWNER_USAGE_ENABLED=true were preserved; no self-service flags were present. Validation start11:34:18.386Z/expiry11:54:18.386Z remained unchanged. Existing staging Container was inactive, private, max1, unchanged immutable image and logs disabled; Worker logs/traces stayed disabled. Production remained deployment614b5e3b-5581-4821-8daf-d19289c45ba9/version1a7996dd-1cc0-4046-9e39-56d0aaea4bc8 at100%. No private call was made for this verification.


## Same-owner custody clarification — independently accepted preparation

Fresh read at 2026-09-11T21:46:45.936Z returned HTTP200 for staging admin Access app8fc54e03-24c8-4c02-9376-7c639a3ca94e: exactly one allow policy fb785d29-4812-436d-9d19-1476593d6203, exactly one nonempty email selector, zero require/exclude selectors. Only shape/count booleans and safe IDs were returned; the private email value never entered model context or Git.

The independent reviewer accepted reuse of this already-authorized same human owner through trusted custody, so no new human identity question is needed. Immediately before any permitted generation, re-read and validate that exact policy still has one allow/one email and no other selectors. Within trusted tooling only, use that email for the new production owner-only Access policy and distinct ADMIN_OWNER_EMAIL secret binding. Return only shape/match booleans and source policy ID; never the value. Production ADMIN_ACCESS_AUD comes from its own new production app, never the staging audience. No staging OAuth grant, admission record, storage or telemetry is copied.

This clarification accepts the identity provenance and construction plan. It does not authorize a provider write before the complete concrete candidate is independently accepted.


## Exact OTP policy selection — fresh source for deployment checks

At21:50:57Z, authenticated GETs confirmed the existing staging email and admin apps both use allowed_idps=[c47d1caf-ecad-4abc-8c66-17c96c9ff5fd], auto_redirect_to_identity=false. A direct identity-provider GET confirms that ID's type is onetimepin. Selected production apps reuse this existing identity provider, not the staging app audiences. Email app session15m and admin1h follow the current proven shape.

Production email policy shape is exactly one allow policy, include=[{everyone:{}}], require=[], exclude=[], with the app restricted to that sole onetimepin IdP. Everyone here means any email verified through the selected OTP provider; it is not an unauthenticated bypass policy. Production admin policy is exactly one allow with one private email selector, no require/exclude, resolved using the accepted trusted same-owner procedure. Code compares structural shape and safe IDs, not a committed bare hash of private identity-bearing policy content.

Access app destinations use [{type:"public",uri:"hostname/path"}, ...] with the exact selected two-host sets above. Deployment preflight must verify the full set, app type, allowed IdP/type, separate audiences, session durations and policy shapes, not audience alone.


## Phase A — real secret-custody candidate, no live behavior change

Status: exact proposed operation for fresh independent acceptance; not yet executed.

The live Workers version-create schema explicitly supports query `deploy=false`; `deploy=true` is documented to create a100% deployment. Secret-text binding values are write-only. Access self_hosted creation requires a domain and offers no disable flag in its current schema. Therefore Phase A will **not** create “inactive” production-path Access apps or guess that an empty destination list is detached. Those ingress mutations wait for their applicable acceptance.

Selected operation: create one **undeployed custody-only version** of the existing production Worker. It stores the two missing production secrets for future inheritance while changing no active source, settings, traffic, image, logging, quotas, Access targets or runtime.

1. Fresh GET production current deployment/settings/Worker observability/subdomain/Container application+instances/custom domain, current version with modules, and all Access apps. Require active version1a7996dd-1cc0-4046-9e39-56d0aaea4bc8/deployment614b5e3b-5581-4821-8daf-d19289c45ba9 unless a newer separately accepted baseline is explicitly recorded. Snapshot all results inside trusted tooling; output only safe IDs/booleans.
2. Freshly re-read staging admin app/policy and verify exactly one allow policy with one nonempty email selector, no other include/require/exclude selectors, exact source policy fb785d29-4812-436d-9d19-1476593d6203. Resolve that same human owner inside tooling only.
3. Generate32cryptographically random bytes via trusted runtime WebCrypto and encode into a signing secret. No token, random bytes, email value or secret fingerprint leaves trusted tooling.
4. Construct version-create payload from complete current writable metadata and exact existing module bytes. Preserve all non-secret bindings byte-for-byte. Existing GitHub secret bindings use inherit with explicit old production version ID. Add only `CONSENT_SIGNING_SECRET` and `ADMIN_OWNER_EMAIL` as secret_text values in this provider request, sourced from steps2–3. Do not add SIGNUP_ENABLED, SELF_SERVICE_*, Access audience/issuer or any runtime timestamp.
5. Preserve current Container linkage and DO namespace. The current legacy version has no returned declarative exports, so do not silently introduce an exports migration/tombstone. Reuse the supported current containers [{class_name:"BeeBridge"}] and all current binding IDs; preserve read-only migration lineage as an expected future-deployment check, not a new migration. If the provider requires a material metadata adaptation, stop on the safe API rejection and return the exact non-sensitive schema finding for review; no experimental deploy.
6. POST exactly `/accounts/b03e6ea242724c05eb97eb732cceb21d/workers/workers/27b750389ea04ed1af1a6c50dc0e5e37/versions?deploy=false`. Never call deployments, legacy secrets, settings PATCH, Access POST/PUT, Container rollout or subdomain mutation in this phase.
7. GET the actual returned candidate with modules. Compare full module bytes/hash and all writable metadata with the intended payload, except provider read-only fields. Compare normalized binding names/types/values for all non-secret bindings, prove both new secret bindings are present and existing GH secrets are inherited. Secret value equality cannot be recovered through the GET API; do not claim a secret readback.
8. GET every active surface from step1 again and compare. Active version/deployment/settings, Worker logs/redaction, subdomain flags, Container configuration and instance state, domain and Access target sets must remain unchanged. Unexpected live effects mean FAIL and no follow-up activation.
9. Record safe candidate ID, old active version/deployment, module hash/byte count, metadata/binding preservation booleans, new secret-presence booleans, trusted owner-source-policy match, and explicit deployed=false. The candidate is custody-only and must not be used as a production release, public-asset deployment or whole-service acceptance. In particular, old external static-asset content is not proven reattached by a version metadata clone.
10. Later accepted production source/config preparation may inherit the two new secrets from this exact candidate version. It must still satisfy independent source/image/config/hosted acceptance and the actual monthly-policy decision before activation. Phase A does not set the final release manifest accepted=true.

This bounded phase creates no new Worker, KV, DO, Container, subscription, Access application or traffic window. It obtains real provider-held secret custody without asking Klappy to paste sensitive material or pretending the release candidate is already complete.


### Explicit future inheritance semantics

The live Cloudflare version-create OpenAPI `bindings.oneOf[type=inherit]` includes optional `version_id`: an explicit version ID selects the source; literal latest is also accepted and is only the default when omitted. It does not restrict selection to the active deployment. This differs from the existing staging uploader's deliberate choice to always inherit active-version secrets.

The later separately reviewed full configuration-candidate builder must therefore accept a reviewed `secret_custody_version_id` and explicitly use `{type:"inherit",name:"CONSENT_SIGNING_SECRET",version_id:secret_custody_version_id}` plus the equivalent ADMIN_OWNER_EMAIL binding. Existing GitHub secrets still inherit from the exact current active production version. Never use latest, never attempt secret GET extraction, never regenerate merely because the staging helper only knows active-version inheritance.

Before using that ID, GET it, check the recorded unchanged source/metadata and both expected secret binding names/types, and check it belongs to this production Worker. After uploading the later candidate, read back those binding names/types and all other expected fields; a provider inheritance rejection stops before deployment. The provider's documented explicit-source mechanism provides recoverable custody; the initial Phase A will not pretend it has already demonstrated a second inheritance upload. The intermediate full configuration-candidate construction, not the final source deploy script, owns this explicit source selection. After hosted and configuration gates pass, that full configuration candidate is explicitly activated and read back. Only then does the final production source Build run; it retains the accepted configurationVersion flow and inherits all secrets from that active accepted configuration version. Phase A does not alter the final source uploader's active-version contract.


## Phase A actual execution — preservation FAIL, writes stopped

Fresh independent review accepted the exact Phase A plan at blob4f61b376a60b57887299b84c2fa7fed1fc683e9c; Auggie relayed root authorization for only that operation. At2026-09-11T21:56:57.926Z trusted Cloudflare execution created custody candidate **d9d07844-8be5-4437-a89a-d94b2d7b7ac4** with deploy=false. The sole write was the accepted version POST. Two secret values were generated/resolved and submitted entirely inside trusted tooling, never returned or persisted outside provider custody.

The initial check returned accepted_preparation=false at candidate_readback: **Candidate metadata mismatch**. The follow-up snapshot comparisons were deployment=true, settings=false, Worker=true, ingress=true, Container=true, instances=true, domains=true, Access=true. No deployment, settings repair, secret retry, Access application, Container rollout, logging mutation or cleanup write followed.

Read-only narrowing at21:57:32Z identified the mismatched field: **assets**. The old version contains assets.config {html_handling:"auto-trailing-slash",not_found_handling:"none",run_worker_first:false}; the new candidate omits assets entirely despite the supplied configuration clone. Migration-tag absence was not the cause of this failed metadata comparison and is not offered as its explanation.

Direct immutable-version/module comparison at2026-09-11T21:58:00.591Z found:

| Check | Observed result |
|---|---|
| Actual active deployment | 614b5e3b-5581-4821-8daf-d19289c45ba9 |
| Actual active version | 1a7996dd-1cc0-4046-9e39-56d0aaea4bc8 at100% |
| Old active/candidate module bytes | Identical, 2,416,571bytes |
| Module SHA256 | bbf09a90855e387a91f95d7da4e95d78daeb3fae835cb14d6995e17fe68dfa00 |
| Eight existing candidate bindings | Identical to old active version after secret-name/type normalization |
| New candidate bindings | CONSENT_SIGNING_SECRET and ADMIN_OWNER_EMAIL, both secret_text present |
| New secrets on actual old active version | Absent |
| Old active assets | Present |
| New candidate assets | Absent |
| Legacy script/settings binding list | Lists the new candidate's two extra secret binding names |

The observed legacy settings response is therefore **not identical to the active version's binding set** after this upload. Do not call the settings response a deployed configuration readback or infer that the old active version acquired those secrets. [Cloudflare's versions documentation](https://developers.cloudflare.com/workers/versions-and-deployments/) states deployments determine which versions serve traffic; its [secrets documentation](https://developers.cloudflare.com/workers/configuration/secrets/) distinguishes version-only creation from immediate deployment. Those documents support version/deployment separation; they do not by themselves explain every legacy settings field. Direct active version/deployment evidence above is the basis of the bounded observation.

A public web-reader request to /version returned Internal Error and supplies no live HTTP source proof. No private consumer request was made to compensate.

Disposition: initial preservation FAIL remains recorded. Candidate must never be deployed as a source/config release because asset fidelity failed. It may be useful solely as a source of its two provider-held secrets through explicit version_id inheritance, but that narrower salvage requires fresh independent acceptance of this actual candidate and cannot be self-approved. Do not generate duplicate secrets or upload another copy merely to erase the failed comparison. All further provider writes remain stopped pending that review; independent source implementation continues.


## Worker-owned embedded assets correction — selected, fresh review pending

Auggie relayed root's selection of the simpler Worker-owned asset mechanism for PR68 after the actual Phase A upload omitted assets metadata without an asset-upload token. This paragraph supersedes the earlier requirement to preserve external assets.config with run_worker_first=true. It does not reinterpret the Phase A preservation failure as success.

The production source uploader intentionally **omits the top-level assets property** from its new version payload and requires assets to be absent in both candidate and deployed version readbacks. No external asset collection or ASSETS binding is attached. The actual old production version has no type=assets binding among its eight bindings, so no binding removal is necessary; preserve all existing bindings and metadata except this explicitly selected asset-router removal and the reviewed source/config changes.

The production hosted entry handles public paths through the existing generated embeddedAssets map and approved single-source homepage before OAuth fallback. All public files are generated/bundled from canonical checked-in assets; no duplicate HTML string, external asset-upload JWT, new publishing subsystem or fallback to an old asset collection. Assert the complete expected static path set, exact byte/hash and MIME responses, HEAD/ETag/redirect behavior, unknown404, and separation of signup/admin/OAuth routes in tests. Verify actual public homepage and representative binary/text assets after source deployment. If candidate/deployed assets metadata is unexpectedly present, reject before claiming correct routing.

This is consistent with the already working staging architecture: its version has no external assets metadata, and the protected preview uses embeddedAssets. [Cloudflare's asset configuration documentation](https://developers.cloudflare.com/workers/static-assets/binding/) distinguishes configuring an external asset collection from invoking the Worker; run_worker_first applies to configured collections. The production routing result still requires actual post-deploy byte checks; absence alone is not public-copy acceptance.

The committed production Wrangler config must also omit its external assets directory/block so fallback/manual review does not describe a competing asset router. Main remains staging; PR68's script is production-branch-only and disabled by its unaccepted prerequisite manifest until real deployment gates pass. No production activation or additional provider mutation is authorized here.


## PR67 staging deployed readback — 22:02 UTC

Build87255a3e-a082-425c-a538-7b82065fd46f succeeded at2026-09-11T22:01:54.403Z after PR67 merged to main71d376416c8e8adcf5e4b5e513a1e2d8a9064478. Direct provider GET22:02:37.894Z confirmed active staging deploymentac05ead2-107c-4308-bd58-584df80321f3/versiond473a11e-2162-4ec7-8ec2-919107c70938 at100%, migrationv1, exactmain stamp, moduleSHA25682ecac08c2c8cf467c3e0833a5768d33e77f5a7ea2afcc5685a51291daadb2c4,2,624,849bytes.

The actual explicit runtime discriminator is **BEE_ENVIRONMENT:"staging"**, set inside the staging entry rather than a provider binding. Exact-source fetch and subsequent direct module check both confirmed it. An initial diagnostic searched the wrong literal STAGING_RUNTIME and returned false; that literal is not the implementation's expected name.

SIGNUP_ENABLED=true and OWNER_USAGE_ENABLED=true remain; old validation start11:34:18.386Z/expiry11:54:18.386Z remain; no SELF_SERVICE_* bindings are present. Container remains inactive/private/max1/basic1024MiB4000MB with unchanged immutable CLI image and logs off; Worker logs/traces/logpush off. Production active deployment614b5e3b/version1a7996dd remains unchanged. No native/private consumer call was made by Otto; root's non-private consumer regression follows independent deployed acceptance.

Auggie reports fresh independent narrow custody acceptance of candidate d9d07844 solely for later explicit secret inheritance. That narrower disposition does not undo the original full-preservation FAIL, authorize deployment of the custody candidate, or authorize further provider writes. Reviewer-owned evidence remains the authoritative acceptance record.


## PR67 native consumer and provider post-readback — 22:08 UTC

Root reported native consumer regression at 2026-09-11T22:04:48.671Z: owner report docs count 1, one canonical 8074-character docs response, report docs count 2; delta 1, read_success 0, all non-error. This is root-observed nonprivate documentation/telemetry evidence, not hosted Bee grant acceptance. Otto made no private consumer call.

Authenticated provider post-readback at 2026-09-11T22:08:00.648Z: staging deployment ac05ead2-107c-4308-bd58-584df80321f3 remains version d473a11e-2162-4ec7-8ec2-919107c70938 at 100%. Staging Container instance 96cbd5709a7efb3ef2dde4eaf1adb22236bff9314cb007491a8bad1fc32084f1 remains inactive, status unchanged since 2026-09-11T11:55:35Z. No provider mutation. Independent consumer-scope acceptance remains for reviewer.

## Production Build trigger preparation — exact API, unexecuted

After PR68 has passed required source checks and merged, independently review changing only production trigger 40a4940d-5c14-4721-908f-a7c304ae2adf commands. Current GET /accounts/{account}/builds/workers/27b750389ea04ed1af1a6c50dc0e5e37/triggers returns build_command empty and deploy_command `npx wrangler deploy --config wrangler.production.jsonc`. Proposed build_command `npm ci && node scripts/gen-version.mjs && npm run typecheck && npm test`; proposed deploy_command `node scripts/deploy-production.cjs`. The committed prerequisite manifest must remain accepted:false until separately accepted configuration/hosted gates are met.

Live schema supports PATCH /accounts/{account}/builds/triggers/{trigger_uuid} to update command fields; build execution is a separate endpoint, not part of this PATCH. Take full before snapshot, clone all writable trigger fields, change only two commands, PATCH, GET same worker's triggers and compare all remaining fields including token UUID, repository connection, root, branch/path filters, cache setting, name and identity. Read production deployments and recent builds before/after to detect unexpected execution; no run/retry/deploy request and halt on unexpected effects. Current preserved fields: branch_includes [production], branch_excludes [], path_includes [*], path_excludes [], root_directory /, caching true, name Deploy default branch, repository connection e3df0ddb-fec7-4fb3-aa51-01bcf084320c, build-token identifier 1979b205-1194-42e1-94e4-8c263da46168. Token value is never read or output. Updating this future command does not itself authorize promotion or runtime activation.

Ancestry prerequisite investigation: PR67 build logs expose only 'Cloning repository...', not checkout depth. Current official Workers Build configuration documentation and trigger schema specify no clone-depth setting. Do not assert full history or available origin credentials. PR68 must either acquire required commit ancestry deterministically with bounded credential-safe Git fetch or reject before provider mutation. Git documents --unshallow; exact runtime transport validation is still being resolved, not claimed complete. Sources: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ and https://git-scm.com/docs/git-fetch.


## Ancestry transport resolved — credential-free shallow-clone exercise

Actual isolated local test completed 2026-09-11 around 22:11 UTC: credential-free `git clone --depth=1 --no-tags --branch main https://github.com/klappy/bee-ai-auth-mcp.git .` returned HEAD 71d376416c8e8adcf5e4b5e513a1e2d8a9064478. With GIT_TERMINAL_PROMPT=0, GIT_CONFIG_NOSYSTEM=1, GIT_CONFIG_GLOBAL=/dev/null and empty credential.helper, `git fetch --unshallow --no-tags https://github.com/klappy/bee-ai-auth-mcp.git 71d376416c8e8adcf5e4b5e513a1e2d8a9064478` succeeded. Repository shallow=true became false, HEAD remained exact, and `git merge-base --is-ancestor d18828e94ee6c3ab6bad5b331ecb4d882d9567c7 HEAD` passed. No credentials required or inspected.

PR68 can therefore remove the undocumented checkout-depth dependency using a bounded, captured-output fetch from the fixed public repository when its checkout is shallow, then require exact CI HEAD and reviewedMain ancestry before provider calls. Use explicit validated commit SHA argument, timeout and no shell interpolation; no origin credential/config dumps. If nonshallow but a required object is absent, bounded fetch of exact CI commit and reviewedMain from the same fixed URL before rechecking is permissible read-only preparation. This validates Git transport and ancestry mechanics locally; actual Workers Build execution remains to be observed. No provider depth configuration is invented.


## Release-order correction — combined source/config candidate, fresh review required

This section supersedes every earlier requirement to activate a full configuration on the old production module before the final source Build. That intermediate is rejected, not merely deferred. Fresh actual version GET with include=modules at 2026-09-11T22:12:11.954Z and 22:13:11.395Z confirmed old active 1a7996dd-1cc0-4046-9e39-56d0aaea4bc8 contains the 2,416,571-byte old index module: no embeddedAssets or ASSETS.fetch; unmatched requests delegate to BeeAuthHandler's Not found 404. Its homepage/static paths depend on the external asset collection. Phase A proved the proposed metadata-only asset preservation does not retain that collection. Activating that old-module candidate would therefore break public assets. Existing OAuth protocol code remains old GitHub authorization, not hosted-email CLI functionality. No intermediate activation is permitted.

Selected bounded remedy for PR68, pending fresh independent contract review:

1. Manifest acceptance pins the real unchanged old active deployment 614b5e3b-5581-4821-8daf-d19289c45ba9 and version 1a7996dd-1cc0-4046-9e39-56d0aaea4bc8, reviewedMain/source ancestry, exact desired full writable metadata and nonsecret binding additions, accepted Access app/policy/ingress mapping, immutable image and prerequisite Container configuration, and independent acceptance receipt. No fictional active configurationVersion is required. Numeric self-service activation still requires an actual approved policy tuple; no quota invented here.
2. Pin custody source d9d07844-8be5-4437-a89a-d94b2d7b7ac4 and its narrow independent custody acceptance. Fresh GET confirms exactly CONSENT_SIGNING_SECRET and ADMIN_OWNER_EMAIL secret_text presence plus preserved old module/bindings as accepted; no secret values or hashes. Existing GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET inherit explicitly from old active version; only the two new secrets inherit explicitly from custody version. Never latest/default inheritance. No other custody configuration, assets, audiences, storage or grant state is copied.
3. Build one candidate containing reviewed src/hosted.ts source, generated embedded approved assets, desired full config/nonsecret binding additions, those exact secret inheritance selectors, and Worker persisted logs/traces off. Preserve redact_query_string=false unchanged; separate redaction HOLD remains. Preserve existing grants, KV/DO IDs, domain and all unrelated metadata. Intentionally omit external assets; no ASSETS binding exists to remove. POST version with deploy=false only. Old production deployment remains active throughout preparation.
4. Candidate GET must compare to the explicit desired state, not expect new bindings to equal the old eight. Verify preserved old binding values/IDs, exact allowed additions/types, module hash/embedded source SHA, no external assets, full compatibility/container metadata, and logging disabled. Provider GET cannot prove secret value equality, so prove exact submitted inheritance source selectors plus names/types and retain trusted request-level receipt. Re-read active old deployment/module and ingress before explicit deployment; reject drift. Only after all candidate and prerequisite checks pass may the Git-triggered script deploy that exact candidate, then GET deployed source/config/assets and public homepage/protocol acceptance. No direct provider activation outside reviewed Build.
5. Privacy-safe ordering no longer requires a config-only old-module Worker upload. First the separately reviewed Container full-clone rollout changes only immutable image and observability.logs.enabled=false; read back all preserved allocation/network/env/entrypoint fields and logs off before new Worker traffic. Actual old Worker module has none of startBeeBroker/resumeBeeBroker/clearBeeBroker/execBroker (fresh exact-version check), while new image Dockerfile starts only Caddy as PID1; CLI runs solely through new broker exec RPC. Thus old Worker cannot invoke the new CLI during the prerequisite image rollout. New Worker source and Worker logging-off configuration become active together in the final candidate; require both Container logs off and candidate Worker logs off before deploy. Old Worker logging-on baseline is not a reason to upload an incompatible intermediate or block candidate creation. Container's Caddy data plane remains port8080/private /v1 proxy with same BEE_UPSTREAM/BEE_SNI; immutable image compatibility is a prerequisite validation, not assumed from an unpinned rebuild.
6. Keep the committed prerequisite manifest accepted:false until exact source, hosted acceptance, desired policy/config and provider prerequisites are independently accepted. No provider writes are authorized by this draft amendment. The deployment cook is paused pending review, and no speculative old-module config deployment will occur.

Source receipts supporting the rollout ordering: production src/index.ts blob1d5bcb3376723b13b60b75bad5b2e61651908676; production src/bee-auth.ts blob e11b278678b152b31871db6c07a1d341e449d6de; current main bridge/Dockerfile blob2fee115bd7d27b9372e08a6f3dec5472d0f29dfe (Caddy-only ENTRYPOINT), bridge/Caddyfile blobb49dbc7430ed564bf419ad62527eeaa818c95355, src/bridge.ts blobb6849da9c919b7fc9eb22f0b42eeb56b165492b9. Actual deployed module inspection, not branch text alone, establishes absence of old broker RPCs.


## Remaining hosted acceptance and learning — exact recovered scope

Read-only recovery from current ticket blob395184be1bcee618a8cb5c35e1e893e45eb73c88, checkpoint blobd466f4a6cf6fc6c3c1fa9464b15ba5dac85928c7, journal/2026-09-08-bee-meal-live-access.tsv blob287eddaed5f7aa0f8ef437811a318e35658b6e83 and Issue51 returns through comment5640712688 found no complete email→CLI→approved own Bee grant→MCP composite acceptance. Do not destroy or re-pair the owner's working grant to manufacture the missing historical record.

| Evidence actually passed | Exact original receipt | Limit |
|---|---|---|
| Real Container Bee CLI help, invalid broker ID rejection, unauthorized/replay denial, destroy | rail/meals/2026-09-08-bee-stripe-billing/evidence/real-hosted-cli-probe.json blob250529f6625ae89c766e6ab130e1ec4f0471c8d1 | No authenticated Bee approval/grant |
| Two real pending pairings, distinct directories, resume pending, clear A→expired while B stays pending, clear B→expired, final cleanup/destroy | rail/meals/2026-09-08-bee-stripe-billing/evidence/real-hosted-broker-lifecycle.json blob3be8d7e9b55ed7cf669b332b57f024cd3da5b154; independent-broker-probe-review.md blob22be7f06c088aad20ff72ce864fd65781fc33f23 in same evidence folder | Pending-state isolation/cleanup only; no completed credential handoff, grant revocation or cross-user data test |
| One existing native staging grant /v1/me returned upstream200, nonempty parsed response and no error; actual expiry/inactivity independently confirmed | rail/meals/2026-09-08-bee-stripe-billing/evidence/independent-identity-window-fresh-review-2026-09-11.md blob58b5f4889e3fea3331fea20a83de50caf3c71e06; Issue51#5634151643 | Explicitly no expected-account matching, new signup/pairing, second identity or active-grant cleanup |
| Public discovery200, MCP401 resource-metadata challenge, temporary DCR201 and exact client deletion200/read404; admin source repair | Issue51#5619376928 and #5620095024; rail/meals/2026-09-08-bee-stripe-billing/evidence/independent-signup-source-review.md and signup-http-receipt.json | Protocol repair and temporary client cleanup are not full user OAuth/Bee consent acceptance |

User-reported successful email-code entry and later 'workflow felt perfect' are real consumer observations but do not independently identify each grant/CLI step or prove account matching. First connection works; preserve it. Still unproven: two authenticated controlled identities with distinct Bee grants/state; wrong-user retrieval denial; explicit denied/revoked identity behavior through a real granted session; completed-grant cleanup/local token deletion and precise upstream revocation claims; applicable optional GitHub full consumer round-trip. Existing source tests and pending-broker cleanup are retained, not relabeled as these tests. Worker/Container disabled logging and probe sensitive-output containment have positive receipts; completed real credential handoff privacy has no separate recovered end-to-end receipt.

Journal k0112 authorizes sequencing second-account work after/parallel to other work. It does not provide a second person's Bee consent. No authorized second controlled identity/inbox/Bee grant available in trusted tooling was recovered from these records; owner preview identity provenance is not a second Bee identity. No authorization to destroy the owner's existing grant was found. These are bounded recovery findings, not assertions that no other identity exists anywhere. The historical browserAuth capability can accept private inbox/QR interaction but is not evidence of currently available consent, and prior browser URL-policy refusal must not be bypassed.

Authorized work possible without another owner approval: anonymous discovery/challenge/denied unauthenticated route checks, fresh provider privacy/config/inactivity reads, source fixture review and controlled-test preparation, and existing nonprivate docs/owner aggregate inspection under its accepted scope. No optional reruns were performed in this recovery. Actual new pairing, cross-user data/cleanup requires controlled participating identities and an independently accepted bounded active runtime; current staging window expired at2026-09-11T11:54:18.386Z and Container remains inactive. Original isolated authorization is settled; do not reopen it or send an invitee into expired runtime. Current no-provider-write instruction remains.

### Production learning path is not delivered by staging telemetry

At product main71d376416c8e8adcf5e4b5e513a1e2d8a9064478, src/owner-usage.ts blob0128c9d6341535e1977a2c0d35b4ce0d11bfae6f requires isStaging(env), SIGNUP_ENABLED, OWNER_USAGE_ENABLED and trusted STAGING_OWNER_EMAIL match. Therefore production owner aggregate observation/reporting is disabled by contract, even if a similarly named flag were copied. Do not copy it as an undocumented activation.

The separate quota ledger has an existing own-account inspection surface: src/mcp-api.ts blobfca846245d5198eaec31a1e89d759d3283e70da6 registers bee_usage for email grants when a quota policy is configured, and src/signup.ts blobeb57124de6bfe688b2052ab6768946bd955baf20 renders the signed-in email user's used/limit/remaining/reset values. src/quota.ts blob172dca684395dab4bdcb359a59cb5f9a27b85ee1 binds inspection to authenticated email/epoch, keeps current monthly state plus unsettled leases, and bypasses metering for non-email GitHub logins. This is own-user allowance accounting, not owner-wide analytics, daily calibration history or proof of current host tool availability. The admin list exposes admission statuses, not usage reports.

Consequently the owner's production heavy-use calibration still needs a bounded follow-on if required after shipment: explicitly define production owner identity binding and fixed aggregate report/retention scope while preserving GitHub grants; independently review and prove consumer availability/persistence. Existing user permission for privacy-safe own-usage telemetry supports preparation, but no new production collection or flag is activated here. Current docs-count regressions establish persistence mechanics only, never natural heavy usage or ongoing production observation.

Configuration correction retained for the combined source candidate: ACCESS_TEAM_DOMAIN is hostname `klappy.cloudflareaccess.com`, while JWT issuer is URL `https://klappy.cloudflareaccess.com`; do not put the URL into the hostname binding.


## Logging schema correction — supersedes version-scoped logging claim

Deployment cook caught a material unsupported assumption in the combined transition: live POST /workers/workers/{worker_id}/versions schema contains no observability or logpush field. Therefore logging-off cannot be asserted as part of that version body or verified from version GET. The prior 'logging off rides the same candidate' wording is withdrawn. Combined source/config upload remains the correct asset-preserving transition, with logging as a separately reviewed prerequisite.

Live OpenAPI exposes GET/PATCH /accounts/{account_id}/workers/scripts/{script_name}/script-settings, JSON body, described specifically as script-level settings when using Worker Versions. Its writable fields are only logpush, observability, tags and tail_consumers; unlike legacy multipart /settings, it accepts no bindings/module/compatibility/asset fields. Fresh authenticated GET at2026-09-11T22:19:59.628Z returns logpush=false,tags=null,tail_consumers=null and observability={enabled:true,head_sampling_rate:1,redact_query_string:false,logs:{enabled:true,head_sampling_rate:1,persist:true,invocation_logs:true},traces:{enabled:false,persist:true,head_sampling_rate:1}}.

Bounded unexecuted correction: snapshot full script settings plus actual active deployment/version/module/assets/bindings, ingress and Container. Clone complete observability; change only enabled=false, logs.enabled=false, logs.persist=false, logs.invocation_logs=false, traces.enabled=false and traces.persist=false. Preserve head sampling rates, destinations/propagation if present, redact_query_string=false, and every unrelated setting. PATCH script-settings with the complete cloned observability object only; do not use legacy multipart settings, upload an old module or include new bindings. GET script-settings and independently compare effective disabled flags and all preserved fields. Re-read actual active source/version/assets/bindings/deployments and halt on any unexpected deployment or traffic effect. The schema's script-level separation is the documented mechanism; actual absence of deployment/asset side effects must be observed after any separately accepted execution, not guaranteed in advance.

The production source uploader must require independently accepted effective script-level logging-off before any source traffic, recheck before explicit deployment and after deployment, but submit no invented version observability field. Container logging-off/image and Access prerequisites remain separately gated. Query redaction remains unchanged and on its separate HOLD. No mutation performed; this correction needs fresh independent acceptance.

## Existing production Analytics Engine read-only recovery

Product production src/telemetry.ts blobaaf37a5a4c0f639dc9d78d287ca18af4adf044ca already emits coarse tool/status/path-class/time/size data to optional BEE_TELEMETRY. Tenant partition is HMAC-SHA256('bee-tenant:'+authenticated login) under GITHUB_CLIENT_SECRET, truncated opaque key; raw login is not recorded. This could support historical successful bee_read aggregates if both trusted owner-partition resolution and callable read access are available. Source existence is not evidence of delivered owner-specific reporting.

The provider exposes SELECT-only POST /accounts/{account_id}/analytics_engine/sql with text/plain SQL. An actual read-only `SELECT 1 AS capability_probe FORMAT JSON` attempt returned connector isError=true, error_code INVALID_ARGUMENT, text 'Cloudflare API error: 200'. No SQL result was available. This precise adapter failure does not prove provider authorization failure or absence of records. No private identity, tenant partition, dataset rows or private Bee call was requested or output.

Additionally, current provider secret GETs are write-only names/types: no callable existing trusted function was recovered to compute the owner's production tenant HMAC using the active GITHUB_CLIENT_SECRET. Account admin/owner identity resolution alone cannot map that partition. No secret extraction or temporary production endpoint is authorized or performed. Therefore owner-specific numeric production aggregates are not established in this recovery. Do not relabel all-tenant totals as owner usage, infer ongoing observation, or use the docs regression as calibration. Existing telemetry collection was not modified; a bounded access-path repair or explicit source reporting follow-on is needed if that historical owner aggregation is required.


## Actual logging-only PATCH — exact comparison FAIL, read-only narrowing

Explicit independent execution acceptance: rail/meals/2026-09-08-bee-stripe-billing/evidence/independent-production-deployment-source-review-2026-09-11.md at commit42cfef51ec37d2925127fabdee95cbd8eddf4d06, blob0e614c60953b48204f08755e14f0afe8a23e231c, read before execution. Root authorization was for this one operation only.

At2026-09-11T22:23:58.590Z exactly one JSON PATCH /workers/scripts/bee-ai-auth-mcp/script-settings returnedHTTP200. Request contained the complete freshly cloned observability object with exactly the six accepted booleans false; redaction=false and all rate fields retained. No other mutation was attempted.

Initial exact-comparison result: FAIL, preserved below. Script-settings returned observability:null, not the requested explicit object. Do not call all-six-booleans preservation a PASS. Full actual deployment/version (including exact module, assets and all eight bindings), ingress, domains, Container and instance snapshots compared unchanged. Production remains deployment614b5e3b-5581-4821-8daf-d19289c45ba9/version1a7996dd-1cc0-4046-9e39-56d0aaea4bc8 at100%; old external assets remain present. Module2,416,571bytes SHA256bbf09a90855e387a91f95d7da4e95d78daeb3fae835cb14d6995e17fe68dfa00; ordinary workersdev/previews remain enabled, Containerinactive.

Safe exact operation receipt:
```json
{
  "at": "2026-09-11T22:23:58.590Z",
  "attempted": true,
  "patchStatus": 200,
  "passed": false,
  "comparisons": {
    "deployments": true,
    "version": true,
    "ingress": true,
    "domains": true,
    "container": true,
    "instances": true,
    "settings": false
  },
  "beforeSettings": {
    "logpush": false,
    "tags": null,
    "tail_consumers": null,
    "observability": {
      "enabled": true,
      "head_sampling_rate": 1,
      "redact_query_string": false,
      "logs": {
        "enabled": true,
        "head_sampling_rate": 1,
        "persist": true,
        "invocation_logs": true
      },
      "traces": {
        "enabled": false,
        "persist": true,
        "head_sampling_rate": 1
      }
    }
  },
  "afterSettings": {
    "logpush": false,
    "tags": null,
    "tail_consumers": null,
    "observability": null
  },
  "activeDeployment": "614b5e3b-5581-4821-8daf-d19289c45ba9",
  "activeVersion": "1a7996dd-1cc0-4046-9e39-56d0aaea4bc8",
  "moduleBytes": 2416571,
  "moduleSha256": "bbf09a90855e387a91f95d7da4e95d78daeb3fae835cb14d6995e17fe68dfa00",
  "assetsPresent": true,
  "bindingCount": 8,
  "ingress": {
    "enabled": true,
    "previews_enabled": true
  },
  "containerId": "a0318e64-bcdf-4095-bbcc-3400033b3290",
  "states": [
    "inactive"
  ]
}
```

Read-only narrowing at2026-09-11T22:24:15.137Z: script-settings GET still returns observability:null/logpushfalse; legacy settings omits observability. The actual Worker resource GET /workers/workers/27b750389ea04ed1af1a6c50dc0e5e37 returns observability={enabled:false,head_sampling_rate:1,redact_query_string:false,logs:{enabled:false,head_sampling_rate:1,invocation_logs:true,persist:true,destinations:[]},traces:{enabled:false,head_sampling_rate:1,persist:true,destinations:[]}}, logpushfalse. Therefore effective enable flags are explicitly false on the Worker resource, rather than inferred from null or HTTP200; nested persist/invocation defaults are true and did not preserve requested false values. Redaction=false is directly observed on Worker GET; no production redaction change occurred.

No retry, repair, cosmetic normalization write or source/config activation. Independent reviewer is resolving actual effective-off semantics and any narrowly acceptable normalization separately; initial exact comparison FAIL stands. Until that disposition, no logging prerequisite PASS is claimed.


## Production Build command-only wiring — execution envelope, after PR68 merge only

Root explicitly authorizes this one further preparation after PR68 merges with required checks; no manual build, retry, deployment, Container/Access operation or configuration activation. This supersedes the prior no-further-preparation instruction only for the production trigger commands. Independent operation acceptance remains required before writing.

Fresh authenticated GET at2026-09-11T22:32:34.579Z confirms production Worker trigger40a4940d-5c14-4721-908f-a7c304ae2adf, Worker tag27b750389ea04ed1af1a6c50dc0e5e37. Exact commands selected by reviewed source documentation:

- build_command: `npm ci && node scripts/gen-version.mjs && npm run typecheck && npm test`
- deploy_command: `node scripts/deploy-production.cjs`

Before operation, read immutable merged main source and deploy/production-prerequisites.json; require PR68 merged after required checks and manifest accepted:false. The two commands match docs/production-deployment.md and the reviewed preservation script. The production branch still needs its separately authorized main→production merge before any future build; do not push or invoke it here.

Supported live API: GET /accounts/{account}/builds/workers/{worker_tag}/triggers returns an array; PATCH /accounts/{account}/builds/triggers/{trigger_uuid} takes JSON command/config fields and is distinct from run/retry endpoints. Fresh GET current trigger, require same expected old commands (empty build and `npx wrangler deploy --config wrangler.production.jsonc`), clone every current writable field from the live schema: branch_excludes, branch_includes, build_caching_enabled, build_command, build_token_uuid, deploy_command, path_excludes, path_includes, root_directory, trigger_name. Replace only the two command values. No token values are read; build_token_uuid is only the preserved resource identifier.

Current values to preserve: branch_includes=[production], branch_excludes=[], path_includes=[*], path_excludes=[], caching=true, root_directory=/, trigger_name=Deploy default branch, build_token_uuid1979b205-1194-42e1-94e4-8c263da46168. Also compare all returned read-only identity/custody fields unchanged: trigger UUID, external Worker tag, token name, repository connection e3df0ddb-fec7-4fb3-aa51-01bcf084320c and its provider/repository fields, created_on and deleted_on. Only modified_on may advance as the expected audit timestamp; never ignore other differences.

Before and after: GET same trigger collection; GET paginated /builds/workers/{tag}/builds (safe comparisons inside trusted tooling, never print commit author identities) and require no running/queued build before operation and no new or changed build afterward; GET /builds/builds/latest?external_script_ids={tag} as an additional latest check; GET production deployments and actual deployment-selected full version with modules/assets/bindings; GET Worker effective logging plus script-settings, ingress, Container config/instances. Compare all active/provider surfaces unchanged except exact intended trigger commands/modified_on. Staging trigger/configuration must compare unchanged; staging Build may independently finish after main merge and is not caused or controlled by this operation. A failed/uncertain PATCH still requires after-readback and no blind retry.

The observed production build inventory page1 contains20 stopped historical builds, latest0ff78f7e-0a2b-4afe-8cf6-071b884cfd33 created2026-09-09T02:04:14.041Z; provider total179 across9pages atper_page20. Execution must freshly complete pagination with a bounded larger page size, not infer all-build quiescence from this first page. No build start is requested to test the new command: accepted:false manifest deliberately refuses future deployment until release prerequisites are committed/accepted. Actual absence of newly triggered builds and unchanged production traffic is a readback obligation, not presumed from PATCH semantics.


## Complete Version POST payload audit — read-only and named-container boundary

Live OpenAPI inspected for POST /accounts/{account_id}/workers/workers/{worker_id}/versions, application/json; no provider write. Its shared schema contains response-only required fields id/number/urls/created_on marked readOnly: those must not become upload requirements. Resolve readOnly through allOf, not only direct property flags.

| Classification | Complete top-level fields |
|---|---|
| Writable according to resolved schema | annotations, assets, bindings, cache_options, compatibility_date, compatibility_flags, containers, exports, limits, main_module, migrations, modules, package_dependencies, placement, usage_model |
| Read-only, reject in upload | author_email, author_id, created_on, exports_reconciliation, id, migration_tag, number, source, startup_time_ms, urls |
| Not schema Version fields, reject | observability, logpush and every unknown field |

The bounded PR68 upload permits exactly the nine preserved metadata fields cache_options/compatibility_date/compatibility_flags/containers/limits/main_module/package_dependencies/placement/usage_model plus exports/modules/bindings/annotations. External assets and migrations are deliberately outside this accepted source transaction. Validate every constructed top-level key at the builder boundary and refuse unsupported desired metadata, not silently strip unknown input. Observed readonly urls from GET must never be inherited or compared equal across different versions; candidate URL validation, if needed, is a separate output check. exports_reconciliation is readOnly inside an allOf subschema. annotations allows writable workers/message and workers/tag; workers/triggered_by is readOnly and must not be copied.

Nested constructed shapes: modules contains exactly name/content_type/content_base64 (all required); cache_options requires enabled and optionally cross_version_cache; limits allows cpu_ms/subrequests; package_dependencies items require name/packageJsonVersion/installedVersion; compatibility_flags is a string array; main_module/compatibility_date/usage_model are strings. Placement accepts its documented smart or single targeted region/hostname/host alternatives (including mode=targeted,target one-item form), not arbitrary GET fields. Existing binding variants retain their schema-specific nonsecret fields, secret inputs remain inherit{name,type,version_id} with exact source; no literal secret_text values. exports.BeeBridge live DO allows type/storage/container and optional state=created; no deletion/rename/transfer lifecycle directive is authorized.

Named-container schema tension is explicit: JSON Version schema containers.items lists only required class_name and does not set additionalProperties:false. However exports live DO container property explicitly references a named declaration in metadata.containers. The accepted construction {class_name:'BeeBridge',name:'BeeBridge'} is supported by actual same-endpoint evidence, not blanket permission for unknown properties. Product scripts/deploy-staging.cjs at main71d376416c8e8adcf5e4b5e513a1e2d8a9064478, blob67e5b22ef9d5e6f5ff715e95208a95b463ad53f0, explicitly adds that name, sets exports.BeeBridge={type:'durable-object',storage:'sqlite',container:'BeeBridge'}, and submits JSON POST /workers/workers/{worker_id}/versions?deploy=false. Actual Build87255a3e-a082-425c-a538-7b82065fd46f succeeded running that script. Fresh authenticated GET of its deployed versiond473a11e-2162-4ec7-8ec2-919107c70938 returns exactly that named declaration and export. Earlier independent association receipt rail/meals/2026-09-08-bee-stripe-billing/evidence/independent-association-resolution.md blob9ec806a33a848401f9b8520c4b2a1d3af9a67fc2 preserves the original linkage acceptance; PR67 provider/source receipts independently cover the current same-endpoint realization.

Therefore permit only this exact previously tested name/class_name pair as a documented provider/schema discrepancy, with candidate/deployed exact readback. Do not call it strict schema coverage, widen unknown-key acceptance, infer fresh production execution, or omit name and risk the previously observed undeclared-container error. Cook/reviewer received the complete boundary audit together to avoid one-field repair cycles.
