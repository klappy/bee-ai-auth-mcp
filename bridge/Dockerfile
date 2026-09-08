# bee-ai-auth-mcp — private-CA caddy + one-shot Bee CLI broker.
#
# Data plane is unchanged: PID 1 is static caddy that re-originates TLS to Bee
# trusting bee-ca.pem (E0012 / D0028). Isolation for Bee users is still
# per-grant custody, not per-container (D0022).
#
# Auth broker (kitchen CLI-BROKER-AMENDMENT-2026-09-08): Container exec runs
# Bee CLI under an opaque /tmp/bee-broker/<id> directory, then that directory
# is deleted.
#
# Why this is not distroless/static (exact runtime dependency):
# bee-computer/bee-cli e67032d59bdfdc7f3bc73dd67683328c3e0d58b2 is a Bun
# program (`sources/secureStore.ts` uses Bun.env / Bun.secrets;
# `package.json` build is `bun build --compile`). A static-only image cannot
# exec `bee`. bun compile embeds the runtime into two purpose-built binaries
# (`bee`, `broker`). Those binaries are dynamically linked to glibc, so the
# final stage is distroless/base:nonroot — glibc + CA certs, no shell, no apt,
# no Debian userland, no bun REPL, no CLI source tree.
#
# Debian exists only in builder stages. Writable isolation stays under /tmp
# (1777): /tmp/bee-broker/<id> and caddy XDG dirs.

# ---- static caddy (unchanged data-plane binary) -----------------------------
FROM caddy:2-builder AS caddy
RUN CGO_ENABLED=0 xcaddy build --output /out/caddy

# ---- compile Bee CLI + broker helper (builder only; discarded) --------------
# npm @beeai/cli@0.7.3 does not publish --no-wait; pin the observed commit.
FROM oven/bun:1.2-debian AS cli
WORKDIR /opt/bee-cli
RUN bun add github:bee-computer/bee-cli#e67032d59bdfdc7f3bc73dd67683328c3e0d58b2
WORKDIR /opt/bee-cli/node_modules/@beeai/cli
RUN bun build ./sources/main.ts --compile --outfile /out/bee
COPY broker.mjs /tmp/broker.mjs
RUN bun build /tmp/broker.mjs --compile --outfile /out/broker

# ---- final: three binaries, non-root, no toolbox ----------------------------
FROM gcr.io/distroless/base-debian12:nonroot
COPY --from=caddy /out/caddy /usr/bin/caddy
COPY --from=cli /out/bee /usr/local/bin/bee
COPY --from=cli /out/broker /opt/bee-broker/broker
COPY Caddyfile /etc/caddy/Caddyfile
COPY bee-ca.pem /etc/caddy/bee-ca.pem
ENV PATH="/usr/local/bin:/usr/bin" \
    XDG_DATA_HOME=/tmp/caddy-data \
    XDG_CONFIG_HOME=/tmp/caddy-config \
    HOME=/tmp \
    BEE_FORCE_FILE_STORE=1
USER 65532:65532
EXPOSE 8080 8443
ENTRYPOINT ["/usr/bin/caddy", "run", "--config", "/etc/caddy/Caddyfile"]
