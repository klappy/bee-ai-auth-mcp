# ORDER — Otto: relay machine door for GitHub Actions OIDC (bee-catch-light-it §1)

Placed 2026-09-01 ~9:50 AM ET by CoS door on captain's word ("spawn Auggie and Otto however you can"). This file is the order on the branch; the kitchen ticket is the law.

Seat: **Otto** (infra lane). Board from `klappy/kitchens` `boarding/SHIM.md` → `boarding/RECIPE.md` → `STACK.md`; cook law `klappy/kitchen` `health-code/HYGIENE.md`. The ticket is the order — fetch the blob, do not paraphrase. Commit as operator: `klappy <118073+klappy@users.noreply.github.com>`, no co-author trailers. Push to **this branch**; keep this PR a draft; do not merge; do not request review. Report as file/blob lines in the PR body.

Ticket: https://github.com/klappy/kitchen/blob/main/rail/1-ordered/2026-09-01-bee-catch-light-it/TICKET.md (blob 2c229448) — **product 1 only** here.

One HTTP path accepting a GitHub Actions OIDC `id_token` (`iss https://token.actions.githubusercontent.com`), verified with `jose` (`jwtVerify` + `createRemoteJWKSet`; no new dependency), pinning `iss` + `aud` + **exact** `sub` = `repo:klappy/refinery:ref:refs/heads/main` (allowlist string, never a pattern), mapped to the owner's grant, forwarding read-only `/v1/*` under the `bee_read` rule (GET any `/v1/*`; POST only `/v1/search/*`). Deny by default; log `sub` on deny, never the token. Tests: valid passes; wrong repo, wrong ref, expired, wrong `aud` each deny.

Not here: the Action swap (refinery), `bee_write`, a second `sub`.
