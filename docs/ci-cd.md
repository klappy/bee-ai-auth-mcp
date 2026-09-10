# Bee delivery environments

Feature branches merge into `main`. `main` is staging. A reviewed PR from `main`
to `production` promotes the reviewed source to production. If a separate dev
environment becomes necessary, staging can become its own branch then.

The environments use separate Worker configurations, storage, OAuth grants and
secrets. A feature branch must never upload versions into the production Worker.
The production Builds trigger accepts only `production`; the staging trigger
accepts only `main`. Feature PRs run source checks without provider mutation.

Staging is the existing `bee-validation-20260909` Worker. Its existing immutable
Container image is reused; routine source builds do not build or push an image.
Deploys preserve its existing secret bindings, Access audiences, Durable Object
namespace and bounded runtime allowance. They do not reset the cost allowance.

The proposed main-only Cloudflare Builds build command is
`npm ci && node scripts/gen-version.mjs && npm run typecheck && npm test`; its
deploy command is `node scripts/deploy-staging.cjs`. The build generates the
source commit ID and runs source checks. The deploy script bundles `src/staging.ts`, clones the currently deployed
version's complete metadata, inherits its secrets, uploads a new version without
traffic, checks that upload, explicitly deploys it, then reads back the result.
`npm run deploy` and `npm run deploy:staging` generate the source ID and invoke
the same deployment script. Deployment requires the trusted Builds
environment and refuses a branch other than `main`.

Do not run `wrangler deploy` against staging: the existing named Container,
placement, limits, runtime deadline and secret inheritance must survive exactly.
`wrangler.jsonc` describes the staging target for local development; the deployment
script preserves provider metadata directly. No image build or new resource occurs.
GitHub Actions only runs checks; it receives no Cloudflare deployment credentials.

CI typechecks and tests feature PRs and both long-lived branches. Staging acceptance
must identify the deployed source/version and verify public OAuth discovery and the
unauthenticated MCP challenge. Source tests are not hosted user acceptance: verified
signup, owner approval, user Bee authorization and successful MCP retrieval remain
separate evidence. Missing hosted evidence must not be reported as a pass.

Production promotion requires its own approval and a reviewed `main` → `production`
PR. Production uses `wrangler.production.jsonc`; its settings and secrets are not
copied from staging. Verify the deployed production source/version after promotion.

The production-only Builds trigger was read back on September 10, 2026 at
9:56 a.m. Eastern with the explicit deploy command
`npx wrangler deploy --config wrangler.production.jsonc`. This prevents the staging
default configuration from being selected on production promotion. Trigger wiring
does not authorize a release: the `main` → `production` promotion still requires
separate approval and deployed-version verification.

The existing weekly production smoke check is a read-only health observation.
It is not permission to deploy, to enroll users or to perform credentialed Bee work.
