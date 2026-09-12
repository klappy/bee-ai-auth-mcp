# Recovery provenance — September 10, 2026

PR #53 consolidates hosted onboarding implementation and replaces the old deployment convention. This inventory preserves earlier evidence by immutable commit links; historical acceptance claims do not establish current hosted acceptance.

| Earlier PR | Integration disposition |
|---|---|
| #34 email and hosted CLI | Access verification, CLI broker, Container source and tests carried; pending approval and isolated deployment configuration supersede the initial upfront email restriction and production-preview coupling. |
| #50 hosted homepage | Homepage, CSS, security, roadmap and under-the-hood assets carried exactly at the containment snapshot; setup page combined. Local browser evidence remains applicable to unchanged homepage source, not proof of hosted signup or production publication. |
| #39 deployment documentation | README, RESUME and deployment contract supersede the older branch instructions with feature → main staging → separately approved production PR. |

The following eleven paths were absent from the integration tree at source `4c31ab774217ecadf4bff25c6163014a4bc34479`. Their contents remain durable in the linked source commits. They are historical evidence/order records, not active deployment instructions; no raw history is copied into the current implementation.

| Source | Preserved record | Scope |
|---|---|---|
| #34 | [docs/ci-validation-debrief.md](https://github.com/klappy/bee-ai-auth-mcp/blob/ea68e53edb8e684c779b89fcbbf5c9496b7200b5/docs/ci-validation-debrief.md) | Historical review/debrief; newer staging evidence controls acceptance. |
| #34 | [docs/email-route-debrief.md](https://github.com/klappy/bee-ai-auth-mcp/blob/ea68e53edb8e684c779b89fcbbf5c9496b7200b5/docs/email-route-debrief.md) | Historical review/debrief; newer staging evidence controls acceptance. |
| #34 | [docs/hosted-cli-architecture-finding-2026-09-08.md](https://github.com/klappy/bee-ai-auth-mcp/blob/ea68e53edb8e684c779b89fcbbf5c9496b7200b5/docs/hosted-cli-architecture-finding-2026-09-08.md) | Historical review/debrief; newer staging evidence controls acceptance. |
| #34 | [docs/isolation-review-2026-09-08.md](https://github.com/klappy/bee-ai-auth-mcp/blob/ea68e53edb8e684c779b89fcbbf5c9496b7200b5/docs/isolation-review-2026-09-08.md) | Historical review/debrief; newer staging evidence controls acceptance. |
| #34 | [docs/meal-debrief-2026-09-08.md](https://github.com/klappy/bee-ai-auth-mcp/blob/ea68e53edb8e684c779b89fcbbf5c9496b7200b5/docs/meal-debrief-2026-09-08.md) | Historical review/debrief; newer staging evidence controls acceptance. |
| #34 | [docs/private-email-config-debrief.md](https://github.com/klappy/bee-ai-auth-mcp/blob/ea68e53edb8e684c779b89fcbbf5c9496b7200b5/docs/private-email-config-debrief.md) | Historical review/debrief; newer staging evidence controls acceptance. |
| #34 | [orders/2026-08-13-bee-relay-cf-access.md](https://github.com/klappy/bee-ai-auth-mcp/blob/ea68e53edb8e684c779b89fcbbf5c9496b7200b5/orders/2026-08-13-bee-relay-cf-access.md) | Historical order; current meal/ticket controls execution. |
| #50 | [DEBRIEF.md](https://github.com/klappy/bee-ai-auth-mcp/blob/3308cb9dd9b23ffc27431fe9c97c20d4f2f44d50/DEBRIEF.md) | Historical review/debrief; newer staging evidence controls acceptance. |
| #50 | [docs/hosted-onboarding-independent-review.md](https://github.com/klappy/bee-ai-auth-mcp/blob/3308cb9dd9b23ffc27431fe9c97c20d4f2f44d50/docs/hosted-onboarding-independent-review.md) | Historical review/debrief; newer staging evidence controls acceptance. |
| #50 | [docs/hosted-onboarding-review.md](https://github.com/klappy/bee-ai-auth-mcp/blob/3308cb9dd9b23ffc27431fe9c97c20d4f2f44d50/docs/hosted-onboarding-review.md) | Historical review/debrief; newer staging evidence controls acceptance. |
| #50 | [orders/2026-09-08-bee-hosted-homepage.md](https://github.com/klappy/bee-ai-auth-mcp/blob/3308cb9dd9b23ffc27431fe9c97c20d4f2f44d50/orders/2026-09-08-bee-hosted-homepage.md) | Historical order; current meal/ticket controls execution. |

Earlier topology amendments remain available at [PR #39's immutable source](https://github.com/klappy/bee-ai-auth-mcp/tree/aa8489e82dc28671f11f59a72c2a90e1cb6ac888). The former active RESUME is preserved at [the pre-integration main source](https://github.com/klappy/bee-ai-auth-mcp/blob/85f3b58b276e781f93f903472db2304d8b7296eb/RESUME.md); its June self-host observations and residuals are historical, not today's hosted-service status.

The source consolidation does not close the onboarding meal. Current hosted acceptance, outstanding user-grant checks, production-release approval and rail state remain in the [meal checkpoint](https://github.com/klappy/kitchen/blob/main/rail/meals/2026-09-08-bee-stripe-billing/EXECUTION-CHECKPOINT.md). Superseding an earlier PR preserves its intent and provenance; it is not a claim that every prior blob was copied unchanged.
