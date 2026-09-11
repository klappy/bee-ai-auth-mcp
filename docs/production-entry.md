# Production hosted entry boundaries

The existing auth ticket authorizes sharing the reviewed staging OAuth/signup
implementation with production. `hosted-handler.ts` composes the maintained OAuth
provider; `hosted-bridge.ts` reuses admission and monthly quota transactions over
the same storage keys. No OAuth protocol, grant store or database is replaced.

| Policy | Production | Staging |
|---|---|---|
| Entry | `src/hosted.ts` | `src/staging.ts` |
| Runtime discriminator | forced production | forced staging |
| Identity | existing GitHub allowlist plus email admission when signup enabled | email only |
| Private owner configuration | `ADMIN_ACCESS_AUD`, `ADMIN_OWNER_EMAIL` | `STAGING_PREVIEW_AUD`, `STAGING_OWNER_EMAIL` |
| Expiry and lifetime budgets | none inherited from validation | existing expiry, 10,000 requests and 100,000 signup operations |
| Registration and records | 60/hour, 1,000/day; 100 admission records | same plus lifetime budget |
| Observation | existing optional AE path | owner-only aggregate when separately enabled; AE always bypassed |

`SIGNUP_ENABLED=true` selects email signup rather than the static email allowlist.
It does not select staging. With self-service absent, verified email is pending
until owner approval. `SELF_SERVICE_ENABLED=true` additionally requires a valid
positive integer `SELF_SERVICE_READ_LIMIT` and policy version before enrollment.
No amount is supplied or enabled by this change. Denied and revoked email grants
fail admission and refresh. GitHub grants never need an email admission epoch or
email quota record; their existing allowlist remains enforced.

The shared root handler does not publish a staging signup splash in production.
Production static assets and the separately approved homepage are a release
packaging concern. This change only prepares `wrangler.production.jsonc` to select
the hosted entry, preserving its resource identities. Existing production storage,
class name `BeeBridge`, migration tag `v1`, and grant encryption remain unchanged.
No provider setting, image, log/redaction policy or secret is changed here.

Synthetic tests exercise the actual maintained OAuth provider and MCP runtime,
including a legacy-issued GitHub grant exchanged/refreshed through hosted entry,
email admission transitions, revoked epochs, monthly policy states, public
discovery/PKCE and real signed JWT admin audience/owner negatives. They do not
prove real email delivery, Bee approval, cross-user retrieval or granted cleanup.
Those remain hosted acceptance gates for production release.

Auggie accepted the bounded asset-precedence supplement: hosted entry serves
only exact known embedded public assets and aliases on GET/HEAD, excluding all
identity/protocol routes. The existing embedded map bytes stay unchanged here;
approved homepage materialization belongs only to the separately reviewed release
build. This supports Worker-first routing without stale asset-service precedence.

Signup instructions resolve to the production homepage in production and the
protected preview in staging. Only staging approval pages describe the bounded
validation window; production approval text makes no staging-runtime claim.
