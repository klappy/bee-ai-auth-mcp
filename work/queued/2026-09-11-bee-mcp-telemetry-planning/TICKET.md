# TICKET — Bee MCP telemetry reporting for a future update

**What this is:** Plan a callable Bee MCP telemetry tool so Chris can inspect his production usage, including busy days and weeks.
**Why now:** Production already implements telemetry, but this host exposes only bee_docs, bee_read and whoami; quota discussion has no verified production-use baseline.
**Your move:** Nothing now; this is queued for a future Bee update.

Class: entrée. Risk: ALLERGY.
Station: subagent.
Owner: Auggie (coordination); Otto (infrastructure/security consultation); independent reviewer separate from author.
Promise: Not started; Auggie must establish a bounded clock budget on future selection, before any worker fire. No delivery time promised by this order.
Depends: none.
Scheduling: QUEUE ONLY, NOT FIRED. Select after the current owner-account production-parity release; this ticket is not a prerequisite of that release.
Related meal: 2026-09-08-bee-stripe-billing (context only; this future update does not expand current meal completion).

Outcome served:
- Chris can ask Bee MCP for actual own-account production daily/weekly use and receive grounded aggregate counts without Cloudflare dashboard work.
Learning signal:
- Busy-day and busy-week successful-read totals can inform quota choices; report use saves manual troubleshooting and distinguishes measured usage from guesses.

Ingredients:
- Owner request September11: “Let's create a ticket for that in a future bee update.”
- journal/2026-09-11-bee-promotion-status.tsv, k0005–k0009: quota discussion, failed SQL reads and exact host tool inventory.
- klappy/bee-ai-auth-mcp production src/telemetry.ts blob aaf37a5a4c0f639dc9d78d287ca18af4adf044ca and wrangler.jsonc blob68a9d9027b5993d2b0e058e0121479b211e82aa6: BEE_TELEMETRY → bee_telemetry, tool/status/time/size, opaque HMAC login partition. Source/config proof is not historical persistence proof.
- Same product main docs/telemetry-governance.md blob2c57d2b697d5cef891304c7d8559a22fec34425d and src/telemetry.ts blob4eb888c67b3477ac3cb0f67fba94368225d6413f: staging owner aggregate path differs from legacy production; no implicit flag copying.
- Existing auth PENDING.md production-owner-observation follow-on and meal evidence/bee-production-ship-envelope-2026-09-11.md: continuation material, not a second assignment. This ticket owns planning that follow-on.
- Observed September11 SQL GET SELECT1 returned connector INVALID_ARGUMENT / Cloudflare API error:200; earlier POST has same recorded failure. Native production bee_docs observed_usage returned reference text. Failures do not establish absent data.
- House repo inventory found bee-ai-auth-mcp, cartographer, oddkit. Bee existing collection/report code inspected. Cartographer server/src/telemetry.ts blob1550a554d99883ad8cd2498097ba513e49639d3f and live telemetry tool metadata show registration-wrapper collection plus an actual report tool, exact/sampled distinctions. Oddkit live tools telemetry_public/telemetry_policy are public telemetry precedents, not authority to publish private Bee usage.
- Duplicate search: complete kitchen tree has no Bee telemetry-specific ticket; product issues all-state telemetry search returned only umbrella #51. Existing PENDING follow-on is promoted into this planning order, not duplicated.
- Allergen: authenticated usage attribution and private telemetry; no secret values or raw Bee content may enter plans, responses, journals or tests. Refresh sources at selection.

Declared product (planning only):
1. klappy/bee-ai-auth-mcp docs/planning/mcp-telemetry.md — reviewed contract, exact tool name/schema, access model, data source, query bounds, reporting units, rollout/rollback and required tests.
2. This ticket folder DELTA.md — driver-seat revisions and rejected alternatives.
3. This ticket folder CHALLENGE.md and REVIEW.md — post-lens challenge and independent findings/dispositions.
4. This ticket folder BUILD-ORDERS.md — fully specified bounded subsequent build tickets and their artifact paths/gates; create real build orders only from the accepted plan.
5. This ticket folder VERDICT.md and DEBRIEF.md — accepted planning disposition and project-learning return pointers.

Done-means:
- Chris can read the proposed tool contract and observe how to request his own last30days of daily successful-read counts, busiest days and weekly totals with explicit period/timezone semantics.
- A reviewer can trace every reported metric to existing telemetry slots and observe sampling weights, retention/coverage, failures, empty periods and unavailable reporting distinguished from zero.
- A security reviewer can follow authenticated owner-to-partition resolution and observe a bounded read-only design that exposes no secrets, raw content or another user's identifiable usage.
- A planner can compare existing Bee, Cartographer and Oddkit mechanisms and observe a six-row borrow evaluation without rebuilding collection by default.
- A future builder can read BUILD-ORDERS.md and observe exact implementation, native MCP discovery/invocation, provider reconciliation, authorization-denial, regression and release acceptance cases for each bounded dish.
- Auggie can read the plan and observe independent findings closed or explicitly held, approval boundaries, delivery owners, rollback and a return path to this ticket without making it a current release blocker.

## Planning boundaries and gates
Deliver a plan, not code or provider changes. Specify own-account report first; no arbitrary caller-supplied identity or SQL access. A privileged all-account report is outside this order. Candidate tool should be discoverable as telemetry reporting; exact naming is resolved in the plan against server/host conventions.
Prefer existing production history. Resolve trusted tenant attribution without extracting GITHUB_CLIENT_SECRET. If history is sampled/lossy or inaccessible, define truthful report limitations and a bounded repair; never invent counts or label all traffic as Chris.
Require explicit daily timezone boundaries (America/New_York use case, DST tests) and weekly definitions. Count returned successful Bee reads/pages separately from docs, whoami and failures. Reports must not generate Bee reads or distort usage totals; establish what inspection itself records.
Run LIFECYCLE lens then challenge, 6B, independent privacy/source/consumer review and applicable FIRE-CHECK on later execution. This order does not run those gates. ALLERGY planning cargo remains draft until accepted. No quota amount/reset, paid activation, new telemetry collection, credential disclosure, runtime window or production deploy is approved.
Return: Auggie records planning disposition beside this ticket, links accepted product plan and future build orders, and reports through CoS. Relevant learning lands in the product authoritative docs/cookbook and is linked by debrief.

## Failure Modes — What Breaks When Reporting Is Mistaken for Collection
- F1: New instrumentation replaces existing history unnecessarily.
- F2: Host-wide or wrong-user aggregates are labeled as Chris's usage.
- F3: Adapter failure, retention gaps or sampled rows are displayed as exact zero/counts.
- F4: Tool exists in code but cannot be discovered or invoked in the real MCP client.
- F5: Future telemetry work delays owner-parity shipment or silently activates commercial policy.

## Required Response When Detected
- F1: Reuse existing dataset first; document the exact proven gap before proposing additional collection.
- F2: Fail closed on attribution; require trusted identity binding and independent denial evidence.
- F3: Return unavailable/coverage/sample metadata, weighted aggregation where applicable, and validated reconciliation.
- F4: Keep consumer gate pending until real tools/list and invocation receipts exist; document host compatibility without false availability.
- F5: Restore this queue-only boundary; preserve current release instruction and return scope drift to Auggie.
