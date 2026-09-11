# Production hosted entry parity — September 11, 2026

Auggie fire: klappy/kitchen rail/3-pass/2026-08-13-bee-relay-cf-access/PRODUCTION-ENTRY-AMENDMENT-2026-09-11.md blob 8a8e56c242ba60250b2aaa39993ea8fac5f267d8; FIRE-CHECK-RUN-PRODUCTION-2026-09-11.md blob c62cc671ad42d80ecdc04ec45052628c3434a23b.

Share hardened hosted handlers and bridge with explicit staging boundaries.
Preserve GitHub grants, email admission, storage and disabled numeric quota.
Production admin uses ADMIN_ACCESS_AUD/ADMIN_OWNER_EMAIL; no values or provider
mutations. Existing homepage writer owns shared copy. No deployment script,
release merge or homepage publication in this source fire. Independent review
and current-head CI/Bugbot precede Auggie merge.

Auggie accepted the bounded asset-precedence supplement: hosted entry serves
only exact known embedded public assets and aliases on GET/HEAD, excluding all
identity/protocol routes. The existing embedded map bytes stay unchanged here;
approved homepage materialization belongs only to the separately reviewed release
build. This supports Worker-first routing without stale asset-service precedence.
