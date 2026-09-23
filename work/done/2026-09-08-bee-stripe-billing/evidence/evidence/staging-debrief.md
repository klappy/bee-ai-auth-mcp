# Bee owner staging preview — bounded return

The prior validation wrapper made every homepage route unavailable even after the real CLI and pending-state probes passed. The owner's request for production-like staging is implemented as protected static routing on the existing isolated Worker. It does not depend on admitting a Bee identity or opening a data window.

Exact module SHA256: `4a0be14b596068c32a6aab5f188abaa8ebcf4430721bd90af4d89cda7a651eee`. Active version `1c29a7a3-b0f3-441d-8089-8afddaf9bece`; deployment `4abd6b3f-19ed-4ff4-abc2-2ee5d80f3e48`. Five targeted routing tests passed. Independent final provider/HTTP outcome is a separate receipt.

The embedded asset corpus remains unchanged. For HTML responses only, the exact production origin `https://bee.klappy.dev` is replaced by the staging request origin so the copy-MCP URL and environment links cannot accidentally target production. All customer wording remains intact. Known static GET/HEAD paths require a verified Cloudflare Access JWT with the separate preview audience, before any data-plane or Container call. Preview responses are private/no-store and noindex.

Owner preview admission was authorized through Astra's interpretation of the explicit request to see staging. The connected Cloudflare account email moved only inside trusted provider tooling into one owner-only Access policy; no address entered model context, files or Git. A separate exact-host protocol-path bypass preserves transport without an Access interstitial. The original more-specific email-login deny policy was preserved. No Bee identity or grant was admitted.

Break-glass continuation: production Builds applies to every product branch and the isolated Builds route previously failed. The existing approved isolated-validation direct-version mechanism was reused to avoid any production deploy. Upload did not deploy; the first binding comparison stopped because Cloudflare sorted its response. Per-name full binding comparison proved all original values unchanged plus one non-secret preview audience, then the same candidate was explicitly deployed and read back. Ingress was enabled last, with preview URLs disabled. No production settings, product pushes, new subscriptions, image rebuilds or new Containers were performed.

The cumulative five-dollar isolated allowance remains a ceiling, not a provider cap. This static preview does not invoke the Container; paid data-plane activation remains closed. No new cost allowance is implied.

Remaining onboarding evidence is unchanged: actual user email OTP, Bee approval, own-grant MCP retrieval, two-user grant/data negatives, authenticated cleanup/privacy and full hosted acceptance. The owner's homepage taste and separate production/copy release gates remain. This return is not onboarding closure or Stripe authorization.

Learning: staging UI availability must be independent of expensive authenticated data-plane trial windows. Keep static owner review protected and available, while controlling real-data test admission separately.
