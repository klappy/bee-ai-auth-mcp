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

Residual: the image is no longer empty-toolbox/distroless — bun + upstream CLI exist so `exec()` can run `bee`. They are not a public proxy and not a long-lived Bee session. Default `@cloudflare/workers-types` on this repo still omit `exec()`; the call is a runtime-shaped wrapper per Cloudflare Containers docs. Live broker E2E remains a human/config gate.
