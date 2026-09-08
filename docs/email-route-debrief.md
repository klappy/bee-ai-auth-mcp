# Email route correction — delivery debrief

Implementation head before this documentation commit: `93d15a28079ab3fcbb82248d4544c800a3fc6808`.

Spec-before-code: [routing amendment](https://github.com/klappy/kitchen/blob/main/rail/3-pass/2026-08-13-bee-relay-cf-access/BOTH-DOORS-ROUTING-AMENDMENT-2026-09-08.md), commit `2515367b0a855d5e71534b89b41f4e26ab090674`.

## Delivered behavior

- `/authorize` remains public. With both Access configuration values set, it presents email and direct GitHub links preserving the complete escaped OAuth query. Without Access configuration, the existing GitHub redirect remains.
- `/authorize/email` is the only Access-protected route. The Worker validates the OAuth request/client, Access JWT and private email allow-list. Missing or invalid proof returns 403, never a silent GitHub fallback.
- `/authorize/github` and `/callback` retain independent direct GitHub OAuth.
- Shared `/consent` and `/pairing/*` remain outside Access and retain signed, expiring state plus identity allow-list enforcement. MCP endpoints remain outside Access.
- Setup instructions require narrowing older broad Access applications and inspecting every enabled hostname. This documentation does not configure Access.

## Tests and source preservation

Nine regression cases added: configured chooser/query preservation; direct GitHub without assertion; missing email proof; unknown client on each of three authorization routes; tampered shared state on each of consent, pairing/start and pairing/status. Existing bad-signature and wrong-audience cases now assert fail-closed email behavior. Existing unconfigured GitHub regression, valid on/off-list email and shared namespace tests remain.

Runtime changes are confined to authorization routing. Existing shared consent/pairing and GitHub callback code were preserved. Setup retains the preceding private `ALLOWED_EMAILS` secret instructions; no invited address was added to tracked configuration. No signing fallback, new Bee client or credential provisioning was introduced.

## Actual verification and holds

Remote runtime, test and setup files were read back at the implementation head. Local `git diff --check` passed. Local test/typecheck execution was not performed: an earlier worker reported approval cancellation, which this worker did not retry; dependencies were absent in the inspected checkout. Existing CI and independent review must establish executable correctness on the final head, including this documentation commit.

Not claimed live: required secret presence, Access application/policy configuration, real browser email and direct GitHub flows, Bee pairing, MCP end-to-end behavior, and preview validation remain release holds. No Cloudflare calls, secret operations, merges or deployments were performed by this worker. Parent-owned preview investigation and release records stay in the [kitchen ticket cargo](https://github.com/klappy/kitchen/tree/main/rail/3-pass/2026-08-13-bee-relay-cf-access), rather than duplicated here. Public-facing copy remains draft pending approval.
