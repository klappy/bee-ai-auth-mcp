# Independent private auth-trial guard review

Reviewer `/root/auggie_resume/review_hosted`, separate from implementation author Otto. Final independent provider observation: 2026-09-09T17:40:48.121Z. Reviewer authored no implementation and performed no provider mutation.

## Disposition

ACCEPTED as exact isolated-only route privacy code, passing local checks, and a closed deployment. NOT an accepted or activated human auth trial. No identity has been admitted by this change.

The exact built module diff removes all prior private-probe functions, method and route; adds a strict path/method allowlist; redirects GET /authorize with an empty-body 307 to /authorize/email while retaining the complete query; removes the embedded-asset fallback; and converts downstream error HTML to generic 503. Product OAuth, Access JWT, email allowlist, signed consent/pairing, broker and asset data bytes are unchanged.

Homepages, static files, setup/security/roadmap, unknown paths, GitHub authorization/callback paths and unsupported methods remain 503 even inside an otherwise active general validation window. Only exact MCP/register/token/discovery and email/signed-consent/pairing paths can reach existing handlers. The code itself introduces no Access interstitial for MCP/register/token. The email handler still requires verified Access JWT and the configured allowlist; consent/pairing retain existing signature and identity checks. The general window/signing-secret guard remains before any downstream work.

## Independent local checks

- Standalone route tests independently rerun: four passed, covering more than forty route/method/query cases.
- Full recovered-source suite independently rerun: 160 passed, two skipped; 15 test files passed, one skipped. No skipped test is represented as passed.
- TypeScript `tsc --noEmit` independently rerun: exit 0.
- Exact generated diff and upload transform reviewed against accepted broker module SHA256 `cf2b490e3b163e58cdf6f264762f722eda92725e0ebb89d7c49858da19cbdb13`.

### Test changes reviewed, not waived

The combined-assets test's former homepage-200 expectation intentionally becomes homepage-503, with assertions that neither the real handler nor quota/storage was called. Protocol tests now use their valid HTTP methods and retain 404 passthrough; MCP 401 remains asserted. A new malformed-auth HTML test checks generic 503 without private copy. These align assertions with the requested privacy behavior rather than removing a failing product requirement.

The embedded-assets test changes only vanished historical scratch paths to local `RUNTIME-MANIFEST.json` and `public/` fixtures. Exact bytes, SHA256, length, MIME, HEAD parity, aliases, unknown-path 404 and conditional caching assertions remain. The reviewer verified the local manifest SHA256 `1a1693da4b4c398e843c333de20cb071b4705d2a36a12e55b36de219d2e652d7` equals the frozen reconstruction's expected hash. Full-suite execution checks all sixteen frozen assets against that unchanged manifest. No softened asset assertions conceal a change.

## Actual closed deployment

Independent provider GETs verified:

| Field | Observed |
| --- | --- |
| Active version | b0157fe8-a329-40f3-8104-f239a1dc99c0 at 100 percent |
| Deployment | 14bbf45f-71ee-43a4-acda-de46f62596b1 |
| Module bytes | 2,626,182 |
| Module SHA256 | 68d50e7cc1d3421a1656cfe076115dd64d37eca584192721fd4f8c6255e08fab |
| Private probe route in actual module | absent |
| Current secret bindings | none |
| General validation window | closed / empty dates |
| Subdomain / previews | disabled / disabled |
| Worker observability / logs / traces / Logpush | disabled |

The accepted closed-upload helper pins the exact previous/current code, preserves the isolated namespace and bindings, creates an undeployed version, reads exact bytes back, then explicitly deploys only the isolated Worker with closed-ingress/privacy/production-preservation checks. Existing inactive privacy defaults are not represented as changed.

## Remaining gate

The guard is locally verified and deployed closed; no live active-window HTTP trial has tested it yet. A future first-test identity still needs explicit approval and trusted-tool custody. Provider GET/user email availability is capability evidence, not identity authorization. No OTP, denied-email trial, real Bee approval, grant capture, own-grant retrieval, cross-user grant rejection or completed MCP consumer journey follows from this code acceptance. Public-copy publication and production promotion remain separate gates.
