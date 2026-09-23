# Independent hosted help probe and cleanup review

Reviewer `/root/auggie_resume/review_hosted`, separate from implementation author Otto. Final independent provider readback: 2026-09-09T17:28:23.182Z. No implementation or provider mutation performed by reviewer.

## Verdict

ACCEPTED for the bounded real hosted CLI help / invalid broker ID probe, including current cleanup. This is not hosted onboarding acceptance.

The actual safe runtime receipt reports HTTP 200, status complete, `beeHelp: true`, `brokerRejectsInvalidId: true`, and `destroyed: true`. Missing secret, wrong secret, authenticated GET, homepage GET and MCP POST each returned 503 without redirect before the runtime call. The replay returned 503, status closed. Local custody cleanup reported true and the reviewer independently verified that the ephemeral private-key and ciphertext-envelope files are absent.

The tested version was `2bda5b4f-7ec5-411a-887e-06f018068113`, deployment `aa2a6f7f-12af-441d-b1de-e8fc410afee9`, with window 2026-09-09T17:25:05.541Z through 17:30:05.541Z. Independent provider GET confirmed its exact module: 2,629,419 bytes, SHA256 `541413ce0e278571ed8fb47b62f0077090d1cfd5852030e3fc8bff38ac2974fe`, with general validation closed.

The source review confirmed a secret-only POST, maximum five-minute window, transactional one-attempt reservation, persisted scheduled destroy before startup, literal real Bee `--help` execution and broker invalid-ID execution, boolean-only output, and final Container destroy. RSA-OAEP plus AES-GCM kept the secret within trusted tooling; the local caller used one fixed destination, verified TLS, no redirects and a mode-0600 ephemeral private key. No identity, grant, Bee content or login approval was involved.

Four pre-execution findings were resolved before activation: use one timestamp for the exact window; withhold potentially sensitive provider error text after secret issuance; require all negative 503/no-redirect checks before execution; and verify runtime state during cleanup instead of claiming cleanup from deployment rollback alone.

## Current cleanup independently accepted

The first cleanup restored the closed old version and disabled ingress, but latest script settings still described the most recently uploaded probe version, and the active-filter instance endpoint included an inactive record. Its historical `accepted: false` receipt remains valid as the then-observed guard result; it is not rewritten.

A clean clone reconciled active and latest metadata. Final independent readback:

| Check | Observed |
| --- | --- |
| Active version | f7a09836-7fad-469e-8c5f-bb23dea704a9 at 100 percent |
| Deployment | d5778d43-2b66-4ae9-9a5e-3b4f6446cf8f |
| Current secret binding names | none |
| Current VALIDATION_PROBE_* bindings | none |
| General validation dates | empty |
| Subdomain / previews | false / false |
| Worker observability / logs / traces / Logpush | all disabled |
| Complete instance listing | one inactive logical record; no continuation token |
| Instance | 96cbd5709a7efb3ef2dde4eaf1adb22236bff9314cb007491a8bad1fc32084f1 |
| Inactive status timestamp | 2026-09-09T17:25:49Z |

The exact accepted image remains associated. No running, provisioning or stopping instance was observed. The retained inactive logical record is not a running Container and does not need deletion to claim runtime cleanup. Previously recorded inactive logging defaults remain unchanged.

Historical immutable probe version metadata is not erased. Current bindings are absent, ingress is closed and the single-use reservation is consumed; its original window also ends at the stated expiry. This review makes no historical-secret-erasure claim.

## Scope remaining

This proves hosted execution of the pinned real CLI help path and invalid broker-ID rejection, with bounded negative gates and cleanup. It does not prove real broker login/pending/resume/clear, OTP, approved private test identities, Bee approval, own-grant retrieval, cross-user rejection, MCP retrieval, public-copy approval, production promotion or Stripe. Any next broker lifecycle probe has its own concrete source/envelope review and outcome; this help attempt is not repeated or relabeled as that broader result.
