# ORDER — finish this branch: the relay machine door (bee-catch-light-it §1)

Placed 2026-09-01 ~10:45 AM ET by CoS door. Seat: **Otto** (infra lane). Board from `CLAUDE.md` at repo root.

This branch (PR #43, opened 2026-08-31 by a Cursor seat) already carries the door: `src/actions-oidc.ts`, JWKS verify, audience pin, repo allow-list, login tenancy gate. **Finish it; do not restart.** Ticket (law): https://github.com/klappy/kitchen/blob/main/rail/1-ordered/2026-09-01-bee-catch-light-it/TICKET.md — product 1.

Observed failures to close, in order:
1. **Harness bug** — `.github/workflows/actions-oidc-repo-gate.yml` "Wait for preview /version": `DEPLOYED=$(curl -fs … || true)` empty → `case "$EXPECTED_SHA" in "$DEPLOYED"*)` matches anything → step passes with `Preview live:` blank. An empty `DEPLOYED` must fail the step.
2. **No preview worker** — `https://cursor-actions-oidc-seat-tasting-bb4c-bee-ai-auth-mcp.klappy.workers.dev` is a Cloudflare 404 on every path (probed 2026-09-01 14:3xZ). Find why Workers Builds produced no preview for this branch (branch-preview setting, or slug mismatch) and fix so the live test hits a real worker. Both live tests currently fail with 404 for this reason, not because the code is wrong.
3. **Exact `sub`** — ticket rule: pin `sub` = `repo:klappy/refinery:ref:refs/heads/main` as an allowlist string, not a repo-only pattern. Keep the audience pin. Log `sub` on deny, never the token.
4. **Four deny tests green** on the real preview: wrong repo, wrong ref, expired, wrong `aud`; plus the 401-without-Authorization test.

Commit as operator (`klappy <118073+klappy@users.noreply.github.com>`), push here, keep draft, do not merge. Report file/blob lines + the green run URL in the PR body. PR #45 is closed as superseded by this branch.
