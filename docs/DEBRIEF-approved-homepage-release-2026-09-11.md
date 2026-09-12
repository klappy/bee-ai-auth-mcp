# Approved homepage packaging debrief

September 11, 2026, America/New_York. [Order](../orders/2026-09-11-approved-homepage-release.md).
Klappy accepted the visual page and exact copy. Its previous isolated template
could not be selected as a production asset without maintaining a second copy.

The approved HTML now lives in one data-only module. Protected preview imports
it with unchanged authentication and rewriting. A separate, explicit materializer
uses existing esbuild to emit a fresh external asset directory and an HTML digest.
It refuses existing destinations and locations inside the source repository.
Other public assets are copied unchanged. No automatic build/deploy invocation,
provider mutation, production asset change or commercial activation occurs here.

The extracted HTML equals the original runtime string byte for byte: 10,910 bytes,
SHA256 9289c8194ea3240790eb28a7ae74c1f8f2d93003959fd1aa2bc294875f97bdbc.
The exact-copy regression test is pinned to that approved original, not a second
editable template. Artifact tests verify unchanged public files, copied assets,
exact index content and refusal to overwrite an existing destination. The first
local test caught a Node copy-to-existing-directory error; copying individual
assets into the newly reserved output corrected it before submission.

TypeScript and eight focused tests pass. Existing browser/clipboard evidence is
preserved; no new browser or hosted journey PASS is claimed. Current-head CI,
Bugbot, independent review, actual staging readback and accepted production
configuration remain separate evidence gates. The review notice stays visible
because free use and paid upgrades are still disabled.

Learning: share the exact reviewed page between consumers and verify its bytes.
Packaging an asset is not publishing it; keep configuration selection explicit.
