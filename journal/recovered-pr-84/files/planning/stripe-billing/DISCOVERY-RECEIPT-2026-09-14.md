# Stripe discovery receipt — 2026-09-14

Part 1 of the fired bee-stripe-billing dish (kitchen ticket `rail/2-cooking/2026-09-08-bee-stripe-billing-planning/TICKET.md`, read at `18ad6aa`). Observed through the Stripe MCP connector exposed to the cook seat on 2026-09-14 (15:21–15:30Z). Every line below is an observation from a tool call; nothing is inferred from memory. No credentials appear here; account and object ids are public identifiers.

## What was observed

| Question | Observation | Evidence |
|---|---|---|
| Account | One account exposed: `acct_1TXgpSFoAXHbwUEB` ("Klappy.dev") | `list_available_accounts_or_orgs` |
| Mode | Connector session is **live mode only**. Every call with `livemode:false` returned a tool-execution error (req `req_011Cf3ZREMhQA5M4BetGUvpf`, `req_011Cf3ZSa8cJuSmDgts2STks`); the same reads with `livemode:true` succeeded | `stripe_api_read GetPrices` ×2 |
| Existing catalog (live) | One product/price, unrelated to Bee: `prod_V4ALLSRT4FMS12` "AI Services - Spoken Worldwide", one-time, custom amount (`price_1U420QFoAXHbwUEBkpGT0mU8`). **No Bee product, no $5/month, no $24/year price exists.** | `GetPrices` (live, `has_more:false`) |
| Webhook endpoints (live) | **None** (`data: []`) | `GetWebhookEndpoints` |
| Read permission | Proven (prices, webhook endpoints, account list) | above |
| Write permission | **Unverified.** No write was attempted. `stripe_api_write` is exposed and routes mutations through a human-approval URL; whether the connector grant permits writes is unknown until a write is tried | tool schema |
| Account retrieve | `GetAccount` is not an exposed operation in this connector (spec `2026-08-26.preview`); account identity is by name/id from the listing only | `stripe_api_search` |

## Planner output (attached)

`stripe_implementation_planner` guide `iguide_61VOzfWFw6K7t2zSJ41FoAXHbwUEB`, status **accepted**, use case `optimize_subscriptions`. Choices walked (each an owner decision already made, or the Stripe default where the ticket is silent):

- Surface: web, redirect OK → **Stripe-hosted Checkout** (`checkout_type: hosted`), no Managed Payments.
- Pricing: **flat rate** (no seats, no tiers) — matches $5/month, $24/year.
- Billing model: **freemium** (free 700/week, no card on file, upgrade later) — matches the served allowance.
- Lifecycle: customer self-manages → **Customer Portal** (cancel at period end is Stripe's recommended behavior; matches "lapse without confiscating the current period").
- Revenue recovery: **Smart Retries + automated emails** (Dashboard config, no code).
- Sales-led / invoicing trees: not applicable.
- Tax: walked as "no current obligations → free threshold monitoring". **This is an owner decision the plan does not settle** (see below).

Doc links the guide points at: Stripe-hosted Checkout for subscriptions (`docs.stripe.com/billing/subscriptions/build-subscriptions?payment-ui=checkout&ui=stripe-hosted`), flat-rate pricing, Customer Portal (API), revenue recovery, Stripe Tax threshold monitoring.

## What this receipt does not claim

- It does not claim test-mode readiness. Test mode is unreachable through this connector session; the ticket's boundary ("test mode until the owner says live") therefore cannot be met by Stripe-side operations from this seat as exposed.
- It does not claim write permission.
- It does not create or propose any product, price, webhook, or customer.

## Gates surfaced for the door (not re-asking decided things)

1. **Test-mode reach.** Parts 3–6 need test-mode products/prices/webhook secret before a real test-mode purchase. Options: (a) owner re-scopes the connector session to include a sandbox/test context; (b) owner creates the two test-mode prices and the webhook endpoint in the Dashboard and hands the seat their ids + sets `STRIPE_WEBHOOK_SECRET` by `wrangler secret put`. Either is HUMAN-ONLY (secret).
2. **Tax posture.** Threshold monitoring vs. collection is a public-terms/owner call; not settled here.
3. **Write permission** is proven only by attempting a write, which will present an approval URL. First candidate write (test mode) is the two prices.

Parts 2 (entitlement model in the quota DO) needs none of the above and is Stripe-independent.
