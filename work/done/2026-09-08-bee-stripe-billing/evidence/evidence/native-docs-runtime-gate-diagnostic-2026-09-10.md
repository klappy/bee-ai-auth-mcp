# Native docs runtime-gate diagnostic — 2026-09-10 12:33 EDT

Observed native failure reported by root after monthly deployment: bee_staging_bee_docs({}) returned JSON-RPC -32603 Internal error. No observer authenticated call or private grant read.

Provider: active62523939-98ba-4f89-bb96-c9c646d97950 is exact maina2a3a9fa84b5c24f000a1040f3dea3ba0261d3ec (prior deployment receipt). main_module validation.js; compatibility2026-06-01/nodejs_compat; BeeBridge SQLite/Container export. Quota configuration absent; runtime expired11:18:31EDT.

Public HTTP read-only diagnostics: GET/mcp and anonymous initializePOST/mcp both401. GET has correct resource_metadata challenge, no Accessinterstitial. These do NOT prove authenticated transport.

Concrete fresh-source finding: src/mcp-api.ts at exactmain blob38fcb220fd51c7e375a679b4c13c24db0ab895fa executes:
```ts
if (!quotaPolicy(env) && !(await runtimeAllowed(env))) return runtimePaused();
```
before createMcpHandler. Expensive handlers conditionally check runtime only when quota enabled.
With actual absent quota flag + expired runtime, an otherwise valid admitted grant receives application503 before initialize/docs. This is a concrete mismatch with runtime-independent reference-tool intent and a plausible explanation for native -32603; it is not proof of the exact authenticated request trace.

Bounded repair finding routed to source cook through Auggie: move runtime guard to costly tools regardless of quota activation; preserve protocol/docs/usage while closed, never solve by enablingquota or openingruntime. Verify actual SDK/native transport with synthetic grants and disabled+expired environment.

No provider mutation, no logs/tails enablement, no Container call, no browserbypass. Exposed schema has no applicable aggregate script-error endpoint; do not fetch private logs or invent authenticated success.
