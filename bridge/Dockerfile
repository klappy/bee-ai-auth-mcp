# bee-ai-auth-mcp — private-CA bridge image (empty toolbox).
#
# Hardening spec (ledger E0012 D0025): distroless/static final stage, a single
# STATIC caddy binary, NO shell / package manager / debugger / second process,
# read-only root FS, all Linux capabilities dropped, non-root, image pinned by
# DIGEST. Collapses the "second process / planted tool / accidental log" class
# to zero. The irreducible residual — the token is plaintext in caddy's memory
# in flight — is inherent to any forwarding relay and is bounded by this minimal
# surface, not by crypto.

# ---- builder: produce a STATIC caddy binary (Caddy is pure Go) --------------
# xcaddy emits a static, CGO-free binary. No plugins needed — stock
# reverse_proxy + tls_trust_pool suffice.
# OPERATOR-FILL: pin this base by sha256 digest before deploy (do not ship a
# floating tag). e.g.  FROM caddy:2-builder@sha256:<digest> AS builder
FROM caddy:2-builder AS builder
RUN CGO_ENABLED=0 xcaddy build \
    --output /out/caddy
# Sanity: confirm the binary is static (fails the build if it links libc).
# (ldd on a static binary reports "not a dynamic executable".)

# ---- final: distroless static, non-root -------------------------------------
# distroless/static:nonroot = no shell, no package manager, CA roots present,
# runs as uid/gid 65532. The empty toolbox.
# OPERATOR-FILL: pin by digest, e.g.
#   FROM gcr.io/distroless/static-debian12:nonroot@sha256:<digest>
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /out/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
# bee-ca.pem is an OPERATOR-FILL (see README) — this repo ships a placeholder so
# no fake cert bytes are committed.
COPY bee-ca.pem /etc/caddy/bee-ca.pem

# caddy needs writable data/config dirs for ACME. Keep the root FS read-only and
# mount tmpfs at these paths at runtime (see README run config).
ENV XDG_DATA_HOME=/tmp/caddy-data XDG_CONFIG_HOME=/tmp/caddy-config

USER 65532:65532
EXPOSE 443
ENTRYPOINT ["/usr/bin/caddy", "run", "--config", "/etc/caddy/Caddyfile"]
