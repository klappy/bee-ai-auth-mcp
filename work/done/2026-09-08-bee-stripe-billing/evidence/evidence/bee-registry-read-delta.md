# Registry collision/readback delta — exact review scope

Supplement to image packet e3dcc5aa4354c10f923c547b73d89ba0a9bc40a93a7871ab26d0ef1f633cfaee. No credential generated and no mutation yet. Need one tag collision check before image push and exact digest readback after.

Schema observed: POST `/accounts/{account_id}/containers/registries/registry.cloudflare.com/credentials` with `{"expiration_minutes":1,"permissions":["pull"]}`. Positive1minute minimum; only pull/push/list enum, NO repository scope field. This is account-managed-registry pull capability for one minute, not provider-enforced one-tag scope. Consumption is restricted by our exact code to one HEAD, but do not describe credential itself as repository-scoped. No account API-token creation, stored external-registry secret, subscription or list permission. If reviewer does not accept this temporary transport capability, do not mint it or invent another credential path.

Same trusted Cloudflare execute call requests credential and performs exactly:

`HEAD https://registry.cloudflare.com/v2/{accountId}/bee-validation-20260909/manifests/ea68e53edb8e`

Locked Wrangler4.100.0 constructs Basic authorization from literal username `v1` and returned `credentials.password`. `fetch` is available in the same Cloudflare runtime. Header Accept: `application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json`. Never return credential/body/headers/exception. Return status and Docker-Content-Digest only (validate sha256 pattern); disable redirects to prevent forwarding Authorization. 404 means tag absent only after successful credential response; 401/403/transport error is not absence. A existing tag halts without overwrite.

No deletion authorized by this read delta. Later own-tag DELETE requires short-lived push credential with the same accountwide-provider-scope caveat and fresh applicable technical disposition. Never invoke `wrangler containers images delete` blindly: locked source performs global `PUT /v2/gc/layers` after tag deletion. Global GC is excluded. Tag deletion is not proof of physical blob erasure.

Cost reasoning: official image-management docs say managed registry is R2-backed, but do not state a separate managed-registry retention rate. Official R2 standard is $0.015/GB-month; treating even the entire20GB provider-build disk limit as retained image for one month gives $0.30 storage benchmark, not a verified managed-registry tariff. One20minute build at $0.005/minute is $0.10. No Container runtime, Access seat, new subscription or other service in this stage. The benchmark plus large remainder of settled$5 makes one image attempt reasonably small; do not present the benchmark as a hard bill cap. If actual provider response introduces another paid service or retention cannot be responsibly bounded, stop before build. Postbuild manifest/layer sizes and actual retained artifact must be accounted; no global GC to force proof.

Sources: current Cloudflare credential schema; locked Wrangler src/containers/images.ts; https://developers.cloudflare.com/containers/guides/image-management/ ; https://developers.cloudflare.com/r2/pricing/ ; https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/ . No ordinary chat secrets or private test identities involved.
