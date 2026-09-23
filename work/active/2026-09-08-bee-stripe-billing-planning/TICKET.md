## FIRED — 2026-09-13 (captain ruling, via CoS door)

Ruling: "C" — write the Stripe order and fire it; cook in a fresh session. Supersedes "ORDERED / QUEUE ONLY, NOT FIRED" below. Moved 1-ordered → 2-cooking by the door; the cook seat that pulls it owns the promise (line 20).

Dependencies now served (receipt `rail/3-pass/2026-08-13-bee-relay-cf-access/VALIDATION-RECEIPT-2026-09-13.md`): production 1.0.0 at `bee.klappy.dev` via the githook (HYGIENE 10a); hosted email signup live; weekly allowance 700 successful reads per verified-email account per UTC week; two identities reading (owner via GitHub, Tata via verified email + QR pairing).

Owner decisions already made — do not re-ask:
- Free: 700 reads/week, Monday 00:00Z renewal, no rollover. Paid (Standard): **unlimited reads** ("Unlimited for the upgrade prices", 2026-09-12).
- Prices as approved on the hosted homepage: $5/month, $24/year. Any other number is a new owner decision.
- Exhaustion today returns an error result with `renewsAt` and no link. The upgrade link is added **in this dish**, not before (a link to nothing is worse than none).

Declared product (bounded; separate PRs, same repo, each by HYGIENE 3):
1. Stripe discovery through the exposed Stripe tools (account identity, test/live mode, write permission) recorded as a receipt before any design; planner output attached. No credentials in chat.
2. Entitlement model in the existing admission/quota DO: `plan: free|standard`, `standardUntil` from Stripe subscription state; `quotaPolicy`/`meteredRead` bypass metering while standard is current; lapse → back to weekly free without confiscating the current period. Tests for every transition.
3. Checkout: `/upgrade` (Access-verified email → Stripe Checkout session, customer keyed by verified email, success/cancel back to the relay); webhook endpoint with signature verification, idempotent, secrets by `wrangler secret put` only (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
4. `quotaError()` gains `upgradeUrl` and human-readable renewal; `bee_usage` reports plan; owner admin shows plan per account.
5. Homepage: flip "Paid signup is not open yet" only in the PR that makes it true; byte pin updated in the same PR (line 19 / homepage test).
6. Version bump + CHANGELOG in the promotion (line 19). Readback checklist from `docs/production-release.md`, plus one real test-mode purchase end to end before live mode is enabled (owner enables live — HUMAN-ONLY).

Boundaries: test mode until the owner says live; no referral credits (next experiment, unchanged); no price or plan invention; Bugbot comment-only on promotions; no direct pushes.

Boarding line for the fresh cook: `klappy/kitchens` `boarding/RECIPE.md` → `klappy/kitchen` `health-code/HYGIENE.md` (3, 10a, 19) → this ticket → `klappy/bee-ai-auth-mcp` `AGENTS.md` and `docs/production-release.md`.

## Current monthly-first and referral direction — 2026-09-10

Owner selected simple recurring monthly free allowance first and accepted referral usage credits as the next growth experiment (meal journal k0093/k0094 at f6ebfbe1). This supersedes one-time-trial selection language below, not historical price provenance. Monthly mechanism is an auth amendment, default disabled until an exact amount is approved; it does not fire Stripe.

For later referral planning: reward both inviter and invitee after verified email, own Bee connection and first successful retrieval; unique qualified referral, no self-referral/duplicate grant, fixed usage block and per-referrer monthly ceiling, base allowance spent before earned credits. Keep reward ledger separate, preserve already-earned grants if future campaign stops. No tiers, chains or leaderboards initially. Reward sizes, credit expiry, campaign resource budget and customer-facing terms remain unresolved. Redeemed usage has actual hosting/API cost; it is not cost-free merely because rewards are noncash. Evaluate retained activated users and actual redeemed-credit cost, not invitation volume.

This captures the next experiment in the existing planning queue. No referral implementation, campaign activation, Stripe operation, new budget or production release. Onboarding dependencies remain unserved; this ticket stays1-ordered.

## Historical direction
## September 10 owner direction — supersession pointer

Routine owner approval before verified Bee use is superseded by the [auth self-service allowance amendment](../../3-pass/2026-08-13-bee-relay-cf-access/SELF-SERVICE-QUOTA-AMENDMENT-2026-09-10.md). Its mechanism remains disabled pending an exact allowance decision. Historical admission/payment wording below is retained as history, not the current access rule. This does not settle trial amount/reset, paid terms, or activate Stripe. Onboarding dependencies are still unserved; this dish remains 1-ordered.

# TICKET — bee-stripe-billing-planning

**Current meal/capability supplement — 2026-09-08:** The existing parent `2026-09-08-bee-stripe-billing` now covers the whole Bee hosted-service outcome: login, homepage and this queued billing plan. Read `rail/meals/2026-09-08-bee-stripe-billing/{MEAL,DELEGATION-CHARTER,DELIVERY-LOOP,EXECUTION-CHECKPOINT}.md`. Membership, dependencies, product scope, ALLERGY gates and queue-only status are unchanged for this dish. No fire or implementation authorization is added.

Tool-exposure correction: current discovery returned ten Stripe tool schemas, including account listing, account info, implementation planner, documentation and API search/read/write. This supersedes the older no-defined-Stripe-tools observation below for exposure only. No Stripe action or account operation ran; account identity, authentication, test/live mode and write permissions remain unverified. At future selection, use the exposed account-discovery/approved-context path and planner before integration design/code; do not ask for repeated installation or credentials in chat. Installation/schema exposure is not billing readiness.

**What this is:** Prepare a reviewed plan for Stripe payments and correctly timed access to Bee Standard, then derive bounded implementation tickets from the accepted plan.
**Why now:** Klappy wants to charge for the hosted service and explicitly ordered this work into the queue rather than starting the integration now.
**Your move:** Nothing now; review the eventual plan's unresolved commercial decisions and exact customer-facing terms when it returns.

Class: entrée. Risk: ALLERGY (revenue, customer identity, secrets and public terms).
Station: subagent for later bounded planning; captain seat for commercial decisions.
Owner: Auggie, accountable service coordination; Otto consulted for infrastructure/security; Astra returns consolidated decisions. Named ownership is not an acceptance receipt.
Promise: not started — Auggie establishes the budget at future acceptance/fire; no delivery time invented by this order.
Depends: 2026-08-13-bee-relay-cf-access; 2026-09-08-bee-hosted-homepage.
Meal: 2026-09-08-bee-stripe-billing.

**Disposition: ORDERED / QUEUE ONLY, NOT FIRED.** Both dependencies were fetched under `rail/3-pass/` in this service; that is not release completion. Re-observe current lanes and outcomes before future selection. Billing is not a dependency of either existing release and must not delay them. Adding the Stripe plugin does not override queue-only.

Outcome served:
- See `rail/meals/2026-09-08-bee-stripe-billing/MEAL.md`.
Learning signal:
- Later payment-to-access tests and use demonstrate correct duration, reconciliation, isolation, operating cost and operator time saved. No measurement window or monitoring starts here.

## Ingredients — decisions, prior art and boundaries

- Captain, current conversation: “We can wire this up to Stripe and be ready to start charging for it soon.” Then “But queue that up.” Then “And order it as a ticket.” Later “Just added the stripe plugin.” Capture these in `journal/2026-09-08-bee-stripe-billing-order.tsv`; the additions are not a fire instruction.
- Approved Standard amounts are $5/month and $24/year ($2/month equivalent). Prior approved third option: $100 lifetime. Latest proposal: “$99 for 5 years seems less risky.” Evaluate the finite-term replacement and return a precise decision; do not silently convert tentative language into final pricing or create a Stripe Price. $149 lifetime was an assistant proposal, not approved. $99/60 months = $1.65/month; five $24 annual payments total $120. These are arithmetic comparisons, not cost-viability evidence.
- Free trial is intended. Duration, card requirement, conversion, renewal, cancellation, refund, tax treatment, entitlement start date and early service-discontinuation treatment remain unspecified. Recover subsequent rulings before asking. Standard may gain useful features; no unlimited future processing/storage or premium services are promised. A possible higher tier is not part of this build.
- Existing auth: `rail/3-pass/2026-08-13-bee-relay-cf-access/TICKET.md`, blob `af8861eaa3b174e1f6ceb8b5c9061286a7df0133`; follow its current amendments, CLI-BROKER-AMENDMENT-2026-09-08.md and execution checkpoint. Preserve approved-email admission, optional GitHub login, actual hosted Bee CLI pairing and each user's encrypted Bee grant. Payment does not itself approve an invitee or grant Bee access.
- Existing homepage: `rail/3-pass/2026-09-08-bee-hosted-homepage/TICKET.md`, blob `f6288e84d1f90fdb2ee65da7ff330f599c778fd3`; product PR50 was observed open/draft/unmerged at `22b76f78871098133638d061f2612c7d4a8e8f53`. Its `docs/hosted-onboarding-review.md`, blob `f4905d82409763c58900b6b3c8eeba6d81f97f61`, still carries $100 lifetime and unspecified commercial terms. That is an observed draft, not a release receipt. Earlier exact onboarding-copy approval stands for that text; new pricing/terms require their own exact review.
- House prior art: an installation repository query located `klappy/git-repo-auth-mcp`; `src/billing.ts` blob `f9a0344fb49e82d032c0196924b6981d67da5513` was read. It has webhook handling, mirrored tier state, payment-link identity references and metering. These are code observations, not runtime validation. Do not copy client-supplied identity, metered pricing, tier names, or assume finite-term expiry is already solved. Evaluate safe reuse against Bee's authenticated identities, fixed purchase options and current provider behavior. Bee `docs/implementation-handoff.md` blob `74ebc576199246f90324ac5ab59f950b14de6d93` identifies this lineage but explicitly labels itself historical.
- Duplicate search: scoped Stripe and Bee-billing searches across kitchen/product plus kitchen tree path searches found no existing Bee Stripe billing ticket before this meal was created. This is bounded search evidence, not an exhaustive corpus claim; recheck before build contracts become orders.
- Stripe capability, refreshed after the installation report: Plugin Management returned `name: stripe`, `installed: true`, `status: ENABLED`. `api_tool.list_resources(paths=["Stripe"])` returned no defined tools and a valid-namespace list without Stripe. Installation is confirmed; callable actions, account identity, authentication, test/live mode and write access are not verified. No setup reset is requested. Rediscover and prove the required least-privilege capabilities at future execution; never ask for credentials in chat or put them in tickets.

## Planning scope — cook the plan, not the billing integration

When selected later, board the product's current authoritative home, recover existing billing/account work, and inspect current official Stripe documentation and authorized account metadata. Research must yield one recommended small integration with rejected alternatives, not a menu left for Klappy to assemble.

Plan checkout and the resulting access lifecycle together: authenticated account binding independent of user-editable checkout fields; invitation approval separate from payment; verified payment events and reconciliation rather than trusting a return URL; duplicate, delayed and out-of-order events; test/live separation; expiry; failed payment; cancellation/refund/dispute treatment; optional account self-service; and safe recovery/rollback. These are requirements to resolve, not a selected architecture or claims about existing Stripe configuration.

Address existing invited users without charging or locking them out by surprise. Keep card data at the payment provider and payment identifiers apart from Bee credentials/transcripts. Evaluate current processing/hosting costs before claiming the long-term option is sustainable. No Stripe setup, test purchases, live products, prices, payment links, credential writes, deployments or customer messages occur in this planning-only dish.

## Declared product — exact homes

On a planning branch in `klappy/bee-ai-auth-mcp`, delivered as draft PR:
1. `planning/stripe-billing/PLAN.md` — chosen journey/architecture, prior-art and borrow evaluation, permissions, risks, rollback and rejected alternatives.
2. `planning/stripe-billing/COMMERCIAL-DECISIONS.md` — approved versus proposed pricing, precise unresolved decisions with recommendations, and draft customer-facing terms/copy.
3. `planning/stripe-billing/ACCEPTANCE.md` — future test-mode and live-release evidence matrix including identity isolation, replay/reconciliation, duration, failure, refund and cancellation cases.
4. `planning/stripe-billing/BUILD-CONTRACTS.md` — bounded subsequent implementation dishes with exact scope/paths, owners, dependencies, gates and return evidence; not claimable placeholders.
5. `planning/stripe-billing/DEBRIEF.md` — lessons, remaining uncertainties and outcome/cost measures to return to the product's authoritative knowledge home.

Beside this ticket, when applicable: `DELTA.md`, challenge/preflight receipts, `REVIEW.md` from a fresh independent reviewer, `VERDICT.md` for the accepted exact plan, and `FIRE-CHECK-RUN.md` only at actual fire. `CHECKLIST-RUN.md` is the ordering receipt. Append turn records to the meal's continuation journal.

## Done-means — how the returned plan can be used

- Klappy can read the commercial decision sheet and distinguish approved prices from the proposed $99 five-year replacement without reconstructing chat history.
- An implementation cook can follow the chosen plan and identify exact component ownership, private configuration needs, dependency order and release boundaries without guessing.
- A security reviewer can trace an authenticated invitee from checkout to access and observe separate checks for admission, payment and the user's Bee grant.
- A validator can execute the specified future acceptance cases and observe an expected outcome for success, expiry, duplicate/out-of-order events, failed payment, refund and cancellation.
- An operator can follow the proposed reconciliation and rollback runbook and identify how to prevent wrong-account access, recover missed events and stop new sales without losing evidence.
- Auggie can use the accepted plan and build contracts to create fully specified bounded implementation tickets, with fresh independent review evidence and no unrun gate represented as passed.

## Failure Modes — What Breaks When Billing Is Ordered Without Its Boundaries

1. Queue-only becomes an active cook or Stripe mutation.
2. Tentative five-year pricing, undefined lifetime terms or future features become a customer promise.
3. A checkout link or browser success return is mistaken for identity proof or paid-access fulfillment.
4. Existing GitAuth code is copied as production-proven or as support for a duration it has not demonstrated.
5. Current login/homepage release is blended with billing, or existing invitees are silently paywalled.
6. Installed plugin, proposed tests or old review results are reported as verified current capability.

## Required Response When Detected

1. Stop the unapproved execution; keep this order queued, state actual mutations and seek scoped approval only where needed.
2. Preserve provenance and proposed status; return the exact unresolved commercial decision before any sale or new public text.
3. Redesign account binding, payment verification and reconciliation in the plan; require negative and replay tests before implementation acceptance.
4. Re-read current source and provider docs, record borrow/bend/reject reasoning, and demand actual future test evidence.
5. Separate scopes and dependencies, retain existing access behavior, and require an explicit migration decision.
6. Record the exact tool/output or missing gate, keep credentials out of chat and journals, and withhold the unsupported claim.

## Acceptance and fire boundary

The plan must be cooked, revised through the driver's-seat lens, challenged after revision, independently reviewed, and accepted through the ALLERGY/public-terms gates before its build dishes are ordered. Fetch the live ticket lifecycle and methods at use; reading a method is not running it. No DELTA, challenge, preflight, independent review, execution promise or FIRE verdict is claimed by this queue write. Ordered is not fired; paid-access readiness is not payment-link creation.
