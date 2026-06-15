# CI/CD — the release-validation contract

*Docs-first: this document is the contract; the workflows in `.github/workflows/` fulfill it. The governing canon is `klappy://canon/constraints/release-validation-gate` — convention is optional, convention plus an enforcer is binding.*

Mirrors `klappy/git-repo-auth-mcp`, adapted for bee-ai-auth-mcp (no GitHub-App key, so no PKCS conversion test; the live wire check is `whoami`, not token minting).

## Deployment model — READ FIRST (it's githook auto-deploy, not manual)

**A `git push` deploys. That is the whole mechanism.** Cloudflare's Git integration
(Workers Builds) is connected to this repo (set up in E0011). On every push it runs the
build then a deploy command — **automatically, in Cloudflare's CI, with no human running
`wrangler` and no Cloudflare API token anywhere**:

- **Branch push → preview deploy** via `npx wrangler versions upload` (a versioned preview, not promoted).
- **Push/merge to `main` → production deploy.**

Proven, not asserted: the `ca27a8b` push to `docs/phase-1-build-ledger-and-resume`
auto-deployed a preview by itself — the build log shows Workers Builds running `npx wrangler
versions upload`. (That build predated the Worker rename; the Worker is now `bee-ai-auth-mcp`,
so current previews use that name.)

> **Do not describe deployment as a manual `wrangler deploy`, a laptop step, or anything
> needing a CF API token.** Crew triggers a deploy by pushing a branch; the operator promotes
> to prod by merging. `wrangler` runs *inside* the CI — it is never a manual step here.

## `ci.yml` — on every push/PR to `main`

1. **check** — `npm ci` → `npm run typecheck` → `npm test`. Pure units, no network. This is the gate that must stay green.
2. **resolve-preview** — Cloudflare's Git integration auto-deploys every branch to
   `https://<slug>-bee-ai-auth-mcp.klappy.workers.dev` (slug = Cloudflare's preview-alias normalization of the branch: lowercased, every non-alphanumeric run replaced by `-`, repeats collapsed, leading/trailing `-` trimmed; `main` on main). This job computes that URL and polls `/version` until it reports the commit under test (the deploy-injected `COMMIT_SHA`), so smoke runs against the new build and not the stale one Cloudflare keeps serving while the new upload finishes (up to ~5 min).
3. **smoke** — runs `test/smoke.live.test.ts` against the preview (`SMOKE_BASE_URL`).

**What smoke does NOT do:** exercise the Bee credential. `whoami` needs `BEE_API_TOKEN` and rides the unretired private-CA reachability tripwire — smoking it in CI would leak nothing but would prove nothing reliable until reachability is settled. So smoke proves only what is honestly provable without secrets: `/healthz` is up, and `/mcp` rejects the unauthenticated. The `whoami` wire check is a manual, phone-only validation step (the DoD), run once secrets + reachability are in place.

## `live-check.yml` — weekly + manual

Smokes production on a Monday cron and opens a **deduplicated** GitHub issue on failure. Reads the prod base URL from the `PROD_BASE_URL` repo variable; if unset (prod not stood up yet), it skips rather than alarm.

## Operator dependencies (Cloudflare side)

- Connect the repo to Cloudflare's Git integration so branch previews deploy (the `resolve-preview`/`smoke` jobs assume this; until then those jobs simply wait and time out — `check` still gates).
- Set the Workers Builds deploy command to inject the commit SHA so `/version` can report it: `wrangler deploy --var COMMIT_SHA:$WORKERS_CI_COMMIT_SHA`. Without it `resolve-preview` cannot confirm the new build is live and will time out rather than smoke a stale one.
- Set the `PROD_BASE_URL` repo variable once a production domain exists.
- Convention: **crew pushes branches; the operator opens PRs** (keeps Bugbot's author-match intact, per the release-validation-gate's independent-review rule).
