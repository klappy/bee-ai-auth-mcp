# CI/CD — the release-validation contract

*Docs-first: this document is the contract; the workflows in `.github/workflows/` fulfill it. The governing canon is `klappy://canon/constraints/release-validation-gate` — convention is optional, convention plus an enforcer is binding. Deployment topology for this Durable Object + Container Worker is also bound by `klappy://canon/constraints/per-environment-worker-projects`.*

Mirrors `klappy/git-repo-auth-mcp`, adapted for bee-ai-auth-mcp (no GitHub-App key, so no PKCS conversion test; the live wire check is `whoami`, not token minting).

## Deployment model — READ FIRST (it's githook auto-deploy, not manual)

**A `git push` deploys. That is the whole mechanism.** Cloudflare's Git integration
(Workers Builds) is connected to this repo (set up in E0011). On every push it runs the
build then a deploy command — **automatically, in Cloudflare's CI, with no human running
`wrangler` and no Cloudflare API token anywhere**:

- **Non-production branch push → `npx wrangler versions upload`.** That creates an immutable Worker version. It does **not** produce a reachable Preview URL for this project: the Worker binds a Durable Object (`BeeBridge`) and a Container; Cloudflare does not generate Preview URLs for that shape, and `versions upload` does not publish container images. Source of that honesty: auth PR34 at `6055b780b2dd92163a8c8b5d96c14d8e553180fe`.
- **Production deploy** is the connected production branch fire, not assumed merge-to-main. Product issue #37 records the discrepancy. This homepage seat did not re-observe live `/version`.

> **Do not describe a branch alias as a usable preview, a laptop `wrangler deploy`, or anything needing a CF API token from this plate.** Do not change the non-production build command into `wrangler deploy`.

## `ci.yml` — on every push/PR to `main`

1. **check** — `npm ci` → `npm run typecheck` → `npm test`. Pure units, no network. **This is the required automated gate.**
2. **deployed-validation** — PR only. Live smoke against `vars.DEPLOYED_VALIDATION_URL` when that repo variable names an **isolated** Worker. If the variable is unset, the job records the named gap and succeeds. That success is a named skip, not hosted acceptance and not a live smoke pass. When the URL is set, `/version` must be a git SHA of the PR head **before** smoke; mismatch, empty body, unreachable URL, or a non-SHA body fails the job (fail-closed) and smoke does not run. It does **not** poll `https://<slug>-bee-ai-auth-mcp.klappy.workers.dev`. It does **not** smoke `https://bee.klappy.dev` from a PR. It does **not** change the non-production build command into `wrangler deploy`.

This homepage branch reused the validation-only pattern from auth PR34 at `6055b780b2dd92163a8c8b5d96c14d8e553180fe`. It does not merge auth source. Job `102279387773` on `22b76f78871098133638d061f2612c7d4a8e8f53` observed the obsolete alias poll report `<none>` until timeout; that poll is retired here.

**What smoke does NOT do:** exercise the Bee credential or hosted email/CLI login. `whoami` needs a captured per-grant Bee token and rides the private-CA Container bridge. Smoke proves only what is honestly provable without secrets: `/healthz` is up, and `/mcp` rejects the unauthenticated. Hosted invitee acceptance stays a human/config cargo.

## `live-check.yml` — weekly + manual

Smokes the URL in `PROD_BASE_URL` on a Monday cron and opens a **deduplicated** GitHub issue on failure. If that variable is unset, it skips rather than alarm. This is a production-health check, not PR validation.

## Operator dependencies (Cloudflare side)

- Production deploys from the connected production branch. Confirm the live trigger before any release claim. This homepage seat did not mutate Cloudflare.
- To enable PR-time deployed smoke, stand up an **isolated** Worker with its own Durable Object namespace and Container, Git-connect it without pointing it at production, and set repo variable `DEPLOYED_VALIDATION_URL` to that Worker's URL. Do not reuse production bindings. Creating that Worker is a paid-resource decision, not taken here.
- Set `PROD_BASE_URL` to the production origin for the weekly live-check.
- Required secrets are HUMAN-ONLY. This workflow never creates or prints them.
- Convention: **crew pushes branches; the operator opens PRs** (keeps Bugbot's author-match intact, per the release-validation-gate's independent-review rule).
