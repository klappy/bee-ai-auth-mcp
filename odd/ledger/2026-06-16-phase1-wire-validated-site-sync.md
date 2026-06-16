# 2026-06-16 — bee-ai-auth-mcp Phase-1 Wire Validated + Site/Docs Honesty Pass: Encoding Journal (E0019)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. This entry records the dead-host fix, the green `whoami` wire proof, and the documentation/website sync that the proof unlocked. The wire proof was validated fresh-context, on mobile, over the live connector. Civil date is America/New_York (operator timezone confirmed this session from Bee `/v1/me`).

## Events

**[E] `whoami` wire proof GREEN — the Phase-1 load-bearing DoD piece.** Over the live connector, on mobile, from a fresh context, `whoami` returned the operator's Bee identity (`connected_as: klappy`; Bee id 11128, Chris Klapp, America/New_York). The full Tier-1 path is proven end-to-end: GitHub identity gate → Bee token captured at the consent step into encrypted per-grant props → the private-CA Container bridge → Bee `GET /v1/me`. A builder did not validate its own build (this context did not write the Bee leg).

**[E] Dead-host 502 diagnosed, fixed, merged, deployed.** `wrangler.jsonc` `BEE_UPSTREAM`/`BEE_SNI` had pointed at `api.bee.computer`, which does not resolve (NXDOMAIN) → caddy `reverse_proxy` upstream failure → 502. The operator's `bee status` surfaced the real Bee prod host, `app-api-developer.ce.bee.amazon.dev`; verified by `curl --cacert bridge/bee-ca.pem` (real host resolves and its cert chains to the committed CA; the old host NXDOMAINs). Fix pushed on `fix/bee-bridge-upstream-host` (`a757a88`), merged to `main` (`bc9fdec`); `/version` on both prod hosts equals `main` HEAD, confirming the deploy.

## Observations

**[O] Operator timezone confirmed America/New_York** — read from Bee `/v1/me` via `whoami`. Earlier in the session the timezone was unobservable (geolocation off) and was correctly *not* inferred; the system itself later surfaced the ground truth. Civil dates in this repo follow this timezone.

**[O] The public surface described a pre-amendment system.** Across all five website pages, the README, RESUME, and the token runbook, the copy still asserted the Bee leg was "gated / pending a cert check," that the Bee token was a Worker secret (`BEE_API_TOKEN`) reached via a `BEE_API_BASE` URL, and that deploy was `npm run deploy`. All three are superseded — by the custody amendment (E0012, per-grant encrypted custody), the bound-container bridge (E0014, `getContainer(env.BEE_BRIDGE)`, no public cert), and git-push Workers Builds. `PRD.md` v0.4 §Custody states plainly that the public site copy must reflect token-agnostic custody; it did not, until this pass.

## Learnings

**[L] "Validated" is what unlocks the honesty pass.** The crashed prior session deferred the site/docs sync because the wire was not yet green — correct sequencing (do not claim "validated" before the proof exists). With the proof in hand, the sync became legitimate and was executed: README full rewrite; five HTML pages corrected surgically (26 string-exact edits, 0 misses, page structure preserved); RESUME and the runbook flipped to validated; a new token-acquisition runbook added. Correctness was checked, not asserted — a residual false-term scan (no `BEE_API_BASE` anywhere; every remaining "Worker secret" mention is the *correct* framing, i.e. GitHub's client secret or "there is no Bee Worker secret") plus an HTML structure sanity check (one `</html>` and intact footer per page).

**[L] Token acquisition is a concrete, laptop-gated path.** From the bee-cli source: `bee login --qr` uses an app-pairing device grant (`POST auth.beeai-services.com/apps/pairing/request` — public host, no client secret), the token lands in the macOS Keychain (`bee-cli` / `token:prod`) or `~/.bee/token-prod`, and is pasted at the relay's consent screen. Relay-side, laptop-free QR pairing is buildable but gated on obtaining a Bee-registered `app_id` (the Tier-0 petition, now concrete). Captured in `docs/connecting-and-getting-your-bee-token.md`.

## Constraints

**[C] Provenance unchanged.** Crew pushed this branch (`docs/phase1-validated-site-sync`); the operator opens and merges the PR so author-keyed tooling (e.g. Bugbot) triggers correctly. Public-facing prose (README, website copy) is crew-drafted and merges only on the operator's review of the exact diff.

## Handoffs

**[H] Remaining Phase-1 DoD.** A three-pass `whoami` re-run; a demonstrated second-GitHub-login denial by the allow-list; an audit that no token appears in logs / observability.

**[H] Bee token rotation (housekeeping, not a blocker).** The operator's live Bee bearer was pasted into chat during debugging; re-pair / rotate it in the Bee app at convenience.

**[H] Phase 2 — confirm-or-drop retrieval endpoints.** `/v1/conversations` is confirmed in Bee's docs; `/v1/search/conversations` and `/v1/changes` are unconfirmed and stay out of the tool surface until verified against the live API. No tool is added against a fabricated schema.
