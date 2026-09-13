# OAuth negotiation repair debrief — 2026-09-10

Declared product: minimal maintained-provider repair of a locally reproduced authentication negotiation failure. Existing auth amendment v1.0 independently accepted before package edits.

Observed cause: 0.7.2 ignored client offered alternatives, accepted private_key_jwt as a registration string, created a symmetric secret, then demanded that secret at token exchange. A preferred private-key method with an explicitly supported public alternative could not complete as a public client.

Borrowed upstream 0.10.3; no custom parser or new auth substrate. Actual Bee/native-provider synthetic end-to-end tests demonstrate public negotiation and valid S256/token/refresh while testing resource negatives, issuer metadata/redirect agreement, account isolation, legacy unbound grant shape and GitHub entry.

On-path cleanup: corrected dependency installer collateral before cargo. npm install initially refreshed unrelated optional/platform metadata and type packages; narrowed lockfile back to only root/provider entries, then ran fresh npm ci and complete checks. Prevention: exact dependency-diff comparison alongside clean-lockfile install; broad Dependabot bundle remains separate.

No quota branch edit, provider mutation, CIMD activation, live grant mutation, secret disclosure or production release. Verification boundaries are explicit in oauth-negotiation-repair-2026-09-10.md. Further live acceptance is not inferred from synthetic success.

Owner sequencing correction removed the unnecessary monthly-merge dependency. Reconstructed current main15d4deb6 with every tracked blob verified, transplanted only eight OAuth cargo files, and reran fresh install/typecheck/full suite: 207 passed/two existing skips. The first landing does not waive combined-tree revalidation for the later independent monthly merge.
