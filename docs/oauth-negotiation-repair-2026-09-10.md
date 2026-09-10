# OAuth client authentication negotiation repair

Contract: kitchen auth ticket OAUTH-NEGOTIATION-AMENDMENT-2026-09-10.md v1.0, blob 209e105caa1884746d0a6499671b605f93c889e3. This is a demonstrated synthetic protocol defect and repair, not proof of the actual ChatGPT request that produced a screenshot.

## Before and after

The same Bee staging registration route uses maintained provider code, local synthetic KV and synthetic client metadata. No real email, OTP, Bee grant, client secret or token appears in this evidence.

| Client metadata | Provider 0.7.2 | Provider 0.10.3 |
|---|---|---|
| Preferred `none` | Registers public client | Registers public client; valid PKCE/code/MCP/refresh succeeds |
| Preferred `private_key_jwt`, offered `[private_key_jwt, none]` | Selects private-key method but creates symmetric secret; secretless exchange gets 401 missing client_secret | Negotiates `none`; valid PKCE/code/MCP/refresh succeeds |
| Offered alternatives without preferred method | Defaults to client_secret_basic; secretless exchange gets 401 missing client_secret | Negotiates `none`; valid PKCE/code/MCP/refresh succeeds |
| Preferred `private_key_jwt` only | Accepts unsupported method and creates symmetric secret | Rejects registration with 400 invalid_client_metadata before client storage |

Metadata field names are `token_endpoint_auth_method` (preferred string) and `token_endpoint_auth_methods_supported` (array of offered alternatives). These are client registration inputs, distinct from the server discovery field with the same plural spelling.

The before diagnostic deliberately used an invalid synthetic authorization code: `none` reached code validation (400 invalid_grant), not successful issuance. The after tests use valid native authorization codes and S256, actual Bee email consent parsing/signing, encrypted grant storage, token exchange and refresh; only Access identity verification, Bee upstream transport and final MCP tool handler are synthetic. Therefore “MCP succeeds” means the native provider accepts the access token and reaches the authenticated handler, not live Bee retrieval or ChatGPT installation.

## Migration evidence

- Package is pinned exactly to 0.10.3. Lockfile changes only its root dependency declaration and provider entry; unrelated dependencies retain original resolutions.
- [Upstream 0.10.2 negotiation repair](https://github.com/cloudflare/workers-oauth-provider/pull/295) is borrowed, not reimplemented. [0.10.3 changelog](https://github.com/cloudflare/workers-oauth-provider/blob/v0.10.3/CHANGELOG.md) includes the subsequent CIMD grant-revocation correction.
- Existing registration, real code/refresh and email eligibility regression suites pass. A second account authorization does not revoke the first account's grant. Synthetic legacy-unbound grant fixture still refreshes without silently acquiring a resource binding.
- No canonical `resourceMetadata.resource` configuration was added. Requested-resource behavior remains unconfigured-provider behavior; explicit mismatches against an already-bound grant are rejected before consuming authorization codes or rotating refresh tokens, and a valid retry succeeds.
- Discovery advertises S256 only and issuer-response support. Actual successful consent redirects carry the matching `iss`. Invalid client redirects render a local 400, never a terminal redirect to unvalidated input. No application-owned terminal OAuth error redirect currently needs additional issuer glue.
- MCP absence-of-credentials still returns 401 with its resource metadata challenge, without Access or a Container call. Resource metadata identifies the staging `/mcp` and its authorization server.
- The upstream registration response no longer advertises `registration_client_uri`: RFC7592 client management is not implemented. Earlier staging cleanup receipts do not establish a current public registration-management API. This PR adds none.
- Separate GitHub self-host authorization entry still redirects to GitHub. This test is not a complete external GitHub login.
- CIMD remains disabled; no compatibility flag, Worker binding, secret, runtime window, quota activation or production configuration changed.

## Validation and limits

Final independent cargo is based on current main15d4deb6, without monthly source. Fresh npm ci from its narrowed lockfile, TypeScript clean, 207 tests passed and two existing live smoke skips. The earlier combined diagnostic passed 223/two; that count is not substituted for this independent tree. New tests: `test/oauth-migration.test.ts`. Before diagnostic source: `docs/evidence/oauth-negotiation-before-0.7.2.ts.txt`.

Exact-source independent review, current-head CI/Bugbot and observed main staging build remain required. Actual ChatGPT installation, hosted own-Bee journey and production promotion remain separate gates.
