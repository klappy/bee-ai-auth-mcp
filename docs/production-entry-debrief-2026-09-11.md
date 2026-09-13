# Production entry source debrief — September 11, 2026

Observed: production selected the legacy entry, while hardened staging handlers
combined useful OAuth/signup behavior with validation expiry and GitHub denial.
Pointing production at staging would have broken existing users. Signup was also
used as a proxy for staging in runtime and telemetry paths.

Changed: extracted shared provider composition and storage RPCs; made entry/DO
runtime explicit. Preserved identity namespaces, GitHub allowlist and legacy
refresh, email epochs, storage keys, record/rate bounds and disabled numeric
policy. Added separate production admin binding names. Known frozen static routes preserve exact public asset bytes and exclude all
identity/protocol routes; approved copy materialization remains a release step.
Production configuration
selects the prepared entry only; no provider change or release was performed.

Validation: TypeScript passes; 267 tests passed, two live tests skipped. Native
MCP synthetic matrix uses real provider/SDK and no live Bee network. New production
regressions include legacy-issued grant/refresh and unchanged storage bounds;
existing email and real JWT admin regressions now run against both entries.
Initial full-suite failures exposed missing local fixture binaries/executable
bits and a test helper relying on provider mutation of the caller's env object.
Restored the exact frozen fixtures/modes and initialized the synthetic helper
through the legacy entry; no application checks were skipped or weakened.

Remaining: fresh independent source review, current-head CI/Bugbot, actual staging
readback, accepted production provider envelope and hosted consumer acceptance.
No self-service quantity, billing/referrals, homepage activation, production
promotion, grant migration or cleanup proof is claimed.

Learning bound to docs/production-entry.md and docs/ci-cd.md: deployment role is
explicit code policy, never inferred from a product feature flag. Source tests
must include the preserved old grant journey as well as the new email journey.

Independent review found staging-only preview links and bounded-window wording
in shared signup pages. Corrected links/status by runtime and added pending,
approved, denied, enrolled and admin production regressions. Staging instructions
remain unchanged; this is functional status copy, not a marketing redesign.
