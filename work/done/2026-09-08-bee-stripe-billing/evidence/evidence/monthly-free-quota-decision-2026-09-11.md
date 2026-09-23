# Monthly free allowance — decision preparation, September 11, 2026

Status: PROPOSAL ONLY. Prepared at 17:41 EDT from current Git for Auggie's existing Bee auth continuation. No allowance activation, policy amendment, provider mutation, Stripe fire or public-copy change is performed by this record.

## One proposed decision

**Start with 1,000 successful Bee reads per verified email account per calendar month, renewed at 00:00 UTC on the first, with no daily cap or rollover. Treat this as a provisional launch hypothesis, then adjust future months using actual usage.**

This is a judgment-based starting amount, not a research-derived optimum or a measured definition of generosity. A 30-day arithmetic equivalent is about 33 successful reads per day, but users may spend the whole pool in a burst. At an illustrative five reads per useful task it permits 200 tasks; at twenty reads it permits 50. Those are sensitivity examples, not observed Bee task costs. There is no evidence yet that this amount separates Klappy's heavy use from occasional use.

The existing research explicitly rejects replacing arbitrary 100 with another unsupported number. Accordingly, this note does not present 1,000 as calibrated or approved: it makes the unresolved tradeoff concrete for a reversible owner decision. If owner approval is withheld, the amount stays unset; independent release preparation continues.

## What counts, from actual source

At inspected deployed main [2993b9c1](https://github.com/klappy/bee-ai-auth-mcp/tree/2993b9c158a9214736253d375060d91df1deaf31):

- Each successful `bee_read` invocation consumes one read after upstream `result.ok` and successful quota settlement. Each separately requested returned page counts once. Repeating the same successful request counts again; accounting is not content deduplication.
- Failed upstream reads refund their reservation; runtime/quota blocks do not consume a successful read. Uncertain settlement releases no data.
- Auth, setup, documentation, tool listing, pings, `whoami` credential checks and allowance inspection are outside commercial read metering. A successful `bee_read({path:"/v1/me"})` does count because it uses the metered tool, unlike `whoami`.
- A read is not a user question, conversation or completed task. Search and paginated workflows can consume several reads.
- The existing verified-email account owns quota across clients/grants. Legacy GitHub-only identities are not silently converted to email quota accounts. This proposal does not change that compatibility boundary.

Source: [quota.ts](https://github.com/klappy/bee-ai-auth-mcp/blob/2993b9c158a9214736253d375060d91df1deaf31/src/quota.ts), blob172dca684395dab4bdcb359a59cb5f9a27b85ee1; [mcp-api.ts](https://github.com/klappy/bee-ai-auth-mcp/blob/2993b9c158a9214736253d375060d91df1deaf31/src/mcp-api.ts), bloba5ba5caf8a104e972455092db5fa7fe6cdcea42f.

## Reset, exhaustion and reversibility

The [monthly contract](../../../3-pass/2026-08-13-bee-relay-cf-access/SELF-SERVICE-QUOTA-AMENDMENT-2026-09-10.md), blob6d3d3441405ba41095f1d4b40e503d4ff1efaca2, already chooses UTC calendar months. Return the exact ISO renewal time; a human interface can display its local equivalent. Do not promise a midnight New York reset or thirty days after signup. New account periods receive the full configured pool, including late-month enrollment; there is no prorating.

An existing account's current-period limit and usage remain snapshotted. An amount or version configuration change applies when its next period is created; it does not erase current usage, confiscate remaining allowance or add a second current-month grant. Reads crossing renewal settle against their original month. Reinstall, reapproval or toggling flags must not reset usage.

At exhaustion, preserve the saved connection and show renewal plus usage inspection. Paid signup is not yet open; do not imply a working checkout. Disabling self-service is technically available but restores manual eligibility for pending accounts, so it can interrupt newly self-served users. Prefer adjusting the next month's amount over emergency disabling for ordinary commercial tuning.

Switching to trials, rollover or referral credits is not merely changing this number: those require their own contract, source and acceptance. Referral blocks can follow later without selecting any reward amount here. Settled Standard prices remain $5/month and $24/year; this note does not set paid capacity.

## Evidence and next learning

[Existing conversion research](CONVERSION-POLICY-RESEARCH-2026-09-10.md), blob3b16e9e7e2f8957f07c2fc8f39525d26b945ca07, supports monthly pooling as a fit with the owner's light-users-free goal, not as a proven conversion optimum. Its trial experiment, observational SaaS survey and comparable packaging do not determine a Bee read amount.

[Actual telemetry receipt](owner-usage-pr65-provider-receipt-2026-09-11.json), blobd0bd3c4655b15aa8b43d886634fc4841de8e67dc, proves one docs count and zero successful reads at 21:09:56Z, with report inspection uncounted. It supplies no heavy-use baseline. [Telemetry source](https://github.com/klappy/bee-ai-auth-mcp/blob/2993b9c158a9214736253d375060d91df1deaf31/src/telemetry.ts), blobf3c7fb2540d9dd74df151c3e50450fc680efab1d, classifies `read_success` only after the metered handler returns actual success; persistence is best-effort and owner-staging-only, not the quota ledger.

Use actual days of owner read totals and burst patterns when authorized runtime is available. Do not extrapolate a full month from one test or claim one extreme user represents free users. Review exhaustion before useful outcomes, return use and service cost before changing future allowances. This proposal creates no monitoring schedule, new analytics collection or runtime window.

## Bounded debrief

Recovered the prior research and monthly contract rather than reopening the commercial strategy. Confirmed the actual metered unit and reset mechanics against immutable source; separated instrument verification from calibration. Delivered one reviewable provisional number with explicit evidence limits. No implementation, activation, rail move or commercial approval is claimed. Coordinator owns checkpoint and journal continuity.

## Owner decision — September 12, 2026 (captain, via CoS door)

Ruled verbatim: **"Weekly of 700 which is equivalent to 100 a day. Unlimited for the upgrade prices."**

Reading, as recorded by the door (not a reinterpretation):
- Free allowance: 700 successful Bee reads per verified-email account per week; the owner's stated equivalence is 100 per day.
- Paid upgrade (Standard, Stripe — still 1-ordered, not built): unlimited reads.
- The 1,000/month proposal above is superseded by this ruling.

Constraint observed at deployed main 207acfc1df6bbd8b5581ccf2aba3caf31ccceceb: `src/quota.ts` `quotaMonth()` keys periods by UTC calendar month and the accepted SELF-SERVICE-QUOTA-AMENDMENT-2026-09-10 chose UTC months. Weekly renewal is a source and contract change, not a manifest value. The door has not converted 700/week into a monthly figure on its own authority; the cadence-versus-timing choice is returned to the captain in the same turn. No provider mutation or manifest change follows from this record.
