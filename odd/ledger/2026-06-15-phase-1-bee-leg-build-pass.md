# 2026-06-15 — bee-ai-auth-mcp: Phase-1 Bee-Leg Build Pass — Per-Grant Custody + Private-CA Bridge (E0013)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. Continues the trail from E0012 (private-CA resolution + custody amendment). The build session that bent Phase-1 off the Model-A Worker-secret design onto per-grant encrypted custody and produced the private-CA bridge artifacts, merged to `main`. Crew pushed the branch; the operator opened and merged the PR. Observed server_time at close `2026-06-15T11:26:44Z` UTC; civil date follows the observed server UTC day (2026-06-15), consistent with E0012 — not independently observed in the operator's local zone. Decisions continue from D0025. Milestone E0013. Full verbatim detail in the operator's transcripts.

## Decisions

**[D0026] Consent-capture design (made in execution, flagged for operator review).** The Bee token is captured at a new `/consent` POST step: after the GitHub allow-list passes in `/callback`, the relay renders a consent form, validates the pasted token via `GET /v1/me` through the bridge, then `completeAuthorization` binds `{ login, beeToken }` into encrypted grant props. Because the GitHub user token is discarded after identity is read, the gate-verified `{ oauthReqInfo, login }` is carried across the `/callback → /consent` round-trip **HMAC-signed with the existing `GITHUB_CLIENT_SECRET`** (no new secret to steward), so the login the allow-list approved cannot be swapped by a tampered form field. Rationale: a forwarding relay must re-trust the login after GitHub is out of the loop; signing closes the login-swap seam at the form. This was an execution-time call without pre-approval — surfaced here for the captain's ruling.

**[D0027] Bridge image = static caddy on `distroless/static:nonroot`, not `scratch` + a stock caddy binary.** A self-correction during the build: copying the `caddy:2-alpine` binary onto `scratch` would fail at runtime (musl-linked, no libc on scratch). The empty-toolbox spec (E0012 D0025) is satisfied by an `xcaddy`-built static binary on `distroless/static:nonroot` — no shell, no package manager, CA roots present, non-root uid/gid 65532. Run-time hardening (read-only FS, `--cap-drop=ALL`, `no-new-privileges`, tmpfs for caddy's ACME dirs) is documented in `bridge/README.md` for the deploy step.

## Observations

**[O] In-container static verification is green; runtime is unobserved.** `tsc --noEmit` clean; 15 unit tests pass (the 11 prior plus 4 new signed-consent round-trip/tamper tests in `test/state.test.ts`), 2 live-smoke skipped by design. This proves the static surface only. The Bee wire (`whoami` over the bridge) was never exercised — that is the DoD's job and requires deploy + fresh context.

**[O] Two facts were deliberately not fabricated.** `bridge/bee-ca.pem` ships as a labelled placeholder (real roots come from `bee-cli/sources/certs.ts`), and Bee's real direct API host is left as the `BEE_UPSTREAM`/`BEE_SNI` operator-fill (the docs publish only the `$BEE_API_BASE` placeholder). Confirmed against Bee docs (2026-06-07): `GET /v1/me` exists and the direct API uses a private CA. The CF Containers wrangler shape in `bridge/wrangler.jsonc` is a flagged starting point, not verified against live CF docs this session.

## Learnings

**[L] Merge-to-`main` is a code milestone, not the validated DoD.** The release-validation-gate's independent fresh-context check on the load-bearing surface still has not run, because the runtime path was never deployed. The honest state is "code merged, wire unproven." Do not promote to prod before the fresh-context green.

## Constraints

**[C] The relay token and the Bee token never appear in any log/URL/error/output** — carried forward from E0012 and honored in the new code: errors return status + generic text only; the consent form posts the token but nothing logs it; the bridge Caddyfile uses JSON access logs with no request-header logging. The audit-`observability` constraint is part of the DoD validation, still owed.

## Handoff

**[H] Phase-1 Bee leg build pass shipped to `main`.** Branch `feat/phase-1-bee-leg-per-grant-custody`, merged. Custody bend: `bee-auth.ts` (consent capture), `state.ts` (HMAC consent round-trip), `bee.ts` (`beeGetMe(token, base)`, no `env.BEE_API_TOKEN`), `mcp-api.ts` (`whoami` reads `props.beeToken`, guards stale login-only grants), `types.ts` (dropped `BEE_API_TOKEN`, added `beeToken`), plus corrected Model-A comments in `index.ts`/`wrangler.jsonc`/smoke test. Bridge: `bridge/{Dockerfile,Caddyfile,bee-ca.pem(placeholder),README.md,wrangler.jsonc}`. `ALLOWED_GITHUB_LOGIN=klappy` kept.

## State at session end

- **Mode:** execution complete for the build pass; validation pending (fresh-context, operator).
- **Merged:** the custody bend + bridge artifacts on `main`. Worker auto-deploys via CF Git integration; no new Worker secrets (`BEE_API_TOKEN` removed).
- **Not yet done (DoD):** deploy the bridge (its own `/v1/me` fetch is the definitive private-CA reachability check), set `BEE_API_BASE` → bridge, reconnect connector, `whoami` returns Bee identity, second login denied, no token in logs. Then sharpen README/security/`public/` against the built artifact.

## Opens (not banked)

- **[O-open · DoD] Runtime wire validation** — deploy + phone-only, three-pass, fresh-context `whoami`; the gate before "done."
- **[O-open · deploy] Bridge container build phone-only?** — confirm whether CF Workers Builds builds `bridge/Dockerfile` server-side, or a one-time build environment is needed.
- **[O-open · review] D0026 consent/HMAC design** — operator ruling invited.
- **[O-open · deploy] `bee-ca.pem` is gitignored** (`*.pem` repo-wide) — a build-from-repo won't include it in the build context; force-add or supply it another way. Noted in `bridge/README.md`.
- **[O-open · carried] CF Containers wrangler shape** — confirm `bridge/wrangler.jsonc` against current CF docs at deploy.
- **[O-open · carried from E0012]** Tier-2/multi-tenancy go/no-go; Bee public-cert/Tier-0 ask; drop-GitHub-for-single-tenant; `bee-mcp`→`bee-ai-auth-mcp` rename (D0015); Phase-2 `/v1/changes` + `/v1/search/conversations` live confirm-or-drop.
