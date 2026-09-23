# Design delta — one Bee service, not a pile of tickets

Recorded 2026-09-08T20:02:13-04:00. Author: Astra, coordination/planning seat.
Scope: meal integration and authority/return design only; no product architecture revision or implementation.
Method read and applied: `klappy://canon/methods/driver-seat-lens`, source blob `b625371515ac9bee7c0d6c687af9d3ae99103c55`. Its verbatim prompt was applied to the existing meal, all three ticket contracts, the precedent charter and this proposed coordination design set. This is an author-side lens receipt, not an independent validation result.

## Whole-system picture

The next coordinator starts with one meal, sees two release milestones, recovers actual ticket/PR state, and advances one owned unmet acceptance criterion without asking Klappy to reconstruct context. Login and the homepage enable the first usable journey. Billing remains queued and later extends that journey with verified payment-to-access. Each layer keeps its own gates and source home; the meal supplies the joins, authority and stopping conditions.

## Changes made through the lens

| Before | Revision | Why it changes the operator/agent experience |
|---|---|---|
| Billing-only meal with login/homepage mentioned as external prerequisites | Expand existing MEAL in place and link all three existing tickets by stable ID | One resume point; no duplicate parent or lost prior work |
| Named owners without a meal-level delegation contract | Charter with Auggie delivery, Otto technical/security, Astra oversight, bounded cooks and separate reviewer/expeditor | A receiver can tell what it may decide and what evidence it must return |
| Queue-only and prior continue-until-complete instructions could be conflated | Preserve active auth/homepage scope and explicitly keep Stripe queued | Avoid unauthorized billing activity and avoid stalling independent homepage work |
| A plan/PR/upload could look like the end of the meal | Distinct onboarding and billing milestones; behavioral completion criteria; gated learning closure | Partial completion is useful but cannot masquerade as the finished service |
| Old checkpoint stopped at dfa1689e; Stripe tool note said unavailable | Fresh PR-head snapshot and schema-exposure correction, with other claims explicitly unverified | The next seat does not repeat a solved tool-discovery problem or trust stale test results |
| Attention spent relaying micro-orders and rereading history | Short read order, one-cycle delivery recipe, actual acceptance and consolidated return contract | Git carries context; Klappy remains the decision owner, not the courier |

## Alternatives considered and rejected

- **A new competing hosted-service meal or renaming the existing ID now:** unnecessary relocation and ambiguous parentage; retain the existing ID and give it the correct human-facing title.
- **One implementation ticket/PR for auth, homepage, Stripe and second brain:** different approvals, release risks and dependencies; retain bounded dishes and park unbuilt future services outside completion scope.
- **Automatic Stripe fire on plugin installation or meal assembly:** contradicts the explicit queue instruction. Tool discovery is evidence, not commercial approval.
- **Treat every uncertainty as a new captain question:** retrieve settled rulings and let the right delegate resolve ordinary reversible choices; reserve one-at-a-time owner decisions for real gates.
- **Invent a watcher, receiver ACK, deadline or independent review:** no mechanism/receipt exists for those claims in this assembly.

## Order-shape check and remaining gates

Current main `cookbook/tickets/` directory was fetched. Its TEMPLATE 1.2.0, CHECKLIST 1.4.1, LIFECYCLE 1.1.0 and FIRE-CHECK 1.3.0 blob SHAs match the full source texts already read in this conversation. Existing billing CHECKLIST remains the ticket's ordering receipt; this assembly does not claim a new FIRE verdict.

Author-side coordination check: goal and six observable completion statements present; all three dish IDs resolve to fetched tickets; dependency direction preserved; existing billing queue and allergy boundaries preserved; exact product/rail homes and return paths named; role assignment distinct from acceptance; failure modes have responses. The two linkage supplements do not change product scope or reset promises.

Post-lens challenge: **not run** — discovery returned no Oddkit schema. Independent review of this new coordination packet: **not run** — no reviewer was launched. GitHub source fallback is not an Oddkit verdict. Missing new receipts are explicit and do not invalidate old accepted dish plans or authorize any new fire. Obtain applicable fresh gates before binding a new/materially revised implementation plan.

## Three-loop debrief of the coordination correction

1. **Mistake:** earlier orders and PR comments advanced pieces without one charter covering the whole user journey. This assembly supplies that contract.
2. **Producing system:** local ticket/PR progress obscured the cross-dish outcome, scope boundaries and next owner. The meal now carries those joins and one checkpoint; product knowledge stays with the product.
3. **Learning machinery:** Klappy had to catch the missing meal structure. During this meal's final debrief, test whether a new seat can resume without another captain reconstruction; return evidence to the product cookbook and propose any shared ordering-practice change through review. No general rule was silently changed and no automated enforcement is claimed.
