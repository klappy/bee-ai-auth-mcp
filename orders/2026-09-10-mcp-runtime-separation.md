# Native MCP/runtime separation

Existing auth ticket: klappy/kitchen rail/3-pass/2026-08-13-bee-relay-cf-access/.
Authority: MCP-RUNTIME-SEPARATION-AMENDMENT-2026-09-10.md at kitchen 38c5b6fd, blob fc49848068644b2febd0335a15d7f16379d6e601; independent design PASS recorded cd692f5a.

Base: main a2a3a9fa84b5c24f000a1040f3dea3ba0261d3ec. Cook source/tests/debrief only; expeditor handles independent review, checks and main staging. No provider/runtime/quota activation or production mutation.

Move existing staging runtime checks to expensive tools in every quota mode. Preserve authentication, admission, quota invalid-configuration and nonstaging behavior. Real native workerd/SDK regression coverage must supplement mocked unit coverage. Parent retains hosted consumer retry responsibility after exact-source deployment.
