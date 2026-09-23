# Independent MCP runtime separation design review

Disposition: PASS — narrow design only.
Contract blobfc49848068644b2febd0335a15d7f16379d6e601, MCP-RUNTIME-SEPARATION-AMENDMENT-2026-09-10.md v1.0.0.

No blocking design findings. Removing the unconditional expired-runtime barrier from authenticated local reference/protocol operations while keeping runtime checks at expensive tool execution is the correct bounded separation. It must work with quota absent as well as enabled, without using feature activation as a workaround.

Preserve authentication/admission/epoch/own-grant gates. Invalid self-service configuration remains fail-closed; the test matrix must not interpret local docs availability as permission to bypass invalid admission policy. Nonstaging runtimeAllowed semantics stay intact.

Native SDK/Worker synthetic reproduction is required before correction. Actual native dispatch with valid synthetic OAuth, protocol initialization/tool-list/ping/docs and expensive-tool denial replaces the previously mocked dispatch evidence gap. The user's -32603 error is still a consumer observation, not proof of cause; exact source behavior predicts a503 candidate to reproduce.

No dependency, provider config, runtime expansion, log enabling, private identity/grant extraction or real Bee operation is authorized. Source acceptance, CI/Bugbot, deployed readback and same-native-tool consumer retry remain distinct gates.
