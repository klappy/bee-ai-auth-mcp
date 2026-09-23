# Bee scattered-work reconciliation — 2026-09-09

Owner: Astra, coordinated through local Auggie. Requested by Klappy during execution continuation. This is an inventory and disposition receipt, not a new meal or a completion verdict.

## Coverage and source boundary

GitHub inventory observed starting 2026-09-09T04:29:55.654Z (00:29:55 EDT). Kitchen: 187 branches, 116 issue/PR entries across complete pages; main recursive tree untruncated at 869b5491ae6151d583b6b37a0dfdf9fb2c3e5f96. Product: 24 branches, 47 PRs, 5 standalone issues, empty next pages; main 85f3b58b276e781f93f903472db2304d8b7296eb. All surfaces inventoried; detailed content review scoped to Bee/onboarding, related deployment work, and queued Stripe. No blanket review of unrelated kitchen dishes is claimed.

## Product cargo

| Surface | Observed head | Disposition |
| --- | --- | --- |
| [PR34](https://github.com/klappy/bee-ai-auth-mcp/pull/34) | ea68e53edb8e684c779b89fcbbf5c9496b7200b5 | Active email/real CLI implementation; 21 ahead, 3 behind main. Preserve. Hosted acceptance outstanding. |
| [PR50](https://github.com/klappy/bee-ai-auth-mcp/pull/50) | 3308cb9dd9b23ffc27431fe9c97c20d4f2f44d50 | Homepage local browser evidence complete; 22 ahead, 0 behind main. Preserve source7776706427c3c4e25db84c5ebeb46b451093d033 and evidence; publication held. |
| [PR39](https://github.com/klappy/bee-ai-auth-mcp/pull/39), [issue37](https://github.com/klappy/bee-ai-auth-mcp/issues/37) | aa8489e82dc28671f11f59a72c2a90e1cb6ac888 | Stranded release-documentation correction. Production-branch fact useful; unavailable preview claim stale. Reconcile against newer34/50, do not merge unchanged. |
| [PR43](https://github.com/klappy/bee-ai-auth-mcp/pull/43) | 81f8fe667bc2a91c6ae068ffef59e53e85fc1d6f | Real unfinished machine-door implementation for separate bee-catch-light-it dish. Preserve, no duplicate cook or custody blending. Closed44/45 superseded. |
| [PR52](https://github.com/klappy/bee-ai-auth-mcp/pull/52) | 506a0715a15c9be72f4ea63e68e250edec38830e | Three coordination-document commits; historical receiver evidence, superseded operationally by local takeover. Not release cargo. |
| [Orphan topology plan](https://github.com/klappy/bee-ai-auth-mcp/blob/1f1a05ae62b4416064870cfdb414591d6f3fb581/planning/multi-environment-topology.md) | 1f1a05ae62b4416064870cfdb414591d6f3fb581 | One commit, 27 behind, no PR. Unratified June planning; not authority for more environments. |
| [PR47](https://github.com/klappy/bee-ai-auth-mcp/pull/47) | 86d76d40300dd18405308de9fa5b560f3fc9b3ce | Separate Claude automation wiring requiring secret setup; unnecessary for local cooking. Preserve separately. |

PR34 and PR50 overlap eight files. Live-check workflow and deployed-version script/test are byte-identical. Five differ: ci.yml, README.md, docs/ci-cd.md, docs/connecting-and-getting-your-bee-token.md, public/setup.html. Separate green checks do not prove a combined release. Auggie is to use the same local source cook for an unpushed reconciliation candidate after the frozen isolated-source review; preserve homepage evidence and do not repeat browser tests without a concrete integration change requiring them.

PR43 order records empty-version false success, unavailable preview, exact subject pin, and hosted deny gaps. Exact-head OIDC gate99897645874 and preview resolution99897784268 fail; unit check passes. [PR45 comment5495563728](https://github.com/klappy/bee-ai-auth-mcp/pull/45#issuecomment-5495563728) explicitly records a prior CoS missing existing43 because branches were not listed. This inventory prevents repeating that duplicate implementation.

Other open maintenance: PR25/29 units pass but preview resolution fails; PR27/49 units fail (27 Builds also fails). Exclude absent an actual onboarding dependency. Older bridge/pairing/phase1/phase2/allowlist heads are ancestors of main. Pager36/41 were merged and promoted through38/42 despite ancestry divergence. Historical June contracts were consolidated through1/2; do not reapply them.

No Stripe-named product branch, PR, or issue in the complete inventory. Planning remains kitchen-owned.

## Kitchen cargo

Eight Bee-named branches observed. Four are wholly behind main: allowlist-widen, relay-6b-plan, relay-phase-2, bee-catch-secret-check. They contain no unique ahead commits.

- dish/2026-08-13-bee-relay-cf-access at b52f4550769c8659eb864072f0063c911d447a41 has two ahead commits: old PLAN.md in 2-cooking and four journal rows. Its delete-GitHub design is superseded by current both-doors amendment. Preserve historical provenance; not current approval or fire evidence.
- [Kitchen PR19](https://github.com/klappy/kitchen/pull/19), head31b5a1b451cc0c2df108eb8d90081c6edc897a0b, contains refinery mass-home ticket and journal absent on main. Only Taste B was served; A/C/D not served and explicit no-merge remains. Adjacent work, not onboarding.
- [Kitchen PR36](https://github.com/klappy/kitchen/pull/36), head5a40ff140899a3d47a526f9962482eed209d40b9, is an unmerged OIDC tasting ticket with explicit no-merge. Relate to ordered bee-catch-light-it and product43; do not silently activate old taste.
- cursor/bee-catch-light-it at9b02b0db67d944d80ff3df1813a92da151fdfe06 contains an unmerged headings correction after mergedPR44. Current main ordered ticket still has the earlier combined failure/response heading. Preserve this candidate for that dish's owner recut.
- Kitchen PR44 and45 are merged ticket/amendment records, not proof of runtime execution. Their comments and PR19/36 comments are empty.
- Ordered raw-over-summary and transcript-retention tickets have explicit Sept8 reorientation holds for missing current failure/response/checklist gates. No product absence or supersession inferred.

Auth rail remains 3-pass with current amendments, pending/review/checkpoint, and historical shim. No FIRE-CHECK-RUN filename on current main; recovered old plan is not such a receipt. Homepage 3-pass already includes fire, final review, debrief and browser-related receipts. Stripe stays 1-ordered. No lane movement or branch deletion performed.

## Execution consequences

Local cooking continues through Auggie/Otto. Current source preparation uses exactPR34 without pushing to product: observed production Builds selectors cover every branch. New isolated image-only build candidate and isolated version/deployment API are under fresh review against settled user authority. No provider mutation or hosted acceptance is inferred from this inventory.

Recorded outcomes remain separate: source, local evidence, provider acceptance, hosted acceptance, production release, and learning closure. Public copy and production promotion are later human gates, not reasons to stop authorized isolated preparation.
