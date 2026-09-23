# TICKET — bee-catch-light-it

**What this is:** Turn on the Bee COMPLETED catch that already sits on `klappy/refinery`
main — **through the same Bee relay this door uses**, not a raw Bee bearer in repo secrets.
The Action is landed; it has never been observed to run; it reaches for `BEE_TOKEN`
because the relay has only human doors. Give the relay one machine door (GitHub Actions
OIDC), point the Action at it, seed the cursor, fire once by hand, observe one tape land
authored by the Action, then let the cron carry it.
**Why now:** Captain, tape 10216542 (2026-08-31 12:53p ET): raw needs to arrive without
the ritual of "go look at this." The mechanism exists (`6c3df06`, `7b25a49`); the ritual
still runs by hand — the last three tapes on main were pulled by seats, not the Action.
Every day it stays dark is a day the refinery is fed by copy-paste.
**Your move:** Fetch the blobs. Two repos, one plate: relay door first (bee-ai-auth-mcp),
Action swap second (refinery), fire third. Show the landed `sources/bee/raw/<id>/` commit in
the door — file/blob, not a PR page. Relay and Action PRs open; captain merges.

Ordered: 2026-09-01 ET (CoS door, ~12:15 AM ET)
Plate: klappy / Chris Klapp

Class: infra/light-it + auth door. Risk: STANDARD (new relay door is read-only `/v1/*`;
no secret is created; captain ruled 2026-09-01 pick 1 of 2: relay from the first run).
Station: single dish. Owner: Otto (infra lane).
Promise: set at fire (R6). Depends: none. Neighbor: `2026-08-31-refinery-raw-in-git`
(same tree; that plate recuts law, this plate turns on the feed — do not blend).

Authority (captain, tape 10216542, utterance ids — read the raw, do not gist):
- `3272190684–3272190691`: an automated way; something triggered when a session ends;
  not copy-pasting transcripts; not "go check this out."
- 2026-09-01 CoS door (~12:25 AM ET), captain: "Why can't we use the same bee auth
  connector we use?" → pick 1 of 2: recut to run through the relay from the first run.
  Move 2 (OIDC) is folded in here; Move 3 (trigger the cook) stays queued.

Ingredients (fetch live; do not paste bodies):
- `klappy/refinery` main `587bad45ccdc26b03ec93a4ea8571173cacd48e0`
- `.github/workflows/bee-completed-catch.yml` (cron */15, TZ gate Mon–Fri 08–19 ET,
  secrets `BEE_TOKEN` `BEE_API_BASE` `COS_WEBHOOK_URL`, `contents: write`)
- `.github/scripts/bee_completed_catch.py` (496 lines; `/v1/changes` cursor poll;
  writes `meta.json` + `utterances.jsonl` + thin sidecar; commits as `github-actions[bot]`)
- `sources/bee/changes-cursor.txt` — observed EMPTY on main
- `sources/bee/2026-08-31-reconcile.md` L10 `cursor: v1-1788178958287` (last manual cursor)
- `klappy/bee-ai-auth-mcp` main (fetch head at cook) — relay; 6B verdict picked `jose`
  (`jwtVerify` + `createRemoteJWKSet`) for CF Access JWTs: reuse it, do not add a lib
  → kitchen `journal/2026-08-29-bee-relay-6b-plan.tsv`
- Relay `bee_docs` (fetched 2026-09-01): forwards any `GET /v1/*` with the user's grant;
  client never handles tokens. The Action needs only `/v1/changes` and
  `/v1/conversations/:id` — inside that surface.
- GitHub Actions OIDC: `iss https://token.actions.githubusercontent.com`,
  `sub repo:klappy/refinery:ref:refs/heads/main`, `aud` chosen by the relay
  (e.g. `bee.klappy.dev`); JWKS at the issuer's well-known URL. Observe the real
  claims from one run before pinning.

Declared product:
1. Relay machine door: an HTTP path on bee.klappy.dev that accepts a GitHub Actions OIDC
   `id_token`, verifies with `jose` against the issuer JWKS, pins iss + aud + exact `sub`
   (repo + ref) — allowlist, not pattern — maps to the captain's grant, and forwards
   read-only `/v1/*` (GET; POST only `/v1/search/*`, same rule as `bee_read`). Denies by
   default; logs the `sub` on deny, never the token. Tests: good token passes; wrong
   repo, wrong ref, expired, wrong aud each deny.
1a. Action swap: `permissions: id-token: write`; script fetches the run's `id_token`
   (`ACTIONS_ID_TOKEN_REQUEST_URL`/`_TOKEN`) and calls the relay path with it.
   `BEE_TOKEN` and `BEE_API_BASE` removed from the yml and the script — grep returns
   nothing. `COS_WEBHOOK_URL` stays. No Bee secret ever set in refinery (HUMAN-ONLY
   check: captain confirms none exists; if one was set earlier, revoke it in Bee).
2. Cursor seeded: `sources/bee/changes-cursor.txt` = the newest cursor the manual pulls
   reached (start from `v1-1788178958287`; advance if a later reconcile names one). One
   commit, one line. Reason in the message: empty cursor = pull from the top = duplicates.
3. One `workflow_dispatch` run observed end to end **through the relay**: run URL, exit,
   the relay's own log line for that `sub`, and either a landed
   `sources/bee/raw/<id>/` commit authored by the Action, or the exact log line that
   stopped it. If the API returns nothing new, that is a pass — say so with the cursor it
   returned.
4. Duplicate guard checked, not assumed: run `already_landed` logic against the 13 ids
   already on main; report whether a re-catch would overwrite a hand-pulled sidecar
   (10215390 has a polaroid; 10216542/10216864 have hand-written sidecars). If yes, name
   it as a finding; do not fix it in this plate.
5. Ledger line in refinery: date the Action first ran, and by whose hand.

Done-means:
- A tape recorded after the run lands on main within one cron window, authored by the
  Action, without a seat touching it.
- `sources/bee/changes-cursor.txt` is non-empty and equals the cursor the last run wrote.
- The door shows the landed commit as a file/blob line.
- No hand-pulled sidecar on main was overwritten (or the risk is named as a finding).

Not this plate:
- No second machine door (other repos, other refs) — `sub` allowlist is one line, this repo,
  main. Widen later by ticket.
- No `bee_write`; the door is read-only by construction.
- No projection, no pass, no gate, no "trigger the cook" (Move 3, needs planning).
- No commit-author change to operator (observed miss; queue it — one line, later).
- No widening of the Mon–Fri 08–19 window unless the captain rules it.
- No edits to utterance bodies, sidecars, or the raw-in-git law.

Failure modes → response:
- Seat reads or echoes a bearer or id_token value → stop; scrub the door; report the leak.
- Door pinned on a `sub` pattern (`repo:klappy/*`) instead of the exact string → stop; exact.
- `BEE_TOKEN` left in the yml "as fallback" → stop; one door, remove it.
- Cursor "fixed" by guessing → stop; take it from a reconcile file line.
- Run described from the yml, not a run URL → stop; fire it and read the log.
- Duplicate guard assumed from code reading → stop; run it against the ids on disk.
- Action commit lands over a hand sidecar → do not revert in this plate; name it.

## Amendment 1 — HUMAN-ONLY check in 1a closed (append-only, R14)

2026-09-01 ~12:30 AM ET, CoS door, captain verbatim: "None was attempted for bee tokens
manually." No Bee bearer was ever set as a refinery secret; nothing to revoke in Bee.
The `BEE_TOKEN` reference in the yml/script has never resolved to a value. 1a's removal
is hygiene, not a leak cleanup. Do not re-ask.
