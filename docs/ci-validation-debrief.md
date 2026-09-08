# CI validation honesty — 2026-09-08

Continuation of ticket `2026-08-13-bee-relay-cf-access` on PR #34. Spec: kitchen `EXECUTION-CHECKPOINT-2026-09-08.md` and `REVIEW-FINDINGS-2026-09-08.md`. Canon: `klappy://canon/constraints/per-environment-worker-projects`.

## What changed

Replaced the impossible branch-preview poll (`Resolve preview URL` / `Smoke vs preview`) with a gated `Deployed validation` job. Typecheck and unit tests stay required. Deployed smoke runs only when `DEPLOYED_VALIDATION_URL` names an isolated Worker.

Did not: disable local validation; extend the alias poll; point PR CI at production; change the non-production Workers Builds command into `wrangler deploy`; create a staging Worker or any paid resource.

## Observed facts (this seat)

- Cloudflare docs (2026-09-08): Preview URLs are not generated for Durable Object Workers, including Containers; `versions upload` does not publish container images.
- Repo `wrangler.jsonc` has no `env.staging`. Ledger D0031 deleted `bee-ai-auth-mcp-staging` and the staging KV.
- GitHub Actions variables and secret values were not readable from this seat (403 on the variables/secrets APIs). Variable **names** that CI already references: `PROD_BASE_URL` (live-check). `DEPLOYED_VALIDATION_URL` is documented here; presence was not observed.
- Live `https://bee.klappy.dev/version` served `adee7c66a59268507e4b57576b6f904ba5f5078f`, which is the tip of branch `production`. `main` was `85f3b58`. Merge-to-main is not the prod fire (issue #37).
- Public `/healthz` returned 200; `/mcp` without a token returned 401 (no Access interstitial on that non-browser path). That is production, not this PR head.
- No Cloudflare control-plane connector was mounted. Access app / `CONSENT_SIGNING_SECRET` / `ALLOWED_EMAILS` were not re-inspected. Prior kitchen record still stands: OTP IdP exists; signing secret and matched Bee Access app were reported absent; Access vars empty.

## Named cargo

An isolated Git-connected validation Worker with its own DO/Container bindings is the supported hosted E2E route. It does not exist in this repo's config. When `DEPLOYED_VALIDATION_URL` is later set, CI fails on `/version` SHA mismatch, empty body, or unreachable URL before smoke. Hosted email-login acceptance, secret provisioning, and Access-app narrowing remain human gates.
