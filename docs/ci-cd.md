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

CI typechecks and tests feature PRs and both long-lived branches. Staging acceptance
must identify the deployed source/version and verify public OAuth discovery and the
unauthenticated MCP challenge. Source tests are not hosted user acceptance: verified
signup, owner approval, user Bee authorization and successful MCP retrieval remain
separate evidence. Missing hosted evidence must not be reported as a pass.

Production promotion requires its own approval and a reviewed `main` → `production`
PR. Production uses `wrangler.production.jsonc`; its settings and secrets are not
copied from staging. Verify the deployed production source/version after promotion.

The existing weekly production smoke check is a read-only health observation.
It is not permission to deploy, to enroll users or to perform credentialed Bee work.
