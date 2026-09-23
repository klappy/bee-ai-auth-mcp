# Independent OAuth negotiation design review

Disposition: PASS — design only.
Reviewer: independent reviewer under Auggie monthly finish, separate from author.
Contract: OAUTH-NEGOTIATION-AMENDMENT-2026-09-10.md v1.0.0, blob209e105caa1884746d0a6499671b605f93c889e3, kitchen25ba47938dde8a64207881e0739876930bba2185.

No blocking design findings. The proposed change borrows the upstream provider negotiation correction and pins0.10.3, limits adapter changes to demonstrated migration needs, preserves existing grants and auth paths, and requires a separate PR from frozen monthly work.

The synthetic0.7.2 failure mechanism is distinct from an observed ChatGPT payload or screenshot diagnosis. Invalid-code probes establish authentication negotiation only; acceptance also requires actual valid PKCE/token/refresh flows and negative cases.

Exact-source review will check advertised issuer-response support against successful/error authorization redirects, resource enforcement, legacy/default grant preservation, unauthenticated MCP401 resource challenge and registration-management advertisements against available handlers. These are concrete applications of the contract's compatibility/metadata requirements, not permission for new auth features.

No CIMD enablement, discovery claims unsupported by handlers, resource expansion, real-client capture, provider mutation, runtime extension, quota activation, billing or production release is authorized. Source acceptance, required checks, deployed-source readback and hosted consumer acceptance remain separate gates.
