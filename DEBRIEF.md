# Debrief — hosted Bee homepage

Problem: the homepage sent invitees to self-hosting and used single-user custody claims despite an existing invited-user allow-list.

Change: hosted endpoint, own-account prerequisites, platform guides, pairing, first question, privacy and help. Developer deployment remains secondary. No access, auth, runtime or deployment behavior changed.

Learning: client capability, service source behavior, and observed end-to-end retrieval are separate evidence. Disconnect is not proof of Bee credential revocation. Existing public-service gates remain documented.

Checks: local HTML IDs/links and clipboard success/failure behavior. Browser and authenticated end-to-end tests not run. Coordinator owns independent review, CI and exact-copy publication gate.


## Approved-email homepage amendment — 2026-09-08

Draft copy now targets Klappy-approved email → inbox code → own Bee pairing. Invitees need no GitHub or Cloudflare account; optional existing GitHub login is retained. Eight copy/order files changed; no runtime, allow-list, secrets, dependencies, hosting or artwork changes. The developer self-host instructions remain the existing GitHub path, not an invitee prerequisite.

Remote readback matched all eight updated blobs exactly at cff261656c5bb9301945d41107995f006026efa8. Homepage duplicate-ID and internal-anchor checks passed; GitHub signup/prerequisite text absent. Clipboard script is byte-identical to the prior draft; its local success/unavailable-API mocks passed. No new browser/visual QA, authenticated E2E or preview success is claimed. Previous independent review is historical and does not approve this amendment.

Publication and brother testing remain held for auth PR34 release/E2E verification, refreshed homepage checks/independent review, working preview, and Klappy's exact-text public-copy approval. This is draft target-state copy, not evidence email auth is live.
