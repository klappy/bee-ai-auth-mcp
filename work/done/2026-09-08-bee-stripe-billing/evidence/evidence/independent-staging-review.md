# Independent staging preview review

Reviewer: /root/auggie_staging/review_staging. Observed 2026-09-09 18:58 EDT (22:58 UTC).

Disposition: ACCEPT bounded owner-only staging preview deployment and anonymous routing. Authenticated homepage rendering and real Bee onboarding remain unproven.

Independently reproduced exact transform from prior accepted module: SHA256 4a0be14b596068c32a6aab5f188abaa8ebcf4430721bd90af4d89cda7a651eee, 2,627,501 bytes. Fresh authenticated provider GET at 22:58:58.807Z confirmed these actual deployed module bytes. Active version 1c29a7a3-b0f3-441d-8089-8afddaf9bece; deployment 4abd6b3f-19ed-4ff4-abc2-2ee5d80f3e48; 100 percent. Ingress enabled; version previews disabled. Zero secret bindings, closed validation dates, original BeeBridge namespace 5b99701b01df4b2b886be69a0202a0e9, Logpush false.

Source review: only known embedded static GET/HEAD paths are served before the closed data gate. Existing JWT verifier checks Cloudflare issuer, signature and staging audience; no token fails closed. Static requests do not call DO/KV/Container. HTML replaces only the production origin with staging origin; customer wording is unchanged. Private/no-store, noindex and no-referrer headers apply. Five bounded routing tests independently rerun: five passed, zero failed. These tests are source tests, not hosted authenticated acceptance.

Fresh Access GET verified owner app 8fc54e03-24c8-4c02-9376-7c639a3ca94e has one email allow policy; protocol app f5c6bb74-2b83-441a-a316-08de4c68743a has one everyone bypass policy on eight declared protocol paths. Existing app 5ae63959-05d5-45a7-a9bd-237c271245c0 retains sole deny-everyone policy for /authorize/email. Owner admission applies only to preview, not Bee grant enrollment. No private identity values recorded here.

Independent anonymous HTTPS checks used the existing configured proxy with verified end-to-end TLS and no redirect following:

| Path | Actual response |
| --- | --- |
| / | 302 to klappy.cloudflareaccess.com |
| /index.html | 302 to klappy.cloudflareaccess.com |
| /mcp | 503, no redirect |
| /register | 503, no redirect |
| /token | 503, no redirect |
| /.well-known/oauth-authorization-server | 503, no redirect |
| /authorize | 503, no redirect |
| /authorize/email | 302 to klappy.cloudflareaccess.com |
| /pairing/start | 503, no redirect |

The email redirect demonstrates Access interception, not a successful email login or denial after identity submission. MCP and protocol paths reach the application's closed gate without an Access interstitial. No authenticated preview response was observed. Root separately reports the Cloud Browser URL-policy refusal; this review does not claim browser acceptance or circumvent that refusal.

Cloudflare's primary path documentation confirms more-specific application paths take precedence without parent inheritance: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/ . Actual Access records and HTTP behavior support the limited routing claim above.

Known limitations: this is a usable owner-protected staging entry link with the frozen homepage available behind owner login; it is not full production-like onboarding acceptance. Bee data window remains closed. No user grant, MCP data retrieval, two-user data isolation or production promotion accepted here.
