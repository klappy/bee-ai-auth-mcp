# Probe unit isolation debrief

September 11, 2026, America/New_York. [Order](../orders/2026-09-11-probe-unit-isolation.md); accepted kitchen amendment commit8376c76f, blob3ef9aa35. Existing Bee auth ticket; bounded staging build repair.

Provider build33d1d503 failed before deployment:248 passing tests,1 failing,2 skipped. The missing-image unit test exceeded its default5second deadline after consulting ambient Docker. Exact unchanged test/script passed on a no-Docker local seat. A synthetic docker info delay of6seconds reproduced the exact line23 timeout, establishing the environment dependency without attributing an unobserved provider daemon cause.

Unit cases now use temporary PATH fixtures for Docker/sudo while invoking the unchanged real shell script. Exact unavailable/missing exit2 messages and command sequences prove no Container run. Child execution has a2second deadline and timeout rethrows as failure; global Vitest timeout is unchanged. The actual probe script and test:image command remain unchanged for real image acceptance.

TypeScript clean. All3 focused tests pass normally and with the six-second ambient Docker fixture present; the isolated tests finish in15ms and13ms respectively. Full CI, independent exact-head review and Bugbot remain required, followed by an actual successful staging build/deployment. These fixture tests do not prove real image behavior.

Learning: unit exit-semantics tests should control external command dependencies. A real Docker health probe belongs to explicit image acceptance, not an incidental dependency on every source deployment.
