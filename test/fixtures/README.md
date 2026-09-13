# Portable test fixtures

`frozen-assets.json` preserves the sixteen expected SHA-256 hashes and sizes from the accepted homepage asset manifest. It deliberately excludes historical runtime/deployment observations. The asset tests compare the actual embedded response both with these frozen expectations and the checked-in `public/` bytes; the fixture is not regenerated during a test.

## 2026-09-10 CI portability repair

PR CI exposed two hidden workspace dependencies: the asset test read an untracked `RUNTIME-MANIFEST.json`, and the staging verifier regression evaluated `../../transform-staging.js` outside the repository. A passing test run in the recovery workspace did not prove a clean checkout could run the suite.

The asset fixture is now repository-local and resolved relative to the test module. The verifier regression now calls the actual current staging entry and real JOSE verifier, without the historical transform. Current preview behavior is 403 without valid Access configuration/identity and 200 with a valid JWT; the current public MCP challenge is 401 and authorization metadata is 200 even while the Bee runtime is closed. These replace the historical transform's obsolete 503 expectations without weakening the negative identity checks.

Verification reconstructed the current main source/test/public files plus the integration and follow-up file sets and this repair in a fresh `/tmp` directory. Only installed dependencies were linked; no historical manifest or external transform was present. The previously omitted main-branch utterance pager source/test were fetched and included. Typecheck passed; **196 tests passed, 2 skipped**, 21 test files passed and 1 skipped. An initial reconstruction run lost shell executable modes during file copying; preserving/restoring the repository's shell modes resolved those fixture-construction failures. Missing historical documentation was not needed by the code/test run; independent exact-checkout CI remains the final portability receipt.

No application behavior, deployment settings or test skips were changed. Learning: validate the committed file set in isolation, not merely a long-lived recovery workspace.
