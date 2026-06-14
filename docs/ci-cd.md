# CI/CD — the release-validation contract

*Docs-first: this document is the contract; the workflows in `.github/workflows/` fulfill it. The governing canon is `klappy://canon/constraints/release-validation-gate` — convention is optional, convention plus an enforcer is binding.*

Mirrors `klappy/git-repo-auth-mcp`, adapted for bee-ai-auth-mcp (no GitHub-App key, so no PKCS conversion test; the live wire check is `whoami`, not token minting).

## `ci.yml` — on every push/PR to `main`

1. **check** — `npm ci` → `npm run typecheck` → `npm test`. Pure units, no network. This is the gate that must stay green.
2. **resolve-preview** — Cloudflare's Git integration auto-deploys every branch to
   `https://<slug>-bee-ai-auth-mcp.klappy.workers.dev` (slug = branch lowercased, `/` and `.` → `-`; `main` on main). This job computes that URL and polls `/healthz` until it returns 200 (up to ~5 min).
3. **smoke** — runs `test/smoke.live.test.ts` against the preview (`SMOKE_BASE_URL`).

**What smoke does NOT do:** exercise the Bee credential. `whoami` needs `BEE_API_TOKEN` and rides the unretired private-CA reachability tripwire — smoking it in CI would leak nothing but would prove nothing reliable until reachability is settled. So smoke proves only what is honestly provable without secrets: `/healthz` is up, and `/mcp` rejects the unauthenticated. The `whoami` wire check is a manual, phone-only validation step (the DoD), run once secrets + reachability are in place.

## `live-check.yml` — weekly + manual

Smokes production on a Monday cron and opens a **deduplicated** GitHub issue on failure. Reads the prod base URL from the `PROD_BASE_URL` repo variable; if unset (prod not stood up yet), it skips rather than alarm.

## Operator dependencies (Cloudflare side)

- Connect the repo to Cloudflare's Git integration so branch previews deploy (the `resolve-preview`/`smoke` jobs assume this; until then those jobs simply wait and time out — `check` still gates).
- Set the `PROD_BASE_URL` repo variable once a production domain exists.
- Convention: **crew pushes branches; the operator opens PRs** (keeps Bugbot's author-match intact, per the release-validation-gate's independent-review rule).
