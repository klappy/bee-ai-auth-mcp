# Changelog

## 0.3.0 — 2026-08-29

- **The email door (Cloudflare Access), beside GitHub — never replacing it.** `/authorize` now validates a `Cf-Access-Jwt-Assertion` server-side (jose: `jwtVerify` + `createRemoteJWKSet` against the team's published certs, issuer + AUD pinned — Cloudflare's own Workers reference pattern). A valid assertion whose email is on `ALLOWED_EMAILS` goes straight to the consent screen; a valid identity that is off-list is denied loudly (403) before any consent renders; an absent or invalid assertion falls through to the GitHub redirect unchanged. New vars: `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ALLOWED_EMAILS` — all empty = door off, prior behavior exact. `/callback` and the GitHub OAuth leg are untouched; existing GitHub-login grants keep working with no reconnect (emails contain `@`, GitHub logins cannot — disjoint namespaces by construction).
- **`CONSENT_SIGNING_SECRET` (new REQUIRED secret).** The consent-state HMAC and the sealed pairing state rekey from `GITHUB_CLIENT_SECRET` to a dedicated secret; the GitHub client secret returns to single-use (OAuth code exchange only). Hard switch: consent/pairing states live minutes; an in-flight round-trip at deploy moment restarts. (`deriveTenantKey` in telemetry deliberately stays on the old anchor — rekeying it would rotate every historical tenant key.)
- **Hard rail preserved:** `/register`, `/token`, `/mcp` are never behind Access; the setup guide's new Zero Trust section scopes the Access app to `/authorize`, `/consent`, `/pairing/*`, `/setup` only, with One-Time PIN + optional GitHub-federated login steps.

## 0.2.0 — 2026-07-19

- **Device-aware consent CTA.** The consent screen now adapts to the device it renders on: mobile leads with a tap-to-approve deep link ("Open in the Bee app"), with the QR collapsed behind an "Or scan a QR code" toggle; desktop keeps the QR as the primary action. Stale pairing actions (a dead approve link / connect URL / QR from an expired or failed attempt) are now cleared immediately on retry instead of lingering until the next pairing code loads.
- **Copyable connect URL.** Both device variants show a copyable connect URL (`https://bee.computer/connect#<requestId>`) for manual entry into the Bee app's "Enter Bee ID" field, alongside the existing raw-token paste fallback.
- **Pairing nested-token fix.** The pairing-completion parser now also accepts the Bee token nested under `result.encryptedToken`, in addition to the original top-level `encryptedToken` shape.
- **Sanitized shape diagnostics.** When the pairing service returns an unrecognized response shape, the error/log message now includes a redacted, truncated description of that shape (token/secret/key-like fields replaced with `<redacted:N>`) instead of a bare "unexpected shape" string, so failures are self-diagnosing without ever leaking secret material.

## 0.1.0

- Initial Phase 1 (auth core + private-CA bridge) and Phase 2 (read surface: `bee_docs` + `bee_read`) release.
