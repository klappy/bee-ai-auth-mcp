# Debrief — hosted Bee homepage

Problem: the homepage sent invitees to self-hosting and used single-user custody claims despite an existing invited-user allow-list.

Change: hosted endpoint, own-account prerequisites, platform guides, pairing, first question, privacy and help. Developer deployment remains secondary. No access, auth, runtime or deployment behavior changed.

Learning: client capability, service source behavior, and observed end-to-end retrieval are separate evidence. Disconnect is not proof of Bee credential revocation. Existing public-service gates remain documented.

Checks: local HTML IDs/links and clipboard success/failure behavior. Browser and authenticated end-to-end tests not run. Coordinator owns independent review, CI and exact-copy publication gate.
