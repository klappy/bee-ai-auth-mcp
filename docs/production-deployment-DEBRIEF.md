# Deployment source debrief — September 11, 2026

Cause: current production Build used an uncontrolled Wrangler deploy path and old external assets, which could not demonstrate grant/configuration preservation or the approved hosted homepage. This bounded source dish implements the accepted preservation contract without executing provider mutations.

Borrowed the proven staging uploader's version-only upload and secret inheritance, then added production prerequisite refusal, Worker-owned embedded assets, exact release-notice transformation, source stamping, drift checks and safe phase receipts. Twenty-nine focused deterministic tests pass locally and exercise refusal before writes, metadata/binding preservation, safe errors and deployed/readback-failed distinction. CI and fresh independent review remain required; this cook never merges.

Learning bound in docs/production-deployment.md: prerequisite acceptance, candidate upload, explicit deployment and actual readback are distinct states. A fail-closed unconfigured release script is reviewable source, not a live release. Existing second-identity and active-grant cleanup evidence remains owed separately.

Boarding disclosure: first local source read preceded completion of the full kitchen line check; subsequent live reads corrected the order. No provider call was made. Coordinator owns durable turn journal and lane state.

Independent review found three gaps before merge: candidate migration was verified too late, a failed deployment response could imply no effect incorrectly, and owner policy shape did not detect an identity edit before preflight. All three were corrected with targeted tests: predeploy lineage check (including independently observed undeployed migration-tag omission), reconciled/unknown deployment result, and private comparison against the existing accepted owner policy. No provider acceptance is claimed from these tests.

Fresh provider evidence invalidated the initial accepted source assumption before merge: config-only assets were omitted, and legacy settings reflected an undeployed candidate. The bounded amendment removes the external router explicitly and uses deployment-selected immutable version reads as active truth. Tests cover stale legacy projection, unexpected candidate router, and active-version drift. The failed custody candidate is never an active configuration base or deployment target. Source integration includes PR67 main before final CI.

Integration validation after completing the scratch checkout: TypeScript clean; 296 tests passed, two skipped. Initial local full-suite attempt failed because existing helper scripts were absent from the partial checkout; fetching/copying those unchanged files resolved the environment gap. This was not a product regression. Current-head CI and independent acceptance remain separate required evidence.
