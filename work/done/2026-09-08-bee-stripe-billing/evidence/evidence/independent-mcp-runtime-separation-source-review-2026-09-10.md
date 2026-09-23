# Independent native MCP runtime separation source review

Disposition: PASS — exact source/native synthetic regression only.
PR60 head54c845b615ef58e715e4eca4964f86f42f5e4f70, basea2a3a9fa84b5c24f000a1040f3dea3ba0261d3ec.
Reviewed September10,12:45–12:46 EDT; independent reviewer, no source authoring.

All seven cargo files fetched at immutable head and byte-compared to clean snapshot bee-runtime-repair-EIRtPy: exact matches. No dependencies, provider config or unrelated source changes. Three guard changes remove broad handler runtime denial and make existing whoami/bee_read guards independent of product quota. Auth/admission/epoch/custody checks remain before native dispatch.

Independently ran TypeScript and complete standard test suite: exit0,228 passed/two existing live-smoke skips (26 files passed/one skipped). Separately ran scripts/test-native-mcp.cjs:18 scenarios passed, seven MCP requests each. Native fixture imports real staging/self-host entries, maintained OAuth helper/token exchange, actual agents/MCP SDK and Miniflare/workerd. It does not mock MCP dispatch. Admission/runtime/quota/storage and upstream Bee boundary are synthetic; grants/codes/tokens are synthetic and never printed.

Independently reran the same native harness with only mcp-api.ts supplied from immutable basea2a3 source through an in-memory esbuild review override; no file edits. Baseline failed exactly at quota-absent/runtime-closed initialize:503 versus expected200. Restoring reviewed source passes native matrix. This establishes the local transport failure mechanism, not the host's proprietary -32603 mapping.

Coverage observed: initialized notification, initialize, ping, tools/list and empty bee_docs; quota absent/enabled with runtime open/closed; invalid quota config denied; missing/invalid bearer denied; denied/stale/missing-Bee custody denied; expensive tools closed as MCP isError with zero synthetic Bee-boundary calls; open modes permit two synthetic expensive reads; nonstaging preserves behavior. Existing monthly/OAuth regressions remain in full suite.

Precision: runtimeChecks and bridgeCalls are observed fixture counters; realNetworkCalls:0 in the script's summary is a constant declaration, not an independently instrumented network counter. Code inspection confirms selected Bee boundary is stubbed; do not present this field alone as a network audit. Workerd emits synthetic invalid-token diagnostics during negative tests, not actual credential material.

No blocking findings. Required exact-head CI/Bugbot, actual staging build/module/configreadback, then root retry of the same actual native bee_docs tool remain. No actual consumer recovery, real Bee retrieval, runtime extension, quota activation, production release or meal closure claimed.
