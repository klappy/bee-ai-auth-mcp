# Independent owner approval repair review

Observed September 10, 2026, 09:39–09:41 America/New_York (clock13:41:08.865Z). Reviewer: /root/auggie_oauth_finish/reviewer; separate from source and provider authors. Scope: CONSUMER-REPAIR-2026-09-10.md blob6b475096283a7656ed41018d9dc8a681578df105 and signup amendment4bfde7c7463d6fbbf7c138c388a0b2c1cb5c0954. No implementation or provider mutation authored by reviewer.

## Verdict

PASS for the bounded source correction and the exact module-only isolated deployment envelope below. This is not actual user approval, ChatGPT installation, authenticated Bee retrieval or onboarding closure. Provider execution/readback is still required after this pre-mutation review. Branch topology is a separate review.

## Exact candidate

- src/signup.ts SHA256 388b99f63fe190f8b04c5f35a20475aad7cb8db21dd7b2925ad11f72956c8ad0
- src/admission.ts SHA256 83eb5a83a6eacb2c625ee7e7dc758768436f59ff720fde177594086d4c157517
- test/admin-form-integration.test.ts SHA256 ebe5f9970fdb19172d79135f4380df5f8815d359220321d54b27fc071f3b6918
- Built module SHA256 3e5e7e72a7a2f7af4ced0d5387347e0cfef8a756dd80e0be34b9b5d7e353c8e8
- oauth-admin-upload-envelope.js template SHA256 8ef3b036d5423db607202c708bb7f50446c4239c1bbc844f6556438a7e6ec92c; only reviewed module hash/archive placeholders may be bound.

Hashes independently read back. Reviewer independently ran npm run typecheck (exit0) and npm test (exit0): 190 passed, two skipped, 20 test files passed and one skipped. The skipped live smoke suite is not hosted evidence.

## Findings and disposition

1. Admin response previously applied no-referrer while requiring a same-origin Origin header. WHATWG Fetch section3.2 sets the Origin serialization to null for non-CORS non-GET/HEAD requests under no-referrer. The candidate limits same-origin referrer policy to the rendered admin list. Strict Origin equality remains unchanged; foreign, missing and null origins remain rejected. Source correction accepted. Reference: https://fetch.spec.whatwg.org/#append-a-request-origin-header . Browser network behavior itself was not observed here.
2. Reopening the list no longer discards an unexpired action for the current owner, record and approval epoch. Storage stays bounded to two actions per record. Decisions consume their nonce and must match current epoch; stale opposite actions cannot overwrite a newer decision. Existing pre-migration actions lacking epoch fail closed and require list reload. Accepted.
3. New integration fixture uses actual JOSE signatures/JWKS verification, rendered HTML form values, staging entry and BeeBridge admission transaction with cloned in-memory storage. It proves valid submission303, wrong audience/foreign/null/missing Origin403, replay and stale opposite decision409, second-list-load coexistence, and target substitution rejection. It does not claim a real browser, Cloudflare JWT, or live storage test. Accepted as bounded regression evidence.
4. Existing native OAuth provider tests still pass for public metadata, MCP challenge, DCR, actual provider encrypted grant/PKCE exchange, refresh denial after revocation and stale epoch rejection after reapproval. Upstream Bee approval in those tests is synthetic. Actual client discovery/install is a separate live acceptance.
5. Provider envelope pins isolated account/Worker, baseline version67c93967 and cd22b026 module; asserts existing namespace/KV/secrets/runtime timestamps; inherits both secrets, uploads deploy=false, verifies new module and preserved metadata/bindings, then explicitly deploys100percent and reads back effective bindings, Container linkage, logs, Access and production deployment preservation. Runtime deadline remains15:18:31.966Z (11:18:31 EDT), cumulative five-dollar allowance unchanged. No runtime extension, Access policy write, Container rebuild, production deployment or subscription change is included. Accepted for exact bound candidate only; stop on any failed assertion and report phase.

No blocking finding remains within this source and module-only envelope scope. Consumer acceptance and provider after-write results remain open. No browser URL-policy workaround was attempted.
