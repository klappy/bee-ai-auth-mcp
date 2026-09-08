# CI/CD — the release-validation contract

*Docs-first: this document is the contract; the workflows in `.github/workflows/` fulfill it. The governing canon is `klappy://canon/constraints/release-validation-gate` — convention is optional, convention plus an enforcer is binding. Deployment topology for this Durable Object + Container Worker is also bound by `klappy://canon/constraints/per-environment-worker-projects`.*

Mirrors `klappy/git-repo-auth-mcp`, adapted for bee-ai-auth-mcp (no GitHub-App key, so no PKCS conversion test; the live wire check is `whoami`, not token minting).

## Deployment model — READ FIRST

**A `git push` to the connected production branch deploys production.** Cloudflare Workers Builds is connected to this repo. This seat does not run `wrangler deploy` (HYGIENE 10a).

Live fire observed 2026-09-08:

- `https://bee.klappy.dev/version` served `adee7c66a59268507e4b57576b6f904ba5f5078f`
- that SHA is the tip of branch `production` (merge of PR #42, 2026-08-30)
- `main` was already ahead (`85f3b58`) and did not move the custom domain

Product issue #37 records the same discrepancy. **Merge to `main` is a code milestone, not production.** A Workers Builds upload on a non-production branch is not a reachable preview and is not production.

### What branch builds actually do

For commits that are **not** on the connected production branch, Workers Builds runs the non-production deploy command (default `npx wrangler versions upload`). That creates an immutable Worker version.

It does **not** produce a Preview URL for this project:

- This Worker binds a Durable Object (`BeeBridge`) and a Container.
- Cloudflare: Preview URLs are not generated for Workers that implement Durable Objects, including Containers.
- Cloudflare: `wrangler versions upload` does not publish container images.

Sources, checked 2026-09-08:

- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/containers/guides/deploy/

Ledger D0031 (2026-06-15) removed the separate `bee-ai-auth-mcp-staging` Worker and the `env.staging` block. Current `wrangler.jsonc` has no isolated environment. Creating a new paid Worker is not authorized from this plate.

## `ci.yml` — on every push/PR to `main`

1. **check** — `npm ci` → `npm run typecheck` → `npm test`. Pure units, no network. **This is the required automated gate.**
2. **deployed-validation** — PR only. Live smoke against `vars.DEPLOYED_VALIDATION_URL` when that repo variable names an **isolated** Worker. If the variable is unset, the job records the named gap and succeeds. When the URL is set, `/version` must match the PR head **before** smoke; a SHA mismatch fails the job (fail-closed) and smoke does not run. It does **not** poll `https://<slug>-bee-ai-auth-mcp.klappy.workers.dev`. It does **not** smoke `https://bee.klappy.dev` from a PR. It does **not** change the non-production build command into `wrangler deploy`.

**What smoke does NOT do:** exercise the Bee credential. `whoami` needs a captured per-grant Bee token and rides the private-CA Container bridge. Smoke proves only what is honestly provable without secrets: `/healthz` is up, and `/mcp` rejects the unauthenticated. The `whoami` wire check is a manual, phone-only validation step.

## `live-check.yml` — weekly + manual

Smokes the URL in `PROD_BASE_URL` on a Monday cron and opens a **deduplicated** GitHub issue on failure. If that variable is unset, it skips rather than alarm. This is a production-health check, not PR validation.

## Operator dependencies (Cloudflare side)

- Production deploys from the connected production branch (`production` as of the 2026-09-08 `/version` observation). Confirm the live trigger before any release claim.
- To enable PR-time deployed smoke, stand up an **isolated** Worker with its own Durable Object namespace and Container, Git-connect it without pointing it at production, and set repo variable `DEPLOYED_VALIDATION_URL` to that Worker's URL. Do not reuse production bindings.
- Set `PROD_BASE_URL` to the production origin for the weekly live-check.
- Required secrets (`CONSENT_SIGNING_SECRET`, `ALLOWED_EMAILS`, GitHub OAuth, Access vars) are HUMAN-ONLY. This workflow never creates or prints them.
- Convention: **crew pushes branches; the operator opens PRs** (keeps Bugbot's author-match intact, per the release-validation-gate's independent-review rule).
