# 2026-06-15 — bee-ai-auth-mcp: Bee-Leg Private-CA Resolution + Multi-Tenancy Security Analysis (E0012)

DOLCHEO per `klappy://canon/definitions/dolcheo-vocabulary`. Decision trail from the session that retired the Phase-1 private-CA reachability gate, chose the Worker→Bee network path, and pressure-tested a multi-tenant custody design to its honest ceiling. Continuous session; observed server_time at close `2026-06-15T04:24:49Z` UTC (civil date 2026-06-15). Decisions continue from D0019. Full verbatim detail in the operator's transcripts.

## Decisions

**[D0020] Private-CA gate resolved: PRIVATE — conclusive, from Bee's own docs, not from a cert probe.** Bee's API docs (updated 2026-06-07) state outright that the direct API uses a private CA, not a public CA; the documented call requires `--cacert bee-ca.pem`; and `bee-cli/sources/certs.ts` hardcodes two self-issued roots (`CN=BeeCertificateAuthority, O=Bee` prod; `Bee Staging Root CA`). The PUBLIC branch of the resumption brief is void. The sandbox `openssl` form of the check is unusable here (see Observations) and was unnecessary — the vendor's docs are the authoritative source the probe only approximated.

**[D0021] Network path = a single Cloudflare Container bridge (caddy), per operator ruling "must run on CF infra, no multi-host split."** CF-only collapses the earlier Tunnel option (cloudflared requires a non-CF host). Verified against current CF docs (June 2026): stock Worker `fetch`, Workers VPC + Origin-CA (public + Cloudflare Origin CA only), and the mTLS Workers binding (presents a *client* cert; wrong direction) all cannot trust Bee's third-party server CA on egress. A Container running caddy with `bee-ca.pem` in its trust pool is the only CF-native bridge. `src/bee.ts` needs no change; `BEE_API_BASE` points at the bridge.

**[D0022] Multi-tenant cross-user isolation lives at the custody layer, not in per-user containers.** Keep a SINGLE shared, stateless, hardened bridge. Reject per-user containers: they isolate egress (the wrong layer), explode cost/lifecycle, break one-person-maintainability, and do not even close the in-flight path while `bee-mcp` is the shared component. Isolation is achieved cryptographically per-grant (see D0024 / Observation on the verified crypto). Scope: holds while custody sits in `bee-mcp`; revisit only under a threat model that demands physical egress separation.

**[D0023] Reject encrypting the Bee token with the user's GitHub primitives.** No intrinsic value: a forwarding relay must decrypt server-side, so the protecting secret must be server-reachable at request time (which the relay token already is); GitHub public keys can't be decrypted server-side (and are often ed25519 signing-only), and the GitHub access token is a second revocable secret to steward. It also re-conflates the identity layer with the custody layer that E0011 (L) deliberately separated. GitHub is the door, not the lock.

**[D0024] Reject the Worker-secret defense-in-depth (for now).** It defends exactly one scenario — KV ciphertext + leaked relay token *without* Worker execution/secret access — which is narrow, largely already covered by token-logging hygiene, orthogonal to the irreducible in-process residual, and costs custom crypto (the library can't take an injected secret). Revisit only if a future threat model includes KV being readable by a credential that cannot read Worker secrets.

**[D0025] Bridge hardening spec = empty toolbox + zero token logging.** `scratch`/distroless image, single static caddy binary, no shell / package manager / debugger / second process, read-only root FS, all Linux capabilities dropped, non-root, image pinned by digest; caddy never logs the `Authorization` header. This eliminates the "second process / planted tool / accidental log" class entirely.

## Observations

**[O] The sandbox egress proxy is a terminating MITM — proven, not assumed.** `openssl s_client` against both `bee.klappy.dev` and `github.com` returns issuer `O = Anthropic, CN = Egress Gateway SDS Issuing CA (production)`; the gateway re-signs every origin cert. So a cert-issuer probe from this environment is blind regardless of target. This confirms by observation the §4 handoff note that "the egress proxy masked Bee's origin cert."

**[O] Bee's docs (2026-06-07) now document two endpoints a prior validation marked absent.** `/v1/changes` and `/v1/search/conversations` (BM25 + `/neural`) are now in Bee's published API surface, contradicting the 2026-06-14 validation ledger's "absent" finding. This retires the *docs-side* half of the Phase-2 confirm-or-drop; live-API enumeration is still owed before any tool surface is frozen.

**[O · verified against source] `@cloudflare/workers-oauth-provider` 0.7.2 grant-prop crypto.** Read from the published npm tarball (`dist/oauth-provider.js`, ~lines 2729–2835): `encryptProps` generates a *fresh random* AES-GCM-256 key per encryption; that key is wrapped via AES-KW with a key = `HMAC-SHA256(public hardcoded constant, relay-token)`; at rest in KV = ciphertext + token-wrapped key; decryption requires the token presented in the request. Consequences: there is **no master/KMS key** (no single secret unlocks all grants), grants are **per-user isolated** (A's token cannot unwrap B's), and a **KV-dump alone is useless**. The fixed all-zero IV is safe *only* because keys are single-use. The memory-note claim ("token-derived, per-grant, not KMS") is confirmed.

## Learnings

**[L] A hosted forwarding relay has an irreducible in-flight plaintext window.** The token must be plaintext in the forwarding process's memory to be sent to Bee. No at-rest scheme removes this; container hardening converts "many ways in" into "one in-process/platform way in," not to zero. Below that floor lies only "don't forward" — i.e., Bee offering a public-cert / short-lived-token endpoint (Tier-0).

**[L] The bridge's plaintext exposure is the price of the private-CA bridge.** The Container must terminate TLS (public cert to the Worker) and re-originate TLS to Bee (trusting the private CA), so it must see plaintext HTTP between. L4/TCP passthrough would keep the token encrypted but leaves the Worker validating Bee's private cert — which fails. Deleting the second plaintext site requires deleting the bridge, which requires Bee to offer a public cert.

**[L] "Guaranteed secure" is not a deliverable; "what it closes vs. leaves" is.** The verified design closes the at-rest honeypot and cross-user leak; the residual is live-process compromise + token-logging hygiene, which is inherent to forwarding and is defended by surface-minimization, not more crypto.

## Constraints

**[C] Neither the relay token nor the Bee token is ever logged** — not in Worker `observability`, not in the bridge. Relay-token + KV ciphertext = the Bee token, so relay-token hygiene is load-bearing.

**[C] Audit what `observability: enabled` actually captures** (headers? outbound fetch?) before any multi-tenant ship.

**[C] Accepting the first third-party user's Bee token is the irreducible one-way door** — it flips the Phase-1 property "holds no third party's credentials." Decide deliberately; it reopens the deferred Tier-2 fork.

## Milestone (Encode)

**[E0012] Phase-1 Bee leg is design-unblocked, and multi-tenant custody is security-cleared to its honest ceiling.** The private-CA gate is resolved (PRIVATE) and the network path is chosen (shared CF Container caddy bridge). The same shared, stateless, empty-toolbox bridge serves both single-tenant Phase 1 and any future multi-tenant build — no rework. Multi-tenant isolation is verified to rest on per-grant token-wrapped encryption (no honeypot at rest, per-user isolated), with the residual honestly bounded to the in-flight/live-process window that no forwarding relay escapes until Bee mints short-lived tokens.

## State at session end

- **Gate:** PRIVATE-CA, conclusive (Bee docs 2026-06-07 + `certs.ts`). PUBLIC branch void.
- **Network path:** shared CF Container (caddy) bridge; `BEE_API_BASE` → bridge; `src/bee.ts` unchanged.
- **Crypto:** workers-oauth-provider 0.7.2 verified — per-grant token-wrapped, no master key, KV-dump-alone useless.
- **Not yet built:** the bridge itself (Phase-1 single-tenant Bee leg / `whoami` still unproven on the wire). No code change this session; this is a planning/verification trail.
- **Strategic decision still owed (operator):** whether to open the Tier-2 / third-party-token door at all.

## Opens (not banked)

- **[O-open · parallel] Bee public-cert / short-lived-token (Tier-0) ask** — the only thing that removes the in-flight residual and the bridge entirely. Vendor-dependent.
- **[O-open · P2] Tier-2 / multi-tenancy go/no-go** — security-cleared here, but the one-way door (C) and the "adopt Omi as the long-term wire; this is a substrate" decision make it a deliberate strategy call.
- **[O-open · P2] Drop-GitHub-for-single-tenant** (carried from E0011).
- **[O-open · P3] Canonical-URI rename `bee-mcp` → `bee-ai-auth-mcp`** (D0015, carried).
- **[O-open · Phase 2] Live-API enumeration of `/v1/changes` + `/v1/search/conversations`** — now docs-confirmed (O above), live confirm-or-drop still owed before freezing a tool surface.
