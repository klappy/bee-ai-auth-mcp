# Auth isolation and logging review — 2026-09-08

Source review on PR #34 head after the CI/docs continuation. Not live E2E. No secret values fetched.

## Isolation that holds in source

- Per-grant custody: `GrantProps.beeToken` is encrypted at rest by workers-oauth-provider; `userId` is the signed login (GitHub login or email). Grants do not share props.
- Namespaces are disjoint by `@`. Consent and pairing re-check `isAllowedIdentity` before any Bee token is bound.
- Pairing state is sealed under `CONSENT_SIGNING_SECRET` and rebound to the same `login` + `clientId`. A swapped blob fails closed.
- The BeeBridge container is a shared singleton by design (E0014). Isolation rides the per-request bearer, not a per-user container. `getContainer(env.BEE_BRIDGE)` is never named per user.
- Hosted Bee CLI pairing uses an opaque broker id and `/tmp/bee-broker/<id>` only. Paths are never derived from email/login. Completing A cannot read B. Cleanup targets only that id. The operator Bee session is not a fallback.
- Telemetry `deriveTenantKey` HMACs the login; rows carry `t_…`, never login/email/token/path/content. Path class strips ids.

## Logging / cache surfaces checked

- Live `/pairing/*` uses `src/broker.ts`. Helper stdout is never logged; `sanitizeBrokerLine` redacts token/secret/key/authorization/bearer fields if a diagnostic is ever needed. Resume JSON that carries a token is parsed in memory and bound into the grant.
- `src/pairing.ts` is unused by the live handlers. Its `console.log` still runs only after `sanitizePairingBody` (keys matching `/token|secret|key/i` become `<redacted:N>`).
- `src/bee.ts` errors return generic messages; no bearer, no Bee body.
- `src/mcp-api.ts` documents that `beeToken` is never returned; `whoami` returns Bee account identity from `/v1/me`, not the bearer.
- JWKS is cached per team domain, not per user. No email cache.
- 403 HTML may echo the **current visitor's** email or GitHub login back to that visitor. That is not a cross-user leak. It is not written to logs by this handler.

## Not claimed

Worker `observability.enabled` and container logs were not inspected from the Cloudflare control plane (connector not mounted). The residual in the Phase-2 DoD — operator audit that request logs do not capture `Authorization` — remains operator cargo.
