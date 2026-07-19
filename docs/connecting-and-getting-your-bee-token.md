---
title: "Connecting bee-ai-auth-mcp — How a User Gets Their Bee Token"
kind: docs
audience: public
status: working
date: 2026-06-15
observed_server_time: "2026-06-16T04:08Z"
tags: ["bee-ai-auth-mcp", "onboarding", "connect-flow", "bee-token", "app-pairing", "finding"]
relates_to: "odd/ledger/2026-06-15-bridge-deployed-container-env-fix-validation-pending.md (E0018)"
---

# Connecting bee-ai-auth-mcp — How a User Gets Their Bee Token

> This is the connect-flow runbook the consent screen links to. The consent
> screen itself now offers a relay-native pairing CTA (device-aware: a
> tap-to-approve deep link on a phone, a QR on desktop, both with a copyable
> connect URL for manual entry — see the README's "Connecting" section) — no
> CLI needed for that path. This doc records the **verified** manual/CLI
> fallback way to obtain a Bee token, where that token lives, how to hand it
> to the relay by pasting it, and the finding that explains why that fallback
> was, for a time, the only path. Validation status is at the bottom — read it
> before treating anything here as "done."

## The two legs (recap)

- **You ↔ relay:** GitHub OAuth, identity gate only. Authenticates you to *this*
  relay and checks the `ALLOWED_GITHUB_LOGIN` allow-list. The GitHub token is
  read once for your login, then discarded.
- **Relay ↔ Bee:** your **Bee bearer token**, captured at the consent step and
  bound into your own encrypted OAuth grant props. There is no shared Bee secret.

This doc is about the second leg: getting that Bee token in the first place.

## Getting your Bee token (manual/CLI fallback path)

The consent screen's own pairing CTA (tap-to-approve deep link or QR, per
device) needs no separate token — approve in the Bee app and the relay
receives it directly. The steps below are the manual fallback: obtaining a
Bee token by hand via the Bee CLI, which needs a computer with Node.

1. **Bee iOS app → Developer Mode.** Open the Bee app, go to Settings, and tap
   the app **Version 5 times** to unlock Developer Mode. (Bee's own guide:
   https://docs.bee.computer/docs/developer-mode)
2. **Install and run the CLI** on a computer with Node:
   ```
   npm i -g @beeai/cli
   bee login --qr
   ```
   `bee login --qr` prints an authentication link of the form
   `https://bee.computer/connect#<requestId>` and a QR. Approve it in your Bee
   app (the app's Developer-Mode scanner reads the QR, or open the link).
3. **Print the token.** The CLI stores it in the OS keychain first, with a
   plaintext file fallback. To read it:
   - **macOS Keychain (verified working 2026-06-15):**
     ```
     security find-generic-password -s bee-cli -a token:prod -w
     ```
   - **File fallback** (used when no keychain, or when forced with
     `BEE_FORCE_FILE_STORE=1`):
     ```
     cat ~/.bee/token-prod
     ```
4. **Paste it into the relay** at the consent screen and choose Authorize. The
   relay validates it against Bee `GET /v1/me` (through the private-CA bridge)
   before binding it into your encrypted grant.

### Token hygiene
The token is a long-lived Bee bearer. Treat it like a password: do not paste it
into chats, issues, or logs. If it is ever exposed, **rotate it**: disconnect at
the relay to delete the relay's copy, then re-pair / rotate in the Bee app.
Inside the relay it is held only in your encrypted grant props — never shown to
the AI client, never logged, never serialized into an error.

## How the pairing grant actually works (verified from source + live)

Read from `github.com/bee-computer/bee-cli` (`sources/commands/login/index.ts`,
`sources/commands/auth/appPairingRequest.ts`, `sources/utils/appPairingCrypto.ts`)
and confirmed against the live endpoint:

- **Initiate:** `POST https://auth.beeai-services.com/apps/pairing/request` with
  `{ app_id, publicKey }`. **No client secret.** This host is public-CA —
  *different from* the private-CA `/v1/*` data API, so this leg needs **no bridge**.
- **Approve:** the caller renders `https://bee.computer/connect#<requestId>` as a
  QR; the Bee app (Developer Mode) scans it to authorize.
- **Receive:** the caller polls the same endpoint with `{ app_id, publicKey }`;
  on completion it returns an `encryptedToken` — the bearer encrypted (tweetnacl
  `box`, X25519) to the caller's public key, openable only with the caller's
  secret key. Packed as `version(1) ‖ nonce(24) ‖ ephemeralPubKey(32) ‖ ciphertext`.
- **Storage:** keychain service `bee-cli`, account `token:prod`; file
  `~/.bee/token-prod` (mode 0600) as fallback.

## The finding: why the laptop-free one-tap flow wasn't built at first

The dream was for **the relay itself** to be the pairing caller: the consent page
shows the QR, you approve in the Bee app, the relay polls + decrypts + binds —
no computer, no CLI. The protocol carries no secret, and the decrypt is pure JS
(Worker-friendly), so this was genuinely buildable **except for one gate**:

- **`app_id` must be a Bee-registered app.** Proven by probe (2026-06-15):
  - made-up `app_id` → `{"ok":false,"error":"app_not_found"}` (HTTP 404)
  - the CLI's registered `app_id` → `{"ok":true,"status":"pending",...}` (HTTP 200)

So a relay that *reimplements* the pairing cannot invent its own `app_id`. **Scope:** this gate applies **only** to that no-CLI relay-native variant — the CLI-assisted paste path above needs no `app_id` from us, and for single-tenant (operator-only) use the question is moot; it matters only for a public / multi-tenant relay. Three paths:
- **Clean:** obtain our own `app_id` from Bee (or self-serve app registration).
  This sharpens the standing Tier-0 petition from "please add OAuth" to "you
  already ship an app-pairing device grant — please register an `app_id` for
  this relay."
- **Demo-only:** reuse the CLI's public `app_id`. Works, but it impersonates the
  official CLI's identity, the in-app consent would name the CLI (not this
  relay), and it is fragile / ToS-risky. Fine to prove the flow end-to-end in
  private; **not** the blessed path for a public MIT relay.
- **CLI broker:** run the actual Bee CLI server-side as a one-shot to broker the
  handshake — laptop-free for the user, uses the CLI's *genuine* `app_id` (no
  registration, not a reimplementation, so not the impersonation problem).
  Caveat: the in-app consent still names the CLI, not this relay — acceptable
  single-tenant, not for a public relay. Far narrower than the per-user
  data-plane container rejected in D0022 (a transient auth handshake, not an
  always-on MCP).

**Shipped:** the relay-native flow now built on the consent screen took the
**Demo-only** path above — it reuses the CLI's own `app_id` (`src/pairing.ts`),
which for a personal self-host is an accepted trade-off; the Bee app names the
approval "Bee CLI" as a result (called out on the consent screen and in the
README). The **Clean** (relay-registered `app_id`) path remains the gate for
any public/multi-tenant deployment.

## Validation status (honest)

- **Verified (2026-06-16):** the token-acquisition flow above (source-read + live
  probe + an operator run); the keychain retrieval command; the `app_id`
  registration gate; **and the relay end-to-end wire proof — `whoami` returns the
  operator's Bee identity through the bridge, green and validated on mobile from a
  fresh context.** The dead-host 502 was a wrong `BEE_UPSTREAM`/`BEE_SNI`
  (`api.bee.computer`, which does not resolve); fixed to the real host
  `app-api-developer.ce.bee.amazon.dev` (from `bee status`).
- **Remaining (formal DoD):** a three-pass re-run, a demonstrated second-login
  denial, and a no-token-in-logs audit.
- **Built:** the *laptop-free* relay-native pairing CTA on the consent screen (device-aware: tap-to-approve deep link on mobile, QR on desktop, both with a copyable connect URL) — it reuses the CLI's `app_id` (the Demo-only path above), which is why the Bee app names the approval "Bee CLI". A relay-registered `app_id` (the Clean path) remains unbuilt and is gated for any public/multi-tenant deployment. CLI-broker variant unevaluated. The CLI-assisted paste path (above) remains the manual fallback and needs no `app_id`.
