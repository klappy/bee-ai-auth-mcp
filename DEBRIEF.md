# Debrief — hosted Bee homepage

Problem: the homepage sent invitees to self-hosting and used single-user custody claims despite an existing invited-user allow-list.

Change: hosted endpoint, own-account prerequisites, platform guides, pairing, first question, privacy and help. Developer deployment remains secondary. No access, auth, runtime or deployment behavior changed.

Learning: client capability, service source behavior, and observed end-to-end retrieval are separate evidence. Disconnect is not proof of Bee credential revocation. Existing public-service gates remain documented.

Checks: local HTML IDs/links and clipboard success/failure behavior. Browser and authenticated end-to-end tests not run. Coordinator owns independent review, CI and exact-copy publication gate.


## Approved-email homepage amendment — 2026-09-08

Draft copy now targets Klappy-approved email → inbox code → own Bee pairing. Invitees need no GitHub or Cloudflare account; optional existing GitHub login is retained. Eight copy/order files changed; no runtime, allow-list, secrets, dependencies, hosting or artwork changes. The developer self-host instructions remain the existing GitHub path, not an invitee prerequisite.

Remote readback matched all eight updated blobs exactly at cff261656c5bb9301945d41107995f006026efa8. Homepage duplicate-ID and internal-anchor checks passed; GitHub signup/prerequisite text absent. Clipboard script is byte-identical to the prior draft; its local success/unavailable-API mocks passed. No new browser/visual QA, authenticated E2E or preview success is claimed. Previous independent review is historical and does not approve this amendment.

Publication and brother testing remain held for auth PR34 release/E2E verification, refreshed homepage checks/independent review, working preview, and Klappy's exact-text public-copy approval. This is draft target-state copy, not evidence email auth is live.

## Hosted CLI-broker copy amendment — 2026-09-08

Draft invitee copy now matches the bound auth architecture in kitchen `CLI-BROKER-AMENDMENT-2026-09-08.md` at `2c4d263e7b8f448c2d28b698a66d05ffb2258be9`: Klappy approves the email; invitee signs in with inbox OTP; the hosted service runs the real Bee CLI; the invitee clicks or scans the CLI-generated approval link or QR; the hosted service finishes the connection. Invitees do not install or run the CLI. Existing GitHub login stays optional.

Removed wording that the Worker merely uses or impersonates the Bee CLI pairing registration as the hosted invitee explanation. Current `src/pairing.ts` handshake is unchanged and remains the shipped pairing on this branch. Auth checkpoint `EXECUTION-CHECKPOINT-2026-09-08.md` at kitchen `875bf92164961168b23a46bb2e066b95b4186e19` still records PR34 unmerged, no broker commit claimed, and Cloudflare config/E2E remaining.

This draft is not live readiness. No runtime, allow-list, secrets, dependencies, hosting or artwork changes. Prior independent review is historical and does not approve this amendment.

Checks observed this amendment: homepage unique IDs and internal anchors passed; pairing-registration impersonation phrasing absent from the homepage; GitHub signup/prerequisite absent (optional GitHub remains). Clipboard script unchanged; local success and unavailable-API fallback mocks passed. `npm run typecheck` passed. `npm test`: 49 passed, 2 skipped. No browser/visual QA, authenticated E2E, or preview success claimed.

## Commercial-framing homepage amendment — 2026-09-08

Captain approved the current invitee text direction and asked for a plans ladder on this same draft. Added Free trial, Standard — Auth Relay, and Future value-added services. Standard is cost-recovery for the hosted authentication relay only; no price was invented. Later tools are named as separate and unpromised. Approved pairing copy, MCP URL, Klappy naming, and the release hold are unchanged. No runtime, auth, allow-list, secrets, dependencies, hosting or artwork changes.

Checks observed this amendment: homepage unique IDs (including `#plans`) and internal anchors passed; no invented dollar/period price on the homepage; clipboard success/fallback mocks passed; `npm run typecheck` passed; `npm test`: 49 passed, 2 skipped. No browser/visual QA, authenticated E2E, or live-readiness claimed.

## Standard purchase options — 2026-09-08

Current bound Auth Relay purchase options: $5/month; $24/year ($2/month equivalent); $100 lifetime one-time. Same service, not feature tiers. Free trial remains above; future value-added services remain separate and unpriced. Earlier option-2 wording was superseded and removed from current review copy. Auto-renewal, lifetime-transfer, taxes, refunds, and processor remain unspecified. Release hold unchanged.

Checks: unique IDs/internal anchors passed; current three prices present; superseded option-2 wording absent from homepage, review, order, and debrief; clipboard mocks passed; `npm run typecheck` passed; `npm test` 49 passed, 2 skipped. No browser/E2E/live-readiness claimed.

## Standard positioning — 2026-09-08

Captain refined Standard: it is not frozen as a bare relay forever. Initial promise stays the hosted authentication relay. Copy now says Standard can take on useful Bee-API improvements as they are built, and does not claim those extras exist yet. A higher paid plan may be added later if value or operating cost rises materially; no extra tier name, feature list, or price was invented. Current prices unchanged. Release hold unchanged.

Checks: unique IDs/internal anchors passed; current prices unchanged; no unbuilt-feature claim; clipboard mocks passed; `npm run typecheck` passed; `npm test` 49 passed, 2 skipped. No browser/E2E/live-readiness claimed.

## Coming exploration — Talk → knowledge base — 2026-09-08

Captain recorded a future-value example: with permission, later work could distill Bee transcripts into a user-owned GitHub knowledge base / second brain. Desired feel: you talk; conversation becomes durable, structured, AI-readable knowledge. Homepage copy labels this Coming exploration and states it is not built. Current relay is not claimed to ingest transcripts in the background, write to GitHub, graph knowledge, or persist a second brain. The example may later land on Standard or on a higher paid plan if processing, storage, or automation is much larger; no extra plan was named or priced. Prices and release hold unchanged.

Checks: unique IDs/internal anchors passed (including `#talk-kb`); current prices unchanged; coming-exploration label present; current-relay implementation claims absent; clipboard mocks passed; `npm run typecheck` passed; `npm test` 49 passed, 2 skipped. No browser/E2E/live-readiness claimed.

## Homepage validation + CI honesty — 2026-09-09

Receiver: existing PR50 writer `bc-538adc5a-d294-493d-828c-d4e29527f8b2`. Cook-order: kitchen `rail/meals/2026-09-08-bee-stripe-billing/COOK-ORDER-2026-09-08.md` on kitchen `2afc5f01871367323898258166f944bc6c2d32fa`. Ticket: `rail/3-pass/2026-09-08-bee-hosted-homepage/TICKET.md`. Return also belongs on meal issue #51.

Local browser (not hosted auth E2E), serving `public/` at `http://127.0.0.1:4173/`:
- Desktop hero and `#plans` observed; prices `$5/month`, `$24/year — $2/month equivalent`, `$100 lifetime — one-time`; Coming exploration labeled not built.
- Copy URL success status: `Copied. Paste this URL into your AI app.`
- Nav anchors `#connect`, `#plans`, `#help` jumped.
- ChatGPT and Grok details opened; official guide links present.
- Keyboard tab/focus visible; skip link `href="#main"` present in DOM.
- Narrow ~400x924 hero and plans readable; URL field + Copy URL usable.
- Raw `python -m http.server` returned 404 for `/security` and `/setup` (no extensionless HTML map). Session-only pretty-URL mapper on `:4174` returned 200 for `/`, `/security`, `/setup`, `/roadmap`. Homepage hrefs were not changed.
- Denied-clipboard fallback not re-run in the browser this pass. Hosted email OTP, Bee-app approval, and live MCP retrieval were not performed.

CI honesty reuse from auth PR34 `@6055b780b2dd92163a8c8b5d96c14d8e553180fe` only: replaced obsolete `Resolve preview URL` / `Smoke vs preview` with gated `Deployed validation`. Job `102279387773` on `22b76f78871098133638d061f2612c7d4a8e8f53` observed `/version` `<none>` until timeout; no blind retry of that poll. Unset `DEPLOYED_VALIDATION_URL` is a named skip, not hosted acceptance. No auth source merge, no new Worker, no Cloudflare mutation, no Stripe, no publication.

Browser artifacts: `/opt/cursor/artifacts/homepage_desktop_hero.webp`, `homepage_desktop_plans.webp`, `homepage_copy_url_success.webp`, `homepage_desktop_guides.webp`, `homepage_mobile_hero.webp`, `homepage_mobile_plans.webp`.

Fresh independent review is requested because CI/docs/scripts changed. Homepage `public/index.html` copy was not edited this pass. Bugbot `102294087760` SUCCESS on the previous head `22b76f7` is historical for this new head.
