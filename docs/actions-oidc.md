# Actions OIDC machine door (draft; not deployed)

Existing unit: kitchen rail/6-learned/2026-09-01-bee-catch-light-it, reopened by AMENDMENT-2026-10-28.md. Continue relay PR43, then refinery PR21. No new machine door or raw Bee secret.

The verifier checks the GitHub signature, issuer, audience and expiry, then requires the literal subject `repo:klappy/refinery:ref:refs/heads/main`, repository `klappy/refinery`, ref `refs/heads/main`, and owner `klappy`. PR and PR-target events are rejected. The configured repository and operator allow-lists can disable this seat; adding another repository does not expand it. Denials log only a verified subject, never a JWT or grant.

Only GET /v1/changes and GET /v1/conversations/:id are exposed. Missing authentication returns 401; rejected identity returns 403 oidc_not_accepted. A valid identity without an encrypted captured-grant sidecar returns 403 no_captured_grant, without contacting Bee. Existing MCP grants do not populate that sidecar: the operator reconnects once after independently reviewed deployment. Do not create a raw token as a substitute.

Current main uses src/hosted.ts and the shared hosted handler, rather than src/index.ts alone. Both route machine reads through the same verifier. Staging retains its denial of GitHub identities; its email signup, bounded runtime, existing metadata and configuration stay unchanged. Only the explicitly enabled production operator klappy gets an actions sidecar at consent/pairing completion; other GitHub users and email users retain existing grant custody. Broker cleanup still runs after pairing completion. Production source configuration carries the exact repo and audience; it takes effect only through the separately reviewed release.

The existing OIDC workflow now follows current main's deployment contract: feature PRs run source tests without requesting id-token permission or assuming branch previews. Its existing manual live check accepts a full reviewed source SHA, checks the fixed production origin's non-empty exact /version before requesting OIDC, and runs only wrong-repository and missing-auth checks. The sole observed production Builds trigger cannot create the historical preview URL; no provider setting is changed. Never dispatch the live check as a substitute for release authorization. Passing source checks is not hosted acceptance.

Local signed synthetic-token tests cover the exact accepted seat and wrong repository/ref/subject/owner, PR contexts, issuer/audience/expiry/signature, missing required claims and disabled allow-lists. HTTP tests cover missing auth, rejected identity, read-only methods and missing sidecar. They prove code behavior, not live GitHub claims, capture or retrieval.

After independent review and protected deployment: operator reconnect; only then swap refinery authentication under its existing order. Run workflow_dispatch from main, retain run URL and sanitized relay subject evidence, observe an Action-authored durable source commit, then retrieve that exact captured source using the established retrieval surface. A subsequent tape must land within the existing cron window. No source text or credentials belong in the receipt.


## 2026-10-28 history-preserving reconciliation

Merged main 59bf6923013087a7bcf999ebbbf82ae1e95016fd into the existing PR43 branch, preserving its prior head 978fde56679e69f158b76def7b91a2b70213aef5. Resolved only the three text conflicts (consent completion, generated version default, staging config), then repaired machine-route and consent integration with the current hosted architecture. Current main's OAuth dependency and native runtime tests are retained.

Refinery PR25 remains read-only in this cook. Its cursor v1-1789216169063 is older than current refinery main's v1-1790684626248, and the PR patch itself rolls back its original base checkpoint. Do not merge it unchanged or reseed PR21 from it. After relay release, the cursor owner must reconcile that stale proposal against the newest recorded main checkpoint and source-capture provenance; PR21 auth work should retain the authoritative main cursor until that owner settles it. No cursor or source blob was changed here.
