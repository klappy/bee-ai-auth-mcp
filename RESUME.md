# Resume Bee hosted-service work

Board through [the current kitchen recipe](https://github.com/klappy/kitchens/blob/main/boarding/RECIPE.md),
then read the [meal checkpoint](https://github.com/klappy/kitchen/blob/main/rail/meals/2026-09-08-bee-stripe-billing/EXECUTION-CHECKPOINT.md)
and its relevant ticket/evidence pointers. Fetch current source heads and provider
state before treating any prior receipt as current. Git is the durable queue.

The delivery convention is feature branches → `main` (isolated staging) → a
separately approved `main` → `production` PR. Use the [README environment section](README.md#source-and-deployment-environments)
and [deployment contract](docs/ci-cd.md) for commands and environment configuration.
Feature branches must not upload into the production Worker. Staging deploys
preserve its existing metadata, credentials, storage and bounded runtime allowance.

The hosted journey uses email verification, a pending request, owner approval,
the user's own Bee authorization and MCP retrieval. Source tests and discovery
checks do not prove the full user journey, grant isolation, cleanup or production
acceptance. The checkpoint records which checks have actually completed. Do not
resume June single-user GitHub assumptions as today's onboarding policy.

The prior June self-host/Phase-2 handoff and PRs #34, #50 and #39 remain preserved
through [immutable provenance links](docs/recovery-provenance-2026-09-10.md).
Those historical observations are not erased or promoted into current claims.
Production publication/promotion and Stripe commitments retain their own gates.
