# Staging admin approval repair — 2026-09-10

Ticket: `klappy/kitchen/rail/3-pass/2026-08-13-bee-relay-cf-access/`.
Authority: `SIGNUP-OAUTH-AMENDMENT-2026-09-10.md` v1.0. Source cook implements; Auggie coordinates; Otto owns deployment; independent reviewer accepts or rejects.

## Failure and correction

The owner reported an invalid response when approving signup requests. The admin HTML inherited `Referrer-Policy: no-referrer`, while its POST handler required the staging Origin. Fetch Standard §3.2 explicitly serializes Origin as `null` for a navigation POST under that policy. The valid rendered form could therefore fail its own CSRF check. This source incompatibility is established; the exact headers of the owner's request were not captured.

Only the admin list document now uses `Referrer-Policy: same-origin`. Same-origin form navigation retains its Origin; cross-origin referrer disclosure remains suppressed. The exact-origin check, owner audience and verified identity requirements are unchanged. Other private pages retain `no-referrer`.

A separate reproducible issue reset all action nonces on every list load, invalidating forms in another tab. Current, unexpired actions are now reused, at most two per signup record for the owner. Each action binds target, decision and current approval epoch. A stale opposite decision cannot overwrite a newer decision. Tokens remain expiring and single use; expired and legacy tokens without an epoch fail closed and require a fresh list.

Specification: https://fetch.spec.whatwg.org/#append-a-request-origin-header

## Validation

TypeScript typecheck passed. Full Vitest suite: **190 passed, 2 skipped**, 20 files passed and 1 skipped. Three new integration cases execute the staging entry, actual JOSE signature/issuer/audience verification, rendered form extraction, and BeeBridge admission transaction against cloned in-memory storage:

- A correct rendered form approves; null Origin remains rejected; replay is rejected.
- Another list load preserves an open action; stale opposite action is rejected; a fresh denial succeeds.
- Wrong audience, cross-origin/missing Origin and target substitution cannot approve a record.

The suite does not drive an actual browser or hosted Cloudflare Access session. It does not prove the owner's retry, real Bee authorization, ChatGPT installation or authenticated hosted MCP retrieval. Independent review and deployment readback remain separate delivery evidence.

OAuth metadata source inspection found native authorization-server metadata, protected-resource metadata, and the `/mcp` 401 resource challenge already implemented outside the runtime/signing gate. This repair makes no speculative OAuth protocol changes. Current network behavior and the user's client acceptance must determine whether the separately reported discovery error remains.

## Learning

Test a form from the HTML and response policy that the application actually returns. Handcrafted POSTs with an explicitly correct Origin miss browser policy failures. Stateful admin tests must also cover a second list load and stale opposite actions.

No provider configuration, production release, product push or public marketing copy was changed by this source task. Deployment and durable Git receipt belong to the delivery coordinator.
