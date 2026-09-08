# Architecture finding — hosted Bee CLI vs invitee pairing

Observed 2026-09-08 against this branch and kitchen `CLI-BROKER-AMENDMENT-2026-09-08.md` at **`f615e434965122f1ef0db70b8e147f5a744a7590`** (captain-pinned). QR/deep-link approval is expected. No secret values fetched.

## (1) What the containerized Bee CLI currently did

Before this change the bound container did **not** run Bee CLI. `bridge/Dockerfile` ENTRYPOINT was `/usr/bin/caddy`. `BeeBridge` is a shared, token-agnostic TLS proxy: Worker → `getContainer(env.BEE_BRIDGE).fetch()` → caddy `:8080` → Bee’s private-CA API. No Bee session lived in the container.

`src/pairing.ts` reused the CLI’s registered prod `app_id` and reimplemented the pairing handshake in the Worker. That is application identity, not a running CLI process.

## (2) Single-user vs multi-user

The container is a shared singleton (E0014 / D0022). Isolation is per encrypted OAuth grant (`GrantProps.beeToken`). Sharing one CLI login — including the operator’s — would expose that Bee account. Local Bee CLI is single-account per `BEE_CONFIG_DIR`.

## (3) Artifact per invitee

- Relay identity: approved email (Access OTP) or GitHub login.
- Bee artifact: that invitee’s own Bee bearer, bound into **their** grant.

Email OTP does not mint a Bee token. Bee’s observed grant path remains CLI app-pairing plus Bee-app approval. The unwanted UX is local CLI install, GitHub/Cloudflare accounts, self-hosting, or a new Bee app — not the approval link/QR itself.

## (4) Minimal safe change (implemented)

One-shot hosted Bee CLI broker inside the existing container:

1. Opaque broker id (never email/login) sealed into consent state.
2. `BEE_CONFIG_DIR=/tmp/bee-broker/<id>` + `BEE_FORCE_FILE_STORE=1`; `bee login --no-wait`.
3. Resume under that directory; validate via the existing caddy `/v1/me`; bind the grant.
4. Delete that directory. Later reads stay on the shared token-agnostic caddy path.
5. No new Bee app, no new paid Worker, no shared operator session.

## Architecture decisions required by f615e434 (source-grounded)

Observed against `bee-computer/bee-cli` `e67032d59bdfdc7f3bc73dd67683328c3e0d58b2`:

- `bee login --no-wait` prints `Authentication link: https://bee.computer/connect#<requestId>`, persists pairing state under `BEE_CONFIG_DIR`, and exits. Re-running `bee login` resumes and decrypts the token after Bee-app approval. File store: `token-prod`, `pairing-prod.json` (`sources/secureStore.ts`, `sources/commands/login/index.ts`).
- The hosted service surfaces only that connect URL (and a QR of it). Helper stdout is one JSON line; the Worker never logs it on resume.
- **`bee proxy` is not the multi-user data plane.** In `sources/commands/proxy/index.ts` the proxy loads one CLI login via `requireClientToken` and writes that bearer onto every `/v1` request. One shared proxy would inject one CLI login — including Klappy's — into every invitee read. That is the release-blocking failure the amendment names. Official local MCP is the same single-login shape. Keep the existing token-agnostic caddy bridge; pass each grant's bearer per request.
- One CLI process/state cannot isolate users. Isolation is one opaque `BEE_CONFIG_DIR` per pairing attempt, then the durable artifact is that invitee's `GrantProps.beeToken`. Topology stays one shared Container (no new paid Worker, no per-user container).
- f615e434 step 5 "retains the Bee-side authenticated session/artifact" is satisfied by the encrypted grant, not a leftover CLI directory or a live `bee proxy`.

## Isolation answer (official CLI + proxy docs, 2026-09-08)

Sources: https://docs.bee.computer/docs/cli , https://docs.bee.computer/docs/proxy ,
and `bee-computer/bee-cli` `sources/secureStore.ts` at
`e67032d59bdfdc7f3bc73dd67683328c3e0d58b2`.

- **Config home can be namespaced.** `getConfigDir()` is
  `BEE_CONFIG_DIR ?? join(homedir(), ".bee")`. File tokens live at
  `token-{env}` / `pairing-{env}.json` under that directory. Distinct
  `BEE_CONFIG_DIR=/tmp/bee-broker/<opaque-id>` values are distinct Bee
  logins. One shared `~/.bee` (or one shared `HOME`) is the
  release-blocking failure. This PR never derives a path from email/login.
- **A second container/DO per identity is not required** for pairing, and
  D0022 already forbids per-user containers. Durable isolation after
  handshake is the encrypted grant `beeToken`.
- **`bee proxy` / `bee mcp serve-http` cannot be the multi-user data plane.**
  Official proxy docs: intended for local development; "Do not expose it to
  the public internet as it provides unauthenticated access to your Bee
  data"; binds `127.0.0.1` or a Unix socket; uses the existing single
  `bee login`. `serve-http` likewise binds `127.0.0.1` and uses that login.
  One proxy process = one credential. A shared internal proxy would still
  inject Klappy's (or the last login's) bearer into every invitee `/v1`
  read. One always-on proxy per grant is a process-per-user farm inside
  the shared singleton — not authorized and not needed.
- **Worker data plane stays Bee's documented Direct API path:** caddy
  trusts the private CA and forwards `/v1/*` with the **per-request**
  grant bearer. Login uses official `bee login --no-wait` (print link,
  exit) then re-run `bee login` to finish the unexpired session.

## Image residual (blocker 1)

Bee CLI cannot run on `distroless/static` (no JS runtime). The exact
dependency is the Bun runtime (`Bun.env` / `Bun.secrets` in
`secureStore.ts`; official build is `bun build --compile`). The builder
compiles `bee` and `broker` so the final image is
`gcr.io/distroless/base-debian12:nonroot` (glibc + CA certs, no shell,
no apt) + static caddy + those two binaries, `USER 65532:65532`. Debian
and bun exist only in builder stages.

Local `docker build -t bee-bridge:local bridge/` on this seat
(2026-09-08): image `26b1de329f5c`, `User=65532:65532`,
`bee version` → `@beeai/cli 0.7.3`, broker `proxy` → forbidden,
`/bin/sh` and `/usr/bin/apt-get` and `/usr/local/bin/bun` absent,
`clear` as uid 65532 writes `/tmp`. Workers Builds image publish
remains a deploy-time gate.

## Token handoff residual (review note)

Upstream `@beeai/cli` `auth.login()` drives the CLI process and does **not**
return the token; `secureStore.ts` persists it. A library runner cannot
satisfy the Worker grant bind. A shared `bee proxy` was rejected (one
login, unauthenticated `/v1`).

**Chosen boundary:** compiled `/opt/bee-broker/broker` is the only
process that may read `/tmp/bee-broker/<id>/token-prod`. `resume`
completed emits one JSON line `{status, token}` on the internal
`container.exec` stdout pipe (Worker↔Container only). The helper then
unlinks `token-prod` and `pairing-prod.json`. The Worker parses that
line in memory, never logs it (`sanitizeBrokerLine` if a diagnostic is
ever needed), validates through caddy `/v1/me`, binds
`GrantProps.beeToken`, then `clear` removes the directory.

**Residual vs empty-toolbox Caddy:** two compiled binaries (`bee`,
`broker`) and one exec stdout line that carries a bearer once. No shell,
no apt, no bun, no `cat`, no public proxy, no CLI source tree. Container
platform logs of exec stdout/stderr were not inspected from this seat
(operator cargo).
