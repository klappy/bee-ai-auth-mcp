# Bee conversion policy evidence — 2026-09-10
Status: research, not an approved commercial policy. Owner reopened one-time versus resetting allowances and rejected treating 100 reads as a settled or necessarily generous amount. No feature activation, merge or deployment is authorized by this note.

| Primary evidence | Method and result | Limits for Bee |
|---|---|---|
| [Yoganarasimhan, Barzegary and Pani, Design and Evaluation of Personalized Free Trials](https://arxiv.org/pdf/2006.13420) | Randomized 337,724 users at one leading software-suite firm into 7/14/30-day trials, December2015–January2016; tracked two years. Full-sample subscription rates15.36%/14.96%/14.67%. Seven days was best uniform policy. Paper's5.59% relative uplift is held-out policy evaluation versus30days, not percentage points. | Causal duration comparison within one established, near-monopoly product. It does not compare freemium, resetting quotas or one-time credits and cannot set Bee's allowance. |
| [ChartMogul, ProductLed and Growth Unhinged, 2026 SaaS Conversion Report](https://chartmogul.com/reports/saas-conversion-report/) | January2026 observational survey of200software products; Typeform via email/Slack/social. Respondents estimated signup and six-month conversion. Reported funnel: freemium9% visitor→signup and5.5% signup→paid; trials4.5% and8%. Illustrated1000visitor funnel yields about5versus3.6paid customers. Reverse-trial differences were not statistically significant. | Self-selection, self-report and different businesses prevent causal attribution. Higher signup→paid alone can conceal a smaller entry funnel. No daily/monthly quota-reset comparison. |

Independent researcher: existing reviewer, resumed for research and not source author. No direct randomized comparison of one-time credits and resetting free allowances was established.

## Implication, explicitly an inference
Generous initial discovery plus recurring free access for light users is a candidate that fits the owner's stated product goal. It is not a proven conversion optimum. Choose enough usage to reach repeated valuable outcomes; API pages are not equivalent to user questions or value. Evaluate retained activated users, paying customers per signup and contribution after service cost together, rather than maximizing upgrade percentage by making free use unpleasant.

No exact credit amount, reset interval, countdown promise or paid terms are selected here. Root is researching comparable AI products and Bee-specific criteria separately. Instrumentation and account/atomic accounting primitives can support later policy; do not merge a one-time lifecycle merely because partial code exists.

## Preserved implementation
Source cook froze7files on main15d4. Branch [wip/verified-quota-research-hold-20260910](https://github.com/klappy/bee-ai-auth-mcp/tree/wip/verified-quota-research-hold-20260910), commit6b9ed3936c03f603937ea6b57eea5d08592fc837, all seven files read back exactly. Typecheck and existing198tests/2skips passed; no quota acceptance tests were added and no independent source review occurred. WIP is not merge/deploy ready. No PR created, no main change, no provider change.

## Comparable products: packaging examples, not conversion experiments
Official pages retrieved 2026-09-10. These establish what vendors offer, not why it converts or whether their economics match Bee.

| Product | Observed mechanism | Bee implication |
|---|---|---|
| [Otter](https://otter.ai/pricing) | Free Basic includes 300 monthly transcription minutes; file imports separately have a three-lifetime limit. | A closely related personal-information product combines renewable core use with a separate limited feature. Minutes measure a customer-understandable input; the number cannot be copied into Bee calls. |
| [Lovable](https://lovable.dev/pricing) | Free daily grant of five build credits capped at 30/month. Daily grants expire without rollover; paid capacity is available. | Shows the wait-for-reset or buy-capacity mechanism. A daily constraint can also block an occasional user's single busy day; not automatically appropriate for Bee. |
| [Notion](https://www.notion.com/pricing) | Free workspace includes limited trials of AI capabilities. | A limited AI trial can sit beside ongoing free utility. For Bee, exhausting all retrieval would remove its central utility, a materially different product experience. |

## Recommendation for owner review — not activated
Use a recurring free allowance plus a generous initial discovery grant as the first candidate. Prefer a monthly pool initially over a small daily gate, because a light user's usage may arrive in bursts. Show the real renewal date and let people choose to wait or purchase more capacity once paid terms and checkout are approved. Give notice before exhaustion; preserve login, connection, usage visibility and their own data access controls. No manufactured deadline, automatic charge, account lockout or OAuth failure at quota exhaustion.

Start the discovery period, if time-limited, at the first successful Bee retrieval rather than signup or an unfinished approval step. Compare that against a discovery grant with no short expiry; no evidence here selects a specific duration. A one-time-only pool eventually charges even someone who uses Bee rarely, contradicting the owner's stated light-users-free goal.

100 raw reads is not justified. One useful question can cause several tool calls or paginated reads; a successful response is not itself proof of user value. Commercial metering must have an explicit, explainable unit. Do not pretend the MCP server can reliably identify a completed user question without validated client correlation. Keep raw attempt/resource accounting separate from the customer allowance.

## Concrete calibration and experiment proposal
1. Before enforcing a commercial quota, define representative valuable tasks (recall one conversation, retrieve a weekly summary, follow up an earlier commitment). Measure calls, pages and resource cost per completed task in approved testing, without recording private content. Existing aggregate counters can inform distribution; collecting new production analytics requires its own reviewed privacy and release scope.
2. Set candidate free capacity to cover occasional use plus bursts, and discovery capacity to support multiple successful sessions. Use observed usage distributions and cost envelopes to turn that target into a number. Do not substitute a new arbitrary number for 100.
3. Once stable hosted acceptance, owner policy approval and authorized release exist, compare recurring allowance alone with the same allowance plus a discovery grant. Hold pricing and core experience constant; assign at account level. At a small user count, collect qualitative task feedback rather than claim an underpowered A/B test proves conversion uplift.
4. Primary measures: successful activation, return use across several weeks, retained paying customers per signup/visitor and service cost per retained account. Secondary: exhaustion before first useful result, abandonment at the limit, waits followed by return, upgrade uptake and cancellations. Select a policy on retained value and sustainable cost, not signup-to-paid percentage alone.
5. Reset interval is a second experiment after allowance sizing. Compare monthly pooling with shorter resets only if actual usage shows a reason; don't vary grant size, interval and pricing together and then attribute the result to the clock.

Commercial gates still open: unit, amount, initial-grant duration, reset interval and paid terms. Existing infrastructure test window and $5 allowance are unrelated to customer quota renewal and are not extended by this research.
