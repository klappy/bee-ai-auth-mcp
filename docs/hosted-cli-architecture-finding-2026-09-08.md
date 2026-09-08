# Architecture finding — hosted Bee CLI vs invitee pairing

Observed 2026-09-08 against this branch, kitchen ticket `rail/3-pass/2026-08-13-bee-relay-cf-access` (kitchen sha `875bf921`), and `CLI-BROKER-AMENDMENT-2026-09-08.md`. No secret values fetched.

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

Residual: the image is no longer empty-toolbox/distroless — bun + upstream CLI exist so `exec()` can run `bee`. They are not a public proxy and not a long-lived Bee session. Default `@cloudflare/workers-types` on this repo still omit `exec()`; the call is a runtime-shaped wrapper per Cloudflare Containers docs. Live broker E2E remains a human/config gate.
