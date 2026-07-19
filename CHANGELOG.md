# Changelog

## 0.2.0 — 2026-07-19

- **Device-aware consent CTA.** The consent screen now adapts to the device it renders on: mobile leads with a tap-to-approve deep link ("Open in the Bee app"), with the QR collapsed behind an "Or scan a QR code" toggle; desktop keeps the QR as the primary action. Stale pairing actions (a dead approve link / connect URL / QR from an expired or failed attempt) are now cleared immediately on retry instead of lingering until the next pairing code loads.
- **Copyable connect URL.** Both device variants show a copyable connect URL (`https://bee.computer/connect#<requestId>`) for manual entry into the Bee app's "Enter Bee ID" field, alongside the existing raw-token paste fallback.
- **Pairing nested-token fix.** The pairing-completion parser now also accepts the Bee token nested under `result.encryptedToken`, in addition to the original top-level `encryptedToken` shape.
- **Sanitized shape diagnostics.** When the pairing service returns an unrecognized response shape, the error/log message now includes a redacted, truncated description of that shape (token/secret/key-like fields replaced with `<redacted:N>`) instead of a bare "unexpected shape" string, so failures are self-diagnosing without ever leaking secret material.

## 0.1.0

- Initial Phase 1 (auth core + private-CA bridge) and Phase 2 (read surface: `bee_docs` + `bee_read`) release.
