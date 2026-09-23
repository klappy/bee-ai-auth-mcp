# Independent signup/OAuth source review

Reviewer: /root/auggie_signup/signup_review. Scope: isolated Bee staging amendment, not production release or whole-journey acceptance.

## Accepted source and execution envelope

Exact module SHA256: `cd22b026173d289777783bac51493fcf1da0fb64f0769c4fd97a51af70636560`; 2,558,076 bytes. Gzip/base64 archive: 750,497 bytes. Reviewer observed local file hash and sizes.

Reviewer independently ran `npm run typecheck && npm test`: exit 0, 187 tests passed, two skipped; 19 test files passed, one skipped. Synthetic upstream Bee credentials and mocked Access verification in these tests do not prove real OTP or personal Bee access.

The initial blocking finding (signing-secret absence suppressed public discovery) is resolved. Native provider discovery, registration and unauthenticated MCP challenge remain available with the signing secret absent and runtime closed. Sensitive consent/pairing/retry paths retain their secret requirement.

Inspected transactional admission, normalization/deduplication, total signup bound, one-use target/decision-bound owner actions, separate owner audience and email equality, Origin validation, approval epochs at consent/broker/MCP and native token exchange/refresh. The native provider test completes S256 code exchange with a synthetic upstream grant, then rejects refresh after denial and after reapproval. Existing-grant tests deny pending, denied and stale-epoch identities before quota or Container work.

Inspected lifetime runtime quota preservation and expiry-specific shutdown; historical expiry callbacks cannot destroy a newer active window. Runtime allocation remains a separate authorization and cost check, not a new five-dollar allowance.

Closed upload and subsequent Access-routing envelopes are accepted with their placeholders bound to this exact module and resulting version. They preserve settings, bindings, policies, privacy and unrelated resources, verify source hashes, use version-then-explicit-deploy, and read back Container namespace linkage. Secret values remain in trusted provider execution.

Access cost scope uses existing capacity only: Cloudflare's seat-management documentation states that adding capacity requires purchase and further users are blocked when existing seats are exhausted. Actual plan/remaining capacity remains unknown after subscription GET403. No permission bypass, subscription change or purchase is authorized. Signup can consume shared Access seats before application approval.

Source: https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/

## Remaining acceptance

No provider mutation was performed by this reviewer. Actual deployed source/configuration and anonymous HTTP routing must be independently checked after execution. Real OTP, pending signup, owner approval, complete client installation and personal Bee retrieval remain unproven. No whole-meal PASS or production release is granted by this review.

## Independent provider outcome — 2026-09-10T13:14:47.139Z

Fresh authenticated reviewer GETs confirm active version `5a641618-2e48-44ad-8062-509c3cd80e7d`, deployment `e9d109f0-61e2-4078-8a38-760f6a7e23f3`, and exact accepted module hash above. Email Access app `5ae63959-05d5-45a7-a9bd-237c271245c0` now has the sole allow-everyone policy `a9b8c4e8-5048-4824-844b-685e183bd7c6`, OTP-only IdP, and exact signup/preview/index/authorize-email destinations. No exclude or require predicates were added.

Owner Access app `8fc54e03-24c8-4c02-9376-7c639a3ca94e` is scoped to `/admin` and `/admin/*`, with its separate audience, sole-email owner policy, OTP-only IdP, one-hour session and HttpOnly setting preserved. Owner identity was not returned to model context. Runtime dates remain empty; effective Worker logs/traces and Logpush remain disabled.

Intermediate halts were comparison defects, not broadened authority: object-key order is compared canonically; live schema confirms migration_tag is read-only and absent before deployment; deprecated self_hosted_domains is derived from destinations; generated policy timestamps are excluded while all writable policy fields remain compared. Existing uploaded candidate was reused, without a second secret generation/upload.

Actual source/Access outcome accepted at this timestamp. Anonymous HTTP discovery and real-user journey acceptance remain distinct and pending.

## Independent external HTTP — 2026-09-10T13:15:38Z–13:15:59Z

Reviewer performed direct anonymous HTTP requests using the configured network transport, without browser-policy workaround, credentials or identity data. Authorization-server discovery returned HTTP200 with the correct staging issuer, authorization/token/registration endpoints and S256. Protected-resource metadata for `/mcp` returned the correct resource and authorization server. Anonymous POST `/mcp` returned HTTP401 with a Bearer `WWW-Authenticate` challenge naming the correct resource metadata URL; no Access redirect occurred.

These observed responses resolve the previous metadata503/configuration-discovery failure at the protocol surface. They do not establish successful ChatGPT installation or authenticated Bee data retrieval. Otto's larger HTTP test matrix remains separate evidence.

Receipt interpretation: `issuer_is_staging:false` on a protected-resource response or MCP error JSON is an inapplicable field check, not an issuer mismatch. The independently observed protected-resource document identifies `resource=https://bee-validation-20260909.klappy.workers.dev/mcp` and `authorization_servers=[https://bee-validation-20260909.klappy.workers.dev]`. It does not define an issuer field. The authorization-server document does define issuer and its value was correct. MCP401 is an error document whose applicable discovery reference is the correctly observed WWW-Authenticate resource_metadata URL.

## Independent active runtime outcome — 2026-09-10T13:19:51.025Z

Fresh authenticated reviewer GETs confirm version `67c93967-bed4-40b7-b7e3-8ebc6949c334`, deployment `1c9e15b1-2b80-472a-b285-5b385b0c1261`, 100 percent traffic, and byte-identical accepted module `cd22b026173d289777783bac51493fcf1da0fb64f0769c4fd97a51af70636560`.

The bounded runtime window is 2026-09-10T13:18:31.966Z through 15:18:31.966Z (09:18 through 11:18 EDT). The two expected secret names remain present; no values were read. Worker effective logs/traces/Logpush remain disabled. Container allocation remains one instance maximum, 0.25 vCPU, 1024 MiB memory, 4000 MB disk, private network and disabled logs. Complete namespace inventory confirms the same BeeBridge SQLite namespace remains Container-enabled. Any-email OTP policy and separate owner-admin paths remain configured.

Lifetime request counters were not directly queried by this reviewer. The reviewed activation helper performs no counter mutation, and independently tested source preserves the existing lifetime count; do not describe an unqueried numerical counter value as observed. No new financial allowance, identity approval, personal grant or actual Container start is inferred from runtime activation.

Source, provider configuration and scoped anonymous HTTP acceptance are complete for this staging amendment. Real user OTP/pending/owner approval/client installation/Bee retrieval remain the consumer acceptance boundary.
