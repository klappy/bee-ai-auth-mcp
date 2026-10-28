# Actions OIDC machine door (draft; not deployed)

Existing unit: kitchen rail/6-learned/2026-09-01-bee-catch-light-it, reopened by AMENDMENT-2026-10-28.md. Continue relay PR43, then refinery PR21. No new machine door or raw Bee secret.

The verifier checks the GitHub signature, issuer, audience and expiry, then requires the literal subject `repo:klappy/refinery:ref:refs/heads/main`, repository `klappy/refinery`, ref `refs/heads/main`, and owner `klappy`. PR and PR-target events are rejected. The configured repository and operator allow-lists can disable this seat; adding another repository does not expand it. Denials log only a verified subject, never a JWT or grant.

Only GET /v1/changes and GET /v1/conversations/:id are exposed. Missing authentication returns 401; rejected identity returns 403 oidc_not_accepted. A valid identity without an encrypted captured-grant sidecar returns 403 no_captured_grant, without contacting Bee. Existing MCP grants do not populate that sidecar: the operator reconnects once after independently reviewed deployment. Do not create a raw token as a substitute.

The existing preview workflow now requires a non-empty exact /version SHA, never an empty prefix match. It is a wrong-repository live check, not a successful refinery round-trip. A production-only Builds trigger cannot create the historical branch preview; preview deployment/CI alignment remains an owner gate, not permission to change provider settings.

Local signed synthetic-token tests cover the exact accepted seat and wrong repository/ref/subject/owner, PR contexts, issuer/audience/expiry/signature, missing required claims and disabled allow-lists. HTTP tests cover missing auth, rejected identity, read-only methods and missing sidecar. They prove code behavior, not live GitHub claims, capture or retrieval.

After independent review and protected deployment: operator reconnect; only then swap refinery authentication under its existing order. Run workflow_dispatch from main, retain run URL and sanitized relay subject evidence, observe an Action-authored durable source commit, then retrieve that exact captured source using the established retrieval surface. A subsequent tape must land within the existing cron window. No source text or credentials belong in the receipt.
