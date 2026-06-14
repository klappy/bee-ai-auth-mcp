# Challenge Result + Device Recommendation — Omi vs Bee, Build vs Adopt

**Date:** 2026-06-14
**Mode:** Planning (oddkit challenge, `block_until_addressed` calibrated false)
**Triggered by:** operator request to challenge the plan + asking what other device to adopt
**Companion:** `2026-06-14-bee-mcp-planning-6b.md` (build premise now contested by this record)

---

## The challenge: should bee-mcp Product A be built at all?

Claim under pressure: *"The next step is to build bee-mcp Product A — a hosted remote MCP relay wrapping Bee's `/v1/*`."*

**Verdict: the build premise does not survive — for the operator's own need.** The field shipped the thing while we were planning to build it.

**Omi (BasedHardware) already ships the exact Product A, off the shelf:** a **hosted** remote MCP at `https://api.omi.me/v1/mcp/sse` (in-app `omi_mcp_` key), which per Claude's custom-connector model reaches **claude.ai across web + iOS + Cowork with no laptop** — the precise all-surface constraint that drove the whole plan. And it clears every axis the operator named: **open-source** (HW+SW), **e2e-encrypted** (client-side; server can't read), **self-hostable**, **clip/pendant** form factor, **~$129** (the $89 widely cited in early-2026 coverage was the pre-order price), **no mandatory subscription**.

This is a clean 6B **Bide → inspected-and-adopted** signal. Reframe: **don't build the wire — adopt Omi's.** Point the saved effort at **Product B (the Refinery)**, which no device provides.

Reversibility check (why adopt beats build): adopting Omi's MCP is a connector toggle — forward-low, backward-low. Building bee-mcp is sunk effort — backward-medium. The cheaper-to-reverse path wins the first move.

---

## Device recommendation

### Omi — for both you and your friends

| | Detail |
|---|---|
| Price | **~$129** live (early-2026 pre-order was $89); no mandatory subscription. Confirm the SKU — audio pendant/clip vs Dev Kit 2 necklace vs Omi Glass (~$299) |
| Open source | Hardware **and** software |
| Privacy | End-to-end encrypted (client-side); **self-hostable** backend |
| Form factor | Pendant / **clip** / sticker |
| Integration | **Hosted MCP** (`api.omi.me/v1/mcp/sse`) + local Docker option; SDKs; plugin ecosystem; 300K+ users |

**One device, two postures** — which is why it covers both your asks:
- **You:** self-host the backend → maximum privacy, no big-tech custody.
- **Friends recreating your flows:** hosted-MCP path → paste the in-app key, connect, done. Zero setup, no build, and portable because it's open-source (won't get bricked by an acquisition).

### Why not the others (on *your* criteria)
- **Limitless** — $499–599, **Meta-entangled**, cloud, subscription; its Rewind desktop capture was cut off Dec 19 2025. Polished hardware, but the opposite of cheap-entry and privacy-forward. A cautionary acquisition tale.
- **Stay on Bee** — Amazon-owned since July 2025; privacy is now "trust Amazon" (the Ring-footage precedent looms); wristband-primary; $49.99 + $19/mo; and its MCP is **local-only** — the exact gap that started this.
- **Mori (try.mori.to, by franky Inc.)** — *verified, but the wrong tool.* A polished "Journaling AI": clip/watchband/necklace (✓ form factor), strong hardware (24h+ battery, triple mics, 50h on-device, VAD), decent privacy *claims* (on-device encryption, audio deleted post-transcription, SOC 2 Type I in progress) — but **not open-source, not self-hostable, ships July 2026 (pre-launch), and has no MCP / Claude connector / API anywhere.** It's a **closed journaling app**, a destination — not an open wire into Claude. Same gap as Bee, nicer wrapper. Its auto-journal/insights/reflection features actually overlap *your Product B (the Refinery)* — locked in someone else's garden, which is a reason to build B open, not to adopt Mori. ~$299 Early Bird + subscription. Reconsider only as a *capture source* behind the device-agnostic Refinery **if** it ships a hosted MCP/API later.

**Field note:** the wearables space is consolidating into big tech (Bee → Amazon, Limitless → Meta). The independent open-source device is both the **privacy** play and the **longevity** play.

---

## The one thing to verify before committing (a few minutes, or ~$129 to just try it)
Confirm Omi's hosted MCP registers cleanly as a **claude.ai custom connector** on web + iOS — that claude.ai accepts its key-based auth without needing the local `mcp-remote` proxy. Omi documents it for Claude Desktop / Cursor / **Poke** (Poke is cloud/mobile — a good sign), but the claude.ai-web path specifically is unconfirmed. This check **gates whether Product A is retired or revived.** Cost to find out: a few minutes, or ~$129 if you just buy the device and try.

## What this does to the plan
- **Product A (the wire):** demoted from "next build" to "adopt Omi's" — pending the verify check. The MIT bee-mcp prior-art share still has value *for the Bee community / if you stay on Bee*, just not as your own next step.
- **Product B (the Refinery):** unchanged and now clearly the real build — and it should be built **device-agnostic** (sits on Omi's MCP now, any pendant later). Decoupling the moat from the wire is better architecture than coupling it to Bee ever was.
- **The gauntlet:** correctly *staged*, not run. The publish-gauntlet is the pre-publish ritual for public writing; it fires on the community-share writeup, behind the sanitization gate, and completes with your editorial pass. Running its full battery now would be the "partial battery" failure the canon names. The **challenge** was the right tool for this moment, and it ran.

## Revised next steps
1. **Verify** Omi's hosted MCP as a claude.ai custom connector (cheap, decisive).
2. If it holds: **adopt** Omi, retire bee-mcp Product A, and **re-aim planning at Product B (device-agnostic Refinery).**
3. Sanitization pass still gates any public share of prior art.

---

## Parallel build tracks (operator: "build in parallel — we don't wait")

Four tracks, de-conflicted; none blocks another.

| Track | What | Runs on | Blocked by |
|---|---|---|---|
| **A — Adopt the wire** | Buy Omi (~$129); verify its hosted MCP as a claude.ai custom connector (web + iOS) | Shipping time + a 5-min check | nothing |
| **B — Refinery (the moat)** | Design + build the device-agnostic encode/cross-reference/governance layer | **Starts now** | nothing — device-agnostic by design |
| **C — Tier 0 petition** | RFC for OAuth + short-lived minted tokens — now **field-wide** (Omi's hosted MCP also uses a pasted key, so the ask applies to it too) | Anytime | nothing |
| **D — Publish prior art** | Sanitize → share the bee-mcp landscape + use cases | Sanitization can start now | publish gated on sanitization + author pass + gauntlet |

**Track B is the real "don't wait."** Because the Refinery sits on *any* pendant's MCP, it does not wait on the Omi verify-check or on hardware arriving.

### Product B — orientation result
`oddkit_orient` places the Refinery in **planning mode at LOW confidence** and flags its one-line definition as an *unverified assumption*. Honest read: **B is exploration-stage, not plan-ready.** Its first slice is a Diamond-1 exploration — *what must the Refinery actually be, grounded in real capture, once retrieval is already solved?* — before any 6B or planning gate. "Don't wait" means start that exploration now; it does **not** mean smuggling a planning 6B onto an ungrounded product. (The Omi challenge is the fresh proof that the cheap upstream pass is what stops us building the wrong thing.)
