# Independent PR test portability repair

Reviewer /root/auggie_oauth_finish/reviewer. Scoped PASS for test portability repair, independently rerun September10,2026 at09:53 EDT in /tmp/bee-ci-portability-0g00jvhq. npm run typecheck and npm test both exit0:196tests passed,2skipped;21test files passed and one skipped. The extra six tests relative to the prior190-test scratch suite are existing main pager coverage retained in this reconstructed tree.

Exact reviewed files:

- test/embedded-assets.test.ts SHA256fcab285dabebfcf47431e5f6270d1709951d74faafb56531d4a9d93c51d445fd
- test/staging-access-regression.test.ts SHA2569628702ec4fc366aa9c5ff729fdd4bf6675bd27527c16215454829b8a3c1b2a4
- test/fixtures/frozen-assets.json SHA2569c78e7aa91c03564af62b5a001413114e4ec95ad726c7d71fda34bc0164da6ea

Embedded assets tests now load a committed frozen hash fixture, compare bytes against the repository public assets and assert MIME/HEAD/normalization/cache semantics. Current staging access regression imports actual src/staging.ts, uses real JOSE verification with synthetic test keys, and tests issuer failure403, correct signed preview200, malformed/wrong-audience/wrong-issuer/signature rejection403, MCP401 challenge and metadata200. It no longer depends on the external historical transform helper or an absent RUNTIME-MANIFEST.json. No coverage was skipped to hide the defect.

Source files were not modified by this portability repair. The temporary test tree shares only installed node_modules with the existing workspace; executable shell script modes remain required in Git. The returned fixtures/README.md debrief is not present in this temporary subset, so this result is not a claim of byte-complete final PR checkout equivalence. Actual final-head GitHub CI must pass before main merge. The two skipped live smoke tests are not hosted acceptance.
