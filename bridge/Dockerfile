# bee-ai-auth-mcp — private-CA caddy + one-shot Bee CLI broker.
#
# Data plane is unchanged: PID 1 is static caddy that re-originates TLS to Bee
# trusting bee-ca.pem (E0012 / D0028). Isolation for Bee users is still
# per-grant custody, not per-container (D0022).
#
# Auth broker (kitchen CLI-BROKER-AMENDMENT-2026-09-08): Container exec runs
# Bee CLI under an opaque /tmp/bee-broker/<id> directory, then that directory
# is deleted. This image is no longer empty-toolbox/distroless — bun + the
# upstream CLI are present so exec() can run the real `bee login --no-wait`.
# Residual: a second toolchain exists in the image; it is not a long-lived
# process and must not be exposed as a public proxy.

# ---- static caddy (unchanged data-plane binary) -----------------------------
FROM caddy:2-builder AS caddy
RUN CGO_ENABLED=0 xcaddy build --output /out/caddy

# ---- Bee CLI at the commit kitchen observed for --no-wait (2026-09-08) ------
# npm @beeai/cli@0.7.3 (2026-06-27) does not publish --no-wait; the observed
# source does. Pin the commit; do not float main.
FROM oven/bun:1.2-debian AS cli
WORKDIR /opt/bee-cli
RUN bun add github:bee-computer/bee-cli#e67032d59bdfdc7f3bc73dd67683328c3e0d58b2

# ---- final: caddy is PID 1; bun/bee exist only for exec ---------------------
FROM oven/bun:1.2-debian
COPY --from=caddy /out/caddy /usr/bin/caddy
COPY --from=cli /opt/bee-cli /opt/bee-cli
COPY Caddyfile /etc/caddy/Caddyfile
COPY bee-ca.pem /etc/caddy/bee-ca.pem
COPY broker.mjs /opt/bee-broker/broker.mjs
ENV PATH="/opt/bee-cli/node_modules/.bin:${PATH}" \
    XDG_DATA_HOME=/tmp/caddy-data \
    XDG_CONFIG_HOME=/tmp/caddy-config
EXPOSE 8080 8443
ENTRYPOINT ["/usr/bin/caddy", "run", "--config", "/etc/caddy/Caddyfile"]
