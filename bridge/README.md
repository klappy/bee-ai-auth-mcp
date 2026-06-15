# Private-CA bridge

A single, shared, stateless [caddy](https://caddyserver.com) reverse proxy that lets the
Worker reach Bee. Bee's direct API uses a **private CA** that a stock Cloudflare Worker
`fetch` cannot trust ([Bee docs](https://docs.bee.computer/docs/proxy) → *Direct API*; ledger
E0012). This bridge presents a **public** cert to the Worker and re-originates TLS to Bee
**trusting `bee-ca.pem`**. The Worker's `BEE_API_BASE` points here; only `/v1/*` is forwarded.

This is the deliberate decision from E0012 (D0021/D0022/D0025): one shared, stateless,
hardened bridge — **not** per-user containers. Isolation is cryptographic (per-grant
token-wrapped props), not per-container.

## You supply one fact (the rest is in the repo)

**`bridge/bee-ca.pem` is already committed** — Bee's PUBLIC CA roots (`CN=BeeCertificateAuthority, O=Bee` prod + `Bee Staging Root CA`), copied verbatim from the public Bee CLI source `github.com/bee-computer/bee-cli` → `sources/certs.ts` (commit 97dfdb18) and verified to parse. These are public trust anchors, not secrets, so they live in the repo and the `.gitignore` `*.pem` rule has an explicit `!bridge/bee-ca.pem` exception. Nothing to paste.

The one thing this repo can't know is **Bee's real direct API host** — the docs publish only the placeholder `$BEE_API_BASE`. Get it from your `bee-cli` config / Bee and set it as `BEE_UPSTREAM` and `BEE_SNI` (see env below). That's runtime config, not a repo file.

## Runtime env (Caddyfile placeholders)

| Var               | Meaning                                                              |
| ----------------- | ------------------------------------------------------------------- |
| `BRIDGE_HOSTNAME` | The bridge's own public hostname (the Worker's `BEE_API_BASE` host).|
| `BEE_UPSTREAM`    | Bee's real direct API `host:port` (e.g. `…:443`). **Operator-fill.**|
| `BEE_SNI`         | Bee's real hostname for SNI + cert validation. Usually = upstream host. |

## Build (pin by digest)

```
# from bridge/  — pin BOTH base images by sha256 digest first (see Dockerfile OPERATOR-FILLs)
docker build -t bee-bridge:local .
```

## Run hardening (the rest of the empty-toolbox spec)

The Dockerfile gives you scratch-class image + static binary + non-root. The remaining
hardening is **run-time** flags — apply them in whatever runs the image:

```
--read-only \
--cap-drop=ALL \
--security-opt=no-new-privileges \
--tmpfs /tmp/caddy-data --tmpfs /tmp/caddy-config \
--user 65532:65532 \
--publish 443:8443 --publish 80:8080
```

caddy listens on **unprivileged** ports — `8443` (HTTPS) and `8080` (HTTP) — because a
non-root process with `--cap-drop=ALL` cannot bind `<1024`. The platform maps public
`443`→`8443` (and `80`→`8080`); on Cloudflare Containers, point the fronting Worker/DO at
the container's `8443`. Adding `--cap-add=NET_BIND_SERVICE` to bind `443` directly would
break the empty-toolbox "all caps dropped" goal — don't.

Never enable request-header logging — the access log must never emit `Authorization`.

## Deploying on Cloudflare

The operator ruling is **CF-only, no multi-host split** (E0012 D0021), so deploy this as a
**Cloudflare Container**.

> ⚠️ **Confirm the wrangler Containers schema against current CF docs at deploy time.**
> The Containers product config (the `containers` array, the bound Durable Object class,
> `instance_type`/`max_instances`, the `@cloudflare/containers` helper) is version-sensitive
> and was not re-verified against live CF docs in the session that wrote this file. The image
> above is the stable part; treat `bridge/wrangler.jsonc` as a starting point, not gospel —
> check `developers.cloudflare.com` → Containers before `wrangler deploy`.

Then point the main Worker at it:

```
# In the root wrangler.jsonc vars (or `wrangler secret`/var as you prefer):
BEE_API_BASE = "https://<BRIDGE_HOSTNAME>"
```

## The definitive reachability check

The bridge's **own** fetch to Bee is the conclusive private-CA test (E0012 build step 1):
once deployed, from the Worker (or curl against the bridge) hit `/v1/me` with a valid Bee
token. If it returns the account, the private-CA leg works. If it fails at TLS, `bee-ca.pem`
or `BEE_SNI` is wrong. A stock Worker cannot perform this check — that is the whole reason the
bridge exists.

## Logs

Verify no `Authorization` ever appears in bridge logs (DoD). The Caddyfile uses JSON access
logs with **no** request-header logging; do not add directives that change that.
