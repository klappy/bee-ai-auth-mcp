# Native MCP/runtime separation — source debrief

## Cause and bounded repair

Base main a2a3a9fa84b5c24f000a1040f3dea3ba0261d3ec gated every authenticated MCP request on the staging runtime when commercial quota was disabled. The actual deployment has quota disabled and an expired runtime. Local `bee_docs` and protocol requests therefore received HTTP 503 before MCP dispatch. The host's reported -32603 is an observed consumer failure; its mapping from this HTTP response is an inference, not a captured host trace.

The same existing runtime check now runs only in `whoami` and `bee_read`, independently of the quota flag. Authorization, admission/epoch validation, invalid enabled-quota configuration, quota accounting and nonstaging behavior remain unchanged. Local authenticated reference and protocol operations neither start a Container nor reserve a runtime attempt. This does not open signup eligibility, activate quota, extend a test window or authorize production.

## Native evidence and reproducibility

`npm ci`, `npm run typecheck`, `npm test`. The normal test suite invokes `scripts/test-native-mcp.cjs`; no separate local service, credentials or manually installed package is required. It uses the existing locked esbuild and Miniflare/workerd supplied with Wrangler, with deployment-equivalent bundler conditions.

The test fixture imports the actual staging and self-host Worker entries, actual OAuth provider and actual agents/MCP SDK. It creates synthetic encrypted grants through the maintained provider helper, exchanges actual S256 PKCE authorization codes through `/token`, and sends the resulting synthetic bearer to the actual `/mcp` entry. It does not mock MCP dispatch. Storage, admission/runtime RPC and the Bee network boundary are synthetic. It does not test email delivery, real Bee data, a live Container or actual ChatGPT behavior.

18 scenarios each send initialize, initialized notification, ping, tool list, empty-argument bee_docs, whoami and bee_read (126 requests):

| Scenario | Expected result |
| --- | --- |
| Quota absent/enabled, runtime closed | Protocol/docs succeed; expensive tools return MCP isError; zero Bee-boundary calls |
| Quota absent/enabled, runtime open | Protocol/docs succeed; two synthetic expensive reads; only two runtime reservations |
| Invalid enabled quota, runtime open/closed | Admission fails closed with 403; no runtime or Bee call |
| Missing/invalid OAuth bearer | 401 before MCP; no runtime or Bee call |
| Denied admission, stale epoch, missing Bee custody | 403 before MCP; no runtime or Bee call |
| Self-host runtime toggle false/true | Existing nonstaging behavior remains; synthetic reads succeed without staging reservations |

Before repair, the initial actual-handler native diagnostic returned 503 for initialize/list/docs with quota absent/runtime closed and 200 for the open equivalent. The final native Worker/OAuth regression harness run against unchanged baseline source reproduced the first closed initialize 503. With the narrow repair, all 18 native scenarios passed. A legacy unit assertion expecting a blanket 503 was corrected to expect protocol dispatch; it explicitly delegates real expensive-tool coverage to the new native test.

## Learning and remaining acceptance

Configuration matrices must include the shipped default-disabled state. Mocking the dispatcher tests handler boundaries, not native MCP acceptance. Protocol/reference availability must not depend on a commercial feature flag or paid runtime allowance.

Cook completion is source evidence only. Fresh independent source review, exact-head CI/Bugbot, main staging deployment/readback and root retry of the same native consumer tool remain expeditor gates. No claim of hosted recovery is made here. Backout remains a reviewed source revert; never enable costly runtime merely to restore docs.
