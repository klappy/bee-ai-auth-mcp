# Bugbot — how to review this repo

You are the review partner every PR has (kitchen HYGIENE). Thank you. Two kinds of PR come through here and they need different handling.

## 1. Feature PRs (`dish/*` → `main`)

Review fully: logic, security, privacy (this relay holds Bee grants — never suggest logging tokens, emails, utterances or grant props), tests that actually assert the behavior they name, docs/policy updated in the same PR. Autofix is welcome here: push fixes to the PR branch, never elsewhere. Findings on the PR are the surface; the human or seat waits for you to finish before merging.

## 2. Promotion PRs (`main` → `production`)

The PR head **is `main`**. Anything you push "to the PR" lands directly on `main`, bypassing review — that is how `9082d62` and `c0a6800` happened on 2026-09-13.

On a promotion PR:
- **Do not autofix. Do not push commits.** Comment findings only.
- If a fix is warranted, open a separate PR against `main` (branch `bugbot/*`), so it gets its own review and lands on `main` before the next promotion.
- Do not flip `deploy/production-prerequisites.json`, `wrangler.production.jsonc` deploy settings, or anything under `docs/production-release.md`'s model as part of a promotion review. Those are owner decisions.
- Review only the diff `production...main`; do not re-review `main` history.

## The deploy model (binding)

Production ships only through the Workers Builds githook: merge `main` → `production`; the Build runs `npx wrangler deploy --config wrangler.production.jsonc`; then readback. `scripts/deploy-production.cjs` and the prerequisite manifest are retired history, not the release path. Any suggestion to route production through an API deploy script, an API token, a trigger edit, or a direct version upload contradicts canon `9c7e0ec` and the owner's 2026-09-13 ruling. See `docs/production-release.md`.

## Things you should flag every time

- A wrangler warning "last updated via the script API" in a Build log — someone bypassed the githook.
- Any `migrations` block added to `wrangler.production.jsonc` without a new tag and a stated new/renamed/deleted class.
- Copy on the approved hosted homepage changed without the byte pin in `test/homepage-release.test.ts` being updated in the same PR, or vice versa.
- Any new env var read in `src/` that is not in the `vars` of both `wrangler.jsonc` and `wrangler.production.jsonc` (or documented as a secret).
- Tests that only assert `accepted === false` / `ok === true` without asserting the specific error code or field the test's name promises.
- Quota math: periods are UTC weeks (Monday 00:00Z); anything that says "month" in new code is wrong.
